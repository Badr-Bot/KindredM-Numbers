import { Suspense } from "react";
import { getDataMode, referenceToday } from "@/lib/data";
import { formatInTimeZone } from "date-fns-tz";
import { BASCULE_HEURE, buildScalingReport, decisionDayFor, type ScalingReport } from "@/lib/scaling";
import { createSupabaseServerClient } from "@/lib/supabase";
import { PageHeading } from "@/components/shell/PageHeading";
import { DataError } from "@/components/shell/DataError";
import { EmptyState } from "@/components/shell/EmptyState";
import { ScalingBoard } from "@/components/views/ScalingBoard";

export const dynamic = "force-dynamic";

// 🪜 Meta Scaling — le protocole de décision de la formation (leçon 35) rejoué
// sur les vraies données Meta : décision de la nuit (stable, vérifiée sur
// Meta) + fenêtre en cours (provisoire, live).
export default async function ScalingPage() {
  const mode = getDataMode();
  if (mode === "unconfigured") {
    return (
      <div>
        <PageHeading emoji="🪜" title="Meta Scaling" />
        <EmptyState />
      </div>
    );
  }

  // Le shell (titre, nav) peint immédiatement ; le board arrive en streaming
  // dès que les données sont prêtes (audit perf P5) — le temps total ne change
  // pas, l'attente devant un écran vide, si.
  return (
    <div>
      <PageHeading
        emoji="🪜"
        title="Meta Scaling"
        subtitle="Protocole Master (leçon 35) — décision de la nuit + fenêtre en cours, budgets lus sur Meta"
      />
      <Suspense fallback={<BoardSkeleton />}>
        <BoardLoader />
      </Suspense>
    </div>
  );
}

async function BoardLoader() {
  let report: ScalingReport;
  try {
    // Un SEUL instant de référence pour le jour ET l'heure : deux new Date()
    // séparés autour de minuit donnaient un jour et une heure incohérents.
    const now = new Date();
    const today = getDataMode() === "demo" ? await referenceToday() : formatInTimeZone(now, "Europe/Paris", "yyyy-MM-dd");
    const parisHour = Number(formatInTimeZone(now, "Europe/Paris", "H"));
    // 00h-07h : données figées de la veille 23h59 (plage d'exécution) ;
    // ensuite : jour J en live.
    report = await buildScalingReport(
      createSupabaseServerClient(),
      decisionDayFor(today, parisHour),
      parisHour >= BASCULE_HEURE
    );
  } catch (err) {
    return <DataError message={(err as Error).message} />;
  }
  return <ScalingBoard report={report} />;
}

function BoardSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-4" aria-label="Chargement des verdicts…">
      <div className="h-16 rounded-lg border border-line bg-panel/40" />
      {[0, 1, 2].map((i) => (
        <div key={i} className="card-shadow h-64 rounded-xl border border-line bg-panel/60" />
      ))}
    </div>
  );
}
