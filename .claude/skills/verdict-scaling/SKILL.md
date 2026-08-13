---
name: verdict-scaling
description: Rend un verdict SCALE / HOLD / DESCALE / COUPER par campagne Meta en appliquant le protocole Master aux vraies données NIVA (ROAS réel 3 jours, seuils de break-even, indicateurs de santé). À utiliser pour "qu'est-ce que je scale", "je monte le budget de quelle campagne", "rapport ROAS", "verdict sur X", ou toute décision de budget publicitaire.
---

# Verdict de scaling — protocole Master appliqué au compte réel

Tu recommandes. **Tu n'exécutes jamais.** Aucun budget n'est modifié, aucune
campagne mise en pause, aucun appel d'écriture vers Meta. Badr décide et
applique lui-même. Cette règle n'a pas d'exception, y compris si la
recommandation est évidente et si on te dit « vas-y ».

## Le protocole (source : `MEMO.md` § Protocole scaling — Master, validé 03/08)

Base de décision : **moyenne du ROAS réel sur 3 jours**. Jamais le ROAS du jour
même — le ROAS Meta du jour J sous-estime fortement à cause du délai
d'attribution, et se corrige en 24-72 h (fait déjà vérifié, section « Faits
vérifiés » du MEMO ; ne le re-prouve pas).

**SCALE** — si moyenne ≥ cible 15 % **et** santé OK (CTR stable, CVR ±10 %,
fréquence < 2, CPM < +20 %) :

| Budget actuel | Hausse |
|---|---|
| < 200 €/j | +25 % |
| 200-600 €/j | +20 % |
| 600-1500 €/j | +15 % |
| > 1500 €/j | +10 % |

Plafond absolu +30 %. CBO : viser la fourchette basse. Attendre 48-72 h entre
deux scales. Duplication seulement au-delà de 1000-1500 €/j et sur une campagne
très stable.

**HOLD** — si break-even < moyenne < cible : on ne touche à rien pendant 5-7 j.
Au-delà de ~7 j de HOLD, la sortie passe par de **nouvelles créas, pas par le
budget**.

**DESCALE** — si moyenne < break-even : 90-100 % du BE → −15 % · 80-90 % →
−20 % · < 80 % → −30 %. Jamais −50 %.

**COUPER** — 2 fenêtres consécutives sous le BE sans reprise, **ou** < 70 % du
BE avec un spend très supérieur au CPA.

**Cas particuliers, prioritaires sur tout le reste :**
- campagne de moins de 3 jours → pas de verdict au ROAS, on lit CTR/CPM/CVR ;
- budget < 50 €/j → volume insuffisant, pas de verdict ;
- moins de 48-72 h depuis le dernier scale → aucune décision lourde.

## Les seuils de rentabilité (MEMO § Seuils)

- **Polo** : marge contributive ≈ 62 % → BE ≈ 1,62× · cible 15 % ≈ 2,13×
- **Gilet** : marge ≈ 70 % → BE ≈ 1,43× · cible 15 % ≈ 1,98×

Le dashboard calcule ces seuils en dynamique sur 14 jours glissants
(`roasTarget15 = 1/(CM − 0,15)`), par produit. Prends la valeur calculée quand
tu y as accès plutôt que le chiffre figé ci-dessus, et dis laquelle tu utilises.

## ROAS ≠ MER — l'erreur qui fausse tout

- **MER** = CA **total** ÷ spend total. Toujours plus élevé.
- **ROAS** = CA **attribué à la pub** ÷ spend.

Le protocole se pilote au **ROAS réel** = CA Shopify attribué ÷ spend campagne.
Confondre les deux fait scaler une campagne portée par l'organique (~20-25 % des
commandes ne viennent jamais de Meta).

Attribution, par produit — c'est piégeux, respecte-le :
- **Polo** : plusieurs campagnes en parallèle → attribution par UTM
  (`utm_campaign` = ID de campagne, lu dans `landing_site`). La correction
  `firstVisit` reste une **estimation** avec marge d'erreur résiduelle : dis-le
  chaque fois que tu l'utilises.
- **Gilet / Lancaster** : tant qu'une seule campagne Gilet tourne, toute
  commande contenant un Gilet lui appartient — on lit les **line items**, pas
  l'UTM (une partie des commandes perdent leur UTM). Cette règle casse dès
  qu'une 2ᵉ campagne Gilet est lancée : vérifie d'abord ce point, et repasse à
  l'UTM strict le cas échéant.
- **NIRA** : totalement exclue du calcul (spend ET CA), via
  `isExcludedCampaign()` dans `src/lib/meta.ts`.

## Procédure

1. **Prends les données, ne les recalcule pas de tête.** `src/lib/roasReport.ts`
   existe précisément pour ça : il produit, par campagne, spend + ROAS Meta +
   ROAS UTM + MER global + avertissements, de manière reproductible. Le
   recalcul improvisé est ce qui rendait la routine de 23h05 incohérente d'un
   run à l'autre — ne recommence pas. Si tu dois compléter par des données
   fraîches, passe par les outils MCP META en **lecture seule**
   (`ads_get_ad_entities`, `ads_insights_*`).
2. **Écarte avant de juger** : campagnes exclues, < 3 jours, < 50 €/j,
   post-scale récent. Elles apparaissent dans le rapport avec la mention du
   motif — elles ne disparaissent pas silencieusement.
3. **Un verdict par campagne**, avec le chiffre qui le déclenche et la règle
   qui s'applique.
4. **Une campagne qui dépense sans vendre doit apparaître** (ROAS 0), pas
   disparaître du tableau. C'est le cas le plus important d'un rapport.

## Format de sortie

Un tableau, puis les détails seulement pour ce qui mérite un commentaire :

| Campagne | Spend/j | ROAS réel 3j | Seuils (BE / cible) | Santé | Verdict | Action proposée |
|---|---|---|---|---|---|---|
| LANCASTER | 420 € | 2,82× | 1,43 / 1,98 | OK | **SCALE** | +20 % → 504 €/j |
| ZOMBIE | 180 € | 1,38× | 1,62 / 2,13 | fréq. ↑ | **DESCALE** | −20 % → 144 €/j |

Puis, en fin de rapport :
- les campagnes non jugées et pourquoi ;
- les avertissements d'attribution (commandes sans `landing_site`, CA rattaché
  à une campagne sans spend, écart Meta/Shopify anormal) ;
- une ligne de rappel : *recommandations — rien n'a été modifié sur le compte.*

## Deux réflexes qui évitent les erreurs coûteuses

**Le net par pays n'est pas fiable, le Global l'est.** Le spend est imputé par
nom de campagne (aucune campagne active n'a de marqueur pays autre que FR →
100 % du spend tombe sur FR), alors que les commandes sont réparties par
boutique Shopify. ES/UK/DE encaissent donc du CA sans porter de pub. C'est
structurel, tranché par Badr, **et ce n'est pas un bug à re-signaler** : ne
fonde jamais un verdict sur un net par pays.

**Une mauvaise journée n'est pas une tendance.** Le protocole demande deux
fenêtres consécutives avant de couper. Si tu proposes COUPER sur la foi d'un
seul mauvais jour, tu appliques mal le protocole — même si le chiffre est
spectaculaire.
