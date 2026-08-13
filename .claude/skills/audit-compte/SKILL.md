---
name: audit-compte
description: Audite la structure et la santé du compte Meta Ads (campagnes, budgets, learning phase, fréquence, CPM, diversité créative) contre les règles de la formation MASTER, et liste ce qui n'est pas vérifiable faute de leçon transcrite. À utiliser pour "audite mon compte", "est-ce que ma structure est bonne", "pourquoi mes CPM montent", "mon compte est-il en bonne santé", "check-up".
---

# Audit de compte — contre la formation, pas contre l'opinion générale

L'audit ne vaut que par sa grille. Ici, la grille est la formation MASTER
(`formation/notes/`) plus les décisions déjà validées sur NIVA (`MEMO.md`).
Tout ce qui vient d'ailleurs — bonnes pratiques Meta génériques, seuils lus
quelque part — est soit exclu, soit clairement étiqueté hors formation.

## Avant de commencer : mesure ta couverture

Lis `formation/INDEX.md`. Les leçons qui portent l'audit sont MB-11 (maintenir
un compte en bonne santé), MB-14 (erreurs fréquentes et instabilité), MB-12
(algorithme), MB-07 à MB-10 (protocoles par palier).

Si elles ne sont pas transcrites, **dis-le en tête d'audit** :

> Couverture du corpus : 1 leçon sur 15, dont 0 validée. Cet audit s'appuie
> surtout sur `MEMO.md` (décisions Badr) et non sur la formation. Transcrire
> MB-11 et MB-14 le rendrait nettement plus tranchant.

Un audit qui cache sa base est pire qu'un audit absent : il donne une fausse
assurance sur des points qu'il n'a en réalité pas vérifiés.

## Ce que tu regardes

**Structure.** Nombre de campagnes actives, CBO vs ABO, budgets par campagne,
chevauchement d'audiences, campagnes en doublon, campagnes actives à budget
dérisoire. Écarte les campagnes exclues (`isExcludedCampaign()`, `src/lib/meta.ts`
— NIRA aujourd'hui).

**Santé (les 4 indicateurs du protocole).** CTR (stable ?), CVR (±10 % ?),
fréquence (< 2 ?), CPM (< +20 % ?). Sur 7 à 14 jours, pas sur la journée.

**Learning phase.** Combien de campagnes/ad sets y sont, depuis combien de
temps, lesquels sortent en *limited learning*. Attention : les seuils exacts
(nombre d'événements, durée) sont dans MB-12 — tant qu'elle n'est pas
transcrite, tu constates l'état, tu ne juges pas contre un seuil que tu aurais
inventé.

**Diversité créative.** Combien de concepts distincts tournent, depuis quand,
et lesquels sont en fatigue (fréquence en hausse + CTR en baisse). MB-12
annonce des règles de structuration créative « pour ne pas tuer un concept
gagnant par erreur » — c'est le point à creuser en priorité une fois la leçon
capturée.

**Cohérence de mesure.** Écarts anormaux Meta ↔ Shopify, commandes sans
`landing_site`, CA rattaché à une campagne sans spend. Ces anomalies invalident
les verdicts de scaling en amont : elles passent avant les recommandations
créa.

## Comment tu collectes

Lecture seule, toujours. Outils MCP META (`ads_get_ad_entities`,
`ads_insights_performance_trend`, `ads_insights_auction_ranking_benchmarks`,
`ads_get_errors`, `ads_get_opportunity_score`) et les modules du dashboard
(`src/lib/analytics.ts`, `src/lib/roasReport.ts`, `src/lib/live.ts`). Aucune
écriture, aucune modification de budget, aucune mise en pause — même suggérée
par un outil Meta qui propose de le faire pour toi.

Rappels de mesure à ne pas oublier, ils faussent l'audit sinon :
- le ROAS Meta du jour même sous-estime fortement (attribution, se corrige en
  24-72 h) ;
- MER ≠ ROAS ;
- le net par pays est indicatif seulement, le Global est la vérité — tranché
  par Badr, ne le re-signale pas comme un bug ;
- ~20-25 % des commandes sont organiques et ne seront jamais attribuées.

## Format de sortie

Trois blocs, dans cet ordre.

**1. Ce qui saigne** — les problèmes qui coûtent de l'argent maintenant, classés
par montant en jeu. Chacun avec : le constat chiffré, la règle violée et sa
source (`[MB-xx]` ou `[MEMO]`), l'action proposée. Pas plus de cinq : au-delà,
personne n'agit.

**2. Ce qui est sain** — court, mais présent. Un audit qui ne liste que des
problèmes pousse à casser ce qui marche.

**3. Ce que je n'ai pas pu vérifier** — les points de grille manquants faute de
leçon transcrite, et les données inaccessibles. Cette section est un livrable à
part entière : elle dit quoi transcrire ensuite pour que le prochain audit soit
meilleur.

Tu termines par le bloc `Sources` du skill `formation-master`, avec les statuts.

## La discipline centrale

Sur chaque ligne de l'audit, tu dois pouvoir répondre à : *d'où sort cette
règle ?* Trois réponses valides — `[MB-xx]`, `[MEMO]`, ou
`### Hors formation` assumé. Aucune autre. Un audit dont les règles n'ont pas
de source est une opinion déguisée en méthode, et c'est exactement ce que Badr
paie une formation pour ne plus avoir.
