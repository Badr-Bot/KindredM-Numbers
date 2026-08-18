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

  let report: ScalingReport;
  try {
    const today = await referenceToday();
    const parisHour = Number(formatInTimeZone(new Date(), "Europe/Paris", "H"));
    // 00h-07h : données figées de la veille 23h59 (plage d'exécution) ;
    // ensuite : jour J en live.
    report = await buildScalingReport(
      createSupabaseServerClient(),
      decisionDayFor(today, parisHour),
      parisHour >= BASCULE_HEURE
    );
  } catch (err) {
    return (
      <div>
        <PageHeading emoji="🪜" title="Meta Scaling" />
        <DataError message={(err as Error).message} />
      </div>
    );
  }

  return (
    <div>
      <PageHeading
        emoji="🪜"
        title="Meta Scaling"
        subtitle="Protocole Master (leçon 35) — décision de la nuit + fenêtre en cours, application vérifiée sur Meta"
      />
      <ScalingBoard report={report} />
    </div>
  );
}
