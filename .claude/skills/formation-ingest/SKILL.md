---
name: formation-ingest
description: Transforme du matériau brut de la formation MASTER (transcription copiée-collée, sous-titres VTT/SRT, texte de page Skool, fichier produit par skool-capture.js) en fiche de transcription propre + note Notion prête à copier, dans formation-master/. À utiliser dès que l'utilisateur colle un verbatim, un export de sous-titres, ou dit « ingère la leçon X », « voilà la transcription », « j'ai capturé la formation ».
---

# Ingérer du matériau de formation

L'utilisateur arrive avec du texte brut. Ton travail : le ranger correctement,
sans en perdre un mot et sans en inventer un seul.

## Étape 0 — identifier la leçon

Trouve à quelle leçon ça correspond (`formation-master/CATALOGUE.md`).
Si c'est ambigu, **demande** — se tromper de fiche pollue le corpus durablement.

Si la leçon n'existe pas encore : ajoute son titre dans `catalogue.txt` sous le
bon module, puis `python3 scripts/formation.py scaffold`.

## Étape 1 — la transcription (`transcriptions/<module>/NN-slug.md`)

C'est **la source**. Elle doit rester le plus proche possible de ce que le
formateur a réellement dit.

Autorisé :
- couper les « euh », les répétitions, les faux départs ;
- ajouter la ponctuation et découper en paragraphes ;
- ajouter des sous-titres `###` pour la navigation ;
- garder les horodatages s'il y en a (`[04:12]`).

**Interdit** :
- reformuler une idée « en mieux » ;
- corriger le formateur ;
- compléter une phrase coupée en devinant la fin ;
- supprimer une digression parce qu'elle te semble hors sujet.

Marque les trous : `[inaudible]`, `[?mot]`, `[coupé]`.

Chaque bloc porte sa provenance :

```markdown
> **Source : audio**
> **Source : page de la leçon (texte Skool)**
> **Source : slide affichée à 15:40**
```

Puis mets à jour le frontmatter :

```yaml
statut: complet     # ou `partiel` s'il manque l'audio
duree: "19:32"
url: "https://www.skool.com/..."
maj: <date du jour>
```

`complet` veut dire : **la vidéo entière est là**. Pas « j'ai un bon résumé ».
Ce champ pilote tout le reste du système — le gonfler casse la confiance.

## Étape 2 — la note (`notes/<module>/NN-slug.md`)

C'est le livrable que l'utilisateur copie-colle dans Notion. Structure :

```markdown
# NN — Titre

`Module : X` · `Durée : 00:00` · `Source : complet`

## En une phrase
## Les 3 idées à retenir
## Le contenu          ← le fond, structuré en ### par thème
## Chiffres & seuils   ← tableau ; UNIQUEMENT ce qui est dit/affiché
## À faire concrètement ← cases à cocher, actionnables
## Ce que la leçon ne dit pas   ← les trous, les questions laissées ouvertes
## Citations           ← 2 à 5 phrases fortes, mot pour mot
```

Contraintes :
- **Markdown pur.** Notion avale les `#`, `-`, `- [ ]`, `|tableaux|`, `>` au
  collage. Pas de HTML, pas de emoji décoratif dans les titres.
- Un chiffre dans le tableau = un chiffre **prononcé ou affiché** dans la vidéo.
  Rien de déduit. Si tu déduis, c'est marqué :
  `> ⚠️ Hors formation — déduction, pas dit dans la vidéo.`
- « Ce que la leçon ne dit pas » n'est pas une section de politesse. C'est
  souvent la plus utile : elle empêche de croire que le cours a répondu à une
  question qu'il a en fait esquivée.

## Étape 3 — clôture

```bash
cd formation-master
python3 scripts/formation.py etat   # met à jour CATALOGUE.md
python3 scripts/formation.py pack   # reconstruit dist/ pour le GPT
```

Puis dis à l'utilisateur, en une ligne : quelle leçon a été ingérée, son nouveau
statut, et où en est l'avancement global (`X/Y leçons`).

## Cas particuliers

**Sous-titres VTT/SRT** — enlève les numéros de séquence et les horodatages
redondants, recolle les phrases coupées en milieu de ligne. Les sous-titres
automatiques sont fautifs sur les noms propres et le jargon (« bid cap »,
« CBO », « Andromeda ») : corrige ce dont tu es sûr, marque `[?]` le reste.

**Fichier `skool-capture-*.json`** — passe par
`python3 scripts/importer.py <fichier>` (aperçu), puis `--ecrire`. Ça remplit le
texte des pages ; l'audio reste à faire.

**Gros volume (plusieurs leçons d'un coup)** — traite-les une par une, et
n'annonce jamais « tout est ingéré » avant de l'avoir vérifié avec `etat`.
