---
module: GÉRER SON SAV +IA by Onially
lecon: 15
titre: "Connecter Claude à Shopify"
duree: "8:09"
url: "https://www.skool.com/master/classroom/a48691fc?md=99444f0821fc4b3a87b9c79faa97d9c0"
statut: complet
source: skool-master
maj: 2026-08-13
---

# 15 — Connecter Claude à Shopify

`Section Skool : 6: Automatiser son SAV avec l'IA`

## Ce que la leçon annonce

> **Source : page de la leçon (texte Skool)**

### Introduction

Connecte Claude à ta boutique Shopify pour automatiser ton service client.

---

### Ce que tu vas apprendre

Dans cette vidéo, tu vas apprendre étape par étape comment relier Claude (via Claude Projects) à ton Shopify en utilisant l'API et le Dev Dashboard. Tu vas créer une application Shopify, configurer les bonnes autorisations d'accès (commandes, clients, produits), générer tes credentials, et les connecter à Claude pour lui permettre de lire tes données boutique en temps réel. À la fin, tu auras un assistant IA opérationnel, capable de récupérer tes commandes et t'aider à gérer ton SAV directement depuis Claude.

---

### Mindset / Vision

Connecter l'IA à ses outils business, c'est passer d'un assistant généraliste à un vrai copilote de ta boutique. Une fois ce pont établi, tu peux déléguer à Claude tout ce qui est répétitif, réponses clients, suivi commandes, gestion de l'info produit, et te concentrer sur ce qui a de la valeur.

---

### Timestamps

00:00 - Objectif et options
00:40 - Créer le projet Claude
01:54 - Configurer l’app Shopify
04:24 - Récupérer les identifiants API
05:09 - Tester la connexion Shopify

---

### Tags (Pour optimisation de recherche Skool)

`Claude AI` `Shopify automatisation` `service client IA` `Claude Projects` `API Shopify` `assistant SAV` `automatisation e-commerce` `intelligence artificielle boutique` `MCP Shopify` `workflow IA`

## Ressources

- [Notion](https://www.notion.so/onially-team/MASTER-Ressources-Module-SAV-343cc15043b380ada640c76cc47e24bc)

## Transcription

> **Source : audio (Whisper local, modèle small)**

[00:00] Hello à toi, on se retrouve dans cette vidéo, je vais te montrer comment est-ce que tu vas pouvoir connecter Claude à ta boutique Shopify. L'objectif de faire ça, ça va être que tu vas pouvoir venir automatiser des tâches. Donc là pour mon domaine, on va rester sur l'automatisation de tâches pour la gestion du service client. Et tu peux très bien imaginer venir automatiser des tâches pour ta boutique. Alors il y a plusieurs façons de connecter Claude à sa boutique Shopify.

[00:23] Ici je vais te montrer une des techniques qui est simple à appliquer, rapide aussi. Mais tu peux très bien connecter ton Shopify via API, via MCP, dans Claude Code ou dans Claude Co-Orc. Nous on va travailler ici dans Claude Co-Orc mais après ça a toit de choisir si tu as une petite préférence. Alors premièrement on va se rendre dans Claude Co-Orc.

[00:44] Il faut savoir que Claude Co-Orc est disponible uniquement sur la version application sur ordinateur. Par contre elle n'est pas disponible sur la version navigateur. Alors du coup je me rends dans Claude Co-Orc, je vais venir faire projet. Et ici je vais venir créer un nouveau projet. Ensuite je vais me rendre dans mes documents.

[01:06] Ici je vais venir créer un dossier que je vais appeler au nom de ma boutique. Par exemple moi ça va être Educative Store. À l'intérieur de ce dossier je vais venir créer un fichier texte. Hop, que je vais appeler Crédential.env. Donc je le mets bien au format.env.

[01:27] À l'intérieur de ce dossier je vais venir copier coller le petit texte que je vous ai mis dans les ressources de cette vidéo. Donc celui-ci. Hop, je viens de le coller ici. Là je vais mettre l'URL de ma boutique en point mychobify.com. Donc pour moi ça va être Educative Store.mychobify.com.

[01:49] Et ici je vais venir remplacer les petits xxx à chaque fois. Donc pour ça je vais aller sur ma boutique Shopify dans mon développeur d'application. Donc je vais dans setting. Je vais aller sur Apps, Develop Apps, Build Apps in Dev Dashboard.

[02:10] Ici je vais venir créer une application. Donc là il faut savoir que je te montre vraiment la technique pour connecter ta boutique via API et via le Dev Dashboard. Il y avait une technique qui était beaucoup plus simple. C'était de passer par Composio. Donc Composio qui est un outil qui permet de se connecter via MCP à plein de outils. Ça aurait été la technique la plus simple et encore plus rapide malheureusement ils ont un bug.

[02:34] Donc peut-être que toi quand tu vas visimer cette vidéo le bug aura été résolu. Mais pour l'instant malheureusement Cloud n'a pas accédé au commande Shopify via Composio. Je te montrerai d'ailleurs dans la prochaine vidéo comment est-ce que tu vas pouvoir connecter des outils de Composio à ton Cloud. Tu verras c'est très très simple.

[02:55] Alors pour en revenir dans mon application. Donc ici je vais lui donner un nom à cette application. Je vais l'appeler par exemple Cloud. Je crée l'appli. Ensuite ici dans la PII version je vais m'assurer d'avoir la dernière version.

[03:16] Et ici dans Scope je vais venir sélectionner différents scopes. Donc en fait les scopes sont les autorisations qu'on va donner à l'application. Ça veut dire que le Cloud aura accès aux choses dont on lui donne l'accès. Par exemple là je vais lui donner accès à mes commandes. Donc with order. Je vais lui donner accès à mes clients. Pour qu'ils puissent read customers.

[03:39] Donc lire mes clients. Et je vais lui donner accès aussi à mes produits. Voilà lire mes produits. Là je sélectionne juste ces trois autorisations d'accès. Mais toi tu peux très bien cocher davantage de choses si tu en as envie. Ensuite je vais faire relays. Relays. Il faut savoir également que lorsque tu vas donner accès à tes commandes.

[04:00] L'application va pouvoir récupérer les commandes des 60 derniers jours dans ton Shopify. Si tu as besoin de voir des commandes qui sont encore plus anciennes. Il suffira simplement d'en faire la demande à Shopify. Donc que tu souhaites avoir dans tes applications l'accès aux commandes qui datent depuis 60 jours. Et ils donneront l'accès. Ils vont juste te demander pourquoi est-ce que tu as besoin d'accéder.

[04:20] À des commandes qui datent depuis 60 jours. Voilà donc là c'est bon. Maintenant ce que je vais faire c'est que je vais cliquer sur le nom de mon appui à gauche. Et je vais venir installer l'application sur ma boutique Shopify. Donc là je viens installer. Voilà une fois que mon appui est installé je reviens donc sur mon application dans setting.

[04:45] Je vais trouver mon client ID. Donc ça je vais le copier. Je vais aller le mettre dans mon fichier credential. Donc je le colle ici. Et là ma secret keys. Pareil ça je supprime. Hop et je viens la coller à la place. Fichier enregistré. Voilà donc là c'est bon.

[05:06] J'ai mon fichier qui est prêt. Maintenant ce que je vais faire c'est que je retourne dans code. Et là on va venir commencer de zéro un nouveau projet. Non mon projet je vais l'appeler par exemple. Assistant SAV. Hop au nom de ma boutique. Instruction. Donc là je vais venir lui donner un petit peu plus de contexte.

[05:29] Par exemple tu es expert en relation client et expérience client. Pour ma boutique. Hop je vais lui donner URL de mon shop. Tu m'aides.

[05:56] Je vais mettre ma boutique Shopify. Tu m'aides à répondre aux emails des clients sur gmail. Voilà. Et là je viens créer mon projet. Ensuite ici je vais venir prendre le petit prompt que je t'ai fait. Et que je te mets à disposition directement.

[06:18] Pareil dans les ressources de cette vidéo. Tu as le coller ici. Ici tu vas juste venir changer le nom de ta boutique. Donc Educative Store pour moi. Là n'hésite pas à utiliser OPUZ 4.7. Qui est la version un petit peu plus intelligente. Parce que ça va être un petit peu plus compliqué pour moi de se connecter via API.

[06:40] Pour Shopify. Alors hop j'envoie. Donc là ça charge. Il faut également savoir que depuis janvier 2026 il y a Shopify qui a fait une mise à jour sur la façon de se connecter via application. Donc il y a moyen que Claude parfois te mette des petits messages d'erreur comme quoi il n'arrive pas à se connecter. Sache que c'est normal entre guillemets.

[07:03] Parce que Claude ne sait pas encore qu'il y a eu toute cette mise à jour de fait. Donc n'hésite pas à forcer si jamais il te dit que c'est pas possible de se connecter. Mais normalement avec les crédents cheaoles et ce qu'on lui a donné il arrive pas mal à faire. Alors là hop on va examiner ce qu'il nous dit. On vient de tout autoriser. Et on va le laisser travailler ça prend un petit moment quelques minutes.

[07:27] Donc là Claude vient de terminer la tâche on va aller voir ce qu'il nous dit. Voilà donc là il nous a sorti des commandes. Si on va voir dans notre boutique hop commande. Annie, Sabine, Vanessa, Sarah, Stéphanie. Annie, Sabine, Vanessa, Sarah, Stéphanie. Ok donc là c'est bon normalement il arrive bien à récupérer mes commandes dans Shopify.

[07:50] Si jamais donc il vous dit que c'est pas possible n'hésiter pas à forcer. N'hésiter pas aussi à lui demander est ce que tu vois n'est dit dernier commande. Par exemple comme ça ça sera un bon test et vous verrez si il est capable de bien vous sortir la liste de vos commandes.
