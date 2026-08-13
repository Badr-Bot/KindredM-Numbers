---
code: MB-12
module: media-buying
lecon: L'algorithme Meta, ce que personne ne t'explique
statut: brut
relu_le: 
---

# MB-12 — L'algorithme Meta, ce que personne ne t'explique

> ⚠️ **Note incomplète — construite à partir du descriptif Skool et de la slide
> de fin uniquement.** Le verbatim des 19:32 n'est pas encore capturé. Elle sert
> ici de démonstration du format. Tant qu'elle n'est pas passée en `statut: ok`,
> ne t'appuie pas dessus pour décider quoi que ce soit sur le compte.

> **En une phrase.** L'algorithme Meta n'est pas une boîte noire aléatoire :
> c'est un entonnoir en 4 étapes, et savoir à quelle étape tu perds explique
> tes CPM.

## Ce que ça change concrètement

_À compléter après capture du verbatim._ Le seul élément actionnable déjà
établi : arrêter de chercher la « bonne » méthode de bidding. Le choix se fait
par la contrainte business du moment, pas par une supériorité intrinsèque d'une
méthode sur une autre.

## Les règles

| # | Règle | Seuil / chiffre | Quand elle s'applique |
|---|---|---|---|
| 1 | Choisir la méthode de bidding selon la contrainte actuelle du business, pas selon une préférence technique | — | À chaque arbitrage de bidding |

_Les autres règles sont à extraire du verbatim (étapes 1-3, learning phase,
MEQ, diversité créative)._

## Le mécanisme

Le process Meta en 4 étapes, du plus large au plus fin :

1. **Retrieval** — Meta présélectionne les candidats parmi des millions.
2. **Light ranking** — premier filtre grossier.
3. **Heavy ranking** — le classement fin, gouverné par l'équation
   `Total Value = Advertiser Value + User Value`. C'est là que se déterminent
   les CPM.
4. **Auction** — il reste quelques centaines de candidats, voire moins. Celui
   qui a la plus haute *Total Value* gagne l'impression.

_Le détail de chaque étape est à compléter. L'update **Andromeda** est présentée
comme ayant changé la donne sur le targeting par la créa — contenu à capturer._

## Chiffres et seuils

| Métrique | Valeur | Contexte donné dans la vidéo |
|---|---|---|
| Dépense quotidienne d'annonceurs cités | 5 chiffres / jour | Exemples d'annonceurs qui performent en lowest cost pur, et d'autres en bid caps pur |
| Passage évoqué par les élèves | 1k/jour → 10k/jour | Le formateur relativise : ce n'est pas qu'une question de media-buying |

## Erreurs à ne pas commettre

- **Erreur :** croire que la méthode de bidding est le levier déterminant du
  scale → **Ce qu'il faut faire :** identifier la contrainte réelle du business
  et choisir la méthode qui la résout.
- **Erreur :** raisonner uniquement en media buyer → **Ce qu'il faut faire :**
  penser en entrepreneur (le formateur pose ça comme le point le plus
  important de la fin de leçon).

## Citations à garder mot pour mot

> « Le bidding method n'est pas la clé. Ce qui compte, c'est : qu'est-ce qui
> résout la contrainte actuelle de ton business ? »
> — MB-12, ~19:00

> « Il faut penser comme un entrepreneur, pas comme un media buyer. »
> — MB-12, ~19:20

## Angles morts

- Les « 3 choses à cocher » annoncées juste avant l'étape 4 ne sont pas dans la
  capture — c'est probablement le résumé actionnable de toute la leçon.
- Rien sur les seuils chiffrés de learning phase (durée, nombre d'événements).
- Rien sur ce qu'est concrètement le MEQ ni comment on le mesure dans le BM.
- La ligne « Target ROAS / Maximum Value » est coupée à l'écran : on ne sait
  pas ce que le formateur en dit.
- La leçon explique le *mécanisme*, pas les *protocoles* — pour « combien
  scaler, quand », ce sont MB-07 à MB-10.

## Application NIVA

> ⚠️ Hors formation — interprétation à valider.

_À compléter._ Point de départ : NIVA tourne sur 4 marchés (ES/UK/DE/FR) avec
des budgets par marché très différents. Si le heavy ranking détermine les CPM
et que la créa porte désormais le targeting (Andromeda), l'écart de CPM entre
marchés est autant un signal créa qu'un signal d'audience — à vérifier contre
les données du dashboard avant d'en tirer une décision.
