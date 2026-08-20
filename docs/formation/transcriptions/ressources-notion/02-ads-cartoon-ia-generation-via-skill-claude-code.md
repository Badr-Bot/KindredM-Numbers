---
module: RESSOURCES NOTION
lecon: 2
titre: "ADS Cartoon IA - Génération via Skill Claude Code"
duree: ""
url: "https://projettt.notion.site/ADS-Cartoon-IA-G-n-ration-via-Skill-Claude-Code-336bba550d71812b921eeb31cf4e39ab"
statut: complet
source: notion-public
maj: 2026-08-13
---

# 02 — ADS Cartoon IA - Génération via Skill Claude Code

> **Source : document Notion public de la formation**
> Référencé par : MASTER IA / 28 Ep #46 - ADS Cartoon IA; CRÉATIVE INSIGHT / 20 Ep #46 - ADS Cartoon IA

## Contenu du document

Pipeline
Analyse marque → Script → Génération → Finition
~2-4€/vidéo | ~10 min | Kie.AI (Veo 3.1 Fast + Nano Banana Pro) | Format 9:16
Ressource
https://drive.google.com/file/d/1JfV-gfLySmvDBEo_wVwRx4hy7deikU5h/view?usp=sharing
Setup
Structure du dossier projet :
> Loading JavaScript code…
​
Mettre à jour la clé API Kie.AI :
Va sur kie.ai et copie ta clé API
Ouvre kie-ai-api-key.txt dans le dossier projet
Colle la clé (rien d'autre, juste la clé brute)
Enregistre et ferme le fichier
Le CLAUDE.md se charge de la lire automatiquement au moment de lancer le script.
Utilisation
En 2 étapes :
Ouvre une session Claude Code vierge dans le dossier projet :
> Loading Bash code…
​
Tape Go (ou copie-colle le contenu du CLAUDE.md comme premier prompt).
Claude va automatiquement :
Dézipper le skill
Lire tous les documents fondamentaux de Doc/
Choisir le meilleur personnage hero + angle pub + hook
Générer le job.json avec dialogues français correctement accentués
Lancer le pipeline de génération en arrière-plan (~8-12 min)
Te notifier quand la vidéo finale est prête dans output/final.mp4
Ce que le skill gère automatiquement
 Génération d'images (Nano Banana Pro) avec cohérence du personnage entre scènes
 Animation + voix native (Veo 3.1 Fast) en français
 Accents français corrects dans les dialogues (règle imposée par le SKILL.md)
 Clips raw complets concaténés (aucune coupure en fin de dialogue)
 Assemblage final ffmpeg, export .mp4 prêt à publier
Post-prod
Sous-titres → CapCut, sous-titres auto (style karaoké Impact blanc + contour noir)
Musique → Fond sonore dramatique / éducatif selon l'angle
Hook visuel → Vérifier que les 2 premières secondes sont scroll-stopping
Variations → Relancer avec un autre angle, perso ou ton en modifiant le CLAUDE.md
Récap
Étape
	
Action
	
Outil

1. SETUP
	
Coller la clé API dans kie-ai-api-key.txt
	
Éditeur de texte

2. LANCEMENT
	
claude dans le dossier, puis Go
	
Claude Code

3. GÉNÉRATION
	
Claude lit les docs, crée le job.json, lance le pipeline
	
Kie.AI (Veo 3.1 + Nano Banana)

4. FINITION
	
Sous-titres + musique
	
CapCut

## Liens externes cités

- http://kie.ai/
- https://drive.google.com/file/d/1JfV-gfLySmvDBEo_wVwRx4hy7deikU5h/view?usp=sharing
- http://kie.ai/
- http://kie.ai/
- http://skill.md/
- http://kie.ai/
