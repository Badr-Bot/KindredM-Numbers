# DIAGNOSTIC — pourquoi le compte plafonne, mesuré sur les données réelles

> Extrait le 21/08/2026 de l'API Meta (compte Niva 919559773962419).
> Marge = `cm − 1/ROAS`, cm Polo 0,6525. Toutes les analyses sont reproductibles :
> les requêtes et les calculs sont décrits ici, pas seulement leurs conclusions.

---

## 1. Le fait de départ : le compte a déjà fait 4× mieux

Historique hebdo de la campagne principale (`CBO-POLO-FR-TESTING`, 107 k€ de spend cumulé) :

| Semaine | €/jour | ROAS | Marge | Fréq. | CPMR | **Profit/jour** |
|---|---|---|---|---|---|---|
| 01-07/06 | 514 | 2,36 | 22,9 % | 1,72 | 26,1 | 278 € |
| 08-14/06 | 986 | 2,15 | 18,8 % | 1,74 | 26,9 | 398 € |
| 15-21/06 | 1 707 | 2,28 | 21,4 % | 1,79 | 22,7 | 834 € |
| 22-28/06 | 2 492 | 2,00 | 15,2 % | 2,04 | 28,6 | 755 € |
| 29/06-05/07 | 2 144 | 1,97 | 14,6 % | 1,88 | 28,2 | 615 € |
| **06-12/07** | **2 155** | **2,17** | **19,3 %** | 2,03 | 23,6 | **902 €** ← pic |
| 13-19/07 | 1 783 | 1,68 | 5,7 % | **2,76** | **37,6** ⚠️ | 170 € |
| 20-26/07 | 1 105 | 1,62 | 3,4 % | **3,22** | **43,9** ⚠️ | 60 € |
| 27/07-02/08 | 734 | 1,66 | 5,1 % | 2,79 | 36,8 | 62 € |
| 03-09/08 | 675 | 2,04 | 16,2 % | 2,76 | 36,4 | 222 € |
| 10-16/08 | 550 | 1,81 | 10,1 % | 2,22 | 23,8 | 101 € |
| 17-20/08 | 437 | 1,94 | 13,8 % | 1,56 | 17,2 | 117 € |

**Le plafond n'est pas structurel.** La campagne a tourné à 2 155 €/jour avec 19,3 % de
marge. Elle est aujourd'hui à 437 €/jour : le budget a été divisé par 5, le profit par 8.

**La cassure est datée : semaine du 13/07.** La fréquence saute de 2,03 à 2,76 (+36 %), le
CPMR de 23,6 à 37,6 (+59 %), la marge tombe de 19,3 % à 5,7 %. C'est exactement le signal
que décrit Creative Insight 23 [01:09] : « CPM × fréquence […] ça mesure le vrai coût pour
atteindre des personnes uniques », et [01:54] « l'algorithme recycle, et c'est mauvais
quand il recycle, parce que ça va tuer le scale ».

---

## 2. Deux hypothèses testées et RÉFUTÉES par les données

Il faut les écarter, parce que ce sont les deux réflexes naturels.

### ❌ « Le compte est saturé, il faut dépenser moins »

Sur 14 jours (Polo seul), la corrélation spend↔CPA est réelle : **r = +0,60, p = 0,023**,
significative. La moitié basse (1 041 €/j) fait 18,1 % de marge, la moitié haute
(1 396 €/j) fait 10,4 %. Ça semble prouver un plafond.

**Mais le tableau §1 le contredit** : à 2 155 €/j la marge était de 19,3 %. La corrélation
sur 14 jours mesure l'état du stock créatif ACTUEL, pas une limite du compte. C'est un
plafond mou, pas un mur.

### ❌ « Il ne produit pas assez de créas »

Ads créées par semaine, mesurées sur `created_time` :

| Semaine | Ads créées | dont copies | Nouvelles |
|---|---|---|---|
| 06/07 | 55 | 0 | 55 |
| 13/07 | 52 | 1 | 51 |
| 20/07 | 132 | 19 | 113 |
| 27/07 | 23 | 15 | 8 |
| 03/08 | 97 | 30 | 67 |
| 10/08 | 41 | 0 | 41 |

**400 ads en 5 semaines, 383 créatives distinctes.** Et le hit rate, sur les 145 ads ayant
reçu au moins 50 € (une vraie chance) :

- **31 WINNERS** (≥ 6 ventes ET ≥ 10 % de marge, critère T37 [01:08]) → **hit rate 21,4 %**
- 8 potential · 25 signal précoce · 15 zombies

T34 [20:19] fixe le plancher : « vous devez avoir un hit rate de 10 ou 5 % minimum ; en
dessous de ça, si vous mettez beaucoup plus de volume, vous avez juste brûlé votre monnaie ».
**21,4 %, c'est 4× le plancher.** La production créative n'est pas le problème.

---

## 3. Le vrai problème : le budget ne va pas aux bonnes ads

Les 38 ads actives des 7 derniers jours, triées par spend :

| Ad | Campagne | Spend | ROAS | Marge | Profit |
|---|---|---|---|---|---|
| Video 4 Sully | LANCASTER | 887 € | 1,18 | **−19,7 %** | **−205 €** |
| IMAGE 57 COPIE | POLO-WORLD | 855 € | 1,50 | −1,6 % | −21 € |
| PUB 4 | POLO-FR | 773 € | 1,54 | 0,3 % | 3 € |
| PUB 46 COPIE | POLO-WORLD | 711 € | 1,65 | 4,6 % | 54 € |
| PUB 73 COPIE | POLO-WORLD | 607 € | 2,27 | 21,3 % | 294 € |
| PUB 73 | POLO-FR | 401 € | 2,67 | 27,9 % | 299 € |
| **IMAGE 6 - Copie 3** | ZOMBIE | **345 €** | **3,51** | **36,8 %** | **446 €** |
| IMAGE 117 - Copie | ZOMBIE | 232 € | 0,26 | −321,8 % | −193 € |

**Le partage du budget :**

| | Ads | Budget | Part | Profit |
|---|---|---|---|---|
| Sous 10 % de marge | 22 | 5 348 € | **62 %** | **−536 €** |
| Au-dessus (winners) | 16 | 3 332 € | 38 % | **+2 403 €** |

**62 % du budget finance les ads qui perdent de l'argent.** Les 4 plus gros spenders pèsent
37 % du budget et produisent −170 € de profit. Pendant ce temps, la meilleure ad du compte
(36,8 % de marge) ne reçoit que 345 €.

### Cannibalisation en prime

« IMAGE 6 - Copie 3 » tourne en **5 exemplaires** dans des adsets différents : 754 € de
spend, avec des ROAS de 0,65 à 3,51 **sur la même créative**. T39 [08:21] : « Si les pubs se
ressemblent trop, Meta va les voir comme des doublons. Elles se cannibalisent et reçoivent
moins d'impressions. »

---

## 4. Ce que la formation prescrit — et qui n'est pas fait

Le process existe, il s'appelle **T37 « Marquer et dispatcher les ads winneuses »**, et
c'est une **revue hebdomadaire** :

1. Passer en revue les ads non marquées sur les **14 derniers jours** (T37 [00:46]).
2. **WINNER** = ≥ 6 ventes ET ≥ 10 % de marge → marquer « WIN » (T37 [01:08]).
3. **POTENTIAL** = ≥ 6 ventes, entre le BE et 10 % → marquer « POT », injecter aussi.
4. **SIGNAL** = < 6 ventes mais ≥ 15 % de marge → injecter quand même, « il ne faut pas
   manquer une ad » (T37 [05:12]).
5. **ZOMBIE** = ≥ 6 ventes mais sous le BE → **sortir de la campagne principale**, injecter
   dans la campagne zombie (T37 [05:33]) — « pour qu'on maintienne un beau ROAS propre »
   (T26 [04:36]).
6. Dispatcher dans un **nouvel adset** avec un minimum spend de 10-15 €/j pendant 2 jours,
   en gardant **le même post ID** (T37 [11:39]) — sinon on perd les commentaires Instagram
   et le social proof.

**Le rejeu du protocole de budget** (board §2) sur les 13 fenêtres de 2 jours des 14
derniers jours donne : 6 mouvements alignés, **2 à contresens**, et surtout un compteur
d'escalier qui atteint le **cran 4+ depuis le 17/08** — c'est-à-dire que le protocole dit
depuis 4 jours « arrête de toucher au budget, passe en phase de sauvetage et diagnostique ».

---

## 5. Conclusion opérationnelle

Par ordre d'impact mesuré :

1. **Faire le dispatch T37 cette semaine** (le levier immédiat) : sortir les 15 zombies des
   campagnes principales, dédupliquer IMAGE 6, et donner du minimum spend aux 31 winners.
   Le budget est déjà là — il est juste mal réparti.
2. **Ne PAS remonter le budget avant** que le CPMR redescende et que la marge de la fenêtre
   repasse au-dessus de 15 % (board §3 : « si le CPMR monte, on ne scale pas », T27 [00:41]).
3. **Puis remonter l'échelle** du board §2 vers les 2 155 €/j déjà prouvés, en injectant des
   créas neuves à chaque palier — c'est ce point qui avait manqué en juillet.
4. **Le cap des 3 000 €/j** ouvre la phase de scaling et l'ABO testing dédiée. Voir
   `ROADMAP-100K.md`.

**Ce qui n'est PAS le problème et sur quoi il ne faut pas dépenser d'énergie** : le volume
créatif (hit rate 21,4 %), la structure de campagnes, le bid cap (hors palier — T25 [06:09]
« le reste, bid cap etc., ça ne sert à rien, c'est pas le focus »), et la segmentation
géographique (palier 100-300 K/j — T28 [00:25]).
