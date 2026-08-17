---
name: produit-audit
description: Auditer les fiches produit Shopify sur les 4 boutiques (ES, UK, DE, FR) et livrer une liste de corrections classée par impact sur le chiffre d'affaires. Utiliser quand on demande d'auditer une fiche produit, d'améliorer une page produit, de vérifier la cohérence entre boutiques, de corriger des descriptions, ou pourquoi une page ne convertit pas. Déclencheurs : audit fiche produit, page produit, améliorer la conversion, cohérence boutiques, description produit, SEO produit.
---

# produit-audit

Quatre boutiques, un même catalogue : la valeur est autant dans la
**cohérence entre marchés** que dans la qualité d'une fiche isolée.

## Étape 0 — Cadrer

Un produit ? une collection ? tout le catalogue ? Sur quelle(s) boutique(s) ?
Au-delà de ~20 produits, auditer un échantillon représentatif d'abord et
faire valider la grille avant de dérouler le catalogue entier.

## Étape 1 — Tirer les fiches

`search_products` / `get-product` sur chaque boutique (`switch-shop` pour
changer de marché). Pour ce qui n'a pas d'outil dédié — metafields,
traductions, publications — passer par `graphql_query`.

Récupérer : titre, description, images (nombre, ordre, alt), variantes,
prix, stock, SEO title/description, handle, tags, collections, metafields.

## Étape 2 — Auditer, par ordre d'impact sur le CA

**1. Ce qui bloque l'achat** (à corriger en premier, toujours)
- rupture de stock non signalée, variante indisponible
- prix incohérent entre marchés au-delà de l'écart voulu (TVA, shipping)
- image principale absente, floue, ou qui ne montre pas le produit
- description vide, tronquée, ou restée en anglais sur ES/DE/FR

**2. Ce qui coûte des conversions**
- le bénéfice principal n'est pas visible sans scroller
- l'objection principale n'est traitée nulle part
- moins de 4 images, ou pas de photo d'usage / d'échelle
- pas de contenu rassurant : livraison, retours, composition
- titre qui décrit la marque au lieu du produit

**3. Cohérence inter-boutiques**
- même produit, angles de vente divergents sans raison
- traduction littérale au lieu d'une adaptation au marché
- tags et collections qui divergent → navigation cassée sur un marché

**4. SEO**
- SEO title absent ou > 60 caractères ; meta description absente ou > 155
- handle incohérent avec le titre
- textes alternatifs d'images vides

## Étape 3 — Le rapport

Un tableau par produit : **Problème · Marché(s) · Gravité · Correction
proposée · Effort**. Trié par gravité, jamais par ordre de catalogue.

Pour chaque correction de texte, **écrire le texte final**, prêt à coller.
« Améliorer la description » n'est pas une correction, c'est un vœu.

## Règles

- **Ne jamais modifier un produit sans validation explicite.** L'audit
  propose ; l'utilisateur applique. Si une modification est demandée
  explicitement, la faire produit par produit, jamais en masse d'un coup.
- Les textes produits respectent le ton défini dans `BRAND.md`.
- Adapter au marché, ne pas traduire mot à mot : un argument qui marche en
  FR peut tomber à plat en DE.
- Ne jamais inventer une caractéristique produit, une composition, ni un
  délai de livraison. En cas de doute, marquer « à confirmer ».
- Ne jamais écrire un avis client, ni un chiffre de vente non vérifié.
