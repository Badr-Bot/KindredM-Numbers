"use client";

import { useMemo, useState } from "react";
import type { DayLine, Totals } from "@/lib/data";
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
  netTierClass,
} from "@/lib/format";
import { MarketTabs } from "../shell/MarketTabs";
import { statusText } from "../shell/StatusPill";
import { fixedCostsCentsForDay } from "@/lib/subscriptions";
import { useSound } from "../sound/SoundProvider";
import { DailyBarLineChart, type ChartPoint } from "./DailyBarLineChart";

const EMPTY: Totals = {
  orders: 0, caCents: 0, spendCents: 0, cogsCents: 0, cogsProductCents: 0, cogsUpsellsCents: 0,
  taxCents: 0, feesCents: 0, netCents: 0, refundedCents: 0,
};

function sum(rows: DayLine[]): Totals {
  return rows.reduce<Totals>(
    (a, r) => ({
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
  dayLines,
  months,
  today,
}: {
  dayLines: Record<MarketTab, DayLine[]>;
  months: string[];
  today: string;
}) {
  const { play } = useSound();
  const [tab, setTab] = useState<MarketTab>("GLOBAL");
  const [month, setMonth] = useState<string>(months[months.length - 1] ?? "");

  const idx = months.indexOf(month);
  const rows = dayLines[tab];

  const monthDays = useMemo(() => rows.filter((r) => r.day.startsWith(month)), [rows, month]);
  const totals = useMemo(() => sum(monthDays), [monthDays]);
  const prevTotals = useMemo(() => sum(rows.filter((r) => r.day.startsWith(prevMonth(month)))), [rows, month]);
  const totalNet = totals.netCents;

  // Projection fin de mois (mois en cours uniquement) : net cumulé / jours
  // écoulés × jours du mois. Simple règle de trois, pas de la voyance.
  const projection = useMemo(() => {
    if (!today.startsWith(month)) return null;
    const dayOfMonth = Number(today.slice(8, 10));
    if (dayOfMonth < 3) return null; // trop tôt pour projeter quoi que ce soit
    const [y, m] = month.split("-").map(Number);
    const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
    if (dayOfMonth >= daysInMonth) return null;
    return {
      netCents: Math.round((totals.netCents / dayOfMonth) * daysInMonth),
      caCents: Math.round((totals.caCents / dayOfMonth) * daysInMonth),
    };
  }, [today, month, totals.netCents, totals.caCents]);

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

      <div className="grid grid-cols-3 gap-2 lg:grid-cols-6 lg:gap-3">
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

      {projection && (
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 rounded-lg border border-phosphor/25 bg-phosphor/[0.04] px-3 py-2 text-[11px]">
          <span className="uppercase tracking-wide text-ink-faint">🔮 Au rythme actuel</span>
          <span className="text-ink-dim">
            net fin de mois ~
            <b className={`tnum ${projection.netCents >= 0 ? "text-phosphor" : "text-red"}`}>
              {formatEurSigned0(projection.netCents)}
            </b>
          </span>
          <span className="text-ink-dim">
            CA ~<b className="tnum text-ink">{formatEur0(projection.caCents)}</b>
          </span>
        </div>
      )}

      {chartData.length > 0 ? (
        <DailyBarLineChart data={chartData} />
      ) : (
        <p className="rounded-lg border border-line bg-panel/40 p-6 text-center text-[11px] text-ink-faint">
          Aucune donnée sur ce mois.
        </p>
      )}

      {/* Listing jour par jour du mois sélectionné — fusionné depuis l'ancien
          onglet « 14 jours », colonnes complètes + cumul depuis le début. */}
      <div className="overflow-x-auto rounded-lg border border-line">
        <table className="w-full min-w-[400px] border-collapse text-[11.5px] sm:min-w-[600px] lg:text-sm">
          <thead>
            <tr className="border-b border-line bg-panel/60 text-[10px] uppercase tracking-wide text-ink-dim">
              <Th className="sticky left-0 bg-panel/95 text-left">Jour</Th>
              <Th className="text-right">Cmd</Th>
              <Th className="text-right">CA</Th>
              <Th className="text-right">Spend</Th>
              <Th className="hidden text-right sm:table-cell">COGS+tx</Th>
              <Th className="hidden text-right sm:table-cell">Frais</Th>
              {tab === "GLOBAL" && <Th className="text-right">Charges</Th>}
              <Th className="text-right">Net</Th>
              <Th className="hidden text-right sm:table-cell">Marge</Th>
              <Th className="text-right">ROAS</Th>
              <Th className="text-right">Cumul</Th>
            </tr>
          </thead>
          <tbody className="tnum">
            {monthDays.map((l) => {
              const empty = l.orders === 0 && l.caCents === 0 && l.spendCents === 0;
              return (
                <tr
                  key={l.day}
                  className={`border-b border-line-soft last:border-0 ${
                    l.isToday ? "bg-phosphor/[0.06]" : ""
                  } ${empty ? "text-ink-faint" : ""}`}
                >
                  <Td className="sticky left-0 bg-terminal/95 text-left font-medium text-ink">
                    {l.isToday && <span className="mr-1 text-phosphor">⚡</span>}
                    {formatDayShort(l.day)}
                  </Td>
                  <Td className="text-right text-ink-dim">{l.orders || "—"}</Td>
                  <Td className="text-right">{l.caCents ? formatEur0(l.caCents) : "—"}</Td>
                  <Td className="text-right text-ink-dim">{l.spendCents ? formatEur0(l.spendCents) : "—"}</Td>
                  <Td className="hidden text-right text-ink-dim sm:table-cell">
                    {l.caCents ? formatEur0(l.cogsCents + l.taxCents) : "—"}
                  </Td>
                  <Td className="hidden text-right text-ink-dim sm:table-cell">{l.caCents ? formatEur0(l.feesCents) : "—"}</Td>
                  {tab === "GLOBAL" && (
                    <Td className="text-right text-amber/80">
                      {fixedCostsCentsForDay(l.day) ? formatEur0(fixedCostsCentsForDay(l.day)) : "—"}
                    </Td>
                  )}
                  <Td className={`text-right font-semibold ${empty ? "" : netTierClass(l.netCents)}`}>
                    {l.caCents || l.spendCents ? formatEurSigned0(l.netCents) : "—"}
                  </Td>
                  <Td className="hidden text-right text-ink-dim sm:table-cell">{l.caCents ? formatPct(l.marginPct) : "—"}</Td>
                  <Td className={`text-right ${empty ? "" : statusText(l.status)}`}>
                    {l.spendCents ? formatRoas(l.roas) : "—"}
                  </Td>
                  <Td className={`text-right font-medium ${l.cumulNetCents >= 0 ? "text-ink" : "text-red"}`}>
                    {formatEurSigned0(l.cumulNetCents)}
                  </Td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t border-line bg-panel/60 font-semibold">
              <Td className="sticky left-0 bg-panel/95 text-left">Σ mois</Td>
              <Td className="text-right text-ink-dim">{totals.orders}</Td>
              <Td className="text-right">{formatEur0(totals.caCents)}</Td>
              <Td className="text-right text-ink-dim">{formatEur0(totals.spendCents)}</Td>
              <Td className="hidden text-right text-ink-dim sm:table-cell">{formatEur0(totals.cogsCents + totals.taxCents)}</Td>
              <Td className="hidden text-right text-ink-dim sm:table-cell">{formatEur0(totals.feesCents)}</Td>
              {tab === "GLOBAL" && (
                <Td className="text-right text-amber/80">
                  {formatEur0(monthDays.reduce((a, l) => a + fixedCostsCentsForDay(l.day), 0))}
                </Td>
              )}
              <Td className={`text-right ${totalNet >= 0 ? "text-phosphor" : "text-red"}`}>{formatEurSigned0(totalNet)}</Td>
              <Td className="hidden text-right sm:table-cell"></Td>
              <Td className="text-right"></Td>
              <Td className="text-right"></Td>
            </tr>
          </tfoot>
        </table>
      </div>
      <p className="text-center text-[10.5px] text-ink-faint">
        ⚡ jour en cours — mis à jour à chaque synchro (peut avoir quelques minutes de retard sur le
        Live, qui interroge Shopify à la seconde) · Net & ROAS colorés selon les seuils dynamiques
        (14 j) · Cumul depuis le début · Charges (onglet Global) = abonnements/équipe étalés par
        jour + frais ponctuels (ex. LLC le 21/06), déjà déduites du Net
      </p>
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
    <div className="rounded-lg border border-line bg-panel/40 p-2.5 lg:p-4">
      <div className="text-[9px] uppercase tracking-wide text-ink-faint lg:text-[11px]">{label}</div>
      <div className={`mt-0.5 text-sm font-bold tnum lg:text-2xl ${valueClass}`}>{value}</div>
      {delta && (
        <div className={`mt-0.5 text-[9.5px] tnum lg:text-xs ${delta.positive ? "text-phosphor" : "text-red"}`}>
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

function Th({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
  return <th className={`whitespace-nowrap px-2.5 py-2 font-semibold ${className}`}>{children}</th>;
}

function Td({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
  return <td className={`whitespace-nowrap px-2.5 py-1.5 ${className}`}>{children}</td>;
}
