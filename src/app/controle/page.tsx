import {
  fetchChargebacks,
  getDataMode,
  getTabDayData,
  HISTORY_START,
  referenceToday,
} from "@/lib/data";
import { PageHeading } from "@/components/shell/PageHeading";
import { EmptyState } from "@/components/shell/EmptyState";
import { ControlBoard } from "@/components/views/ControlBoard";

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

export default async function ControlPage() {
  const mode = getDataMode();
  if (mode === "unconfigured") {
    return (
      <div>
        <PageHeading emoji="🛡️" title="Contrôle" />
        <EmptyState />
      </div>
    );
  }

  const today = await referenceToday();
  const [dayData, chargebacks] = await Promise.all([
    getTabDayData(HISTORY_START, today),
    fetchChargebacks(HISTORY_START, today),
  ]);
  const months = monthsBetween(HISTORY_START, today);
  const startYear = Number(HISTORY_START.slice(0, 4));
  const endYear = Number(today.slice(0, 4));
  const years: string[] = [];
  for (let y = startYear; y <= endYear; y++) years.push(String(y));

  return (
    <div>
      <PageHeading
        emoji="🛡️"
        title="Contrôle"
        subtitle="Remboursements & rétrofacturations — tout maîtriser"
      />
      <ControlBoard mode={mode} dayData={dayData} chargebacks={chargebacks} months={months} years={years} />
    </div>
  );
}
