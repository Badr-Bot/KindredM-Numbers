---
module: RESSOURCES NOTION
lecon: 3
titre: "🎬 Skill AI Ads Modulable - Génération via Claude Code"
duree: ""
url: "https://ecom-masters.notion.site/Skill-AI-Ads-Modulable-G-n-ration-via-Claude-Code-2609536abaec82d889e7818616df4b16"
statut: complet
source: notion-public
maj: 2026-08-13
---

# 03 — 🎬 Skill AI Ads Modulable - Génération via Claude Code

> **Source : document Notion public de la formation**
> Référencé par : MASTER IA / 31 Ep #51 - Skill AI Ads Modulable; CRÉATIVE INSIGHT / 16 Ep #51 - Skill AI Ads Modulable

## Contenu du document

Pipeline
Choix du style → Choix du mode → Analyse marque → Script → Génération → Finition
~2-5€/vidéo | ~10-12 min | Kie.AI (Veo 3.1 Fast + Nano Banana Pro) | Format 9:16
Nouveautés v2
Le skill est maintenant modulable sur deux axes que tu choisis en début d'exécution :
Axe 1 — 4 styles visuels
Style
	
Identité visuelle
	
Cas d'usage

A — Cartoon 3D Pixar
	
Personnage anthropomorphe glossy, visage Disney embedded, no arms/legs
	
Aliments, organes, ingrédients star, objets fonctionnels

B — Clay Stop-Motion
	
Pâte à modeler tactile, style Aardman / Wallace & Gromit, décor miniature
	
Storytelling humain, personnages animaliers, charme artisanal

C — 2D Animation
	
Dessin animé moderne, line art, cel-shading, anime-inspired
	
Audiences jeunes, émotions fortes, contenu éducatif fun

D — Medical 3D
	
Visualisation anatomique photoréaliste, type BBC Earth / "Inside Your Body"
	
Compléments santé, marques fitness, douleurs physiques, mécanismes bio
Axe 2 — 3 modes d'exécution
Mode
	
Comportement
	
Quand l'utiliser

1 — Full autonome
	
Lit les Doc/, décide tout, génère sans validation intermédiaire
	
Production en masse, itération rapide, marque déjà bien cadrée

2 — Semi-autonome
	
Génère 5 scripts diversifiés dans scripts_proposals.md, tu choisis
	
Contrôle créatif + test A/B rapide (zone ROI maximum)

3 — Script importé
	
Tu fournis le script, il l'adapte au pipeline visuel
	
Script copywriting déjà validé / VSL existante à reskinner
4 styles × 3 modes = 12 workflows possibles
Ressource
Setup
Structure du dossier projet :
> Chargement du code JavaScript…
​
Fichiers générés au cours du workflow (selon le mode) :
Mode 2 → scripts_proposals.md à la racine (5 propositions)
Mode 3 → imported_script.md à la racine (ton script à coller)
Mettre à jour la clé API Kie.AI :
Va sur kie.ai et copie ta clé API
Ouvre kie-ai-api-key.txt dans le dossier projet
Colle la clé (rien d'autre, juste la clé brute)
Enregistre et ferme le fichier
Le CLAUDE.md se charge de la lire automatiquement au moment de lancer le script.
Utilisation
En 4 étapes :
Ouvre une session Claude Code vierge dans le dossier projet :
> Chargement du code Bash…
​
Tape Go (ou copie-colle le contenu du CLAUDE.md comme premier prompt).
Réponds aux 2 questions de Claude :
Style visuel : A (Cartoon), B (Clay), C (2D), ou D (Medical)
Mode d'exécution : 1 (Full auto), 2 (Semi auto), ou 3 (Script importé)
Claude exécute le workflow correspondant et te notifie quand output/final.mp4 est prêt.
Workflows détaillés
Mode 1 — Full autonome
Claude lit tous les Doc/, décide personnage + angle + hook + dialogues, crée le job.json, lance la génération. Aucune intervention de ta part. ~10 min.
Mode 2 — Semi-autonome (recommandé pour le ROI créatif)
Claude lit tous les Doc/ puis génère 5 propositions de scripts dans scripts_proposals.md, avec :
5 angles DIFFÉRENTS tirés de ANGLES_PUB.md
5 hooks DIFFÉRENTS tirés du TOP 10 de HOOKS.md
5 verbatims DIFFÉRENTS (Reddit / Amazon / libre)
Cohérence avec le style visuel choisi à l'étape 0
Tu réponds 1, 2, 3, 4 ou 5, et Claude produit la vidéo. ~12 min.
Mode 3 — Script importé
Tu colles ton script dans le chat ou tu le places dans imported_script.md. Claude le mappe en 4 scènes (Hook → Problème → Solution → CTA), te propose le découpage pour validation si nécessaire, puis produit la vidéo. Tes mots ne sont pas réécrits — seulement adaptés techniquement. ~10 min.
Ce que le skill gère automatiquement
✅ Choix conditionnel des templates image/animation selon le style A/B/C/D
✅ Génération d'images (Nano Banana Pro) avec cohérence du personnage entre scènes
✅ Animation + voix native (Veo 3.1 Fast) en français
✅ Accents français corrects (é è ê à ù ç ô î ï â û) — Veo lit littéralement
✅ Diversification stratégique des 5 propositions en mode 2
✅ Mapping technique des scripts importés en mode 3
✅ Clips raw complets concaténés (aucune coupure en fin de dialogue)
✅ Assemblage final ffmpeg, export .mp4 prêt à publier
Quel style pour quelle marque ?
Type de marque
	
Style recommandé
	
Pourquoi

Supplément / santé
	
D (Medical) ou A (Cartoon)
	
Medical pour montrer le mécanisme bio, Cartoon pour anthropomorphiser l'ingrédient star

Fitness / performance
	
D (Medical) ou C (2D)
	
Medical pour muscles/articulations, 2D pour l'énergie et le mouvement

Food / cuisine
	
A (Cartoon) ou B (Clay)
	
Cartoon pour les aliments anthropomorphes, Clay pour le charme artisanal

Lifestyle / quotidien
	
B (Clay) ou C (2D)
	
Storytelling humain attachant, scènes du quotidien

Tech / SaaS / B2B
	
C (2D)
	
Explication rapide, mécaniques abstraites, audiences jeunes
Post-prod
Sous-titres → CapCut, sous-titres auto (style karaoké Impact blanc + contour noir)
Musique → Adaptée au style choisi :
A (Cartoon) → musique énergique / éducative
B (Clay) → folk / acoustique légère
C (2D) → électro / dynamique
D (Medical) → nappes orchestrales / cinématiques
Hook visuel → Vérifier que les 2 premières secondes sont scroll-stopping
Variations → Relancer avec un autre style ou un autre mode pour tester d'autres angles sans repartir de zéro
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

3. CHOIX
	
Style (A/B/C/D) + Mode (1/2/3)
	
Chat Claude Code

4. GÉNÉRATION
	
Claude exécute le workflow et lance le pipeline
	
Kie.AI (Veo 3.1 + Nano Banana)

5. FINITION
	
Sous-titres + musique adaptés au style
	
CapCut
Tips pratiques
Mode 2 = zone ROI max. Tu vois 5 angles d'un coup, tu en produis 2-3 qui te plaisent, tu testes en A/B sans effort.
Mode 3 + ton EcomEI Brain. Tu peux générer des scripts ailleurs (Claude.ai avec ton vault Obsidian en contexte) et les brancher direct sur le pipeline visuel.
Principe facts/stats/numbers. Quel que soit le style et le mode, intègre systématiquement chiffres et stats dans les dialogues — c'est ce qui anchore la crédibilité subconsciemment.
Composabilité. Le même CLAUDE.md orchestre les 12 workflows. Pas besoin de dupliquer le projet par style — tu changes juste ta réponse à l'étape 0.

## Liens externes cités

- http://kie.ai/
- http://kie.ai/
- http://kie.ai/
- http://kie.ai/
- http://claude.ai/
