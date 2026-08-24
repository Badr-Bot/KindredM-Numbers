import {
  computeThresholds,
  fetchChargebacks,
  getDataMode,
  getDayLines,
  HISTORY_START,
  referenceToday,
  type Chargeback,
  type DayLine,
} from "@/lib/data";
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

type LoadResult =
  | { error: string }
  | {
      dayLines: Record<MarketTab, DayLine[]>;
      chargebacks: Chargeback[];
      months: string[];
      today: string;
    };


async function loadData(): Promise<LoadResult> {
  try {
    const today = await referenceToday();
    const thresholds = await computeThresholds(today);
    const dayLines = {} as Record<MarketTab, DayLine[]>;
    for (const tab of MARKET_TABS) {
      dayLines[tab] = await getDayLines(tab, HISTORY_START, today, thresholds[tab], today);
    }
    const chargebacks = await fetchChargebacks(HISTORY_START, today);

    return { dayLines, chargebacks, months: monthsBetween(HISTORY_START, today), today };
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
        chargebacks={result.chargebacks}
        months={result.months}
        today={result.today}
      />
    </div>
  );
}
