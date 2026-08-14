---
module: EMAIL & MESSAGING MARKETING
lecon: 7
titre: "Préambule Module 3 & 4"
duree: "8:42"
url: "https://www.skool.com/master/classroom/470574c6?md=e71d78f6662c42fb805723ddb2dc4622"
statut: complet
source: skool-master
maj: 2026-08-13
---

# 07 — Préambule Module 3 & 4

`Section Skool : CAMPAGNES MAILING`

## Ce que la leçon annonce

> **Source : page de la leçon (texte Skool)**

### Introduction

Comprendre et construire des flows sur Klaviyo, avant de plonger dans les modules 3 & 4.

---

### Ce que tu vas apprendre

Dans cette vidéo, vous allez apprendre à créer un flow Klaviyo de A à Z : comment choisir le bon trigger (métrique Shopify vs segment), comment structurer votre logique avec des splits conditionnels et des trigger splits, comment utiliser les filtres (trigger filters vs profile filters) pour éviter d'envoyer les mauvais emails aux mauvaises personnes, et comment gagner du temps en clonant vos flows existants. À la fin, vous saurez construire un flow post-achat ou abandon de checkout propre, efficace et prêt à générer du chiffre.

---

### Mindset / Vision

En parallèle de la technique, gardez en tête qu'un bon mapping de vos flows (sur Figma, FigJam ou Miro) avant et après leur création vous donnera une vision claire à partager avec votre équipe marketing. La clarté de la structure, c'est la condition pour scaler sans tout casser.

---

### Timestamps

00:00 - Intro et templates de flots
00:57 - Créer un flot et choisir le trigger
02:06 - Actions du flow, propriétés et webhooks
03:57 - Splits, délais et filtres essentiels
07:19 - Prévisualiser, cloner et mapper ses flots

---

### Tags (Pour optimisation de recherche Skool)

`Klaviyo` `email marketing` `flow automation` `e-commerce` `abandon checkout` `post-achat` `segmentation` `trigger` `split conditionnel` `Shopify`

## Transcription

> **Source : audio (Whisper local, modèle small)**

[00:01] Je rajoute cette vidéo en préambule des modules 3 et 4 sur lesquels on va faire les flots pré-achat et post-achat juste pour vous montrer comment créer un flow sur la bulle. Donc les flots vous allez les avoir ici et comme vous le disiez ils répondent à des métriques. Donc on peut créer un flow à partir de template, ça vous permettra d'avoir les variables directement dedans. Donc typiquement si je vais sur l'abandon checkout.

[00:22] Ce qui est bien si vous utilisez le template de clavio, c'est que vous allez voir à l'intérieur. On aura les variables qui seront directement dedans. Je vais donc ici sur le mail. Ici ça peut être une manière de faire.

[00:42] L'avantage comme je vous dis c'est qu'on aura déjà de base les variables qui sont dedans et donc on pourra voir le produit etc. Maintenant, je ne vous cache pas qu'on fait les mails à la main parce qu'on trouve ça plus sympa. Je vais vous montrer comment on peut faire ça aussi. Exit flow. Je vais créer un flow. Je vais faire build your own.

[01:04] Un flow il est toujours déclenché par un trigger. C'est ce qui va déclencher le flow. Moi je vous recommande de ne jamais avoir de flow qui commence par des segments. Ne l'utilisez pas ça sauf s'il y a un cas particulier. Si vous embasez des dates sur votre profil du client.

[01:26] Pour l'anniversaire ou alors je ne sais pas, une date de fin de garantie, tout ce qui est date. C'est-à-dire une date qui est stockée sur le profil du client. On pourra la réutiliser à partir d'un flow qui est déclenché par une date. On pourra dire déclencher ce flow x jours avant cette date. Ça c'est une chose qu'on pourrait utiliser.

[01:48] Les segments je ne m'en sers pas forcément. Et moi je déclenche tout à partir des métriques. J'ai différents types de métriques. Moi j'utilise la métrique Shopify. Je vais faire par rapport à un flow post-achat par exemple. Quand j'achète que je crée mon flow. Je ne peux plus modifier cette partie-là. Maintenant qu'est-ce que je vais faire ? Je vais pouvoir faire glisser différentes choses.

[02:09] Ici je vais avoir des contenus. Email, SMS, WhatsApp qui sont tous intégrés sur clavio. Je vais pouvoir avoir aussi une mise à jour de propriété. Par exemple, update existing property ou create nouvelle property. Par exemple si je veux tout le temps savoir qui est actuellement dans mon flow post-achat. Pour potentiellement exclure ces gens-là des campagnes.

[02:31] Je vais peut-être mettre un propriété flow post purchase in. Je save. Et donc dès que je vais quelqu'un qui passe commande et qui rentre dans le flow. Je vais le cloner. Et maintenant je vais mettre out. Et donc à la fin du flow, j'aurai out. Ou alors je vais même pouvoir la delete.

[02:52] Flow post purchase. Ça dépend de comment vous avez décidé de le mapper. Et donc ça c'est quelque chose qu'on peut faire dans un flow. C'est-à-dire aller créer, éditer ou supprimer une propriété. On va pouvoir faire la même chose avec une liste. On va pouvoir aussi envoyer des webbooks. Donc il faut savoir qu'un webbook, je pense que vous savez ce que c'est. C'est une sorte de petite capsule d'information qu'on va pouvoir envoyer

[03:14] à un autre outil pour communiquer avec. C'est quelque chose qu'on va utiliser par exemple si on utilise une autre interface pour WhatsApp ou pour envoyer des modifications. Ça en général vous savez le programmer avec l'outil de webbook que vous utilisez. J'ai une destination URL, peu importe. Et ici je vais pouvoir mettre les informations que j'ai envie de mettre dans la capsule. Et vous voyez ici je vais pouvoir mettre vraiment

[03:36] tout ce que je vois en termes de profile propriété. Et d'event pro-partie. Moi c'est un compte de test donc je ne vois rien. Mais dans un événement Play Store d'heure normale, j'aurais tout un tas d'informations qui sont stockées que je pourrais passer ici. Internal alert ça peut être sympa aussi. C'est un email qui va s'envoyer automatiquement à une destination que vous voulez.

[03:57] Par exemple je pourrais avoir un split. On y reviendra sur le split. Vous voyez hop. Internal alert. Et là vous voyez je vais mettre un split. J'ai deux types de splits. J'ai les splits conditionnels et les splits triggers. Les splits triggers c'est un split qui fait référence

[04:17] aux informations que j'ai dans l'événement Play Store d'heure. Donc là en fonction de ce qu'il y a dedans vous voyez j'ai différentes dimensions. Moi il n'est pas connecté. Si il était connecté j'aurais catégorie etc. Et donc je fais un split qui est basé sur l'événement d'avant. Le conditionnel split lui c'est la même chose mais lui il se base sur toutes les informations qu'on a dans Clavio et non sur cet événement.

[04:39] On vous retrouve exactement le même menu que quand vous faites un segment et vous avez donc la possibilité de splitter en fonction des properties mais aussi en fonction de ce qu'a fait la personne par le passé. Et donc là ce qu'on veut dire par exemple c'est à split ce Nordeur equals 1 over all time. Et donc là en fait je vais avoir mon chemin pour les gens qui ont acheté qu'une fois.

[05:02] Ensuite je vais avoir mon chemin pour les gens qui ont acheté deux fois etc. Vous pouvez supprimer les splits, vous pouvez les alterner si vous l'avez mal construit. Et vous voyez quand je supprime il me propose d'enlever un des deux chemins. Moi je peux enlever que le chemin de gauche et comme ça ça m'évite de supprimer mon fou. Évidemment vous pouvez rajouter des délais là jusque là tout va bien.

[05:25] Il faut savoir un truc vous pouvez modifier ça. Ça c'est cool par exemple si je vends à Paris. Moi je veux envoyer un email dans trois jours mais je vais me dire je l'envoie la prochaine fois qu'il est 11h du matin et dans trois jours. Ça m'évite d'envoyer mon mail pile dans trois jours mais si la personne elle a

[05:49] passé commande à une heure particulière peut-être qu'elle recevra ce mail à une heure particulière alors que vous avez fait des tests par le passé vous savez que 9h c'est votre meilleur heure pour envoyer des emails. Vous savez que vous n'allez pas exclure cette personne des newsletters donc vous voulez votre flow il envoie pas de mail le dimanche parce que vous avez votre newsletter vous pouvez faire ça. Autre élément important c'est tout ce qui est filtre.

[06:12] Moi je vois souvent des gens qui utilisent des conditionnels split avant chaque email pour s'assurer que les personnes qui ont acheté depuis le début du flow ne reçoivent pas l'email. Ça c'est quelque chose qu'on va retrouver ici. Il y a deux types de filtres. Vous verrez très attention avec ça parce que si vous appliquez les mauvais filtres les gens sont exclu de votre flow vous envoyez moins de mail et donc ça ne répond pas aux objectifs de chiffre d'affaire.

[06:33] Les triggers filters ou les profile filters. Les triggers filters vous en avez différents ici et on retrouve encore une fois la même chose que ce qu'on avait sur les triggers split. Ça se base sur les informations de l'événement d'ici. Profile filter c'est une question qu'il va se poser à chaque fois qu'il veut envoyer un mail et si vous ne répondez pas à ces questions vous n'allez pas le recevoir.

[06:55] Par exemple, moi ce que je peux faire c'est what someone has done or not done has placed an order, zero time, since starting this flow. Et donc si la personne a acheté depuis le début du flow elle va sortir et ça vous allez pouvoir avoir différents filtres et ça va répondre à pas mal de choses. Voilà, je pense que là j'ai couvert à peu près tout.

[07:18] Là vous pouvez bâtir vos différents flows. Vous allez pouvoir faire des previews sur vos emails et tout. Vous pourrez faire des previews des emails et vous pourrez vérifier que tout fonctionne. À savoir que vous pouvez aussi cloner les flows. Donc une fois que vous aurez construit votre flow checkout, vous allez pouvoir le cloner et changer la métrique

[07:40] pour éviter de le refaire à zéro. Donc moi j'ai créé par exemple ici un abandon checkout. Je vais le cloner. Et ici je vais choisir une autre métrique. Donc en l'occurrence, à tout cartes. Et il ne me restera plus qu'à modifier les variables à l'intérieur de ce flow pour que ça fonctionne. Parce que les variables de à tout cartes sont différentes des variables de checkout. Bon là en vrai tout à fait simple.

[08:02] Je vous recommande également d'avoir un naming un peu propre, d'avoir des flows relativement courts, relativement propres. Et à la fin ce qui serait cool c'est... Oui, c'est un exemple de mapping mais une fois que vous avez créé tous vos flows sur Figma par exemple, c'est un outil qui s'appelle Fidjam, sinon il y a des outils qui s'appelle par exemple Miro. C'est d'aller mettre en place un mapping des flows

[08:24] que vous avez en ligne. Ça c'est un mapping avant de créer des flows et après on a un mapping après. Et comme ça vous avez une vision unique que vous pouvez communiquer au SAV, que vous pouvez communiquer au marketing etc. C'est vachement pratique de faire ça. Voilà et puis maintenant place au différents modules sur les flows.
