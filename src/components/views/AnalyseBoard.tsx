"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DayAgg, Thresholds } from "@/lib/data";
import type { AnalyticsData } from "@/lib/analytics";
import { EVENT_TYPE_META, type EventType, type JournalEvent } from "@/lib/journal";
import type { MarketTab } from "@/lib/markets";
import { formatDayShort, formatEur0, formatRoas, formatRoasBare } from "@/lib/format";
import { MarketTabs } from "../shell/MarketTabs";
import { useSound } from "../sound/SoundProvider";

// ---------------------------------------------------------------------------
// Types & helpers
// ---------------------------------------------------------------------------

interface DayMetrics {
  day: string;
  label: string;
  caCents: number;
  orders: number;
  spendCents: number;
  impressions: number;
  clicks: number;
  cpaCents: number | null;
  cpmCents: number | null;
  cpcCents: number | null;
  ctrPct: number | null;
  cvrPct: number | null;
  aovCents: number | null;
  roas: number | null;
  /** fréquence = impressions / reach (fatigue/saturation) */
  freq: number | null;
}

const eur2 = (cents: number) =>
  (cents / 100).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
const pct2 = (v: number) => v.toLocaleString("fr-FR", { maximumFractionDigits: 2 }) + " %";

function pearson(xs: number[], ys: number[]): number | null {
  const n = xs.length;
  if (n < 7) return null;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let dx = 0;
  let dy = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - mx) * (ys[i] - my);
    dx += (xs[i] - mx) ** 2;
    dy += (ys[i] - my) ** 2;
  }
  if (dx === 0 || dy === 0) return null;
  return num / Math.sqrt(dx * dy);
}

interface MetricDef {
  key: keyof DayMetrics;
  label: string;
  emoji: string;
  color: string;
  /** true = une hausse est mauvaise (coûts) */
  upIsBad: boolean;
  needsMeta: boolean;
  format: (v: number) => string;
}

const METRICS: MetricDef[] = [
  { key: "cpaCents", label: "CPA (spend / cmd)", emoji: "🎯", color: "#ff7a29", upIsBad: true, needsMeta: false, format: eur2 },
  { key: "cpmCents", label: "CPM", emoji: "📢", color: "#2fd8ff", upIsBad: true, needsMeta: true, format: eur2 },
  { key: "cpcCents", label: "CPC", emoji: "🖱️", color: "#2fd8ff", upIsBad: true, needsMeta: true, format: eur2 },
  { key: "ctrPct", label: "CTR", emoji: "👀", color: "#ffc61a", upIsBad: false, needsMeta: true, format: pct2 },
  { key: "cvrPct", label: "CVR (cmd / clics)", emoji: "🛒", color: "#ffc61a", upIsBad: false, needsMeta: true, format: pct2 },
  { key: "aovCents", label: "Panier moyen", emoji: "💶", color: "#ffc61a", upIsBad: false, needsMeta: false, format: eur2 },
];

type Preset = "7" | "14" | "30" | "all" | "custom";

// ---------------------------------------------------------------------------

export function AnalyseBoard({
  dayData,
  analytics,
  historyStart,
  today,
  events,
  journalReady,
  thresholds,
  activeCampaignIds,
}: {
  dayData: Record<MarketTab, DayAgg[]>;
  analytics: AnalyticsData;
  historyStart: string;
  today: string;
  events: JournalEvent[];
  journalReady: boolean;
  thresholds: Thresholds;
  activeCampaignIds: Set<string> | null;
}) {
  const { play } = useSound();
  const router = useRouter();
  const [tab, setTab] = useState<MarketTab>("GLOBAL");
  const [preset, setPreset] = useState<Preset>("14");
  const [customFrom, setCustomFrom] = useState(historyStart);
  const [customTo, setCustomTo] = useState(today);
  const [campaignFilter, setCampaignFilter] = useState<string>("ALL");

  const { from, to } = useMemo(() => {
    if (preset === "custom") return { from: customFrom, to: customTo };
    if (preset === "all") return { from: historyStart, to: today };
    const days = Number(preset);
    const d = new Date(`${today}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() - (days - 1));
    return { from: d.toISOString().slice(0, 10), to: today };
  }, [preset, customFrom, customTo, historyStart, today]);

  const hasMetaData = analytics.insights.length > 0;

  // Campagnes disponibles dans l'onglet marché actif — sert à isoler une
  // courbe par campagne au lieu d'une moyenne mélangée entre plusieurs
  // campagnes actives en même temps (constaté 25/07 : pas représentatif
  // dès que 2+ campagnes tournent dans le même marché).
  const campaignsForTab = useMemo(() => {
    const seen = new Map<string, string>();
    for (const r of analytics.insights) {
      if (tab !== "GLOBAL" && r.market !== tab) continue;
      if (r.campaignId && !seen.has(r.campaignId)) seen.set(r.campaignId, r.campaignName || r.campaignId);
    }
    return [...seen.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [analytics.insights, tab]);

  // Le filtre campagne doit rester valide quand on change d'onglet marché.
  const effectiveCampaignFilter = campaignsForTab.some(([id]) => id === campaignFilter) ? campaignFilter : "ALL";

  // Série journalière fusionnée (agrégats Shopify + insights Meta) sur la fenêtre.
  // Spend/CPM/CPC/CTR/fréquence restent fiables par campagne (données Meta
  // pures). CA/commandes/CPA/CVR/ROAS/panier, eux, ne le sont PAS dès qu'une
  // campagne précise est isolée : Shopify ne sait pas quelle commande vient
  // de quelle campagne, seulement du marché entier — ils passent à null
  // plutôt que d'afficher un chiffre trompeur (voir bandeau sous les filtres).
  const series: DayMetrics[] = useMemo(() => {
    const insightsByDay = new Map<string, { spendCents: number; impressions: number; clicks: number; reach: number }>();
    for (const r of analytics.insights) {
      if (r.day < from || r.day > to) continue;
      if (tab !== "GLOBAL" && r.market !== tab) continue;
      if (effectiveCampaignFilter !== "ALL" && r.campaignId !== effectiveCampaignFilter) continue;
      const cur = insightsByDay.get(r.day) ?? { spendCents: 0, impressions: 0, clicks: 0, reach: 0 };
      cur.spendCents += r.spendCents;
      cur.impressions += r.impressions;
      cur.clicks += r.clicks;
      cur.reach += r.reach;
      insightsByDay.set(r.day, cur);
    }
    const byCampaign = effectiveCampaignFilter !== "ALL";
    return dayData[tab]
      .filter((d) => d.day >= from && d.day <= to)
      .map((d) => {
        const ins = insightsByDay.get(d.day) ?? { spendCents: 0, impressions: 0, clicks: 0, reach: 0 };
        // Spend de la campagne isolée si filtré, sinon spend Shopify/marché.
        const spendCents = byCampaign ? ins.spendCents : d.spendCents;
        return {
          day: d.day,
          label: formatDayShort(d.day),
          caCents: d.caCents,
          orders: d.orders,
          spendCents,
          impressions: ins.impressions,
          clicks: ins.clicks,
          cpaCents: !byCampaign && d.orders > 0 && d.spendCents > 0 ? Math.round(d.spendCents / d.orders) : null,
          cpmCents: ins.impressions > 0 ? Math.round((spendCents / ins.impressions) * 1000) : null,
          cpcCents: ins.clicks > 0 ? Math.round(spendCents / ins.clicks) : null,
          ctrPct: ins.impressions > 0 ? (ins.clicks / ins.impressions) * 100 : null,
          cvrPct: !byCampaign && ins.clicks > 0 ? (d.orders / ins.clicks) * 100 : null,
          aovCents: !byCampaign && d.orders > 0 ? Math.round(d.caCents / d.orders) : null,
          roas: !byCampaign && d.spendCents > 0 ? d.caCents / d.spendCents : null,
          freq: ins.reach > 0 ? ins.impressions / ins.reach : null,
        };
      });
  }, [dayData, analytics.insights, tab, from, to, effectiveCampaignFilter]);

  // 🚨 Dérapages : moyenne 3 derniers jours pleins vs 7 précédents, par métrique.
  const alerts = useMemo(() => {
    const full = series.filter((d) => d.day < today);
    if (full.length < 6) return [];
    const out: { def: MetricDef; deltaPct: number; bad: boolean; recent: number }[] = [];
    for (const def of METRICS) {
      const vals = full.map((d) => d[def.key] as number | null);
      const recent = vals.slice(-3).filter((v): v is number => v !== null);
      const before = vals.slice(-10, -3).filter((v): v is number => v !== null);
      if (recent.length < 2 || before.length < 3) continue;
      const avgR = recent.reduce((a, b) => a + b, 0) / recent.length;
      const avgB = before.reduce((a, b) => a + b, 0) / before.length;
      if (avgB === 0) continue;
      const deltaPct = (avgR - avgB) / Math.abs(avgB);
      if (Math.abs(deltaPct) < 0.2) continue;
      out.push({ def, deltaPct, bad: def.upIsBad ? deltaPct > 0 : deltaPct < 0, recent: avgR });
    }
    return out.sort((a, b) => Math.abs(b.deltaPct) - Math.abs(a.deltaPct));
  }, [series, today]);

  // 🧠 Diagnostic : hypothèses en clair sur les dérapages, croisées avec le
  // journal (un événement ≤ 4 jours avant le mouvement = suspect n°1).
  const diagnosis = useMemo(() => {
    const full = series.filter((d) => d.day < today);
    if (full.length < 6) return [];
    const deltaOf = (key: keyof DayMetrics): number | null => {
      const vals = full.map((d) => d[key] as number | null);
      const recent = vals.slice(-3).filter((v): v is number => v !== null);
      const before = vals.slice(-10, -3).filter((v): v is number => v !== null);
      if (recent.length < 2 || before.length < 3) return null;
      const aR = recent.reduce((a, b) => a + b, 0) / recent.length;
      const aB = before.reduce((a, b) => a + b, 0) / before.length;
      return aB === 0 ? null : (aR - aB) / Math.abs(aB);
    };
    const d = {
      cpm: deltaOf("cpmCents"),
      cpc: deltaOf("cpcCents"),
      ctr: deltaOf("ctrPct"),
      cvr: deltaOf("cvrPct"),
      cpa: deltaOf("cpaCents"),
      freq: deltaOf("freq"),
      aov: deltaOf("aovCents"),
    };
    const pctTxt = (v: number) => `${v >= 0 ? "+" : "−"}${Math.round(Math.abs(v) * 100)} %`;
    const lines: { emoji: string; text: string }[] = [];

    // Événements récents du journal = suspects prioritaires
    const lastDay = full[full.length - 1]?.day ?? today;
    const cutoff = new Date(`${lastDay}T00:00:00Z`);
    cutoff.setUTCDate(cutoff.getUTCDate() - 6);
    const recentEvents = events.filter((e) => e.day >= cutoff.toISOString().slice(0, 10) && e.day <= lastDay);

    if (d.cpm !== null && d.cpm > 0.2) {
      if (d.freq !== null && d.freq > 0.15) {
        lines.push({
          emoji: "🔥",
          text: `CPM ${pctTxt(d.cpm)} ET fréquence ${pctTxt(d.freq)} → saturation d'audience probable : Meta repaie les mêmes personnes plus cher. Élargir l'audience ou pousser de nouvelles créas.`,
        });
      } else {
        lines.push({
          emoji: "💸",
          text: `CPM ${pctTxt(d.cpm)} avec fréquence stable → l'enchère coûte plus cher, pas l'usure : concurrence, re-learning après un changement (page, campagne, budget), ou période chargée.`,
        });
      }
    }
    if (d.ctr !== null && d.ctr < -0.15) {
      lines.push({
        emoji: "🎨",
        text: `CTR ${pctTxt(d.ctr)}${d.freq !== null && d.freq > 0.1 ? " avec fréquence en hausse" : ""} → fatigue créa probable : le hook n'arrête plus le scroll. Rotation de créas à prévoir.`,
      });
    }
    if (d.cvr !== null && d.cvr < -0.15) {
      lines.push({
        emoji: "🖥️",
        text: `CVR ${pctTxt(d.cvr)} alors que les clics arrivent → le problème est APRÈS le clic : landing, offre, prix, vitesse de page ou pays livré. Vérifie ce qui a changé côté site.`,
      });
    }
    if (d.cpa !== null && d.cpa > 0.2) {
      const causes: string[] = [];
      if (d.cpm !== null && d.cpm > 0.1) causes.push("CPM");
      if (d.ctr !== null && d.ctr < -0.1) causes.push("CTR");
      if (d.cvr !== null && d.cvr < -0.1) causes.push("CVR");
      lines.push({
        emoji: "🎯",
        text: `CPA ${pctTxt(d.cpa)} — moteur principal : ${causes.length ? causes.join(" + ") : "mix de petits mouvements"}.`,
      });
    }
    for (const e of recentEvents.slice(0, 2)) {
      lines.push({
        emoji: "📓",
        text: `Suspect n°1 à vérifier : « ${e.note} » (${formatDayShort(e.day)}) — colle avec le début du mouvement ?`,
      });
    }
    if (lines.length === 0 && (d.cpa !== null || d.cpm !== null)) {
      lines.push({ emoji: "✅", text: "Pas de dérapage majeur sur les 3 derniers jours — RAS." });
    }
    return lines;
  }, [series, today, events]);

  // 🔗 Corrélations (Pearson) sur la fenêtre, entre paires parlantes.
  const correlations = useMemo(() => {
    const pairs: {
      a: keyof DayMetrics;
      b: keyof DayMetrics;
      la: string;
      lb: string;
      reading: string;
    }[] = [
      { a: "cpmCents", b: "cpaCents", la: "CPM", lb: "CPA", reading: "l'enchère se paie plus cher → l'acquisition suit : dérapage côté audience/enchère, pas créa" },
      { a: "ctrPct", b: "cpaCents", la: "CTR", lb: "CPA", reading: "quand la créa accroche moins, le CPA monte : dérapage côté créa" },
      { a: "ctrPct", b: "cvrPct", la: "CTR", lb: "CVR", reading: "les clics attirés convertissent aussi : l'angle est aligné avec l'offre" },
      { a: "spendCents", b: "caCents", la: "Spend", lb: "CA", reading: "le CA suit le budget : il reste de la marge pour scaler" },
      { a: "spendCents", b: "cpaCents", la: "Spend", lb: "CPA", reading: "pousser le budget renchérit l'acquisition : saturation de l'audience" },
    ];
    const out: { la: string; lb: string; r: number; reading: string }[] = [];
    for (const p of pairs) {
      const xs: number[] = [];
      const ys: number[] = [];
      for (const d of series) {
        const x = d[p.a] as number | null;
        const y = d[p.b] as number | null;
        if (x !== null && y !== null) {
          xs.push(x);
          ys.push(y);
        }
      }
      const r = pearson(xs, ys);
      if (r !== null && Math.abs(r) >= 0.5) out.push({ la: p.la, lb: p.lb, r, reading: p.reading });
    }
    return out.sort((a, b) => Math.abs(b.r) - Math.abs(a.r));
  }, [series]);

  // 🎨 Créas gagnantes actives (données niveau annonce).
  // Révisé le 04/08 (Badr) : l'ancien seuil fixe "ROAS ≥ 2" (19/07) était
  // déconnecté de la vraie rentabilité — une créa à 1,66× est déjà
  // profitable (BE ≈ 1,62×) mais ne recevait jamais le 🏆, d'où un hit rate
  // ridicule (1 % alors que la plupart des créas listées gagnent de
  // l'argent). Deux changements demandés par Badr :
  //   1. Le spend n'est plus un critère (l'ancien seuil "≥ 1 000 € de
  //      spend" est supprimé) — seul le ROAS compte, quelle que soit la
  //      taille de l'échantillon.
  //   2. Une créa dont la CAMPAGNE MÈRE n'est plus active (coupée/en pause)
  //      ne peut jamais être gagnante, même avec un excellent ROAS
  //      historique — sinon on pousserait à rallumer une créa dont le
  //      contexte (budget, angle, offre) a changé depuis. Statut vérifié en
  //      direct auprès de Meta (activeCampaignIds) : si indisponible
  //      (token HS, mode démo), on ne devine pas — liste vide.
  // La liste ne montre plus que les gagnantes (plus un top/flop général) :
  // gagnante = ROAS ≥ cible 15 % (seuil dynamique 14 j glissants,
  // thresholds.target, identique à celui utilisé partout ailleurs dans le
  // dash) ET campagne mère active.
  const creas = useMemo(() => {
    const winnerMinRoas = thresholds.target;
    const withMetrics = analytics.ads.map((a) => ({
      ...a,
      roas: a.spendCents > 0 && a.purchaseValueCents > 0 ? a.purchaseValueCents / a.spendCents : null,
    }));
    const isWinner = (a: (typeof withMetrics)[number]) =>
      winnerMinRoas !== null &&
      a.roas !== null &&
      a.roas >= winnerMinRoas &&
      activeCampaignIds !== null &&
      activeCampaignIds.has(a.campaignId);
    const winners = withMetrics.filter(isWinner).sort((a, b) => (b.roas ?? 0) - (a.roas ?? 0));
    return {
      // Toutes les créas AYANT DIFFUSÉ sur la période (≥1 impression) — les
      // créas « actives » dans Ads Manager mais sans diffusion n'ont pas de
      // données chez Meta, elles ne peuvent apparaître nulle part.
      seen: analytics.ads.length,
      winners: winners.length,
      hitRate: withMetrics.length > 0 ? winners.length / withMetrics.length : null,
      rows: winners,
      winnerMinRoas,
      breakEven: thresholds.breakEven,
      statusUnavailable: activeCampaignIds === null,
    };
  }, [analytics.ads, thresholds, activeCampaignIds]);

  // 📓 Marqueurs d'événements sur les courbes (fenêtre affichée)
  const eventMarkers = useMemo(
    () =>
      events
        .filter((e) => e.day >= from && e.day <= to)
        .map((e) => ({ label: formatDayShort(e.day), emoji: EVENT_TYPE_META[e.type].emoji })),
    [events, from, to]
  );

  // ⚖️ Verdict avant/après (3 j de chaque côté) par événement, sur le CA et
  // le CPA du marché affiché — calculé sur tout l'historique, pas la fenêtre.
  const eventVerdicts = useMemo(() => {
    const byDay = new Map(dayData[tab].map((d) => [d.day, d]));
    const out = new Map<number, string>();
    for (const e of events) {
      const pick = (offsets: number[]) => {
        const ca: number[] = [];
        const cpa: number[] = [];
        for (const off of offsets) {
          const d = new Date(`${e.day}T00:00:00Z`);
          d.setUTCDate(d.getUTCDate() + off);
          const row = byDay.get(d.toISOString().slice(0, 10));
          if (row && row.day < today && (row.caCents > 0 || row.spendCents > 0)) {
            ca.push(row.caCents);
            if (row.orders > 0 && row.spendCents > 0) cpa.push(row.spendCents / row.orders);
          }
        }
        return { ca, cpa };
      };
      const before = pick([-3, -2, -1]);
      const after = pick([0, 1, 2]);
      if (before.ca.length < 2 || after.ca.length < 2) continue;
      const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
      const dCa = (avg(after.ca) - avg(before.ca)) / avg(before.ca);
      let text = `CA ${dCa >= 0 ? "+" : "−"}${Math.round(Math.abs(dCa) * 100)} %`;
      if (before.cpa.length >= 2 && after.cpa.length >= 2) {
        const dCpa = (avg(after.cpa) - avg(before.cpa)) / avg(before.cpa);
        text += ` · CPA ${dCpa >= 0 ? "+" : "−"}${Math.round(Math.abs(dCpa) * 100)} %`;
      }
      out.set(e.id, text + " (3 j av/ap)");
    }
    return out;
  }, [events, dayData, tab, today]);

  // 📅 Heatmap jour-de-semaine (moyennes sur la fenêtre, jours pleins)
  const weekHeatmap = useMemo(() => {
    const WEEKDAYS = ["lun", "mar", "mer", "jeu", "ven", "sam", "dim"];
    const buckets: { ca: number[]; orders: number[]; aov: number[] }[] = WEEKDAYS.map(() => ({
      ca: [],
      orders: [],
      aov: [],
    }));
    for (const d of series) {
      if (d.day >= today) continue;
      const wd = (new Date(`${d.day}T00:00:00Z`).getUTCDay() + 6) % 7; // lun=0
      buckets[wd].ca.push(d.caCents);
      buckets[wd].orders.push(d.orders);
      if (d.aovCents !== null) buckets[wd].aov.push(d.aovCents);
    }
    const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
    const rows = [
      { label: "CA moyen", fmt: (v: number) => formatEur0(Math.round(v)), values: buckets.map((b) => avg(b.ca)) },
      { label: "Commandes", fmt: (v: number) => String(Math.round(v)), values: buckets.map((b) => avg(b.orders)) },
      { label: "Panier", fmt: eur2, values: buckets.map((b) => avg(b.aov)) },
    ];
    return { WEEKDAYS, rows, counts: buckets.map((b) => b.ca.length) };
  }, [series, today]);

  const submitEvent = async (day: string, type: EventType, note: string) => {
    const res = await fetch("/api/journal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ day, type, note }),
    });
    const json = await res.json();
    if (json.ok) {
      play("cash");
      router.refresh();
      return null;
    }
    play("error");
    return (json.reason as string) ?? "Échec.";
  };

  const deleteEvent = async (id: number) => {
    play("tick");
    await fetch("/api/journal", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    router.refresh();
  };

  const presetBtn = (p: Preset, label: string) => (
    <button
      key={p}
      onClick={() => {
        play("tab");
        setPreset(p);
      }}
      className={`rounded-md border px-3 py-1 text-xs font-semibold ${
        preset === p ? "border-phosphor/60 bg-phosphor/10 text-phosphor" : "border-line text-ink-dim"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="flex flex-col gap-3">
      {/* Filtres : période d'abord, puis marché — ils scoping tout le dessous */}
      <div className="flex flex-wrap items-center gap-1.5">
        {presetBtn("7", "7 j")}
        {presetBtn("14", "14 j")}
        {presetBtn("30", "30 j")}
        {presetBtn("all", "Tout")}
        {presetBtn("custom", "Dates…")}
        {preset === "custom" && (
          <span className="flex items-center gap-1.5 text-[11px] text-ink-dim">
            <input
              type="date"
              value={customFrom}
              min={historyStart}
              max={today}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="rounded border border-line bg-terminal px-1.5 py-1 text-[11px] text-ink"
            />
            →
            <input
              type="date"
              value={customTo}
              min={historyStart}
              max={today}
              onChange={(e) => setCustomTo(e.target.value)}
              className="rounded border border-line bg-terminal px-1.5 py-1 text-[11px] text-ink"
            />
          </span>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <MarketTabs active={tab} onChange={setTab} />
        {campaignsForTab.length > 1 && (
          <select
            value={effectiveCampaignFilter}
            onChange={(e) => {
              play("tab");
              setCampaignFilter(e.target.value);
            }}
            className="rounded border border-line bg-terminal px-2 py-1 text-[11px] text-ink"
          >
            <option value="ALL">Toutes les campagnes (moyenne)</option>
            {campaignsForTab.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        )}
      </div>
      {effectiveCampaignFilter !== "ALL" && (
        <p className="rounded-lg border border-line bg-panel/40 p-2.5 text-[10.5px] text-ink-dim">
          🎯 Vue isolée sur une campagne : CPM/CPC/CTR/fréquence sont fiables (données Meta pures).
          CPA, CVR, ROAS et panier moyen sont grisés — Shopify ne sait pas quelle commande vient de
          quelle campagne, seulement du marché entier, donc pas de chiffre inventé ici.
        </p>
      )}

      {analytics.missingTables && (
        <p className="rounded-lg border border-amber/40 bg-amber/[0.05] p-3 text-[11.5px] text-amber">
          ⚠️ Migration <b>0005_meta_insights.sql</b> pas encore appliquée dans Supabase (SQL Editor →
          Run) — les métriques Meta ne peuvent pas être stockées d&apos;ici là.
        </p>
      )}
      {!analytics.missingTables && !hasMetaData && (
        <p className="rounded-lg border border-line bg-panel/40 p-3 text-[11.5px] text-ink-dim">
          🔒 CPM, CPC, CTR, CVR et créas se rempliront automatiquement dès que le token Meta
          (app avec Marketing API) fonctionnera — aucune action ensuite. CPA et panier moyen
          sont déjà calculés depuis tes données réelles.
        </p>
      )}

      {/* 🚨 Dérapages */}
      {alerts.length > 0 && (
        <section className="rounded-lg border border-line bg-panel/40 p-3.5">
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-dim">
            🚨 Dérapages · 3 derniers jours vs 7 précédents
          </div>
          <ul className="flex flex-col gap-1.5">
            {alerts.map((a) => (
              <li key={a.def.key} className="flex items-center justify-between text-[11.5px]">
                <span>
                  <span aria-hidden>{a.def.emoji}</span> {a.def.label}
                  <span className="ml-2 text-ink-faint tnum">→ {a.def.format(a.recent)}</span>
                </span>
                <span className={`font-bold tnum ${a.bad ? "text-red" : "text-phosphor"}`}>
                  {a.deltaPct >= 0 ? "▲" : "▼"} {Math.round(Math.abs(a.deltaPct) * 100)} %
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 🧠 Diagnostic : les hypothèses en français, croisées avec le journal */}
      {diagnosis.length > 0 && (
        <section className="rounded-lg border border-phosphor/25 bg-phosphor/[0.03] p-3.5">
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-dim">
            🧠 Diagnostic · pourquoi ça bouge (hypothèses auto)
          </div>
          <ul className="flex flex-col gap-1.5">
            {diagnosis.map((l, i) => (
              <li key={i} className="text-[11.5px] leading-snug lg:text-[12.5px]">
                <span aria-hidden className="mr-1">{l.emoji}</span>
                {l.text}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Courbes : petits multiples, une métrique par graphe (jamais 2 axes).
          Les traits verticaux = événements du journal (avant/après visible). */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {METRICS.map((def) => (
          <MetricChart
            key={def.key}
            def={def}
            series={series}
            locked={def.needsMeta && !hasMetaData}
            notPerCampaign={
              effectiveCampaignFilter !== "ALL" &&
              (def.key === "cpaCents" || def.key === "cvrPct" || def.key === "aovCents")
            }
            markers={eventMarkers}
          />
        ))}
      </div>

      {/* 📅 Heatmap jour-de-semaine */}
      <section className="rounded-lg border border-line bg-panel/40 p-3.5">
        <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-ink-dim">
          📅 Quel jour de la semaine performe le mieux ?
        </div>
        <p className="mb-2 text-[10.5px] text-ink-faint">
          Moyenne de <b>tous</b> les lundis, mardis… entre le {formatDayShort(from)} et le{" "}
          {formatDayShort(to)} (le nombre entre parenthèses = combien de jours comptés). Ex. : si la
          case « dim » est la plus dorée, tes dimanches rapportent plus — pousse le budget ce jour-là.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[460px] border-collapse text-[11px] tnum lg:text-xs">
            <thead>
              <tr className="text-[9.5px] uppercase tracking-wide text-ink-dim">
                <th className="px-2 py-1 text-left font-semibold"></th>
                {weekHeatmap.WEEKDAYS.map((d, i) => (
                  <th key={d} className="px-2 py-1 text-center font-semibold">
                    {d} <span className="font-normal text-ink-faint">({weekHeatmap.counts[i]})</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {weekHeatmap.rows.map((row) => {
                const max = Math.max(...row.values.map((v) => v ?? 0), 1);
                return (
                  <tr key={row.label}>
                    <td className="whitespace-nowrap px-2 py-1 text-left font-medium text-ink-dim">
                      {row.label}
                    </td>
                    {row.values.map((v, i) => (
                      <td key={i} className="px-1 py-0.5 text-center">
                        <div
                          className="rounded px-1 py-1.5"
                          style={{ background: `rgba(255, 198, 26, ${v === null ? 0 : 0.06 + (v / max) * 0.3})` }}
                        >
                          {v === null ? "—" : row.fmt(v)}
                        </div>
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* 🔗 Corrélations */}
      <section className="rounded-lg border border-line bg-panel/40 p-3.5">
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-dim">
          🔗 Corrélations détectées sur la période
        </div>
        {correlations.length === 0 ? (
          <p className="text-[11.5px] text-ink-faint">
            Rien de significatif sur cette fenêtre (il faut ≥ 7 jours de données communes et une
            corrélation marquée). Élargis la période, ou attends les métriques Meta.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {correlations.map((c) => (
              <li key={`${c.la}-${c.lb}`} className="text-[11.5px]">
                <span className="font-semibold">
                  {c.la} ↔ {c.lb}
                </span>
                <span className={`ml-2 tnum font-bold ${Math.abs(c.r) >= 0.7 ? "text-phosphor" : "text-amber"}`}>
                  r = {c.r.toFixed(2)}
                </span>
                <span className="ml-2 text-ink-dim">— {c.reading}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 📓 Journal de bord */}
      <JournalSection
        events={events}
        verdicts={eventVerdicts}
        ready={journalReady}
        today={today}
        historyStart={historyStart}
        onSubmit={submitEvent}
        onDelete={deleteEvent}
      />

      {/* 🎨 Créas gagnantes actives */}
      <section className="rounded-lg border border-line bg-panel/40 p-3.5">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-dim">
            🏆 Créas gagnantes · campagne active
          </span>
          {creas.hitRate !== null && !creas.statusUnavailable && (
            <span className="rounded border border-phosphor/40 bg-phosphor/10 px-2 py-0.5 text-[11px] font-bold text-phosphor tnum">
              {creas.winners}/{creas.seen}
            </span>
          )}
        </div>
        {creas.statusUnavailable ? (
          <p className="text-[11.5px] text-amber">
            ⚠️ Statut des campagnes indisponible en direct (token Meta ou mode démo) — impossible
            de confirmer quelle campagne mère est active, donc pas de créa gagnante affichée par
            prudence plutôt que de deviner.
          </p>
        ) : creas.seen === 0 ? (
          <p className="text-[11.5px] text-ink-faint">
            🔒 En attente des données niveau annonce (token Meta).
          </p>
        ) : creas.rows.length === 0 ? (
          <p className="text-[11.5px] text-ink-faint">
            Aucune créa au-dessus de la cible {creas.winnerMinRoas !== null && `(${formatRoasBare(creas.winnerMinRoas)})`}{" "}
            sur une campagne active en ce moment.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] border-collapse text-[11px] lg:text-xs">
              <thead>
                <tr className="border-b border-line text-[9.5px] uppercase tracking-wide text-ink-dim">
                  <th className="px-2 py-1.5 text-left font-semibold">Créa</th>
                  <th className="px-2 py-1.5 text-left font-semibold">Campagne mère</th>
                  <th className="px-2 py-1.5 text-right font-semibold">ROAS</th>
                  <th className="px-2 py-1.5 text-right font-semibold">ROAS BE</th>
                  <th className="px-2 py-1.5 text-right font-semibold">ROAS cible</th>
                </tr>
              </thead>
              <tbody className="tnum">
                {creas.rows.map((a) => (
                  <tr key={a.adId} className="border-b border-line-soft last:border-0">
                    <td className="max-w-[220px] truncate px-2 py-1.5 text-left font-medium text-ink">
                      🏆 {a.adName}
                    </td>
                    <td className="max-w-[220px] truncate px-2 py-1.5 text-left text-ink-dim">
                      {a.campaignName}
                    </td>
                    <td className="px-2 py-1.5 text-right font-semibold text-phosphor">
                      {formatRoas(a.roas)}
                    </td>
                    <td className="px-2 py-1.5 text-right text-ink-faint">{formatRoasBare(creas.breakEven)}</td>
                    <td className="px-2 py-1.5 text-right text-ink-faint">
                      {formatRoasBare(creas.winnerMinRoas)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-2 text-[10px] text-ink-faint">
              🏆 gagnante = ROAS ≥ cible 15 % (seuil dynamique 14 j glissants) ET campagne mère
              active — le spend n&apos;est plus un critère, une créa peu testée peut apparaître
              ici avec un échantillon faible. {creas.winners}/{creas.seen} créa
              {creas.winners > 1 ? "s" : ""} avec diffusion qualifie{creas.winners > 1 ? "nt" : ""}{" "}
              en ce moment.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------

function JournalSection({
  events,
  verdicts,
  ready,
  today,
  historyStart,
  onSubmit,
  onDelete,
}: {
  events: JournalEvent[];
  verdicts: Map<number, string>;
  ready: boolean;
  today: string;
  historyStart: string;
  onSubmit: (day: string, type: EventType, note: string) => Promise<string | null>;
  onDelete: (id: number) => void;
}) {
  const [day, setDay] = useState(today);
  const [type, setType] = useState<EventType>("crea");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true);
    setMsg(null);
    const err = await onSubmit(day, type, note);
    if (err) setMsg(err);
    else setNote("");
    setBusy(false);
  };

  return (
    <section className="rounded-lg border border-line bg-panel/40 p-3.5">
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-dim">
        📓 Journal de bord · relie tes changements aux chiffres
      </div>

      {!ready ? (
        <p className="rounded border border-amber/40 bg-amber/[0.05] p-2.5 text-[11.5px] text-amber">
          ⚠️ Colle la migration <b>0006_journal.sql</b> dans Supabase (SQL Editor → Run) pour
          activer le journal.
        </p>
      ) : (
        <>
          {/* Saisie 20 secondes */}
          <div className="mb-3 flex flex-wrap items-end gap-2">
            <input
              type="date"
              value={day}
              min={historyStart}
              max={today}
              onChange={(e) => setDay(e.target.value)}
              className="rounded border border-line bg-terminal px-2 py-1.5 text-[11.5px] text-ink"
            />
            <select
              value={type}
              onChange={(e) => setType(e.target.value as EventType)}
              className="rounded border border-line bg-terminal px-2 py-1.5 text-[11.5px] text-ink"
            >
              {(Object.keys(EVENT_TYPE_META) as EventType[])
                .filter((t) => t !== "campagne")
                .map((t) => (
                  <option key={t} value={t}>
                    {EVENT_TYPE_META[t].emoji} {EVENT_TYPE_META[t].label}
                  </option>
                ))}
            </select>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="ex. bundle 4 pcs passé à 84,99 €"
              className="min-w-[180px] flex-1 rounded border border-line bg-terminal px-2 py-1.5 text-[11.5px] text-ink"
            />
            <button
              onClick={submit}
              disabled={busy || !note.trim()}
              className="rounded border border-phosphor/60 bg-phosphor/10 px-3 py-1.5 text-xs font-semibold text-phosphor transition-colors hover:bg-phosphor/20 disabled:opacity-40"
            >
              {busy ? "…" : "➕ Noter"}
            </button>
          </div>
          {msg && <p className="mb-2 text-[11px] text-red">{msg}</p>}

          {events.length === 0 ? (
            <p className="text-[11.5px] text-ink-faint">
              Aucun événement pour l&apos;instant. Note chaque changement (créa, landing, offre,
              prix…) — il apparaîtra en trait vertical sur les courbes, avec un verdict
              avant/après automatique. Les coupures/lancements de campagne se détectent tout
              seuls.
            </p>
          ) : (
            <ul className="flex max-h-72 flex-col gap-1.5 overflow-y-auto">
              {events.map((e) => (
                <li
                  key={e.id}
                  className="flex items-start justify-between gap-2 rounded border border-line-soft bg-terminal/50 px-2.5 py-1.5 text-[11.5px]"
                >
                  <span className="min-w-0">
                    <span className="mr-1.5 whitespace-nowrap font-semibold text-ink-dim tnum">
                      {formatDayShort(e.day)}
                    </span>
                    <span aria-hidden className="mr-1">{EVENT_TYPE_META[e.type].emoji}</span>
                    <span className="break-words">{e.note}</span>
                    {e.source === "auto" && (
                      <span className="ml-1.5 rounded border border-cyan/40 bg-cyan/10 px-1 text-[9px] font-bold text-cyan">
                        auto
                      </span>
                    )}
                    {verdicts.has(e.id) && (
                      <span className="ml-1.5 whitespace-nowrap text-[10.5px] text-ink-faint tnum">
                        ⚖️ {verdicts.get(e.id)}
                      </span>
                    )}
                  </span>
                  <button
                    onClick={() => onDelete(e.id)}
                    aria-label="Supprimer"
                    className="flex-none text-ink-faint hover:text-red"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}

function MetricChart({
  def,
  series,
  locked,
  notPerCampaign,
  markers,
}: {
  def: MetricDef;
  series: DayMetrics[];
  locked: boolean;
  notPerCampaign?: boolean;
  markers: { label: string; emoji: string }[];
}) {
  const data = series.map((d) => ({
    label: d.label,
    value: d[def.key] === null ? null : def.key.endsWith("Cents") ? (d[def.key] as number) / 100 : (d[def.key] as number),
  }));
  const hasData = data.some((d) => d.value !== null);

  return (
    <div className="rounded-lg border border-line bg-panel/40 p-2.5">
      <div className="mb-1 flex items-center justify-between px-1">
        <span className="text-[10.5px] font-semibold text-ink-dim">
          <span aria-hidden>{def.emoji}</span> {def.label}
        </span>
      </div>
      {locked || !hasData ? (
        <div className="flex h-32 items-center justify-center text-center text-[10.5px] text-ink-faint">
          {locked
            ? "🔒 En attente du token Meta"
            : notPerCampaign
              ? "🎯 Pas isolable par campagne (Shopify ne relie pas la vente à la campagne)"
              : "Pas de données sur la période"}
        </div>
      ) : (
        <div className="h-32 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 6, right: 8, bottom: 0, left: -14 }}>
              <CartesianGrid stroke="#322c42" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: "#6c6482", fontSize: 8.5 }}
                tickLine={false}
                axisLine={{ stroke: "#322c42" }}
                interval="preserveStartEnd"
                minTickGap={16}
              />
              <YAxis
                tick={{ fill: "#6c6482", fontSize: 8.5 }}
                tickLine={false}
                axisLine={false}
                width={44}
                domain={["auto", "auto"]}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length || payload[0].value == null) return null;
                  const v = payload[0].value as number;
                  return (
                    <div className="rounded border border-line bg-terminal/95 px-2 py-1 text-[10.5px] tnum shadow-lg">
                      <span className="text-ink-dim">{label} · </span>
                      <span className="font-bold text-ink">
                        {def.format(def.key.endsWith("Cents") ? v * 100 : v)}
                      </span>
                    </div>
                  );
                }}
              />
              {markers.map((m, i) => (
                <ReferenceLine
                  key={`${m.label}-${i}`}
                  x={m.label}
                  stroke="#6c6482"
                  strokeDasharray="3 3"
                />
              ))}
              <Line
                dataKey="value"
                stroke={def.color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, stroke: "#17141f", strokeWidth: 2 }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
