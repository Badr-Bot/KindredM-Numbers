---
module: MASTER IA
lecon: 19
titre: "2 : N8N - Scraper les statics concurrents"
duree: "7:24"
url: "https://www.skool.com/master/classroom/9d4ca2d4?md=d8e7b0d955c54b5cbbc7ec0b3543cb1e"
statut: complet
source: skool-master
maj: 2026-08-13
---

# 19 — 2 : N8N - Scraper les statics concurrents

`Section Skool : NanoBanana`

## Ce que la leçon annonce

> **Source : page de la leçon (texte Skool)**

### Introduction

Dupliquer les publicités concurrentes en quelques minutes grâce à N8N + Apify.

---

### Ce que tu vas apprendre

Dans cette vidéo, tu vas apprendre à scrapper automatiquement toutes les visuels publicitaires d'un concurrent depuis la bibliothèque publicitaire Meta, les enregistrer directement sur ton Google Drive, puis les dupliquer ou les modifier rapidement avec Canva, le tout sans compétence technique. Tu repartiras avec un workflow N8N clé en main, prêt à l'emploi, pour alimenter ta création publicitaire à la vitesse de la concurrence.

---

### Mindset / Vision

Surveiller ses concurrents ne suffit plus : il faut agir vite. Ce workflow t'offre un avantage compétitif direct en transformant l'analyse concurrentielle en action créative immédiate. Plutôt que de repartir de zéro, tu t'appuies sur ce qui fonctionne déjà sur le marché et tu le fais tien.

---

### Timestamps

00:00 - Scraper les pubs concurrentes
00:50 - Configurer Apify dans n8n
02:44 - Connecter Google Drive
04:59 - Lancer le scraping et gérer le volume
06:04 - Dupliquer et importer le workflowint

---

### Tags (Pour optimisation de recherche Skool)

`N8N` `automatisation marketing` `scraping publicités` `bibliothèque publicitaire Meta` `growth hacking` `Apify` `Google Drive` `création publicitaire` `espionnage concurrent` `no-code`

## Transcription

> **Source : audio (Whisper local, modèle small)**

[00:00] Donc ça c'était pour les images produits. Maintenant ce que je vais montrer c'est comment dupliquer des statiques du concurrent de manière ultra rapide. Donc on se retrouve directement dans N8n. N8n c'est là où vous allez pouvoir gérer vos automatisations. Là j'ai créé une petite automatisation comme vous le voyez ici qui va nous permettre de scraper les images du concurrent à partir d'un URL de bibliothèque publicitaire. Par exemple on va scraper toutes les images de notre concurrent Noct. On va ensuite les dupliquer hyper rapidement.

[00:20] Donc on pourrait les dupliquer de la même manière qu'on a fait pour les images produits ou alors d'une autre manière pour être encore plus fast et sans trop se prendre la tête avec des pontes. Donc ce qu'il faut bien mettre c'est images produits. Vous mettez les adjectifs ou pas c'est comme vous souhaitez. Vous sélectionnez l'URL. Vous allez simplement mettre exécuter et vous pourrez ajouter l'URL. Mais avant ça je vais vous expliquer l'automatisation.

[00:41] Donc elle se déroule en plusieurs nœuds. Ce qu'il faut savoir c'est qu'il y a le nœud API file déjà. Donc API file c'est le nœud qui va permettre de scraper toutes les images du concurrent. Ce qu'il faut bien savoir aussi c'est qu'il va falloir connecter notre compte API file. Bon donc pour ça ce que je vous invite à faire c'est déjà aller dans API file et vous mettez API file.com et là vous allez pouvoir vous créer un compte c'est gratuit. Vous pourrez scraper 1000 ads pour 75 centimes c'est que dalle.

[01:04] Et vous aurez je pense 5 euros de crédit offert ou 5 dollars. Donc vous aurez juste un net nucrédentiel. Vous mettez connect myocount. Il va rediriger directement sur votre compte API file et ça sera directement connecté. Une fois que c'est connecté, hop on va mettre close. Là vous laissez acteur, vous laissez run an actor. Ça vous laissez ça comme ça aussi. Ici ce que vous pouvez mettre c'est donc pour avoir accès à ça vous avez juste aller dans

[01:28] hop je vais déjà couper ça. Vous avez juste aller dans API file et tout ça là vous allez vous retrouver. Vous mettez simplement Facebook ad Library scraper et là vous cliquerz sur le premier. Vous allez arriver ici. Ici ce que vous devez faire c'est copier cette petite. Vous allez ensuite retourner dans N8N vous la collez ici et il va vous sourcez celui-ci. Donc là vous cliquez dessus et il va être ajouté. Vous laissez formeliste. Normalement ce sera déjà mis.

[01:49] Mais bon imaginez donc que ce n'est pas mis ou que vous couillez un petit bug ou quoi que ce soit quand vous allez l'importer. Vous avez juste à mettre ça. Je vous montre aussi comment l'importer. Hop donc pour le JSON ici, vous avez simplement aussi à le reprendre dans API file. Vous allez simplement mettre JSON et vous avez juste à copier et venir l'implémenter directement ici. Donc ce sera exactement le même. Ça ne s'est pas du tout compliqué. Voilà une fois que ça s'est fait il est connecté correctement. Ce qu'il faut savoir aussi c'est que comme c'est la première fois que vous allez arriver sur N8N,

[02:12] vous allez peut-être devoir installer API file si c'est la première fois bien sûr. Donc il n'y aura pas le N8N API file ici. Il y aura je pense un point d'interrogation. Vous aurez juste à mettre plus API file ici. Voilà vous sélectionnez API file et là vous aurez juste à installer en fait. Il y aura un petit bouton installer et le N8N va s'installer directement ici. Il va directement s'afficher. Une fois qu'il s'est affiché, vous pourrez le connecter avec le trigger et là il térite.

[02:34] Hop si on a le N8N pour download, ça va download les apps qui ont été scrappés directement grâce à la pays et ensuite ils vont être enregistrés sur Google Drive. Donc sur le Google Drive, vous avez juste à connecter votre Google Drive. Il va falloir simplement suivre ces étapes. Donc ce que vous allez devoir faire c'est mettre Create New Credential. Là vous allez devoir ajouter le client en secret et ensuite vous connectez.

[02:56] Je vais vous montrer. Donc vous avez juste à aller dans Bibliothec d'API donc vous allez sur console.cloud.google. Vous allez mettre Google Drive API. Ici vous allez appuyer sur activer parce que si vous n'activez pas vous ne pourrez pas scrappé correctement les images. Vous allez mettre gérer. Une fois que ça sera activé, vous allez pouvoir accéder ici et là vous allez pouvoir créer de nouvelles clés en fait,

[03:18] nouvelles clés à pays. Vous allez juste dans Identifiant. Donc ça c'est celle que j'ai déjà créé. Ce que vous avez juste à faire c'est mettre Create des identifiants, Create ID Authentificateur. Vous allez mettre Application Web. Vous mettez un nom par exemple. On va mettre Test pour l'occasion. Ici il faut bien ajouter l'URL que vous avez dans N8N donc il se trouve ici. Vous le copiez, vous retournez dans Google, vous le collez et ensuite vous mettez, je ne vois pas bien avec mon téléphone,

[03:44] Create et là vous allez avoir accès à votre clé. Une fois que votre clé est créé, vous avez juste à la copier. Ça je cacherai pour pas que vous l'utilisez. Mais vous copiez ici le hit client, vous retournez dans N8N, vous collez le hit client, ensuite vous retournez dans Google, vous prenez la clé secrète, vous la copiez et vous la déposez ici. Et comme ça c'est top. Là une fois que c'est fait, vous n'aurez plus qu'à cliquer sur Sing in with Google.

[04:05] Et là ça va ouvrir une petite fenêtre pour vous connecter avec Google. Une fois que ce sera connecté, vous mettez Save et ce sera top. Votre clé sera directement implémenté. Une fois que ça s'est fait, ce que je vous invite à faire c'est donc laisser ces paramètres là comme ça. Juste ici il va falloir mettre le lien correct de votre Google Drive pour que ça soit enregistré au bon endroit. Donc vous avez juste à aller dans votre Google Drive que vous avez créé pour l'occasion.

[04:26] Vous reprenez simplement la ligne ici, les chiffres ici, les lettres et les chiffres ici. Et vous allez venir le copier, coller dans N8N ici. Et comme ça va correctement s'enregistrer dans votre dossier. Et si jamais il faut bien enregistrer, donc il faut bien que le dossier que vous avez créé soit le même. Donc en fait il faut bien que le compte Google avec lequel vous avez créé votre crédit initial,

[04:47] donc votre clé API soit le même que votre dossier, en fait que le compte Google qui a créé le dossier. Je sais pas si vous avez bien compris mais en tout cas si vous avez des questions, ou quoi que ce soit n'hésitez pas, je serai là pour vous aider. Vous m'envoyez un message et je vous aiderai avec plaisir. Donc cette petite automatisation va nous permettre de scraper toutes les ades du concurrent en quelques moments. Je vais vous montrer. On va mettre copier. Ici ce qu'il faut savoir aussi dans le scraper c'est que vous allez pouvoir émettre le nombre que vous voulez scraper.

[05:10] Ici on a 59 mais moi j'en vais scraper toutes. Donc j'ai mis 9999 pour être sûr qu'il scrape tout. En fait il va scraper jusqu'au moins il n'y en a plus, mais disponible. Là ce qu'on peut faire c'est imaginons vous voulez en scraper que 20, vous mettez 20 et ça en scrape que 20. Hop là on va laisser 9999 et on va pouvoir mettre exécuter. Tac ici vous avez juste à coller le lien de la bibliothèque publicitaire du concurrent.

[05:33] Vous mettez submit, vous pouvez quitter la petite page là. Et là il est directement en train de run. Donc là il est en train de scraper avec la PII dans la bibliothèque publicitaire. Et voilà donc là il a déjà donlou de la première image et il enregistre et puis il réitère. Il réitère pour faire toutes les ades et scraper vraiment toutes les ades. On peut les voir si vous allez ici. On peut voir donlou et il est en train de le refaire. Si vous voulez un moment donné qu'il s'arrête parce que vous n'avez pas modifié et que vous ne voulez pas tout scraper,

[05:57] vous avez simplement appliqué sur le petit bouton là et il va arrêter de scraper. Et là on va continuer encore un peu. Comme ça on n'aura pas mal dans le stock. Ça c'est assez intéressant en fait parce que ça vous permet de reprendre des ades qui fonctionnent et pouvoir simplement les dupliquer ou alors les améliorer, les modifier un peu, modifier le texte avec Canva. Parce que clairement dans aussi le petit point négatif de N'Houmen, enfin pas de N8N de Nalobanana pardon, c'est que parfois le texte il ne respecte pas 100%.

[06:20] Donc ce que vous devez faire c'est imaginons que vous créez une publicité, le texte n'était pas top, il n'a pas bien respecté le texte que vous lui avez demandé de créer. Vous avez juste allé dans Canva, vous mettez le petit sélectionnaire de texte là pour modifier le texte dans une image. Vous sélectionnez le texte et là vous pourrez directement le modifier. Ça c'est aussi simple que ça. Ça vous permet de créer simplement rapidement des ades. Donc là il a déjà scraper 21, il a déjà enregistré 21 dans le scraper que je vais vous montrer après.

[06:43] On va encore scraper quelques-unes et puis ça sera bon je pense. Parce qu'en tout il y en a 56 à scraper. Pas mal en soi, elles sont sympa à leur créer à trou. Voilà 25, encore 4 et puis ça sera bon. Et voilà. Là donc plus j'ai stoppé, exécution stoppé, hop on va aller dans le scraper. Normalement on va... Et voilà. Donc plus j'ai juste eu à réactualiser la page et elles sont toutes scraper.

[07:05] Et là, c'était ultra rapide, franchement c'est magnifique. Du coup les gars j'ai oublié de vous montrer un petit truc par rapport à N8N, c'était comment importer le workflow. Ici vous allez juste à cliquer ici. Donc quand vous aurez été charger le workflow que j'aurais mis en piège joint de la vidéo, vous aurez juste à mettre importe form-file. Et là vous allez pouvoir directement l'importer. Hop là. Et du coup il s'ajoute directement ici. Mais ça vous savez.
