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
  fetchMetaInsights,
  loadCampaignOverrides,
  resolveCampaignMarket,
} from "./meta";
import { classifyLineItems, computeOrderCogsTax, UnmappedProductError, type ProductMapEntry } from "./engine";
import { toParisDay, todayParisDay, addDaysToDay } from "./time";
import { recomputeDailyAggregatesForDays } from "./aggregate";

export interface IncrementalSyncResult {
  ran: boolean;
  /** true = une étape de resync reste à faire — le client doit rappeler /api/sync tout de suite. */
  moreWork?: boolean;
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

  // Écritures PAR LOTS (250) : commande par commande, le rescan J-7 de FR
  // (~600 commandes) prenait 1-2 min à chaque cycle → badge « synchro en
  // cours » interminable à chaque visite.
  const ORDER_CHUNK = 250;
  for (const config of configs) {
    try {
      const token = await resolveAccessToken(config);
      const rows: Record<string, unknown>[] = [];
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
      for (let i = 0; i < rows.length; i += ORDER_CHUNK) {
        await supabase.from("orders").upsert(rows.slice(i, i + ORDER_CHUNK));
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
      fetchMetaInsights(rescanFromDay, yesterday),
      loadCampaignOverrides(supabase),
    ]);
    // Écritures PAR LOTS : la version commande-par-commande (~800 upserts
    // séquentiels avec les annonces + pays) faisait dépasser la limite de
    // temps de la fonction → « synchro en cours » sans fin.
    const CHUNK = 500;
    const spendUpserts: Record<string, unknown>[] = [];
    const insightUpserts: Record<string, unknown>[] = [];
    for (const row of metaRows) {
      touchedDays.add(row.day);
      const market = resolveCampaignMarket(row.campaignName, row.campaignId, overrides);
      spendUpserts.push({
        day: row.day,
        market,
        campaign_id: row.campaignId,
        campaign_name: row.campaignName,
        spend_cents: row.spendCents,
      });
      insightUpserts.push({
        day: row.day,
        campaign_id: row.campaignId,
        campaign_name: row.campaignName,
        market,
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
      });
    }
    for (let i = 0; i < spendUpserts.length; i += CHUNK) {
      await supabase.from("meta_spend").upsert(spendUpserts.slice(i, i + CHUNK));
    }
    for (let i = 0; i < insightUpserts.length; i += CHUNK) {
      await supabase.from("meta_insights").upsert(insightUpserts.slice(i, i + CHUNK));
    }
    // Niveau annonce (créas + hit rate). Isolé : son échec ne bloque rien.
    try {
      const adRows = await fetchMetaAdInsights(rescanFromDay, yesterday);
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
    } catch (err) {
      warnings.push(`Créas Meta (niveau annonce) indisponibles : ${(err as Error).message}`);
    }
    // Breakdown pays : le vrai ROAS BE/CA/CH dans les campagnes « FR ».
    try {
      const { fetchMetaCountryInsights } = await import("./meta");
      const countryRows = await fetchMetaCountryInsights(rescanFromDay, yesterday);
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
    } catch (err) {
      warnings.push(`Répartition pays Meta indisponible : ${(err as Error).message}`);
    }
  } catch (err) {
    warnings.push(`Spend Meta indisponible pour ce cycle : ${(err as Error).message}`);
  }

  // 📓 Journal : détection auto (campagne coupée/lancée, saut de budget)
  // depuis meta_spend — marche même quand le token Meta est HS (seed SQL).
  const { detectCampaignEvents } = await import("./journal");
  await detectCampaignEvents(supabase);

  // Filet de sécurité : les 3 derniers jours sont toujours recalculés, même
  // si le scan updated_at n'a rien détecté (cause du CA périmé du 16/07).
  for (const d of [addDaysToDay(today, -2), yesterday, today]) touchedDays.add(d);

  await recomputeDailyAggregatesForDays(supabase, touchedDays);

  return { ran: true, touchedDays: [...touchedDays].sort(), warnings };
}

const THROTTLE_KEY = "last_incremental_sync_at";
const THROTTLE_MS = 5 * 60 * 1000;

// Marqueur de « migration de données » auto-appliquée. À chaque correction
// de bug qui fausse des données déjà en base (ex : devise de remboursement
// mal lue le 16/07), on bump cette version — la prochaine synchro auto
// détecte l'écart et relance un backfill complet de tout l'historique
// silencieusement, sans que Badr n'ait jamais à cliquer sur rien. Une fois
// à jour, elle repasse en synchro rapide (7 jours) normalement.
const RESYNC_VERSION_KEY = "full_resync_version";
// v4 : token Meta enfin actif — backfill de TOUT l'historique des métriques
// avancées (insights campagne/annonce/pays depuis le 04/06) via
// backfillMetaSpend enrichi. Chaque bump redéclenche un resync complet.
const REQUIRED_FULL_RESYNC_VERSION = "2026-07-18-meta-insights-history-v4";
const RESYNC_LOCK_KEY = "full_resync_in_progress_at";
const RESYNC_LOCK_TTL_MS = 10 * 60 * 1000; // > maxDuration (300s) du backfill
const RESYNC_STAGE_KEY = "full_resync_stage"; // "orders" → "meta" → terminé

/**
 * Version throttlée pour un déclenchement automatique depuis le navigateur
 * (§ « zéro clic » — aucune action de Badr ne doit être requise). Si une
 * synchro a tourné il y a moins de 5 min, ne refait rien (protège Shopify/
 * Meta d'un martèlement si plusieurs visites arrivent en même temps) — sauf
 * si un recalcul complet est requis (voir REQUIRED_FULL_RESYNC_VERSION),
 * auquel cas le throttle est ignoré pour ne pas retarder la correction.
 */
export async function runThrottledIncrementalSync(): Promise<IncrementalSyncResult> {
  const supabase = createSupabaseServerClient();

  const [{ data: marker }, { data: resyncMarker }] = await Promise.all([
    supabase.from("app_state").select("updated_at, value").eq("key", THROTTLE_KEY).maybeSingle(),
    supabase.from("app_state").select("value").eq("key", RESYNC_VERSION_KEY).maybeSingle(),
  ]);
  const needsFullResync = resyncMarker?.value !== REQUIRED_FULL_RESYNC_VERSION;

  if (
    !needsFullResync &&
    marker?.value === "done" &&
    Date.now() - new Date(marker.updated_at as string).getTime() < THROTTLE_MS
  ) {
    return { ran: false };
  }

  const { data: productsMap } = await supabase.from("products_map").select("*");
  if (!productsMap || productsMap.length === 0) return { ran: false };

  // Le marqueur n'est posé ("done") qu'APRÈS un cycle réussi — sinon un
  // échec en cours de route bloquerait toute nouvelle tentative pendant
  // 5 min alors que rien n'a été écrit (constaté le 16/07 : CA resté figé
  // malgré 97 nouvelles commandes). Si deux visites arrivent au même
  // instant, elles refont le même travail idempotent — sans conséquence.
  let result: IncrementalSyncResult;
  if (needsFullResync) {
    // Verrou anti-doublon : le backfill complet peut prendre 1-2 min — si
    // Badr recharge la page entre-temps (croyant que rien ne se passe), on
    // évite de relancer un 2e backfill concurrent par-dessus le premier.
    // Expire tout seul après 10 min au cas où le premier essai a échoué.
    const { data: lock } = await supabase
      .from("app_state")
      .select("updated_at")
      .eq("key", RESYNC_LOCK_KEY)
      .maybeSingle();
    if (lock && Date.now() - new Date(lock.updated_at as string).getTime() < RESYNC_LOCK_TTL_MS) {
      return { ran: false, moreWork: true };
    }
    await supabase
      .from("app_state")
      .upsert({ key: RESYNC_LOCK_KEY, value: "running", updated_at: new Date().toISOString() });

    // ÉTAPES COURTES : le resync complet en un seul appel dépassait la
    // limite de temps Vercel → tué avant la fin → jamais marqué terminé →
    // relancé de zéro à chaque visite (« synchro en cours » sans fin, 19/07
    // jamais recalculé). Chaque appel fait UNE étape (< 60 s), le navigateur
    // rappelle immédiatement tant que moreWork=true.
    const { data: stageRow } = await supabase
      .from("app_state")
      .select("value")
      .eq("key", RESYNC_STAGE_KEY)
      .maybeSingle();
    const stage = stageRow?.value === "meta" ? "meta" : "orders";
    const { listParisDays } = await import("./time");
    const today = todayParisDay();
    const allDays = listParisDays("2026-06-04", today);

    if (stage === "orders") {
      const { backfillOrders } = await import("./backfillRun");
      const res = await backfillOrders(supabase, productsMap as ProductMapEntry[]);
      await recomputeDailyAggregatesForDays(supabase, allDays);
      await supabase
        .from("app_state")
        .upsert({ key: RESYNC_STAGE_KEY, value: "meta", updated_at: new Date().toISOString() });
      result = { ran: true, moreWork: true, warnings: res.warnings };
    } else {
      const { backfillMetaSpend } = await import("./backfillRun");
      const warnings: string[] = [];
      try {
        await backfillMetaSpend(supabase);
      } catch (err) {
        warnings.push(`Meta indisponible : ${(err as Error).message}`);
      }
      const { detectCampaignEvents } = await import("./journal");
      await detectCampaignEvents(supabase);
      await recomputeDailyAggregatesForDays(supabase, allDays);
      await supabase.from("app_state").upsert({
        key: RESYNC_VERSION_KEY,
        value: REQUIRED_FULL_RESYNC_VERSION,
        updated_at: new Date().toISOString(),
      });
      await supabase
        .from("app_state")
        .upsert({ key: RESYNC_STAGE_KEY, value: "orders", updated_at: new Date().toISOString() });
      result = { ran: true, warnings };
    }
    // Libère le verrou tout de suite : l'étape suivante peut démarrer au
    // prochain appel sans attendre l'expiration des 10 min.
    await supabase
      .from("app_state")
      .upsert({ key: RESYNC_LOCK_KEY, value: "released", updated_at: new Date(0).toISOString() });
  } else {
    result = await runIncrementalSync(supabase, productsMap as ProductMapEntry[]);
  }
  await supabase
    .from("app_state")
    .upsert({ key: THROTTLE_KEY, value: "done", updated_at: new Date().toISOString() });
  return result;
}
