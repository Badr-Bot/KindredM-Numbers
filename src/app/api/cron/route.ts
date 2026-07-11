import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase";
import { getShopifyStoreConfigs, iterateOrders, computeRefundedCents } from "@/lib/shopify";
import { fetchMetaSpend, loadCampaignOverrides, resolveCampaignMarket } from "@/lib/meta";
import { classifyLineItems, computeOrderCogsTax, type ProductMapEntry } from "@/lib/engine";
import { toParisDay, todayParisDay, addDaysToDay } from "@/lib/time";
import { recomputeDailyAggregatesForDays } from "@/lib/aggregate";

export const maxDuration = 60;

/**
 * Clôture quotidienne (§2/§7.5) — Vercel Cron, planifié à 00:05 Europe/Paris
 * (voir vercel.json ; le décalage CET/CEST de ±1h sur l'heure UTC du trigger
 * est sans conséquence, la logique ci-dessous raisonne en jours calendaires
 * Europe/Paris, pas en heure de déclenchement).
 *
 * Re-fetch les commandes modifiées sur les 7 derniers jours (pour attraper
 * les remboursements tardifs — §4.7), le spend Meta de J-7 à J-1, puis
 * recalcule daily_aggregates pour tous les jours touchés (loi §0.6).
 */
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const supabase = createSupabaseServerClient();
  const { data: productsMap, error: mapError } = await supabase.from("products_map").select("*");
  if (mapError) {
    return NextResponse.json({ error: mapError.message }, { status: 500 });
  }

  // Filet de sécurité « zéro clic » : si la base n'a jamais été initialisée
  // (mapping vide), le cron fait l'init complète au lieu du rescan J-7.
  if (!productsMap || productsMap.length === 0) {
    const { runAutoSetup } = await import("@/lib/autoSetup");
    const setup = await runAutoSetup();
    return NextResponse.json({ autoSetup: setup }, { status: setup.ok ? 200 : 500 });
  }

  const today = todayParisDay();
  const rescanFromDay = addDaysToDay(today, -7);
  const yesterday = addDaysToDay(today, -1);
  const updatedAtMinIso = `${rescanFromDay}T00:00:00+02:00`;

  const configs = getShopifyStoreConfigs();
  const touchedDays = new Set<string>();

  for (const config of configs) {
    for await (const order of iterateOrders(config, { updatedAtMin: updatedAtMinIso })) {
      const day = toParisDay(order.created_at);
      touchedDays.add(day);
      const shippingCountry = order.shipping_address?.country_code ?? config.market;

      const classified = classifyLineItems(
        order.line_items.map((li) => ({
          title: li.title,
          sku: li.sku ?? undefined,
          quantity: li.quantity,
          price_cents: Math.round(parseFloat(li.price) * 100),
        })),
        (productsMap ?? []) as ProductMapEntry[],
        config.market
      );

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
  }

  const [metaRows, overrides] = await Promise.all([
    fetchMetaSpend(rescanFromDay, yesterday),
    loadCampaignOverrides(supabase),
  ]);
  for (const row of metaRows) {
    touchedDays.add(row.day);
    const market = resolveCampaignMarket(row.campaignName, row.campaignId, overrides);
    await supabase.from("meta_spend").upsert({
      day: row.day,
      market, // peut être "UNMAPPED" — persisté pour affectation manuelle dans l'UI (§4.6)
      campaign_id: row.campaignId,
      campaign_name: row.campaignName,
      spend_cents: row.spendCents,
    });
  }

  await recomputeDailyAggregatesForDays(supabase, touchedDays);

  return NextResponse.json({ ok: true, touchedDays: [...touchedDays].sort() });
}
