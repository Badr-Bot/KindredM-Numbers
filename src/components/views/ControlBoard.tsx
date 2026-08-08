"use client";

import { useMemo, useState } from "react";
import type { Chargeback, DayAgg } from "@/lib/data";
import { MARKET_META, type MarketTab } from "@/lib/markets";
import {
  formatDayShort,
  formatEur0,
  formatEurSigned0,
  formatMonthLabel,
  formatPct,
} from "@/lib/format";
import { MarketTabs } from "../shell/MarketTabs";
import { useSound } from "../sound/SoundProvider";

type Granularity = "month" | "year";

// Au-delà de ce taux de remboursement (part du CA brut), c'est un signal
// produit/transporteur à investiguer — badge rouge. Ajustable ici.
const REFUND_ALERT_RATE = 0.03;

const STATUS_META: Record<Chargeback["status"], { label: string; emoji: string; className: string }> = {
  open: { label: "En cours", emoji: "⏳", className: "text-amber" },
  won: { label: "Gagné", emoji: "✅", className: "text-phosphor" },
  lost: { label: "Perdu", emoji: "❌", className: "text-red" },
};

function prevMonth(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 2, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function ControlBoard({
  dayData,
  chargebacks,
  months,
  years,
}: {
  dayData: Record<MarketTab, DayAgg[]>;
  chargebacks: Chargeback[];
  months: string[];
  years: string[];
}) {
  const { play } = useSound();
  const [tab, setTab] = useState<MarketTab>("GLOBAL");
  const [gran, setGran] = useState<Granularity>("month");
  const [monthIdx, setMonthIdx] = useState(months.length - 1);
  const [yearIdx, setYearIdx] = useState(years.length - 1);

  const period = gran === "month" ? months[monthIdx] : years[yearIdx];

  const rows = dayData[tab];
  const periodRows = useMemo(() => rows.filter((r) => r.day.startsWith(period)), [rows, period]);

  const caNetCents = periodRows.reduce((s, r) => s + r.caCents, 0);
  const netCents = periodRows.reduce((s, r) => s + r.netCents, 0);
  const refundedCents = periodRows.reduce((s, r) => s + r.refundedCents, 0);
  const grossCaCents = caNetCents + refundedCents;
  const refundRate = grossCaCents > 0 ? refundedCents / grossCaCents : 0;

  const cbInPeriod = useMemo(
    () =>
      chargebacks.filter(
        (c) => c.day.startsWith(period) && (tab === "GLOBAL" || c.market === tab)
      ),
    [chargebacks, period, tab]
  );

  const cbLostCents = cbInPeriod.filter((c) => c.status === "lost").reduce((s, c) => s + c.amountCents, 0);
  const cbOpenCents = cbInPeriod.filter((c) => c.status === "open").reduce((s, c) => s + c.amountCents, 0);
  const cbFeesCents = cbInPeriod.filter((c) => c.status !== "won").reduce((s, c) => s + c.feeCents, 0);

  // Argent repris = remboursements (déjà dans le net) + litiges perdus + frais.
  const moneyBackCents = refundedCents + cbLostCents + cbFeesCents;
  // Net ajusté : le net (qui inclut déjà les remboursements) moins les pertes
  // de litiges + leurs frais (qui ne sont PAS dans le net validé).
  const netAdjustedCents = netCents - cbLostCents - cbFeesCents;

  const changePeriod = (delta: number) => {
    play("tab");
    if (gran === "month") setMonthIdx((i) => Math.min(months.length - 1, Math.max(0, i + delta)));
    else setYearIdx((i) => Math.min(years.length - 1, Math.max(0, i + delta)));
  };

  const periodLabel = gran === "month" ? formatMonthLabel(period) : period;
  const canPrev = gran === "month" ? monthIdx > 0 : yearIdx > 0;
  const canNext = gran === "month" ? monthIdx < months.length - 1 : yearIdx < years.length - 1;

  void prevMonth; // réservé pour un futur Δ vs période précédente

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

      {/* Argent repris + net ajusté (les 2 chiffres à maîtriser) */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-red/30 bg-red/[0.04] p-4">
          <div className="text-[10px] uppercase tracking-wide text-ink-faint">💸 Argent repris</div>
          <div className="mt-1 text-2xl font-bold tnum text-red">−{formatEur0(moneyBackCents)}</div>
          <div className="mt-0.5 text-[10px] text-ink-faint tnum">
            {formatPct(grossCaCents > 0 ? moneyBackCents / grossCaCents : 0)} du CA brut
          </div>
        </div>
        <div className="rounded-xl border border-line bg-panel/50 p-4">
          <div className="text-[10px] uppercase tracking-wide text-ink-faint">Net ajusté (après litiges)</div>
          <div className={`mt-1 text-2xl font-bold tnum ${netAdjustedCents >= 0 ? "text-phosphor" : "text-red"}`}>
            {formatEurSigned0(netAdjustedCents)}
          </div>
          <div className="mt-0.5 text-[10px] text-ink-faint tnum">net {formatEurSigned0(netCents)} − litiges perdus/frais</div>
        </div>
      </div>

      {/* Remboursements */}
      <section
        className={`rounded-lg border p-3.5 ${
          refundRate > REFUND_ALERT_RATE ? "border-red/40 bg-red/[0.04]" : "border-line bg-panel/40"
        }`}
      >
        <div className="mb-2 flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm font-semibold">
            ↩︎ Remboursements
            {refundRate > REFUND_ALERT_RATE && (
              <span className="rounded border border-red/50 bg-red/10 px-1 py-0.5 text-[9px] font-bold text-red">
                🚨 taux &gt; {formatPct(REFUND_ALERT_RATE)}
              </span>
            )}
          </span>
          <span className="text-[10px] text-ink-faint">déjà déduits du net</span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <Stat label="Remboursé" value={formatEur0(refundedCents)} />
          <Stat
            label="Taux"
            value={formatPct(refundRate)}
            valueClass={refundRate > REFUND_ALERT_RATE ? "text-red" : ""}
          />
          <Stat label="CA brut" value={formatEur0(grossCaCents)} />
        </div>
      </section>

      {/* Rétrofacturations */}
      <section className="rounded-lg border border-line bg-panel/40 p-3.5">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-semibold">⚖️ Rétrofacturations (litiges)</span>
          <span className="text-[10px] text-ink-faint">{cbInPeriod.length} cas</span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <Stat label="Perdu ❌" value={formatEur0(cbLostCents)} valueClass="text-red" />
          <Stat label="En cours ⏳" value={formatEur0(cbOpenCents)} valueClass="text-amber" />
          <Stat label="Frais" value={formatEur0(cbFeesCents)} />
        </div>

        {cbInPeriod.length > 0 && (
          <ul className="mt-3 flex flex-col divide-y divide-line-soft">
            {cbInPeriod.map((c) => {
              const st = STATUS_META[c.status];
              return (
                <li key={c.id} className="flex items-center justify-between gap-2 py-1.5 text-[11.5px]">
                  <span className="flex items-center gap-1.5">
                    <span aria-hidden>{MARKET_META[c.market].flag}</span>
                    <span className="text-ink-dim">{formatDayShort(c.day)}</span>
                    {c.orderName && <span className="text-ink-faint">{c.orderName}</span>}
                    {c.reason && <span className="hidden text-ink-faint sm:inline">· {c.reason}</span>}
                  </span>
                  <span className="flex items-center gap-2 tnum">
                    <span className="font-semibold">{formatEur0(c.amountCents)}</span>
                    <span className={`text-[10px] ${st.className}`}>
                      {st.emoji} {st.label}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <p className="text-center text-[10px] leading-snug text-ink-faint">
        Le « net ajusté » ne modifie pas le net validé au centime : c&apos;est un calque de contrôle. Les
        remboursements sont déjà dans le net (lus automatiquement depuis Shopify, rien à saisir).{" "}
        <b>Les rétrofacturations ne sont pas encore automatiques</b> — Shopify demande une permission
        supplémentaire (<code>read_shopify_payments_disputes</code>) pas encore accordée à l&apos;app. Le
        formulaire de saisie manuelle a été retiré (08/08, sur demande de Badr) plutôt que de compter sur
        une saisie qui n&apos;arrivera pas — à réactiver en automatique dès que la permission est ajoutée
        côté Shopify.
      </p>
    </div>
  );
}

function Stat({ label, value, valueClass = "" }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[9px] uppercase tracking-wide text-ink-faint">{label}</span>
      <span className={`text-sm font-bold tnum ${valueClass}`}>{value}</span>
    </div>
  );
}
