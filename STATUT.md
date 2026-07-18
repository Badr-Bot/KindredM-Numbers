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
