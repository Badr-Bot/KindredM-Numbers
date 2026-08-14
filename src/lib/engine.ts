/**
 * Moteur de calcul pur NIVA — §4 du cahier des charges.
 *
 * Toutes les fonctions ici sont pures et travaillent exclusivement en
 * centimes (integers). Aucun float, aucun arrondi sauf là où le spec
 * l'exige explicitement (frais 4%, formule hors-grille).
 */

// CA = marché canadien (NIRA Burn, 06/08) : pas de boutique Shopify branchée,
// CA/COGS saisis à la main (manualRevenue.ts), spend Meta via API.
export type Market = "ES" | "UK" | "DE" | "FR" | "CA";

// ---------------------------------------------------------------------------
// §5 — Classification des commandes par line items
// ---------------------------------------------------------------------------

export interface LineItem {
  title: string;
  sku?: string;
  quantity: number;
  price_cents: number;
}

export interface ProductMapEntry {
  store: string;
  title_pattern: string;
  product_key: string;
  unit_group: "polo" | "upsell";
}

export interface ClassifiedOrder {
  poloQty: number;
  upsells: { productKey: string; qty: number }[];
}

export class UnmappedProductError extends Error {
  readonly title: string;
  constructor(store: string, title: string) {
    super(`Produit non mappé (fail loudly) : store=${store} title="${title}"`);
    this.name = "UnmappedProductError";
    this.title = title;
  }
}

function normalizeTitle(title: string): string {
  return title.trim().toLowerCase();
}

/**
 * Classe les line items d'une commande en bundle polo + upsells, en se basant
 * exclusivement sur products_map (jamais sur le prix total — §4.1).
 * Un titre non mappé fait échouer bruyamment (aucun produit silencieusement ignoré).
 */
export function classifyLineItems(
  lineItems: LineItem[],
  productsMap: ProductMapEntry[],
  store: string
): ClassifiedOrder {
  const patternsForStore = productsMap.filter((p) => p.store === store);
  const upsellQtyByKey = new Map<string, number>();
  let poloQty = 0;

  for (const item of lineItems) {
    const normalized = normalizeTitle(item.title);
    const match = patternsForStore.find(
      (p) => normalizeTitle(p.title_pattern) === normalized
    );
    if (!match) {
      throw new UnmappedProductError(store, item.title);
    }
    if (match.unit_group === "polo") {
      poloQty += item.quantity;
    } else {
      upsellQtyByKey.set(
        match.product_key,
        (upsellQtyByKey.get(match.product_key) ?? 0) + item.quantity
      );
    }
  }

  return {
    poloQty,
    upsells: Array.from(upsellQtyByKey, ([productKey, qty]) => ({ productKey, qty })),
  };
}

// ---------------------------------------------------------------------------
// §4.2 — COGS polo : grille DDP par pays de destination (EUR, centimes)
// ---------------------------------------------------------------------------

type PoloTier = 1 | 2 | 4;

const POLO_GRID_CENTS: Record<string, Record<PoloTier, number>> = {
  FR: { 1: 923, 2: 1506, 4: 2676 },
  IT: { 1: 997, 2: 1591, 4: 2771 },
  ES: { 1: 901, 2: 1487, 4: 2653 },
  DE: { 1: 936, 2: 1518, 4: 2649 },
  GB: { 1: 802, 2: 1330, 4: 2365 },
  BE: { 1: 991, 2: 1629, 4: 2899 },
  // CH : prix RÉELS relevés sur les factures Panda des 01 et 14/08 (56
  // commandes, constants sur les deux factures). Remplacent le repli
  // « max + 1,50 » qui surcomptait le x1/x2 et sous-comptait le x4.
  CH: { 1: 1027, 2: 1707, 4: 3144 },
};

// ---------------------------------------------------------------------------
// CANADA — prix RÉELS relevés sur les factures Panda (138 commandes), datés :
// le fournisseur a augmenté le x1 et le x2 de 1,00 € à partir de la facture
// du 14/08, qui commence à la commande #5463 (~02/08). Le x4 n'a PAS bougé
// (30,36 € = 27,90 + caleçon 2,46 sur LES DEUX factures — vérifié, ce n'est
// pas un oubli). Avant ces relevés, le Canada passait par le repli
// « max + 1,50 » qui surcomptait 2 à 3 € par commande (~330 € cumulés).
// ---------------------------------------------------------------------------
export const CA_POLO_PRICE_CHANGE_DAY = "2026-08-02"; // 1er jour de la facture 14/08
const CA_POLO_OLD_CENTS: Record<PoloTier, number> = { 1: 865, 2: 1460, 4: 2790 };
const CA_POLO_NEW_CENTS: Record<PoloTier, number> = { 1: 965, 2: 1560, 4: 2790 };

// §4.2/4.3 — pays non listé : plafond conservateur fixé par Badr.
const NON_LISTED_SURCHARGE_CENTS = 150;

function maxListedForTier<Tier extends number>(
  grid: Record<string, Record<Tier, number>>,
  tier: Tier
): number {
  return Math.max(...Object.values(grid).map((row) => row[tier]));
}

function poloGridValueCents(country: string, tier: PoloTier, day?: string): number {
  if (country === "CA") {
    // Sans jour fourni (repères, cartes) : prix COURANTS — jamais les anciens.
    return day && day < CA_POLO_PRICE_CHANGE_DAY ? CA_POLO_OLD_CENTS[tier] : CA_POLO_NEW_CENTS[tier];
  }
  const row = POLO_GRID_CENTS[country];
  if (row) return row[tier];
  return maxListedForTier(POLO_GRID_CENTS, tier) + NON_LISTED_SURCHARGE_CENTS;
}

/** COGS polo pour un bundle de `qty` pièces, livré dans `country` (ISO-2).
 * `day` (YYYY-MM-DD, jour de la commande) ne sert qu'aux pays à prix datés
 * (Canada) — omis, les prix COURANTS s'appliquent. */
export function poloCogsCents(country: string, qty: number, day?: string): number {
  if (qty <= 0) return 0;
  if (qty === 1 || qty === 2 || qty === 4) {
    return poloGridValueCents(country, qty, day);
  }
  // Quantités hors grille (ex. 3 polos, ou >4) : coût marginal par pièce
  // supplémentaire au-delà du bundle 2pcs (formule §4.2, appliquée aussi
  // au-delà de 4 en l'absence d'un palier explicite plus élevé — à confirmer
  // par Badr si des bundles >4 apparaissent en pratique).
  const g2 = poloGridValueCents(country, 2, day);
  const g1 = poloGridValueCents(country, 1, day);
  return Math.round(g2 + (g2 - g1) * (qty - 2));
}

// ---------------------------------------------------------------------------
// §4.3 — COGS upsells (produit + shipping add-on), EUR centimes
// ---------------------------------------------------------------------------

// Paliers de bundle 1 / 2 / 4 pièces (identiques au polo). La 3ᵉ colonne du
// tableau §4.3 du cahier des charges était étiquetée « 3 pcs » par erreur :
// ces prix sont ceux de 4 pièces (correction confirmée par Badr le 06/07/2026).
// Les valeurs sont inchangées, seul le palier passe de 3 à 4.
type UpsellTier = 1 | 2 | 4;

export const UPSELL_PRODUCT_KEYS = [
  "SHORT_SLEEVE_DRESS_SHIRT",
  "DRESS_TROUSERS",
  "COMPRESSION_TANK_TOP",
  "CHINO_SHORTS",
  "LONG_SLEEVE_DRESS_SHIRT",
  "GILET",
  "CALECON",
  // E-Book : produit NUMÉRIQUE, coût de revient réellement nul. Il était
  // absent du mapping, donc traité comme « produit inconnu » : 494 commandes
  // (478 FR + 16 ES) remontaient en alerte « COGS incomplet » à chaque
  // synchro, ce qui noyait les vraies alertes. Le mapper à 0 € ne change AUCUN
  // chiffre (la taxe UE est un forfait par commande, pas par produit) — ça
  // rend juste le 0 € assumé au lieu d'accidentel.
  "EBOOK",
] as const;
export type UpsellProductKey = (typeof UPSELL_PRODUCT_KEYS)[number];

// Le Gilet (paliers 1/2/3 + grille DDP propre) et le Caleçon (forfait à la
// pièce) ont chacun leur logique — jamais mélangés à UPSELL_GRID_CENTS pour ne
// prendre aucun risque sur les 5 upsells déjà validés au centime.
type StandardUpsellKey = Exclude<UpsellProductKey, "GILET" | "CALECON" | "EBOOK">;

const UPSELL_GRID_CENTS: Record<StandardUpsellKey, Record<string, Record<UpsellTier, number>>> = {
  SHORT_SLEEVE_DRESS_SHIRT: {
    FR: { 1: 689, 2: 1359, 4: 2003 },
    IT: { 1: 699, 2: 1378, 4: 2051 },
    ES: { 1: 692, 2: 1365, 4: 2032 },
    DE: { 1: 689, 2: 1340, 4: 1994 },
    GB: { 1: 625, 2: 1244, 4: 1849 },
    BE: { 1: 740, 2: 1462, 4: 2176 },
  },
  DRESS_TROUSERS: {
    FR: { 1: 984, 2: 1926, 4: 2873 },
    IT: { 1: 1000, 2: 1981, 4: 2956 },
    ES: { 1: 989, 2: 1959, 4: 2923 },
    DE: { 1: 967, 2: 1915, 4: 2857 },
    GB: { 1: 884, 2: 1750, 4: 2642 },
    BE: { 1: 1072, 2: 2125, 4: 3171 },
  },
  COMPRESSION_TANK_TOP: {
    FR: { 1: 316, 2: 613, 4: 903 },
    IT: { 1: 322, 2: 624, 4: 921 },
    ES: { 1: 318, 2: 617, 4: 909 },
    DE: { 1: 316, 2: 613, 4: 886 },
    GB: { 1: 278, 2: 536, 4: 799 },
    BE: { 1: 356, 2: 674, 4: 996 },
  },
  CHINO_SHORTS: {
    FR: { 1: 624, 2: 1229, 4: 1813 },
    IT: { 1: 632, 2: 1245, 4: 1851 },
    ES: { 1: 627, 2: 1235, 4: 1836 },
    DE: { 1: 624, 2: 1214, 4: 1805 },
    GB: { 1: 573, 2: 1137, 4: 1690 },
    BE: { 1: 678, 2: 1312, 4: 1951 },
  },
  LONG_SLEEVE_DRESS_SHIRT: {
    FR: { 1: 680, 2: 1324, 4: 1970 },
    IT: { 1: 692, 2: 1365, 4: 2031 },
    ES: { 1: 684, 2: 1348, 4: 2007 },
    DE: { 1: 667, 2: 1316, 4: 1957 },
    GB: { 1: 606, 2: 1193, 4: 1773 },
    BE: { 1: 745, 2: 1472, 4: 2191 },
  },
};

function upsellGridValueCents(
  productKey: StandardUpsellKey,
  country: string,
  tier: UpsellTier
): number {
  const grid = UPSELL_GRID_CENTS[productKey];
  const row = grid[country];
  if (row) return row[tier];
  return maxListedForTier(grid, tier) + NON_LISTED_SURCHARGE_CENTS;
}

// ---------------------------------------------------------------------------
// Gilet (Men's Herringbone Waistcoat) — devis "Panda Dropshipping" du
// 31/07/2026 : grille DDP par pays, mais paliers 1/2/3 pièces (pas 1/2/4
// comme les autres upsells), + Suisse (absente des autres grilles). Valeurs =
// colonne "Dropship Price" du devis (Product Cost + Shipping Cost, même
// principe DDP que le reste de la grille §4.3).
// ---------------------------------------------------------------------------

type GiletTier = 1 | 2 | 3;

const GILET_GRID_CENTS: Record<string, Record<GiletTier, number>> = {
  FR: { 1: 890, 2: 1720, 3: 2555 },
  IT: { 1: 898, 2: 1747, 3: 2594 },
  ES: { 1: 890, 2: 1729, 3: 2568 },
  DE: { 1: 872, 2: 1694, 3: 2515 },
  GB: { 1: 807, 2: 1564, 3: 2345 },
  CH: { 1: 1125, 2: 2078, 3: 3091 },
  BE: { 1: 959, 2: 1869, 3: 2777 },
};

function giletGridValueCents(country: string, tier: GiletTier): number {
  const row = GILET_GRID_CENTS[country];
  if (row) return row[tier];
  return maxListedForTier(GILET_GRID_CENTS, tier) + NON_LISTED_SURCHARGE_CENTS;
}

// ---------------------------------------------------------------------------
// Caleçon — grille par pays (Badr, 04/08/2026), déduite de la facture
// fournisseur Panda Dropshipping du 01/08/2026 (650 commandes) : pour
// chaque commande "1 polo/gilet (palier exact) + 1 caleçon", le delta entre
// le Subtotal facturé et le COGS polo/gilet connu est constant par pays —
// FR (35 échantillons) = 2,46 € pile ; BE (18 échantillons) = 2,74 € pile ;
// ES (1 échantillon) = 2,47 €. Remplace le forfait 2,00 €/pièce partout
// (Badr, 31/07) qui sous-estimait le vrai coût. Toujours linéaire (pas de
// palier par quantité), comme avant. Pays non listé : cf. surcharge §4.2.
// ---------------------------------------------------------------------------

const CALECON_GRID_CENTS: Record<string, number> = {
  FR: 246,
  BE: 274,
  ES: 247,
  // Prix RÉEL relevé sur les factures Panda 01+14/08 (déduit de 24 commandes
  // POLO+CALECON : 30,36 − 27,90 = 2,46, constant sur les deux factures).
  // Le repli « max + 1,50 » comptait 4,24 — 1,78 € de trop par caleçon CA.
  CA: 246,
};

function caleconUnitCogsCents(country: string): number {
  const value = CALECON_GRID_CENTS[country];
  if (value !== undefined) return value;
  return Math.max(...Object.values(CALECON_GRID_CENTS)) + NON_LISTED_SURCHARGE_CENTS;
}

/** COGS Caleçon : linéaire, prix/pièce par pays (grille ci-dessus) × quantité. */
function caleconCogsCents(country: string, qty: number): number {
  return qty <= 0 ? 0 : caleconUnitCogsCents(country) * qty;
}

/** COGS Gilet pour `qty` pièces, livré dans `country`. Paliers directs 1/2/3 ;
 * au-delà, coût marginal basé sur l'écart 2→3 pcs (dernier palier connu). */
function giletCogsCents(country: string, qty: number): number {
  if (qty <= 0) return 0;
  if (qty === 1 || qty === 2 || qty === 3) {
    return giletGridValueCents(country, qty);
  }
  const g3 = giletGridValueCents(country, 3);
  const g2 = giletGridValueCents(country, 2);
  return Math.round(g3 + (g3 - g2) * (qty - 3));
}

/**
 * COGS upsell pour `qty` pièces d'un `productKey`, livré dans `country`.
 * Paliers directs 1/2/4 (1/2/3 pour le Gilet, grille séparée) ; quantités
 * hors grille traitées comme le polo (§4.2) : coût marginal par pièce
 * supplémentaire = dernier écart de palier connu.
 */
export function upsellCogsCents(
  productKey: string,
  country: string,
  qty: number
): number {
  if (qty <= 0) return 0;
  if (productKey === "GILET") return giletCogsCents(country, qty);
  if (productKey === "CALECON") return caleconCogsCents(country, qty);
  // E-Book : numérique, coût réellement nul. SANS ce garde-fou, la clé passe
  // le contrôle ci-dessous (elle est dans UPSELL_PRODUCT_KEYS) puis va
  // chercher une grille qui n'existe pas → TypeError → le STORE ENTIER était
  // sauté par la synchro (« FR ignoré », constaté 06/08 : plus aucune commande
  // FR/ES enregistrée). Test de régression ajouté le même jour.
  if (productKey === "EBOOK") return 0;
  if (!UPSELL_PRODUCT_KEYS.includes(productKey as UpsellProductKey)) {
    throw new UnmappedProductError(country, `upsell inconnu: ${productKey}`);
  }
  const key = productKey as StandardUpsellKey;
  if (qty === 1 || qty === 2 || qty === 4) {
    return upsellGridValueCents(key, country, qty);
  }
  const g2 = upsellGridValueCents(key, country, 2);
  const g1 = upsellGridValueCents(key, country, 1);
  return Math.round(g2 + (g2 - g1) * (qty - 2));
}

// ---------------------------------------------------------------------------
// §4.3 bis — COGS NIRA « Thermogenic Support » (devis Panda Dropshipping,
// fourni par Badr le 12/08).
//
// ⚠️ EN DOLLARS, contrairement à TOUTES les autres grilles de ce fichier qui
// sont en EUR : le produit est acheté et vendu en USD (boutique Canada/US).
// D'où le suffixe `UsdCents` dans le nom — la conversion en EUR se fait au
// taux figé de l'entrée (manualRevenue.ts), jamais ici.
//
// Total = coût produit + livraison, tel que devisé (les deux lignes du devis
// sont additionnées : elles partent ensemble dans le même colis).
// Le produit n'a PAS de boutique Shopify branchée au dashboard : ses ventes
// arrivent par saisie manuelle, et cette grille remplace le « COGS annoncé
// à chaque vente » — désormais seul le nombre de packs est à donner.
// ---------------------------------------------------------------------------

export type NiraPackTier = 1 | 2 | 3 | 4;

const NIRA_GRID_USD_CENTS: Record<string, Record<NiraPackTier, number>> = {
  US: { 1: 1476, 2: 2391, 3: 3455, 4: 4517 },
  GB: { 1: 1126, 2: 1883, 3: 2641, 4: 3398 },
  CA: { 1: 1329, 2: 2226, 3: 3103, 4: 3980 },
  AU: { 1: 1380, 2: 1712, 3: 2044, 4: 2375 },
};

/**
 * COGS NIRA en CENTS USD pour `packs` packs livrés dans `country` (ISO-2).
 *
 * Au-delà de 4 packs : même règle d'extrapolation que le polo (coût marginal
 * du dernier palier connu), pour ne jamais renvoyer 0 sur un gros panier.
 * Pays hors devis (le devis ne couvre que US/GB/CA/AU) : on prend le plus
 * cher des pays devisés + la surcharge conservatrice habituelle, plutôt que
 * d'inventer un tarif ou de compter 0 — même convention que les autres
 * grilles (§4.2/§4.3).
 */
export function niraCogsUsdCents(country: string, packs: number): number {
  if (packs <= 0) return 0;
  const grid = NIRA_GRID_USD_CENTS[country.toUpperCase()];
  const tier = Math.min(packs, 4) as NiraPackTier;
  const value = grid
    ? grid[tier]
    : Math.max(...Object.values(NIRA_GRID_USD_CENTS).map((g) => g[tier])) +
      NON_LISTED_SURCHARGE_CENTS;
  if (packs <= 4) return value;
  // >4 packs : coût marginal 3→4 packs appliqué aux packs supplémentaires.
  const g4 = grid ? grid[4] : value;
  const g3 = grid
    ? grid[3]
    : Math.max(...Object.values(NIRA_GRID_USD_CENTS).map((g) => g[3])) +
      NON_LISTED_SURCHARGE_CENTS;
  return Math.round(g4 + (g4 - g3) * (packs - 4));
}

// ---------------------------------------------------------------------------
// §4.4 — Taxe UE (règle révisée par Badr le 04/08/2026, forfait par colis)
//   • 3,00 € FORFAITAIRE PAR COLIS expédié en UE — indépendant du nombre ou
//     du type de produits dedans (frais de douane/traitement, pas une taxe
//     produit). Confirmé par la facture fournisseur Panda Dropshipping du
//     01/08/2026 : la colonne Tax est à 3,00 € sur 518/520 commandes UE,
//     JAMAIS 6/9/12€ même sur des commandes multi-produits (ex: polo +
//     pantalon + short = toujours 3€, pas 9€) — et une commande 100 %
//     caleçons a aussi été taxée 3€. Remplace l'ancienne règle "3€ ×
//     produits distincts" (06/07) et l'exemption caleçon (03/08), toutes
//     deux fausses : elle sur-taxait les commandes multi-produits et
//     sous-comptait certaines commandes caleçon-only.
//   • Uniquement si le PAYS DE DESTINATION est dans l'UE (basé sur
//     shipping_country, pas sur le store). GB/UK, CH, CA, US… = 0 €.
// ---------------------------------------------------------------------------

export const EU_TAX_PER_ORDER_CENTS = 300;
export const EU_TAX_START_DATE = "2026-07-01"; // inclusif, jour Europe/Paris (YYYY-MM-DD)

/** Pays membres de l'UE (ISO-2). GB exclu depuis le Brexit. */
export const EU_COUNTRIES: ReadonlySet<string> = new Set([
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR",
  "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK",
  "SI", "ES", "SE",
]);

export function isEuCountry(country: string): boolean {
  return EU_COUNTRIES.has(country.toUpperCase());
}

/**
 * Taxe UE d'une commande : forfait 3 €/colis, uniquement si la destination
 * est dans l'UE, la commande contient au moins un article, et la date ≥
 * 2026-07-01. `day` au format YYYY-MM-DD (jour Europe/Paris).
 */
export function euTaxCents(shippingCountry: string, day: string, hasItems: boolean): number {
  if (day < EU_TAX_START_DATE) return 0;
  if (!isEuCountry(shippingCountry)) return 0;
  if (!hasItems) return 0;
  return EU_TAX_PER_ORDER_CENTS;
}

// ---------------------------------------------------------------------------
// §4.4 bis — Coûts fixes PAR COMMANDE : packaging + carte de remerciement
// (annoncés par Badr le 12/08, PAS ENCORE ACTIFS — il donnera la date).
//
// ⚠️ INACTIF tant que `PER_ORDER_EXTRAS_START_DATE` vaut null : la fonction
// renvoie 0, donc aucun chiffre du dashboard ne bouge aujourd'hui. Activer =
// poser la date ici (une seule ligne), puis bumper REQUIRED_RECOMPUTE_VERSION
// pour que les jours concernés se recalculent.
//
// Date gérée comme la taxe UE (EU_TAX_START_DATE) : coût appliqué à partir du
// jour d'entrée en vigueur INCLUS, jamais rétroactivement — les commandes
// d'avant n'ont réellement pas supporté ce coût, les charger ferait mentir
// l'historique.
//
// PAR COMMANDE (un colis = un packaging + une carte), pas par produit :
// même logique que le forfait 3 €/colis de la taxe UE.
// ---------------------------------------------------------------------------

export const PACKAGING_COST_CENTS = 35; // 0,35 €
export const THANKS_CARD_COST_CENTS = 3; // 0,03 €
export const PER_ORDER_EXTRAS_CENTS = PACKAGING_COST_CENTS + THANKS_CARD_COST_CENTS; // 0,38 €

/**
 * Jour d'entrée en vigueur (YYYY-MM-DD, Europe/Paris), INCLUS.
 * `null` = pas encore actif — Badr doit fournir la date.
 */
export const PER_ORDER_EXTRAS_START_DATE: string | null = null;

/**
 * Coût packaging + carte de remerciement d'une commande, en centimes.
 * 0 tant que la date n'est pas fixée, avant cette date, ou si la commande
 * est vide (aucun colis expédié → aucun packaging consommé).
 */
export function perOrderExtrasCents(day: string, hasItems: boolean): number {
  if (PER_ORDER_EXTRAS_START_DATE === null) return 0;
  if (day < PER_ORDER_EXTRAS_START_DATE) return 0;
  if (!hasItems) return 0;
  return PER_ORDER_EXTRAS_CENTS;
}

// ---------------------------------------------------------------------------
// §4.5 — Frais : les frais Shopify RÉELS, rien d'autre (calculés sur
// l'agrégat jour/marché — voir daily_aggregates, seule table qui porte
// fees_cents).
//
// Révision Badr 12/08/2026 : le forfait « autres 1 % » est SUPPRIMÉ (« ça ne
// correspond à rien, je veux les vrais frais »). Le poste Frais = uniquement
// les frais lus par commande (shopifyFees.ts), repli 3 % pour les commandes
// pas encore re-scannées. Recalculé sur tout l'historique (voir
// REQUIRED_RECOMPUTE_VERSION dans incrementalSync.ts).
//
// Révision Badr 27/07/2026 (toujours valable) : la TVA 5,5 % n'est PAS une
// dépense — argent collecté pour l'État, provisionné à part, jamais déduite
// du net.
//
// 06/08 : les frais Shopify ne sont plus estimés, ils sont LUS par commande
// (shopifyFees.ts). Mesuré sur 50 commandes réelles du store FR : 6,54 % du CA
// (4,67 % traitement + 1,87 % change) contre 3 % modélisés — 2,2× trop bas.
// Le taux varie par commande selon la carte (2,70 / 3,70 / 4,30 / 4,99 %
// observés le même mois), donc aucune moyenne n'est utilisable.
// ---------------------------------------------------------------------------

/** Repli tant que les frais réels d'une commande ne sont pas encore lus. */
export const SHOPIFY_FEES_FALLBACK_RATE = 0.03;
// Estimation pour les repères (seuils par produit, cartes) là où le détail
// par commande n'existe pas. Était 4 % (3 % Shopify + 1 % « autres ») jusqu'à
// la suppression du forfait autres le 12/08 — alignée sur le repli depuis.
export const FEES_RATE = SHOPIFY_FEES_FALLBACK_RATE;

/** Repli à l'ancien taux : garantit qu'une commande pas encore re-scannée
 * garde exactement le comportement d'avant (3 %), plutôt que de tomber à
 * zéro et de gonfler le net pendant la transition. */
export function fallbackShopifyFeeCents(caCents: number): number {
  return Math.round(caCents * SHOPIFY_FEES_FALLBACK_RATE);
}

/** @deprecated Estimation forfaitaire. Conservée pour les repères (seuils
 * par produit, cartes) là où le détail par commande n'est pas disponible ;
 * le net, lui, passe par computeDailyAggregate. */
export function feesCentsForCa(caCents: number): number {
  return Math.round(caCents * FEES_RATE);
}

// ---------------------------------------------------------------------------
// Par commande : COGS + taxe (les frais ne se calculent qu'à l'agrégat)
// ---------------------------------------------------------------------------

export interface OrderForEngine {
  store: Market;
  shippingCountry: string;
  day: string; // jour Europe/Paris, YYYY-MM-DD
  poloQty: number;
  upsells: { productKey: string; qty: number }[];
}

export interface OrderCogsTax {
  cogsProductCents: number;
  cogsUpsellsCents: number;
  taxCents: number;
}

export function computeOrderCogsTax(order: OrderForEngine): OrderCogsTax {
  const cogsProductCents = poloCogsCents(order.shippingCountry, order.poloQty, order.day);
  const cogsUpsellsCents = order.upsells.reduce(
    (sum, u) => sum + upsellCogsCents(u.productKey, order.shippingCountry, u.qty),
    0
  );
  const taxCents = euTaxCents(
    order.shippingCountry,
    order.day,
    order.poloQty > 0 || order.upsells.length > 0
  );
  return { cogsProductCents, cogsUpsellsCents, taxCents };
}

// ---------------------------------------------------------------------------
// Variantes TOLÉRANTES — « une vente ne se perd jamais »
//
// Les versions strictes ci-dessus lèvent une erreur dès qu'un titre ou une
// clé d'upsell est inconnu. Dans le pipeline de synchro, cela faisait
// disparaître la commande entière du CA — voire tout le lot du store (constaté
// 26/07 : 12 ventes réelles, 1 affichée, à cause du « Caleçon Ultra
// Extensible » absent des grilles). Le CA est la donnée la plus critique du
// dashboard : on enregistre TOUJOURS la vente, on calcule le COGS de ce qu'on
// connaît, et on remonte la liste des produits à mapper.
// Les versions strictes restent la référence (tests, calculs hors synchro).
// ---------------------------------------------------------------------------

export interface TolerantClassification extends ClassifiedOrder {
  /** titres de line items absents de products_map */
  unknownTitles: string[];
  /** nb de produits distincts non reconnus (pour la taxe UE) */
  unknownDistinctCount: number;
}

/** Comme classifyLineItems, mais collecte les titres inconnus au lieu d'échouer. */
export function classifyLineItemsTolerant(
  lineItems: LineItem[],
  productsMap: ProductMapEntry[],
  store: string
): TolerantClassification {
  const patternsForStore = productsMap.filter((p) => p.store === store);
  const upsellQtyByKey = new Map<string, number>();
  const unknown = new Set<string>();
  let poloQty = 0;

  for (const item of lineItems) {
    const normalized = normalizeTitle(item.title);
    const match = patternsForStore.find((p) => normalizeTitle(p.title_pattern) === normalized);
    if (!match) {
      unknown.add(item.title);
      continue;
    }
    if (match.unit_group === "polo") {
      poloQty += item.quantity;
    } else {
      upsellQtyByKey.set(
        match.product_key,
        (upsellQtyByKey.get(match.product_key) ?? 0) + item.quantity
      );
    }
  }

  return {
    poloQty,
    upsells: Array.from(upsellQtyByKey, ([productKey, qty]) => ({ productKey, qty })),
    unknownTitles: [...unknown],
    unknownDistinctCount: unknown.size,
  };
}

export interface TolerantOrderCogsTax extends OrderCogsTax {
  /** clés d'upsell mappées mais absentes des grilles §4.3 */
  unknownUpsellKeys: string[];
}

/**
 * Comme computeOrderCogsTax, mais un upsell hors grille est compté 0 € de COGS
 * et signalé, au lieu de faire échouer la commande. Le Net est donc
 * LÉGÈREMENT SUR-ESTIMÉ tant que le produit n'est pas mappé — c'est assumé et
 * signalé bruyamment : mieux vaut un coût manquant visible qu'une vente
 * invisible.
 */
export function computeOrderCogsTaxTolerant(
  order: OrderForEngine & { unknownDistinctCount?: number }
): TolerantOrderCogsTax {
  const cogsProductCents = poloCogsCents(order.shippingCountry, order.poloQty, order.day);
  const unknownUpsellKeys: string[] = [];
  let cogsUpsellsCents = 0;
  for (const u of order.upsells) {
    try {
      cogsUpsellsCents += upsellCogsCents(u.productKey, order.shippingCountry, u.qty);
    } catch (err) {
      if (err instanceof UnmappedProductError) unknownUpsellKeys.push(u.productKey);
      else throw err;
    }
  }
  const taxCents = euTaxCents(
    order.shippingCountry,
    order.day,
    order.poloQty > 0 || order.upsells.length > 0 || (order.unknownDistinctCount ?? 0) > 0
  );
  return { cogsProductCents, cogsUpsellsCents, taxCents, unknownUpsellKeys };
}

// ---------------------------------------------------------------------------
// Agrégation jour/marché (daily_aggregates) — §4.7 net(jour, marché)
// ---------------------------------------------------------------------------

export interface DailyAggregateInput {
  orders: number;
  caCents: number; // CA net des remboursements du jour (comportement "Total sales")
  spendCents: number;
  cogsCents: number; // cogsProduct + cogsUpsells, sommé sur la journée
  taxCents: number; // sommé sur la journée
  /** Frais Shopify réels du jour (null/absent = pas encore lus → repli 3 %). */
  shopifyFeeCents?: number | null;
}

export interface DailyAggregate extends DailyAggregateInput {
  feesCents: number;
  netCents: number;
}

/**
 * net(jour, marché) = CA − spend − COGS − taxeUE − frais.
 *
 * `shopifyFeeCents` = frais Shopify RÉELS du jour, sommés depuis les commandes
 * (shopifyFees.ts). Omis/null → repli sur l'ancienne estimation 3 %, ce qui
 * reproduit exactement le comportement d'avant le 06/08 : les jours pas encore
 * re-scannés ne bougent pas d'un centime, et bascule­ront au vrai chiffre au
 * passage du re-scan.
 *
 * 12/08 (Badr) : le forfait « autres 1 % » n'est PLUS ajouté — le poste Frais
 * ne contient que les frais Shopify (réels ou repli).
 */
export function computeDailyAggregate(input: DailyAggregateInput): DailyAggregate {
  const feesCents = input.shopifyFeeCents ?? fallbackShopifyFeeCents(input.caCents);
  const netCents =
    input.caCents - input.spendCents - input.cogsCents - input.taxCents - feesCents;
  return { ...input, feesCents, netCents };
}

// ---------------------------------------------------------------------------
// §4.7 — Formules (marge, ROAS, seuils dynamiques)
// ---------------------------------------------------------------------------

/** null si CA = 0 (pas de marge définie) */
export function marginPct(netCents: number, caCents: number): number | null {
  return caCents === 0 ? null : netCents / caCents;
}

/** ROAS réel = CA Shopify / spend Meta. null si spend = 0 (jamais le ROAS rapporté par Meta). */
/**
 * MER (Marketing Efficiency Ratio) = CA TOTAL ÷ spend TOTAL.
 *
 * ⚠️ Renommé le 12/08 (Badr : « c'est pas un ROAS mais un MER »). Il avait
 * raison et le mauvais nom était trompeur :
 *  • MER  = tout le CA (pub + organique + direct + e-mail + récurrents) ÷ spend.
 *    Mesure l'efficacité GLOBALE de la boutique. C'est ce que le dashboard
 *    affiche partout, et c'est à lui que se comparent les seuils de
 *    rentabilité dérivés de la marge de contribution (`roasBreakEven`,
 *    `roasTarget15` — noms historiques, mais bien des seuils de MER).
 *  • ROAS = CA attribué à la pub ÷ spend. Toujours PLUS BAS que le MER, et
 *    dépend de la source d'attribution (Meta, ou UTM Shopify).
 * Les confondre fait juger une campagne sur un chiffre qui inclut des ventes
 * qu'elle n'a pas générées.
 */
export function mer(caCents: number, spendCents: number): number | null {
  return spendCents > 0 ? caCents / spendCents : null;
}

/** ROAS = CA attribué à la pub ÷ spend. Même formule, sens différent : ce qui
 *  change est le NUMÉRATEUR (CA attribué, jamais le CA total). */
export function roasFromAttributed(attributedCaCents: number, spendCents: number): number | null {
  return spendCents > 0 ? attributedCaCents / spendCents : null;
}

/** CM (marge de contribution, avant pub) = (CA − COGS − taxe − frais) / CA */
export function contributionMargin(
  caCents: number,
  cogsCents: number,
  taxCents: number,
  feesCents: number
): number | null {
  if (caCents === 0) return null;
  return (caCents - cogsCents - taxCents - feesCents) / caCents;
}

/** ROAS break-even = 1 / CM */
export function roasBreakEven(cm: number): number {
  return 1 / cm;
}

/** Marge nette visée par le protocole Master (validé Badr 03/08, aligné
 * dashboard 04/08 — avant : 20 %). Sert au ROAS cible ET au seuil de
 * validité de la cible (cm doit dépasser la marge visée, sinon pas de
 * cible définissable). */
export const TARGET_NET_MARGIN = 0.15;

/** ROAS cible 15% net (Master) = 1 / (CM − 0,15) */
export function roasTarget15(cm: number): number {
  return 1 / (cm - TARGET_NET_MARGIN);
}

export type RoasStatus = "red" | "yellow" | "green";

/** 🔴 sous break-even · 🟡 entre BE et cible · 🟢 ≥ cible */
export function roasStatus(
  roasValue: number | null,
  breakEven: number,
  target: number
): RoasStatus {
  if (roasValue === null) return "red";
  if (roasValue < breakEven) return "red";
  if (roasValue < target) return "yellow";
  return "green";
}
