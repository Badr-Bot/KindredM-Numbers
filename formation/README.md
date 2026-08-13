# Base de connaissance — Formation MASTER (Media-Buying)

Ce dossier est le **cerveau** de la formation : une leçon = un fichier, avec la
transcription brute d'un côté et une note propre (copiable dans Notion) de
l'autre. Les skills Claude (`.claude/skills/formation-*`) ne répondent qu'à
partir de ce qu'il y a ici. Rien d'autre.

## Pourquoi cette séparation

| Dossier | Contenu | À quoi ça sert |
|---|---|---|
| `transcriptions/` | Le verbatim brut de la vidéo, non retouché | La source de vérité. On peut toujours y revenir pour vérifier une citation. |
| `notes/` | La leçon reformulée, structurée, actionnable | Ce que tu copies dans Notion, et ce que Claude lit en priorité. |
| `templates/` | Les gabarits vierges | Pour que chaque leçon ait exactement la même forme. |
| `prompts/` | Les prompts de conversion | Transcription brute → note propre, en une passe. |
| `BUNDLE.md` | Tout concaténé (généré) | Le fichier unique à uploader dans un Projet Claude ou un GPT. |

La règle : **on ne réécrit jamais une transcription**. Si une note est fausse,
on la corrige à partir de la transcription, pas l'inverse.

## Le workflow, de la vidéo au skill

1. **Récupérer la transcription.** Sur Skool, la vidéo est hébergée (Loom /
   YouTube / Vimeo selon les leçons). Trois options, par ordre de préférence :
   - le bouton *Transcript* du lecteur s'il existe → copier-coller ;
   - l'extension navigateur de transcription YouTube/Loom ;
   - à défaut, un outil de transcription audio (Whisper) sur l'enregistrement.

2. **Créer la leçon** — ça scaffolde les deux fichiers d'un coup :
   ```bash
   node scripts/formation-nouvelle-lecon.mjs media-buying 12 "L'algorithme Meta"
   ```
   Tu obtiens `transcriptions/media-buying/12-l-algorithme-meta.md` et
   `notes/media-buying/12-l-algorithme-meta.md`, tous les deux pré-remplis avec
   l'en-tête normalisé.

3. **Coller le verbatim** dans le fichier de `transcriptions/`, sous la ligne
   `<!-- VERBATIM -->`. Ne corrige pas les fautes, ne résume pas.

4. **Générer la note.** Demande à Claude : *« applique le prompt
   `formation/prompts/transcription-vers-note.md` à la leçon 12 »*. Il lit la
   transcription et remplit la note au format canonique.

5. **Vérifier et publier.** Relis la note (5 min), puis
   `node scripts/formation-bundle.mjs` régénère `BUNDLE.md` et met à jour les
   compteurs de `INDEX.md`.

6. **Copier dans Notion.** Ouvre le fichier de `notes/`, sélectionne tout,
   colle dans une page Notion : le markdown est converti automatiquement
   (titres, tableaux, listes, citations). Voir `templates/note.md` pour ce qui
   passe bien et ce qui casse.

## Les trois usages, une seule source

- **Claude Code (ici)** — les skills lisent directement les fichiers. C'est le
  mode le plus puissant : Claude croise la formation avec tes vraies données de
  `src/lib/` et du dashboard NIVA.
- **Projet Claude (claude.ai)** — uploade `BUNDLE.md` + le contenu de
  `.claude/skills/formation-master/SKILL.md` comme instructions du projet.
- **GPT personnalisé (ChatGPT)** — même chose : `BUNDLE.md` en knowledge file,
  le SKILL.md en instructions système. Voir `../docs/formation-gpt.md`.

## L'invariant qui rend tout ça utile

Chaque affirmation d'une note porte sa source : `[MB-12]` = module
media-buying, leçon 12. Les skills ont l'ordre de citer ce code à chaque
réponse et de dire explicitement « pas couvert par la formation » quand ils
sortent du corpus. Sans ça, tu ne sais jamais si Claude te ressort le cours ou
sa culture générale Meta Ads — et c'est précisément la différence que tu paies.
