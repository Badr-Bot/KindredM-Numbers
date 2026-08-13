---
name: formation-ingest
description: Transforme la transcription brute d'une leçon de formation en note structurée prête à coller dans Notion, et met à jour l'index et le bundle. À utiliser quand l'utilisateur colle un verbatim de vidéo, dit "j'ai la transcription de la leçon X", "fais-moi la note de MB-07", "ajoute cette leçon", ou demande de mettre à jour la base de connaissance de la formation.
---

# Ingérer une leçon : verbatim → note → corpus

Une leçon entre dans le corpus en trois écritures : la transcription, la note,
l'index. Si une des trois manque, les skills qui lisent le corpus travaillent
sur une base fausse — soit ils ne trouvent pas la leçon, soit ils la trouvent
sans savoir qu'elle est incomplète.

## Étapes

**1. Identifier la leçon.** Code (`MB-07`), module, titre exact tel qu'affiché
dans Skool. Si l'utilisateur ne donne qu'un titre approximatif, retrouve la
ligne correspondante dans `formation/INDEX.md` — n'invente pas un numéro.

**2. Créer les fichiers s'ils n'existent pas :**
```bash
node scripts/formation-nouvelle-lecon.mjs media-buying 7 "0-10k Day Protocole"
```
Le script est idempotent : il ne touche pas à un fichier existant.

**3. Écrire le verbatim** dans `formation/transcriptions/<module>/`, entre les
marqueurs `<!-- VERBATIM -->` et `<!-- /VERBATIM -->`. Tel quel. Tu ne corriges
ni l'orthographe, ni la syntaxe, ni les répétitions. Un verbatim retouché perd
sa fonction d'arbitre. Remplis l'en-tête (durée, URL) avec ce que tu as.

**4. Produire la note** en appliquant intégralement
`formation/prompts/transcription-vers-note.md`. Lis-le à chaque fois, ne
travaille pas de mémoire : ses contraintes (aucun chiffre non prononcé, aucune
bonne pratique ajoutée, section « Angles morts » obligatoire) sont ce qui rend
le corpus fiable. Écris le résultat dans `formation/notes/<module>/`, même nom
de fichier.

**5. Mettre à jour `formation/INDEX.md`** : statut de la ligne (`brut` → `note`)
et liens vers les deux fichiers.

**6. Régénérer le bundle :**
```bash
node scripts/formation-bundle.mjs
```

**7. Rendre compte** en trois lignes : combien de règles extraites, combien de
chiffres, et la liste des passages `[[?]]` que tu n'as pas su interpréter. Ce
dernier point est le plus important — c'est la todo-list de relecture humaine.

## Le statut, et pourquoi tu ne le passes jamais à `ok`

- `brut` — transcription présente, note absente ou squelettique.
- `note` — note rédigée par toi, **pas encore relue par un humain**.
- `ok` — Badr a relu et validé.

Tu écris `note`. Jamais `ok`. Une note passe à `ok` quand un humain l'a lue :
c'est le seul garde-fou contre une extraction qui aurait silencieusement
déformé un seuil, et un seuil déformé, ici, se traduit en budget publicitaire
réel. Si l'utilisateur te dit explicitement « je l'ai relue, passe-la en ok »,
là tu le fais.

## Quand la transcription contredit ce qu'on croyait savoir

Ça arrivera, notamment sur les protocoles : `MEMO.md` porte déjà une version
travaillée du protocole de scaling Master (validée le 03/08), et MB-07 à MB-10
sont les leçons d'origine. Si le verbatim annonce des seuils différents de ceux
du MEMO, **tu ne modifies pas le MEMO** et tu ne lisses pas la note. Tu écris la
note fidèle au verbatim, puis tu signales la divergence en fin de rapport :

> ⚠️ Divergence MB-08 / MEMO.md : la leçon annonce +20 % sur le palier
> 200-600 €/j, le MEMO applique +25 %. Le MEMO a été validé par Badr le 03/08 —
> à trancher par lui, je n'ai rien changé.

Le MEMO est la loi opérationnelle ; la formation est la doctrine. Quand les
deux divergent, c'est une décision de Badr, pas un bug à corriger.

## Cas particuliers

- **Transcription très longue (>1 h de vidéo).** Traite-la en une passe quand
  même : découper fait perdre les renvois internes (« comme je disais tout à
  l'heure… » porte souvent le seuil réel). Si le volume est ingérable, découpe
  par chapitre du support, jamais au milieu d'un raisonnement.
- **Vidéo sans transcription disponible.** Ne fabrique rien à partir du titre et
  du descriptif. Crée le fichier avec le descriptif Skool, statut `brut`, et
  dis-le. `formation/notes/media-buying/12-l-algorithme-meta.md` montre à quoi
  ressemble une capture partielle honnête.
- **Plusieurs leçons collées d'un coup.** Une leçon = un fichier. Sépare-les
  d'abord, traite-les une par une, un seul rapport final.
