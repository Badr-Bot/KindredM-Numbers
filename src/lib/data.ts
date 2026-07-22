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
import { cache as reactCache } from "react";
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
  refundedCents: number; // brut remboursé (déjà déduit du CA/net) — pour la vue Contrôle
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
  refundedCents: number;
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
  refundedCents: 0,
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
 *
 * Mémoïsé par requête (React cache) : l'onglet Mois appelait 5× la même
 * plage (une par onglet marché) → 5 allers-retours Supabase identiques par
 * navigation, d'où des changements d'onglet très lents. Une seule lecture
 * désormais, partagée par tout le rendu.
 */
export const fetchDailyRows = reactCache(fetchDailyRowsUncached);

async function fetchDailyRowsUncached(startDay: string, endDay: string): Promise<DailyRow[]> {
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
    .select("day, market, orders, ca_cents, spend_cents, cogs_cents, tax_cents, fees_cents, net_cents, refunded_cents")
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
    refundedCents: r.refunded_cents ?? 0,
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
      refundedCents: acc.refundedCents + r.refundedCents,
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
      refundedCents: cur.refundedCents + r.refundedCents,
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

/** Références de rythme (global) : hier et moyenne 7 jours pleins précédents. */
export interface PaceReference {
  yesterdayNetCents: number;
  yesterdayCaCents: number;
  avg7NetCents: number;
  avg7CaCents: number;
}

export interface TodayView {
  mode: DataMode;
  day: string;
  fetchedAt: string;
  /** true si les chiffres du jour viennent des agrégats en base (fallback) et non du live. */
  fromAggregates: boolean;
  cards: TodayMarketCard[]; // GLOBAL en tête puis ES/UK/DE/FR
  pace: PaceReference;
  acquisition: AcquisitionToday | null;
}

// ---------------------------------------------------------------------------
// 🧭 Acquisition du jour — d'où viennent les ventes (Google/Meta/direct) +
// clients récurrents. Champs remplis par le resync v5 (migration 0008).
// ---------------------------------------------------------------------------

export interface AcquisitionSource {
  key: "meta" | "google" | "direct" | "autre";
  label: string;
  emoji: string;
  orders: number;
  caCents: number;
}

export interface AcquisitionToday {
  sources: AcquisitionSource[];
  repeatOrders: number;
  repeatCaCents: number;
  /** true = les champs source/client ne sont pas encore remplis (re-scan v5 en cours). */
  pending: boolean;
}

function classifyOrderSource(o: {
  source_name: string | null;
  referring_site: string | null;
  landing_site: string | null;
}): AcquisitionSource["key"] {
  const s = `${o.source_name ?? ""} ${o.referring_site ?? ""} ${o.landing_site ?? ""}`.toLowerCase();
  if (/facebook|instagram|fbclid|\bmeta\b|\bfb\b|\big\b/.test(s)) return "meta";
  if (/google|gclid|youtube/.test(s)) return "google";
  if (!o.referring_site && (!o.landing_site || o.landing_site === "/")) return "direct";
  return "autre";
}

async function getTodayAcquisition(day: string): Promise<AcquisitionToday | null> {
  if (getDataMode() !== "live") return null;
  try {
    const { createSupabaseServerClient } = await import("./supabase");
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("orders")
      .select("total_cents, refunded_cents, customer_id, source_name, referring_site, landing_site")
      .eq("day", day);
    if (error || !data || data.length === 0) return null;

    const base = { orders: 0, caCents: 0 };
    const buckets: Record<AcquisitionSource["key"], { orders: number; caCents: number }> = {
      meta: { ...base },
      google: { ...base },
      direct: { ...base },
      autre: { ...base },
    };
    const pending = data.every(
      (o) => o.source_name == null && o.referring_site == null && o.landing_site == null
    );

    // Récurrents : clients d'aujourd'hui déjà vus AVANT aujourd'hui.
    const ids = [...new Set(data.map((o) => o.customer_id).filter((v): v is string => !!v))];
    const seenBefore = new Set<string>();
    if (ids.length > 0) {
      const { data: prev } = await supabase
        .from("orders")
        .select("customer_id")
        .in("customer_id", ids)
        .lt("day", day)
        .limit(1000);
      for (const p of prev ?? []) if (p.customer_id) seenBefore.add(p.customer_id as string);
    }

    let repeatOrders = 0;
    let repeatCaCents = 0;
    for (const o of data) {
      const net = (o.total_cents as number) - ((o.refunded_cents as number) ?? 0);
      const key = classifyOrderSource(o);
      buckets[key].orders += 1;
      buckets[key].caCents += net;
      if (o.customer_id && seenBefore.has(o.customer_id as string)) {
        repeatOrders += 1;
        repeatCaCents += net;
      }
    }

    const META_LABELS: Record<AcquisitionSource["key"], { label: string; emoji: string }> = {
      meta: { label: "Meta", emoji: "📣" },
      google: { label: "Google", emoji: "🔎" },
      direct: { label: "Direct", emoji: "🚪" },
      autre: { label: "Autres", emoji: "❔" },
    };
    return {
      sources: (Object.keys(buckets) as AcquisitionSource["key"][]).map((k) => ({
        key: k,
        ...META_LABELS[k],
        ...buckets[k],
      })),
      repeatOrders,
      repeatCaCents,
      pending,
    };
  } catch {
    return null;
  }
}

async function computePaceReference(today: string): Promise<PaceReference> {
  const yesterday = addDaysToDay(today, -1);
  const from = addDaysToDay(today, -7);
  const rows = await fetchDailyRows(from, yesterday);
  const yRows = rows.filter((r) => r.day === yesterday);
  const yesterdayNetCents = yRows.reduce((s, r) => s + r.netCents, 0);
  const yesterdayCaCents = yRows.reduce((s, r) => s + r.caCents, 0);
  const dayCount = new Set(rows.map((r) => r.day)).size || 1;
  const avg7NetCents = Math.round(rows.reduce((s, r) => s + r.netCents, 0) / dayCount);
  const avg7CaCents = Math.round(rows.reduce((s, r) => s + r.caCents, 0) / dayCount);
  return { yesterdayNetCents, yesterdayCaCents, avg7NetCents, avg7CaCents };
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
  const pace = await computePaceReference(day);

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
      pace,
      acquisition: null,
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
      pace,
      acquisition: null,
    };
  }

  // live : lit les MÊMES agrégats que l'onglet Mois — source de vérité
  // unique, jamais de décalage entre les deux vues (demande Badr 19/07).
  // La synchro auto (LiveSync, ≤ 5 min) rafraîchit ces agrégats, jour en
  // cours et spend Meta inclus.
  const rows = await fetchDailyRows(day, day);
  const perMarket = emptyPerMarket();
  for (const r of rows) perMarket[r.market] = { ...r };
  return {
    mode,
    day,
    fetchedAt: new Date().toISOString(),
    fromAggregates: false,
    cards: cardsFromTotals(perMarket, thresholds),
    pace,
    acquisition: await getTodayAcquisition(day),
  };
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
      refundedCents: cur.refundedCents + r.refundedCents,
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
// Vue Contrôle — remboursements + rétrofacturations (litiges)
// ---------------------------------------------------------------------------

export type ChargebackStatus = "open" | "won" | "lost";

export interface Chargeback {
  id: string;
  day: string;
  market: Market;
  orderName: string | null;
  amountCents: number;
  feeCents: number;
  status: ChargebackStatus;
  reason: string | null;
}

export async function fetchChargebacks(start: string, end: string): Promise<Chargeback[]> {
  const mode = getDataMode();
  if (mode === "demo") {
    const { getDemoChargebacks } = await import("./demo");
    return getDemoChargebacks().filter((c) => c.day >= start && c.day <= end);
  }
  if (mode === "unconfigured") return [];

  const { createSupabaseServerClient } = await import("./supabase");
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("chargebacks")
    .select("id, day, market, order_name, amount_cents, fee_cents, status, reason")
    .gte("day", start)
    .lte("day", end)
    .order("day", { ascending: false });
  if (error) throw error;

  return (data ?? []).map((c) => ({
    id: c.id,
    day: c.day,
    market: c.market as Market,
    orderName: c.order_name,
    amountCents: c.amount_cents,
    feeCents: c.fee_cents,
    status: c.status as ChargebackStatus,
    reason: c.reason,
  }));
}

// ---------------------------------------------------------------------------
// §4.6 — Spend Meta non affecté (bucket UNMAPPED)
// ---------------------------------------------------------------------------

export interface UnmappedCampaign {
  campaignId: string;
  campaignName: string;
  spendCents: number;
  firstDay: string;
  lastDay: string;
}

export async function fetchUnmappedCampaigns(): Promise<UnmappedCampaign[]> {
  const mode = getDataMode();
  if (mode === "demo") {
    // Exemple synthétique pour montrer le workflow d'affectation.
    return [
      {
        campaignId: "demo-cmp-1",
        campaignName: "TEST-BROAD-POLO-V3",
        spendCents: 4230,
        firstDay: "2026-07-02",
        lastDay: "2026-07-05",
      },
    ];
  }
  if (mode === "unconfigured") return [];

  const { createSupabaseServerClient } = await import("./supabase");
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("meta_spend")
    .select("campaign_id, campaign_name, spend_cents, day")
    .eq("market", "UNMAPPED");
  if (error) throw error;

  const byCampaign = new Map<string, UnmappedCampaign>();
  for (const r of data ?? []) {
    const cur = byCampaign.get(r.campaign_id);
    if (!cur) {
      byCampaign.set(r.campaign_id, {
        campaignId: r.campaign_id,
        campaignName: r.campaign_name,
        spendCents: r.spend_cents,
        firstDay: r.day,
        lastDay: r.day,
      });
    } else {
      cur.spendCents += r.spend_cents;
      if (r.day < cur.firstDay) cur.firstDay = r.day;
      if (r.day > cur.lastDay) cur.lastDay = r.day;
    }
  }
  return [...byCampaign.values()].sort((a, b) => b.spendCents - a.spendCents);
}

/** Spend Meta non classé (campagne au nom pas reconnu) pour un jour donné —
 * sert à avertir sur Aujourd'hui que le total peut être sous-évalué tant que
 * la campagne n'est pas assignée dans Contrôle (voir aggregate.ts). */
export async function getUnmappedSpendCentsForDay(day: string): Promise<number> {
  const mode = getDataMode();
  if (mode !== "live") return 0;

  const { createSupabaseServerClient } = await import("./supabase");
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("meta_spend")
    .select("spend_cents")
    .eq("market", "UNMAPPED")
    .eq("day", day);
  if (error) return 0;
  return (data ?? []).reduce((sum, r) => sum + r.spend_cents, 0);
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
