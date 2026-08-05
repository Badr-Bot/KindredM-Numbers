# Rendre le bundle digne de la maison — mode d'emploi

Application : **Moon Bundles** (blocs `shopify://apps/moon-bundles*` déjà installés
sur le thème). Tout se fait dans l'app, sauf l'habillage qui est déjà géré par
`assets/niva-theme.css`.

---

## Ce qui ne va pas aujourd'hui

| Ce qu'on voit | Pourquoi ça abîme la marque |
|---|---|
| `€79,99` barré → `€59,98` | Le prix barré n'a jamais été pratiqué. En France, un prix de référence doit avoir été pratiqué **dans les 30 jours** précédents (art. L.112-1-1 C. conso). Risque réel, et le client le sent. |
| `€159,98` barré → `€59,98` (−62 %) | Une maison ne fait pas −62 %. Ça dit « la vraie valeur, c'est 59 € », donc « le produit ne vaut pas son prix ». |
| `€319,96` barré → `€89,99` (−72 %) | Même chose, en pire. |
| « 1 acheté = 1 OFFERT », « 2 achetés = 2 OFFERTS / 23€ chacun » | Vocabulaire de rayon promo. Aucune maison ne parle comme ça. |
| E-book « L'art de sublimer sa carrure » à `€24,99` offert | Marqueur de dropshipping immédiatement identifiable. |
| Rubans noirs « Le plus populaire » / « Le plus rentable » | Le mot « rentable » parle de **votre** marge, pas du client. |
| Icône camion + pastille « Gratuit » | Bruit visuel. La livraison offerte se dit une fois, en toutes lettres. |

---

## La structure à mettre à la place

On ne vend plus « X offerts », on vend **un vestiaire qui se constitue**.
Le prix unitaire baisse quand on prend plusieurs pièces — c'est honnête, lisible,
et ça reste avantageux sans jamais annoncer un pourcentage.

| Palier | Nom | Contenu | Prix | Prix à la pièce | Étiquette |
|---|---|---|---|---|---|
| 1 | **La pièce** | 1 polo | 59,98 € | 59,98 € | *(aucune)* |
| 2 | **Le duo** | 2 polos | 107,96 € | 53,98 € la pièce | LE CHOIX DE LA MAISON |
| 3 | **Le vestiaire** | 4 polos | 199,92 € | 49,98 € la pièce | — |

Aucun prix barré. Aucun pourcentage. Le seul chiffre mis en avant sous le prix,
c'est le **prix à la pièce** — c'est lui qui fait comprendre l'intérêt.

> Si tu veux garder l'idée d'un cadeau, remplace l'e-book par
> **« Le guide du tombé — offert avec Le duo »**, sans prix barré à côté.
> Un cadeau qui affiche sa valeur barrée n'est plus un cadeau, c'est une remise.

---

## Les étapes, dans l'ordre

### 1. Ouvrir le bundle
Admin Shopify → **Applications** → **Moon Bundles** → onglet **Bundles** →
ouvrir celui rattaché au polo.

### 2. Renommer les paliers
Dans chaque « offer / tier », remplacer le titre :

- `1 Polo Nivafit` → **La pièce**
- `1 acheté = 1 OFFERT` → **Le duo**
- `2 achetés = 2 OFFERTS / 23€ chacun` → **Le vestiaire**

Et le sous-titre :
- palier 2 : *Deux coloris. Un pour la semaine, un pour le reste.*
- palier 3 : *De quoi tenir la semaine sans y penser.*

### 3. Couper les prix barrés
Dans **Settings → Pricing display** (ou « Compare at price » selon la version),
désactiver **Show compare-at price / Show discount badge**.
Si l'option n'existe pas au niveau du bundle, il faut vider le champ
**Prix comparé** de chaque variante du produit dans Shopify
(Produits → Le Polo Marceau → Variantes → *Prix barré* = vide).

### 4. Reprendre les prix
Palier 1 : `59,98 €` · palier 2 : `107,96 €` · palier 3 : `199,92 €`.
Dans **Discount type**, choisir un **montant fixe par palier** plutôt qu'un
pourcentage : le client voit un prix, pas une remise.

### 5. Afficher le prix à la pièce
Champ **Badge / label** ou **Description** de chaque palier :
- palier 2 : `53,98 € la pièce`
- palier 3 : `49,98 € la pièce`

### 6. Reprendre les étiquettes
- « Le plus populaire » → **LE CHOIX DE LA MAISON**
- « Le plus rentable » → supprimer l'étiquette (une seule mise en avant, sinon
  plus rien ne ressort)

### 7. Traiter le cadeau
Soit on retire l'e-book, soit on le garde en enlevant son prix barré `€24,99`
et en le renommant **Le guide du tombé — offert**.
👉 *À trancher par toi : je ne retire rien sans ton accord.*

### 8. Livraison
Retirer la ligne « Livraison Offerte / Gratuit » **à l'intérieur** du bundle :
elle est déjà dite dans le bandeau du haut et sous le bouton d'ajout au panier.
La répéter trois fois la banalise.
👉 *À trancher par toi.*

### 9. Sélecteurs couleur / taille
Les garder — ils sont utiles. Ils prendront automatiquement l'habillage de la
charte (voir plus bas).

### 10. Vérifier
Prévisualiser le thème brouillon, ajouter chaque palier au panier, et contrôler
que le prix affiché dans le panier correspond bien au prix annoncé.

---

## L'habillage : déjà fait, rien à toucher

La section **18** de `assets/niva-theme.css` force déjà tous les blocs d'application
(`.shopify-app-block`, `[id^="shopify-block-"]`) à la charte : fond ivoire, filets
1 px, rayon 0, aucune ombre, titres en Jost, étiquettes en JetBrains Mono, images
sans arrondi. Le widget Moon Bundles hérite donc automatiquement :

- les rubans noirs deviennent des étiquettes JetBrains Mono 9,5 px, fond transparent,
  filet 1 px — beaucoup plus sobres ;
- les coins arrondis passent à 0 ;
- les prix passent en Instrument Sans 500, couleur noir #151515 ;
- les boutons passent en JetBrains Mono, noir plein, rayon 0.

Si après tes modifications un élément du bundle échappe encore à la charte,
note sa **classe CSS** (clic droit → Inspecter) et je l'ajoute à la section 18.

---

## Ordre de priorité si tu n'as que 10 minutes

1. **Les prix barrés** (étape 3) — c'est le point juridique **et** le plus visible.
2. **Les noms des paliers** (étape 2) — c'est ce qui change le ton en une seconde.
3. Le reste peut attendre.
