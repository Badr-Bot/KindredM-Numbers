import { getDataMode, getTargetCpaCents, HISTORY_START, referenceToday } from "@/lib/data";
import { getCreasData, type CreasData } from "@/lib/analytics";
import { PageHeading } from "@/components/shell/PageHeading";
import { DataError } from "@/components/shell/DataError";
import { EmptyState } from "@/components/shell/EmptyState";
import { CreasBoard } from "@/components/views/CreasBoard";

export const dynamic = "force-dynamic";

type LoadResult = { error: string } | { creas: CreasData; today: string; targetCpaCents: number | null };

async function loadData(): Promise<LoadResult> {
  try {
    const today = await referenceToday();
    const [creas, targetCpaCents] = await Promise.all([
      getCreasData(HISTORY_START, today),
      getTargetCpaCents(today),
    ]);
    return { creas, today, targetCpaCents };
  } catch (err) {
    return { error: (err as Error).message };
  }
}

export default async function CreasPage() {
  const mode = getDataMode();
  if (mode === "unconfigured") {
    return (
      <div>
        <PageHeading emoji="🎬" title="Créas" />
        <EmptyState />
      </div>
    );
  }

  const result = await loadData();
  if ("error" in result) {
    return (
      <div>
        <PageHeading emoji="🎬" title="Créas" />
        <DataError message={result.error} />
      </div>
    );
  }

  return (
    <div>
      <PageHeading
        emoji="🎬"
        title="Créas"
        subtitle="Chaque créa en détail — ROAS, CPA, hook/hold, funnel complet"
      />
      <CreasBoard
        creas={result.creas}
        today={result.today}
        historyStart={HISTORY_START}
        targetCpaCents={result.targetCpaCents}
      />
    </div>
  );
}
