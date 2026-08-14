# DASHBOARD.md — mémoire de référence du dashboard

**À quoi sert ce fichier.** C'est la référence STABLE du dashboard : ce que chaque
chiffre veut dire, comment il est calculé, où il est calculé dans le code, et
quels pièges le font mal lire. Il répond à la question « c'est quoi ce chiffre,
et pourquoi il fait ça ? » sans avoir à relire le code ni à re-déduire quoi que
ce soit.

Ce n'est PAS un journal. Les décisions datées, les échanges avec Badr et
l'historique des corrections restent dans **`MEMO.md`** — ce fichier-ci ne garde
que le résultat consolidé, avec un renvoi vers le MEMO quand le « pourquoi
historique » compte.

| Fichier | Rôle |
|---|---|
| **`DASHBOARD.md`** (ici) | Référence : définitions, formules, pièges, modèle de données |
| `MEMO.md` | Journal daté : décisions, demandes de Badr, corrections, chiffres mesurés |
| `STATUT.md` | Avancement / état des chantiers |
| `NIVA_DASHBOARD_SPEC.md` | Spécification d'origine (§ numérotés, cités dans le code) |
| `README.md` / `DEMARRAGE.md` | Installation, variables d'environnement, mise en route |

---

## Sommaire

1. [Les 3 questions auxquelles le dash répond](#1-les-3-questions-auxquelles-le-dash-répond)
2. [Vocabulaire et formules](#2-vocabulaire-et-formules)
3. [L'identité de la marge — le décodeur](#3-lidentité-de-la-marge--le-décodeur)
4. [Les onglets, colonne par colonne](#4-les-onglets-colonne-par-colonne)
5. [Les coûts : d'où vient chaque euro déduit](#5-les-coûts--doù-vient-chaque-euro-déduit)
6. [Seuils et protocole de décision](#6-seuils-et-protocole-de-décision)
7. [Modèle de données et synchro](#7-modèle-de-données-et-synchro)
8. [Pièges connus — la FAQ des « chiffres bizarres »](#8-pièges-connus--la-faq-des-chiffres-bizarres)
9. [Ce qui n'est pas automatisé](#9-ce-qui-nest-pas-automatisé)

---

## 1. Les 3 questions auxquelles le dash répond

1. **Est-ce que je gagne de l'argent ?** → le **Net** et la **Marge nette**.
   Tout est déduit : pub, COGS, taxe, frais Shopify, charges fixes.
2. **Est-ce que la pub tient ?** → le **MER** comparé aux seuils **BE / cible**,
   dérivés de la marge de contribution réelle (pas d'un objectif inventé).
3. **Qu'est-ce qui décroche ?** → découpage par **marché**, par **produit**
   (Gilet / Polo / Testing), par **campagne** et par **créa**.

Règle de lecture qui prime sur tout le reste : **le MER ne dit rien de la
rentabilité, la Marge ne dit rien de la pub.** Les deux se lisent ensemble, et
la section 3 explique exactement comment ils s'articulent.

---

## 2. Vocabulaire et formules

Tous les montants sont stockés en **centimes d'euro** (entiers, jamais de
flottants sur de l'argent). Les jours sont des jours calendaires
**Europe/Paris** (`lib/time.ts`), pas des fenêtres de 24 h glissantes.

### Le CA

**CA = total des commandes − remboursements** (comportement « Total sales » de
Shopify). Un remboursement est imputé au jour de la commande d'origine, pas au
jour du remboursement.

### Le Net et la Marge

```
Net    = CA − Spend − COGS − Taxe − Frais − Charges fixes
Marge  = Net ÷ CA
```

⚠️ **Deux définitions du Net cohabitent, et c'est voulu :**

| Où | Charges fixes incluses ? | Code |
|---|---|---|
| `daily_aggregates.net_cents` (base) | **Non** | `computeDailyAggregate()`, `engine.ts:649` |
| Colonne **Net** de l'onglet Mois, onglet GLOBAL | **Oui** | `fixedCostsCentsForDay()`, `subscriptions.ts:148` |

La base garde le net *opérationnel* (par marché — on ne sait pas répartir un
salaire entre l'Espagne et l'Allemagne), l'affichage GLOBAL ajoute les charges
fixes du jour. **C'est la cause n°1 des « pourquoi ce chiffre bouge »** : voir
section 3 et section 8.

### MER, ROAS, et ce qui les sépare

| Métrique | Formule | Ce qu'elle mesure | Code |
|---|---|---|---|
| **MER** | CA **TOTAL** ÷ spend | Efficacité globale de la boutique — inclut organique, direct, e-mail, récurrents | `mer()`, `engine.ts:681` |
| **ROAS Meta** | CA que **Meta s'attribue** ÷ spend | La pub vue par Meta | `roasFromAttributed()`, `engine.ts:687` |
| **ROAS UTM** | CA Shopify portant l'`utm_campaign` ÷ spend | La pub vue par les ventes réellement tracées | `roasReport.ts` |

**Invariant** : sur un même périmètre, **MER ≥ ROAS**. Même dénominateur, et le
numérateur du MER contient déjà celui du ROAS. Une inversion n'est jamais un
aléa : soit deux périmètres qui ne se recouvrent pas (bug — c'était le cas de la
carte Polo, corrigé le 14/08), soit Meta qui s'attribue plus que le CA réel
(fait, pas bug — voir 8.2).

`roasBreakEven` / `roasTarget15` gardent leur nom historique mais sont bien des
**seuils de MER**.

### Marge de contribution et seuils

```
CM (marge de contribution, avant pub) = (CA − COGS − Taxe − Frais) ÷ CA
BE (rentabilité)                      = 1 ÷ CM
Cible 15 % net                        = 1 ÷ (CM − 0,15)
```

Calculés sur **14 jours glissants**, par marché et par produit
(`computeThresholds()` dans `data.ts`, `getProductRoasThresholds()` dans
`analytics.ts`). La cible n'existe que si `CM > 15 %` — sinon aucun MER ne peut
produire 15 % de net, et le dash n'affiche pas de cible plutôt qu'un chiffre
faux. Couleurs : 🔴 sous BE · 🟡 entre BE et cible · 🟢 ≥ cible.

---

## 3. L'identité de la marge — le décodeur

C'est la formule à sortir dès qu'un jour « n'a pas de sens ». En divisant le
Net par le CA :

```
Marge = 1 − (1 ÷ MER) − (COGS + Taxe + Frais) ÷ CA − Charges fixes ÷ CA
         ╰─ la pub ─╯   ╰──── le produit ────╯      ╰─ le fixe ─╯
```

Trois leviers indépendants. **Le MER n'en pilote qu'un.** Les deux autres
peuvent bouger dans l'autre sens et l'emporter :

- **le produit** (COGS + taxe + frais) : dépend du mix panier, du pays livré, du
  nombre de pièces, du moyen de paiement (PayPal coûte ~8 % contre ~4,5 % en
  carte). Un jour à gros bundles fait monter le CA ET le COGS ;
- **le fixe** : ~147 €/jour de charges, **en euros, pas en pourcentage**. Sur un
  jour à 3 000 € de CA c'est 4,9 % ; sur un jour à 1 400 € c'est 10,3 %. Un
  petit jour est structurellement moins rentable, à MER identique.

### Exemple travaillé : 13/08 vs 14/08 (le cas réel)

| | CMD | CA | Spend | COGS | Taxe | Frais | Charges | Net | Marge | MER |
|---|---|---|---|---|---|---|---|---|---|---|
| 13/08 | 46 | 3 117 € | 1 090 € | 863 € | 120 € | 179 € | 147 € | +719 € | 23,1 % | 2,86× |
| 14/08 *(jour en cours)* | 17 | 1 433 € | 492 € | 360 € | 45 € | 76 € | 147 € | +313 € | 21,8 % | 2,91× |

Le tableau est **exact** : `3117 − 1090 − 863 − 120 − 179 − 147 = 718` et
`1433 − 492 − 360 − 45 − 76 − 147 = 313`. Décomposition de l'écart de marge :

| Poste | 13/08 | 14/08 | Écart |
|---|---|---|---|
| Pub (1 ÷ MER) | 34,97 % | 34,33 % | **+0,64 pt** (mieux) |
| COGS + taxe + frais | 37,28 % | 33,57 % | **+3,71 pt** (mieux) |
| **Charges fixes** | 4,72 % | **10,26 %** | **−5,54 pt** (pire) |
| **Marge** | 23,03 % | 21,84 % | −1,19 pt |

Le 14/08 est meilleur sur **les deux** postes variables. Il perd uniquement
parce que **les 147 € de charges d'une journée entière sont déjà comptés alors
que la journée n'a produit qu'un tiers de son CA**. À CA doublé d'ici ce soir et
à ratios identiques, la même journée sort à **27,0 % de marge**.

**Conclusion opérationnelle : ne jamais comparer la marge d'un jour en cours à
celle d'un jour clos.** Le MER, lui, est comparable à tout moment — il ne
contient aucun coût fixe. C'est exactement pour ça que les deux colonnes
existent côte à côte.

### Le même effet sans jour partiel

Sur deux jours complets, MER en hausse et marge en baisse reste possible dès que
le mix panier bouge :

| | CA | Spend | MER | COGS | COGS/CA | Marge (hors fixe) |
|---|---|---|---|---|---|---|
| Jour A | 3 000 € | 1 000 € | 3,00× | 900 € | 30,0 % | 36,7 % |
| Jour B | 3 000 € | 970 € | **3,09×** | 1 100 € | 36,7 % | **31,0 %** |

Le jour B achète son CA moins cher en pub **et** gagne moins : il a vendu plus de
bundles / plus loin. Le MER ne voit rien de tout ça.

---

## 4. Les onglets, colonne par colonne

| Onglet | Route | Ce qu'il montre |
|---|---|---|
| ⚡ **Aujourd'hui** | `/` | Live du jour : global, par marché, **cartes par produit** (Gilet / Polo / Testing), rythme comparé, seuils |
| 📅 **Mois** | `/mois` | Jour par jour du mois + cumul, tuiles CA/Net/Marge/Spend/MER/Cmd, projection fin de mois |
| 📆 **Année** | `/annee` | Mois par mois, même grammaire |
| 💸 **Dépenses** | `/depenses` | Décomposition de chaque euro dépensé (COGS polo/upsells, pub, frais, taxe, charges fixes) |
| 📊 **Analyse** | `/analyse` | Campagnes et créas Meta : spend, CTR, CPM, fréquence, ROAS, gagnantes |
| 🎬 **Créas** | `/creas` | Classement des créas sur la période choisie |
| 📧 **Klaviyo** | `/klaviyo` | Performance e-mailing |
| 🔍 **Contrôle** / **Debug** / **Admin** | `/controle`, `/debug`, `/admin` | Cohérence des agrégats, état de la synchro, mapping produits |

### Le tableau jour par jour (onglet Mois)

| Colonne | Contenu | Piège |
|---|---|---|
| **CMD** | Commandes du jour | — |
| **CA** | Net des remboursements | ≠ « gross sales » Shopify (remises déduites) |
| **SPEND** | Spend Meta du jour | Inclut le spend UNMAPPED |
| **COGS** | Produit + upsells, grilles réelles | Dépend du pays ET du nombre de pièces |
| **TAXE** | 3 €/colis UE depuis le 01/07 | 0 avant cette date, jamais rétroactif |
| **FRAIS** | Frais Shopify **réels** lus par commande | Repli 3 % sur les jours pas encore re-scannés |
| **CHARGES** | Charges fixes du jour (~147 €) | **Montant fixe** — onglet GLOBAL uniquement |
| **NET** | CA − tout le reste | Inclut les charges ici, pas en base |
| **MARGE** | Net ÷ CA | **Non comparable sur un jour en cours** |
| **MER** | CA ÷ spend | Comparable à tout moment, coloré par les seuils |
| **CUMUL** | Net cumulé depuis le début | Repart au premier jour d'activité (21/05) |

---

## 5. Les coûts : d'où vient chaque euro déduit

| Poste | Source | Constante / code |
|---|---|---|
| **COGS Polo** | Grille par pays × quantité, hors grille = extrapolation par le coût marginal 2→1 | `poloCogsCents()`, `engine.ts:119` |
| **COGS upsells** | Grille par `product_key` | `upsellCogsCents()`, `engine.ts:292` |
| **COGS NIRA** | Grille Panda Dropshipping, **en USD** (seule grille non-EUR) | `niraCogsUsdCents()`, `engine.ts:353` |
| **Pays non listé** | Max des pays connus **+ 1,50 €** — convention unique, jamais un chiffre inventé | `NON_LISTED_SURCHARGE_CENTS` |
| **Taxe UE** | **3 €/colis**, pays UE, à partir du **01/07/2026** | `EU_TAX_PER_ORDER_CENTS`, `EU_TAX_START_DATE` |
| **Frais Shopify** | **Réels**, lus dans `transactions.fees[]` par commande | `shopifyFees.ts` |
| **Repli frais** | **3 %** quand les frais réels ne sont pas encore lus | `SHOPIFY_FEES_FALLBACK_RATE` |
| **Charges fixes** | Abonnements + équipe, mensuel ÷ **30,44**, USD converti au taux figé **1,1539** | `subscriptions.ts` |
| **Packaging + carte** | 0,35 € + 0,03 € = **0,38 €/commande — DÉSACTIVÉ** (`PER_ORDER_EXTRAS_START_DATE = null`) | `engine.ts:431-446` |

**Charges fixes, ordre de grandeur** : ~157 €/jour jusqu'au 08/08, **~147 €/jour
depuis le 09/08** (résiliation de SmartSize par Badr, ~9,4 €/jour). Une
souscription porte un `startDay` et un `endDay` : rien n'est compté avant ou
après, et rien n'est rétroactif.

**Frais réels mesurés (12/08)** : carte ≈ **4,5 %** post-Shopify Advanced (3,5 %
+ 1 % de change), **PayPal ≈ 8 %** (4,99 % + 3 % de change) — le plan Advanced ne
couvre pas PayPal. Un jour à forte part PayPal a donc mécaniquement une marge
plus basse, sans que rien ne soit cassé.

---

## 6. Seuils et protocole de décision

Protocole Master, appliqué au **ROAS Meta** (`decideCampaign()`,
`roasReport.ts`) :

| Condition | Décision | Budget |
|---|---|---|
| MER/ROAS ≥ cible **et** fréquence < 2 | **SCALE** | <200 €/j : +25 % · 200-600 : +20 % · 600-1500 : +15 % · >1500 : +10 % |
| ≥ cible **mais** fréquence ≥ 2 | **HOLD** | 0 % — audience saturée : **nouvelles créas avant budget** |
| Entre BE et cible | **HOLD** | 0 % — ne rien toucher 5-7 jours |
| Sous le BE | **DESCALE** | ≥90 % du BE : −15 % · ≥80 % : −20 % · <80 % : −30 % |

La **fréquence est un veto sur le scale, jamais un motif de descale** : une
audience saturée ne se soigne pas en coupant le budget.

⚠️ Le ROAS Meta du **jour même** sous-estime (délai d'attribution, se corrige en
24-72 h). Ne jamais couper une campagne sur le chiffre du soir. Le MER, qui ne
dépend d'aucune attribution, est le garde-fou.

---

## 7. Modèle de données et synchro

### Tables (Supabase, migrations `0001` → `0013`)

| Table | Contenu |
|---|---|
| `orders` | Commande par commande : totaux, remboursements, COGS calculés, taxe, `line_items`, `landing_site` (porte l'`utm_campaign`), `customer_id`, `source_name` |
| `daily_aggregates` | Le jour agrégé par marché — **la source de vérité de l'affichage** |
| `meta_spend` | Spend par jour × campagne |
| `meta_insights` / `meta_ad_insights` | Achats et valeur attribués par Meta, par campagne / par créa |
| `products_map` | Titre Shopify → `product_key` + `unit_group` |
| `manual_revenue` | CA saisi à la main (NIRA : pas de boutique Shopify branchée) |
| `journal`, `app_state`, `campaign_overrides` | Journal d'événements, marqueurs de synchro, corrections manuelles |

### Synchro

- **Continue** : `/api/sync` déclenché par les visites du site
  (`runThrottledIncrementalSync`).
- **Clôture quotidienne** : Vercel Cron sur `/api/cron` à **00:05 Europe/Paris**,
  filet de sécurité si personne n'a visité le site.
- **Marqueurs de version** : `full_recompute_version` (recalcul complet quand une
  grille de coût change — **à bumper à chaque changement de formule, sinon
  l'historique garde les anciens chiffres en silence**) et `fees_backfill_version`
  (relecture des frais réels sur l'historique).
- **Limite API** : sans le scope `read_all_orders`, Shopify ne rend pas les
  commandes de plus de **60 jours** — elles gardent le repli 3 % de frais, signalé
  en warning.

### Sonde de diagnostic

`GET /api/admin/day-aggregates?day=YYYY-MM-DD` — lignes brutes + contrôle
d'identité `net = CA − spend − COGS − taxe − frais`. **À lire AVANT de spéculer**
sur un chiffre bizarre : c'est elle qui a trouvé le piège devise.

---

## 8. Pièges connus — la FAQ des « chiffres bizarres »

### 8.1 « Le MER monte mais la marge baisse » — normal

Trois causes possibles, dans cet ordre de fréquence :
1. **jour en cours** : les charges fixes d'une journée entière sont déjà comptées
   sur un CA partiel (voir section 3, l'exemple 13/08 vs 14/08) ;
2. **petit jour** : même effet sans être partiel — 147 € pèsent le double sur un
   jour à 1 500 € que sur un jour à 3 000 € ;
3. **mix panier** : bundles, pays lointains, forte part PayPal → COGS et frais
   montent en % du CA sans que la pub y soit pour quoi que ce soit.

Vérification : appliquer l'identité de la section 3, poste par poste. Si les
trois postes s'additionnent bien à l'écart de marge, il n'y a pas de bug.

### 8.2 « Le MER est sous le ROAS Meta » — anormal, à traiter comme un bug

L'invariant MER ≥ ROAS ne peut être violé que de deux façons :
- **deux périmètres qui ne se recouvrent pas.** C'était le bug de la carte Polo
  (corrigé le 14/08) : CA découpé par lignes de commande, valeur Meta découpée
  par nom de campagne. Depuis, `splitMetaValueByProduct()` ventile la valeur Meta
  au prorata du CA par UTM, le nom de campagne ne servant plus que de repli ;
- **Meta sur-attribue.** Mesuré le 14/08 : le 13/08 Meta revendiquait **2 952 €
  sur 3 032 € de CA total** (97 %) et **43 achats sur 45 commandes**. Pas de
  double comptage (dédup pixel/CAPI saine) — c'est du view-through 1 jour, de
  l'imputation au jour du clic et des conversions modélisées. Conséquence : MER
  et ROAS Meta se touchent presque, et le moindre écart de périmètre fait
  basculer le signe. **Un ROAS Meta de 2,7× ne veut pas dire « la pub a généré
  2,7× le spend en incrémental ».**

### 8.3 Le CA du dash ≠ le CA de Shopify Analytics

Causes légitimes, à vérifier dans cet ordre : le **jour Europe/Paris** (pas le
fuseau de la boutique) · les **remboursements** imputés au jour de la commande ·
le **CA manuel** (NIRA) ajouté au global · l'attente de synchro sur le jour en
cours.

### 8.4 « Les frais ont explosé »

Non : le dashboard est passé du **forfait 3 % + 1 %** affiché jusqu'au 06/08 aux
**frais réels par commande** (~4,5 % carte, ~8 % PayPal). Les frais réellement
payés ont *baissé* depuis Shopify Advanced ; c'est leur affichage qui est devenu
honnête.

### 8.5 Attribution du Gilet : jamais l'UTM seul

Tant qu'**une seule campagne Gilet** existe, toute commande contenant un Gilet
lui appartient — vérifier les **line items**, pas le champ UTM (une partie des
commandes perdent leur UTM alors que le CAPI les trace quand même). Cette règle
casse dès qu'une 2ᵉ campagne Gilet est lancée : repasser à l'UTM strict.

### 8.6 Double comptage du CA manuel

Les ventes NIRA annoncées oralement puis re-fournies en CSV sont **les mêmes**.
La fusion se fait par `(jour, produit)` en gardant le `savedAt` le plus récent —
**ne jamais additionner**. Verrouillé par `niraManualRevenue.test.ts`.

### 8.7 Grilles en devises différentes

Toutes les grilles de COGS sont en **EUR sauf NIRA** (USD, d'où le suffixe
`UsdCents`). Le taux USD des charges fixes est **figé à 1,1539** — un taux figé
et assumé vaut mieux qu'un taux flottant non tracé.

---

## 9. Ce qui n'est pas automatisé

- **Packaging + carte (0,38 €/commande)** : mécanique prête, `PER_ORDER_EXTRAS_START_DATE`
  à `null`. Pour activer : poser la date, brancher l'appel dans
  `computeOrderCogsTax*`, décider où le montant s'affiche, **bumper
  `REQUIRED_RECOMPUTE_VERSION`**. Jamais rétroactif.
- **CA NIRA** : saisi à la main, pas de boutique branchée. Frais modélisés à
  **6 %** (chiffre donné par Badr — le seul taux modélisé qui subsiste).
- **`EXCLUDED_CAMPAIGN_KEYWORDS` est vide** depuis le 06/08 : rien n'est filtré.
  Le point de branchement reste en place.
- **Commandes de plus de 60 jours** : hors de portée de l'API sans
  `read_all_orders` — frais au repli 3 %.

---

### Règles de tenue de ce fichier

1. **Une formule ne vit qu'à un seul endroit dans le code** — ce fichier pointe
   vers elle, il ne la recopie pas. Si le code change, corriger le pointeur ici.
2. **Aucun chiffre inventé.** Tout montant écrit ici est soit une constante du
   code, soit une mesure datée (et alors elle est aussi dans `MEMO.md`).
3. **Le journal reste dans `MEMO.md`.** Ici on écrit l'état actuel, pas
   l'historique — sauf quand connaître le « pourquoi » évite de refaire l'erreur.
