---
module: MASTER IA
lecon: 9
titre: "Génération de B-Rolls Vidéo IA en automatique"
duree: "19:51"
url: "https://www.skool.com/master/classroom/9d4ca2d4?md=d1aa26dd3a6544bd8dc97b98d1ac52f7"
statut: complet
source: skool-master
maj: 2026-08-13
---

# 09 — Génération de B-Rolls Vidéo IA en automatique

`Section Skool : Manus IA`

## Ce que la leçon annonce

> **Source : page de la leçon (texte Skool)**

### Introduction

Génère 22 b-rolls vidéo en automatique avec Manus & Kling, sans toucher à quoi que ce soit.

---

### Ce que tu vas apprendre

Dans cette vidéo, tu vas apprendre à construire un pipeline de génération de b-rolls en masse, entièrement piloté par Manus et Higgsfield. Tu verras comment extraire les scènes vidéo de publicités concurrentes pour en tirer des prompts validés par le marché, comment structurer et compléter un template de génération, et comment lancer Manus pour qu'il opère de façon autonome sur l'interface Higgsfield et génère tes vidéos en cascade, sans intervention manuelle. À la clé : des dizaines de b-rolls prêts à monter pour tes ads, en quelques heures.

---

### Mindset / Vision

La clé de ce process, c'est le volume. Tu ne cherches pas la perfection sur chaque vidéo, tu cherches un pipeline qui tourne pendant que tu fais autre chose, et qui te livre 50 à 70% de vidéos directement exploitables. C'est ça, la vraie scalabilité créative.

---

### Timestamps

00:00 - Objectif et personnalisation
01:49 - Vue d’ensemble et prérequis
03:06 - Méthode A : extraire des scènes
08:11 - Compléter le template Manus
10:01 - Génération Higgsfield et téléchargement

---

### Tags (Pour optimisation de recherche Skool)

`b-roll automatique` `Manus IA` `Higgsfield vidéo` `génération vidéo IA` `publicité vidéo automatisée`

## Ressources

- [Notion](https://www.notion.so/projettt/MODULE-MANUS-AI-MASTER-30fbba550d7181b799b1e14798547936)

## Transcription

> **Source : audio (Whisper local, modèle small)**

[00:00] Ok, donc on va voir comment générer des b-rolls en automatique avec Manus et X-FIL, ici j'ai mis 22+, donc ça dépend de vous. On peut générer autant de b-rolls qu'on souhaite, tout dépend des crédits qu'on est prêt à consommer sur Manus et sur X-FIL. Donc je vais vous montrer ce process complet de générations de b-rolls et avant tout,

[00:24] avant de vous montrer le process, tout est personnalisable. Je vous préviens, tout est personnalisable, donc chaque valeur entre crochet que ce soit dans les promptes ou autres est un champ modifiable. Donc si par exemple comme je vous le disais, vous voulez 50 b-rolls au lieu de 22, vous avez simplement à mettre 50.

[00:45] Si vous en voulez 100, vous faites pas 100. Si vous voulez 200, vous faites 200. Je l'ai testé jusqu'à 220. Ça fonctionne mais ça prend du temps. Donc pour les 220 b-rolls quand je l'avais fait, ça m'avait mis je crois quelque chose comme 3 ou 4 heures. Donc c'était automatique, ça tournait automatiquement, mais voilà.

[01:05] C'est pour préciser. Et ça consomme aussi des crédits. Donc faites attention à vos crédits X-FIL et Manus. Donc voilà, c'est pour ça. Pour cet exemple, je vais le faire avec 22 b-rolls. Donc voilà, mais évidemment tout est modifiable. Donc là pour le nombre de b-rolls, mais aussi par exemple le modèle. Donc si vous voulez utiliser Kling 1.6,

[01:25] si vous voulez utiliser peut-être VO3, Kling 3.0, pareil pour le format. Donc si vous voulez, je sais pas, un format téléphone, 916. Et bien voilà, si vous voulez un format plus ordinateur, 159e, voilà. Donc tout est modifiable, le nombre de secondes, voilà. Petite précision avant de commencer.

[01:49] Donc sur la vue d'ensemble, l'objectif comme je vous le disais, ça va être de générer 22 b-rolls avec X-FILD en automatique piloté par X-FILD via notre navigateur Chrome. Donc le process, il consiste en trois états. Donc déjà obtenir les promptes, c'est la base.

[02:09] Pour ça, on aura deux méthodes. Donc on verra par la suite les deux méthodes pour obtenir les promptes. Ensuite, compléter le template avec ces promptes, ces manus qui veulent faire, c'est pas nous. Et lancer d'exécution. Donc les pré-requis, évidemment, il vous faut un compte X-FILD avec un abonnement. Donc moi je conseille plus Ultimate ou encore mieux, Créateur-Plan.

[02:34] Donc avec des crédits. Et donc les Chrome connectés, déjà ouvert sur X-FILD. Et évidemment, comme on l'a configuré précédemment, le connecteur Chrome activé dans Manus, pour qu'il l'utilisons dans l'angle Chrome. Donc voilà. Et donc, bien sûr, les documents fondamentaux qu'on a généré à la première étape.

[03:00] Donc voilà. Ensuite, pour obtenir les promptes. Donc on va passer à l'étape 1, la première étape pour créer les promptes. Les scènes de Birol. C'est là où je vous disais, il y a deux méthodes. Donc au choix, ça c'est vous qui choisissez. Donc la première méthode, c'est d'extraire les scènes depuis les ads vidéo concurrent.

[03:21] Donc moi je préconise cette méthode parce que là on se base directement sur des vidéos qui fonctionnent avec des scènes qui fonctionnent, avec des Birol qui fonctionnent, prouvé par le marché. Donc vous pouvez les extraire, enfin sourcer ces vidéos concurrentes. Soit, par exemple, si vous avez un concurrent en tête ici, pour l'exemple, je vais prendre Rise. Donc je vais aller sur Get Hook ou Brand Search ou Trend Track ou l'Ad Librairie.

[03:45] Je vais télécharger les vidéos qui ont bien fonctionné de Rise et je vais en extraire les scènes. Je vais vous montrer comment faire. Ça c'est la méthode A. Donc je vais aller dans le détails par la suite. Ensuite, la méthode B, c'est simplement à partir des fichiers qu'on a créés dans notre projet Manus, laisser Manus gérer les promptes.

[04:08] Donc il a déjà toute la data sur notre projet. Il a déjà fait des recherches. Il a déjà les offres, lavatar, tout. Donc il peut générer des promptes, des scènes vidéo qui seront déjà très pertinentes. Donc c'est vous qui voyez. Soit vous laissez Manus générer les promptes, soit vous obtenez les promptes via des ads

[04:34] déjà prouvé d'un concurrent. Donc pour la présentation, je vais vous montrer comment on fait cette étape A. La méthode A pour extraire les scènes depuis les ads vidéo des concurrents. Comme je vous le disais, le principe c'est de récupérer déjà des vidéos du concurrent. Là, moi je vais aller chercher des vidéos sur Get-Ou et je vais télécharger par exemple

[05:02] on va dire 5 ou 10 ads du concurrent. On se retrouve sur le sourcing vidéo. Là pour le coup, je peux aller sur Get-Ouq chercher ces vidéos. Je vous montre ça. Là, je suis sur l'ads libérer d'un concurrent. Je vais pouvoir télécharger les 10 ads qui me conviennent.

[05:25] Comme critères, souvent j'aime bien le rating et surtout le temps où l'ads a été active. Ça et aussi les scènes à l'intérieur des ads. J'aime bien regarder les ads avant de les télécharger pour regarder quelle scènes me correspondent.

[05:46] Je vais sélectionner 10 ads et les télécharger et je reviens vers vous dès que c'est fait. Là, j'ai mis 10 ads. Je vais pouvoir aller sur l'étape de récupérer les ads et faites.

[06:11] Je vais pouvoir envoyer les vidéos à Manus et lui envoyer le prompt. Je copie le prompt. Je vais sur mon projet Manus. C'est très important d'aller sur son projet qui a les data avec tous les fichiers qu'on a généré précédemment. Je lui colle le prompt. J'importe les vidéos que j'ai téléchargées.

[06:34] Là, le prompt s'est collé en Pastel Content. Je vais lui dire Execute Pastel. Ok. Juste attendre que les vidéos se téléchargent bien dans Manus. Ok, c'est tout bon.

[07:00] Là, je peux utiliser le 1.6 pour 10 vidéos. Ça me paraît suffisant. Après, si vous avez plus de vidéos, je vous conseille quand même d'utiliser le 1.6 Max. Je vais envoyer. Il va faire les descriptions de chaque scènes de vidéo et les prompts.

[07:29] Je vous reprends une fois qu'il a terminé. Ok, il a bien terminé. Il nous a généré nos prompts avec les petites descriptions. Donc là pour nos 22 scènes, car on lui a spécifié 22 scènes dans le prompt. Donc au début, juste ici, comme je vous le disais, nous entre autres, on voulait générer

[07:53] 22 scènes. Vous, vous auriez pu par exemple générer 100 scènes pour générer 100 bírol. Voilà. Comme je vous disais, les caractères entre crochets sont complétables à chaque étape pour adapter au nombre de scènes que vous voulez. Donc voilà, on va pouvoir passer à l'étape suivante.

[08:13] Juste avant, on va télécharger le document et ensuite on va passer à l'étape 2. Donc là, on va faire compléter Manus, le prompt complet de générations d'images qui est actuellement vierge. On va lui faire compléter, qui est là avec du coup les encards qui sont vierges, que ce

[08:37] soit les descriptions ou les prompts pour Xfill. Donc on va télécharger ça, lui importer directement et donc on va réimporter, enfin importer du coup le document qui vient de nous générer avec les prompts à l'intérieur. Là maintenant, on a les deux documents et on va lui dire de compléter ce document

[09:04] avec celui-ci grâce à ce prompt. Donc là encore une fois, les prompts sont complétables. Donc si jamais vous avez, je ne sais pas si vous avez généré 100 scènes, vous mettez ici 100 scènes. Donc voilà, je vais lui envoyer ça et il va me générer du coup le fichier final que

[09:33] je vais pouvoir lancer par la suite. Je lui envoie et je vous reprends juste après une fois qu'il va terminer. Ok, donc c'est bon, on a bien notre instruction complète qui est totalement complétée, donc avec les prompts qu'on a généré précédemment. Donc voilà, ok, on va le télécharger du coup.

[09:59] Parfait, et on va pouvoir passer à l'étape suivante, qui est du coup de lancer la génération via Xfield. Donc je vais ouvrir Xfield, je vais me connecter dans un nouvel onglet et après je vais pouvoir envoyer le prompt. Donc j'ouvre Xfield, je me connecte et je vous reprends tout de suite.

[10:19] Ok, donc c'est bon, je suis bien connecté, je suis bien dans vidéo, create a video et là je vais pouvoir commencer la génération automatisée. Donc je vais me rendre sur le chat manus. Avant de commencer la génération, je vais vous préciser encore une fois que tout est personnalisable.

[10:44] Donc chaque valeur entre crochet est un champ modifiable. Donc si vous vouliez, par exemple, comme je vous disais précédemment, 50, 100, B-roll, etc. Changer le modèle de génération, par exemple changer de VO3 à Kling, la durée des vidéos à 4 secondes. Vous avez juste à changer les crochets du prompt par ce que vous souhaitez.

[11:07] Ok, donc je vais vous montrer pour l'exemple. Donc là on a téléchargé ce document, on tient l'intégralité des instructions. Donc là, je vais pouvoir, par exemple, modifier les paramètres juste ici qui sont entre

[11:29] crochet. Donc là, par exemple, si je vais modifier la durée des vidéos à 4 secondes, j'ai juste à modifier la durée des vidéos à 4 secondes. Donc là, le prompt sera spécifié pour des durées de vidéos à 4 secondes. Si par exemple j'ai un plan qui autorise sur X-field uniquement des générations simultanées

[11:53] à peut-être 6 générations simultanées, je vais changer par 6 ici. Si par exemple je vais changer le modèle d'IA, je le change juste ici par Kling, par exemple, ou CDN, etc. Donc voilà pour l'exemple, donc là, par exemple je vais changer parce que j'ai envie d'avoir

[12:14] des générations avec Kling. Ok, donc je vais mettre Kling juste ici. Et voilà, donc là mon prompt est complété avec les infos que je souhaite. Donc voilà, adapter selon ce que vous voulez. Et selon par exemple les modèles d'IA que vous voulez, ils consomment plus ou moins

[12:39] tous de crédit, donc que ce soit pour la longueur de générations vidéo, que ce soit pour le modèle, etc. Ils ont tous une consommation de crédit différente, donc vous pouvez adapter ça aussi en fonction. Donc voilà. Maintenant je vais passer à l'étape suivante. Donc je vais importer mon prompt dans Manus, donc je l'importe dans Manus.

[13:06] Et du coup je vais pouvoir directement exécuter la tâche, donc faire en sorte que Manus génère à l'intérieur de l'X-File grâce au compte. Ok, donc là on vérifie bien que notre onglet Chrome X-File est ouvert. C'est bon, je suis connecté, c'est ouvert, j'ai assez de crédit.

[13:27] Ok. Et maintenant on a envoyé le document complét Manus. On peut lui dire directement d'exécuter le document joint. Donc on envoie ce petit prompt. Tac. Donc on vérifie bien encore une fois que le navigateur est activé. Donc là il n'est pas activé, je l'active.

[13:49] Ok, comme ça il a accès à l'onglet. Je colle l'instruction, j'envoie. Et là il va pouvoir générer les vidéos sur X-File. Je vais vous montrer. Donc là il va accéder à l'onglet soit ouvrir un nouvel onglet soit accéder à cet onglet.

[14:14] Donc voilà, là il me demande d'autoriser un nouvel onglet. Donc oui, je vais autoriser. Donc là il a ouvert un nouvel onglet, il n'a pas utilisé mon onglet. Donc c'est pas grave, je vais pouvoir le fermer. Et là, donc il est bien sur X-File. Et vous allez voir de lui-même, il va aller sur vidéo.

[14:35] Ça prend un peu de temps. Et il va exécuter le process. Donc là il a cliqué sur vidéo. Il arrive donc sur la page vidéo. Et là il va pouvoir copier. Bon là je ne peux pas agir parce que c'est lui qui est en train d'agir sur navigateur.

[14:58] Mais il va copier dans la zone le prompt, le premier. Et il va commencer à générer en casquade les vidéos. Normalement il vous dit qu'il est en train de faire sur l'onglet. Donc là ça va bégé, je vais actualiser.

[15:24] Donc ça charge. Là il vous dit que ok, je commence la sous-vague 1. Je vais lancer les premières générations. Donc là il vous dit qu'il clique sur les champs etc. Là par exemple il a rentré le prompt à l'intérieur. Et vous pouvez voir que la première vidéo est lancée. Il est en train de la générer.

[15:46] Donc voilà pour ça. Je vais couper et je vous reprends une fois qu'il a terminé toutes les générations. Ok, petite précision. Pendant ce temps qu'il est en train de générer les vidéos. Vous pouvez très bien ouvrir un nouvel onglet. Donc sur XFILD. Et si vous souhaitez voir l'output qu'il est en train de générer.

[16:10] Accéder donc au vidéo qu'il est en train de générer. Vous pouvez totalement. Il est en train d'agir sur cet onglet là. Et moi je peux voir l'output qui est en train de se générer au même moment. Dans un onglet autre. Donc vous inquiétez pas. Vous pouvez très bien accéder à XFILD. Pendant qu'il est en train de faire les générations. Ce que je voulais préciser.

[16:31] Donc voilà. Il est encore en train de générer les vidéos. Il n'a pas fini. Mais comme je vous disais. Je peux accéder pendant ce temps. Il peut être télécharger les vidéos. Pendant ce temps que lui est en train de les générer. Comme ça je gagne du temps. Donc là je peux check. Je peux ouvrir la vidéo.

[16:53] Je peux voir. Et en fait télécharger toutes les vidéos qui me conviennent comme ça. Je vais dire que je gagne un peu de temps. Et aussi petite précision. Je vous conseille quand même. De double check les vidéos. Parce que c'est la génération IA. Les vidéos ne seront pas toutes parfaites.

[17:16] Évidemment. C'est de la production de masse. Donc si vous générez peut-être 100, 200, 300 vidéos. Il aura peut-être 50% qui seront utilisables. Allez. 70% qui seront utilisables. Mais ça permet quand même. Avec un gros volume. De gagner énormément de temps.

[17:37] C'est surtout pour ça. On l'utilise. Je télécharge les vidéos. Et je reviens vers vous aussi dès qu'il a terminé. Donc là parfait. Il nous a montré qu'il avait un petit problème. Ok. Donc là il me dit que le texte RA de l'onglet Xfill a un petit problème. Donc il s'arrête.

[17:59] Il nous demande la permission d'agir. Si jamais vous aurez. En fait une petite notification de sa part. Comme quoi il est bloqué. On va prendre le contrôle de l'onglet. Et là il me dit ok le texte RA se vide pas. Je vais lui videz le texte RA. Normalement si je fais résume. Je renvoie comme quoi c'est bon j'ai videz le texte RA.

[18:25] Il peut reprendre et il continue en toute autonomie. Donc en général ça n'arrive jamais. Donc en général ça n'arrive pas. Il est autonomie. Il régule ses propres problèmes. Mais parfois comme ça. Il a une petite intervention nécessaire. Donc voilà.

[18:46] Ok. Donc c'est bon. Il a fini les générations vidéo. Là il s'est arrêté car il nous demande pour télécharger les vidéos. Mais je ne vais pas le laisser continuer. Car je vais les télécharger à la main. Donc je vais lui dire stop. Comme ça il va s'arrêter. Et je vais moi-même télécharger les vidéos. Après vous pouvez aussi lui dire de télécharger les vidéos.

[19:09] C'est rapide pour 22 vidéos ça va je vais le faire. Ok. Donc je fais takeover. Et là une par une je vais télécharger les vidéos. Je vous remercie. Ok. Donc j'ai bien téléchargé les 22 scènes. Les 22 bírol. Donc je vais vous montrer quelques exemples. Des vidéos qu'il a pu générer. Donc voilà.

[19:32] Ou par exemple. Donc voilà. Vous pourrez utiliser ça pour monter vos vidéos. Et créer des ads. Donc avec des bírols déjà fait.
