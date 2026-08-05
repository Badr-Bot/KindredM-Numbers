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
- Jours en heure de PARIS (UTC+2 été) — une commande 22h30 UTC = lendemain Paris.
- Quasi 0 client récurrent (22/23 premiers achats sur l'échantillon vérifié).
- GitHub Actions heartbeat réel : toutes les 1-2h30 (pas 5 min — throttling GitHub).

## Infra (résumé)
- Next.js/Supabase/Vercel, branche `claude/kindredm-dashboard-setup-epbxha` (= défaut), auto-deploy. Proxy bloque vercel.app → jamais vérifiable en direct d'ici.
- Marqueurs de rattrapage (incrementalSync.ts) : `full_recompute_version` (calcul seul, pas d'API) · `full_resync_version` (re-scan Shopify complet — v7 = taxe forfait 3€/colis + grille caleçon, 04/08) · `meta_resync_version`. La synchro rapide 7 j tourne TOUJOURS d'abord.
- **Facture fournisseur = vérité terrain** : la facture Panda Dropshipping (COGS + taxe réels) fait foi sur nos grilles/hypothèses. Toujours comparer une facture reçue aux grilles engine.ts avant de la valider — a déjà révélé 2 erreurs de modèle (04/08 : taxe forfait, caleçon par pays).
- Onglet Aujourd'hui : cartes par produit Gilet vs Polo (spend Polo = tout sauf LANCASTER, UNMAPPED inclus).
- Mapping campagne→marché : ESP→ES, GE→DE, FR→FR, UK/CANADA/EUROPE/AUS/WORLDWIDE/ANG→UK, **sinon FR par défaut** (29/07). Override manuel prime.
- **Routine 23h05 Paris** (trig_01VoaeW4pHFecyw3fHwTMxUn, cron 0 21 * * * UTC — décaler à l'heure d'hiver fin octobre) : rapport ROAS 3 j par campagne + verdicts protocole Master → Slack (canal type « décision »). Recommande, n'exécute JAMAIS.

## Conventions
- Jamais de chiffre inventé ; en cas de doute, le dire. Toute erreur trouvée = la corriger partout (code + spec + STATUT.md + ce MEMO).
- Montants en centimes (integers) dans le code. Tests fixtures §8 = validés au centime, ne jamais casser.
- UI française, ton simple pour non-technique, emojis par section.
