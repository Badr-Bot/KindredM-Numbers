import { getDataMode, getTabDayData, HISTORY_START, referenceToday, type DayAgg } from "@/lib/data";
import type { MarketTab } from "@/lib/markets";
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
  | { dayData: Record<MarketTab, DayAgg[]>; months: string[]; today: string };

async function loadData(): Promise<LoadResult> {
  try {
    const today = await referenceToday();
    const dayData = await getTabDayData(HISTORY_START, today);
    return { dayData, months: monthsBetween(HISTORY_START, today), today };
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
      <PageHeading emoji="🗓️" title="Par mois" subtitle="CA (barres) · marge (ligne) · Δ vs mois précédent" />
      <MonthBoard dayData={result.dayData} months={result.months} today={result.today} />
    </div>
  );
}
