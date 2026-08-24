import { getProductSplitForRange, type ProductSplitCard } from "@/lib/analytics";
import { getDataMode, getTabDayData, HISTORY_START, referenceToday, type Totals } from "@/lib/data";
import { addDaysToDay } from "@/lib/time";
import { PageHeading } from "@/components/shell/PageHeading";
import { DataError } from "@/components/shell/DataError";
import { EmptyState } from "@/components/shell/EmptyState";
import { ProductBoard, type PeriodKey } from "@/components/views/ProductBoard";

export const dynamic = "force-dynamic";

const EMPTY: Totals = {
  orders: 0, caCents: 0, spendCents: 0, cogsCents: 0, cogsProductCents: 0, cogsUpsellsCents: 0,
  taxCents: 0, feesCents: 0, netCents: 0, refundedCents: 0,
};

const HEADING = { emoji: "🎽", title: "Par produit" } as const;

/** Bornes de chaque période proposée (fin = aujourd'hui, jour en cours inclus). */
function ranges(today: string): Record<PeriodKey, { start: string; end: string }> {
  return {
    "7j": { start: addDaysToDay(today, -6), end: today },
    "30j": { start: addDaysToDay(today, -29), end: today },
    mois: { start: `${today.slice(0, 7)}-01`, end: today },
    tout: { start: HISTORY_START, end: today },
  };
}

type LoadResult =
  | { error: string }
  | {
      byPeriod: Record<PeriodKey, ProductSplitCard[]>;
      rangeByPeriod: Record<PeriodKey, { start: string; end: string }>;
    };

async function loadData(): Promise<LoadResult> {
  try {
    const today = await referenceToday();
    const rangeByPeriod = ranges(today);
    // Une seule lecture des agrégats journaliers (la plus large), re-découpée
    // ensuite par période : le Global de chaque bloc doit venir de la MÊME
    // source que le reste du dashboard, sinon le split ne somme plus.
    const dayData = await getTabDayData(HISTORY_START, today);
    const globalRows = dayData.GLOBAL;

    const sumRange = (start: string, end: string): Totals =>
      globalRows
        .filter((r) => r.day >= start && r.day <= end)
        .reduce<Totals>(
          (a, r) => ({
            orders: a.orders + r.orders,
            caCents: a.caCents + r.caCents,
            spendCents: a.spendCents + r.spendCents,
            cogsCents: a.cogsCents + r.cogsCents,
            cogsProductCents: a.cogsProductCents + r.cogsProductCents,
            cogsUpsellsCents: a.cogsUpsellsCents + r.cogsUpsellsCents,
            taxCents: a.taxCents + r.taxCents,
            feesCents: a.feesCents + r.feesCents,
            // netCents n'est jamais utilisé par le split (chaque carte
            // recalcule le sien) : les charges fixes déjà déduites ici par
            // getTabDayData ne polluent donc pas les blocs produit.
            netCents: a.netCents + r.netCents,
            refundedCents: a.refundedCents + r.refundedCents,
          }),
          { ...EMPTY }
        );

    const keys: PeriodKey[] = ["7j", "30j", "mois", "tout"];
    const splits = await Promise.all(
      keys.map((k) =>
        getProductSplitForRange(rangeByPeriod[k].start, rangeByPeriod[k].end, sumRange(rangeByPeriod[k].start, rangeByPeriod[k].end)).catch(
          () => [] as ProductSplitCard[]
        )
      )
    );
    const byPeriod = Object.fromEntries(keys.map((k, i) => [k, splits[i]])) as Record<
      PeriodKey,
      ProductSplitCard[]
    >;
    return { byPeriod, rangeByPeriod };
  } catch (err) {
    return { error: (err as Error).message };
  }
}

export default async function ProductsPage() {
  const mode = getDataMode();
  if (mode === "unconfigured") {
    return (
      <div>
        <PageHeading {...HEADING} />
        <EmptyState />
      </div>
    );
  }

  const result = await loadData();
  if ("error" in result) {
    return (
      <div>
        <PageHeading {...HEADING} />
        <DataError message={result.error} />
      </div>
    );
  }

  return (
    <div>
      <PageHeading
        {...HEADING}
        subtitle="Ce que chaque produit rapporte seul · MER, ROAS UTM et ROAS Meta côte à côte"
      />
      <ProductBoard byPeriod={result.byPeriod} rangeByPeriod={result.rangeByPeriod} />
    </div>
  );
}
