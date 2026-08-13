# Le prompt à coller dans Claude Code sur ton desktop

Ouvre Claude Code sur ta machine (celle où tu es connecté à Skool dans Chrome),
et colle tout ce qui est entre les deux lignes.

---8<---

Tu vas aspirer une formation Skool et en faire une base de connaissance. Tout
l'outillage existe déjà, ne le réécris pas.

## 1. Récupérer le dépôt

```bash
git clone https://github.com/Badr-Bot/KindredM-Numbers.git
cd KindredM-Numbers
git checkout claude/formation-gpt-transcriptions-sm1fv6
```

Si tu l'as déjà : `git checkout claude/formation-gpt-transcriptions-sm1fv6 && git pull`.

Lis d'abord `formation-master/README.md` et `formation-master/CONVENTIONS.md`.
Ils fixent les règles du corpus — surtout le champ `statut`, qui pilote tout.

## 2. Aspirer le classroom

```bash
npm i -D playwright
npx playwright install chromium
node formation-master/scripts/aspirer.mjs
```

Un navigateur s'ouvre. **C'est l'utilisateur qui se connecte à Skool dans cette
fenêtre**, pas toi : ne demande jamais son mot de passe, ne le lis pas, ne
l'écris nulle part. Le profil est persistant (`.skool-profile/`), donc la
connexion n'est à faire qu'une seule fois.

Le script parcourt les modules puis les leçons et écrit
`formation-master/.capture/capture-complete.json`.

Variables utiles :
- `SKOOL_URL=...` si le classroom n'est pas `skool.com/master/classroom`
- `SKOOL_LIMITE=5` pour un essai rapide avant de tout lancer
- `SKOOL_PAUSE=2000` si le site est lent

**Si le script ne trouve rien ou plante** : ne l'abandonne pas, adapte-le. Les
sélecteurs de Skool peuvent avoir changé. Ouvre la page, regarde le DOM réel,
corrige `aspirer.mjs`, relance. Dis à l'utilisateur ce que tu as changé.

**Regarde s'il y a des pistes de sous-titres** dans le résultat (`sous_titres`).
S'il y en a, c'est le jackpot : la transcription devient quasi gratuite et il
n'y a pas besoin de Whisper. Signale-le tout de suite.

## 3. Importer

```bash
cd formation-master
python3 scripts/importer.py .capture/capture-complete.json            # aperçu
python3 scripts/importer.py .capture/capture-complete.json --ecrire   # applique
```

L'import ajoute les leçons inconnues dans `catalogue.txt` sous
`## À CLASSER`. **Range-les dans les bons modules** (respecte l'ordre Skool),
puis :

```bash
python3 scripts/formation.py scaffold
python3 scripts/formation.py etat
```

## 4. L'audio des vidéos

Seulement si l'étape 2 n'a pas trouvé de sous-titres.

Les URLs vidéo sont dans la capture (`medias`). Récupère les fichiers, nomme-les
avec le numéro de leçon en tête (`12 - L'algorithme Meta.mp4`), puis :

```bash
pip install faster-whisper
python3 scripts/transcrire.py <dossier>            # aperçu
python3 scripts/transcrire.py <dossier> --ecrire   # lance
```

C'est long (1× à 3× la durée des vidéos) : lance-le en tâche de fond et
continue le reste pendant ce temps.

## 5. Rédiger les notes

Pour chaque leçon dont la transcription est remplie, écris la note Notion dans
`notes/<module>/`. La skill `formation-ingest` du dépôt donne la structure exacte
et les règles. Les trois qui comptent :

- **Zéro invention.** Un chiffre qui n'est ni prononcé ni affiché dans la vidéo
  n'entre pas. Si tu complètes, tu l'étiquettes
  `> ⚠️ Hors formation — déduction, pas dit dans la vidéo.`
- **`statut: complet` veut dire la vidéo entière**, pas « j'ai un bon résumé ».
  Gonfler ce champ est la seule façon de casser durablement la confiance.
- **Markdown pur** — la note doit se coller telle quelle dans Notion.

## 6. Construire le pack et pousser

```bash
python3 scripts/formation.py etat
python3 scripts/formation.py pack
```

Puis commit et push sur `claude/formation-gpt-transcriptions-sm1fv6`.
Ne pousse jamais `.capture/` ni `.skool-profile/` (déjà dans `.gitignore`).

Enfin, dis à l'utilisateur, en clair :
- combien de leçons sont `complet`, `partiel`, `a-transcrire` ;
- s'il y avait des sous-titres ;
- ce qui a bloqué, s'il y a eu un blocage ;
- que `formation-master/dist/` est prêt à être uploadé dans son GPT, avec le
  prompt système de `formation-master/gpt/INSTRUCTIONS-GPT.md`.

Ne dis pas que c'est fini tant que `etat` ne le montre pas. Si une partie a
échoué, termine tout le reste et dis précisément ce qui manque et pourquoi.

---8<---
