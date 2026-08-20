---
module: RESSOURCES NOTION
lecon: 5
titre: "Raw Talking Heads & Statiques Animés - Seedance 2.5 & Minimax H3"
duree: ""
url: "https://ecom-masters.notion.site/Raw-Talking-Heads-Statiques-Anim-s-Seedance-2-5-Minimax-H3-3b69536abaec817d9010fbe0af78e2c8"
statut: complet
source: notion-public
maj: 2026-08-13
---

# 05 — Raw Talking Heads & Statiques Animés - Seedance 2.5 & Minimax H3

> **Source : document Notion public de la formation**
> Référencé par : MASTER IA / 36 Ep #62 -   Raw Talking Heads & statiques animés; CRÉATIVE INSIGHT / 04 Ep #62 -   Raw Talking Heads & statiques animés

## Contenu du document

Pipeline
Choix du format → Préparation des inputs → Prompt via le skill → Génération → Finition
~0,19 € / seconde avec input | ~5-6 € pour 30 s | Kie.AI (Seedance 2.5 + Minimax H3) | Kling AI pour les statiques
Nouveautés
Deux formats de créa qui tournent fort en ce moment, et trois moteurs de génération qui les rendent produisibles en quelques minutes.
Axe 1 — 2 formats de créa
Format
	
Identité
	
Cas d'usage

A — Raw Talking Head
	
Face cam, brut, presque « ugly », zéro production léchée. Ça fait naturel, et ça installe la confiance chez la personne qui voit la pub.
	
Tout le funnel (froid, tiède, chaud) avec un seul créateur

B — Statique animé
	
Une statique existante mise en mouvement. Format en forte progression, des marques scalent aujourd'hui avec ça.
	
Remplir la Creative Library en volume à partir d'assets déjà produits
Axe 2 — 3 moteurs de génération
Moteur
	
Ce qu'il fait
	
Quand l'utiliser

Seedance 2.5
	
Jusqu'à 30 s, 30 images / 10 vidéos / 10 audios en référence, lip sync
	
Talking head UGC, créa très cadrée, vidéo longue

Minimax H3
	
Jusqu'à 15 s, image-to-video et référence-to-video
	
Volume à petit budget, qualité correcte pour moins cher

Kling AI
	
Animation d'une statique existante
	
Le plus rapide sur le format statique animé
2 formats × 3 moteurs, sans tournage et sans repartir d'une page blanche.
Ressource
 Télécharger le skill (Google Drive)
À importer dans Claude : il gère l'animation des statiques et la rédaction des prompts vidéo.
Setup
Ce qu'il te faut :
> Chargement du code JavaScript…
​
Où trouver Seedance 2.5 :
Le modèle était jusqu'ici réservé à Dreamina (CapCut). Il est désormais disponible partout, notamment sur Higgsfield et sur Kie.AI, où il est nettement moins cher qu'ailleurs.
Tarifs constatés :
Configuration
	
Coût

Seedance 2.5 sur Kie.AI, avec image ou vidéo en input
	
0,19 € / seconde, soit ~5-6 € pour 30 s

Seedance 2.5 en text-to-video (sans input)
	
~0,11 € / seconde en plus, déconseillé

Seedance 2.5 sur Higgsfield et les autres plateformes
	
0,30 à 0,50 € / seconde

Minimax H3
	
Moins cher que Seedance, 15 s max
Utilisation
En 4 étapes :
Réunis tes inputs : une image (UGC ou statique), l'audio (VO ou musique), éventuellement une vidéo de référence.
Fais rédiger le prompt par Claude avec le skill.
Référence explicitement tes fichiers dans le prompt. Sans ça, le modèle ne les rattache pas :
> Chargement du code JavaScript…
​
Lance sur Kie.AI en fixant la durée et la résolution, puis récupère le rendu.
Workflows détaillés
Format A — Raw Talking Head (image + audio → lip sync)
Tu pars d'une image UGC et d'une VO déjà enregistrée. Le prompt rédigé avec le skill demande : une UGC qui parle face cam, l'audio joint en lip sync, un rendu dynamique avec des variations de mouvement. Seedance reconstruit la scène et cale la bouche sur la piste. Dans l'exemple montré, le modèle a légèrement modifié le décor, ce qui était explicitement demandé dans le prompt. Seedance 2.5, quelques minutes.
Format B — Statique animé
Tu reprends une statique de ta Creative Library, tu la passes au skill dans Claude, et il l'anime. Alternative : demander directement l'animation via Kling AI. C'est le format le plus rapide à produire, et il se scale bien puisque tu pars d'assets déjà payés. Kling AI ou skill Claude, quelques minutes.
Bonus — Référence-to-video avec Minimax H3
Nouveau modèle, encore peu connu. Exemple montré : animer une personne qui chante. Inputs = l'image de la personne, une vidéo d'exemple de quelqu'un qui chante, l'audio de la musique, plus la durée et la résolution. Le prompt tient en quelques lignes. Jusqu'à 15 s, moins cher, qualité correcte.
Ce que Seedance 2.5 débloque (vs 2.0)
 Jusqu'à 30 images en input pour verrouiller le produit, le décor et les détails
 Jusqu'à 10 références vidéo
 Jusqu'à 10 références audio
 Durée jusqu'à 30 secondes, contre 15 s max sur Minimax H3
 Lip sync à partir d'une VO fournie
 Image-to-video, vidéo-to-vidéo, text-to-video
 Disponible sur Kie.AI au tarif le plus bas constaté
Quel format pour quel trafic ?
Trafic
	
Format recommandé
	
Pourquoi

Froid
	
Raw Talking Head court
	
Susciter la curiosité, format volontairement bref

Tiède
	
Raw Talking Head projection
	
Répondre au scepticisme et aider le spectateur à se projeter en train d'utiliser le produit

Chaud
	
Raw Talking Head Q&R
	
Répondre directement aux questions, face cam, sans mise en scène

Tous
	
Statique animé
	
Volume à bas coût à partir d'assets existants, alimente la library en continu
À éviter
Le text-to-video pur → environ 0,11 € de plus par seconde, et un rendu moins propre. Mets toujours au minimum une image en input.
Oublier les références dans le prompt → sans @image1 / @audio1, le modèle ignore tes fichiers et improvise.
Générer Seedance ailleurs que sur Kie.AI → 0,30 à 0,50 € / seconde pour exactement le même modèle, soit 2 à 3 fois le prix.
Récap
Étape
	
Action
	
Outil

1. INPUTS
	
Réunir image + audio, et éventuellement une vidéo de référence
	
Creative Library

2. PROMPT
	
Rédiger le prompt et référencer @image1 / @audio1
	
Claude + skill

3. MOTEUR
	
Seedance 2.5 (≤ 30 s) ou Minimax H3 (≤ 15 s)
	
Kie.AI

4. GÉNÉRATION
	
Fixer durée + résolution, puis lancer
	
Kie.AI

5. STATIQUES
	
Animer une statique existante
	
Skill Claude / Kling AI
Tips pratiques
Un créateur = tout le funnel. Le même visage sert en froid, en tiède et en chaud. Tu amortis un seul asset sur les trois étages au lieu de recaster à chaque niveau.
Le raw bat le léché. Le rendu face cam presque « ugly » est précisément ce qui installe la confiance. Ne cherche pas à soigner le cadrage ni l'éclairage.
Toujours une image en input. C'est le levier numéro un à la fois sur la qualité du rendu et sur le coût.
Les statiques animés se scalent. Les marques qui performent en ont énormément dans leur library. C'est le format le moins cher à produire en volume, puisque tu repars d'assets que tu as déjà.
À venir. Une vidéo complète sur Seedance 2.5 (références images et vidéos, modification d'éléments dans une vidéo existante) et une sur Minimax H3, si la demande est là.

## Liens externes cités

- https://kie.ai/?ref=a66f4dcb74076be52e5a3525c4030eb6
- https://drive.google.com/file/d/18XxO8MaS85Jt3MFJXK3hPaoYw9D0yE4R/view
- https://kie.ai/?ref=a66f4dcb74076be52e5a3525c4030eb6
- http://kie.ai/
- http://kie.ai/
- http://kie.ai/
- http://kie.ai/
- https://kie.ai/?ref=a66f4dcb74076be52e5a3525c4030eb6
- https://kie.ai/?ref=a66f4dcb74076be52e5a3525c4030eb6
