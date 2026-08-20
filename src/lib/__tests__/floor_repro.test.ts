import { describe, expect, it } from "vitest";
import { computeScaling, type ProductThresholdsInput, type ScalingDailyRow } from "../scaling";
import { roasBreakEven, roasTarget15 } from "../engine";

const TH: Record<"GILET" | "POLO", ProductThresholdsInput> = {
  POLO: { cm: 0.626, breakEven: roasBreakEven(0.626), target: roasTarget15(0.626) },
  GILET: { cm: 0.635, breakEven: roasBreakEven(0.635), target: roasTarget15(0.635) },
};
const d = (n: number) => `2026-08-${String(n).padStart(2, "0")}`;
const TODAY = d(18);
const roasForMargin = (cm: number, margin: number) => 1 / (cm - margin);
function row(day: string, spendEur: number, roas: number): ScalingDailyRow {
  const spendCents = Math.round(spendEur * 100);
  return { day, campaignId: "c1", campaignName: "POLO A", spendCents,
    purchaseValueCents: Math.round(spendCents * roas), purchases: 10, impressions: 10000, clicks: 200, reach: 8000 };
}
const live = new Map([["c1", { active: true, dailyBudgetCents: 10000, updatedTime: null }]]);

describe("plancher 100 €/j en pré-scaling", () => {
  it("2 NON au plancher", () => {
    const rows = [...[12, 13, 14].map((n) => row(d(n), 100, roasForMargin(0.626, 0.25))),
      ...[15, 16, 17].map((n) => row(d(n), 100, roasForMargin(0.626, -0.1))),
      row(TODAY, 100, roasForMargin(0.626, -0.1))];
    const c = computeScaling({ today: TODAY, rows, thresholds: TH, live, activities: [] }).campaigns[0];
    console.log("2NON:", { action: c.action, nonStreak: c.nonStreak, cran: c.cran, budget: c.budgetCents, sugg: c.suggestedCents, capped: c.rescueCapped });
  });
  it("4+ NON au plancher, aucune réduction exécutée", () => {
    const rows = [...[11, 12, 13, 14, 15, 16, 17].map((n) => row(d(n), 100, roasForMargin(0.626, -0.1))),
      row(TODAY, 100, roasForMargin(0.626, -0.1))];
    const c = computeScaling({ today: TODAY, rows, thresholds: TH, live, activities: [] }).campaigns[0];
    console.log("4NON:", { action: c.action, nonStreak: c.nonStreak, cran: c.cran, budget: c.budgetCents, sugg: c.suggestedCents, capped: c.rescueCapped, why: c.why });
  });
  it("4+ NON hors plancher (contrôle)", () => {
    const rows = [...[11, 12, 13, 14, 15, 16, 17].map((n) => row(d(n), 100, roasForMargin(0.626, -0.1))),
      row(TODAY, 100, roasForMargin(0.626, -0.1))];
    const c = computeScaling({ today: TODAY, rows, thresholds: TH,
      live: new Map([["c1", { active: true, dailyBudgetCents: 30000, updatedTime: null }]]), activities: [] }).campaigns[0];
    console.log("4NON-300:", { action: c.action, capped: c.rescueCapped, sugg: c.suggestedCents });
  });
});
