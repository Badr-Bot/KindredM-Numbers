import { getDataMode, getTabDayData, HISTORY_START, referenceToday, type DayAgg } from "@/lib/data";
import type { MarketTab } from "@/lib/markets";
import { PageHeading } from "@/components/shell/PageHeading";
import { DataError } from "@/components/shell/DataError";
import { EmptyState } from "@/components/shell/EmptyState";
import { YearBoard } from "@/components/views/YearBoard";

export const dynamic = "force-dynamic";

type LoadResult =
  | { error: string }
  | { dayData: Record<MarketTab, DayAgg[]>; years: string[] };

async function loadData(): Promise<LoadResult> {
  try {
    const today = await referenceToday();
    const dayData = await getTabDayData(HISTORY_START, today);
    const startYear = Number(HISTORY_START.slice(0, 4));
    const endYear = Number(today.slice(0, 4));
    const years: string[] = [];
    for (let y = startYear; y <= endYear; y++) years.push(String(y));
    return { dayData, years };
  } catch (err) {
    return { error: (err as Error).message };
  }
}

export default async function YearPage() {
  const mode = getDataMode();
  if (mode === "unconfigured") {
    return (
      <div>
        <PageHeading emoji="📈" title="Par année" />
        <EmptyState />
      </div>
    );
  }

  const result = await loadData();
  if ("error" in result) {
    return (
      <div>
        <PageHeading emoji="📈" title="Par année" />
        <DataError message={result.error} />
      </div>
    );
  }

  return (
    <div>
      <PageHeading emoji="📈" title="Par année" subtitle="1 ligne par mois · totaux annuels" />
      <YearBoard dayData={result.dayData} years={result.years} historyStart={HISTORY_START} />
    </div>
  );
}
