import Link from "next/link";
import { getDataMode, getTabDayData, HISTORY_START, referenceToday, type DayAgg } from "@/lib/data";
import type { MarketTab } from "@/lib/markets";
import { PageHeading } from "@/components/shell/PageHeading";
import { DataError } from "@/components/shell/DataError";
import { EmptyState } from "@/components/shell/EmptyState";
import { ExpenseBoard } from "@/components/views/ExpenseBoard";

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
  | { dayData: Record<MarketTab, DayAgg[]>; months: string[]; years: string[] };

async function loadData(): Promise<LoadResult> {
  try {
    const today = await referenceToday();
    const dayData = await getTabDayData(HISTORY_START, today);
    const months = monthsBetween(HISTORY_START, today);
    const startYear = Number(HISTORY_START.slice(0, 4));
    const endYear = Number(today.slice(0, 4));
    const years: string[] = [];
    for (let y = startYear; y <= endYear; y++) years.push(String(y));
    return { dayData, months, years };
  } catch (err) {
    return { error: (err as Error).message };
  }
}

export default async function ExpensePage() {
  const mode = getDataMode();
  if (mode === "unconfigured") {
    return (
      <div>
        <PageHeading emoji="🍩" title="Répartition des dépenses"  right={<Link href="/banque" className="rounded border border-line px-2 py-1 text-[10.5px] text-ink-dim hover:text-ink">🏦 Banque</Link>} />
        <EmptyState />
      </div>
    );
  }

  const result = await loadData();
  if ("error" in result) {
    return (
      <div>
        <PageHeading emoji="🍩" title="Répartition des dépenses"  right={<Link href="/banque" className="rounded border border-line px-2 py-1 text-[10.5px] text-ink-dim hover:text-ink">🏦 Banque</Link>} />
        <DataError message={result.error} />
      </div>
    );
  }

  return (
    <div>
      <PageHeading
        emoji="🍩"
        title="Répartition des dépenses"
        subtitle="Où part chaque euro de CA · donut, carrés et postes à optimiser"
      />
      <ExpenseBoard dayData={result.dayData} months={result.months} years={result.years} />
    </div>
  );
}
