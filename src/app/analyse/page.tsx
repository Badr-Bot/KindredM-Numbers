import {
  getDataMode,
  getTabDayData,
  HISTORY_START,
  referenceToday,
  type DayAgg,
} from "@/lib/data";
import { getAnalyticsData, type AnalyticsData } from "@/lib/analytics";
import { getJournalEvents, type JournalEvent } from "@/lib/journal";
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
      today: string;
      events: JournalEvent[];
      journalReady: boolean;
    };

async function loadData(): Promise<LoadResult> {
  try {
    const today = await referenceToday();
    const [dayData, analytics, journal] = await Promise.all([
      getTabDayData(HISTORY_START, today),
      getAnalyticsData(HISTORY_START, today),
      getJournalEvents(),
    ]);
    return {
      dayData,
      analytics,
      today,
      events: journal.events,
      journalReady: journal.ready,
    };
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
        historyStart={HISTORY_START}
        today={result.today}
        events={result.events}
        journalReady={result.journalReady}
      />
    </div>
  );
}
