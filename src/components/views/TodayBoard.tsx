"use client";

import { useEffect, useMemo } from "react";
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

  // Rythme du jour : projection fin de journée = net actuel / fraction de la
  // journée écoulée (heure Europe/Paris), comparée à hier et à la moyenne 7 j.
  const pace = useMemo(() => {
    const parts = new Intl.DateTimeFormat("fr-FR", {
      hour: "numeric",
      minute: "numeric",
      hour12: false,
      timeZone: "Europe/Paris",
    }).formatToParts(new Date());
    const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 12);
    const minute = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
    // Plancher à 20% : avant ~5h du matin une projection n'a aucun sens.
    const fraction = Math.max((hour * 60 + minute) / 1440, 0.2);
    const projectedNetCents = Math.round(global.totals.netCents / fraction);
    const endOfDay = fraction >= 0.99;
    return { projectedNetCents, endOfDay };
  }, [global.totals.netCents]);

  const hasPaceRefs = view.pace.avg7CaCents > 0 || view.pace.yesterdayCaCents > 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Héros : gain net global */}
      <section className="rise-in overflow-hidden rounded-xl border border-line bg-panel/60 p-5 lg:p-8">
        <div className="flex items-center justify-between">
          <span className="text-[11px] uppercase tracking-[0.15em] text-ink-dim lg:text-sm">
            {MARKET_META.GLOBAL.flag} Gain net · aujourd&apos;hui
          </span>
          <StatusPill status={global.metrics.status} roasLabel={formatRoas(global.metrics.roas)} />
        </div>

        <div
          className={`mt-2 text-[clamp(3.25rem,14vw,7.5rem)] font-bold leading-none tnum ${
            netPos ? "text-phosphor glow-net-pos" : "text-red glow-net-neg"
          }`}
        >
          <CountUp value={global.totals.netCents / 100} format={(n) => formatEurSigned(Math.round(n * 100))} />
        </div>

        <dl className="mt-4 grid grid-cols-4 gap-2 text-center lg:mt-6 lg:gap-4">
          <Metric label="CA" value={formatEur0(global.totals.caCents)} />
          <Metric label="Spend" value={formatEur0(global.totals.spendCents)} />
          <Metric label="Marge" value={formatPct(global.metrics.marginPct)} />
          <Metric label="Cmd" value={formatInt(global.totals.orders)} />
        </dl>

        {hasPaceRefs && (
          <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1 border-t border-line-soft pt-2 text-[10.5px]">
            <span className="uppercase tracking-wide text-ink-faint">📈 Rythme</span>
            {!pace.endOfDay && (
              <span className="text-ink-dim">
                fin de journée ~
                <b className={`tnum ${pace.projectedNetCents >= 0 ? "text-phosphor" : "text-red"}`}>
                  {formatEurSigned0(pace.projectedNetCents)}
                </b>
              </span>
            )}
            <span className="text-ink-dim">
              hier <b className="tnum text-ink">{formatEurSigned0(view.pace.yesterdayNetCents)}</b>
            </span>
            <span className="text-ink-dim">
              moy. 7 j <b className="tnum text-ink">{formatEurSigned0(view.pace.avg7NetCents)}</b>
            </span>
          </div>
        )}

        {global.thresholds.breakEven !== null && (
          <p className="mt-2 text-[10.5px] text-ink-faint">
            Seuils ROAS (14 j) · rentabilité {formatRoasBare(global.thresholds.breakEven)}
            {global.thresholds.target !== null && <> · cible {formatRoasBare(global.thresholds.target)}</>}
          </p>
        )}
      </section>

      {/* Cartes par marché — 2 colonnes sur mobile, 4 en ligne sur ordinateur */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {markets.map((card, i) => {
          const meta = MARKET_META[card.market];
          const pos = card.totals.netCents >= 0;
          return (
            <section
              key={card.market}
              className="rise-in rounded-lg border border-line bg-panel/40 p-3.5 lg:p-5"
              style={{ animationDelay: `${80 + i * 60}ms` }}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold lg:text-base">
                  <span aria-hidden>{meta.flag}</span> {meta.label}
                </span>
                <StatusPill status={card.metrics.status} roasLabel={formatRoas(card.metrics.roas)} />
              </div>
              <div className={`mt-2 text-2xl font-bold leading-none tnum lg:text-4xl ${pos ? "text-phosphor" : "text-red"}`}>
                <CountUp
                  value={card.totals.netCents / 100}
                  format={(n) => formatEurSigned0(Math.round(n * 100))}
                  durationMs={800}
                />
              </div>
              <dl className="mt-2.5 grid grid-cols-3 gap-1 text-center text-[10.5px] lg:mt-4 lg:text-xs">
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
      <dt className="text-[10px] uppercase tracking-wide text-ink-faint lg:text-xs">{label}</dt>
      <dd className="text-sm font-semibold tnum lg:text-2xl">{value}</dd>
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
