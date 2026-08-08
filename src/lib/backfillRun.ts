import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "./supabase";
import {
  getShopifyStoreConfigs,
  iterateOrders,
  computeRefundedCentsAccurate,
  resolveAccessToken,
  totalPriceShopCents,
  orderAcquisitionFields,
  acquisitionColumnsReady,
} from "./shopify";
import {
  fetchMetaAdInsights,
  fetchMetaCountryInsights,
  fetchMetaInsights,
  loadCampaignOverrides,
  resolveCampaignMarket,
} from "./meta";
import {
  classifyLineItemsTolerant,
  computeOrderCogsTaxTolerant,
  type ProductMapEntry,
} from "./engine";
import { toParisDay, todayParisDay, listParisDays } from "./time";
import { recomputeDailyAggregatesForDays } from "./aggregate";
import { upsertSpendRows, type SpendRowForWrite } from "./spendWrite";
import { BACKFILL_SINCE_ISO } from "./discover";

// « L'ecom a démarré à partir du 21 mai » (Badr 08/08, corrige le 04/06
// précédent) — les commandes Shopify remontent jusque-là.
const ORDERS_SINCE_DAY = "2026-05-21";
// Le spend Meta, lui, reste vérifié à partir du 04/06 (demande Badr 15/07) —
// pas de raison de croire qu'il existe plus tôt tant que ce n'est pas
// confirmé ; à corriger si Badr donne une date de lancement pub différente.
const META_SINCE_DAY = "2026-06-04";

export interface BackfillResult {
  ordersByStore: Record<string, number>;
  metaSpendRows: number;
  unmappedCampaigns: string[];
  daysRecomputed: number;
  /** Mode partiel : stores/Meta en échec, ignorés au lieu de tout bloquer. */
  warnings: string[];
}

export async function backfillOrders(
  supabase: SupabaseClient,
  productsMap: ProductMapEntry[]
): Promise<{ ordersByStore: Record<string, number>; warnings: string[] }> {
  const configs = getShopifyStoreConfigs();
  const ordersByStore: Record<string, number> = {};
  const warnings: string[] = [];

  // Upsert par lots : commande par commande, ~1 400 allers-retours réseau
  // faisaient dépasser la limite de temps de la fonction (init « infinie »).
  const CHUNK = 250;
  const hasAcqColumns = await acquisitionColumnsReady(supabase);

  for (const config of configs) {
    try {
      const token = await resolveAccessToken(config);
      const rows: Record<string, unknown>[] = [];
      const unknownTitles = new Set<string>();
      let skippedOrders = 0;
      for await (const order of iterateOrders(config, { createdAtMin: BACKFILL_SINCE_ISO })) {
        const day = toParisDay(order.created_at);
        const shippingCountry = order.shipping_address?.country_code ?? config.market;

        // Version TOLÉRANTE : un produit inconnu ne fait perdre NI la commande
        // (le CA est la donnée la plus critique) NI le lot du store. On
        // enregistre, on calcule le COGS de ce qu'on connaît, on signale.
        const classified = classifyLineItemsTolerant(
          order.line_items.map((li) => ({
            title: li.title,
            sku: li.sku ?? undefined,
            quantity: li.quantity,
            price_cents: Math.round(parseFloat(li.price) * 100),
          })),
          productsMap,
          config.market
        );
        if (classified.unknownTitles.length > 0) {
          skippedOrders += 1; // commandes au COGS incomplet (plus « ignorées »)
          for (const t of classified.unknownTitles) unknownTitles.add(t);
        }

        const { cogsProductCents, cogsUpsellsCents, taxCents, unknownUpsellKeys } =
          computeOrderCogsTaxTolerant({
            store: config.market,
            shippingCountry,
            day,
            poloQty: classified.poloQty,
            upsells: classified.upsells,
            unknownDistinctCount: classified.unknownDistinctCount,
          });
        for (const k of unknownUpsellKeys) unknownTitles.add(`clé ${k}`);

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
          ...(hasAcqColumns ? orderAcquisitionFields(order) : {}),
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
          `${config.market} : ${skippedOrders} commande(s) enregistrée(s) avec un COGS INCOMPLET (compté 0 € pour le produit manquant → Net trop optimiste). À mapper sur /admin : ${[...unknownTitles].join(" · ")}`
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

export async function backfillMetaSpend(
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
  // Même filet que la synchro : market='CA' refusé (migration 0012 absente)
  // rebascule sur UNMAPPED au lieu de faire échouer tout le backfill.
  for (let i = 0; i < spendUpserts.length; i += CHUNK) {
    const res = await upsertSpendRows(supabase, spendUpserts.slice(i, i + CHUNK) as SpendRowForWrite[]);
    if (res.error) throw new Error(res.error);
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
    // video_p50/p75/p100 ajoutés par la migration 0011 — probe avant
    // d'inclure (colonne absente ferait échouer tout le lot sinon).
    const { error: videoPctProbeError } = await supabase
      .from("meta_ad_insights")
      .select("video_p50")
      .limit(1);
    const hasVideoPct = !videoPctProbeError;
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
      ...(hasVideoPct
        ? { video_p50: row.video50, video_p75: row.video75, video_p100: row.video100 }
        : {}),
    }));
    for (let i = 0; i < adUpserts.length; i += CHUNK) {
      await supabase.from("meta_ad_insights").upsert(adUpserts.slice(i, i + CHUNK));
    }
  } catch {
    /* non bloquant */
  }
  try {
    const { fetchAdCreativeBodies } = await import("./meta");
    const bodies = await fetchAdCreativeBodies();
    const bodyUpserts = [...bodies.entries()].map(([ad_id, body]) => ({
      ad_id,
      body,
      updated_at: new Date().toISOString(),
    }));
    for (let i = 0; i < bodyUpserts.length; i += CHUNK) {
      await supabase.from("meta_ad_creatives").upsert(bodyUpserts.slice(i, i + CHUNK));
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
