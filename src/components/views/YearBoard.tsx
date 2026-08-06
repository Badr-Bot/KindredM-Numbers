"use client";

import { useMemo, useState } from "react";
import type { DayAgg, Totals } from "@/lib/data";
import { marginPct, roas } from "@/lib/engine";
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
import {
  badrShareFor,
  fillYearMonths,
  monthlySharesFrom,
  type DailyNetByMarket,
} from "@/lib/associates";

const EMPTY: Totals = {
  orders: 0, caCents: 0, spendCents: 0, cogsCents: 0, cogsProductCents: 0, cogsUpsellsCents: 0,
  taxCents: 0, feesCents: 0, netCents: 0, refundedCents: 0,
};

// 👥 Associés : la règle de répartition vit dans lib/associates.ts (source
// unique). Elle était recopiée ici en dur — deux endroits à corriger au
// moindre changement de date d'entrée, donc deux chiffres qui divergent.

function addTo(acc: Totals, r: DayAgg): Totals {
  acc.orders += r.orders;
  acc.caCents += r.caCents;
  acc.spendCents += r.spendCents;
  acc.cogsCents += r.cogsCents;
  acc.cogsProductCents += r.cogsProductCents;
  acc.cogsUpsellsCents += r.cogsUpsellsCents;
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

  // 👥 Net par associé (règle par boutique)
  const partners = useMemo(() => {
    let adnane = 0;
    let badr = 0;
    let soloNet = 0;
    let sharedNet = 0;
    for (const m of MARKETS) {
      for (const r of dayData[m]) {
        const share = badrShareFor(m, r.day);
        if (share === 0) {
          adnane += r.netCents;
          soloNet += r.netCents;
        } else {
          const badrPart = r.netCents * share;
          badr += badrPart;
          adnane += r.netCents - badrPart;
          sharedNet += r.netCents;
        }
      }
    }
    return {
      adnane: Math.round(adnane),
      badr: Math.round(badr),
      soloNet,
      sharedNet,
    };
  }, [dayData]);

  // 👥 Part de chacun MOIS PAR MOIS (demande Badr 06/08 : « des cartes par
  // mois pour savoir chaque mois combien j'ai fait »). Réparti jour par jour
  // et par boutique AVANT de cumuler : en juin et juillet la date d'entrée de
  // Badr tombe en plein milieu du mois, répartir un total mensuel déjà agrégé
  // donnerait un chiffre faux pour les deux.
  const monthlyShares = useMemo(() => {
    const flat: DailyNetByMarket[] = [];
    for (const m of MARKETS) {
      for (const r of dayData[m]) flat.push({ day: r.day, market: m, netCents: r.netCents });
    }
    // Bornes : jamais avant le lancement, jamais après le dernier jour connu
    // des données (et non l'horloge du navigateur, qui peut être décalée).
    // Badr veut les 12 mois affichés (06/08) : le problème n'était pas les
    // mois vides mais la mise en page — carte trop étroite et moitié droite
    // inutilisée. Aucune borne, donc.
    return fillYearMonths(year, monthlySharesFrom(flat));
  }, [dayData, year]);

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

      {/* 👥 Associés — pleine largeur : la grille à 2 colonnes datait du bloc
          TVA affiché à droite, retiré le 06/08. Sans lui, la moitié droite
          restait vide. */}
      <div className="grid gap-3">
        <section className="rounded-lg border border-line bg-panel/40 p-3.5">
          <div className="mb-2 text-sm font-semibold">
            👥 Part de chacun, mois par mois <span className="text-[10px] font-normal text-ink-faint">({year})</span>
          </div>
          <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {monthlyShares.map((m) => {
              const vide = m.netCents === 0 && m.badrCents === 0 && m.adnaneCents === 0;
              return (
                <div
                  key={m.yearMonth}
                  className={`min-w-0 rounded-lg border border-hair p-2 ${vide ? "opacity-40" : ""}`}
                >
                  <div className="mb-1.5">
                    <div className="truncate text-[11px] uppercase leading-tight text-ink-faint">
                      {formatMonthShort(m.yearMonth)}
                    </div>
                    <div
                      className={`tnum truncate text-sm font-semibold leading-tight ${
                        m.netCents >= 0 ? "text-ink" : "text-red"
                      }`}
                    >
                      {formatEurSigned0(m.netCents)}
                    </div>
                  </div>
                  <div className="flex min-w-0 items-center justify-between gap-1 text-[11px]">
                    <span className="truncate text-ink-faint">🟠 Badr</span>
                    <b className={`tnum shrink-0 ${m.badrCents >= 0 ? "text-phosphor" : "text-red"}`}>
                      {formatEurSigned0(m.badrCents)}
                    </b>
                  </div>
                  <div className="flex min-w-0 items-center justify-between gap-1 text-[11px]">
                    <span className="truncate text-ink-faint">🔵 Adnane</span>
                    <b className={`tnum shrink-0 ${m.adnaneCents >= 0 ? "text-phosphor" : "text-red"}`}>
                      {formatEurSigned0(m.adnaneCents)}
                    </b>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="mb-3 text-[10px] leading-snug text-ink-faint">
            Part du résultat (ce que chacun a gagné), pas un salaire versé — un mois
            peut être positif sans qu&apos;un euro soit sorti de la société. Réparti jour
            par jour et par boutique : 100 % Adnane avant son entrée, 50/50 ensuite.
          </p>

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
