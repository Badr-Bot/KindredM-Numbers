import { getTodayView } from "@/lib/data";
import { formatDayLabel } from "@/lib/format";
import { PageHeading } from "@/components/shell/PageHeading";
import { EmptyState } from "@/components/shell/EmptyState";
import { RefreshButton } from "@/components/shell/RefreshButton";
import { TodayBoard } from "@/components/views/TodayBoard";

// Toujours recalculé côté serveur (le cache live est géré dans lib/live.ts).
export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const view = await getTodayView();

  return (
    <div>
      <PageHeading
        emoji="⚡"
        title="Aujourd'hui"
        subtitle={formatDayLabel(view.day)}
        right={<RefreshButton fetchedAt={view.fetchedAt} />}
      />
      {view.mode === "unconfigured" ? <EmptyState /> : <TodayBoard view={view} />}
    </div>
  );
}
