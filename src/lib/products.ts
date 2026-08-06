// Registre produits — pensé extensible. Aujourd'hui la gamme NIVAFIT = le polo
// + une famille d'upsells. De nouveaux produits principaux arriveront : il
// suffira d'ajouter une entrée ici (et son mapping dans products_map / le
// moteur) pour qu'ils remontent dans les vues produit et la répartition des
// dépenses, sans toucher à l'UI.

export type ProductKind = "polo" | "upsell";

export interface ProductDef {
  key: string; // product_key (aligné sur products_map / engine)
  label: string;
  emoji: string;
  kind: ProductKind;
  /** true = produit d'appel principal de la gamme. */
  hero?: boolean;
}

export const PRODUCTS: ProductDef[] = [
  { key: "POLO", label: "Polo NIVAFIT", emoji: "👕", kind: "polo", hero: true },
  { key: "GILET", label: "Gilet (Sully)", emoji: "🧥", kind: "upsell" },
  { key: "SHORT_SLEEVE_DRESS_SHIRT", label: "Chemise MC", emoji: "🩳", kind: "upsell" },
  { key: "LONG_SLEEVE_DRESS_SHIRT", label: "Chemise ML", emoji: "👔", kind: "upsell" },
  { key: "DRESS_TROUSERS", label: "Pantalon", emoji: "👖", kind: "upsell" },
  { key: "CHINO_SHORTS", label: "Short chino", emoji: "🩳", kind: "upsell" },
  { key: "COMPRESSION_TANK_TOP", label: "Débardeur", emoji: "🎽", kind: "upsell" },
  { key: "CALECON", label: "Caleçon", emoji: "🩲", kind: "upsell" },
  // NIRA Burn (booster, marché US, lancé 05/08) : produit d'appel à part
  // entière, PAS un upsell du polo. Ses ventes ne passent pas par les
  // boutiques Shopify branchées ici — CA et COGS saisis à la main (voir
  // manualRevenue.ts), seul le spend Meta arrive par l'API.
  { key: "NIRA_BURN", label: "NIRA Burn", emoji: "🔥", kind: "polo", hero: true },
];

const BY_KEY = new Map(PRODUCTS.map((p) => [p.key, p]));

export function getProduct(key: string): ProductDef | undefined {
  return BY_KEY.get(key);
}

export function productLabel(key: string): string {
  return BY_KEY.get(key)?.label ?? key;
}

export function productEmoji(key: string): string {
  return BY_KEY.get(key)?.emoji ?? "📦";
}
