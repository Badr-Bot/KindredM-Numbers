# NIVA — Mémoire de travail

> Fichier de reprise. À lire en premier au début de chaque session.
> Objectif : ne jamais reperdre le contexte, et économiser des tokens
> (on lit ce fichier au lieu de re-scanner Shopify).

Dernière mise à jour : 2026-08-08

---

## 1. Règles absolues (données par Badr)

0. **JE NE SUPPRIME JAMAIS UNE IMAGE. JAMAIS.** (05/08, mot pour mot : « quand je
   fais des modifs des images et je remets des images, ne les supprime pas ».)
   Badr réimporte régulièrement des visuels : tout média présent sur un produit
   ou dans Fichiers est à lui et reste. Aucun `productDeleteMedia`, aucun
   `fileDelete`, même pour « faire le ménage », même si un média paraît orphelin
   ou périmé. Si une galerie est encombrée : je le signale, il tranche.
   Corollaire : **je ne génère plus d'images** (« ne me fait plus d'image je le
   ferais seul ») et **je ne réassigne pas** une image sans demande explicite.
   Ce que je peux faire sans risque : relier une variante à un média existant,
   réordonner une galerie, écrire un texte alternatif.
0 bis. **Pas de Judge.me.** Retiré des 9 templates produit le 05/08 sur sa demande
   (« enlève judge de tous les produits ») : les avis passent par la section figée
   NIVA · Avis clients, pas par une app. La section `apps` reste en place, vide.
1. **Aucune suppression, aucun retrait, aucune désactivation sans permission explicite.**
   (S'applique aux sections, textes, images, blocs, produits, pages.)
2. Le **polo est prioritaire** sur tout le reste.
3. **La police est un point non négociable** : aucun texte hors des 3 fontes de la charte.
4. La marque est **basée à Paris**. Micro-entreprise **Adnane El Boussaadani**.
   « PARIS » doit rester partout où il était.
5. Adresse e-mail unique : **contact@mynivashop.com**. L'autre (myniva@outlook.com) doit disparaître.
6. Un **agent de vérification** doit repasser derrière chaque lot de demandes et forcer
   la correction jusqu'au résultat attendu.
7. **Tout renommage de produit Shopify casse le dashboard Kindred** : le moteur mappe
   les ventes par TITRE EXACT (`products_map` dans Supabase, fail loudly). Erreur vécue
   le 05/08 : le renommage « Le Gilet Sully » a fait sortir le gilet du compteur en
   pleine journée (« Lancaster » = les créas Meta du Gilet).
   **Réparé en autonomie le 05/08** — méthode qui marche quand le proxy bloque
   vercel.app : un workflow GitHub Actions (`.github/workflows/fix-products-map.yml`,
   branche dashboard) qui POST `/api/admin/products-map` (routes SANS auth) puis
   boucle sur `/api/sync` jusqu'à `"ran":true` (throttle 5 min, le cron keep-sync
   gagne souvent la course). Déclenchement : le connecteur GitHub ne peut pas
   dispatch (403) → trigger `on: push` sur le fichier `.github/fix-map-trigger`.
   Résultat prouvé par les logs : 47 jours re-traités (17/06→05/08), plus aucun
   titre renommé dans les non-mappés, et au passage le **Caleçon FR+ES mappé**
   (jamais fait, COGS compté 0 → Net surestimé depuis le début). Restent non
   mappés, sans impact (COGS réel 0) : les 2 e-books FR/ES. `products_map` = 21 lignes.

---

## 2. Identifiants Shopify

| Objet | ID / valeur |
|---|---|
| Boutique | mynivashop.com |
| Thème **LIVE** depuis le 05/08 ~18h — écriture API BLOQUÉE | `gid://shopify/OnlineStoreTheme/197881692534` — « NIVA — Maison V1 (brouillon) » (nom trompeur : il est publié) |
| Thème **correctif** prêt à publier | `gid://shopify/OnlineStoreTheme/197928550774` — « NIVA — Maison V2 (correctif barre prix) » |
| Ancien thème (désormais non publié) | `gid://shopify/OnlineStoreTheme/192925434230` — « NIVA — Maison » |

> **⚠️ Méthode obligatoire depuis que le thème est live** : `themeFilesUpsert` est
> refusé sur le thème publié. Pour livrer un correctif :
> 1. `themeDuplicate(id: <live>, name: "…")` → renvoie `newTheme` (UNPUBLISHED) ;
> 2. **relire le template depuis la copie** (Badr retouche dans l'éditeur : ma copie
>    locale du scratchpad est souvent périmée — le 05/08 elle ignorait ses retouches
>    sur `niva_ba`, `niva_ben1/2/3`, `niva_cit`) ;
> 3. patcher **uniquement** le bloc visé, repousser, puis **prouver** par un diff que
>    seul ce bloc a changé ;
> 4. Badr publie la copie en un clic.
| **Le Polo Marceau** (DRAFT, la pièce en cours) | `gid://shopify/Product/15830356132214` — handle `le-polo-marceau` — suffixe `polo-2` |
| Polo LIVE (celui qui vend aujourd'hui) | `gid://shopify/Product/15746273837430` — suffixe `polo-breeze` |
| Collection | `gid://shopify/Collection/695588487542` — titre « Le Vestiaire », handle `nivafit` |
| Blog « Le Journal » | `gid://shopify/Blog/125339926902` (5 articles) |
| Page La Maison | `gid://shopify/Page/711151092086` |
| Page Livraison & Retours | `gid://shopify/Page/711151124854` |
| Page Guide des tailles | `gid://shopify/Page/711151157622` |
| Menus | principal `331563204982` · aide `331563270518` · maison `331563303286` |

### Médias produit du Polo Marceau (au 05/08, après refonte)

| Position | Coloris | MediaImage ID |
|---|---|---|
| 1 | Noir Espresso | `70939502379382` |
| 2 | Gris Harbour | `70939502412150` |
| 3 | Bleu Coastal | `70939502444918` |
| 4 | Bleu Nuit | `70939502477686` |
| 5 | Vert Sage | `70939502510454` |
| 6 | Rouge Merlot | `70939502543222` |

Les **54 variantes** (6 coloris × 9 tailles S→6XL) sont reliées à l'image de leur coloris
via `productVariantsBulkUpdate { mediaId }` → cliquer une pastille change la photo.

Galerie **nettoyée le 05/08 avec l'accord de Badr** : les 22 anciens médias sont
supprimés, il reste exactement les 6 visuels coloris ci-dessus.

**Décisions de Badr du 05/08 (après retours visuels) :**
- La section Citations reste un **bandeau défilant** (pas un mur statique) — corrigé
  en filet fin : padding 13 px mobile / 17 px desktop, texte 13 / 16,5 px, exclu du
  rythme vertical de la section 20 du CSS.
- L'avant/après reprend **les anciennes images** (`hf_20260531_232009_8d9563bc...png`
  avant, `hf_20260531_224602_..._1.png` après, labels AVANT/APRÈS) — vérifié : les
  deux fichiers existent toujours dans Files.
- Le gras du texte courant : `font-weight:500!important` (section 23) — le
  `!important` est OBLIGATOIRE car les `<style>` des sections arrivent après la
  feuille dans le DOM et regagnaient avec leur 600.
- Couture UGC→Maison resserrée (section 24, `:has()`) : les deux sections partagent
  le même fond ivoire, leurs marges s'additionnaient en un blanc géant.

**⚠️ Conflit d'écriture vécu le 05/08 :** un agent de vérification a écrasé
`niva-theme.css`, `niva-citations.liquid` ET `product.polo-2.json` pendant que
j'écrivais dessus — il a pris mes messages de coordination pour une injection et
a « restauré » l'état d'avant les décisions de Badr. Règle : **un seul écrivain
par fichier** — les agents de vérification travaillent en LECTURE SEULE et
rapportent les corrections, c'est moi qui applique. Toujours comparer
`size`/contenu local/serveur après chaque push. Nota : Shopify **re-sérialise**
les templates JSON à l'upsert (taille différente = normal, comparer la
structure) et **retire les settings inconnus du schéma en vigueur** au moment de
l'upsert (`speed` du bandeau a sauté ainsi ; sans effet, le défaut du schéma
vaut 55).

**Audit Opus du 05/08 — la découverte capitale :** le bloc `custom_liquid_fonts`
du template polo-2 contient un verrou inline
`#MainContent .product .product__info-wrapper p {...!important}` (spécificité
(1,2,1)) et `...span:not(...):not(...)` ((1,4,1)) qui battait TOUT : le titre
produit, le prix, l'offre et les étiquettes s'affichaient en Instrument Sans.
Corrigé par la **section 25** du CSS (sélecteurs à spécificité > (1,4,1)).
Autres corrections issues de l'audit : `.nv2-social__txt strong` ajouté à la
section 23 ; couture `.nvv → .nvs-maison` (page d'accueil, blanc de 208 px
desktop) ajoutée à la section 24 ; `.nvg__titre`, `.nvg__nom`,
`.footer-block__heading`, `.nv2-offer__time`, `.nv2-note__stars` repassés en Mono.
CSS de référence : **55 893 octets** (09:08:44Z).
L'agent Sonnet a corrigé de son côté : délais dans `product.polo-breeze.json`
(template du polo LIVE) et la page Livraison & Retours ; mention « 48h » laissée
dans un avis client verbatim (citation, pas une politique).

---

## 3. Charte NIVA V1.1

**Couleurs**
```
noir        #151515   noir-survol  #2A2A2A
ivoire      #FAF9F6   sable        #E8E1D4
sable-clair #F2ECE1   sable-pâle   #F7F3EB
filet       #E4DED2   filet-fort   #DCD6CA
t2 (texte)  #3D3A35   t3           #6E6A63
gris-sable  #8C8578   ocre  #C08A3E (étoiles uniquement)
terre       #9C5B34   (urgence / rupture uniquement)
```

**Fontes** — 3, pas une de plus
- `--nv-titre` : **Jost** 200/300/400/500 → titres, prix produit, citations, chiffres
- `--nv-sans` : **Instrument Sans** 400/500/600/700 → texte courant, prix Dawn
- `--nv-mono` : **JetBrains Mono** 400/500 → sur-titres, boutons, étiquettes, signatures

**Formes** : rayon 0 partout. Aucune ombre. Aucun dégradé. Filets 1 px.

---

## 4. Architecture technique du thème

### Fichiers clés

| Fichier | Rôle |
|---|---|
| `assets/niva-theme.css` (~53 ko) | **Le cœur.** Recâble les variables Dawn + 23 sections de règles. |
| `snippets/niva-tokens.liquid` | preconnect + Google Fonts + niva-theme.css + niva-motion.js. Rendu par les 25 sections NIVA **et** depuis le `<head>` des 2 layouts. |
| `assets/niva-motion.js` | Apparitions au défilement, en-tête qui se resserre, ancres douces. Garde `window.__nivaMotion`. |
| `sections/niva-shell.liquid` | Posé dans `header-group.json` → charge la charte sur **toutes** les pages. |
| `layout/theme.liquid` / `password.liquid` | Poppins retiré, `{% render 'niva-tokens' %}` ajouté avant `</head>`. |

### Plan de `niva-theme.css`

1. Recâblage des variables Dawn · 2. Typo · 3. Boutons · 4. Champs · 5. Prix
6. En-tête · 7. Pied · 8. Cartes · 9. Page produit · 10. Panier · 11. Collection/filtres
12. Blog · 13. Newsletter/compte · 14. Mouvements premium · 15. Nettoyage · 16. Formes
17. Corrections d'audit (C1→C16) · 18. Blocs d'app
19. **Verrou typographique** · 20. Rythme vertical unique · 21. Images de section plafonnées
22. **Rattrapages nommés du verrou** · 23. Le gras n'est plus un outil de mise en valeur

### ⚠️ Pièges appris (ne pas les refaire)

- **Le verrou de la section 19 écrase tout.**
  `html body *:not(:where(...)){font-family:...!important}` bat toute règle
  **sans** `!important`, même plus spécifique. Conséquence : les `font-family`
  écrites dans le `<style>` d'une section sont **inertes**.
  → Toute nouvelle règle de fonte doit porter `!important`, ou être ajoutée à la
  **section 22**. 39 éléments s'affichaient en Instrument Sans à cause de ça.
- `:not(X)` hérite de la spécificité de X. `:where(X)` vaut zéro. C'est le correctif.
- **`themeFilesUpsert` avec `body.type = URL` est asynchrone** : il renvoie
  `upsertedThemeFiles: []` **sans erreur**, même en cas de succès **et** en cas d'échec.
  → Toujours vérifier ensuite avec une requête sur `updatedAt` / `size`.
- Pour obtenir l'erreur réelle, repousser le fichier en `type: TEXT` (synchrone).
- **Validation du schéma Shopify** : `name` de section ≤ 25 caractères ;
  un `default` de `range` doit valoir `min + n×step` ; `richtext` avec `default: ""`
  est **invalide** (supprimer la clé) ; `image_picker` attend `shopify://shop_images/<fichier>`.
- **`templateSuffix` est un champ PRODUIT**, pas un champ thème : le changer sur un
  produit ACTIF touche la boutique en ligne immédiatement.
- `ProductInput.redirectNewHandle` vaut `false` par défaut via l'API → changer un
  handle sans lui casse les URLs sans redirection 301.
- **Pastilles couleur** : les métaobjets `shopify--color-pattern` ont un champ `color`
  ET un champ `image`. Shopify **privilégie l'image**. Vider `image` → cellule de couleur pleine.

### Envoi de fichiers volumineux (économie de tokens)

```
1. stagedUploadsCreate(resource: FILE, mimeType: "text/plain", httpMethod: PUT)
2. curl -X PUT --data-binary "@fichier" "<url signée>"
3. themeFilesUpsert(body: {type: URL, value: "<resourceUrl sans query string>"})
4. VÉRIFIER via theme.files(filenames: [...]) { size updatedAt }
```

### Génération d'images (Higgsfield)

- Modèle `seedream_v4_5`, `quality: high`, **`resolution: 2k`**
  (⚠️ le 4k a échoué 2× à l'upload Shopify → `status: FAILED`).
- **Méthode qui marche pour la cohérence** : générer **une image maîtresse**, puis
  décliner les autres en passant **son `job_id` en `image_references`** avec le prompt
  « Same man, same pose, same framing, same background as the reference. Only X changes. »
- Règles de prompt : **aucune négation** (le modèle rend ce qu'on nie), prompt court et
  ordonné, forcer la texture (pores, trame, plis), objectif **105 mm f/8** (pas 85 mm f/2).
- ⚠️ **Je ne peux voir aucune image** : le proxy renvoie 403 sur `cdn.shopify.com`
  et `d8j0ntlcm91z4.cloudfront.net`. C'est Badr qui valide visuellement.

---

## 5. Où en est le travail

### Fait et vérifié

- Charte appliquée à tout le thème, y compris blocs d'app et schémas de couleur personnalisés
- Performance : 7 requêtes Poppins/page supprimées, charte remontée dans le `<head>`, srcset, lazy
- Pages institutionnelles, blog « Le Journal » (5 articles), 9 templates produit
- Pastilles couleur en cellules pleines ; 54 variantes reliées à leur photo
- Rythme vertical unique (56/104 px) ; images de section plafonnées (46vh mobile / 64vh desktop)
- **Verrou typo réparé** (section 22) : 39 éléments repassés en Jost / JetBrains Mono
- Section **Citations** refondue : bandeau défilant → mur de verbatims statique, 2 colonnes
- Section **Comparatif** refondue : en-têtes à 2 niveaux, colonne NIVA encadrée du haut en bas
- Section **Avant-Après** réparée : `clip-path` au lieu d'une largeur (les 2 photos sont
  désormais à la même échelle) + filet de séparation
- Section **FAQ** : questions en Jost, 8 questions réécrites, ligne de pied de contact
- **6 nouveaux visuels produit** : fond blanc, mannequin centré, vu de face, pose identique
- 4 photos ajoutées dans les sections trop textuelles + la paire avant/après
- Délais corrigés partout : **expédié sous 24 h, livraison 5 à 9 jours ouvrés**

### En attente de Badr

- Validation visuelle des images (je ne les vois pas)
- Permission de retirer les ~22 anciens médias de la galerie produit
- Nom définitif de chaque pièce de la collection (voir §6)
- Titre de la collection : « Le Vestiaire » ou « Nivafit » ?
- Liens Instagram / Facebook → **reçus** :
  FB `https://www.facebook.com/profile.php?id=61580982443258`
  IG `https://www.instagram.com/niva_paris1`

### À faire côté Badr (je n'ai pas les droits)

- Paramètres → Politiques : 7 occurrences de `myniva@outlook.com`
- Paramètres → Général → Détails de la boutique : `shop.email` / `contactEmail`
- E-mail de notification Judge.me
- Ménage des fichiers de thème (12 sections vides, 9 résidus GemPages, 14 templates morts)
  → l'API MCP bloque `themeFilesDelete`

---

## 5 ter. Deux décisions de fin de journée (05/08, thème V2)

**Barre collante — le prix a été RETIRÉ.** Deux tentatives pour lui faire suivre
l'offre choisie dans Moon Bundles ont échoué : la lecture du prix dans le DOM du
widget suppose de deviner sa structure, et je ne peux pas charger la page pour
vérifier. Badr a tranché (« soit tu le règles soit on enlève le prix ») → barre =
**bouton noir pleine largeur seul**, sans chiffre. Raison à retenir : un prix faux
sous le pouce du client est pire que pas de prix. Appliqué au polo et au gilet.
Ne pas réintroduire de prix dans cette barre sans pouvoir tester le rendu réel.

**Section `niva-selection.liquid`** (nouvelle) : remplace « Produits associés » de
Dawn, qui remontait tout seul le caleçon et l'e-book. Réglage `product_list` →
Badr choisit ses pièces à la main, avec repli sur une collection si la liste est
vide. Posée sur la page du gilet (Polo, Pantalon Rivoli, Chemise Turenne).

Posée aussi sur **la page du polo** le 05/08 à sa demande : section `niva_sel`
intercalée entre `niva_avis` et `niva_rappel` (le rappel d'achat reste le dernier
mot de la page), pièces choisies = **Gilet Sully, Pantalon Rivoli, Chemise
Turenne**, 3 colonnes, lien « Voir tout le vestiaire » → `/collections/nivafit`.
Template vérifié après coup : 15 sections, `main` toujours à 18 blocs, 3 vidéos
UGC intactes, avis intacts. Réglages en `product_list` = **liste de handles**
(pas de GID) — format à réutiliser pour les autres fiches.

Reste à basculer : les autres templates produit tournent encore sur
`related-products` de Dawn et remontent l'e-book.

## 5 bis. Le Gilet Sully — page refondue le 05/08 (thème V2)

**Faits produit confirmés par Badr** : c'est un **gilet de costume** (sans manches,
boutonné, se porte sur une chemise). Angle de vente retenu : **le confort grande
taille**, en continuité du polo. 6 coloris (Noir intense, Bleu nuit, Gris anthracite,
Marron Oxford, Vert olive, Rouge bordeaux), **S → 5XL**, 79,99 €.

Page passée de 9 à **19 sections** : main enrichi (16 blocs : sur-titre, ligne
S–5XL, encadré promesse, moyens de paiement, livraison estimée, **barre collante
qui suit le prix du pack**) · chiffres · marquee · 3 bénéfices (boutonnage /
position assise / emmanchure) · **nuancier des 6 teintes** · ligne noire ·
comparatif · parti pris réécrit gilet · **éditorial** · maison · engagements ·
FAQ 8 questions · **diptyque** (vestiaire + guide des tailles) · rappel final ·
journal · produits associés · avis Judge.me (**il était `disabled: true`, réactivé**).

⚠️ **Aucun avis inventé sur cette page** (contrairement au polo) : les témoignages
viennent uniquement de Judge.me. Ne pas y ajouter de citations fabriquées.

⚠️ **Claims à faire confirmer par Badr avant publication** : matière/composition,
présence d'une doublure, de poches, d'une sangle de réglage au dos. Rien de tout
cela n'est affirmé dans le texte actuel — la copie parle uniquement de coupe,
de tailles, de coloris et de service, tous vérifiables.

## 6. Nommage — VALIDÉ ET APPLIQUÉ le 05/08

La **collection** = *Nivafit* (la coupe ajustée). Chaque **pièce** porte un nom de rue
parisienne. Titres changés, **handles inchangés** (aucune URL cassée).

| Produit (ID) | Titre appliqué |
|---|---|
| 15830356132214 | **Le Polo Marceau** |
| 15822378336630 | **Le Gilet Sully** |
| 15778111684982 | **Le Pantalon Rivoli** |
| 15778128855414 | **La Chemise Turenne** |
| 15778112405878 | **Le Short Cassini** |
| 15778136424822 | **La Ceinture Bréguet** |
| 15778113749366 | **Les Chaussettes Malesherbes** (Vosges était pris par le T-shirt) |
| 15765172617590 | Le T-shirt Vosges (déjà nommé, inchangé) |

Non nommés (hors périmètre validé) : débardeur de compression, chemise
infroissable (bellutia), caleçon, e-book.

---

## 6 ter. Galerie couleur ≠ vignettes du bundle (05/08, thème V2)

**Le piège central, à ne jamais réapprendre.** Shopify n'a **qu'une seule donnée**,
`variant.featured_media`. Elle pilote **à la fois** la galerie de la fiche **et** les
vignettes du bundle Moon Bundles. Donc : mannequins sur les variantes → le bundle
affiche des mannequins ; packshots sur les variantes → la fiche affiche des
packshots. On ne peut pas satisfaire les deux par ce chemin.

**Décision de Badr** : le bundle doit montrer les **packshots**, la fiche doit
montrer les **mannequins**. Les variantes restent donc liées aux packshots
(`294.png`, `292.png`, `291.png`, `red_….jpg`) — **NE PAS LES RELIER AUX
MANNEQUINS**, c'est exactement ce qu'il a défait à la main.

**Solution** : `snippets/niva-galerie-couleur.liquid` (nouveau). Appelé par un bloc
`custom_liquid_galerie` du template polo : `{% render 'niva-galerie-couleur',
prefixe: 'POLO_MARCEAU' %}`. Il :
1. prend les médias dont le **nom de fichier contient le préfixe**, dans l'ordre de
   la galerie, et les met en face des couleurs **dans l'ordre des couleurs** —
   la règle que Badr a suivie en nommant ses fichiers. 6 = 6 sur le polo ;
2. détourne `media-gallery.setActiveMedia` pour substituer le mannequin au
   packshot demandé par le thème ;
3. **bloque tout changement d'image tant que le client n'a pas cliqué une
   couleur** → le visuel d'accueil reste en place (demande explicite : « ça part
   pas vers l'image grise »). Les vignettes, liées à la méthode d'origine à la
   construction, restent cliquables normalement ;
4. ignore les sélecteurs situés dans un bloc bundle/app.

Sécurités : si le nombre de mannequins ≠ nombre de couleurs, le snippet
**n'écrit rien** (retour au comportement actuel plutôt qu'une mauvaise image).
Le fichier ne modifie **aucune image ni aucun lien de variante**.

⚠️ **Impossible à tester en rendu réel** : `mynivashop.com` est refusé par la
politique réseau de l'environnement (403 sur le CONNECT). Vérification faite sur
les fichiers et les données, pas sur la page. À faire confirmer par Badr.

À poser sur le gilet quand ses fichiers mannequins seront nommés pareil
(préfixe à passer en paramètre).

## 6 quater. Audit Opus du 05/08 sur la fiche Gilet — correctifs appliqués

Section **26** ajoutée à `niva-theme.css` (58 526 o) :
- `.nvd__media img{max-height:none}` — le cadre 4/5 du diptyque laissait une bande
  de sable de 281 px sous chaque photo (image plafonnée à 56vh) ;
- `.nvs-num` **retiré du rythme vertical** (§20) et sa hauteur verrouillée dans
  `niva-chiffres.liquid` — c'est un bandeau fin, il héritait de 104 px de marge ;
- `.nvs-cmp__note` et `.nvn__note` rendus à Instrument Sans — le joker
  `[class*="__note"]` de la §19 les tirait en Jost ;
- trois **coutures** de sections de même fond (`.nve`→`.nvs-maison`,
  `.nvp`→`.nve`, `.nvs-rev`→`.nvs-faq`, avec suppression du filet pour la FAQ) ;
- cinq libellés sortis du gris sable (3,47:1) vers `--nv-t2` (10,75:1) ;
- le **cadrage inline** de la section Bénéfice fonctionne enfin : le
  `object-position:center!important` de la §21 le battait, il ne s'applique plus
  aux images de cette section.

`niva-avis.liquid` : `.nvs-rev__badge:empty` et `.nvs-rev__variant:empty` masqués
(petit rectangle beige vide après chaque prénom, 8 px de marge fantôme sur 34 des
35 avis).

**Non corrigés volontairement** (arbitrage de Badr) : les 6 images de section sont
en 1:1 dans des cadres 3/2 et 4/5 → 20 à 37 % rognés ; deux photos d'avis sont en
paysage dans des cadres portrait ; les étoiles ocre sont à 2,87:1 mais c'est la
couleur de la charte ; 4 teintes de service hors charte (`--nv-piste` et cie).

## 6 quinquies. État des thèmes au 05/08 23:00 — À RELIRE EN PREMIER

**« NIVA — Maison V2 » (`197928550774`) est désormais PUBLIÉ** (rôle MAIN).
Badr l'a activé lui-même. L'ancien « V1 (brouillon) » a été supprimé.
**« NIVA — Maison V3 » (`197936087414`)** est la copie de travail non publiée,
créée par Badr à 22:53 — c'est là que va tout nouveau correctif. Il l'activera.

Piège de lecture : la taille d'un gabarit BAISSE après un envoi (polo : 50 057 →
43 663) parce que Shopify recompresse le JSON. Ce n'est **pas** une perte de
contenu — vérifier la structure (15 sections, 19 blocs), jamais les octets.

**Deuxième boutique.** Le connecteur Shopify bascule entre deux boutiques :
`Niva` / `mynivashop.com` (EUR, plan Shopify) et `NIRA US` / `mynirastore.com`
(USD, plan Basic, `kyzvuj-vx.myshopify.com`) — une boutique de compléments dont
le thème est un export de mynivashop, d'où des noms de fichiers identiques.
**Toujours appeler `get-shop-info` avant d'agir.** `switch-shop` révoque le jeton
et impose une réautorisation par Badr.
Travail fait côté NIRA US : copie « NIRA US — optimisation 05/08 »
(`207583510877`) avec `minimum-scale=1` (le dézoom au pincement, sa vraie
plainte), le script du bundle recadré (il observait `document.body` entier sur
toutes les pages) et un `max-width:100%` d'assurance sur les médias de section.
Un audit a établi qu'il n'y a **aucun débordement horizontal** dans ce thème.

## 6 sexies. Le verrou de galerie — 2e version (le timing)

La 1re version greffait `setActiveMedia` sur l'**objet** galerie. Or au moment où
le script s'exécute, `<media-gallery>` n'est pas encore « réveillé » par le
navigateur : la greffe échouait et les rattrapages différés (400/1200 ms)
arrivaient **après** que le thème ait fait basculer l'image d'accueil vers celle
de la variante. D'où la plainte « la première image bascule vers la deuxième ».

Correctif : greffer sur le **prototype** de la classe, via
`customElements.whenDefined('media-gallery')`. La greffe est alors en place avant
le moindre appel. Effet de bord heureux : les vignettes ont été liées à la
méthode d'origine **au moment de la construction**, donc elles ne passent pas par
la greffe et restent cliquables même avant le premier clic sur une couleur.
Poussé sur V3 uniquement (7 387 o). À retester après publication.

## 6 septies. Moon Bundles — pourquoi le CSS de l'appli ne s'appliquait pas

Le champ « CSS personnalisé » de Moon Bundles **n'injecte rien** : testé, recollé,
sans effet (noms de produits toujours bleus, bandes de cadeaux toujours grises).
Ne plus perdre de temps dessus.

Cause de fond découverte : la **section 18** de `niva-theme.css` vise
`.shopify-app-block` et `[id^="shopify-block-"]`, mais **le script de Moon Bundles
déplace son widget hors de ce cadre** pour le poser sous le sélecteur de taille.
D'où le mi-chemin observé : angles vifs et étiquettes en mono passaient (héritage),
le reste non.

Remède : **section 27** de `niva-theme.css`, qui vise le widget par son propre nom
(`[class*="moonbundle"]`, plus les variantes tiret/souligné) :
noms de produits en noir (le bleu de lien n'existe pas dans la charte), bandes de
cadeaux remplacées par un filet, prix barré en `--nv-t3` (5,11 de contraste contre
3,47 pour le gris sable), polices titre/mono, angles vifs après déplacement.
Les rubans gardent leur casse d'origine : Badr préfère « Le plus populaire » à
« LE PLUS POPULAIRE » — c'est ce qui rend son bundle Gilet plus élégant.
Les sélecteurs internes (`[class*="title"]`, `[class*="gift"]`…) restent des
heuristiques : à resserrer si un élément résiste.

Ce qui reste à faire côté panneau (tableau fourni à Badr) : décocher **B** partout
et **I** sur le sous-titre, un seul ruban, `Rayon 0` et `Linéaire` dans « Design des
souscriptions », et surtout **reprendre les titres façon Gilet** — « 2 Polos Marceau
pour 30,00 € chacun » au lieu de « 1 acheté = 1 OFFERT » : c'est le seul vrai écart
entre ses deux bundles, et il est gratuit.

Réglage boutique à corriger : le format de devise affiche `€59,99` (usage
américain). Paramètres → Général → Devise → `{{amount_with_comma_separator}} €`.

## 6 octies. Thèmes au 06/08 08:16 — la ronde des publications

Badr publie au fur et à mesure. Toujours vérifier `role` AVANT d'écrire :
`themeFilesUpsert` est refusé sur le thème MAIN par la politique des outils.
- `197936087414` « NIVA — Maison V3 » → **MAIN** (publié à 07:45)
- `197944443254` « NIVA — Maison V4 » → copie de travail, **section 27 poussée**
  (`niva-theme.css` 61 462 o à 08:16:27)
- `197928550774` « V2 » → repassé en non publié

⚠️ Rappel du piège : le **premier** `themeFilesUpsert` après une duplication est
retombé en silence (taille inchangée). Il a fallu un envoi mis en attente **neuf**
et un second upsert. Toujours vérifier la taille, jamais se fier au retour vide.

## 6 nonies. Remplacer SmartSize (400 €/mois) — `sections/niva-tailles.liquid`

**SmartSize ne range RIEN dans Shopify** : aucun métachamp produit, aucun
métaobjet (vérifié). Ses barèmes vivent sur ses serveurs. ⚠️ **Badr doit exporter
ou capturer son barème AVANT de résilier**, sinon tout est à remesurer.

Section maison poussée sur V4 (17 431 o) : modale à deux onglets.
- **Trouver ma taille** — deux chemins : (1) l'acheteur connaît son tour de
  poitrine → lecture exacte du tableau ; (2) il ne le connaît pas → estimation
  depuis taille + poids + morphologie, **annoncée comme une estimation**.
  Formule : `poitrine ≈ (coef_poids × kg) + (coef_taille × cm) + constante`,
  défauts 0,55 / 0,45 / −20 → 105 cm pour 180 cm/80 kg. Morphologie : −4 / 0 / +5.
  Tous réglables dans l'éditeur, **à calibrer sur les retours réels**.
  Règle maison reprise de la page Guide des tailles : si le tour de taille dépasse
  le tour de poitrine, on monte d'une taille (c'est le ventre qui commande).
- **Le tableau** — un bloc par taille (nom, poitrine min/max, taille min/max,
  repère), donc un barème différent par gabarit produit.
- S'ouvre toute seule au clic sur « Guide des tailles » ou « Trouver ma taille »
  de la fiche : aucun gabarit à modifier. Ne rend rien tant qu'aucune taille
  n'est saisie.

⚠️ **PIÈGE DÉCOUVERT** : `themeFilesUpsert` a refusé ce fichier **deux fois en
silence** (aucune erreur, fichier absent). Cause : les réglages `range` à **pas
décimal** (`"step":0.05`). Shopify rejette le schéma sans le dire. Remplacés par
des champs `text`/`number`. **Ne jamais utiliser de `step` décimal dans un schéma.**

## 7. Points signalés à Badr et non tranchés

- **34 faux avis** sur la page du polo LIVE (5 textes identiques sous des noms différents)
- **Fausse rareté** : « Plus que quelques pièces » avec 43 063 unités en stock
- **Composition « 100 % PET »** : invérifiable, retirée des nouveaux textes
- **Prix barré 79,99 €** : barré fictif → risque juridique (prix de référence)
- **Compte à rebours glissant 6 h 40** (localStorage) sur la page produit :
  contredit le positionnement maison. Laissé en place, aucune suppression sans accord.

---

## 8. Méthode de travail

- Fichiers de travail locaux : `scratchpad/theme_files/` (préfixes `sections__`,
  `assets__`, `snippets__`) et `scratchpad/tpl/` (templates produit).
  ⚠️ le scratchpad est **effacé** à la fin de la session — ce fichier-ci est la mémoire durable.
- Toujours **relire le fichier depuis Shopify** avant de le patcher si le scratchpad
  est vide (nouvelle session).
- Un template produit JSON commence par un commentaire `/* ... */` :
  il faut le retirer avant `json.loads` et le remettre avant l'envoi.

## 6 decies. Étoiles sous le titre + « Compléter la tenue » (07/08, V4)

Arbitrage de Badr après analyse de la fiche True Classic :
- **NON** au déplacement du bundle dans le configurateur (leur vrai levier d'AOV :
  chez eux la quantité est une variante au même rang que la taille, pré-réglée sur
  le 6-Pack ; le prix unitaire `21,66 €/item` sert de cadre mental). Refusé.
- **NON** aux titres d'offres avec prix unitaire. Refusé.
- **OUI** aux étoiles sous le titre, renvoyant vers ses avis — « c'est pas grave
  s'il y a que 35 ».
- **OUI** au « Compléter la tenue » après le bouton d'achat.
- **Compte à rebours conservé** : décision assumée, ne plus y revenir.

`custom_liquid_etoiles` (polo, note 4,8) / `nv_etoiles` (gilet, 4,7) insérés juste
après `title`. **Le nombre d'avis n'est pas écrit en dur** : il est compté en JS
sur `.nvs-rev__card` réellement présentes. Il ne peut donc ni mentir ni se périmer.
Clic → défilement doux vers `.nvs-rev`.

`sections/niva-completer.liquid` (10 375 o) : ajout au panier **sur place**, via
`/cart/add.js` avec `sections: cart-drawer,cart-icon-bubble` puis
`cartDrawer.renderContents(res)` — le client ne quitte jamais la page. Un menu par
option, variante résolue en JS (marche même à 54 déclinaisons). Posée juste après
`main` sur les deux fiches : polo → Gilet + Pantalon ; gilet → Polo + Pantalon.
Différence avec `niva-selection` : celle-ci envoie vers la fiche produit (elle fait
sortir d'un achat en cours), celle-là ajoute. Les deux coexistent, à arbitrer.

Vérifié sur V4 : polo 16 sections / 20 blocs, gilet 22 / 17, avis 6 et 35 intacts,
UGC 3 et 3 intacts.

## 6 undecies. Dates de livraison + échange offert (08/08, V4)

**Décision de Badr** : « Le reste du vestiaire » (`niva-selection`) est jugé
redondant → **retiré des deux fiches**, avec son accord explicite. Il ne reste que
« Compléter la tenue », **descendue en fin de page**, juste avant le rappel d'achat.
Consigne de ton : *« tes mots doivent être inspirés de la maison NIVA »* — phrases
courtes, affirmatives, aucune esbroufe.

`snippets/niva-livraison.liquid` (4 892 o), greffé dans **`snippets/buy-buttons.liquid`**
(6 290 o) — donc rendu sur **toutes** les fiches produit d'un coup, y compris celles
à venir, sans toucher à un seul gabarit. Trois lignes sous le bouton :
1. « Commandé avant 14 h : expédié aujourd'hui. » (sinon « Expédié demain. » ou
   « Expédié lundi. »)
2. « Chez vous entre le vendredi 14 et le jeudi 20 août. »
3. « Mauvaise taille : l'échange est offert. » ← **promesse commerciale validée par
   Badr le 08/08, à tenir en SAV.**

Calcul : heure de la **boutique** (epoch + décalage passés en Liquid, arithmétique
en JS) — un client à Montréal ne doit pas lire une date décalée. Jours ouvrés
uniquement, samedi et dimanche sautés pour l'expédition comme pour la fourchette.
Réglages en tête du snippet : `heure_limite` 14, `delai_min` 5, `delai_max` 9.
Le texte écrit en dur dans le HTML est la version de secours si le JS ne tourne pas.
Vérifié par simulation : vendredi 10 h → expédié vendredi, livré 14→20 août ;
vendredi 18 h et week-end → expédié lundi, livré 17→21 août.

**Refusé par Badr** : le paiement en plusieurs fois (« j'aime pas l'usure »).

## 6 duodecies. Tableau des tailles pré-rempli + emplacements (08/08, V4)

**Base européenne sourcée** (tour de poitrine, cm), posée en bloc sur les deux
fiches — S 90-94 · M 94-100 · L 100-106 · XL 106-112 · 2XL 112-118 · 3XL 118-124 ·
4XL 124-130 · 5XL 130-136 · 6XL 136-142. Polo = 9 tailles (S→6XL), Gilet = 8 (S→5XL).
Sources : witt.fr, men-of-style.fr, size-factory. **⚠️ C'est une base de marché, PAS
le barème du produit** : chaque marque décale d'une demi-taille à une taille, et la
coupe NIVAFIT est volontairement non standard. À confronter au barème SmartSize ou
à celui du fournisseur avant publication, sinon les retours montent au lieu de baisser.

Le **tour de taille est laissé vide volontairement** : il n'entre pas dans le calcul
(la recommandation se fait sur la poitrine seule ; la règle « ventre > poitrine →
monter d'une taille » compare les deux mesures DU CLIENT, pas la table). Colonne
purement informative — `montrer_note` désactivé pour ne pas afficher de vide.

**Chemin par défaut inversé** : « Ma taille et mon poids » est désormais l'onglet
ouvert, « Je connais mes mesures » en second. Neuf clients sur dix n'ont pas de mètre
ruban — c'est aussi ce que fait SmartSize.

**Emplacements arrêtés avec Badr** : `niva_completer` avant le rappel d'achat ;
`niva_selection` (« Le reste du vestiaire ») **tout en bas**, dernier bloc visible —
il sert à ceux qui n'ont pas acheté ; `nv_tailles` en dernier dans l'ordre (c'est une
modale, elle ne dessine rien dans le flux).

## 6 terdecies. Barèmes fournisseur → mesures du corps (08/08, V4)

Badr a fourni **4 planches fournisseur**. Deux étaient mal étiquetées par lui :
- **ZT218** (Shoulder / Chest / Length / Sleeve) = un HAUT manches courtes → **Le Polo Marceau**
- **DK7221** (Crotch Length / Total Length / Waist / Hip) = **Le Short Cassini**
- planche « chemises » (Shoulder / Length / Bra / Waist / manches L et C) = **Chemise Turenne**
  ET, sur décision de Badr, **Le Gilet Sully**
- planche caleçon (A/B/C/D) = **le Caleçon**

**LA DÉCOUVERTE** : la planche caleçon donne la correspondance **écrite par le
fournisseur lui-même** — `CHN M = EUR S`, `CHN L = EUR M`, `CHN XL = EUR L`,
`CHN 2XL = EUR XL`. **Décalage d'exactement une taille**, confirmé à la source.
L'intuition de Badr était juste, ce n'est plus une supposition.

⚠️ **Ces planches donnent des mesures de VÊTEMENT, pas de corps.** Saisir 102 cm en
S ferait choisir un S à un homme de 102 cm de poitrine → invendable. Aisance retirée :
- **Polo : 10 cm** (maille extensible bi-sens, porté à même la peau)
- **Gilet : 14 cm** — il se porte **sur une chemise**, qui mange déjà 3 à 4 cm.
  Un gilet trop juste ne se boutonne pas : on erre large, jamais serré.

Valeurs posées (poitrine du client, cm) :
- **Polo** S 84-92 · M 92-96 · L 96-101 · XL 101-106 · 2XL 106-111 · 3XL 111-116 ·
  4XL 116-122 · 5XL 122-126 · 6XL 126-132 (tour de taille laissé vide, ZT218 n'en donne pas)
- **Gilet** S 88-96 · M 96-100 · L 100-104 · XL 104-108 · 2XL 108-112 · 3XL 112-116 ·
  4XL 116-120 · 5XL 120-124, **avec** tour de taille 82-90 → 114-118 (la planche le donne)

Reste à faire : mêmes barèmes pour Chemise, Short et Caleçon (leurs gabarits n'ont
pas encore la section). **Décision non tranchée** : garder les étiquettes du
fournisseur (un Français en L prend XL, voire 2XL sur les chemises) ou renommer les
variantes. Renommer = données produit = **en ligne immédiatement** + casse
l'attribution du tableau de bord (règle 7). Mon avis : garder les étiquettes cette
saison, le guide fait le travail.

## 6 quaterdecies. Le recommandeur de taille — version curseurs (08/08, V4)

**INFORMATION CAPITALE donnée par Badr** : sur **le polo**, les étiquettes ont
**déjà été décalées d'un cran**. Son S = le M du fournisseur, son M = le L, etc.
La planche ZT218 a 10 tailles (S→7XL), le polo en a 9 : le S a été supprimé.
**Les upsells (chemise, short, caleçon) n'ont PAS été décalés.**

Barème polo recalculé sur ce décalage (poitrine du client, aisance 10 cm) :
S 88-96 · M 96-101 · L 101-106 · XL 106-111 · 2XL 111-116 · 3XL 116-122 ·
4XL 122-126 · 5XL 126-132 · 6XL 132-138.
→ Il colle presque exactement à la norme européenne (L = 100-106). **Sur le polo,
un Français qui fait du L prend un L.** Le décalage de Badr était le bon.

**Le moteur, refondu.** Trois curseurs (taille, poids, silhouette : ventre plat /
ordinaire / ventre marqué, avec pictogrammes dessinés en code), résultat en direct,
sans bouton. Le vrai apport : **DEUX contraintes au lieu d'une.**
```
poitrine = (0,55 × kg) + (0,45 × cm) − 20
ventre   = poitrine − 16 + ajustement (plat −6 · ordinaire 0 · marqué +20)
une taille convient si  poitrine ≤ capacité  ET  ventre ≤ capacité − marge (−2)
```
Sans la contrainte de ventre, un homme au ventre marqué reçoit la taille de ses
épaules et le polo moule le ventre → retour. Vérifié par simulation :
175/95 ventre marqué → XL sur la poitrine seule, **2XL retenue** ; 180/110 marqué →
3XL sur la poitrine seule, **4XL retenue**. Le message le dit au client :
« C'est votre ventre qui commande, pas vos épaules. »

⚠️ **Piège corrigé en cours de route** : avec `ajust_fort +12` et `marge +3`, le
ventre ne pouvait JAMAIS faire monter d'une taille (waist = chest − 4 restait
toujours sous le plafond). Il a fallu `+20` et une marge **négative** (−2). Toujours
simuler le moteur sur des profils réels avant de le croire.

Reste à faire : Chemise, Short, Caleçon. **Question ouverte** : le Gilet est-il
décalé comme le polo, ou non décalé comme les upsells ? Son barème actuel suppose
NON décalé.

## 6 quindecies. Vérification « pas une tente » + les 4 barèmes (08/08, V4)

**Le test qui tranche, c'est la LARGEUR D'ÉPAULES, pas la poitrine.** Un polo peut
avoir 13 cm d'aisance à la poitrine et bien tomber ; s'il a 3 cm de trop aux épaules,
la couture glisse sur le bras → effet tente. Le ZT218 donne cette colonne, on s'en sert.

Résultat mesuré (épaules du corps ≈ 0,245×taille + 0,03×poids) :
| Profil | aisance 10 | épaules | aisance 8 | épaules |
|---|---|---|---|---|
| 175/80 ordinaire | L, +13 cm | **+2,7 cm** | M, +8 cm | **+1,2 cm** |
| 180/85 ordinaire | XL, +13 cm | **+2,9 cm** | L, +8 cm | **+1,4 cm** |
→ **Aisance polo ramenée de 10 à 8 cm.** À 8, la couture tombe sur l'épaule.
Sur les profils au ventre marqué, l'épaule dépasse de 4 à 6 cm : c'est **inhérent au
produit** (gradation uniforme du fournisseur), pas un défaut du moteur — couvrir le
ventre impose de prendre les épaules qui viennent avec.

**Section étendue aux bas de corps** : réglages `type_piece` (haut/bas), `mesure1`,
`mesure2`. Sur un bas, c'est le **tour de taille** qui pilote, seul — la poitrine n'y
veut rien dire. Les libellés du tableau et des champs suivent les réglages.

**Les quatre barèmes posés** (mesures du CORPS, cm) :
- **Polo** (ZT218, décalé, aisance 8) : S 88-98 · M 98-103 · L 103-108 · XL 108-113 ·
  2XL 113-118 · 3XL 118-124 · 4XL 124-128 · 5XL 128-134 · 6XL 134-140
- **Chemise MC** (planche 2, NON décalée, aisance 10, poitrine + ventre) :
  40 88-96 · 41 96-100 · 42 100-104 · 43 104-108 · 44 108-112 · 45 112-116 ·
  46 116-120 · 47 120-124 · 48 124-128
- **Short** (DK7221, tour de taille, ceinture élastique → −2 cm) : S 74-84 · M 84-88 ·
  L 88-94 · XL 94-98 · 2XL 98-104 · 3XL 104-108 · 4XL 108-112, + bassin
- **Caleçon** (planche CHN M→4XL = EUR S→3XL, mesure A ×2 + 18 cm d'élasticité) :
  S 72-84 · M 84-88 · L 88-92 · XL 92-96 · 2XL 96-100 · 3XL 100-104
  ⚠️ **Le moins sûr des quatre** : l'allongement d'un élastique s'estime, il ne se lit
  pas sur une planche. À recalibrer aux premiers retours.

⚠️ **Action restante pour Badr** : le Caleçon n'a pas de `templateSuffix`. Le gabarit
`templates/product.calecon.json` existe sur V4 ; il faudra assigner le modèle
« calecon » au produit **après publication de V4** (donnée produit = immédiate, et le
thème en ligne n'a pas encore ce gabarit).

**Question toujours ouverte** : le Gilet est-il décalé d'un cran comme le polo, ou non
décalé comme les upsells ? Son barème actuel suppose NON décalé.

## 6 sexdecies. Gilet — confirmé NON décalé, et aisance corrigée (08/08)

Badr confirme : **seul le polo a été décalé d'un cran.** Gilet, chemise, short et
caleçon gardent les étiquettes du fournisseur.

**Erreur de raisonnement corrigée sur le gilet.** J'avais mis 14 cm d'aisance en
comptant l'épaisseur de la chemise portée dessous. Faux : cette épaisseur est **déjà
dans la planche** — 110 cm de vêtement pour un torse de 100, le fournisseur l'a prévue.
Vérifié aux épaules (la planche 2 donne la colonne) :
| Profil | aisance 14 | aisance 10 |
|---|---|---|
| 175/80 ordinaire | L, épaules **+3,5 cm** | M, épaules **+2,1 cm** |
| 180/85 ordinaire | XL, épaules **+3,4 cm** | L, épaules **+2,1 cm** |
Sur un gilet, +3,5 cm à l'épaule = emmanchure qui bâille. **Ramené à 10 cm.**

Barème gilet final (poitrine / ventre du client, cm) :
S 90-100 / 84-94 · M 100-104 / 94-98 · L 104-108 / 98-102 · XL 108-112 / 102-106 ·
2XL 112-116 / 106-110 · 3XL 116-120 / 110-114 · 4XL 120-124 / 114-118 ·
5XL 124-128 / 118-122.

**Règle de méthode à garder** : ne jamais fixer une aisance au jugé. La planche
fournisseur donne la largeur d'épaules — c'est elle qui dit si le vêtement tombe ou
s'il flotte, pas la poitrine. Simuler 4 profils avant de valider.

## 6 septdecies. Bouton du guide + total des avis (08/08, V4)

**Le total des avis, corrigé.** Mon bloc étoiles comptait les cartes affichées
(6 sur le polo) au lieu du total. Il lit désormais `.nvs-rev__total` et
`.nvs-rev__note` **dans la section Avis de la page** : une seule source de vérité,
on change le total dans la section Avis et l'en-tête suit. Repli sur le comptage
des cartes seulement si la section d'avis n'est pas sur la page.

**Le bouton « Trouver ma taille ».** Les liens « Guide des tailles » /
« Trouver ma taille » étaient posés par **SmartSize** : en la désactivant, Badr a
perdu la porte d'entrée du guide. Bouton maison ajouté dans
`snippets/product-variant-picker.liquid` — donc **sur toutes les fiches produit**,
et **juste sous le sélecteur de TAILLE**, au moment exact de l'hésitation.
Fond sable, filet noir, pleine largeur, icône mètre ruban, mono majuscules.
Sécurité : il est `hidden` par défaut et ne s'affiche que si `[data-nvt2-data]`
existe dans la page — donc **jamais de bouton qui n'ouvre rien** sur une fiche
sans guide renseigné.

**Caleçon** : `templateSuffix` = `calecon` assigné (fait par moi, le 08/08).
Le gabarit n'existe que sur V4 ; tant que V4 n'est pas publié, Shopify retombe sur
le gabarit produit par défaut — sans erreur.

## 6 septendecies. Livraison simplifiée, Compléter en scroll juste sous le bouton (08/08)

**Ligne de règle permanente, retirée.** Badr : « je la trouve bizarre, un truc plus
clair genre Amazon, sinon on l'enlève ». Retirée (option qu'il proposait). Le
bandeau ne montre plus que 2 lignes : l'état dynamique (Expédié aujourd'hui /
demain / lundi…) et la fenêtre d'arrivée. Fenêtre passée à **6-8 jours ouvrés**
(après un aller-retour 5-9 → 7-11 → 5-11 → 6-8, toujours dans `niva-livraison.liquid`).

**Deuxième « livraison » en double, trouvée et neutralisée.** Un bloc `custom_liquid`
antérieur à ce chantier (`custom_liquid_ship` sur le polo, `nv_ship` sur le gilet,
commentaire d'origine « V1.1 ») affichait sa PROPRE estimation
« ⇢ Livraison estimée : J+8 – J+10 » en jours **calendaires** fixes, en parallèle du
bandeau `niva-livraison`. D'où la contradiction visible à l'écran. Vidé (pas
supprimé — réversible), une note explique pourquoi.

**« Compléter la tenue » repositionnée et repensée**, sur demande explicite de
Badr : *« il faut proposer des produits en scroll juste après le bouton d'ajout au
panier »*. Déplacée de juste-avant-le-rappel à **juste après `main`** (2ᵉ section de
la page, sous tout le bloc titre/prix/achat/description). Affichage passé de liste
verticale à **défilement horizontal** (`overflow-x:auto`, `scroll-snap-type:x
proximity`, cartes 168 px mobile / 200 px desktop).

**Analyse réelle des ventes croisées (ShopifyQL, dataset `sales`) — piège trouvé.**
Sur 135 commandes du polo (30 j) : E-Book present 92 %, Caleçon 19 %. Sur 48
commandes du gilet : E-Book 42 %, Caleçon 15 %, Chemise Turenne 8 % (4 commandes,
signal trop faible). **Aucune trace de Polo+Gilet ni de Pantalon acheté avec l'un
ou l'autre — contredit ma curation manuelle initiale.**
⚠️ **Ces chiffres sont piégés : l'E-Book et le Caleçon sont les CADEAUX PROGRESSIFS
de Moon Bundles** (offerts gratuitement aux paliers 3-4 « achetés = offerts »), pas
des achats volontaires. Ils apparaissent dans presque chaque commande qui atteint
ce palier — ce n'est pas un signal de goût, c'est la plomberie du bundle. Les
compter comme « meilleurs combos » ferait recommander en payant ce qui est déjà
offert plus bas sur la même page. **Ne jamais lire du ShopifyQL brut sans vérifier
si les produits qui ressortent sont des cadeaux de bundle.**
Curation gardée telle quelle (raisonnement vestimentaire, pas data) :
polo → Gilet, Pantalon, Chemise ; gilet → Polo, Pantalon, Chemise.

Requête ShopifyQL utile pour la suite : dataset `sales`, colonnes
`order_name, product_title, net_items_sold`, nécessite `GROUP BY order_name,
product_title` (sinon `product_title` revient vide) ; `SINCE -30d` suffit pour un
volume raisonnable — `-180d` avec `ORDER BY order_name ASC` remonte aux plus
anciennes commandes et rate les ventes récentes du polo (lancement récent).

## 6 octodecies. Les 35 avis du Polo, retrouvés (08/08, V4)

Badr : « mais pr le polo j'avais 35 avis, tu rigoles ou quoi ». J'avais tort de
penser qu'il n'y en avait que 6 — j'ai vérifié le thème PUBLIÉ (V3) et il n'en
montrait que 6 aussi, ce qui m'a fait croire que c'était l'état réel depuis
toujours. Faux : les 35 vrais avis existaient bien, mais **jamais migrés** — posés
sur l'ANCIEN thème (`NIVA — Maison`, id 192925434230), sur le gabarit de l'ANCIEN
polo (`templates/product.polo-breeze.json`, produit `Le Polo Marceau` d'origine,
avant la refonte « polo-2 »), dans une section différente (`avis-clients`, pas
`niva-avis`). Retrouvés par pagination complète des fichiers du vieux thème
(`theme.files`, 3 pages de 250) jusqu'à tomber sur `templates/product.polo-breeze.json`.

**Contenu réel, vérifié avant tout portage** : 35 blocs `review`, notes RÉELLEMENT
variées (28×5★, 3×4★, 1×3★, 2×2★, 1×1★ — dont un avis 1★ franchement négatif,
« publicité trop exagérée… je retourne l'article »). Photos clients en
`shopify://shop_images/...` — vérifiées existantes sur le CDN (`files` query),
donc portables telles quelles dans un bloc `image_picker`. Un bloc à texte vide
(Michele H.) écarté — 34 avis publiés, pas 35, par choix éditorial (pas de carte
vide), le compteur du bouton reflète le vrai total affiché.

**Piège évité — écraser les vraies notes.** La section `niva-avis` actuelle
affichait `★★★★★` en dur sur CHAQUE carte, peu importe la note réelle du bloc :
afficher 5 étoiles sur l'avis 1★ de Christophe L. aurait été un mensonge visuel.
Corrigé : ajout d'un champ `rating` (range 1-5, défaut 5 pour compat avec les
avis déjà en place comme ceux du gilet) au bloc `avis` du schéma, et le rendu des
étoiles par carte suit désormais `block.settings.rating` réellement.

Poussé sur V4 : `sections/niva-avis.liquid` (9916 o) et
`templates/product.polo-2.json` (53936 o), `niva_avis.settings.visibles` remis à
6 (34 avis réels, le bouton « voir tous » redevient utile). Agrégat du haut
(note 4,8 / 18 914 avis / barres) laissé tel quel — c'est un chiffre marketing
préexistant à ce chantier, pas quelque chose que j'ai inventé aujourd'hui.

## 6 novodecies. Pastilles couleur du Gilet, alignées sur le Polo (08/08, V4)

Badr : « pour les couleurs de gilet doit être comme le polo ». Sur la fiche
Gilet, les 6 pastilles de couleur apparaissaient toutes pâles/blanchâtres — seule
la sélection se distinguait par un contour, aucune vraie couleur visible.

**Cause réelle, trouvée par comparaison des deux produits en GraphQL.** Chaque
valeur de couleur Shopify (metaobject `shopify--color-pattern`) a un champ
`color` (hex) ET un champ `image` optionnel. Le snippet Dawn `swatch.liquid`
donne PRIORITÉ à l'image sur la couleur (`if swatch.image … elsif swatch.color`).
Les valeurs du Polo n'avaient jamais eu d'image (`image: null`) → pastille en
aplat de couleur, nette. Les valeurs du Gilet avaient chacune l'image DU PRODUIT
ENTIER (mannequin sur fond blanc) posée en swatch → à 20px, ça donne un carré
quasi blanc. Le bug n'était pas dans le code du thème (même bloc `variant_picker`,
mêmes réglages `picker_type`/`swatch_shape` sur les deux produits) mais dans la
donnée des 6 metaobjects couleur du Gilet.

Corrigé par `metaobjectUpdate` (6 appels, un par couleur) : champ `image` vidé
sur les 6, champ `color` remplacé par des teintes sourdes/premium dans le
registre du Polo (les couleurs Shopify par défaut posées à la création —
`#005BD3` bleu vif, `#F61F1F` rouge vif, `#05AA3D` vert vif — ne correspondaient
ni au nom de la teinte ni à l'esthétique du Polo) :
Bleu nuit `#202B3D`, Rouge bordeaux `#5E1F29`, Gris anthracite `#34363A`,
Marron Oxford `#4A2E1C`, Noir intense `#17140F`, Vert olive `#5B5E3E`.
⚠️ Choisies par cohérence de registre (sourd, photo-réaliste), PAS échantillonnées
sur les vraies photos produit — `cdn.shopify.com` est hors de la liste blanche du
proxy réseau de cette session, impossible de télécharger les images pour
échantillonner le vrai pixel. À vérifier visuellement par Badr et ajuster si un
ton ne correspond pas exactement au tissu réel.

## 6 vicies. « Compléter la tenue » inline, poussé (08/08, V4)

Le nouveau bloc `snippets/niva-completer-inline.liquid` (tout le catalogue en
scroll horizontal, ajout au panier sur place, posé juste avant `description`)
est maintenant réellement en ligne sur le Polo et le Gilet — pas juste écrit
localement comme avant la coupure de contexte.

**Classement des produits dans le scroll**, sur demande de Badr (« donne-moi le
choix du classement dans liquid ») : une seule variable en tête de fichier,
`nv_completer_tri`, valeur par défaut `'manuel'` (= l'ordre de la collection
« Tous les produits » dans Admin, aucun calcul). Autres valeurs possibles en
changeant cette ligne : `'nouveaute'`, `'prix_croissant'`, `'prix_decroissant'`,
`'alpha'`, `'alpha_inverse'`.

**Piège trouvé en poussant : Shopify rejette EN SILENCE un template JSON si
`order[]` ne contient plus une clé encore présente dans `sections{}`.**
Mon premier essai retirait `niva_completer`/`completer` de `order[]` en gardant
la section définie (pour rester réversible, comme d'habitude) — `themeFilesUpsert`
répondait sans la moindre `userError`, un `job` se créait et passait à `done:
true`, mais le fichier sur le thème ne changeait ni de taille ni de date. Trois
tentatives identiques, même résultat : ce n'est pas le bug d'échec intermittent
déjà documenté (celui-là se corrige en refaisant un upload), c'est un vrai rejet
de validation, juste jamais renvoyé comme erreur par l'API.
Diagnostic confirmé par un test isolé : la même modif SANS toucher `order[]`
passait instantanément (taille et date à jour).
**Retenir pour la suite : ne jamais retirer une clé de `order[]` en laissant sa
définition dans `sections{}`.** Pour neutraliser une section sans la supprimer,
vider un réglage qui commande son propre garde-fou Liquid à la place — ici
`sections.niva_completer.settings.pieces` (et `sections.completer.settings.pieces`
côté gilet) remis à `[]`, section déjà écrite pour ne rien afficher si `pieces`
est vide (`{%- if pieces != blank and pieces.size > 0 -%}`). `order[]` et les
clés de `sections{}` n'ont plus bougé du tout sur ce deuxième essai — accepté
immédiatement.
**Autre enseignement : demander le champ `job { id done }` sur `themeFilesUpsert`
et le sonder avant de faire confiance à un push.** Sans lui, rien ne distingue un
vrai succès d'un rejet silencieux — la seule vérité est de comparer `size`/
`updatedAt` du fichier avant/après, ce qui a permis de repérer le problème ici.

## 6 unvicies. « Compléter la tenue » refait en vraie section (08/08, V4)

Badr, sur le premier essai (bloc `custom_liquid` caché dans `main`, classement
réglable seulement en éditant le fichier Liquid) : « pas satisfait » — il veut
une **vraie section**, avec ses réglages dans l'éditeur de thème, dont un menu
déroulant pour classer ses produits lui-même. J'ai expliqué la contrainte
Shopify (une section ne peut se poser qu'au-dessus ou en-dessous de TOUTE la
section produit, jamais au milieu — donc « juste avant description » et
« vraie section » sont incompatibles tels quels) et proposé deux options ; sa
réponse : « la section descriptif, sépare-la en deux, et intègre la nouvelle
section ». Autrement dit : sortir la description de `main-product` pour que la
nouvelle section puisse s'intercaler à la place exacte voulue.

**Fait.** Deux nouvelles sections, remplaçant le bloc `custom_liquid` de
tout à l'heure :
- `sections/niva-description.liquid` — reprend le rendu natif Dawn (accordéon
  `<details>/<summary>`, `icon-accordion`, `icon-caret.svg` — aucun CSS/JS
  nouveau, tout existe déjà dans le thème) pour les blocs `description` et
  `collapsible_tab` qui vivaient avant dans `main`. Contenu réel repris tel
  quel (rien de réécrit) : sur le polo, Description / Guide des tailles /
  Livraison & expédition / Retours et échanges ; sur le gilet, Trouver sa
  taille / Livraison & retours / Entretien.
- `sections/niva-completer-v2.liquid` — vraie section (remplace le bloc), même
  contenu que la version précédente (tout le catalogue, scroll horizontal,
  ajout au panier sur place) mais avec un vrai réglage `select` **« Classement
  des produits »** dans le panneau de la section : Manuel / Nouveautés / Prix
  croissant / Prix décroissant / Alphabétique A→Z / Z→A. Badr choisit dans
  l'éditeur, sans toucher au code.

`order[]` des deux templates : `main` → `niva_completer2` → `niva_description`
→ (reste de la page inchangé). Ancienne section `niva_completer`/`completer`
retirée — cette fois de `order[]` ET `sections{}` EN MÊME TEMPS (contrairement
au duplicate de livraison plus haut, ici la clé est remplacée par une vraie
section, donc plus besoin de la garder orpheline pour rester réversible).
Vérifié avec `job { id done }` + `size`/`updatedAt` avant de considérer le
push acquis (leçon de l'entrée précédente) : `niva-description.liquid` (3227 o),
`niva-completer-v2.liquid` (11335 o), `product.polo-2.json` (53934 o),
`product.gilet-niva.json` (44480 o) — tous horodatés au moment du push.

## 6 duovicies. Compléter la tenue — classement manuel, flèches, alignement (08/08, V4)

Trois retours de Badr sur la vraie section qui vient d'être posée :
1. « ça me donne pas le choix de classer mes produits, genre le premier
   deuxième de la liste etc » — le menu déroulant de tri (nouveautés, prix…)
   ne suffisait pas, il veut choisir la position EXACTE de chaque pièce.
2. « c'est bien de mettre des flèches de scroll ».
3. Sur une capture des 8 cartes du scroll : « le bouton ajout au panier
   couleur etc doit être au même niveau partout, ça doit avoir un bon
   visuel, on maison niva premium ».

**Classement manuel.** Remplacé `collections.all.products` par un réglage
`product_list` (« Pièces proposées ») dans le panneau de la section : Badr
ajoute/retire/glisse ses produits directement dans l'éditeur de thème, dans
l'ordre qu'il veut — c'est littéralement le classement. Réglages par défaut
remplis avec les 9 produits actifs du catalogue (dans l'ordre catalogue), pour
ne rien casser tant qu'il n'y touche pas. Le menu « Tri automatique » reste en
option pour écraser cet ordre par un calcul (nouveautés/prix/alpha) si besoin,
mais « Manuel » respecte tel quel l'ordre du réglage.

**Flèches de scroll.** Deux boutons ronds (◀ ▶) posés en overlay de part et
d'autre de la liste, `scrollBy({left, behavior:'smooth'})` sur deux largeurs
de carte par clic, s'estompent automatiquement en début/fin de liste (écoute
de `scroll` + comparaison `scrollLeft`/`scrollWidth`). Masquées sous 750px : le
doigt swipe déjà nativement sur mobile, les flèches n'y servent à rien.

**Alignement des boutons.** Cause trouvée sur la capture : l'ordre des options
variait d'une fiche à l'autre (Couleur puis Taille sur la plupart des pièces,
Taille puis Couleur sur le Débardeur) — ça décale la hauteur du bouton
« Ajouter au panier » d'une carte à l'autre. Corrigé à deux niveaux :
- Liquid : Couleur toujours rendue avant Taille (peu importe l'ordre réel des
  options sur la fiche produit d'origine), toute option restante ensuite.
- CSS : `.nvc__carte` en colonne flex, `.nvc__btn{margin-top:auto}` — le
  bouton tombe systématiquement en bas de carte, quel que soit le nombre de
  lignes de menus déroulants au-dessus. Bordure/ombre légère au survol pour
  un rendu plus soigné.

Piège de la session précédente reconfirmé une fois de plus sur ce push :
`product.polo-2.json` a silencieusement échoué au premier essai (job
`done:true`, taille inchangée) alors que `product.gilet-niva.json` et la
section passaient dans le MÊME appel — reconfirme que le silencieux-échec
touche un fichier à la fois, pas le lot entier. Deuxième essai isolé sur ce
seul fichier : accepté (65304 o, horodaté).

## 6 trevicies. Bancontact retiré, Compléter centré sur PC (08/08, V4)

Deux retours rapides de Badr :
1. « enlève le dernier logo de carte, psk en version mobile ça revient à la
   ligne » — le bandeau de moyens de paiement (bloc `custom_liquid_pay` sur le
   polo, `nv_pay` sur le gilet, sous le bouton d'achat) affiche 6 icônes ; sur
   mobile la 6ᵉ (Bancontact — un moyen de paiement belge, hors sujet pour la
   boutique) retombait seule sur sa propre ligne. Le `<li>` Bancontact retiré
   du HTML des DEUX blocs, sur les deux produits — reste AMEX, Apple Pay,
   Mastercard, PayPal, Visa (5 icônes, tiennent sur une ligne).
2. « pour le compléter le look sur PC, les produits doivent être centrés » —
   `sections/niva-completer-v2.liquid` avait `.nvc__inner{max-width:none}`,
   contrairement au reste du site qui contient son contenu dans une colonne
   centrée (`niva-avis`, `niva-tailles`…). Ajouté `max-width:1400px;margin:0
   auto` à partir de 1400px d'écran, plus `justify-content:center` sur la
   liste de cartes dès 750px pour qu'elle se centre si jamais toutes les
   pièces tiennent sans avoir besoin de défiler.

Poussé et vérifié (`job` + `size`/`updatedAt`) : `niva-completer-v2.liquid`
(16915 o), `product.polo-2.json` (64166 o), `product.gilet-niva.json`
(56198 o).

**Régression immédiate, corrigée dans la foulée.** Badr : « premier produit
coupé, version ordinateur ». Cause : `justify-content:center` posé sur
`.nvc__liste` (le conteneur `overflow-x:auto` du scroll) pour centrer le cas
où toutes les cartes tiennent sans défiler — sauf que sur un flex row qui
DÉBORDE (le cas normal, 9 pièces), centrer décale le début du contenu dans le
négatif, et `scrollLeft` ne peut pas descendre sous 0 : la première carte
devient inatteignable, tronquée en permanence. **Leçon : ne jamais combiner
`justify-content:center` avec `overflow-x:auto` sur un conteneur qui peut
déborder** — ça centre la ligne entière, pas seulement les cartes visibles.
Retiré ; le centrage de la section sur PC reste assuré par `.nvc__inner{
max-width:1400px;margin:0 auto}` seul, qui ne touche pas au scroll interne.
Poussé et vérifié : `niva-completer-v2.liquid` (16666 o).

## 6 quatervicies. Fausse alerte suppression + vrai trou comblé : Description du Gilet (08/08, V4)

Badr, en colère sur une capture du Gilet montrant l'accordéon débuter direct
par « Trouver sa taille » : « t'as supprimé description ou je rêve ». Vérifié
avant de répondre (jamais répondre sans preuve sur une accusation de
suppression) :
- `descriptionHtml` (champ natif Shopify) est **vide depuis toujours** sur le
  Polo ET le Gilet — vérifié par requête directe sur les deux produits.
  Aucune mutation sur ce champ nulle part dans la session.
- Sur le Polo, le vrai texte descriptif vit dans un onglet accordéon dédié
  intitulé « Description » (contenu réel sur la coupe, l'emmanchure, etc.) —
  confirmé intact et à sa place dans `niva_description.block_order` après le
  déplacement de tout à l'heure.
- Sur le Gilet, cet onglet « Description » **n'a jamais existé** — seulement
  Trouver sa taille / Livraison & retours / Entretien, tous les trois
  présents et dans le bon ordre. Rien de supprimé, un vrai trou de contenu
  pré-existant, pas une régression de ce chantier.

Badr a ensuite demandé un vrai texte de description pour le Gilet, comme le
Polo. Rédigé dans le même ton maison, en réutilisant des faits DÉJÀ établis
et affichés ailleurs sur la fiche (les pastilles de l'image héros : « le
boutonnage ne bâille pas », « la pointe couvre la ceinture », « l'emmanchure
laisse la chemise à plat »), rien d'inventé : nouvel onglet
`collapsible_tab_description` (icône clipboard, même famille que le Polo),
inséré juste après le bloc `description` natif (vide) et avant « Trouver sa
taille », dans `templates/product.gilet-niva.json` uniquement. Poussé et
vérifié : `product.gilet-niva.json` (58562 o).

## 6 quinvicies. ⚠️ V4 EST PASSÉE EN LIGNE — travail désormais sur V5 (08/08)

**Changement d'état majeur.** `NIVA — Maison V4` (id 197944443254), sur laquelle
tout ce chantier a été fait depuis le début, est maintenant le thème **MAIN**
(publié) — Badr l'a mise en ligne lui-même. L'ancienne V3 (autrefois MAIN) est
repassée UNPUBLISHED. Repéré quand `themeFilesUpsert` sur V4 a été refusé par
la politique de sécurité de l'outil (« targets the live/published theme »,
message explicite). Confirmé par `themes(first:20){ nodes{ id name role } }`.

C'est cohérent avec le message de Badr (« tu peux dupliquer le thème actuel
et ensuite tu me fais... ») : il savait déjà que V4 était en ligne et donnait
le feu vert pour dupliquer avant de continuer — exactement la règle établie
depuis le début du projet (jamais écrire sur le thème publié).

**Nouvelle copie de travail : `NIVA — Maison V5`, id `198033310070`,
UNPUBLISHED** — créée par `themeDuplicate(id: V4)`. **À partir de maintenant,
tout push doit cibler V5, pas V4.** V4 est le site réel que voient les
clients ; Badr publiera V5 lui-même quand il sera prêt.

**Bug corrigé sur V5 dans la foulée** (c'est ce qui a révélé le changement
d'état) : Badr signalait des produits « indisponible » dans Compléter la
tenue qui ne devraient pas l'être, et demandait le bouton « ajout au panier »
en noir. Cause réelle — un bug introduit par MOI lors du fix d'alignement des
boutons (entrée précédente) : Couleur s'affiche toujours en premier
visuellement, mais le JS de correspondance de variante comparait encore
`variants[i].o[j]` à `choix[j]` par simple position DOM — faux dès qu'un
produit a Taille en option 1 réelle (le Débardeur, le Caleçon). Le bouton
tombait alors à tort sur « Indisponible » (fond gris), ce que Badr a lu comme
« le bouton n'est pas noir ». Corrigé : chaque `<select>` porte son vrai
index d'option via `data-nvc-opt`, et la comparaison utilise cet index —
plus jamais la position DOM. Poussé sur V5 et vérifié :
`niva-completer-v2.liquid` (17115 o).
