# Monter le GPT / Projet Claude à partir du corpus

Le corpus (`formation/`) sert trois interfaces. Même source, trois façons de la
brancher. Par ordre de puissance décroissante.

## 1. Claude Code, ici — le mode fort

Rien à installer. Les skills sont dans `.claude/skills/` et se déclenchent
tout seuls quand tu poses une question du domaine :

| Tu demandes | Skill qui prend la main |
|---|---|
| « la formation dit quoi sur les bid caps ? » | `formation-master` |
| « voilà la transcription de la leçon 7 » | `formation-ingest` |
| « je scale quoi aujourd'hui ? » | `verdict-scaling` |
| « audite mon compte » | `audit-compte` |

Tu peux aussi les appeler par leur nom : *« utilise verdict-scaling sur les
7 derniers jours »*.

**Pourquoi c'est le mode le plus puissant :** Claude lit ici la formation *et*
tes vraies données — `src/lib/roasReport.ts`, les seuils dynamiques par produit,
les décisions déjà tranchées dans `MEMO.md`, les outils Meta en lecture. Un GPT
en connaît la théorie ; ici il croise la théorie avec ton compte. C'est la
différence entre « le protocole dit +20 % sur ce palier » et « LANCASTER est à
2,82× sur 3 jours, palier 200-600, donc +20 % → 504 €/j ».

## 2. Projet Claude (claude.ai) — pour l'usage mobile

Utile quand tu es dans le BM sur ton téléphone et que tu veux vérifier une
règle sans ouvrir le repo.

1. `node scripts/formation-bundle.mjs` → produit `formation/BUNDLE.md`.
2. Sur claude.ai : **Projets → Nouveau projet**, nomme-le « MASTER — media
   buying ».
3. Uploade `formation/BUNDLE.md` dans la base de connaissance du projet.
4. Dans **Instructions du projet**, colle le contenu de
   `.claude/skills/formation-master/SKILL.md` (sans le frontmatter YAML des
   quatre premières lignes), en remplaçant le tableau « Le corpus » par une
   ligne : *« Le corpus est le fichier BUNDLE.md joint au projet. »*
5. Ajoute `.claude/skills/verdict-scaling/SKILL.md` en second fichier si tu
   veux les verdicts — mais sans accès aux données, il te demandera les
   chiffres à la main.

**À refaire à chaque leçon ajoutée** : le fichier uploadé est une copie figée,
il ne se met pas à jour tout seul. Relance le script, remplace le fichier.

## 3. GPT personnalisé (ChatGPT)

Même logique, vocabulaire différent.

1. **Explorer → Créer un GPT → Configure**.
2. *Instructions* : le contenu de `formation-master/SKILL.md`, même adaptation
   que ci-dessus.
3. *Knowledge* : uploade `BUNDLE.md`.
4. Coupe **Web Browsing**. C'est contre-intuitif mais central : le web est
   précisément la source de bruit que ce projet existe pour éliminer. Un GPT
   qui peut chercher en ligne complétera les trous du corpus avec des articles
   génériques, sans te dire qu'il l'a fait — et tu perds la seule garantie qui
   t'intéresse.
5. Garde Code Interpreter si tu veux lui faire mouliner des exports CSV du BM.

## Quel fichier uploader

| Fichier | Contenu | Quand |
|---|---|---|
| `BUNDLE.md` | Notes uniquement | Par défaut. Dense, relu, ~10× plus léger. |
| `BUNDLE-COMPLET.md` | Notes + transcriptions brutes | Seulement si tu veux pouvoir citer le verbatim. Généré par `--avec-transcriptions`. |

Le verbatim brut noie le contexte : sur une longue transcription, le modèle
retrouve moins bien un seuil précis que dans une note structurée. Commence par
`BUNDLE.md`.

## Le test qui vérifie que le montage tient

Une fois le GPT ou le projet créé, pose-lui une question dont tu sais qu'elle
**n'est pas** dans le corpus. Par exemple, tant que MB-09 n'est pas
transcrite : *« quel est le protocole entre 35k et 100k par jour ? »*

- Bonne réponse : « Cette leçon n'est pas encore dans le corpus (MB-09). »
- Mauvaise réponse : un protocole plausible, bien présenté, sans source.

Si tu obtiens la seconde, les instructions n'ont pas pris — reprends l'étape
des instructions avant d'utiliser l'outil pour décider quoi que ce soit. Refais
ce test après chaque gros ajout au corpus : c'est trente secondes, et c'est la
seule chose qui distingue cet outil d'un chatbot qui te dit ce que tu veux
entendre.
