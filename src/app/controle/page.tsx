import { Suspense } from "react";
import { fetchUnmappedCampaigns, getDataMode, getTabDayData, HISTORY_START, referenceToday, type DataMode } from "@/lib/data";
import { buildBankReport, CONTROLE_START_DAY, type BankReport } from "@/lib/bank";
import { associateTotalsSinceStart } from "@/lib/associates";
import { fixedCostsCentsForDay } from "@/lib/subscriptions";
import { listParisDays } from "@/lib/time";
import { MARKETS } from "@/lib/markets";
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
          <BankSection mode={mode} unmappedCount={unmappedCampaigns.length} />
        </Suspense>
      </section>

      <section>
        <h2 className="mb-2 text-[12px] font-extrabold uppercase tracking-wider text-ink-dim">📡 Spend non affecté</h2>
        <UnmappedSpend mode={mode} campaigns={unmappedCampaigns} />
      </section>
    </div>
  );
}

// Nets cumulés par associé (même arithmétique que l'onglet Année) — pour le
// bloc « à qui appartient l'argent des comptes » (règle Badr 19/08 : part
// Badr = son net Année, le reste = Adnane). Échec ⇒ null, le bloc s'efface.
async function loadAssociateTotals(): Promise<{ badrCents: number; adnaneCents: number; netDepuisCents: number | null } | null> {
  try {
    const today = await referenceToday();
    const dayData = await getTabDayData(HISTORY_START, today);
    const flat: { market: (typeof MARKETS)[number]; day: string; netCents: number }[] = [];
    for (const m of MARKETS) for (const r of dayData[m]) flat.push({ market: m, day: r.day, netCents: r.netCents });
    const lastDay = dayData.GLOBAL.reduce((max, r) => (r.day > max ? r.day : max), "");
    const t = associateTotalsSinceStart(flat, HISTORY_START, lastDay || HISTORY_START);
    // Net THÉORIQUE du dashboard sur la fenêtre de contrôle (dès le 01/08) :
    // net GLOBAL − charges fixes étalées — comparé à la marge réelle
    // encaissée dans le bloc « comptable » du Contrôle.
    let netDepuis = dayData.GLOBAL.filter((r) => r.day >= CONTROLE_START_DAY).reduce((a, r) => a + r.netCents, 0);
    if (lastDay >= CONTROLE_START_DAY) {
      for (const day of listParisDays(CONTROLE_START_DAY, lastDay)) netDepuis -= fixedCostsCentsForDay(day);
    }
    return { badrCents: t.badrCents, adnaneCents: t.adnaneCents, netDepuisCents: netDepuis };
  } catch {
    return null;
  }
}

async function BankSection({ mode, unmappedCount }: { mode: DataMode; unmappedCount: number }) {
  let report: BankReport;
  let annee: { badrCents: number; adnaneCents: number; netDepuisCents: number | null } | null = null;
  try {
    // mode démo : buildBankReport(null) sert des données synthétiques
    [report, annee] = await Promise.all([
      buildBankReport(mode === "demo" ? null : createSupabaseServerClient()),
      loadAssociateTotals(),
    ]);
  } catch (err) {
    return <DataError message={(err as Error).message} />;
  }
  return <BankBoard report={report} unmappedCount={unmappedCount} annee={annee} />;
}
