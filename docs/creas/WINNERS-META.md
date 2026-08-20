# Winners Meta — matière première créas (extrait le 21/08/2026, compte Niva 919559773962419, 90 j)

> Source : API Meta (spend, ROAS, achats, CTR, fréquence, CPM, creatives).
> Marge = cm − 1/ROAS, cm Polo 0,6525 (seuils du dashboard au 20/08 — recalculer si le cm bouge).
> Sert de base à la machine à créas : on DÉCLINE ces patterns (règle 3-sur-5, T42 [08:48]),
> on ne repart pas de zéro.

## Le fait n°1 : l'ad copy n'a JAMAIS été une variable

Les 10 meilleures ads partagent **la même primary text et le même titre**, mot pour mot :

- **Titre** : « Le polo conçu pour les hommes qui ont du ventre ! »
- **Body** : « Le Polo Niva, N°1 des polos pour hommes avec du ventre !
  Dites adieu aux polos qui collent au ventre ou qui te donnent l'air de porter une tente
  ☁️ Maintenant à -57% + 1 acheté 1 offert pour une durée limitée ! »
- **CTA** : SHOP_NOW · **Offre** : −57 % + 1 acheté 1 offert

→ Tout le tri s'est fait sur le VISUEL. Le levier « 2-3 adcopies par angle, une adcopy
par ANGLE » (T36 [05:05]) est inexploité. Les prochains batchs doivent varier l'adcopy.

## Top Polo par marge réelle (≥ ~35 ventes)

| Ad | Type | Marge | ROAS | Ventes | Spend | CTR | Fréq | CPM |
|---|---|---|---|---|---|---|---|---|
| IMAGE 40 | statique | 33,3 % | 3,13 | 72 | 1 684 € | 1,93 % | 2,94 | 15,97 € |
| PUB 3 | vidéo | 32,4 % | 3,04 | 48 | 1 173 € | 2,01 % | 1,55 | 12,08 € |
| PUB 1 | vidéo | 32,3 % | 3,03 | 131 | 3 421 € | 2,72 % | 1,51 | 8,72 € |
| PUB 7 | vidéo | 30,0 % | 2,84 | 40 | 1 006 € | 2,19 % | 1,65 | 17,77 € |
| IMAGE 28 | statique | 29,5 % | 2,80 | 38 | 944 € | 2,32 % | 2,46 | 14,14 € |
| IMAGE 31 | statique | 29,2 % | 2,78 | 133 | 3 391 € | 2,09 % | 2,56 | 13,09 € |
| PUB 36 BOFU REDUC | vidéo | 28,7 % | 2,74 | 31 | 816 € | 3,66 % | 2,83 | 21,28 € |
| Image 10 | statique | 27,6 % | 2,66 | 55 | 1 545 € | 2,90 % | 1,86 | 12,28 € |
| IMAGE 6 - Copie 3 | statique | 26,7 % | 2,59 | 37 | 958 € | 1,64 % | 3,21 | 15,28 € |
| PUB 5 | vidéo | 26,7 % | 2,59 | 37 | 928 € | 2,15 % | 1,29 | 13,66 € |
| IMAGE 20 | statique | 24,2 % | 2,44 | 43 | 1 282 € | 2,41 % | 2,11 | 16,57 € |
| PUB 4 (WORLDWIDE) | vidéo | 24,0 % | 2,42 | 43 | 1 335 € | 2,94 % | 1,22 | 14,25 € |
| IMAGE 16 | statique | 21,9 % | 2,31 | 79 | 2 404 € | 1,98 % | 3,05 | 11,83 € |
| PUB 37 ANGLE FEMME v2 | vidéo | 19,3 % | 2,17 | 29 | 1 073 € | 1,62 % | 1,23 | 13,15 € |
| PUB 17 - VACANCES | vidéo | 16,7 % | 2,06 | 228 | 7 485 € | 3,72 % | 1,33 | 13,86 € |

## Les gros spenders (volume, marge plus faible — les « chevaux de trait »)

| Ad | Marge | ROAS | Ventes | Spend | CTR | Note |
|---|---|---|---|---|---|---|
| PUB 46 TOFU VENTRE | 14,0 % | 1,95 | 426 | 15 092 € | 3,15 % | plus gros spender du compte |
| PUB 6 | 8,5 % | 1,76 | 352 | 14 212 € | 3,64 % | CPM le plus bas des vidéos (9,96 €) |
| PUB 73 | 14,1 % | 1,95 | 357 | 13 077 € | 2,15 % | |

## Patterns observables (à vérifier sur plus de volume, PAS des règles)

1. **Statiques : 6-7 du top 12** sur un compte qui spend surtout en vidéo → les
   statiques sont sous-exploitées vs leur rendement (T21 : mixer types).
2. **Angles nommés dans les noms d'ads** : VENTRE (TOFU) · VACANCES · ANGLE FEMME
   (cadeau par la compagne) · BOFU/REDUC (promo) · MACHUP. Le VENTRE est l'angle
   du gros volume ; FEMME et VACANCES tournent mais n'ont jamais eu d'adcopy dédiée.
3. **Fréquence > 2,5 sur presque toutes les statiques winners** (IMAGE 40 : 2,94,
   IMAGE 6 : 3,21, IMAGE 16 : 3,05) → fatigue proche : décliner MAINTENANT ces
   visuels (3-sur-5) avant qu'elles s'éteignent.
4. **Les CTR élevés ne prédisent pas la marge** ici : PUB 6 (3,64 %) est à 8,5 %
   de marge, IMAGE 40 (1,93 %) à 33,3 %. Le tri par CTR seul est un piège.
5. **Le naming actuel est inconsistant** (PUB n, IMAGE n, « reject », « 5 »,
   024_VEN_MACHUP_V1, doublons PUB 4/PUB 6 entre campagnes) → codification à
   poser (CODIFICATION.md), l'analyse par angle est aujourd'hui impossible sans
   ouvrir chaque créa.

## Gilet / LANCASTER

CBO - LANCASTER : 4 114 € / 94 ventes / ROAS 1,70 sur 90 j — trop peu de volume
pour des patterns fiables. La machine à créas démarre sur le POLO.

## Canada (contexte)

CBO - CANADA (FR) pausée malgré ROAS 2,07 : **« pas de marge » (Badr, 21/08)** —
le BE canadien réel (shipping/logistique) est au-dessus du BE affiché 1,54×.
Toute relance CA exige un BE ROAS propre au Canada d'abord (leçon 38 : tous
coûts inclus).
