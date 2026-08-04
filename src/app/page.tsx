import { getTodayView, getUnmappedSpendCentsForDay, type TodayView } from "@/lib/data";
import { getProductSplitForDay, type ProductSplitCard } from "@/lib/analytics";
import type { Brief } from "@/lib/brief";
import { formatDayLabel } from "@/lib/format";
import { PageHeading } from "@/components/shell/PageHeading";
import { DataError } from "@/components/shell/DataError";
import { EmptyState } from "@/components/shell/EmptyState";
import { RefreshButton } from "@/components/shell/RefreshButton";
import { TodayBoard } from "@/components/views/TodayBoard";
import { AutoInit } from "@/components/views/AutoInit";
import { BriefCard } from "@/components/views/BriefCard";

// Toujours recalculé côté serveur (le cache live est géré dans lib/live.ts).
export const dynamic = "force-dynamic";

type LoadResult =
  | { error: string }
  | {
      view: TodayView;
      needsInit: boolean;
      brief: Brief | null;
      unmappedSpendCents: number;
      productSplit: ProductSplitCard[];
    };

async function loadData(): Promise<LoadResult> {
  try {
    const view = await getTodayView();
    // Base vide en mode réel → l'initialisation « zéro clic » se lance toute
    // seule (découverte + mapping + backfill) et la page se rafraîchit après.
    let needsInit = false;
    let brief: Brief | null = null;
    let unmappedSpendCents = 0;
    let productSplit: ProductSplitCard[] = [];
    if (view.mode === "live") {
      const { isSetupNeeded } = await import("@/lib/autoSetup");
      needsInit = await isSetupNeeded();
      if (!needsInit) {
        const { computeBrief } = await import("@/lib/brief");
        [brief, unmappedSpendCents, productSplit] = await Promise.all([
          computeBrief().catch(() => null),
          getUnmappedSpendCentsForDay(view.day).catch(() => 0),
          getProductSplitForDay(view.day, view.cards[0].totals.spendCents).catch(() => []),
        ]);
      }
    }
    return { view, needsInit, brief, unmappedSpendCents, productSplit };
  } catch (err) {
    return { error: (err as Error).message };
  }
}

export default async function TodayPage() {
  const result = await loadData();

  if ("error" in result) {
    return (
      <div>
        <PageHeading emoji="⚡" title="Aujourd'hui" />
        <DataError message={result.error} />
      </div>
    );
  }

  const { view, needsInit, brief, unmappedSpendCents, productSplit } = result;
  return (
    <div>
      <PageHeading
        emoji="⚡"
        title="Aujourd'hui"
        subtitle={formatDayLabel(view.day)}
        right={<RefreshButton fetchedAt={view.fetchedAt} />}
      />
      {needsInit && <AutoInit />}
      {brief && <BriefCard brief={brief} />}
      {view.mode === "unconfigured" ? (
        <EmptyState />
      ) : (
        <TodayBoard view={view} unmappedSpendCents={unmappedSpendCents} productSplit={productSplit} />
      )}
    </div>
  );
}
