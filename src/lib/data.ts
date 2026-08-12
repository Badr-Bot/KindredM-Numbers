import {
  contributionMargin,
  marginPct,
  roas,
  roasBreakEven,
  roasStatus,
  roasTarget15,
  TARGET_NET_MARGIN,
  type Market,
  type RoasStatus,
} from "./engine";
import { cache as reactCache } from "react";
import { MARKETS, type MarketTab } from "./markets";
import { addDaysToDay, listParisDays, todayParisDay } from "./time";
import { fixedCostsCentsForDay } from "./subscriptions";

export type DataMode = "demo" | "live" | "unconfigured";

/** Premier jour d'activité (§1) — borne basse de l'historique. */
// 21/05 : « l'ecom a démarré à partir du 21 mai » (Badr 08/08) — corrigé
// depuis le 04/06 précédent. Déclenche un re-téléchargement complet des
// commandes Shopify (voir REQUIRED_FULL_RESYNC_VERSION, incrementalSync.ts)
// pour aller chercher les commandes du 21/05 au 03/06 qui manquaient.
export const HISTORY_START = "2026-05-21";

export interface DailyRow {
  day: string;
  market: Market;
  orders: number;
  caCents: number;
  spendCents: number;
  cogsCents: number;
  // cogsProductCents + cogsUpsellsCents = cogsCents ci-dessus — split affiché
  // uniquement (Vue Dépenses), jamais réutilisé pour le Net/Marge.
  cogsProductCents: number;
  cogsUpsellsCents: number;
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
  cogsProductCents: number;
  cogsUpsellsCents: number;
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
  cogsProductCents: 0,
  cogsUpsellsCents: 0,
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

  // Colonnes cogs_product_cents/cogs_upsells_cents ajoutées par la migration
  // 0010 — sélectionner une colonne inexistante ferait échouer TOUTE la
  // requête (PostgREST), donc on sonde une fois avant de les inclure (même
  // filet que acquisitionColumnsReady côté écriture).
  const { error: probeError } = await supabase.from("daily_aggregates").select("cogs_product_cents").limit(1);
  const hasCogsSplit = !probeError;
  const cols =
    "day, market, orders, ca_cents, spend_cents, cogs_cents, tax_cents, fees_cents, net_cents, refunded_cents" +
    (hasCogsSplit ? ", cogs_product_cents, cogs_upsells_cents" : "");

  interface RawAggRow {
    day: string;
    market: string;
    orders: number;
    ca_cents: number;
    spend_cents: number;
    cogs_cents: number;
    cogs_product_cents?: number | null;
    cogs_upsells_cents?: number | null;
    tax_cents: number;
    fees_cents: number;
    net_cents: number;
    refunded_cents: number | null;
  }

  const { data, error } = (await supabase
    .from("daily_aggregates")
    .select(cols)
    .gte("day", startDay)
    .lte("day", endDay)
    .order("day", { ascending: true })) as unknown as {
    data: RawAggRow[] | null;
    error: { message: string } | null;
  };
  if (error) throw error;

  return (data ?? []).map((r) => ({
    day: r.day,
    market: r.market as Market,
    orders: r.orders,
    caCents: r.ca_cents,
    spendCents: r.spend_cents,
    cogsCents: r.cogs_cents,
    cogsProductCents: hasCogsSplit ? r.cogs_product_cents ?? 0 : 0,
    cogsUpsellsCents: hasCogsSplit ? r.cogs_upsells_cents ?? 0 : 0,
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
      cogsProductCents: acc.cogsProductCents + r.cogsProductCents,
      cogsUpsellsCents: acc.cogsUpsellsCents + r.cogsUpsellsCents,
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
      cogsProductCents: cur.cogsProductCents + r.cogsProductCents,
      cogsUpsellsCents: cur.cogsUpsellsCents + r.cogsUpsellsCents,
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
  const target = cm > TARGET_NET_MARGIN ? roasTarget15(cm) : null;
  return { cm, breakEven, target };
}

/** CPA cible (centimes) = panier moyen ÷ ROAS cible, sur les 14 jours
 * glissants GLOBAL — sert à la règle « créa à couper » de l'onglet Créas
 * (25/07) : dépasse ce CPA 3 jours d'affilé = à couper. Bouge tout seul si
 * la marge change, jamais figé en dur. null si la marge ne permet pas
 * encore de définir une cible (même condition que thresholdsFromTotals). */
export async function getTargetCpaCents(endDay: string): Promise<number | null> {
  const startDay = addDaysToDay(endDay, -13);
  const rows = await fetchDailyRows(startDay, endDay);
  const totals = sumRows(rows);
  const { target } = thresholdsFromTotals(totals);
  if (target === null || totals.orders === 0) return null;
  return Math.round(totals.caCents / totals.orders / target);
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
  /** Charges fixes du jour (abonnements/équipe, 08/08) — déjà déduites du
   * net GLOBAL ci-dessus, exposées pour l'affichage. Les cartes marché et
   * produit restent HORS charges (elles somment au global avant charges). */
  fixedCostsCents: number;
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

/**
 * Même logique que getTodayAcquisition mais sur une PÉRIODE (mois/année) —
 * pour la question de Badr (08/08) : « quel canal rapporte combien ». Pas de
 * détection des clients récurrents ici (coûterait une requête énorme sur un
 * an) — uniquement la répartition CA/commandes par source.
 */
export async function getAcquisitionForRange(
  fromDay: string,
  toDay: string
): Promise<AcquisitionToday | null> {
  if (getDataMode() !== "live") return null;
  try {
    const { createSupabaseServerClient } = await import("./supabase");
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("orders")
      .select("total_cents, refunded_cents, source_name, referring_site, landing_site")
      .gte("day", fromDay)
      .lte("day", toDay);
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
    for (const o of data) {
      const net = (o.total_cents as number) - ((o.refunded_cents as number) ?? 0);
      const key = classifyOrderSource(o);
      buckets[key].orders += 1;
      buckets[key].caCents += net;
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
      repeatOrders: 0,
      repeatCaCents: 0,
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
  const yesterdayNetCents = yRows.reduce((s, r) => s + r.netCents, 0) - fixedCostsCentsForDay(yesterday);
  const yesterdayCaCents = yRows.reduce((s, r) => s + r.caCents, 0);
  const dayCount = new Set(rows.map((r) => r.day)).size || 1;
  const fixed7 = listParisDays(from, yesterday).reduce((s, d) => s + fixedCostsCentsForDay(d), 0);
  const avg7NetCents = Math.round((rows.reduce((s, r) => s + r.netCents, 0) - fixed7) / dayCount);
  const avg7CaCents = Math.round(rows.reduce((s, r) => s + r.caCents, 0) / dayCount);
  return { yesterdayNetCents, yesterdayCaCents, avg7NetCents, avg7CaCents };
}

/** Déduit les charges fixes du jour du NET d'un totals GLOBAL (jamais les
 * marchés : les charges sont transverses, les ventiler par pays serait
 * arbitraire — même doctrine que le spend UNMAPPED). */
function minusFixedCosts(t: Totals, day: string): Totals {
  return { ...t, netCents: t.netCents - fixedCostsCentsForDay(day) };
}

function cardsFromTotals(
  perMarket: Record<Market, Totals>,
  thresholds: Record<MarketTab, Thresholds>,
  // Spend Meta pas encore classé (market="UNMAPPED" dans daily_aggregates,
  // voir aggregate.ts) : jamais assigné à un marché au hasard, mais TOUJOURS
  // compté dans le GLOBAL — sinon ce total diverge de celui de l'onglet Mois
  // (qui, lui, somme toutes les lignes du jour sans filtrer par marché).
  // Bug réel constaté 27/07 : le bandeau d'alerte affirmait « déjà compté
  // dans le total » alors que ce total l'ignorait complètement.
  globalTotals: Totals = sumRows(MARKETS.map((m) => ({ day: "", market: m, ...perMarket[m] })))
): TodayMarketCard[] {
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
    CA: { ...EMPTY_TOTALS },
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
      fixedCostsCents: 0,
    };
  }

  if (mode === "demo") {
    const rows = (await fetchDailyRows(day, day));
    const perMarket = emptyPerMarket();
    for (const r of rows) if (r.market in perMarket) perMarket[r.market] = { ...r };
    return {
      mode,
      day,
      fetchedAt: new Date().toISOString(),
      fromAggregates: false,
      cards: cardsFromTotals(perMarket, thresholds, minusFixedCosts(sumRows(rows), day)),
      pace,
      acquisition: null,
      fixedCostsCents: fixedCostsCentsForDay(day),
    };
  }

  // live : lit les MÊMES agrégats que l'onglet Mois — source de vérité
  // unique, jamais de décalage entre les deux vues (demande Badr 19/07).
  // La synchro auto (LiveSync, ≤ 5 min) rafraîchit ces agrégats, jour en
  // cours et spend Meta inclus. `rows` peut contenir une ligne UNMAPPED (spend
  // Meta pas encore classé) : sumRows(rows) l'inclut dans le GLOBAL, perMarket
  // ne la garde pas (jamais assignée à un marché au hasard, voir cardsFromTotals).
  const rows = await fetchDailyRows(day, day);
  const perMarket = emptyPerMarket();
  for (const r of rows) if (r.market in perMarket) perMarket[r.market] = { ...r };
  return {
    mode,
    day,
    fetchedAt: new Date().toISOString(),
    fromAggregates: false,
    cards: cardsFromTotals(perMarket, thresholds, minusFixedCosts(sumRows(rows), day)),
    pace,
    acquisition: await getTodayAcquisition(day),
    fixedCostsCents: fixedCostsCentsForDay(day),
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
    let t: Totals = byDayMap.get(day) ?? { ...EMPTY_TOTALS };
    // Charges fixes : GLOBAL uniquement (transverses, jamais par pays).
    if (tab === "GLOBAL") t = minusFixedCosts(t, day);
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
      cogsProductCents: cur.cogsProductCents + r.cogsProductCents,
      cogsUpsellsCents: cur.cogsUpsellsCents + r.cogsUpsellsCents,
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
  result.GLOBAL = collapseByDay(rows).map((d) => ({ ...d, ...minusFixedCosts(d, d.day) }));
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
  kind: "spend" | "cogs" | "tax" | "fee" | "charges" | "net";
}

export interface ExpenseBreakdown {
  caCents: number;
  slices: ExpenseSlice[];
  netCents: number;
}

/**
 * Décomposition du CA en postes (§6.5). Les frais Shopify sont UN SEUL poste
 * au pourcentage RÉEL (calculé, jamais figé) — corrigé le 08/08 : avant, ce
 * poste était éclaté en deux lignes à pourcentage FIXE (« Shopify 3 % » /
 * « Autres 1 % »), un reliquat d'avant le branchement des vrais frais
 * Shopify par commande (shopifyFees.ts) qui tournent en réalité entre 5 et
 * 9 % selon la part de commandes hors zone euro. Le COGS est présenté polo
 * vs upsells ; cette structure accueillera d'autres produits sans
 * changement d'UI.
 *
 * Révision Badr 27/07/2026 : la TVA 5,5 % n'apparaît plus ici comme poste
 * déduit — ce n'est pas une vraie dépense (argent collecté pour l'État,
 * pas pour nous), elle est désormais incluse dans "Gain net" et suivie à
 * part pour la provision (voir 🧾 TVA cumulée, onglet Année).
 *
 * `fixedCostsCents` (08/08, Badr) : sur l'onglet GLOBAL, `t.netCents` a déjà
 * les charges fixes (abonnements/équipe) soustraites en silence — sans ce
 * paramètre, elles disparaissaient du donut sans jamais apparaître nulle
 * part (repéré par Badr : « les charges ne sont pas dans le macaron »).
 * Passer 0 (par défaut) sur les onglets par marché/produit, qui restent
 * hors charges comme partout ailleurs dans le dashboard.
 */
export function buildExpenseBreakdown(t: Totals, fixedCostsCents = 0): ExpenseBreakdown {
  const ca = t.caCents;
  const w = (c: number) => (ca > 0 ? c / ca : 0);

  // Repli tant que la migration 0010 (+ son resync auto) n'est pas encore
  // appliquée : tout le COGS reste affiché sous "polo" plutôt que de perdre
  // silencieusement la part upsells (comportement identique à avant ce correctif).
  const hasCogsSplit = t.cogsProductCents + t.cogsUpsellsCents > 0;
  const poloCents = hasCogsSplit ? t.cogsProductCents : t.cogsCents;
  const upsellCents = hasCogsSplit ? t.cogsUpsellsCents : 0;

  // Un seul poste « frais » = t.feesCents (frais Shopify RÉELS commande par
  // commande, engine.ts — le forfait « autres 1 % » a été supprimé le 12/08
  // sur demande Badr : « ça ne correspond à rien, je veux les vrais frais »).
  // Avant le 08/08 ce poste était éclaté en deux lignes à pourcentage FIXE
  // (« Shopify 3 % » / « Autres 1 %ᵄ ») — un reliquat d'avant le branchement
  // des vrais frais Shopify (qui tournent en réalité entre 5 et 8 % selon la
  // part carte/PayPal). Le pourcentage affiché est calculé en vrai (w()),
  // jamais figé.
  const feesLabel = `Frais Shopify réels (${formatFeesPctLabel(w(t.feesCents))})`;

  const slices: ExpenseSlice[] = [
    { key: "spend", label: "Spend Meta", emoji: "📣", cents: t.spendCents, weight: w(t.spendCents), kind: "spend" },
    { key: "cogs_polo", label: "COGS polo", emoji: "👕", cents: poloCents, weight: w(poloCents), kind: "cogs" },
    { key: "cogs_upsells", label: "COGS upsells", emoji: "🧦", cents: upsellCents, weight: w(upsellCents), kind: "cogs" },
    { key: "tax", label: "Taxe UE", emoji: "🇪🇺", cents: t.taxCents, weight: w(t.taxCents), kind: "tax" },
    { key: "shopify", label: feesLabel, emoji: "🛒", cents: t.feesCents, weight: w(t.feesCents), kind: "fee" },
    { key: "charges", label: "Charges fixes", emoji: "💳", cents: fixedCostsCents, weight: w(fixedCostsCents), kind: "charges" },
    { key: "net", label: "Gain net", emoji: "💰", cents: t.netCents, weight: w(t.netCents), kind: "net" },
  ];

  return { caCents: ca, slices, netCents: t.netCents };
}

function formatFeesPctLabel(weight: number): string {
  return `${(weight * 100).toFixed(1).replace(".", ",")} %`;
}
