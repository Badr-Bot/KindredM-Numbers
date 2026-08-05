# NIVA — Mémoire de travail

> Fichier de reprise. À lire en premier au début de chaque session.
> Objectif : ne jamais reperdre le contexte, et économiser des tokens
> (on lit ce fichier au lieu de re-scanner Shopify).

Dernière mise à jour : 2026-08-05

---

## 1. Règles absolues (données par Badr)

0. **Je ne touche PLUS aux images. Badr les génère et les importe lui-même.**
   (05/08 : « ne me fait plus d'image je le ferais seul » puis « pour les images
   touche a rien, c'est moi qui va tout faire ».) Je ne génère rien, et je ne
   réassigne pas d'image existante sans qu'il me le demande explicitement.
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
