"use client";

import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CreasData } from "@/lib/analytics";
import { formatDayShort, formatEur0, formatInt, formatPct, formatRoas } from "@/lib/format";
import { useSound } from "../sound/SoundProvider";

// Arbre de décision du batch de test (Badr, 26/07) :
//   1. Une créa neuve dépense — tant qu'elle n'a pas atteint 2× le CPA cible,
//      elle est « en test », on ne juge pas (pas assez de données).
//   2. Passé ce seuil : CPA au-dessus de la cible (ou zéro vente) → on coupe.
//   3. Sinon → gagnante : elle passe en campagne de scaling et sort du batch.
// Remplace l'ancienne règle « 3 jours au-dessus de la cible » : la source de
// Badr dit explicitement l'inverse (une créa établie qui fait 2-3 mauvais
// jours, on n'y touche pas), et cette règle-là coupait des créas rentables.
const JUDGE_SPEND_MULTIPLE = 2;

// Une créa qui a déjà beaucoup dépensé ET qui vend n'est PAS traitée comme
// un simple échec de test : au-delà de ce seuil, un CPA au-dessus de la cible
// donne « à surveiller » et non « à couper » — elle nourrit le compte en
// trafic, la couper fait souvent tomber les autres (mise en garde de la
// source de Badr, 26/07).
const ESTABLISHED_SPEND_MULTIPLE = 10;

// Nombre de cartes rendues d'un coup (chacune porte un graphique).
const PAGE_SIZE = 24;

type CreaStatus = "cut" | "watch" | "winner" | "testing";

/** Tous les jours (inclus) entre deux dates ISO — pour matérialiser les jours
 * sans diffusion, que Meta omet purement et simplement. */
function listDays(from: string, to: string): string[] {
  const out: string[] = [];
  const d = new Date(`${from}T00:00:00Z`);
  const end = new Date(`${to}T00:00:00Z`);
  while (d <= end) {
    out.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return out;
}

type Preset = "7" | "14" | "30" | "all" | "custom";

const RANKING_LABEL: Record<string, string> = {
  above_average: "au-dessus",
  average: "moyenne",
  below_average_35: "en dessous",
  below_average_20: "en dessous",
  below_average_10: "en dessous",
  unknown: "—",
};

interface CreaRow {
  adId: string;
  adName: string;
  campaignId: string;
  campaignName: string;
  body: string | null;
  qualityRanking: string | null;
  engagementRanking: string | null;
  conversionRanking: string | null;
  spendCents: number;
  caCents: number;
  clicks: number;
  purchases: number;
  impressions: number;
  reach: number;
  linkClicks: number;
  landingPageViews: number;
  addToCart: number;
  initiateCheckout: number;
  video3s: number;
  video50: number;
  video75: number;
  video100: number;
  isVideo: boolean;
  roas: number | null;
  cpaCents: number | null;
  ctrPct: number | null;
  cpmCents: number | null;
  freq: number | null;
  hookRate: number | null;
  hold50: number | null;
  hold75: number | null;
  hold100: number | null;
  lpvRate: number | null;
  cvrLanding: number | null;
  atcRate: number | null;
  checkoutRate: number | null;
  status: CreaStatus;
  /** part du spend de SA campagne sur la période (0..1) — critère gagnante */
  spendShare: number | null;
  /** cumul depuis le début (hors filtre de période) — base du verdict */
  lifetimeSpendCents: number;
  lifetimeCpaCents: number | null;
  series: {
    label: string;
    /** aucune diffusion ce jour-là (Meta n'a rien renvoyé, ou spend 0) */
    noDelivery: boolean;
    spendCents: number;
    caCents: number;
    roas: number | null;
    cpaCents: number | null;
    ctrPct: number | null;
    cpmCents: number | null;
    freq: number | null;
    cvrLandingPct: number | null;
    atcPct: number | null;
    lpvPct: number | null;
    hookPct: number | null;
    hold100Pct: number | null;
  }[];
}

type SortKey = "spendCents" | "caCents" | "roas" | "cpaCents" | "ctrPct" | "hookRate" | "hold100" | "cvrLanding";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "spendCents", label: "Spend" },
  { key: "caCents", label: "CA" },
  { key: "roas", label: "ROAS" },
  { key: "cpaCents", label: "CPA" },
  { key: "ctrPct", label: "CTR" },
  { key: "hookRate", label: "Hook (vidéo)" },
  { key: "hold100", label: "Reste jusqu'à la fin (vidéo)" },
  { key: "cvrLanding", label: "Achat après clic" },
];

export function CreasBoard({
  creas,
  today,
  historyStart,
  targetCpaCents,
}: {
  creas: CreasData;
  today: string;
  historyStart: string;
  /** CPA cible (panier moyen ÷ ROAS cible, 14j glissants) — null si la marge
   * ne permet pas encore d'en définir une. */
  targetCpaCents: number | null;
}) {
  const { play } = useSound();
  const [preset, setPreset] = useState<Preset>("14");
  const [customFrom, setCustomFrom] = useState(historyStart);
  const [customTo, setCustomTo] = useState(today);
  const [campaignFilter, setCampaignFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<CreaStatus | "ALL">("ALL");
  const [sortKey, setSortKey] = useState<SortKey>("spendCents");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  // Dépliage INDÉPENDANT par carte : déplier les ~40 cartes d'un coup montait
  // 400+ graphiques Recharts simultanément et figeait le navigateur (signalé
  // 26/07 : « quand j'appuie sur défiler ça bug »). Une carte ouverte à la
  // fois affiche déjà tout son détail d'un seul coup.
  const [openAdId, setOpenAdId] = useState<string | null>(null);

  // Rendu par paquets : chaque carte porte déjà une courbe CA, donc 300 créas
  // = 300 graphiques au montage. On en affiche un nombre limité, extensible.
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const { from, to } = useMemo(() => {
    if (preset === "custom") return { from: customFrom, to: customTo };
    if (preset === "all") return { from: historyStart, to: today };
    const days = Number(preset);
    const d = new Date(`${today}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() - (days - 1));
    return { from: d.toISOString().slice(0, 10), to: today };
  }, [preset, customFrom, customTo, today, historyStart]);

  const metaByAd = useMemo(() => new Map(creas.meta.map((m) => [m.adId, m])), [creas.meta]);

  const campaigns = useMemo(() => {
    const names = new Set(creas.meta.map((m) => m.campaignName).filter(Boolean));
    return [...names].sort();
  }, [creas.meta]);

  const filteredDaily = useMemo(
    () => creas.daily.filter((d) => d.day >= from && d.day <= to),
    [creas.daily, from, to]
  );

  // Totaux « depuis le début » (tout l'historique chargé, hors filtre de
  // période) : servent à décider QUI apparaît et QUEL verdict, jamais à
  // remplir les colonnes/courbes — celles-ci restent sur la période choisie.
  const lifetimeByAd = useMemo(() => {
    const out = new Map<string, { spendCents: number; purchases: number }>();
    for (const d of creas.daily) {
      const cur = out.get(d.adId) ?? { spendCents: 0, purchases: 0 };
      cur.spendCents += d.spendCents;
      cur.purchases += d.purchases;
      out.set(d.adId, cur);
    }
    return out;
  }, [creas.daily]);

  // Spend total par campagne sur la période — dénominateur du critère
  // « gagnante » (part du budget que l'algo lui confie).
  const campaignSpend = useMemo(() => {
    const out = new Map<string, number>();
    for (const d of filteredDaily) {
      const campaignId = metaByAd.get(d.adId)?.campaignId ?? "";
      out.set(campaignId, (out.get(campaignId) ?? 0) + d.spendCents);
    }
    return out;
  }, [filteredDaily, metaByAd]);

  const allRows: CreaRow[] = useMemo(() => {
    type Acc = Omit<CreaRow, "series"> & {
      dailyPoints: {
        day: string;
        spendCents: number;
        caCents: number;
        clicks: number;
        impressions: number;
        purchases: number;
        reach: number;
        linkClicks: number;
        landingPageViews: number;
        addToCart: number;
        video3s: number;
        video100: number;
      }[];
    };
    const byAd = new Map<string, Acc>();
    for (const d of filteredDaily) {
      const m = metaByAd.get(d.adId);
      if (campaignFilter !== "ALL" && m?.campaignName !== campaignFilter) continue;
      const cur =
        byAd.get(d.adId) ??
        ({
          adId: d.adId,
          adName: m?.adName ?? d.adId,
          campaignId: m?.campaignId ?? "",
          campaignName: m?.campaignName ?? "",
          body: m?.body ?? null,
          qualityRanking: m?.qualityRanking ?? null,
          engagementRanking: m?.engagementRanking ?? null,
          conversionRanking: m?.conversionRanking ?? null,
          spendCents: 0,
          caCents: 0,
          clicks: 0,
          purchases: 0,
          impressions: 0,
          reach: 0,
          linkClicks: 0,
          landingPageViews: 0,
          addToCart: 0,
          initiateCheckout: 0,
          video3s: 0,
          video50: 0,
          video75: 0,
          video100: 0,
          isVideo: false,
          roas: null,
          cpaCents: null,
          ctrPct: null,
          cpmCents: null,
          freq: null,
          hookRate: null,
          hold50: null,
          hold75: null,
          hold100: null,
          lpvRate: null,
          cvrLanding: null,
          atcRate: null,
          checkoutRate: null,
          status: "testing" as CreaStatus,
          spendShare: null,
          lifetimeSpendCents: 0,
          lifetimeCpaCents: null,
          dailyPoints: [],
        } satisfies Acc);
      cur.spendCents += d.spendCents;
      cur.caCents += d.purchaseValueCents;
      cur.clicks += d.clicks;
      cur.purchases += d.purchases;
      cur.impressions += d.impressions;
      cur.reach += d.reach;
      cur.linkClicks += d.linkClicks;
      cur.landingPageViews += d.landingPageViews;
      cur.addToCart += d.addToCart;
      cur.initiateCheckout += d.initiateCheckout;
      cur.video3s += d.video3s;
      cur.video50 += d.video50;
      cur.video75 += d.video75;
      cur.video100 += d.video100;
      cur.dailyPoints.push({
        day: d.day,
        spendCents: d.spendCents,
        caCents: d.purchaseValueCents,
        clicks: d.clicks,
        impressions: d.impressions,
        purchases: d.purchases,
        reach: d.reach,
        linkClicks: d.linkClicks,
        landingPageViews: d.landingPageViews,
        addToCart: d.addToCart,
        video3s: d.video3s,
        video100: d.video100,
      });
      byAd.set(d.adId, cur);
    }

    const out: CreaRow[] = [];
    for (const r of byAd.values()) {
      const lifetime = lifetimeByAd.get(r.adId) ?? { spendCents: 0, purchases: 0 };
      // Pas de seuil de spend minimum pour APPARAÎTRE dans la liste — Badr
      // veut voir le compte total réel (signalé 27/07 : "j'ai 500 créa, tu
      // m'en affiches 100"). Un ancien seuil de 20 € ici masquait purement et
      // simplement toute créa en dessous, ce qui n'était pas un vrai "bug"
      // mais donnait exactement cette impression. Les créas peu dépensières
      // restent visibles avec le statut "⏳ En test" (le seuil de JUGEMENT,
      // lui, reste sur JUDGE_SPEND_MULTIPLE × CPA cible, voir plus bas).
      r.lifetimeSpendCents = lifetime.spendCents;
      r.lifetimeCpaCents =
        lifetime.purchases > 0 ? Math.round(lifetime.spendCents / lifetime.purchases) : null;
      r.isVideo = r.video3s > 0;
      // ROAS 0 (spend sans CA) est une info valable, pas une absence de
      // donnée : sans ça la courbe et la moyenne ROAS restaient vides sur
      // les créas à 0 vente — justement celles qu'il faut voir.
      r.roas = r.spendCents > 0 ? r.caCents / r.spendCents : null;
      r.cpaCents = r.purchases > 0 ? Math.round(r.spendCents / r.purchases) : null;
      r.ctrPct = r.impressions > 0 ? r.clicks / r.impressions : null;
      r.cpmCents = r.impressions > 0 ? Math.round((r.spendCents / r.impressions) * 1000) : null;
      // Fréquence cumulée sur plusieurs jours = approximative (Meta ne
      // déduplique pas le reach entre les jours) — indicatif de saturation.
      r.freq = r.reach > 0 ? r.impressions / r.reach : null;
      r.hookRate = r.isVideo && r.impressions > 0 ? r.video3s / r.impressions : null;
      r.hold50 = r.isVideo && r.video3s > 0 ? r.video50 / r.video3s : null;
      r.hold75 = r.isVideo && r.video3s > 0 ? r.video75 / r.video3s : null;
      r.hold100 = r.isVideo && r.video3s > 0 ? r.video100 / r.video3s : null;
      // Landing page view rate : sur les clics lien (le dénominateur le plus
      // proche de "a effectivement cliqué pour aller sur le site").
      r.lpvRate = r.linkClicks > 0 ? r.landingPageViews / r.linkClicks : null;
      // CVR landing : achats / atterrissages réels — sépare le problème
      // "clic → page" du problème "page → achat" (voir échange du 25/07).
      r.cvrLanding = r.landingPageViews > 0 ? r.purchases / r.landingPageViews : null;
      r.atcRate = r.landingPageViews > 0 ? r.addToCart / r.landingPageViews : null;
      r.checkoutRate = r.addToCart > 0 ? r.initiateCheckout / r.addToCart : null;
      // Meta ne renvoie AUCUNE ligne pour un jour sans diffusion : sans
      // remplissage, la courbe reliait le 17/07 au 22/07 en ligne droite et
      // donnait l'illusion d'une baisse continue (« le CTR chute, la créa
      // fatigue ») alors que la créa était simplement à l'arrêt. On matérialise
      // ces jours en trous (valeurs nulles + ligne coupée côté MiniChart).
      const pointByDay = new Map(r.dailyPoints.map((p) => [p.day, p]));
      const series = listDays(from, to).map((day) => {
        const p = pointByDay.get(day);
        if (!p || p.spendCents === 0) {
          return {
            label: formatDayShort(day),
            noDelivery: true,
            spendCents: p?.spendCents ?? 0,
            caCents: p?.caCents ?? 0,
            roas: null,
            cpaCents: null,
            ctrPct: null,
            cpmCents: null,
            freq: null,
            cvrLandingPct: null,
            atcPct: null,
            lpvPct: null,
            hookPct: null,
            hold100Pct: null,
          };
        }
        return {
          label: formatDayShort(p.day),
          noDelivery: false,
          spendCents: p.spendCents,
          caCents: p.caCents,
          roas: p.spendCents > 0 ? p.caCents / p.spendCents : null, // 0 = jour sans vente, pas "pas de donnée"
          cpaCents: p.purchases > 0 ? Math.round(p.spendCents / p.purchases) : null,
          ctrPct: p.impressions > 0 ? (p.clicks / p.impressions) * 100 : null,
          cpmCents: p.impressions > 0 ? Math.round((p.spendCents / p.impressions) * 1000) : null,
          freq: p.reach > 0 ? p.impressions / p.reach : null,
          cvrLandingPct: p.landingPageViews > 0 ? (p.purchases / p.landingPageViews) * 100 : null,
          atcPct: p.landingPageViews > 0 ? (p.addToCart / p.landingPageViews) * 100 : null,
          lpvPct: p.linkClicks > 0 ? (p.landingPageViews / p.linkClicks) * 100 : null,
          hookPct: p.impressions > 0 && p.video3s > 0 ? (p.video3s / p.impressions) * 100 : null,
          hold100Pct: p.video3s > 0 ? (p.video100 / p.video3s) * 100 : null,
        };
      });

      // ⏳ / 🔪 / 🏆 Verdict du batch — voir l'arbre en tête de fichier.
      // Jugé sur TOUTE la vie de la créa : sur une fenêtre d'un jour, un
      // verdict calculé sur la période remettrait chaque créa « en test »
      // tous les matins.
      const campaignTotal = campaignSpend.get(r.campaignId) ?? 0;
      const spendShare = campaignTotal > 0 ? r.spendCents / campaignTotal : null;
      let status: CreaStatus = "testing";
      if (targetCpaCents !== null && lifetime.spendCents >= JUDGE_SPEND_MULTIPLE * targetCpaCents) {
        if (r.lifetimeCpaCents !== null && r.lifetimeCpaCents <= targetCpaCents) {
          status = "winner";
        } else if (lifetime.purchases === 0) {
          // Zéro vente malgré 2× le CPA cible dépensé : aucun doute possible.
          status = "cut";
        } else {
          // Elle vend, mais trop cher. « À couper » seulement si elle est
          // encore en phase de test ; passé ESTABLISHED_SPEND_MULTIPLE elle
          // fait tourner le compte et la couper peut faire tomber le reste →
          // « à surveiller », décision humaine.
          status =
            lifetime.spendCents >= ESTABLISHED_SPEND_MULTIPLE * targetCpaCents ? "watch" : "cut";
        }
      }

      out.push({
        adId: r.adId,
        adName: r.adName,
        campaignId: r.campaignId,
        campaignName: r.campaignName,
        body: r.body,
        qualityRanking: r.qualityRanking,
        engagementRanking: r.engagementRanking,
        conversionRanking: r.conversionRanking,
        spendCents: r.spendCents,
        caCents: r.caCents,
        clicks: r.clicks,
        purchases: r.purchases,
        impressions: r.impressions,
        reach: r.reach,
        linkClicks: r.linkClicks,
        landingPageViews: r.landingPageViews,
        addToCart: r.addToCart,
        initiateCheckout: r.initiateCheckout,
        video3s: r.video3s,
        video50: r.video50,
        video75: r.video75,
        video100: r.video100,
        isVideo: r.isVideo,
        roas: r.roas,
        cpaCents: r.cpaCents,
        ctrPct: r.ctrPct,
        cpmCents: r.cpmCents,
        freq: r.freq,
        hookRate: r.hookRate,
        hold50: r.hold50,
        hold75: r.hold75,
        hold100: r.hold100,
        lpvRate: r.lpvRate,
        cvrLanding: r.cvrLanding,
        atcRate: r.atcRate,
        checkoutRate: r.checkoutRate,
        status,
        spendShare,
        lifetimeSpendCents: r.lifetimeSpendCents,
        lifetimeCpaCents: r.lifetimeCpaCents,
        series,
      });
    }

    // Tri PUR sur le critère choisi — le statut ne doit jamais primer, sinon
    // « trier par spend » semble ne rien faire (les groupes cut/winner/testing
    // masquaient l'ordre demandé). Le statut se filtre à part, voir statusFilter.
    out.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      const an = av === null ? -Infinity : av;
      const bn = bv === null ? -Infinity : bv;
      return sortDir === "desc" ? bn - an : an - bn;
    });
    return out;
  }, [filteredDaily, metaByAd, campaignFilter, sortKey, sortDir, campaignSpend, targetCpaCents, from, to, lifetimeByAd]);

  const rows = useMemo(
    () => (statusFilter === "ALL" ? allRows : allRows.filter((r) => r.status === statusFilter)),
    [allRows, statusFilter]
  );

  // Changer de filtre/tri/période repart du haut de liste.
  const resetView = () => {
    setVisibleCount(PAGE_SIZE);
    setOpenAdId(null);
  };

  return (
    <div className="flex min-w-0 flex-col gap-4">
      {/* Filtres : période + campagne + tri */}
      <div className="flex flex-wrap items-center gap-2">
        {(["7", "14", "30", "all", "custom"] as Preset[]).map((p) => (
          <button
            key={p}
            onClick={() => {
              play("tab");
              setPreset(p);
              resetView();
            }}
            className={`rounded border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide transition-colors ${
              preset === p
                ? "border-phosphor bg-phosphor/10 text-phosphor"
                : "border-line text-ink-dim hover:text-ink"
            }`}
          >
            {p === "all" ? "Tout" : p === "custom" ? "Dates" : `${p} j`}
          </button>
        ))}
        {preset === "custom" && (
          <span className="flex items-center gap-1 text-[11px]">
            <input
              type="date"
              value={customFrom}
              min={historyStart}
              max={today}
              onChange={(e) => {
                play("tab");
                setCustomFrom(e.target.value);
              }}
              className="rounded border border-line bg-terminal px-1.5 py-1 text-[11px] text-ink"
            />
            →
            <input
              type="date"
              value={customTo}
              min={historyStart}
              max={today}
              onChange={(e) => {
                play("tab");
                setCustomTo(e.target.value);
              }}
              className="rounded border border-line bg-terminal px-1.5 py-1 text-[11px] text-ink"
            />
          </span>
        )}
        <select
          value={campaignFilter}
          onChange={(e) => {
            play("tab");
            setCampaignFilter(e.target.value);
            resetView();
          }}
          className="rounded border border-line bg-terminal px-2 py-1 text-[11px] text-ink"
        >
          <option value="ALL">Toutes les campagnes</option>
          {campaigns.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={sortKey}
          onChange={(e) => {
            play("tab");
            setSortKey(e.target.value as SortKey);
            resetView();
          }}
          className="rounded border border-line bg-terminal px-2 py-1 text-[11px] text-ink"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.key} value={o.key}>
              Trier : {o.label}
            </option>
          ))}
        </select>
        <button
          onClick={() => {
            play("tab");
            setSortDir((d) => (d === "desc" ? "asc" : "desc"));
            resetView();
          }}
          className="rounded border border-line px-2 py-1 text-[11px] text-ink-dim hover:text-ink"
        >
          {sortDir === "desc" ? "▼" : "▲"}
        </button>
      </div>

      {/* Filtre par verdict — remplace l'ancien groupement forcé qui écrasait
          le tri choisi (bug signalé 26/07 : « trier par spend ne marche pas »). */}
      {targetCpaCents !== null && (
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              ["ALL", `Toutes (${allRows.length})`],
              ["cut", `🔪 À couper (${allRows.filter((r) => r.status === "cut").length})`],
              ["watch", `👁️ À surveiller (${allRows.filter((r) => r.status === "watch").length})`],
              ["winner", `🏆 Gagnantes (${allRows.filter((r) => r.status === "winner").length})`],
              ["testing", `⏳ En test (${allRows.filter((r) => r.status === "testing").length})`],
            ] as [CreaStatus | "ALL", string][]
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => {
                play("tab");
                setStatusFilter(key);
                resetView();
              }}
              className={`rounded border px-2 py-1 text-[10.5px] font-semibold transition-colors ${
                statusFilter === key
                  ? "border-phosphor bg-phosphor/10 text-phosphor"
                  : "border-line text-ink-dim hover:text-ink"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {targetCpaCents !== null ? (
        (() => {
          const judgeAt = JUDGE_SPEND_MULTIPLE * targetCpaCents;
          return (
            <p className="text-[10.5px] text-ink-faint">
              🎯 CPA cible : {formatEur0(targetCpaCents)} (14 j glissants, bouge tout seul avec ta
              marge) · verdict rendu à partir de {formatEur0(judgeAt)} de spend · 🏆 gagnante ={" "}
              <b>à passer en campagne de scaling</b>, sort du batch.
            </p>
          );
        })()
      ) : (
        <p className="text-[10.5px] text-ink-faint">
          🔒 CPA cible pas encore calculable (marge insuffisante sur les 14 derniers jours) — les
          statuts gagnante/à couper s&apos;activeront automatiquement dès que la marge le permet.
        </p>
      )}

      {creas.missingTables && (
        <p className="rounded-lg border border-amber/40 bg-amber/[0.05] p-3 text-[11.5px] text-amber">
          ⚠️ Migrations <b>0005</b>/<b>0007</b>/<b>0011</b> pas encore appliquées dans Supabase (SQL
          Editor → Run) — les créas ne peuvent pas être stockées d&apos;ici là.
        </p>
      )}
      {!creas.missingTables && rows.length === 0 && (
        <p className="rounded-lg border border-line bg-panel/40 p-3 text-[11.5px] text-ink-dim">
          🔒 Aucune créa n&apos;a diffusé sur cette période. Élargis la fenêtre ou attends que les
          données Meta se remplissent.
        </p>
      )}

      {rows.length > 0 && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {rows.slice(0, visibleCount).map((r) => (
              <CreaCard
                key={r.adId}
                row={r}
                open={openAdId === r.adId}
                onToggle={() => setOpenAdId((cur) => (cur === r.adId ? null : r.adId))}
              />
            ))}
          </div>
          {rows.length > visibleCount && (
            <button
              onClick={() => {
                play("tab");
                setVisibleCount((n) => n + PAGE_SIZE);
              }}
              className="w-full rounded border border-line py-2 text-[11px] font-semibold uppercase tracking-wide text-ink-dim hover:text-ink"
            >
              ▼ Afficher {Math.min(PAGE_SIZE, rows.length - visibleCount)} créas de plus (
              {rows.length - visibleCount} restantes)
            </button>
          )}
          {/* Vue tableau, groupée par campagne — pour comparer toutes les créas
              d'un coup d'œil sans dérouler chaque carte. Pas de graphiques ici,
              donc on peut afficher TOUTES les lignes sans pagination. */}
          <CampaignTables rows={rows} targetCpaCents={targetCpaCents} />

          {/* Toutes les définitions vivent ICI, une seule fois — les cartes
              ne portent plus que des libellés courts (demandé le 26/07). */}
          <details className="rounded-lg border border-line bg-panel/40 p-2.5 text-[10px] text-ink-faint">
            <summary className="cursor-pointer font-semibold text-ink-dim">
              ❓ Que veut dire chaque chiffre ?
            </summary>
            <div className="mt-2 flex flex-col gap-1">
              <span>
                ⏳ <b>En test</b> : pas encore {JUDGE_SPEND_MULTIPLE}× le CPA cible de spend, trop tôt
                pour juger · 🔪 <b>À couper</b> : a franchi ce seuil avec zéro vente, ou vend trop cher
                alors qu&apos;elle est encore jeune · 👁️ <b>À surveiller</b> : vend au-dessus du CPA
                cible MAIS a déjà dépensé plus de {ESTABLISHED_SPEND_MULTIPLE}× la cible — elle
                alimente le compte en trafic, la couper fait souvent tomber les autres, donc c&apos;est
                à toi de trancher · 🏆 <b>Gagnante</b> : a franchi le seuil EN tenant le CPA cible → à
                passer en campagne de scaling.
              </span>
              <span>
                📅 <b>Période vs total</b> : les chiffres et courbes affichés portent sur la période
                choisie en haut. En revanche, le <b>verdict</b> (à couper / gagnante / en test) et la
                sélection des créas se basent sur <b>tout l&apos;historique</b> — sinon une créa qui
                tourne depuis des semaines repasserait « en test » chaque matin en vue journalière.
                Colonnes « Spend total » et « CPA total » = ce cumul depuis le début.
              </span>
              <span>
                ◌ <b>Jours sans diffusion</b> : la courbe est <b>coupée</b> (pas reliée) ces jours-là
                — un trou n&apos;est pas une baisse. Le nombre de jours concernés est indiqué à côté du
                titre.
              </span>
              <span>🛬 <b>Atterrissage</b> : sur 100 clics, combien arrivent vraiment sur la page (bas = page lente ou lien cassé).</span>
              <span>🛒 <b>Ajout panier</b> : sur ceux arrivés sur la page, combien mettent un article au panier (bas = offre ou prix).</span>
              <span>💳 <b>Checkout</b> : sur ceux qui ont un panier, combien lancent le paiement (bas = frais de port ou confiance).</span>
              <span>🛍️ <b>Achat/clic</b> : sur 100 qui atterrissent sur la page, combien achètent au final.</span>
              <span>🪝 <b>Hook 3 s</b> : % qui regarde au moins 3 s (vidéo) · 🎬 <b>Fin 100 %</b> : % qui va jusqu&apos;au bout, parmi ceux qui ont dépassé 3 s.</span>
              <span>🔁 <b>Fréquence</b> : combien de fois la même personne voit la pub (monte = audience qui sature). Cumulée sur plusieurs jours = approximative, Meta ne déduplique pas le reach entre les jours.</span>
              <span>Les moyennes affichées à côté de chaque titre sont pondérées (totaux ÷ totaux), pas la moyenne des jours — un jour à 5 € ne pèse pas autant qu&apos;un jour à 500 €.</span>
            </div>
          </details>
        </>
      )}
    </div>
  );
}

function CreaCard({
  row,
  open,
  onToggle,
}: {
  row: CreaRow;
  open: boolean;
  onToggle: () => void;
}) {
  const { play } = useSound();
  const roasColor =
    row.roas === null ? "text-ink" : row.roas >= 2 ? "text-phosphor" : row.roas >= 1 ? "text-amber" : "text-red";

  const shell =
    row.status === "cut"
      ? "border-red/50 bg-red/[0.05]"
      : row.status === "watch"
        ? "border-amber/50 bg-amber/[0.05]"
        : row.status === "winner"
          ? "border-phosphor/50 bg-phosphor/[0.05]"
          : "border-line bg-panel/40";

  return (
    <div className={`min-w-0 rounded-lg border p-3 ${shell}`}>
      <div className="mb-1.5 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-[12.5px] font-semibold text-ink">{row.adName}</div>
          <div className="truncate text-[10px] text-ink-faint">{row.campaignName}</div>
        </div>
        {row.status === "cut" && (
          <span className="flex-none whitespace-nowrap rounded border border-red/50 bg-red/10 px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wide text-red">
            🔪 À couper
          </span>
        )}
        {row.status === "watch" && (
          <span className="flex-none whitespace-nowrap rounded border border-amber/50 bg-amber/10 px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wide text-amber">
            👁️ À surveiller
          </span>
        )}
        {row.status === "winner" && (
          <span className="flex-none whitespace-nowrap rounded border border-phosphor/50 bg-phosphor/10 px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wide text-phosphor">
            🏆 Gagnante
          </span>
        )}
        {row.status === "testing" && (
          <span className="flex-none whitespace-nowrap rounded border border-line bg-panel/60 px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wide text-ink-faint">
            ⏳ En test
          </span>
        )}
      </div>
      {row.status === "winner" && (
        <p className="mb-1.5 text-[10px] font-semibold text-phosphor/80">→ à passer en scaling</p>
      )}
      {row.status === "watch" && (
        <p className="mb-1.5 text-[10px] text-amber/80">
          CPA au-dessus de la cible, mais elle vend et fait tourner le compte — décision à toi.
        </p>
      )}

      <div className="mb-2 flex items-baseline justify-between">
        <span className={`text-2xl font-bold tnum ${roasColor}`}>{formatRoas(row.roas)}</span>
        <span className="text-right text-[10.5px] tnum text-ink-dim">
          {formatEur0(row.caCents)} CA · {row.purchases} vente{row.purchases > 1 ? "s" : ""}
          <br />
          {formatEur0(row.spendCents)} spend
          <br />
          <span className="text-[9.5px] text-ink-faint">
            {formatEur0(row.lifetimeSpendCents)} depuis le début
          </span>
        </span>
      </div>

      {/* Mini-courbe CA — toujours visible, pas besoin de cliquer (25/07) */}
      <MiniChart
        title="💶 CA/j"
        data={row.series}
        dataKey="caCents"
        divideBy={100}
        format={formatEur0}
        average={row.series.length > 0 ? row.caCents / row.series.length : null}
      />

      {/* Ces 4 chiffres SONT les moyennes de la période sélectionnée
          (pondérées : totaux ÷ totaux, pas moyenne des jours). */}
      <div className="mt-2 grid grid-cols-4 gap-1 text-center text-[10px]">
        {(
          [
            ["CPA", row.cpaCents !== null ? formatEur0(row.cpaCents) : "—"],
            ["CTR", formatPct(row.ctrPct)],
            ["Fréq.", row.freq !== null ? row.freq.toLocaleString("fr-FR", { maximumFractionDigits: 2 }) : "—"],
            ["Achat/clic", formatPct(row.cvrLanding)],
          ] as [string, string][]
        ).map(([label, value]) => (
          <div key={label}>
            <div className="text-ink-faint">{label}</div>
            <div className="tnum text-ink">{value}</div>
          </div>
        ))}
      </div>

      <button
        onClick={() => {
          play("tab");
          onToggle();
        }}
        className="mt-2 w-full rounded border border-line-soft py-1 text-[10px] uppercase tracking-wide text-ink-faint hover:text-ink"
      >
        {open ? "▲ Replier" : "▼ Tout le détail (funnel + courbes)"}
      </button>

      {open && (
        <div className="mt-2 flex flex-col gap-2 border-t border-line-soft pt-2">
          {row.body && <p className="line-clamp-2 text-[10px] text-ink-faint">{row.body}</p>}
          {/* Entonnoir compact — les définitions sont dans la légende en bas
              de page, pas répétées sur chaque carte (demandé le 26/07). */}
          <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[10.5px] text-ink-dim">
            <Stat label="🛬 Atterrissage" value={formatPct(row.lpvRate)} />
            <Stat label="🛒 Ajout panier" value={formatPct(row.atcRate)} />
            <Stat label="💳 Checkout" value={formatPct(row.checkoutRate)} />
            <Stat label="🛍️ Achat/clic" value={formatPct(row.cvrLanding)} />
            {row.isVideo && (
              <>
                <Stat label="🪝 Hook 3 s" value={formatPct(row.hookRate)} />
                <Stat label="🎬 Fin 100 %" value={formatPct(row.hold100)} />
              </>
            )}
            {/* Rankings Meta : masqués tant qu'ils sont "unknown" (bruit). */}
            {row.qualityRanking && row.qualityRanking !== "unknown" && (
              <Stat label="⭐ Qualité" value={RANKING_LABEL[row.qualityRanking] ?? row.qualityRanking} />
            )}
            {row.conversionRanking && row.conversionRanking !== "unknown" && (
              <Stat
                label="🎯 Conversion"
                value={RANKING_LABEL[row.conversionRanking] ?? row.conversionRanking}
              />
            )}
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <MiniChart
              title="📣 Spend/j"
              data={row.series}
              dataKey="spendCents"
              divideBy={100}
              format={formatEur0}
              average={row.series.length > 0 ? row.spendCents / row.series.length : null}
            />
            <MiniChart title="⚖️ ROAS" data={row.series} dataKey="roas" format={formatRoas} average={row.roas} />
            <MiniChart
              title="🎯 CPA"
              data={row.series}
              dataKey="cpaCents"
              divideBy={100}
              format={formatEur0}
              average={row.cpaCents}
            />
            <MiniChart
              title="👀 CTR"
              data={row.series}
              dataKey="ctrPct"
              format={(v) => formatPct(v / 100)}
              average={row.ctrPct !== null ? row.ctrPct * 100 : null}
            />
            <MiniChart
              title="📢 CPM"
              data={row.series}
              dataKey="cpmCents"
              divideBy={100}
              format={formatEur0}
              average={row.cpmCents}
            />
            <MiniChart
              title="🔁 Fréquence"
              data={row.series}
              dataKey="freq"
              format={(v) => v.toLocaleString("fr-FR", { maximumFractionDigits: 2 })}
              average={row.freq}
            />
            <MiniChart
              title="🛍️ Achat/clic"
              data={row.series}
              dataKey="cvrLandingPct"
              format={(v) => formatPct(v / 100)}
              average={row.cvrLanding !== null ? row.cvrLanding * 100 : null}
            />
            <MiniChart
              title="🛒 Ajout panier"
              data={row.series}
              dataKey="atcPct"
              format={(v) => formatPct(v / 100)}
              average={row.atcRate !== null ? row.atcRate * 100 : null}
            />
            <MiniChart
              title="🛬 Atterrissage"
              data={row.series}
              dataKey="lpvPct"
              format={(v) => formatPct(v / 100)}
              average={row.lpvRate !== null ? row.lpvRate * 100 : null}
            />
            {row.isVideo && (
              <>
                <MiniChart
                  title="🪝 Hook 3 s"
                  data={row.series}
                  dataKey="hookPct"
                  format={(v) => formatPct(v / 100)}
                  average={row.hookRate !== null ? row.hookRate * 100 : null}
                />
                <MiniChart
                  title="🎬 Fin 100 %"
                  data={row.series}
                  dataKey="hold100Pct"
                  format={(v) => formatPct(v / 100)}
                  average={row.hold100 !== null ? row.hold100 * 100 : null}
                />
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const STATUS_BADGE: Record<CreaStatus, { emoji: string; label: string; cls: string }> = {
  cut: { emoji: "🔪", label: "À couper", cls: "text-red" },
  watch: { emoji: "👁️", label: "À surveiller", cls: "text-amber" },
  winner: { emoji: "🏆", label: "Gagnante", cls: "text-phosphor" },
  testing: { emoji: "⏳", label: "En test", cls: "text-ink-faint" },
};

/** Colonnes du tableau — toutes les métriques disponibles par créa. `key`
 * doit désigner un champ numérique de CreaRow pour que le tri fonctionne. */
type ColKey =
  | "spendCents"
  | "caCents"
  | "purchases"
  | "roas"
  | "cpaCents"
  | "cpmCents"
  | "impressions"
  | "clicks"
  | "ctrPct"
  | "freq"
  | "lpvRate"
  | "atcRate"
  | "checkoutRate"
  | "cvrLanding"
  | "hookRate"
  | "hold50"
  | "hold75"
  | "hold100"
  | "spendShare"
  | "lifetimeSpendCents"
  | "lifetimeCpaCents";

const eur = (v: number) => formatEur0(v);
const pct = (v: number) => formatPct(v);
const num2 = (v: number) => v.toLocaleString("fr-FR", { maximumFractionDigits: 2 });

const TABLE_COLS: { key: ColKey; label: string; format: (v: number) => string }[] = [
  { key: "spendCents", label: "Spend", format: eur },
  { key: "caCents", label: "CA", format: eur },
  { key: "purchases", label: "Ventes", format: formatInt },
  { key: "roas", label: "ROAS", format: formatRoas },
  { key: "cpaCents", label: "CPA", format: eur },
  { key: "cpmCents", label: "CPM", format: eur },
  { key: "impressions", label: "Impr.", format: formatInt },
  { key: "clicks", label: "Clics", format: formatInt },
  { key: "ctrPct", label: "CTR", format: pct },
  { key: "freq", label: "Fréq.", format: num2 },
  { key: "lpvRate", label: "Atterr.", format: pct },
  { key: "atcRate", label: "Panier", format: pct },
  { key: "checkoutRate", label: "Checkout", format: pct },
  { key: "cvrLanding", label: "Achat/clic", format: pct },
  { key: "hookRate", label: "Hook", format: pct },
  { key: "hold50", label: "Hold 50", format: pct },
  { key: "hold75", label: "Hold 75", format: pct },
  { key: "hold100", label: "Hold 100", format: pct },
  { key: "spendShare", label: "% budget", format: pct },
  // Cumul depuis le début — indépendant de la période affichée, sert à voir
  // d'un coup d'œil si une créa est jeune ou déjà bien rodée.
  { key: "lifetimeSpendCents", label: "Spend total", format: eur },
  { key: "lifetimeCpaCents", label: "CPA total", format: eur },
];

/** Tableau récapitulatif, une section par campagne. Tri propre au tableau :
 * clic sur un en-tête de colonne, appliqué à TOUTES les campagnes. */
function CampaignTables({
  rows,
  targetCpaCents,
}: {
  rows: CreaRow[];
  targetCpaCents: number | null;
}) {
  const { play } = useSound();
  const [sortCol, setSortCol] = useState<ColKey>("spendCents");
  const [dir, setDir] = useState<"asc" | "desc">("desc");

  const toggle = (key: ColKey) => {
    play("tab");
    if (key === sortCol) setDir((d) => (d === "desc" ? "asc" : "desc"));
    else {
      setSortCol(key);
      setDir("desc");
    }
  };

  const byCampaign = useMemo(() => {
    const map = new Map<string, CreaRow[]>();
    for (const r of rows) {
      const key = r.campaignName || "(campagne inconnue)";
      const arr = map.get(key) ?? [];
      arr.push(r);
      map.set(key, arr);
    }
    // Les valeurs nulles (métrique non calculable) finissent toujours en bas,
    // quel que soit le sens du tri — sinon elles squattent le haut en « asc ».
    for (const arr of map.values()) {
      arr.sort((a, b) => {
        const av = a[sortCol];
        const bv = b[sortCol];
        if (av === null && bv === null) return 0;
        if (av === null) return 1;
        if (bv === null) return -1;
        return dir === "desc" ? bv - av : av - bv;
      });
    }
    // Campagnes triées par spend décroissant (la plus grosse en premier).
    return [...map.entries()].sort(
      (a, b) =>
        b[1].reduce((s, r) => s + r.spendCents, 0) - a[1].reduce((s, r) => s + r.spendCents, 0)
    );
  }, [rows, sortCol, dir]);

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <div className="flex flex-wrap items-baseline gap-x-2">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-dim">
          📋 Tableau par campagne
        </span>
        <span className="text-[10px] text-ink-faint">
          ← fais glisser pour voir toutes les colonnes · clique un titre de colonne pour trier
        </span>
      </div>
      {byCampaign.map(([campaignName, list]) => {
        const spend = list.reduce((s, r) => s + r.spendCents, 0);
        const ca = list.reduce((s, r) => s + r.caCents, 0);
        const purchases = list.reduce((s, r) => s + r.purchases, 0);
        const roas = spend > 0 ? ca / spend : null;
        const cpa = purchases > 0 ? Math.round(spend / purchases) : null;
        return (
          <details key={campaignName} open className="min-w-0 rounded-lg border border-line bg-panel/40">
            <summary className="cursor-pointer list-none p-2.5">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                <span className="text-[11.5px] font-semibold text-ink">{campaignName}</span>
                <span className="text-[10px] tnum text-ink-dim">
                  {list.length} créa{list.length > 1 ? "s" : ""} · {formatEur0(spend)} spend ·{" "}
                  {formatEur0(ca)} CA · ROAS {formatRoas(roas)} · CPA{" "}
                  {cpa !== null ? formatEur0(cpa) : "—"}
                </span>
              </div>
            </summary>
            <div className="overflow-x-auto border-t border-line-soft">
              <table className="w-full border-collapse text-[10.5px]">
                <thead>
                  <tr className="border-b border-line-soft text-[9px] uppercase tracking-wide text-ink-faint">
                    {/* Colonne créa figée : on scrolle horizontalement sans
                        perdre de vue quelle ligne on lit. */}
                    <th className="sticky left-0 z-10 bg-terminal px-2 py-1.5 text-left font-semibold">
                      Créa
                    </th>
                    {TABLE_COLS.map((c) => (
                      <th key={c.key} className="whitespace-nowrap px-2 py-1.5 text-right font-semibold">
                        <button
                          onClick={() => toggle(c.key)}
                          className={`inline-flex items-center gap-0.5 hover:text-ink ${
                            sortCol === c.key ? "text-phosphor" : ""
                          }`}
                        >
                          {c.label}
                          {sortCol === c.key && <span>{dir === "desc" ? "▼" : "▲"}</span>}
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="tnum">
                  {list.map((r) => {
                    const badge = STATUS_BADGE[r.status];
                    const cpaOver =
                      targetCpaCents !== null && r.cpaCents !== null && r.cpaCents > targetCpaCents;
                    return (
                      <tr key={r.adId} className="border-b border-line-soft last:border-0">
                        <td className="sticky left-0 z-10 max-w-[220px] truncate bg-terminal px-2 py-1.5 text-left">
                          <span className={`mr-1 ${badge.cls}`} title={badge.label}>
                            {badge.emoji}
                          </span>
                          <span className="text-ink">{r.adName}</span>
                        </td>
                        {TABLE_COLS.map((c) => {
                          const v = r[c.key];
                          const highlight =
                            c.key === "roas" ? badge.cls : c.key === "cpaCents" && cpaOver ? "text-red" : "text-ink-dim";
                          return (
                            <td
                              key={c.key}
                              className={`whitespace-nowrap px-2 py-1.5 text-right ${highlight}`}
                            >
                              {v === null ? "—" : c.format(v)}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </details>
        );
      })}
    </div>
  );
}

/** Ligne « libellé … valeur » compacte de l'entonnoir. */
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <span className="flex items-baseline justify-between gap-1">
      <span className="truncate">{label}</span>
      <span className="tnum font-semibold text-ink">{value}</span>
    </span>
  );
}

function MiniChart({
  title,
  data,
  dataKey,
  divideBy = 1,
  format,
  average,
}: {
  title?: string;
  data: { label: string; [k: string]: unknown }[];
  dataKey: string;
  divideBy?: number;
  format: (v: number) => string;
  /** Moyenne de la période, DANS L'UNITÉ D'ORIGINE (celle que `format`
   * attend, avant divideBy). Volontairement passée par l'appelant plutôt
   * que calculée ici : pour ROAS/CPA/CTR/CPM la bonne moyenne est pondérée
   * (CA total ÷ spend total…), pas la moyenne des valeurs journalières —
   * un jour à 5 € de spend ne doit pas peser autant qu'un jour à 500 €. */
  average?: number | null;
}) {
  const chartData = data.map((d) => ({
    label: d.label,
    value: d[dataKey] === null || d[dataKey] === undefined ? null : (d[dataKey] as number) / divideBy,
    noDelivery: Boolean(d.noDelivery),
  }));
  const hasValues = chartData.some((d) => d.value !== null);
  const offDays = chartData.filter((d) => d.noDelivery).length;

  // Le libellé « moy. » est TOUJOURS affiché (avec — si indéfini) : son
  // absence donnait l'impression que la moyenne n'était pas implémentée.
  // Moyenne collée au titre (et pas à l'autre bout de la ligne) : demandé
  // le 26/07, on lit « ROAS moy. 1,34× » d'un seul coup d'œil.
  const header = title && (
    <div className="mb-1 flex items-baseline gap-1.5">
      <span className="text-[10px] font-semibold text-ink-dim">{title}</span>
      <span className="text-[10px] font-bold tnum text-ink">
        moy. {average !== null && average !== undefined ? format(average) : "—"}
      </span>
      {offDays > 0 && (
        <span className="text-[9px] text-amber" title="Jours sans diffusion : la courbe est coupée, pas en baisse">
          ◌ {offDays} j sans diff.
        </span>
      )}
    </div>
  );

  if (chartData.length < 2 || !hasValues) {
    return (
      <div>
        {header}
        <p className="flex h-20 items-center justify-center text-center text-[10px] text-ink-faint">
          {!hasValues ? "Aucune valeur sur la période (0 vente)" : "Pas assez de jours pour un graphe"}
        </p>
      </div>
    );
  }
  return (
    <div>
      {header}
      <div className="h-20 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <CartesianGrid stroke="#322c42" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: "#6c6482", fontSize: 8 }}
              tickLine={false}
              axisLine={{ stroke: "#322c42" }}
              interval="preserveStartEnd"
              minTickGap={16}
            />
            <YAxis tick={{ fill: "#6c6482", fontSize: 8 }} tickLine={false} axisLine={false} width={34} domain={["auto", "auto"]} />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const point = payload[0].payload as { noDelivery?: boolean };
                if (payload[0].value == null) {
                  return point.noDelivery ? (
                    <div className="rounded border border-line bg-terminal/95 px-2 py-1 text-[10px] shadow-lg">
                      <span className="text-ink-dim">{label} · </span>
                      <span className="font-bold text-amber">aucune diffusion</span>
                    </div>
                  ) : null;
                }
                return (
                  <div className="rounded border border-line bg-terminal/95 px-2 py-1 text-[10px] tnum shadow-lg">
                    <span className="text-ink-dim">{label} · </span>
                    <span className="font-bold text-ink">{format((payload[0].value as number) * divideBy)}</span>
                  </div>
                );
              }}
            />
            {average !== null && average !== undefined && (
              <ReferenceLine y={average / divideBy} stroke="#6c6482" strokeDasharray="3 3" />
            )}
            {/* connectNulls VOLONTAIREMENT absent : relier par-dessus un jour
                sans diffusion faisait lire « le CTR chute » là où la créa était
                simplement à l'arrêt (signalé 26/07). Les points isolés doivent
                rester visibles → dot activé. */}
            <Line
              dataKey="value"
              stroke="#33ff9c"
              strokeWidth={2}
              dot={{ r: 1.5, fill: "#33ff9c", strokeWidth: 0 }}
              activeDot={{ r: 3.5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
