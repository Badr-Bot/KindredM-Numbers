# CODIFICATION — campagnes, adsets, ads, batchs (v1, nuit du 20→21/08)

> Chaque élément est marqué **[Formation]** (avec sa source) ou **[Extension]**
> (nécessaire pour filtrer/suivre, mais la formation ne le code pas — assumé).
> Règle d'or : le nom porte TOUT ce qu'il faut pour filtrer dans Ads Manager et
> dans l'Excel sans ouvrir la créa. « Il faut respecter un naming correct parce
> que c'est important ensuite pour vous retrouver » — T36 [11:58].

---

## 1 · Campagnes

**Format : `CBO - <PRODUIT> - <MARCHÉ> - <RÔLE>`**

- **[Formation]** Les rôles : `TESTING` / `SCALING` / `REMARKETING` — 2-3
  campagnes max par SKU, attribuées par rôle (T42 [07:22], T41 [11:11]).
  La campagne ZOMBIE (T37 [05:57]) s'écrit `CBO - <PRODUIT> - ZOMBIE`.
- **[Extension]** `<PRODUIT>` : `POLO` · `LANCASTER` (gilet). ⚠️ Le dashboard
  classe Gilet UNIQUEMENT sur le mot `LANCASTER` (`scaling.ts`) — ne jamais
  écrire « GILET » seul.
- **[Extension]** `<MARCHÉ>` : tokens EXACTS lus par le dashboard
  (`meta.ts § mapCampaignToMarket`) : `FR` · `ESP` · `GE` · `UK` ·
  `WORLDWIDE` (→ bucket UK/International) · `NIRA` (→ CA). Tout autre token
  pays (SUISSE, CANADA…) tombe dans le mauvais bucket — **ajouter le mapping
  dashboard AVANT de créer la campagne**.

Exemples : `CBO - POLO - FR - TESTING` · `CBO - LANCASTER - WORLDWIDE - TESTING`

## 2 · Adsets

- **[Formation]** Adset de testing : **`Creative Testing <Mois> <Semaine>`**
  (T36 [03:59] : « creative testing april 2 »). Un adset par SEMAINE, qu'on
  **blinde jusqu'à ~50 ads** avant d'en ouvrir un nouveau (T42 [01:04],
  T21 [03:59] — remplace la règle des 15 de T36/T37, conflit arbitré par
  ARBITRAGES.md : post-Andromeda gagne).
- **[Formation]** Adset winners : **`<Mois> winners`** (T37 [10:55]).
- **[Extension]** En français et daté année incluse pour l'Excel :
  `Creative Testing 2026-08 S4` · `2026-08 winners`.

## 3 · Ads — le cœur de la codification

**Format : `AD<seq>v<var> - <PROD>-<ANGLE>-<FMT>-<HOOK>-<LANG>`**

- **[Formation]** `AD<seq>v<var>` : numéro séquentiel global + numéro de
  variation (T36 [03:59] : le batch s'écrit sur l'ad, « par exemple AD 428v3 »).
  Une itération d'une ad existante garde le même `<seq>` et incrémente `v`.
- **[Formation]** Marquage winners, PAR-DESSUS le nom, jamais à la création :
  préfixe **`WIN <mois> <sem>`** / **`POTENTIAL`** (T37 [04:08] « on va les
  marquer win », [03:05] le filtre exclut « win » et « potential ») ;
  **`BANGER`** au-delà de 50 ventes (T37, lexique). Une ad marquée n'est
  dispatchée qu'UNE fois [arbitrage Badr 19/08]. La formation ne fixe pas le
  format exact du marquage — celui-ci est le nôtre.
- **[Extension]** Les 4 codes qui rendent l'analyse possible (aujourd'hui
  impossible : « PUB 46 », « IMAGE 57 », « reject », « 5 » ne disent rien) :

  **`<ANGLE>`** (3 lettres, registre extensible) :
  | Code | Angle | Vu dans tes winners |
  |---|---|---|
  | VEN | ventre / morphologie | PUB 46 TOFU VENTRE (426 ventes) |
  | FEM | cadeau par la compagne | PUB 37 ANGLE FEMME |
  | VAC | vacances / occasion | PUB 17 VACANCES (228 ventes) |
  | PRO | promo / offre (BOFU) | PUB 36 BOFU REDUC |
  | CNF | confort / matière | à tester |
  | STY | style / élégance | à tester |

  **`<FMT>`** : `VID` (montage classique) · `UGC` (face caméra) · `IMG`
  (statique) · `CAR` (carrousel).

  **`<HOOK>`** (type, typologie de la formation — creative-insight 24,
  T17) : `QST` (question) · `CHC` (choc/pattern interrupt) · `PRB` (problème
  montré) · `CUR` (curiosité) · `TMG` (témoignage) · `DEM` (démo produit).

  **`<LANG>`** : `FR` · `EN` · `ES` · `DE`.

Exemples :
`AD106v1 - POLO-VEN-UGC-PRB-FR` · `AD106v2 - POLO-VEN-UGC-QST-FR` (variation
de hook du même concept — ≥ 3 éléments sur 5 changés, T42 [08:48]) ·
`WIN 2026-08 S4 - AD106v2 - POLO-VEN-UGC-QST-FR` (après marquage).

## 4 · Batchs

- **[Extension]** `B<AAAA-SS>` (année-semaine ISO) : `B2026-34`. Le batch de
  la semaine vit dans l'adset de la semaine. 2 batchs la même semaine =
  `B2026-34a`, `B2026-34b`, même adset.
- **[Formation]** Composition : 3-6 ads · 2-3 adcopies · 2-3 titres · 1
  description · une adcopy par ANGLE · miniature manuelle · 50 % page marque /
  50 % page tierce (T36 [04:43-06:09]).

## 5 · Adcopies et titres

- **[Extension]** Code adcopy : `AC-<ANGLE>-<n>` (`AC-VEN-1`), titre :
  `TI-<ANGLE>-<n>`. L'Excel les stocke dans des colonnes dédiées — on saura
  ENFIN quelle copy tourne sur quelle ad (aujourd'hui : une seule copy partout,
  cf. WINNERS-META.md).

## 6 · Ce que le nom ne porte PAS (vit dans l'Excel, pas dans Ads Manager)

Script complet, prompts Higgsfield, b-rolls, consignes montage, statut
(brief → généré → monté → lancé → jugé), résultats (spend, ROAS, marge,
verdict WIN/POT/ZOMBIE/OFF), date de lancement, page utilisée (marque/tierce).
Le nom est un INDEX, l'Excel est la fiche.
