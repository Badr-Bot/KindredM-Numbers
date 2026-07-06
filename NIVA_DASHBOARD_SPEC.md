# NIVA DASHBOARD — Cahier des charges complet (v1.0 · 05/07/2026)

> **Pour Claude Code.** Tu vas construire le dashboard financier NIVA : une app Next.js déployée sur Vercel, protégée par mot de passe, qui agrège 4 boutiques Shopify + Meta Ads et calcule le P&L réel au centime. Toute la logique métier ci-dessous a été validée manuellement au centime sur l'historique réel — **elle n'est pas négociable**. Le design, lui, est ton terrain de jeu (voir §9 : tu proposeras 2-3 directions avant de coder).

---

## 0. LOIS NON NÉGOCIABLES

1. **La logique métier du §4 est sacrée.** Aucun arrondi, aucune simplification, aucun « équivalent » sans validation de Badr.
2. **Les montants se calculent en centimes (integers)**, jamais en floats. Arrondi uniquement à l'affichage.
3. **Tous les jours = fuseau `Europe/Paris`.** Une commande à 23h58 CEST appartient à ce jour-là. (Les exports Shopify sont en heure locale avec offset ; l'API renvoie de l'ISO 8601 — toujours convertir vers Europe/Paris avant d'assigner un jour.)
4. **Aucun secret dans le code ni dans le repo.** Tokens uniquement en variables d'environnement Vercel. `.env*` dans `.gitignore` dès le premier commit.
5. **Chaque module de calcul a des tests unitaires**, validés contre les fixtures du §8 AVANT de construire l'UI. Si un fixture ne passe pas au centime, on s'arrête et on debug.
6. **Recalcul plutôt que patch** : quand une commande change (remboursement, édition), on recalcule les agrégats du/des jours affectés depuis les données brutes.
7. **Toujours le ROAS réel** (CA Shopify ÷ spend Meta). Jamais le ROAS rapporté par Meta.

---

## 1. OBJECTIF & PÉRIMÈTRE

Un lien unique (mobile + desktop) où Badr voit en permanence :
- **Aujourd'hui en live** : CA, spend, gain net, marge, ROAS — par marché et global.
- **Les 14 derniers jours** : 1 ligne par jour (format tableau NIVA classique).
- **Par mois** (sélecteur) et **par année** : CA, gain net, marge, ROAS, commandes.
- **Répartition des dépenses** : donut/treemap par catégorie de coût avec pondération % (voir §6.5).
- **Seuils dynamiques** : break-even ROAS et ROAS cible 20 % net, par marché, recalculés depuis les prix réels.

**Marchés (4 stores Shopify, tous en EUR)** : `ES`, `UK` (store international : GB + CA/AU/SE/IE/BE/IT…), `DE`, `FR` *(nouveau — les campagnes FR ne sont plus exclues, FR devient un marché à part entière)*.

Historique : depuis le **2026-06-04** (premier jour d'activité).

---

## 2. STACK & ARCHITECTURE

- **Next.js (App Router, TypeScript)** sur **Vercel**.
- **Supabase (Postgres)** : stockage des commandes normalisées + agrégats journaliers + spend Meta.
- **Cron Vercel à 00:05 Europe/Paris** (1×/jour — compatible plan Hobby) : clôture de la veille (re-fetch commandes de J-1 + spend Meta J-1, upsert, recalcul agrégats).
- **À l'ouverture de la page** : lecture instantanée des agrégats en base (0 appel API) + fetch **du jour en cours uniquement** (commandes depuis minuit + spend today), avec cache serveur 5-10 min et bouton « Actualiser ».
- **Backfill initial** : script one-shot qui télécharge tout l'historique des 4 stores depuis le 04/06/2026 (pagination Shopify 250/page via en-tête `Link`, respect du rate limit ~2 req/s en REST — ou GraphQL au choix).
- **Auth** : middleware Next.js basic-auth avec `DASHBOARD_PASSWORD` (env var). Tout le site derrière.
- **Graphiques** : Recharts (ou équivalent léger).
- Coût cible : **0 €/mois** (Vercel Hobby + Supabase free tier).

### Variables d'environnement
```
SHOPIFY_ES_DOMAIN=xxx.myshopify.com     SHOPIFY_ES_TOKEN=shpat_...
SHOPIFY_UK_DOMAIN=...                   SHOPIFY_UK_TOKEN=...
SHOPIFY_DE_DOMAIN=...                   SHOPIFY_DE_TOKEN=...
SHOPIFY_FR_DOMAIN=...                   SHOPIFY_FR_TOKEN=...
META_ACCESS_TOKEN=...                   META_AD_ACCOUNT_ID=919559773962419
SUPABASE_URL=...                        SUPABASE_SERVICE_KEY=...
DASHBOARD_PASSWORD=...
APP_TIMEZONE=Europe/Paris
```
Scopes requis : Shopify `read_orders` (custom app par store) · Meta : token **utilisateur système sans expiration**, permission `ads_read`.

---

## 3. MODÈLE DE DONNÉES (Supabase)

```sql
-- Commandes normalisées (source de vérité locale)
orders (
  id bigint primary key,            -- id Shopify
  store text,                       -- ES | UK | DE | FR
  order_name text,                  -- #1042
  created_at_utc timestamptz,
  day date,                         -- jour Europe/Paris
  shipping_country text,            -- ISO-2 destination
  total_cents int,                  -- total encaissé
  refunded_cents int default 0,
  line_items jsonb,                 -- [{title, sku, quantity, price_cents}]
  polo_qty int,                     -- 0/1/2/4 (déduit des line items)
  upsells jsonb,                    -- [{product_key, qty, cogs_cents}]
  cogs_product_cents int,           -- COGS polo (grille §4.2)
  cogs_upsells_cents int,
  tax_eu_cents int,                 -- 300 ou 0 (§4.4)
  updated_at_utc timestamptz
)

meta_spend (
  day date, market text, campaign_id text, campaign_name text,
  spend_cents int,
  primary key (day, campaign_id)
)

daily_aggregates (                  -- recalculé, jamais édité à la main
  day date, market text,
  orders int, ca_cents int, spend_cents int,
  cogs_cents int, tax_cents int, fees_cents int, net_cents int,
  primary key (day, market)
)

products_map (                      -- mapping titres ↔ produits (§5, phase découverte)
  store text, title_pattern text, product_key text, unit_group text
)

sync_state (store text primary key, last_orders_sync timestamptz)
```

---

## 4. LOGIQUE MÉTIER (validée au centime — ne pas modifier)

### 4.1 Classification des commandes — PAR LINE ITEMS (jamais par prix total)
- Le **polo** (« Silk Polo T-Shirt », titres localisés par store → voir phase découverte §5) : la quantité totale de lignes polo donne le bundle (1, 2 ou 4 pcs).
- **Tout autre produit = upsell**, matché contre le catalogue §4.3 par `product_key`, avec sa quantité (grilles 1/2/3 pcs).
- ⚠️ Historique : la classification par prix (<75 € = 2pcs) est l'ancienne méthode — elle reste valable sur l'historique pré-upsells mais l'app utilise **exclusivement** les line items partout.

### 4.2 COGS polo — grille DDP par PAYS DE DESTINATION (EUR)
La grille dépend du **pays de livraison** (`shipping_country`), pas du store.

| Pays | 1 pc | 2 pcs | 4 pcs |
|---|---|---|---|
| FR | 9.23 | 15.06 | 26.76 |
| IT | 9.97 | 15.91 | 27.71 |
| ES | 9.01 | 14.87 | 26.53 |
| DE | 9.36 | 15.18 | 26.49 |
| GB/UK | 8.02 | 13.30 | 23.65 |
| BE | 9.91 | 16.29 | 28.99 |

**Pays non listé** (CA, AU, SE, IE…) : `coût = max(pays listés, même bundle) + 1,50 €` *(plafond fixé par Badr — appliquer +1,50 € flat, conservateur)*.
Quantités hors grille (ex. 3 polos) : `grille[2pcs] + (grille[2pcs] − grille[1pc]) × (qty−2)` — coût marginal par pièce supplémentaire.

### 4.3 COGS upsells — coût total (produit + shipping add-on, expédié avec la commande principale), EUR

| product_key | Pays | 1 pc | 2 pcs | 3 pcs |
|---|---|---|---|---|
| SHORT_SLEEVE_DRESS_SHIRT | FR | 6.89 | 13.59 | 20.03 |
| | IT | 6.99 | 13.78 | 20.51 |
| | ES | 6.92 | 13.65 | 20.32 |
| | DE | 6.89 | 13.40 | 19.94 |
| | GB | 6.25 | 12.44 | 18.49 |
| | BE | 7.40 | 14.62 | 21.76 |
| DRESS_TROUSERS | FR | 9.84 | 19.26 | 28.73 |
| | IT | 10.00 | 19.81 | 29.56 |
| | ES | 9.89 | 19.59 | 29.23 |
| | DE | 9.67 | 19.15 | 28.57 |
| | GB | 8.84 | 17.50 | 26.42 |
| | BE | 10.72 | 21.25 | 31.71 |
| COMPRESSION_TANK_TOP | FR | 3.16 | 6.13 | 9.03 |
| | IT | 3.22 | 6.24 | 9.21 |
| | ES | 3.18 | 6.17 | 9.09 |
| | DE | 3.16 | 6.13 | 8.86 |
| | GB | 2.78 | 5.36 | 7.99 |
| | BE | 3.56 | 6.74 | 9.96 |
| CHINO_SHORTS | FR | 6.24 | 12.29 | 18.13 |
| | IT | 6.32 | 12.45 | 18.51 |
| | ES | 6.27 | 12.35 | 18.36 |
| | DE | 6.24 | 12.14 | 18.05 |
| | GB | 5.73 | 11.37 | 16.90 |
| | BE | 6.78 | 13.12 | 19.51 |
| LONG_SLEEVE_DRESS_SHIRT | FR | 6.80 | 13.24 | 19.70 |
| | IT | 6.92 | 13.65 | 20.31 |
| | ES | 6.84 | 13.48 | 20.07 |
| | DE | 6.67 | 13.16 | 19.57 |
| | GB | 6.06 | 11.93 | 17.73 |
| | BE | 7.45 | 14.72 | 21.91 |

Règles identiques au polo : pays non listé = max listé (+1,50 € plafond) ; qty > 3 : `grille[3] + (grille[3]−grille[2]) × (qty−3)`.

### 4.4 Taxe UE — 3,00 € par commande
- **Stores concernés : ES, DE, FR** (⚠️ FR = hypothèse logique « taxe européenne », **à confirmer par Badr** — flag config `EU_TAX_STORES = ['ES','DE','FR']`, modifiable en 1 ligne). **UK : exonéré** (règle explicite de Badr, au niveau du store).
- **Une seule fois par commande**, quel que soit le bundle ou les upsells.
- Applicable aux commandes **à partir du 2026-07-01 inclus**. Avant : 0.

### 4.5 Frais — 9,5 % du CA total (modèle défini le 05/07/2026)
`frais = 9,5 % × total encaissé` (upsells inclus), décomposé pour la vue « dépenses » en : **TVA 5,5 % + Shopify 3 % + Autres 1 %**.
Modèle appliqué **uniformément sur tout l'historique** (cohérence des comparaisons). Pas de fixe par commande.

### 4.6 Spend Meta — mapping campagne → marché (par nom)
```
nom contient "ESP"                          → ES
nom contient "GE"  (ex. CBO-GE-POLO-…)      → DE
nom contient "FR"  (FR-TESTING, WORLDWIDE-FR, CANADA (FR), ZOMBIE-FR…) → FR
sinon (UK, CANADA ANG, EUROPE ANG, AUS, tout ANG/worldwide anglais)     → UK
```
Toute campagne non mappable avec certitude → bucket `UNMAPPED`, affiché dans l'UI pour affectation manuelle (persistée). Spend par jour via l'API Insights (`time_increment=1`, `level=campaign`, champ spend). Compte : `act_919559773962419`.

### 4.7 Formules
```
net(jour, marché)  = CA − spend − COGS(polo+upsells) − taxeUE − frais(9,5%)
marge %            = net / CA
ROAS               = CA / spend            (spend > 0)
CM (marge contrib.) = (CA − COGS − taxe − frais) / CA       ← avant pub
ROAS break-even    = 1 / CM
ROAS cible 20 %    = 1 / (CM − 0,20)
```
**Les seuils BE/cible sont DYNAMIQUES** : calculés par marché sur les **14 derniers jours glissants** (CM blended réel, incluant mix bundles + upsells + prix du moment lus via l'API). Repères au 05/07 pour contrôle : ES ≈ 1,65 / 2,46 (2pcs à 59,99 €).
- Remboursements : soustraits du CA **le jour du remboursement** (comportement « Total sales » Shopify) ; le cron re-scanne J-1 à J-7 via `updated_at` pour attraper les refunds tardifs.

---

## 5. PHASE DÉCOUVERTE (obligatoire, avant tout calcul)

Écrire un script `scripts/discover-products.ts` qui liste les **titres de line items distincts** par store (titres localisés : FR/ES/DE/EN) avec leur fréquence, et génère un brouillon de `products_map`. **Présenter le mapping à Badr pour validation** avant le backfill. Aucun produit ne doit rester non mappé silencieusement (fail loudly).

---

## 6. VUES / PAGES

### 6.1 Aujourd'hui (accueil)
Cartes par marché (🌍 global + ES/UK/DE/FR) : CA, spend, **net**, marge, ROAS coloré (🔴 < BE · 🟡 BE→cible · 🟢 ≥ cible), commandes. Horodatage du dernier refresh + bouton « Actualiser ».

### 6.2 14 derniers jours
Le tableau NIVA classique, 1 ligne/jour : `Jour | Cmd | CA | Spend | COGS+taxe | Frais | Net | Marge% | ROAS | Cumul` — onglets Global/ES/UK/DE/FR, jour en cours marqué ⚡. Bouton « tout l'historique ».

### 6.3 Par mois
Sélecteur de mois → mêmes colonnes agrégées + graphe CA (barres) / marge (ligne) par jour du mois + total mois vs mois précédent (Δ%).

### 6.4 Par année
Tableau 1 ligne/mois + totaux annuels. « Combien j'ai fait en CA et net en 2026 » = réponse en 1 écran.

### 6.5 Répartition des dépenses ⭐ (demande explicite)
Pour la période sélectionnée (mois / année / custom) et le marché sélectionné (ou global) :
- **Donut (« macaron »)** + vue carrés (treemap) des catégories : `Spend Meta · COGS polo · COGS upsells · Taxe UE · TVA 5,5 % · Shopify 3 % · Autres 1 % · Gain net` (le net = la part restante du CA).
- Tableau à côté : € + **pondération en % du CA** pour chaque catégorie.
- Un encart « 🎯 À optimiser » : les 3 postes les plus lourds en % avec leur évolution vs période précédente.

### 6.6 Design — voir §9.

---

## 7. PLAN DE BUILD (phases avec critères d'acceptation)

1. **Scaffold** : Next.js TS + Tailwind + middleware auth + Supabase client. ✅ page protégée qui s'affiche.
2. **Découverte produits** (§5). ✅ `products_map` validé par Badr.
3. **Moteur de calcul pur** (`lib/engine.ts`) : classification, COGS, taxe, frais, agrégation. ✅ **les 4 fixtures du §8 passent au centime** (tests unitaires).
4. **Backfill** : 4 stores depuis 2026-06-04 + spend Meta depuis 2026-06-21. ✅ totaux affichés = totaux Shopify admin par store (vérification manuelle avec Badr).
5. **Cron 00:05** + refresh live du jour. ✅ J-1 clôturé automatiquement une nuit de test.
6. **UI** : propositions design (§9) → validation Badr → build des 5 vues.
7. **Déploiement Vercel** : env vars, cron config (`vercel.json`), test mobile. ✅ lien final sur téléphone.

---

## 8. FIXTURES DE VALIDATION (jours réels, modèle de frais 9,5 % uniforme)

| # | Marché · jour | Entrées | Attendu |
|---|---|---|---|
| 1 | **ES · 2026-07-04** | 8 cmd toutes 2pcs (dest. ES), CA 479,92 €, spend 184,27 € | COGS 118,96 · taxe 24,00 · frais 45,59 · **net +107,10** · ROAS 2,60 |
| 2 | **ES · 2026-07-03** | 7 cmd (6× 2pcs + 1× 4pcs), CA 449,93 €, spend 296,09 € | COGS 115,75 · taxe 21,00 · frais 42,74 · **net −25,65** |
| 3 | **UK · 2026-07-03** | 1 cmd 2pcs (dest. GB), CA 57,66 €, spend 42,18 € | COGS 13,30 · taxe 0 · frais 5,48 · **net −3,30** |
| 4 | **DE · 2026-07-01** | 4 cmd (2× 2pcs + 2× 4pcs), CA 299,96 €, spend 65,34 € | COGS 83,34 · taxe 12,00 · frais 28,50 · **net +110,78** |

*(Aucun upsell dans ces journées historiques : cas upsell à couvrir par tests unitaires synthétiques — ex. cmd ES 2pcs polo + 1 CHINO_SHORTS : COGS = 14,87 + 6,27, taxe 3,00, frais 9,5 % du total.)*

---

## 9. DESIGN — TA PARTIE CRÉATIVE

**Avant d'écrire une ligne d'UI**, propose à Badr **2-3 directions de thème « futuriste »** (description + palette + typo + un mock rapide d'une carte KPI et du tableau 14 jours). Il choisit, ensuite tu construis.

Contraintes non négociables :
- **Dark obligatoire**, mobile-first (l'usage principal = téléphone, souvent à minuit 😄).
- **Hiérarchie** : le gain net est TOUJOURS le chiffre le plus visible de chaque écran.
- **La couleur porte du sens** : 🔴 sous break-even · 🟡 entre BE et cible · 🟢 ≥ cible 20 %. Pas de couleur décorative qui entre en conflit.
- Tableaux denses lisibles au pouce ; chargement < 1 s (données servies depuis Supabase).
- Liberté totale sur le reste : glassmorphism, néon, grilles animées, monospace numérique… surprends-le, il aime les interfaces gamifiées/futuristes soignées.

---

## 10. CE QUE BADR FOURNIT (checklist)

- [ ] 4 tokens Shopify custom app `read_orders` (un par store) → env vars Vercel
- [ ] Token Meta utilisateur système sans expiration (`ads_read`) → env var
- [ ] Projet Supabase (URL + service key) → env vars
- [ ] Mot de passe dashboard → env var
- [ ] Validation du `products_map` (phase 2) et confirmation taxe UE pour FR (§4.4)
