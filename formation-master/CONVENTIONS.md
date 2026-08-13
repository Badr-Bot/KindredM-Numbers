# Conventions du corpus

Règles courtes, mais non négociables : c'est ce qui sépare une base de
connaissance fiable d'un tas de notes.

## 1. Un fichier = une leçon

| Dossier                     | Contenu                                  | Écrit par |
| --------------------------- | ---------------------------------------- | --------- |
| `transcriptions/<module>/`  | le **verbatim** de la vidéo               | l'outil / toi |
| `notes/<module>/`           | la **note Notion**, prête à copier-coller | Claude    |

Même nom de fichier dans les deux dossiers : `NN-slug.md`.

## 2. En-tête obligatoire

```yaml
---
module: Media-Buying
lecon: 12
titre: "L'algorithme Meta, ce que personne ne t'explique"
duree: "19:32"
url: "https://www.skool.com/..."
statut: partiel          # a-transcrire | partiel | complet
source: skool-master
maj: 2026-08-13
---
```

`statut` pilote tout le système :

- **`a-transcrire`** — vide. Exclu des packs. Interdit d'en parler.
- **`partiel`** — texte de la page, slides, bouts d'audio. Utilisable, **mais
  toute réponse qui s'appuie dessus doit le signaler.**
- **`complet`** — la vidéo entière est transcrite. Fiable.

`complet` veut dire *la vidéo entière*, pas *j'ai un bon résumé*. Gonfler ce
champ est la seule façon de casser durablement la confiance dans l'outil.

## 3. Chaque bloc porte sa provenance

```markdown
> **Source : audio**
> **Source : page de la leçon (texte Skool)**
> **Source : slide affichée à 15:40**
```

Sans ça, on ne distingue plus la parole du formateur d'une reformulation.

## 4. Zéro invention

Un chiffre qui n'est ni prononcé ni affiché dans la vidéo n'entre pas dans
`transcriptions/`. Si une note a besoin d'un complément pour être utilisable, il
est étiqueté :

```markdown
> ⚠️ **Hors formation** — déduction, pas dit dans la vidéo.
```

## 5. Marqueurs de trous

`[inaudible]` · `[?mot]` (mot deviné) · `[coupé]`

Aucune recommandation ne se construit sur un trou sans le dire.

## 6. Le catalogue est la seule chose éditée à la main

`catalogue.txt` → `scaffold` crée les fichiers manquants → `etat` recalcule
`CATALOGUE.md` → `pack` reconstruit `dist/`.

`scaffold` n'écrase jamais un fichier existant : on peut le relancer sans risque
à chaque nouveau module.
