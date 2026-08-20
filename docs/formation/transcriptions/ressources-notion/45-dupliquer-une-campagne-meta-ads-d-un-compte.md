---
module: RESSOURCES NOTION
lecon: 45
titre: "Dupliquer une campagne Meta Ads d'un compte à un autre"
duree: ""
url: "https://projettt.notion.site/Dupliquer-une-campagne-Meta-Ads-d-un-compte-un-autre-34dbba550d7181758e07fea33e497853"
statut: complet
source: notion-public
maj: 2026-08-13
---

# 45 — Dupliquer une campagne Meta Ads d'un compte à un autre

> **Source : document Notion public de la formation**
> Référencé par : LIVE REPLAYS / 44 25 Avr. (Matteo & Nico) : Ads, Scaling & Croyances

## Contenu du document

Procédure complète pour cloner une campagne Facebook/Meta Ads d'un compte publicitaire vers un autre — même BM ou BM différent.
Pré-requis
La même Page Facebook doit être connectée aux deux comptes publicitaires (sinon les Post IDs des créas seront invalides côté destination).
Si les deux comptes sont sur des BM différents : ça marche quand même tant que la Page est partagée avec les deux comptes pub.
Étape 1 — Sélectionner la campagne dans le compte source
Va sur Ads Manager du compte publicitaire source.
Onglet Campagnes → coche la campagne à dupliquer (1 sélectionnée)
Onglet Ensembles de publicités → coche TOUS les ad sets de cette campagne
Onglet Publicités → coche TOUTES les ads de ces ad sets
 Important : les 3 niveaux doivent être sélectionnés sinon l'export sera incomplet.
Étape 2 — Exporter en XLSX
Clique sur le bouton Plus (en haut, à droite de "Aperçu")
Dans le menu, descends jusqu'à la section Importer et exporter des configurations de publicités
Survole Exporter → un sous-menu s'ouvre
Clique sur Exporter les données sélectionnées
Une fenêtre Exporter les publicités s'ouvre :
Format → laisse coché Exporter en .xlsx (par défaut)
Options → ne PAS cocher "Supprimer les colonnes vides" (le skill de nettoyage attend la structure complète)
Clique Exporter
Tu obtiens un fichier export_YYYYMMDD_HHMM.xlsx
Tu obtiens un fichier export_YYYYMMDD_HHMM.xlsx
 Ne PAS choisir Tout exporter ni Personnaliser l'exportation — il faut bien Exporter les données sélectionnées pour ne récupérer que la campagne cochée à l'étape 1.
Étape 3 — Nettoyer l'export avec Claude
L'export contient des IDs liés au compte source qui vont faire planter l'import. Il faut les vider via le skill meta-ads-export-cleaner.
Option A — Drop des fichiers (méthode rapide, sans installation)
Ouvre une nouvelle conversation Claude (Opus 4.7)
Glisse les deux fichiers dans le chat :
meta-ads-export-cleaner.zip (le skill)
export_YYYYMMDD_HHMM.xlsx (l'export Meta)
Tape simplement : "Clean cet export" (ou "nettoie l'export avec le skill")
Claude lit le skill, applique le nettoyage, et te renvoie un XLSX nettoyé à télécharger
Option B — Skill installé en permanence (plus rapide pour usage répété)
Si tu utilises souvent ce workflow, install le skill une bonne fois pour toutes dans tes Anthropic Skills. Après installation, tu glisses juste l'export et tu dis "clean cet export" — Claude déclenche le skill automatiquement.
Ce que le skill fait : vide les colonnes Ad ID, Ad Set ID, Campaign ID et Excluded Custom Audiences (les IDs source-spécifiques qui bloquent l'import). Tout le reste (créas, ciblage, budget, pixel, etc.) est conservé.
Étape 4 — Importer dans le compte destination
Bascule sur le compte publicitaire destination dans Ads Manager (sélecteur en haut à gauche)
Clique sur Plus
Dans la section Importer et exporter des configurations de publicités, clique sur Importation groupée des publicités (clic direct, pas de sous-menu — contrairement à "Exporter")
Upload le XLSX nettoyé (pas l'original)
Meta valide le fichier → clique Confirmer et importer
Étape 5 — Vérifications post-import
La campagne, les ad sets et les ads apparaissent bien dans le compte destination
Le pixel est bien sélectionné dans chaque ad set (sinon → re-attribuer manuellement)
Les créas vidéo / images s'affichent correctement (pas de "Media not available")
Recréer les audiences exclues sur le compte destination (les exclusions ont été vidées par le clean) — sinon tu vas re-cibler tes acheteurs existants
Définir le budget : Meta importe les budgets mais vérifie qu'ils sont corrects (surtout si devises différentes)
La campagne est en statut OFF par défaut → l'activer manuellement quand tout est OK
En cas d'erreur d'import
Si tu vois "L'ID X n'appartient pas à ce compte publicitaire" sur une autre colonne :
Video ID / Image Hash : la créa a été uploadée directement dans le compte source au lieu d'être publiée depuis la Page → la re-uploader depuis la Page ou utiliser la méthode Post ID
Custom Audiences : audience custom liée au compte source → relancer le clean en demandant à Claude de vider aussi cette colonne
Pixel : pas partagé avec les 2 comptes → le partager dans Business Settings (ne PAS vider la colonne)
