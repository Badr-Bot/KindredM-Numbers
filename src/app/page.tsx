import { getTodayView, type TodayView } from "@/lib/data";
import { formatDayLabel } from "@/lib/format";
import { PageHeading } from "@/components/shell/PageHeading";
import { DataError } from "@/components/shell/DataError";
import { EmptyState } from "@/components/shell/EmptyState";
import { RefreshButton } from "@/components/shell/RefreshButton";
import { TodayBoard } from "@/components/views/TodayBoard";
import { AutoInit } from "@/components/views/AutoInit";

// Toujours recalculé côté serveur (le cache live est géré dans lib/live.ts).
export const dynamic = "force-dynamic";

type LoadResult = { error: string } | { view: TodayView; needsInit: boolean };

async function loadData(): Promise<LoadResult> {
  try {
    const view = await getTodayView();
    // Base vide en mode réel → l'initialisation « zéro clic » se lance toute
    // seule (découverte + mapping + backfill) et la page se rafraîchit après.
    let needsInit = false;
    if (view.mode === "live") {
      const { isSetupNeeded } = await import("@/lib/autoSetup");
      needsInit = await isSetupNeeded();
    }
    return { view, needsInit };
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

  const { view, needsInit } = result;
  return (
    <div>
      <PageHeading
        emoji="⚡"
        title="Aujourd'hui"
        subtitle={formatDayLabel(view.day)}
        right={<RefreshButton fetchedAt={view.fetchedAt} />}
      />
      {needsInit && <AutoInit />}
      {view.mode === "unconfigured" ? <EmptyState /> : <TodayBoard view={view} />}
    </div>
  );
}
