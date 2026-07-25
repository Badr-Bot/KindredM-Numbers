"use client";

import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CreasData } from "@/lib/analytics";
import { formatDayShort, formatEur0, formatPct, formatRoas } from "@/lib/format";
import { useSound } from "../sound/SoundProvider";

// Même seuil que le hit rate de l'onglet Analyse — en dessous, la créa n'a
// pas vraiment été testée, elle ne fait que gonfler la liste sans rien dire.
const MIN_SPEND_TESTED = 2000; // 20 €

type Preset = "7" | "14" | "30" | "all";

const RANKING_LABEL: Record<string, string> = {
  above_average: "au-dessus",
  average: "moyenne",
  below_average_35: "en dessous",
  below_average_20: "en dessous",
  below_average_10: "en dessous",
  unknown: "—",
};

interface CreaRow {
  adId: string;
  adName: string;
  campaignId: string;
  campaignName: string;
  body: string | null;
  qualityRanking: string | null;
  engagementRanking: string | null;
  conversionRanking: string | null;
  spendCents: number;
  caCents: number;
  clicks: number;
  purchases: number;
  impressions: number;
  reach: number;
  linkClicks: number;
  landingPageViews: number;
  addToCart: number;
  initiateCheckout: number;
  video3s: number;
  video50: number;
  video75: number;
  video100: number;
  isVideo: boolean;
  roas: number | null;
  cpaCents: number | null;
  ctrPct: number | null;
  hookRate: number | null;
  hold50: number | null;
  hold75: number | null;
  hold100: number | null;
  lpvRate: number | null;
  cvrLanding: number | null;
  atcRate: number | null;
  checkoutRate: number | null;
}

type SortKey =
  | "spendCents"
  | "caCents"
  | "roas"
  | "cpaCents"
  | "ctrPct"
  | "hookRate"
  | "hold100"
  | "cvrLanding";

const COLUMNS: { key: SortKey; label: string; emoji: string }[] = [
  { key: "spendCents", label: "Spend", emoji: "📣" },
  { key: "caCents", label: "CA", emoji: "💶" },
  { key: "roas", label: "ROAS", emoji: "⚖️" },
  { key: "cpaCents", label: "CPA", emoji: "🎯" },
  { key: "ctrPct", label: "CTR", emoji: "👀" },
  { key: "hookRate", label: "Hook", emoji: "🪝" },
  { key: "hold100", label: "Hold 100%", emoji: "🎬" },
  { key: "cvrLanding", label: "CVR landing", emoji: "🛬" },
];

export function CreasBoard({
  creas,
  today,
  historyStart,
}: {
  creas: CreasData;
  today: string;
  historyStart: string;
}) {
  const { play } = useSound();
  const [preset, setPreset] = useState<Preset>("14");
  const [campaignFilter, setCampaignFilter] = useState<string>("ALL");
  const [sortKey, setSortKey] = useState<SortKey>("spendCents");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [expandedAdId, setExpandedAdId] = useState<string | null>(null);

  const { from, to } = useMemo(() => {
    if (preset === "all") return { from: historyStart, to: today };
    const days = Number(preset);
    const d = new Date(`${today}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() - (days - 1));
    return { from: d.toISOString().slice(0, 10), to: today };
  }, [preset, today, historyStart]);

  const metaByAd = useMemo(() => new Map(creas.meta.map((m) => [m.adId, m])), [creas.meta]);

  const campaigns = useMemo(() => {
    const names = new Set(creas.meta.map((m) => m.campaignName).filter(Boolean));
    return [...names].sort();
  }, [creas.meta]);

  const filteredDaily = useMemo(
    () => creas.daily.filter((d) => d.day >= from && d.day <= to),
    [creas.daily, from, to]
  );

  const rows: CreaRow[] = useMemo(() => {
    const byAd = new Map<string, CreaRow>();
    for (const d of filteredDaily) {
      const m = metaByAd.get(d.adId);
      if (campaignFilter !== "ALL" && m?.campaignName !== campaignFilter) continue;
      const cur = byAd.get(d.adId) ?? {
        adId: d.adId,
        adName: m?.adName ?? d.adId,
        campaignId: m?.campaignId ?? "",
        campaignName: m?.campaignName ?? "",
        body: m?.body ?? null,
        qualityRanking: m?.qualityRanking ?? null,
        engagementRanking: m?.engagementRanking ?? null,
        conversionRanking: m?.conversionRanking ?? null,
        spendCents: 0,
        caCents: 0,
        clicks: 0,
        purchases: 0,
        impressions: 0,
        reach: 0,
        linkClicks: 0,
        landingPageViews: 0,
        addToCart: 0,
        initiateCheckout: 0,
        video3s: 0,
        video50: 0,
        video75: 0,
        video100: 0,
        isVideo: false,
        roas: null,
        cpaCents: null,
        ctrPct: null,
        hookRate: null,
        hold50: null,
        hold75: null,
        hold100: null,
        lpvRate: null,
        cvrLanding: null,
        atcRate: null,
        checkoutRate: null,
      };
      cur.spendCents += d.spendCents;
      cur.caCents += d.purchaseValueCents;
      cur.clicks += d.clicks;
      cur.purchases += d.purchases;
      cur.impressions += d.impressions;
      cur.reach += d.reach;
      cur.linkClicks += d.linkClicks;
      cur.landingPageViews += d.landingPageViews;
      cur.addToCart += d.addToCart;
      cur.initiateCheckout += d.initiateCheckout;
      cur.video3s += d.video3s;
      cur.video50 += d.video50;
      cur.video75 += d.video75;
      cur.video100 += d.video100;
      byAd.set(d.adId, cur);
    }

    const out: CreaRow[] = [];
    for (const r of byAd.values()) {
      if (r.spendCents < MIN_SPEND_TESTED) continue;
      r.isVideo = r.video3s > 0;
      r.roas = r.spendCents > 0 && r.caCents > 0 ? r.caCents / r.spendCents : null;
      r.cpaCents = r.purchases > 0 ? Math.round(r.spendCents / r.purchases) : null;
      r.ctrPct = r.impressions > 0 ? r.clicks / r.impressions : null;
      r.hookRate = r.isVideo && r.impressions > 0 ? r.video3s / r.impressions : null;
      r.hold50 = r.isVideo && r.video3s > 0 ? r.video50 / r.video3s : null;
      r.hold75 = r.isVideo && r.video3s > 0 ? r.video75 / r.video3s : null;
      r.hold100 = r.isVideo && r.video3s > 0 ? r.video100 / r.video3s : null;
      // Landing page view rate : sur les clics lien (le dénominateur le plus
      // proche de "a effectivement cliqué pour aller sur le site").
      r.lpvRate = r.linkClicks > 0 ? r.landingPageViews / r.linkClicks : null;
      // CVR landing : achats / atterrissages réels — sépare le problème
      // "clic → page" du problème "page → achat" (voir échange du 25/07).
      r.cvrLanding = r.landingPageViews > 0 ? r.purchases / r.landingPageViews : null;
      r.atcRate = r.landingPageViews > 0 ? r.addToCart / r.landingPageViews : null;
      r.checkoutRate = r.addToCart > 0 ? r.initiateCheckout / r.addToCart : null;
      out.push(r);
    }

    out.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      const an = av === null ? -Infinity : av;
      const bn = bv === null ? -Infinity : bv;
      return sortDir === "desc" ? bn - an : an - bn;
    });
    return out;
  }, [filteredDaily, metaByAd, campaignFilter, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    play("tab");
    if (key === sortKey) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const expandedSeries = useMemo(() => {
    if (!expandedAdId) return [];
    return filteredDaily
      .filter((d) => d.adId === expandedAdId)
      .map((d) => ({
        day: d.day,
        label: formatDayShort(d.day),
        caCents: d.purchaseValueCents,
        roas: d.spendCents > 0 ? d.purchaseValueCents / d.spendCents : null,
        cpaCents: d.purchases > 0 ? Math.round(d.spendCents / d.purchases) : null,
        ctrPct: d.impressions > 0 ? (d.clicks / d.impressions) * 100 : null,
      }))
      .sort((a, b) => a.day.localeCompare(b.day));
  }, [filteredDaily, expandedAdId]);

  return (
    <div className="flex flex-col gap-4">
      {/* Filtres : période + campagne */}
      <div className="flex flex-wrap items-center gap-2">
        {(["7", "14", "30", "all"] as Preset[]).map((p) => (
          <button
            key={p}
            onClick={() => {
              play("tab");
              setPreset(p);
            }}
            className={`rounded border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide transition-colors ${
              preset === p
                ? "border-phosphor bg-phosphor/10 text-phosphor"
                : "border-line text-ink-dim hover:text-ink"
            }`}
          >
            {p === "all" ? "Tout" : `${p} j`}
          </button>
        ))}
        <select
          value={campaignFilter}
          onChange={(e) => {
            play("tab");
            setCampaignFilter(e.target.value);
          }}
          className="rounded border border-line bg-terminal px-2 py-1 text-[11px] text-ink"
        >
          <option value="ALL">Toutes les campagnes</option>
          {campaigns.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {creas.missingTables && (
        <p className="rounded-lg border border-amber/40 bg-amber/[0.05] p-3 text-[11.5px] text-amber">
          ⚠️ Migrations <b>0005</b>/<b>0007</b>/<b>0011</b> pas encore appliquées dans Supabase (SQL
          Editor → Run) — les créas ne peuvent pas être stockées d&apos;ici là.
        </p>
      )}
      {!creas.missingTables && rows.length === 0 && (
        <p className="rounded-lg border border-line bg-panel/40 p-3 text-[11.5px] text-ink-dim">
          🔒 Pas de créa avec ≥ 20 € de spend sur cette période. Élargis la fenêtre ou attends que
          les données Meta se remplissent.
        </p>
      )}

      {rows.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-line bg-panel/40">
          <table className="w-full min-w-[900px] border-collapse text-[11px]">
            <thead>
              <tr className="border-b border-line text-[9.5px] uppercase tracking-wide text-ink-dim">
                <th className="px-2 py-1.5 text-left font-semibold">Créa</th>
                {COLUMNS.map((c) => (
                  <th key={c.key} className="px-2 py-1.5 text-right font-semibold">
                    <button
                      onClick={() => toggleSort(c.key)}
                      className={`inline-flex items-center gap-0.5 hover:text-ink ${
                        sortKey === c.key ? "text-phosphor" : ""
                      }`}
                    >
                      <span aria-hidden>{c.emoji}</span> {c.label}
                      {sortKey === c.key && <span>{sortDir === "desc" ? "▼" : "▲"}</span>}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="tnum">
              {rows.map((r) => (
                <CreaTableRow
                  key={r.adId}
                  row={r}
                  expanded={expandedAdId === r.adId}
                  onToggle={() => {
                    play("tab");
                    setExpandedAdId((cur) => (cur === r.adId ? null : r.adId));
                  }}
                  series={expandedAdId === r.adId ? expandedSeries : []}
                />
              ))}
            </tbody>
          </table>
          <p className="p-2.5 text-[10px] text-ink-faint">
            🪝 Hook = % qui regarde ≥ 3 s (vidéo uniquement) · 🎬 Hold = % qui va jusqu&apos;au bout
            de la vidéo (parmi ceux qui ont dépassé 3 s) · 🛬 CVR landing = achats ÷ atterrissages
            réels sur la page (sépare le problème clic→page du problème page→achat) · reach cumulé
            sur plusieurs jours = approximatif (pas de déduplication inter-jours côté Meta).
          </p>
        </div>
      )}
    </div>
  );
}

function CreaTableRow({
  row,
  expanded,
  onToggle,
  series,
}: {
  row: CreaRow;
  expanded: boolean;
  onToggle: () => void;
  series: { label: string; caCents: number; roas: number | null; cpaCents: number | null; ctrPct: number | null }[];
}) {
  return (
    <>
      <tr
        onClick={onToggle}
        className={`cursor-pointer border-b border-line-soft last:border-0 hover:bg-panel/60 ${
          expanded ? "bg-panel/60" : ""
        }`}
      >
        <td className="max-w-[280px] px-2 py-1.5 text-left">
          <div className="truncate font-medium text-ink">{row.adName}</div>
          <div className="truncate text-[9.5px] text-ink-faint">{row.campaignName}</div>
          {row.body && <div className="mt-0.5 line-clamp-2 text-[9.5px] text-ink-dim">{row.body}</div>}
        </td>
        <td className="px-2 py-1.5 text-right">{formatEur0(row.spendCents)}</td>
        <td className="px-2 py-1.5 text-right">{formatEur0(row.caCents)}</td>
        <td className="px-2 py-1.5 text-right font-semibold">{formatRoas(row.roas)}</td>
        <td className="px-2 py-1.5 text-right">{row.cpaCents !== null ? formatEur0(row.cpaCents) : "—"}</td>
        <td className="px-2 py-1.5 text-right">{formatPct(row.ctrPct)}</td>
        <td className="px-2 py-1.5 text-right">{row.isVideo ? formatPct(row.hookRate) : "—"}</td>
        <td className="px-2 py-1.5 text-right">{row.isVideo ? formatPct(row.hold100) : "—"}</td>
        <td className="px-2 py-1.5 text-right">{formatPct(row.cvrLanding)}</td>
      </tr>
      {expanded && (
        <tr className="border-b border-line-soft last:border-0">
          <td colSpan={9} className="bg-terminal/40 p-3">
            <div className="mb-2 grid grid-cols-2 gap-x-6 gap-y-1 text-[10.5px] text-ink-dim sm:grid-cols-4">
              <span>🛬 Atterrissage : {formatPct(row.lpvRate)}</span>
              <span>🛒 Panier : {formatPct(row.atcRate)}</span>
              <span>💳 Checkout : {formatPct(row.checkoutRate)}</span>
              {row.isVideo && (
                <>
                  <span>🎬 Hold 50 % : {formatPct(row.hold50)}</span>
                  <span>🎬 Hold 75 % : {formatPct(row.hold75)}</span>
                </>
              )}
              {row.qualityRanking && (
                <span>⭐ Qualité : {RANKING_LABEL[row.qualityRanking] ?? row.qualityRanking}</span>
              )}
              {row.engagementRanking && (
                <span>💬 Engagement : {RANKING_LABEL[row.engagementRanking] ?? row.engagementRanking}</span>
              )}
              {row.conversionRanking && (
                <span>🎯 Conversion : {RANKING_LABEL[row.conversionRanking] ?? row.conversionRanking}</span>
              )}
            </div>
            {series.length < 2 ? (
              <p className="text-[10.5px] text-ink-faint">Pas assez de jours pour un graphe.</p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                <MiniChart title="💶 CA" data={series} dataKey="caCents" divideBy={100} format={formatEur0} />
                <MiniChart title="⚖️ ROAS" data={series} dataKey="roas" format={formatRoas} />
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

function MiniChart({
  title,
  data,
  dataKey,
  divideBy = 1,
  format,
}: {
  title: string;
  data: { label: string; [k: string]: unknown }[];
  dataKey: string;
  divideBy?: number;
  format: (v: number) => string;
}) {
  const chartData = data.map((d) => ({
    label: d.label,
    value: d[dataKey] === null || d[dataKey] === undefined ? null : (d[dataKey] as number) / divideBy,
  }));
  return (
    <div className="rounded border border-line bg-panel/40 p-2">
      <div className="mb-1 text-[10px] font-semibold text-ink-dim">{title}</div>
      <div className="h-24 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 4, right: 6, bottom: 0, left: -18 }}>
            <CartesianGrid stroke="#322c42" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: "#6c6482", fontSize: 8 }}
              tickLine={false}
              axisLine={{ stroke: "#322c42" }}
              interval="preserveStartEnd"
              minTickGap={16}
            />
            <YAxis tick={{ fill: "#6c6482", fontSize: 8 }} tickLine={false} axisLine={false} width={38} domain={["auto", "auto"]} />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length || payload[0].value == null) return null;
                return (
                  <div className="rounded border border-line bg-terminal/95 px-2 py-1 text-[10px] tnum shadow-lg">
                    <span className="text-ink-dim">{label} · </span>
                    <span className="font-bold text-ink">{format((payload[0].value as number) * divideBy)}</span>
                  </div>
                );
              }}
            />
            <Line dataKey="value" stroke="#33ff9c" strokeWidth={2} dot={false} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
