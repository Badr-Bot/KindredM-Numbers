# INDEX — Formation MasterEcom

Importée depuis le poste local (`D:\One piece\MasterEcom\formation-master`) le 2026-08-20.

**579 leçons** réparties en 20 modules — 527 `complet` (vidéo entière transcrite), 42 `partiel`, 10 `a-transcrire` (vides, exclues des packs).

Structure :

- `transcriptions/<module>/NN-slug.md` — le **verbatim** de chaque leçon (frontmatter YAML : module, leçon, titre, durée, statut). Timestamps au format `[MM:SS]` dans le texte.
- `notes/<module>/NN-slug.md` — la note de synthèse de la leçon (même nom de fichier).
- `dist/` — les 20 modules compactés en un fichier chacun + `00-INDEX.md` (pack GPT).
- `CATALOGUE.md` — l'état détaillé du corpus (généré). `catalogue.txt` — la liste source éditée à la main.
- `PROTOCOLE-DECISION.md` — **l'arbre de décision canonique** (testing produit · pré-scaling · scaling).
- `ARBITRAGES.md` — règles de résolution des contradictions entre leçons.
- `CONVENTIONS.md` — les règles du corpus (nommage `NN-slug.md`, statuts, provenance des blocs).
- `scripts/` — les outils de capture/transcription (Python/Node), sans clés ni secrets.

> Convention de nommage conservée : `NN-slug.md` par module (celle de `CONVENTIONS.md`, déjà utilisée par tout le corpus et ses références croisées). Aucun nom ne contenait d'espaces ni de caractères interdits. Aucun fichier `.srt`/`.vtt` : les transcriptions sont nativement en `.md` avec timestamps `[MM:SS]`.

## Non importé

| Élément | Poids | Raison |
|---------|-------|--------|
| `.skool-profile/` (10 300 fichiers) | 948 Mo | Profil navigateur Chrome complet : Login Data, cookies, tokens de session Skool → **données sensibles**, jamais versionnées |
| `.capture/` (494 fichiers) | 2 061 Mo | Audio brut `.m4a` des leçons + fichiers de travail de l'outil (logs, bases locales, `.old`). 2 fichiers > 40 Mo, ~2 Go au total ; redondant avec les transcriptions texte |
| `__pycache__/`, `*.pyc` | < 1 Mo | Artefacts Python compilés |

Ces deux dossiers restent uniquement sur le poste local (déjà couverts par le `.gitignore` du repo).

---

# Les 579 leçons par module

## 0-to-1-master-one

| # | Titre | Statut | Formats |
|---|-------|--------|---------|
| 01 | Tour du Skool | complet | [transcription](transcriptions/0-to-1-master-one/01-tour-du-skool.md) · [note](notes/0-to-1-master-one/01-tour-du-skool.md) |
| 02 | Pourquoi l'E-commerce & Dropshipping | complet | [transcription](transcriptions/0-to-1-master-one/02-pourquoi-l-e-commerce-dropshipping.md) · [note](notes/0-to-1-master-one/02-pourquoi-l-e-commerce-dropshipping.md) |
| 03 | Par où commencer ? Chemin recommandé | complet | [transcription](transcriptions/0-to-1-master-one/03-par-ou-commencer-chemin-recommande.md) · [note](notes/0-to-1-master-one/03-par-ou-commencer-chemin-recommande.md) |
| 04 | Tour du Module ONE | complet | [transcription](transcriptions/0-to-1-master-one/04-tour-du-module-one.md) · [note](notes/0-to-1-master-one/04-tour-du-module-one.md) |
| 05 | Groupe Whatsapp ONE | complet | [transcription](transcriptions/0-to-1-master-one/05-groupe-whatsapp-one.md) · [note](notes/0-to-1-master-one/05-groupe-whatsapp-one.md) |
| 06 | Le secret de la motivation | complet | [transcription](transcriptions/0-to-1-master-one/06-le-secret-de-la-motivation.md) · [note](notes/0-to-1-master-one/06-le-secret-de-la-motivation.md) |
| 07 | Le contrat qui changera ta vie | complet | [transcription](transcriptions/0-to-1-master-one/07-le-contrat-qui-changera-ta-vie.md) · [note](notes/0-to-1-master-one/07-le-contrat-qui-changera-ta-vie.md) |
| 08 | Le plan pour créer ta nouvelle vie | complet | [transcription](transcriptions/0-to-1-master-one/08-le-plan-pour-creer-ta-nouvelle-vie.md) · [note](notes/0-to-1-master-one/08-le-plan-pour-creer-ta-nouvelle-vie.md) |
| 09 | Preuve que c’est possible | complet | [transcription](transcriptions/0-to-1-master-one/09-preuve-que-c-est-possible.md) · [note](notes/0-to-1-master-one/09-preuve-que-c-est-possible.md) |
| 10 | Ton plan pour réussir | complet | [transcription](transcriptions/0-to-1-master-one/10-ton-plan-pour-reussir.md) · [note](notes/0-to-1-master-one/10-ton-plan-pour-reussir.md) |
| 11 | Règles surprenantes pour réussir sa vie | complet | [transcription](transcriptions/0-to-1-master-one/11-regles-surprenantes-pour-reussir-sa-vie.md) · [note](notes/0-to-1-master-one/11-regles-surprenantes-pour-reussir-sa-vie.md) |
| 12 | Budget, timing et focus : à quoi t’attendre | complet | [transcription](transcriptions/0-to-1-master-one/12-budget-timing-et-focus-a-quoi-t-attendre.md) · [note](notes/0-to-1-master-one/12-budget-timing-et-focus-a-quoi-t-attendre.md) |
| 13 | Pourquoi Master marche (1% du marché) | complet | [transcription](transcriptions/0-to-1-master-one/13-pourquoi-master-marche-1-du-marche.md) · [note](notes/0-to-1-master-one/13-pourquoi-master-marche-1-du-marche.md) |
| 14 | Outils IA pour aller 10x plus vite | complet | [transcription](transcriptions/0-to-1-master-one/14-outils-ia-pour-aller-10x-plus-vite.md) · [note](notes/0-to-1-master-one/14-outils-ia-pour-aller-10x-plus-vite.md) |
| 15 | Le modèle : Pain→Produit→Pub→Vente→Livraison | complet | [transcription](transcriptions/0-to-1-master-one/15-le-modele-pain-produit-pub-vente-livraison.md) · [note](notes/0-to-1-master-one/15-le-modele-pain-produit-pub-vente-livraison.md) |
| 16 | Mindset: les secrets pour une réussite MASSIVE | complet | [transcription](transcriptions/0-to-1-master-one/16-mindset-les-secrets-pour-une-reussite-massive.md) · [note](notes/0-to-1-master-one/16-mindset-les-secrets-pour-une-reussite-massive.md) |
| 17 | Contrer ce qui fait échouer/abandonner un débutant | complet | [transcription](transcriptions/0-to-1-master-one/17-contrer-ce-qui-fait-echouer-abandonner-un-debutant.md) · [note](notes/0-to-1-master-one/17-contrer-ce-qui-fait-echouer-abandonner-un-debutant.md) |
| 18 | Module organisation - A lire | partiel | [transcription](transcriptions/0-to-1-master-one/18-module-organisation-a-lire.md) · [note](notes/0-to-1-master-one/18-module-organisation-a-lire.md) |
| 19 | Comment devenir quelqu'un d'ULTRA organisé | complet | [transcription](transcriptions/0-to-1-master-one/19-comment-devenir-quelqu-un-d-ultra-organise.md) · [note](notes/0-to-1-master-one/19-comment-devenir-quelqu-un-d-ultra-organise.md) |
| 20 | Organiser ses tâches avec Asana et ClickUp | complet | [transcription](transcriptions/0-to-1-master-one/20-organiser-ses-taches-avec-asana-et-clickup.md) · [note](notes/0-to-1-master-one/20-organiser-ses-taches-avec-asana-et-clickup.md) |
| 21 | Comment créer des habitudes qui changent votre vie | complet | [transcription](transcriptions/0-to-1-master-one/21-comment-creer-des-habitudes-qui-changent-votre-vie.md) · [note](notes/0-to-1-master-one/21-comment-creer-des-habitudes-qui-changent-votre-vie.md) |
| 22 | Exercices pratiques — Affirmation audio | complet | [transcription](transcriptions/0-to-1-master-one/22-exercices-pratiques-affirmation-audio.md) · [note](notes/0-to-1-master-one/22-exercices-pratiques-affirmation-audio.md) |
| 23 | Métriques & erreurs fatales | complet | [transcription](transcriptions/0-to-1-master-one/23-metriques-erreurs-fatales.md) · [note](notes/0-to-1-master-one/23-metriques-erreurs-fatales.md) |
| 24 | Units economics / contributions Margin | complet | [transcription](transcriptions/0-to-1-master-one/24-units-economics-contributions-margin.md) · [note](notes/0-to-1-master-one/24-units-economics-contributions-margin.md) |
| 25 | Les benchmarks à viser (CVR, AOV, ROAS min) | complet | [transcription](transcriptions/0-to-1-master-one/25-les-benchmarks-a-viser-cvr-aov-roas-min.md) · [note](notes/0-to-1-master-one/25-les-benchmarks-a-viser-cvr-aov-roas-min.md) |
| 26 | Analyse de ses premiers chiffres: Quadrant Master | complet | [transcription](transcriptions/0-to-1-master-one/26-analyse-de-ses-premiers-chiffres-quadrant-master.md) · [note](notes/0-to-1-master-one/26-analyse-de-ses-premiers-chiffres-quadrant-master.md) |
| 27 | MASTER PRODUCT FORMULA™ | complet | [transcription](transcriptions/0-to-1-master-one/27-master-product-formulatm.md) · [note](notes/0-to-1-master-one/27-master-product-formulatm.md) |
| 28 | Les Désirs de Marché | partiel | [transcription](transcriptions/0-to-1-master-one/28-les-desirs-de-marche.md) · [note](notes/0-to-1-master-one/28-les-desirs-de-marche.md) |
| 29 | Les 9 critères essentiels | complet | [transcription](transcriptions/0-to-1-master-one/29-les-9-criteres-essentiels.md) · [note](notes/0-to-1-master-one/29-les-9-criteres-essentiels.md) |
| 30 | Choisir son marché | partiel | [transcription](transcriptions/0-to-1-master-one/30-choisir-son-marche.md) · [note](notes/0-to-1-master-one/30-choisir-son-marche.md) |
| 31 | Tutoriel 2026 : Recherche produit de A à Z | complet | [transcription](transcriptions/0-to-1-master-one/31-tutoriel-2026-recherche-produit-de-a-a-z.md) · [note](notes/0-to-1-master-one/31-tutoriel-2026-recherche-produit-de-a-a-z.md) |
| 32 | Impressions US: hacks récents pour pépites | complet | [transcription](transcriptions/0-to-1-master-one/32-impressions-us-hacks-recents-pour-pepites.md) · [note](notes/0-to-1-master-one/32-impressions-us-hacks-recents-pour-pepites.md) |
| 33 | Sophistication Simplifié (base à connaître) | complet | [transcription](transcriptions/0-to-1-master-one/33-sophistication-simplifie-base-a-connaitre.md) · [note](notes/0-to-1-master-one/33-sophistication-simplifie-base-a-connaitre.md) |
| 34 | Fichier d'organisation | complet | [transcription](transcriptions/0-to-1-master-one/34-fichier-d-organisation.md) · [note](notes/0-to-1-master-one/34-fichier-d-organisation.md) |
| 35 | Sourcing & première commande | complet | [transcription](transcriptions/0-to-1-master-one/35-sourcing-premiere-commande.md) · [note](notes/0-to-1-master-one/35-sourcing-premiere-commande.md) |
| 36 | Pour aller plus loin dans le détail | complet | [transcription](transcriptions/0-to-1-master-one/36-pour-aller-plus-loin-dans-le-detail.md) · [note](notes/0-to-1-master-one/36-pour-aller-plus-loin-dans-le-detail.md) |
| 37 | Logistique et fournisseurs | partiel | [transcription](transcriptions/0-to-1-master-one/37-logistique-et-fournisseurs.md) · [note](notes/0-to-1-master-one/37-logistique-et-fournisseurs.md) |
| 38 | L'importance des créatives | complet | [transcription](transcriptions/0-to-1-master-one/38-l-importance-des-creatives.md) · [note](notes/0-to-1-master-one/38-l-importance-des-creatives.md) |
| 39 | Le Parcours Psychologique des créatives Hook 1/2 | complet | [transcription](transcriptions/0-to-1-master-one/39-le-parcours-psychologique-des-creatives-hook-1-2.md) · [note](notes/0-to-1-master-one/39-le-parcours-psychologique-des-creatives-hook-1-2.md) |
| 40 | Le Parcours Psychologique des créatives 2/2 | complet | [transcription](transcriptions/0-to-1-master-one/40-le-parcours-psychologique-des-creatives-2-2.md) · [note](notes/0-to-1-master-one/40-le-parcours-psychologique-des-creatives-2-2.md) |
| 41 | Démo : créer une créative avec l’IA de A à Z | complet | [transcription](transcriptions/0-to-1-master-one/41-demo-creer-une-creative-avec-l-ia-de.md) · [note](notes/0-to-1-master-one/41-demo-creer-une-creative-avec-l-ia-de.md) |
| 42 | Créer des ads à très bas coût sans IA (~200€) | complet | [transcription](transcriptions/0-to-1-master-one/42-creer-des-ads-a-tres-bas-cout-sans.md) · [note](notes/0-to-1-master-one/42-creer-des-ads-a-tres-bas-cout-sans.md) |
| 43 | Pour aller plus loin avec l'IA .. | partiel | [transcription](transcriptions/0-to-1-master-one/43-pour-aller-plus-loin-avec-l-ia.md) · [note](notes/0-to-1-master-one/43-pour-aller-plus-loin-avec-l-ia.md) |
| 44 | Pour aller plus loin avec les créatives | partiel | [transcription](transcriptions/0-to-1-master-one/44-pour-aller-plus-loin-avec-les-creatives.md) · [note](notes/0-to-1-master-one/44-pour-aller-plus-loin-avec-les-creatives.md) |
| 45 | Checklist 2026 & CRO Tips | complet | [transcription](transcriptions/0-to-1-master-one/45-checklist-2026-cro-tips.md) · [note](notes/0-to-1-master-one/45-checklist-2026-cro-tips.md) |
| 46 | Setup Shopify pas à pas, include app | complet | [transcription](transcriptions/0-to-1-master-one/46-setup-shopify-pas-a-pas-include-app.md) · [note](notes/0-to-1-master-one/46-setup-shopify-pas-a-pas-include-app.md) |
| 47 | Thème Offert MASTER + Recommandation 2026 | complet | [transcription](transcriptions/0-to-1-master-one/47-theme-offert-master-recommandation-2026.md) · [note](notes/0-to-1-master-one/47-theme-offert-master-recommandation-2026.md) |
| 48 | Thème recommandé + Page produit pour convertir | complet | [transcription](transcriptions/0-to-1-master-one/48-theme-recommande-page-produit-pour-convertir.md) · [note](notes/0-to-1-master-one/48-theme-recommande-page-produit-pour-convertir.md) |
| 49 | Parametre Boutique, Shipping etc | complet | [transcription](transcriptions/0-to-1-master-one/49-parametre-boutique-shipping-etc.md) · [note](notes/0-to-1-master-one/49-parametre-boutique-shipping-etc.md) |
| 50 | Création offre débutant | complet | [transcription](transcriptions/0-to-1-master-one/50-creation-offre-debutant.md) · [note](notes/0-to-1-master-one/50-creation-offre-debutant.md) |
| 51 | Logo IA (Canva), Charte Couleur, Trust Badges | complet | [transcription](transcriptions/0-to-1-master-one/51-logo-ia-canva-charte-couleur-trust-badges.md) · [note](notes/0-to-1-master-one/51-logo-ia-canva-charte-couleur-trust-badges.md) |
| 52 | Créer des images produit 100% AI qui convertisse | complet | [transcription](transcriptions/0-to-1-master-one/52-creer-des-images-produit-100-ai-qui-convertisse.md) · [note](notes/0-to-1-master-one/52-creer-des-images-produit-100-ai-qui-convertisse.md) |
| 53 | Checkup Débutant: à voir avant Lancement | complet | [transcription](transcriptions/0-to-1-master-one/53-checkup-debutant-a-voir-avant-lancement.md) · [note](notes/0-to-1-master-one/53-checkup-debutant-a-voir-avant-lancement.md) |
| 54 | Copier une section d'un concurrent avec l'IA | complet | [transcription](transcriptions/0-to-1-master-one/54-copier-une-section-d-un-concurrent-avec-l.md) · [note](notes/0-to-1-master-one/54-copier-une-section-d-un-concurrent-avec-l.md) |
| 55 | Déléguer sa boutique intelligemment : wirefram | complet | [transcription](transcriptions/0-to-1-master-one/55-deleguer-sa-boutique-intelligemment-wirefram.md) · [note](notes/0-to-1-master-one/55-deleguer-sa-boutique-intelligemment-wirefram.md) |
| 56 | Optimiser votre boutique en ligne | complet | [transcription](transcriptions/0-to-1-master-one/56-optimiser-votre-boutique-en-ligne.md) · [note](notes/0-to-1-master-one/56-optimiser-votre-boutique-en-ligne.md) |
| 57 | Pour aller plus loin - CRO, BOOSTER CA & AOV | partiel | [transcription](transcriptions/0-to-1-master-one/57-pour-aller-plus-loin-cro-booster-ca-aov.md) · [note](notes/0-to-1-master-one/57-pour-aller-plus-loin-cro-booster-ca-aov.md) |
| 58 | Présentation - Compte agence partenaire | complet | [transcription](transcriptions/0-to-1-master-one/58-presentation-compte-agence-partenaire.md) · [note](notes/0-to-1-master-one/58-presentation-compte-agence-partenaire.md) |
| 59 | Meta - Setup Invincible - Prime Circle | complet | [transcription](transcriptions/0-to-1-master-one/59-meta-setup-invincible-prime-circle.md) · [note](notes/0-to-1-master-one/59-meta-setup-invincible-prime-circle.md) |
| 60 | Choix d'un anti-detect browser | complet | [transcription](transcriptions/0-to-1-master-one/60-choix-d-un-anti-detect-browser.md) · [note](notes/0-to-1-master-one/60-choix-d-un-anti-detect-browser.md) |
| 61 | SOP Profil sécurisé avec Proxy | complet | [transcription](transcriptions/0-to-1-master-one/61-sop-profil-securise-avec-proxy.md) · [note](notes/0-to-1-master-one/61-sop-profil-securise-avec-proxy.md) |
| 62 | Introduction - Meta Ads | complet | [transcription](transcriptions/0-to-1-master-one/62-introduction-meta-ads.md) · [note](notes/0-to-1-master-one/62-introduction-meta-ads.md) |
| 63 | Créer son Business Manager Meta Ads | complet | [transcription](transcriptions/0-to-1-master-one/63-creer-son-business-manager-meta-ads.md) · [note](notes/0-to-1-master-one/63-creer-son-business-manager-meta-ads.md) |
| 64 | Le compte publicitaire Meta Ads | complet | [transcription](transcriptions/0-to-1-master-one/64-le-compte-publicitaire-meta-ads.md) · [note](notes/0-to-1-master-one/64-le-compte-publicitaire-meta-ads.md) |
| 65 | Le pixel Meta | complet | [transcription](transcriptions/0-to-1-master-one/65-le-pixel-meta.md) · [note](notes/0-to-1-master-one/65-le-pixel-meta.md) |
| 66 | La page Facebook | complet | [transcription](transcriptions/0-to-1-master-one/66-la-page-facebook.md) · [note](notes/0-to-1-master-one/66-la-page-facebook.md) |
| 67 | Connectez votre Pixel Meta à Shopify | complet | [transcription](transcriptions/0-to-1-master-one/67-connectez-votre-pixel-meta-a-shopify.md) · [note](notes/0-to-1-master-one/67-connectez-votre-pixel-meta-a-shopify.md) |
| 68 | Installer WeTracked pour un suivi précis | complet | [transcription](transcriptions/0-to-1-master-one/68-installer-wetracked-pour-un-suivi-precis.md) · [note](notes/0-to-1-master-one/68-installer-wetracked-pour-un-suivi-precis.md) |
| 69 | Analyse de ses premiers chiffres : Quadrant Master | complet | [transcription](transcriptions/0-to-1-master-one/69-analyse-de-ses-premiers-chiffres-quadrant-master.md) · [note](notes/0-to-1-master-one/69-analyse-de-ses-premiers-chiffres-quadrant-master.md) |
| 70 | 🆕 Prise de décision - Du testing au scaling | complet | [transcription](transcriptions/0-to-1-master-one/70-prise-de-decision-du-testing-au-scaling.md) · [note](notes/0-to-1-master-one/70-prise-de-decision-du-testing-au-scaling.md) |
| 71 | SOP Commentaire | complet | [transcription](transcriptions/0-to-1-master-one/71-sop-commentaire.md) · [note](notes/0-to-1-master-one/71-sop-commentaire.md) |
| 72 | Recruter son premier Virtual Assistant(VA) SAV | complet | [transcription](transcriptions/0-to-1-master-one/72-recruter-son-premier-virtual-assistant-va-sav.md) · [note](notes/0-to-1-master-one/72-recruter-son-premier-virtual-assistant-va-sav.md) |
| 73 | Mettre en place un process SAV solide dès le déb | complet | [transcription](transcriptions/0-to-1-master-one/73-mettre-en-place-un-process-sav-solide-des.md) · [note](notes/0-to-1-master-one/73-mettre-en-place-un-process-sav-solide-des.md) |
| 74 | Spreadsheet Suivi Budget/Résultats | complet | [transcription](transcriptions/0-to-1-master-one/74-spreadsheet-suivi-budget-resultats.md) · [note](notes/0-to-1-master-one/74-spreadsheet-suivi-budget-resultats.md) |
| 75 | Protéger sa marque | partiel | [transcription](transcriptions/0-to-1-master-one/75-proteger-sa-marque.md) · [note](notes/0-to-1-master-one/75-proteger-sa-marque.md) |
| 76 | Top IA Productivité pour 2026 | complet | [transcription](transcriptions/0-to-1-master-one/76-top-ia-productivite-pour-2026.md) · [note](notes/0-to-1-master-one/76-top-ia-productivite-pour-2026.md) |
| 77 | Liste Fournisseurs Vérifiés | partiel | [transcription](transcriptions/0-to-1-master-one/77-liste-fournisseurs-verifies.md) · [note](notes/0-to-1-master-one/77-liste-fournisseurs-verifies.md) |
| 78 | Scripts Emails SAV De Base | partiel | [transcription](transcriptions/0-to-1-master-one/78-scripts-emails-sav-de-base.md) · [note](notes/0-to-1-master-one/78-scripts-emails-sav-de-base.md) |
| 79 | Product Radar : Comment l’Utiliser | partiel | [transcription](transcriptions/0-to-1-master-one/79-product-radar-comment-l-utiliser.md) · [note](notes/0-to-1-master-one/79-product-radar-comment-l-utiliser.md) |
| 80 | Créative Insight — Analyses De Créa Qui Cartonnent | partiel | [transcription](transcriptions/0-to-1-master-one/80-creative-insight-analyses-de-crea-qui-cartonnent.md) · [note](notes/0-to-1-master-one/80-creative-insight-analyses-de-crea-qui-cartonnent.md) |
| 81 | Live Coachings | partiel | [transcription](transcriptions/0-to-1-master-one/81-live-coachings.md) · [note](notes/0-to-1-master-one/81-live-coachings.md) |
| 82 | MASTER Chatbot | partiel | [transcription](transcriptions/0-to-1-master-one/82-master-chatbot.md) · [note](notes/0-to-1-master-one/82-master-chatbot.md) |

## aide-faq

| # | Titre | Statut | Formats |
|---|-------|--------|---------|
| 01 | Générer et personnaliser ma facture | partiel | [transcription](transcriptions/aide-faq/01-generer-et-personnaliser-ma-facture.md) · [note](notes/aide-faq/01-generer-et-personnaliser-ma-facture.md) |
| 02 | Contacter le support Skool | partiel | [transcription](transcriptions/aide-faq/02-contacter-le-support-skool.md) · [note](notes/aide-faq/02-contacter-le-support-skool.md) |
| 03 | Upgrader à l'annuel | partiel | [transcription](transcriptions/aide-faq/03-upgrader-a-l-annuel.md) · [note](notes/aide-faq/03-upgrader-a-l-annuel.md) |
| 04 | Posez votre question ici | partiel | [transcription](transcriptions/aide-faq/04-posez-votre-question-ici.md) · [note](notes/aide-faq/04-posez-votre-question-ici.md) |

## business-operations

| # | Titre | Statut | Formats |
|---|-------|--------|---------|
| 01 | L’entonnoir d’une marque qui performe | complet | [transcription](transcriptions/business-operations/01-l-entonnoir-d-une-marque-qui-performe.md) · [note](notes/business-operations/01-l-entonnoir-d-une-marque-qui-performe.md) |
| 02 | Les typologies de personnes | complet | [transcription](transcriptions/business-operations/02-les-typologies-de-personnes.md) · [note](notes/business-operations/02-les-typologies-de-personnes.md) |
| 03 | Construire la bonne équipe | complet | [transcription](transcriptions/business-operations/03-construire-la-bonne-equipe.md) · [note](notes/business-operations/03-construire-la-bonne-equipe.md) |
| 04 | Rôles, Responsabilités et KPI | complet | [transcription](transcriptions/business-operations/04-roles-responsabilites-et-kpi.md) · [note](notes/business-operations/04-roles-responsabilites-et-kpi.md) |
| 05 | Exemple Structure Équipe | complet | [transcription](transcriptions/business-operations/05-exemple-structure-equipe.md) · [note](notes/business-operations/05-exemple-structure-equipe.md) |
| 06 | Process: Explications et Gestion | complet | [transcription](transcriptions/business-operations/06-process-explications-et-gestion.md) · [note](notes/business-operations/06-process-explications-et-gestion.md) |
| 07 | Identifier et résoudre les blocages internes | complet | [transcription](transcriptions/business-operations/07-identifier-et-resoudre-les-blocages-internes.md) · [note](notes/business-operations/07-identifier-et-resoudre-les-blocages-internes.md) |
| 08 | Cadences de meeting pour une marque performante | complet | [transcription](transcriptions/business-operations/08-cadences-de-meeting-pour-une-marque-performante.md) · [note](notes/business-operations/08-cadences-de-meeting-pour-une-marque-performante.md) |
| 09 | Leadership de performance | complet | [transcription](transcriptions/business-operations/09-leadership-de-performance.md) · [note](notes/business-operations/09-leadership-de-performance.md) |
| 10 | Management pour la performance | complet | [transcription](transcriptions/business-operations/10-management-pour-la-performance.md) · [note](notes/business-operations/10-management-pour-la-performance.md) |
| 11 | Incentives et bonus | complet | [transcription](transcriptions/business-operations/11-incentives-et-bonus.md) · [note](notes/business-operations/11-incentives-et-bonus.md) |
| 12 | Les 3 piliers de la performance | complet | [transcription](transcriptions/business-operations/12-les-3-piliers-de-la-performance.md) · [note](notes/business-operations/12-les-3-piliers-de-la-performance.md) |
| 13 | Plan de Croissance | complet | [transcription](transcriptions/business-operations/13-plan-de-croissance.md) · [note](notes/business-operations/13-plan-de-croissance.md) |
| 14 | Savoir quand recruter | complet | [transcription](transcriptions/business-operations/14-savoir-quand-recruter.md) · [note](notes/business-operations/14-savoir-quand-recruter.md) |
| 15 | Quand déléguer et comment reprendre votre valeur | complet | [transcription](transcriptions/business-operations/15-quand-deleguer-et-comment-reprendre-votre-valeur.md) · [note](notes/business-operations/15-quand-deleguer-et-comment-reprendre-votre-valeur.md) |
| 16 | Comment attirer les meilleurs talents | complet | [transcription](transcriptions/business-operations/16-comment-attirer-les-meilleurs-talents.md) · [note](notes/business-operations/16-comment-attirer-les-meilleurs-talents.md) |
| 17 | Le Headhunting | complet | [transcription](transcriptions/business-operations/17-le-headhunting.md) · [note](notes/business-operations/17-le-headhunting.md) |
| 18 | SOP complet: Recrutement | complet | [transcription](transcriptions/business-operations/18-sop-complet-recrutement.md) · [note](notes/business-operations/18-sop-complet-recrutement.md) |
| 19 | Documents Bonus | complet | [transcription](transcriptions/business-operations/19-documents-bonus.md) · [note](notes/business-operations/19-documents-bonus.md) |
| 20 | Recruter VA - Tutoriel Upwork | partiel | [transcription](transcriptions/business-operations/20-recruter-va-tutoriel-upwork.md) · [note](notes/business-operations/20-recruter-va-tutoriel-upwork.md) |
| 21 | Présentation | complet | [transcription](transcriptions/business-operations/21-presentation.md) · [note](notes/business-operations/21-presentation.md) |
| 22 | Faiblesse organisationnelle | complet | [transcription](transcriptions/business-operations/22-faiblesse-organisationnelle.md) · [note](notes/business-operations/22-faiblesse-organisationnelle.md) |
| 23 | 4 KPI les plus importants | complet | [transcription](transcriptions/business-operations/23-4-kpi-les-plus-importants.md) · [note](notes/business-operations/23-4-kpi-les-plus-importants.md) |
| 24 | Recrutement | complet | [transcription](transcriptions/business-operations/24-recrutement.md) · [note](notes/business-operations/24-recrutement.md) |
| 25 | Optimisateur de routines | complet | [transcription](transcriptions/business-operations/25-optimisateur-de-routines.md) · [note](notes/business-operations/25-optimisateur-de-routines.md) |
| 26 | Mini Audit Express | complet | [transcription](transcriptions/business-operations/26-mini-audit-express.md) · [note](notes/business-operations/26-mini-audit-express.md) |
| 27 | Ce qui fait un creative strategist de haut niveau | complet | [transcription](transcriptions/business-operations/27-ce-qui-fait-un-creative-strategist-de-haut.md) · [note](notes/business-operations/27-ce-qui-fait-un-creative-strategist-de-haut.md) |
| 28 | Recruter un Creative Strategist de haut niveau | complet | [transcription](transcriptions/business-operations/28-recruter-un-creative-strategist-de-haut-niveau.md) · [note](notes/business-operations/28-recruter-un-creative-strategist-de-haut-niveau.md) |
| 29 | Guide d'évaluation · Test pratique · Processus | complet | [transcription](transcriptions/business-operations/29-guide-d-evaluation-test-pratique-processus.md) · [note](notes/business-operations/29-guide-d-evaluation-test-pratique-processus.md) |
| 30 | Intro : Adopter la posture du stratège | complet | [transcription](transcriptions/business-operations/30-intro-adopter-la-posture-du-stratege.md) · [note](notes/business-operations/30-intro-adopter-la-posture-du-stratege.md) |
| 31 | Définir une vision claire et des règles solides | complet | [transcription](transcriptions/business-operations/31-definir-une-vision-claire-et-des-regles-solides.md) · [note](notes/business-operations/31-definir-une-vision-claire-et-des-regles-solides.md) |
| 32 | Risques & sécuriser la survie du business | complet | [transcription](transcriptions/business-operations/32-risques-securiser-la-survie-du-business.md) · [note](notes/business-operations/32-risques-securiser-la-survie-du-business.md) |
| 33 | Positionnement & avantage concurrentiel | complet | [transcription](transcriptions/business-operations/33-positionnement-avantage-concurrentiel.md) · [note](notes/business-operations/33-positionnement-avantage-concurrentiel.md) |
| 34 | Business plan, Simplification & Priorisation | complet | [transcription](transcriptions/business-operations/34-business-plan-simplification-priorisation.md) · [note](notes/business-operations/34-business-plan-simplification-priorisation.md) |
| 35 | OKR & Piloter la performance | complet | [transcription](transcriptions/business-operations/35-okr-piloter-la-performance.md) · [note](notes/business-operations/35-okr-piloter-la-performance.md) |
| 36 | REPLAY : 11 Jan. (Matteo & Gabor) Vision, forecast | complet | [transcription](transcriptions/business-operations/36-replay-11-jan-matteo-gabor-vision-forecast.md) · [note](notes/business-operations/36-replay-11-jan-matteo-gabor-vision-forecast.md) |

## creative-insight

| # | Titre | Statut | Formats |
|---|-------|--------|---------|
| 01 | Opportunité Creative Insight | complet | [transcription](transcriptions/creative-insight/01-opportunite-creative-insight.md) · [note](notes/creative-insight/01-opportunite-creative-insight.md) |
| 02 | Analyse créative [exemple] | complet | [transcription](transcriptions/creative-insight/02-analyse-creative-exemple.md) · [note](notes/creative-insight/02-analyse-creative-exemple.md) |
| 03 | Ep #61 - 3 New format static à tester | complet | [transcription](transcriptions/creative-insight/03-ep-61-3-new-format-static-a-tester.md) · [note](notes/creative-insight/03-ep-61-3-new-format-static-a-tester.md) |
| 04 | Ep #62 -   Raw Talking Heads & statiques animés | complet | [transcription](transcriptions/creative-insight/04-ep-62-raw-talking-heads-statiques-animes.md) · [note](notes/creative-insight/04-ep-62-raw-talking-heads-statiques-animes.md) |
| 05 | Ep #57 - Changer la psychologie de vos ads | complet | [transcription](transcriptions/creative-insight/05-ep-57-changer-la-psychologie-de-vos-ads.md) · [note](notes/creative-insight/05-ep-57-changer-la-psychologie-de-vos-ads.md) |
| 06 | Ep #58 - Styles d'ads cartoons qui performent | complet | [transcription](transcriptions/creative-insight/06-ep-58-styles-d-ads-cartoons-qui-performent.md) · [note](notes/creative-insight/06-ep-58-styles-d-ads-cartoons-qui-performent.md) |
| 07 | Ep #59 - Débloquer de nouveaux avatars et ethnies | complet | [transcription](transcriptions/creative-insight/07-ep-59-debloquer-de-nouveaux-avatars-et-ethnies.md) · [note](notes/creative-insight/07-ep-59-debloquer-de-nouveaux-avatars-et-ethnies.md) |
| 08 | Ep #60 - Créer une musique pour vos ads | complet | [transcription](transcriptions/creative-insight/08-ep-60-creer-une-musique-pour-vos-ads.md) · [note](notes/creative-insight/08-ep-60-creer-une-musique-pour-vos-ads.md) |
| 09 | Ep #53 - Skill Native Ads Copy via Claude Code | complet | [transcription](transcriptions/creative-insight/09-ep-53-skill-native-ads-copy-via-claude.md) · [note](notes/creative-insight/09-ep-53-skill-native-ads-copy-via-claude.md) |
| 10 | Ep #54 - 4 phases, 12 questions pour vos créas | complet | [transcription](transcriptions/creative-insight/10-ep-54-4-phases-12-questions-pour-vos.md) · [note](notes/creative-insight/10-ep-54-4-phases-12-questions-pour-vos.md) |
| 11 | Ep #55 - 4 phases, 12 questions pour vos créas | complet | [transcription](transcriptions/creative-insight/11-ep-55-4-phases-12-questions-pour-vos.md) · [note](notes/creative-insight/11-ep-55-4-phases-12-questions-pour-vos.md) |
| 12 | Ep #56 - Créer des UGC IA ultra réalistes | complet | [transcription](transcriptions/creative-insight/12-ep-56-creer-des-ugc-ia-ultra-realistes.md) · [note](notes/creative-insight/12-ep-56-creer-des-ugc-ia-ultra-realistes.md) |
| 13 | Ep #48 - Différents Style & Concepts d'Ads Winner | complet | [transcription](transcriptions/creative-insight/13-ep-48-differents-style-concepts-d-ads-winner.md) · [note](notes/creative-insight/13-ep-48-differents-style-concepts-d-ads-winner.md) |
| 14 | Ep #49 - Ads Storyboard Avec Seedance 2.0 & GPT2 | complet | [transcription](transcriptions/creative-insight/14-ep-49-ads-storyboard-avec-seedance-2-0.md) · [note](notes/creative-insight/14-ep-49-ads-storyboard-avec-seedance-2-0.md) |
| 15 | Ep #50 - 'Official Apology Statement' Framework | complet | [transcription](transcriptions/creative-insight/15-ep-50-official-apology-statement-framework.md) · [note](notes/creative-insight/15-ep-50-official-apology-statement-framework.md) |
| 16 | Ep #51 - Skill AI Ads Modulable | complet | [transcription](transcriptions/creative-insight/16-ep-51-skill-ai-ads-modulable.md) · [note](notes/creative-insight/16-ep-51-skill-ai-ads-modulable.md) |
| 17 | Ep #52 - Repliquer format organic en ads | complet | [transcription](transcriptions/creative-insight/17-ep-52-repliquer-format-organic-en-ads.md) · [note](notes/creative-insight/17-ep-52-repliquer-format-organic-en-ads.md) |
| 18 | Ep #44 - Master Copy Mining | complet | [transcription](transcriptions/creative-insight/18-ep-44-master-copy-mining.md) · [note](notes/creative-insight/18-ep-44-master-copy-mining.md) |
| 19 | Ep #45 - Nouveau Hook | complet | [transcription](transcriptions/creative-insight/19-ep-45-nouveau-hook.md) · [note](notes/creative-insight/19-ep-45-nouveau-hook.md) |
| 20 | Ep #46 - ADS Cartoon IA | complet | [transcription](transcriptions/creative-insight/20-ep-46-ads-cartoon-ia.md) · [note](notes/creative-insight/20-ep-46-ads-cartoon-ia.md) |
| 21 | Ep #47 - ChatGPT Image 2 | complet | [transcription](transcriptions/creative-insight/21-ep-47-chatgpt-image-2.md) · [note](notes/creative-insight/21-ep-47-chatgpt-image-2.md) |
| 22 | Ep #40 - Stratégie des Ads Controversées | complet | [transcription](transcriptions/creative-insight/22-ep-40-strategie-des-ads-controversees.md) · [note](notes/creative-insight/22-ep-40-strategie-des-ads-controversees.md) |
| 23 | Ep #41 - Comprendre le CPMR | complet | [transcription](transcriptions/creative-insight/23-ep-41-comprendre-le-cpmr.md) · [note](notes/creative-insight/23-ep-41-comprendre-le-cpmr.md) |
| 24 | Ep #42 - 4 types de hooks psychologiques | complet | [transcription](transcriptions/creative-insight/24-ep-42-4-types-de-hooks-psychologiques.md) · [note](notes/creative-insight/24-ep-42-4-types-de-hooks-psychologiques.md) |
| 25 | Ep #43 - Native Static Ads IA Cloning | complet | [transcription](transcriptions/creative-insight/25-ep-43-native-static-ads-ia-cloning.md) · [note](notes/creative-insight/25-ep-43-native-static-ads-ia-cloning.md) |
| 26 | Ep #36 - Discredit : Stratégie de vente puissante | complet | [transcription](transcriptions/creative-insight/26-ep-36-discredit-strategie-de-vente-puissante.md) · [note](notes/creative-insight/26-ep-36-discredit-strategie-de-vente-puissante.md) |
| 27 | Ep #37 - Le pouvoir de la preuve visuelle | complet | [transcription](transcriptions/creative-insight/27-ep-37-le-pouvoir-de-la-preuve-visuelle.md) · [note](notes/creative-insight/27-ep-37-le-pouvoir-de-la-preuve-visuelle.md) |
| 28 | Ep #38 - Stratégie de marque à + de 100M$ | complet | [transcription](transcriptions/creative-insight/28-ep-38-strategie-de-marque-a-de-100m.md) · [note](notes/creative-insight/28-ep-38-strategie-de-marque-a-de-100m.md) |
| 29 | Ep #39 - Ugly Taste / Look / Live test | complet | [transcription](transcriptions/creative-insight/29-ep-39-ugly-taste-look-live-test.md) · [note](notes/creative-insight/29-ep-39-ugly-taste-look-live-test.md) |
| 30 | Ep #32 - 10 winning itérations pour une win ads | complet | [transcription](transcriptions/creative-insight/30-ep-32-10-winning-iterations-pour-une-win.md) · [note](notes/creative-insight/30-ep-32-10-winning-iterations-pour-une-win.md) |
| 31 | Ep #33 - Jeter la pierre au Vilain (Tips de film) | complet | [transcription](transcriptions/creative-insight/31-ep-33-jeter-la-pierre-au-vilain-tips.md) · [note](notes/creative-insight/31-ep-33-jeter-la-pierre-au-vilain-tips.md) |
| 32 | Ep #34 - Publicités statiques natives- (Ad Copy) | complet | [transcription](transcriptions/creative-insight/32-ep-34-publicites-statiques-natives-ad-copy.md) · [note](notes/creative-insight/32-ep-34-publicites-statiques-natives-ad-copy.md) |
| 33 | Ep #35 - Comment créer 108 ads qui convertissent | complet | [transcription](transcriptions/creative-insight/33-ep-35-comment-creer-108-ads-qui-convertissent.md) · [note](notes/creative-insight/33-ep-35-comment-creer-108-ads-qui-convertissent.md) |
| 34 | Ep #28 - Diversité dans les créatives | complet | [transcription](transcriptions/creative-insight/34-ep-28-diversite-dans-les-creatives.md) · [note](notes/creative-insight/34-ep-28-diversite-dans-les-creatives.md) |
| 35 | Ep #29 - Narrrative Ads | complet | [transcription](transcriptions/creative-insight/35-ep-29-narrrative-ads.md) · [note](notes/creative-insight/35-ep-29-narrrative-ads.md) |
| 36 | Ep #30 - Curiosité + Reverse Psychology | complet | [transcription](transcriptions/creative-insight/36-ep-30-curiosite-reverse-psychology.md) · [note](notes/creative-insight/36-ep-30-curiosite-reverse-psychology.md) |
| 37 | Ep #31 - Techniques Psychologiques Coca-Cola | complet | [transcription](transcriptions/creative-insight/37-ep-31-techniques-psychologiques-coca-cola.md) · [note](notes/creative-insight/37-ep-31-techniques-psychologiques-coca-cola.md) |
| 38 | Ep #23 - AI Review Mining Prompt | complet | [transcription](transcriptions/creative-insight/38-ep-23-ai-review-mining-prompt.md) · [note](notes/creative-insight/38-ep-23-ai-review-mining-prompt.md) |
| 39 | Ep #24 - 8 Hooks Irrésistibles - Partie 2 | complet | [transcription](transcriptions/creative-insight/39-ep-24-8-hooks-irresistibles-partie-2.md) · [note](notes/creative-insight/39-ep-24-8-hooks-irresistibles-partie-2.md) |
| 40 | Ep #25 - 2 Créas Banger avec Nico et Andréa | complet | [transcription](transcriptions/creative-insight/40-ep-25-2-creas-banger-avec-nico-et.md) · [note](notes/creative-insight/40-ep-25-2-creas-banger-avec-nico-et.md) |
| 41 | Ep #26 - Copy Meaning & TrendTrack | complet | [transcription](transcriptions/creative-insight/41-ep-26-copy-meaning-trendtrack.md) · [note](notes/creative-insight/41-ep-26-copy-meaning-trendtrack.md) |
| 42 | Ep #27 - Creative Diversification | complet | [transcription](transcriptions/creative-insight/42-ep-27-creative-diversification.md) · [note](notes/creative-insight/42-ep-27-creative-diversification.md) |
| 43 | Ep #19 - Analyse de statiques | complet | [transcription](transcriptions/creative-insight/43-ep-19-analyse-de-statiques.md) · [note](notes/creative-insight/43-ep-19-analyse-de-statiques.md) |
| 44 | Ep #20 - 5 Winning Hook Practices | complet | [transcription](transcriptions/creative-insight/44-ep-20-5-winning-hook-practices.md) · [note](notes/creative-insight/44-ep-20-5-winning-hook-practices.md) |
| 45 | Ep #21 - 8 Hooks Irrésistibles - Partie 1 | complet | [transcription](transcriptions/creative-insight/45-ep-21-8-hooks-irresistibles-partie-1.md) · [note](notes/creative-insight/45-ep-21-8-hooks-irresistibles-partie-1.md) |
| 46 | Ep #22 - Rappels Fondamentaux | complet | [transcription](transcriptions/creative-insight/46-ep-22-rappels-fondamentaux.md) · [note](notes/creative-insight/46-ep-22-rappels-fondamentaux.md) |
| 47 | Ep #16 - Comprendre le Prospect avant achat | complet | [transcription](transcriptions/creative-insight/47-ep-16-comprendre-le-prospect-avant-achat.md) · [note](notes/creative-insight/47-ep-16-comprendre-le-prospect-avant-achat.md) |
| 48 | Ep #17 - Process Duplication Winning Ads | complet | [transcription](transcriptions/creative-insight/48-ep-17-process-duplication-winning-ads.md) · [note](notes/creative-insight/48-ep-17-process-duplication-winning-ads.md) |
| 49 | Ep #18 - Loss Aversion | complet | [transcription](transcriptions/creative-insight/49-ep-18-loss-aversion.md) · [note](notes/creative-insight/49-ep-18-loss-aversion.md) |
| 50 | Ep #11 - Analyse des Ads de Temu | complet | [transcription](transcriptions/creative-insight/50-ep-11-analyse-des-ads-de-temu.md) · [note](notes/creative-insight/50-ep-11-analyse-des-ads-de-temu.md) |
| 51 | Ep #12 - Présentation + Utilisation de HiggsField | complet | [transcription](transcriptions/creative-insight/51-ep-12-presentation-utilisation-de-higgsfield.md) · [note](notes/creative-insight/51-ep-12-presentation-utilisation-de-higgsfield.md) |
| 52 | Ep #13 - Itération des Statics | complet | [transcription](transcriptions/creative-insight/52-ep-13-iteration-des-statics.md) · [note](notes/creative-insight/52-ep-13-iteration-des-statics.md) |
| 53 | Ep #14 - Les Statics Secret Sauce | complet | [transcription](transcriptions/creative-insight/53-ep-14-les-statics-secret-sauce.md) · [note](notes/creative-insight/53-ep-14-les-statics-secret-sauce.md) |
| 54 | Ep #15 - Commentaires illimités TikTok | complet | [transcription](transcriptions/creative-insight/54-ep-15-commentaires-illimites-tiktok.md) · [note](notes/creative-insight/54-ep-15-commentaires-illimites-tiktok.md) |
| 55 | Ep #8 - SOP - Avis Client pour les Ads | complet | [transcription](transcriptions/creative-insight/55-ep-8-sop-avis-client-pour-les-ads.md) · [note](notes/creative-insight/55-ep-8-sop-avis-client-pour-les-ads.md) |
| 56 | Ep #9 - Analyse Ads Flytex | complet | [transcription](transcriptions/creative-insight/56-ep-9-analyse-ads-flytex.md) · [note](notes/creative-insight/56-ep-9-analyse-ads-flytex.md) |
| 57 | Ep #10 - News Hooks qui cassent le cerveau | complet | [transcription](transcriptions/creative-insight/57-ep-10-news-hooks-qui-cassent-le-cerveau.md) · [note](notes/creative-insight/57-ep-10-news-hooks-qui-cassent-le-cerveau.md) |
| 58 | Ep #4 - Présentation + Utilisation de Mirage | complet | [transcription](transcriptions/creative-insight/58-ep-4-presentation-utilisation-de-mirage.md) · [note](notes/creative-insight/58-ep-4-presentation-utilisation-de-mirage.md) |
| 59 | Ep #5 - New Concept Ads Inspiration | complet | [transcription](transcriptions/creative-insight/59-ep-5-new-concept-ads-inspiration.md) · [note](notes/creative-insight/59-ep-5-new-concept-ads-inspiration.md) |
| 60 | Ep #6 - 10 Copywriting Tips KILLER | complet | [transcription](transcriptions/creative-insight/60-ep-6-10-copywriting-tips-killer.md) · [note](notes/creative-insight/60-ep-6-10-copywriting-tips-killer.md) |
| 61 | Ep #7 - 190 Psychological Hooks | complet | [transcription](transcriptions/creative-insight/61-ep-7-190-psychological-hooks.md) · [note](notes/creative-insight/61-ep-7-190-psychological-hooks.md) |
| 62 | Ep #1 - Arcads IA et formats qui convertissent | complet | [transcription](transcriptions/creative-insight/62-ep-1-arcads-ia-et-formats-qui-convertissent.md) · [note](notes/creative-insight/62-ep-1-arcads-ia-et-formats-qui-convertissent.md) |
| 63 | Ep #2 - Analyse de créatives winneuses | complet | [transcription](transcriptions/creative-insight/63-ep-2-analyse-de-creatives-winneuses.md) · [note](notes/creative-insight/63-ep-2-analyse-de-creatives-winneuses.md) |
| 64 | Ep #3 - Headlines qui convertissent | complet | [transcription](transcriptions/creative-insight/64-ep-3-headlines-qui-convertissent.md) · [note](notes/creative-insight/64-ep-3-headlines-qui-convertissent.md) |

## cro-booster-ca-aov

| # | Titre | Statut | Formats |
|---|-------|--------|---------|
| 01 | Présentation et Introduction CRO #1 | complet | [transcription](transcriptions/cro-booster-ca-aov/01-presentation-et-introduction-cro-1.md) · [note](notes/cro-booster-ca-aov/01-presentation-et-introduction-cro-1.md) |
| 02 | CRO : Le Meilleur Levier de Croissance #2 | complet | [transcription](transcriptions/cro-booster-ca-aov/02-cro-le-meilleur-levier-de-croissance-2.md) · [note](notes/cro-booster-ca-aov/02-cro-le-meilleur-levier-de-croissance-2.md) |
| 03 | CRO : Le Meilleur Levier de Croissance #3 | complet | [transcription](transcriptions/cro-booster-ca-aov/03-cro-le-meilleur-levier-de-croissance-3.md) · [note](notes/cro-booster-ca-aov/03-cro-le-meilleur-levier-de-croissance-3.md) |
| 04 | Process complet du CRO #1 | complet | [transcription](transcriptions/cro-booster-ca-aov/04-process-complet-du-cro-1.md) · [note](notes/cro-booster-ca-aov/04-process-complet-du-cro-1.md) |
| 05 | Process complet du CRO #2 | complet | [transcription](transcriptions/cro-booster-ca-aov/05-process-complet-du-cro-2.md) · [note](notes/cro-booster-ca-aov/05-process-complet-du-cro-2.md) |
| 06 | 2 Grandes Leçons CRO sur le Prix | complet | [transcription](transcriptions/cro-booster-ca-aov/06-2-grandes-lecons-cro-sur-le-prix.md) · [note](notes/cro-booster-ca-aov/06-2-grandes-lecons-cro-sur-le-prix.md) |
| 07 | Partage de résultats CRO | complet | [transcription](transcriptions/cro-booster-ca-aov/07-partage-de-resultats-cro.md) · [note](notes/cro-booster-ca-aov/07-partage-de-resultats-cro.md) |
| 08 | [BONUS Nico] Checklist 2026 & CRO Tips | complet | [transcription](transcriptions/cro-booster-ca-aov/08-bonus-nico-checklist-2026-cro-tips.md) · [note](notes/cro-booster-ca-aov/08-bonus-nico-checklist-2026-cro-tips.md) |

## email-messaging-marketing

| # | Titre | Statut | Formats |
|---|-------|--------|---------|
| 01 | 0.1 - Introduction | complet | [transcription](transcriptions/email-messaging-marketing/01-0-1-introduction.md) · [note](notes/email-messaging-marketing/01-0-1-introduction.md) |
| 02 | 1.1 - Vision et Approche du CRM | complet | [transcription](transcriptions/email-messaging-marketing/02-1-1-vision-et-approche-du-crm.md) · [note](notes/email-messaging-marketing/02-1-1-vision-et-approche-du-crm.md) |
| 03 | 2.1 - Setup & Templates | complet | [transcription](transcriptions/email-messaging-marketing/03-2-1-setup-templates.md) · [note](notes/email-messaging-marketing/03-2-1-setup-templates.md) |
| 04 | 2.2 - Prise en main Klaviyo | complet | [transcription](transcriptions/email-messaging-marketing/04-2-2-prise-en-main-klaviyo.md) · [note](notes/email-messaging-marketing/04-2-2-prise-en-main-klaviyo.md) |
| 05 | 2.3 - 4 Types d'Emails | complet | [transcription](transcriptions/email-messaging-marketing/05-2-3-4-types-d-emails.md) · [note](notes/email-messaging-marketing/05-2-3-4-types-d-emails.md) |
| 06 | 2.4 - Créer des Designs | complet | [transcription](transcriptions/email-messaging-marketing/06-2-4-creer-des-designs.md) · [note](notes/email-messaging-marketing/06-2-4-creer-des-designs.md) |
| 07 | Préambule Module 3 & 4 | complet | [transcription](transcriptions/email-messaging-marketing/07-preambule-module-3-4.md) · [note](notes/email-messaging-marketing/07-preambule-module-3-4.md) |
| 08 | 3.1 - Flows Pré-achat | complet | [transcription](transcriptions/email-messaging-marketing/08-3-1-flows-pre-achat.md) · [note](notes/email-messaging-marketing/08-3-1-flows-pre-achat.md) |
| 09 | 4.1 - Flows Post-achat | complet | [transcription](transcriptions/email-messaging-marketing/09-4-1-flows-post-achat.md) · [note](notes/email-messaging-marketing/09-4-1-flows-post-achat.md) |
| 10 | Préambule Module 5 | complet | [transcription](transcriptions/email-messaging-marketing/10-preambule-module-5.md) · [note](notes/email-messaging-marketing/10-preambule-module-5.md) |
| 11 | 5.1 - Les Campagnes | complet | [transcription](transcriptions/email-messaging-marketing/11-5-1-les-campagnes.md) · [note](notes/email-messaging-marketing/11-5-1-les-campagnes.md) |
| 12 | 6.1 - KPIs & Performances | complet | [transcription](transcriptions/email-messaging-marketing/12-6-1-kpis-performances.md) · [note](notes/email-messaging-marketing/12-6-1-kpis-performances.md) |
| 13 | 6.2 - Analyse d'un Compte en Live | complet | [transcription](transcriptions/email-messaging-marketing/13-6-2-analyse-d-un-compte-en-live.md) · [note](notes/email-messaging-marketing/13-6-2-analyse-d-un-compte-en-live.md) |
| 14 | SMS & WhatsApp [BONUS] | complet | [transcription](transcriptions/email-messaging-marketing/14-sms-whatsapp-bonus.md) · [note](notes/email-messaging-marketing/14-sms-whatsapp-bonus.md) |
| 15 | Intro & pourquoi WhatsApp en 2026 | complet | [transcription](transcriptions/email-messaging-marketing/15-intro-pourquoi-whatsapp-en-2026.md) · [note](notes/email-messaging-marketing/15-intro-pourquoi-whatsapp-en-2026.md) |
| 16 | Les règles Meta | complet | [transcription](transcriptions/email-messaging-marketing/16-les-regles-meta.md) · [note](notes/email-messaging-marketing/16-les-regles-meta.md) |
| 17 | Onboarding | complet | [transcription](transcriptions/email-messaging-marketing/17-onboarding.md) · [note](notes/email-messaging-marketing/17-onboarding.md) |
| 18 | Opt-in | complet | [transcription](transcriptions/email-messaging-marketing/18-opt-in.md) · [note](notes/email-messaging-marketing/18-opt-in.md) |
| 19 | Automatiser tes flows WhatsApp | complet | [transcription](transcriptions/email-messaging-marketing/19-automatiser-tes-flows-whatsapp.md) · [note](notes/email-messaging-marketing/19-automatiser-tes-flows-whatsapp.md) |
| 20 | Campagnes | complet | [transcription](transcriptions/email-messaging-marketing/20-campagnes.md) · [note](notes/email-messaging-marketing/20-campagnes.md) |
| 21 | L'IA WhatsApp | complet | [transcription](transcriptions/email-messaging-marketing/21-l-ia-whatsapp.md) · [note](notes/email-messaging-marketing/21-l-ia-whatsapp.md) |
| 22 | Compliance | complet | [transcription](transcriptions/email-messaging-marketing/22-compliance.md) · [note](notes/email-messaging-marketing/22-compliance.md) |
| 23 | Maximise tes drops produits | complet | [transcription](transcriptions/email-messaging-marketing/23-maximise-tes-drops-produits.md) · [note](notes/email-messaging-marketing/23-maximise-tes-drops-produits.md) |
| 24 | Déploie ta marque | complet | [transcription](transcriptions/email-messaging-marketing/24-deploie-ta-marque.md) · [note](notes/email-messaging-marketing/24-deploie-ta-marque.md) |
| 25 | Conclusion | complet | [transcription](transcriptions/email-messaging-marketing/25-conclusion.md) · [note](notes/email-messaging-marketing/25-conclusion.md) |
| 26 | Contacter Kanal & Offre | partiel | [transcription](transcriptions/email-messaging-marketing/26-contacter-kanal-offre.md) · [note](notes/email-messaging-marketing/26-contacter-kanal-offre.md) |

## gerer-son-sav-ia-by-onially

| # | Titre | Statut | Formats |
|---|-------|--------|---------|
| 01 | Transformer son support en centre de profits | complet | [transcription](transcriptions/gerer-son-sav-ia-by-onially/01-transformer-son-support-en-centre-de-profits.md) · [note](notes/gerer-son-sav-ia-by-onially/01-transformer-son-support-en-centre-de-profits.md) |
| 02 | Le parcours client | complet | [transcription](transcriptions/gerer-son-sav-ia-by-onially/02-le-parcours-client.md) · [note](notes/gerer-son-sav-ia-by-onially/02-le-parcours-client.md) |
| 03 | Choisir et configurer son outil de ticketing | complet | [transcription](transcriptions/gerer-son-sav-ia-by-onially/03-choisir-et-configurer-son-outil-de-ticketing.md) · [note](notes/gerer-son-sav-ia-by-onially/03-choisir-et-configurer-son-outil-de-ticketing.md) |
| 04 | Organiser ses canaux de contact | complet | [transcription](transcriptions/gerer-son-sav-ia-by-onially/04-organiser-ses-canaux-de-contact.md) · [note](notes/gerer-son-sav-ia-by-onially/04-organiser-ses-canaux-de-contact.md) |
| 05 | Demo Freshdesk | complet | [transcription](transcriptions/gerer-son-sav-ia-by-onially/05-demo-freshdesk.md) · [note](notes/gerer-son-sav-ia-by-onially/05-demo-freshdesk.md) |
| 06 | Créer ses process SAV | complet | [transcription](transcriptions/gerer-son-sav-ia-by-onially/06-creer-ses-process-sav.md) · [note](notes/gerer-son-sav-ia-by-onially/06-creer-ses-process-sav.md) |
| 07 | Créer ses templates de réponse SAV | complet | [transcription](transcriptions/gerer-son-sav-ia-by-onially/07-creer-ses-templates-de-reponse-sav.md) · [note](notes/gerer-son-sav-ia-by-onially/07-creer-ses-templates-de-reponse-sav.md) |
| 08 | Les meilleures applications de suivi colis Shopify | complet | [transcription](transcriptions/gerer-son-sav-ia-by-onially/08-les-meilleures-applications-de-suivi-colis-shopify.md) · [note](notes/gerer-son-sav-ia-by-onially/08-les-meilleures-applications-de-suivi-colis-shopify.md) |
| 09 | Gérer et réduire ses litiges & chargebacks | complet | [transcription](transcriptions/gerer-son-sav-ia-by-onially/09-gerer-et-reduire-ses-litiges-chargebacks.md) · [note](notes/gerer-son-sav-ia-by-onially/09-gerer-et-reduire-ses-litiges-chargebacks.md) |
| 10 | Contester et gagner ses chargebacks | complet | [transcription](transcriptions/gerer-son-sav-ia-by-onially/10-contester-et-gagner-ses-chargebacks.md) · [note](notes/gerer-son-sav-ia-by-onially/10-contester-et-gagner-ses-chargebacks.md) |
| 11 | Les KPIs SAV qui comptent vraiment | complet | [transcription](transcriptions/gerer-son-sav-ia-by-onially/11-les-kpis-sav-qui-comptent-vraiment.md) · [note](notes/gerer-son-sav-ia-by-onially/11-les-kpis-sav-qui-comptent-vraiment.md) |
| 12 | Optimiser son site pour réduire le SAV | complet | [transcription](transcriptions/gerer-son-sav-ia-by-onially/12-optimiser-son-site-pour-reduire-le-sav.md) · [note](notes/gerer-son-sav-ia-by-onially/12-optimiser-son-site-pour-reduire-le-sav.md) |
| 13 | Implémenter un chatbot IA | complet | [transcription](transcriptions/gerer-son-sav-ia-by-onially/13-implementer-un-chatbot-ia.md) · [note](notes/gerer-son-sav-ia-by-onially/13-implementer-un-chatbot-ia.md) |
| 14 | Récolte, gestion et analyse des avis | complet | [transcription](transcriptions/gerer-son-sav-ia-by-onially/14-recolte-gestion-et-analyse-des-avis.md) · [note](notes/gerer-son-sav-ia-by-onially/14-recolte-gestion-et-analyse-des-avis.md) |
| 15 | Connecter Claude à Shopify | complet | [transcription](transcriptions/gerer-son-sav-ia-by-onially/15-connecter-claude-a-shopify.md) · [note](notes/gerer-son-sav-ia-by-onially/15-connecter-claude-a-shopify.md) |
| 16 | Automatiser le SAV Shopify avec Claude | complet | [transcription](transcriptions/gerer-son-sav-ia-by-onially/16-automatiser-le-sav-shopify-avec-claude.md) · [note](notes/gerer-son-sav-ia-by-onially/16-automatiser-le-sav-shopify-avec-claude.md) |
| 17 | Conclusion IA | complet | [transcription](transcriptions/gerer-son-sav-ia-by-onially/17-conclusion-ia.md) · [note](notes/gerer-son-sav-ia-by-onially/17-conclusion-ia.md) |

## introduction

| # | Titre | Statut | Formats |
|---|-------|--------|---------|
| 01 | Commencez ICI [Important] | complet | [transcription](transcriptions/introduction/01-commencez-ici-important.md) · [note](notes/introduction/01-commencez-ici-important.md) |
| 02 | Présentez-vous [Important] | complet | [transcription](transcriptions/introduction/02-presentez-vous-important.md) · [note](notes/introduction/02-presentez-vous-important.md) |
| 03 | Groupe WhatsApp [Important] | complet | [transcription](transcriptions/introduction/03-groupe-whatsapp-important.md) · [note](notes/introduction/03-groupe-whatsapp-important.md) |
| 04 | Présentation du Skool MASTER | complet | [transcription](transcriptions/introduction/04-presentation-du-skool-master.md) · [note](notes/introduction/04-presentation-du-skool-master.md) |
| 05 | Nouveauté - Mars 2026 | complet | [transcription](transcriptions/introduction/05-nouveaute-mars-2026.md) · [note](notes/introduction/05-nouveaute-mars-2026.md) |
| 06 | Système de progression + nouveaux modules | complet | [transcription](transcriptions/introduction/06-systeme-de-progression-nouveaux-modules.md) · [note](notes/introduction/06-systeme-de-progression-nouveaux-modules.md) |
| 07 | Upgrade à l'Annuel | partiel | [transcription](transcriptions/introduction/07-upgrade-a-l-annuel.md) · [note](notes/introduction/07-upgrade-a-l-annuel.md) |
| 08 | Obtenir des réponses à vos questions | partiel | [transcription](transcriptions/introduction/08-obtenir-des-reponses-a-vos-questions.md) · [note](notes/introduction/08-obtenir-des-reponses-a-vos-questions.md) |
| 09 | Devenir Affilié(e) | partiel | [transcription](transcriptions/introduction/09-devenir-affilie-e.md) · [note](notes/introduction/09-devenir-affilie-e.md) |
| 10 | Information importante | partiel | [transcription](transcriptions/introduction/10-information-importante.md) · [note](notes/introduction/10-information-importante.md) |
| 11 | GPT Master | complet | [transcription](transcriptions/introduction/11-gpt-master.md) · [note](notes/introduction/11-gpt-master.md) |
| 12 | Skool accessible 24/7 | partiel | [transcription](transcriptions/introduction/12-skool-accessible-24-7.md) · [note](notes/introduction/12-skool-accessible-24-7.md) |

## legal-administratif

| # | Titre | Statut | Formats |
|---|-------|--------|---------|
| 01 | Introduction | partiel | [transcription](transcriptions/legal-administratif/01-introduction.md) · [note](notes/legal-administratif/01-introduction.md) |
| 02 | L'expatriation aux Émirats : est-ce pour vous ? | complet | [transcription](transcriptions/legal-administratif/02-l-expatriation-aux-emirats-est-ce-pour-vous.md) · [note](notes/legal-administratif/02-l-expatriation-aux-emirats-est-ce-pour-vous.md) |
| 03 | Le vrai coût de la vie | complet | [transcription](transcriptions/legal-administratif/03-le-vrai-cout-de-la-vie.md) · [note](notes/legal-administratif/03-le-vrai-cout-de-la-vie.md) |
| 04 | Lifestyle et développement aux Emirats | complet | [transcription](transcriptions/legal-administratif/04-lifestyle-et-developpement-aux-emirats.md) · [note](notes/legal-administratif/04-lifestyle-et-developpement-aux-emirats.md) |
| 05 | Avantages financiers de l’expatriation aux Émirats | complet | [transcription](transcriptions/legal-administratif/05-avantages-financiers-de-l-expatriation-aux-emirats.md) · [note](notes/legal-administratif/05-avantages-financiers-de-l-expatriation-aux-emirats.md) |
| 06 | Le processus d’expatriation | complet | [transcription](transcriptions/legal-administratif/06-le-processus-d-expatriation.md) · [note](notes/legal-administratif/06-le-processus-d-expatriation.md) |
| 07 | Notre accompagnement pour votre expatriation | complet | [transcription](transcriptions/legal-administratif/07-notre-accompagnement-pour-votre-expatriation.md) · [note](notes/legal-administratif/07-notre-accompagnement-pour-votre-expatriation.md) |
| 08 | Offre spéciale MASTER | partiel | [transcription](transcriptions/legal-administratif/08-offre-speciale-master.md) · [note](notes/legal-administratif/08-offre-speciale-master.md) |
| 09 | Notions clés et pré-requis au dépôt de sa marque | complet | [transcription](transcriptions/legal-administratif/09-notions-cles-et-pre-requis-au-depot-de.md) · [note](notes/legal-administratif/09-notions-cles-et-pre-requis-au-depot-de.md) |
| 10 | Cibler son activités et ses territoires de marché | complet | [transcription](transcriptions/legal-administratif/10-cibler-son-activites-et-ses-territoires-de-marche.md) · [note](notes/legal-administratif/10-cibler-son-activites-et-ses-territoires-de-marche.md) |
| 11 | Déposer sa marque auprès des Offices | complet | [transcription](transcriptions/legal-administratif/11-deposer-sa-marque-aupres-des-offices.md) · [note](notes/legal-administratif/11-deposer-sa-marque-aupres-des-offices.md) |
| 12 | Protéger sa marque à l'international | complet | [transcription](transcriptions/legal-administratif/12-proteger-sa-marque-a-l-international.md) · [note](notes/legal-administratif/12-proteger-sa-marque-a-l-international.md) |
| 13 | Surveiller et défendre sa marque | complet | [transcription](transcriptions/legal-administratif/13-surveiller-et-defendre-sa-marque.md) · [note](notes/legal-administratif/13-surveiller-et-defendre-sa-marque.md) |
| 14 | Valoriser sa marque | complet | [transcription](transcriptions/legal-administratif/14-valoriser-sa-marque.md) · [note](notes/legal-administratif/14-valoriser-sa-marque.md) |
| 15 | Module Complémentaire 1 : Dépôt en France | complet | [transcription](transcriptions/legal-administratif/15-module-complementaire-1-depot-en-france.md) · [note](notes/legal-administratif/15-module-complementaire-1-depot-en-france.md) |
| 16 | Module Complémentaire 2 : Dépôt à l'International | complet | [transcription](transcriptions/legal-administratif/16-module-complementaire-2-depot-a-l-international.md) · [note](notes/legal-administratif/16-module-complementaire-2-depot-a-l-international.md) |
| 17 | Liens Importants | partiel | [transcription](transcriptions/legal-administratif/17-liens-importants.md) · [note](notes/legal-administratif/17-liens-importants.md) |

## master-acquisition

| # | Titre | Statut | Formats |
|---|-------|--------|---------|
| 01 | Ce que les formateurs ne vous disent pas | complet | [transcription](transcriptions/master-acquisition/01-ce-que-les-formateurs-ne-vous-disent-pas.md) · [note](notes/master-acquisition/01-ce-que-les-formateurs-ne-vous-disent-pas.md) |
| 02 | Les différents niveaux de conscience #1 | complet | [transcription](transcriptions/master-acquisition/02-les-differents-niveaux-de-conscience-1.md) · [note](notes/master-acquisition/02-les-differents-niveaux-de-conscience-1.md) |
| 03 | Les différents niveaux de conscience #2 | complet | [transcription](transcriptions/master-acquisition/03-les-differents-niveaux-de-conscience-2.md) · [note](notes/master-acquisition/03-les-differents-niveaux-de-conscience-2.md) |
| 04 | Les différents niveaux de conscience #3 | complet | [transcription](transcriptions/master-acquisition/04-les-differents-niveaux-de-conscience-3.md) · [note](notes/master-acquisition/04-les-differents-niveaux-de-conscience-3.md) |
| 05 | Les différents niveaux de conscience #4 | complet | [transcription](transcriptions/master-acquisition/05-les-differents-niveaux-de-conscience-4.md) · [note](notes/master-acquisition/05-les-differents-niveaux-de-conscience-4.md) |
| 06 | Créer un Condor (Partie 1) | complet | [transcription](transcriptions/master-acquisition/06-creer-un-condor-partie-1.md) · [note](notes/master-acquisition/06-creer-un-condor-partie-1.md) |
| 07 | Créer un Condor (Partie 2) | complet | [transcription](transcriptions/master-acquisition/07-creer-un-condor-partie-2.md) · [note](notes/master-acquisition/07-creer-un-condor-partie-2.md) |
| 08 | Analyse Marketing | complet | [transcription](transcriptions/master-acquisition/08-analyse-marketing.md) · [note](notes/master-acquisition/08-analyse-marketing.md) |
| 09 | Scripter ses ads (Partie 1) | complet | [transcription](transcriptions/master-acquisition/09-scripter-ses-ads-partie-1.md) · [note](notes/master-acquisition/09-scripter-ses-ads-partie-1.md) |
| 10 | Scripter ses ads (Partie 2) | complet | [transcription](transcriptions/master-acquisition/10-scripter-ses-ads-partie-2.md) · [note](notes/master-acquisition/10-scripter-ses-ads-partie-2.md) |
| 11 | Scripter ses ads (Partie 3) | complet | [transcription](transcriptions/master-acquisition/11-scripter-ses-ads-partie-3.md) · [note](notes/master-acquisition/11-scripter-ses-ads-partie-3.md) |
| 12 | Production (Partie 1) | complet | [transcription](transcriptions/master-acquisition/12-production-partie-1.md) · [note](notes/master-acquisition/12-production-partie-1.md) |
| 13 | Production (Partie 2) | complet | [transcription](transcriptions/master-acquisition/13-production-partie-2.md) · [note](notes/master-acquisition/13-production-partie-2.md) |
| 14 | Sourcing (Partie 1) | complet | [transcription](transcriptions/master-acquisition/14-sourcing-partie-1.md) · [note](notes/master-acquisition/14-sourcing-partie-1.md) |
| 15 | Sourcing (Partie 2) | complet | [transcription](transcriptions/master-acquisition/15-sourcing-partie-2.md) · [note](notes/master-acquisition/15-sourcing-partie-2.md) |
| 16 | Custom GPT pour créa | complet | [transcription](transcriptions/master-acquisition/16-custom-gpt-pour-crea.md) · [note](notes/master-acquisition/16-custom-gpt-pour-crea.md) |
| 17 | [SOP] Mini-MasterClass HOOK IRRÉSISTIBLES | complet | [transcription](transcriptions/master-acquisition/17-sop-mini-masterclass-hook-irresistibles.md) · [note](notes/master-acquisition/17-sop-mini-masterclass-hook-irresistibles.md) |
| 18 | Recruter un Creative Strategist | partiel | [transcription](transcriptions/master-acquisition/18-recruter-un-creative-strategist.md) · [note](notes/master-acquisition/18-recruter-un-creative-strategist.md) |
| 19 | Introduction | complet | [transcription](transcriptions/master-acquisition/19-introduction.md) · [note](notes/master-acquisition/19-introduction.md) |
| 20 | Facebook Ads - Partie 1 : Tester & Masteriser | complet | [transcription](transcriptions/master-acquisition/20-facebook-ads-partie-1-tester-masteriser.md) · [note](notes/master-acquisition/20-facebook-ads-partie-1-tester-masteriser.md) |
| 21 | Facebook Ads - Partie 2 : Tester & Masteriser | complet | [transcription](transcriptions/master-acquisition/21-facebook-ads-partie-2-tester-masteriser.md) · [note](notes/master-acquisition/21-facebook-ads-partie-2-tester-masteriser.md) |
| 22 | Facebook Ads - Partie 3 : Tester & Masteriser | complet | [transcription](transcriptions/master-acquisition/22-facebook-ads-partie-3-tester-masteriser.md) · [note](notes/master-acquisition/22-facebook-ads-partie-3-tester-masteriser.md) |
| 23 | 🆕 Scaler en 2026 sur Meta Ads - Partie 1 | complet | [transcription](transcriptions/master-acquisition/23-scaler-en-2026-sur-meta-ads-partie-1.md) · [note](notes/master-acquisition/23-scaler-en-2026-sur-meta-ads-partie-1.md) |
| 24 | 🆕 Scaler en 2026 sur Meta Ads - Partie 2 | complet | [transcription](transcriptions/master-acquisition/24-scaler-en-2026-sur-meta-ads-partie-2.md) · [note](notes/master-acquisition/24-scaler-en-2026-sur-meta-ads-partie-2.md) |
| 25 | 🆕 0-10k Day Protocole | complet | [transcription](transcriptions/master-acquisition/25-0-10k-day-protocole.md) · [note](notes/master-acquisition/25-0-10k-day-protocole.md) |
| 26 | 🆕 10k-35k Day Protocole | complet | [transcription](transcriptions/master-acquisition/26-10k-35k-day-protocole.md) · [note](notes/master-acquisition/26-10k-35k-day-protocole.md) |
| 27 | 🆕 35k-100k Day Protocole | complet | [transcription](transcriptions/master-acquisition/27-35k-100k-day-protocole.md) · [note](notes/master-acquisition/27-35k-100k-day-protocole.md) |
| 28 | 🆕 100k-300k+ Day Protocole | complet | [transcription](transcriptions/master-acquisition/28-100k-300k-day-protocole.md) · [note](notes/master-acquisition/28-100k-300k-day-protocole.md) |
| 29 | 🆕 Maintenir un compte en bonne santé | complet | [transcription](transcriptions/master-acquisition/29-maintenir-un-compte-en-bonne-sante.md) · [note](notes/master-acquisition/29-maintenir-un-compte-en-bonne-sante.md) |
| 30 | 🆕 L'algorithme Meta, ce que personne ne te dit | complet | [transcription](transcriptions/master-acquisition/30-l-algorithme-meta-ce-que-personne-ne-te.md) · [note](notes/master-acquisition/30-l-algorithme-meta-ce-que-personne-ne-te.md) |
| 31 | 🆕 Stratégie Bid Cap Inflated - De 10 à 100K/Day | complet | [transcription](transcriptions/master-acquisition/31-strategie-bid-cap-inflated-de-10-a-100k.md) · [note](notes/master-acquisition/31-strategie-bid-cap-inflated-de-10-a-100k.md) |
| 32 | 🆕 Les erreurs fréquentes et instabilité | complet | [transcription](transcriptions/master-acquisition/32-les-erreurs-frequentes-et-instabilite.md) · [note](notes/master-acquisition/32-les-erreurs-frequentes-et-instabilite.md) |
| 33 | 🆕 Outscale ton concurrent | complet | [transcription](transcriptions/master-acquisition/33-outscale-ton-concurrent.md) · [note](notes/master-acquisition/33-outscale-ton-concurrent.md) |
| 34 | 🆕 Prise de décision - Du testing au scaling | complet | [transcription](transcriptions/master-acquisition/34-prise-de-decision-du-testing-au-scaling.md) · [note](notes/master-acquisition/34-prise-de-decision-du-testing-au-scaling.md) |
| 35 | 🆕 Le protocole de prise de décision | complet | [transcription](transcriptions/master-acquisition/35-le-protocole-de-prise-de-decision.md) · [note](notes/master-acquisition/35-le-protocole-de-prise-de-decision.md) |
| 36 | 🆕 Processus de testing | complet | [transcription](transcriptions/master-acquisition/36-processus-de-testing.md) · [note](notes/master-acquisition/36-processus-de-testing.md) |
| 37 | 🆕 Marquer et dispatcher les ads winneuses | complet | [transcription](transcriptions/master-acquisition/37-marquer-et-dispatcher-les-ads-winneuses.md) · [note](notes/master-acquisition/37-marquer-et-dispatcher-les-ads-winneuses.md) |
| 38 | 🆕 Calculer son BE ROAS | complet | [transcription](transcriptions/master-acquisition/38-calculer-son-be-roas.md) · [note](notes/master-acquisition/38-calculer-son-be-roas.md) |
| 39 | Scaler Post AndroMeda sur Meta - Playbook Complet | complet | [transcription](transcriptions/master-acquisition/39-scaler-post-andromeda-sur-meta-playbook-complet.md) · [note](notes/master-acquisition/39-scaler-post-andromeda-sur-meta-playbook-complet.md) |
| 40 | Scaler Post AndroMeda - Playbook Complet 2/4 | complet | [transcription](transcriptions/master-acquisition/40-scaler-post-andromeda-playbook-complet-2-4.md) · [note](notes/master-acquisition/40-scaler-post-andromeda-playbook-complet-2-4.md) |
| 41 | Scaler Post AndroMeda - Playbook Complet 3/4 | complet | [transcription](transcriptions/master-acquisition/41-scaler-post-andromeda-playbook-complet-3-4.md) · [note](notes/master-acquisition/41-scaler-post-andromeda-playbook-complet-3-4.md) |
| 42 | Scaler Post AndroMeda - Playbook Complet 4/4 | complet | [transcription](transcriptions/master-acquisition/42-scaler-post-andromeda-playbook-complet-4-4.md) · [note](notes/master-acquisition/42-scaler-post-andromeda-playbook-complet-4-4.md) |
| 43 | TikTok Ads - Partie 1 | complet | [transcription](transcriptions/master-acquisition/43-tiktok-ads-partie-1.md) · [note](notes/master-acquisition/43-tiktok-ads-partie-1.md) |
| 44 | TikTok Ads - Partie 2 | complet | [transcription](transcriptions/master-acquisition/44-tiktok-ads-partie-2.md) · [note](notes/master-acquisition/44-tiktok-ads-partie-2.md) |
| 45 | Introduction & Présentation | complet | [transcription](transcriptions/master-acquisition/45-introduction-presentation.md) · [note](notes/master-acquisition/45-introduction-presentation.md) |
| 46 | Google Ads Basics | complet | [transcription](transcriptions/master-acquisition/46-google-ads-basics.md) · [note](notes/master-acquisition/46-google-ads-basics.md) |
| 47 | Stratégie de Structuration Ultime en 2026 | complet | [transcription](transcriptions/master-acquisition/47-strategie-de-structuration-ultime-en-2026.md) · [note](notes/master-acquisition/47-strategie-de-structuration-ultime-en-2026.md) |
| 48 | Paramétrer votre compte | complet | [transcription](transcriptions/master-acquisition/48-parametrer-votre-compte.md) · [note](notes/master-acquisition/48-parametrer-votre-compte.md) |
| 49 | Setup d’une campagne | complet | [transcription](transcriptions/master-acquisition/49-setup-d-une-campagne.md) · [note](notes/master-acquisition/49-setup-d-une-campagne.md) |
| 50 | Les stratégies d’enchères | complet | [transcription](transcriptions/master-acquisition/50-les-strategies-d-encheres.md) · [note](notes/master-acquisition/50-les-strategies-d-encheres.md) |
| 51 | Focus : Search | complet | [transcription](transcriptions/master-acquisition/51-focus-search.md) · [note](notes/master-acquisition/51-focus-search.md) |
| 52 | Focus : PMAX & Shopping | complet | [transcription](transcriptions/master-acquisition/52-focus-pmax-shopping.md) · [note](notes/master-acquisition/52-focus-pmax-shopping.md) |
| 53 | Focus : Demand Gen | complet | [transcription](transcriptions/master-acquisition/53-focus-demand-gen.md) · [note](notes/master-acquisition/53-focus-demand-gen.md) |
| 54 | Allocation budgétaire & KPIs | complet | [transcription](transcriptions/master-acquisition/54-allocation-budgetaire-kpis.md) · [note](notes/master-acquisition/54-allocation-budgetaire-kpis.md) |
| 55 | Bonus [Slide] GMC - Éviter les bans | complet | [transcription](transcriptions/master-acquisition/55-bonus-slide-gmc-eviter-les-bans.md) · [note](notes/master-acquisition/55-bonus-slide-gmc-eviter-les-bans.md) |

## master-ia

| # | Titre | Statut | Formats |
|---|-------|--------|---------|
| 01 | Introduction | complet | [transcription](transcriptions/master-ia/01-introduction.md) · [note](notes/master-ia/01-introduction.md) |
| 02 | Créer ton projet E-commerce & Process DOC | complet | [transcription](transcriptions/master-ia/02-creer-ton-projet-e-commerce-process-doc.md) · [note](notes/master-ia/02-creer-ton-projet-e-commerce-process-doc.md) |
| 03 | Phase 0 : Les 2 Documents de Base | complet | [transcription](transcriptions/master-ia/03-phase-0-les-2-documents-de-base.md) · [note](notes/master-ia/03-phase-0-les-2-documents-de-base.md) |
| 04 | Phase 1 : La Bible Fondamentale + Verbatim | complet | [transcription](transcriptions/master-ia/04-phase-1-la-bible-fondamentale-verbatim.md) · [note](notes/master-ia/04-phase-1-la-bible-fondamentale-verbatim.md) |
| 05 | Phase 2 : Stratégie + Copywriting | complet | [transcription](transcriptions/master-ia/05-phase-2-strategie-copywriting.md) · [note](notes/master-ia/05-phase-2-strategie-copywriting.md) |
| 06 | Projet Manus + MASTER Transcripts + Livres | complet | [transcription](transcriptions/master-ia/06-projet-manus-master-transcripts-livres.md) · [note](notes/master-ia/06-projet-manus-master-transcripts-livres.md) |
| 07 | Skills + Connecteurs | complet | [transcription](transcriptions/master-ia/07-skills-connecteurs.md) · [note](notes/master-ia/07-skills-connecteurs.md) |
| 08 | Génération de Créatives Statiques | complet | [transcription](transcriptions/master-ia/08-generation-de-creatives-statiques.md) · [note](notes/master-ia/08-generation-de-creatives-statiques.md) |
| 09 | Génération de B-Rolls Vidéo IA en automatique | complet | [transcription](transcriptions/master-ia/09-generation-de-b-rolls-video-ia-en-automatique.md) · [note](notes/master-ia/09-generation-de-b-rolls-video-ia-en-automatique.md) |
| 10 | Cloner l’expertise des meilleurs experts YouTube | complet | [transcription](transcriptions/master-ia/10-cloner-l-expertise-des-meilleurs-experts-youtube.md) · [note](notes/master-ia/10-cloner-l-expertise-des-meilleurs-experts-youtube.md) |
| 11 | Agent IA MASTER | complet | [transcription](transcriptions/master-ia/11-agent-ia-master.md) · [note](notes/master-ia/11-agent-ia-master.md) |
| 12 | Intégrer data Twitter dans votre projet e-commerce | complet | [transcription](transcriptions/master-ia/12-integrer-data-twitter-dans-votre-projet-e-commerce.md) · [note](notes/master-ia/12-integrer-data-twitter-dans-votre-projet-e-commerce.md) |
| 13 | Agent Telegram | complet | [transcription](transcriptions/master-ia/13-agent-telegram.md) · [note](notes/master-ia/13-agent-telegram.md) |
| 14 | Partie 1 - Méthode Manus Création de B-roll | complet | [transcription](transcriptions/master-ia/14-partie-1-methode-manus-creation-de-b-roll.md) · [note](notes/master-ia/14-partie-1-methode-manus-creation-de-b-roll.md) |
| 15 | Partie 2 - Méthode ChatGPT Création de B-roll | complet | [transcription](transcriptions/master-ia/15-partie-2-methode-chatgpt-creation-de-b-roll.md) · [note](notes/master-ia/15-partie-2-methode-chatgpt-creation-de-b-roll.md) |
| 16 | Partie 3 - UGC IA | complet | [transcription](transcriptions/master-ia/16-partie-3-ugc-ia.md) · [note](notes/master-ia/16-partie-3-ugc-ia.md) |
| 17 | Introduction NanoBanana | complet | [transcription](transcriptions/master-ia/17-introduction-nanobanana.md) · [note](notes/master-ia/17-introduction-nanobanana.md) |
| 18 | 1 : NanoBanana - Rebranding image produit | complet | [transcription](transcriptions/master-ia/18-1-nanobanana-rebranding-image-produit.md) · [note](notes/master-ia/18-1-nanobanana-rebranding-image-produit.md) |
| 19 | 2 : N8N - Scraper les statics concurrents | complet | [transcription](transcriptions/master-ia/19-2-n8n-scraper-les-statics-concurrents.md) · [note](notes/master-ia/19-2-n8n-scraper-les-statics-concurrents.md) |
| 20 | 3 : Higgsfield + NanoBanana – Ad static illimitée | complet | [transcription](transcriptions/master-ia/20-3-higgsfield-nanobanana-ad-static-illimitee.md) · [note](notes/master-ia/20-3-higgsfield-nanobanana-ad-static-illimitee.md) |
| 21 | Mise à jour Eleven Labs V3 (new) | complet | [transcription](transcriptions/master-ia/21-mise-a-jour-eleven-labs-v3-new.md) · [note](notes/master-ia/21-mise-a-jour-eleven-labs-v3-new.md) |
| 22 | HeyGen | a-transcrire | [transcription](transcriptions/master-ia/22-heygen.md) · [note](notes/master-ia/22-heygen.md) |
| 23 | Canva IA: Branding produit avec IA 2025 | partiel | [transcription](transcriptions/master-ia/23-canva-ia-branding-produit-avec-ia-2025.md) · [note](notes/master-ia/23-canva-ia-branding-produit-avec-ia-2025.md) |
| 24 | 1 : Sora 2 – Créer un prompt puissant et réaliste | complet | [transcription](transcriptions/master-ia/24-1-sora-2-creer-un-prompt-puissant-et.md) · [note](notes/master-ia/24-1-sora-2-creer-un-prompt-puissant-et.md) |
| 25 | 2 : Kie AI & Higgsfield – Génération Content | complet | [transcription](transcriptions/master-ia/25-2-kie-ai-higgsfield-generation-content.md) · [note](notes/master-ia/25-2-kie-ai-higgsfield-generation-content.md) |
| 26 | Ep #1 - Arcads IA et formats qui convertissent | complet | [transcription](transcriptions/master-ia/26-ep-1-arcads-ia-et-formats-qui-convertissent.md) · [note](notes/master-ia/26-ep-1-arcads-ia-et-formats-qui-convertissent.md) |
| 27 | Ep #4 - Présentation + Utilisation de Mirage | complet | [transcription](transcriptions/master-ia/27-ep-4-presentation-utilisation-de-mirage.md) · [note](notes/master-ia/27-ep-4-presentation-utilisation-de-mirage.md) |
| 28 | Ep #46 - ADS Cartoon IA | complet | [transcription](transcriptions/master-ia/28-ep-46-ads-cartoon-ia.md) · [note](notes/master-ia/28-ep-46-ads-cartoon-ia.md) |
| 29 | Ep #47 - ChatGPT Image 2 | complet | [transcription](transcriptions/master-ia/29-ep-47-chatgpt-image-2.md) · [note](notes/master-ia/29-ep-47-chatgpt-image-2.md) |
| 30 | Ep #49 - Ads Storyboard Avec Seedance 2.0 & GPT2 | complet | [transcription](transcriptions/master-ia/30-ep-49-ads-storyboard-avec-seedance-2-0.md) · [note](notes/master-ia/30-ep-49-ads-storyboard-avec-seedance-2-0.md) |
| 31 | Ep #51 - Skill AI Ads Modulable | complet | [transcription](transcriptions/master-ia/31-ep-51-skill-ai-ads-modulable.md) · [note](notes/master-ia/31-ep-51-skill-ai-ads-modulable.md) |
| 32 | Ep #53 - Skill Native Ads Copy via Claude Code | complet | [transcription](transcriptions/master-ia/32-ep-53-skill-native-ads-copy-via-claude.md) · [note](notes/master-ia/32-ep-53-skill-native-ads-copy-via-claude.md) |
| 33 | Ep #56 - Créer des UGC IA ultra réalistes | complet | [transcription](transcriptions/master-ia/33-ep-56-creer-des-ugc-ia-ultra-realistes.md) · [note](notes/master-ia/33-ep-56-creer-des-ugc-ia-ultra-realistes.md) |
| 34 | Ep #58 - Styles d'ads cartoons qui performent | complet | [transcription](transcriptions/master-ia/34-ep-58-styles-d-ads-cartoons-qui-performent.md) · [note](notes/master-ia/34-ep-58-styles-d-ads-cartoons-qui-performent.md) |
| 35 | Ep #60 - Créer une musique pour vos ads | complet | [transcription](transcriptions/master-ia/35-ep-60-creer-une-musique-pour-vos-ads.md) · [note](notes/master-ia/35-ep-60-creer-une-musique-pour-vos-ads.md) |
| 36 | Ep #62 -   Raw Talking Heads & statiques animés | complet | [transcription](transcriptions/master-ia/36-ep-62-raw-talking-heads-statiques-animes.md) · [note](notes/master-ia/36-ep-62-raw-talking-heads-statiques-animes.md) |
| 37 | Être cité par les IA : la stratégie Glide | complet | [transcription](transcriptions/master-ia/37-etre-cite-par-les-ia-la-strategie-glide.md) · [note](notes/master-ia/37-etre-cite-par-les-ia-la-strategie-glide.md) |
| 38 | Glide : Offre & Contact | partiel | [transcription](transcriptions/master-ia/38-glide-offre-contact.md) · [note](notes/master-ia/38-glide-offre-contact.md) |

## master-insider

| # | Titre | Statut | Formats |
|---|-------|--------|---------|
| 01 | Préambule - IMPORTANT | complet | [transcription](transcriptions/master-insider/01-preambule-important.md) · [note](notes/master-insider/01-preambule-important.md) |
| 02 | Agents recommandés - Important | complet | [transcription](transcriptions/master-insider/02-agents-recommandes-important.md) · [note](notes/master-insider/02-agents-recommandes-important.md) |
| 03 | Présentation Agent Français | complet | [transcription](transcriptions/master-insider/03-presentation-agent-francais.md) · [note](notes/master-insider/03-presentation-agent-francais.md) |
| 04 | Case Study: Agent A-Z | complet | [transcription](transcriptions/master-insider/04-case-study-agent-a-z.md) · [note](notes/master-insider/04-case-study-agent-a-z.md) |
| 05 | Incard | complet | [transcription](transcriptions/master-insider/05-incard.md) · [note](notes/master-insider/05-incard.md) |
| 06 | Slash | complet | [transcription](transcriptions/master-insider/06-slash.md) · [note](notes/master-insider/06-slash.md) |
| 07 | Insider Revolut | complet | [transcription](transcriptions/master-insider/07-insider-revolut.md) · [note](notes/master-insider/07-insider-revolut.md) |
| 08 | Obtenir une AMEX Gold US | complet | [transcription](transcriptions/master-insider/08-obtenir-une-amex-gold-us.md) · [note](notes/master-insider/08-obtenir-une-amex-gold-us.md) |
| 09 | ⌛ Chase \| Relay \| Ocean Bank \| Airwallex | a-transcrire | [transcription](transcriptions/master-insider/09-chase-relay-ocean-bank-airwallex.md) · [note](notes/master-insider/09-chase-relay-ocean-bank-airwallex.md) |
| 10 | Choix d'un anti-detect browser | complet | [transcription](transcriptions/master-insider/10-choix-d-un-anti-detect-browser.md) · [note](notes/master-insider/10-choix-d-un-anti-detect-browser.md) |
| 11 | SOP - Ajout de Commentaires + Intéractions | complet | [transcription](transcriptions/master-insider/11-sop-ajout-de-commentaires-interactions.md) · [note](notes/master-insider/11-sop-ajout-de-commentaires-interactions.md) |
| 12 | Setup profil : setup Meta | complet | [transcription](transcriptions/master-insider/12-setup-profil-setup-meta.md) · [note](notes/master-insider/12-setup-profil-setup-meta.md) |
| 13 | Compte agence Meta | complet | [transcription](transcriptions/master-insider/13-compte-agence-meta.md) · [note](notes/master-insider/13-compte-agence-meta.md) |
| 14 | SOP Profil sécurisé avec Proxy | complet | [transcription](transcriptions/master-insider/14-sop-profil-securise-avec-proxy.md) · [note](notes/master-insider/14-sop-profil-securise-avec-proxy.md) |
| 15 | Setup TikTok | complet | [transcription](transcriptions/master-insider/15-setup-tiktok.md) · [note](notes/master-insider/15-setup-tiktok.md) |
| 16 | Setup Snapchat | partiel | [transcription](transcriptions/master-insider/16-setup-snapchat.md) · [note](notes/master-insider/16-setup-snapchat.md) |
| 17 | Meta Spy | complet | [transcription](transcriptions/master-insider/17-meta-spy.md) · [note](notes/master-insider/17-meta-spy.md) |
| 18 | Unban & Ad Approval | complet | [transcription](transcriptions/master-insider/18-unban-ad-approval.md) · [note](notes/master-insider/18-unban-ad-approval.md) |
| 19 | Shadowban | complet | [transcription](transcriptions/master-insider/19-shadowban.md) · [note](notes/master-insider/19-shadowban.md) |
| 20 | Google Spy | complet | [transcription](transcriptions/master-insider/20-google-spy.md) · [note](notes/master-insider/20-google-spy.md) |
| 21 | Shopify Spy | complet | [transcription](transcriptions/master-insider/21-shopify-spy.md) · [note](notes/master-insider/21-shopify-spy.md) |
| 22 | Paiement Processeur | complet | [transcription](transcriptions/master-insider/22-paiement-processeur.md) · [note](notes/master-insider/22-paiement-processeur.md) |
| 23 | DMCA Shopify + META Takedown, Protéger son contenu | complet | [transcription](transcriptions/master-insider/23-dmca-shopify-meta-takedown-proteger-son-contenu.md) · [note](notes/master-insider/23-dmca-shopify-meta-takedown-proteger-son-contenu.md) |
| 24 | Shutdown un concurrent | complet | [transcription](transcriptions/master-insider/24-shutdown-un-concurrent.md) · [note](notes/master-insider/24-shutdown-un-concurrent.md) |
| 25 | Setup HK | complet | [transcription](transcriptions/master-insider/25-setup-hk.md) · [note](notes/master-insider/25-setup-hk.md) |
| 26 | Setup US | complet | [transcription](transcriptions/master-insider/26-setup-us.md) · [note](notes/master-insider/26-setup-us.md) |
| 27 | Code ITIN | complet | [transcription](transcriptions/master-insider/27-code-itin.md) · [note](notes/master-insider/27-code-itin.md) |
| 28 | Setup UK | complet | [transcription](transcriptions/master-insider/28-setup-uk.md) · [note](notes/master-insider/28-setup-uk.md) |
| 29 | Choix setup : Guide débutant | complet | [transcription](transcriptions/master-insider/29-choix-setup-guide-debutant.md) · [note](notes/master-insider/29-choix-setup-guide-debutant.md) |
| 30 | ⌛ CGV, droits consommateurs | a-transcrire | [transcription](transcriptions/master-insider/30-cgv-droits-consommateurs.md) · [note](notes/master-insider/30-cgv-droits-consommateurs.md) |
| 31 | ⌛ Protéger sa marque & ses produits | a-transcrire | [transcription](transcriptions/master-insider/31-proteger-sa-marque-ses-produits.md) · [note](notes/master-insider/31-proteger-sa-marque-ses-produits.md) |
| 32 | ⌛ PSP & gestion des litiges | a-transcrire | [transcription](transcriptions/master-insider/32-psp-gestion-des-litiges.md) · [note](notes/master-insider/32-psp-gestion-des-litiges.md) |
| 33 | ⌛ Gestion des comptes publicitaires | a-transcrire | [transcription](transcriptions/master-insider/33-gestion-des-comptes-publicitaires.md) · [note](notes/master-insider/33-gestion-des-comptes-publicitaires.md) |

## master-research

| # | Titre | Statut | Formats |
|---|-------|--------|---------|
| 01 | MASTER RESEARCH | partiel | [transcription](transcriptions/master-research/01-master-research.md) · [note](notes/master-research/01-master-research.md) |
| 02 | MASTER PRODUCT FORMULA™ | complet | [transcription](transcriptions/master-research/02-master-product-formulatm.md) · [note](notes/master-research/02-master-product-formulatm.md) |
| 03 | Marché: Retour d'expérience COMPLET | complet | [transcription](transcriptions/master-research/03-marche-retour-d-experience-complet.md) · [note](notes/master-research/03-marche-retour-d-experience-complet.md) |
| 04 | Ecom Data 1 | complet | [transcription](transcriptions/master-research/04-ecom-data-1.md) · [note](notes/master-research/04-ecom-data-1.md) |
| 05 | Ecom Data 2 | complet | [transcription](transcriptions/master-research/05-ecom-data-2.md) · [note](notes/master-research/05-ecom-data-2.md) |
| 06 | Quel type de recherche produit ? | complet | [transcription](transcriptions/master-research/06-quel-type-de-recherche-produit.md) · [note](notes/master-research/06-quel-type-de-recherche-produit.md) |
| 07 | Mes conseils sans filtre pour PRINT | complet | [transcription](transcriptions/master-research/07-mes-conseils-sans-filtre-pour-print.md) · [note](notes/master-research/07-mes-conseils-sans-filtre-pour-print.md) |
| 08 | L'opportunité PRODUCT RADAR | complet | [transcription](transcriptions/master-research/08-l-opportunite-product-radar.md) · [note](notes/master-research/08-l-opportunite-product-radar.md) |
| 09 | Critères Produit | complet | [transcription](transcriptions/master-research/09-criteres-produit.md) · [note](notes/master-research/09-criteres-produit.md) |
| 10 | Fichier d'organisation | complet | [transcription](transcriptions/master-research/10-fichier-d-organisation.md) · [note](notes/master-research/10-fichier-d-organisation.md) |
| 11 | Méthodes et outils utilisé | complet | [transcription](transcriptions/master-research/11-methodes-et-outils-utilise.md) · [note](notes/master-research/11-methodes-et-outils-utilise.md) |
| 12 | Facebook Ads Library | a-transcrire | [transcription](transcriptions/master-research/12-facebook-ads-library.md) · [note](notes/master-research/12-facebook-ads-library.md) |
| 13 | Afterlib | complet | [transcription](transcriptions/master-research/13-afterlib.md) · [note](notes/master-research/13-afterlib.md) |
| 14 | Tiktok Creative Center (new) | complet | [transcription](transcriptions/master-research/14-tiktok-creative-center-new.md) · [note](notes/master-research/14-tiktok-creative-center-new.md) |
| 15 | Fastmoss (Tiktok Shop) | complet | [transcription](transcriptions/master-research/15-fastmoss-tiktok-shop.md) · [note](notes/master-research/15-fastmoss-tiktok-shop.md) |
| 16 | PPSPY | complet | [transcription](transcriptions/master-research/16-ppspy.md) · [note](notes/master-research/16-ppspy.md) |
| 17 | PiPiAds | complet | [transcription](transcriptions/master-research/17-pipiads.md) · [note](notes/master-research/17-pipiads.md) |
| 18 | Recherche produit Google Analytics (nouveau 2025) | complet | [transcription](transcriptions/master-research/18-recherche-produit-google-analytics-nouveau-2025.md) · [note](notes/master-research/18-recherche-produit-google-analytics-nouveau-2025.md) |
| 19 | Méthodes et outils: concurrence & analyse | complet | [transcription](transcriptions/master-research/19-methodes-et-outils-concurrence-analyse.md) · [note](notes/master-research/19-methodes-et-outils-concurrence-analyse.md) |
| 20 | Choisir le bon marché | a-transcrire | [transcription](transcriptions/master-research/20-choisir-le-bon-marche.md) · [note](notes/master-research/20-choisir-le-bon-marche.md) |

## membres-plus

| # | Titre | Statut | Formats |
|---|-------|--------|---------|
| 01 | 17 Mar. (Thomas) : Puzzle, Publicité & Stratégie | complet | [transcription](transcriptions/membres-plus/01-17-mar-thomas-puzzle-publicite-strategie.md) · [note](notes/membres-plus/01-17-mar-thomas-puzzle-publicite-strategie.md) |
| 02 | 14 Avr. (Thomas) : Publicité, Scaling & Entraide | complet | [transcription](transcriptions/membres-plus/02-14-avr-thomas-publicite-scaling-entraide.md) · [note](notes/membres-plus/02-14-avr-thomas-publicite-scaling-entraide.md) |
| 03 | 12 Mai. (Thomas) : Strat, Growth & Automatisation | complet | [transcription](transcriptions/membres-plus/03-12-mai-thomas-strat-growth-automatisation.md) · [note](notes/membres-plus/03-12-mai-thomas-strat-growth-automatisation.md) |
| 04 | 10 Jui. (Thomas) : Stratégie, Créativité & Growth | complet | [transcription](transcriptions/membres-plus/04-10-jui-thomas-strategie-creativite-growth.md) · [note](notes/membres-plus/04-10-jui-thomas-strategie-creativite-growth.md) |
| 05 | 14 Jui. (Thomas) : Taxe, Marge & Agents | complet | [transcription](transcriptions/membres-plus/05-14-jui-thomas-taxe-marge-agents.md) · [note](notes/membres-plus/05-14-jui-thomas-taxe-marge-agents.md) |
| 06 | 11 Aou. (Thomas) : Ads, Croissance & Mentalité | complet | [transcription](transcriptions/membres-plus/06-11-aou-thomas-ads-croissance-mentalite.md) · [note](notes/membres-plus/06-11-aou-thomas-ads-croissance-mentalite.md) |

## mindset-os

| # | Titre | Statut | Formats |
|---|-------|--------|---------|
| 01 | Comment se fixer un objectif et l'atteindre | complet | [transcription](transcriptions/mindset-os/01-comment-se-fixer-un-objectif-et-l-atteindre.md) · [note](notes/mindset-os/01-comment-se-fixer-un-objectif-et-l-atteindre.md) |
| 02 | Comment s'organiser efficacement (Partie 1) | complet | [transcription](transcriptions/mindset-os/02-comment-s-organiser-efficacement-partie-1.md) · [note](notes/mindset-os/02-comment-s-organiser-efficacement-partie-1.md) |
| 03 | Comment s'organiser efficacement (Partie 2) | complet | [transcription](transcriptions/mindset-os/03-comment-s-organiser-efficacement-partie-2.md) · [note](notes/mindset-os/03-comment-s-organiser-efficacement-partie-2.md) |
| 04 | 0 notification | complet | [transcription](transcriptions/mindset-os/04-0-notification.md) · [note](notes/mindset-os/04-0-notification.md) |
| 05 | Atteindre n'importe quel objectif (Partie 1) | complet | [transcription](transcriptions/mindset-os/05-atteindre-n-importe-quel-objectif-partie-1.md) · [note](notes/mindset-os/05-atteindre-n-importe-quel-objectif-partie-1.md) |
| 06 | Atteindre n'importe quel objectif (Partie 2) | complet | [transcription](transcriptions/mindset-os/06-atteindre-n-importe-quel-objectif-partie-2.md) · [note](notes/mindset-os/06-atteindre-n-importe-quel-objectif-partie-2.md) |
| 07 | Atteindre n'importe quel objectif (Partie 3) | complet | [transcription](transcriptions/mindset-os/07-atteindre-n-importe-quel-objectif-partie-3.md) · [note](notes/mindset-os/07-atteindre-n-importe-quel-objectif-partie-3.md) |
| 08 | Exercices pratiques (Affirmation audio) | complet | [transcription](transcriptions/mindset-os/08-exercices-pratiques-affirmation-audio.md) · [note](notes/mindset-os/08-exercices-pratiques-affirmation-audio.md) |
| 09 | Hack GPT - Learning Playbook Infini | complet | [transcription](transcriptions/mindset-os/09-hack-gpt-learning-playbook-infini.md) · [note](notes/mindset-os/09-hack-gpt-learning-playbook-infini.md) |
| 10 | ⌛ Reprogrammer son cerveau à la richesse | a-transcrire | [transcription](transcriptions/mindset-os/10-reprogrammer-son-cerveau-a-la-richesse.md) · [note](notes/mindset-os/10-reprogrammer-son-cerveau-a-la-richesse.md) |
| 11 | ⌛ Bases état d’esprit, pièges à éviter | a-transcrire | [transcription](transcriptions/mindset-os/11-bases-etat-d-esprit-pieges-a-eviter.md) · [note](notes/mindset-os/11-bases-etat-d-esprit-pieges-a-eviter.md) |
| 12 | Comment devenir quelqu'un d'ULTRA organisé | complet | [transcription](transcriptions/mindset-os/12-comment-devenir-quelqu-un-d-ultra-organise.md) · [note](notes/mindset-os/12-comment-devenir-quelqu-un-d-ultra-organise.md) |
| 13 | Organiser ses tâches avec Asana et ClickUp | complet | [transcription](transcriptions/mindset-os/13-organiser-ses-taches-avec-asana-et-clickup.md) · [note](notes/mindset-os/13-organiser-ses-taches-avec-asana-et-clickup.md) |
| 14 | Comment créer des habitudes qui changent votre vie | complet | [transcription](transcriptions/mindset-os/14-comment-creer-des-habitudes-qui-changent-votre-vie.md) · [note](notes/mindset-os/14-comment-creer-des-habitudes-qui-changent-votre-vie.md) |
| 15 | Organisation d'un business €1M+ par mois | complet | [transcription](transcriptions/mindset-os/15-organisation-d-un-business-1m-par-mois.md) · [note](notes/mindset-os/15-organisation-d-un-business-1m-par-mois.md) |

## product-radar

| # | Titre | Statut | Formats |
|---|-------|--------|---------|
| 01 | Opportunité Product Radar | partiel | [transcription](transcriptions/product-radar/01-opportunite-product-radar.md) · [note](notes/product-radar/01-opportunite-product-radar.md) |

## quick-wins

| # | Titre | Statut | Formats |
|---|-------|--------|---------|
| 01 | Evitez la Shopify Tax | complet | [transcription](transcriptions/quick-wins/01-evitez-la-shopify-tax.md) · [note](notes/quick-wins/01-evitez-la-shopify-tax.md) |
| 02 | Fashion Cashflow TikTok Ads SOP | complet | [transcription](transcriptions/quick-wins/02-fashion-cashflow-tiktok-ads-sop.md) · [note](notes/quick-wins/02-fashion-cashflow-tiktok-ads-sop.md) |
| 03 | GigaBrain UPDATE: Reddit Answers | complet | [transcription](transcriptions/quick-wins/03-gigabrain-update-reddit-answers.md) · [note](notes/quick-wins/03-gigabrain-update-reddit-answers.md) |
| 04 | Custom GPT pour créa | complet | [transcription](transcriptions/quick-wins/04-custom-gpt-pour-crea.md) · [note](notes/quick-wins/04-custom-gpt-pour-crea.md) |
| 05 | Hack GPT - Learning Playbook Infini | complet | [transcription](transcriptions/quick-wins/05-hack-gpt-learning-playbook-infini.md) · [note](notes/quick-wins/05-hack-gpt-learning-playbook-infini.md) |
| 06 | Meilleur prompt: résumer livre, vidéos, podcast.. | partiel | [transcription](transcriptions/quick-wins/06-meilleur-prompt-resumer-livre-videos-podcast.md) · [note](notes/quick-wins/06-meilleur-prompt-resumer-livre-videos-podcast.md) |
| 07 | Créatives calculateur | complet | [transcription](transcriptions/quick-wins/07-creatives-calculateur.md) · [note](notes/quick-wins/07-creatives-calculateur.md) |
| 08 | Warmap | complet | [transcription](transcriptions/quick-wins/08-warmap.md) · [note](notes/quick-wins/08-warmap.md) |
| 09 | Setup productif | complet | [transcription](transcriptions/quick-wins/09-setup-productif.md) · [note](notes/quick-wins/09-setup-productif.md) |
| 10 | Dropmagic | complet | [transcription](transcriptions/quick-wins/10-dropmagic.md) · [note](notes/quick-wins/10-dropmagic.md) |
| 11 | Conseils Sport / Santé | complet | [transcription](transcriptions/quick-wins/11-conseils-sport-sante.md) · [note](notes/quick-wins/11-conseils-sport-sante.md) |
| 12 | Doc épisodes MASTER | partiel | [transcription](transcriptions/quick-wins/12-doc-episodes-master.md) · [note](notes/quick-wins/12-doc-episodes-master.md) |
| 13 | QUICK WINS - MARS 2026 | partiel | [transcription](transcriptions/quick-wins/13-quick-wins-mars-2026.md) · [note](notes/quick-wins/13-quick-wins-mars-2026.md) |
| 14 | QUICK WINS - AVRIL 2026 | partiel | [transcription](transcriptions/quick-wins/14-quick-wins-avril-2026.md) · [note](notes/quick-wins/14-quick-wins-avril-2026.md) |
| 15 | QUICK WINS - MAI 2026 | partiel | [transcription](transcriptions/quick-wins/15-quick-wins-mai-2026.md) · [note](notes/quick-wins/15-quick-wins-mai-2026.md) |
| 16 | QUICK WINS - JUIN 2026 | partiel | [transcription](transcriptions/quick-wins/16-quick-wins-juin-2026.md) · [note](notes/quick-wins/16-quick-wins-juin-2026.md) |
| 17 | QUICK WINS - JUILLET 2026 | partiel | [transcription](transcriptions/quick-wins/17-quick-wins-juillet-2026.md) · [note](notes/quick-wins/17-quick-wins-juillet-2026.md) |
| 18 | QUICK WINS - AOÛT 2026 | partiel | [transcription](transcriptions/quick-wins/18-quick-wins-aout-2026.md) · [note](notes/quick-wins/18-quick-wins-aout-2026.md) |

## ressources-google

| # | Titre | Statut | Formats |
|---|-------|--------|---------|
| 01 | Ma nouvelle vie - template | complet | [transcription](transcriptions/ressources-google/01-ma-nouvelle-vie-template.md) |
| 02 | DOC - L'importance de l'IA | complet | [transcription](transcriptions/ressources-google/02-doc-l-importance-de-l-ia.md) |
| 03 | Quadrants MASTER Marketing | complet | [transcription](transcriptions/ressources-google/03-quadrants-master-marketing.md) |
| 04 | Market & Product Formula | complet | [transcription](transcriptions/ressources-google/04-market-product-formula.md) |
| 05 | 33 Sophistication Simplifié (base à connaître) (Doc video) | complet | [transcription](transcriptions/ressources-google/05-33-sophistication-simplifie-base-a-connaitre-doc-video.md) |
| 06 | Fichier d'organisation | complet | [transcription](transcriptions/ressources-google/06-fichier-d-organisation.md) |
| 07 | Prompt Universel - Manus | complet | [transcription](transcriptions/ressources-google/07-prompt-universel-manus.md) |
| 08 | Prompt Universel - Chatgpt | complet | [transcription](transcriptions/ressources-google/08-prompt-universel-chatgpt.md) |
| 09 | Prompt logo + charte graphique | complet | [transcription](transcriptions/ressources-google/09-prompt-logo-charte-graphique.md) |
| 10 | Prompt image produit | complet | [transcription](transcriptions/ressources-google/10-prompt-image-produit.md) |
| 11 | Tableau Profit & Loss | complet | [transcription](transcriptions/ressources-google/11-tableau-profit-loss.md) |
| 12 | Tracking List | complet | [transcription](transcriptions/ressources-google/12-tracking-list.md) |
| 13 | Doc de la vidéo | complet | [transcription](transcriptions/ressources-google/13-doc-de-la-video.md) |
| 14 | 17 [SOP] Mini-MasterClass HOOK IRRÉSISTIBLES (Document) | complet | [transcription](transcriptions/ressources-google/14-17-sop-mini-masterclass-hook-irresistibles-document.md) |
| 15 | DOCUMENT - META PROCESS | complet | [transcription](transcriptions/ressources-google/15-document-meta-process.md) |
| 16 | DOCUMENT - TIKTOK PROCESS | complet | [transcription](transcriptions/ressources-google/16-document-tiktok-process.md) |
| 17 | Scripts VSL - Exemple 1 | complet | [transcription](transcriptions/ressources-google/17-scripts-vsl-exemple-1.md) |
| 18 | Scripts VSL - Exemple 2 | complet | [transcription](transcriptions/ressources-google/18-scripts-vsl-exemple-2.md) |
| 19 | Scripts VSL - Exemple 3 | complet | [transcription](transcriptions/ressources-google/19-scripts-vsl-exemple-3.md) |
| 20 | Tableau P&L | complet | [transcription](transcriptions/ressources-google/20-tableau-p-l.md) |
| 21 | Théorie | complet | [transcription](transcriptions/ressources-google/21-theorie.md) |
| 22 | Diversity Map | complet | [transcription](transcriptions/ressources-google/22-diversity-map.md) |
| 23 | Lien du Template forecast | complet | [transcription](transcriptions/ressources-google/23-lien-du-template-forecast.md) |
| 24 | Template G-Sheet EMF Media | complet | [transcription](transcriptions/ressources-google/24-template-g-sheet-emf-media.md) |
| 25 | Template G-Docs EMF Media | complet | [transcription](transcriptions/ressources-google/25-template-g-docs-emf-media.md) |
| 26 | Créatives des Brands | complet | [transcription](transcriptions/ressources-google/26-creatives-des-brands.md) |
| 27 | Document Live | complet | [transcription](transcriptions/ressources-google/27-document-live.md) |
| 28 | Upsell Template | complet | [transcription](transcriptions/ressources-google/28-upsell-template.md) |
| 29 | Document Fashion TikTok Ads SOP | complet | [transcription](transcriptions/ressources-google/29-document-fashion-tiktok-ads-sop.md) |
| 30 | 07 Créatives calculateur (Document) | complet | [transcription](transcriptions/ressources-google/30-07-creatives-calculateur-document.md) |
| 31 | Warmap | complet | [transcription](transcriptions/ressources-google/31-warmap.md) |
| 32 | Trackeur de la journée | complet | [transcription](transcriptions/ressources-google/32-trackeur-de-la-journee.md) |
| 33 | Lien des ads | complet | [transcription](transcriptions/ressources-google/33-lien-des-ads.md) |
| 34 | Marques mentionnées | complet | [transcription](transcriptions/ressources-google/34-marques-mentionnees.md) |
| 35 | Process Duplication Winning Ads | complet | [transcription](transcriptions/ressources-google/35-process-duplication-winning-ads.md) |
| 36 | Tableau de suivi des litiges | complet | [transcription](transcriptions/ressources-google/36-tableau-de-suivi-des-litiges.md) |
| 37 | Tableau de suivi des KPIs mensuels | complet | [transcription](transcriptions/ressources-google/37-tableau-de-suivi-des-kpis-mensuels.md) |
| 38 | 01 L’entonnoir d’une marque qui performe (Document) | complet | [transcription](transcriptions/ressources-google/38-01-l-entonnoir-d-une-marque-qui-performe.md) |
| 39 | 02 Les typologies de personnes (Document) | complet | [transcription](transcriptions/ressources-google/39-02-les-typologies-de-personnes-document.md) |
| 40 | 03 Construire la bonne équipe (Document) | complet | [transcription](transcriptions/ressources-google/40-03-construire-la-bonne-equipe-document.md) |
| 41 | 04 Rôles, Responsabilités et KPI (Document) | complet | [transcription](transcriptions/ressources-google/41-04-roles-responsabilites-et-kpi-document.md) |
| 42 | 06 Process: Explications et Gestion (Document) | complet | [transcription](transcriptions/ressources-google/42-06-process-explications-et-gestion-document.md) |
| 43 | 07 Identifier et résoudre les blocages internes (Document) | complet | [transcription](transcriptions/ressources-google/43-07-identifier-et-resoudre-les-blocages-internes-document.md) |
| 44 | 08 Cadences de meeting pour une marque performante (Document) | complet | [transcription](transcriptions/ressources-google/44-08-cadences-de-meeting-pour-une-marque-performante.md) |
| 45 | 09 Leadership de performance (Document) | complet | [transcription](transcriptions/ressources-google/45-09-leadership-de-performance-document.md) |
| 46 | 10 Management pour la performance (Document) | complet | [transcription](transcriptions/ressources-google/46-10-management-pour-la-performance-document.md) |
| 47 | 11 Incentives et bonus (Document) | complet | [transcription](transcriptions/ressources-google/47-11-incentives-et-bonus-document.md) |
| 48 | 12 Les 3 piliers de la performance (Document) | complet | [transcription](transcriptions/ressources-google/48-12-les-3-piliers-de-la-performance-document.md) |
| 49 | 13 Plan de Croissance (Template) | complet | [transcription](transcriptions/ressources-google/49-13-plan-de-croissance-template.md) |
| 50 | 14 Savoir quand recruter (Document) | complet | [transcription](transcriptions/ressources-google/50-14-savoir-quand-recruter-document.md) |
| 51 | 15 Quand déléguer et comment reprendre votre valeur (Document) | complet | [transcription](transcriptions/ressources-google/51-15-quand-deleguer-et-comment-reprendre-votre-valeur.md) |
| 52 | 16 Comment attirer les meilleurs talents (Document) | complet | [transcription](transcriptions/ressources-google/52-16-comment-attirer-les-meilleurs-talents-document.md) |
| 53 | 17 Le Headhunting (Document) | complet | [transcription](transcriptions/ressources-google/53-17-le-headhunting-document.md) |
| 54 | 18 SOP complet: Recrutement (Document) | complet | [transcription](transcriptions/ressources-google/54-18-sop-complet-recrutement-document.md) |
| 55 | SOP—Réussir son année (OKR/Strat) | complet | [transcription](transcriptions/ressources-google/55-sop-reussir-son-annee-okr-strat.md) |
| 56 | Google Doc BFCM | complet | [transcription](transcriptions/ressources-google/56-google-doc-bfcm.md) |
| 57 | Retroplanning | complet | [transcription](transcriptions/ressources-google/57-retroplanning.md) |
| 58 | Boîte à idées | complet | [transcription](transcriptions/ressources-google/58-boite-a-idees.md) |
| 59 | Q4 Cheatsheet Calendrier | complet | [transcription](transcriptions/ressources-google/59-q4-cheatsheet-calendrier.md) |
| 60 | 07 Flow Email BFCM (Google Doc) | complet | [transcription](transcriptions/ressources-google/60-07-flow-email-bfcm-google-doc.md) |
| 61 | Timeline Email BFCM | complet | [transcription](transcriptions/ressources-google/61-timeline-email-bfcm.md) |
| 62 | Lien Document SMS | complet | [transcription](transcriptions/ressources-google/62-lien-document-sms.md) |
| 63 | Doc vidéo 🎁 500+ Templates Ads Q4 | complet | [transcription](transcriptions/ressources-google/63-doc-video-500-templates-ads-q4.md) |

## ressources-notion

| # | Titre | Statut | Formats |
|---|-------|--------|---------|
| 01 | MODULE MANUS AI - MASTER | complet | [transcription](transcriptions/ressources-notion/01-module-manus-ai-master.md) |
| 02 | ADS Cartoon IA - Génération via Skill Claude Code | complet | [transcription](transcriptions/ressources-notion/02-ads-cartoon-ia-generation-via-skill-claude-code.md) |
| 03 | 🎬 Skill AI Ads Modulable - Génération via Claude Code | complet | [transcription](transcriptions/ressources-notion/03-skill-ai-ads-modulable-generation-via-claude-code.md) |
| 04 | Skill Native Ads Copy - Image ↔ Copy via Claude Code | complet | [transcription](transcriptions/ressources-notion/04-skill-native-ads-copy-image-copy-via-claude.md) |
| 05 | Raw Talking Heads & Statiques Animés - Seedance 2.5 & Minimax H3 | complet | [transcription](transcriptions/ressources-notion/05-raw-talking-heads-statiques-animes-seedance-2-5.md) |
| 06 | New Etnie Funnel Testing | complet | [transcription](transcriptions/ressources-notion/06-new-etnie-funnel-testing.md) |
| 07 | La méthode en 4 phases et 12 questions qui décide de chaque créa que tu lances (le mental system des | complet | [transcription](transcriptions/ressources-notion/07-la-methode-en-4-phases-et-12-questions.md) |
| 08 | 'Official Apology Statement' Framework | complet | [transcription](transcriptions/ressources-notion/08-official-apology-statement-framework.md) |
| 09 | Créative Tips, Repliquer format organic en ads | complet | [transcription](transcriptions/ressources-notion/09-creative-tips-repliquer-format-organic-en-ads.md) |
| 10 | MASTER COPY MINING SOP | complet | [transcription](transcriptions/ressources-notion/10-master-copy-mining-sop.md) |
| 11 | Stratégie des Ads Controversées (Process) | complet | [transcription](transcriptions/ressources-notion/11-strategie-des-ads-controversees-process.md) |
| 12 | Analyser son compte avec CMPR | complet | [transcription](transcriptions/ressources-notion/12-analyser-son-compte-avec-cmpr.md) |
| 13 | Native Static Ads IA Cloning PROMPT | complet | [transcription](transcriptions/ressources-notion/13-native-static-ads-ia-cloning-prompt.md) |
| 14 | Discredit | complet | [transcription](transcriptions/ressources-notion/14-discredit.md) |
| 15 | Le principe du contournement (Bypass Principle) | complet | [transcription](transcriptions/ressources-notion/15-le-principe-du-contournement-bypass-principle.md) |
| 16 | UGLY Taste / Look / Live Test | complet | [transcription](transcriptions/ressources-notion/16-ugly-taste-look-live-test.md) |
| 17 | [Creative Insight] Tourner 1 Ads winneuse en 10 winning itération | complet | [transcription](transcriptions/ressources-notion/17-creative-insight-tourner-1-ads-winneuse-en-10.md) |
| 18 | Jetter la pierre au villain (tips de film) | complet | [transcription](transcriptions/ressources-notion/18-jetter-la-pierre-au-villain-tips-de-film.md) |
| 19 | Publicités statiques natives (Long Ad Copy) | complet | [transcription](transcriptions/ressources-notion/19-publicites-statiques-natives-long-ad-copy.md) |
| 20 | Comment créer 108 ads qui convertissent | complet | [transcription](transcriptions/ressources-notion/20-comment-creer-108-ads-qui-convertissent.md) |
| 21 | Narrative Ads | complet | [transcription](transcriptions/ressources-notion/21-narrative-ads.md) |
| 22 | Curiosity + Reverse Psychology | complet | [transcription](transcriptions/ressources-notion/22-curiosity-reverse-psychology.md) |
| 23 | Coca Cola Analyse #Hack Psychologique | complet | [transcription](transcriptions/ressources-notion/23-coca-cola-analyse-hack-psychologique.md) |
| 24 | AI REVIEW MINING PROMPT | complet | [transcription](transcriptions/ressources-notion/24-ai-review-mining-prompt.md) |
| 25 | 8 Hooks Visuels Irrésistibles pour Stopper le Scroll sur Meta Ads | complet | [transcription](transcriptions/ressources-notion/25-8-hooks-visuels-irresistibles-pour-stopper-le-scroll.md) |
| 26 | Creative Strategy Playbook - cheat Sheet | complet | [transcription](transcriptions/ressources-notion/26-creative-strategy-playbook-cheat-sheet.md) |
| 27 | Creative Insight Loss Aversion | complet | [transcription](transcriptions/ressources-notion/27-creative-insight-loss-aversion.md) |
| 28 | [Creative Insight] Itération des statics | complet | [transcription](transcriptions/ressources-notion/28-creative-insight-iteration-des-statics.md) |
| 29 | SOP – Utiliser avis client pour créer idée de Ads | complet | [transcription](transcriptions/ressources-notion/29-sop-utiliser-avis-client-pour-creer-idee-de.md) |
| 30 | Analyse Bangers Ads - Flytex | complet | [transcription](transcriptions/ressources-notion/30-analyse-bangers-ads-flytex.md) |
| 31 | Créer new Hooks qui cassent le cerveau | complet | [transcription](transcriptions/ressources-notion/31-creer-new-hooks-qui-cassent-le-cerveau.md) |
| 32 | “10 Copywriting Tips KILLER” pour rendre tes headlines ultra percutantes | complet | [transcription](transcriptions/ressources-notion/32-10-copywriting-tips-killer-pour-rendre-tes-headlines.md) |
| 33 | 190 Psychological Hooks based on the 21 Proven Frameworks for Winning Headlines | complet | [transcription](transcriptions/ressources-notion/33-190-psychological-hooks-based-on-the-21-proven.md) |
| 34 | MASTER \| Ressources Module SAV | complet | [transcription](transcriptions/ressources-notion/34-master-ressources-module-sav.md) |
| 35 | Playbook - Les Créatives | complet | [transcription](transcriptions/ressources-notion/35-playbook-les-creatives.md) |
| 36 | Comment Atteindre N'importe Quel Objectif & 37x Plus Vite (Retour d’expérience) | complet | [transcription](transcriptions/ressources-notion/36-comment-atteindre-n-importe-quel-objectif-37x-plus.md) |
| 37 | Comment Créer une Bid Cap Inflated 10-100k/day | complet | [transcription](transcriptions/ressources-notion/37-comment-creer-une-bid-cap-inflated-10-100k.md) |
| 38 | Comment Scaler en 2025 Sur Meta - PLAYBOOK COMPLET | complet | [transcription](transcriptions/ressources-notion/38-comment-scaler-en-2025-sur-meta-playbook-complet.md) |
| 39 | Guide : ElevenLabs V3 (alpha) | complet | [transcription](transcriptions/ressources-notion/39-guide-elevenlabs-v3-alpha.md) |
| 40 | Creative Insight — ChatGPT Image 2 | complet | [transcription](transcriptions/ressources-notion/40-creative-insight-chatgpt-image-2.md) |
| 41 | Quick Win — Changer l’approche psychologique de ton ads | complet | [transcription](transcriptions/ressources-notion/41-quick-win-changer-l-approche-psychologique-de-ton.md) |
| 42 | La méthode en 4 phases et 12 questions qui décide de chaque créa que tu lances (le mental system des | complet | [transcription](transcriptions/ressources-notion/42-la-methode-en-4-phases-et-12-questions.md) |
| 43 | [PROMPT] Créez des Headlines qui convertissent (Pattern Break + Projection + Insight) | complet | [transcription](transcriptions/ressources-notion/43-prompt-creez-des-headlines-qui-convertissent-pattern-break.md) |
| 44 | Stratégie Bid Cap | complet | [transcription](transcriptions/ressources-notion/44-strategie-bid-cap.md) |
| 45 | Dupliquer une campagne Meta Ads d'un compte à un autre | complet | [transcription](transcriptions/ressources-notion/45-dupliquer-une-campagne-meta-ads-d-un-compte.md) |
| 46 | Contenu signalé | complet | [transcription](transcriptions/ressources-notion/46-contenu-signale.md) |
| 47 | Creative Insight - 3 New format static à tester | complet | [transcription](transcriptions/ressources-notion/47-creative-insight-3-new-format-static-a-tester.md) |
| 49 | 4 Hooks Analyse (Creative Insight) | complet | [transcription](transcriptions/ressources-notion/49-4-hooks-analyse.md) |
| 50 | [Creative Insight] Les Statics Secret Sauce | complet | [transcription](transcriptions/ressources-notion/50-les-statics-secret-sauce.md) |
| 51 | Master x Hover - Partage de résultats CRO | complet | [transcription](transcriptions/ressources-notion/51-master-x-hover-partage-de-resultats-cro.md) |
| 51 | New Concept Ads Inspiration | complet | [transcription](transcriptions/ressources-notion/51-new-concept-ads-inspiration.md) |

## reussir-son-q4

| # | Titre | Statut | Formats |
|---|-------|--------|---------|
| 01 | Introduction | complet | [transcription](transcriptions/reussir-son-q4/01-introduction.md) · [note](notes/reussir-son-q4/01-introduction.md) |
| 02 | Erreurs 2024 + info importante | complet | [transcription](transcriptions/reussir-son-q4/02-erreurs-2024-info-importante.md) · [note](notes/reussir-son-q4/02-erreurs-2024-info-importante.md) |
| 03 | Explication en Live: process et stratégies (EMF) | complet | [transcription](transcriptions/reussir-son-q4/03-explication-en-live-process-et-strategies-emf.md) · [note](notes/reussir-son-q4/03-explication-en-live-process-et-strategies-emf.md) |
| 04 | Templates EMF Media #1 | complet | [transcription](transcriptions/reussir-son-q4/04-templates-emf-media-1.md) · [note](notes/reussir-son-q4/04-templates-emf-media-1.md) |
| 05 | Templates EMF Media #2 | complet | [transcription](transcriptions/reussir-son-q4/05-templates-emf-media-2.md) · [note](notes/reussir-son-q4/05-templates-emf-media-2.md) |
| 06 | Calendrier Marketing Q4 | complet | [transcription](transcriptions/reussir-son-q4/06-calendrier-marketing-q4.md) · [note](notes/reussir-son-q4/06-calendrier-marketing-q4.md) |
| 07 | Flow Email BFCM | complet | [transcription](transcriptions/reussir-son-q4/07-flow-email-bfcm.md) · [note](notes/reussir-son-q4/07-flow-email-bfcm.md) |
| 08 | Flow SMS/Whatsapp BFCM + App SMS | complet | [transcription](transcriptions/reussir-son-q4/08-flow-sms-whatsapp-bfcm-app-sms.md) · [note](notes/reussir-son-q4/08-flow-sms-whatsapp-bfcm-app-sms.md) |
| 09 | Q4 Template 500+ ads - BFCM | complet | [transcription](transcriptions/reussir-son-q4/09-q4-template-500-ads-bfcm.md) · [note](notes/reussir-son-q4/09-q4-template-500-ads-bfcm.md) |
| 10 | Bonus Replay Mastermind #1 (Marin) | complet | [transcription](transcriptions/reussir-son-q4/10-bonus-replay-mastermind-1-marin.md) · [note](notes/reussir-son-q4/10-bonus-replay-mastermind-1-marin.md) |
| 11 | Bonus Replay Mastermind #2 (Gabriel) | complet | [transcription](transcriptions/reussir-son-q4/11-bonus-replay-mastermind-2-gabriel.md) · [note](notes/reussir-son-q4/11-bonus-replay-mastermind-2-gabriel.md) |
| 12 | Bonus Replay Mastermind #3 (Fouad) | complet | [transcription](transcriptions/reussir-son-q4/12-bonus-replay-mastermind-3-fouad.md) · [note](notes/reussir-son-q4/12-bonus-replay-mastermind-3-fouad.md) |
| 13 | Bonus Replay Mastermind #4 (Matteo) | complet | [transcription](transcriptions/reussir-son-q4/13-bonus-replay-mastermind-4-matteo.md) · [note](notes/reussir-son-q4/13-bonus-replay-mastermind-4-matteo.md) |


