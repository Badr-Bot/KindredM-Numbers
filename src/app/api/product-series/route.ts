import { NextResponse } from "next/server";
import {
  buildProductSeries,
  getProductRawBuckets,
  getProductRoasThresholds,
  type ProductSeriesKey,
} from "@/lib/analytics";
import {
  computeThresholds,
  deriveMetrics,
  getDayLines,
  type DayLine,
  type Thresholds,
  type Totals,
} from "@/lib/data";
import { MARKET_TABS, type MarketTab } from "@/lib/markets";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Séries par produit d'UNE fenêtre de dates (onglet Mois, filtre produit).
//
// Pourquoi une route et pas un chargement dans la page : le découpage doit
// paginer la table `orders` (line_items compris) pour retrouver le produit
// principal de chaque commande. Le faire pour TOUT l'historique à chaque
// ouverture de /mois, c'était plusieurs Mo de JSON avant le premier pixel —
// et ça tombait silencieusement (1re version : le filtre ne s'affichait
// jamais en prod, sans un mot d'explication).
//
// Ici le travail est BORNÉ au mois demandé et n'a lieu QUE si Badr clique
// sur un produit. « Tous » ne coûte rien.
// ---------------------------------------------------------------------------

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
/** Garde-fou : une fenêtre plus large que ça, c'est un appel qui dérape. */
const MAX_DAYS = 100;

function toDayLines(rows: (Totals & { day: string })[], thresholds: Thresholds, today: string): DayLine[] {
  let cumul = 0;
  return rows.map((r) => {
    cumul += r.netCents;
    const m = deriveMetrics(r, thresholds);
    return {
      ...r,
      isToday: r.day === today,
      cumulNetCents: cumul,
      marginPct: m.marginPct,
      mer: m.mer,
      status: m.status,
    };
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const start = searchParams.get("start") ?? "";
  const end = searchParams.get("end") ?? "";

  if (!DAY_RE.test(start) || !DAY_RE.test(end) || start > end) {
    return NextResponse.json({ error: "Paramètres start/end invalides (YYYY-MM-DD)." }, { status: 400 });
  }
  const spanDays = Math.round((Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86400000) + 1;
  if (spanDays > MAX_DAYS) {
    return NextResponse.json({ error: `Fenêtre trop large (${spanDays} j, max ${MAX_DAYS}).` }, { status: 400 });
  }

  try {
    const [raw, thresholds, productThresholds] = await Promise.all([
      getProductRawBuckets(start, end),
      computeThresholds(end),
      getProductRoasThresholds(end).catch(() => null),
    ]);
    const dayLines = {} as Record<MarketTab, DayLine[]>;
    for (const tab of MARKET_TABS) {
      dayLines[tab] = await getDayLines(tab, start, end, thresholds[tab], end);
    }

    const series = buildProductSeries(raw, dayLines);
    const out = {} as Record<ProductSeriesKey, Record<MarketTab, DayLine[]>>;
    for (const key of ["GILET", "POLO", "TESTING"] as ProductSeriesKey[]) {
      const perTab = {} as Record<MarketTab, DayLine[]>;
      for (const tab of MARKET_TABS) {
        // Seuils PAR PRODUIT quand on les a — le gilet a une marge plus haute,
        // donc un break-even plus bas : le juger au seuil du compte le
        // disqualifierait à tort.
        const th = (key === "GILET" || key === "POLO" ? productThresholds?.[key] : null) ?? thresholds[tab];
        perTab[tab] = toDayLines(series[key][tab] ?? [], th, end);
      }
      out[key] = perTab;
    }
    return NextResponse.json({ series: out });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
