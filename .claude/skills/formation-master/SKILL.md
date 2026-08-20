---
name: formation-master
description: >-
  Répondre à TOUTE question de média-buying, scaling, budget, créas, testing,
  winners, structure de compte, BE ROAS ou marge en s'appuyant sur la formation
  Master importée dans le repo — jamais de mémoire. Se déclenche dès que la
  conversation touche Meta Ads, un mouvement de budget, un batch de créas, un
  hook, un adset, une campagne, un verdict SCALE/HOLD/DESCALE/RESCUE, ou cite
  une leçon (T24, T35, leçon 42…).
---

# Formation Master — la source avant la réponse

## Le contrat

Une réponse média-buying donnée de mémoire est un BUG, même si elle a l'air
juste. Le 20/08, deux réponses de mémoire (« 15 ads max par adset », « nouvel
adset par batch ») ont été contredites par la source en une heure. La règle :

1. **Ouvrir `docs/formation/REGLES.md` d'abord.** C'est la distillation
   opérationnelle, chaque règle sourcée leçon + timestamp. Si la réponse y est,
   citer la règle ET sa source.
2. **Descendre au corpus pour le détail** :
   - `docs/formation/PROTOCOLE-DECISION.md` — le board canonique des décisions
     budget (3 phases). **En cas de contradiction avec une leçon isolée, le
     board gagne.**
   - `docs/formation/transcriptions/<module>/NN-slug.md` — le verbatim,
     timestamps `[MM:SS]`. Les notes (`docs/formation/notes/…`) sont plus
     propres, l'audio fait foi pour les chiffres SAUF déformation Whisper.
   - `docs/formation/INDEX.md` — les 579 leçons, pour trouver le bon fichier.
   - `grep -ril "<mot-clé>" docs/formation/transcriptions/` pour chercher.
3. **Arbitrer les conflits avec `docs/formation/ARBITRAGES.md`** — jamais de
   mélange silencieux : ordre 2026 (23-24, 31) > post-Andromeda (39-42) >
   processus de testing (34-38) > protocoles par palier (25-29) > fondations
   (20-22) ; le module structuré prime sur l'oral de mastermind ; annoncer
   les deux positions quand ça reste ouvert.
4. **Les arbitrages de Badr priment sur tout** : consignés dans `MEMO.md`.
   Ne jamais rouvrir un débat tranché sans une nouvelle demande explicite.

## Pièges connus

- **Transcriptions Whisper déformées** : « Airways »/« ROS » = ROAS, « ad-7 »/
  « adse » = adset, « Métat »/« métal » = Meta, « cibo »/« bio » = CBO/ABO,
  « braine » = brand, « yterrer » = itérer, « désqueler » = descaler. Un
  chiffre étrange → recouper avec la note et le board (ex. réel : l'audio T35
  disait « 1800, 2000 », le board dit 1850/2250 — le board avait raison).
- **Trois phases, trois protocoles, ne jamais les mélanger** (board) :
  testing produit (J0-J10) / pré-scaling (< 3 000 €/j) / scaling (≥ 3 000 €/j).
  Identifier la phase AVANT tout conseil. Toutes les campagnes actuelles sont
  en pré-scaling.
- **Ce que la formation ne chiffre pas reste non chiffré** : répondre « la
  formation ne le chiffre pas » plutôt qu'inventer un seuil. Les paramètres
  hors formation déjà assumés sont listés dans MEMO.md et affichés dans les
  Réserves de l'onglet Scaling.
- **« Rentable » = backend** (marge de contribution après pub), jamais le ROAS
  Meta seul. Le BE est PAR PRODUIT et PAR PAYS (le Canada a été pausé
  rentable-en-ROAS mais « pas de marge » — arbitrage Badr 21/08).

## Fichiers compagnons

- `docs/creas/CODIFICATION.md` — nommage campagnes/adsets/ads/batchs.
- `docs/creas/WINNERS-META.md` — les winners réels du compte (matière à
  décliner, règle 3-sur-5).
- La skill `machine-creas` (si présente) — production de batchs de créas.
