import {
  fetchChargebacks,
  fetchUnmappedCampaigns,
  getDataMode,
  getTabDayData,
  HISTORY_START,
  referenceToday,
  type Chargeback,
  type DataMode,
  type DayAgg,
  type UnmappedCampaign,
} from "@/lib/data";
import type { MarketTab } from "@/lib/markets";
import { PageHeading } from "@/components/shell/PageHeading";
import { DataError } from "@/components/shell/DataError";
import { EmptyState } from "@/components/shell/EmptyState";
import { ControlBoard } from "@/components/views/ControlBoard";
import { UnmappedSpend } from "@/components/views/UnmappedSpend";

export const dynamic = "force-dynamic";

function monthsBetween(start: string, end: string): string[] {
  const out: string[] = [];
  let [y, m] = [Number(start.slice(0, 4)), Number(start.slice(5, 7))];
  const [ey, em] = [Number(end.slice(0, 4)), Number(end.slice(5, 7))];
  while (y < ey || (y === ey && m <= em)) {
    out.push(`${y}-${String(m).padStart(2, "0")}`);
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
  return out;
}

type LoadResult =
  | { error: string }
  | {
      dayData: Record<MarketTab, DayAgg[]>;
      chargebacks: Chargeback[];
      unmappedCampaigns: UnmappedCampaign[];
      months: string[];
      years: string[];
    };

async function loadData(): Promise<LoadResult> {
  try {
    const today = await referenceToday();
    const [dayData, chargebacks, unmappedCampaigns] = await Promise.all([
      getTabDayData(HISTORY_START, today),
      fetchChargebacks(HISTORY_START, today),
      fetchUnmappedCampaigns(),
    ]);
    const months = monthsBetween(HISTORY_START, today);
    const startYear = Number(HISTORY_START.slice(0, 4));
    const endYear = Number(today.slice(0, 4));
    const years: string[] = [];
    for (let y = startYear; y <= endYear; y++) years.push(String(y));
    return { dayData, chargebacks, unmappedCampaigns, months, years };
  } catch (err) {
    return { error: (err as Error).message };
  }
}

export default async function ControlPage() {
  const mode: DataMode = getDataMode();
  if (mode === "unconfigured") {
    return (
      <div>
        <PageHeading emoji="🛡️" title="Contrôle" />
        <EmptyState />
      </div>
    );
  }

  const result = await loadData();
  if ("error" in result) {
    return (
      <div>
        <PageHeading emoji="🛡️" title="Contrôle" />
        <DataError message={result.error} />
      </div>
    );
  }

  return (
    <div>
      <PageHeading
        emoji="🛡️"
        title="Contrôle"
        subtitle="Remboursements & rétrofacturations — tout maîtriser"
      />
      <ControlBoard
        mode={mode}
        dayData={result.dayData}
        chargebacks={result.chargebacks}
        months={result.months}
        years={result.years}
      />
      <div className="mt-3">
        <UnmappedSpend mode={mode} campaigns={result.unmappedCampaigns} />
      </div>
    </div>
  );
}
