import { getDataMode, getTabDayData, HISTORY_START, referenceToday } from "@/lib/data";
import { PageHeading } from "@/components/shell/PageHeading";
import { EmptyState } from "@/components/shell/EmptyState";
import { YearBoard } from "@/components/views/YearBoard";

export const dynamic = "force-dynamic";

export default async function YearPage() {
  const mode = getDataMode();
  if (mode === "unconfigured") {
    return (
      <div>
        <PageHeading emoji="📈" title="Par année" />
        <EmptyState />
      </div>
    );
  }

  const today = await referenceToday();
  const dayData = await getTabDayData(HISTORY_START, today);

  const startYear = Number(HISTORY_START.slice(0, 4));
  const endYear = Number(today.slice(0, 4));
  const years: string[] = [];
  for (let y = startYear; y <= endYear; y++) years.push(String(y));

  return (
    <div>
      <PageHeading emoji="📈" title="Par année" subtitle="1 ligne par mois · totaux annuels" />
      <YearBoard dayData={dayData} years={years} historyStart={HISTORY_START} />
    </div>
  );
}
