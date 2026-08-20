# Formation MASTER — base de connaissance

Projet **autonome**. Il ne dépend de rien d'autre dans ce dépôt et ne parle ni du
dashboard, ni du protocole de scaling : ce sont deux sujets séparés. Le dossier
`formation-master/` + `.claude/skills/formation*` peut être déplacé tel quel dans
son propre dépôt le jour où tu veux.

**But** : transformer les vidéos de la formation en une base de connaissance
propre, puis en un GPT / Projet Claude qui répond **uniquement** d'après elle —
et qui dit « je ne sais pas » quand la formation ne le dit pas.

---

## Où on en est

```bash
cd formation-master
python3 scripts/formation.py etat
```

Affiche l'avancement et régénère `CATALOGUE.md`.

Aujourd'hui : **1 module recensé (Media-Buying, 15 leçons), 0 transcrite.**
Les autres modules sont à ajouter dans `catalogue.txt`.

---

## Le cycle, en 4 commandes

```bash
python3 scripts/formation.py scaffold   # catalogue.txt → crée les fiches manquantes
python3 scripts/importer.py <capture>   # remplit avec le texte aspiré de Skool
python3 scripts/formation.py etat       # avancement + CATALOGUE.md
python3 scripts/formation.py pack       # construit dist/ à uploader dans le GPT
```

Aucune n'écrase du travail déjà fait. Tu peux les relancer autant que tu veux.

---

## Comment le remplir sans y passer tes soirées

👉 **`COMMENT-TRANSCRIRE.md`** — c'est le document important.

En résumé : je n'ai aucun accès à Skool (bloqué par la politique réseau de la
session, et le navigateur d'ici n'a pas ta session). L'extraction part donc de
**ton** navigateur, via `scripts/skool-capture.js` : un copier-coller dans la
console Chrome aspire un module entier — titres, durées, descriptions, liens —
sans ouvrir une seule vidéo. Le reste, je le fais.

L'audio des vidéos vient après, en tâche de fond, avec `scripts/transcrire.py`
(Whisper en local, gratuit, tu lances le soir).

---

## Structure

```
formation-master/
  catalogue.txt        ← LE SEUL fichier que tu édites à la main
  CATALOGUE.md         ← généré : l'avancement, leçon par leçon
  CONVENTIONS.md       ← les règles du corpus (statuts, provenance, zéro invention)
  COMMENT-TRANSCRIRE.md
  transcriptions/<module>/NN-slug.md   ← le verbatim = la source
  notes/<module>/NN-slug.md            ← les notes Notion à copier-coller
  dist/                ← généré : ce qu'on uploade dans le GPT
  gpt/INSTRUCTIONS-GPT.md              ← le prompt système à coller
  scripts/
    formation.py       scaffold | etat | pack
    skool-capture.js   à coller dans la console Chrome
    importer.py        capture → fiches
    transcrire.py      audio → fiches (Whisper local)
```

---

## Les deux skills Claude

Dans `.claude/skills/`, actives automatiquement dans ce dépôt :

- **`formation`** — répond aux questions média-buying **uniquement** d'après le
  corpus, en citant `module · leçon · titre`. Si la leçon n'est pas transcrite,
  elle le dit au lieu d'inventer.
- **`formation-ingest`** — transforme du brut (verbatim collé, sous-titres,
  capture Skool) en fiche propre + note Notion, et met les statuts à jour.

Pour ChatGPT, l'équivalent est dans `gpt/INSTRUCTIONS-GPT.md`.

---

## Le principe à retenir

Le système est utile **dès le premier module**, et s'améliore à chaque leçon
ajoutée. Tu n'as pas besoin de tout transcrire avant d'en tirer quelque chose.

Sa valeur ne vient pas de ce qu'il sait, mais de ce qu'il **refuse d'inventer** :
un assistant qui répond toujours ne sert à rien, parce qu'on ne sait jamais quand
le croire.
