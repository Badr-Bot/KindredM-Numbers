---
name: crea-review
description: Analyser les créas et campagnes Meta Ads en les croisant avec la marge réelle par marché, pas avec le ROAS brut. Utiliser quand on demande d'analyser les pubs, de décider quoi couper ou scaler, un point créa, une revue de campagne, où part le budget, ou quelle créa performe. Déclencheurs : analyse mes créas, revue Meta, quoi couper, quoi scaler, performance des pubs, ROAS, budget pub, point créa.
---

# crea-review

Le ROAS ne veut rien dire tant qu'il n'est pas confronté à la marge réelle.
Une créa à 2.5 de ROAS peut être rentable sur un marché et perdre de l'argent
sur un autre, parce que le panier, la TVA, le shipping et le coût produit
diffèrent. Cette skill impose toujours le même croisement.

## Étape 0 — Charger les seuils

Lire `config/seuils.md`. S'il n'existe pas, le créer avec l'utilisateur
**avant** toute analyse : sans seuils, une recommandation « coupe ça » n'est
qu'une opinion.

Ne jamais inventer un seuil. Si une valeur manque, le dire et demander.

## Étape 1 — Tirer les données

**Meta** (`ads_get_ad_entities`, `ads_insights_performance_trend`,
`ads_get_creatives`) : par ad set et par créa, sur la fenêtre demandée
(défaut : 14 derniers jours, pour coller au tableau NIVA) —
dépense, impressions, CTR, CPM, CPC, achats, valeur d'achat, fréquence.

**Marge réelle** : la source de vérité est le moteur de calcul du dashboard
NIVA (`src/lib/engine.ts` et le cahier des charges). Ne jamais réimplémenter
la logique de marge dans la skill — la lire depuis le projet. Si le projet
n'est pas accessible dans la session, demander les taux de marge par marché
et **le signaler comme hypothèse dans le rapport**.

**Mapping campagne → marché** : utiliser le mapping existant du projet.
Une campagne non mappée n'est pas devinée : elle est listée à part comme
« non attribuée ».

## Étape 2 — Calculer ce qui compte

Pour chaque créa et chaque ad set :

- **Marge brute générée** = CA attribué × taux de marge du marché
- **Marge nette** = marge brute − dépense pub
- **Seuil de rentabilité (ROAS mini)** = 1 / taux de marge du marché
  → c'est le seul chiffre qui rend un ROAS interprétable
- **Écart au seuil** = ROAS observé − ROAS mini
- **Fréquence** : au-delà du seuil de fatigue, un ROAS qui baisse est un
  problème d'audience, pas de créa — ne pas confondre les deux diagnostics

## Étape 3 — Classer, toujours dans le même ordre

| Verdict | Condition | Action |
|---|---|---|
| **SCALE** | marge nette positive et stable sur ≥ 7 j, fréquence sous seuil | augmenter le budget par paliers |
| **GARDER** | marge nette autour de zéro, volume utile | ne rien toucher, réobserver |
| **FATIGUE** | ROAS en baisse **et** fréquence au-dessus du seuil | même créa, nouvelle audience — ou nouveau montage |
| **COUPER** | marge nette négative au-delà de la fenêtre de patience | couper |
| **TROP TÔT** | dépense sous le minimum décisionnel | ne rien conclure, laisser tourner |

**Ne jamais conclure sur un volume insuffisant.** Une créa à 40 € de dépense
ne dit rien. C'est l'erreur la plus fréquente et la plus coûteuse : couper
une bonne créa sur du bruit.

## Étape 4 — Le rapport

Toujours la même structure, pour que deux revues soient comparables :

1. **Verdict en 3 lignes** — combien à couper, combien à scaler, marge nette
   totale sur la période
2. **Tableau par créa** — marché, dépense, ROAS, ROAS mini, écart, marge
   nette, fréquence, verdict
3. **Par marché** — quel marché porte la rentabilité, lequel la détruit
4. **Actions**, classées par euros récupérés, pas par ordre alphabétique
5. **Hypothèses et angles morts** — attribution, fenêtre, données manquantes

## Règles

- Une recommandation sans le chiffre qui la justifie n'est pas une
  recommandation. Chaque ligne d'action porte son montant.
- Ne jamais appliquer une modification sur le compte publicitaire
  (budget, pause, activation) sans validation explicite. La skill analyse et
  recommande ; l'utilisateur décide.
- Distinguer *corrélation* et *cause* : une créa lancée le jour d'une promo
  n'est pas la raison de la hausse.
- L'attribution Meta est déclarative et optimiste. Quand le chiffre Meta et
  le chiffre Shopify divergent, **Shopify gagne** — c'est l'argent réellement
  encaissé.
