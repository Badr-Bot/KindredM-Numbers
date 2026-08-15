# Style du checkout — maison NIVA

Le checkout doit ressembler à la boutique. Aujourd'hui il est resté au style
Shopify par défaut (coins arrondis, bleu, police système) alors que le thème
live est ivoire/encre, coins carrés, Poppins : la rupture se voit au moment
exact où le client paie.

Ce document donne les valeurs exactes à appliquer. Elles ne sont pas
inventées : toutes recopiées du thème live **`NIVA — Maison V6`**
(`config/settings_data.json` de `mynivashop.com`).

---

## 1. Ce qui est possible, et ce qui ne l'est pas

| Voie | Statut |
|---|---|
| Éditeur de checkout (Paramètres → Paiement → Personnaliser) | ✅ **disponible sur Advanced** — c'est la voie à suivre |
| API `checkoutBrandingUpsert` (script automatique) | ❌ **Plus / boutique de dev uniquement** |

Vérifié en direct sur `mynivashop.com` (plan Advanced) :

> `Access denied for checkoutBranding field. Required access: access to checkout
> branding settings and the shop must be on a Plus plan or a Development store plan.`

La mutation n'est même pas exposée dans le schéma Admin de la boutique (ni
`checkoutBrandingUpsert`, ni son successeur `checkoutAndAccountsConfigurationUpdate`).
Donc : **saisie manuelle dans l'éditeur**, une fois par store (ES, UK, DE, FR).

Le payload complet reste versionné (`src/lib/checkoutBranding.ts`) et
s'applique en une commande le jour d'un passage Plus :

```bash
npm run checkout-branding -- --market FR            # dry-run
npm run checkout-branding -- --market FR --apply    # envoie
```

---

## 2. Palette maison (thème V6)

| Rôle | Hex | Origine dans le thème |
|---|---|---|
| Encre — texte, boutons pleins, icônes | `#151515` | `text` / `button` de tous les schémas |
| Ivoire — fond principal | `#FAF9F6` | `scheme-1 background` |
| Crème — fond du récapitulatif | `#F7F3EB` | `scheme-2 background` |
| Sable clair — survol bouton secondaire | `#F2ECE1` | `scheme-3 background` |
| Sable — filets, séparateurs | `#E8E1D4` | `scheme-5 background` |
| Encre atténuée — bordure des champs | `#7C7C7A` | encre à 55 % sur ivoire (`inputs_border_opacity: 55`) |

Pas de bleu, pas de gris Shopify. Les couleurs d'erreur/succès restent celles
de Shopify : au checkout, la lisibilité d'un message d'erreur passe avant la
charte.

**Typo** : Poppins (`type_body_font` et `type_header_font` = `poppins_n4`),
graisse de base 400, gras 600.

**Coins** : `0` partout. Le thème est à 0 sur les boutons, les champs, les
cartes, les médias, les popups — le checkout doit l'être aussi.

**Ombres** : aucune (`*_shadow_opacity: 0` dans tout le thème).

---

## 3. Procédure — éditeur de checkout

Paramètres → Paiement → **Personnaliser** (section Checkout).

### Logo et favicon
- Logo : `niva-logo-noir.png` (déjà dans les fichiers de la boutique, c'est
  celui de l'en-tête du thème), largeur **120 px**, position **en ligne**,
  alignement **gauche**.
- Favicon : `niva-favicon-beige.png`.

### Couleurs
| Zone | Réglage |
|---|---|
| Fond du formulaire (schéma 1) | `#FAF9F6`, texte `#151515`, bordure `#E8E1D4` |
| Fond du récapitulatif (schéma 2) | `#F7F3EB`, texte `#151515`, bordure `#E8E1D4` |
| Champs | fond `#FAF9F6`, texte `#151515`, bordure `#7C7C7A` |
| Champ sélectionné | fond `#151515`, texte `#FAF9F6` |
| Bouton principal | fond `#151515`, texte `#FAF9F6`, survol `#000000` |
| Bouton secondaire | fond transparent, contour + texte `#151515`, survol `#F2ECE1` |
| Accent / liens | `#151515` |

### Typographie
- Police principale **et** secondaire : Poppins (400 / 600).
- Taille de base **14**, échelle **1,15**.
- **Titres en capitales, interlettrage large** — c'est la signature maison
  (H1 taille moyenne, graisse normale : l'espacement fait l'élégance, pas le
  gras).
- Corps de texte : casse normale, interlettrage normal.

### Formes
- Rayon des coins : **aucun** (réglage global « sans arrondi »).
- Champs et sélecteurs : bordure **complète**, étiquette **à l'intérieur**.
- Vignettes produit : bordure complète, coins carrés, image en **cover**.
- Sections : **fond transparent, sans bordure** — le thème est plat, pas de
  cartes flottantes.
- Bouton principal : padding vertical **large** (bouton haut, plein largeur).
- Boutons de paiement express : coins carrés eux aussi.

### Structure
- En-tête : logo à gauche, séparé par un filet, lien panier en icône.
- Fil d'ariane (étapes) : visible.
- Pied de page : en bas, aligné à gauche, séparé par un filet.

---

## 4. À faire sur les 4 stores

Le style se règle **par boutique** : ES, UK, DE, FR ont chacune leur éditeur.
FR fait ~90 % du volume → commencer par FR, vérifier une vraie commande, puis
répliquer.

Après application, contrôler sur mobile (majorité du trafic) : c'est là que le
bouton noir plein largeur et les capitales espacées se jugent.
