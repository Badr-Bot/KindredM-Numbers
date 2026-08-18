# Prompt — nouvel onglet « Scaling / Cockpit Minuit »

> **Origine.** Le prompt d'origine n'a jamais été poussé : il a été écrit dans une session
> **locale** (desktop, 17/08, branche `claude/roas-marge-gilet-polo-rdce0g` — absente du
> remote). Ce qui a survécu, c'est l'artefact publié **« Cockpit Minuit »**
> (https://claude.ai/code/artifact/8e32e171-cdad-443f-ab6a-694410b0556f, maquette du
> 18/08 · 00h50) et deux fichiers qu'il cite : `formation-master/PROTOCOLE-DECISION.md` §2
> (introuvable dans le dépôt, lui aussi resté en local) et `WEFT_MEMORY_ECOM.md` §4
> (présent sur `claude/formation-gpt-transcriptions-sm1fv6`).
>
> Ce document **reconstitue** le prompt à partir de l'artefact. Les règles ci-dessous sont
> lues sur la maquette, pas sur le protocole d'origine : relire la section « À confirmer »
> avant de lancer l'implémentation.

---

## Le prompt (à copier tel quel)

Ajoute au dashboard un onglet **📐 Scaling** (route `/scaling`, entrée dans `BottomNav.tsx`
après Créas) qui rejoue chaque nuit la décision budget/campagne du compte Meta, exactement
comme la maquette « Cockpit Minuit ».

### Ce que l'onglet répond

Une seule question, posée **une fois par nuit (00h–01h)**, pour chaque campagne active :
*la marge de la fenêtre est-elle ≥ 15 % ?*

- **OUI** → on monte d'un palier sur l'échelle de montée
  `500 → 750 → 1000 → 1500 → 1850 → 2250 → 3000`, et le compteur de crans **repart à zéro**.
- **NON** → on avance d'**un seul cran** sur l'escalier :
  1. **attendre** (24 h, budget inchangé) ;
  2. **réduire** de 10–15 % ;
  3. **réduire** de 10–15 % ;
  4. **phase de sauvetage** (on ne rabote plus, on passe au diagnostic).
- **Créas neuves obligatoires à chaque mouvement de budget, montée comprise.**
- Plancher absolu : **100 $/j**.

### Le calcul

- **Fenêtre = 2 jours glissants** (deux barres voisines partagent un jour). Afficher les
  **6 dernières fenêtres** (ex. `11+12`, `12+13`, … `16+17`), la plus récente mise en avant.
- Tirer spend / ROAS / conversions depuis les **agrégats natifs Meta par fenêtre**, jamais
  une somme de journaliers.
- `marge = marge de contribution − 1 / ROAS`, comparée à **BE = 1/CM** et
  **cible15 = 1/(CM − 0,15)**, par produit. Reprendre les seuils **dynamiques 14 j** déjà
  calculés par le dashboard (`roasBreakEven` / `roasTarget15`) plutôt que les valeurs figées
  (Polo BE 1,60× / cible 2,10× · Gilet BE 1,57× / cible 2,06× — `WEFT_MEMORY_ECOM.md` §4).
- « Dernier changement de budget » : champ `updated_time` de la campagne, **en assumant que
  c'est un proxy** (il marque n'importe quelle modification) — l'afficher tel quel avec sa
  date et le nombre de jours pleins au budget courant.

### L'écran

Un panneau par campagne, dans cet ordre : en-tête (nom, chip produit, budget/j, dernier
changement, jours au budget) + **verdict** à droite (`SCALE` / `HOLD` / `DESCALE`, le
mouvement chiffré `300 € → 255–270 €`, et un état `à faire` / `déjà fait` / `rien à faire`).

Puis le **graphique** : une barre par fenêtre, hauteur = ROAS, avec deux lignes de
référence tracées dessus — BE (pointillé) et cible15 (trait plein). Code couleur repris de
la légende : au-dessus de la cible = OUI, entre BE et cible = NON, sous le BE = la campagne
perd de l'argent. Sous chaque barre : le libellé de fenêtre et la marge en %.

Puis le **pied de panneau** : lecture chiffrée (ROAS de la fenêtre, marge, conversions,
contribution en €) et l'**escalier à 4 crans** avec l'état de chacun (`consommé`, `sauté`,
`courant`, `restant`) + une phrase du type « dernier cran, prochain NON → sauvetage ».
Enfin un paragraphe **« pourquoi »** en clair, qui cite le chiffre déclencheur et la règle
appliquée.

### Garde-fous, non négociables

- **Lecture seule.** Aucun appel d'écriture Meta : l'onglet recommande, Badr applique.
  Même règle que la skill `verdict-scaling`.
- **Réserve d'échantillon** : sous ~15 conversions sur la fenêtre, afficher le verdict comme
  un *ajustement*, pas comme un jugement sur le produit (cas Lancaster, 8 conversions).
- **Réserve d'attribution** : les marges calculées sur le **ROAS Meta** sont un **plafond**
  (l'attribution continue de se remplir 24–72 h, les fenêtres récentes ne peuvent que
  monter). Afficher l'avertissement et confronter à `/api/roas-report`, qui donne le ROAS
  UTM Shopify (`src/lib/roasReport.ts`, déjà testé — ne pas recalculer à la main).
- **Attribution par produit** : Polo = UTM (`utm_campaign` dans `landing_site`), estimation
  avec marge d'erreur à annoncer ; Gilet/Lancaster = **line items**, pas l'UTM, tant qu'une
  seule campagne Gilet tourne. Campagnes exclues via `isExcludedCampaign()`.
- Une campagne qui **dépense sans vendre doit apparaître** (ROAS 0), jamais disparaître.
- Jours en **heure de Paris**.

### Réutiliser, ne pas réécrire

`src/lib/roasReport.ts` (`computeRoasReport`, `decideCampaign`, types `CampaignRoas` /
`CampaignDecision`), `src/app/api/roas-report/route.ts`, les seuils par produit du moteur,
et le style des boards existants (`src/components/views/`). Nouvelle route API dédiée si la
fenêtre 2 jours n'est pas exprimable avec l'existant — mais le calcul reste **en code et
testé**, jamais recalculé à la volée (c'est ce qui rendait la routine 23h05 incohérente).

---

## À confirmer avant de coder

1. **`PROTOCOLE-DECISION.md` §2** n'est pas dans le dépôt. L'escalier ci-dessus est lu sur
   la maquette : à vérifier contre le fichier local (ou à pousser depuis la machine).
2. Les paliers de montée `500 → … → 3000` sont-ils en €/j et communs à tous les produits ?
3. `−10 %` ou `−15 %` sur les crans 2 et 3 — la maquette montre les deux (`300 → 255–270`,
   `500 → 425–450`, `150 → 127,50`), donc une fourchette. Fourchette assumée ou règle fixe ?
4. Que fait concrètement la **phase de sauvetage** (cran 4) : coupe, diagnostic §1, autre ?
5. Ce nouvel onglet remplace-t-il le protocole SCALE/HOLD/DESCALE/COUPER du MEMO (base
   moyenne 3 jours), ou coexiste-t-il avec lui ? Les deux ne donnent pas le même verdict.
