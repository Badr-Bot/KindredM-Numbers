---
name: ugc-brand
description: Produire des vidéos UGC pour la marque avec Higgsfield en minimisant les crédits. Utiliser dès qu'on demande une UGC, une pub créateur, une vidéo TikTok/Reels, un unboxing, un try-on, une vidéo produit, ou une créa vidéo pour la marque. Impose de valider en image avant de générer la vidéo, lit le contexte de marque au lieu de le redemander, et route vers le bon workflow Higgsfield. Déclencheurs : UGC, pub créateur, vidéo TikTok, reels, unboxing, try-on, créa vidéo, vidéo produit, ad vidéo.
---

# ugc-brand

Higgsfield facture à la génération. Chaque aller-retour coûte. Cette skill
existe pour que la **première** vidéo soit la bonne.

## La règle qui économise l'argent

> **Aucun appel à `generate_video` avant qu'une image de la même scène ait
> été générée et validée par l'utilisateur.**

Une image ratée coûte une fraction d'une vidéo ratée. Toute erreur de
cadrage, de lumière, de packaging, de visage se voit sur une image fixe.
Découvrir un mauvais cadrage sur une vidéo, c'est payer le prix fort pour une
information qui coûtait une bouchée de pain.

**L'échelle de coût, du gratuit au cher — ne jamais sauter un barreau :**

| Étape | Coût | Ce qu'on y valide |
|---|---|---|
| 1. Script + shot list | 0 | Structure, hook, CTA, durée |
| 2. Auto-critique du script | 0 | Le concept tient-il ? |
| 3. `character-sheet` (image) | faible | Visage, morphologie, style — verrouillés |
| 4. Images des plans clés | faible | Cadrage, lumière, packaging, ambiance |
| 5. **Validation utilisateur** | 0 | ← le point de non-retour |
| 6. `generate_video` | élevé | Rien. On exécute, on ne découvre plus. |

Si l'utilisateur dit « vas-y direct », le dire une fois — « on peut, mais
une passe image coûte ~une fraction et évite de repayer la vidéo » — puis
suivre sa décision.

## Étape 0 — Lire BRAND.md, ne pas réinterroger

Avant toute question, lire `BRAND.md` à la racine (ou demander où il est).
Il contient persona, marchés, ton, palette, format, CTA, interdits.

**Maximum 3 questions**, et uniquement sur ce qui manque *vraiment* :
produit concerné, angle, message principal. Tout ce qui est dans BRAND.md ne
se redemande jamais. Si une réponse utile revient souvent, l'écrire dans
BRAND.md pour ne plus jamais la demander.

C'est ici que se jouent les « 1000 edits » : la plupart des allers-retours
viennent d'un contexte qu'on redemande mal, pas d'un modèle qui comprend mal.

## Étape 1 — Router vers le bon workflow Higgsfield

Higgsfield embarque déjà les workflows. **Toujours appeler
`get_workflow_instructions` avec le nom du workflow AVANT tout `generate_*`.**
Générer sans charger le workflow, c'est improviser un prompt — c'est la
première cause de créa ratée.

| Le brief | Le workflow |
|---|---|
| Créateur qui parle face caméra et review | `ugc-flow` *(défaut)* |
| Produit seul, voix off, personne à l'écran | `ugc-product-flow` |
| Déballage, la révélation est le climax | `ugc-unboxing-flow` |
| Essayage, fit check, OOTD | `ugc-try-on-flow` |
| Tuto pas-à-pas, captions « Step N » | `ugc-tutorial-flow` |
| La **page** du site/boutique apparaît à l'écran | `ugc-saas-flow` |
| Verrouiller un personnage sur plusieurs plans | `character-sheet` |
| Assets de marque, packaging, logo | `brandkit` |

Distinction qui se trompe souvent : une URL comme **source** du produit
(la page n'apparaît pas) → flow produit. La **page elle-même** à l'écran →
`ugc-saas-flow`.

En cas d'ambiguïté sur talking-head vs produit-seul : `ugc-flow`.

## Étape 2 — Critiquer le script avant de payer

Noter le script sur ces axes, et **réécrire tant qu'un axe est en dessous
de 3/5** — c'est gratuit, contrairement à une régénération :

1. **Hook** — les 2 premières secondes donnent-elles une raison de rester ?
   Un hook qui commence par présenter la marque est mort.
2. **Problème** — reconnaissable en une phrase par la cible ?
3. **Crédibilité** — ça sonne comme une recommandation d'ami, ou comme une
   pub ? Test de lecture à voix haute : si on ne le dirait pas à un ami,
   réécrire.
4. **Produit** — visible et compréhensible sans le son ?
5. **CTA** — une seule action, claire, pas trois.
6. **Natif plateforme** — 9:16, rythme, pas de mise en scène télé.

Interdits de langage : « game changer », « révolutionnaire », « incroyable »,
« vous allez adorer », toute promesse de résultat non tenable, tout chiffre
inventé.

## Étape 3 — Verrouiller l'identité

Dès que **plus d'un plan** montre la même personne ou le même produit :
passer par `character-sheet` d'abord, puis réutiliser la référence dans tous
les plans. Sans ça le visage dérive entre les plans — le défaut le plus
visible et le plus cher à corriger, parce qu'il oblige à tout regénérer.

Même logique pour le packaging : une image de référence du produit, réutilisée
partout. Ne jamais laisser le modèle réinventer l'emballage à chaque plan.

## Étape 4 — Générer, en parallèle

Pour plusieurs plans indépendants, utiliser `generate_image_batch` /
`generate_video_batch` puis `jobs_wait`, et **un seul**
`show_generation_by_ids` ensuite. Générer en série coûte le même prix mais
prend beaucoup plus longtemps.

Vérifier le solde avec `balance` avant une salve importante.

## Étape 5 — Consigner ce qui a marché

Après validation, ajouter à `BRAND.md` une ligne : angle utilisé, hook,
ce qui a marché, ce qui a été corrigé. Au bout de quelques créas, le fichier
fait le travail tout seul et les questions disparaissent.

## Ce qui coûte des crédits pour rien — la liste

- générer une vidéo pour découvrir un cadrage → **image d'abord**
- ne pas verrouiller le visage → dérive entre plans → tout regénérer
- ne pas charger le workflow → prompt improvisé → sortie générique
- redemander le contexte de marque → réponses approximatives → créa à côté
- générer 4 variantes « pour voir » sans avoir critiqué le script
- corriger un détail en régénérant tout le plan au lieu d'un tweak ciblé
  (`upscale_image`, `outpaint_image`, `reframe`, `remove_background`,
  `motion_control` coûtent moins qu'une régénération complète)
