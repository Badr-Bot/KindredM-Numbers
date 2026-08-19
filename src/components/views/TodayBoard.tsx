"use client";

import { useEffect, useMemo, useState } from "react";
import type { TodayView } from "@/lib/data";
import type { ProductSplitCard } from "@/lib/analytics";
import { MARKET_META } from "@/lib/markets";
import {
  formatEur0,
  formatEurSigned,
  formatEurSigned0,
  formatInt,
  formatPct,
  formatRoas,
  formatRoasBare,
  netTierClass,
} from "@/lib/format";
import { CountUp } from "../fx/CountUp";
import { Confetti } from "../fx/Confetti";
import { Reveal } from "../fx/Reveal";
import { useHoverSound } from "../fx/useHoverSound";
import { StatusPill, statusText } from "../shell/StatusPill";
import { useSound } from "../sound/SoundProvider";

export function TodayBoard({
  view,
  unmappedSpendCents = 0,
  productSplit = [],
}: {
  view: TodayView;
  unmappedSpendCents?: number;
  productSplit?: ProductSplitCard[];
}) {
  const { play } = useSound();
  const hoverSound = useHoverSound();
  const global = view.cards[0];
  const markets = view.cards.slice(1);
  const [celebrate, setCelebrate] = useState(false);
  // Si le BootOverlay va s'afficher (1ère page de la session), on attend
  // qu'il ait fini de disparaître avant de fêter le net — sinon la
  // célébration se joue cachée derrière l'overlay encore en train de
  // s'effacer (voir BootOverlay.tsx, même clé sessionStorage).
  const [rewardDelayMs] = useState(() => {
    if (typeof window === "undefined") return 700;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const alreadyBooted = window.sessionStorage.getItem("niva:booted") === "1";
    return alreadyBooted || reduce ? 700 : 1700;
  });

  useEffect(() => {
    // récompense sonore + visuelle propre au statut du jour : cible atteinte
    // = célébration (son + confettis), sinon un signal discret, jamais un
    // buzz — le rouge reste doux (une seule note grave), pas une alarme.
    const timers: ReturnType<typeof setTimeout>[] = [];
    if (global.metrics.status === "green" && global.totals.netCents > 0) {
      timers.push(
        setTimeout(() => {
          play("celebrate");
          setCelebrate(true);
          timers.push(setTimeout(() => setCelebrate(false), 950));
        }, rewardDelayMs)
      );
    } else if (global.metrics.status === "yellow") {
      timers.push(setTimeout(() => play("statusYellow"), rewardDelayMs));
    } else if (global.metrics.status === "red") {
      timers.push(setTimeout(() => play("statusRed"), rewardDelayMs));
    }
    return () => timers.forEach(clearTimeout);
  }, [global.metrics.status, global.totals.netCents, play, rewardDelayMs]);

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
      {view.fixedCostsCents > 0 && (
        <a
          href="/depenses"
          className="flex items-center justify-between rounded-lg border border-amber/30 bg-amber/[0.06] px-3.5 py-2.5 transition hover:bg-amber/[0.1]"
        >
          <span className="flex items-center gap-2">
            <span aria-hidden className="text-lg">💳</span>
            <span className="flex flex-col">
              <span className="text-[11px] font-semibold text-ink">Charges fixes du jour</span>
              <span className="text-[9.5px] text-ink-faint">
                Abonnements/équipe, déjà déduites du net global · détail dans Dépenses →
              </span>
            </span>
          </span>
          <span className="tnum text-lg font-bold text-amber">
            −{formatEur0(view.fixedCostsCents)}
          </span>
        </a>
      )}
      {unmappedSpendCents > 0 && (
        <a
          href="/controle"
          className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-[11.5px] text-amber-300 transition hover:bg-amber-500/15"
        >
          ⚠️ {formatEur0(unmappedSpendCents)} de spend Meta pas encore classé
          aujourd&apos;hui (nouvelle campagne pas reconnue) — déjà compté dans le
          total ci-dessous, mais pas encore réparti par marché. Assigne-la →
        </a>
      )}
      {/* Héros : gain net global */}
      <section
        onMouseEnter={hoverSound}
        className="card-shadow card-interactive rise-in relative overflow-hidden rounded-2xl border border-line bg-panel p-5 lg:p-8"
      >
        {celebrate && <Confetti />}
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium uppercase tracking-[0.15em] text-ink-dim lg:text-sm">
            {MARKET_META.GLOBAL.flag} Gain net · aujourd&apos;hui
          </span>
          <StatusPill status={global.metrics.status} merLabel={formatRoas(global.metrics.mer)} />
        </div>

        <div
          className={`mt-2 text-[clamp(3.25rem,14vw,7.5rem)] font-black tracking-tight leading-none tnum ${netTierClass(
            global.totals.netCents
          )}`}
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
            Seuils MER (14 j) · rentabilité {formatRoasBare(global.thresholds.breakEven)}
            {global.thresholds.target !== null && <> · cible {formatRoasBare(global.thresholds.target)}</>}
          </p>
        )}
      </section>

      {/* 🧭 D'où viennent les ventes du jour (source + récurrents) */}
      {view.acquisition && (
        <Reveal>
        <section onMouseEnter={hoverSound} className="card-shadow card-interactive rounded-xl border border-line bg-panel p-3.5">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-dim">
              🧭 Sources des ventes du jour
            </span>
            {view.acquisition.repeatOrders > 0 && (
              <span className="rounded border border-cyan/40 bg-cyan/10 px-2 py-0.5 text-[10.5px] font-bold text-cyan tnum">
                🔁 {view.acquisition.repeatOrders} client{view.acquisition.repeatOrders > 1 ? "s" : ""} qui
                revien{view.acquisition.repeatOrders > 1 ? "nent" : "t"} ·{" "}
                {formatEur0(view.acquisition.repeatCaCents)}
              </span>
            )}
          </div>
          {view.acquisition.pending ? (
            <p className="text-[11px] text-ink-faint">
              ⏳ Le re-scan des sources est en cours (automatique) — les répartitions
              Google/Meta/direct apparaîtront d&apos;ici quelques minutes.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {view.acquisition.sources.map((s) => (
                <div key={s.key} className="rounded-lg border border-line-soft bg-terminal-2 px-2.5 py-2 text-center">
                  <div className="text-[10px] uppercase tracking-wide text-ink-faint">
                    <span aria-hidden>{s.emoji}</span> {s.label}
                  </div>
                  <div className="mt-0.5 text-sm font-bold tnum lg:text-lg">
                    {s.orders} <span className="text-[10px] font-normal text-ink-dim">cmd</span>
                  </div>
                  <div className="text-[10.5px] text-ink-dim tnum">{formatEur0(s.caCents)}</div>
                </div>
              ))}
            </div>
          )}
          <p className="mt-2 text-[9.5px] text-ink-faint">
            Le ROAS Meta se lit face aux ventes 📣 Meta — les ventes Google/direct/récurrents sont
            « gratuites » (pas de spend), elles gonflent le ROAS global.
          </p>
        </section>
        </Reveal>
      )}

      {/* Cartes par marché — 2 colonnes sur mobile, 4 en ligne sur ordinateur */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {markets.map((card, i) => {
          const meta = MARKET_META[card.market];
          return (
            <Reveal key={card.market} delayMs={i * 60}>
              <section
                onMouseEnter={hoverSound}
                className="card-shadow card-interactive rounded-xl border border-line bg-panel p-3.5 lg:p-5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold lg:text-base">
                    <span aria-hidden>{meta.flag}</span> {meta.label}
                  </span>
                  <StatusPill status={card.metrics.status} merLabel={formatRoas(card.metrics.mer)} />
                </div>
                <div className={`mt-2 text-2xl font-black tracking-tight leading-none tnum lg:text-4xl ${netTierClass(card.totals.netCents)}`}>
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
            </Reveal>
          );
        })}
      </div>

      <p className="text-center text-[10.5px] text-ink-faint">
        Couleur ROAS : <span className={statusText("red")}>🔴 sous rentabilité</span> ·{" "}
        <span className={statusText("yellow")}>🟡 vers cible</span> ·{" "}
        <span className={statusText("green")}>🟢 ≥ cible 15 %</span>
      </p>

      {productSplit.length > 0 && <ProductCards cards={productSplit} />}
    </div>
  );
}

/** Cartes par produit PRINCIPAL (Gilet vs Polo) — demandé 02-03/08, refonte
 * 19/08 (Badr : « il faut séparer les cartes des produits, chaque produit a
 * sa carte avec effet ») : chaque produit est une VRAIE carte autonome —
 * même standing que les autres cartes du Live (ombre, hover, reveal décalé),
 * emoji en filigrane, net en très grand. Les upsells (Caleçon, Chemise,
 * Débardeur...) restent comptés dans le produit principal de leur commande ;
 * le spend du Polo = tout ce qui n'est pas une campagne Gilet
 * (getProductSplitForDay). */
function ProductCards({ cards }: { cards: ProductSplitCard[] }) {
  const hoverSound = useHoverSound();
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {cards.map((c, i) => {
        // MER = CA TOTAL ÷ spend (inclut organique/direct/e-mail) — mesure
        // l'efficacité globale. ROAS Meta = CA que META s'attribue ÷ spend —
        // mesure la pub seule et sous-estime le jour même (attribution, se
        // corrige en 24-72 h). Les deux côte à côte depuis le 12/08 (Badr).
        const merValue = c.spendCents > 0 ? c.caCents / c.spendCents : null;
        const roasMeta = c.spendCents > 0 ? c.metaPurchaseValueCents / c.spendCents : null;
        const margePct = c.caCents > 0 ? c.netCents / c.caCents : null;
        return (
          <Reveal key={c.key} delayMs={i * 90}>
            <section
              onMouseEnter={hoverSound}
              className="card-shadow card-interactive group relative overflow-hidden rounded-xl border border-line bg-panel p-3.5 lg:p-5"
            >
              {/* emoji en filigrane — l'« effet » discret qui signe la carte */}
              <span
                aria-hidden
                className="pointer-events-none absolute -right-3 -top-4 select-none text-[72px] opacity-[0.07] transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6"
              >
                {c.emoji}
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-semibold lg:text-base">
                  <span aria-hidden>{c.emoji}</span> {c.label}
                </span>
                <span className="tnum text-[10px] text-ink-faint">{formatInt(c.orders)} cmd</span>
              </div>
              <div className={`mt-2 text-2xl font-black leading-none tracking-tight tnum lg:text-3xl ${netTierClass(c.netCents)}`}>
                {formatEurSigned0(c.netCents)}
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-1.5 text-center text-[10.5px] sm:grid-cols-2">
                <MiniMetric label="CA" value={formatEur0(c.caCents)} />
                <MiniMetric label="Spend" value={formatEur0(c.spendCents)} />
                <MiniMetric label="MER" value={merValue !== null ? formatRoas(merValue) : "—"} />
                <MiniMetric label="ROAS Meta" value={roasMeta !== null ? formatRoas(roasMeta) : "—"} />
                <div className="col-span-2">
                  <MiniMetric label="Marge" value={margePct !== null ? formatPct(margePct) : "—"} />
                </div>
              </dl>
              <p className="mt-2 text-center text-[9px] text-ink-faint">upsells inclus dans leur produit principal</p>
            </section>
          </Reveal>
        );
      })}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-[10px] font-medium uppercase tracking-wide text-ink-faint lg:text-xs">{label}</dt>
      <dd className="text-sm font-bold tnum lg:text-2xl">{value}</dd>
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
