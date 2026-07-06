import {
  contributionMargin,
  marginPct,
  roas,
  roasBreakEven,
  roasStatus,
  roasTarget20,
  type Market,
  type RoasStatus,
} from "./engine";
import { MARKETS, type MarketTab } from "./markets";
import { addDaysToDay, listParisDays, todayParisDay } from "./time";

export type DataMode = "demo" | "live" | "unconfigured";

/** Premier jour d'activité (§1) — borne basse de l'historique. */
export const HISTORY_START = "2026-06-04";

export interface DailyRow {
  day: string;
  market: Market;
  orders: number;
  caCents: number;
  spendCents: number;
  cogsCents: number;
  taxCents: number;
  feesCents: number;
  netCents: number;
}

/** Totaux d'un ensemble de lignes (un marché ou global). */
export interface Totals {
  orders: number;
  caCents: number;
  spendCents: number;
  cogsCents: number;
  taxCents: number;
  feesCents: number;
  netCents: number;
}

export interface Thresholds {
  cm: number | null; // marge de contribution blended (14j)
  breakEven: number | null;
  target: number | null;
}

const EMPTY_TOTALS: Totals = {
  orders: 0,
  caCents: 0,
  spendCents: 0,
  cogsCents: 0,
  taxCents: 0,
  feesCents: 0,
  netCents: 0,
};

// ---------------------------------------------------------------------------
// Résolution de la source de données
// ---------------------------------------------------------------------------

export function isDemoMode(): boolean {
  return process.env.NIVA_DEMO === "1";
}

export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY);
}

export function getDataMode(): DataMode {
  if (isDemoMode()) return "demo";
  if (isSupabaseConfigured()) return "live";
  return "unconfigured";
}

/** Jour « aujourd'hui » de référence (fixe en démo pour un rendu stable). */
export async function referenceToday(): Promise<string> {
  if (getDataMode() === "demo") {
    const { DEMO_TODAY } = await import("./demo");
    return DEMO_TODAY;
  }
  return todayParisDay();
}

/**
 * Lecture des agrégats journaliers [startDay, endDay] (inclus), toutes lignes
 * (jour × marché). Source : daily_aggregates (live) ou données démo. En mode
 * non configuré : vide.
 */
export async function fetchDailyRows(startDay: string, endDay: string): Promise<DailyRow[]> {
  const mode = getDataMode();

  if (mode === "demo") {
    const { getDemoDailyRows } = await import("./demo");
    return getDemoDailyRows().filter((r) => r.day >= startDay && r.day <= endDay);
  }

  if (mode === "unconfigured") return [];

  const { createSupabaseServerClient } = await import("./supabase");
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("daily_aggregates")
    .select("day, market, orders, ca_cents, spend_cents, cogs_cents, tax_cents, fees_cents, net_cents")
    .gte("day", startDay)
    .lte("day", endDay)
    .order("day", { ascending: true });
  if (error) throw error;

  return (data ?? []).map((r) => ({
    day: r.day,
    market: r.market as Market,
    orders: r.orders,
    caCents: r.ca_cents,
    spendCents: r.spend_cents,
    cogsCents: r.cogs_cents,
    taxCents: r.tax_cents,
    feesCents: r.fees_cents,
    netCents: r.net_cents,
  }));
}

// ---------------------------------------------------------------------------
// Agrégation
// ---------------------------------------------------------------------------

export function sumRows(rows: DailyRow[]): Totals {
  return rows.reduce<Totals>(
    (acc, r) => ({
      orders: acc.orders + r.orders,
      caCents: acc.caCents + r.caCents,
      spendCents: acc.spendCents + r.spendCents,
      cogsCents: acc.cogsCents + r.cogsCents,
      taxCents: acc.taxCents + r.taxCents,
      feesCents: acc.feesCents + r.feesCents,
      netCents: acc.netCents + r.netCents,
    }),
    { ...EMPTY_TOTALS }
  );
}

/** Filtre par onglet marché (GLOBAL = toutes lignes). */
export function rowsForTab(rows: DailyRow[], tab: MarketTab): DailyRow[] {
  return tab === "GLOBAL" ? rows : rows.filter((r) => r.market === tab);
}

/** Regroupe et somme par jour (utile pour GLOBAL : 1 ligne/jour). */
export function collapseByDay(rows: DailyRow[]): Array<{ day: string } & Totals> {
  const byDay = new Map<string, Totals>();
  for (const r of rows) {
    const cur = byDay.get(r.day) ?? { ...EMPTY_TOTALS };
    byDay.set(r.day, {
      orders: cur.orders + r.orders,
      caCents: cur.caCents + r.caCents,
      spendCents: cur.spendCents + r.spendCents,
      cogsCents: cur.cogsCents + r.cogsCents,
      taxCents: cur.taxCents + r.taxCents,
      feesCents: cur.feesCents + r.feesCents,
      netCents: cur.netCents + r.netCents,
    });
  }
  return [...byDay.entries()]
    .map(([day, t]) => ({ day, ...t }))
    .sort((a, b) => a.day.localeCompare(b.day));
}

// ---------------------------------------------------------------------------
// §4.7 — Seuils dynamiques (CM blended sur 14 jours glissants, par marché)
// ---------------------------------------------------------------------------

export function thresholdsFromTotals(t: Totals): Thresholds {
  const cm = contributionMargin(t.caCents, t.cogsCents, t.taxCents, t.feesCents);
  if (cm === null) return { cm: null, breakEven: null, target: null };
  const breakEven = roasBreakEven(cm);
  const target = cm > 0.2 ? roasTarget20(cm) : null;
  return { cm, breakEven, target };
}

/** Seuils par onglet marché, calculés sur les 14 jours glissants finissant à `endDay`. */
export async function computeThresholds(endDay: string): Promise<Record<MarketTab, Thresholds>> {
  const startDay = addDaysToDay(endDay, -13);
  const rows = await fetchDailyRows(startDay, endDay);
  const result = {} as Record<MarketTab, Thresholds>;
  result.GLOBAL = thresholdsFromTotals(sumRows(rows));
  for (const m of MARKETS) {
    result[m] = thresholdsFromTotals(sumRows(rows.filter((r) => r.market === m)));
  }
  return result;
}

// ---------------------------------------------------------------------------
// Dérivés d'affichage
// ---------------------------------------------------------------------------

export interface DerivedMetrics {
  marginPct: number | null;
  roas: number | null;
  status: RoasStatus;
}

export function deriveMetrics(t: Totals, thresholds: Thresholds): DerivedMetrics {
  const r = roas(t.caCents, t.spendCents);
  const be = thresholds.breakEven ?? Infinity;
  const target = thresholds.target ?? Infinity;
  return {
    marginPct: marginPct(t.netCents, t.caCents),
    roas: r,
    status: roasStatus(r, be, target),
  };
}

// ---------------------------------------------------------------------------
// Vue 6.1 — Aujourd'hui (live)
// ---------------------------------------------------------------------------

export interface TodayMarketCard {
  market: MarketTab;
  totals: Totals;
  metrics: DerivedMetrics;
  thresholds: Thresholds;
}

export interface TodayView {
  mode: DataMode;
  day: string;
  fetchedAt: string;
  /** true si les chiffres du jour viennent des agrégats en base (fallback) et non du live. */
  fromAggregates: boolean;
  cards: TodayMarketCard[]; // GLOBAL en tête puis ES/UK/DE/FR
}

function cardsFromTotals(
  perMarket: Record<Market, Totals>,
  thresholds: Record<MarketTab, Thresholds>
): TodayMarketCard[] {
  const globalTotals = sumRows(
    MARKETS.map((m) => ({ day: "", market: m, ...perMarket[m] }))
  );
  const globalCard: TodayMarketCard = {
    market: "GLOBAL",
    totals: globalTotals,
    thresholds: thresholds.GLOBAL,
    metrics: deriveMetrics(globalTotals, thresholds.GLOBAL),
  };
  const marketCards = MARKETS.map((m) => ({
    market: m,
    totals: perMarket[m],
    thresholds: thresholds[m],
    metrics: deriveMetrics(perMarket[m], thresholds[m]),
  }));
  return [globalCard, ...marketCards];
}

export async function getTodayView(): Promise<TodayView> {
  const mode = getDataMode();
  const day = await referenceToday();
  const thresholds = await computeThresholds(day);

  const emptyPerMarket = (): Record<Market, Totals> => ({
    ES: { ...EMPTY_TOTALS },
    UK: { ...EMPTY_TOTALS },
    DE: { ...EMPTY_TOTALS },
    FR: { ...EMPTY_TOTALS },
  });

  if (mode === "unconfigured") {
    return {
      mode,
      day,
      fetchedAt: new Date().toISOString(),
      fromAggregates: false,
      cards: cardsFromTotals(emptyPerMarket(), thresholds),
    };
  }

  if (mode === "demo") {
    const rows = (await fetchDailyRows(day, day));
    const perMarket = emptyPerMarket();
    for (const r of rows) perMarket[r.market] = { ...r };
    return {
      mode,
      day,
      fetchedAt: new Date().toISOString(),
      fromAggregates: false,
      cards: cardsFromTotals(perMarket, thresholds),
    };
  }

  // live : tente le fetch temps réel, retombe sur les agrégats du jour si KO.
  try {
    const { getTodaySnapshot } = await import("./live");
    const snapshot = await getTodaySnapshot();
    const perMarket = emptyPerMarket();
    for (const m of snapshot.markets) {
      perMarket[m.market] = {
        orders: m.orders,
        caCents: m.caCents,
        spendCents: m.spendCents,
        cogsCents: m.cogsCents,
        taxCents: m.taxCents,
        feesCents: m.feesCents,
        netCents: m.netCents,
      };
    }
    return {
      mode,
      day: snapshot.day,
      fetchedAt: snapshot.fetchedAt,
      fromAggregates: false,
      cards: cardsFromTotals(perMarket, thresholds),
    };
  } catch {
    const rows = await fetchDailyRows(day, day);
    const perMarket = emptyPerMarket();
    for (const r of rows) perMarket[r.market] = { ...r };
    return {
      mode,
      day,
      fetchedAt: new Date().toISOString(),
      fromAggregates: true,
      cards: cardsFromTotals(perMarket, thresholds),
    };
  }
}

// ---------------------------------------------------------------------------
// Vue 6.2 — 14 derniers jours (lignes/jour pour un onglet)
// ---------------------------------------------------------------------------

export interface DayLine extends Totals {
  day: string;
  isToday: boolean;
  cumulNetCents: number;
  marginPct: number | null;
  roas: number | null;
  status: RoasStatus;
}

export async function getDayLines(
  tab: MarketTab,
  startDay: string,
  endDay: string,
  thresholds: Thresholds,
  today: string
): Promise<DayLine[]> {
  const rows = rowsForTab(await fetchDailyRows(startDay, endDay), tab);
  const byDay = collapseByDay(rows);
  const byDayMap = new Map(byDay.map((d) => [d.day, d]));

  let cumul = 0;
  return listParisDays(startDay, endDay).map((day) => {
    const t: Totals = byDayMap.get(day) ?? { ...EMPTY_TOTALS };
    cumul += t.netCents;
    const m = deriveMetrics(t, thresholds);
    return {
      day,
      ...t,
      isToday: day === today,
      cumulNetCents: cumul,
      marginPct: m.marginPct,
      roas: m.roas,
      status: m.status,
    };
  });
}

// ---------------------------------------------------------------------------
// Vue 6.3 / 6.4 — mois & année
// ---------------------------------------------------------------------------

export interface MonthTotals extends Totals {
  yearMonth: string; // "2026-07"
}

export function groupByMonth(rows: DailyRow[]): MonthTotals[] {
  const byMonth = new Map<string, Totals>();
  for (const r of rows) {
    const ym = r.day.slice(0, 7);
    const cur = byMonth.get(ym) ?? { ...EMPTY_TOTALS };
    byMonth.set(ym, {
      orders: cur.orders + r.orders,
      caCents: cur.caCents + r.caCents,
      spendCents: cur.spendCents + r.spendCents,
      cogsCents: cur.cogsCents + r.cogsCents,
      taxCents: cur.taxCents + r.taxCents,
      feesCents: cur.feesCents + r.feesCents,
      netCents: cur.netCents + r.netCents,
    });
  }
  return [...byMonth.entries()]
    .map(([yearMonth, t]) => ({ yearMonth, ...t }))
    .sort((a, b) => a.yearMonth.localeCompare(b.yearMonth));
}

// ---------------------------------------------------------------------------
// Séries jour par onglet (pour vues mois / année, découpées côté client)
// ---------------------------------------------------------------------------

export interface DayAgg extends Totals {
  day: string;
}

/** Séries journalières [start, end] par onglet marché (GLOBAL agrégé). */
export async function getTabDayData(
  start: string,
  end: string
): Promise<Record<MarketTab, DayAgg[]>> {
  const rows = await fetchDailyRows(start, end);
  const result = {} as Record<MarketTab, DayAgg[]>;
  result.GLOBAL = collapseByDay(rows);
  for (const m of MARKETS) {
    result[m] = collapseByDay(rows.filter((r) => r.market === m));
  }
  return result;
}

// ---------------------------------------------------------------------------
// Vue 6.5 — Répartition des dépenses (extensible produits)
// ---------------------------------------------------------------------------

export interface ExpenseSlice {
  key: string;
  label: string;
  emoji: string;
  cents: number;
  /** part du CA (0..1) */
  weight: number;
  kind: "spend" | "cogs" | "tax" | "fee" | "net";
}

export interface ExpenseBreakdown {
  caCents: number;
  slices: ExpenseSlice[];
  netCents: number;
}

/**
 * Décomposition du CA en postes (§6.5). Les frais 9,5 % sont éclatés en
 * TVA 5,5 % / Shopify 3 % / Autres 1 %. Le COGS est présenté polo vs upsells ;
 * cette structure accueillera d'autres produits sans changement d'UI.
 */
export function buildExpenseBreakdown(t: Totals, splitCogs?: { poloCents: number; upsellCents: number }): ExpenseBreakdown {
  const ca = t.caCents;
  const w = (c: number) => (ca > 0 ? c / ca : 0);

  // Frais éclatés proportionnellement (5,5 / 3 / 1 sur 9,5).
  const tva = Math.round(ca * 0.055);
  const shopify = Math.round(ca * 0.03);
  const autres = t.feesCents - tva - shopify;

  const poloCents = splitCogs?.poloCents ?? t.cogsCents;
  const upsellCents = splitCogs?.upsellCents ?? 0;

  const slices: ExpenseSlice[] = [
    { key: "spend", label: "Spend Meta", emoji: "📣", cents: t.spendCents, weight: w(t.spendCents), kind: "spend" },
    { key: "cogs_polo", label: "COGS polo", emoji: "👕", cents: poloCents, weight: w(poloCents), kind: "cogs" },
    { key: "cogs_upsells", label: "COGS upsells", emoji: "🧦", cents: upsellCents, weight: w(upsellCents), kind: "cogs" },
    { key: "tax", label: "Taxe UE", emoji: "🇪🇺", cents: t.taxCents, weight: w(t.taxCents), kind: "tax" },
    { key: "tva", label: "TVA 5,5 %", emoji: "🧾", cents: tva, weight: w(tva), kind: "fee" },
    { key: "shopify", label: "Shopify 3 %", emoji: "🛒", cents: shopify, weight: w(shopify), kind: "fee" },
    { key: "autres", label: "Autres 1 %", emoji: "⚙️", cents: autres, weight: w(autres), kind: "fee" },
    { key: "net", label: "Gain net", emoji: "💰", cents: t.netCents, weight: w(t.netCents), kind: "net" },
  ];

  return { caCents: ca, slices, netCents: t.netCents };
}
