import { getShopifyStoreConfigs, iterateOrders } from "./shopify";
import { UPSELL_PRODUCT_KEYS } from "./engine";

export const BACKFILL_SINCE_ISO = "2026-06-04T00:00:00+02:00";

// Titres localisés par store (EN/FR/DE/ES) — observés sur les vraies
// boutiques. L'ordre des clés compte : les motifs les plus spécifiques
// d'abord. Tout titre non reconnu reste A_VALIDER (§5, fail loudly).
const KNOWN_UPSELL_PATTERNS: Record<string, RegExp[]> = {
  SHORT_SLEEVE_DRESS_SHIRT: [
    /short.?sleeve.*shirt/i,
    /chemise.*manches?\s*courtes?/i,
    /kurzarm.*hemd/i,
    /camisa.*manga\s*corta/i,
  ],
  LONG_SLEEVE_DRESS_SHIRT: [
    /long.?sleeve.*shirt/i,
    /chemise.*(manches?\s*longues?|infroissable)/i,
    /langarm.*hemd/i,
    /camisa.*(manga\s*larga|antiarrugas)/i,
  ],
  DRESS_TROUSERS: [
    /dress.*trouser|trousers/i,
    /pantalon(?!\s*court)/i,
    /anzugs?hose|\bhose\b/i,
    /pantal[oó]n(?!\s*corto)|pantalones/i,
  ],
  COMPRESSION_TANK_TOP: [
    /compression.*tank|tank.*top/i,
    /d[ée]bardeur/i,
    /unterhemd|kompression/i,
    /camiseta.*(tirantes|compresi[oó]n)/i,
  ],
  CHINO_SHORTS: [
    /chino.*short/i,
    /\bshorts?\b/i,
    /kurze\s*hose|bermuda/i,
    /pantal[oó]n\s*corto/i,
  ],
};

// Le polo a porté d'autres noms selon les stores/époques : « T-shirt
// ultra-confortable » (FR, ancien titre — confirmé par Badr le 14/07, aucun
// t-shirt distinct au catalogue) et équivalents localisés probables.
const POLO_PATTERNS = [
  /polo/i,
  /t-?shirt\s*ultra-?confortable/i,
  /camiseta\s*ultra-?c[oó]mod/i,
  /ultra-?bequemes?\s*t-?shirt/i,
];

function isPolo(title: string): boolean {
  return POLO_PATTERNS.some((p) => p.test(title));
}

export function guessUnitGroup(title: string): "polo" | "upsell" {
  return isPolo(title) ? "polo" : "upsell";
}

export function guessProductKey(title: string): string {
  if (isPolo(title)) return "POLO";
  for (const [key, patterns] of Object.entries(KNOWN_UPSELL_PATTERNS)) {
    if (patterns.some((p) => p.test(title))) return key;
  }
  return "A_VALIDER";
}

export { UPSELL_PRODUCT_KEYS };

export interface DiscoveredTitle {
  title: string;
  frequency: number;
  guessedProductKey: string;
  guessedUnitGroup: "polo" | "upsell";
}

export interface StoreDiscovery {
  market: string;
  domain: string;
  titles: DiscoveredTitle[];
  error?: string;
}

/** §5 — Liste les titres de line items distincts par store depuis le lancement. */
export async function discoverProducts(): Promise<StoreDiscovery[]> {
  const configs = getShopifyStoreConfigs();
  const results: StoreDiscovery[] = [];

  for (const config of configs) {
    try {
      const counts = new Map<string, number>();
      for await (const order of iterateOrders(config, { createdAtMin: BACKFILL_SINCE_ISO })) {
        for (const item of order.line_items) {
          counts.set(item.title, (counts.get(item.title) ?? 0) + item.quantity);
        }
      }
      const titles: DiscoveredTitle[] = [...counts.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([title, frequency]) => ({
          title,
          frequency,
          guessedProductKey: guessProductKey(title),
          guessedUnitGroup: guessUnitGroup(title),
        }));
      results.push({ market: config.market, domain: config.domain, titles });
    } catch (err) {
      results.push({
        market: config.market,
        domain: config.domain,
        titles: [],
        error: (err as Error).message,
      });
    }
  }

  return results;
}
