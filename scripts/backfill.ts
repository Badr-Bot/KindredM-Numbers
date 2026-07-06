/**
 * Backfill initial (§7.4) — à lancer EN LOCAL avec les vrais tokens dans
 * .env.local, APRÈS que products_map ait été validé par Badr (§5).
 *
 *   npm run backfill
 *
 * Télécharge tout l'historique des 4 stores depuis 2026-06-04 + le spend Meta
 * depuis 2026-06-21, upsert dans Supabase, puis recalcule daily_aggregates
 * pour chaque jour touché. Vérifie ensuite manuellement les totaux affichés
 * contre l'admin Shopify de chaque store (critère d'acceptation §7.4).
 */
import "dotenv/config";
import { createSupabaseServerClient } from "../src/lib/supabase";
import { getShopifyStoreConfigs, iterateOrders, computeRefundedCents } from "../src/lib/shopify";
import { fetchMetaSpend, mapCampaignToMarket } from "../src/lib/meta";
import { classifyLineItems, computeOrderCogsTax, type ProductMapEntry } from "../src/lib/engine";
import { toParisDay, todayParisDay, listParisDays } from "../src/lib/time";
import { recomputeDailyAggregatesForDays } from "../src/lib/aggregate";

const ORDERS_SINCE_DAY = "2026-06-04";
const ORDERS_SINCE_ISO = "2026-06-04T00:00:00+02:00";
const META_SINCE_DAY = "2026-06-21";

async function backfillOrders(productsMap: ProductMapEntry[]) {
  const supabase = createSupabaseServerClient();
  const configs = getShopifyStoreConfigs();

  for (const config of configs) {
    let count = 0;
    for await (const order of iterateOrders(config, { createdAtMin: ORDERS_SINCE_ISO })) {
      const day = toParisDay(order.created_at);
      const shippingCountry = order.shipping_address?.country_code ?? config.market;

      const classified = classifyLineItems(
        order.line_items.map((li) => ({
          title: li.title,
          sku: li.sku ?? undefined,
          quantity: li.quantity,
          price_cents: Math.round(parseFloat(li.price) * 100),
        })),
        productsMap,
        config.market
      );

      const { cogsProductCents, cogsUpsellsCents, taxCents } = computeOrderCogsTax({
        store: config.market,
        shippingCountry,
        day,
        poloQty: classified.poloQty,
        upsells: classified.upsells,
      });

      const { error } = await supabase.from("orders").upsert({
        id: order.id,
        store: config.market,
        order_name: order.name,
        created_at_utc: order.created_at,
        day,
        shipping_country: shippingCountry,
        total_cents: Math.round(parseFloat(order.total_price) * 100),
        refunded_cents: computeRefundedCents(order),
        line_items: order.line_items,
        polo_qty: classified.poloQty,
        upsells: classified.upsells,
        cogs_product_cents: cogsProductCents,
        cogs_upsells_cents: cogsUpsellsCents,
        tax_eu_cents: taxCents,
        updated_at_utc: order.updated_at,
      });
      if (error) throw error;
      count++;
    }
    await supabase
      .from("sync_state")
      .upsert({ store: config.market, last_orders_sync: new Date().toISOString() });
    console.log(`${config.market}: ${count} commandes backfillées depuis ${ORDERS_SINCE_DAY}.`);
  }
}

async function backfillMetaSpend() {
  const supabase = createSupabaseServerClient();
  const today = todayParisDay();
  const rows = await fetchMetaSpend(META_SINCE_DAY, today);

  for (const row of rows) {
    const market = mapCampaignToMarket(row.campaignName);
    const { error } = await supabase.from("meta_spend").upsert({
      day: row.day,
      market,
      campaign_id: row.campaignId,
      campaign_name: row.campaignName,
      spend_cents: row.spendCents,
    });
    if (error) throw error;
  }

  const unmapped = rows.filter((r) => mapCampaignToMarket(r.campaignName) === "UNMAPPED");
  if (unmapped.length > 0) {
    console.warn(`⚠️  ${unmapped.length} lignes de spend en UNMAPPED — à affecter manuellement dans l'UI :`);
    for (const row of unmapped) console.warn(`   - ${row.campaignName}`);
  }
  console.log(`Meta spend: ${rows.length} lignes backfillées depuis ${META_SINCE_DAY}.`);
}

async function main() {
  const supabase = createSupabaseServerClient();
  const { data: productsMap, error } = await supabase.from("products_map").select("*");
  if (error) throw error;
  if (!productsMap || productsMap.length === 0) {
    throw new Error(
      "products_map est vide. Lance `npm run discover-products`, fais valider le mapping par Badr, puis charge-le dans Supabase avant de relancer le backfill (§5)."
    );
  }

  await backfillOrders(productsMap as ProductMapEntry[]);
  await backfillMetaSpend();

  const today = todayParisDay();
  const days = listParisDays(ORDERS_SINCE_DAY, today);
  console.log(`Recalcul de daily_aggregates pour ${days.length} jours...`);
  await recomputeDailyAggregatesForDays(supabase, days);

  console.log("Backfill terminé. Vérifie maintenant les totaux affichés contre l'admin Shopify de chaque store (§7.4).");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
