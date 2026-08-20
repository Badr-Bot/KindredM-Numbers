---
module: GÉRER SON SAV +IA by Onially
lecon: 5
titre: "Demo Freshdesk"
duree: "28:24"
url: "https://www.skool.com/master/classroom/a48691fc?md=bfde9ea9c7574a83ab3428d45880fabe"
statut: complet
source: skool-master
maj: 2026-08-13
---

# 05 — Demo Freshdesk

`Section Skool : 2: Infrastructure SAV`

## Ce que la leçon annonce

> **Source : page de la leçon (texte Skool)**

### Introduction

Configure Freshdesk de A à Z en moins de 30 minutes.

---

### Ce que tu vas apprendre

Dans cette vidéo, tu vas apprendre à paramétrer complètement Freshdesk pour gérer ton service client e-commerce efficacement. On couvre la connexion de ta boîte mail et de ta boutique Shopify, la configuration des notifications, la création de réponses prédéfinies avec variables dynamiques, la mise en place d'un Help Center complet avec articles FAQ, et la gestion intelligente des tickets. Tu repartiras avec un outil opérationnel, des templates prêts à l'emploi et des automatisations pour trier et prioriser tes tickets sans effort.

---

### Mindset / Vision

Un bon service client ne se construit pas au cas par cas, il se systématise. Freshdesk te permet de poser des bases solides : moins de temps perdu, moins d'erreurs, et une expérience client cohérente quelle que soit la personne qui répond. L'objectif est de te sortir de la réactivité permanente pour entrer dans un process clair et reproductible.

---

### Timestamps

00:00 - Setup compte et email
01:18 - Connecter Shopify à Freshdesk
03:45 - Notifications et profil agent
06:38 - Templates et Help Center
16:02 - Tickets, automatisations et analytics

---

### Tags (Pour optimisation de recherche Skool)

`freshdesk` `service client e-commerce` `helpdesk shopify` `gestion tickets` `automatisation SAV` `help center` `réponses prédéfinies` `FAQ e-commerce` `customer support` `outil SAV`

## Transcription

> **Source : audio (Whisper local, modèle small)**

[00:00] Hello everyone, on se retrouve dans cette vidéo des mots freshdesk pour que tu puisses voir comment paramétrer l'outil et bénéficier des features les plus populaires on va dire les plus utiles en quelques minutes seulement. Alors là je viens du coup de me créer un compte freshdesk, je vais venir connecter ma boîte mail donc là je l'ai déjà fait mais pour te montrer un petit peu le cheminement donc ici tu peux connecter ta boîte mail, tu peux également connecter

[00:26] ton instagram, ton facebook, ton whatsapp et bien plus encore donc pour la boîte mail tu as juste à cliquer dessus get started et là ça va t'amener sur cette page. Sur cette page tu vas pouvoir sélectionner le type de boîte mail que tu as donc si tu es sur gmail, sur Outlook, sur une autre plateforme de type Iono, OVH ou peu importe, moi je sélectionne gmail parce que

[00:53] ma boîte mail est sur gmail et là ça va simplement te demander de te connecter à ton compte gmail donc tu cliques sur ton compte que tu veux connecter, tu fais continuer et tu vas jusqu'aux étapes d'après, ça va te demander simplement ton mot de passe pour pouvoir lier ta boîte mail. Une fois que tu t'es connecté, tu vas arriver sur cette page et là tu verras que ta boîte mail c'est bon, elle est bien connectée au statut vérifié.

[01:18] Maintenant je vais aller je vais aller lier ma boutique Shopify donc pour ça je me rends dans apps, la marketplace et là je vais avoir une bibliothèque complète d'outils que je vais pouvoir venir plug à mon compte fresh desk donc là pour te montrer Shopify, hop, je vais simplement chercher

[01:39] Shopify et on va le connecter ensemble donc Shopify ici je clique sur installer ici ça va me demander plusieurs informations donc mon store url et bien c'est ça donc là je vais juste prendre le nom de ma boutique qui est dans mon url client id, là il va falloir que je vienne créer une application dans mon dev dashboard Shopify donc je vais sur mon dev dashboard sur dev.chopify.com

[02:04] je me connecte et ici dans apps je vais venir créer une application. Mon application je vais l'appeler par exemple à fresh desk je la crée je descends je vais sélectionner mes scopes donc mes scopes en gros c'est les autorisations que je donne à l'application donc là ça va être

[02:25] read order donc les commandes je veux que l'application puisse lire mes commandes et modifier mes commandes et customer donc lire mes clients je valide ici la payee version je m'assure d'avoir la dernière version donc là c'est bon et je

[02:46] clique sur relays une fois que c'est fait je vais aller là sur le nom de mon application et je vais cliquer sur install app ça me demande à quelle boutique est ce que je souhaite le lier et je vais cliquer simplement sur installer voilà donc mon applet est installé je retourne dans mon dev dashboard je vais dans setting

[03:14] et là je vais récupérer mon client id c'est ce que fresh desk me demande juste ici et là je récupère mon secret id que je viens coller là et ensuite authentique et account et là c'est bon du coup ma boutique est bien connectée et ça ça va permettre d'avoir la vue des commandes directement à l'intérieur

[03:37] d'un tiquel en ce qu'un client me contacte et également d'avoir d'autres petites d'autres petits raccourcis sympa ensuite je me rend dans admin là je vais venir je vais venir paramétrer tout ce qui est email notification email notification ici on va retrouver toutes les notifications qui vont nous être envoyées à chaque événement donc en gros

[03:59] tu as créé ton compte fresh desk avec une adresse mail et bien cet adresse mail va recevoir plein de notifications dès qu'il se passera quelque chose au niveau du ticket donc moi personnellement j'enlève toutes les notifications parce que sinon je me fais spammer dès qu'un client ouvre un nouveau message enfin on envoie un nouveau email dès qu'il y a une update faite sur le ticket etc

[04:21] donc je parle du principe que le mieux c'est que j'aille dans fresh desk pour voir pour voir chaque jour tout ce qui se passe plutôt que d'en recevoir des notifications je ne peux pas qu'un client contact request notification donc ça c'est le demandeur c'est à dire ton client quand il t'envoie un message il va recevoir des

[04:41] notifications en automatique donc ça fait attention parce que selon le marché sur lequel tu vends la langue de ton client par défaut fresh desk met les messages en anglais donc tout ça il va falloir venir le traduire dans la langue de ton client et le personnaliser un petit peu par exemple là on rappelle au client le délai de réponse pour pas qu'il nous renvoie des messages parce qu'on répond pas au bout de deux heures par exemple et

[05:04] tes horaires d'ouverture c'est toujours mieux comme ça le client il sait à quoi ça tend en termes de délais il sait quand est-ce que ton service client est ouvert donc tu peux laisser des notifications comme ticket reçu ici en vrai c'est pas des notifications qui sont très importantes donc moi j'ai tendance à les les enlever après agent un agent à applaudir et le ticket ça tu peux la laisser éventuellement et la traduire

[05:28] ça c'est pas très important et template ça c'est ce qui va se trouver en fait ton agent reply template c'est quand tu vas envoyer un message à ton client c'est un petit peu comme une signature sauf que là c'est un texte qui se met au début de chaque message donc ça c'est pareil j'ai tendance à l'enlever parce que bonjour avec le prénom du client je le mets toujours dans mes templates que j'enregistre à l'intérieur à l'intérieur des outils donc c'est pas quelque chose que j'utilise

[05:54] voilà une fois que j'ai fait ça je vais pouvoir venir paramétrer ici mon compte en haut profile setting et là je vais pouvoir venir mettre donc une petite photo c'est toujours mieux bah tu vas sur conva tu mets par exemple photo professionnelle portrait et bah tu viens porter une photo ici ta time zone langage tu peux venir changer ta langue ici ta signature de support donc par exemple ana votre conseillère

[06:22] personnel 3w.demo shop.com je peux venir faire une petite mise en page je peux venir aussi mettre une photo par exemple une petite photo de mon logo ça peut être sympa et j'enregistre le changement ensuite dans admin on va pouvoir

[06:42] commencer à travailler tout ce qui va être réponse prédéfinie donc des templates d'email enregistré pour gagner en productivité et en temps à l'intérieur de fresh desk quand on va répondre aux emails donc pour ça on a réponse prédéfinie qui se trouve d'ailleurs dans la catégorie à productivité des agents et ici on va pouvoir venir créer nos réponses donc par exemple créer

[07:05] nouveau ici je vais venir mettre donc un meton un template un template de message voilà ou est non colis pour une commande explodier hop voilà donc bonjour merci pour votre email je m'en forme rapidement j'enlève la signature parce qu'on a vu que la signature était déjà

[07:29] enregistrée par défaut dans nos paramètres voilà bonjour avec le prénom du client donc le prénom du client je peux venir ajouter ici des petites variables par exemple contact j'ai contact prénom ce qui fait que fresh desk va automatiquement identifier le champ prénom de la personne qui s'adresse à nous et quand on va utiliser le template ça ça va se remplir

[07:53] automatiquement il n'aura pas besoin de venir le taper à la main c'est pareil vu que j'ai connecté shopify ici je vais avoir des champs personnalisables qui sont hyper intéressants à utiliser donc là par exemple vous pouvez suivre l'avancée de votre livraison en insérant en suivant ce lien et là insérer le lien de suivi au lieu de venir insérer manuellement le lien de suivi je vais pouvoir prendre ma variable

[08:14] shopify url de suivi de la dernière commande voilà et ça se remplira automatiquement mon template après je peux le personnaliser par exemple mes délais de de livraison de 5 jours disponibles pour alors je veux que mes templates soient accessibles à la totalité de mon équipe donc pour ça je vais mettre tous les agents

[08:35] dossier je vais pouvoir venir créer des dossiers également pour ranger mes templates pour que ça soit beaucoup plus organisé et simple à utiliser quand je ne veux pas les utiliser donc là je vais créer et là on va voir que j'ai différents dossiers je vais avoir mon dossier par exemple personnel pour mes templates personnels général je peux mettre un petit peu de tout qui rentre pas dans le forcément des catégories

[08:57] je peux créer avoir un dossier très bien retourner remboursement là je vais avoir tous mes templates par exemple pour répondre aux clients qui disent comment faire un retour je peux venir créer des nouveaux dossiers ici donc par exemple là ça va être tous les dossiers question commande et suivi hop et mon template que je viens d'enregistrer je peux très bien venir

[09:20] le trier dans question commande et suivi voilà et maintenant il sera dans le bon dossier autre fonctionnalité intéressante ça va être les solutions donc solution il ya différentes façons de l'utiliser on peut créer des bases de données interne ce qui fait que tous vos process en fait seront facilement accessibles grâce aux articles de solution par votre équipe de support client si jamais ils bloquent un petit peu sur un cas client par exemple

[09:43] au moins ils ont tout sous la main il peuvent aussi être utilisé pour créer un portail complet donc un help center qui va être mis à disposition de vos clients sur votre site donc là par exemple je vais venir créer ça je vais mettre ici parce que ça va me gêner créer un article de solution mon article de solution ça peut être comment retourner un colis une commande

[10:09] là on va mettre notre article de solution ça peut être d'avner d'apprendre que votre commande ne vous convient pas cette fois ci pour effectuer un retour là je vais mettre mes conditions de retour donc des lait de retour

[10:32] 14 jours par exemple depuis la réception ça peut être pas endommagé pas la v etc etc et là en gros je vais mettre toutes enfin tout mon article de fac complet je vais venir enregistrer en haut pardon je veux dire c'est créer un dossier avant donc créer un dossier pour

[10:56] catégoriser mes articles à l'intérieur de mon dossier principal donc là du coup je vais mettre par exemple non mon dossier ça va être retour et remboursement hiérarchie c'est ici que je vais venir créer ma catégorie donc je vais l'appeler par exemple fac fac fac avec le nom boutique

[11:19] par exemple j'enregistre j'enregistre j'enregistre ici aussi et maintenant quand je vais aller dans ma base de connaissance ici on va voir que j'ai ma catégorie j'ai ma fac que je viens de créer et à l'intérieur je vais retrouver donc des différents dossiers pour structurer mon

[11:41] mon help center ici je vais pouvoir voir aussi ça c'est super intéressant au niveau de mon help center quels sont les articles les plus consultés donc là je sais que ça intéresse qui voit les consultés mes articles si j'ai plusieurs articles je vais pouvoir prendre enfin si j'ai un article qui a l'air d'être beaucoup consulté ça veut dire qu'il intéresse beaucoup les personnes je vais pouvoir venir le mettre en avant dans ma catégorie

[12:06] simplement en revenant le déplacer comme ça je vais avoir des votes également utiles pas utiles donc les personnes quand elles vont consulter mon article elles vont pouvoir me dire si ça a été utile ou pas utile si j'ai beaucoup de votes pas utiles je vais pouvoir revenir travailler mon article de solution hop je vais juste le publier voilà ici dans paramètres

[12:33] portail dans portail personnaliser le portail c'est là que je vais pouvoir créer un help center complet que je vais pouvoir mettre à disposition de mes clients basé sur mes articles de solution que je viens de créer donc là par exemple je peux le personnaliser à la couleur de ma marque hop on va mettre un petit

[12:54] un petit violet non de mon portail je vais pouvoir donc le customiser totalement j'enregistrer suivant ici je vais pouvoir sélectionner donc mon article enfin ma catégorie que je viens de créer donc là j'ai créé ma fac des mots mais ça aurait pu à très bien être autre chose si par exemple je lis plusieurs boutiques à mon fraîche desk et que chacune a sa propre base de connaissance

[13:18] j'enregistrer suivant formulaire de ticket là je vais pouvoir choisir le formulaire que je souhaite mettre à disposition de mes clients je peux l'activer et ici je vais avoir mon mon lien pour accéder à mon portail et c'est ce lien là que je vais pouvoir venir mettre sur ma boutique pour que les personnes puissent voir

[13:41] par contre je peux le personnaliser beaucoup beaucoup mieux voilà là commence à rendre ici les personnes peuvent parcourir les articles de façon simple là on voit qu'on a bien la catégorie retour des remboursements avec l'article que j'ai créé les personnes peuvent voter oui non pas pertinent ici elles peuvent venir chercher des solutions ce qui est beaucoup plus fluide pour l'expérience client et qui améliore aussi le customer et pour score

[14:06] ici je vais pouvoir venir envoyer un ticket donc là je vais avoir ça c'est pareil ça va tout être à paramétrer dans fraîche desk pour le traduire si besoin l'objet je vais pouvoir ajouter ou retirer des champs également à l'intérieur de fraîche des pour vraiment tout paramétrer avoir un formulaire qui correspond parfaitement à mes besoins de tri en interne donc par exemple

[14:31] si j'ai besoin de alors là je vais pas avoir l'exemple si voilà type admettons je pourrais très bien mettre à l'intérieur de fraîche desk un type je sais pas de vie et comme ça toutes les personnes qui vont sélectionner de vie quand elles vont me contacter je peux créer une automatisation à l'intérieur de fraîche desk pour

[14:52] envoyer tout ce qui est de vie à une personne qui s'occupe des devis dans une entreprise ce qui évite de venir polluer en fait là j'ai la les personnes qui gère qui gère les les messages et savait on va dire plus classique et de rediriger aux bonnes personnes si vous avez un pôle assez important dans paramètres avancés ici je vais pouvoir venir

[15:14] modifier enfin personnaliser mon url là l'url que j'ai c'est ça en gros c'est le nom de ma marque pour un fraîche desk comm c'est pas très très bien on va dire pas très pro en termes d'image donc admettons si je veux choisir on y a les démo point help je peux totalement et ensuite j'aurai

[15:34] les informations qui vont mettre données pour que je puisse simplement venir paramétrer dans mon DNS lié à mon nombre d'omaine ici je vais pouvoir venir mettre la langue de mon help center par exemple fraîche mettre mon logo ici je peux mettre la page d'accueil de ma boutique hop et l'objectif ça aide de remplir comme ça un maximum de sections voilà donc là formulaire

[15:58] donc on a plein de choses à venir personnaliser maintenant on va passer à la gestion des tickets donc la gestion des tickets tous passent ici ici je vais avoir une vue donc de tout ce qui se passe un petit peu osav à droite je vais pouvoir venir jouer avec mes filtres pour trouver par exemple tous les tickets donc qui me sont attribués à moi qui sont attribués à une personne de l'équipe

[16:24] ici je peux tous les sélectionner si je veux tous les voir ici je vais venir choisir le statut de mes tickets si je veux voir par exemple tous mes tickets qui ont qui n'ont pas encore été résolues tous les tickets qui ont été ouvert qui sont en attente qui sont en attente du client en attente d'un tiers

[16:46] et où assigner à la janvier voilà je viens appliquer et là il restera dans ma boîte de réception ici une vue beaucoup plus épurée on va dire de ce que je dois traiter si je veux passer en revue des tickets qui ont déjà été traité pas c'est simple ici je mets juste les tickets qui ont été déjà résolues et les tickets qui ont déjà été clôturés

[17:10] maintenant quand j'ouvre un ticket hop par exemple ici je vais avoir différentes choses intéressantes ici je vais pouvoir répondre à la personne donc on voit que ma petite signature que j'ai par amélioré se met en automatique je vais pouvoir sinon mettre une note interne où je vais pouvoir éventuellement taguer des personnes de mon équipe par exemple peut-tu

[17:30] vérifier ce ticket si je mets ma remarque l'appel à le client ne le voit pas mais nous on le voit en interne à droite je vais pouvoir venir mettre différents tags des types je peux voir en haut fermer mon ticket une fois que j'ai terminé ou quand je réponds à mon client je peux revenir ici envoyer

[17:54] sous différents statuts par exemple si j'envoie en attente du client c'est-à-dire que j'ai peut-être posé une question au client j'attends sa réponse donc je peux venir mettre le statut en attente du client ici en bas dans réponse prédéfinie on va retrouver des templates d'email donc c'est ce qu'on a enregistré tout à l'heure qui nous permettent de gagner en efficacité donc on voit ici le petit champ personnalisable que j'ai mis tout à l'heure dans les réponses prédéfinies il se remplit automatiquement

[18:21] ici le lien de suivi se met pas parce que la commande n'est pas liée à une commande sur Shopify simplement l'email du client n'est pas détecté comme liée à Shopify je vais pouvoir retrouver aussi mes articles de solution qui se trouve ici voilà donc là je vais pouvoir venir voir un petit peu en gros c'est les articles de faque pour pouvoir répondre de façon pertinente à mes clients aussi je recherche une information en interne

[18:49] à droite là encore je vais pouvoir retrouver tous mes connecteurs donc là j'ai si donc la commande de la client était bien disponible et c'est juste qu'il n'y avait pas de numéro de suivi quand elle n'a pas été encore expédie donc c'est pour ça que le champ personnalisable se remplissait pas mais là j'en aperçus direct de tout ce que la cliente a commandé

[19:09] voilà donc la commande la pure et sante les statues qu'elle a commandé exactement je peux également procéder à des remboursements si je veux voilà à l'intérieur de de freshdesse directement ce qui nous évite de sortir de la place form donc ça fait gagner du temps je peux annuler des commandes ce que je peux faire

[19:32] aussi c'est attribuer les tickets à d'autres agents par exemple si le ticket ne concerne pas je peux mettre une le ticket à une autre personne lui mettre une petite note et comme ça je lui attribue ce qu'on va avoir aussi c'est ajouter un résumé y a ce qui nous permet de voir un petit peu ce qui s'est passé dans le ticket ça c'est utile quand il y a beaucoup d'échanges ça fait gagner du temps plutôt que de tout relire

[19:55] voilà donc qu'est ce que le client demande étapes prises l'agent a été assigné pour vérifier ce ticket et aucune résolution n'a été mentionné dans la conversation ici dans chronologie récente c'est bien parce qu'on peut voir tout l'historique de conversation avec le client donc on voit ici que notre client nous a ouvert plusieurs tickets on peut aller voir toute l'activité

[20:17] et là on voit un coup d'oeil donc tous les tickets qui ont été ouvert par par la personne maintenant dans les paramétrages on peut aller beaucoup plus loin en mettant en place notamment des automatisations donc automatisation par exemple si hop on veut trier tous les tickets urgent afin de les prioriser dans la lorsqu'on va prendre en charge notre support

[20:42] on peut par exemple définir ticket ici on va mettre dans la description dans l'objet ou la description plutôt si ça contient des mots-clés de type des gccf avocat et comme ça on va venir se faire une genre de petite

[21:02] de petite base de mots-clés qui sont un petit peu un petit peu lié à des cas d'escalate et on va pouvoir créer des automatisations pour dire que en fait à chaque fois qu'on va recevoir un ticket qui mentionne un de ces mots-clés on peut définir la priorité comme urgent on peut attribuer le ticket

[21:23] donc assigner le ticket à un agent ou par exemple un agent seigneur de votre équipe qui sait parfaitement gérer les cas d'escalate on peut lui assigner le ticket ce qu'on peut faire également comme cdk qui sont un petit peu un petit peu chaud on va dire si on parle de gccf plein d'avocats on peut rajouter même police

[21:43] gendarmerie on peut ajouter litige aussi litige dispute charge back voilà donc comme ça on sait qu'on a des clients à risque à prendre en charge rapidement on peut venir mettre un petit tag aussi à le metton qui se mettra en automatique sur le ticket

[22:06] c'est une balise par exemple une balise urgent voilà et maintenant je vais pouvoir venir enregistrer donc là je vois mon flow complet d'automatisation et ici quand je vais prendre en charge mes tickets ça c'est utile quand il y a quand même pas mal de volume je vais pouvoir venir trier donc tous mes tickets qui ont été ouvertes non résolu etc je vais pouvoir mettre mes priorités urgent

[22:33] et ensuite j'applique comme ça là j'aurai une vue de tous mes tickets urgent à traiter sur la journée on peut très bien mettre en place des automatisations pour tout ce qui est modification commande aussi basé sur des mots-clés ce qui nous permet vraiment de trier à l'intérieur de fresh desk bah tous les tous les cas qu'on peut rencontrer assez fréquemment

[22:57] on a d'autres fonctionnalités notamment analyse donc c'est là qu'on va retrouver tous nos capiais et toute la santé on va dire de notre service client voilà donc par défaut il y a déjà plein de rapports qui sont prêts à enregistrer ceux que je regarde le plus ça va être agent performance report pour voir les performances du service client

[23:18] voilà donc on va voir en gros tout ce qui est par agent le nombre de tickets qui ont été répondu résolu etc on va avoir résolution à une réponse time report donc là vous allez pouvoir voir votre délai de réponse moyen votre first contact résolution

[23:43] on a le temps de traitement moyen les performances du centre de support et ensuite une fois qu'on les a mis en favoris là on a une vue beaucoup plus pratique pour aller voir rapidement bah toutes les

[24:04] toutes les data qui vont nous intéresser à janvier donc ici ça va être des choses qui vont être activées qui sont pas qui sont pas dans tous les plans par contre attention de fresh desk il y a pas mal de petites fonctionnalités notamment l'envoi de

[24:29] enquête de satisfaction au client l'ajout d'agent IA pour le chatbot l'ajout du chat sur le site l'ajout d'agent IA pour répondre de façon automatique au client c'est pas des choses qui sont dans les plans basiques donc à chaque fois il faut rajouter des options c'est pour ça que généralement le meilleur combo que je préconise ça va être fresh desk plus pour de la gestion de tickets on voit qu'on peut vraiment venir

[24:56] on a un outil complet pour collaborer pour clériser les tickets pour organiser notre travail on a des articles complets un centre d'aide pareil et complet qu'on peut mettre à disposition des clients sur le site mais par contre tout ce qui est chat et IA je trouve que c'est pas forcément ce qui a de plus avancé en termes d'outils là par exemple on a un agent e-commerce

[25:17] ça c'est un petit peu tout ce qui peut faire hop si je vais utiliser l'agent là je vais pouvoir lui donner toute ma base de connaissance donc les URL de mon site des fichiers, des articles de solutions donc ça hop je peux l'activer comme ça il ira voir

[25:40] lire par défaut donc tous les articles de solutions que j'ai déjà enregistré ici je peux lui faire des petites questions et penses pour qu'il sache comment répondre à des clients ici on retrouve des workflows donc là par contre il faut installer une application qui est dédiée au workflow pour pouvoir le faire mais c'est pareil il y a des petites choses qui peuvent être sympa à faire

[26:03] ça peut être quand même sympa à checker donc les workflows ça ne sera pas de lia par contre c'est vraiment des déclencheurs qui permettent d'avoir des actions qui se font en automatique là par exemple tout ce qui va être order status donc quand un client demande à vérifier le statut de sa commande là on va avoir un workflow complet

[26:25] hop qui dit par exemple le client demande des informations sur sa commande là ça va chercher le client par email directement dans Shopify ensuite deux possibilités si lia ne trouve pas l'information, le chatbot ne trouve pas l'information relative au client, à la commande du client

[26:48] on envoie une réponse, oops désolé je n'ai pas trouvé d'adresse mail de commande à cette adresse mail et ensuite ça transfère à l'agent et là on voit que si ça trouve la commande on va pouvoir laisser l'agent lia générer et envoyer une réponse ensuite ça va collecter des informations de commande

[27:09] donc il y a quand même des petites automatisations hyper sympa à faire et en plus à savoir que tout ce qui est WeSmo donc question Where is my order c'est ce qui revient le plus sois-sav et c'est ça qui va permettre de désengorger aussi le plus possible service client et ici si jamais vous voulez activer votre chat pareil dans les paramètres

[27:31] vous pouvez venir tout personnaliser ici dans paramètres avancés vous pouvez modifier un petit peu le visuel, bon là le visu marche pas généralement mais ça met des petits effets en gros en fond ici on rajoute un message donc par exemple bonjour comment vous pouvez vous aider

[27:52] et là vous allez pouvoir personnaliser comme ça vraiment votre chat bot là on a tout le contenu donc ça c'est tout ce qu'on va pouvoir venir personnaliser vous allez pouvoir activer aussi des bases de connaissances donc là la petite fact qu'on a vu la mettre à disposition directement dans le chat

[28:13] formuleurs pareil si les clients vous contacte ou et savez donc ça c'est toutes des petites choses qu'il va pouvoir venir traduire par contre si vous n'êtes pas sur une boutique en anglais et voilà
