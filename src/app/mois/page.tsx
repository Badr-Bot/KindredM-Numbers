import { getDataMode, getTabDayData, HISTORY_START, referenceToday } from "@/lib/data";
import { PageHeading } from "@/components/shell/PageHeading";
import { EmptyState } from "@/components/shell/EmptyState";
import { MonthBoard } from "@/components/views/MonthBoard";

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

export default async function MonthPage() {
  const mode = getDataMode();
  if (mode === "unconfigured") {
    return (
      <div>
        <PageHeading emoji="🗓️" title="Par mois" />
        <EmptyState />
      </div>
    );
  }

  const today = await referenceToday();
  const dayData = await getTabDayData(HISTORY_START, today);
  const months = monthsBetween(HISTORY_START, today);

  return (
    <div>
      <PageHeading emoji="🗓️" title="Par mois" subtitle="CA (barres) · marge (ligne) · Δ vs mois précédent" />
      <MonthBoard dayData={dayData} months={months} />
    </div>
  );
}
