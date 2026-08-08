# MEMO — contexte compact Weft (ex-NIVA) (à lire en 1er, évite de re-dériver)

> Fichier de travail pour Claude : toutes les règles métier et faits vérifiés,
> au format le plus dense possible. Mis à jour à chaque changement de règle.
> Historique détaillé → STATUT.md. Spec complète → NIVA_DASHBOARD_SPEC.md.

## 🎯 Prochaine étape (08/08 soir → en cours) : LE THÈME
Toute la logique métier/données est réglée pour l'instant (rien en attente
côté calculs, tout ci-dessous est déjà en prod). Badr veut une **refonte
visuelle** — c'est la seule tâche ouverte. **Prototype en cours de
validation** (branche `claude/theme-pour-7ebcne`) : voir statut ci-dessous.

- **Référence donnée par Badr** : capture d'écran de « Floxy » (dashboard
  proxy) — style SaaS clair, sidebar noire épurée, cartes blanches à coins
  arrondis, badges verts, typo sans-serif propre, très pro/fintech.
- **Ce qu'il a dit textuellement** : « ton style ça se voit que c'est
  Claude, je veux un style cool stylé et classe... propose des trucs avec
  des effets sonores et visuels, je veux un truc qui vend, pour que les
  gens kiffent ». Inspiration Floxy, pas copie conforme — une proposition,
  pas un clone.
- **Nouveau thème « Direction C · Clair, sobre, fintech » (globals.css,
  08/08)** : fond blanc cassé (`--color-terminal: #f4f5f7`), cartes
  blanches pleines + ombre douce (`.card-shadow`, plus d'opacité genre
  `bg-panel/40` qui ne fonctionnait qu'sur fond sombre), positif = vert
  (`--color-phosphor: #16a34a`, conforme à la réf Floxy), rouge = négatif,
  **or gardé en accent secondaire** (`--color-phosphor-brand`, logo/badges/
  alertes uniquement — validé par Badr, pas tout misé sur le vert). Police
  Geist Sans (plus mono), gros chiffres en `font-black` très contrasté vs
  labels plus légers (validé par Badr : « sans-serif + gras marqué »). Noms
  de tokens gardés stables (terminal/panel/ink/phosphor/amber/red/cyan)
  pour propager sans retoucher chaque composant, comme les thèmes d'avant.
- **Prototype construit** : Header, BottomNav (devient une pill flottante
  noire en bas — traduction mobile du « sidebar noire » Floxy), layout,
  page Aujourd'hui (TodayBoard) entièrement restylés. Le reste de l'app
  (Mois/Analyse/Créas/Année/Dépenses/Admin + composants partagés type
  EmptyState/DataError/loading) hérite déjà des nouvelles couleurs via les
  tokens mais garde les anciennes bordures/opacités « fond sombre » tant
  que non retouché — à généraliser après feu vert Badr.
- **Effets ajoutés (validé par Badr, réponses du 08/08)** : cartes avec
  léger lift au survol/tap (`.card-interactive`), confettis + son
  `celebrate` (arpège 4 notes) quand le net du jour ≥ cible, sons distincts
  `statusYellow`/`statusRed` (doux, jamais une alarme) et `refreshDone`.
  BootOverlay gardé sombre (splash de ~1,5 s) comme moment de transition
  avant de révéler le dashboard clair.
- **Bug trouvé et corrigé au passage** : BootOverlay pouvait rester bloqué
  à l'écran en dev (`next dev`, React Strict Mode double-invoque l'effet
  mount→cleanup→mount ; la 2e passe relisait sessionStorage déjà écrit par
  la 1re et ne reprogrammait jamais le timer de fermeture). Fix : la
  décision « faut-il booter » est calculée une seule fois (lazy state), pas
  relue dans l'effet à chaque passe. N'affectait pas la prod (`next build`
  n'a pas ce double-invoke), mais bloquait aussi mes captures d'écran.
- **Nom déjà changé en Weft** (08/08) : Header, BootOverlay, `<title>`,
  auth realm. `NIVA_DEMO`/`NIVAFIT` restent en interne (non visibles),
  jamais touchés.
- Rien d'autre en attente de Badr sauf : COGS de la vente NIRA du 07/08
  (118,74 $), qui paie les autres abonnements (Adnane), la question du
  spend Meta avant le 04/06 (voir plus bas) — aucun ne bloque le thème.

## Business
- Kindred LLC / marque Niva (mynivashop.com). 4 stores Shopify ES/UK/DE/FR (FR ≈ 90 % du volume). Compte Meta : act_919559773962419.
- Associés : Adnane (début seul), Badr 50/50 par boutique (ES/UK/DE dès 20/06, FR dès 14/07).
- Badr : non-technique, français, sur téléphone, veut de l'autonomie totale, zéro tolérance aux chiffres faux.

## Produits & prix (mesurés sur vraies commandes)
- **Polo** (principal) : 2 pcs 59,98 € · 4 pcs 89,99 € (pas d'offre 1/3 pcs). Toutes les campagnes SAUF Lancaster.
- **Gilet** (2e principal, lancé 27/07) : 1 pc 49,98 € · 2 pcs 79,98 € · 3 pcs 104,97 €. Campagne dédiée « CBO - LANCASTER » (id 120248705036500495) + sa propre landing.
- **Upsells** (jamais de carte/campagne à eux) : Caleçon (souvent offert), chemises, débardeur, pantalon, short, E-Book. Comptés dans le produit principal de LEUR commande.

## Coûts (grilles officielles = engine.ts, ne jamais approximer)
- COGS Polo €/bundle 1/2/4 pcs : FR 9,23/15,06/26,76 · ES 9,01/14,87/26,53 · DE 9,36/15,18/26,49 · GB 8,02/13,30/23,65 · BE 9,91/16,29/28,99 · IT 9,97/15,91/27,71. Non listé = max +1,50. Hors palier : g2+(g2−g1)×(qty−2).
- COGS Gilet €/bundle 1/2/3 pcs : FR 8,90/17,20/25,55 · GB 8,07/15,64/23,45 · CH 11,25/20,78/30,91 · BE 9,59/18,69/27,77 · DE 8,72/16,94/25,15 · ES 8,90/17,29/25,68 · IT 8,98/17,47/25,94. >3 pcs : g3+(g3−g2)×(qty−3).
- Caleçon €/pièce (grille par pays, 04/08, ex-2,00€ partout) : FR 2,46 · BE 2,74 · ES 2,47 · non listé 4,24 (max+1,50). E-Book : 0 €.
- **Taxe UE** : forfait **3 € par COMMANDE/colis** expédié en UE (pas par produit — confirmé par facture fournisseur du 01/08 : jamais 6/9/12€ même multi-produits, même une commande 100% caleçon est taxée 3€), destination UE seulement (GB/CH/CA/US = 0). Remplace les anciennes règles "3€×produits distincts" (06/07) et "caleçon exempté" (03/08), toutes deux fausses.
- **Frais : 4 % du CA** (Shopify 3 % + autres 1 %). TVA 5,5 % = PAS un coût (27/07), provisionnée à part (onglet Année).
- Net = CA − spend − COGS − taxeUE − frais4 %. Remboursements imputés au JOUR D'ACHAT d'origine.

## Seuils (repères de contrôle)
- Polo : marge contrib ≈ 62 % → ROAS BE ≈ 1,62× · cible 15 % ≈ 2,13×.
- Gilet : marge ≈ 70 % → BE ≈ 1,43× · cible 15 % ≈ 1,98×.
- Dashboard : seuils dynamiques 14 j glissants (jamais figés). Cible = 15 % net (aligné Master 04/08, ex-20 %) : `roasTarget15` = 1/(CM−0,15). Seuils aussi calculés PAR PRODUIT pour les créas (Lancaster→Gilet, sinon Polo).

## Protocole scaling (Master, validé Badr 03/08) — base : moyenne ROAS réel 3 j
- SCALE si moy ≥ cible15 ET santé OK (CTR stable, CVR ±10 %, fréq <2, CPM <+20 %) : <200 €/j +25 % · 200-600 +20 % · 600-1500 +15 % · >1500 +10 %. Max +30 %. CBO fourchette basse. Attendre 48-72 h entre scales. Duplication seulement >1000-1500 €/j très stable.
- HOLD si BE < moy < cible : rien toucher 5-7 j ; plafond ~7 j → nouvelles créas AVANT budget.
- DESCALE si moy < BE : 90-100 % du BE −15 % · 80-90 % −20 % · <80 % −30 %. Jamais −50 %.
- COUPER : 2 fenêtres consécutives < BE sans reprise, OU <70 % du BE avec spend ≫ CPA.
- Cas particuliers prioritaires : campagne <3 j → pas de ROAS (CTR/CPM/CVR) · budget <50 €/j → volume insuffisant · post-scale → 48-72 h sans décision lourde.

## Faits vérifiés (ne pas re-prouver)
- **ROAS Meta du jour J sous-estime fortement** (attribution) — se corrige en 24-72 h (jours anciens matchent Shopify exactement). Piloter au ROAS réel = CA Shopify ÷ spend, via UTM (utmParameters.campaign = ID campagne) **pour le Polo** (plusieurs campagnes en parallèle, UTM = seule méthode possible).
- **Gilet/Lancaster : NE PAS utiliser l'UTM seul** (05/08, Badr) — tant qu'une seule campagne Gilet existe, toute commande contenant un Gilet lui appartient (vérifier les line items, pas le champ UTM). Une partie des commandes perdent leur UTM (pixel/CAPI Meta les trackait quand même via wetracked) — confirmé 04/08 : 2 commandes Gilet sur 3 avaient UTM null, 3 achats Meta = 3 commandes Shopify Gilet à l'euro près. Casse dès qu'une 2ᵉ campagne Gilet est lancée (repasser à l'UTM strict).
- **Polo : correction partielle possible, PAS totale** (05/08, vérifié sur 04/08, 59 commandes) — contrairement au Gilet, 3 campagnes actives tournent en même temps (FRTEST/WORLD/ZOMBIE), donc « 1 commande = 1 campagne » ne marche pas. Deux phénomènes distincts : (1) UTM last-visit perdu comme le Gilet → se corrige PARTIELLEMENT en retombant sur firstVisit (1er clic) SI ET SEULEMENT SI il pointe vers une des 3 campagnes actives ET que lastVisit est vraiment vide (jamais si lastVisit pointe déjà vers une autre campagne active — voir (2)) ; testé sur 04/08 : récupère 3 commandes/59 (2 FRTEST, 1 WORLD) → FRTEST 17/18 Meta (94 %), WORLD 17/21 (81 %), ZOMBIE 11/14 (79 %), mieux qu'avant (15/16/11) mais toujours incomplet. (2) Vrai multi-touch inter-campagnes (~20 % des commandes/jour, ex 04/08 : 12/59) : le client clique sur 2 pubs Polo différentes avant d'acheter — normal dès qu'on fait tourner plusieurs campagnes Polo en parallèle, PAS un bug ; garder le last-touch (convention standard), ne jamais l'écraser par firstVisit. Certaines commandes ne gardent qu'un clic vers une vieille campagne déjà en pause (ex CBO-POLO-WORLDWIDE-FR du 21/06) → non récupérables, la campagne ne tourne plus. Contrairement au Gilet (certitude 100 %, vérifiée 3/3 vs Meta), cette correction Polo reste une ESTIMATION avec marge d'erreur résiduelle — toujours le dire à Badr quand on l'utilise.
- ~20-25 % des commandes = organique (Google/Direct) — jamais attribuées par Meta, normal (part réelle un peu plus basse vu le point UTM ci-dessus).
- **Net par PAYS = indicatif seulement, pas fiable ; le Global est la vérité** (05/08, décision Badr « laisse comme ça »). Le spend est imputé par NOM de campagne (aucune campagne active n'a de marqueur pays autre que FR → 100 % du spend tombe sur FR), alors que les commandes sont réparties par BOUTIQUE Shopify. Conséquence structurelle : les boutiques ES/UK/DE encaissent du CA sans porter de pub → net artificiellement positif (ex. 05/08 : DE +57 € pour 90 € de CA et 0 € de spend), et FR est sous-évaluée d'autant. Le Global et les cartes produit (Gilet+Polo) restent justes au centime. Correctif possible mais NON appliqué (répartition du spend au prorata du CA par boutique) : Badr a tranché pour garder la règle du 29/07 « campagne sans pays = FR ». **Ne pas re-signaler comme un bug.**
- Jours en heure de PARIS (UTC+2 été) — une commande 22h30 UTC = lendemain Paris.
- Quasi 0 client récurrent (22/23 premiers achats sur l'échantillon vérifié).
- GitHub Actions heartbeat réel : toutes les 1-2h30 (pas 5 min — throttling GitHub).

## Infra (résumé)
- Next.js/Supabase/Vercel, branche `claude/kindredm-dashboard-setup-epbxha` (= défaut), auto-deploy. Proxy bloque vercel.app → jamais vérifiable en direct d'ici.
- **⚠️ Plusieurs branches de travail actives en parallèle** (08/08 soir) : cette session bossait sur `claude/theme-pour-7ebcne` pendant qu'une AUTRE session corrigeait un bug de backfill directement sur `claude/kindredm-dashboard-setup-epbxha` (commits « DIAGNOSTIC TEMPORAIRE ») — les deux avaient un ancêtre commun récent (pas un vrai fork ancien), donc fusion sans conflit. **Toujours `git fetch origin <branche-défaut>` avant de conclure qu'une branche est « à jour » ou « à part »** — une comparaison contre un fetch périmé (fait au tout début de session) a fait croire à tort que les deux branches avaient chacune ~50 commits uniques (elles n'en avaient que quelques-uns après un fetch frais). Le lien Vercel de Badr ne se met à jour QUE si le code arrive sur `claude/kindredm-dashboard-setup-epbxha` — un push sur une autre branche ne change rien pour lui, même après un merge local réussi.
- Marqueurs de rattrapage (incrementalSync.ts) : `full_recompute_version` (calcul seul, pas d'API) · `full_resync_version` (re-scan Shopify complet — v7 = taxe forfait 3€/colis + grille caleçon, 04/08) · `meta_resync_version`. La synchro rapide 7 j tourne TOUJOURS d'abord.
- **Facture fournisseur = vérité terrain** : la facture Panda Dropshipping (COGS + taxe réels) fait foi sur nos grilles/hypothèses. Toujours comparer une facture reçue aux grilles engine.ts avant de la valider — a déjà révélé 2 erreurs de modèle (04/08 : taxe forfait, caleçon par pays).
- Onglet Aujourd'hui : cartes par produit Gilet vs Polo — Gilet mesuré (line items + campagnes LANCASTER), Polo = Global − Gilet sur CHAQUE composant (CA/spend/COGS/taxe/frais, pas seulement le spend depuis 05/08) pour garantir Gilet+Polo = Global au centime, y compris sur le Net.
- Mapping campagne→marché : ESP→ES, GE→DE, FR→FR, UK/CANADA/EUROPE/AUS/WORLDWIDE/ANG→UK, **sinon FR par défaut** (29/07). Override manuel prime.
- **Routine 23h05 Paris** (trig_01VoaeW4pHFecyw3fHwTMxUn, cron 0 21 * * * UTC — décaler à l'heure d'hiver fin octobre) : rapport ROAS 3 j par campagne + verdicts protocole Master → Slack (canal type « décision »). Recommande, n'exécute JAMAIS.

## Campagnes exclues du calcul
- **NIRA : spend TOTALEMENT exclu** (Badr, 05/08) — son CA ne remonte pas dans les boutiques Shopify branchées (pas de token), donc compter sa dépense sans sa recette faussait le net à la baisse et tous les ROAS/marges. Exclue rétroactivement (depuis son lancement le 05/08) du net, de l'onglet Analyse, des créas et du journal.
- Mécanique : `isExcludedCampaign()` dans `meta.ts`, filtre par NOM (couvre les futures « CBO 2 - NIRA … »). Appliqué dans `aggregate.ts` (net), `analytics.ts` (insights + créas), `journal.ts` (événements).
- **À l'ajout du CA NIRA** : retirer "NIRA" de `EXCLUDED_CAMPAIGN_KEYWORDS` et rebumper `REQUIRED_RECOMPUTE_VERSION`. Badr veut réintégrer **CA + spend ENSEMBLE**, jamais l'un sans l'autre.

## Frais Shopify réels (06-07/08)
- **Plus aucun taux estimé** : frais LUS par commande via GraphQL (`transactions.fees[]`, shopifyFees.ts). Mesuré : ~6,5 % du CA (traitement 2,70-4,99 % selon carte + change 1,5-3 % car LLC US) + 1 % « autres » conservé. L'ancien 3 % cachait ~4 000 €/mois de coûts.
- **PIÈGE DEVISE (07/08, ~140 €/j de frais fantômes)** : sur une commande payée en devise étrangère (TH/CA/...), `fees[].amount` arrive dans la devise de la TRANSACTION, pas en devise boutique — 100 THB comptés 100 €. Conversion par ratio shopMoney÷presentmentMoney de la transaction. Tout échantillon de validation doit inclure des commandes NON-EUR.
- Frais réels écrits sur J-2→J à chaque synchro (fenêtre courte : la lecture paginée dans le chemin critique gelait le CA, vu le 06/08). Jours plus anciens : repli 3 % par commande tant que non re-scannés.
- **Sonde de diagnostic** : `GET /api/admin/day-aggregates?day=YYYY-MM-DD` (read-only) — lignes brutes + contrôle d'identité net=CA−spend−COGS−taxe−frais. Appelée par le workflow fix-products-map (step 4bis). C'est elle qui a trouvé le piège devise. En cas de « chiffres bizarres » : la lire AVANT de spéculer.

## Produits en TEST (convention Badr, 07/08)
- **Mot-clé « PRODTEST » dans le nom de campagne** = produit en test → son spend sort automatiquement du calcul Polo/Gilet et atterrit dans la carte **🧪 Testing** de l'onglet Aujourd'hui. Rien d'autre à faire côté Badr. (« TESTING » seul est inutilisable comme marqueur : toutes les campagnes du compte le portent déjà.)
- Produit testé SANS boutique Shopify branchée : CA/COGS saisis à la main (manualRevenue.ts, clé produit à ajouter dans TESTING_PRODUCT_KEYS d'analytics.ts).
- **NIRA (test 05→07/08, Canada) : ARRÊTÉ le 07/08** — campagne active mise en pause via l'API Meta sur demande Badr, produit jugé non rentable (~508 € de spend, 110 € de CA, net ≈ −430 €). **Historique CONSERVÉ** : argent réellement dépensé, l'effacer aurait gonflé le bénéfice — la carte Testing s'efface seule les jours sans spend ni vente. Le mot-clé NIRA reste dans TESTING_CAMPAIGN_KEYWORDS et le mapping NIRA→CA reste en place pour l'historique.

## Charges fixes mensuelles (08/08, PDF Adnane)
- Liste dans `subscriptions.ts` (source unique) : équipe (Jeremy/Seif 1500 $ fixes chacun + Monteur 650 $ + Marwa 300 €), apps Shopify (SmartSize 287,49 € « URGENT à enlever » — compté tant que non résilié, CWILL, Moon Bundles), outils (WeTracked, Klaviyo, Higgsfield ×2, Eleven ×2, Claude Adnane, Vmake, Workspace), crédit −88 €. Total ≈ 4 225 €/mois ≈ 139 €/jour ≈ 50 700 €/an. USD au taux figé 1,1539.
- **Déduites du NET GLOBAL uniquement**, étalées par jour (mensuel ÷ 30,44), depuis le 04/06 (dates de début réelles inconnues — approximation signalée). Cartes pays et produit HORS charges (elles somment au global avant charges) — affiché explicitement dans le Live.
- **Partage charges : 100 % Adnane avant le 14/07, 50/50 dès le 14/07 inclus** (règle Badr, distincte du partage par boutique) — appliqué jour par jour, tous les jours calendaires (un abonnement se paie aussi les jours sans vente).
- Réponses Badr (08/08 soir) : commission Jeremy/Seif **oubliée pour le moment** · Google Ads **non, pas pour le moment** · Klaviyo fixé à **25 €/mois** (« tu la mets à 25 € », compris comme le prorata emailing — interprétation SIGNALÉE) · **Claude Badr 100 €/mois** ajouté (payé perso par Badr) · TrendTrack 25 € ajouté. Total ≈ 4 245 €/mois.
- **Dates réelles (Badr 08/08 soir) : Seif 15/07 · Jeremy (= l'« emailing » du prorata) 16/07 · Claude Badr abo 1 15/07, abo 2 08/08.** Le reste (Monteur, Marwa, apps, outils) reste au défaut 04/06 — approximation toujours signalée.
- **Colonne « Charges » ajoutée au tableau jour par jour de l'onglet Mois** (Global uniquement) + Σ mois : abonnements étalés + frais ponctuels, déjà déduits du Net affiché.

## Entre associés — tracé (08/08)
- Source unique : `associateLedger.ts` + champ `paidBy` de subscriptions.ts. Affiché dans Année, section 🤝. Règle : ce que l'un paie de sa poche pour la société lui est dû au règlement ; les transferts entre eux sont HORS P&L.
- **Frais LLC (Corporate Filings, 21/06) : 518,34 € payés par Badr** (325+142+125 $ — EUR figés du relevé bancaire, capture 08/08). Déduits du net global LE 21/06 (frais ponctuel, pas étalé). **Partage 50/50** (décision Badr : « ça nous a servi pour lancer le 14/07 ») — chaque frais ponctuel porte SA règle (`badrShare`), indépendante de la règle par date. Badr a tout payé → 259,17 € lui sont dus au règlement.
- **Avance 1 000 € Badr → Adnane le 21/06** : transfert, ne touche jamais le net.
- **Claude Badr : UN SEUL abonnement à 100 €/mois depuis le 15/07.** Piège de vocabulaire : « le 1er / le 2e abonnement » chez Badr = les FACTURES mensuelles successives — compté 2 abonnements (200 €/mois) par erreur le 08/08, corrigé sur sa remarque le jour même. **Seule la 1re facture (15/07, 100 €) est sortie de sa poche** — dès la 2e (08/08) la CARTE LLC paie → son compteur d'avances Claude reste à 100 € (sauf nouvelle facture perso annoncée). Le tracé « Entre associés » compte les FACTURES réelles (SUB_PAYMENTS), jamais un cumul théorique — un cumul accru depuis le 04/06 affichait 217 € vs 100 € réellement payés, corrigé sur remarque de Badr.
- **Hushed (Adnane) : 7,99 €/mois.** Payé perso par Adnane juillet + août (2 mois, 15,98 € tracés dans SUB_PAYMENTS), carte LLC à partir de septembre (3e mois) — même schéma que Claude Badr. Mois de départ juillet assumé (cohérent avec « depuis 2 mois » dit le 08/08), signalé.
- **Solde net appliqué (08/08)** : `badrNetLedgerCentsForDay` (associateLedger.ts) + `applyAssociateLedger` (associates.ts) font remonter le solde entre associés dans les cartes mensuelles/annuelles de l'onglet Année, sur la VRAIE date de chaque avance (jamais un mois choisi au hasard) — ne touche jamais `netCents` (société), seulement le partage Badr/Adnane. Ne pas confondre avec `applyFixedCharges` (partage normal des charges, déjà correct, distinct du solde d'avance).
- **Crédit −88 €/mois retiré (08/08)** : Badr a clarifié qu'il ne finance QUE l'abonnement Shopify de base (pas les apps listées ici) → l'appliquer en remise sur les apps aurait sous-compté les charges à tort.
- **Floxy (proxy, 7 $/mois, depuis 08/2026) et Master Ecom/Skool (249 $/mois, depuis 26/07)** ajoutés — tous deux payés directement par la carte LLC (aucune avance perso à tracer).
- Question posée : qui paie les autres abonnements pour tracer leur côté pareil.

## Onglet Dépenses — réorganisation (08/08)
- Abonnements & charges fixes + Entre associés ont DÉMÉNAGÉ depuis l'onglet Année (qui reste concentré sur le bilan/parts mensuelles). Rangement demandé par Badr, « minimum d'onglet ».
- `buildExpenseBreakdown` (data.ts) : le split fictif « Shopify 3 % / Autres 1 % » (reliquat d'avant les vrais frais Shopify) est retiré → un seul poste « Frais Shopify réels » au pourcentage RÉEL calculé (jamais figé). Bug repéré par Badr le 08/08.
- **Nouveau : CA par canal** (donut Google/Meta/direct/autres, `getAcquisitionForRange` dans data.ts, route `/api/acquisition-summary`) + **carte Klaviyo** (CA attribué aux campagnes email uniquement, jamais les flows/BIENVENUE15, `lib/klaviyo.ts` + route `/api/klaviyo/summary`) — les deux sont des mesures INDÉPENDANTES, jamais additionnées (une vente email peut apparaître « Direct » côté Shopify).
- **Clé Klaviyo** : Badr l'a donnée en chat (`pk_SWVS8q_...`) — JAMAIS commitée dans le code (fuiterait dans l'historique Git). Lue via `process.env.KLAVIYO_API_KEY`, à ajouter dans Vercel. Le réseau sortant de cette session de code n'a pas accès à `a.klaviyo.com` (politique de l'environnement) → l'intégration n'a JAMAIS été testée en conditions réelles, le premier vrai test se fait au déploiement. En cas d'erreur/schéma inattendu la fonction lève une exception explicite plutôt que de renvoyer un chiffre inventé.
- Section « 💡 Pistes d'économies » ajoutée (SmartSize, Moon Bundles, Jeremy/Seif).
- **Charges fixes dans le donut (08/08)** : `buildExpenseBreakdown(t, fixedCostsCents)` prend maintenant les charges de la période en 2e paramètre — sur GLOBAL, `netCents` les avait déjà déduites en silence, sans jamais apparaître nulle part dans le macaron (repéré par Badr). Tranches somment exactement au CA désormais. Marchés/produits restent hors charges (0 passé).
- **Onglet Contrôle retiré de la nav (08/08)** : le bloc remboursements/rétrofacturations ne servait plus à rien (remboursements déjà automatiques, rétrofacturations en attente de permission Shopify). `ControlBoard.tsx` supprimé. La page `/controle` reste UNIQUEMENT pour affecter une campagne Meta neuve à un marché (lien direct depuis le bandeau ⚠️ du Live) — Badr sait qu'il devra repenser aux rétrofacturations plus tard (permission `read_shopify_payments_disputes` à activer côté Shopify).

## Historique Shopify depuis le 21 mai (08/08)
- **HISTORY_START passe de 2026-06-04 à 2026-05-21** (« l'ecom a démarré à partir du 21 mai », Badr) — data.ts, backfillRun.ts (ORDERS_SINCE_DAY), discover.ts (BACKFILL_SINCE_ISO), incrementalSync.ts (fenêtre de recompute).
- `REQUIRED_FULL_RESYNC_VERSION` bump → v10, déclenche un re-téléchargement complet des commandes Shopify au prochain sync pour aller chercher le 21/05→03/06 jamais téléchargé.
- **Réponse Badr (08/08) : les abonnements ont AUSSI commencé « depuis le début »**, sauf WeTracked (démarré après, vraie date inconnue). `START_DEFAULT` passe à 21/05 dans subscriptions.ts ; WeTracked garde l'ancien 04/06 en approximation signalée, en attendant sa vraie date.
- **⚠️ Spend Meta AVANT le 04/06 : trouvé réel, remonte au moins à mars** (vérifié via l'API Meta le 08/08) : ~2 188 € en mars, ~1 700 € début avril, spend quasi continu ensuite jusqu'au 21/05. META_SINCE_DAY (backfillRun.ts) **PAS changé** — trop d'argent et d'incertitude (campagnes de test ? pré-lancement ?) pour l'intégrer sans confirmation explicite de Badr sur ce que représente ce spend et depuis quelle date réelle le compter.
- **CAUSE TROUVÉE (08/08 soir) : le backfill des commandes du 21/05→03/06 ne remontait jamais, et ce n'était PAS un bug d'écriture.** Diagnostic temporaire dans `backfillOrders()` (retiré une fois la cause confirmée) : `fetchedCount` = `rows.length` à chaque fois (rien perdu à l'écriture Supabase) mais `minDay` fetché = **2026-06-09 pile** pour FR (06-17/06-22 pour ES/UK/DE) malgré `createdAtMin=2026-05-21`. 2026-06-09 = exactement 60 jours avant le test (08/08) → c'est la limite standard de l'API REST Shopify `orders.json` : sans le scope protégé **`read_all_orders`**, Shopify ne renvoie JAMAIS de commande de plus de 60 jours, SANS erreur (d'où le backfill qui « réussissait » à chaque fois avec 0 warning). **Fix définitif = demander le scope `read_all_orders`** dans Shopify Admin → Apps → app personnalisée → API access scopes (même famille de blocage que `read_shopify_payments` pour les rétrofacturations) ; Badr seul peut l'accorder. Une fois accordé, un simple re-backfill ira chercher l'historique réel et remplacera le comblement manuel ci-dessous automatiquement (règle de fusion par `savedAt` dans manualRevenue.ts — pas besoin d'y retoucher).
- **COMBLEMENT APPLIQUÉ (08/08 soir)** : Badr a donné le total CA FR de la période — **8 338 €** (chiffre Adnane) — avec instruction explicite de le répartir également sur les 14 jours (21/05→03/06) sans calcul plus fin (« tu la réparties sur les jours équitablement et basta »). Ajouté dans `manualRevenue.ts` (`GAP_FILL_MAI_JUIN`, réutilise le mécanisme NIRA) : ~59 557-59 558 €/jour de CA en marché FR. **COGS/taxe UE/frais Shopify NON calculés** (pas de détail par commande fourni) → Net de ces 14 jours légèrement SURESTIMÉ, signalé ici et dans le code. Nombre de commandes/jour inconnu → `orders:0` sur ces entrées (n'affecte que le compteur de commandes affiché, pas le CA/Net). `full_recompute_version` bumpé (v10) pour faire apparaître ces entrées sans appel API.

## Rebranding « rues parisiennes » (05/08)
- Titres Shopify FR renommés : **Le Polo Marceau** (POLO) · **Le Gilet Sully** (GILET) · **La Chemise Turenne** (SHORT_SLEEVE) · **Le Pantalon Rivoli** (DRESS_TROUSERS) · **Le Short Cassini** (CHINO_SHORTS). Mêmes produits, mêmes grilles COGS — seuls les titres changent.
- Le moteur mappe par **titre EXACT** (products_map) : tout renommage Shopify sort les ventes du comptage tant que le nouveau titre n'est pas chargé. Réflexe à avoir à CHAQUE renommage : ajouter la ligne dans products_map + bumper `REQUIRED_FULL_RESYNC_VERSION`.
- **Caleçon : jamais mappé depuis le début** (découvert 05/08) → COGS compté 0 € sur tout l'historique alors qu'il est offert dans une grosse part des commandes → Net légèrement SURESTIMÉ depuis le 04/06. Mapping FR + ES chargé le 05/08, resync v8 déclenchée pour corriger l'historique.

## Conventions
- Jamais de chiffre inventé ; en cas de doute, le dire. Toute erreur trouvée = la corriger partout (code + spec + STATUT.md + ce MEMO).
- Montants en centimes (integers) dans le code. Tests fixtures §8 = validés au centime, ne jamais casser.
- UI française, ton simple pour non-technique, emojis par section.
