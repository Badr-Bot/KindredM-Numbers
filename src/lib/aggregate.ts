import type { SupabaseClient } from "@supabase/supabase-js";
import { computeDailyAggregate, type Market } from "./engine";

const ALL_MARKETS: Market[] = ["ES", "UK", "DE", "FR"];

interface OrderAggInput {
  day: string;
  store: string;
  total_cents: number;
  refunded_cents: number;
  cogs_product_cents: number;
  cogs_upsells_cents: number;
  tax_eu_cents: number;
}

interface SpendAggInput {
  day: string;
  market: string;
  spend_cents: number;
}

/**
 * Recalcule daily_aggregates(day, market) depuis les données brutes (orders +
 * meta_spend) — loi §0.6 "recalcul plutôt que patch". daily_aggregates n'est
 * jamais édité à la main, uniquement réécrit ici.
 *
 * Version en masse : 3 requêtes DB au total (au lieu de ~3 par (jour, marché)
 * avec la boucle séquentielle précédente — un backfill de 6 semaines × 4
 * marchés faisait ~500 aller-retours réseau, largement la cause des
 * initialisations qui semblaient bloquées). Regroupe en mémoire, upsert par
 * lots.
 */
export async function recomputeDailyAggregatesForDays(
  supabase: SupabaseClient,
  days: Iterable<string>,
  markets: Market[] = ALL_MARKETS
): Promise<void> {
  const dayList = [...days];
  if (dayList.length === 0) return;
  const minDay = dayList.reduce((a, b) => (b < a ? b : a));
  const maxDay = dayList.reduce((a, b) => (b > a ? b : a));

  const [{ data: orders, error: ordersError }, { data: spendRows, error: spendError }] =
    await Promise.all([
      supabase
        .from("orders")
        .select("day, store, total_cents, refunded_cents, cogs_product_cents, cogs_upsells_cents, tax_eu_cents")
        .gte("day", minDay)
        .lte("day", maxDay)
        .in("store", markets) as unknown as Promise<{ data: OrderAggInput[] | null; error: { message: string } | null }>,
      supabase
        .from("meta_spend")
        .select("day, market, spend_cents")
        .gte("day", minDay)
        .lte("day", maxDay)
        .in("market", markets) as unknown as Promise<{ data: SpendAggInput[] | null; error: { message: string } | null }>,
    ]);
  if (ordersError) throw ordersError;
  if (spendError) throw spendError;

  type Bucket = {
    orders: number;
    caCents: number;
    cogsCents: number;
    taxCents: number;
    refundedCents: number;
    spendCents: number;
  };
  const key = (day: string, market: string) => `${day}|${market}`;
  const buckets = new Map<string, Bucket>();
  const emptyBucket = (): Bucket => ({
    orders: 0,
    caCents: 0,
    cogsCents: 0,
    taxCents: 0,
    refundedCents: 0,
    spendCents: 0,
  });

  // Initialise tous les (jour, marché) demandés à zéro, pour bien écraser
  // un ancien agrégat si les données brutes ont disparu (remboursement total, etc).
  for (const day of dayList) {
    for (const market of markets) buckets.set(key(day, market), emptyBucket());
  }

  for (const o of orders ?? []) {
    const k = key(o.day, o.store);
    const b = buckets.get(k);
    if (!b) continue; // hors de la plage de jours demandée
    b.orders += 1;
    b.caCents += o.total_cents - o.refunded_cents;
    b.cogsCents += o.cogs_product_cents + o.cogs_upsells_cents;
    b.taxCents += o.tax_eu_cents;
    b.refundedCents += o.refunded_cents;
  }
  for (const s of spendRows ?? []) {
    const b = buckets.get(key(s.day, s.market));
    if (!b) continue;
    b.spendCents += s.spend_cents;
  }

  const rows = [...buckets.entries()].map(([k, b]) => {
    const [day, market] = k.split("|");
    const agg = computeDailyAggregate({
      orders: b.orders,
      caCents: b.caCents,
      spendCents: b.spendCents,
      cogsCents: b.cogsCents,
      taxCents: b.taxCents,
    });
    return {
      day,
      market,
      orders: agg.orders,
      ca_cents: agg.caCents,
      spend_cents: agg.spendCents,
      cogs_cents: agg.cogsCents,
      tax_cents: agg.taxCents,
      fees_cents: agg.feesCents,
      net_cents: agg.netCents,
      refunded_cents: b.refundedCents,
    };
  });

  // Upsert par lots de 500 (limite raisonnable côté payload/Postgres).
  const CHUNK = 500;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const { error } = await supabase.from("daily_aggregates").upsert(rows.slice(i, i + CHUNK));
    if (error) throw error;
  }
}
