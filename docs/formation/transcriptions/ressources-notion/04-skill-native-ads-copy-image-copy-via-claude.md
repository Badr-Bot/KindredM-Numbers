---
module: RESSOURCES NOTION
lecon: 4
titre: "Skill Native Ads Copy - Image ↔ Copy via Claude Code"
duree: ""
url: "https://ecom-masters.notion.site/Skill-Native-Ads-Copy-Image-Copy-via-Claude-Code-66b9536abaec831291c181089bfa775a"
statut: complet
source: notion-public
maj: 2026-08-13
---

# 04 — Skill Native Ads Copy - Image ↔ Copy via Claude Code

> **Source : document Notion public de la formation**
> Référencé par : MASTER IA / 32 Ep #53 - Skill Native Ads Copy via Claude Code; CRÉATIVE INSIGHT / 09 Ep #53 - Skill Native Ads Copy via Claude Code

## Contenu du document

Pipeline
Prep → Claude remplit le plan → Images → Claude écrit les copies → Assemble → Dashboard
~0,60-1€/run (images seules) | ~5-10 min | Kie.AI (gpt-image-2, 2K, 1:1) + Claude Code (Opus 4.8) | 6 paires image↔copy · format 1:1
Ressource
Le concept
Le skill produit des paires 1:1 image ↔ ad copy pour n'importe quelle marque. L'image est un stop-scroll qui ouvre une porte narrative ; la copy long-form continue exactement cette porte (le hook visuel apparaît dans l'image ET dans la 1re ligne de la copy).
Tourne DANS Claude Code, sans clé Anthropic. Les scripts font le mécanique (extraction, images Kie.AI, dashboard) ; Claude Code écrit lui-même les brains + la big idea + les copies. Seule la clé KIE_KEY est requise.
Axe 1 — 5 concepts natives (driver de l'image)
Concept
	
Ce que l'image montre
	
Porte narrative (1re ligne de copy)

Pain Point
	
Le moment de douleur, candide, qualité téléphone
	
« voilà à quoi je ressemble à 14h, et… »

Product Native
	
Le produit comme un vrai client le photographie
	
Mécanisme / usage déjà dans la vie du narrateur

Avatar Native
	
Une personne qui EST l'avatar (problème OU dream-out)
	
Miroir 1re personne, reconnaissance

Contextual
	
L'environnement / la situation, sans héros central
	
« chaque jour à ce bureau, vers 15h… »

Before-After
	
Une transformation crédible (delta honnête)
	
Contraste avant/après + timeline réaliste
Axe 2 — 3 angles de copy
Angle
	
Comportement
	
Émotion dominante

Pain-First
	
Ouvre dans la douleur de l'image, amplifie avant la solution
	
Reconnaissance (« c'est exactement moi »)

Mechanism-First
	
Ouvre sur une révélation de mécanisme (insider secret)
	
Curiosité + « aha »

Story-First
	
Histoire personnelle vécue, voix native organique
	
Identification + espoir crédible
Distribution par défaut (6 paires) : 2 Pain Point · 1 Product Native · 2 Avatar Native (problème + dream-out) · 1 Contextual — entièrement paramétrable (--n-pairs, --distribution).
Règle d'or — Sources exclusives
Universel (figé dans le skill)
	
Spécifique à la marque (modulable)

Data copywritting ad copy/ (frameworks, livres)
	
documents fondamentaux/ (avatar, offre, verbatims…)

MASTER_COPYWRITING_BRAIN.md (12 sections)
	
brand_context_compiled.md (snapshot du run)

NATIVE_VOICE_BRAIN.md (8 sections)
	
Brief runtime (niche, awareness, géo, langue)
Le skill n'invente jamais une donnée marque ni un framework hors corpus. Tout est traçable. Deux principes non négociables : fact-loading (≥5 chiffres/copy) et one big idea par native.
Ressource
(Lien Loom + dossier d'exemple à coller ici)
 Loom de démonstration : [à insérer]
 Exemple de run complet : examples/mushilo_validation_run/ (6 paires + dashboard)
 Dashboard de review : http://localhost:8765
Setup
Structure du dossier projet :
> Chargement du code JavaScript…
​
Mettre à jour la clé API Kie.AI :
Va sur kie.ai et copie ta clé API
Ouvre api-kie-ai.txt à la racine du projet
Colle la clé brute (rien d'autre)
Enregistre et ferme
Pas de clé Anthropic à configurer : Claude Code écrit lui-même les brains et les copies.
Utilisation
En 5 étapes :
Brains (une fois) — extraction locale gratuite, puis Claude écrit les 2 brains :
> Chargement du code Bash…
​
Marque — peuple documents fondamentaux/ (avatar + offre minimum ; templates dans _examples/).
Prep — compile le contexte marque + scaffold le plan :
> Chargement du code Bash…
​
Claude remplit la big idea + les hooks dans pairing_plan.json, puis génère les images, puis écrit les copies.
Assemble + dashboard :
> Chargement du code Bash…
​
Workflows détaillés
Flux par phases (par défaut, dans Claude Code)
prep (compile contexte + plan) → Claude remplit le plan (big idea + shared_visual_hook par paire) → images (Kie.AI, 6 en parallèle) → Claude écrit pair_NN_copy.md → assemble (metadata + manifest + dashboard). Tu restes dans la boucle entre chaque phase.
Chemin 100% autonome (opérateur avec clé API)
--phase auto enchaîne tout d'un coup via l'API Anthropic (hooks + copies générés par script). Pour la production en masse quand une clé ANTHROPIC_API_KEY est dispo.
Ce que le skill gère automatiquement
 Pairing 1:1 — chaque image a SA copy, chaque copy référence SON image
 Compilation du contexte marque (lecture intégrale de documents fondamentaux/)
 Génération d'images Kie.AI gpt-image-2-text-to-image 2K 1:1, sans texte ni logo
 Voix native 1re personne, structure VSL invisible, soft close
 Fact-loading (≥5 chiffres/stats, chaque levier chiffré — uniquement depuis les docs marque)
 One big idea par native (pas de catalogue de features)
 Proxy validation (≥1 tiers crédible tiré des verbatims)
 Metadata + manifest par paire (concept, angle, frameworks cités, char count)
 Dashboard de review auto-lancé
Quel concept pour quel objectif ?
Objectif
	
Concept recommandé
	
Pourquoi

Stopper le scroll d'un public conscient du problème
	
Pain Point
	
Le symptôme exact, candide, crée une reconnaissance immédiate

Montrer le produit sans « faire pub »
	
Product Native
	
Photo « possédée », mène au mécanisme

Faire se reconnaître l'avatar cible
	
Avatar Native
	
Miroir démographique (problème ou dream-out)

Installer une scène / un moment de vie
	
Contextual
	
Sens du lieu et du temps, entrée douce

Prouver une transformation crédible
	
Before-After
	
Delta honnête + timeline réaliste
Le dashboard (output final)
 Charte graphique MASTER (dark, bleu #0081f2, or #efa201)
 Paires image ↔ copy côte à côte, image en plein écran au clic
 Boutons Copy text, Download image, Download ZIP, Open folder, Re-run
 Filtre par concept + recherche dans les copies
 Auto-lancé sur http://localhost:8765 (détecte local vs VPS, reste up jusqu'à Ctrl+C)
Récap
Étape
	
Action
	
Outil

1. SETUP
	
Coller la clé API dans api-kie-ai.txt
	
Éditeur de texte

2. BRAINS
	
build_brain.py --extract-only (une fois)
	
Claude Code

3. MARQUE
	
Peupler documents fondamentaux/
	
Tes docs marque

4. RUN
	
prep → Claude remplit/écrit → images → assemble
	
Claude Code + Kie.AI

5. REVIEW
	
Ouvrir le dashboard, copier ce qui te plaît
	
Dashboard localhost
Tips pratiques
Pairing 1:1 = cohérence. L'image ouvre une porte, la copy la franchit. Le hook visuel partagé est ce qui rend la paire crédible.
Fact-loading systématique. Chaque levier accompagné d'un chiffre tiré des docs marque — c'est ce qui ancre la crédibilité subconsciemment.
One big idea. Une native = une seule idée. Si tu listes des features, tu as déjà perdu le scroll.
Modularité totale. Le même skill tourne sur supplément, fashion, SaaS, food : tu changes juste documents fondamentaux/. Aucune donnée marque hardcodée.
Sources exclusives. Copy = corpus universel. Marque = tes docs du run. Rien d'autre, rien d'inventé.
Le dashboard est l'output. Tu review en 2 min, tu copies les copies gagnantes, tu télécharges les images — le dossier reste accessible pour les puristes.

## Liens externes cités

- http://kie.ai/
- http://kie.ai/
- http://kie.ai/
- http://kie.ai/
- http://kie.ai/
- http://kie.ai/
- http://kie.ai/
- http://localhost/
