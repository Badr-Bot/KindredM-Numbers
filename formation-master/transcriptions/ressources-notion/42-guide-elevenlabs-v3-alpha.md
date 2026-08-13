---
module: RESSOURCES NOTION
lecon: 42
titre: "Guide : ElevenLabs V3 (alpha)"
duree: ""
url: "https://classic-fireman-cf4.notion.site/Guide-ElevenLabs-V3-alpha-2189a4e21632806a8bcdc78af3919683"
statut: complet
source: notion-public
maj: 2026-08-13
---

# 42 — Guide : ElevenLabs V3 (alpha)

> **Source : document Notion public de la formation**
> Référencé par : MASTER IA / 21 Mise à jour Eleven Labs V3 (new)

## Contenu du document

Inscription ici : Eleven Labs V3
 Introduction
ElevenLabs V3 est la dernière version du modèle de synthèse vocale (TTS) développé par ElevenLabs. Il s’agit de leur modèle le plus expressif, multilingue et personnalisable à ce jour. Ce guide présente ses fonctionnalités clés, ses cas d’usage, ses limites et les meilleures pratiques pour le maîtriser.
 Ce qui change avec V3
Expressivité améliorée : contrôle précis des émotions et tons avec des balises audio (“audio tags”).
Support multilingue étendu : + de 70 langues (contre 29 dans V2).
Dialogue multi-locuteurs : orchestré avec la nouvelle API Text to Dialogue.
Personnalisation plus poussée : stabilité, expressivité, style, etc.
 Fonctionnalités clés
1.  Audio Tags (balises audio)
Voici la liste officielle des balises audio prises en charge par ElevenLabs V3, avec leur traduction :
 Émotions
Audio tag
	
Traduction française

[EXCITED]
	
enthousiaste

[NERVOUS]
	
nerveux

[FRUSTRATED]
	
frustré

[TIRED]
	
fatigué

[SAD]
	
triste

[ANGRY]
	
en colère

[SORROWFUL]
	
attristé

[CURIOUS]
	
curieux

[SARCASTIC]
	
sarcastique

[CRYING]
	
en pleurs
 Réactions humaines / non verbales
Audio tag
	
Traduction française

[GASP]
	
halètement

[SIGH]
	
soupir

[LAUGHS] / [LAUGHING]
	
rire

[LAUGHS HARDER]
	
rire plus fort

[STARTS LAUGHING]
	
commence à rire

[GIGGLES]
	
gloussement

[SNORTS]
	
reniflement de rire

[WHEEZING]
	
respiration sifflante

[GULPS] / [SWALLOWS]
	
avale (bruit de gorge)

[CLEARS THROAT]
	
se racle la gorge

[EXHALES]
	
expire
 Volume / Ton / Énergie
Audio tag
	
Traduction française

[WHISPERS] / [WHISPERING]
	
chuchote

[SHOUTS] / [SHOUTING]
	
crie

[QUIETLY]
	
doucement

[LOUDLY]
	
fort

[CALM]
	
calmement

[FLATLY]
	
d’un ton plat
 Rythme / Timing / Cadence
Audio tag
	
Traduction française

[PAUSE] / [PAUSES]
	
pause

[BREATHES]
	
respire

[RUSHED]
	
précipité

[SLOWS DOWN]
	
ralentit

[DRAWN OUT]
	
allongé

[STAMMERS]
	
bégaie

[REPEATS]
	
répète

[TIMIDLY]
	
timidement

[DELIBERATE]
	
de façon délibérée

[RAPID-FIRE]
	
en rafale
 Effets sonores / Ambiances
Audio tag
	
Traduction française

[GUNSHOT]
	
coup de feu

[APPLAUSE] / [CLAPPING]
	
applaudissements

[EXPLOSION]
	
explosion

[DOOR CREAKS]
	
porte qui grince

[FOOTSTEPS]
	
bruits de pas

[TELEPHONE RINGS]
	
sonnerie de téléphone

[DRUMROLL]
	
roulement de tambour
 Accents / Styles de personnage
Audio tag
	
Traduction française

[STRONG X ACCENT]
	
fort accent X (ex. [STRONG FRENCH ACCENT])

[BRITISH ACCENT]
	
accent britannique

[AUSTRALIAN ACCENT]
	
accent australien

[SOUTHERN US ACCENT]
	
accent sudiste des États-Unis

[PIRATE VOICE]
	
voix de pirate

[EVIL SCIENTIST VOICE]
	
voix de savant fou

[CHILDLIKE TONE]
	
ton enfantin

[DRAMATIC]
	
dramatique

[SARCASTICALLY]
	
sarcastiquement

[MATTER-OF-FACT]
	
neutre/factuel

[WHINY]
	
plaintif

[FANTASY NARRATOR]
	
narrateur fantastique

[SCI-FI AI VOICE]
	
voix IA de science-fiction

[CLASSIC FILM NOIR]
	
style film noir classique
 Expérimentaux / Autres
Audio tag
	
Traduction française

[SINGS] / [SINGING]
	
chante

[WOO]
	
acclamation

[FART]
	
bruit de pet (humoristique)
 Exemple :
> Loading Plain Text code…
​
> Loading Plain Text code…
​
2.  Dialogue Multi-locuteurs
Grâce à la Text to Dialogue API (JSON), on peut gérer plusieurs speakers avec changement de voix et d’intonation.
Idéal pour jeux vidéo, storytelling, podcasts, etc.
3.  Multilingue (70+ langues)
Traduit et génère du contenu dans une large gamme de langues.
Qualité variable selon la voix utilisée.
4.  Paramètres de stabilité
Creative : très expressif, mais moins stable.
Natural : bon équilibre.
Robust : très stable, moins expressif.
 Limites actuelles
Modèle en alpha, disponible uniquement via l’interface web.
API privée pour l’instant (accessible sur demande).
Non temps réel : latence trop élevée pour usage interactif.
Les voix clonées pro (PVC) peuvent être instables. Préférer les IVC ou voix natives.
 Bonnes pratiques de prompting
Utiliser des prompts longs (>250 caractères).
Toujours tester les balises audio avec chaque voix (certaines ne répondent pas à toutes).
Soigner ponctuation & majuscules pour guider la prosodie :
« … » = pause
MAJUSCULE = emphase
Tester différents niveaux de stabilité selon les besoins.
 Tarification
Réduction de -80 % sur l’interface web jusqu’à fin juin 2025.
Tarifs reviendront à la normale ensuite.
 À venir
API publique du modèle V3 (Text to Dialogue API).
Optimisation des clones vocaux professionnels.
Potentiel passage à un modèle temps réel dans le futur.
 En résumé
Contrôle expressif via audio tags
Dialogue naturel multi-voix
Multilingue + flexible

## Liens externes cités

- https://try.elevenlabs.io/lucas-ia-ecom
