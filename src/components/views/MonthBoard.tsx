"use client";

import { useMemo, useState } from "react";
import type { DayAgg, Totals } from "@/lib/data";
import { marginPct, roas } from "@/lib/engine";
import type { MarketTab } from "@/lib/markets";
import {
  formatDayShort,
  formatEur0,
  formatEurSigned0,
  formatInt,
  formatMonthLabel,
  formatPct,
  formatRoas,
} from "@/lib/format";
import { MarketTabs } from "../shell/MarketTabs";
import { useSound } from "../sound/SoundProvider";
import { DailyBarLineChart, type ChartPoint } from "./DailyBarLineChart";

const EMPTY: Totals = {
  orders: 0, caCents: 0, spendCents: 0, cogsCents: 0, taxCents: 0, feesCents: 0, netCents: 0,
};

function sum(rows: DayAgg[]): Totals {
  return rows.reduce<Totals>(
    (a, r) => ({
      orders: a.orders + r.orders,
      caCents: a.caCents + r.caCents,
      spendCents: a.spendCents + r.spendCents,
      cogsCents: a.cogsCents + r.cogsCents,
      taxCents: a.taxCents + r.taxCents,
      feesCents: a.feesCents + r.feesCents,
      netCents: a.netCents + r.netCents,
    }),
    { ...EMPTY }
  );
}

function prevMonth(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 2, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function MonthBoard({
  dayData,
  months,
}: {
  dayData: Record<MarketTab, DayAgg[]>;
  months: string[];
}) {
  const { play } = useSound();
  const [tab, setTab] = useState<MarketTab>("GLOBAL");
  const [month, setMonth] = useState<string>(months[months.length - 1] ?? "");

  const idx = months.indexOf(month);
  const rows = dayData[tab];

  const monthDays = useMemo(() => rows.filter((r) => r.day.startsWith(month)), [rows, month]);
  const totals = useMemo(() => sum(monthDays), [monthDays]);
  const prevTotals = useMemo(() => sum(rows.filter((r) => r.day.startsWith(prevMonth(month)))), [rows, month]);

  const chartData: ChartPoint[] = monthDays.map((d) => ({
    label: formatDayShort(d.day),
    caEur: d.caCents / 100,
    marginPct: marginPct(d.netCents, d.caCents),
  }));

  const go = (delta: number) => {
    const next = months[idx + delta];
    if (next) {
      play("tab");
      setMonth(next);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between rounded-lg border border-line bg-panel/40 px-2 py-1.5">
        <NavBtn disabled={idx <= 0} onClick={() => go(-1)} label="Mois précédent">◀</NavBtn>
        <span className="text-sm font-semibold capitalize">{month ? formatMonthLabel(month) : "—"}</span>
        <NavBtn disabled={idx >= months.length - 1} onClick={() => go(1)} label="Mois suivant">▶</NavBtn>
      </div>

      <MarketTabs active={tab} onChange={setTab} />

      <div className="grid grid-cols-3 gap-2">
        <Tile label="CA" value={formatEur0(totals.caCents)} delta={delta(totals.caCents, prevTotals.caCents)} />
        <Tile
          label="Net"
          value={formatEurSigned0(totals.netCents)}
          valueClass={totals.netCents >= 0 ? "text-phosphor" : "text-red"}
          delta={delta(totals.netCents, prevTotals.netCents)}
        />
        <Tile label="Marge" value={formatPct(marginPct(totals.netCents, totals.caCents))} />
        <Tile label="Spend" value={formatEur0(totals.spendCents)} delta={delta(totals.spendCents, prevTotals.spendCents, true)} />
        <Tile label="ROAS" value={formatRoas(roas(totals.caCents, totals.spendCents))} />
        <Tile label="Cmd" value={formatInt(totals.orders)} delta={delta(totals.orders, prevTotals.orders)} />
      </div>

      {chartData.length > 0 ? (
        <DailyBarLineChart data={chartData} />
      ) : (
        <p className="rounded-lg border border-line bg-panel/40 p-6 text-center text-[11px] text-ink-faint">
          Aucune donnée sur ce mois.
        </p>
      )}

      <div className="overflow-x-auto rounded-lg border border-line">
        <table className="w-full min-w-[420px] border-collapse text-[11.5px]">
          <thead>
            <tr className="border-b border-line bg-panel/60 text-[10px] uppercase tracking-wide text-ink-dim">
              <th className="px-2.5 py-2 text-left font-semibold">Jour</th>
              <th className="px-2.5 py-2 text-right font-semibold">Cmd</th>
              <th className="px-2.5 py-2 text-right font-semibold">CA</th>
              <th className="px-2.5 py-2 text-right font-semibold">Spend</th>
              <th className="px-2.5 py-2 text-right font-semibold">Net</th>
              <th className="px-2.5 py-2 text-right font-semibold">ROAS</th>
            </tr>
          </thead>
          <tbody className="tnum">
            {monthDays.map((d) => (
              <tr key={d.day} className="border-b border-line-soft last:border-0">
                <td className="px-2.5 py-1.5 text-left font-medium text-ink">{formatDayShort(d.day)}</td>
                <td className="px-2.5 py-1.5 text-right text-ink-dim">{d.orders || "—"}</td>
                <td className="px-2.5 py-1.5 text-right">{d.caCents ? formatEur0(d.caCents) : "—"}</td>
                <td className="px-2.5 py-1.5 text-right text-ink-dim">{d.spendCents ? formatEur0(d.spendCents) : "—"}</td>
                <td className={`px-2.5 py-1.5 text-right font-semibold ${d.netCents >= 0 ? "text-phosphor" : "text-red"}`}>
                  {d.caCents || d.spendCents ? formatEurSigned0(d.netCents) : "—"}
                </td>
                <td className="px-2.5 py-1.5 text-right text-ink-dim">{d.spendCents ? formatRoas(roas(d.caCents, d.spendCents)) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface Delta {
  pct: number;
  positive: boolean;
}

/** delta% vs mois précédent. `inverse` = une hausse est « mauvaise » (ex. spend). */
function delta(current: number, previous: number, inverse = false): Delta | null {
  if (previous === 0) return null;
  const pct = (current - previous) / Math.abs(previous);
  const positive = inverse ? pct < 0 : pct > 0;
  return { pct, positive };
}

function Tile({
  label,
  value,
  valueClass = "",
  delta,
}: {
  label: string;
  value: string;
  valueClass?: string;
  delta?: Delta | null;
}) {
  return (
    <div className="rounded-lg border border-line bg-panel/40 p-2.5">
      <div className="text-[9px] uppercase tracking-wide text-ink-faint">{label}</div>
      <div className={`mt-0.5 text-sm font-bold tnum ${valueClass}`}>{value}</div>
      {delta && (
        <div className={`mt-0.5 text-[9.5px] tnum ${delta.positive ? "text-phosphor" : "text-red"}`}>
          {delta.pct >= 0 ? "▲" : "▼"} {formatPct(Math.abs(delta.pct))}
        </div>
      )}
    </div>
  );
}

function NavBtn({
  children,
  onClick,
  disabled,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="flex h-7 w-8 items-center justify-center rounded border border-line text-ink-dim transition-colors hover:border-phosphor hover:text-phosphor disabled:opacity-30"
    >
      {children}
    </button>
  );
}
