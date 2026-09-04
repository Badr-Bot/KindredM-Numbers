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
  rouge, mais au-dessus de 0 chaque palier de 500 € a une teinte VRAIMENT
  différente (`netTierClass` dans `format.ts`, 5 paliers, plafonné au-delà
  de 2000 €) : amber → phosphor(or) → émeraude → azur → indigo
  (`--color-net-1..5` dans `globals.css`). Première version (dégradé
  mono-teinte or) refusée par Badr ("je veux des couleurs différentes") —
  remplacée par cette rampe multi-teintes, chaque paire adjacente validée
  CVD-safe (skill dataviz, six-checks) sauf amber↔rouge (14,0 vs seuil 15,
  deux tokens déjà existants, acceptable vu que le signe +/− désambiguïse
  déjà).
- Appliqué : le tableau journalier de l'onglet Mois (colonne Net) et
  l'onglet Aujourd'hui (gain net héros, cartes par marché, cartes par
  produit). Colonnes ROAS/Cumul et le reste du dashboard inchangés (hors
  scope de la demande).

## Mise à jour 04/08 — 2 bugs signalés par Badr (screenshots) : split produit + hit rate créas

- **Bug 1 — Gilet + Polo ne sommait pas au Global** (screenshot : Global
  +152€, Gilet −11€ + Polo +77€ = 66€ seulement). Cause : `getProductSplitForDay`
  sommait le spend directement depuis la table `meta_spend` (resynchronisée
  par le cron), alors que le Global de l'onglet Aujourd'hui vient de
  `daily_aggregates` (recalculé séparément) — les deux peuvent être
  temporairement désynchronisés en cours de journée. Corrigé : le spend
  Polo = Global (passé en paramètre depuis `page.tsx`, `view.cards[0].totals.spendCents`)
  moins le spend Gilet (Lancaster) lu dans meta_spend, clampé à 0. Gilet +
  Polo somme maintenant TOUJOURS exactement au Global, par construction.
- **Bug 2 — hit rate créas ridicule (1 %, 2/185) dans l'onglet Analyse**
  (screenshot : plein de créas à ROAS 1,46-1,88× sans 🏆 alors qu'elles sont
  déjà rentables). Cause : seuil gagnante codé en dur à "ROAS ≥ 2" depuis le
  19/07, jamais mis à jour avec le passage aux seuils dynamiques BE/cible
  15 % utilisés partout ailleurs dans le dash. Corrigé : `AnalyseBoard`
  reçoit maintenant `thresholds` (GLOBAL, 14 j glissants, `computeThresholds`)
  depuis `page.tsx`, le seuil gagnante = `thresholds.target` (dynamique).
  Ajouté sur demande Badr : colonnes **ROAS BE** et **Marge nette*** (≈
  marge de contribution moyenne du compte × CA de la créa − son spend —
  approximation signalée comme telle, le COGS/taxe réel par commande n'est
  pas connu au niveau créa côté Meta).

## Mise à jour 04/08 (suite) — liste créas simplifiée : gagnantes actives uniquement

- Nouvelle demande Badr sur la même section : ne montrer QUE les créas
  gagnantes (ROAS ≥ cible 15 %), plus de top/flop général ni de seuil de
  spend (« on s'en fou du spend » — l'ancien seuil ≥ 1 000 € est supprimé).
  Colonnes réduites à Créa / Campagne mère / ROAS / ROAS BE / ROAS cible
  (Spend, Achats, CPA, Marge nette retirés de cette liste).
- **Nouvelle règle stricte** : une créa ne peut être gagnante que si sa
  CAMPAGNE MÈRE est actuellement ACTIVE sur Meta — sinon jamais de 🏆, même
  avec un excellent historique. Nécessite le statut live des campagnes
  (absent des tables Supabase, qui n'ont que l'historique) : nouvelle
  fonction `fetchActiveCampaignIds()` dans `meta.ts` (GET
  `/act_{id}/campaigns?fields=id,effective_status`), appelée depuis
  `analyse/page.tsx` en parallèle du reste. Si indisponible (token HS, mode
  démo) : liste vide + bandeau ⚠️ explicite plutôt que de deviner (loi
  « jamais de chiffre inventé »).
- `AdPerf` gagne un champ `campaignId` (ajouté à la sélection
  `meta_ad_insights`) pour pouvoir croiser chaque créa avec le statut live
  de sa campagne.

## Mise à jour 04/08 (suite) — colonnes d'analyse + tri par colonne sur la liste gagnantes

- Badr : « il manque le spend depuis le début, le hook, le CTR, le CPA...
  pour trouver des patterns » + tri par colonne. Ajouté :
  - **Spend, Achats, CPA, CTR, Hook rate** — déjà lifetime (pas juste la
    fenêtre des graphes du haut) car `getAnalyticsData` charge tout
    l'historique depuis `HISTORY_START`. Hook rate = vidéo seulement
    (video_3s ÷ impressions, `AdPerf.video3s`, nouveau champ sélectionné
    depuis `meta_ad_insights`) ; « — » pour une image.
  - **Tri cliquable par colonne** (Créa, Campagne, Spend, Achats, CPA, CTR,
    Hook, ROAS) — clic = trier par cette colonne (desc par défaut), reclic
    = inverser. Tri par défaut : ROAS décroissant. Les valeurs `null`
    (ex. Hook sur une image) vont toujours en fin de liste.

## Mise à jour 04/08 (suite) — seuils PAR PRODUIT + funnel complet sur la liste gagnantes

- **Bug de fond signalé par Badr** (« le Lancaster je vois aucune créa
  sachant que c'est pas le même BE ni le même ROAS target ») : les créas
  étaient toutes jugées contre la cible blended GLOBAL, dominée par le polo
  (~90 % du CA) — or le gilet a une marge plus haute donc un BE ET une
  cible PLUS BAS ; aucune créa Lancaster ne pouvait qualifier. Corrigé :
  nouveau `getProductRoasThresholds(endDay)` dans `analytics.ts` (même
  méthode que `computeThresholds` — CM 14 j glissants → BE = 1/CM, cible =
  1/(CM−0,20) — mais les commandes sont bucketées Gilet/Polo comme
  `getProductSplitForDay`). Chaque créa est comparée aux seuils de SON
  produit (campagne LANCASTER → Gilet, sinon Polo), repli sur GLOBAL si le
  calcul produit échoue. Colonnes BE/Cible affichées PAR LIGNE + nouvelle
  colonne Produit (🎽/👕, triable).
- **Funnel complet ajouté** (demande « tous les éléments intéressants pour
  trouver des patterns ») : CPC, CPM, Hold (vues complètes ÷ vues 3 s),
  Atterrissage (LPV ÷ clics lien), ATC (ajouts panier ÷ LPV), CVR (achats
  ÷ LPV), Panier moyen — en plus de Spend/Achats/CPA/CTR/Hook/ROAS déjà là.
  Toutes triables. `AdPerf` étendu (video100 avec probe migration 0011,
  reach, link_clicks, landing_page_views, add_to_cart, initiate_checkout).
- Au passage : les libellés « cible 15 % » de la veille étaient inexacts —
  la cible dynamique du dash a toujours été 1/(CM−0,20) (20 % de marge
  nette, `roasTarget20`). Libellés corrigés en « cible » tout court.

## Mise à jour 04/08 — cible alignée sur le protocole Master : 15 % net (ex-20 %)

- Décision Badr (« on s'aligne sur master ecom ») : le ROAS cible dynamique
  du dashboard passe de 1/(CM−0,20) à **1/(CM−0,15)** — même définition que
  la cible du protocole Master utilisée par le rapport Slack 23h. Fini le
  double référentiel (le dash affichait une cible plus exigeante que celle
  sur laquelle on prend les décisions de scaling).
- `roasTarget20` → `roasTarget15` dans engine.ts + constante
  `TARGET_NET_MARGIN = 0.15` (sert aussi de seuil de validité de la cible
  dans thresholdsFromTotals et getProductRoasThresholds). Libellé légende
  Aujourd'hui « 🟢 ≥ cible 15 % ». Spec §1/§4.7 et MEMO à jour.
- Effet mécanique : la cible baisse (ex. CM 62 % → cible 2,13× au lieu de
  2,38×) → des campagnes/jours passeront de 🟡 à 🟢 et le CPA cible de
  l'onglet Créas monte un peu (panier ÷ cible plus basse). Aucun recalcul
  d'historique nécessaire : les seuils sont calculés à la volée, jamais
  stockés.

## Mise à jour 04/08 — âge de la créa + métriques calées sur la période sélectionnée

- **Âge** : nouvelle colonne triable sur la liste des gagnantes = jours
  depuis la 1ʳᵉ diffusion HISTORIQUE de la créa (indépendant de la période
  affichée) — pour croiser avec le ROAS (jeune prometteuse ≠ vieille qui
  s'essouffle). `AdDailyPerf` expose le jour par ligne, le 1er jour est
  déduit côté client sur tout l'historique.
- **Période** : sur demande Badr, toutes les autres métriques de la table
  (spend, achats, CPA, CPC, CPM, CTR, hook, hold, atterrissage, ATC, CVR,
  panier, ROAS) suivent désormais le SÉLECTEUR DE PÉRIODE en haut de
  l'onglet (7/14/30 j/tout/custom) au lieu d'être figées en lifetime.
  Restructuration : `getAnalyticsData` renvoie les lignes JOURNALIÈRES par
  créa (`adsDaily`, comme l'onglet Créas) et l'agrégation se fait côté
  client sur [from, to] — zéro appel serveur au changement de période.

## Mise à jour 05/08 — bug Gilet+Polo ≠ Global sur le Net (composants CA/COGS/taxe)

- Badr (screenshot Aujourd'hui) : « y a un souci au niveau du net, la somme
  des trois c'est pas ce qui est affiché ». Vérifié : marchés (ES+UK+DE+FR)
  sommaient bien au Global, mais Gilet+Polo non (31€+101€=132€ affiché vs
  132,69€ Global — écart réel, pas juste un arrondi d'affichage).
- Cause : `getProductSplitForDay` (analytics.ts) ne recevait QUE le spend
  Global en paramètre (fix du 04/08). Le CA/COGS/taxe, eux, étaient encore
  RE-SOMMÉS depuis la table `orders` en requête live, indépendamment de
  `daily_aggregates` (source du Global/marchés) — les deux peuvent diverger
  légèrement en cours de journée (resync pas encore propagée, remboursement,
  etc.), exactement le même type de désync déjà trouvé sur le spend le 04/08
  mais qui n'avait été corrigé QUE pour ce composant-là.
- Fix : `getProductSplitForDay(day, global: Totals)` prend maintenant les
  totaux Global complets (CA/spend/COGS/taxe/frais/commandes), pas juste le
  spend. Gilet reste mesuré depuis `orders`/`meta_spend` (seule source pour
  isoler le produit), mais Polo = Global − Gilet pour CHAQUE composant
  (clampé ≥ 0 comme le spend). Les frais Polo aussi = Global.frais −
  Gilet.frais (jamais recalculés séparément sur poloCaCents, pour éviter un
  écart d'arrondi entre les deux calculs indépendants). Net = CA−spend−COGS
  −taxe−frais par carte ; comme chaque composant somme exactement au Global
  par construction, le Net somme exactement aussi (linéarité). 42/42 tests
  toujours verts, tsc clean.
- Fichiers : `src/lib/analytics.ts` (`getProductSplitForDay`), `src/app/page.tsx`
  (appel mis à jour : passe `view.cards[0].totals` au lieu de
  `.totals.spendCents`).

## Mise à jour 05/08 — attribution Polo : correction partielle (contrairement au Gilet)

- Badr, après la correction Gilet/Lancaster : « Les autres corrige les aussi »
  (appliquer la même rigueur aux campagnes Polo).
- Contrairement au Gilet (1 seule campagne → correction certaine à 100 %), le
  Polo tourne sur 3 campagnes actives en parallèle (FRTEST/WORLD/ZOMBIE) : le
  raccourci « 1 commande produit X = 1 campagne » ne marche pas.
- Vérification manuelle sur les 59 commandes Polo du 04/08 (requêtes GraphQL
  Shopify `customerJourneySummary.firstVisit`/`lastVisit`, comparées aux achats
  auto-déclarés Meta par campagne) :
  - Méthode actuelle (lastVisit UTM seul) : FRTEST 15, WORLD 16, ZOMBIE 11
    (total 42) vs Meta 18/21/14 (total 53) — écart de 11 commandes.
  - Fallback sur firstVisit **seulement si lastVisit est entièrement vide ET
    firstVisit pointe vers une campagne active** : récupère 3 commandes
    (2 FRTEST, 1 WORLD) → FRTEST 17/18 (94 %), WORLD 17/21 (81 %), ZOMBIE
    11/14 (79 %). Écart réduit à 8 commandes (au lieu de 11).
  - ~12/59 commandes = vrai multi-touch (2 campagnes Polo actives différentes
    cliquées avant achat) — normal, pas un bug, on garde le last-touch.
  - Le reste du solde « organique » (14/59) est un mélange organique réel +
    commandes touchées uniquement par une vieille campagne maintenant en pause
    (CBO-POLO-WORLDWIDE-FR du 21/06, CBO3-TESTING-FR-POLO du 26/07) —
    non récupérables.
- **Cette correction Polo est une estimation (79-94 % de match), pas une
  certitude comme le Gilet (100 %, vérifié 3/3)** — à toujours présenter comme
  telle à Badr.
- Pas de changement dans le code du dashboard (`analytics.ts`/`engine.ts`) :
  l'attribution UTM par campagne Shopify n'est utilisée que pour les calculs
  manuels/le rapport Slack 23h, pas dans `daily_aggregates` (la table des
  créas gagnantes utilise directement les données Meta par annonce, pas les
  UTM Shopify). Mise à jour appliquée dans MEMO.md (§ Faits vérifiés) et dans
  le prompt de la routine Slack 23h05 (`trig_01VoaeW4pHFecyw3fHwTMxUn`).

## Mise à jour 29/08 — le dash mettait du temps à afficher le CA et le spend

Question de Badr : « pk le dash met bcp de temps pour afficher les bonnes
valeurs de CA Shopify et spend Meta ads ?? normalement ça doit être rapide
non ? ». Diagnostic : la page rend en direct, c'est la **synchro** qui était
longue, et surtout qui publiait mal.

- La page lit seulement `daily_aggregates` — les chiffres ont l'âge de la
  dernière synchro, pas de la page.
- **Cause n°1, mesurée** : le pinger `keep-sync.yml`, censé appeler
  `/api/sync` toutes les 5 min sans que personne n'ouvre le dash, n'était
  lancé par GitHub que quelques fois par jour — écart médian **2 h** sur les
  19 dernières exécutions, trou de **12 h** le 28/08. GitHub abandonne les
  workflows planifiés trop fréquents. Restaient donc le cron Vercel (1×/jour)
  et le navigateur de Badr.
- Le cycle était 100 % séquentiel : 4 stores Shopify → recalcul (le CA
  apparaît) → PUIS Meta (campagnes, annonces, pays) → recalcul (le spend
  apparaît). D'où « le CA bouge, le spend traîne » — et à 300 s de limite, la
  phase Meta se faisait tuer après que le CA était déjà publié.
- L'écran n'était rafraîchi qu'à la FIN du POST : le CA publié à mi-cycle
  restait invisible jusque-là.
- Le cycle coûtait le même prix à chaque passage (7 jours × 4 stores + 3
  lectures Meta sur 7 jours) pour rattraper 5 minutes.

Livré :

1. **Lectures Meta lancées en parallèle de la phase Shopify** — l'ordre
   d'écriture ne change pas (le CA est toujours publié en premier, loi du
   26/07), seul le temps réseau est mutualisé.
2. **Deux régimes de synchro** : rapide (J-1→J, campagnes seulement) toutes
   les 5 min, complet (7 j + annonces + pays + journal + sentinelle frais)
   1×/h et au cron de nuit.
3. **L'écran se rafraîchit toutes les 15 s pendant la synchro** (LiveSync et
   bouton Actualiser) : le CA s'affiche dès sa publication, sans attendre
   Meta.
4. **`keep-sync.yml` rendu continu** : une planification par heure (bien mieux
   honorée par GitHub) + boucle interne qui ping toutes les 5 min pendant
   ~50 min. Gratuit (dépôt public).
5. **Âge réel des chiffres affiché** : le bandeau lisait l'heure du rendu,
   donc disait toujours « MAJ à l'instant ». Il lit maintenant l'horodatage de
   la dernière synchro réussie, passe en ambre avec un ⚠ au-delà de 15 min, et
   vieillit tout seul. Corrigé au passage : le cron de nuit synchronisait sans
   jamais mettre à jour cet horodatage.

Aucune migration, aucune règle de calcul touchée. 191 tests verts, `next
build` OK. Non mesuré en conditions réelles depuis la session (le proxy ne
joint ni Vercel ni les API) — à confirmer sur le vrai dash.

Reste proposé, non fait : TTFB de la page (~15 allers-retours Supabase
séquentiels par rendu, dont 2 requêtes-sonde inutiles). Et si les trous de
synchro persistent malgré le pinger continu : cron Vercel toutes les 5 min
(plan Pro requis) ou pinger externe gratuit (cron-job.org, UptimeRobot) —
les deux demandent une action de Badr.

## Mise à jour 29/08 (suite) — monteur coupé + onglet Analyse par campagne

**Monteur.** Badr : « plus de monteur depuis aujourd'hui, tu peux arrêter la
dépense journalière jusqu'à ce que je te le dise ». Dernier jour compté :
28/08 — **confirmé par Badr : « il a été payé au prorata »** (donc pas le mois
entier comme Jeremy). Dès le 29/08 : **−18,51 €/jour, −563,31 €/mois** sur les charges
fixes. La ligne reste dans le code — l'historique du 21/05 au 28/08 doit
garder ce qui a été réellement payé. Pour reprendre : remettre `endDay` à
`null`. Deux points à confirmer : s'il a été payé pour août ENTIER, mettre
31/08 ; et l'abonnement « Eleven Labs ×2 (Adnane + monteur) » n'a pas été
touché (44 €/mois — à réduire si son siège saute aussi).

**Onglet Analyse — les graphes ne s'affichaient pas par campagne.** Deux
causes :

1. CPA, CVR et panier moyen étaient volontairement vides dès qu'une campagne
   était isolée (Shopify ne relie pas une commande à une campagne) — soit 3
   graphes sur 6 systématiquement blancs. Ils basculent maintenant sur
   l'attribution **Meta** de la campagne, étiquetés « · Meta » pour qu'on ne
   les confonde jamais avec le CA réel.
2. La liste de campagnes sortait de tout l'historique par ordre alphabétique,
   alors que la fenêtre par défaut est de 14 jours : choisir une campagne
   arrêtée en juin donnait six cadres vides. Elle ne montre plus que les
   campagnes actives sur la période, **triées par dépense**, et un bandeau
   explique le cas « hors période » au lieu de laisser des cadres vides.

**Repères de changement sur les courbes** (demande Badr) : pointillé **vert**
= scale ↑, **rouge** = descale ↓, **violet** = nouvelles créas, avec légende
et détail dans l'infobulle.

Première version : le scale était DÉDUIT d'un saut de dépense ≥ 20 %, faute
de budget historisé. **Corrigé dans la foulée (« corrige le stp ») : la vraie
donnée existait déjà dans le code** — le journal d'activité du compte Meta,
que l'onglet Scaling lit depuis le 18/08 pour savoir ce qui a été appliqué.
Les repères affichent donc maintenant le geste exact (« Budget ↑ 250 € →
400 € (+60 %) »), y compris un −15 % du protocole que la déduction ratait.
La déduction par la dépense reste en repli si le journal Meta est
indisponible, et la légende dit alors que c'est une approximation. Jamais les
deux à la fois : un vrai changement de budget produit aussi un saut de
dépense le lendemain. Moteur pur `changeMarkers.ts`, 15 tests.

**Le budget, pas la dépense** (Badr : « pour le budget Meta, prendre en compte
le budget et pas le montant spent »). Première tentative : une courbe
« Budget / jour ». **Retirée le jour même** — « je voulais que le jour où le
budget change ça mette une ligne dans les autres charts, pas avoir un chart
budget, je m'en fous ». Le budget est un repère sur les autres courbes, pas
une métrique à contempler.

**Et surtout : le bug que ce retour a révélé.** Badr : « il est figé ». Les
repères de budget ne s'affichaient JAMAIS. Vérification faite sur le journal
d'activité réel du compte (MCP Meta) : les changements y sont bien, tous les
soirs vers 23 h. Mais Meta renvoie `extra_data` sous deux formes, et le code
n'en lisait qu'une — sur ce compte le montant est imbriqué sous une clé du
même nom, donc `Number(...)` valait NaN et chaque montant repartait à zéro
pointé. **L'onglet Scaling était touché aussi** : son `repairMoves`, écrit le
19/08 pour faire disparaître des « ? », masquait ce bug depuis. Corrigé à la
source, avec des tests écrits sur la charge utile réelle du 28/08.

Corrigé au passage : en vue « toutes campagnes », les montants de campagnes
différentes se chaînaient et affichaient des trajets inventés. Le
regroupement se fait maintenant par campagne PUIS par jour.

217 tests verts, `next build` OK.

## Mise à jour 29/08 (soir) — lot de changements sur les dépenses

Annoncés par Badr en une phrase, tous appliqués dans `subscriptions.ts` :

- **Higgsfield arrêté** — dernier jour compté 28/08 (−3,61 €/j).
- **Klaviyo passe à 150 €/mois le 10/08** (25 € avant). Première version :
  appliqué à tout l'historique, en lisant ça comme la correction de
  l'hypothèse à 25 € du 08/08. Badr a tranché : « non pour Klaviyo à partir
  du 10 août ». C'est donc un changement de tarif daté — deux lignes qui se
  succèdent, et mai à début août gardent leurs charges d'origine.
  Charges : 147,12 €/j au 09/08 → 151,23 €/j au 10/08.
- **Artlist ajouté** : 40 $/mois à partir du 29/08 (+1,14 €/j).
- **Claude Badr 100 € → 100 $** et **Claude Adnane 20 € → 20 $**, au 18/09.
  Date dans le futur : la bascule est programmée et s'appliquera seule. Deux
  lignes par personne (EUR puis USD), l'historique en euros reste intact. La
  date d'Adnane est déduite du « aussi » de Badr — à confirmer.

Charges du jour : **108,57 €/j au 28/08 → 87,59 €/j au 29/08**. Total mensuel
3 303,96 € → 2 665,32 €.

**Bug corrigé au passage** : le contrôle bancaire ne bornait pas les
abonnements sur leur date de DÉBUT. Une ligne future était déjà comptée —
« Claude » aurait affiché 224 €/mois attendus au lieu de 120 € dès
aujourd'hui, avec une fausse alerte « débité au mauvais montant ».

227 tests verts, `next build` OK.

## Mise à jour 04/09 — cashflow : rapprochement trésorerie depuis le tout début

Question de Badr : « vérifie au niveau du compte bancaire la cashflow qui
rentre, les paiements qui restent à payer au fournisseur, et dis-moi si on est
en accord avec le net gagné affiché ». Reconstruit à la main (Supabase + captures
Shopify/Wise/Slash), puis **codé pour que le dash le refasse seul**.

**Ce qui a été vérifié (chiffres du 04/09, 09h50) :**
- Payouts Shopify ✅ : solde + versements programmés (~19 500 €) = CA − frais
  Shopify du 31/08→04/09 (19 388 €), écart 0,6 %. Les versements programmés ne
  sont PAS dans le solde (solde USD 1 175 $ < 4 895 $ programmés).
- Net cumulé après charges 59 316 € = CUMUL de l'onglet Mois, au centime. Les
  barres par pays de l'onglet Année (net brut, 69 418 €) ne tombaient pas sur
  le Total (charges déduites) sans le dire → ligne « 💳 Charges fixes » ajoutée.
- **Dette fournisseur invisible : ~27 000 €** (1 219 commandes #5996→#7214 jamais
  facturées depuis la Bill 20260814). Moteur COGS + taxe UE = ligne TOTAL de
  Panda à ±1 % (vérifié sur les 2 factures d'août : +0,5 % et +1,2 % hors
  packing). Panda a annoncé 25 000 € → sa facture s'arrête vers #7125 (02/09),
  le reste tombe sur la suivante.
- Écart théorique/réel : 12 435 € au départ → **1 850 € (0,43 % du CA)** une
  fois retirés les payouts programmés (4 475 €), les ACH en transit (1 959 €),
  le perso cartes (3 483 $ Adnane + 613 $ Badr), les frais de change Slash
  (866 $), les débits Shopify (571 $ — le plan est couvert par les crédits),
  Google Ads (65 $), SWIFT (2 × 25 $).
- **Meta : ZÉRO marge cachée** — 802,90 € → 936,26 $ = 1,1661, le taux du
  marché ; le coût est la « Foreign Transaction Fee » séparée (~1 % du spend,
  ~570 €/mois). Badr a branché Wise (EUR) sur Meta le 04/09 → plus de frais.
- Le taux figé 1,1539 (décision 08/08) est périmé (réel 1,1661) — signalé, pas
  changé : ne touche pas le P&L (Meta facture en EUR), seulement la valeur des
  soldes USD (−1 %).

**Décisions Badr (04/09) :** le reliquat ~1 850 € vit sur le **Revolut perso
d'Adnane** (l'activité tournait dessus avant Slash/Wise) — imputé 100 % Adnane,
figé comme PLAFOND ; « à partir de ce jour on part du principe qu'il n'y a pas
de trou » → tout écart au-delà est une anomalie rouge. Aucun virement vers un
compte perso. Le plan Shopify est payé par les crédits Shopify (571 $ de débits
carte au total). MacBook acheté par Adnane sur la carte LLC : classé perso par
défaut (règle carte) — **société ou perso, à trancher par Badr**.

**Livré (branche `claude/cashflow-paiements-verification-wwt8tw`) :**
1. `treasury.ts` — moteur pur du pont net → cash théorique → attendu en banque
   vs réel, ventilation de l'écart, reliquat Revolut plafonné, imputation
   Badr/Adnane (perso nominatif, frais à la règle par date, flou 50/50 et dit).
2. `bank.ts` — balayage des DEUX banques depuis le 21/05 (cache 1 h, non
   bloquant), dû fournisseur lu sur les commandes (coupe au NUMÉRO sur FR, à la
   DATE ailleurs, pagination > 1 000 lignes), anomalies **PAIEMENT_REFUSE**
   (même marchand refusé ≥ 2 fois — Google Workspace ×6 le 01/09) et
   **TRESORERIE_INEXPLIQUE** (> 1 000 € depuis le 04/09). Bug corrigé : le
   balayage écrasait les affectations auto par carte (perso Adnane vidé).
3. Onglet Banque — blocs « 🧮 Rapprochement trésorerie », « 🏭 Panda »
   (factures reçues, acomptes, **prochaine facture estimée** avec plage et
   nombre de commandes, « ce qu'il pourra encore réclamer »), et « Ce qu'il
   reste à chacun » qui retire la dette Panda avant de partager.
4. Net mis à jour : frais de change Slash (866 $, étalés 27/07→04/09, clos),
   plan Shopify (571 $), Google Ads (65 $), SWIFT (2 × 25 $) — charges
   10 102 € → 11 447 €. Le balayage bancaire ne recompte ces postes qu'APRÈS le
   04/09 (`NET_BOOKED_BANK_FEES_UNTIL`), sinon double.
5. `SUPPLIER_PREPAYMENTS` — acomptes virés avant facture, déduits de la
   prochaine ; vide tant que Badr n'annonce pas montant + jour.

271 tests verts, `next build` OK, lint clean. Rendu vérifié en local (mode
démo, capture). **Non testé contre les vraies API** (ni jetons ni Vercel
depuis la session). Reste bloquant côté Badr : scope Shopify
`read_shopify_payments_accounts` — sans lui « en route » est vide et l'écart
n'est pas calculé.

## Mise à jour 04/09 (suite) — paiement Panda, règle des taux, MacBook

Réponses de Badr aux trois questions du rapprochement :

1. **Panda payé : 25 448,36 € virés le 04/09, « jusqu'à la commande #7148 ».**
   Enregistré comme `Bill 20260904 (PDF à recevoir)`, #5996→#7148, 1 153
   commandes, payée en entier. **Vérification moteur : 25 498,20 €** (COGS +
   taxe UE sur cette plage) → facturé 49,84 € en dessous (−0,2 %), cohérent
   avec l'avoir Long Sleeves promis (~28,55 €). PDF à pointer à réception.
   La « prochaine facture estimée » repart de #7149 : 85 commandes, ~1 886 €.
2. **MacBook d'Adnane** : « tu t'en fous, ça rentre dans l'argent qui reste
   sur le Revolut d'Adnane » → reste classé perso (règle carte), absorbé par
   le reliquat Revolut pré-LLC. Rien à changer.
3. **Scope Shopify** : plus tard (Badr).

**Règle des taux (Badr, remplace la décision du 08/08 pour les montants
bancaires)** : « pour ce qui est payé, le vrai taux ; pour l'argent qui dort,
le dernier taux enregistré de la journée ». Livré :
- `rates.ts` (pur, 10 tests) : série quotidienne USD→EUR ; un débit se
  convertit au taux DE SON JOUR (sinon le dernier connu avant, jamais un taux
  postérieur) ; un solde / l'en route / le cashback au DERNIER taux.
- `bank.ts` : la série vient de Wise (`/v1/rates?group=day`, une requête
  pour tout l'historique, cache 1 h). Branché sur les transactions Slash et
  Wise, les soldes, l'argent en route, le cashback. Sans jeton Wise ou en
  erreur : repli sur le taux figé 1,1539 — jamais un taux inventé. Clés de
  cache bumpées (wise-data-v3, slash-data-v4, lifetime-v2, enroute-v2).
- Le taux figé reste la règle des ESTIMATIONS (abonnements USD étalés, frais
  ponctuels saisis à la main) : ce ne sont pas des débits datés, un taux
  flottant les ferait bouger après coup.
- Slash n'expose pas (dans la doc connue) le montant d'origine en EUR d'un
  débit carte (« Currency conversion 116.61 % (EUR 802.90) » dans l'app) —
  si un champ existe, il remplacera le taux du jour par le taux EXACT de la
  transaction. À vérifier sur une réponse brute de l'API.

280 tests verts, `next build` OK. Toujours non testé contre les vraies API.

## Mise à jour 04/09 (suite 2) — les frais de change sont bien Meta

Question de Badr : « les frais de change, c'est lié aux dépenses courantes ou à
Meta ? ». **Vérifié à la main** sur ses captures : les 5 « Foreign Transaction
Fee » visibles (30/08→03/09) font 145,53 $, soit 29,11 $/jour ; le spend Meta
des 5 jours correspondants (29/08→02/09, avec le décalage d'un jour de
facturation) fait 14 335 $ au taux réel 1,1661 → **1 % = 143,35 $**. Écart
1,5 %. Les abonnements en EUR payés par la carte USD (~500 $/mois) ne peuvent
produire que ~0,2 $/jour. **≈ 99 % des frais de change viennent de Meta.**
Depuis le 04/09 Meta est payé depuis Wise en euros : la ligne doit cesser.

Codé pour que le dash le dise lui-même : l'agrégat quotidien Slash est
redécoupé au prorata des frais portés par chaque transaction (`fxFeeInfo`),
et chaque morceau porte maintenant son origine (`feeOf` : META / PERSO /
ABONNEMENT / AUTRE…) — helper pur `fxShares` (3 tests). Le bloc
« Rapprochement trésorerie » affiche « frais de change depuis le début : X €,
dont Y € causés par Meta (Z %) ». 285 tests verts, build OK.

## Mise à jour 04/09 (suite 3) — onglet Comptable « clean », synchro, lenteurs

Retour de Badr sur le dash déployé (capture) : « j'ai toujours beaucoup
d'erreurs ». Traité point par point :

- **Table `bank_tx_labels` absente en prod** (bandeau orange) → migration 0013
  appliquée sur Supabase depuis la session. Les affectations Société / Badr /
  Adnane / Ignorer se sauvegardent enfin.
- **« Sent money to ARINLOYE ISMAEL KOREDELE » (−660 $, 28/08)** = le monteur
  (Badr). Motif bancaire « Monteur » ajouté : catégorie ABONNEMENT, plus
  jamais « à affecter ».
- **« Disbursement Reversal » (−219,04 $, Slash, 21/08)** = un versement repris
  (Shopify reprend les remboursements clients sur un payout). Catégorisé
  SHOPIFY négatif avec note « déjà déduit du CA, rien à affecter » — les
  remboursements sont dans refunded_cents. Hypothèse Shopify (le libellé ne
  nomme pas l'émetteur), assumée et écrite dans le code.
- **CWILL / Moon Bundles** : facturées via Shopify, couvertes par les crédits
  (Badr) → `noBankClaim`, comptées dans le net mais plus jamais réclamées en
  banque. Test adapté.
- **« Part Adnane INFÉRIEURE de 23 788 € — à creuser »** : faux signal. L'en
  route estimé sans le scope Shopify valait 777 € (CA − payouts reçus depuis
  le 01/08 : les payouts de début août payaient juillet) pour ~15 000 € réels.
  Nouvelle estimation = CA − frais Shopify des 5 derniers jours (délai de
  versement observé, vérifié à 0,6 % le 04/09), affichée « ≈ », et le message
  dit d'ajouter le scope avant de creuser. Le rapprochement trésorerie
  l'utilise aussi (écart calculé mais marqué estimation, jamais d'alerte
  rouge sur une estimation).
- **Paragraphe « écart vs encaissé −15 770 € »** du bloc 30 j retiré : il
  mélangeait le paiement Panda de 25 448 € (commandes d'août) avec la fenêtre
  et faisait peur pour rien. Le contrôle « rien ne manque » est le bloc 🧮.
- **Synchro : CA et spend Meta publiés ENSEMBLE.** Badr : « je souhaite que
  Meta se rafraîchisse plus vite que le CA, pour que ça ne m'annonce pas un
  bénéfice puis une perte ». Le 1er recalcul (juste après les commandes, avant
  Meta) est supprimé ; le recalcul se fait après l'écriture du spend, et dans
  le catch si Meta échoue (la loi du 26/07 « un timeout Meta ne gèle jamais le
  CA » tient). La lecture Meta part toujours en parallèle des 4 stores.
- **Onglet Analyse lent** : `fetchActiveCampaignIds` (appel Meta live) à
  chaque rendu → version cachée 5 min (`getActiveCampaignIdsCached`).
- **Onglet Produits lent** : 4 scans complets des commandes (line_items JSON)
  à chaque rendu → `getProductSplitForRange` cachée 5 min, clé = bornes +
  Global de la période (recalcul dès qu'une synchro bouge le jour).

292 tests verts, `next build` OK, lint clean. Non testé en prod (session sans
accès Vercel) — les lenteurs sont à re-mesurer par Badr après déploiement.
## Mise à jour 04/09 — facture fournisseur du 03/09 vérifiée (25 463,66 €)

Badr a envoyé la 3ᵉ facture Panda (`Bill_20260903`, commandes #5996 → #7148).
Elle est **ajoutée au ledger `supplierBills.ts` en « à payer »** — le statut ne
passe à « payée » que sur annonce de Badr, jamais déduit.

**Où on en est côté paiements :**

| Facture | Commandes | Montant | État |
|---|---|---|---|
| 20260801 | #4814 → #5462 (649) | 14 279,96 € | ✅ payée le 06/08 (16 388,40 $) |
| 20260814 | #5463 → #5995 (531) | 12 064,41 € | ✅ payée le 14/08 (13 914,91 $) |
| **20260903** | **#5996 → #7148 (1 152)** | **25 463,66 €** (29 577,19 $) | **⏳ à payer** |

Les trois plages s'enchaînent sans trou ni recouvrement (test qui le vérifie).

**Le chiffre rassurant** : recalculée dans le moteur, la facture donne
25 454,43 € — **écart +9,23 €, soit 0,04 %** (les factures d'août étaient à
1,4 %). 90,6 % des lignes identiques au centime, taxe 3 €/colis respectée sur
1 151/1 153. **Aucun dérapage de prix** : polo FR 15,06/26,76, caleçon 2,46,
gilet aux prix du 14/08, Canada aux prix du 02/08, Suisse constante. **Panier
moyen 22,10 €** contre 22,00 (01/08) et 21,95 (14/08) — le coût par commande
ne bouge pas alors que le volume double. Pas de ligne « custom packing » cette
fois (il y avait 410 € le 14/08).

**Le remboursement promis le 14/08 n'y est pas.** Aucune ligne d'avoir, aucun
crédit — et le même surcoût est refacturé (4 commandes « LS seul » : +16,74 €).
En cherchant, la cause est claire : **toute commande sans polo paie +4,00 € de
packing** (LS, débardeur, short, chemise…), c'est-à-dire exactement la règle du
gilet primaire acceptée le 14/08. Donc soit ils émettent l'avoir promis, soit
ils écrivent cette règle dans le devis — à leur faire trancher par écrit.

**Ce qu'il faut regarder avant de virer** (dans la note de la facture, carte 📦) :

- **136 commandes facturées sans numéro de suivi (3 066,86 €)**, dont un bloc
  contigu **#6619 → #6658 + #6945 (41 cmd, 894,76 €)** en milieu de période :
  les récentes sans tracking sont normales, un bloc de 40 anciennes non.
- **Taxe UE payée 2× sur des colis groupés** (6,00 €) : #6917+#6919 et
  #6864+#6865 partagent leur tracking → porté en « contesté ».
- **4 commandes suisses dans un seul colis facturées en plein** (203,15 €) :
  4 prix livraison comprise pour un envoi.

Deux corrections de grille COGS sont proposées par cette facture (packing
« colis primaire » à généraliser ; pantalon FR en upsell à 6,90 € et non
9,84 €) — **non appliquées** : elles rejouent l'historique (resync complet)
pour ~22 € net sur 3 semaines. Détail et chiffres dans MEMO.md.

## Mise à jour 04/09 (suite) — facture croisée avec Shopify : quantités justes à l'unité

Badr : « un numéro de commande doit avoir le nombre d'unités affiché sur
Shopify, pas compté deux fois — et les reshipments, ils figurent où ? »

Vérifié dans la base sur les 1 153 commandes #5996 → #7148 :

- **Une ligne de facture = une commande Shopify**, et chaque commande a
  EXACTEMENT ses unités : polos 2 511 (Shopify) vs 2 505 (facturés) ·
  caleçons 259/258 · gilets 203/203 · chemises 67/67 · shorts 26/26 ·
  pantalons 21/21 · débardeurs 13/13.
- **Les 3 écarts sont en notre faveur** : #6103 et #6327 (remboursés) et
  #6794 (annulée) sont facturés **0,00 €**. Ils ne facturent pas ce qu'ils
  n'expédient pas.
- **Aucune commande payée deux fois** : numéros contigus, aucun doublon,
  aucun recouvrement avec la facture du 14/08 (qui s'arrêtait au #5995).
- **Reshipments : aucun sur cette facture.** Le tracker Drive va de #1003 à
  #5838 (tous antérieurs) et rien n'apparaît en plus. Reste à demander où
  sont facturés ceux notés « payed by niva ».
- **Packing confirmé normal par Badr** → l'avoir Long Sleeves du 14/08 est
  abandonné (ce n'était pas une surfacturation). **Il ne reste que 6,00 €**
  de taxe UE facturée deux fois.

**Bug trouvé chez nous** : « La Chemise Turenne » est la chemise MANCHES
LONGUES (46 unités) mais le renommage du 29/08 l'a mappée sur la grille
manches courtes. ~4 € d'impact, mais l'étiquette est fausse et l'écart
grandit sur les gros paliers. Correctif = une ligne de `products_map` +
resync, non appliqué (écriture en prod, en attente du feu vert).

## Mise à jour 04/09 (fin) — facture corrigée reçue et VALIDÉE : 25 448,36 €

Le fournisseur a renvoyé le fichier après nos remarques. Il a **fusionné les
deux paires de commandes parties dans un même colis** (`#6919 + 6917` et
`#6864+6865`) : taxe UE comptée une seule fois **et** bundle re-tarifé comme
un seul envoi. **−15,30 €** — plus du double des 6,00 € qu'on réclamait,
puisqu'il enlève aussi la deuxième livraison.

Revérifié en entier : les 1 153 commandes #5996 → #7148 sont toujours toutes
couvertes exactement une fois, quantités inchangées, remboursées à 0 €.
**Recalcul moteur : 25 445,07 € contre 25 448,36 € facturés → +3,29 €
(0,013 %)**, contre 1,4 % sur les factures d'août.

| Facture | Montant | État |
|---|---|---|
| 20260801 | 14 279,96 € | ✅ payée le 06/08 |
| 20260814 | 12 064,41 € | ✅ payée le 14/08 |
| **20260903 (v2)** | **25 448,36 €** (29 563,27 $) | **⏳ à payer, rien de contesté** |

Seul point laissé ouvert : les 4 commandes suisses d'un même client dans un
seul colis (#6953/6954/6955/6981, 203,15 €) n'ont pas été fusionnées — à
réclamer en avoir sur la prochaine facture, pas de quoi retenir un paiement.

## Mise à jour 04/09 (réconciliation) — une seule facture du 03/09

Deux sessions ont travaillé le même jour sur la facture Panda #5996→#7148 :
l'une l'a vérifiée ligne à ligne (branche `invoice-payment-verification`,
Bill 20260903, 25 448,36 € validés, plus rien de contesté), l'autre a
enregistré le paiement (25 448,36 € virés le 04/09) sous un `Bill 20260904
(PDF à recevoir)` provisoire. Fusionnées : **un seul enregistrement, Bill
20260903, statut payée**, avec les notes de la vérification. Sans ça, le
rapprochement aurait compté 25 448 € de dette fournisseur en double.
Conséquences : l'avoir Long Sleeves est abandonné (packing confirmé normal),
`supplierOwedCents()` = 0, le bloc 🏭 n'a plus d'avoir chiffré à déduire.

## Mise à jour 04/09 (soir) — le rapprochement réel tombe à zéro ; moins de bruit

Première lecture du dash déployé avec les vraies banques (capture Badr,
17h36) : **inexpliqué depuis le 04/09 = 0 €**. Net cumulé 57 979 € + dû Panda
2 039 € = 60 018 € ; − en route ≈ 21 010 € = 39 008 € attendus ; réel 34 147 € ;
écart 4 861 € = perso 3 595 € + reliquat Revolut 1 265 €. Frais de change
depuis le début 699 €, dont 619 € (89 %) causés par Meta.

Retours de Badr, appliqués :
- **Refus de carte retirés** (« je m'en fous des refus, cette info me sert à
  rien ») : 10 cartes ambre (hungerstation, Kiwi, Booking, Higgsfield…) pour
  zéro euro sorti. Anomalie `PAIEMENT_REFUSE` et collecte des declined
  supprimées, clé de cache Slash → v5.
- **« Marge réelle encaissée −10 779 € » retirée** (« ça sert à rien ») :
  entrées − sorties bancaires sur 30 jours, faussée par le virement Panda de
  25 452 € tombé dans la fenêtre pour des commandes d'août. Le bloc 30 j ne
  garde que ses deux colonnes entrées / sorties ; le seul contrôle qui compte
  est le rapprochement depuis le début.
- **Tuile « Abonnements : 2 à vérifier »** = deux alertes : *Google Workspace
  10 € débités vs 8 € attendus* → c'était notre montant qui était faux (8,10 €
  saisi, 11,30 $ réels lus sur Slash) : corrigé, l'alerte tombe. *TrendTrack
  25 €/mois sans débit vu depuis le 06/08* → vraie question : qui le paie ?
  (perso, annuel, autre carte) — en attente de Badr.

294 tests verts, `next build` OK.

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
