import Link from "next/link";
import {
  computeThresholds,
  getDataMode,
  getDayLines,
  HISTORY_START,
  referenceToday,
  type DayLine,
} from "@/lib/data";
import { MARKET_TABS, type MarketTab } from "@/lib/markets";
import { addDaysToDay } from "@/lib/time";
import { PageHeading } from "@/components/shell/PageHeading";
import { EmptyState } from "@/components/shell/EmptyState";
import { DayTableBoard } from "@/components/views/DayTableBoard";

export const dynamic = "force-dynamic";

export default async function Last14DaysPage({
  searchParams,
}: {
  searchParams: Promise<{ full?: string }>;
}) {
  const mode = getDataMode();
  if (mode === "unconfigured") {
    return (
      <div>
        <PageHeading emoji="📅" title="14 derniers jours" />
        <EmptyState />
      </div>
    );
  }

  const { full } = await searchParams;
  const showFull = full === "1";
  const today = await referenceToday();
  const startDay = showFull ? HISTORY_START : addDaysToDay(today, -13);
  const thresholds = await computeThresholds(today);

  const tabsData = {} as Record<MarketTab, DayLine[]>;
  for (const tab of MARKET_TABS) {
    tabsData[tab] = await getDayLines(tab, startDay, today, thresholds[tab], today);
  }

  return (
    <div>
      <PageHeading
        emoji="📅"
        title={showFull ? "Tout l'historique" : "14 derniers jours"}
        subtitle="Le tableau NIVA — 1 ligne par jour, cumul du net"
        right={
          <Link
            href={showFull ? "/14-jours" : "/14-jours?full=1"}
            className="rounded border border-line px-2 py-1 text-[11px] text-ink-dim transition-colors hover:border-phosphor hover:text-phosphor"
          >
            {showFull ? "→ 14 jours" : "→ tout l'historique"}
          </Link>
        }
      />
      <DayTableBoard tabsData={tabsData} showTrend={!showFull} />
    </div>
  );
}
