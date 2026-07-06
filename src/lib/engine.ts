/**
 * Moteur de calcul pur NIVA — §4 du cahier des charges.
 *
 * Toutes les fonctions ici sont pures et travaillent exclusivement en
 * centimes (integers). Aucun float, aucun arrondi sauf là où le spec
 * l'exige explicitement (frais 9,5%, formule hors-grille).
 */

export type Market = "ES" | "UK" | "DE" | "FR";

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
  constructor(store: string, title: string) {
    super(`Produit non mappé (fail loudly) : store=${store} title="${title}"`);
    this.name = "UnmappedProductError";
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
};

// §4.2/4.3 — pays non listé : plafond conservateur fixé par Badr.
const NON_LISTED_SURCHARGE_CENTS = 150;

function maxListedForTier<Tier extends number>(
  grid: Record<string, Record<Tier, number>>,
  tier: Tier
): number {
  return Math.max(...Object.values(grid).map((row) => row[tier]));
}

function poloGridValueCents(country: string, tier: PoloTier): number {
  const row = POLO_GRID_CENTS[country];
  if (row) return row[tier];
  return maxListedForTier(POLO_GRID_CENTS, tier) + NON_LISTED_SURCHARGE_CENTS;
}

/** COGS polo pour un bundle de `qty` pièces, livré dans `country` (ISO-2). */
export function poloCogsCents(country: string, qty: number): number {
  if (qty <= 0) return 0;
  if (qty === 1 || qty === 2 || qty === 4) {
    return poloGridValueCents(country, qty);
  }
  // Quantités hors grille (ex. 3 polos, ou >4) : coût marginal par pièce
  // supplémentaire au-delà du bundle 2pcs (formule §4.2, appliquée aussi
  // au-delà de 4 en l'absence d'un palier explicite plus élevé — à confirmer
  // par Badr si des bundles >4 apparaissent en pratique).
  const g2 = poloGridValueCents(country, 2);
  const g1 = poloGridValueCents(country, 1);
  return Math.round(g2 + (g2 - g1) * (qty - 2));
}

// ---------------------------------------------------------------------------
// §4.3 — COGS upsells (produit + shipping add-on), EUR centimes
// ---------------------------------------------------------------------------

type UpsellTier = 1 | 2 | 3;

export const UPSELL_PRODUCT_KEYS = [
  "SHORT_SLEEVE_DRESS_SHIRT",
  "DRESS_TROUSERS",
  "COMPRESSION_TANK_TOP",
  "CHINO_SHORTS",
  "LONG_SLEEVE_DRESS_SHIRT",
] as const;
export type UpsellProductKey = (typeof UPSELL_PRODUCT_KEYS)[number];

const UPSELL_GRID_CENTS: Record<UpsellProductKey, Record<string, Record<UpsellTier, number>>> = {
  SHORT_SLEEVE_DRESS_SHIRT: {
    FR: { 1: 689, 2: 1359, 3: 2003 },
    IT: { 1: 699, 2: 1378, 3: 2051 },
    ES: { 1: 692, 2: 1365, 3: 2032 },
    DE: { 1: 689, 2: 1340, 3: 1994 },
    GB: { 1: 625, 2: 1244, 3: 1849 },
    BE: { 1: 740, 2: 1462, 3: 2176 },
  },
  DRESS_TROUSERS: {
    FR: { 1: 984, 2: 1926, 3: 2873 },
    IT: { 1: 1000, 2: 1981, 3: 2956 },
    ES: { 1: 989, 2: 1959, 3: 2923 },
    DE: { 1: 967, 2: 1915, 3: 2857 },
    GB: { 1: 884, 2: 1750, 3: 2642 },
    BE: { 1: 1072, 2: 2125, 3: 3171 },
  },
  COMPRESSION_TANK_TOP: {
    FR: { 1: 316, 2: 613, 3: 903 },
    IT: { 1: 322, 2: 624, 3: 921 },
    ES: { 1: 318, 2: 617, 3: 909 },
    DE: { 1: 316, 2: 613, 3: 886 },
    GB: { 1: 278, 2: 536, 3: 799 },
    BE: { 1: 356, 2: 674, 3: 996 },
  },
  CHINO_SHORTS: {
    FR: { 1: 624, 2: 1229, 3: 1813 },
    IT: { 1: 632, 2: 1245, 3: 1851 },
    ES: { 1: 627, 2: 1235, 3: 1836 },
    DE: { 1: 624, 2: 1214, 3: 1805 },
    GB: { 1: 573, 2: 1137, 3: 1690 },
    BE: { 1: 678, 2: 1312, 3: 1951 },
  },
  LONG_SLEEVE_DRESS_SHIRT: {
    FR: { 1: 680, 2: 1324, 3: 1970 },
    IT: { 1: 692, 2: 1365, 3: 2031 },
    ES: { 1: 684, 2: 1348, 3: 2007 },
    DE: { 1: 667, 2: 1316, 3: 1957 },
    GB: { 1: 606, 2: 1193, 3: 1773 },
    BE: { 1: 745, 2: 1472, 3: 2191 },
  },
};

function upsellGridValueCents(
  productKey: UpsellProductKey,
  country: string,
  tier: UpsellTier
): number {
  const grid = UPSELL_GRID_CENTS[productKey];
  const row = grid[country];
  if (row) return row[tier];
  return maxListedForTier(grid, tier) + NON_LISTED_SURCHARGE_CENTS;
}

/** COGS upsell pour `qty` pièces d'un `productKey`, livré dans `country`. */
export function upsellCogsCents(
  productKey: string,
  country: string,
  qty: number
): number {
  if (qty <= 0) return 0;
  if (!UPSELL_PRODUCT_KEYS.includes(productKey as UpsellProductKey)) {
    throw new UnmappedProductError(country, `upsell inconnu: ${productKey}`);
  }
  const key = productKey as UpsellProductKey;
  if (qty === 1 || qty === 2 || qty === 3) {
    return upsellGridValueCents(key, country, qty);
  }
  const g3 = upsellGridValueCents(key, country, 3);
  const g2 = upsellGridValueCents(key, country, 2);
  return Math.round(g3 + (g3 - g2) * (qty - 3));
}

// ---------------------------------------------------------------------------
// §4.4 — Taxe UE : 3,00€ par commande
// ---------------------------------------------------------------------------

/** Stores soumis à la taxe UE. Modifiable en 1 ligne (FR à confirmer par Badr). */
export const EU_TAX_STORES: readonly Market[] = ["ES", "DE", "FR"];
export const EU_TAX_CENTS = 300;
export const EU_TAX_START_DATE = "2026-07-01"; // inclusif, jour Europe/Paris (YYYY-MM-DD)

/** `day` doit être le jour Europe/Paris au format YYYY-MM-DD (comparaison lexicographique valide). */
export function euTaxCents(store: Market, day: string): number {
  return EU_TAX_STORES.includes(store) && day >= EU_TAX_START_DATE
    ? EU_TAX_CENTS
    : 0;
}

// ---------------------------------------------------------------------------
// §4.5 — Frais : 9,5% du CA (calculé sur l'agrégat jour/marché, jamais commande
// par commande — voir daily_aggregates, seule table qui porte fees_cents)
// ---------------------------------------------------------------------------

export const FEES_RATE = 0.095;
export const FEES_BREAKDOWN_RATES = { tva: 0.055, shopify: 0.03, autres: 0.01 } as const;

export function feesCentsForCa(caCents: number): number {
  return Math.round(caCents * FEES_RATE);
}

export interface FeesBreakdown {
  tvaCents: number;
  shopifyCents: number;
  autresCents: number;
}

/** Décomposition pour la vue §6.5. Arrondis indépendants : la somme peut différer de feesCentsForCa() de 1 centime. */
export function feesBreakdownForCa(caCents: number): FeesBreakdown {
  return {
    tvaCents: Math.round(caCents * FEES_BREAKDOWN_RATES.tva),
    shopifyCents: Math.round(caCents * FEES_BREAKDOWN_RATES.shopify),
    autresCents: Math.round(caCents * FEES_BREAKDOWN_RATES.autres),
  };
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
  const cogsProductCents = poloCogsCents(order.shippingCountry, order.poloQty);
  const cogsUpsellsCents = order.upsells.reduce(
    (sum, u) => sum + upsellCogsCents(u.productKey, order.shippingCountry, u.qty),
    0
  );
  const taxCents = euTaxCents(order.store, order.day);
  return { cogsProductCents, cogsUpsellsCents, taxCents };
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
}

export interface DailyAggregate extends DailyAggregateInput {
  feesCents: number;
  netCents: number;
}

/** net(jour, marché) = CA − spend − COGS − taxeUE − frais(9,5%) — §4.7 */
export function computeDailyAggregate(input: DailyAggregateInput): DailyAggregate {
  const feesCents = feesCentsForCa(input.caCents);
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
export function roas(caCents: number, spendCents: number): number | null {
  return spendCents > 0 ? caCents / spendCents : null;
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

/** ROAS cible 20% net = 1 / (CM − 0,20) */
export function roasTarget20(cm: number): number {
  return 1 / (cm - 0.2);
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
