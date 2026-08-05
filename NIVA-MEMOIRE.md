# NIVA — Mémoire de travail

> Fichier de reprise. À lire en premier au début de chaque session.
> Objectif : ne jamais reperdre le contexte, et économiser des tokens
> (on lit ce fichier au lieu de re-scanner Shopify).

Dernière mise à jour : 2026-08-05

---

## 1. Règles absolues (données par Badr)

1. **Aucune suppression, aucun retrait, aucune désactivation sans permission explicite.**
   (S'applique aux sections, textes, images, blocs, produits, pages.)
2. Le **polo est prioritaire** sur tout le reste.
3. **La police est un point non négociable** : aucun texte hors des 3 fontes de la charte.
4. La marque est **basée à Paris**. Micro-entreprise **Adnane El Boussaadani**.
   « PARIS » doit rester partout où il était.
5. Adresse e-mail unique : **contact@mynivashop.com**. L'autre (myniva@outlook.com) doit disparaître.
6. Un **agent de vérification** doit repasser derrière chaque lot de demandes et forcer
   la correction jusqu'au résultat attendu.

---

## 2. Identifiants Shopify

| Objet | ID / valeur |
|---|---|
| Boutique | mynivashop.com |
| Thème **LIVE** — NE JAMAIS ÉCRIRE DESSUS | `gid://shopify/OnlineStoreTheme/192925434230` — « NIVA — Maison » |
| Thème **de travail** (non publié) | `gid://shopify/OnlineStoreTheme/197881692534` — « NIVA — Maison V1 (brouillon) » |
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

Il reste **~22 anciens médias** en fin de galerie (résidus des niches précédentes).
→ **En attente de la permission de Badr pour les retirer.**

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

## 6. Nommage proposé (à valider)

La **collection** = *Nivafit* (la coupe ajustée). Chaque **pièce** prend un nom de rue parisienne.

| Pièce | Nom proposé | État |
|---|---|---|
| Polo | **Le Polo Marceau** | ✅ appliqué |
| Gilet | Le Gilet Sully | à valider |
| Pantalon extensible | Le Pantalon Rivoli | à valider |
| Chemise manches courtes | La Chemise Turenne | à valider |
| Short extensible | Le Short Cassini | à valider |
| Ceinture | La Ceinture Bréguet | à valider |
| Chaussettes | Les Chaussettes Vosges | à valider |

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
