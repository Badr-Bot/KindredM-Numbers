import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "./supabase";
import { getShopifyStoreConfigs, iterateOrders, computeRefundedCents } from "./shopify";
import { fetchMetaSpend, loadCampaignOverrides, resolveCampaignMarket } from "./meta";
import { classifyLineItems, computeOrderCogsTax, UnmappedProductError, type ProductMapEntry } from "./engine";
import { toParisDay, todayParisDay, addDaysToDay } from "./time";
import { recomputeDailyAggregatesForDays } from "./aggregate";

export interface IncrementalSyncResult {
  ran: boolean;
  touchedDays?: string[];
  warnings?: string[];
}

/**
 * Rescan incrémental : commandes modifiées sur les 7 derniers jours (§4.7,
 * remboursements tardifs) + spend Meta J-7→J-1, puis recalcule les jours
 * touchés + toujours J-2/J-1/J en filet de sécurité (voir cron/route.ts).
 * Partagé entre le cron de minuit et la synchro auto déclenchée par les
 * visites du site (throttlée, voir /api/sync).
 */
export async function runIncrementalSync(
  supabase: SupabaseClient,
  productsMap: ProductMapEntry[]
): Promise<IncrementalSyncResult> {
  const today = todayParisDay();
  const rescanFromDay = addDaysToDay(today, -7);
  const yesterday = addDaysToDay(today, -1);
  const updatedAtMinIso = `${rescanFromDay}T00:00:00+02:00`;

  const configs = getShopifyStoreConfigs();
  const touchedDays = new Set<string>();
  const warnings: string[] = [];

  for (const config of configs) {
    try {
      for await (const order of iterateOrders(config, { updatedAtMin: updatedAtMinIso })) {
        const day = toParisDay(order.created_at);
        const shippingCountry = order.shipping_address?.country_code ?? config.market;

        let classified;
        try {
          classified = classifyLineItems(
            order.line_items.map((li) => ({
              title: li.title,
              sku: li.sku ?? undefined,
              quantity: li.quantity,
              price_cents: Math.round(parseFloat(li.price) * 100),
            })),
            productsMap,
            config.market
          );
        } catch (err) {
          if (err instanceof UnmappedProductError) {
            warnings.push(`${config.market} : produit inconnu ignoré — ${err.title}`);
            continue;
          }
          throw err;
        }

        touchedDays.add(day);
        const { cogsProductCents, cogsUpsellsCents, taxCents } = computeOrderCogsTax({
          store: config.market,
          shippingCountry,
          day,
          poloQty: classified.poloQty,
          upsells: classified.upsells,
        });

        await supabase.from("orders").upsert({
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
      await supabase
        .from("sync_state")
        .upsert({ store: config.market, last_orders_sync: new Date().toISOString() });
    } catch (err) {
      warnings.push(`${config.market} ignoré : ${(err as Error).message}`);
    }
  }

  try {
    const [metaRows, overrides] = await Promise.all([
      fetchMetaSpend(rescanFromDay, yesterday),
      loadCampaignOverrides(supabase),
    ]);
    for (const row of metaRows) {
      touchedDays.add(row.day);
      const market = resolveCampaignMarket(row.campaignName, row.campaignId, overrides);
      await supabase.from("meta_spend").upsert({
        day: row.day,
        market,
        campaign_id: row.campaignId,
        campaign_name: row.campaignName,
        spend_cents: row.spendCents,
      });
    }
  } catch (err) {
    warnings.push(`Spend Meta indisponible pour ce cycle : ${(err as Error).message}`);
  }

  // Filet de sécurité : les 3 derniers jours sont toujours recalculés, même
  // si le scan updated_at n'a rien détecté (cause du CA périmé du 16/07).
  for (const d of [addDaysToDay(today, -2), yesterday, today]) touchedDays.add(d);

  await recomputeDailyAggregatesForDays(supabase, touchedDays);

  return { ran: true, touchedDays: [...touchedDays].sort(), warnings };
}

const THROTTLE_KEY = "last_incremental_sync_at";
const THROTTLE_MS = 5 * 60 * 1000;

/**
 * Version throttlée pour un déclenchement automatique depuis le navigateur
 * (§ « zéro clic » — aucune action de Badr ne doit être requise). Si une
 * synchro a tourné il y a moins de 5 min, ne refait rien (protège Shopify/
 * Meta d'un martèlement si plusieurs visites arrivent en même temps).
 */
export async function runThrottledIncrementalSync(): Promise<IncrementalSyncResult> {
  const supabase = createSupabaseServerClient();

  const { data: marker } = await supabase
    .from("app_state")
    .select("updated_at")
    .eq("key", THROTTLE_KEY)
    .maybeSingle();
  if (marker && Date.now() - new Date(marker.updated_at as string).getTime() < THROTTLE_MS) {
    return { ran: false };
  }

  // Pose le marqueur avant de lancer le travail : si deux requêtes arrivent
  // en même temps, une seule gagne la course (upsert), l'autre voit le
  // marqueur frais au prochain appel.
  await supabase
    .from("app_state")
    .upsert({ key: THROTTLE_KEY, value: "running", updated_at: new Date().toISOString() });

  const { data: productsMap } = await supabase.from("products_map").select("*");
  if (!productsMap || productsMap.length === 0) return { ran: false };

  return runIncrementalSync(supabase, productsMap as ProductMapEntry[]);
}
