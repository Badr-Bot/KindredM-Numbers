import Link from "next/link";
import { Suspense } from "react";
import { getDataMode } from "@/lib/data";
import { buildBankReport, type BankReport } from "@/lib/bank";
import { createSupabaseServerClient } from "@/lib/supabase";
import { PageHeading } from "@/components/shell/PageHeading";
import { DataError } from "@/components/shell/DataError";
import { EmptyState } from "@/components/shell/EmptyState";
import { BankBoard } from "@/components/views/BankBoard";

export const dynamic = "force-dynamic";

// 🏦 Banque — rapprochement prévu vs réel. Pas dans la barre de nav (règle
// Badr « minimum d'onglets ») : accessible depuis l'onglet Dépenses.
export default async function BanquePage() {
  if (getDataMode() === "unconfigured") {
    return (
      <div>
        <PageHeading emoji="🏦" title="Banque" />
        <EmptyState />
      </div>
    );
  }
  return (
    <div>
      <PageHeading
        emoji="🏦"
        title="Banque"
        subtitle="Wise + Slash — l'argent qui rentre et sort, rapproché de ce que le dashboard prévoit"
        right={
          <Link href="/depenses" className="rounded border border-line px-2 py-1 text-[10.5px] text-ink-dim hover:text-ink">
            ← Dépenses
          </Link>
        }
      />
      <Suspense fallback={<div className="h-64 animate-pulse rounded-xl border border-line bg-panel/50" />}>
        <BankLoader />
      </Suspense>
    </div>
  );
}

async function BankLoader() {
  let report: BankReport;
  try {
    report = await buildBankReport(createSupabaseServerClient());
  } catch (err) {
    return <DataError message={(err as Error).message} />;
  }
  return <BankBoard report={report} />;
}
