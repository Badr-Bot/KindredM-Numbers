---
module: MASTER ACQUISITION
lecon: 49
titre: "Setup d’une campagne"
duree: "10:01"
url: "https://www.skool.com/master/classroom/4d936265?md=87ef3a4a7a6341f5bb81832471d582d7"
statut: complet
source: skool-master
maj: 2026-08-13
---

# 49 — Setup d’une campagne

`Section Skool : GOOGLE ADS`

## Ce que la leçon annonce

> **Source : page de la leçon (texte Skool)**

### Introduction

Créez votre première campagne Google Shopping de A à Z, sans faire les erreurs classiques.

---

### Ce que tu vas apprendre

Dans ce tutoriel, vous allez apprendre à configurer une campagne Google Shopping Standard sur un compte tout neuf : choix du bon type de campagne (et pourquoi éviter la Performance Max au départ), liaison avec le compte Merchant Center, paramètrage du budget minimal, stratégie d'enchère au CPC, sélection géographique correcte (le piège de la cible "intérêt" vs "présence"), exclusion des mauvais produits, et ajout d'audiences en observation pour enrichir la data dès le départ.

---

### Mindset / Vision

Ne cherchez pas à tout automatiser immédiatement. Démarrer sur Shopping Standard vous permet de comprendre ce qui performe avant de déléguer le contrôle à Google. C'est la base solide sans laquelle toute stratégie d'enchères intelligentes restera fragile.

---

### Timestamps

00:00 - Lancer une campagne Shopping
00:52 - Objectif et Merchant Center
02:19 - Budget, enchères et ciblage
06:03 - Produits et audiences
08:59 - Bilan et prochaines étapes

---

#### Lexique

**Campagne Shopping** : Format de campagne Google Ads qui affiche vos produits directement avec image, prix et nom via un flux produit synchronisé (Merchant Center). C'est la campagne recommandée pour démarrer en e-commerce car elle est très pertinente pour la vente en ligne.

**Performance Max (PMax)** : Type de campagne automatisée qui diffuse sur tous les réseaux Google (Search, Shopping, Display, YouTube) avec un maximum d'automatisation. À utiliser après avoir accumulé de la data, une fois qu'on a des best-sellers identifiés, plutôt qu'en tout premier lancement.

**Merchant Center** : Plateforme Google où est hébergé et synchronisé le flux de produits (prix, stock, images) qui alimente les campagnes Shopping et PMax.

**Objectif de conversion d'achat** : Type d'objectif configuré (ici via Syncrosis) qui indique à Google Ads que l'action à optimiser est l'achat effectif sur le site, et non un simple clic.

**Stratégie d'enchère "Maximiser les clics"** : Stratégie d'enchère automatique où Google optimise pour obtenir le plus de clics possible avec le budget disponible. Recommandée en phase de démarrage, avant d'avoir assez de data pour des stratégies basées sur la conversion.

**CPC cible / CPC maximal** : Coût par clic que l'on est prêt à payer. Le CPC maximal plafonne le prix payé par clic, basé sur une analyse du marché (ex. via Keyword Planner ou SEMrush).

**Keyword Planner** : Outil gratuit de Google Ads permettant d'estimer les volumes de recherche et les coûts par clic moyens pour des mots-clés, utilisé ici pour calibrer le CPC cible.

**Semrush** : Outil tiers d'analyse SEO/SEA permettant d'étudier la concurrence et les coûts publicitaires sur un marché donné.

**Option de ciblage géographique "Présence uniquement"** : Paramètre qui restreint la diffusion aux personnes physiquement présentes dans la zone ciblée, contrairement à "Présence ou intérêt" qui inclut aussi les internautes qui s'intéressent à cette zone sans y être. Exemple : cibler uniquement les personnes réellement en France, et non celles qui recherchent simplement des infos sur la France.

**Réseau de partenaires de recherche Google** : Option permettant de diffuser aussi les annonces sur des sites partenaires de Google, en plus de Google lui-même. Décochée en début de campagne pour prioriser la qualité du trafic Google, puis activée plus tard pour scaler.

**Groupe d'annonces / Groupe de produits** : Sous-ensemble d'une campagne dans lequel on organise les produits ou annonces à diffuser.

**Audiences en observation** : Segments d'audience (centres d'intérêt, démographie, marché) ajoutés à une campagne sans restreindre le ciblage, dans le but d'analyser leurs performances (taux de conversion, dépense) avant de décider de les utiliser en ciblage actif.

**UTM** : Paramètres ajoutés à une URL permettant de tracker précisément la source du trafic dans des outils d'analyse (ex. Google Analytics).

**Flux produit** : Fichier de données contenant l'ensemble des produits (nom, prix, image, ID) synchronisé depuis une boutique en ligne vers Google Merchant Center.

---

### Tags (Pour optimisation de recherche Skool)

`Google Shopping` `Google Ads débutant` `campagne Shopping Standard` `Merchant Center` `stratégie enchères Google`

## Transcription

> **Source : audio (Whisper local, modèle small)**

[00:00] Ok, on est parti pour ce module numéro 4. Tu vas être pareil en format tutoriel sur la création d'une nouvelle campagne sur votre nouveau compte, qui plus est peut-être votre première campagne. C'est le cas, sachant que du coup, on va créer une campagne shopping. Je trouve que c'est la campagne la plus intéressante à vous moquer parce que en termes de pertinence

[00:21] par rapport au e-commerce, c'est ce qui y a de mieux. Il y a plusieurs erreurs aussi à éviter qui sont assez importantes au niveau du paramétrage de votre première campagne shopping. Donc, pré-nordial. Et j'ai visité aussi avec la partie création d'une performance max directement. Mais je pense que si vous êtes débutant, il faut attaquer par la shopping comme évoqué dans la practice récuration. Donc, c'est ce qu'on va faire dès la présent.

[00:43] Allez, c'est parti. Du coup, on se retrouve dans le backend de notre compte. On vient tout juste de créer, tout frais tout neuf. On va directement cliquer sur nouvelle campagne. Ensuite, Google va vous demander l'objectif de votre campagne. Nous aujourd'hui, on a un objectif de vente très clairement. On va venir utiliser un objectif de conversion spécifique, qui est l'objectif de conversion Bacha.

[01:03] Donc, c'est ce qu'on vient de parameter juste dans le module d'avant. Au niveau de Synprosis, on le voit juste ici. C'est parfait. Il n'en va lier aujourd'hui parce qu'il n'y a pas de conversion encore entre le moment de l'expiration et le set de cette campagne. Mais ça va être bon par la suite. Donc, on va pouvoir continuer. Ensuite, tu vas vous demander du coup de sélectionner un titre de campagne. Donc, on a d'abord un smax shopping, de manjane, search, YouTube et disque.

[01:26] Ça, on les a vus dans les modules de présentation par rapport aux bases. On va partir nous sur shopping, juste ici. Ensuite, on va venir associer du coup le compte merchant center qu'on vient de créer juste avant. Là, il me dit que les produits ne sont pas encore apparus. C'est normal. Ils sont en prodécin, conditiation, versus Synprosis. Une fois que ça sera le cas, ça va apparaître directement de son païd. Donc, payez quand même le flux.

[01:47] Ah, pardon, le compte merchant center que vous venez de créer. Ensuite, ils vont vous pousser à créer une campagne d'erfance max, jasique. Tournez-vous vers Shopping Standard. Je l'en ai parlé et je vais parler par la suite. C'est quelque chose d'important. Au départ, quand on s'est parlé de shopping, et ensuite de passer à P-Max, c'est assez clémential. Et vous verrez d'ailleurs dans la durance de ce tutoriel que Google vous...

[02:07] Vous dirige vers ses propres options les plus intéressantes pour lui. D'ici entre P-Max et Shopping. Donc, c'est intéressant de vous faire ce tuto parce que... Il n'y a pas le le piège à éviter sur le lancement de campagne. Donc là, ensuite, au niveau du naming de la campagne, il y a plusieurs stratégies de correction de naming. Une qui est simple à faire, c'est celle-ci. Le gaz à l'intérieur des idées suivantes n'a pas besoin d'apprendre la considération.

[02:28] Donc on est sur une shopping. Avec un objectif d'acquisition. La stratégie non cher, c'est à mettre une max de clics au départ. Au niveau du cpc cible, je le mets ici parce que je le connais. Et je pense qu'on sera plus à 0,9. Et avec ceci, déjà, on sera très l'air d'un de convention de naming. Je pense que c'est optimisable, évidemment. Mais ajuster sur...

[02:49] Vous derrière, si vous avez des outils, ce qui permet de calibrer et de traquer. De façon précise selon vos conventions. Vos différentes actions et vos données de reparting. Je pense qu'en tant que débutant, c'est pas le cas. Donc prenez pas la télé avec ça. Pareil aussi, j'ai l'alternative d'émettre, d'étirer parce que... Parce que UTM, mais c'est pas obligatoire, prenez des espaces. Au niveau du budget, parce que je vous conseille, c'est d'avoir un budget coûtier moyen d'environ 30€ d'ail,

[03:11] minimum sur une première campagne shopping. Ne vous inquiétez pas, s'il n'y a pas de danse, ça va pas cliquer, ça va pas se plaire. Mais 30€ c'est minimum. Passer rapidement à 50€, puis plus. Au niveau de l'encheur, on va le directement maximiser les critiques. Ça on en a parlé, je reparlerai aussi. Les raisons du pourquoi du comment. On va définir une limite d'encheur au coup par qui maximum ici 2,0,9€ par rapport d'encheur.

[03:36] Donc c'est ce que j'ai pu analyser sur T-Route Planner, c'est ce que j'ai pu analyser via SN Rush. Vous pouvez ne pas en mettre. Vous pourriez ce qu'il perd un peu d'argent. En plus, mais c'est pas d'inviter, ça va pas être dans la T-Route. Moi ça pose une capée au niveau de marcher les audiences. De pas en mettre, ça va pas mettre la paix partout. Ça fait sens quand même. Je préfère tout de même en mettre sur une première.

[03:58] Vous pouvez aussi, ici, rajouter vos encheurs pour attirer un nouveau client. Donc on n'a pas nécessaire ici, on n'a pas de focus. Il n'y a pas d'historique. Et priorité de la campagne, dans tous les cas, on aura une seule campagne de chockeying, donc si vous voulez c'est faible, ça pose pas de soucis. Partant du principe que on en aura plusieurs, il se sera forcément une P-Max. Donc la P-Max sera plus élevée parce qu'on s'en va sur les B-Sailors. Donc oui, c'est moyen ou élevé, ça pose pas problème. Au niveau de la zone géographique,

[04:20] c'est le deuxième piège de Google, bien cellulée du coup, les pays, c'est France ou autre. Ici, et surtout bien cliqué sur options de cellulaires géographiques. Au niveau de la partie inclure, sélectionnez présence uniquement, parce que si vous voulez sélectionner présence ou intérêt, Google va décider les personnes situées dans les zones que vous avez incluses. Qui s'y rend régulièrement?

[04:41] Ou qui s'y intéresse? En fait, beaucoup de monde. Alors qu'avec présence, on a relance si les gens qui sont uniquement dans ce pays et qui s'y rendent régulièrement. Ou par exemple s'ils se rendent régulièrement. Donc, primordial de faire ça, parce que là c'est une chronère de target-sign déjà, dans très bien. Produire un magasin, on laisse désactiver, annoncer un caractère politique, guérmette, non, évidemment, on va juste déproduire.

[05:04] Vous avez aussi le positif de préparer la train d'à de début ou de fin, donc ça si vous voulez pas lancer l'artement, vous pouvez vous faire. Option de URL, c'est plus pour la partie. Une UTM, par exemple, qui nous intéressait, c'est au niveau du réseau. Et ça paraît qu'ils l'ont caché. D'avantage maintenant, mais on va venir décocher du coup partenaire du réseau de recherche Google, parce qu'on n'a pas intérêt à diffuser aujourd'hui sur d'autres sites que celui de Google.

[05:26] Parce que Google nous suffit, par contre, si vous voulez élargir vos audiences et vraiment scale, c'est à ce moment-là plutôt qu'on va venir activer les partenaires du réseau de recherche Google A2, parce que ça permet d'élargir. Maintenant, c'est pas logique, je vous le dis, on préfère la priorité. À Google et la qualité aussi de son trafic. Au niveau du nom de Google Annonce, on va mettre...

[05:47] A nous. Au pied, il faut ajouter ce que vous voulez faire. groupe de produits, on va sélectionner tous les produits, on ajoute un après. Ensuite, peut-être suricapturatif, au niveau de la campagne, on est tout beau, rien à signaler, on peut cuivre la campagne. C'est parti. Donc là, ce qui est intéressant aussi de faire, c'est de venir, du coup, ici, dans tous les produits, parce que du coup, on a envoyé tout notre produit dans cette campagne Google Shopping.

[06:10] Peut-être que dans celui, il y a des upselles, peut-être que dans celui, il y a des e-books, peut-être que dans celui, il y a des produits qu'on ne veut pas promouvoir. La ligue, c'est vraiment d'aller sélectionner les produits qu'on veut promouvoir uniquement. Pour ce faire, on va se rendre sur le petit plus ici. On va venir, du coup, subdiviser tous les produits par la digue d'éléments. Ici, on n'a qu'un produit pour l'instant qui est synchronisé,

[06:32] mais ça m'a su cher pour montrer l'exemple. On va venir directement, tu te souviens, enregistrer sans vous déclenter dans cher, ici. Et du coup, on va avoir tous les produits qui vont s'afficher de cette façon. Du coup, on va venir exclure tous les produits. Et les autres produits vont apparaître ici, typiquement. Imaginons que celui-ci, c'est un obéde cellaire. On va le laisser inclus. Par contre, si on envoie d'autres sur les cartes de Pacte V,

[06:53] on peut les exclure, tout comme ici, tout le reste, dans tous les produits. Donc là, on est sûr que ça va mettre en avant uniquement les produits qui sont actifs. Donc là, vous le voyez, ici directement. Et au niveau de la campagne, on va mettre parfait. Ce qui est intéressant de faire, maintenant, c'est directement d'injecter des audiences en observation. Nous avons parlé énormément dans le module sur les bases de Google Ads pour y retourner si vous le souhaitez.

[07:14] Mais du coup, le objectif, c'est d'aller identifier, d'observer si il y a des audiences qui répondent bien, ils s'envoient plus que d'autres pour pouvoir les utiliser dans notre siblage de banjol, Pmax, etc. Donc on vient directement ici, dans audience mode, mot-clé et contenu, on client sur audience. Ajoutez des selects de l'audience ici, sur la campagne entièrement. Et bien faire attention, ne pas appuyer sur siblage, mais sur autorisation.

[07:35] Ok? Et ensuite, on va essayer de chercher, piquement, si on reste sur le collagène, des audiences, que ce soit sur le marché dont une enquête, que ce soit des audiences d'affinité directement, des audiences démographiques ou autres petits, selon vous. Peut-être intéressant d'analyser, d'observer au niveau des conversions

[07:57] ou que vous aurez potentiellement utilisé en siblage directement par rapport à votre produit, afin de valider si c'est pertinent ou non, par rapport à la date d'art. Donc tout de suite, on peut prendre un produit sans napo. Évidemment, lotion et d'attent, quand il visage, ça c'est cool. Les produits qui affilèrent aussi, c'est une audience qui est une enquête étudiée. Et dans cette phase de recherche, c'est cool aussi. Est-ce que les gens sont plutôt végétaliens, attirés par le bio,

[08:20] passionné, santé, de rémunérés en forme? On peut vraiment être précis avec nos audiences, pour s'amuser que d'un point de vue ingénieur ethnique, c'est un monstre sur Google. Ça te fait vraiment être précis par une nouvelle démographie que je te sens dans le lendemain. Propriétaires, est-ce qu'ils sont en fait dans la santé? Est-ce qu'ils sont célibataires? Voilà. Imaginez-nous que je vais observer ces hausse aux audiences,

[08:41] je clique sur enregistrer. Et ensuite, Google n'indra pas m'afficher la date d'art par rapport à ces audiences ici. Donc, quelle audience elle est plus dépensée, quelle audience elle a le meilleur taux de conversion que telle audience? Elle a plus de conversions. Et après, évidemment, il faut pas jeter une colonne spécifique ici. Elle est hyper intéressante et filmordiale aussi dans la gestion de vos campagnes Google. Voilà, on a fini du coup avec le paramétrage de cette première campagne.

[09:02] On a un cours de carré qui est bien paramétré, une première campagne de chocking, qui est bien paramétrée. Il va falloir passer du coup maintenant cet up de votre campagne, idealement, Brain et Search, acquisition en parallèle. Au besoin, n'hésitez pas à me envoyer un message. Vous pouvez répondre à une question pour le paramétrage de ces dernières. Et il y a plein de tuto sur YouTube, c'est-à-dire de campagne plus connue, donc, français.

[09:23] Et il va être temps du coup maintenant de commencer à Spen et d'accumuler la data pour passer au setup de votre Linux, de votre Mangev, de votre surf, Advertisable, etc. etc. d'accumuler un maximum de volume de Spen et de conversion. Aussi juste, petite parenthèse avant d'attaquer sur la partie satellite en chair,

[09:44] juste pour pouvoir modifier votre satellite en chair. Donc c'est directement en cliquant sur le temps que on lâche ici votre campagne. Optimisation du budget et des enchères en chair ici, et vous pouvez voir qu'on a maximisé les clics et qu'il existe d'autres possibilités et ça on va voir juste après durant le volume de mon site. C'est parti.
