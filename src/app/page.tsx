import { getTodayView } from "@/lib/data";
import { formatDayLabel } from "@/lib/format";
import { PageHeading } from "@/components/shell/PageHeading";
import { EmptyState } from "@/components/shell/EmptyState";
import { RefreshButton } from "@/components/shell/RefreshButton";
import { TodayBoard } from "@/components/views/TodayBoard";
import { AutoInit } from "@/components/views/AutoInit";

// Toujours recalculé côté serveur (le cache live est géré dans lib/live.ts).
export const dynamic = "force-dynamic";

export default async function TodayPage() {
  // Une erreur de données (Supabase injoignable, table manquante…) ne doit
  // jamais produire une page morte : on l'affiche en clair avec la cause.
  let view: Awaited<ReturnType<typeof getTodayView>>;
  try {
    view = await getTodayView();
  } catch (err) {
    return (
      <div>
        <PageHeading emoji="⚡" title="Aujourd'hui" />
        <section className="rounded-lg border border-red/40 bg-red/[0.04] p-4">
          <div className="text-sm font-semibold text-red">❌ Impossible de lire les données</div>
          <p className="mt-2 max-h-32 overflow-y-auto break-words text-[11.5px] text-ink-dim">
            {(err as Error).message}
          </p>
          <ul className="mt-3 flex flex-col gap-1 text-[10.5px] text-ink-faint">
            <li>• Vérifie que les 3 scripts SQL ont été exécutés dans Supabase (SQL Editor).</li>
            <li>• Vérifie SUPABASE_URL et SUPABASE_SERVICE_KEY sur la page ⚙️ /admin.</li>
            <li>• Après toute modification de variable dans Vercel : Redeploy.</li>
          </ul>
        </section>
      </div>
    );
  }

  // Base vide en mode réel → l'initialisation « zéro clic » se lance toute
  // seule (découverte + mapping + backfill) et la page se rafraîchit après.
  let needsInit = false;
  if (view.mode === "live") {
    const { isSetupNeeded } = await import("@/lib/autoSetup");
    needsInit = await isSetupNeeded();
  }

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
