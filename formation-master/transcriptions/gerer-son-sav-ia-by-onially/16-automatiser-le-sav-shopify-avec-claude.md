---
module: GÉRER SON SAV +IA by Onially
lecon: 16
titre: "Automatiser le SAV Shopify avec Claude"
duree: "24:30"
url: "https://www.skool.com/master/classroom/a48691fc?md=80d0420cd8834b62aff6f12b48981b80"
statut: complet
source: skool-master
maj: 2026-08-13
---

# 16 — Automatiser le SAV Shopify avec Claude

`Section Skool : 6: Automatiser son SAV avec l'IA`

## Ce que la leçon annonce

> **Source : page de la leçon (texte Skool)**

### Introduction

Automatise ton SAV e-commerce avec Claude et Composio, zéro copier-coller, brouillons prêts en secondes.

---

### Ce que tu vas apprendre

Dans cette vidéo, tu vas apprendre à connecter ta boîte Gmail à Claude via Composio (MCP), créer un "skill" structuré avec tes politiques, templates et workflows SAV, puis demander à Claude de traiter automatiquement tes emails clients et de générer des brouillons de réponse personnalisés. Tu verras aussi comment planifier cette tâche de façon quotidienne et automatique grâce à la fonction Schedule de Claude, pour que ton support tourne chaque matin sans intervention manuelle.

---

### Mindset / Vision

L'IA ne remplace pas ton jugement, elle l'amplifie. La clé, c'est de lui donner des bases solides (politiques claires, templates soignés, process bien définis) et d'affiner en continu les prompts au fil des réponses. Plus tu structures ton skill, moins tu consommes de tokens, et plus Claude devient précis, cohérent et utile pour tes clients.

---

### Timestamps

00:00 - Objectif et précautions
01:09 - Connecter Gmail à Claude
01:31 - Découvrir Composio MCP
02:23 - Autoriser et lier Gmail
04:05 - Créer le skill SAV
05:18 - Structurer templates et politiques
06:21 - Donner les docs et calibrer
09:58 - Vérifier le dossier généré
11:30 - Traiter les emails en brouillons
18:19 - Enregistrer et planifier l’automatisation

---

### Tags (Pour optimisation de recherche Skool)

`service client IA` `automatisation SAV` `Claude MCP` `Composio Gmail` `e-commerce Shopify`

## Ressources

- [Notion - Création du skills SAV](https://www.notion.so/onially-team/MASTER-Ressources-Module-SAV-343cc15043b380ada640c76cc47e24bc)

## Transcription

> **Source : audio (Whisper local, modèle small)**

[00:01] Hello, alors on se retrouve pour la suite de cette vidéo, on va voir ensemble comment est-ce que tu vas pouvoir automatiser la gestion de ton service client. Donc dans cette vidéo je vais te montrer comment est-ce que tu vas pouvoir connecter ta boîte mail à Cloud et comment est-ce que tu vas créer un skills. Et on verra ensemble comment est-ce que l'outil va pouvoir répondre en automatique à nos emails. Petit point par contre, ce que je fais toujours c'est que pour les réponses aux emails c'est mieux de demander à Cloud de tout mettre en brouillon et de pas envoyer les emails.

[00:28] Comme ça ça vous permettra un petit peu de fine-tuner au fur et à mesure si jamais il y a des petites choses qui ne vont pas. Et comme ça les emails ne partiront pas avec des erreurs. Donc je vous conseille vraiment d'y aller petit à petit, d'avoir des process solides bien cadrés que vos politiques ne comportent pas d'erreur également. De travailler vos templates d'email, tout ça on l'a déjà vu dans des vidéos, dans la formation.

[00:50] C'est vraiment important en fait quand on travaille avec de l'intelligence artificielle d'avoir des bases archi solides sinon ça risque d'apporter des résultats pas très qualitatifs. Et comme ça vous pourrez vraiment profiter de l'avantage d'utiliser unia pour la gestion de votre support. Alors pour commencer on va aller connecter notre boîte mail.

[01:13] Donc moi ça sera sur gmail, donc pour ça je vais me rendre ici dans Customize. Ici dans mes connecteurs, je vais venir ajouter un connecteur personnalisé. Ici je vais l'appeler Composio et je vais me rendre sur le site de Composio. Voilà donc Composio qui est un outil qui permet de connecter plein d'outils via MCP.

[01:37] Du coup ici dans Connect App on peut voir un petit peu tous les outils qu'on peut connecter avec Composio. Franchement il y en a énormément. L'avantage de Composio aussi c'est que vous avez 20 000 requêtes grâce suite. Donc vous avez quand même largement de 3 affaires. Donc sur ma page d'accueil je vais venir ici prendre mon URL MCP.

[02:00] Je vais venir le coller là et j'ajoute. Ensuite je vais venir connecter mon outil autorisé. Donc là c'est bon, on a connecté Composio.

[02:22] Ensuite ici pour les autorisations, je vous conseille de mettre toujours toujours autorisé parce que sinon l'outil va tout le temps vous demander des autorisations. Ensuite une fois que ça s'est fait je retourne dans Composio. Ici connect app et je vais venir connecter donc ici ma boîte mail. On pourrait très bien imaginer par exemple venir connecter aussi son ocean.

[02:46] Ce qui fait qu'on peut demander à Claude ensuite par exemple de traiter nos emails et puis ensuite si jamais il y a des choses qu'il n'a pas réussi à traiter ou qui doit escalate il peut nous le noter dans une fiche notion. Donc sur un Google Sheet ou plein portes franchement on a vraiment plein de choses qu'on peut venir connecter ici. On a aussi tout ce qui est fresh desk.

[03:07] Donc fresh desk si jamais vous êtes sur cette plateforme là vous pouvez très bien connecter Composio à Claude et fresh desk et traiter comme ça en automatique vos emails. En fait l'interieur de fresh desk ça vous mettra simplement des notes. Donc du coup je viens connecter ma boîte mail. Ça va être vraiment très très simple. Il y a juste à suivre les instructions pour se connecter à son Gmail.

[03:31] Voilà donc là je sélectionne mon mail. Petite autorisation de demander. Continuer. Autoriser. Continuer. Et là c'est bon.

[03:55] On est connecté. Ensuite je retourne dans Claude. Projet.

[04:20] Et là on va venir créer le skills pour la gestion client. En gros un skill c'est simplement les connaissances qu'on va donner à Claude dans lesquelles il va venir tout le temps puiser lorsqu'il va effectuer des tâches. Donc pour te montrer un petit peu la structure d'un skills ça peut se présenter de cette façon. Alors à savoir que c'est totalement modulable en termes de contenu. Par exemple on voit qu'ici on a notre nom de dossier.

[04:43] Donc c'est ce qu'on a fait dans la vidéo précédente. Donc le dossier qui s'appelait au nom de votre boutique et à l'intérieur il y a le credential. Credential qu'on retrouve ici. Ensuite on va avoir le Claude.md. En gros ça c'est un fichier qui correspond, on va dire que c'est un petit peu le cerveau de Claude. Donc on peut le retrouver de deux façons. Ce Claude.md on va le retrouver soit à l'intérieur du dossier.

[05:05] Donc sous forme de dossier.md. On peut le retrouver également dans Claude directement. Voilà qui est ici. Donc qui est stocké directement à l'intérieur de Claude. Alors ensuite on va avoir la structure du skill. Donc vous avez en gros tous les process, tous vos templates, vos workflows etc.

[05:28] Vous allez pouvoir les donner à Claude. Et il va créer normalement des dossiers de cette façon. Enfin ça c'est la structure idéale on va dire. Donc avec tous vos templates vous voyez là vous avez les templates pour que vous perdez, vous avez le process du retour refusé, le retour accepté etc. Tous les workflows, donc en gros tous les process que Claude va devoir suivre, étape 1, étape 2 etc.

[05:49] Et toutes les politiques, donc là ça va être toutes vos politiques d'envoi, de remboursement politique de retour. Et vous voulez très bien rajouter des dossiers. Par exemple ça peut être ce qui va être dossier d'escalade. En fait c'est dire à Claude qu'est-ce que vous voulez qu'il escalade comme type de cas. Et voilà donc si vous voulez des process beaucoup plus détaillées,

[06:11] là l'objectif c'est que je vous montre vraiment une structure qui est simple à comprendre et qui va nous servir de base pour venir créer notre skill. Alors du coup là je vais prendre le prompt, pareil que vous trouverez donc dans les ressources de cette vidéo. Et je vais aller le donner à Claude. Alors ici je vais mettre lui un rail de ma boutique.

[06:33] Donc pour moi c'est Educative Store. Et là je vais venir lui donner la documentation. Donc ma documentation que j'ai déjà préparée. Normalement si tu as déjà travaillé tes process, tes templates, tes politiques etc. comme on l'a vu dans des vidéos, dans cette formation,

[06:54] tu devrais déjà avoir tout de près et des bases assez solides. Donc là je vais juste lui donner quelques documents. C'est vraiment histoire de te montrer comment ça fonctionne. Donc ici je vais lui donner un fichier où tous mes templates vont être répertoriés. Donc mes modèles de réponse. Ici mes politiques de retour et remboursement à l'intérieur.

[07:15] Ma politique, l'hybraison. Identité, contexte boutique. Donc là c'est juste pour lui donner un petit peu... Voilà, par exemple j'ai mis mon compte communication, ce qui doit éviter de dire, le discours qu'il peut valoriser etc. Donc ça, je vais lui donner... Hop ! Et là je vais lui expliquer simplement.

[07:36] Voici mes politiques, template et process. N'invent rien d'autre. Pose-moi les questions si tu sais pas. Tu répondras grâce à la connexion API Shopify, à la connexion NCP Gmail en passant par Composio. Sinon il va galérer un petit peu, aller trouver des informations. Tu dois toujours chercher les clients dans Shopify avant de répondre en prenant en compte le contexte de la commande. Donc statut produit client. Créer le skills dans le dossier

[07:58] où se trouve Crédential.NV. Classe les process et instruction proprement dans ces dossiers, donc template, workflow, politique. Je lui envoie et il va venir nous créer le skills en appelant simplement son skills, de création de skills. Donc l'avantage d'avoir un dossier propre comme ça, qui est tout bien rangé, catégorisé,

[08:20] c'est que si jamais toi tu as besoin de venir modifier, je sais pas, par exemple un template qui te plaît plus ou parce que tu as changé un process, tu vas beaucoup plus facilement pouvoir retrouver cette chose à modifier dans ton dossier. Autre avantage, ça va être que Cloud va utiliser moins de tokens parce qu'il va pouvoir mieux aller chercher les informations dont il a besoin

[08:43] pour pouvoir faire sa tâche. Ce qui lui évitera de relire à chaque fois des gros pavés d'information et tu useras moins de tokens. Donc là, on va attendre, ça peut prendre quelques minutes. Donc là, pour calibrer un petit peu ces réponses, il va me poser des questions. Donc là, par exemple, il me demande comment est-ce que je dois signer les réponses. On va mettre ça, par exemple.

[09:04] Que tu que je fasses une fois la réponse rédigée. On va créer un brouillon d'enjémé, c'est ce qu'on veut. Ça, ça nous permettra vraiment de personnaliser davantage s'il y a des choses qui nous plaisent pas au niveau des prontes. Si l'émail du client ne correspond à aucun des templates fournis, exemple, questions très spécifiques qui n'habitent à l'extérieur à que faire, rédiger une réponse dans le tour de la marque,

[09:25] te demander quoi répondre avant de rédiger, mélange improvisé uniquement si ça est politique pour... On va mettre le premier, on verra. Si un client écrit dans une autre langue que le français anglais-espanel peut faire, répondre dans la langue du client. Ok. Donc là, il continue de mouliner. Voilà. Donc là, il vient de terminer. Donc qui m'explique un petit peu tout ce qu'il a fait. Il me montre également la structure du dossier.

[09:49] Donc on voit qu'on a bien notre skill.md, nos politiques, livraison, etc., nos templates, nos workflows. Voilà. Donc maintenant, ce qu'on peut faire, ça va aller vérifier. Hop. À l'intérieur du dossier Educative Store, donc là, on dirait qu'il nous a créé un dossier qui s'appelle SAV Educative Store.

[10:10] Et là, on retrouve donc nos politiques, nos scripts, templates, workflows, skills. Donc skill, c'est un petit peu ce qu'il va appeler pour utiliser le document. En fait, c'est un gros récapitulatif. Donc on voit là, par exemple, skill d'assistance pour le service client de la boutique Shopify, les règles absolues.

[10:31] Donc, par exemple, toujours chercher le client dans Shopify avant de répondre. Même si la demande semble évidente, il faut toujours tenter de retrouver le client et sa commande dans Shopify, etc. Donc ça, c'est parfait. Vu dans le centre du workflow, comme ça, là, en fait, c'est ce qui va venir lire. Il sera ou à l'épuiser les informations quand il va effectuer ces tâches.

[10:52] Donc là, on est OK. Maintenant, on retrouve aussi tous nos templates. Il y a des templates qui l'a créé également se basant sur les politiques, les bases de connaissance que j'ai envoyées juste avant. Script. Ça, c'est le script simplement pour qu'il puisse se connecter à Shopify. Donc il nous crée un petit script Python.

[11:13] Il a un script de l'app et là, les politiques. Voilà. Donc là, on a une politique identité.com, la politique de livraison, la politique de remboursement. C'est ce que je vais donner, mais bien sûr, je peux lui donner d'autres politiques. Par exemple, si vous avez une politique à abonnement, vous pouvez très bien lui donner votre politique d'abonnement. Voilà. Alors, maintenant, on va passer sur Gmail.

[11:34] On va en avoir 1, 2, 3, 4, 5. 5 mails clients à traiter. Donc là, je vais simplement lui dire traite ma mail. On va attendre un petit peu. Voilà donc là a priori Claude me dit qu'il a été traité mes emails. Donc c'est ce qu'on va aller voir. Ok, donc là on voit qu'on a des emails en brouillon. On va

[11:55] regarder un petit peu sa logique. Donc là on voit qu'il a commencé à se connecter à Gmail via Composio. Donc c'est bien ce qu'on lui a demandé et il a été vérifié la connexion. Ensuite une fois Gmail connecta Composio, il a été cherché d'outils pour citer les emails récurrents. Ok. Et ensuite Gmail s'est connecté à la boîte mail. Donc là il a trouvé 61 messages.

[12:16] Je pense que c'est un petit bug parce que juste en dessous il nous confirme bien qu'il a réussi à trouver 5 mails non lus. Donc c'est bien ça qu'on avait dans la boîte de réception. Donc il les a récupérés et là il nous a fait un petit récap du contexte. Donc on voit bien le client qui l'a réussi à trouver dans Shopify. La commande. Donc il a bien compris les statuts de commande.

[12:39] Donc les commandes expédier, les commandes non expédier nous a carrément mis le délai. Par exemple cette commande là a pas expédié depuis 48 heures et commande pas expédier depuis plus de 3 jours. Donc ça c'est pas mal parce qu'on sait qu'on va pouvoir venir jouer avec ça et venir améliorer les prontes sur un mesure pour lui dire par exemple si tu vois qu'il y a une cliente qui a un collier qui n'a pas été expédié depuis plus de 48 heures, sur pouvoir m'envoyer une

[13:02] notification pour me prévenir. Comme ça je vais regarder peut-être avec mon fournisseur ou mon logistique ce qui se passe et tu vas adapter aussi ton message à la client pour lui dire bah voilà on a un petit délai en plus pour l'envoi etc. Template. Alors là il utilise le template modification d'adresse pour cette cliente pour un collier expédier qui demande. Ok donc a priori

[13:30] un changement d'adresse mais le collier est déjà parti. Donc Claude redirige vers le transporteur. Template 13 où est mon collier utilisé donc là il a donné un numéro de suivi et ça c'est des demandes hors template. Donc là il a été puisé dans la procédure de retour de 30 jours avec les conditions etc. Ici réassurance commandant traitement et ici a traité côté Shopify

[13:56] retard de fulfillment. Donc ça c'est bien on voit bien les alertes si jamais on a vraiment un retard dans les emplois. Ensuite il a été dans Gmail pour chercher comment faire des brouillons. Il a été créer les brouillons donc cinq brouillons parallèles dans Gmail chacun dans le fil de discussion et d'ailleurs c'est pour ça qu'on utilise la connexion avec Composio parce que

[14:20] en fait il y a un connecteur Gmail à intérieur de Claude malheureusement il permet pas de mettre comme ça des emails en brouillon dans les conversations. Il va pouvoir vous créer des brouillons en dehors des conversations clients et du coup ce qui rend quand même le travail encore chronophage puisqu'il faudra aller dans les brouillons prendre les mails ensuite les copiers collés dans la bonne conversation du client alors que là en utilisant Composio vu qu'on

[14:42] passe par le MCP il y a la possibilité qu'ils viennent dans les conversations mettre donc les brouillons. Voilà donc là il nous dit les cinq brouillons étaient faits, ce qu'il a fait exactement par exemple la première cliente il l'a redirigé, Vercolissimo et option de la expédition sur le tour à expéditeur. Actions à prendre de ton côté avant d'envoyer donc là

[15:06] il nous donne un petit peu des guidelines par exemple cette commande là elle a été payée depuis le 17 avril il est toujours un falfil après trois jours le brouillon parle d'un légère retard il faudrait surtout traiter expédit cette commande dans son main Shopify. Voilà donc ça c'est des petits des petites astuces comme ça qui nous donne des choses à vérifier pour nous assurer qu'il n'y a pas des problèmes que ce soit au niveau logistique

[15:27] ou d'autres problèmes qui pourraient détecter comme ça. Maintenant on va aller voir du point un petit peu les réponses que ça donne donc pour la personne qui demande à priori une modification d'adresse là on voit que Claude comme il avait indiqué dans sa discussion il a été voir au niveau du statut de l'envoi du collier il a été prendre dans nos process puisque dans nos process on dit simplement bah voilà si le collier a déjà été expédier on

[15:52] peut plus annuler ou modifier une commande et là c'est exactement ce qu'il a été cherché il a été adapté sa réponse en fonction donc là on voit bien qu'il donne toutes les informations donc il retrouve le numéro de commande de la cliente il lui dit bien son statut donc commande expédier ensuite il donne des conseils à la cliente donc qu'est ce qu'elle doit faire puisque

[16:14] malheureusement on a dû refuser sa demande de modification et bien elle peut contacter Colissimo directement via ce numéro de suivi etc donc là par exemple il nous donne un numéro en y t ça c'est du yon track et il nous parle de Colissimo donc ça c'est des petites choses que tu vas pouvoir venir régler au cheveux à mesure que tu vas voir les réponses que Claude envoie à

[16:37] tes clients au niveau des prontes donc simplement tu vas venir chatter avec lui pour lui dire par exemple les numéros qui commencent par y t c'est le transporteur yon track donc ne parle pas de Colissimo et il va venir mettre à jour comme ça sa base de connaissance et toi il c'est vraiment important que tu puisses venir à chaque fois regarder un petit peu les réponses qu'il apporte et que tu viennes affiner tes prontes puisque c'est vraiment cet affinage là qui va te permettre

[17:03] d'avoir une hya hyper pertinente hyper puissant pour la gestion de ton support voilà et donc là il lui donne un numéro de suivi donc c'est bien son numéro de suivi qui a sur la commande Shopify et si le colis nous est retourné en raison de l'adresse incorrect nous pourrons alors faire le nécessaire pour le réacheminer vers la bonne adresse etc donc là il l'anticipe

[17:24] carrément le besoin futur de la cliente au cas où le colis n'arriverait pas donc là on est sur des réponses qui sont quand même hyper qualitatifs où on a juste à faire des petites modifications pour arriver on va dire presque à la perfection là si on prend le deuxième donc là où est ma commande je ne trouve plus mon numéro de commande voilà donc là il répond il a été cherché dans Shopify il donne bien son numéro de commande il lui donne son statut il lui donne

[17:48] son lien de livraison donc là il lui donne vraiment le lien de suivi du site et non pas le lien du transporteur on voit que l'arme on passe par vraiment le url qui a été personnalisé grâce à l'application de suivi donc en l'occurrence par celle panel et il a bien personnalisé le suivi voilà il lui redonne son numéro de suivi rappel les délais de livraison et comme ça on tombe sur

[18:13] des réponses qui sont assez assez complètes donc voilà à ce niveau maintenant qu'on a créé une son skills qu'on a pu venir le tester un petit peu on peut aussi lui demander de venir enregistrer le skill à l'intérieur de de Claude simplement donc enregistre le skill voilà donc

[18:40] là il m'a préparé le dossier donc là on retrouve la totalité du dossier avec bien tout notre notre arbre de connaissance pour les skills et là on va à droite on a le petit bouton enregistrer la compétence on clique dessus compétence enregistrée et là on va la voir dans nos compétences

[19:02] enregistré et ça ça va servir à ce que à chaque fois que tu vas ouvrir une conversation à n'importe quel endroit de Claude il va pouvoir tu vas pouvoir appeler ta compétence que tu as enregistré ici maintenant on va passer ici à chez du le donc chez du le en fait ça va te permettre de venir

[19:25] devenir créer des tâches donc des tâches par exemple si tu dis à Claude voilà tous les jours je veux qu'à 8h30 tu passe sur mon service client pour traiter mes mails hop donc on va créer une nouvelle tâche on va l'appeler par exemple sav journalier description donc là on va dire par

[19:45] exemple traiter les emails de ma boîte mail hop donc mon adresse mail de mon sav chaque jour à 8h30 par exemple ici je vais du coup lui donner un petit peu plus d'information traiter les mails de

[20:11] ma boîte mail ou mail de moi gmail.com je joue à 8h30 hop et récapitule moi les cas pour les quels tu n'es pas sûr tu n'es pas certain de la réponse ou les cas d'escalate dans une fiche notion

[20:41] voilà donc admettons si je connecte aussi mon ocean à Claude je peux très bien lui demander que chaque jour il me il me traite donc mes mails et il m'envoie un petit un petit récapitulatif en gros où je veux donc ça peut être dans la conversation Claude ça peut être sur nos chaînes ça dépend de vos préférences hop ici je vais venir mettre le skill on va dire qui associe à cette

[21:08] tâche donc là on va enfin le projet plutôt donc là je vais mettre une projet racine qui est celui ici qui s'appelle bah au nom de ma boutique on a le gros dossier qu'on a créé ici je vais faire ignorer les approbations alors tout que connecteur agir sans demander dans chrome

[21:28] ok donc là je passe les approbations simplement parce que quand je vais lancer mes tâches sinon il ne doit pas arrêter de me demander donc des notifications pour accepter certaines bah certaines choses ensuite fréquence bah là je vais venir sélectionner donc manuel c'est moi

[21:53] même qui vais ouvrir Claude et lancer ma tâche c'est parce qu'on veut ici nous on veut une tâche qui se lance de façon automatique donc de façon quotidienne on peut très bien la mettre aussi en horaire on peut la mettre en jour semaine ou en eup de mader donc quotidien on sélectionne une heure donc là on a 18h30 modèle par défaut aussi on peut venir choisir quel modèle est ce

[22:15] qu'il appelle donc par exemple moi je vais mettre sonner puisque maintenant il sait utiliser un petit peu donc bah la connexion chopify qui a été faite la connexion gmail donc là je vais mettre la version un petit peu moins puissante ce qu'il faut savoir aussi c'est que pour lancer donc ces tâches planifiées il faut que son ordinateur soit ouvert donc par exemple là tous les jours si

[22:40] je sais que je suis sur tout temps sur mon ordinateur 8h30 je vais pouvoir levé je pouvoir ouvrir Claude et la tâche va se lancer toute seule sans que j'ai besoin de faire quelque chose donc là j'enregistre ma tâche et on voit qu'elle vient de se créer et vous avez aussi Claude dispatch qui existe donc

[23:01] Claude dispatch vous pouvez l'avoir sur votre téléphone en fait depuis votre téléphone vous pouvez venir lancer des tâches que vous avez déjà planifié au préalable par contre encore une fois il faut que votre ordinateur soit ouvert mais c'est pas mal si vous n'êtes pas devant l'ordinateur que vous voulez lancer votre tâche à distance bah vous pouvez très bien très bien le faire depuis votre tels voilà donc très important à retenir également venez toujours améliorer

[23:27] continuellement votre prompt c'est vraiment ça qui fera gagner en qualité de réponse que Claude pourra apporter à vos clients ne lancez pas votre enfin vos réponses de façon directe c'est à dire laisser le mettre les réponses en brouillon ça vous permettra d'améliorer tout ça et que vos clients ne re ne reçoivent pas n'importe quoi en termes de réponse qui pourrait venir endommager

[23:49] la satisfaction de clients parce que ça risque d'énerver vos clientes si elle répondent si elle reçoivent des réponses un petit peu à côté et également donc pour toute la structure du skills qu'on a vu c'est vraiment une structure basique mais bien évidemment vous pouvez venir l'améliorer au fur et à mesure demander à Claude de créer des nouveaux dossiers par exemple si vous avez une boutique avec abonnement vous pouvez très bien lui rajouter vos politiques d'abonnement bien lui

[24:14] lui pronter donc quels sont vos process par rapport à ça si vous avez des process à modifier si vous avez des process à améliorer ou à amplifier c'est pareil vous avez juste à chatter avec lui et il ira vous modifier directement son skills donc voilà pour cette vidéo
