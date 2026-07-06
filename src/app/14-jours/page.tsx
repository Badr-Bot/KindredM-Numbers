import {
  computeThresholds,
  getDataMode,
  getDayLines,
  referenceToday,
  type DayLine,
} from "@/lib/data";
import { MARKET_TABS, type MarketTab } from "@/lib/markets";
import { addDaysToDay } from "@/lib/time";
import { PageHeading } from "@/components/shell/PageHeading";
import { EmptyState } from "@/components/shell/EmptyState";
import { DayTableBoard } from "@/components/views/DayTableBoard";

export const dynamic = "force-dynamic";

export default async function Last14DaysPage() {
  const mode = getDataMode();
  if (mode === "unconfigured") {
    return (
      <div>
        <PageHeading emoji="📅" title="14 derniers jours" />
        <EmptyState />
      </div>
    );
  }

  const today = await referenceToday();
  const startDay = addDaysToDay(today, -13);
  const thresholds = await computeThresholds(today);

  const tabsData = {} as Record<MarketTab, DayLine[]>;
  for (const tab of MARKET_TABS) {
    tabsData[tab] = await getDayLines(tab, startDay, today, thresholds[tab], today);
  }

  return (
    <div>
      <PageHeading
        emoji="📅"
        title="14 derniers jours"
        subtitle="Le tableau NIVA — 1 ligne par jour, cumul du net"
      />
      <DayTableBoard tabsData={tabsData} />
    </div>
  );
}
