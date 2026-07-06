"use client";

import { useEffect } from "react";
import type { TodayView } from "@/lib/data";
import { MARKET_META } from "@/lib/markets";
import {
  formatEur0,
  formatEurSigned,
  formatEurSigned0,
  formatInt,
  formatPct,
  formatRoas,
  formatRoasBare,
} from "@/lib/format";
import { CountUp } from "../fx/CountUp";
import { StatusPill, statusText } from "../shell/StatusPill";
import { useSound } from "../sound/SoundProvider";

export function TodayBoard({ view }: { view: TodayView }) {
  const { play } = useSound();
  const global = view.cards[0];
  const markets = view.cards.slice(1);

  useEffect(() => {
    // petite récompense sonore si la journée est dans le vert
    if (global.metrics.status === "green" && global.totals.netCents > 0) {
      const id = setTimeout(() => play("cash"), 700);
      return () => clearTimeout(id);
    }
  }, [global.metrics.status, global.totals.netCents, play]);

  const netPos = global.totals.netCents >= 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Héros : gain net global */}
      <section className="rise-in overflow-hidden rounded-xl border border-line bg-panel/60 p-5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] uppercase tracking-[0.15em] text-ink-dim">
            {MARKET_META.GLOBAL.flag} Gain net · aujourd&apos;hui
          </span>
          <StatusPill status={global.metrics.status} roasLabel={formatRoas(global.metrics.roas)} />
        </div>

        <div
          className={`mt-2 text-[clamp(2.75rem,13vw,4.5rem)] font-bold leading-none tnum ${
            netPos ? "text-phosphor glow-net-pos" : "text-red glow-net-neg"
          }`}
        >
          <CountUp value={global.totals.netCents / 100} format={(n) => formatEurSigned(Math.round(n * 100))} />
        </div>

        <dl className="mt-4 grid grid-cols-4 gap-2 text-center">
          <Metric label="CA" value={formatEur0(global.totals.caCents)} />
          <Metric label="Spend" value={formatEur0(global.totals.spendCents)} />
          <Metric label="Marge" value={formatPct(global.metrics.marginPct)} />
          <Metric label="Cmd" value={formatInt(global.totals.orders)} />
        </dl>

        {global.thresholds.breakEven !== null && (
          <p className="mt-3 border-t border-line-soft pt-2 text-[10.5px] text-ink-faint">
            Seuils ROAS (14 j) · rentabilité {formatRoasBare(global.thresholds.breakEven)}
            {global.thresholds.target !== null && <> · cible {formatRoasBare(global.thresholds.target)}</>}
          </p>
        )}
      </section>

      {/* Cartes par marché */}
      <div className="grid grid-cols-2 gap-3">
        {markets.map((card, i) => {
          const meta = MARKET_META[card.market];
          const pos = card.totals.netCents >= 0;
          return (
            <section
              key={card.market}
              className="rise-in rounded-lg border border-line bg-panel/40 p-3.5"
              style={{ animationDelay: `${80 + i * 60}ms` }}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">
                  <span aria-hidden>{meta.flag}</span> {meta.label}
                </span>
                <StatusPill status={card.metrics.status} roasLabel={formatRoas(card.metrics.roas)} />
              </div>
              <div className={`mt-2 text-2xl font-bold leading-none tnum ${pos ? "text-phosphor" : "text-red"}`}>
                <CountUp
                  value={card.totals.netCents / 100}
                  format={(n) => formatEurSigned0(Math.round(n * 100))}
                  durationMs={800}
                />
              </div>
              <dl className="mt-2.5 grid grid-cols-3 gap-1 text-center text-[10.5px]">
                <MiniMetric label="CA" value={formatEur0(card.totals.caCents)} />
                <MiniMetric label="Spend" value={formatEur0(card.totals.spendCents)} />
                <MiniMetric label="Cmd" value={formatInt(card.totals.orders)} />
              </dl>
            </section>
          );
        })}
      </div>

      {view.fromAggregates && (
        <p className="text-center text-[10.5px] text-ink-faint">
          ⚠︎ Live indisponible — chiffres du jour lus depuis les agrégats en base.
        </p>
      )}
      <p className="text-center text-[10.5px] text-ink-faint">
        Couleur ROAS : <span className={statusText("red")}>🔴 sous rentabilité</span> ·{" "}
        <span className={statusText("yellow")}>🟡 vers cible</span> ·{" "}
        <span className={statusText("green")}>🟢 ≥ cible 20 %</span>
      </p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-[10px] uppercase tracking-wide text-ink-faint">{label}</dt>
      <dd className="text-sm font-semibold tnum">{value}</dd>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-[9px] uppercase tracking-wide text-ink-faint">{label}</dt>
      <dd className="font-medium tnum text-ink-dim">{value}</dd>
    </div>
  );
}
