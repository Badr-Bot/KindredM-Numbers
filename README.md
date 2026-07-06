# NIVA Dashboard — KindredM

Dashboard financier qui agrège 4 boutiques Shopify (ES, UK, DE, FR) + Meta Ads
et calcule le P&L réel au centime. Voir `NIVA_DASHBOARD_SPEC.md` (ou le cahier
des charges fourni) pour la logique métier complète — elle n'est pas
négociable sans validation explicite.

## État actuel

- ✅ Scaffold Next.js (App Router, TypeScript, Tailwind)
- ✅ Auth par mot de passe (`src/proxy.ts`, tout le site protégé)
- ✅ Moteur de calcul pur (`src/lib/engine.ts`) — **les 4 fixtures + cas de test
  synthétiques passent au centime** (`npm test`)
- ✅ Schéma Supabase (`supabase/migrations/0001_init.sql`)
- ✅ Client Shopify (pagination + rate limit), client Meta Insights, mapping
  campagne → marché
- ✅ Script de découverte produits (`scripts/discover-products.ts`)
- ✅ Script de backfill (`scripts/backfill.ts`)
- ✅ Cron de clôture quotidienne (`src/app/api/cron/route.ts` + `vercel.json`)
- ✅ Fetch live du jour en cours avec cache 5 min (`src/lib/live.ts`)
- ✅ UI des 5 vues (§6) — direction **A · Terminal Noir** (dark, mono,
  phosphore vert = positif), mobile-first, avec effets (boot terminal,
  compteurs animés, glow, sons synthétisés coupables 🔊), drapeaux pays et
  registre produits extensible (`src/lib/products.ts`)
- ✅ Mode démo (`NIVA_DEMO=1`) — données synthétiques déterministes pour
  explorer l'UI sans brancher aucune API
- ⏳ Backfill réel + vérification contre l'admin Shopify — nécessite les
  vraies clés, à faire en local (voir ci-dessous)

### Aperçu rapide sans aucune clé

```bash
npm install
NIVA_DEMO=1 DASHBOARD_PASSWORD=demo npm run dev
# ouvre http://localhost:3000 (identifiant : n'importe lequel, mot de passe : demo)
```

Les 5 vues : **Aujourd'hui** (net en direct par marché), **14 derniers jours**
(tableau NIVA), **Par mois** (graphe CA/marge + Δ), **Par année** (totaux),
**Répartition des dépenses** (donut + carrés + postes à optimiser).

## Sécurité — aucun secret dans ce repo

Toutes les clés (Shopify, Meta, Supabase, mot de passe dashboard) vivent
**uniquement** dans un `.env.local` qui ne quitte jamais ta machine, ou dans
les variables d'environnement Vercel. `.env*` est dans `.gitignore` depuis le
premier commit. Ne colle jamais une vraie clé dans un chat, un ticket ou un
outil tiers — génère un `.env.local` à partir de `.env.example` en local.

## Mise en route (en local, avec tes vraies clés)

1. **Installer les dépendances**
   ```bash
   npm install
   ```

2. **Copier `.env.example` en `.env.local`** et remplir les vraies valeurs.
   Voir la checklist ci-dessous pour savoir où trouver chaque clé.

3. **Appliquer le schéma Supabase** — colle le contenu de
   `supabase/migrations/0001_init.sql` dans le SQL Editor de ton projet
   Supabase (ou utilise la Supabase CLI si tu préfères).

4. **Phase découverte produits (§5)** — liste les titres de produits réels
   de tes 4 boutiques :
   ```bash
   npm run discover-products
   ```
   Ça écrit `products_map.draft.json` (jamais committé). **Relis-le et
   corrige chaque `product_key`/`unit_group` toi-même** avant de charger le
   résultat dans la table `products_map` de Supabase — aucune entrée
   `A_VALIDER` ne doit rester non résolue.

5. **Lancer les tests** (doivent passer avant tout backfill — loi #5) :
   ```bash
   npm test
   ```

6. **Backfill initial** (une fois `products_map` chargé en base) :
   ```bash
   npm run backfill
   ```
   Télécharge tout l'historique depuis le 2026-06-04 (+ spend Meta depuis le
   2026-06-21), recalcule `daily_aggregates`. **Vérifie ensuite manuellement**
   que les totaux affichés correspondent aux totaux de l'admin Shopify de
   chaque store — critère d'acceptation §7.4.

7. **Déployer sur Vercel** : importe le repo, colle les mêmes variables
   d'environnement dans les settings Vercel (jamais dans le code), le cron
   `vercel.json` (00:05 Europe/Paris) s'active automatiquement.

## Où trouver chaque clé (checklist §10)

| Variable | Où la trouver |
|---|---|
| `SHOPIFY_{ES,UK,DE,FR}_DOMAIN` / `_TOKEN` | Admin Shopify de chaque store → `Paramètres → Apps et canaux de vente → Développer des apps → Créer une app`. Scope API Admin : **`read_orders`** uniquement. Installer l'app, puis révéler le token dans l'onglet "API credentials". |
| `META_ACCESS_TOKEN` | Business Manager → `Paramètres de l'entreprise → Utilisateurs → Utilisateurs système → Ajouter`, assigner le compte pub, générer un token avec la permission **`ads_read`**. |
| `META_AD_ACCOUNT_ID` | `919559773962419` (déjà donné dans le cahier des charges). |
| `SUPABASE_URL` / `SUPABASE_SERVICE_KEY` | Créer un projet sur supabase.com (free tier) → `Project Settings → API`. La `service_role key` est très privilégiée : jamais côté client, jamais préfixée `NEXT_PUBLIC_`. |
| `DASHBOARD_PASSWORD` | Une passphrase forte de ton choix. |
| `CRON_SECRET` | Une valeur aléatoire de ton choix (protège `/api/cron`, qui est exclu du basic-auth). |

## Points de la spec signalés pour validation

Ces points sont explicitement marqués « à confirmer » dans le cahier des
charges ou impliquent une interprétation raisonnable en l'absence de détail
supplémentaire — à valider avant le backfill réel :

- **Taxe UE (§4.4, révisée le 06/07/2026)** : 3 € par produit *distinct* dans
  la commande, uniquement si la destination est dans l'UE (`EU_COUNTRIES` dans
  `src/lib/engine.ts`). FR est dans l'UE → taxé ; GB/UK et hors-UE → 0.
- **Attribution des remboursements tardifs** : le schéma (§3) ne stocke
  qu'un `refunded_cents` cumulatif par commande (pas de table `refunds`
  séparée avec sa propre date). L'implémentation actuelle recalcule
  l'agrégat du **jour de la commande d'origine** quand un remboursement est
  détecté (le cron rescanne `updated_at` sur J-7→J-1), et non le jour exact
  du remboursement au sens strict de "Total sales" Shopify. Dans la
  quasi-totalité des cas (remboursement dans les 7 jours) le résultat est
  identique ; si un remboursement tardif (>7j) ou une attribution stricte
  "jour du remboursement" est nécessaire, il faudra ajouter une table
  `refunds(order_id, day, amount_cents)` — extension simple si besoin.
- **Bundles polo hors grille au-delà de 4 pièces** : la formule marginale du
  §4.2 (pensée pour "3 polos") est appliquée aussi au-delà de 4 en l'absence
  d'un palier explicite plus élevé.

## Tests

```bash
npm test        # une passe
npm run test:watch
```

Les fixtures §8 (`src/lib/__tests__/engine.fixtures.test.ts`) valident le
moteur au centime près sur des journées réelles. Si l'une d'elles casse,
c'est un signal d'arrêt : on ne touche pas à l'UI tant qu'elle n'est pas
corrigée.

## Développement

```bash
npm run dev     # serveur local, http://localhost:3000
npm run lint
npm run build
```
