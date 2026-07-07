/**
 * Phase découverte (§5) — CLI équivalente au bouton "Découvrir" de /admin.
 * À lancer EN LOCAL avec les vrais tokens Shopify dans .env.local.
 *
 *   npm run discover-products
 *
 * Écrit un brouillon products_map dans products_map.draft.json. Rien n'est
 * inséré en base : à relire et valider avant chargement (§5 — aucun produit
 * ne doit rester non mappé silencieusement).
 */
import "./load-env";
import { writeFileSync } from "node:fs";
import { discoverProducts } from "../src/lib/discover";

async function main() {
  const results = await discoverProducts();
  const draft: Array<{ store: string; title_pattern: string; frequency: number; product_key: string; unit_group: string }> = [];

  for (const store of results) {
    console.log(`\n=== ${store.market} (${store.domain}) ===`);
    if (store.error) {
      console.log(`  ❌ ${store.error}`);
      continue;
    }
    for (const t of store.titles) {
      console.log(`  ${String(t.frequency).padStart(5)}  ${t.title}`);
      draft.push({
        store: store.market,
        title_pattern: t.title,
        frequency: t.frequency,
        product_key: t.guessedProductKey,
        unit_group: t.guessedUnitGroup,
      });
    }
  }

  writeFileSync("products_map.draft.json", JSON.stringify(draft, null, 2));
  console.log(`\n→ Brouillon écrit dans products_map.draft.json (${draft.length} titres).`);
  console.log(
    "⚠️  Relis et corrige chaque product_key/unit_group avant de charger dans products_map. Les entrées 'A_VALIDER' doivent être résolues une par une (§5, fail loudly)."
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
