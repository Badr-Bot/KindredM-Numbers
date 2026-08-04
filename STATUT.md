# 📍 Statut du déploiement — mis à jour au fil de l'eau

Dashboard en ligne : **https://kindred-m-numbers.vercel.app** (sans mot de
passe, choix de Badr — ajouter `DASHBOARD_PASSWORD` dans Vercel pour protéger).

## État des briques

| Brique | État | Note |
|---|---|---|
| Code (6 vues + admin + cron) | ✅ | branche `claude/kindredm-dashboard-setup-epbxha` |
| Supabase (3 migrations SQL) | ✅ | projet `eyfbkxdtxdoktscjaqsg` |
| Vercel (deploy + variables) | ✅ | diagnostic 🩺 sur `/admin` |
| Auth Shopify (client_credentials) | ✅ | token obtenu pour ES/UK/FR |
| Scope `read_orders` ES/UK/FR | ⏳ | à approuver (voir ci-dessous) |
| Secret DE dans Vercel | ⏳ | invalide — à re-copier depuis le Dev Dashboard |
| Token Meta | ✅ | dans Vercel |
| Découverte produits → mapping → backfill | ⏳ | via `/admin`, après les 2 points ci-dessus |

## Mode « zéro clic » (ajouté 08/07)

Plus besoin de passer par /admin : **ouvrir le site suffit**. Si la base est
vide, une bannière « Initialisation automatique » apparaît sur l'accueil et
fait tout (découverte → mapping auto → backfill, 1-2 min), puis la page se
rafraîchit avec les vrais chiffres. Le cron de minuit fait pareil en filet de
sécurité. Les erreurs s'affichent en clair dans la bannière.
Garde-fou §5 : un produit inconnu arrête tout → validation manuelle sur /admin.

Pipeline validé bout en bout par test d'intégration (Shopify/Meta/Supabase
simulés) : Fixture 1 reproduite au centime (24 tests verts).

## Reste à faire (dans l'ordre)

1. Scopes ES/UK/FR : ✅ faits (08/07). Secret DE corrigé + Redeploy : ✅.
2. **Ouvrir https://kindred-m-numbers.vercel.app/** → laisser la bannière
   d'init tourner (~1-2 min) → chiffres réels partout.
3. Vérifier les totaux affichés vs l'admin Shopify de chaque store (§7.4).
4. Le lendemain : vérifier que le cron de minuit a bien clôturé J-1 (§7.5).
5. Plus tard (quand tout tourne) : faire pivoter les secrets qui ont transité
   par le chat (Dev Dashboard → Paramètres → « Faire pivoter ») + màj Vercel.

## Mise à jour 18/07 (soir) — vague 1 du plan Intelligence

- **📓 Journal de bord** (migration `0006_journal.sql` à coller) : saisie
  20 s (date + type + note) dans l'onglet Analyse ; événements auto-détectés
  depuis meta_spend (campagne coupée/lancée, saut de budget ±50 %) — marche
  déjà avec le seed, sans token ; marqueurs verticaux sur toutes les courbes
  Analyse ; verdict avant/après automatique (CA + CPA, 3 j de chaque côté).
- **📅 Heatmap jour-de-semaine** dans Analyse (CA, commandes, panier).
- **🧠 Brief du jour** sur l'accueil : net d'hier vs moyenne 7 j, anomalies
  ±20 % (CA/CPA/panier), rappels campagnes coupées. v2 (waterfall
  CPM/CTR/CVR) s'activera avec le token Meta.
- Reste du plan (waterfall, labo créas, ROAS marginal) : en attente du token.

## Mise à jour 18/07 — onglet 📊 Analyse

Nouvel onglet Analyse (nav, entre Mois et Année) : sélecteur de période
(7/14/30 j, tout, dates précises), courbes CPA·CPM·CPC·CTR·CVR·panier moyen
en petits multiples, panneau 🚨 Dérapages (3 derniers jours vs 7 précédents,
seuil ±20 %), panneau 🔗 Corrélations (Pearson entre CPM↔CPA, CTR↔CPA,
CTR↔CVR, Spend↔CA, Spend↔CPA avec lecture en clair), section 🎨 Créas avec
hit rate (gagnantes = ROAS ≥ cible ÷ créas testées ≥ 20 € de spend).

- **Migration à coller** : `supabase/migrations/0005_meta_insights.sql`
  (tables meta_insights + meta_ad_insights).
- CPA et panier moyen marchent déjà (données Shopify). CPM/CPC/CTR/CVR et
  les créas se rempliront automatiquement dès que le token Meta (app avec
  Marketing API) fonctionnera — la synchro écrit déjà tout, aucune action.
- CVR = commandes Shopify ÷ clics Meta (les sessions Shopify ne sont pas
  accessibles avec les scopes actuels — proxy standard).

## Mise à jour 16/07 — bouton backfill supprimé, corrections auto-appliquées

Suite au bug de devise (remboursements DZD lus comme des EUR), Badr a
demandé que TOUT se corrige tout seul, sans jamais avoir à cliquer sur
« Lancer le backfill ». Fait :
- Le bouton backfill a disparu de `/admin` (l'étape 3 est maintenant juste
  informative).
- `runThrottledIncrementalSync` compare une version de correctif
  (`app_state.full_resync_version`) à `REQUIRED_FULL_RESYNC_VERSION` dans
  `incrementalSync.ts`. Si elles ne correspondent pas (nouveau correctif
  qui fausse des données déjà en base), la prochaine visite du site
  déclenche automatiquement un backfill complet de tout l'historique
  (au lieu du scan rapide 7 jours), puis repasse en mode normal.
- **Pour toute future correction de bug qui affecte des données déjà
  stockées** : bumper `REQUIRED_FULL_RESYNC_VERSION` dans
  `src/lib/incrementalSync.ts` suffit — la correction s'applique seule à
  la prochaine ouverture du site, aucune autre action nécessaire.

## Mise à jour 16/07 — vraiment zéro clic : synchro automatique en continu

Badr ne doit plus jamais appuyer sur « Backfill » ou « Actualiser ». Ajouté :
- `/api/sync` (throttlé 5 min côté serveur, table `app_state`) : même logique
  que le cron, rescan commandes modifiées J-7 + spend Meta + recalcul des
  jours touchés + toujours J-2/J-1/J en filet.
- `LiveSync` (mémorisé dans `layout.tsx`, actif en mode live) : déclenche
  cette synchro à l'ouverture du site, puis toutes les 5 min tant que
  l'onglet reste ouvert, et rafraîchit la page automatiquement si des
  données ont changé. Aucune UI, aucun bouton — juste des chiffres à jour.
- Le cron de minuit reste le filet de secours si personne ne visite le site
  un jour donné.
- **Nouvelle migration à appliquer** : `supabase/migrations/0004_app_state.sql`
  (table `app_state`, clé/valeur, pour le throttle) — à coller dans Supabase
  SQL Editor comme les précédentes.

## Mise à jour 15/07 — CA faux vs Shopify : cause trouvée

- **Bug trouvé et corrigé** : Supabase renvoie max **1000 lignes** par requête.
  Le recalcul des agrégats lisait toutes les commandes en une requête → au-delà
  de 1000 commandes, le surplus était ignoré → CA affiché très inférieur au
  vrai (l'écart constaté vs l'admin Shopify FR). Corrigé par pagination ;
  test de régression à 1200 commandes ajouté (27 tests verts).
- **Robustesse** : une commande avec un produit inconnu ne fait plus perdre
  tout le store au backfill — elle est sautée et signalée avec le titre exact.
- **/debug = réconciliation** : pour chaque store, compare nb de commandes
  Shopify depuis le 04/06 (+ total historique) vs base vs agrégats affichés,
  avec l'écart en clair. Une capture de /debug dit où est la perte.
- **Périmètre** : le dashboard démarre au **04/06** (spec §7.4). Les 243 k€/90j
  de l'admin FR incluent mai — hors périmètre. À élargir si souhaité
  (scope `read_all_orders` requis au-delà de 60 jours d'historique).
- **Reprise** : 1) coller le SQL meta_spend dans Supabase → Run ·
  2) /admin → 🚀 Lancer le backfill (recalcule tout avec le fix) ·
  3) envoyer une capture de /debug.

## Mise à jour 15/07 — nuit

- **Cause de l'init « infinie » trouvée et corrigée** : écritures en base une
  par une (~1 400 allers-retours) → dépassement de la limite de temps Vercel
  → fonction tuée → relance en boucle à chaque ouverture. Corrigé par lots
  (orders ×250, meta_spend ×500, agrégats en 3 requêtes groupées). L'init
  complète tient maintenant en ~30-60 s.
- **Spend Meta 21/06 → 15/07 injecté via le connecteur** (fichier
  `meta_spend_seed.sql` fourni dans le chat, 141 lignes, mapping §4.6) — en
  attendant le token API demain. Le backfill avec token écrasera proprement.
- **Séquence de reprise** : 1) coller le SQL dans Supabase → Run ·
  2) ouvrir l'accueil → l'init finit seule → chiffres réels AVEC spend
  (DE inclus si les scopes ont bien été approuvés).
- **Demain** : token Meta (app avec Marketing API) pour le spend du jour et
  des jours suivants — le seed s'arrête au 15/07.

## Mise à jour 22/07 — heartbeat de synchro indépendant du navigateur

- **Cause trouvée** : « les dépenses Meta depuis 1h ne se mettent pas à jour »
  — la synchro (commandes + spend Meta) ne se déclenchait QUE quand le
  dashboard était ouvert dans un onglet (poll toutes les 5 min côté
  navigateur, `LiveSync.tsx`). Écran verrouillé / onglet fermé / personne ne
  regarde = plus aucune synchro. Seul filet côté serveur : le cron Vercel,
  1×/jour à 23h05 UTC.
- **Fix** : `.github/workflows/keep-sync.yml` — un heartbeat GitHub Actions
  qui appelle `/api/sync` toutes les 5 min, tout seul, sans dépendre de qui
  regarde le dashboard (endpoint déjà throttlé côté serveur, sans risque).
  Se déclenche automatiquement une fois poussé sur la branche par défaut du
  repo (`claude/kindredm-dashboard-setup-epbxha`).

## Mise à jour 25/07 — onglet Créas + fixes ROAS/COGS

- **Nouvel onglet 🎬 Créas** : tableau détaillé par annonce (spend, CA, ROAS,
  CPA, CTR, hook rate, hold 50/75/100 %, CVR landing page, taux
  atterrissage/panier/checkout), filtrable par campagne et période,
  triable, avec mini-graphes CA/ROAS par créa au clic et le texte de la
  créa affiché. Nécessite `0011_creas_tab.sql` (colle comme d'habitude).
- **Fix COGS upsells toujours à 0** dans Dépenses — split polo/upsells
  jamais câblé, total Net/Marge jamais faux. Nécessite `0010_cogs_split.sql`.
- **Fix spend Meta « non classé » qui disparaissait du total** quand une
  nouvelle campagne au nom pas reconnu (ex. sans "FR"/"WORLDWIDE") était
  créée — compté nulle part avant, maintenant toujours inclus dans le
  total Aujourd'hui avec bandeau d'alerte + lien vers Contrôle. Nécessite
  `0009_unmapped_in_aggregates.sql`.
- **Heartbeat GitHub Actions** (`.github/workflows/keep-sync.yml`) : la
  synchro tournait avant uniquement quand le dashboard était ouvert dans un
  onglet — corrigé, ping `/api/sync` toutes les 5 min indépendamment.
- **Séquence de reprise** : coller dans Supabase SQL Editor, dans l'ordre,
  toutes les migrations `0009` → `0011` si pas déjà fait.

## Mise à jour 26/07 — bug créas manquantes dans l'onglet Créas

- **Cause trouvée et corrigée** : sur CBO-POLO-FR-TESTING, Badr voyait
  "Toutes (70)" alors que Meta a bien ~300 créas actives dans cette
  campagne (vérifié en direct sur l'API Meta : 302 annonces, 278 avec du
  spend réel depuis le 04/06). Le tableau Créas ne remontait donc qu'une
  fraction des créas réelles — pas propre à une seule campagne, le même
  bug touchait tout l'onglet Créas (et aussi l'onglet Analyse : le taux
  de créas "vues" et les courbes par campagne).
- Cause technique : 3 requêtes Supabase paginées dans `analytics.ts`
  utilisaient `.range()` sans `.order()` explicite. Sans tri
  déterministe, la pagination OFFSET/LIMIT de PostgREST n'est pas
  garantie stable entre deux pages — surtout sur `meta_ad_insights`,
  réécrite en continu par la synchro toutes les 5 min pendant la
  lecture. Résultat : des lignes sautées entre pages, donc des créas
  entières invisibles côté dashboard bien qu'elles existent en base.
  Même défaut que celui déjà corrigé plus tôt sur `aggregate.ts` — pas
  reporté sur ce fichier-ci à l'époque.
- Correctif : ajout de `.order("day").order("ad_id"/"campaign_id")`
  avant chaque `.range()`. Pas de migration SQL nécessaire, effectif dès
  le prochain chargement de page (pas besoin de resynchroniser).

## Mise à jour 27/07 — TVA 5,5 % retirée du calcul du net

- **Sur demande Badr** : les frais passent de 9,5 % à 4 % du CA (Shopify
  3 % + Autres 1 %). La TVA 5,5 % n'est plus déduite du net — c'est de
  l'argent collecté pour le compte de l'État, pas un coût de l'activité.
  Elle reste calculée à part et affichée dans la carte « 🧾 TVA cumulée ·
  à provisionner » de l'onglet Année (montant à mettre de côté), mais ne
  réduit plus le net affiché nulle part (Aujourd'hui, Contrôle, Dépenses,
  Année).
- **Recalcul rétroactif sur tout l'historique**, automatique via le
  marqueur `full_recompute_version` (relit orders/meta_spend déjà en
  base, aucun appel API Shopify/Meta, aucune migration SQL). Effectif
  dès le prochain cycle de synchro (≤ 5 min).
- Ne touche pas la « Taxe UE » (3 €/produit distinct, règle du 06/07) —
  c'est une taxe distincte, inchangée.

## Mise à jour 27/07 (soir) — 3 bugs signalés d'un coup

- **Live ≠ Mois** : le total GLOBAL d'Aujourd'hui ne sommait que ES+UK+DE+FR,
  alors que Mois sommait toutes les lignes du jour (y compris un éventuel
  spend Meta pas encore classé, market="UNMAPPED"). Les deux divergeaient
  dès qu'une nouvelle campagne au nom pas reconnu tournait le jour même —
  le bandeau d'alerte affirmait même à tort « déjà compté dans le total ».
  Corrigé : le GLOBAL d'Aujourd'hui inclut maintenant l'UNMAPPED, comme Mois.
- **Barre du bas (nav) qui saute sur mobile** en dépliant une carte Créas :
  elle était en `sticky bottom-0`, qui recalcule sa position à chaque
  changement de hauteur du document — un dépli de carte insère 9 graphiques
  d'un coup, la barre "saute" le temps du recalcul. Passée en `fixed`,
  indifférente au contenu. Vérifié avec Playwright (position identique
  avant/après injection de 3000px de contenu).
- **Créas manquantes en masse dans l'onglet Créas** : un seuil de 20 €
  de spend lifetime cachait purement et simplement toute créa en dessous
  de la liste — donnait l'impression de 100 créas affichées sur 500
  réelles. Seuil supprimé, toutes les créas ayant diffusé apparaissent
  (statut "⏳ En test" pour celles peu dépensières, comme avant).

## Mise à jour 29/07 — mapping campagne par défaut : FR au lieu d'UNMAPPED

- **Sur demande Badr** : une campagne Meta dont le nom ne contient aucun
  indice pays (pas de ESP/GE/FR/UK/CANADA/EUROPE/AUS/WORLDWIDE/ANG) est
  désormais classée **FR par défaut**, au lieu de tomber dans le bucket
  `UNMAPPED` (qui demandait une assignation manuelle dans Contrôle). En
  pratique une campagne sans mention de pays est presque toujours FR, le
  plus gros marché.
- Un override manuel persisté (Contrôle) prime toujours sur ce mapping —
  les cas vraiment ambigus restent réassignables à la main.
- Ne touche PAS les campagnes déjà en base classées `UNMAPPED` avant ce
  changement (le mapping se fait à l'écriture, pas relu à chaque
  recalcul) — celles-là restent à assigner à la main dans Contrôle comme
  avant. Seules les NOUVELLES campagnes suivent la nouvelle règle.

## Mise à jour 31/07 — 2 nouveaux produits tarifés (Gilet + Caleçon)

- **Gilet** (`GILET`) : vraie grille fournisseur reçue (devis Panda du 31/07).
  Paliers **1/2/3 pièces** (pas 1/2/4) + Suisse incluse → grille et fonction
  de calcul séparées pour ne pas toucher aux 5 upsells déjà validés.
  8,07 € (UK) à 11,25 € (CH) la pièce selon destination.
- **Caleçon** (`CALECON`) : **forfait 2,00 €/pièce**, partout. Il était mappé
  dans `products_map` mais absent de TOUTE grille COGS → compté 0 € sur ~50
  pièces/jour, donc Net trop optimiste (~35 €/jour d'écart). C'était le plus
  gros trou restant dans le calcul du net.
- **À faire côté Supabase** : coller le `insert into products_map` du Gilet
  (titre `Nivafit - Gilet ultra-confortable`) — le Caleçon, lui, était déjà
  mappé, seul son prix manquait (et le prix vit dans le code, pas en base).
- Les commandes des 7 derniers jours étant re-scannées à chaque synchro, les
  COGS se corrigent tout seuls sans resync complet.

## Mise à jour 03/08 — caleçon exempté de la taxe UE + MEMO.md

- **Sur demande Badr** : le caleçon est glissé dans le colis des autres
  produits → il ne compte plus jamais comme « produit distinct » pour la
  taxe UE de 3 €. Polo + caleçon = 3 € (avant : 6 €). Commande 100 %
  caleçons = 0 € (conséquence assumée). Implémenté via
  `TAX_EXEMPT_UPSELL_KEYS` dans `engine.ts` (les deux chemins, strict et
  tolérant, passent par `distinctProductCount`).
- **Correction rétroactive** : `full_resync_version` bumpe en v6 → re-scan
  complet des commandes Shopify (étape par étape après la synchro rapide,
  jamais bloquant) qui recalcule la taxe de chaque commande historique
  contenant un caleçon (~3 € de trop par commande concernée depuis le
  01/07). Aucune migration SQL.
- **Nouveau `MEMO.md`** : contexte métier compact (prix, grilles, seuils,
  protocole de scaling, faits vérifiés, infra) — source unique à relire en
  début de session au lieu de re-dériver, et à maintenir à chaque
  changement de règle.

## Mise à jour 04/08 — facture fournisseur vérifiée : taxe UE forfaitaire + grille caleçon par pays

- **Contexte** : Badr a reçu une facture Panda Dropshipping (650 commandes,
  01/08/2026) et a demandé une vérification. Recalcul ligne par ligne contre
  `engine.ts` → deux erreurs de modèle trouvées, toutes deux corrigées :
- **Taxe UE** : la colonne Tax de la facture est à 3,00 € flat sur 518/520
  commandes UE — JAMAIS 6/9/12 € même sur des commandes multi-produits, et
  une commande 100 % caleçons (#5304) a aussi été taxée 3 €. La règle
  "3 € × produits distincts" (06/07) et l'exemption caleçon (03/08) étaient
  donc **fausses toutes les deux** : la vraie règle est un forfait 3 €/colis
  UE, point. `euTaxCents()` simplifié en conséquence ; `distinctProductCount`
  et `TAX_EXEMPT_UPSELL_KEYS` supprimés (devenus inutiles).
- **Caleçon** : en isolant les commandes « 1 polo/gilet palier exact + 1
  caleçon » dans la facture, l'écart de coût implicite est constant par
  pays et très net : FR 2,46 € (35 échantillons), BE 2,74 € (18), ES 2,47 €
  (1) — pas 2,00 € partout comme estimé le 31/07. Nouvelle grille
  `CALECON_GRID_CENTS` (pays non listé = max + 1,50 €, même convention que
  les autres grilles).
- **Correction rétroactive** : `full_resync_version` bumpe en v7 → re-scan
  complet de l'historique EU (tax_eu_cents et cogs_upsells_cents stockés par
  commande). Impact net attendu : commandes multi-produits → net réévalué
  à la hausse (moins de taxe) ; commandes avec caleçon → net réévalué à la
  baisse (COGS plus réaliste).
- 42/42 tests passent après mise à jour des fixtures. Docs (SPEC + MEMO)
  et le rapport Slack 23h mis à jour en cohérence.

## Mise à jour 04/08 — couleurs par paliers sur le net (journalier + live)

- Sur demande Badr : le Net n'est plus juste vert/rouge — négatif reste
  rouge, mais au-dessus de 0 la couleur monte par paliers de 500 €
  (`netTierClass` dans `format.ts`, 5 paliers, plafonné au-delà de 2000 €).
  Rampe mono-teinte or (`--color-net-1..5` dans `globals.css`, validée
  six-checks ordinal via le skill dataviz — monotone, contraste ≥4,5:1 sur
  fond terminal ET panel), le palier 5 = `--color-phosphor` déjà établi.
- Appliqué : le tableau journalier de l'onglet Mois (colonne Net) et
  l'onglet Aujourd'hui (gain net héros, cartes par marché, cartes par
  produit). Colonnes ROAS/Cumul et le reste du dashboard inchangés (hors
  scope de la demande).

## Notes techniques utiles

- `read_orders` = 60 jours d'historique max. Lancement = 04/06 → OK si le
  backfill est fait avant début août. Le cron ne relit que J-7, donc aucun
  souci ensuite. (Sinon : demander `read_all_orders`.)
- Le backfill est **idempotent** : en cas de timeout/erreur, re-cliquer est
  sans risque.
- Erreur `requires merchant approval for read_orders scope` = scope pas
  encore approuvé sur le store (étape 1 ci-dessus).
- Erreur `invalid client secret` = secret erroné dans Vercel (étape 2).
- Rotation recommandée à terme : les secrets ont transité par le chat —
  bouton **« Faire pivoter »** (Dev Dashboard → Paramètres → Secret) puis
  mettre à jour Vercel. À faire quand tout tourne.
