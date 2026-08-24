import {
  computeThresholds,
  deriveMetrics,
  fetchChargebacks,
  getDataMode,
  getDayLines,
  HISTORY_START,
  referenceToday,
  type Chargeback,
  type DayLine,
  type Thresholds,
  type Totals,
} from "@/lib/data";
import {
  buildProductSeries,
  getProductRawBuckets,
  getProductRoasThresholds,
  type ProductSeriesKey,
} from "@/lib/analytics";
import { MARKET_TABS, type MarketTab } from "@/lib/markets";
import { PageHeading } from "@/components/shell/PageHeading";
import { DataError } from "@/components/shell/DataError";
import { EmptyState } from "@/components/shell/EmptyState";
import { MonthBoard } from "@/components/views/MonthBoard";

export const dynamic = "force-dynamic";

function monthsBetween(start: string, end: string): string[] {
  const out: string[] = [];
  let [y, m] = [Number(start.slice(0, 4)), Number(start.slice(5, 7))];
  const [ey, em] = [Number(end.slice(0, 4)), Number(end.slice(5, 7))];
  while (y < ey || (y === ey && m <= em)) {
    out.push(`${y}-${String(m).padStart(2, "0")}`);
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
  return out;
}

type ByProduct = Partial<Record<ProductSeriesKey, Record<MarketTab, DayLine[]>>>;

type LoadResult =
  | { error: string }
  | {
      dayLines: Record<MarketTab, DayLine[]>;
      byProduct: ByProduct;
      chargebacks: Chargeback[];
      months: string[];
      today: string;
    };

/** Série produit brute → DayLine (cumul, marge, MER, statut), comme getDayLines. */
function toDayLines(rows: (Totals & { day: string })[], thresholds: Thresholds, today: string): DayLine[] {
  let cumul = 0;
  return rows.map((r) => {
    cumul += r.netCents;
    const m = deriveMetrics(r, thresholds);
    return { ...r, isToday: r.day === today, cumulNetCents: cumul, marginPct: m.marginPct, mer: m.mer, status: m.status };
  });
}

async function loadData(): Promise<LoadResult> {
  try {
    const today = await referenceToday();
    const thresholds = await computeThresholds(today);
    const dayLines = {} as Record<MarketTab, DayLine[]>;
    for (const tab of MARKET_TABS) {
      dayLines[tab] = await getDayLines(tab, HISTORY_START, today, thresholds[tab], today);
    }
    const chargebacks = await fetchChargebacks(HISTORY_START, today);

    // Filtre produit (Badr 24/08) : séries Gilet/Polo/Testing par marché, sur
    // la même fenêtre. Un échec ne casse PAS l'onglet Mois — il retire juste
    // le filtre (le tableau « Tous » reste servi).
    const byProduct: ByProduct = {};
    try {
      const [raw, productThresholds] = await Promise.all([
        getProductRawBuckets(HISTORY_START, today),
        getProductRoasThresholds(today).catch(() => null),
      ]);
      const matrix = raw ? buildProductSeries(raw, dayLines) : null;
      if (matrix) {
        for (const key of ["GILET", "POLO", "TESTING"] as ProductSeriesKey[]) {
          // Seuils PAR PRODUIT quand on les a (le gilet a une marge plus
          // haute, donc un BE plus bas) — sinon ceux du marché.
          const perTab = {} as Record<MarketTab, DayLine[]>;
          for (const tab of MARKET_TABS) {
            const th =
              (key === "GILET" || key === "POLO" ? productThresholds?.[key] : null) ?? thresholds[tab];
            perTab[tab] = toDayLines(matrix[key][tab] ?? [], th, today);
          }
          byProduct[key] = perTab;
        }
      }
    } catch {
      // filtre indisponible : on sert l'onglet sans lui
    }

    return { dayLines, byProduct, chargebacks, months: monthsBetween(HISTORY_START, today), today };
  } catch (err) {
    return { error: (err as Error).message };
  }
}

export default async function MonthPage() {
  const mode = getDataMode();
  if (mode === "unconfigured") {
    return (
      <div>
        <PageHeading emoji="🗓️" title="Par mois" />
        <EmptyState />
      </div>
    );
  }

  const result = await loadData();
  if ("error" in result) {
    return (
      <div>
        <PageHeading emoji="🗓️" title="Par mois" />
        <DataError message={result.error} />
      </div>
    );
  }

  return (
    <div>
      <PageHeading emoji="🗓️" title="Par mois" subtitle="CA (barres) · marge (ligne) · listing jour par jour · filtrable par pays ET par produit" />
      <MonthBoard
        dayLines={result.dayLines}
        byProduct={result.byProduct}
        chargebacks={result.chargebacks}
        months={result.months}
        today={result.today}
      />
    </div>
  );
}
