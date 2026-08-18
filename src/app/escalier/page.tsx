import { addDaysToDay } from "@/lib/time";
import { getDataMode, referenceToday } from "@/lib/data";
import { buildEscalierReport, type EscalierReport } from "@/lib/escalier";
import { createSupabaseServerClient } from "@/lib/supabase";
import { PageHeading } from "@/components/shell/PageHeading";
import { DataError } from "@/components/shell/DataError";
import { EmptyState } from "@/components/shell/EmptyState";
import { EscalierBoard } from "@/components/views/EscalierBoard";

export const dynamic = "force-dynamic";

// 🪜 Escalier — la décision nocturne (00h-01h) du protocole de la formation
// (leçon 35), rejouée sur les vraies données. Le jour en cours est exclu :
// consulter à 15 h donne le même verdict qu'à minuit.
export default async function EscalierPage() {
  const mode = getDataMode();
  if (mode === "unconfigured") {
    return (
      <div>
        <PageHeading emoji="🪜" title="Escalier" />
        <EmptyState />
      </div>
    );
  }

  let report: EscalierReport;
  let today: string;
  try {
    today = await referenceToday();
    report = await buildEscalierReport(createSupabaseServerClient(), addDaysToDay(today, -1));
  } catch (err) {
    return (
      <div>
        <PageHeading emoji="🪜" title="Escalier" />
        <DataError message={(err as Error).message} />
      </div>
    );
  }

  return (
    <div>
      <PageHeading
        emoji="🪜"
        title="Escalier"
        subtitle="Décision 00h-01h — protocole Master (leçon 35) : fenêtre 2 jours, marge ≥ 15 % ?"
      />
      <EscalierBoard report={report} today={today} />
    </div>
  );
}
