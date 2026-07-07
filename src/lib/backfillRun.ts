import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "./supabase";
import { getShopifyStoreConfigs, iterateOrders, computeRefundedCents } from "./shopify";
import { fetchMetaSpend, loadCampaignOverrides, resolveCampaignMarket } from "./meta";
import { classifyLineItems, computeOrderCogsTax, type ProductMapEntry } from "./engine";
import { toParisDay, todayParisDay, listParisDays } from "./time";
import { recomputeDailyAggregatesForDays } from "./aggregate";
import { BACKFILL_SINCE_ISO } from "./discover";

const ORDERS_SINCE_DAY = "2026-06-04";
const META_SINCE_DAY = "2026-06-21";

export interface BackfillResult {
  ordersByStore: Record<string, number>;
  metaSpendRows: number;
  unmappedCampaigns: string[];
  daysRecomputed: number;
}

async function backfillOrders(
  supabase: SupabaseClient,
  productsMap: ProductMapEntry[]
): Promise<Record<string, number>> {
  const configs = getShopifyStoreConfigs();
  const ordersByStore: Record<string, number> = {};

  for (const config of configs) {
    let count = 0;
    for await (const order of iterateOrders(config, { createdAtMin: BACKFILL_SINCE_ISO })) {
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
    ordersByStore[config.market] = count;
  }
  return ordersByStore;
}

async function backfillMetaSpend(
  supabase: SupabaseClient
): Promise<{ rows: number; unmapped: string[] }> {
  const today = todayParisDay();
  const [rows, overrides] = await Promise.all([
    fetchMetaSpend(META_SINCE_DAY, today),
    loadCampaignOverrides(supabase),
  ]);

  const unmappedNames = new Set<string>();
  for (const row of rows) {
    const market = resolveCampaignMarket(row.campaignName, row.campaignId, overrides);
    if (market === "UNMAPPED") unmappedNames.add(row.campaignName);
    const { error } = await supabase.from("meta_spend").upsert({
      day: row.day,
      market,
      campaign_id: row.campaignId,
      campaign_name: row.campaignName,
      spend_cents: row.spendCents,
    });
    if (error) throw error;
  }
  return { rows: rows.length, unmapped: [...unmappedNames] };
}

/**
 * Backfill complet (§7.4) : 4 stores depuis 2026-06-04 + spend Meta depuis
 * 2026-06-21, upsert Supabase, recalcul daily_aggregates. Utilisé à la fois
 * par le script CLI (npm run backfill) et par la route /api/admin/backfill.
 */
export async function runFullBackfill(): Promise<BackfillResult> {
  const supabase = createSupabaseServerClient();
  const { data: productsMap, error } = await supabase.from("products_map").select("*");
  if (error) throw error;
  if (!productsMap || productsMap.length === 0) {
    throw new Error(
      "products_map est vide. Découvre puis charge le mapping produits avant de lancer le backfill (§5)."
    );
  }

  const ordersByStore = await backfillOrders(supabase, productsMap as ProductMapEntry[]);
  const { rows: metaSpendRows, unmapped: unmappedCampaigns } = await backfillMetaSpend(supabase);

  const today = todayParisDay();
  const days = listParisDays(ORDERS_SINCE_DAY, today);
  await recomputeDailyAggregatesForDays(supabase, days);

  return { ordersByStore, metaSpendRows, unmappedCampaigns, daysRecomputed: days.length };
}
