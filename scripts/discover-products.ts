/**
 * Phase découverte (§5) — à lancer EN LOCAL avec les vrais tokens Shopify
 * dans .env.local, avant tout backfill.
 *
 *   npm run discover-products
 *
 * Liste les titres de line items distincts par store (titres localisés
 * FR/ES/DE/EN) avec leur fréquence, et écrit un brouillon products_map dans
 * products_map.draft.json. Rien n'est inséré en base : le brouillon doit être
 * relu et validé par Badr avant d'être chargé dans products_map (§5 — aucun
 * produit ne doit rester non mappé silencieusement).
 */
import "./load-env";
import { writeFileSync } from "node:fs";
import { getShopifyStoreConfigs, iterateOrders } from "../src/lib/shopify";

const BACKFILL_SINCE = "2026-06-04T00:00:00+02:00";

const KNOWN_UPSELL_PATTERNS: Record<string, RegExp> = {
  SHORT_SLEEVE_DRESS_SHIRT: /short.?sleeve.*dress.*shirt/i,
  DRESS_TROUSERS: /dress.*trouser/i,
  COMPRESSION_TANK_TOP: /compression.*tank/i,
  CHINO_SHORTS: /chino.*short/i,
  LONG_SLEEVE_DRESS_SHIRT: /long.?sleeve.*dress.*shirt/i,
};

function guessUnitGroup(title: string): "polo" | "upsell" {
  return /polo/i.test(title) ? "polo" : "upsell";
}

function guessProductKey(title: string): string {
  if (/polo/i.test(title)) return "POLO";
  for (const [key, pattern] of Object.entries(KNOWN_UPSELL_PATTERNS)) {
    if (pattern.test(title)) return key;
  }
  return "A_VALIDER";
}

interface DraftRow {
  store: string;
  title_pattern: string;
  frequency: number;
  product_key: string;
  unit_group: "polo" | "upsell";
}

async function main() {
  const configs = getShopifyStoreConfigs();
  const draft: DraftRow[] = [];

  for (const config of configs) {
    const counts = new Map<string, number>();
    console.log(`\n=== ${config.market} (${config.domain}) ===`);
    for await (const order of iterateOrders(config, { createdAtMin: BACKFILL_SINCE })) {
      for (const item of order.line_items) {
        counts.set(item.title, (counts.get(item.title) ?? 0) + item.quantity);
      }
    }
    const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
    for (const [title, qty] of sorted) {
      console.log(`  ${String(qty).padStart(5)}  ${title}`);
      draft.push({
        store: config.market,
        title_pattern: title,
        frequency: qty,
        product_key: guessProductKey(title),
        unit_group: guessUnitGroup(title),
      });
    }
  }

  writeFileSync("products_map.draft.json", JSON.stringify(draft, null, 2));
  console.log(`\n→ Brouillon écrit dans products_map.draft.json (${draft.length} titres).`);
  console.log(
    "⚠️  Relis et corrige chaque product_key/unit_group avec Badr avant de charger dans products_map. Les entrées 'A_VALIDER' doivent être résolues une par une (§5, fail loudly)."
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
