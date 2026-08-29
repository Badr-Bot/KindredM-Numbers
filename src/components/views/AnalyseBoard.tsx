"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
import type { DayAgg, Thresholds } from "@/lib/data";
import type { AnalyticsData, BudgetChange, CreaProduct, ProductRoasThresholds } from "@/lib/analytics";
import { EVENT_TYPE_META, type EventType, type JournalEvent } from "@/lib/journal";
import {
  detectBudgetMarkers,
  detectCreaMarkers,
  detectScaleMarkers,
  type ChangeKind,
  type ChangeMarker,
} from "@/lib/changeMarkers";
import type { MarketTab } from "@/lib/markets";
import { formatDayShort, formatEur0, formatPct, formatRoas, formatRoasBare } from "@/lib/format";
import { MarketTabs } from "../shell/MarketTabs";
import { useSound } from "../sound/SoundProvider";

// ---------------------------------------------------------------------------
// Types & helpers
// ---------------------------------------------------------------------------

interface DayMetrics {
  day: string;
  label: string;
  caCents: number;
  orders: number;
  spendCents: number;
  impressions: number;
  clicks: number;
  cpaCents: number | null;
  cpmCents: number | null;
  cpcCents: number | null;
  ctrPct: number | null;
  cvrPct: number | null;
  aovCents: number | null;
  roas: number | null;
  /** fréquence = impressions / reach (fatigue/saturation) */
  freq: number | null;
}

const eur2 = (cents: number) =>
  (cents / 100).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
const pct2 = (v: number) => v.toLocaleString("fr-FR", { maximumFractionDigits: 2 }) + " %";

function pearson(xs: number[], ys: number[]): number | null {
  const n = xs.length;
  if (n < 7) return null;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let dx = 0;
  let dy = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - mx) * (ys[i] - my);
    dx += (xs[i] - mx) ** 2;
    dy += (ys[i] - my) ** 2;
  }
  if (dx === 0 || dy === 0) return null;
  return num / Math.sqrt(dx * dy);
}

interface MetricDef {
  key: keyof DayMetrics;
  label: string;
  emoji: string;
  color: string;
  /** true = une hausse est mauvaise (coûts) */
  upIsBad: boolean;
  needsMeta: boolean;
  format: (v: number) => string;
}

const METRICS: MetricDef[] = [
  { key: "cpaCents", label: "CPA (spend / cmd)", emoji: "🎯", color: "#ff7a29", upIsBad: true, needsMeta: false, format: eur2 },
  { key: "cpmCents", label: "CPM", emoji: "📢", color: "#2fd8ff", upIsBad: true, needsMeta: true, format: eur2 },
  { key: "cpcCents", label: "CPC", emoji: "🖱️", color: "#2fd8ff", upIsBad: true, needsMeta: true, format: eur2 },
  { key: "ctrPct", label: "CTR", emoji: "👀", color: "#ffc61a", upIsBad: false, needsMeta: true, format: pct2 },
  { key: "cvrPct", label: "CVR (cmd / clics)", emoji: "🛒", color: "#ffc61a", upIsBad: false, needsMeta: true, format: pct2 },
  { key: "aovCents", label: "Panier moyen", emoji: "💶", color: "#ffc61a", upIsBad: false, needsMeta: false, format: eur2 },
];

type Preset = "7" | "14" | "30" | "all" | "custom";

type CreaSortKey =
  | "adName"
  | "campaignName"
  | "product"
  | "creaType"
  | "ageDays"
  | "spendCents"
  | "purchases"
  | "cpaCents"
  | "cpcCents"
  | "cpmCents"
  | "ctrPct"
  | "hookRate"
  | "holdRate"
  | "lpvRate"
  | "atcRate"
  | "cvr"
  | "aovCents"
  | "roas";

function CreaTh({
  label,
  sortKey,
  active,
  dir,
  onSort,
  align = "right",
}: {
  label: string;
  sortKey: CreaSortKey;
  active: CreaSortKey;
  dir: "asc" | "desc";
  onSort: (key: CreaSortKey) => void;
  align?: "left" | "right";
}) {
  const isActive = active === sortKey;
  return (
    <th
      className={`cursor-pointer select-none px-2 py-1.5 font-semibold hover:text-ink ${
        align === "left" ? "text-left" : "text-right"
      } ${isActive ? "text-ink" : ""}`}
      onClick={() => onSort(sortKey)}
      title="Trier par cette colonne"
    >
      {label}
      {isActive && <span className="ml-1">{dir === "asc" ? "▲" : "▼"}</span>}
    </th>
  );
}

// ---------------------------------------------------------------------------

export function AnalyseBoard({
  dayData,
  analytics,
  historyStart,
  today,
  events,
  journalReady,
  thresholds,
  activeCampaignIds,
  productThresholds,
  budgetChanges,
}: {
  dayData: Record<MarketTab, DayAgg[]>;
  analytics: AnalyticsData;
  historyStart: string;
  today: string;
  events: JournalEvent[];
  journalReady: boolean;
  thresholds: Thresholds;
  activeCampaignIds: Set<string> | null;
  productThresholds: Record<CreaProduct, ProductRoasThresholds> | null;
  /** null = journal d'activité Meta indisponible → repli sur la déduction
   * par la dépense (dit explicitement dans la légende). */
  budgetChanges: BudgetChange[] | null;
}) {
  const { play } = useSound();
  const router = useRouter();
  const [tab, setTab] = useState<MarketTab>("GLOBAL");
  const [preset, setPreset] = useState<Preset>("14");
  const [customFrom, setCustomFrom] = useState(historyStart);
  const [customTo, setCustomTo] = useState(today);
  const [campaignFilter, setCampaignFilter] = useState<string>("ALL");

  const { from, to } = useMemo(() => {
    if (preset === "custom") return { from: customFrom, to: customTo };
    if (preset === "all") return { from: historyStart, to: today };
    const days = Number(preset);
    const d = new Date(`${today}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() - (days - 1));
    return { from: d.toISOString().slice(0, 10), to: today };
  }, [preset, customFrom, customTo, historyStart, today]);

  const hasMetaData = analytics.insights.length > 0;

  // Campagnes disponibles dans l'onglet marché actif — sert à isoler une
  // courbe par campagne au lieu d'une moyenne mélangée entre plusieurs
  // campagnes actives en même temps (constaté 25/07 : pas représentatif
  // dès que 2+ campagnes tournent dans le même marché).
  const campaignsForTab = useMemo(() => {
    const seen = new Map<string, string>();
    for (const r of analytics.insights) {
      if (tab !== "GLOBAL" && r.market !== tab) continue;
      if (r.campaignId && !seen.has(r.campaignId)) seen.set(r.campaignId, r.campaignName || r.campaignId);
    }
    return [...seen.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [analytics.insights, tab]);

  // Campagnes qui ont RÉELLEMENT tourné sur la période affichée, la plus
  // grosse dépense d'abord (29/08). Avant, la liste sortait de tout
  // l'historique et par ordre alphabétique : choisir une campagne arrêtée en
  // juin avec une fenêtre de 14 jours donnait six graphes vides sans un mot
  // d'explication — une bonne part du « ça ne donne pas les graphes » de Badr.
  const campaignsInWindow = useMemo(() => {
    const spend = new Map<string, { name: string; spendCents: number }>();
    for (const r of analytics.insights) {
      if (r.day < from || r.day > to) continue;
      if (tab !== "GLOBAL" && r.market !== tab) continue;
      if (!r.campaignId) continue;
      const cur = spend.get(r.campaignId) ?? { name: r.campaignName || r.campaignId, spendCents: 0 };
      cur.spendCents += r.spendCents;
      spend.set(r.campaignId, cur);
    }
    return [...spend.entries()].sort((a, b) => b[1].spendCents - a[1].spendCents);
  }, [analytics.insights, tab, from, to]);

  // Le filtre campagne doit rester valide quand on change d'onglet marché.
  const effectiveCampaignFilter = campaignsForTab.some(([id]) => id === campaignFilter) ? campaignFilter : "ALL";
  // Sélection valide pour ce marché mais muette sur la fenêtre choisie : on
  // le DIT (et on garde la sélection), au lieu de laisser six cadres vides.
  const selectedOutOfWindow =
    effectiveCampaignFilter !== "ALL" && !campaignsInWindow.some(([id]) => id === effectiveCampaignFilter);
  const selectedCampaignName =
    campaignsForTab.find(([id]) => id === effectiveCampaignFilter)?.[1] ?? "";

  // Série journalière fusionnée (agrégats Shopify + insights Meta) sur la fenêtre.
  // Spend/CPM/CPC/CTR/fréquence restent fiables par campagne (données Meta
  // pures). CA/commandes/CPA/CVR/ROAS/panier, eux, ne le sont PAS dès qu'une
  // campagne précise est isolée : Shopify ne sait pas quelle commande vient
  // de quelle campagne, seulement du marché entier — ils passent à null
  // plutôt que d'afficher un chiffre trompeur (voir bandeau sous les filtres).
  const series: DayMetrics[] = useMemo(() => {
    type InsAcc = {
      spendCents: number;
      impressions: number;
      clicks: number;
      reach: number;
      purchases: number;
      purchaseValueCents: number;
    };
    const empty = (): InsAcc => ({
      spendCents: 0,
      impressions: 0,
      clicks: 0,
      reach: 0,
      purchases: 0,
      purchaseValueCents: 0,
    });
    const insightsByDay = new Map<string, InsAcc>();
    for (const r of analytics.insights) {
      if (r.day < from || r.day > to) continue;
      if (tab !== "GLOBAL" && r.market !== tab) continue;
      if (effectiveCampaignFilter !== "ALL" && r.campaignId !== effectiveCampaignFilter) continue;
      const cur = insightsByDay.get(r.day) ?? empty();
      cur.spendCents += r.spendCents;
      cur.impressions += r.impressions;
      cur.clicks += r.clicks;
      cur.reach += r.reach;
      cur.purchases += r.purchases;
      cur.purchaseValueCents += r.purchaseValueCents;
      insightsByDay.set(r.day, cur);
    }
    const byCampaign = effectiveCampaignFilter !== "ALL";
    return dayData[tab]
      .filter((d) => d.day >= from && d.day <= to)
      .map((d) => {
        const ins = insightsByDay.get(d.day) ?? empty();
        // Spend de la campagne isolée si filtré, sinon spend Shopify/marché.
        const spendCents = byCampaign ? ins.spendCents : d.spendCents;
        // Campagne isolée : CPA / CVR / panier passent sur l'attribution
        // META (achats et valeur d'achat de la campagne). Avant le 29/08 ils
        // étaient simplement VIDES ici — Shopify ne relie pas une commande à
        // une campagne — ce qui laissait 3 graphes sur 6 blancs et rendait la
        // vue par campagne inutilisable (Badr : « ne donne pas les graphes
        // quand je sélectionne campagne par campagne »). Meta, lui, attribue :
        // c'est une mesure, pas une invention, mais ce n'est PAS le CA réel —
        // d'où l'étiquette « Meta » sur ces trois cartes et le bandeau.
        const metaOrders = ins.purchases;
        return {
          day: d.day,
          label: formatDayShort(d.day),
          caCents: byCampaign ? ins.purchaseValueCents : d.caCents,
          orders: byCampaign ? metaOrders : d.orders,
          spendCents,
          impressions: ins.impressions,
          clicks: ins.clicks,
          cpaCents: byCampaign
            ? metaOrders > 0 && spendCents > 0
              ? Math.round(spendCents / metaOrders)
              : null
            : d.orders > 0 && d.spendCents > 0
              ? Math.round(d.spendCents / d.orders)
              : null,
          cpmCents: ins.impressions > 0 ? Math.round((spendCents / ins.impressions) * 1000) : null,
          cpcCents: ins.clicks > 0 ? Math.round(spendCents / ins.clicks) : null,
          ctrPct: ins.impressions > 0 ? (ins.clicks / ins.impressions) * 100 : null,
          cvrPct: byCampaign
            ? ins.clicks > 0 && metaOrders > 0
              ? (metaOrders / ins.clicks) * 100
              : null
            : ins.clicks > 0
              ? (d.orders / ins.clicks) * 100
              : null,
          aovCents: byCampaign
            ? metaOrders > 0 && ins.purchaseValueCents > 0
              ? Math.round(ins.purchaseValueCents / metaOrders)
              : null
            : d.orders > 0
              ? Math.round(d.caCents / d.orders)
              : null,
          roas: byCampaign
            ? spendCents > 0 && ins.purchaseValueCents > 0
              ? ins.purchaseValueCents / spendCents
              : null
            : d.spendCents > 0
              ? d.caCents / d.spendCents
              : null,
          freq: ins.reach > 0 ? ins.impressions / ins.reach : null,
        };
      });
  }, [dayData, analytics.insights, tab, from, to, effectiveCampaignFilter]);

  // 🚨 Dérapages : moyenne 3 derniers jours pleins vs 7 précédents, par métrique.
  const alerts = useMemo(() => {
    const full = series.filter((d) => d.day < today);
    if (full.length < 6) return [];
    const out: { def: MetricDef; deltaPct: number; bad: boolean; recent: number }[] = [];
    for (const def of METRICS) {
      const vals = full.map((d) => d[def.key] as number | null);
      const recent = vals.slice(-3).filter((v): v is number => v !== null);
      const before = vals.slice(-10, -3).filter((v): v is number => v !== null);
      if (recent.length < 2 || before.length < 3) continue;
      const avgR = recent.reduce((a, b) => a + b, 0) / recent.length;
      const avgB = before.reduce((a, b) => a + b, 0) / before.length;
      if (avgB === 0) continue;
      const deltaPct = (avgR - avgB) / Math.abs(avgB);
      if (Math.abs(deltaPct) < 0.2) continue;
      out.push({ def, deltaPct, bad: def.upIsBad ? deltaPct > 0 : deltaPct < 0, recent: avgR });
    }
    return out.sort((a, b) => Math.abs(b.deltaPct) - Math.abs(a.deltaPct));
  }, [series, today]);

  // 🧠 Diagnostic : hypothèses en clair sur les dérapages, croisées avec le
  // journal (un événement ≤ 4 jours avant le mouvement = suspect n°1).
  const diagnosis = useMemo(() => {
    const full = series.filter((d) => d.day < today);
    if (full.length < 6) return [];
    const deltaOf = (key: keyof DayMetrics): number | null => {
      const vals = full.map((d) => d[key] as number | null);
      const recent = vals.slice(-3).filter((v): v is number => v !== null);
      const before = vals.slice(-10, -3).filter((v): v is number => v !== null);
      if (recent.length < 2 || before.length < 3) return null;
      const aR = recent.reduce((a, b) => a + b, 0) / recent.length;
      const aB = before.reduce((a, b) => a + b, 0) / before.length;
      return aB === 0 ? null : (aR - aB) / Math.abs(aB);
    };
    const d = {
      cpm: deltaOf("cpmCents"),
      cpc: deltaOf("cpcCents"),
      ctr: deltaOf("ctrPct"),
      cvr: deltaOf("cvrPct"),
      cpa: deltaOf("cpaCents"),
      freq: deltaOf("freq"),
      aov: deltaOf("aovCents"),
    };
    const pctTxt = (v: number) => `${v >= 0 ? "+" : "−"}${Math.round(Math.abs(v) * 100)} %`;
    const lines: { emoji: string; text: string }[] = [];

    // Événements récents du journal = suspects prioritaires
    const lastDay = full[full.length - 1]?.day ?? today;
    const cutoff = new Date(`${lastDay}T00:00:00Z`);
    cutoff.setUTCDate(cutoff.getUTCDate() - 6);
    const recentEvents = events.filter((e) => e.day >= cutoff.toISOString().slice(0, 10) && e.day <= lastDay);

    if (d.cpm !== null && d.cpm > 0.2) {
      if (d.freq !== null && d.freq > 0.15) {
        lines.push({
          emoji: "🔥",
          text: `CPM ${pctTxt(d.cpm)} ET fréquence ${pctTxt(d.freq)} → saturation d'audience probable : Meta repaie les mêmes personnes plus cher. Élargir l'audience ou pousser de nouvelles créas.`,
        });
      } else {
        lines.push({
          emoji: "💸",
          text: `CPM ${pctTxt(d.cpm)} avec fréquence stable → l'enchère coûte plus cher, pas l'usure : concurrence, re-learning après un changement (page, campagne, budget), ou période chargée.`,
        });
      }
    }
    if (d.ctr !== null && d.ctr < -0.15) {
      lines.push({
        emoji: "🎨",
        text: `CTR ${pctTxt(d.ctr)}${d.freq !== null && d.freq > 0.1 ? " avec fréquence en hausse" : ""} → fatigue créa probable : le hook n'arrête plus le scroll. Rotation de créas à prévoir.`,
      });
    }
    if (d.cvr !== null && d.cvr < -0.15) {
      lines.push({
        emoji: "🖥️",
        text: `CVR ${pctTxt(d.cvr)} alors que les clics arrivent → le problème est APRÈS le clic : landing, offre, prix, vitesse de page ou pays livré. Vérifie ce qui a changé côté site.`,
      });
    }
    if (d.cpa !== null && d.cpa > 0.2) {
      const causes: string[] = [];
      if (d.cpm !== null && d.cpm > 0.1) causes.push("CPM");
      if (d.ctr !== null && d.ctr < -0.1) causes.push("CTR");
      if (d.cvr !== null && d.cvr < -0.1) causes.push("CVR");
      lines.push({
        emoji: "🎯",
        text: `CPA ${pctTxt(d.cpa)} — moteur principal : ${causes.length ? causes.join(" + ") : "mix de petits mouvements"}.`,
      });
    }
    for (const e of recentEvents.slice(0, 2)) {
      lines.push({
        emoji: "📓",
        text: `Suspect n°1 à vérifier : « ${e.note} » (${formatDayShort(e.day)}) — colle avec le début du mouvement ?`,
      });
    }
    if (lines.length === 0 && (d.cpa !== null || d.cpm !== null)) {
      lines.push({ emoji: "✅", text: "Pas de dérapage majeur sur les 3 derniers jours — RAS." });
    }
    return lines;
  }, [series, today, events]);

  // 🔗 Corrélations (Pearson) sur la fenêtre, entre paires parlantes.
  const correlations = useMemo(() => {
    const pairs: {
      a: keyof DayMetrics;
      b: keyof DayMetrics;
      la: string;
      lb: string;
      reading: string;
    }[] = [
      { a: "cpmCents", b: "cpaCents", la: "CPM", lb: "CPA", reading: "l'enchère se paie plus cher → l'acquisition suit : dérapage côté audience/enchère, pas créa" },
      { a: "ctrPct", b: "cpaCents", la: "CTR", lb: "CPA", reading: "quand la créa accroche moins, le CPA monte : dérapage côté créa" },
      { a: "ctrPct", b: "cvrPct", la: "CTR", lb: "CVR", reading: "les clics attirés convertissent aussi : l'angle est aligné avec l'offre" },
      { a: "spendCents", b: "caCents", la: "Spend", lb: "CA", reading: "le CA suit le budget : il reste de la marge pour scaler" },
      { a: "spendCents", b: "cpaCents", la: "Spend", lb: "CPA", reading: "pousser le budget renchérit l'acquisition : saturation de l'audience" },
    ];
    const out: { la: string; lb: string; r: number; reading: string }[] = [];
    for (const p of pairs) {
      const xs: number[] = [];
      const ys: number[] = [];
      for (const d of series) {
        const x = d[p.a] as number | null;
        const y = d[p.b] as number | null;
        if (x !== null && y !== null) {
          xs.push(x);
          ys.push(y);
        }
      }
      const r = pearson(xs, ys);
      if (r !== null && Math.abs(r) >= 0.5) out.push({ la: p.la, lb: p.lb, r, reading: p.reading });
    }
    return out.sort((a, b) => Math.abs(b.r) - Math.abs(a.r));
  }, [series]);

  // 🎨 Créas gagnantes actives (données niveau annonce).
  // Révisé le 04/08 (Badr) : l'ancien seuil fixe "ROAS ≥ 2" (19/07) était
  // déconnecté de la vraie rentabilité — une créa à 1,66× est déjà
  // profitable (BE ≈ 1,62×) mais ne recevait jamais le 🏆, d'où un hit rate
  // ridicule (1 % alors que la plupart des créas listées gagnent de
  // l'argent). Deux changements demandés par Badr :
  //   1. Le spend n'est plus un critère (l'ancien seuil "≥ 1 000 € de
  //      spend" est supprimé) — seul le ROAS compte, quelle que soit la
  //      taille de l'échantillon.
  //   2. Une créa dont la CAMPAGNE MÈRE n'est plus active (coupée/en pause)
  //      ne peut jamais être gagnante, même avec un excellent ROAS
  //      historique — sinon on pousserait à rallumer une créa dont le
  //      contexte (budget, angle, offre) a changé depuis. Statut vérifié en
  //      direct auprès de Meta (activeCampaignIds) : si indisponible
  //      (token HS, mode démo), on ne devine pas — liste vide.
  // La liste ne montre plus que les gagnantes (plus un top/flop général) :
  // gagnante = ROAS ≥ cible 15 % (seuil dynamique 14 j glissants,
  // thresholds.target, identique à celui utilisé partout ailleurs dans le
  // dash) ET campagne mère active.
  const creas = useMemo(() => {
    // Seuils PAR PRODUIT (Badr, 04/08) : les créas Lancaster (Gilet) étaient
    // jugées contre la cible blended du compte, dominée par le polo (~90 % du
    // CA) — or le gilet a une marge plus haute, donc un BE et une cible PLUS
    // BAS : aucune créa Gilet ne qualifiait à tort. Chaque créa est maintenant
    // comparée aux seuils de SON produit (campagne LANCASTER → Gilet, sinon
    // Polo), avec repli sur les seuils GLOBAL si le calcul produit manque.
    const thresholdsFor = (product: CreaProduct) => {
      const p = productThresholds?.[product];
      return {
        breakEven: p?.breakEven ?? thresholds.breakEven,
        target: p?.target ?? thresholds.target,
      };
    };
    // L'âge se calcule sur TOUT l'historique (première diffusion réelle),
    // indépendamment de la période sélectionnée en haut.
    const firstDayByAd = new Map<string, string>();
    // Type (vidéo/image) déterminé sur TOUT l'historique : une vidéo sans vue
    // 3 s sur une fenêtre courte ne doit pas être reclassée « image ».
    const videoAdIds = new Set<string>();
    for (const r of analytics.adsDaily) {
      const cur = firstDayByAd.get(r.adId);
      if (!cur || r.day < cur) firstDayByAd.set(r.adId, r.day);
      if (r.video3s > 0) videoAdIds.add(r.adId);
    }
    // Le reste des métriques suit le SÉLECTEUR DE PÉRIODE en haut de l'onglet
    // (Badr, 04/08) : agrégation locale des lignes journalières sur [from, to],
    // exactement comme les graphes au-dessus.
    interface AdAgg {
      adId: string;
      adName: string;
      campaignId: string;
      campaignName: string;
      spendCents: number;
      impressions: number;
      clicks: number;
      purchases: number;
      purchaseValueCents: number;
      video3s: number;
      video100: number;
      linkClicks: number;
      landingPageViews: number;
      addToCart: number;
    }
    const byAd = new Map<string, AdAgg>();
    for (const r of analytics.adsDaily) {
      if (r.day < from || r.day > to) continue;
      const cur = byAd.get(r.adId) ?? {
        adId: r.adId,
        adName: r.adName,
        campaignId: r.campaignId,
        campaignName: r.campaignName,
        spendCents: 0,
        impressions: 0,
        clicks: 0,
        purchases: 0,
        purchaseValueCents: 0,
        video3s: 0,
        video100: 0,
        linkClicks: 0,
        landingPageViews: 0,
        addToCart: 0,
      };
      cur.spendCents += r.spendCents;
      cur.impressions += r.impressions;
      cur.clicks += r.clicks;
      cur.purchases += r.purchases;
      cur.purchaseValueCents += r.purchaseValueCents;
      cur.video3s += r.video3s;
      cur.video100 += r.video100;
      cur.linkClicks += r.linkClicks;
      cur.landingPageViews += r.landingPageViews;
      cur.addToCart += r.addToCart;
      byAd.set(r.adId, cur);
    }
    const withMetrics = [...byAd.values()].map((a) => {
      const isVideo = videoAdIds.has(a.adId);
      const product: CreaProduct = a.campaignName.toUpperCase().includes("LANCASTER") ? "GILET" : "POLO";
      const t = thresholdsFor(product);
      // Âge = jours depuis la première diffusion HISTORIQUE (aujourd'hui inclus).
      const firstDay = firstDayByAd.get(a.adId) ?? today;
      const ageDays =
        Math.round((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${firstDay}T00:00:00Z`)) / 86_400_000) + 1;
      return {
        ...a,
        product,
        creaType: isVideo ? "VIDEO" : "IMAGE",
        ageDays,
        breakEven: t.breakEven,
        target: t.target,
        roas: a.spendCents > 0 && a.purchaseValueCents > 0 ? a.purchaseValueCents / a.spendCents : null,
        cpaCents: a.purchases > 0 ? Math.round(a.spendCents / a.purchases) : null,
        cpcCents: a.clicks > 0 ? Math.round(a.spendCents / a.clicks) : null,
        cpmCents: a.impressions > 0 ? Math.round((a.spendCents / a.impressions) * 1000) : null,
        ctrPct: a.impressions > 0 ? a.clicks / a.impressions : null,
        hookRate: isVideo && a.impressions > 0 ? a.video3s / a.impressions : null,
        holdRate: isVideo && a.video3s > 0 ? a.video100 / a.video3s : null,
        lpvRate: a.linkClicks > 0 ? a.landingPageViews / a.linkClicks : null,
        atcRate: a.landingPageViews > 0 ? a.addToCart / a.landingPageViews : null,
        cvr: a.landingPageViews > 0 ? a.purchases / a.landingPageViews : null,
        aovCents: a.purchases > 0 ? Math.round(a.purchaseValueCents / a.purchases) : null,
      };
    });
    // Plancher de spend (Badr, 04/08) : sous 60 € sur la période, une seule
    // vente chanceuse suffit à afficher un ROAS délirant — pas un signal.
    const WINNER_MIN_SPEND_CENTS = 6000;
    const isWinner = (a: (typeof withMetrics)[number]) =>
      a.spendCents >= WINNER_MIN_SPEND_CENTS &&
      a.target !== null &&
      a.roas !== null &&
      a.roas >= a.target &&
      activeCampaignIds !== null &&
      activeCampaignIds.has(a.campaignId);
    const winners = withMetrics.filter(isWinner);
    return {
      // Toutes les créas AYANT DIFFUSÉ sur la période sélectionnée — les
      // créas « actives » dans Ads Manager mais sans diffusion n'ont pas de
      // données chez Meta, elles ne peuvent apparaître nulle part.
      seen: byAd.size,
      winners: winners.length,
      hitRate: withMetrics.length > 0 ? winners.length / withMetrics.length : null,
      rows: winners,
      statusUnavailable: activeCampaignIds === null,
      giletThresholds: productThresholds?.GILET ?? null,
      poloThresholds: productThresholds?.POLO ?? null,
      globalTarget: thresholds.target,
    };
  }, [analytics.adsDaily, thresholds, activeCampaignIds, productThresholds, from, to, today]);

  // Tri de la table gagnantes — cliquable par colonne (Badr, 04/08).
  const [creaSortKey, setCreaSortKey] = useState<CreaSortKey>("roas");
  const [creaSortDir, setCreaSortDir] = useState<"asc" | "desc">("desc");
  const sortedCreaRows = useMemo(() => {
    const dir = creaSortDir === "asc" ? 1 : -1;
    return [...creas.rows].sort((a, b) => {
      const va = a[creaSortKey];
      const vb = b[creaSortKey];
      if (va === null && vb === null) return 0;
      if (va === null) return 1; // null toujours en dernier, peu importe le sens
      if (vb === null) return -1;
      if (typeof va === "string" || typeof vb === "string") {
        return dir * String(va).localeCompare(String(vb));
      }
      return dir * ((va as number) - (vb as number));
    });
  }, [creas.rows, creaSortKey, creaSortDir]);
  const toggleCreaSort = (key: CreaSortKey) => {
    if (key === creaSortKey) {
      setCreaSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setCreaSortKey(key);
      setCreaSortDir("desc");
    }
  };

  // 📓 Marqueurs d'événements sur les courbes (fenêtre affichée).
  // UNIQUEMENT en vue « toutes campagnes » : un événement du journal ne porte
  // pas d'identifiant de campagne, le tracer sur la courbe d'UNE campagne
  // isolée ferait croire qu'il la concerne (ex. « Budget X poussé » affiché
  // sur la campagne Y).
  const eventMarkers = useMemo(
    () =>
      effectiveCampaignFilter !== "ALL"
        ? []
        : events
            .filter((e) => e.day >= from && e.day <= to)
            .map((e) => ({ label: formatDayShort(e.day), emoji: EVENT_TYPE_META[e.type].emoji })),
    [events, from, to, effectiveCampaignFilter]
  );

  // 📍 Repères de changement (Badr 29/08) : scale ↑ vert, descale ↓ rouge,
  // nouvelles créas violet — pour lire d'un coup d'œil ce qu'un geste a
  // provoqué sur chaque métrique.
  //
  // Calculés sur TOUT l'historique chargé puis filtrés sur la fenêtre : sinon
  // le 1er jour affiché produirait un faux « scale » (comparé à rien) et
  // toutes les créas déjà en route sembleraient ajoutées ce jour-là.
  const changeMarkers = useMemo(() => {
    const tabCampaignIds = new Set(campaignsForTab.map(([id]) => id));
    const inScope = (campaignId: string) =>
      effectiveCampaignFilter !== "ALL"
        ? campaignId === effectiveCampaignFilter
        : tab === "GLOBAL" || tabCampaignIds.has(campaignId);

    // Scale / descale : le journal d'activité Meta d'abord (le geste exact,
    // ancien → nouveau budget), la dépense seulement s'il est indisponible.
    // JAMAIS les deux : un vrai changement de budget produit aussi un saut de
    // dépense le lendemain, on dessinerait deux traits pour un seul geste.
    let scale: ChangeMarker[];
    if (budgetChanges) {
      scale = detectBudgetMarkers(budgetChanges.filter((c) => inScope(c.campaignId)));
    } else {
      const spendByDay = new Map<string, number>();
      for (const r of analytics.insights) {
        if (tab !== "GLOBAL" && r.market !== tab) continue;
        if (effectiveCampaignFilter !== "ALL" && r.campaignId !== effectiveCampaignFilter) continue;
        spendByDay.set(r.day, (spendByDay.get(r.day) ?? 0) + r.spendCents);
      }
      scale = detectScaleMarkers(spendByDay, today);
    }

    // meta_ad_insights ne porte pas de marché : on passe par les campagnes de
    // l'onglet (déduites des insights, qui ont le marché).
    const adRows = analytics.adsDaily
      .filter((a) => inScope(a.campaignId))
      .map((a) => ({ day: a.day, adId: a.adId, adName: a.adName }));

    return [...scale, ...detectCreaMarkers(adRows)]
      .filter((m) => m.day >= from && m.day <= to)
      .map((m) => ({ ...m, label: formatDayShort(m.day) }));
  }, [
    analytics.insights,
    analytics.adsDaily,
    budgetChanges,
    campaignsForTab,
    tab,
    effectiveCampaignFilter,
    from,
    to,
    today,
  ]);

  // ⚖️ Verdict avant/après (3 j de chaque côté) par événement, sur le CA et
  // le CPA du marché affiché — calculé sur tout l'historique, pas la fenêtre.
  const eventVerdicts = useMemo(() => {
    const byDay = new Map(dayData[tab].map((d) => [d.day, d]));
    const out = new Map<number, string>();
    for (const e of events) {
      const pick = (offsets: number[]) => {
        const ca: number[] = [];
        const cpa: number[] = [];
        for (const off of offsets) {
          const d = new Date(`${e.day}T00:00:00Z`);
          d.setUTCDate(d.getUTCDate() + off);
          const row = byDay.get(d.toISOString().slice(0, 10));
          if (row && row.day < today && (row.caCents > 0 || row.spendCents > 0)) {
            ca.push(row.caCents);
            if (row.orders > 0 && row.spendCents > 0) cpa.push(row.spendCents / row.orders);
          }
        }
        return { ca, cpa };
      };
      const before = pick([-3, -2, -1]);
      const after = pick([0, 1, 2]);
      if (before.ca.length < 2 || after.ca.length < 2) continue;
      const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
      const dCa = (avg(after.ca) - avg(before.ca)) / avg(before.ca);
      let text = `CA ${dCa >= 0 ? "+" : "−"}${Math.round(Math.abs(dCa) * 100)} %`;
      if (before.cpa.length >= 2 && after.cpa.length >= 2) {
        const dCpa = (avg(after.cpa) - avg(before.cpa)) / avg(before.cpa);
        text += ` · CPA ${dCpa >= 0 ? "+" : "−"}${Math.round(Math.abs(dCpa) * 100)} %`;
      }
      out.set(e.id, text + " (3 j av/ap)");
    }
    return out;
  }, [events, dayData, tab, today]);

  // 📅 Heatmap jour-de-semaine (moyennes sur la fenêtre, jours pleins)
  const weekHeatmap = useMemo(() => {
    const WEEKDAYS = ["lun", "mar", "mer", "jeu", "ven", "sam", "dim"];
    const buckets: { ca: number[]; orders: number[]; aov: number[] }[] = WEEKDAYS.map(() => ({
      ca: [],
      orders: [],
      aov: [],
    }));
    for (const d of series) {
      if (d.day >= today) continue;
      const wd = (new Date(`${d.day}T00:00:00Z`).getUTCDay() + 6) % 7; // lun=0
      buckets[wd].ca.push(d.caCents);
      buckets[wd].orders.push(d.orders);
      if (d.aovCents !== null) buckets[wd].aov.push(d.aovCents);
    }
    const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
    const rows = [
      { label: "CA moyen", fmt: (v: number) => formatEur0(Math.round(v)), values: buckets.map((b) => avg(b.ca)) },
      { label: "Commandes", fmt: (v: number) => String(Math.round(v)), values: buckets.map((b) => avg(b.orders)) },
      { label: "Panier", fmt: eur2, values: buckets.map((b) => avg(b.aov)) },
    ];
    return { WEEKDAYS, rows, counts: buckets.map((b) => b.ca.length) };
  }, [series, today]);

  const submitEvent = async (day: string, type: EventType, note: string) => {
    const res = await fetch("/api/journal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ day, type, note }),
    });
    const json = await res.json();
    if (json.ok) {
      play("cash");
      router.refresh();
      return null;
    }
    play("error");
    return (json.reason as string) ?? "Échec.";
  };

  const deleteEvent = async (id: number) => {
    play("tick");
    await fetch("/api/journal", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    router.refresh();
  };

  const presetBtn = (p: Preset, label: string) => (
    <button
      key={p}
      onClick={() => {
        play("tab");
        setPreset(p);
      }}
      className={`rounded-md border px-3 py-1 text-xs font-semibold ${
        preset === p ? "border-phosphor/60 bg-phosphor/10 text-phosphor" : "border-line text-ink-dim"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="flex flex-col gap-3">
      {/* Filtres : période d'abord, puis marché — ils scoping tout le dessous */}
      <div className="flex flex-wrap items-center gap-1.5">
        {presetBtn("7", "7 j")}
        {presetBtn("14", "14 j")}
        {presetBtn("30", "30 j")}
        {presetBtn("all", "Tout")}
        {presetBtn("custom", "Dates…")}
        {preset === "custom" && (
          <span className="flex items-center gap-1.5 text-[11px] text-ink-dim">
            <input
              type="date"
              value={customFrom}
              min={historyStart}
              max={today}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="rounded border border-line bg-terminal px-1.5 py-1 text-[11px] text-ink"
            />
            →
            <input
              type="date"
              value={customTo}
              min={historyStart}
              max={today}
              onChange={(e) => setCustomTo(e.target.value)}
              className="rounded border border-line bg-terminal px-1.5 py-1 text-[11px] text-ink"
            />
          </span>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <MarketTabs active={tab} onChange={setTab} />
        {campaignsForTab.length > 1 && (
          <select
            value={effectiveCampaignFilter}
            onChange={(e) => {
              play("tab");
              setCampaignFilter(e.target.value);
            }}
            className="rounded border border-line bg-terminal px-2 py-1 text-[11px] text-ink"
          >
            <option value="ALL">Toutes les campagnes (moyenne)</option>
            {campaignsInWindow.map(([id, c]) => (
              <option key={id} value={id}>
                {c.name} · {formatEur0(c.spendCents)}
              </option>
            ))}
            {/* La sélection courante reste listée même sans dépense sur la
                fenêtre, sinon le menu afficherait autre chose que ce qui est
                réellement filtré. */}
            {selectedOutOfWindow && (
              <option value={effectiveCampaignFilter}>{selectedCampaignName} · hors période</option>
            )}
          </select>
        )}
      </div>
      {selectedOutOfWindow && (
        <p className="rounded-lg border border-amber/40 bg-amber/[0.05] p-2.5 text-[10.5px] text-amber">
          ⚠️ « {selectedCampaignName} » n&apos;a dépensé <b>aucun euro</b> entre le{" "}
          {formatDayShort(from)} et le {formatDayShort(to)} — les courbes sont donc vides.
          Élargis la période (30 j ou « tout ») pour la voir tourner.
        </p>
      )}
      {effectiveCampaignFilter !== "ALL" && (
        <p className="rounded-lg border border-line bg-panel/40 p-2.5 text-[10.5px] text-ink-dim">
          🎯 Vue isolée sur une campagne. CPM/CPC/CTR viennent des données Meta pures.{" "}
          <b>CPA, CVR et panier moyen sont marqués « Meta »</b> : ils sont calculés sur les achats
          que <b>Meta attribue</b> à cette campagne, pas sur le CA Shopify — Shopify ne sait pas de
          quelle campagne vient une commande. À lire comme une tendance de campagne, jamais comme
          le chiffre d&apos;affaires réel (qui reste celui des onglets Aujourd&apos;hui et Mois).
        </p>
      )}

      {analytics.missingTables && (
        <p className="rounded-lg border border-amber/40 bg-amber/[0.05] p-3 text-[11.5px] text-amber">
          ⚠️ Migration <b>0005_meta_insights.sql</b> pas encore appliquée dans Supabase (SQL Editor →
          Run) — les métriques Meta ne peuvent pas être stockées d&apos;ici là.
        </p>
      )}
      {!analytics.missingTables && !hasMetaData && (
        <p className="rounded-lg border border-line bg-panel/40 p-3 text-[11.5px] text-ink-dim">
          🔒 CPM, CPC, CTR, CVR et créas se rempliront automatiquement dès que le token Meta
          (app avec Marketing API) fonctionnera — aucune action ensuite. CPA et panier moyen
          sont déjà calculés depuis tes données réelles.
        </p>
      )}

      {/* 🚨 Dérapages */}
      {alerts.length > 0 && (
        <section className="rounded-lg border border-line bg-panel/40 p-3.5">
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-dim">
            🚨 Dérapages · 3 derniers jours vs 7 précédents
          </div>
          <ul className="flex flex-col gap-1.5">
            {alerts.map((a) => (
              <li key={a.def.key} className="flex items-center justify-between text-[11.5px]">
                <span>
                  <span aria-hidden>{a.def.emoji}</span> {a.def.label}
                  <span className="ml-2 text-ink-faint tnum">→ {a.def.format(a.recent)}</span>
                </span>
                <span className={`font-bold tnum ${a.bad ? "text-red" : "text-phosphor"}`}>
                  {a.deltaPct >= 0 ? "▲" : "▼"} {Math.round(Math.abs(a.deltaPct) * 100)} %
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 🧠 Diagnostic : les hypothèses en français, croisées avec le journal */}
      {diagnosis.length > 0 && (
        <section className="rounded-lg border border-phosphor/25 bg-phosphor/[0.03] p-3.5">
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-dim">
            🧠 Diagnostic · pourquoi ça bouge (hypothèses auto)
          </div>
          <ul className="flex flex-col gap-1.5">
            {diagnosis.map((l, i) => (
              <li key={i} className="text-[11.5px] leading-snug lg:text-[12.5px]">
                <span aria-hidden className="mr-1">{l.emoji}</span>
                {l.text}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Courbes : petits multiples, une métrique par graphe (jamais 2 axes).
          Traits verticaux = ce qui a été CHANGÉ ce jour-là, pour lire l'effet
          juste après (demande Badr 29/08). */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-1 text-[10.5px] text-ink-dim">
        <span className="font-semibold uppercase tracking-wide">Repères</span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-0 w-5 border-t-2 border-dashed" style={{ borderColor: CHANGE_COLOR.scale_up }} />
          scale ↑
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-0 w-5 border-t-2 border-dashed" style={{ borderColor: CHANGE_COLOR.scale_down }} />
          descale ↓
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-0 w-5 border-t-2 border-dashed" style={{ borderColor: CHANGE_COLOR.crea }} />
          nouvelles créas
        </span>
        {eventMarkers.length > 0 && (
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-0 w-5 border-t-2 border-dashed border-ink-faint" />
            journal
          </span>
        )}
        <span className="text-ink-faint">
          {budgetChanges
            ? "— scale/descale = les vrais changements de budget (journal d'activité Meta). Survole un point pour lire l'ancien et le nouveau montant."
            : "— journal d'activité Meta indisponible : le scale est ici DÉDUIT d'un saut de dépense ≥ 20 % d'un jour à l'autre, à prendre comme une approximation."}
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {METRICS.map((def) => (
          <MetricChart
            key={def.key}
            def={def}
            series={series}
            locked={def.needsMeta && !hasMetaData}
            metaAttributed={
              effectiveCampaignFilter !== "ALL" &&
              (def.key === "cpaCents" || def.key === "cvrPct" || def.key === "aovCents")
            }
            markers={eventMarkers}
            changes={changeMarkers}
          />
        ))}
      </div>

      {/* 📅 Heatmap jour-de-semaine */}
      <section className="rounded-lg border border-line bg-panel/40 p-3.5">
        <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-ink-dim">
          📅 Quel jour de la semaine performe le mieux ?
        </div>
        <p className="mb-2 text-[10.5px] text-ink-faint">
          Moyenne de <b>tous</b> les lundis, mardis… entre le {formatDayShort(from)} et le{" "}
          {formatDayShort(to)} (le nombre entre parenthèses = combien de jours comptés). Ex. : si la
          case « dim » est la plus dorée, tes dimanches rapportent plus — pousse le budget ce jour-là.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[460px] border-collapse text-[11px] tnum lg:text-xs">
            <thead>
              <tr className="text-[9.5px] uppercase tracking-wide text-ink-dim">
                <th className="px-2 py-1 text-left font-semibold"></th>
                {weekHeatmap.WEEKDAYS.map((d, i) => (
                  <th key={d} className="px-2 py-1 text-center font-semibold">
                    {d} <span className="font-normal text-ink-faint">({weekHeatmap.counts[i]})</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {weekHeatmap.rows.map((row) => {
                const max = Math.max(...row.values.map((v) => v ?? 0), 1);
                return (
                  <tr key={row.label}>
                    <td className="whitespace-nowrap px-2 py-1 text-left font-medium text-ink-dim">
                      {row.label}
                    </td>
                    {row.values.map((v, i) => (
                      <td key={i} className="px-1 py-0.5 text-center">
                        <div
                          className="rounded px-1 py-1.5"
                          style={{ background: `rgba(255, 198, 26, ${v === null ? 0 : 0.06 + (v / max) * 0.3})` }}
                        >
                          {v === null ? "—" : row.fmt(v)}
                        </div>
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* 🔗 Corrélations */}
      <section className="rounded-lg border border-line bg-panel/40 p-3.5">
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-dim">
          🔗 Corrélations détectées sur la période
        </div>
        {correlations.length === 0 ? (
          <p className="text-[11.5px] text-ink-faint">
            Rien de significatif sur cette fenêtre (il faut ≥ 7 jours de données communes et une
            corrélation marquée). Élargis la période, ou attends les métriques Meta.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {correlations.map((c) => (
              <li key={`${c.la}-${c.lb}`} className="text-[11.5px]">
                <span className="font-semibold">
                  {c.la} ↔ {c.lb}
                </span>
                <span className={`ml-2 tnum font-bold ${Math.abs(c.r) >= 0.7 ? "text-phosphor" : "text-amber"}`}>
                  r = {c.r.toFixed(2)}
                </span>
                <span className="ml-2 text-ink-dim">— {c.reading}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 📓 Journal de bord */}
      <JournalSection
        events={events}
        verdicts={eventVerdicts}
        ready={journalReady}
        today={today}
        historyStart={historyStart}
        onSubmit={submitEvent}
        onDelete={deleteEvent}
      />

      {/* 🎨 Créas gagnantes actives */}
      <section className="rounded-lg border border-line bg-panel/40 p-3.5">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-dim">
            🏆 Créas gagnantes · période sélectionnée · campagne active
          </span>
          {creas.hitRate !== null && !creas.statusUnavailable && (
            <span className="rounded border border-phosphor/40 bg-phosphor/10 px-2 py-0.5 text-[11px] font-bold text-phosphor tnum">
              {creas.winners}/{creas.seen}
            </span>
          )}
        </div>
        {creas.statusUnavailable ? (
          <p className="text-[11.5px] text-amber">
            ⚠️ Statut des campagnes indisponible en direct (token Meta ou mode démo) — impossible
            de confirmer quelle campagne mère est active, donc pas de créa gagnante affichée par
            prudence plutôt que de deviner.
          </p>
        ) : creas.seen === 0 ? (
          <p className="text-[11.5px] text-ink-faint">
            🔒 En attente des données niveau annonce (token Meta).
          </p>
        ) : creas.rows.length === 0 ? (
          <p className="text-[11.5px] text-ink-faint">
            Aucune créa au-dessus de sa cible produit
            {creas.poloThresholds?.target != null && ` (Polo ${formatRoasBare(creas.poloThresholds.target)}`}
            {creas.giletThresholds?.target != null && ` · Gilet ${formatRoasBare(creas.giletThresholds.target)}`}
            {creas.poloThresholds?.target != null && ")"} sur une campagne active en ce moment.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1280px] border-collapse text-[11px] lg:text-xs">
              <thead>
                <tr className="border-b border-line text-[9.5px] uppercase tracking-wide text-ink-dim">
                  <CreaTh label="Créa" sortKey="adName" active={creaSortKey} dir={creaSortDir} onSort={toggleCreaSort} align="left" />
                  <CreaTh label="Campagne mère" sortKey="campaignName" active={creaSortKey} dir={creaSortDir} onSort={toggleCreaSort} align="left" />
                  <CreaTh label="Produit" sortKey="product" active={creaSortKey} dir={creaSortDir} onSort={toggleCreaSort} align="left" />
                  <CreaTh label="Type" sortKey="creaType" active={creaSortKey} dir={creaSortDir} onSort={toggleCreaSort} align="left" />
                  <CreaTh label="Âge" sortKey="ageDays" active={creaSortKey} dir={creaSortDir} onSort={toggleCreaSort} />
                  <CreaTh label="Spend" sortKey="spendCents" active={creaSortKey} dir={creaSortDir} onSort={toggleCreaSort} />
                  <CreaTh label="Achats" sortKey="purchases" active={creaSortKey} dir={creaSortDir} onSort={toggleCreaSort} />
                  <CreaTh label="CPA" sortKey="cpaCents" active={creaSortKey} dir={creaSortDir} onSort={toggleCreaSort} />
                  <CreaTh label="CPC" sortKey="cpcCents" active={creaSortKey} dir={creaSortDir} onSort={toggleCreaSort} />
                  <CreaTh label="CPM" sortKey="cpmCents" active={creaSortKey} dir={creaSortDir} onSort={toggleCreaSort} />
                  <CreaTh label="CTR" sortKey="ctrPct" active={creaSortKey} dir={creaSortDir} onSort={toggleCreaSort} />
                  <CreaTh label="Hook" sortKey="hookRate" active={creaSortKey} dir={creaSortDir} onSort={toggleCreaSort} />
                  <CreaTh label="Hold" sortKey="holdRate" active={creaSortKey} dir={creaSortDir} onSort={toggleCreaSort} />
                  <CreaTh label="Atterrissage" sortKey="lpvRate" active={creaSortKey} dir={creaSortDir} onSort={toggleCreaSort} />
                  <CreaTh label="ATC" sortKey="atcRate" active={creaSortKey} dir={creaSortDir} onSort={toggleCreaSort} />
                  <CreaTh label="CVR" sortKey="cvr" active={creaSortKey} dir={creaSortDir} onSort={toggleCreaSort} />
                  <CreaTh label="Panier" sortKey="aovCents" active={creaSortKey} dir={creaSortDir} onSort={toggleCreaSort} />
                  <CreaTh label="ROAS" sortKey="roas" active={creaSortKey} dir={creaSortDir} onSort={toggleCreaSort} />
                  <th className="px-2 py-1.5 text-right font-semibold">BE</th>
                  <th className="px-2 py-1.5 text-right font-semibold">Cible</th>
                </tr>
              </thead>
              <tbody className="tnum">
                {sortedCreaRows.map((a) => (
                  <tr key={a.adId} className="border-b border-line-soft last:border-0">
                    <td className="max-w-[180px] truncate px-2 py-1.5 text-left font-medium text-ink">
                      🏆 {a.adName}
                    </td>
                    <td className="max-w-[160px] truncate px-2 py-1.5 text-left text-ink-dim">
                      {a.campaignName}
                    </td>
                    <td className="whitespace-nowrap px-2 py-1.5 text-left">
                      {a.product === "GILET" ? "🎽 Gilet" : "👕 Polo"}
                    </td>
                    <td className="whitespace-nowrap px-2 py-1.5 text-left text-ink-dim">
                      {a.creaType === "VIDEO" ? "🎬 Vidéo" : "🖼️ Image"}
                    </td>
                    <td className="whitespace-nowrap px-2 py-1.5 text-right text-ink-dim">{a.ageDays} j</td>
                    <td className="px-2 py-1.5 text-right text-ink-dim">{formatEur0(a.spendCents)}</td>
                    <td className="px-2 py-1.5 text-right text-ink-dim">{a.purchases}</td>
                    <td className="px-2 py-1.5 text-right">{a.cpaCents !== null ? eur2(a.cpaCents) : "—"}</td>
                    <td className="px-2 py-1.5 text-right">{a.cpcCents !== null ? eur2(a.cpcCents) : "—"}</td>
                    <td className="px-2 py-1.5 text-right">{a.cpmCents !== null ? formatEur0(a.cpmCents) : "—"}</td>
                    <td className="px-2 py-1.5 text-right">{formatPct(a.ctrPct)}</td>
                    <td className="px-2 py-1.5 text-right">{a.hookRate !== null ? formatPct(a.hookRate) : "—"}</td>
                    <td className="px-2 py-1.5 text-right">{a.holdRate !== null ? formatPct(a.holdRate) : "—"}</td>
                    <td className="px-2 py-1.5 text-right">{a.lpvRate !== null ? formatPct(a.lpvRate) : "—"}</td>
                    <td className="px-2 py-1.5 text-right">{a.atcRate !== null ? formatPct(a.atcRate) : "—"}</td>
                    <td className="px-2 py-1.5 text-right">{a.cvr !== null ? formatPct(a.cvr) : "—"}</td>
                    <td className="px-2 py-1.5 text-right">{a.aovCents !== null ? formatEur0(a.aovCents) : "—"}</td>
                    <td className="px-2 py-1.5 text-right font-semibold text-phosphor">
                      {formatRoas(a.roas)}
                    </td>
                    <td className="px-2 py-1.5 text-right text-ink-faint">{formatRoasBare(a.breakEven)}</td>
                    <td className="px-2 py-1.5 text-right text-ink-faint">{formatRoasBare(a.target)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-2 text-[10px] text-ink-faint">
              🏆 gagnante = ≥ 60 € de spend sur la période (en dessous, une vente chanceuse
              fausse tout) ET ROAS ≥ cible de SON produit (Lancaster → Gilet, sinon Polo — chaque
              produit a son BE/cible, calculés sur ses propres commandes 14 j glissants
              {creas.poloThresholds?.target != null && ` : Polo cible ${formatRoasBare(creas.poloThresholds.target)}`}
              {creas.giletThresholds?.target != null && ` · Gilet cible ${formatRoasBare(creas.giletThresholds.target)}`})
              ET campagne mère active. Toutes les métriques suivent la
              PÉRIODE SÉLECTIONNÉE en haut de l&apos;onglet (7/14/30 j…) — sauf l&apos;Âge,
              toujours depuis la 1ʳᵉ diffusion historique. Clique un en-tête pour trier, reclique
              pour inverser. {creas.winners}/{creas.seen} créa{creas.winners > 1 ? "s" : ""} avec
              diffusion qualifie{creas.winners > 1 ? "nt" : ""} en ce moment.
            </p>
            <p className="mt-1 text-[10px] text-ink-faint">
              Hook = vues 3 s ÷ impressions (vidéo) · Hold = vues complètes ÷ vues 3 s (vidéo) ·
              Atterrissage = pages vues ÷ clics lien (un taux bas = page lente ou clics
              accidentels) · ATC = ajouts panier ÷ pages vues · CVR = achats ÷ pages vues ·
              Panier = CA ÷ achats · Âge = jours depuis la 1ʳᵉ diffusion historique (croiser avec le ROAS : jeune prometteuse ≠ vieille qui s&apos;essouffle) · « — » = pas applicable (ex. Hook sur une image) ou pas
              assez de données.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------

function JournalSection({
  events,
  verdicts,
  ready,
  today,
  historyStart,
  onSubmit,
  onDelete,
}: {
  events: JournalEvent[];
  verdicts: Map<number, string>;
  ready: boolean;
  today: string;
  historyStart: string;
  onSubmit: (day: string, type: EventType, note: string) => Promise<string | null>;
  onDelete: (id: number) => void;
}) {
  const [day, setDay] = useState(today);
  const [type, setType] = useState<EventType>("crea");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true);
    setMsg(null);
    const err = await onSubmit(day, type, note);
    if (err) setMsg(err);
    else setNote("");
    setBusy(false);
  };

  return (
    <section className="rounded-lg border border-line bg-panel/40 p-3.5">
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-dim">
        📓 Journal de bord · relie tes changements aux chiffres
      </div>

      {!ready ? (
        <p className="rounded border border-amber/40 bg-amber/[0.05] p-2.5 text-[11.5px] text-amber">
          ⚠️ Colle la migration <b>0006_journal.sql</b> dans Supabase (SQL Editor → Run) pour
          activer le journal.
        </p>
      ) : (
        <>
          {/* Saisie 20 secondes */}
          <div className="mb-3 flex flex-wrap items-end gap-2">
            <input
              type="date"
              value={day}
              min={historyStart}
              max={today}
              onChange={(e) => setDay(e.target.value)}
              className="rounded border border-line bg-terminal px-2 py-1.5 text-[11.5px] text-ink"
            />
            <select
              value={type}
              onChange={(e) => setType(e.target.value as EventType)}
              className="rounded border border-line bg-terminal px-2 py-1.5 text-[11.5px] text-ink"
            >
              {(Object.keys(EVENT_TYPE_META) as EventType[])
                .filter((t) => t !== "campagne")
                .map((t) => (
                  <option key={t} value={t}>
                    {EVENT_TYPE_META[t].emoji} {EVENT_TYPE_META[t].label}
                  </option>
                ))}
            </select>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="ex. bundle 4 pcs passé à 84,99 €"
              className="min-w-[180px] flex-1 rounded border border-line bg-terminal px-2 py-1.5 text-[11.5px] text-ink"
            />
            <button
              onClick={submit}
              disabled={busy || !note.trim()}
              className="rounded border border-phosphor/60 bg-phosphor/10 px-3 py-1.5 text-xs font-semibold text-phosphor transition-colors hover:bg-phosphor/20 disabled:opacity-40"
            >
              {busy ? "…" : "➕ Noter"}
            </button>
          </div>
          {msg && <p className="mb-2 text-[11px] text-red">{msg}</p>}

          {events.length === 0 ? (
            <p className="text-[11.5px] text-ink-faint">
              Aucun événement pour l&apos;instant. Note chaque changement (créa, landing, offre,
              prix…) — il apparaîtra en trait vertical sur les courbes, avec un verdict
              avant/après automatique. Les coupures/lancements de campagne se détectent tout
              seuls.
            </p>
          ) : (
            <ul className="flex max-h-72 flex-col gap-1.5 overflow-y-auto">
              {events.map((e) => (
                <li
                  key={e.id}
                  className="flex items-start justify-between gap-2 rounded border border-line-soft bg-terminal/50 px-2.5 py-1.5 text-[11.5px]"
                >
                  <span className="min-w-0">
                    <span className="mr-1.5 whitespace-nowrap font-semibold text-ink-dim tnum">
                      {formatDayShort(e.day)}
                    </span>
                    <span aria-hidden className="mr-1">{EVENT_TYPE_META[e.type].emoji}</span>
                    <span className="break-words">{e.note}</span>
                    {e.source === "auto" && (
                      <span className="ml-1.5 rounded border border-cyan/40 bg-cyan/10 px-1 text-[9px] font-bold text-cyan">
                        auto
                      </span>
                    )}
                    {verdicts.has(e.id) && (
                      <span className="ml-1.5 whitespace-nowrap text-[10.5px] text-ink-faint tnum">
                        ⚖️ {verdicts.get(e.id)}
                      </span>
                    )}
                  </span>
                  <button
                    onClick={() => onDelete(e.id)}
                    aria-label="Supprimer"
                    className="flex-none text-ink-faint hover:text-red"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}

/** Couleur des pointillés par type de changement (Badr 29/08). */
const CHANGE_COLOR: Record<ChangeKind, string> = {
  scale_up: "#22c55e",
  scale_down: "#ef4444",
  crea: "#a855f7",
};

function MetricChart({
  def,
  series,
  locked,
  metaAttributed,
  markers,
  changes,
}: {
  def: MetricDef;
  series: DayMetrics[];
  locked: boolean;
  /** true = valeur calculée sur l'attribution META et non sur Shopify. */
  metaAttributed?: boolean;
  markers: { label: string; emoji: string }[];
  changes: (ChangeMarker & { label: string })[];
}) {
  const data = series.map((d) => ({
    label: d.label,
    value: d[def.key] === null ? null : def.key.endsWith("Cents") ? (d[def.key] as number) / 100 : (d[def.key] as number),
  }));
  const hasData = data.some((d) => d.value !== null);
  // Ce qui s'est passé ce jour-là, prêt pour l'infobulle.
  const changesByLabel = new Map<string, ChangeMarker[]>();
  for (const c of changes) {
    const list = changesByLabel.get(c.label) ?? [];
    list.push(c);
    changesByLabel.set(c.label, list);
  }

  return (
    <div className="rounded-lg border border-line bg-panel/40 p-2.5">
      <div className="mb-1 flex items-center justify-between px-1">
        <span className="text-[10.5px] font-semibold text-ink-dim">
          <span aria-hidden>{def.emoji}</span> {def.label}
          {metaAttributed && (
            <span
              className="ml-1 text-ink-faint"
              title="Calculé sur les achats attribués par Meta à cette campagne — pas sur le CA Shopify, qui ne se rattache pas à une campagne."
            >
              · Meta
            </span>
          )}
        </span>
      </div>
      {locked || !hasData ? (
        <div className="flex h-32 items-center justify-center text-center text-[10.5px] text-ink-faint">
          {locked
            ? "🔒 En attente du token Meta"
            : metaAttributed
              ? "Aucun achat attribué par Meta sur la période"
              : "Pas de données sur la période"}
        </div>
      ) : (
        <div className="h-32 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 6, right: 8, bottom: 0, left: -14 }}>
              <CartesianGrid stroke="#322c42" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: "#6c6482", fontSize: 8.5 }}
                tickLine={false}
                axisLine={{ stroke: "#322c42" }}
                interval="preserveStartEnd"
                minTickGap={16}
              />
              <YAxis
                tick={{ fill: "#6c6482", fontSize: 8.5 }}
                tickLine={false}
                axisLine={false}
                width={44}
                domain={["auto", "auto"]}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length || payload[0].value == null) return null;
                  const v = payload[0].value as number;
                  const dayChanges = changesByLabel.get(String(label)) ?? [];
                  return (
                    <div className="rounded border border-line bg-terminal/95 px-2 py-1 text-[10.5px] tnum shadow-lg">
                      <span className="text-ink-dim">{label} · </span>
                      <span className="font-bold text-ink">
                        {def.format(def.key.endsWith("Cents") ? v * 100 : v)}
                      </span>
                      {/* Le pointillé ne sert à rien s'il faut deviner ce
                          qu'il marque : l'infobulle le dit en toutes lettres. */}
                      {dayChanges.map((c, i) => (
                        <div key={i} style={{ color: CHANGE_COLOR[c.kind] }}>
                          {c.text}
                        </div>
                      ))}
                    </div>
                  );
                }}
              />
              {markers.map((m, i) => (
                <ReferenceLine
                  key={`ev-${m.label}-${i}`}
                  x={m.label}
                  stroke="#6c6482"
                  strokeDasharray="3 3"
                />
              ))}
              {changes.map((c, i) => (
                <ReferenceLine
                  key={`ch-${c.day}-${c.kind}-${i}`}
                  x={c.label}
                  stroke={CHANGE_COLOR[c.kind]}
                  strokeDasharray="4 3"
                  strokeWidth={1.5}
                />
              ))}
              <Line
                dataKey="value"
                stroke={def.color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, stroke: "#17141f", strokeWidth: 2 }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
