"use client";

import { useMemo, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Treemap } from "recharts";
import { buildExpenseBreakdown, type DayAgg, type ExpenseSlice, type Totals } from "@/lib/data";
import type { MarketTab } from "@/lib/markets";
import { formatEur0, formatEurSigned0, formatMonthLabel, formatPct } from "@/lib/format";
import { MarketTabs } from "../shell/MarketTabs";
import { useSound } from "../sound/SoundProvider";

const EMPTY: Totals = {
  orders: 0, caCents: 0, spendCents: 0, cogsCents: 0, cogsProductCents: 0, cogsUpsellsCents: 0,
  taxCents: 0, feesCents: 0, netCents: 0, refundedCents: 0,
};

// Seuil d'alerte : le spend Meta au-delà de cette part du CA mange la marge
// en silence — badge rouge dans « À optimiser ». Ajustable ici.
const SPEND_ALERT_WEIGHT = 0.35;

// Palette catégorielle harmonisée dark — le gain net en phosphore ressort
// (c'est le message), les postes de coût en tons plus froids/désaturés.
const SLICE_COLORS: Record<string, string> = {
  spend: "#ff6b9d",
  cogs_polo: "#5fd6e0",
  cogs_upsells: "#2f8f9c",
  tax: "#b78bff",
  tva: "#ffc266",
  shopify: "#e0a35f",
  autres: "#6f8a78",
  net: "#33ff9c",
};

function sumForPrefix(rows: DayAgg[], prefix: string): Totals {
  return rows.reduce<Totals>((a, r) => {
    if (!r.day.startsWith(prefix)) return a;
    return {
      orders: a.orders + r.orders,
      caCents: a.caCents + r.caCents,
      spendCents: a.spendCents + r.spendCents,
      cogsCents: a.cogsCents + r.cogsCents,
      cogsProductCents: a.cogsProductCents + r.cogsProductCents,
      cogsUpsellsCents: a.cogsUpsellsCents + r.cogsUpsellsCents,
      taxCents: a.taxCents + r.taxCents,
      feesCents: a.feesCents + r.feesCents,
      netCents: a.netCents + r.netCents,
      refundedCents: a.refundedCents + r.refundedCents,
    };
  }, { ...EMPTY });
}

function prevMonth(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 2, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

type Granularity = "month" | "year";

interface TreemapNode {
  name: string;
  size: number;
  fill: string;
  [key: string]: string | number;
}

export function ExpenseBoard({
  dayData,
  months,
  years,
}: {
  dayData: Record<MarketTab, DayAgg[]>;
  months: string[];
  years: string[];
}) {
  const { play } = useSound();
  const [tab, setTab] = useState<MarketTab>("GLOBAL");
  const [gran, setGran] = useState<Granularity>("month");
  const [monthIdx, setMonthIdx] = useState(months.length - 1);
  const [yearIdx, setYearIdx] = useState(years.length - 1);

  const period = gran === "month" ? months[monthIdx] : years[yearIdx];
  const prevPeriod = gran === "month" ? prevMonth(period) : String(Number(period) - 1);

  const rows = dayData[tab];
  const totals = useMemo(() => sumForPrefix(rows, period), [rows, period]);
  const prevTotals = useMemo(() => sumForPrefix(rows, prevPeriod), [rows, prevPeriod]);

  const breakdown = useMemo(() => buildExpenseBreakdown(totals), [totals]);
  const prevBreakdown = useMemo(() => buildExpenseBreakdown(prevTotals), [prevTotals]);

  const donutData = breakdown.slices.filter((s) => s.cents > 0);
  const treemapData: TreemapNode[] = breakdown.slices
    .filter((s) => s.cents > 0)
    .map((s) => ({ name: `${s.emoji} ${s.label}`, size: s.cents, fill: SLICE_COLORS[s.key] }));

  // §6.5 — encart « À optimiser » : 3 postes de coût les plus lourds en % du CA
  const prevWeights = new Map(prevBreakdown.slices.map((s) => [s.key, s.weight]));
  const topCosts = breakdown.slices
    .filter((s) => s.kind !== "net" && s.cents > 0)
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 3);

  const changePeriod = (delta: number) => {
    play("tab");
    if (gran === "month") setMonthIdx((i) => Math.min(months.length - 1, Math.max(0, i + delta)));
    else setYearIdx((i) => Math.min(years.length - 1, Math.max(0, i + delta)));
  };

  const periodLabel = gran === "month" ? formatMonthLabel(period) : period;
  const canPrev = gran === "month" ? monthIdx > 0 : yearIdx > 0;
  const canNext = gran === "month" ? monthIdx < months.length - 1 : yearIdx < years.length - 1;

  return (
    <div className="flex flex-col gap-3">
      {/* Granularité + période */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-1">
          {(["month", "year"] as Granularity[]).map((g) => (
            <button
              key={g}
              onClick={() => {
                play("tab");
                setGran(g);
              }}
              className={`rounded-md border px-3 py-1 text-xs font-semibold ${
                g === gran ? "border-phosphor/60 bg-phosphor/10 text-phosphor" : "border-line text-ink-dim"
              }`}
            >
              {g === "month" ? "Mois" : "Année"}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => changePeriod(-1)}
            disabled={!canPrev}
            aria-label="Période précédente"
            className="flex h-7 w-7 items-center justify-center rounded border border-line text-ink-dim hover:border-phosphor hover:text-phosphor disabled:opacity-30"
          >
            ◀
          </button>
          <span className="min-w-[104px] text-center text-sm font-semibold capitalize">{periodLabel}</span>
          <button
            onClick={() => changePeriod(1)}
            disabled={!canNext}
            aria-label="Période suivante"
            className="flex h-7 w-7 items-center justify-center rounded border border-line text-ink-dim hover:border-phosphor hover:text-phosphor disabled:opacity-30"
          >
            ▶
          </button>
        </div>
      </div>

      <MarketTabs active={tab} onChange={setTab} />

      {totals.caCents === 0 ? (
        <p className="rounded-lg border border-line bg-panel/40 p-6 text-center text-[11px] text-ink-faint">
          Aucune donnée sur cette période.
        </p>
      ) : (
        <>
          {/* Donut + légende/table */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="relative rounded-lg border border-line bg-panel/40 p-2">
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      dataKey="cents"
                      nameKey="label"
                      innerRadius="58%"
                      outerRadius="88%"
                      paddingAngle={1.5}
                      stroke="#070a08"
                      strokeWidth={1.5}
                      isAnimationActive
                    >
                      {donutData.map((s) => (
                        <Cell key={s.key} fill={SLICE_COLORS[s.key]} />
                      ))}
                    </Pie>
                    <Tooltip content={<SliceTooltip caCents={breakdown.caCents} />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[9px] uppercase tracking-wide text-ink-faint">Gain net</span>
                <span className={`text-lg font-bold tnum ${totals.netCents >= 0 ? "text-phosphor" : "text-red"}`}>
                  {formatEurSigned0(totals.netCents)}
                </span>
                <span className="text-[9px] text-ink-faint tnum">
                  {formatPct(totals.caCents ? totals.netCents / totals.caCents : null)} du CA
                </span>
              </div>
            </div>

            <div className="rounded-lg border border-line bg-panel/40 p-2.5">
              <div className="mb-1 flex justify-between text-[9px] uppercase tracking-wide text-ink-faint">
                <span>Poste</span>
                <span>€ · % du CA</span>
              </div>
              <ul className="flex flex-col gap-1">
                {breakdown.slices.map((s) => (
                  <li key={s.key} className="flex items-center justify-between text-[11.5px]">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-sm" style={{ background: SLICE_COLORS[s.key] }} />
                      <span aria-hidden>{s.emoji}</span>
                      <span className={s.kind === "net" ? "font-semibold" : ""}>{s.label}</span>
                    </span>
                    <span className="tnum text-ink-dim">
                      <span className={s.kind === "net" && s.cents < 0 ? "text-red" : "text-ink"}>
                        {s.kind === "net" ? formatEurSigned0(s.cents) : formatEur0(s.cents)}
                      </span>{" "}
                      · {formatPct(s.weight)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Treemap (vue carrés) */}
          <div className="rounded-lg border border-line bg-panel/40 p-2">
            <div className="mb-1 px-1 text-[9px] uppercase tracking-wide text-ink-faint">Vue carrés</div>
            <div className="h-40 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <Treemap
                  data={treemapData}
                  dataKey="size"
                  stroke="#070a08"
                  content={<TreemapCell />}
                  isAnimationActive={false}
                />
              </ResponsiveContainer>
            </div>
          </div>

          {/* 🎯 À optimiser */}
          <div className="rounded-lg border border-amber/30 bg-amber/[0.04] p-3">
            <div className="mb-2 text-[11px] font-semibold text-amber">🎯 À optimiser · 3 postes les plus lourds</div>
            <ul className="flex flex-col gap-1.5">
              {topCosts.map((s) => {
                const prevW = prevWeights.get(s.key);
                const d = prevW !== undefined && prevW > 0 ? s.weight - prevW : null;
                const spendAlert = s.key === "spend" && s.weight > SPEND_ALERT_WEIGHT;
                return (
                  <li key={s.key} className="flex items-center justify-between text-[11.5px]">
                    <span className="flex items-center gap-1.5">
                      <span aria-hidden>{s.emoji}</span> {s.label}
                      {spendAlert && (
                        <span className="rounded border border-red/50 bg-red/10 px-1 py-0.5 text-[9px] font-bold text-red">
                          🚨 &gt; {formatPct(SPEND_ALERT_WEIGHT)} du CA
                        </span>
                      )}
                    </span>
                    <span className="flex items-center gap-2 tnum">
                      <span className={`font-semibold ${spendAlert ? "text-red" : ""}`}>{formatPct(s.weight)}</span>
                      {d !== null && (
                        <span className={`text-[10px] ${d > 0 ? "text-red" : "text-phosphor"}`}>
                          {d > 0 ? "▲" : "▼"} {formatPct(Math.abs(d))}
                        </span>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
            <p className="mt-2 text-[9.5px] text-ink-faint">Δ = variation du poids (% du CA) vs période précédente.</p>
          </div>
        </>
      )}
    </div>
  );
}

function SliceTooltip({
  active,
  payload,
  caCents,
}: {
  active?: boolean;
  payload?: Array<{ payload: ExpenseSlice }>;
  caCents: number;
}) {
  if (!active || !payload?.length) return null;
  const s = payload[0].payload;
  return (
    <div className="rounded border border-line bg-terminal/95 px-2.5 py-1.5 text-[11px] shadow-lg">
      <div className="font-semibold text-ink">
        {s.emoji} {s.label}
      </div>
      <div className="tnum text-ink-dim">
        {formatEur0(s.cents)} · {formatPct(caCents ? s.cents / caCents : null)} du CA
      </div>
    </div>
  );
}

interface TreemapCellProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  name?: string;
  fill?: string;
}

function TreemapCell({ x = 0, y = 0, width = 0, height = 0, name = "", fill = "#333" }: TreemapCellProps) {
  const show = width > 54 && height > 22;
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill={fill} fillOpacity={0.85} stroke="#070a08" strokeWidth={2} />
      {show && (
        <text x={x + 6} y={y + 16} fill="#070a08" fontSize={10} fontWeight={700}>
          {name}
        </text>
      )}
    </g>
  );
}
