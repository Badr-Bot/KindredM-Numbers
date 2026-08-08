"use client";

import { useEffect, useMemo, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { buildExpenseBreakdown, type AcquisitionToday, type DayAgg, type ExpenseSlice, type Totals } from "@/lib/data";
import type { MarketTab } from "@/lib/markets";
import { formatDayShort, formatEur0, formatEurSigned0, formatMonthLabel, formatPct } from "@/lib/format";
import { MarketTabs } from "../shell/MarketTabs";
import { useSound } from "../sound/SoundProvider";
import { SUBSCRIPTIONS, fixedCostsCentsForDay, monthlyEurCents, subscriptionTotals } from "@/lib/subscriptions";
import { listParisDays } from "@/lib/time";
import {
  ONE_OFF_COSTS,
  SUB_PAYMENTS,
  TRANSFERS,
  oneOffTotalCentsBy,
  subPaymentsTotalCentsBy,
  transfersTotalCentsFrom,
} from "@/lib/associateLedger";

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
  charges: "#c084fc",
  net: "#33ff9c",
};

const CHANNEL_COLORS: Record<string, string> = {
  meta: "#5b8cff",
  google: "#ffc61a",
  direct: "#2fd8ff",
  autre: "#6f8a78",
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
  const historyEnd = dayData.GLOBAL.reduce((max, r) => (r.day > max ? r.day : max), months[0] ?? "");
  const [tab, setTab] = useState<MarketTab>("GLOBAL");
  const [gran, setGran] = useState<Granularity>("month");
  const [monthIdx, setMonthIdx] = useState(months.length - 1);
  const [yearIdx, setYearIdx] = useState(years.length - 1);

  const period = gran === "month" ? months[monthIdx] : years[yearIdx];
  const prevPeriod = gran === "month" ? prevMonth(period) : String(Number(period) - 1);

  const rows = dayData[tab];
  const totals = useMemo(() => sumForPrefix(rows, period), [rows, period]);
  const prevTotals = useMemo(() => sumForPrefix(rows, prevPeriod), [rows, prevPeriod]);

  // 📡 Bornes réelles de la période sélectionnée (calculées avant le
  // breakdown : les charges fixes en ont besoin pour sommer jour par jour).
  const [periodStart, periodEnd] = useMemo<[string, string]>(() => {
    if (gran === "year") return [`${period}-01-01`, `${period}-12-31`];
    const [y, m] = period.split("-").map(Number);
    const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
    return [`${period}-01`, `${period}-${String(last).padStart(2, "0")}`];
  }, [gran, period]);
  const [prevPeriodStart, prevPeriodEnd] = useMemo<[string, string]>(() => {
    if (gran === "year") return [`${prevPeriod}-01-01`, `${prevPeriod}-12-31`];
    const [y, m] = prevPeriod.split("-").map(Number);
    const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
    return [`${prevPeriod}-01`, `${prevPeriod}-${String(last).padStart(2, "0")}`];
  }, [gran, prevPeriod]);

  // Charges fixes de la période — GLOBAL uniquement (hors charges partout
  // ailleurs dans le dashboard pour les onglets par marché/produit). Sans ce
  // calcul elles disparaissaient du donut : `t.netCents` les a déjà
  // soustraites en silence sur l'onglet GLOBAL (repéré par Badr 08/08).
  const periodFixedCostsCents = useMemo(
    () => (tab === "GLOBAL" ? listParisDays(periodStart, periodEnd).reduce((s, d) => s + fixedCostsCentsForDay(d), 0) : 0),
    [tab, periodStart, periodEnd]
  );
  const prevPeriodFixedCostsCents = useMemo(
    () =>
      tab === "GLOBAL" ? listParisDays(prevPeriodStart, prevPeriodEnd).reduce((s, d) => s + fixedCostsCentsForDay(d), 0) : 0,
    [tab, prevPeriodStart, prevPeriodEnd]
  );

  const breakdown = useMemo(() => buildExpenseBreakdown(totals, periodFixedCostsCents), [totals, periodFixedCostsCents]);
  const prevBreakdown = useMemo(
    () => buildExpenseBreakdown(prevTotals, prevPeriodFixedCostsCents),
    [prevTotals, prevPeriodFixedCostsCents]
  );

  const donutData = breakdown.slices.filter((s) => s.cents > 0);

  const [acquisition, setAcquisition] = useState<AcquisitionToday | null | "loading">("loading");
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/acquisition-summary?from=${periodStart}&to=${periodEnd}`)
      .then((r) => r.json())
      .then((body) => {
        if (!cancelled) setAcquisition(body.acquisition ?? null);
      })
      .catch(() => {
        if (!cancelled) setAcquisition(null);
      });
    return () => {
      cancelled = true;
    };
  }, [periodStart, periodEnd]);

  const channelDonutData = useMemo(
    () => (acquisition && acquisition !== "loading" ? acquisition.sources.filter((s) => s.caCents > 0) : []),
    [acquisition]
  );
  const channelCaTotal = channelDonutData.reduce((s, c) => s + c.caCents, 0);

  // 📧 CA email (Klaviyo, campagnes seulement — jamais les flows ni les
  // campagnes « bienvenue »)
  const [klaviyo, setKlaviyo] = useState<
    | { attributedRevenueCents: number; conversions: number; campaignsCount: number; excludedCampaignNames: string[] }
    | { error: string }
    | "loading"
  >("loading");
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/klaviyo/summary?since=${periodStart}&until=${periodEnd}`)
      .then((r) => r.json())
      .then((body) => {
        if (!cancelled) setKlaviyo(body.error ? { error: body.error } : body.revenue);
      })
      .catch(() => {
        if (!cancelled) setKlaviyo({ error: "Appel réseau Klaviyo impossible." });
      });
    return () => {
      cancelled = true;
    };
  }, [periodStart, periodEnd]);

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

      {/* 💳 Abonnements & charges fixes (source : PDF Adnane, 08/08 — déménagé
          depuis l'onglet Année le 08/08 pour tout ranger au même endroit) */}
      <section className="rounded-lg border border-line bg-panel/40 p-3.5">
        <div className="mb-1 text-sm font-semibold">💳 Abonnements & charges fixes</div>
        {(() => {
          const t = subscriptionTotals(historyEnd);
          return (
            <div className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-[13px]">
              <span>≈ <b className="tnum text-amber">{formatEur0(t.monthlyCents)}</b> / mois</span>
              <span>≈ <b className="tnum text-amber">{formatEur0(t.dailyCents)}</b> / jour</span>
              <span>≈ <b className="tnum text-amber">{formatEur0(t.yearlyCents)}</b> / an</span>
            </div>
          );
        })()}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[420px] text-left text-xs">
            <thead>
              <tr className="border-b border-hair text-[10px] uppercase text-ink-faint">
                <th className="py-1 pr-2">Poste</th>
                <th className="py-1 pr-2">Type</th>
                <th className="py-1 pr-2 text-right">€ / mois</th>
                <th className="py-1 pr-2 text-right">€ / jour</th>
                <th className="py-1 text-right">€ / an</th>
              </tr>
            </thead>
            <tbody>
              {[...SUBSCRIPTIONS]
                .sort((a, b) => monthlyEurCents(b) - monthlyEurCents(a))
                .map((sub) => {
                  const m = monthlyEurCents(sub);
                  const alerte = sub.note?.includes("URGENT");
                  return (
                    <tr key={sub.label} className="border-b border-hair/50">
                      <td className={`py-1 pr-2 ${alerte ? "text-red" : ""}`}>
                        {sub.label}
                        {alerte && " ⚠️"}
                      </td>
                      <td className="py-1 pr-2 text-ink-faint">
                        {{ EQUIPE: "Équipe", APP_SHOPIFY: "App Shopify", OUTIL: "Outil", CREDIT: "Crédit" }[sub.category]}
                      </td>
                      <td className={`tnum py-1 pr-2 text-right ${m < 0 ? "text-phosphor" : ""}`}>{formatEurSigned0(m).replace("+", "")}</td>
                      <td className="tnum py-1 pr-2 text-right text-ink-faint">{(m / 3044).toFixed(2).replace(".", ",")}</td>
                      <td className="tnum py-1 text-right text-ink-faint">{formatEurSigned0(m * 12).replace("+", "")}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-[10px] leading-snug text-ink-faint">
          Déduites du net GLOBAL jour par jour (~{(subscriptionTotals(historyEnd).dailyCents / 100).toFixed(0)} €/j) —
          les cartes par pays et par produit restent hors charges. Partage : 100 % Adnane
          avant le 14/07, 50/50 ensuite. SmartSize : résilié le 08/08 (Badr) — compté
          jusqu&apos;au 08/08 inclus, plus de charge à partir du 09/08. Jeremy/Seif : fixe seul,
          commission oubliée pour le moment (Badr 08/08) — comptés depuis leurs vraies
          dates (Seif 15/07, Jeremy 16/07). Google Ads : non compté (« pas pour le moment »).
        </p>
      </section>

      {/* 🤝 Entre associés — « tout doit être tracé et clair » (Badr 08/08) */}
      <section className="rounded-lg border border-line bg-panel/40 p-3.5">
        <div className="mb-1 text-sm font-semibold">🤝 Entre associés — ce que chacun a avancé</div>
        {(() => {
          const badrTotal =
            oneOffTotalCentsBy("BADR") + transfersTotalCentsFrom("BADR") + subPaymentsTotalCentsBy("BADR");
          const adnaneTotal =
            oneOffTotalCentsBy("ADNANE") + transfersTotalCentsFrom("ADNANE") + subPaymentsTotalCentsBy("ADNANE");
          return (
            <>
              <div className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-[13px]">
                <span>Avancé par 🟠 Badr à ce jour : <b className="tnum text-amber">{formatEur0(badrTotal)}</b></span>
                {adnaneTotal > 0 && (
                  <span>Avancé par 🔵 Adnane à ce jour : <b className="tnum text-amber">{formatEur0(adnaneTotal)}</b></span>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[420px] text-left text-xs">
                  <thead>
                    <tr className="border-b border-hair text-[10px] uppercase text-ink-faint">
                      <th className="py-1 pr-2">Date</th>
                      <th className="py-1 pr-2">Quoi</th>
                      <th className="py-1 pr-2">Payé par</th>
                      <th className="py-1 text-right">Montant</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ONE_OFF_COSTS.map((c, i) => (
                      <tr key={`oneoff-${i}`} className="border-b border-hair/50">
                        <td className="py-1 pr-2 tnum">{formatDayShort(c.day)}</td>
                        <td className="py-1 pr-2">
                          {c.label}
                          {c.original && <span className="text-ink-faint"> ({c.original})</span>}
                        </td>
                        <td className="py-1 pr-2">{c.paidBy === "BADR" ? "🟠 Badr" : "🔵 Adnane"}</td>
                        <td className="tnum py-1 text-right">{formatEur0(c.eurCents)}</td>
                      </tr>
                    ))}
                    {TRANSFERS.map((t, i) => (
                      <tr key={`transfer-${i}`} className="border-b border-hair/50">
                        <td className="py-1 pr-2 tnum">{t.day ? formatDayShort(t.day) : "date ?"}</td>
                        <td className="py-1 pr-2">
                          {t.label} <span className="text-ink-faint">(transfert, hors charges)</span>
                        </td>
                        <td className="py-1 pr-2">{t.from === "BADR" ? "🟠 Badr" : "🔵 Adnane"}</td>
                        <td className="tnum py-1 text-right">{formatEur0(t.eurCents)}</td>
                      </tr>
                    ))}
                    {SUB_PAYMENTS.map((p, i) => (
                      <tr key={`subpay-${i}`} className="border-b border-hair/50">
                        <td className="py-1 pr-2 tnum">{p.day ? formatDayShort(p.day) : "date ?"}</td>
                        <td className="py-1 pr-2">
                          {p.label} <span className="text-ink-faint">(facture réelle)</span>
                        </td>
                        <td className="py-1 pr-2">{p.payer === "BADR" ? "🟠 Badr" : "🔵 Adnane"}</td>
                        <td className="tnum py-1 text-right">{formatEur0(p.eurCents)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          );
        })()}
        <p className="mt-2 text-[10px] leading-snug text-ink-faint">
          Les frais LLC sont déduits du net global le 21/06 et partagés <b>50/50</b> (décision
          Badr : la LLC a servi à lancer le 14/07) — payés en entier par Badr, sa moitié est à
          sa charge, l&apos;autre moitié (259,18 €) lui est due au règlement. L&apos;avance de
          1 000 € du 21/06 est un transfert entre vous : hors bénéfice, à solder au règlement.
          Le Claude de Badr (100 €/mois depuis le 15/07) est compté dans les charges ; seule la
          1re facture (15/07) est sortie de sa poche et créditée ici — depuis la 2e (08/08) la
          carte LLC paie, donc ce compteur ne bouge plus. Le Hushed d&apos;Adnane (7,99 €/mois) :
          les 2 premiers mois (juillet, août) sont sortis de sa poche et crédités ici — à partir
          de septembre la carte LLC prend le relais. Dites-moi si d&apos;autres abonnements sont
          payés perso pour les tracer pareil. <b>Ce solde est déjà intégré</b> aux cartes « combien
          j&apos;ai gagné » de l&apos;onglet Année et au total depuis le début — chaque avance
          corrige le mois où elle est vraiment tombée (juin pour la LLC et le transfert,
          juillet/août pour Claude et Hushed), jamais un mois choisi au hasard.
        </p>
      </section>

      {/* 🎯 Pistes d'économies — demande Badr 08/08 : « propose des trucs pour alléger les coûts » */}
      <section className="rounded-lg border border-amber/30 bg-amber/[0.04] p-3.5">
        <div className="mb-2 text-[11px] font-semibold text-amber">💡 Pistes d&apos;économies</div>
        <ul className="flex flex-col gap-2 text-[11.5px] leading-snug">
          <li>
            <b className="text-phosphor">SmartSize (287,49 €/mois)</b> — résilié le 08/08 (Badr).
            ~3 450 €/an économisés à partir du 09/08.
          </li>
          <li>
            <b>Moon Bundles (≈ 52 €/mois, plan Premium)</b> — downgrader au plan Essential (≈13 €/mois)
            ou Free s&apos;il ne sert qu&apos;à des bundles simples, ou passer à l&apos;app native
            Shopify Bundles (gratuite, gère les bundles à prix fixe et multipacks).
          </li>
          <li>
            <b>Crédit d&apos;abonnement (−88 €/mois)</b> — Adnane dit qu&apos;il ne finance que
            l&apos;abonnement Shopify lui-même (pas les apps) : décompté ici du même montant tant que
            confirmé actif ; à retirer si Shopify l&apos;a épuisé.
          </li>
          <li>
            <b>Jeremy / Seif (2 600 €/mois à eux deux)</b> — le poste le plus lourd (58 % des charges).
            Une fois un mois complet de recul (fin août), comparer le CA qu&apos;ils rapportent
            (campagnes Klaviyo ci-dessus pour Jeremy) à leur coût pour juger s&apos;ils se paient.
          </li>
        </ul>
      </section>

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

          {/* 📡 CA par canal — quel levier (Google/Meta/direct/Klaviyo) rapporte
              vraiment (demande Badr 08/08). Le donut vient des données de
              tracking Shopify (Google/Meta/direct) ; Klaviyo est affiché à
              part car ce n'est pas la même mesure (attribution email propre à
              Klaviyo, jamais recoupée avec le donut pour ne pas compter deux
              fois une même vente). */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="relative rounded-lg border border-line bg-panel/40 p-2">
              <div className="mb-1 px-1 text-[9px] uppercase tracking-wide text-ink-faint">
                📡 CA par canal (tracking Shopify)
              </div>
              {acquisition === "loading" ? (
                <p className="p-4 text-center text-[10.5px] text-ink-faint">Chargement…</p>
              ) : channelDonutData.length === 0 ? (
                <p className="p-4 text-center text-[10.5px] text-ink-faint">
                  Pas de données de source sur cette période.
                </p>
              ) : (
                <>
                  <div className="h-44 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={channelDonutData}
                          dataKey="caCents"
                          nameKey="label"
                          innerRadius="55%"
                          outerRadius="85%"
                          paddingAngle={1.5}
                          stroke="#070a08"
                          strokeWidth={1.5}
                        >
                          {channelDonutData.map((s) => (
                            <Cell key={s.key} fill={CHANNEL_COLORS[s.key] ?? "#6f8a78"} />
                          ))}
                        </Pie>
                        <Tooltip content={<ChannelTooltip total={channelCaTotal} />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <ul className="flex flex-col gap-1 px-1 pb-1 text-[11px]">
                    {channelDonutData
                      .sort((a, b) => b.caCents - a.caCents)
                      .map((s) => (
                        <li key={s.key} className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <span
                              className="h-2.5 w-2.5 rounded-sm"
                              style={{ background: CHANNEL_COLORS[s.key] ?? "#6f8a78" }}
                            />
                            <span aria-hidden>{s.emoji}</span> {s.label}
                          </span>
                          <span className="tnum text-ink-dim">
                            {formatEur0(s.caCents)} · {formatPct(channelCaTotal ? s.caCents / channelCaTotal : null)}
                          </span>
                        </li>
                      ))}
                  </ul>
                </>
              )}
            </div>

            <div className="rounded-lg border border-line bg-panel/40 p-3">
              <div className="mb-1.5 text-[9px] uppercase tracking-wide text-ink-faint">
                📧 CA email (Klaviyo, campagnes seulement)
              </div>
              {klaviyo === "loading" ? (
                <p className="text-[10.5px] text-ink-faint">Chargement…</p>
              ) : "error" in klaviyo ? (
                <p className="text-[10.5px] leading-snug text-ink-faint">
                  ⚠️ {klaviyo.error.includes("KLAVIYO_API_KEY")
                    ? "Clé Klaviyo pas encore ajoutée dans Vercel."
                    : `Klaviyo indisponible : ${klaviyo.error}`}
                </p>
              ) : (
                <>
                  <div className="text-xl font-bold tnum text-phosphor lg:text-2xl">
                    {formatEur0(klaviyo.attributedRevenueCents)}
                  </div>
                  <div className="mt-1 text-[10.5px] text-ink-dim tnum">
                    {klaviyo.conversions} commande{klaviyo.conversions > 1 ? "s" : ""} ·{" "}
                    {klaviyo.campaignsCount} campagne{klaviyo.campaignsCount > 1 ? "s" : ""}
                  </div>
                  {klaviyo.excludedCampaignNames.length > 0 && (
                    <div className="mt-1 text-[9.5px] text-ink-faint">
                      Exclues (bienvenue) : {klaviyo.excludedCampaignNames.join(", ")}
                    </div>
                  )}
                </>
              )}
              <p className="mt-2 text-[9.5px] text-ink-faint">
                Jamais les flows automatiques, jamais une campagne dont le nom contient « bienvenue »
                (n&apos;importe qui atterrissant sur le site peut avoir ce code, ce n&apos;est pas un
                geste de Jeremy) — seulement ses vraies campagnes. Mesure indépendante du donut à
                gauche : ne pas additionner les deux (une vente email peut aussi apparaître en
                « Direct » côté Shopify).
              </p>
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

function ChannelTooltip({
  active,
  payload,
  total,
}: {
  active?: boolean;
  payload?: Array<{ payload: { key: string; label: string; emoji: string; caCents: number; orders: number } }>;
  total: number;
}) {
  if (!active || !payload?.length) return null;
  const s = payload[0].payload;
  return (
    <div className="rounded border border-line bg-terminal/95 px-2.5 py-1.5 text-[11px] shadow-lg">
      <div className="font-semibold text-ink">
        {s.emoji} {s.label}
      </div>
      <div className="tnum text-ink-dim">
        {formatEur0(s.caCents)} · {formatPct(total ? s.caCents / total : null)} · {s.orders} cmd
      </div>
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

