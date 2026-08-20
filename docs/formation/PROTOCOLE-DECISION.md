# PROTOCOLE DE PRISE DE DÉCISION — source canonique

> Transcription fidèle du board Whimsical de Badr, exporté en PDF le 16/08/2026.
> Source : https://whimsical.com/protocole-de-prise-de-decision-FvAhVdNFXhRdZLAbNNQqSz
>
> **C'est LA source d'autorité pour toute décision de budget, de kill ou de scale.**
> En cas de contradiction avec une leçon isolée de la formation, ce protocole
> gagne : c'est la synthèse que Badr a lui-même validée.

---

## ⚠️ AVANT TOUT CONSEIL : identifier la phase

Trois phases distinctes, trois protocoles différents. **Ne jamais les mélanger.**

| Phase | Quand | Section |
|---|---|---|
| **TESTING PRODUIT** | nouveau produit, J0 à J10 | §1 |
| **PRÉ-SCALING** | produit validé, < ~3k/jour de spend | §2 |
| **SCALING** | ~3k/jour de spend et plus | §3 |

**Piège identifié le 16/08/2026** : le *testing PRODUIT* (§1 ci-dessous, 6-15 vidéos
+ 6-15 statics, CBO 100-300 €, décision à 48 h) n'a rien à voir avec le
*processus de testing CRÉA* (`master-acquisition/36-processus-de-testing.md`,
3-6 ads par ad set, plancher 10-15 $ au niveau ad set). Le premier lance un
produit, le second injecte un batch de créas dans un compte qui tourne déjà.
**Confondre les deux donne des conseils faux.** En cas de doute : demander à Badr
de quelle phase il parle avant de répondre.

---

## §1 — TESTING PRODUIT (J0 → J10)

### Pré-requis : marché validé
- Compétiteur qui scale
- Stage de sophistication abordable
- Audience pas trop nichée
- Angle clair
- Demande prouvée

### Jour 0 — préparation
- **copy mining ads : 6-15 ads vidéo + 6-15 ads static**
- Offre validée (inspirée d'un compétiteur)
- Landing page validée (inspirée d'un compétiteur)
- Funnel sans bug (contrôlé par un **achat test**)

### Jours 1-2 — test initial
**CBO 100-300 €.** Puis **attendre 48 h**.

### J2 — Rentable au backend ?
> Critère exact : **MER / profit réel, PAS ROAS Meta only.**

- **OUI** → §2 Pré-scaling
- **NON** → phase de sauvetage

### Jours 3-5 — PHASE DE SAUVETAGE : diagnostic + optimisation
Question : **« Où ça fuit ? »** — quatre branches.

| Diagnostic | Chantier | Actions |
|---|---|---|
| **Bon CVR, mauvais (haut) CPC** | Créa / hook | Injecter nouvelles créas · Tester nouveaux angles · Tester nouveaux mécanismes |
| **Mauvais CVR, bon (bas) CPC** | LP / offre / mismatch | Revoir le funnel · Optimiser above the fold · Répondre aux objections · Analyser Microsoft Clarity · Bonus : ajouter nouvelles créatives |
| **Marge faible** | Offre / AOV | Ajouter upsell · Ajouter email · Tester nouveau bundle |
| **Mauvais CPC ET mauvais CVR** | — | Aller directement au BIG SWING (J6-10) |

### J5 — Rentable / nette amélioration ?
- **OUI** → §2 Pré-scaling
- **NON** → BIG SWING

### Jours 6-10 — BIG SWING
- **Refaire l'analyse marketing (revoir les concurrents et le marché)**
- Nouvelle LP + nouvelle offre
- Continuer d'injecter des créas
- Tester nouveaux angles
- Tester nouveaux mécanismes

### J7-J10 — fenêtre max : rentable ?
- **OUI** → §2 Pré-scaling
- **NON** → **KILL — produit suivant** (idéalement un produit similaire)

---

## §2 — PRÉ-SCALING

Boucle quotidienne. Question pivot, à chaque tour :

> **Rentable au backend ? (2 derniers jours) — marge ≥ 15 %**

### Si OUI → monter le budget
Échelle : **500 → 750 → 1000 → 1500 → 1850 → 2250 → 3000**
- ×2 si le budget est petit
- +20-30 % quand on approche de 3k
- **+ ajouter de nouvelles créatives** (obligatoire à chaque montée)

Puis on repose la question. Quand **~3k/jour de spend est atteint** → §3 Scaling.

### Si NON → escalier de descente, jamais brutal

1. **Attendre 24 h** → reposer la question
   - OUI → monter le budget
   - NON → étape 2
2. **Réduire le budget de 10-15 % + ajouter de nouvelles créatives** → **attendre 24 h** → reposer la question
   - OUI → monter le budget
   - NON → étape 3
3. **Réduire le budget de 10-15 % + ajouter de nouvelles créatives** → **attendre 24 h** → reposer la question
   - OUI → monter le budget
   - NON → **repartir en phase de sauvetage** (§1)

> **\* Garder minimum 100 $ de budget** pendant toute la phase.

---

## §3 — SCALING (~3k/jour et plus)

Question d'entrée, une fois par jour :

> **On atteint les KPI cible ? (3 derniers jours + hier)**

### Si OUI
→ **Plus de 70 % de la perf vient de l'attribution click-based ?**
- **OUI** → **Augmenter le budget +20 %** (ou **+100 %** si on est à 100 % au-dessus du KPI). Voir la table de marge.
- **NON** → **Attendre encore 24 h**

### Si NON
→ **Est-on SOUS le KPI breakeven ?**

- **NON** (au-dessus du breakeven mais sous la cible) → **Ne rien faire, stabiliser**
- **OUI** → **A-t-on attendu 72 h pour qu'il soit atteint ?**
  - **NON** → **Attendre encore 24 h**
  - **OUI** → **Est-on au spend quotidien minimum ?**
    - **OUI** → **Repartir en phase de sauvetage** — ⚠️ **NE PAS baisser le spend**
    - **NON** → **Baisser le budget de 10-15 %**

### Table de marge (scaling)

| Marge | Action |
|---|---|
| **0-10 %** | Ne rien faire (on stabilise) ou descale 10 % légèrement |
| **10-15 %** | Hold (scale max 10-20 %) |
| **15-30 %** | Scale 20-30 % |
| **30 %+** | Scale 40-100 % (si ROAS fantastique, on peut doubler le budget) |

**Fin de journée : SOP scaling terminé, on revient demain.**

---

## Rappels transverses

- La décision se prend **entre 00 h et 01 h** (heure de Paris), sur des **jours complets**. Jamais sur le jour en cours.
- « Rentable » se lit **au backend** (profit réel), jamais au ROAS Meta seul.
- Les seuils de marge (BE ROAS, cible 15 %) se calculent **par produit**, tous coûts inclus : COGS + livraison + taxe + frais de paiement + **l'effet des codes promo**. Voir `master-acquisition/38-calculer-son-be-roas.md` — le piège n°1 est de ne compter que le coût produit.
