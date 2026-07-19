import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "./supabase";
import {
  getShopifyStoreConfigs,
  iterateOrders,
  computeRefundedCentsAccurate,
  resolveAccessToken,
  totalPriceShopCents,
} from "./shopify";
import {
  fetchMetaAdInsights,
  fetchMetaCountryInsights,
  fetchMetaInsights,
  loadCampaignOverrides,
  resolveCampaignMarket,
} from "./meta";
import {
  classifyLineItems,
  computeOrderCogsTax,
  UnmappedProductError,
  type ProductMapEntry,
} from "./engine";
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
      const token = await resolveAccessToken(config);
      const rows: Record<string, unknown>[] = [];
      const unknownTitles = new Set<string>();
      let skippedOrders = 0;
      for await (const order of iterateOrders(config, { createdAtMin: BACKFILL_SINCE_ISO })) {
        const day = toParisDay(order.created_at);
        const shippingCountry = order.shipping_address?.country_code ?? config.market;

        // Un titre inconnu ne doit pas faire perdre TOUT le store (avant :
        // l'exception annulait le lot entier → CA du store absent) — on saute
        // la commande, on signale fort, le reste du store passe.
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
            skippedOrders += 1;
            unknownTitles.add(err.title);
            continue;
          }
          throw err;
        }

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
          total_cents: totalPriceShopCents(order),
          refunded_cents: await computeRefundedCentsAccurate(config, token, order),
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
      if (skippedOrders > 0) {
        warnings.push(
          `${config.market} : ${skippedOrders} commande(s) SAUTÉE(S) — produit(s) inconnu(s) à mapper sur /admin : ${[...unknownTitles].join(" · ")}`
        );
      }
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
    fetchMetaInsights(META_SINCE_DAY, today),
    loadCampaignOverrides(supabase),
  ]);

  const unmappedNames = new Set<string>();
  const CHUNK = 500;

  const spendUpserts = rows.map((row) => {
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
  for (let i = 0; i < spendUpserts.length; i += CHUNK) {
    const { error } = await supabase.from("meta_spend").upsert(spendUpserts.slice(i, i + CHUNK));
    if (error) throw error;
  }

  // Historique complet des métriques avancées (Analyse) — best effort : les
  // tables 0005/0007 absentes ou une erreur Meta n'empêchent pas le spend.
  try {
    const insightUpserts = rows.map((row) => ({
      day: row.day,
      campaign_id: row.campaignId,
      campaign_name: row.campaignName,
      market: resolveCampaignMarket(row.campaignName, row.campaignId, overrides),
      spend_cents: row.spendCents,
      impressions: row.impressions,
      clicks: row.clicks,
      purchases: row.purchases,
      purchase_value_cents: row.purchaseValueCents,
      reach: row.reach,
      frequency: row.frequency,
      link_clicks: row.linkClicks,
      landing_page_views: row.landingPageViews,
      add_to_cart: row.addToCart,
      initiate_checkout: row.initiateCheckout,
      video_3s: row.video3s,
      thruplays: row.thruplays,
    }));
    for (let i = 0; i < insightUpserts.length; i += CHUNK) {
      await supabase.from("meta_insights").upsert(insightUpserts.slice(i, i + CHUNK));
    }
  } catch {
    /* non bloquant */
  }
  try {
    const adRows = await fetchMetaAdInsights(META_SINCE_DAY, today);
    const adUpserts = adRows.map((row) => ({
      day: row.day,
      ad_id: row.adId,
      ad_name: row.adName,
      campaign_id: row.campaignId,
      campaign_name: row.campaignName,
      market: resolveCampaignMarket(row.campaignName, row.campaignId, overrides),
      spend_cents: row.spendCents,
      impressions: row.impressions,
      clicks: row.clicks,
      purchases: row.purchases,
      purchase_value_cents: row.purchaseValueCents,
      reach: row.reach,
      frequency: row.frequency,
      link_clicks: row.linkClicks,
      landing_page_views: row.landingPageViews,
      add_to_cart: row.addToCart,
      initiate_checkout: row.initiateCheckout,
      video_3s: row.video3s,
      thruplays: row.thruplays,
      quality_ranking: row.qualityRanking,
      engagement_ranking: row.engagementRanking,
      conversion_ranking: row.conversionRanking,
    }));
    for (let i = 0; i < adUpserts.length; i += CHUNK) {
      await supabase.from("meta_ad_insights").upsert(adUpserts.slice(i, i + CHUNK));
    }
  } catch {
    /* non bloquant */
  }
  try {
    const countryRows = await fetchMetaCountryInsights(META_SINCE_DAY, today);
    const countryUpserts = countryRows.map((row) => ({
      day: row.day,
      campaign_id: row.campaignId,
      country: row.country,
      spend_cents: row.spendCents,
      impressions: row.impressions,
      clicks: row.clicks,
      purchases: row.purchases,
      purchase_value_cents: row.purchaseValueCents,
    }));
    for (let i = 0; i < countryUpserts.length; i += CHUNK) {
      await supabase.from("meta_country_insights").upsert(countryUpserts.slice(i, i + CHUNK));
    }
  } catch {
    /* non bloquant */
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
