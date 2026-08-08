# MEMO — contexte compact NIVA (à lire en 1er, évite de re-dériver)

> Fichier de travail pour Claude : toutes les règles métier et faits vérifiés,
> au format le plus dense possible. Mis à jour à chaque changement de règle.
> Historique détaillé → STATUT.md. Spec complète → NIVA_DASHBOARD_SPEC.md.

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
- Question posée : qui paie les autres abonnements (Adnane ?) pour tracer son côté pareil.

## Rebranding « rues parisiennes » (05/08)
- Titres Shopify FR renommés : **Le Polo Marceau** (POLO) · **Le Gilet Sully** (GILET) · **La Chemise Turenne** (SHORT_SLEEVE) · **Le Pantalon Rivoli** (DRESS_TROUSERS) · **Le Short Cassini** (CHINO_SHORTS). Mêmes produits, mêmes grilles COGS — seuls les titres changent.
- Le moteur mappe par **titre EXACT** (products_map) : tout renommage Shopify sort les ventes du comptage tant que le nouveau titre n'est pas chargé. Réflexe à avoir à CHAQUE renommage : ajouter la ligne dans products_map + bumper `REQUIRED_FULL_RESYNC_VERSION`.
- **Caleçon : jamais mappé depuis le début** (découvert 05/08) → COGS compté 0 € sur tout l'historique alors qu'il est offert dans une grosse part des commandes → Net légèrement SURESTIMÉ depuis le 04/06. Mapping FR + ES chargé le 05/08, resync v8 déclenchée pour corriger l'historique.

## Conventions
- Jamais de chiffre inventé ; en cas de doute, le dire. Toute erreur trouvée = la corriger partout (code + spec + STATUT.md + ce MEMO).
- Montants en centimes (integers) dans le code. Tests fixtures §8 = validés au centime, ne jamais casser.
- UI française, ton simple pour non-technique, emojis par section.
