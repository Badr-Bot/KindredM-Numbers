# Business, produits, prix

> Qui on est, ce qu'on vend, à quel prix. Change rarement — si ça change ici, ça change partout ailleurs (grilles COGS, seuils, mapping produits).
>
> Mémoire Kindred — chargée automatiquement via `CLAUDE.md`.
> Mise à jour à chaque changement de règle, jamais en double ailleurs.

## Business
- Kindred LLC / marque Niva (mynivashop.com). 4 stores Shopify ES/UK/DE/FR (FR ≈ 90 % du volume). Compte Meta : act_919559773962419.
- Associés : Adnane (début seul), Badr 50/50 par boutique (ES/UK/DE dès 20/06, FR dès 14/07).
- Badr : non-technique, français, sur téléphone, veut de l'autonomie totale, zéro tolérance aux chiffres faux.

## Produits & prix (mesurés sur vraies commandes)
- **Polo** (principal) : 2 pcs 59,98 € · 4 pcs 89,99 € (pas d'offre 1/3 pcs). Toutes les campagnes SAUF Lancaster.
- **Gilet** (2e principal, lancé 27/07) : 1 pc 49,98 € · 2 pcs 79,98 € · 3 pcs 104,97 €. Campagne dédiée « CBO - LANCASTER » (id 120248705036500495) + sa propre landing.
- **Upsells** (jamais de carte/campagne à eux) : Caleçon (souvent offert), chemises, débardeur, pantalon, short, E-Book. Comptés dans le produit principal de LEUR commande.

## Rebranding « rues parisiennes » (05/08)
- Titres Shopify FR renommés : **Le Polo Marceau** (POLO) · **Le Gilet Sully** (GILET) · **La Chemise Turenne** (SHORT_SLEEVE) · **Le Pantalon Rivoli** (DRESS_TROUSERS) · **Le Short Cassini** (CHINO_SHORTS). Mêmes produits, mêmes grilles COGS — seuls les titres changent.
- Le moteur mappe par **titre EXACT** (products_map) : tout renommage Shopify sort les ventes du comptage tant que le nouveau titre n'est pas chargé. Réflexe à avoir à CHAQUE renommage : ajouter la ligne dans products_map + bumper `REQUIRED_FULL_RESYNC_VERSION`.
- **Caleçon : jamais mappé depuis le début** (découvert 05/08) → COGS compté 0 € sur tout l'historique alors qu'il est offert dans une grosse part des commandes → Net légèrement SURESTIMÉ depuis le 04/06. Mapping FR + ES chargé le 05/08, resync v8 déclenchée pour corriger l'historique.
