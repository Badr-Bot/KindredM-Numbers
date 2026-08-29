import {
  computeThresholds,
  getDataMode,
  getTabDayData,
  HISTORY_START,
  referenceToday,
  type DayAgg,
  type Thresholds,
} from "@/lib/data";
import {
  getAnalyticsData,
  getBudgetChanges,
  getProductRoasThresholds,
  type AnalyticsData,
  type BudgetChange,
  type CreaProduct,
  type ProductRoasThresholds,
} from "@/lib/analytics";
import { getJournalEvents, type JournalEvent } from "@/lib/journal";
import { fetchActiveCampaignIds } from "@/lib/meta";
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
      thresholds: Thresholds;
      /** null = statut live indisponible (token Meta HS, mode démo…) — la
       * liste des créas gagnantes reste vide plutôt que de deviner. */
      activeCampaignIds: Set<string> | null;
      /** Seuils BE/cible par produit (Gilet vs Polo) — null : retombe sur GLOBAL. */
      productThresholds: Record<CreaProduct, ProductRoasThresholds> | null;
      /** Changements de budget RÉELS (journal d'activité Meta) pour les
       * repères scale/descale des courbes. null = journal indisponible : le
       * tableau de bord retombe sur la déduction par la dépense, et le DIT. */
      budgetChanges: BudgetChange[] | null;
    };

async function loadData(): Promise<LoadResult> {
  try {
    const today = await referenceToday();
    const [
      dayData,
      analytics,
      journal,
      allThresholds,
      activeCampaignIds,
      productThresholds,
      budgetChanges,
    ] = await Promise.all([
      getTabDayData(HISTORY_START, today),
      getAnalyticsData(HISTORY_START, today),
      getJournalEvents(),
      computeThresholds(today),
      fetchActiveCampaignIds().catch(() => null),
      getProductRoasThresholds(today).catch(() => null),
      // Best effort, comme les autres lectures Meta live : son échec ne doit
      // pas priver Badr de tout l'onglet, juste des repères exacts.
      getBudgetChanges(HISTORY_START).catch(() => null),
    ]);
    return {
      dayData,
      analytics,
      today,
      events: journal.events,
      journalReady: journal.ready,
      thresholds: allThresholds.GLOBAL,
      activeCampaignIds,
      productThresholds,
      budgetChanges,
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
        thresholds={result.thresholds}
        activeCampaignIds={result.activeCampaignIds}
        productThresholds={result.productThresholds}
        budgetChanges={result.budgetChanges}
      />
    </div>
  );
}
