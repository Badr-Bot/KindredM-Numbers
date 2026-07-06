import type { SupabaseClient } from "@supabase/supabase-js";
import { computeDailyAggregate, type Market } from "./engine";

const ALL_MARKETS: Market[] = ["ES", "UK", "DE", "FR"];

/**
 * Recalcule daily_aggregates(day, market) depuis les données brutes (orders +
 * meta_spend) — loi §0.6 "recalcul plutôt que patch". daily_aggregates n'est
 * jamais édité à la main, uniquement réécrit ici.
 */
export async function recomputeDailyAggregate(
  supabase: SupabaseClient,
  day: string,
  market: Market
): Promise<void> {
  const { data: orders, error: ordersError } = await supabase
    .from("orders")
    .select("total_cents, refunded_cents, cogs_product_cents, cogs_upsells_cents, tax_eu_cents")
    .eq("day", day)
    .eq("store", market);
  if (ordersError) throw ordersError;

  const { data: spendRows, error: spendError } = await supabase
    .from("meta_spend")
    .select("spend_cents")
    .eq("day", day)
    .eq("market", market);
  if (spendError) throw spendError;

  const rows = orders ?? [];
  const caCents = rows.reduce((sum, o) => sum + o.total_cents - o.refunded_cents, 0);
  const cogsCents = rows.reduce((sum, o) => sum + o.cogs_product_cents + o.cogs_upsells_cents, 0);
  const taxCents = rows.reduce((sum, o) => sum + o.tax_eu_cents, 0);
  const refundedCents = rows.reduce((sum, o) => sum + o.refunded_cents, 0);
  const spendCents = (spendRows ?? []).reduce((sum, s) => sum + s.spend_cents, 0);

  const aggregate = computeDailyAggregate({
    orders: rows.length,
    caCents,
    spendCents,
    cogsCents,
    taxCents,
  });

  const { error: upsertError } = await supabase.from("daily_aggregates").upsert({
    day,
    market,
    orders: aggregate.orders,
    ca_cents: aggregate.caCents,
    spend_cents: aggregate.spendCents,
    cogs_cents: aggregate.cogsCents,
    tax_cents: aggregate.taxCents,
    fees_cents: aggregate.feesCents,
    net_cents: aggregate.netCents,
    refunded_cents: refundedCents,
  });
  if (upsertError) throw upsertError;
}

export async function recomputeDailyAggregatesForDays(
  supabase: SupabaseClient,
  days: Iterable<string>,
  markets: Market[] = ALL_MARKETS
): Promise<void> {
  for (const day of days) {
    for (const market of markets) {
      await recomputeDailyAggregate(supabase, day, market);
    }
  }
}
