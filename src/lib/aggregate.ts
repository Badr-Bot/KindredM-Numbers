import type { SupabaseClient } from "@supabase/supabase-js";
import { computeDailyAggregate, type Market } from "./engine";

const ALL_MARKETS: Market[] = ["ES", "UK", "DE", "FR"];

// Un spend Meta dont la campagne n'est pas encore reconnue (nom qui ne
// contient ni FR/ESP/GE/UK ni les synonymes usuels, ex. campagne "WORLD"
// fraîchement créée) est écrit avec market="UNMAPPED" — voir mapCampaignToMarket
// (§4.6). Avant ce correctif, ce bucket n'était JAMAIS lu ici (`.in("market",
// markets)` l'excluait) : la dépense disparaissait purement et simplement du
// Net/Marge du jour tant que Badr n'allait pas l'assigner manuellement dans
// Contrôle (constaté 22/07 : spend du jour affiché 1 158 € au lieu de
// 1 275,75 € réels). On l'inclut désormais TOUJOURS dans le total GLOBAL —
// coût réel, marché encore inconnu — sans jamais l'assigner à un marché au
// hasard (l'affectation reste manuelle, §4.6).
const UNMAPPED_MARKET = "UNMAPPED";

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

// PostgREST plafonne chaque réponse à ~1000 lignes : sans pagination, tout
// backfill de plus de 1000 commandes calculait le CA sur un échantillon
// tronqué (bug « le CA affiché ne correspond pas à Shopify », 15/07).
const PAGE = 1000;

async function fetchAllPages<T>(
  build: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>
): Promise<T[]> {
  const all: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await build(from, from + PAGE - 1);
    if (error) throw error;
    const rows = data ?? [];
    all.push(...rows);
    if (rows.length < PAGE) break;
  }
  return all;
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

  // Tri STABLE obligatoire : sans ORDER BY, la pagination .range() n'est pas
  // déterministe — une commande écrite pendant la lecture décale les pages et
  // des lignes reviennent en double (constaté 20/07 : jour compté 2×, CA et
  // commandes exactement doublés). Ceinture + bretelles : tri par clé unique
  // ET déduplication en mémoire.
  const [ordersRaw, spendRaw] = await Promise.all([
    fetchAllPages<OrderAggInput & { id: number }>((from, to) =>
      supabase
        .from("orders")
        .select("id, day, store, total_cents, refunded_cents, cogs_product_cents, cogs_upsells_cents, tax_eu_cents")
        .gte("day", minDay)
        .lte("day", maxDay)
        .in("store", markets)
        .order("id", { ascending: true })
        .range(from, to) as unknown as PromiseLike<{ data: (OrderAggInput & { id: number })[] | null; error: { message: string } | null }>
    ),
    fetchAllPages<SpendAggInput & { campaign_id: string }>((from, to) =>
      supabase
        .from("meta_spend")
        .select("day, market, campaign_id, spend_cents")
        .gte("day", minDay)
        .lte("day", maxDay)
        .in("market", [...markets, UNMAPPED_MARKET])
        .order("day", { ascending: true })
        .order("campaign_id", { ascending: true })
        .range(from, to) as unknown as PromiseLike<{ data: (SpendAggInput & { campaign_id: string })[] | null; error: { message: string } | null }>
    ),
  ]);
  const seenOrderIds = new Set<number>();
  const orders = ordersRaw.filter((o) => {
    if (seenOrderIds.has(o.id)) return false;
    seenOrderIds.add(o.id);
    return true;
  });
  const seenSpendKeys = new Set<string>();
  const spendRows = spendRaw.filter((s) => {
    const k = `${s.day}|${s.campaign_id}`;
    if (seenSpendKeys.has(k)) return false;
    seenSpendKeys.add(k);
    return true;
  });

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
  // UNMAPPED toujours inclus : voir commentaire en tête de fichier.
  for (const day of dayList) {
    for (const market of [...markets, UNMAPPED_MARKET]) buckets.set(key(day, market), emptyBucket());
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
  // UNMAPPED est isolé dans son propre lot : la colonne `market` a une
  // contrainte CHECK ('ES','UK','DE','FR') tant que la migration 0009 n'est
  // pas collée — un rejet sur ce lot ne doit jamais faire échouer le
  // recalcul des VRAIS marchés (régression bien pire que le bug qu'il corrige).
  const CHUNK = 500;
  const knownRows = rows.filter((r) => r.market !== UNMAPPED_MARKET);
  const unmappedRows = rows.filter((r) => r.market === UNMAPPED_MARKET);
  for (let i = 0; i < knownRows.length; i += CHUNK) {
    const { error } = await supabase.from("daily_aggregates").upsert(knownRows.slice(i, i + CHUNK));
    if (error) throw error;
  }
  for (let i = 0; i < unmappedRows.length; i += CHUNK) {
    await supabase.from("daily_aggregates").upsert(unmappedRows.slice(i, i + CHUNK));
    // Erreur ignorée ici (ex. migration 0009 pas encore appliquée) : le spend
    // UNMAPPED redevient alors invisible du total, comme avant ce correctif —
    // jamais bloquant pour le reste.
  }
}
