import { getShopifyStoreConfigs, iterateOrders } from "./shopify";
import { UPSELL_PRODUCT_KEYS } from "./engine";

export const BACKFILL_SINCE_ISO = "2026-06-04T00:00:00+02:00";

const KNOWN_UPSELL_PATTERNS: Record<string, RegExp> = {
  SHORT_SLEEVE_DRESS_SHIRT: /short.?sleeve.*dress.*shirt/i,
  DRESS_TROUSERS: /dress.*trouser/i,
  COMPRESSION_TANK_TOP: /compression.*tank/i,
  CHINO_SHORTS: /chino.*short/i,
  LONG_SLEEVE_DRESS_SHIRT: /long.?sleeve.*dress.*shirt/i,
};

export function guessUnitGroup(title: string): "polo" | "upsell" {
  return /polo/i.test(title) ? "polo" : "upsell";
}

export function guessProductKey(title: string): string {
  if (/polo/i.test(title)) return "POLO";
  for (const [key, pattern] of Object.entries(KNOWN_UPSELL_PATTERNS)) {
    if (pattern.test(title)) return key;
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
