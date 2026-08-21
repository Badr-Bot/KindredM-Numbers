---
name: machine-creas
description: >-
  Produire un batch (ou un lot de batchs) de créas Meta prêtes à tourner :
  hooks rédigés, scripts en blocs, ad copies, titres, consignes de montage,
  codification et Excel de production. Se déclenche quand Badr demande des
  créas, un batch, des scripts, des hooks, des ad copies, un Excel de créas,
  ou de décliner un winner.
---

# Machine à créas — du brief à l'Excel prêt à produire

## Les 4 fichiers sources (ouvrir AVANT d'écrire quoi que ce soit)

1. `docs/creas/WINNERS-META.md` — ce qui marche RÉELLEMENT sur le compte.
   On décline d'abord les winners, on n'invente qu'ensuite (T21 [05:32] :
   « sur ce que ça spend, vous allez venir itérer »).
2. `docs/creas/PLAYBOOK.md` — la matière formation : stages de conscience,
   framework EPIC, typologies de hooks, frameworks de scripts (blocs),
   diversity maps formats/styles, consignes de montage.
3. `docs/formation/REGLES.md` §3-4 — composition du batch, réglages, seuils
   winners (vérifiés).
4. `docs/creas/CODIFICATION.md` — le nommage de chaque ad, adcopy, batch.

## La procédure

1. **Brief** : produit (POLO / LANCASTER), marché+langue, volume demandé.
   Si le brief ne dit pas sur quel winner s'appuyer → prendre le top de
   WINNERS-META.md pour ce produit.
2. **Choisir les axes AVANT de rédiger** (PLAYBOOK, domaine angles) : pour
   chaque créa, fixer angle × stage de conscience × format/style × type de
   hook. Diversifier réellement (des ANGLES variés, pas 50 variations du même
   — T34 [11:20]) ; pour une déclinaison de winner, appliquer la règle
   3-sur-5 et NOTER les éléments changés (T42 [08:48]).
3. **Rédiger chaque créa, complète** — le monteur ne doit RIEN redemander :
   - hook : texte exact des 3 premières secondes + indication visuelle
     (typologies PLAYBOOK hooks) ;
   - script : blocs dans l'ordre du framework choisi (PLAYBOOK scripts),
     nommer le framework ;
   - montage : rythme, sous-titres, b-roll, musique, ratio ;
   - miniature décrite (choisie à la main, communique l'angle — T36 [07:44]) ;
   - ad copy + titre codés `AC-<ANGLE>-<n>` / `TI-<ANGLE>-<n>` — une adcopy
     par angle, elle doit matcher LP et offre (T36 [03:15], [10:22]).
4. **Composer les batchs** : 3-6 ads · 2-3 adcopies · 2-3 titres · 1
   description · 50 % page marque / 50 % page tierce (T36) ; nommage batch
   `B<AAAA-SS>`, adset `Creative Testing <mois> <semaine>` blindé jusqu'à ~50
   (T42 [01:04]).
5. **Générer l'Excel** : écrire les lignes en JSON (clés = celles de
   `scripts/generate-creas-xlsx.py`, en-tête du script) puis :
   `python3 scripts/generate-creas-xlsx.py <batch.json> <sortie.xlsx>`
   et envoyer le fichier à Badr (SendUserFile). Archiver le JSON dans
   `docs/creas/batchs/B<AAAA-SS>.json` (c'est la base rejouable).
6. **Rappeler à la livraison** : lancement mardi→vendredi, jamais lundi, live
   entre 00h et 7h ; Advantage+ tout OFF sauf relevant comments ; placements
   originaux ; exclure les acheteurs ; minimum spend 10-15 €/j pendant 2 jours
   (REGLES §3, checklist T36).

## Interdits

- Aucun chiffre, seuil ou « best practice » hors corpus : ce que la formation
  ne dit pas est marqué « (hors formation) » ou omis.
- Ne jamais mélanger testing PRODUIT (board §1) et testing CRÉA (T36).
- Ne jamais présenter une créa sans son code CODIFICATION complet.
- Ne pas promettre de générer les vidéos : la machine produit les BRIEFS
  (scripts, hooks, consignes) et l'Excel ; la génération d'images/vidéos
  (Higgsfield) est une étape séparée qui se lance sur demande.
