# RÈGLES — le média-buying de la formation Master, distillé

> Distillation opérationnelle du corpus (`transcriptions/`, `notes/`, board
> `PROTOCOLE-DECISION.md`). Chaque règle est sourcée **leçon + timestamp** ;
> chaque conflit entre leçons est **signalé** avec son arbitrage (jamais de
> mélange silencieux — règle d'`ARBITRAGES.md`). Les décisions propres à Badr
> sont marquées `[arbitrage Badr JJ/MM]` et priment.
>
> **Statut (21/08)** : sections 1-5 distillées par agents depuis le corpus,
> citations issues des passages vérifiés pendant l'audit des 20-21/08 ; la
> passe de re-vérification systématique a été interrompue (limite de dépense)
> — en cas d'enjeu, rouvrir la transcription citée avant d'exécuter. Section 6
> rédigée directement sur les sources T38 / CI-23 / T36 (vérifiées ligne à
> ligne le 21/08).
>
> Ce qui n'est pas chiffré par la formation est marqué « (la formation ne
> chiffre pas) » — ne jamais combler ces trous par un chiffre inventé.

---

## 1 · Les trois phases (board = PROTOCOLE-DECISION.md, source canonique)

### Identifier la phase — AVANT tout conseil, interdiction de mélanger
- **Identifie la phase avant de répondre** : TESTING PRODUIT = nouveau produit, J0→J10 · PRÉ-SCALING = produit validé, < ~3 000 €/j de spend · SCALING = ~3 000 €/j et plus (board, en-tête « AVANT TOUT CONSEIL »).
- **La bascule pré-scaling → scaling est à 3 000 €/j de spend, pas avant** : « dès que les 3K par jour sont atteints, là on passe en phase de scaling ; avant ça, on n'est pas en phase de scaling » (T35 [05:39] ; T34 [01:54]).
- **N'applique JAMAIS le protocole d'une phase à une autre** — « trois phases distinctes, trois protocoles différents, ne jamais les mélanger » ; en cas de doute, demande à Badr de quelle phase il parle (board, en-tête + piège du 16/08).
- **Ne confonds pas testing PRODUIT et testing CRÉA** : §1 lance un produit (6-15 vidéos + 6-15 statics, CBO 100-300 €, décision 48 h) ; le processus de testing créa (leçon 36 : 3-6 ads par adset, plancher 10-15 €/j) injecte un batch dans un compte qui tourne déjà — sous 3 000 €/j tout se joue dans la CBO, l'ABO testing dédiée (~20 % du budget) n'arrive qu'à 3K+/j (board, piège 16/08 ; T36 [02:07]).
- **Lis « rentable » au backend (profit réel / MER), jamais au ROAS Meta seul** (board, rappels ; T35 [02:39-03:00]).
- **Calcule BE ROAS et cible 15 % PAR PRODUIT, tous coûts inclus** — COGS + livraison + taxe + frais de paiement + effet des codes promo ; le piège n°1 est de ne compter que le coût produit (board, rappels ; T38 [00:45]).
- **Décide sur des jours complets, entre 00 h et 01 h (Paris), jamais sur le jour en cours** (board, rappels ; T35 [19:09]). [arbitrage Badr 18/08] Le dashboard juge la fenêtre « jour même + la veille » avec bascule à 7 h : de 00 h à 7 h on exécute sur la fenêtre figée de la veille ; à partir de 7 h on lit hier+aujourd'hui en live (l'attribution du jour sous-estime, la marge ne peut que monter).

### Phase 1 — TESTING PRODUIT (J0 → J10) — board §1
- **Ne lance qu'un marché validé** : compétiteur qui scale, stade de sophistication abordable, audience pas trop nichée, angle clair, demande prouvée (board §1).
- **J0** : copy-mine 6-15 ads vidéo + 6-15 ads static, offre et landing inspirées d'un compétiteur, funnel contrôlé par un achat test (board §1 ; T35 [01:33]).
- **J1-2** : lance une CBO 100-300 € et attends 48 h sans toucher (board §1 ; T35 [01:54-02:15] ; T34 [01:32] : « 300 c'est ok sur US, 100 c'est peut-être pas assez »).
- **J2 — question pivot** : rentable au backend sur les 2 jours ? OUI → §2 pré-scaling ; NON → sauvetage (board §1).
- **J3-5 — sauvetage, cadran « où ça fuit ? »** : bon CVR + mauvais CPC → créa/hook (nouvelles créas, nouveaux angles, nouveaux mécanismes) · mauvais CVR + bon CPC → LP/offre (revoir le funnel, above the fold, objections, Microsoft Clarity ; bonus : créas) · marge faible → AOV (upsell, email, nouveau bundle) · mauvais CPC ET mauvais CVR → big swing direct, « on change tout direct », dès J3 (board §1 ; T35 [06:47-09:15], [11:21]).
- **J5 (J4 si budget serré)** : rentable ou nette amélioration ? OUI → §2 ; NON → big swing (board §1 ; T35 [09:56]).
- **J6-10 — big swing** : refais l'analyse marketing (concurrents + marché), nouvelle LP + nouvelle offre, continue d'injecter des créas, teste nouveaux angles et mécanismes — si un compétiteur scale et pas toi, c'est que tu fais une erreur : on corrige, on ne coupe pas encore (board §1 ; T35 [10:17-10:59]).
- **J7-J10 — fenêtre max** : toujours pas rentable → KILL, produit suivant, idéalement similaire (board §1 ; T35 [11:21] « on coupe »).

### Phase 2 — PRÉ-SCALING (< 3 000 €/j) — board §2
- **Pose chaque jour LA question binaire** : « rentable au backend sur les 2 derniers jours, marge ≥ 15 % ? » (board §2 ; T35 [03:22-03:44]).
- **⚠️ Conflit** : T24 [17:15] (« on ne réduit qu'en perte ; 0-10 % stabiliser ; 10-15 % petit scale ») NE s'applique PAS sous 3 000 €/j — son barème appartient au régime scaling, et le board interdit de mélanger les phases (T35 [05:39]). Conséquence : une fenêtre au-dessus du BE mais sous 15 % de marge est un NON et consomme un cran. [arbitrage Badr 19/08 : « T24 fait foi » — rescopé au seul régime ≥ 3 000 €/j le 20/08 après l'import du board]
- **Si OUI → monte sur l'échelle 500 → 750 → 1000 → 1500 → 1850 → 2250 → 3000** et ajoute de nouvelles créatives à CHAQUE montée, obligatoire (board §2). ⚠️ Conflit : l'audio T35 [05:18] dit « 1800, 2000 » — déformation Whisper ; le board (schéma exporté le 16/08) gagne.
- **×2 si le budget est petit, +20-30 % en approchant de 3 000** (board §2). [arbitrage Badr 18/08] < 500 €/j → ×2 plafonné à 500 ; ≥ 500 → palier par palier. Le ×2 à bas budget est voulu : « ça sert à rien de mourir entre 300 et 500 à monter à hauteur de 20-30 % » (T34 [09:59]).
- **Si NON → escalier de descente, jamais brutal, 4 crans** : cran 1 = attendre 24 h et reposer la question · crans 2 et 3 = réduire le budget de 10-15 % (board §2 ; [arbitrage Badr 18/08] un seul chiffre : −15 %) + ajouter de nouvelles créatives, attendre 24 h · cran 4 = repartir en sauvetage, cadran CPC/CVR du §1 (board §2). Un OUI à n'importe quel cran → on remonte, compteur à zéro.
- [arbitrage Badr 18/08] **Le cran 1 compte même si aucun budget n'a bougé** : l'attribution de la fenêtre se remplit en 24-72 h, et sans ça une campagne qui glisse sous 15 % sans être touchée ne serait jamais réduite.
- [arbitrage Badr 18/08] **La série de NON ne démarre qu'au premier vrai mouvement de budget lu sur Meta**, et le sauvetage exige au moins une réduction réellement exécutée (sinon verdict plafonné à DESCALE).
- **Garde un plancher de 100 €/j pendant toute la phase** (board §2 note « 100 $ » ; T35 [04:29] « 100 euros » — le dashboard applique 100 €/j).

### Phase 3 — SCALING (≥ 3 000 €/j) — board §3
- **Question d'entrée, une fois par jour** : « on atteint les KPI cible ? », lue sur les 3 derniers jours + hier, en phase ascendante — un seul bon jour hier ne suffit pas (board §3 ; T35 [12:50-13:11]).
- **Si OUI → vérifie l'attribution** : plus de 70 % de la perf vient du click-based ? OUI → augmente de +20 % (ou +100 % si tu es à 100 % au-dessus du KPI), selon la table de marge ; NON → attends encore 24 h (board §3 ; T35 [13:11-13:33], [15:45]).
- **Table de marge** : 0-10 % → ne rien faire (stabiliser) ou descale 10 % légèrement · 10-15 % → hold (scale max 10-20 % ; T24 : « on augmente un petit peu » — la formation ne chiffre pas ce « petit peu ») · 15-30 % → scale 20-30 % · 30 %+ → scale 40-100 %, doubler si ROAS fantastique, « et tant que c'est bien, je double » (board §3 ; T24 [17:15-17:36]).
- **⚠️ Conflit (tranché)** : T35/board « sous 15 % = NON → escalier » vs T24 « on ne réduit qu'en perte » — en régime scaling, T24 gagne (leçon 2026 > processus 34-38, ARBITRAGES §2) : au-dessus du BE on ne descend pas, et un seul jour en perte ne déclenche rien — « un jour en rouge, on descend ? c'est la meilleure manière de faire du yo-yo », il faut 2 jours consécutifs (T24 [16:54]). [arbitrage Badr 19/08, « ne plus rouvrir ce débat sans une nouvelle demande »]
- **Si NON mais AU-DESSUS du KPI breakeven** : ne rien faire, stabiliser (board §3).
- **Si SOUS le breakeven** : attends 72 h (tant qu'elles ne sont pas écoulées → attends encore 24 h), puis baisse le budget de 10-15 % (board §3 ; T35 [16:08-16:29]).
- **Si tu es déjà au spend quotidien minimum → repars en sauvetage SANS baisser le spend** (board §3 ; T35 [17:33]). Le minimum est relatif au compte — ex. redescendu à ~300 depuis 3K (T35 [16:51]) — (la formation ne chiffre pas de plancher absolu en scaling).
- **Continue d'injecter des créas en permanence, même en scaling** (T35 [18:27-18:48]).
- **Fin de journée : SOP scaling terminé, on revient demain** (board §3).

---

## 2 · Bouger un budget

### Mouvements de budget — la lecture avant tout mouvement

- Lis la rentabilité **au backend** (MER / profit réel dans la poche, tous coûts variables inclus), jamais au ROAS Meta seul (board, Rappels transverses ; T35 [02:39] « c'est pas rentable avec votre ROAS, c'est vous êtes rentable dans votre poche » ; T34 [10:39] ; T24 [01:29]).
- Juge sur la fenêtre des **2 derniers jours complets** — **3 jours si c'est vraiment instable** (T24 [16:32] ; board §2) ; jamais sur un seul jour (T32 [00:22]) et jamais sur le jour en cours (board, Rappels transverses).
- En régime scaling (≥ 3 000 €/j de spend), la fenêtre devient « **les 3 derniers jours + hier** », en phase ascendante (board §3 ; T35 [12:50-13:11]).
- Juge les dernières fenêtres, jamais le cumul dépensé depuis le lancement (T34 [09:17]).
- La question pivot du pré-scaling est **binaire** : « rentable au backend sur les 2 derniers jours, **marge ≥ 15 %** ? » — OUI = monter, NON = escalier de descente (board §2 ; T35 [03:22-03:44]).

### Monter le budget (pré-scaling, < 3 000 €/j)

- Monte palier par palier sur l'échelle **500 → 750 → 1000 → 1500 → 1850 → 2250 → 3000** (board §2).
  - ⚠️ Conflit : l'audio T35 [05:18] dit « 1800, 2000 » — déformation Whisper ; le board Whimsical (export PDF 16/08, validé Badr, source canonique) gagne : **1850 → 2250**.
- **×2 si le budget est petit** (board §2 ; T35 [05:18]) — « petit » : (la formation ne chiffre pas) ; [arbitrage Badr 18/08] petit = < 500 €/j, et le ×2 est **plafonné à 500**.
- Le pourquoi du ×2 : à bas spend, Meta n'ouvre qu'un pool d'audience à peine plus grand — « ça sert à rien de mourir entre 300 et 500 à monter de 20-30 % » ; le risque d'ouverture massive de pools n'existe qu'à partir de 3 000 (→ 10 000), donc à bas budget sois agressif (T34 [09:59-10:19]).
- **+20-30 % quand on approche de 3 000** (board §2 ; T35 [05:18] « +30 % si vous êtes près des 3000 ») — « approche » : (la formation ne chiffre pas).
- Si le ROAS chute un peu, prends un palier intermédiaire et monte petit à petit ; si tout est parfait, monte rapidement — le but est d'atteindre 3 000 €/j de spend le plus vite possible (T35 [05:39]).
- [arbitrage Badr 18/08] Au-delà du dernier palier : **+30 %** (à 3 000 €/j la formation bascule de toute façon en régime scaling, T35 [05:39]).
- **Ajoute de nouvelles créatives à chaque montée** — obligatoire (board §2 ; T35 [05:39]).
- Monte le budget de **la** campagne unique ; ne duplique jamais la campagne pour « monter » (T34 [11:00-11:20] ; plafond 2-3 campagnes par SKU, T41 [10:50-11:11]).

### Descendre le budget (pré-scaling) — l'escalier, jamais brutal

- **1er NON : ne touche à rien, attends 24 h** (board §2, cran 1) — un seul jour rouge ne déclenche jamais de baisse : « un jour en rouge, on descend ? c'est la meilleure manière de faire du yo-yo » ; on ne désescale qu'après 2 jours consécutifs (T24 [16:54]).
  - [arbitrage Badr 18/08] Le 1er NON compte même si aucun budget n'a bougé (l'attribution se remplit en 24-72 h, et sinon une campagne qui glisse sous 15 % sans être touchée ne serait jamais réduite).
- **2e et 3e NON : réduis de 10-15 % + ajoute de nouvelles créatives**, attends 24 h, repose la question (board §2, crans 2-3) — [arbitrage Badr 18/08] un seul chiffre en exécution : **−15 %**.
- **4e NON : phase de sauvetage** — on arrête de baisser, on diagnostique où ça fuit (board §2 → §1).
  - [arbitrage Badr 18/08] La série de NON ne compte qu'à partir du premier vrai mouvement de budget lu sur Meta, et le sauvetage exige au moins une réduction réellement exécutée — sinon on reste au cran réduction.
  - [arbitrage Badr 19/08] Départ officiel du comptage : 19/08 — aucune fenêtre close avant ne compte dans une série.
- **Plancher : 100 €/j minimum** pendant tout le pré-scaling (board §2 ; T35 [04:29]) ; **75 €/j « max des max »**, jamais 25-50 (T35 [04:57]).
- ⚠️ Conflit (entre BE et 15 % de marge) : T24 [17:15] traite 0-10 % en « stabiliser » et 10-15 % en petit scale ; le board §2 est binaire (< 15 % = NON → escalier) et gagne **sous 3 000 €/j** — le board interdit de mélanger les trois phases, et les bandes de T24/T35 [15:03] appartiennent au régime scaling. [arbitrage Badr 19/08, recadré 20/08 par le board : bandes de marge réservées au ≥ 3 000 €/j.]

### Régime scaling (≥ 3 000 €/j de spend)

- KPI cible atteints ET **> 70 % de la perf en attribution click-based** → monte de **+20 %** (ou **+100 %** si tu es à 100 % au-dessus du KPI) ; attribution pas assez click-based → attends encore 24 h (board §3 ; T35 [13:33], [16:08]).
- Table de marge : **0-10 %** ne rien faire (ou désescale ~10 % léger) · **10-15 %** hold (scale max 10-20 %) · **15-30 %** scale +20-30 % · **30 %+** scale +40-100 %, doubler si ROAS fantastique — « et tant que c'est bien, je double » (board §3 ; T35 [15:03-15:45] ; T24 [17:15-17:36]).
- Au-dessus du break-even mais sous la cible : **ne rien faire, stabiliser** (board §3).
- Sous le break-even : attends **72 h** avant la première baisse, puis **−10-15 %** par jour (board §3 ; T35 [16:08-16:51]).
- Arrivé au spend quotidien minimum : **ne baisse plus, repars en sauvetage** (board §3 « ⚠️ NE PAS baisser le spend » ; T35 [17:33]) — le chiffre exact de ce minimum : (la formation ne chiffre pas — T35 [17:12] évoque juste redescendre vers 300 puis 100 $).
- Plafond de campagne (fréquent entre 3 et 5 K) : passe-le en montant doucement de **+100-250 $, une à deux fois par jour** (T24 [17:57]).
- ⚠️ Conflit : T32 [03:19] dit « scaler de 50-100 % d'un coup peut casser le learning, idéalement des paliers de 20 % » — les +40-100 %/×2 du board §3 et de T24 [17:36] gagnent (plus récents, et conditionnés à 30 %+ de marge et une attribution saine) ; le palier ~20 % reste le défaut hors de ces conditions.

### Cadence, timing et hygiène d'exécution

- Décide et exécute **chaque jour entre minuit et 1 h** (heure de Paris), sur jours complets — c'est là que la data est stabilisée et que Meta apprend de ton signal (content/pas content) (board, Rappels transverses ; T24 [16:11] ; T35 [19:09]) ; à défaut, règles automatiques (T24 [16:11]).
  - [arbitrage Badr 18/08] Plage d'exécution élargie **00 h-7 h**, jugée sur la fenêtre avant-hier + hier (le dashboard reste figé dessus jusqu'à 7 h) ; un adset se met live dans la même fenêtre 00 h-7 h (T36 [03:59]).
- **Une seule variable corrective à la fois, jamais deux le même jour** (budget OU bid OU refonte créa/LP) (Quadrants MASTER Marketing — ressources-google 03, étape 05 ; T32 [04:01] « on ne modifie pas les deux d'un coup »).
- Laisse **48-72 h pour mesurer l'impact** d'une action corrective avant la suivante (Quadrants MASTER Marketing, étape 05) — la boucle budget du protocole, elle, est quotidienne (board §2).
- Ne coupe jamais une campagne avant **3 jours** de data (T32 [02:38]).
- [arbitrage Badr 18/08] Le protocole maison du 03/08 (paliers +25/+20/+15/+10 %, HOLD 5-7 j, −15/−20/−30 %) est **obsolète** : leçon 35 + board font foi — ne plus jamais s'en servir.

---

## 3 · Testing créa — batchs, adsets, réglages

### Testing CRÉA — le processus complet (T36/T37 + playbook post-Andromeda)

> ⚠️ **Ne pas confondre avec le testing PRODUIT** (board §1 : 6-15 vidéos + 6-15 statics, CBO 100-300 €, décision à 48 h, J0→J10). Le testing CRÉA injecte des batchs dans un compte qui tourne déjà. Confondre les deux donne des conseils faux — en cas de doute, demander à Badr de quelle phase il parle (board, piège identifié 16/08/2026).

#### Composition d'un batch
- Mets **3 à 6 ads** dans l'adset de test (T36 [02:07]) ; un batch = **4 variations minimum** (T01 [03:11]).
- Prépare **2-3 ad copies, 2-3 titres et 1 description** par adset (T36 [02:48]).
- Range l'ad copy library **par angle** (ex. « adcopy anti-acné ») et adapte l'adcopy à l'angle de la créa — Meta lit l'adcopy et le titre, ils doivent matcher la LP et l'offre (T36 [03:15], [10:22]).
- Sélectionne la **miniature manuellement**, jamais l'auto — elle doit communiquer l'angle (partie du hook, image insolite) et pilote le thumbstop score (T36 [07:44]).
- Publie **50 % des ads avec la page marque, 50 % avec une page tierce** (magazine, « docteur Dupont ») — sur 6 ads : 3/3 (T36 [05:48]).

#### Où injecter selon le palier de spend
- **< 3K €/jour : tout se joue DANS la CBO principale** — crée un nouvel adset dans la CBO pour le batch (T36 [02:07] « le process au départ, tout dans une CBO », [04:23] ; T25 [01:05] « à 0, 100 % de votre budget en testing », [03:18]).
- **À partir de ~3K €/jour de spend : lance une campagne ABO testing ≈ 20 % du budget** et crée un nouvel adset dedans par batch (T36 [02:07]).
  - ⚠️ Conflit : T25 [04:40] place la bascule « à environ 2 à 5K de spend » avec **20 à 30 %** du budget en testing. T36 gagne (processus de testing 34-38 > protocoles par palier 25-29 dans ARBITRAGES.md §2, et leçon 🆕) ; T25 dit lui-même « c'est pas un chiffre définitif, ça dépend de vos capacités de créa ».
- Budget de l'adset de test en ABO : **2 à 2,5 × ton CPA** (ex. CPA 30 € → 75 €), puis laisse **2 à 3 jours** avant décision (T36 [02:28-02:48]).

#### Combien d'ads par adset — l'arbitrage 50 vs 15
- **Règle qui gagne : garde le minimum d'adsets possible et blinde jusqu'à 50 ads dans UN adset ; ne crée le suivant qu'une fois full** (T42 [01:04] ; T21 [03:59]) — post-Andromeda (39-42) prime sur le processus de testing (34-38) dans l'ordre d'ARBITRAGES.md §2.
- ⚠️ Conflit : T36 [04:43] et T37 [12:21] posent un plafond de **15 ads** (« adset à moins de 15 ads → tu peux rajouter dedans, sinon nouvel adset » ; au-delà de 15, Meta ne dépense pas sur les nouvelles ads). Règle perdante par rang d'arbitrage, mais lecture conciliante du corpus : **15 = seuil de l'adset de TESTING, 50 = adset de la CBO SCALING** — la formation ne réconcilie jamais explicitement les deux seuils.

#### Minimum spend sur le nouvel adset
- Pose un **minimum spend de 10-15 €/jour** sur tout nouvel adset injecté en CBO — sinon Meta peut ne pas dépenser et juger tes ads trop vite (T36 [04:43]).
- Laisse ce minimum **2 jours, puis retire-le** (si pas performant, retiré ; la CBO réalloue ensuite librement) (T36 [04:43] ; T37 [15:19] et [15:41]).
- Formule « cartésienne » si tu veux affiner : AOV × 2 ÷ 7 — en pratique l'interne met 10-15, voire plus selon l'AOV (T37 [11:18]).

#### Itération et volume
- **Règle des 3-sur-5 : toute itération change au moins 3 éléments** parmi hook, visuel, texte, audio, format/message — une même vidéo avec juste le titre changé est traitée comme spam post-Andromeda (T42 [08:48]).
- **Injecte en drip quotidien, jamais en masse** : test interne, 200 créas injectées d'un coup → chute de ROAS le jour même (T39 [05:32]) ; l'injection anarchique reset la learning phase (T42 [10:22]).
- Dans un adset qui performe bien, ajoute **1 à 2 créas maximum, jamais plus d'un coup** (T37 [13:07]) ; n'injecte jamais dans un adset fatigué ou surperformant — Meta garde ses patterns historiques et la même ad performe mieux dans un adset neuf (T37 [12:44]).
- Le nombre d'adsets qui « dilue » une CBO n'est pas chiffré (la formation ne chiffre pas) — seul le mécanisme est nommé : trop d'adsets = perte d'efficacité et de rentabilité (T24 [02:31], repris T25 [05:25]).
- **On ne coupe JAMAIS une annonce qui tourne** : une ad essoufflée part vers la campagne ZOMBIE (process T37), elle n'est pas supprimée [arbitrage Badr 19/08].

#### Réglages à la mise en ligne (checklist T36)
- **Advantage+ créative : tout OFF sauf « relevant comments »** — Meta l'active automatiquement, contrôle à chaque lancement (T36 [00:41-01:03], [10:44]).
- **Placements : toujours « original »**, jamais la sélection recommandée (ça crope l'image) (T36 [01:23], [07:18]).
- **Exclus les acheteurs** (+ liste Klaviyo côté scaling) (T36 [03:59] ; T42 [00:00-00:21]).
- **Attribution : 7-day click + 1-day engagement view en ABO testing ; 7-day click only en CBO/scaling** (T36 [03:38], [05:27], [10:44]).
- Audience **identique au premier lancement, même pays, même langue** — on ne teste pas d'autres paramètres en même temps que les créas (T36 [03:59]).
- **Lance du mardi au vendredi, jamais lundi**, et programme le live **entre minuit et 7 h** — plus tard, ça s'optimise mal (T36 [00:20-00:41], [03:59]).
- Laisse **Multi-advertiser ads ON** (sinon tu perds des opportunités d'exposition) (T36 [11:08]).
- **Vérifie chaque ad manuellement avant publication** : URL du bon produit, image non cropée, bonne page Facebook, pixel (T36 [01:47], [10:00]).

#### Nommage et cadence
- Nomme l'adset **« Creative testing + mois + n° de semaine » + nom du batch** (ex. « creative testing april 2 — AD428v3 ») (T36 [03:59]).
- **Duplique simplement l'adset de testing chaque semaine** quand tu lances tes ads (T36 [06:32]) — l'unité de création d'adset est la semaine, pas le batch.
- Cadence : **5 à 10 batchs/semaine entre 0 et 200K€ de CA mensuel** (c'est le minimum), 10-15 batchs à 200-500K€, 15-30 à 500K€+, 30+ à 1M+ (T01 [02:49], [03:11]).
- Lance en manuel tant que le process n'est pas maîtrisé (~10 min/batch) ; un outil type AdManage ne vient qu'après (T36 [06:53]).

---

## 4 · Winners — marquer, dispatcher, ménage

### Stock d'ads — marquer, dispatcher, faire le ménage

#### Marquage (revue hebdo, fenêtre 14 jours, retargeting exclu)
- Passe en revue toutes les ads NON marquées (nom ne contenant ni « win » ni « pot ») sur les **14 derniers jours**, toutes campagnes (ABO et CBO), retargeting exclu (T37 [00:46-01:08], [03:05]).
- **WINNER** : **≥ 6 ventes ET ROAS donnant ≥ 10 % de marge** → marque « WIN » (T37 [01:08]) — seuil abaissé exprès (« avant on avait 10, avant on avait 15, avant un minimum de spend ») : dès qu'un petit signal, on exploite (T37 [01:08-01:32]).
- **POTENTIAL WINNER** : ≥ 6 ventes, ROAS **entre le BE et 10 % de marge** (ex. BE 1,2 → ads à 1,2-1,4) → marque « POT » et injecte aussi en CBO (T37 [04:28-04:49]).
- **SIGNAL précoce** : **< 6 ventes mais marge ≥ 15 %** (voire 20 %) → injecte quand même, « il ne faut pas manquer une ad » (T37 [05:12]).
- **ZOMBIE** : **≥ 6 ventes mais ROAS sous le BE** → injecte directement dans la campagne zombie (T37 [05:33-05:57]) — la CBO zombie (cost cap) collecte les ads « qui ont spend et qui ne sont plus vraiment winner » pour garder un ROAS propre dans la campagne principale (T24 [08:03-08:26]). Le détail de ce dispatch zombie est annoncé « autre process » et n'est publié nulle part (T37 [13:07] — la formation ne le décrit pas).
- **BANGER** : chaque semaine, renomme « BANGER » (à la place de « win ») toute ad dispatchée dépassant **50 ventes** (T37 [13:37-13:51]).
- Nomme chaque ad marquée : nom d'origine + WIN/POT + mois + numéro de semaine (ex. « August 1 ») + **post ID**, et reporte tout dans le sheet de suivi (T37 [06:44-08:39]).
- Cadence : dispatche les nouvelles winners **mardi et vendredi** (+ lancement du Facebook comment process) (SOP Meta Process, ressources-google/15, planning hebdo).

#### Dispatch — un process ABO → CBO uniquement
- Le dispatch ne s'applique que si tu testes en ABO : « si vous êtes en CBO il n'y a rien à faire, vos ads sont déjà là » (T37 [01:32]) — en compte 100 % CBO, on ÉTIQUETTE les winners sans dupliquer ; seule l'injection zombie subsiste (audit fidélité du 19/08, MEMO.md).
- Duplique **AVEC LE MÊME POST ID** via le menu « dupliquer » sur l'ad — l'ancienne méthode (coller le post ID) fait perdre les commentaires Instagram ; garder le social proof est « le plus important » du process : plus de commentaires = CPM plus bas (T37 [11:39-11:59]).
- Dispatche dans la **CBO scaling master**, en créant un **NOUVEL adset** nommé mois + « winner » (T37 [10:55-11:18]).
- Mets une limite de dépense minimum sur cet adset : **AOV × 2 ÷ 7** si cartésien, **10-15 €** en pratique — « voire plus selon l'AOV » (la formation ne chiffre pas ce « plus ») — attribution au clic (T37 [11:18]) ; le minimum reste **2 jours** puis se retire si ça ne performe pas (T37 [15:19-15:41]).
- Advantage+ : tout OFF **sauf** relevant comments (T37 [11:59-12:21]).
- Nouvel adset plutôt qu'existant parce que : au-delà de **15 ads** Meta ne dépense pas sur les nouvelles, et un adset fatigué ou surperformant garde ses patterns historiques — test interne : la même ad performait mieux dans un adset neuf (T37 [12:21-12:44]) ; dans un adset existant qui performe bien : **1-2 créas max** à la fois (T37 [13:07]).
- Une winner peut être dispatchée vers une campagne à landing page différente, mais **PAS avec le même post ID** (T37 [13:27]).
- **Anti-redispatch** : ne prends que les ads non marquées — une ad WIN/POT « sera dispatchée une seule fois », jamais re-recommandée (T37 [05:57]).
- L'originale **reste active en ABO tant qu'elle est rentable** (T37 [06:19]) ; on ne coupe JAMAIS une ad qui tourne rentable — sous le BE elle part en zombie, elle ne se supprime pas [arbitrage Badr 19/08].
- Campagne d'engagement (fortement conseillée) : budget **5-10 $/j**, les ads empilées avec le **même post ID**, ciblage de pays à engagement pas cher (anglais → Philippines/Afrique du Sud ; français → Maroc ; espagnol → Mexique ; allemand → Allemagne/Autriche) → commentaires et social proof gonflés, CPM en baisse sur la CBO scaling (T37 [14:13-14:58]).

#### Ménage — SOP Meta Process §3 « Evaluation » (le seul ménage écrit du corpus)
- **Ad — la règle qui gagne** : coupe une ad si son ROAS est sous la cible avec un spend continu sur les 3 derniers jours ; si son ROAS 7 jours est mauvais, vérifie d'abord le ROAS global — global mauvais → couper, global bon → couper en observant l'impact (T41 [09:23], post-Andromeda).
  ⚠️ Conflit : le SOP dit « last 7 days < BE ROAS → turn off » sec (ressources-google/15 §3, « Ads Optimization rules » — fondations, référencé leçon 20) — perdant car T41 est post-Andromeda (ARBITRAGES §2 : 4 > 1) ; et T37 (🆕 2026) impose qu'une ad ≥ 6 ventes sous le BE parte en ZOMBIE au lieu d'être supprimée ; jamais de OFF sur une ad rentable qui tourne [arbitrage Badr 19/08].
- **Adset** : **3 derniers jours + aujourd'hui < BE ROAS → OFF** (règle 10) — SOP ressources-google/15 §3 ; c'est la SEULE règle d'extinction d'adset de toute la formation (vérifié : aucune leçon ne coupe un adset ailleurs). En amont : hier ≥ BE ROAS + 20 % de marge → budget +20 % · hier ≈ BE → ne rien faire · hier < BE → −20 % · 3 j + aujourd'hui ≈/< BE → −20 % (stabiliser) (règles 6-9).
- **Campagne — la règle qui gagne** : le budget campagne se pilote au board PROTOCOLE-DECISION.md (§2 pré-scaling : « rentable au backend 2 derniers jours, marge ≥ 15 % ? » + escalier ; §3 scaling : table de marge ; jamais de kill de campagne hors testing produit §1 — en bas de l'escalier on repart en sauvetage, on ne coupe pas) — le board est la synthèse validée par Badr et prime toute leçon isolée.
  ⚠️ Conflit : le SOP §3 a ses propres règles campagne 1-5 (hier ≥ BE ROAS + 20 % de marge → scale +20 % · hier ≈ BE → do nothing · hier < BE → réduire 20 % · 3 j + aujourd'hui ≈/< BE → réduire 20 %, stabiliser · 7 j + aujourd'hui < BE → OFF, « kill losers ») — perdantes : fondations face au board canonique et aux leçons 2026 ; ne jamais appliquer le kill de la règle 5 à une campagne suivie au board.

---

## 5 · Structure de compte — campagnes, géo, duplication

### Structure de compte — campagnes, rôles, géo, duplication

#### Le plafond post-Andromeda
- Limite-toi à **2-3 campagnes MAXIMUM par SKU** : trop de campagnes dilue le signal et l'algorithme apprend moins vite (T41 [10:27-11:11] ; confirmé par le doc écrit ressources-notion/38 : « 2-3 max par SKU »).
- Attribue ces 3 slots par **RÔLE**, jamais par géo ni par étage de funnel : **une testing, une scaling, une remarketing — « consolider à mort »** (T42 [07:22]).
- Le plafond est PAR SKU : 10 produits = 10 campagnes, c'est normal (T41 [10:50]).
- Mets **80 à 90 % du budget** dans la CBO scaling : Advantage+ audience broad, placements automatiques, acheteurs exclus (T42 [00:00]).
- Blinde les créas dans un **minimum d'adsets** : la structure de référence garde 1 adset et monte jusqu'à 50 ads dedans (T42 [01:04] ; T21 [02:02-02:27] : master CBO = 1 adset, 25-50 créatifs).

#### La montée en structure (quand ouvrir quoi)
- **Démarre avec UNE SEULE campagne** — la master CBO : budget au niveau campagne, tout concentré dedans (T34 [11:20] ; T21 [02:02]).
- Pour ouvrir l'audience, **monte le budget, n'ajoute pas de campagnes** : Meta n'ouvre de nouvelles poches d'audience qu'à partir de 3 000 de spend (T34 [10:19]).
- En pré-scaling (< ~3 K/j), la seule action structurelle est : monter le budget sur LA campagne (échelle 500 → 750 → 1000 → 1500 → 1850 → 2250 → 3000) + injecter des créas (board PROTOCOLE-DECISION §2).
- **Ouvre l'ABO testing dédiée à 3 K/j de spend, ~20 % du budget** ; en dessous, tout le testing se joue dans la CBO (T36 [02:07]).
  - ⚠️ Conflit : T25 [04:40] (protocole 0-10K) dit « dès 2 à 5 K de spend, 20 à 30 % du budget en testing » en précisant lui-même « c'est pas un chiffre définitif ». T36 gagne (ARBITRAGES : processus de testing 34-38 > protocoles par palier 25-29). Au palier 100-300 K/j, la part ABO redescend sous 20 % (T28 [02:06]).
- La campagne testing peut être ABO ou CBO — « ça change pas grand chose », l'ABO donne juste plus de data et plus de chance à chaque créa (T42 [03:04-03:25]).

#### Duplication de campagne
- **Ne duplique JAMAIS une campagne qui tourne** : le SEUL cas validé du corpus est le **triple lancement** — lancer une campagne scaling DE ZÉRO en la dupliquant 3× à l'identique, couper la moins bonne au jour 1, la suivante aux jours 2-3, garder la meilleure (tournoi à élimination, pas 3 campagnes en parallèle) (T42 [01:28-02:42]).
- Condition d'entrée explicite : « si vous avez pas de campagne scaling et vous la lancez de zéro » — une CBO déjà active n'y a pas droit (T42 [01:28]).
- Ce qui se duplique en continu, c'est l'ANNONCE winner avec son post ID vers un nouvel adset, jamais la campagne (T37 — voir section testing/dispatch).
- ⚠️ L'ancien protocole dashboard du 03/08 (« duplication seulement > 1000-1500 €/j très stable ») est OBSOLÈTE [arbitrage Badr 18/08 : la formation fait foi] — ne plus s'en servir.

#### Géographie
- **Si ton mélange de pays donne des résultats, GARDE le mélange** ; ne sépare par pays que si tu pars de zéro, pour percer un marché (T22 [15:41]).
- Isole un pays qui **RÉSISTE** (ex. des US qui ne perçaient pas en mix US/UK/Big Five → campagne US only pour percer), pas un pays qui marche déjà (T22 [16:03]).
- Réserve les **campagnes par pays au palier 100-300 K/JOUR** (segmentation par collection/avatar/géographie), et reste réversible : « il ne faut pas segmenter pour segmenter », si ça marche moins bien qu'en worldwide, on revient (T28 [00:00-00:48]).
- Ne clone pas une campagne sur la **Suisse ou tout pays multilingue** — nommée comme le cas où « ça marche un peu moins bien » ; si tu tiens à tester : campagne Advantage 1 adset en cost cap autour du CPA break-even ±5, en test seulement (T22 [14:13]).

#### Remarketing
- Tiens le remarketing dans **UNE CBO remarketing** (initiate checkout + add to cart 90 jours + visiteurs, dans des adsets dédiés avec des ad copies adaptées — statiques offre/objections) (T42 [04:51-05:12]).
- **Laisse l'algorithme retargeter automatiquement** : plus de campagnes séparées par étage de funnel (TOF/MOF/BOF), c'est l'ancien monde (T42 [09:13]).
- Part de budget de la campagne remarketing : (la formation ne chiffre pas).

---

## 6 · Mesurer — BE ROAS, marge, signaux

### BE ROAS et cible — par produit, tous coûts inclus
- **Le BE ROAS est ta ligne de flottaison** : « le minimum pour ne pas perdre d'argent et la target pour manager tes campagnes » ; formule : **BE ROAS = 1 ÷ marge brute (%)** (T38 [00:00], [00:45]).
- **Calcule sur l'AOV réel du funnel, pas sur le prix d'un produit** : les gens achètent des bundles/mix — AOV tous produits (lisible sur Meta/Shopify), COGS **moyen pondéré** par le mix réel (T38 [01:31-03:07]).
- **Composantes à inclure** : COGS moyen + frais processeur (+ disputes, refunds si applicables) + shipping/fulfillment — le sheet sort marge, marge par commande, BE ROAS (ex. 1,54) et **CPA break-even** (ex. 26 €) (T38 [03:28-03:54]).
- **Même avec un BE ROAS, tu décides sur le profit** : « tu regarderas toujours au daily combien d'argent tu fais dans ta poche » (T38 [00:23]) — cohérent avec la lecture backend du board (Rappels transverses).
- **Utilise le calculateur en simulateur de focus** : change UNE variable (CPM, CVR, AOV) et regarde l'effet sur le ROAS — c'est comme ça qu'on choisit le chantier (créa / funnel / AOV), pas au feeling (T38 [04:17-04:59]).
- [dashboard] Le BE et la cible 15 % sont calculés **par produit** (`roasTarget15 = 1/(cm−0,15)`), seuils dynamiques 14 j glissants — et l'expérience Canada montre qu'ils varient **par pays** (pausé rentable en ROAS mais sans marge, coûts de livraison différents) [arbitrage Badr 21/08].

### CPMR — le signal avancé de saturation (post-Andromeda)
- **CPMR = CPM × fréquence** : « le vrai coût pour atteindre des personnes uniques » ; il monte **avant** que le ROAS, le CPA et le revenu se dégradent — c'est le premier signal que le compte a un problème (CI-23 [00:00-01:34]).
- **Cause racine nommée** : pas assez de nouvelles créatives qui tournent → « l'algorithme recycle, et c'est mauvais quand il recycle, parce que ça va tuer le scale » (CI-23 [01:54]).
- **Remèdes, dans l'ordre** (CI-23 [02:17-03:26]) : ① vérifier les exclusions d'acheteurs (liste Klaviyo synchronisée sur Meta — le pixel ne voit pas toutes les ventes) ; ② consolider les campagnes (« trop trop d'adsets qui se battent entre eux » fait monter les CPM — viser ceux qui dupliquent leurs campagnes avec les mêmes ads) ; ③ surtout : **augmenter la diversité créative**.
- [dashboard] La carte Scaling affiche « CPMr en hausse vs l'historique » (±20 % vs médiane de campagne — **paramètre hors formation**, la leçon lit le signal sans chiffre).

### Miniature et thumbstop
- **La miniature pilote le thumbstop score** — « la première chose que les gens voient », à choisir manuellement, à tester et retester (T36 [07:44-08:06]).
- Définition T36 [08:06] : « le pourcentage de personnes qui s'arrêtent au bout d'une seconde — c'est pas le hook score » ; ⚠️ la formule exacte de l'audio est déformée par Whisper (« views une seconde divisé par le nombre de clics » — dénominateur douteux) : ne pas citer de formule chiffrée sans revoir la vidéo source.

### Réserves de lecture
- **Fenêtres, pas cumul** : juge les dernières fenêtres, jamais le total dépensé depuis le lancement (T34 [09:17]).
- **Volume minimal** : (la formation ne chiffre pas de nombre de conversions minimal) — la réserve « < 15 conversions = ajustement, pas jugement produit » du dashboard est un **paramètre hors formation** assumé (MEMO).
- **Attribution du jour J** : elle se remplit en 24-72 h — la marge du jour ne peut que monter d'ici minuit ; en scaling, contrôler « > 70 % click-based » dans Meta (colonnes → Vue et attribution) avant une montée (T35 [13:33-14:19]).
