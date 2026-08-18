import { describe, expect, it } from "vitest";
import {
  budgetAtDayStart,
  classifyCampaignProduct,
  computeScaling,
  MONTEE_PALIERS_CENTS,
  nextPalierCents,
  PLANCHER_BUDGET_CENTS,
  reductionCents,
  type ProductThresholdsInput,
  type ScalingDailyRow,
} from "../scaling";
import type { CampaignActivity } from "../meta";
import { roasBreakEven, roasTarget15 } from "../engine";

/**
 * 🪜 Meta Scaling — protocole de prise de décision (formation MASTER
 * ACQUISITION, leçon 35 ; arbitrage Badr 18/08 : ce protocole fait foi).
 * Propriétés verrouillées :
 *  • la DÉCISION DE LA NUIT se prend sur les fenêtres CLOSES (stable toute la
 *    journée) ; la fenêtre EN COURS (jour même) est provisoire et séparée ;
 *  • OUI (marge ≥ 15 %) → montée + compteur à zéro · NON 1 → attendre ·
 *    NON 2-3 → réduire 15 % · NON 4 → sauvetage (cadran CPC × CVR) ;
 *  • plancher 100 €/j ; une campagne qui dépense sans vendre APPARAÎT ;
 *  • budgets/mouvements reconstruits depuis le journal d'activités Meta.
 */

const TH: Record<"GILET" | "POLO", ProductThresholdsInput> = {
  POLO: { cm: 0.626, breakEven: roasBreakEven(0.626), target: roasTarget15(0.626) },
  GILET: { cm: 0.635, breakEven: roasBreakEven(0.635), target: roasTarget15(0.635) },
};

/** Jour n d'août 2026. today de référence : le 18 (jour en cours). */
const d = (n: number) => `2026-08-${String(n).padStart(2, "0")}`;
const TODAY = d(18);

function row(day: string, id: string, name: string, spendEur: number, roas: number, extra?: Partial<ScalingDailyRow>): ScalingDailyRow {
  const spendCents = Math.round(spendEur * 100);
  return {
    day,
    campaignId: id,
    campaignName: name,
    spendCents,
    purchaseValueCents: Math.round(spendCents * roas),
    purchases: 10,
    impressions: 10000,
    clicks: 200,
    reach: 8000,
    ...extra,
  };
}

const roasForMargin = (cm: number, margin: number) => 1 / (cm - margin);

/** Série jours 11→17 (clos) avec marges données ; le 18 (today) est vide sauf mention. */
function mkSeries(margins: (number | null)[], id = "c1", name = "POLO A") {
  const days = [11, 12, 13, 14, 15, 16, 17];
  const rows: ScalingDailyRow[] = [];
  days.forEach((n, i) => {
    const m = margins[Math.min(i, margins.length - 1)];
    if (m === null) return;
    rows.push(row(d(n), id, name, 100, roasForMargin(0.626, m)));
  });
  return rows;
}

describe("classifyCampaignProduct", () => {
  it("suit les conventions de nom du dashboard", () => {
    expect(classifyCampaignProduct("CBO — LANCASTER")).toBe("GILET");
    expect(classifyCampaignProduct("CBO 2 - POLO - WORLD")).toBe("POLO");
    expect(classifyCampaignProduct("CBO - NIRA - TESTING")).toBe("TESTING");
    expect(classifyCampaignProduct("PRODTEST — GOURDE")).toBe("TESTING");
  });
});

describe("échelle de montée et réduction (T35/T24)", () => {
  it("paliers de l'audio de la leçon 35", () => {
    expect(MONTEE_PALIERS_CENTS).toEqual([50000, 75000, 100000, 150000, 180000, 200000, 300000]);
    expect(nextPalierCents(30000)).toBe(50000);
    expect(nextPalierCents(50000)).toBe(75000);
    expect(nextPalierCents(200000)).toBe(300000);
    expect(nextPalierCents(300000)).toBe(390000); // +30 % au-delà
  });
  it("réduction par défaut −15 %, arrondie à l'euro, plancher 100 €", () => {
    expect(reductionCents(12800)).toBe(10900); // 128 € → 109 €
    expect(reductionCents(30000)).toBe(25500); // 300 € → 255 €
    expect(reductionCents(10500)).toBe(PLANCHER_BUDGET_CENTS);
  });
});

describe("fenêtres : closes + en cours", () => {
  it("6 fenêtres closes finissant à HIER + 1 fenêtre en cours finissant AUJOURD'HUI", () => {
    const r = computeScaling({ today: TODAY, rows: [], thresholds: TH, live: null, activities: null });
    expect(r.officialEndDay).toBe(d(17));
    expect(r.windowLabels).toEqual(["11+12", "12+13", "13+14", "14+15", "15+16", "16+17", "17+18"]);
  });

  it("la décision de la nuit ignore le jour en cours : verdict stable toute la journée", () => {
    // 7 jours clos excellents ; aujourd'hui catastrophique (attribution vide).
    const rows = [...mkSeries([0.25]), row(TODAY, "c1", "POLO A", 100, 0.1)];
    const r = computeScaling({ today: TODAY, rows, thresholds: TH, live: null, activities: null });
    const c = r.campaigns[0];
    expect(c.action).toBe("MONTER"); // la nuit a dit OUI, le jour partiel ne change rien
    expect(c.windows[c.windows.length - 1].inProgress).toBe(true);
    expect(c.liveVerdict).toBe("NON"); // mais le provisoire est visible
  });

  it("label lisible quand la fenêtre chevauche deux mois", () => {
    const r = computeScaling({ today: "2026-09-01", rows: [], thresholds: TH, live: null, activities: null });
    expect(r.windowLabels[r.windowLabels.length - 1]).toBe("31/08+01/09");
  });
});

describe("verdicts et crans (décision de la nuit)", () => {
  it("OUI → MONTER au palier suivant (et ×2 max), compteur à zéro, créas requises", () => {
    const r = computeScaling({
      today: TODAY,
      rows: mkSeries([0.2]),
      thresholds: TH,
      live: new Map([["c1", { active: true, dailyBudgetCents: 30000, updatedTime: null }]]),
      activities: [],
    });
    const c = r.campaigns[0];
    expect(c.action).toBe("MONTER");
    expect(c.cran).toBeNull();
    expect(c.suggestedCents).toBe(50000);
    expect(c.suggestedMaxCents).toBe(60000); // ×2 si tout est parfait
    expect(c.creasRequired).toBe(true);
  });

  it("1 NON isolé → ATTENDRE cran 1 ; tout NON → SAUVETAGE avec diagnostic", () => {
    const one = computeScaling({ today: TODAY, rows: [row(d(17), "c1", "POLO A", 100, 1.5)], thresholds: TH, live: null, activities: null });
    expect(one.campaigns[0].cran).toBe(1);
    expect(one.campaigns[0].action).toBe("ATTENDRE");

    const all = computeScaling({ today: TODAY, rows: mkSeries([0.05]), thresholds: TH, live: null, activities: null });
    expect(all.campaigns[0].action).toBe("SAUVETAGE");
    expect(all.campaigns[0].cran).toBe(4);
    expect(all.campaigns[0].sauvetageDiagnostic).toBeTruthy();
  });

  it("2-3 NON → REDUIRE avec UN chiffre (−15 %)", () => {
    const rows = mkSeries([0.25, 0.25, 0.25, 0.25, 0.05, 0.05, 0.05]);
    const r = computeScaling({
      today: TODAY,
      rows,
      thresholds: TH,
      live: new Map([["c1", { active: true, dailyBudgetCents: 12800, updatedTime: null }]]),
      activities: [],
    });
    expect(r.campaigns[0].action).toBe("REDUIRE");
    expect(r.campaigns[0].suggestedCents).toBe(10900); // 128 € → 109 €
  });

  it("un OUI au milieu remet le compteur à zéro", () => {
    const rows = mkSeries([0.05, 0.05, 0.05, 0.25, 0.25, 0.14, 0.14]);
    const r = computeScaling({ today: TODAY, rows, thresholds: TH, live: null, activities: null });
    expect(r.campaigns[0].action).not.toBe("SAUVETAGE");
  });

  it("un trou de diffusion CASSE la série de NON", () => {
    const rows = [row(d(11), "c1", "POLO A", 100, 1.2), row(d(12), "c1", "POLO A", 100, 1.2), row(d(17), "c1", "POLO A", 100, 1.2)];
    const r = computeScaling({ today: TODAY, rows, thresholds: TH, live: null, activities: null });
    expect(r.campaigns[0].nonStreak).toBe(1);
    expect(r.campaigns[0].action).toBe("ATTENDRE");
  });
});

describe("garde-fous", () => {
  it("dépense sans vente : la campagne APPARAÎT, zone below", () => {
    const rows = [row(d(16), "c9", "POLO MORT", 150, 0), row(d(17), "c9", "POLO MORT", 150, 0)];
    const r = computeScaling({ today: TODAY, rows, thresholds: TH, live: null, activities: null });
    expect(r.campaigns).toHaveLength(1);
    expect(r.campaigns[0].windows[5].zone).toBe("below");
    expect(r.campaigns[0].windows[5].verdict).toBe("NON");
  });

  it("cm null → AUCUN verdict inventé, warning explicite", () => {
    const NO_TH = { POLO: { cm: null, breakEven: null, target: null }, GILET: TH.GILET };
    const r = computeScaling({ today: TODAY, rows: mkSeries([0.2]), thresholds: NO_TH, live: null, activities: null });
    expect(r.campaigns).toHaveLength(0);
    expect(r.warnings.some((w) => w.includes("seuils POLO incalculables"))).toBe(true);
  });

  it("réserve d'échantillon : < 15 conversions sur la fenêtre jugée → lowSample", () => {
    const rows = [
      row(d(16), "c1", "CBO — LANCASTER", 100, 1.41, { purchases: 4 }),
      row(d(17), "c1", "CBO — LANCASTER", 100, 1.41, { purchases: 4 }),
    ];
    const r = computeScaling({ today: TODAY, rows, thresholds: TH, live: null, activities: null });
    expect(r.campaigns[0].product).toBe("GILET");
    expect(r.campaigns[0].lowSample).toBe(true);
    // BE et cible affichés sur la carte (demande Badr)
    expect(r.campaigns[0].breakEven).toBeCloseTo(1.575, 2);
    expect(r.campaigns[0].target).toBeCloseTo(2.062, 2);
  });

  it("produits en test hors protocole + budget ≥ 3 000 €/j signalé", () => {
    const testing = computeScaling({ today: TODAY, rows: [row(d(17), "t1", "CBO - NIRA - TESTING", 100, 1)], thresholds: TH, live: null, activities: null });
    expect(testing.campaigns).toHaveLength(0);
    expect(testing.warnings.some((w) => w.includes("NIRA"))).toBe(true);

    const big = computeScaling({
      today: TODAY,
      rows: mkSeries([0.2]),
      thresholds: TH,
      live: new Map([["c1", { active: true, dailyBudgetCents: 300000, updatedTime: null }]]),
      activities: [],
    });
    expect(big.campaigns[0].scalingRegime).toBe(true);
    expect(big.warnings.some((w) => w.includes("SCALING"))).toBe(true);
  });

  it("tri par urgence puis déterministe", () => {
    const rows = [
      ...[11, 12, 13, 14, 15, 16, 17].map((n) => row(d(n), "win", "POLO WIN", 100, roasForMargin(0.626, 0.25))),
      ...[11, 12, 13, 14, 15, 16, 17].map((n) => row(d(n), "dead", "POLO DEAD", 100, roasForMargin(0.626, 0.02))),
    ];
    const r = computeScaling({ today: TODAY, rows, thresholds: TH, live: null, activities: null });
    expect(r.campaigns.map((c) => c.campaignId)).toEqual(["dead", "win"]);
  });
});

describe("budgets depuis le journal d'activités Meta", () => {
  const move = (time: string, oldEur: number, newEur: number, id = "c1"): CampaignActivity => ({
    campaignId: id,
    campaignName: "POLO A",
    eventTime: time,
    kind: "budget",
    oldBudgetCents: oldEur * 100,
    newBudgetCents: newEur * 100,
    statusTo: null,
  });

  it("budgetAtDayStart : le changement fait foi à partir du jour suivant, le jour même porte le live", () => {
    // 150 € jusqu'au 17/08 23h28, puis 128 €. Live actuel : 128 €.
    const moves = [move("2026-08-17T23:28:00+0200", 150, 128)];
    const days = [d(16), d(17), TODAY];
    expect(budgetAtDayStart(moves, 12800, days)).toEqual([15000, 15000, 12800]);
  });

  it("budgetAtDayStart : plusieurs changements, valeur de départ avant le premier connu", () => {
    const moves = [move("2026-08-14T00:56:00+0200", 150, 300), move("2026-08-17T23:28:00+0200", 300, 255)];
    const days = [d(12), d(13), d(14), d(15), d(16), d(17), TODAY];
    expect(budgetAtDayStart(moves, 25500, days)).toEqual([15000, 15000, 15000, 30000, 30000, 30000, 25500]);
  });

  it("le tableau jour par jour aligne budget, spend et ROAS", () => {
    const rows = mkSeries([0.2]);
    const r = computeScaling({
      today: TODAY,
      rows,
      thresholds: TH,
      live: new Map([["c1", { active: true, dailyBudgetCents: 12800, updatedTime: null }]]),
      activities: [move("2026-08-17T23:28:00+0200", 150, 128)],
    });
    const t = r.campaigns[0].dailyTable;
    expect(t).toHaveLength(10);
    expect(t[t.length - 1].isToday).toBe(true);
    expect(t[t.length - 1].budgetCents).toBe(12800); // aujourd'hui = live
    expect(t[t.length - 2].budgetCents).toBe(15000); // hier : l'ancien budget
    expect(t[t.length - 2].spendCents).toBe(10000);
    expect(t[t.length - 2].roas).toBeCloseTo(roasForMargin(0.626, 0.2), 3);
  });

  it("les derniers mouvements Meta sont exposés, plus récents d'abord", () => {
    const r = computeScaling({
      today: TODAY,
      rows: mkSeries([0.2]),
      thresholds: TH,
      live: null,
      activities: [move("2026-08-14T00:56:00+0200", 150, 300), move("2026-08-17T23:28:00+0200", 300, 255)],
    });
    const m = r.campaigns[0].moves;
    expect(m[0].timeLabel).toBe("17/08 23h28");
    expect(m[0].newBudgetCents).toBe(25500);
    expect(m[1].timeLabel).toBe("14/08 00h56");
  });

  it("sans journal d'activités : warning, budgets estimés", () => {
    const r = computeScaling({ today: TODAY, rows: mkSeries([0.2]), thresholds: TH, live: null, activities: null });
    expect(r.warnings.some((w) => w.includes("activités Meta indisponible"))).toBe(true);
    expect(r.campaigns[0].budgetEstimated).toBe(true);
  });
});

describe("cohérence avec les seuils mémoire (WEFT §4)", () => {
  it("Polo CM 62,6 % → BE ≈ 1,60 · cible ≈ 2,10 ; Gilet 63,5 % → 1,57 / 2,06", () => {
    expect(TH.POLO.breakEven!).toBeCloseTo(1.597, 2);
    expect(TH.POLO.target!).toBeCloseTo(2.101, 2);
    expect(TH.GILET.breakEven!).toBeCloseTo(1.575, 2);
    expect(TH.GILET.target!).toBeCloseTo(2.062, 2);
  });
});
