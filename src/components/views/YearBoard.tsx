"use client";

import { useMemo, useState } from "react";
import type { DayAgg, Totals } from "@/lib/data";
import { feesBreakdownForCa, marginPct, roas } from "@/lib/engine";
import { MARKET_META, MARKETS, type MarketTab } from "@/lib/markets";
import {
  formatDayShort,
  formatEur0,
  formatEurSigned0,
  formatInt,
  formatMonthShort,
  formatPct,
  formatRoas,
} from "@/lib/format";
import { MarketTabs } from "../shell/MarketTabs";

const EMPTY: Totals = {
  orders: 0, caCents: 0, spendCents: 0, cogsCents: 0, taxCents: 0, feesCents: 0, netCents: 0, refundedCents: 0,
};

// 👥 Associés : Adnane a lancé seul ; Badr est entré à 50/50 par boutique —
// ES/UK/DE dès le 20/06/2026, FR dès le 14/07/2026 (précision Badr 19/07).
const PARTNER_START_FR = "2026-07-14";
const PARTNER_START_OTHERS = "2026-06-20";

function addTo(acc: Totals, r: DayAgg): Totals {
  acc.orders += r.orders;
  acc.caCents += r.caCents;
  acc.spendCents += r.spendCents;
  acc.cogsCents += r.cogsCents;
  acc.taxCents += r.taxCents;
  acc.feesCents += r.feesCents;
  acc.netCents += r.netCents;
  acc.refundedCents += r.refundedCents;
  return acc;
}

export function YearBoard({
  dayData,
  years,
  historyStart,
}: {
  dayData: Record<MarketTab, DayAgg[]>;
  years: string[];
  historyStart: string;
}) {
  const [tab, setTab] = useState<MarketTab>("GLOBAL");
  const [year, setYear] = useState<string>(years[years.length - 1] ?? "");

  const rows = dayData[tab];

  // 🏁 Depuis le début : totaux par marché toutes périodes confondues —
  // « combien chaque pays a rapporté depuis le lancement » en un écran.
  const lifetime = useMemo(() => {
    const perMarket = MARKETS.map((m) => {
      const t = dayData[m].reduce<Totals>((acc, r) => addTo(acc, r), { ...EMPTY });
      return { market: m, ...t };
    });
    const global = dayData.GLOBAL.reduce<Totals>((acc, r) => addTo(acc, r), { ...EMPTY });
    return { perMarket: [...perMarket].sort((a, b) => b.netCents - a.netCents), global };
  }, [dayData]);

  // 👥 Net par associé (règle par boutique) + 🧾 TVA cumulée
  const partners = useMemo(() => {
    let adnane = 0;
    let badr = 0;
    let soloNet = 0;
    let sharedNet = 0;
    for (const m of MARKETS) {
      const start = m === "FR" ? PARTNER_START_FR : PARTNER_START_OTHERS;
      for (const r of dayData[m]) {
        if (r.day < start) {
          adnane += r.netCents;
          soloNet += r.netCents;
        } else {
          adnane += r.netCents / 2;
          badr += r.netCents / 2;
          sharedNet += r.netCents;
        }
      }
    }
    let tvaCents = 0;
    for (const r of dayData.GLOBAL) tvaCents += feesBreakdownForCa(r.caCents).tvaCents;
    return {
      adnane: Math.round(adnane),
      badr: Math.round(badr),
      soloNet,
      sharedNet,
      tvaCents,
    };
  }, [dayData]);

  const { monthRows, annual } = useMemo(() => {
    const byMonth = new Map<string, Totals>();
    const annual: Totals = { ...EMPTY };
    for (const r of rows) {
      if (!r.day.startsWith(year)) continue;
      const ym = r.day.slice(0, 7);
      const cur = byMonth.get(ym) ?? { ...EMPTY };
      byMonth.set(ym, addTo(cur, r));
      addTo(annual, r);
    }
    const monthRows = [...byMonth.entries()]
      .map(([ym, t]) => ({ ym, ...t }))
      .sort((a, b) => a.ym.localeCompare(b.ym));
    return { monthRows, annual };
  }, [rows, year]);

  return (
    <div className="flex flex-col gap-3">
      {years.length > 1 && (
        <div className="flex gap-1">
          {years.map((y) => (
            <button
              key={y}
              onClick={() => setYear(y)}
              className={`rounded-md border px-3 py-1 text-xs font-semibold ${
                y === year ? "border-phosphor/60 bg-phosphor/10 text-phosphor" : "border-line text-ink-dim"
              }`}
            >
              {y}
            </button>
          ))}
        </div>
      )}

      {/* 🏁 Ce que chaque pays a rapporté depuis le lancement */}
      <section className="rounded-lg border border-line bg-panel/40 p-3.5">
        <div className="mb-2 flex items-baseline justify-between">
          <span className="text-sm font-semibold">🏁 Depuis le début</span>
          <span className="text-[10px] text-ink-faint">lancement {formatDayShort(historyStart)}</span>
        </div>
        <ul className="flex flex-col gap-1.5">
          {lifetime.perMarket.map((m) => {
            const maxNet = Math.max(...lifetime.perMarket.map((x) => Math.abs(x.netCents)), 1);
            const barWidth = Math.max(4, Math.round((Math.abs(m.netCents) / maxNet) * 100));
            return (
              <li key={m.market} className="flex items-center gap-2 text-[11.5px]">
                <span className="w-14 flex-none font-semibold">
                  <span aria-hidden>{MARKET_META[m.market].flag}</span> {m.market}
                </span>
                <span className="relative h-4 flex-1 overflow-hidden rounded-sm bg-terminal/80">
                  <span
                    className={`absolute inset-y-0 left-0 rounded-sm ${m.netCents >= 0 ? "bg-phosphor/30" : "bg-red/30"}`}
                    style={{ width: `${barWidth}%` }}
                  />
                </span>
                <span className={`w-20 flex-none text-right font-bold tnum ${m.netCents >= 0 ? "text-phosphor" : "text-red"}`}>
                  {formatEurSigned0(m.netCents)}
                </span>
                <span className="hidden w-20 flex-none text-right text-ink-dim tnum sm:inline">
                  CA {formatEur0(m.caCents)}
                </span>
              </li>
            );
          })}
        </ul>
        <div className="mt-2 flex items-baseline justify-between border-t border-line-soft pt-2 text-[11.5px]">
          <span className="text-ink-dim">
            🌍 Total · {formatInt(lifetime.global.orders)} cmd · CA {formatEur0(lifetime.global.caCents)}
          </span>
          <span className={`text-base font-bold tnum ${lifetime.global.netCents >= 0 ? "text-phosphor" : "text-red"}`}>
            {formatEurSigned0(lifetime.global.netCents)}
          </span>
        </div>
      </section>

      {/* 👥 Associés + 🧾 TVA */}
      <div className="grid gap-3 sm:grid-cols-2">
        <section className="rounded-lg border border-line bg-panel/40 p-3.5">
          <div className="mb-2 text-sm font-semibold">👥 Net par associé</div>
          <ul className="flex flex-col gap-1.5 text-[12px]">
            <li className="flex items-baseline justify-between">
              <span>Adnane <span className="text-[10px] text-ink-faint">(période solo + 50 % ensuite)</span></span>
              <b className={`tnum ${partners.adnane >= 0 ? "text-phosphor" : "text-red"}`}>
                {formatEurSigned0(partners.adnane)}
              </b>
            </li>
            <li className="flex items-baseline justify-between">
              <span>Badr <span className="text-[10px] text-ink-faint">(50 % · ES/UK/DE dès 20/06 · FR dès 14/07)</span></span>
              <b className={`tnum ${partners.badr >= 0 ? "text-phosphor" : "text-red"}`}>
                {formatEurSigned0(partners.badr)}
              </b>
            </li>
          </ul>
          <p className="mt-2 border-t border-line-soft pt-1.5 text-[10px] text-ink-faint tnum">
            Période solo Adnane : {formatEurSigned0(partners.soloNet)} · période partagée :{" "}
            {formatEurSigned0(partners.sharedNet)} (50/50 par boutique)
          </p>
        </section>
        <section className="rounded-lg border border-amber/30 bg-amber/[0.04] p-3.5">
          <div className="mb-1 text-sm font-semibold">🧾 TVA cumulée · à provisionner</div>
          <div className="text-2xl font-bold tnum text-amber lg:text-3xl">{formatEur0(partners.tvaCents)}</div>
          <p className="mt-1.5 text-[10.5px] text-ink-faint">
            5,5 % du CA depuis le début. Déjà déduite du net affiché (incluse dans les frais) —
            c&apos;est le montant à garder de côté pour la payer plus tard.
          </p>
        </section>
      </div>

      <MarketTabs active={tab} onChange={setTab} />

      {/* Réponse en 1 écran : CA et net de l'année */}
      <div className="grid grid-cols-2 gap-2 lg:gap-4">
        <div className="rounded-lg border border-line bg-panel/50 p-3 lg:p-6">
          <div className="text-[10px] uppercase tracking-wide text-ink-faint lg:text-sm">CA {year}</div>
          <div className="mt-1 text-2xl font-bold tnum lg:mt-2 lg:text-5xl">{formatEur0(annual.caCents)}</div>
        </div>
        <div className="rounded-lg border border-line bg-panel/50 p-3 lg:p-6">
          <div className="text-[10px] uppercase tracking-wide text-ink-faint lg:text-sm">Net {year}</div>
          <div className={`mt-1 text-2xl font-bold tnum lg:mt-2 lg:text-5xl ${annual.netCents >= 0 ? "text-phosphor" : "text-red"}`}>
            {formatEurSigned0(annual.netCents)}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-line">
        <table className="w-full min-w-[360px] border-collapse text-[11.5px] sm:min-w-[560px] lg:text-sm">
          <thead>
            <tr className="border-b border-line bg-panel/60 text-[10px] uppercase tracking-wide text-ink-dim">
              <th className="px-2.5 py-2 text-left font-semibold">Mois</th>
              <th className="px-2.5 py-2 text-right font-semibold">Cmd</th>
              <th className="px-2.5 py-2 text-right font-semibold">CA</th>
              <th className="px-2.5 py-2 text-right font-semibold">Spend</th>
              <th className="hidden px-2.5 py-2 text-right font-semibold sm:table-cell">COGS+tx</th>
              <th className="hidden px-2.5 py-2 text-right font-semibold sm:table-cell">Frais</th>
              <th className="px-2.5 py-2 text-right font-semibold">Net</th>
              <th className="hidden px-2.5 py-2 text-right font-semibold sm:table-cell">Marge</th>
              <th className="px-2.5 py-2 text-right font-semibold">ROAS</th>
            </tr>
          </thead>
          <tbody className="tnum">
            {monthRows.map((r) => (
              <tr key={r.ym} className="border-b border-line-soft last:border-0">
                <td className="px-2.5 py-1.5 text-left font-medium capitalize text-ink">{formatMonthShort(r.ym)}</td>
                <td className="px-2.5 py-1.5 text-right text-ink-dim">{r.orders}</td>
                <td className="px-2.5 py-1.5 text-right">{formatEur0(r.caCents)}</td>
                <td className="px-2.5 py-1.5 text-right text-ink-dim">{formatEur0(r.spendCents)}</td>
                <td className="hidden px-2.5 py-1.5 text-right text-ink-dim sm:table-cell">{formatEur0(r.cogsCents + r.taxCents)}</td>
                <td className="hidden px-2.5 py-1.5 text-right text-ink-dim sm:table-cell">{formatEur0(r.feesCents)}</td>
                <td className={`px-2.5 py-1.5 text-right font-semibold ${r.netCents >= 0 ? "text-phosphor" : "text-red"}`}>
                  {formatEurSigned0(r.netCents)}
                </td>
                <td className="hidden px-2.5 py-1.5 text-right text-ink-dim sm:table-cell">{formatPct(marginPct(r.netCents, r.caCents))}</td>
                <td className="px-2.5 py-1.5 text-right text-ink-dim">{formatRoas(roas(r.caCents, r.spendCents))}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-line bg-panel/60 font-bold">
              <td className="px-2.5 py-2 text-left">Σ {year}</td>
              <td className="px-2.5 py-2 text-right text-ink-dim">{formatInt(annual.orders)}</td>
              <td className="px-2.5 py-2 text-right">{formatEur0(annual.caCents)}</td>
              <td className="px-2.5 py-2 text-right text-ink-dim">{formatEur0(annual.spendCents)}</td>
              <td className="hidden px-2.5 py-2 text-right text-ink-dim sm:table-cell">{formatEur0(annual.cogsCents + annual.taxCents)}</td>
              <td className="hidden px-2.5 py-2 text-right text-ink-dim sm:table-cell">{formatEur0(annual.feesCents)}</td>
              <td className={`px-2.5 py-2 text-right ${annual.netCents >= 0 ? "text-phosphor" : "text-red"}`}>
                {formatEurSigned0(annual.netCents)}
              </td>
              <td className="hidden px-2.5 py-2 text-right text-ink-dim sm:table-cell">{formatPct(marginPct(annual.netCents, annual.caCents))}</td>
              <td className="px-2.5 py-2 text-right text-ink-dim">{formatRoas(roas(annual.caCents, annual.spendCents))}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
