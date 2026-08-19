import { Suspense } from "react";
import { fetchUnmappedCampaigns, getDataMode, type DataMode } from "@/lib/data";
import { buildBankReport, type BankReport } from "@/lib/bank";
import { createSupabaseServerClient } from "@/lib/supabase";
import { PageHeading } from "@/components/shell/PageHeading";
import { DataError } from "@/components/shell/DataError";
import { EmptyState } from "@/components/shell/EmptyState";
import { UnmappedSpend } from "@/components/views/UnmappedSpend";
import { BankBoard } from "@/components/views/BankBoard";

export const dynamic = "force-dynamic";

// 🛃 Contrôle — l'onglet de VÉRIFICATION (demande Badr 19/08 : « il faudra un
// onglet à part de contrôle ») : est-ce que l'argent qui rentre et sort colle
// avec ce que le dashboard prévoit, et est-ce que toutes les campagnes Meta
// sont bien rattachées à un marché. Historique : cette page avait été retirée
// de la nav le 08/08 (« l'onglet Contrôle sert à rien ») quand elle ne
// portait que l'affectation de campagnes — elle revient en nav maintenant
// qu'elle porte le rapprochement bancaire.
export default async function ControlPage() {
  const mode: DataMode = getDataMode();
  if (mode === "unconfigured") {
    return (
      <div>
        <PageHeading emoji="🛃" title="Contrôle" />
        <EmptyState />
      </div>
    );
  }

  const unmappedCampaigns = await fetchUnmappedCampaigns();

  return (
    <div>
      <PageHeading
        emoji="🛃"
        title="Contrôle"
        subtitle="Banque (prévu vs réel) · campagnes Meta non affectées — lecture seule"
      />

      <section className="mb-6">
        <h2 className="mb-2 text-[12px] font-extrabold uppercase tracking-wider text-ink-dim">🏦 Banque — l&apos;argent qui rentre et sort</h2>
        <Suspense fallback={<div className="h-64 animate-pulse rounded-xl border border-line bg-panel/50" />}>
          <BankSection />
        </Suspense>
      </section>

      <section>
        <h2 className="mb-2 text-[12px] font-extrabold uppercase tracking-wider text-ink-dim">📡 Spend non affecté</h2>
        <UnmappedSpend mode={mode} campaigns={unmappedCampaigns} />
      </section>
    </div>
  );
}

async function BankSection() {
  let report: BankReport;
  try {
    report = await buildBankReport(createSupabaseServerClient());
  } catch (err) {
    return <DataError message={(err as Error).message} />;
  }
  return <BankBoard report={report} />;
}
