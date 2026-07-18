import {
  computeThresholds,
  getDataMode,
  getTabDayData,
  HISTORY_START,
  referenceToday,
  type DayAgg,
  type Thresholds,
} from "@/lib/data";
import { getAnalyticsData, type AnalyticsData } from "@/lib/analytics";
import type { MarketTab } from "@/lib/markets";
import { PageHeading } from "@/components/shell/PageHeading";
import { DataError } from "@/components/shell/DataError";
import { EmptyState } from "@/components/shell/EmptyState";
import { AnalyseBoard } from "@/components/views/AnalyseBoard";

export const dynamic = "force-dynamic";

type LoadResult =
  | { error: string }
  | {
      dayData: Record<MarketTab, DayAgg[]>;
      analytics: AnalyticsData;
      thresholds: Thresholds;
      today: string;
    };

async function loadData(): Promise<LoadResult> {
  try {
    const today = await referenceToday();
    const [dayData, analytics, thresholds] = await Promise.all([
      getTabDayData(HISTORY_START, today),
      getAnalyticsData(HISTORY_START, today),
      computeThresholds(today),
    ]);
    return { dayData, analytics, thresholds: thresholds.GLOBAL, today };
  } catch (err) {
    return { error: (err as Error).message };
  }
}

export default async function AnalysePage() {
  const mode = getDataMode();
  if (mode === "unconfigured") {
    return (
      <div>
        <PageHeading emoji="📊" title="Analyse" />
        <EmptyState />
      </div>
    );
  }

  const result = await loadData();
  if ("error" in result) {
    return (
      <div>
        <PageHeading emoji="📊" title="Analyse" />
        <DataError message={result.error} />
      </div>
    );
  }

  return (
    <div>
      <PageHeading
        emoji="📊"
        title="Analyse"
        subtitle="CPA · CPM · CPC · CTR · CVR — dérapages, corrélations et créas"
      />
      <AnalyseBoard
        dayData={result.dayData}
        analytics={result.analytics}
        thresholds={result.thresholds}
        historyStart={HISTORY_START}
        today={result.today}
      />
    </div>
  );
}
