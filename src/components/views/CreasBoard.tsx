"use client";

import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CreasData } from "@/lib/analytics";
import { formatDayShort, formatEur0, formatPct, formatRoas } from "@/lib/format";
import { useSound } from "../sound/SoundProvider";

// Même seuil que le hit rate de l'onglet Analyse — en dessous, la créa n'a
// pas vraiment été testée, elle ne fait que gonfler la liste sans rien dire.
const MIN_SPEND_TESTED = 2000; // 20 €

// 🔪 Règle de coupure (Badr, 26/07) : « elle dépense 2 ou 3 fois le CPA cible
// et zéro achat ». On prend 2× (alerte plus tôt) — une créa qui a brûlé deux
// paniers d'acquisition sans UNE seule vente n'a rien à prouver de plus.
// Remplace l'ancienne règle « 3 jours au-dessus de la cible » : la source de
// Badr dit explicitement l'inverse (une créa établie qui fait 2-3 mauvais
// jours, on n'y touche pas), et cette règle-là coupait des créas rentables.
const CUT_SPEND_MULTIPLE = 2;

// 🏆 Gagnante : prend une vraie part du budget de SA campagne (l'algo lui fait
// confiance) ET tient le KPI (CPA ≤ cible). Une créa à bon CPA mais 1 % du
// spend n'est pas une gagnante, juste un coup de chance sur 2 ventes.
const WINNER_MIN_SPEND_SHARE = 0.1;

type CreaStatus = "cut" | "winner" | "neutral";

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
  series: {
    label: string;
    spendCents: number;
    caCents: number;
    roas: number | null;
    cpaCents: number | null;
    ctrPct: number | null;
    cpmCents: number | null;
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
  const [sortKey, setSortKey] = useState<SortKey>("spendCents");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

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

  const rows: CreaRow[] = useMemo(() => {
    type Acc = Omit<CreaRow, "series"> & {
      dailyPoints: { day: string; spendCents: number; caCents: number; clicks: number; impressions: number; purchases: number }[];
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
          hookRate: null,
          hold50: null,
          hold75: null,
          hold100: null,
          lpvRate: null,
          cvrLanding: null,
          atcRate: null,
          checkoutRate: null,
          status: "neutral" as CreaStatus,
          spendShare: null,
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
      });
      byAd.set(d.adId, cur);
    }

    const out: CreaRow[] = [];
    for (const r of byAd.values()) {
      if (r.spendCents < MIN_SPEND_TESTED) continue;
      r.isVideo = r.video3s > 0;
      r.roas = r.spendCents > 0 && r.caCents > 0 ? r.caCents / r.spendCents : null;
      r.cpaCents = r.purchases > 0 ? Math.round(r.spendCents / r.purchases) : null;
      r.ctrPct = r.impressions > 0 ? r.clicks / r.impressions : null;
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
      const series = r.dailyPoints
        .sort((a, b) => a.day.localeCompare(b.day))
        .map((p) => ({
          label: formatDayShort(p.day),
          spendCents: p.spendCents,
          caCents: p.caCents,
          roas: p.spendCents > 0 ? p.caCents / p.spendCents : null,
          cpaCents: p.purchases > 0 ? Math.round(p.spendCents / p.purchases) : null,
          ctrPct: p.impressions > 0 ? (p.clicks / p.impressions) * 100 : null,
          cpmCents: p.impressions > 0 ? Math.round((p.spendCents / p.impressions) * 1000) : null,
        }));

      // 🔪 / 🏆 Statut — voir les constantes en tête de fichier.
      const campaignTotal = campaignSpend.get(r.campaignId) ?? 0;
      const spendShare = campaignTotal > 0 ? r.spendCents / campaignTotal : null;
      let status: CreaStatus = "neutral";
      if (targetCpaCents !== null) {
        if (r.purchases === 0 && r.spendCents >= CUT_SPEND_MULTIPLE * targetCpaCents) {
          status = "cut";
        } else if (
          r.cpaCents !== null &&
          r.cpaCents <= targetCpaCents &&
          spendShare !== null &&
          spendShare >= WINNER_MIN_SPEND_SHARE
        ) {
          status = "winner";
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
        series,
      });
    }

    // Les créas à couper d'abord (action à prendre), puis les gagnantes
    // (à dupliquer/scaler), puis le reste — chaque groupe trié par le
    // critère choisi.
    const STATUS_ORDER: Record<CreaStatus, number> = { cut: 0, winner: 1, neutral: 2 };
    out.sort((a, b) => {
      if (a.status !== b.status) return STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
      const av = a[sortKey];
      const bv = b[sortKey];
      const an = av === null ? -Infinity : av;
      const bn = bv === null ? -Infinity : bv;
      return sortDir === "desc" ? bn - an : an - bn;
    });
    return out;
  }, [filteredDaily, metaByAd, campaignFilter, sortKey, sortDir, campaignSpend, targetCpaCents]);

  return (
    <div className="flex flex-col gap-4">
      {/* Filtres : période + campagne + tri */}
      <div className="flex flex-wrap items-center gap-2">
        {(["7", "14", "30", "all", "custom"] as Preset[]).map((p) => (
          <button
            key={p}
            onClick={() => {
              play("tab");
              setPreset(p);
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
          }}
          className="rounded border border-line px-2 py-1 text-[11px] text-ink-dim hover:text-ink"
        >
          {sortDir === "desc" ? "▼" : "▲"}
        </button>
      </div>

      {targetCpaCents !== null ? (
        (() => {
          const cutCount = rows.filter((r) => r.status === "cut").length;
          const winCount = rows.filter((r) => r.status === "winner").length;
          return (
            <div className="flex flex-col gap-1.5">
              {cutCount > 0 && (
                <p className="rounded-lg border border-red/40 bg-red/[0.06] p-3 text-[11.5px] text-red">
                  🔪 <b>{cutCount} créa{cutCount > 1 ? "s" : ""} à couper</b> — a brûlé{" "}
                  {CUT_SPEND_MULTIPLE}× le CPA cible ({formatEur0(CUT_SPEND_MULTIPLE * targetCpaCents)})
                  sans <b>une seule</b> vente. En tête de liste, bordure rouge.
                </p>
              )}
              {winCount > 0 && (
                <p className="rounded-lg border border-phosphor/40 bg-phosphor/[0.06] p-3 text-[11.5px] text-phosphor">
                  🏆 <b>{winCount} gagnante{winCount > 1 ? "s" : ""}</b> — prend ≥{" "}
                  {Math.round(WINNER_MIN_SPEND_SHARE * 100)} % du budget de sa campagne ET CPA sous la
                  cible ({formatEur0(targetCpaCents)}). À dupliquer / décliner.
                </p>
              )}
              <p className="text-[10.5px] text-ink-faint">
                🎯 CPA cible : {formatEur0(targetCpaCents)} (14 j glissants, bouge tout seul avec ta
                marge). Une créa qui dépense beaucoup avec un ROAS moyen n&apos;est pas forcément
                mauvaise — elle nourrit le compte en trafic pas cher, la couper fait souvent tomber
                les autres.
              </p>
            </div>
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
          🔒 Pas de créa avec ≥ 20 € de spend sur cette période. Élargis la fenêtre ou attends que
          les données Meta se remplissent.
        </p>
      )}

      {rows.length > 0 && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((r) => (
              <CreaCard key={r.adId} row={r} />
            ))}
          </div>
          <p className="text-[10px] text-ink-faint">
            🔪 <b>À couper</b> = {CUT_SPEND_MULTIPLE}× le CPA cible dépensés, zéro vente · 🏆{" "}
            <b>Gagnante</b> = ≥ {Math.round(WINNER_MIN_SPEND_SHARE * 100)} % du budget de sa campagne
            ET CPA sous la cible. Une créa établie qui fait 2-3 mauvais jours n&apos;est PAS à couper
            — seule une créa qui brûle du budget sans jamais convertir l&apos;est. 👆 Clique
            &laquo; Funnel complet &raquo; pour voir où les gens décrochent (clic → page → panier →
            checkout → achat) et toutes les courbes. Reach cumulé sur plusieurs jours = approximatif
            (pas de déduplication inter-jours côté Meta).
          </p>
        </>
      )}
    </div>
  );
}

function CreaCard({ row }: { row: CreaRow }) {
  const { play } = useSound();
  const [open, setOpen] = useState(false);
  const roasColor =
    row.roas === null ? "text-ink" : row.roas >= 2 ? "text-phosphor" : row.roas >= 1 ? "text-amber" : "text-red";

  const shell =
    row.status === "cut"
      ? "border-red/50 bg-red/[0.05]"
      : row.status === "winner"
        ? "border-phosphor/50 bg-phosphor/[0.05]"
        : "border-line bg-panel/40";

  return (
    <div className={`rounded-lg border p-3 ${shell}`}>
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
        {row.status === "winner" && (
          <span className="flex-none whitespace-nowrap rounded border border-phosphor/50 bg-phosphor/10 px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wide text-phosphor">
            🏆 Gagnante
          </span>
        )}
      </div>
      {row.status === "cut" && (
        <p className="mb-1.5 text-[10px] text-red/80">
          ⚠️ {formatEur0(row.spendCents)} dépensés, <b>0 vente</b> — au-delà de{" "}
          {CUT_SPEND_MULTIPLE}× le CPA cible sans résultat.
        </p>
      )}
      {row.status === "winner" && row.spendShare !== null && (
        <p className="mb-1.5 text-[10px] text-phosphor/80">
          ✅ {formatPct(row.spendShare)} du budget de sa campagne, CPA{" "}
          {row.cpaCents !== null ? formatEur0(row.cpaCents) : "—"} sous la cible.
        </p>
      )}

      <div className="mb-2 flex items-baseline justify-between">
        <span className={`text-2xl font-bold tnum ${roasColor}`}>{formatRoas(row.roas)}</span>
        <span className="text-right text-[10.5px] tnum text-ink-dim">
          {formatEur0(row.caCents)} CA
          <br />
          {formatEur0(row.spendCents)} spend
        </span>
      </div>

      {/* Mini-courbe CA — toujours visible, pas besoin de cliquer (25/07) */}
      <MiniChart data={row.series} dataKey="caCents" divideBy={100} format={formatEur0} />

      <div className="mt-2 grid grid-cols-4 gap-1 text-center text-[10px] text-ink-dim">
        <div>
          <div className="text-ink-faint">CPA</div>
          <div className="tnum text-ink">{row.cpaCents !== null ? formatEur0(row.cpaCents) : "—"}</div>
        </div>
        <div>
          <div className="text-ink-faint">CTR</div>
          <div className="tnum text-ink">{formatPct(row.ctrPct)}</div>
        </div>
        <div>
          <div className="text-ink-faint">Atterr.</div>
          <div className="tnum text-ink">{formatPct(row.lpvRate)}</div>
        </div>
        <div>
          <div className="text-ink-faint">Panier</div>
          <div className="tnum text-ink">{formatPct(row.atcRate)}</div>
        </div>
      </div>

      <button
        onClick={() => {
          play("tab");
          setOpen((v) => !v);
        }}
        className="mt-2 w-full rounded border border-line-soft py-1 text-[10px] uppercase tracking-wide text-ink-faint hover:text-ink"
      >
        {open ? "▲ Moins de détails" : "▼ Funnel complet"}
      </button>

      {open && (
        <div className="mt-2 flex flex-col gap-2 border-t border-line-soft pt-2">
          {row.body && <p className="line-clamp-3 text-[10.5px] text-ink-dim">{row.body}</p>}
          {/* Entonnoir dans l'ordre où les gens avancent (ou pas) — chaque
              taux se lit "sur 100 qui passent l'étape d'avant, combien
              vont à celle-ci". Sépare clairement où ça se perd. */}
          <div className="flex flex-col gap-1 text-[10.5px] text-ink-dim">
            <span>
              🛬 <b className="text-ink">Atterrissage</b> {formatPct(row.lpvRate)} — sur 100 clics, combien
              arrivent vraiment sur la page (page lente/cassée si bas)
            </span>
            <span>
              🛒 <b className="text-ink">Ajout panier</b> {formatPct(row.atcRate)} — sur ceux arrivés sur
              la page, combien mettent un article au panier (offre/prix si bas)
            </span>
            <span>
              💳 <b className="text-ink">Checkout</b> {formatPct(row.checkoutRate)} — sur ceux qui ont
              un panier, combien lancent le paiement (frais de port/confiance si bas)
            </span>
            <span>
              🛍️ <b className="text-ink">Achat après clic</b> {formatPct(row.cvrLanding)} — sur 100 qui
              atterrissent sur la page, combien achètent au final
            </span>
            {row.isVideo && (
              <>
                <span>🎬 Reste jusqu&apos;à 50 % de la vidéo : {formatPct(row.hold50)}</span>
                <span>🎬 Reste jusqu&apos;à 75 % de la vidéo : {formatPct(row.hold75)}</span>
                <span>🎬 Reste jusqu&apos;à la fin (100 %) : {formatPct(row.hold100)}</span>
              </>
            )}
            {row.qualityRanking && (
              <span>⭐ Qualité : {RANKING_LABEL[row.qualityRanking] ?? row.qualityRanking}</span>
            )}
            {row.engagementRanking && (
              <span>💬 Engagement : {RANKING_LABEL[row.engagementRanking] ?? row.engagementRanking}</span>
            )}
            {row.conversionRanking && (
              <span>🎯 Conversion : {RANKING_LABEL[row.conversionRanking] ?? row.conversionRanking}</span>
            )}
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <MiniChart title="📣 Spend" data={row.series} dataKey="spendCents" divideBy={100} format={formatEur0} />
            <MiniChart title="⚖️ ROAS" data={row.series} dataKey="roas" format={formatRoas} />
            <MiniChart title="🎯 CPA" data={row.series} dataKey="cpaCents" divideBy={100} format={formatEur0} />
            <MiniChart title="👀 CTR" data={row.series} dataKey="ctrPct" format={(v) => formatPct(v / 100)} />
            <MiniChart title="📢 CPM" data={row.series} dataKey="cpmCents" divideBy={100} format={formatEur0} />
          </div>
        </div>
      )}
    </div>
  );
}

function MiniChart({
  title,
  data,
  dataKey,
  divideBy = 1,
  format,
}: {
  title?: string;
  data: { label: string; [k: string]: unknown }[];
  dataKey: string;
  divideBy?: number;
  format: (v: number) => string;
}) {
  const chartData = data.map((d) => ({
    label: d.label,
    value: d[dataKey] === null || d[dataKey] === undefined ? null : (d[dataKey] as number) / divideBy,
  }));
  if (chartData.length < 2) {
    return <p className="text-[10px] text-ink-faint">Pas assez de jours pour un graphe.</p>;
  }
  return (
    <div>
      {title && <div className="mb-1 text-[10px] font-semibold text-ink-dim">{title}</div>}
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
                if (!active || !payload?.length || payload[0].value == null) return null;
                return (
                  <div className="rounded border border-line bg-terminal/95 px-2 py-1 text-[10px] tnum shadow-lg">
                    <span className="text-ink-dim">{label} · </span>
                    <span className="font-bold text-ink">{format((payload[0].value as number) * divideBy)}</span>
                  </div>
                );
              }}
            />
            <Line dataKey="value" stroke="#33ff9c" strokeWidth={2} dot={false} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
