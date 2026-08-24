"use client";

import { useEffect, useMemo, useState } from "react";
import type { Chargeback, DayLine, Totals } from "@/lib/data";
import { marginPct, mer } from "@/lib/engine";
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
  taxCents: 0, feesCents: 0, feesEstimatedCents: 0, netCents: 0, refundedCents: 0,
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
      feesEstimatedCents: (a.feesEstimatedCents ?? 0) + (r.feesEstimatedCents ?? 0),
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

// Filtre PRODUIT de l'onglet Mois (Badr 24/08 : « activer juste Polo ou
// juste Lancaster par pays, ou tous les produits »). Il se croise avec les
// onglets marché : Lancaster × ES, Polo × FR, etc.
//
// « Tous » sert la série d'origine, seule à porter les charges fixes — elles
// sont transverses et ne se ventilent ni par produit ni par pays. La colonne
// Charges disparaît donc dès qu'un produit est sélectionné, au lieu
// d'afficher un chiffre qui n'entre pas dans le net de la ligne.
const PRODUCT_FILTERS = [
  { key: "ALL", label: "Tous", emoji: "🧺" },
  { key: "GILET", label: "Gilet", emoji: "🎽", note: "Lancaster" },
  { key: "POLO", label: "Polo", emoji: "👕" },
] as const;

export type ProductFilterKey = (typeof PRODUCT_FILTERS)[number]["key"];

export function MonthBoard({
  dayLines,
  chargebacks = [],
  months,
  today,
}: {
  dayLines: Record<MarketTab, DayLine[]>;
  chargebacks?: Chargeback[];
  months: string[];
  today: string;
}) {
  const { play } = useSound();
  const [tab, setTab] = useState<MarketTab>("GLOBAL");
  const [product, setProduct] = useState<ProductFilterKey>("ALL");
  const [month, setMonth] = useState<string>(months[months.length - 1] ?? "");

  const idx = months.indexOf(month);
  const isAll = product === "ALL";

  // Séries produit du MOIS affiché, chargées à la demande (voir
  // /api/product-series) : « Tous » ne déclenche aucun appel, et le mois
  // borne le travail au lieu de scanner tout l'historique.
  //
  // Un SEUL état, posé uniquement depuis les callbacks du fetch : « en
  // chargement » se DÉDUIT (le mois chargé ne correspond pas au mois affiché)
  // au lieu d'être un setState synchrone dans l'effet, qui déclenche des
  // rendus en cascade. Une réponse porte les trois produits : changer de
  // produit dans le même mois ne rappelle rien.
  const [loaded, setLoaded] = useState<{
    key: string;
    series?: Partial<Record<string, Record<MarketTab, DayLine[]>>>;
    error?: string;
  } | null>(null);

  useEffect(() => {
    if (isAll || !month || loaded?.key === month) return;
    let cancelled = false;
    const [y, m] = month.split("-").map(Number);
    const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const start = `${month}-01`;
    const end = month === today.slice(0, 7) ? today : `${month}-${String(last).padStart(2, "0")}`;
    fetch(`/api/product-series?start=${start}&end=${end}`)
      .then(async (r) => {
        const body = await r.json();
        if (!r.ok || body.error) throw new Error(body.error ?? `HTTP ${r.status}`);
        if (!cancelled) setLoaded({ key: month, series: body.series ?? {} });
      })
      .catch((e: Error) => {
        if (!cancelled) setLoaded({ key: month, error: e.message });
      });
    return () => {
      cancelled = true;
    };
  }, [isAll, month, today, loaded?.key]);

  const ready = !isAll && loaded?.key === month;
  const loading = !isAll && !ready;
  const loadError = ready ? loaded?.error ?? null : null;

  const rows = useMemo(
    () => (isAll ? dayLines[tab] : (ready && loaded?.series ? loaded.series[product]?.[tab] : undefined) ?? []),
    [isAll, product, tab, dayLines, ready, loaded]
  );

  const monthDays = useMemo(() => rows.filter((r) => r.day.startsWith(month)), [rows, month]);
  const totals = useMemo(() => sum(monthDays), [monthDays]);
  const prevTotals = useMemo(() => sum(rows.filter((r) => r.day.startsWith(prevMonth(month)))), [rows, month]);
  const totalNet = totals.netCents;

  // ↩︎⚖️ Remboursements + rétrofacturations en % du CA brut — demande Badr
  // 08/08 (« affiché quelque part » dans le Mois, plus de saisie manuelle).
  const refundChargebackStat = useMemo(() => {
    const cbInMonth = chargebacks.filter(
      (c) => c.day.startsWith(month) && (tab === "GLOBAL" || c.market === tab)
    );
    const cbCents = cbInMonth.filter((c) => c.status !== "won").reduce((s, c) => s + c.amountCents + c.feeCents, 0);
    const grossCents = totals.caCents + totals.refundedCents;
    const takenCents = totals.refundedCents + cbCents;
    return { takenCents, grossCents, pct: grossCents > 0 ? takenCents / grossCents : 0 };
  }, [chargebacks, month, tab, totals.caCents, totals.refundedCents]);

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

      <div className="flex gap-1 overflow-x-auto pb-1" role="tablist" aria-label="Produit">
        {PRODUCT_FILTERS.map((f) => {
          const isActive = f.key === product;
          return (
            <button
              key={f.key}
              role="tab"
              aria-selected={isActive}
              onClick={() => {
                if (!isActive) {
                  play("tab");
                  setProduct(f.key);
                }
              }}
              className={`flex-none rounded-md border px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                isActive
                  ? "border-amber/60 bg-amber/10 text-amber"
                  : "border-line text-ink-dim hover:text-ink"
              }`}
            >
              <span aria-hidden>{f.emoji}</span> {f.label}
              {"note" in f && f.note && <span className="ml-1 text-[9px] opacity-70">{f.note}</span>}
            </button>
          );
        })}
      </div>

      {!isAll && loading && (
        <p className="text-[10px] text-ink-faint">Découpage du mois par produit en cours…</p>
      )}

      {!isAll && loadError && (
        // Un filtre qui rend un tableau vide sans rien dire, c'est pire que
        // pas de filtre : on affiche la raison.
        <p className="rounded-lg border border-red/40 bg-red/10 p-2 text-[10.5px] leading-snug text-red">
          Filtre produit indisponible : {loadError}
        </p>
      )}

      {!isAll && !loading && !loadError && (
        <p className="text-[10px] leading-snug text-ink-faint">
          Filtré sur <b className="text-ink-dim">{PRODUCT_FILTERS.find((f) => f.key === product)?.label}</b> —
          une commande suit le produit que le client est VENU acheter (campagne d&apos;arrivée, sinon
          le principal qui pèse le plus au panier). Charges fixes exclues : elles sont transverses,
          elles restent sur « Tous ».
        </p>
      )}

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
        <Tile label="MER" value={formatRoas(mer(totals.caCents, totals.spendCents))} />
        <Tile label="Cmd" value={formatInt(totals.orders)} delta={delta(totals.orders, prevTotals.orders)} />
      </div>

      {refundChargebackStat.grossCents > 0 && (
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 rounded-lg border border-line bg-panel/40 px-3 py-2 text-[11px]">
          <span className="uppercase tracking-wide text-ink-faint">↩︎⚖️ Remboursements + rétrofacturations</span>
          <span className={`tnum font-semibold ${refundChargebackStat.pct > 0.03 ? "text-red" : "text-ink"}`}>
            {formatPct(refundChargebackStat.pct)}
          </span>
          <span className="text-ink-dim tnum">
            −{formatEur0(refundChargebackStat.takenCents)} sur {formatEur0(refundChargebackStat.grossCents)} de CA brut
          </span>
        </div>
      )}

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
        <table className="w-full min-w-[560px] border-collapse text-[11.5px] sm:min-w-[720px] lg:text-sm">
          <thead>
            <tr className="border-b border-line bg-panel/60 text-[10px] uppercase tracking-wide text-ink-dim">
              <Th className="sticky left-0 bg-panel/95 text-left">Jour</Th>
              <Th className="text-right">Cmd</Th>
              <Th className="text-right">CA</Th>
              <Th className="text-right">Spend</Th>
              <Th className="text-right">COGS</Th>
              <Th className="text-right">Taxe</Th>
              <Th className="text-right">Frais</Th>
              {tab === "GLOBAL" && isAll && <Th className="text-right">Charges</Th>}
              <Th className="text-right">Net</Th>
              <Th className="text-right">Marge</Th>
              <Th className="text-right">MER</Th>
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
                  <Td className="text-right text-ink-dim">{l.caCents ? formatEur0(l.cogsCents) : "—"}</Td>
                  <Td className="text-right text-ink-dim">{l.caCents ? formatEur0(l.taxCents) : "—"}</Td>
                  {/* « ~ » = une partie des frais du jour est encore l'estimation
                      3 % (pas la lecture réelle par commande). Rendre l'estimé
                      reconnaissable au premier coup d'œil : l'effacement des
                      frais réels (16/08) est resté invisible précisément parce
                      qu'un 3 % estimé s'affichait comme un vrai frais. */}
                  <Td className="text-right text-ink-dim">
                    {l.caCents ? `${(l.feesEstimatedCents ?? 0) > 0 ? "~" : ""}${formatEur0(l.feesCents)}` : "—"}
                  </Td>
                  {tab === "GLOBAL" && isAll && (
                    <Td className="text-right text-amber/80">
                      {fixedCostsCentsForDay(l.day) ? formatEur0(fixedCostsCentsForDay(l.day)) : "—"}
                    </Td>
                  )}
                  <Td className={`text-right font-semibold ${empty ? "" : netTierClass(l.netCents)}`}>
                    {l.caCents || l.spendCents ? formatEurSigned0(l.netCents) : "—"}
                  </Td>
                  <Td className="text-right text-ink-dim">{l.caCents ? formatPct(l.marginPct) : "—"}</Td>
                  <Td className={`text-right ${empty ? "" : statusText(l.status)}`}>
                    {l.spendCents ? formatRoas(l.mer) : "—"}
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
              <Td className="text-right text-ink-dim">{formatEur0(totals.cogsCents)}</Td>
              <Td className="text-right text-ink-dim">{formatEur0(totals.taxCents)}</Td>
              <Td className="text-right text-ink-dim">
                {`${(totals.feesEstimatedCents ?? 0) > 0 ? "~" : ""}${formatEur0(totals.feesCents)}`}
              </Td>
              {tab === "GLOBAL" && isAll && (
                <Td className="text-right text-amber/80">
                  {formatEur0(monthDays.reduce((a, l) => a + fixedCostsCentsForDay(l.day), 0))}
                </Td>
              )}
              <Td className={`text-right ${totalNet >= 0 ? "text-phosphor" : "text-red"}`}>{formatEurSigned0(totalNet)}</Td>
              <Td className="text-right text-ink-dim">{formatPct(marginPct(totals.netCents, totals.caCents))}</Td>
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
        jour + frais ponctuels (ex. LLC le 21/06), déjà déduites du Net · ~ devant les Frais =
        encore (en partie) l&apos;estimation 3 %, pas la lecture réelle Shopify
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
