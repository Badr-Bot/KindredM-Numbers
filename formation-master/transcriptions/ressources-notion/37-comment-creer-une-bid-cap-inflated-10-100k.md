---
module: RESSOURCES NOTION
lecon: 37
titre: "Comment Créer une Bid Cap Inflated 10-100k/day"
duree: ""
url: "https://ecom-master.notion.site/10-100k-day-Bid-Cap-inflated-How-to-pass-3a7387646c3e80dfb5f3da86d7acc7bc"
statut: complet
source: notion-public
maj: 2026-08-13
---

# 37 — Comment Créer une Bid Cap Inflated 10-100k/day

> **Source : document Notion public de la formation**
> Référencé par : MASTER ACQUISITION / 31 🆕 Stratégie Bid Cap Inflated - De 10 à 100K/Day

## Contenu du document

Bid Cap Inflated — passer de 10k à 100k/jour
L'outil pour imprimer du volume rentable à l'échelle. Règle de base : ABO pour tester, Bid Cap pour imprimer (jamais de bid cap sur une créa non validée).
Le principe — 3 robinets séparés
Bid = contrôle le CPA et le spend (le vrai robinet).
Budget = le plafond (gonflé, jamais atteint — signale à Meta que tu peux absorber).
Créa = le moteur du volume.
Ne JAMAIS confondre bid et budget. On contrôle le spend par le bid, pas par le budget.
Pré-requis (sinon on ne lance PAS)
En phase de scaling 10k+ 
3+ créas winners (spend + ROAS prouvés) 50 ventes chacune
CPA BE + CPA Target chiffrés
OK mental pour brûler 30-40 % du budget pendant 48h
Setup (J0)
Type : CBO, 3-5 campagnes avec des bids différents
Bid strategy : Bid Cap
Budget : inflated = target spend ÷ 0,35 (≈ 2,5-3×). 
1k -10k/day
Ex : viser 3k → régler ~8-10k. Golden point = dépenser 30-40 % du budget.
Bid cap initial : NCPA BE × 1-1,5 max (new-customer CPA, PAS blended)
1 adset (variations audience + créa, 15 ads max ; au-delà → nouvel adset par la suite
Optimization : Purchase · Attribution : 7d click / 1d view
Failsafe : mets un cost cap / spend limit pour qu'un bid haut ne s'emballe pas un jour de fluke.
Exemple de naming : US_CBO_BIDCAP_PRODUCT_INFLATED_30 / 33 / 35 / 37 / 40
→ On ne touche à rien pendant 48h. Chaque semaine on ré-injecte les big winners.
 PHASE 1 — LAUNCH (J0)
Param
	
Valeur 

Type
	
CBO (Campaign Budget Optimization)

Nombre de campagne
	
3-5 with different bid

Bid strategy
	
Bid Cap

Budget daily
	
1k -10k/day

Bid cap initial
	
NCPA BE × 1-1.5x (new-customer CPA, NOT blended)

Nb adsets
	
1 (variations audience + créa) (15 ads par adset) 

Optimization event
	
Purchase

Attribution
	
7d click 
Exemple
US_CBO_BIDCAP_PRODUCT_30 -1k
0
US_CBO_BIDCAP_PRODUCT_33  -1k
200$ ROAS 1
US_CBO_BIDCAP_PRODUCT_35   - 1k
500 ROAS 2.5
US_CBO_BIDCAP_PRODUCT_37 - 1k
2k - ROAS 1.8
US_CBO_BIDCAP_PRODUCT_40 - 1k
2k - ROAS 1.7
→ touche rien pendant 48h
→ cut les vraiment mauvaise dès 3 jours pas rentables après optimiser
→ chaque semaine on re ajoute nos big winners
Tuning
Situation
	
Action

Spend à peine (Meta ne trouve pas assez d'achats)
	
Bid ↑ 1-3$

Spend OK mais CPA > target
	
Bid ↓ 1-3$

Spend ~30-40 % du budget + CPA ≤ target
	
 GOLDEN POINT — on ne touche pas - on double le budget
Les 10 règles du bid
Le bid = le robinet du CPA. Le budget = le plafond. On contrôle le spend par le bid.
On trouve le bon bid UNE fois (tuning), puis on n'y touche presque plus.
Pendant le tuning : UN seul changement à la fois, puis attendre 1-2 jours.
À peine de spend → bid +10-15 %. Spend mais CPA > target → bid −10-15 %. Spend 30-40 % + CPA on target → ne rien toucher.
Ça marchait puis ça s'arrête → NE touche PAS le bid. C'est la créa. Refresh dans l'adset, ne kill pas l'adset.
Très au-dessus du BE et toujours pas de spend = c'est la créa / la LP, pas le bid.
Pas de panique sur les jours à faible CVR en début de semaine (by design).
Gonfle le budget (jamais atteint) pour signaler à Meta que tu es prêt à scaler. Pour scaler tu montes le budget/plafond — pas le bid.
ABO pour tester, Bid Cap pour imprimer. Jamais de bid cap sur créa non validée.
Si tu dois bouger le bid → petits pas (10-15 %), jamais un saut brutal qui casse le learning.
Pour scaler
Tu montes le budget / plafond, jamais le bid.
Si tu touches le plafond → augmente doucement (+50-100 $ à chaque fois).
Quand ça ralentit (après quelques semaines)
C'est la CRÉA, pas le bid (épuisement créatif). Refresh la créa dans l'adset. Ne kill pas l'adset, ne crank pas le bid pour « réveiller ».
