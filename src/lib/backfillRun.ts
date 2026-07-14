import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "./supabase";
import { getShopifyStoreConfigs, iterateOrders, computeRefundedCents } from "./shopify";
import { fetchMetaSpend, loadCampaignOverrides, resolveCampaignMarket } from "./meta";
import { classifyLineItems, computeOrderCogsTax, type ProductMapEntry } from "./engine";
import { toParisDay, todayParisDay, listParisDays } from "./time";
import { recomputeDailyAggregatesForDays } from "./aggregate";
import { BACKFILL_SINCE_ISO } from "./discover";

const ORDERS_SINCE_DAY = "2026-06-04";
// Aligné sur le début des ventes (04/06) — le spec §7.4 disait 21/06 mais du
// spend réel existe dès le 04/06 (vérifié sur le compte, demande de Badr 15/07).
const META_SINCE_DAY = "2026-06-04";

export interface BackfillResult {
  ordersByStore: Record<string, number>;
  metaSpendRows: number;
  unmappedCampaigns: string[];
  daysRecomputed: number;
  /** Mode partiel : stores/Meta en échec, ignorés au lieu de tout bloquer. */
  warnings: string[];
}

async function backfillOrders(
  supabase: SupabaseClient,
  productsMap: ProductMapEntry[]
): Promise<{ ordersByStore: Record<string, number>; warnings: string[] }> {
  const configs = getShopifyStoreConfigs();
  const ordersByStore: Record<string, number> = {};
  const warnings: string[] = [];

  // Upsert par lots : commande par commande, ~1 400 allers-retours réseau
  // faisaient dépasser la limite de temps de la fonction (init « infinie »).
  const CHUNK = 250;

  for (const config of configs) {
    try {
      const rows: Record<string, unknown>[] = [];
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

        rows.push({
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
      }

      for (let i = 0; i < rows.length; i += CHUNK) {
        const { error } = await supabase.from("orders").upsert(rows.slice(i, i + CHUNK));
        if (error) throw error;
      }
      await supabase
        .from("sync_state")
        .upsert({ store: config.market, last_orders_sync: new Date().toISOString() });
      ordersByStore[config.market] = rows.length;
    } catch (err) {
      // Mode partiel : un store en échec (scope, secret…) est ignoré et
      // signalé — les autres continuent. Relancer le backfill une fois le
      // store réparé complètera les données (idempotent).
      warnings.push(`${config.market} ignoré : ${(err as Error).message}`);
    }
  }
  return { ordersByStore, warnings };
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
  const upserts = rows.map((row) => {
    const market = resolveCampaignMarket(row.campaignName, row.campaignId, overrides);
    if (market === "UNMAPPED") unmappedNames.add(row.campaignName);
    return {
      day: row.day,
      market,
      campaign_id: row.campaignId,
      campaign_name: row.campaignName,
      spend_cents: row.spendCents,
    };
  });
  const CHUNK = 500;
  for (let i = 0; i < upserts.length; i += CHUNK) {
    const { error } = await supabase.from("meta_spend").upsert(upserts.slice(i, i + CHUNK));
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

  const { ordersByStore, warnings } = await backfillOrders(
    supabase,
    productsMap as ProductMapEntry[]
  );
  if (Object.keys(ordersByStore).length === 0) {
    throw new Error(`Aucun store accessible. ${warnings.join(" | ")}`);
  }

  // Mode partiel : Meta en échec = spend absent (net provisoirement calculé
  // sans la pub, donc optimiste) — signalé, pas bloquant. Relancer le
  // backfill une fois Meta réparé remet tout d'aplomb.
  let metaSpendRows = 0;
  let unmappedCampaigns: string[] = [];
  try {
    const meta = await backfillMetaSpend(supabase);
    metaSpendRows = meta.rows;
    unmappedCampaigns = meta.unmapped;
  } catch (err) {
    warnings.push(
      `Spend Meta indisponible (net calculé SANS la pub pour l'instant) : ${(err as Error).message}`
    );
  }

  const today = todayParisDay();
  const days = listParisDays(ORDERS_SINCE_DAY, today);
  await recomputeDailyAggregatesForDays(supabase, days);

  return { ordersByStore, metaSpendRows, unmappedCampaigns, daysRecomputed: days.length, warnings };
}
