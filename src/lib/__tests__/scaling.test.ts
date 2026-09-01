import { describe, expect, it } from "vitest";
import {
  type AdDailyRow,
  budgetAtDayStart,
  classifyCampaignProduct,
  computeScaling,
  decisionDayFor,
  MONTEE_PALIERS_CENTS,
  nextPalierCents,
  PLANCHER_BUDGET_CENTS,
  reductionCents,
  repairMoves,
  scaleTargetCents,
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

/**
 * Budget AU PLANCHER (100 €/j) — condition du SAUVETAGE depuis le 29/08
 * (T35 [04:29] : « garder minimum 100 euros de budget », [17:33] : « on ne
 * baisse plus, on repasse en phase de sauvetage »). Un budget non lu sur Meta
 * (`live: null`) est « estimé » et ne peut JAMAIS affirmer le plancher : les
 * scénarios de sauvetage doivent donc fournir un budget live.
 */
const AU_PLANCHER = new Map([
  ["c1", { active: true, dailyBudgetCents: PLANCHER_BUDGET_CENTS, updatedTime: null }],
]);

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
    expect(MONTEE_PALIERS_CENTS).toEqual([50000, 75000, 100000, 150000, 185000, 225000, 300000]);
    expect(nextPalierCents(30000)).toBe(50000);
    expect(nextPalierCents(50000)).toBe(75000);
    expect(nextPalierCents(225000)).toBe(300000);
    expect(nextPalierCents(300000)).toBe(390000); // +30 % au-delà
  });
  it("réduction par défaut −15 %, arrondie à l'euro, plancher 100 €", () => {
    expect(reductionCents(12800)).toBe(10900); // 128 € → 109 €
    expect(reductionCents(30000)).toBe(25500); // 300 € → 255 €
    expect(reductionCents(10500)).toBe(PLANCHER_BUDGET_CENTS);
  });
  it("montée : ×2 plafonné à 500 € sous 500, palier par palier au-dessus (lecture Badr)", () => {
    expect(scaleTargetCents(20000)).toBe(40000); // 200 → 400 (×2, sous le plafond)
    expect(scaleTargetCents(30000)).toBe(50000); // 300 → ×2 = 600 plafonné à 500
    expect(scaleTargetCents(50000)).toBe(75000); // dès 500 : palier suivant
    expect(scaleTargetCents(127_50)).toBe(25500); // 127,50 → ×2 = 255
  });
  it("bascule 7 h : avant 7 h le jour de décision est HIER", () => {
    expect(decisionDayFor(TODAY, 0)).toBe(d(17));
    expect(decisionDayFor(TODAY, 6)).toBe(d(17));
    expect(decisionDayFor(TODAY, 7)).toBe(TODAY);
    expect(decisionDayFor(TODAY, 15)).toBe(TODAY);
  });
});

describe("fenêtres : hier + aujourd'hui en dernier", () => {
  it("6 fenêtres 2 jours, la dernière = hier + aujourd'hui (en cours)", () => {
    const r = computeScaling({ today: TODAY, rows: [], thresholds: TH, live: null, activities: null });
    expect(r.windowLabels).toEqual(["12+13", "13+14", "14+15", "15+16", "16+17", "17+18"]);
  });

  it("la décision se prend sur hier + aujourd'hui et bouge en live (formation : les 2 derniers jours)", () => {
    // Jours 12-17 excellents ; aujourd'hui bon aussi → la fenêtre 17+18 est
    // jugée avec le jour même dedans, flag en cours.
    const rows = [...mkSeries([0.25]), row(TODAY, "c1", "POLO A", 100, roasForMargin(0.626, 0.25))];
    const r = computeScaling({ today: TODAY, rows, thresholds: TH, live: null, activities: null });
    const c = r.campaigns[0];
    expect(c.action).toBe("SCALE");
    const lastW = c.windows[c.windows.length - 1];
    expect(lastW.inProgress).toBe(true);
    expect(lastW.verdict).toBe("OUI");
    // Le verdict signale la fenêtre non close par ⏳ (texte raccourci le
    // 29/08 : la carte affiche déjà le libellé de la fenêtre juste au-dessus).
    expect(c.why).toContain("⏳");
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
    expect(c.action).toBe("SCALE");
    expect(c.cran).toBeNull();
    expect(c.suggestedCents).toBe(50000); // 300 → ×2 = 600 plafonné à 500
    expect(c.creasRequired).toBe(true);
  });

  it("1 NON isolé → ATTENDRE cran 1 ; tout NON → SAUVETAGE avec diagnostic", () => {
    const one = computeScaling({ today: TODAY, rows: [row(TODAY, "c1", "POLO A", 100, 1.5)], thresholds: TH, live: null, activities: null });
    expect(one.campaigns[0].cran).toBe(1);
    expect(one.campaigns[0].action).toBe("HOLD");

    const all = computeScaling({ today: TODAY, rows: mkSeries([-0.1]), thresholds: TH, live: AU_PLANCHER, activities: null });
    expect(all.campaigns[0].action).toBe("RESCUE");
    expect(all.campaigns[0].cran).toBe(4);
    expect(all.campaigns[0].sauvetageDiagnostic).toBeTruthy();
  });

  it("2-3 NON → REDUIRE avec UN chiffre (−15 %)", () => {
    const rows = mkSeries([0.25, 0.25, 0.25, 0.25, -0.1, -0.1, -0.1]);
    const r = computeScaling({
      today: TODAY,
      rows,
      thresholds: TH,
      live: new Map([["c1", { active: true, dailyBudgetCents: 12800, updatedTime: null }]]),
      activities: [],
    });
    expect(r.campaigns[0].action).toBe("DESCALE");
    expect(r.campaigns[0].suggestedCents).toBe(10900); // 128 € → 109 €
  });

  it("un OUI au milieu remet le compteur à zéro", () => {
    const rows = mkSeries([-0.1, -0.1, -0.1, 0.25, 0.25, 0.14, 0.14]);
    const r = computeScaling({ today: TODAY, rows, thresholds: TH, live: null, activities: null });
    expect(r.campaigns[0].action).not.toBe("RESCUE");
  });

  it("un trou de diffusion CASSE la série de NON (relance ≠ sauvetage)", () => {
    // NON les 12-13, pause, relance aujourd'hui en NON : la vieille série ne
    // compte plus — jamais RESCUE après une relance.
    const rows = [row(d(12), "c1", "POLO A", 100, 1.2), row(d(13), "c1", "POLO A", 100, 1.2), row(TODAY, "c1", "POLO A", 100, 1.2)];
    const r = computeScaling({ today: TODAY, rows, thresholds: TH, live: null, activities: null });
    expect(r.campaigns[0].nonStreak).toBe(1);
    expect(r.campaigns[0].action).toBe("HOLD");
  });
});

describe("protocole du board : pré-scaling binaire (§2) vs table de marge (§3)", () => {
  const withBudget = (rows: ScalingDailyRow[], budgetCents: number) =>
    computeScaling({
      today: TODAY,
      rows,
      thresholds: TH,
      live: new Map([["c1", { active: true, dailyBudgetCents: budgetCents, updatedTime: null }]]),
      activities: [],
    });



  it("pré-scaling : marge 0-10 % = NON → cran 1 de l'escalier (on attend 24 h)", () => {
    // rentable jusqu'au bout, puis UNE fenêtre à 7 % : sous 15 % = NON
    const c = withBudget(mkSeries([0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.08]), 30000).campaigns[0];
    expect(c.action).toBe("HOLD");
    expect(c.why).toContain("cran 1");
    expect(c.nonStreak).toBe(1); // sous 15 % = NON, le cran est consommé
    expect(c.suggestedCents).toBeNull(); // on ne touche pas au budget au cran 1
  });

  it("pré-scaling : marge 10-15 % est un NON aussi — aucune bande intermédiaire", () => {
    const c = withBudget(mkSeries([0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.12]), 30000).campaigns[0];
    expect(c.action).toBe("HOLD");
    expect(c.nonStreak).toBe(1);
  });

  it("pré-scaling : marge ≥ 15 % = OUI → échelle, ×2 si petit", () => {
    const c = withBudget(mkSeries([0.2]), 30000).campaigns[0];
    expect(c.action).toBe("SCALE");
    expect(c.scaleKind).toBe("LADDER");
    expect(c.suggestedCents).toBe(50000); // 300 ×2 = 600 → plafonné au 1er palier
  });

  it("pré-scaling : 35 % de marge monte d'UN palier, jamais en doublant (§3 ne s'applique pas)", () => {
    const c = withBudget(mkSeries([0.35]), 80000).campaigns[0]; // 800 €/j
    expect(c.scaleKind).toBe("LADDER");
    expect(c.suggestedCents).toBe(100000); // 800 → palier 1000
  });

  it("pré-scaling : le palier 1850 puis 2250 (board), pas 1800/2000 (audio)", () => {
    expect(withBudget(mkSeries([0.2]), 150000).campaigns[0].suggestedCents).toBe(185000);
    expect(withBudget(mkSeries([0.2]), 185000).campaigns[0].suggestedCents).toBe(225000);
  });

  it("scaling (≥ 3 000 €/j) : marge > 30 % → doubler (table §3)", () => {
    const c = withBudget(mkSeries([0.35]), 300000).campaigns[0];
    expect(c.action).toBe("SCALE");
    expect(c.scaleKind).toBe("DOUBLE");
  });

  it("scaling : marge 10-15 % → Hold (table §3)", () => {
    const c = withBudget(mkSeries([0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.12]), 400000).campaigns[0];
    expect(c.action).toBe("HOLD");
    expect(c.why).toContain("stabilise");
  });

  it("une fenêtre sous 15 % ne casse PLUS la série de NON (la question du board est binaire)", () => {
    const rows = [
      ...[12, 13, 14].map((n) => row(d(n), "c1", "POLO A", 100, roasForMargin(0.626, -0.1))),
      ...[15, 16].map((n) => row(d(n), "c1", "POLO A", 100, roasForMargin(0.626, 0.07))),
      ...[17].map((n) => row(d(n), "c1", "POLO A", 100, roasForMargin(0.626, -0.1))),
      row(TODAY, "c1", "POLO A", 100, roasForMargin(0.626, -0.1)),
    ];
    const r = computeScaling({ today: TODAY, rows, thresholds: TH, live: null, activities: null });
    expect(r.campaigns[0].nonStreak).toBeGreaterThanOrEqual(4);
  });
});

describe("bugs bloquants trouvés à l'audit du 20/08", () => {
  const withBudget = (rows: ScalingDailyRow[], budgetCents: number) =>
    computeScaling({
      today: TODAY,
      rows,
      thresholds: TH,
      live: new Map([["c1", { active: true, dailyBudgetCents: budgetCents, updatedTime: null }]]),
      activities: [],
    });

  it("le « doubler » du §3 ne prescrit JAMAIS une baisse (plus de plafond au seuil de régime)", () => {
    // 4 000 €/j, marge 35 % → bande 30 %+ → doubler. Le plafond à 3 000 qui
    // traînait faisait prescrire 3 000, soit une RÉDUCTION de 25 %.
    const c = withBudget(mkSeries([0.35]), 400000).campaigns[0];
    expect(c.scaleKind).toBe("DOUBLE");
    expect(c.suggestedCents).toBe(800000);
    expect(c.suggestedCents!).toBeGreaterThan(400000); // une montée, jamais une baisse
  });

  it("une fenêtre NON tronquée par l'ancre ne devient pas un SCALE", () => {
    // Toutes les fenêtres sont en perte, mais le départ du protocole est
    // POSTÉRIEUR à la dernière : la série est tronquée à zéro. Le verdict ne
    // doit surtout pas être « monter le budget » sur une campagne en perte.
    const rows = [...mkSeries([-0.1]), row(TODAY, "c1", "POLO A", 100, roasForMargin(0.626, -0.1))];
    const r = computeScaling({
      today: TODAY,
      rows,
      thresholds: TH,
      live: null,
      activities: null,
      protocolStartDay: TODAY,
    });
    const c = r.campaigns[0];
    expect(c.action).not.toBe("SCALE");
    expect(c.nonStreak).toBeGreaterThanOrEqual(1); // la fenêtre jugée EST le cran courant
  });
});

describe("garde-fous", () => {
  it("dépense sans vente : la campagne APPARAÎT, zone below", () => {
    const rows = [row(d(17), "c9", "POLO MORT", 150, 0), row(TODAY, "c9", "POLO MORT", 150, 0)];
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
      row(d(17), "c1", "CBO — LANCASTER", 100, 1.41, { purchases: 4 }),
      row(TODAY, "c1", "CBO — LANCASTER", 100, 1.41, { purchases: 4 }),
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

describe("ancrage RESCUE (règle Badr : tout démarre au premier vrai mouvement)", () => {
  const move = (time: string, oldEur: number, newEur: number, id = "c1") => ({
    campaignId: id,
    campaignName: "POLO A",
    eventTime: time,
    kind: "budget" as const,
    oldBudgetCents: oldEur * 100,
    newBudgetCents: newEur * 100,
    statusTo: null,
  });

  it("série de NON mais budget PAS au plancher → on continue à réduire, jamais RESCUE", () => {
    // Règle du 29/08 (Badr : « mes campagnes restent rentables, je vais pas
    // faire rescue ») : tant qu'on peut baisser, on baisse.
    const rows = [...mkSeries([-0.1]), row(TODAY, "c1", "POLO A", 100, roasForMargin(0.626, -0.1))];
    const r = computeScaling({
      today: TODAY,
      rows,
      thresholds: TH,
      live: new Map([["c1", { active: true, dailyBudgetCents: 60000, updatedTime: null }]]),
      activities: [],
    });
    expect(r.campaigns[0].action).toBe("DESCALE");
    expect(r.campaigns[0].why).toContain("pas au plancher");
  });

  it("le streak ne compte qu'à partir du premier mouvement de budget réel", () => {
    // NON depuis le 12, mais premier mouvement le 17 → seules les fenêtres
    // finissant le 17+ comptent : streak 2 → DESCALE cran 2, pas RESCUE.
    const rows = [...mkSeries([-0.1]), row(TODAY, "c1", "POLO A", 100, roasForMargin(0.626, -0.1))];
    const r = computeScaling({
      today: TODAY,
      rows,
      thresholds: TH,
      live: null,
      activities: [move("2026-08-17T23:28:00+0200", 150, 128)],
    });
    expect(r.campaigns[0].nonStreak).toBe(2);
    expect(r.campaigns[0].action).toBe("DESCALE");
  });

  it("RESCUE une fois l'escalier descendu jusqu'au plancher", () => {
    const rows = [...mkSeries([-0.1]), row(TODAY, "c1", "POLO A", 100, roasForMargin(0.626, -0.1))];
    const r = computeScaling({
      today: TODAY,
      rows,
      thresholds: TH,
      live: AU_PLANCHER,
      activities: [
        move("2026-08-12T00:30:00+0200", 300, 255),
        move("2026-08-13T00:30:00+0200", 255, 216),
        move("2026-08-14T00:30:00+0200", 216, 184),
      ],
    });
    expect(r.campaigns[0].action).toBe("RESCUE");
  });

  it("mode nuit (liveDay=false) : fenêtres figées finissant au jour de décision, rien en cours", () => {
    const r = computeScaling({ today: d(17), rows: mkSeries([0.2]), thresholds: TH, live: null, activities: null, liveDay: false });
    expect(r.mode).toBe("night");
    expect(r.windowLabels[r.windowLabels.length - 1]).toBe("16+17");
    expect(r.campaigns[0].windows.every((w) => !w.inProgress)).toBe(true);
  });
});

describe("campagne lancée aujourd'hui", () => {
  it("jugeable dès aujourd'hui (fenêtre hier+aujourd'hui), jamais de RESCUE fabriqué", () => {
    const rows = [row(TODAY, "new1", "POLO NEUVE", 100, 0.5)];
    const r = computeScaling({ today: TODAY, rows, thresholds: TH, live: null, activities: null });
    expect(r.campaigns).toHaveLength(1);
    expect(r.campaigns[0].action).toBe("HOLD"); // 1er NON, cran 1
    expect(r.campaigns[0].windows[5].inProgress).toBe(true);
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
    const c = r.campaigns[0];
    const t = c.dailyTable;
    expect(t).toHaveLength(10); // l'old_value du move rend tout l'historique connu
    expect(t[t.length - 1].isToday).toBe(true);
    expect(t[t.length - 1].budgetCents).toBe(12800); // aujourd'hui = live
    expect(t[t.length - 2].budgetCents).toBe(15000); // hier : l'ancien budget
    expect(t[t.length - 2].spendCents).toBe(10000);
    expect(t[t.length - 2].roas).toBeCloseTo(roasForMargin(0.626, 0.2), 3);
    expect(c.budgetSinceLabel).toBe("17/08 23h28"); // « depuis » de l'affichage compact
  });

  it("sans activités Meta : le tracking commence AUJOURD'HUI (pas de lignes vides du passé)", () => {
    const r = computeScaling({
      today: TODAY,
      rows: mkSeries([0.2]),
      thresholds: TH,
      live: new Map([["c1", { active: true, dailyBudgetCents: 12800, updatedTime: null }]]),
      activities: [],
    });
    const t = r.campaigns[0].dailyTable;
    expect(t).toHaveLength(10); // budget live connu → appliqué comme courant
    // ...mais si AUCUN budget n'est connu (ni live ni override), seule la
    // ligne du jour reste :
    const r2 = computeScaling({ today: TODAY, rows: mkSeries([0.2]), thresholds: TH, live: null, activities: [] });
    expect(r2.campaigns[0].dailyTable).toHaveLength(1);
    expect(r2.campaigns[0].dailyTable[0].isToday).toBe(true);
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

describe("plan créas (T36/T37)", () => {
  it("SCALE : batch 3-6 dans un nouvel adset de la CBO + dispatch des winners", () => {
    const rows = [...mkSeries([0.2]), row(TODAY, "c1", "POLO A", 100, roasForMargin(0.626, 0.2))];
    const r = computeScaling({ today: TODAY, rows, thresholds: TH, live: null, activities: null });
    const plan = r.campaigns[0].creaPlan.join(" ");
    expect(plan).toContain("3 à 6 ads");
    expect(plan).toContain("Nouvel adset DANS la CBO");
    expect(plan).toContain("MÊME POST ID");
  });

  it("HOLD sans saturation : pas de plan imposé (assertions dures)", () => {
    // 6 jours excellents puis AUJOURD'HUI médiocre : la fenêtre 17+18
    // (mixte) atterrit en bande STABLE (marge ~8 %, T24 : « on ne fait rien,
    // stabiliser ») → HOLD garanti. Volumes constants → pas de cpmrRising.
    const rows = [...mkSeries([0.25]), row(TODAY, "c1", "POLO A", 100, 1.0)];
    const r = computeScaling({ today: TODAY, rows, thresholds: TH, live: null, activities: null });
    const c = r.campaigns[0];
    expect(c.action).toBe("HOLD");
    expect(c.cpmrRising).toBe(false);
    expect(c.creaPlan).toHaveLength(0);
  });

  it("RESCUE : le plan suit le cadran (créas → hooks/angles/mécanismes)", () => {
    const rows = [...mkSeries([-0.1]), row(TODAY, "c1", "POLO A", 100, roasForMargin(0.626, -0.1))];
    const r = computeScaling({
      today: TODAY,
      rows,
      thresholds: TH,
      live: AU_PLANCHER,
      activities: [
        { campaignId: "c1", campaignName: "POLO A", eventTime: "2026-08-12T00:30:00+0200", kind: "budget", oldBudgetCents: 30000, newBudgetCents: 25500, statusTo: null },
        { campaignId: "c1", campaignName: "POLO A", eventTime: "2026-08-13T00:30:00+0200", kind: "budget", oldBudgetCents: 25500, newBudgetCents: 21600, statusTo: null },
      ],
    });
    expect(r.campaigns[0].action).toBe("RESCUE");
    expect(r.campaigns[0].creaPlan.length).toBeGreaterThan(0);
  });
});

describe("🩺 diagnostic de sauvetage (côté serveur, annonce par annonce)", () => {
  const ad = (day: string, adId: string, adName: string, spendEur: number, roas: number, extra?: Partial<AdDailyRow>): AdDailyRow => {
    const spendCents = Math.round(spendEur * 100);
    return {
      day,
      adId,
      adName,
      campaignId: "c1",
      spendCents,
      purchases: 2,
      purchaseValueCents: Math.round(spendCents * roas),
      impressions: 3000,
      clicks: 60,
      reach: 2500,
      ...extra,
    };
  };
  /** 14 jours de série NON → la campagne est en RESCUE (avec réductions vues). */
  const rescueRows = [...mkSeries([-0.1]), row(TODAY, "c1", "POLO A", 100, roasForMargin(0.626, -0.1))];
  const executedDescales = [
    { campaignId: "c1", campaignName: "POLO A", eventTime: "2026-08-12T00:30:00+0200", kind: "budget" as const, oldBudgetCents: 30000, newBudgetCents: 25500, statusTo: null },
    { campaignId: "c1", campaignName: "POLO A", eventTime: "2026-08-13T00:30:00+0200", kind: "budget" as const, oldBudgetCents: 25500, newBudgetCents: 21600, statusTo: null },
  ];

  it("identifie winner et dispatch ZOMBIE — jamais de « couper » (T37, arbitrage Badr)", () => {
    const adRows: AdDailyRow[] = [];
    for (const n of [14, 15, 16, 17, 18]) {
      const d0 = d(n);
      // winner : 8 ventes cumulées, ROAS 3× (marge ≈ 29 % ≥ 10 %)
      adRows.push(ad(d0, "win", "UGC hook douleur", 40, 3.0, { purchases: 2 }));
      // sous le break-even mais ≥ 6 ventes cumulées → direction ZOMBIE
      adRows.push(ad(d0, "zomb", "Statique promo", 60, 1.2, { purchases: 2 }));
    }
    const r = computeScaling({
      today: TODAY,
      rows: rescueRows,
      thresholds: TH,
      live: AU_PLANCHER,
      activities: executedDescales,
      adRows,
    });
    const c = r.campaigns[0];
    expect(c.action).toBe("RESCUE");
    expect(c.rescue).not.toBeNull();
    const win = c.rescue!.ads.find((a) => a.adId === "win")!;
    const zomb = c.rescue!.ads.find((a) => a.adId === "zomb")!;
    expect(win.winner).toBe(true);
    expect(zomb.toZombie).toBe(true); // ≥ 6 ventes, sous le BE
    const plan = c.rescue!.plan.join(" ");
    const evidence = c.rescue!.evidence.join(" ");
    // le plan nomme les annonces à dispatcher en zombie, jamais de coupe
    expect(plan).toContain("Statique promo");
    expect(plan).toContain("ZOMBIE");
    expect(plan.toLowerCase()).not.toContain("coupe d'abord");
    expect(plan.toLowerCase()).toContain("on ne coupe pas");
    // T37 [01:32] : en CBO les winners sont étiquetées, JAMAIS « à dupliquer »
    expect(plan).not.toContain("MÊME POST ID");
    expect(evidence).toContain("rien à dupliquer");
  });

  it("cadran CRÉAS : CPC qui dérape, CVR qui tient", () => {
    // CPC de la dernière fenêtre très au-dessus de l'historique (moins de
    // clics pour le même spend), CVR stable.
    const rows = [
      ...[12, 13, 14, 15, 16].map((n) => row(d(n), "c1", "POLO A", 100, roasForMargin(0.626, -0.1), { clicks: 400, purchases: 8 })),
      row(d(17), "c1", "POLO A", 100, roasForMargin(0.626, -0.1), { clicks: 100, purchases: 2 }),
      row(TODAY, "c1", "POLO A", 100, roasForMargin(0.626, -0.1), { clicks: 100, purchases: 2 }),
    ];
    const r = computeScaling({
      today: TODAY,
      rows,
      thresholds: TH,
      live: AU_PLANCHER,
      activities: executedDescales,
      adRows: [ad(d(17), "a1", "Vidéo A", 50, 1.2)],
    });
    expect(r.campaigns[0].rescue!.leak).toBe("CREAS");
    expect(r.campaigns[0].rescue!.verdict).toContain("CRÉAS");
  });

  it("le diagnostic est aussi calculé au cran 3 (anticipation)", () => {
    // Exactement 3 fenêtres NON — (15+16) l'est déjà : une fenêtre mélangeant
    // un OUI à 25 % et un NON à −10 % fait 7,5 %, donc sous les 15 %.
    // DESCALE cran 3, et on veut déjà le diagnostic.
    const rows = [
      ...[12, 13, 14, 15].map((n) => row(d(n), "c1", "POLO A", 100, roasForMargin(0.626, 0.25))),
      ...[16, 17].map((n) => row(d(n), "c1", "POLO A", 100, roasForMargin(0.626, -0.1))),
      row(TODAY, "c1", "POLO A", 100, roasForMargin(0.626, -0.1)),
    ];
    const r = computeScaling({
      today: TODAY,
      rows,
      thresholds: TH,
      live: AU_PLANCHER,
      activities: executedDescales,
      adRows: [ad(d(17), "a1", "Vidéo A", 50, 1.2)],
    });
    const c = r.campaigns[0];
    expect(c.cran).toBe(3);
    expect(c.rescue).not.toBeNull();
  });

  it("une annonce ARRÊTÉE avant la fenêtre de décision ne « saigne » plus", () => {
    // grosse dépense mais plus rien depuis le 14 : elle ne doit pas être
    // proposée à la coupe (elle est déjà éteinte).
    const adRows = [12, 13, 14].map((n) => ad(d(n), "old", "Vieille statique", 100, 0, { purchases: 0 }));
    const r = computeScaling({
      today: TODAY,
      rows: rescueRows,
      thresholds: TH,
      live: AU_PLANCHER,
      activities: executedDescales,
      adRows,
    });
    const old = r.campaigns[0].rescue!.ads.find((a) => a.adId === "old")!;
    expect(old.toZombie).toBe(false);
  });

  it("une créa lancée hier n'est jamais taguée « saigne » (apprentissage)", () => {
    const adRows = [ad(TODAY, "neuve", "Batch du jour", 80, 0, { purchases: 0 })];
    const r = computeScaling({
      today: TODAY,
      rows: rescueRows,
      thresholds: TH,
      live: AU_PLANCHER,
      activities: executedDescales,
      adRows,
    });
    const neuve = r.campaigns[0].rescue!.ads.find((a) => a.adId === "neuve")!;
    expect(neuve.toZombie).toBe(false);
    expect(neuve.ageDays).toBe(0);
  });

  it("âge tronqué : annonce déjà en ligne avant la fenêtre lue → pas de fausse date de batch", () => {
    const start = d(6); // = today - 13, 1er jour lu
    const adRows = [start, d(10), TODAY].map((day) => ad(day, "vieille", "Créa historique", 30, 1.2));
    const r = computeScaling({
      today: TODAY,
      rows: rescueRows,
      thresholds: TH,
      live: AU_PLANCHER,
      activities: executedDescales,
      adRows,
      adWindowStartDay: start,
    });
    const a0 = r.campaigns[0].rescue!.ads[0];
    expect(a0.ageTruncated).toBe(true);
    expect(r.campaigns[0].rescue!.lastBatchDay).toBeNull();
    expect(r.campaigns[0].rescue!.evidence.join(" ")).toContain("Aucune créa neuve");
  });

  it("seuils produit incalculables : ni winner ni cadran AOV fabriqués", () => {
    const NO_TH = { POLO: { cm: null, breakEven: null, target: null }, GILET: TH.GILET };
    // ROAS 0 → verdict NON possible même sans cm, donc la campagne atteint RESCUE
    const zeroRows = [12, 13, 14, 15, 16, 17, 18].map((n) => row(d(n), "c1", "POLO A", 100, 0));
    const r = computeScaling({
      today: TODAY,
      rows: zeroRows,
      thresholds: NO_TH,
      live: AU_PLANCHER,
      activities: executedDescales,
      adRows: [ad(d(17), "a1", "Vidéo A", 60, 0, { purchases: 0 })],
    });
    const c = r.campaigns[0];
    expect(c.rescue).not.toBeNull();
    expect(c.rescue!.leak).toBe("INSUFFISANT");
    expect(c.rescue!.ads.every((a) => !a.winner)).toBe(true);
    // B2 : le plan créas ne fabrique JAMAIS un big swing sur données
    // insuffisantes — il dit de vérifier avant de lancer quoi que ce soit.
    expect(c.creaPlan.join(" ")).not.toContain("big swing");
    expect(c.creaPlan.join(" ")).toContain("Données insuffisantes");
  });

  it("sans données annonce : pas de diagnostic inventé", () => {
    const r = computeScaling({
      today: TODAY,
      rows: rescueRows,
      thresholds: TH,
      live: AU_PLANCHER,
      activities: executedDescales,
    });
    expect(r.campaigns[0].action).toBe("RESCUE");
    expect(r.campaigns[0].rescue).toBeNull();
  });
});

describe("application détectée (audit 19/08 : pas de double mouvement la même nuit)", () => {
  const mv = (time: string, oldEur: number, newEur: number) => ({
    campaignId: "c1", campaignName: "POLO A", eventTime: time,
    kind: "budget" as const, oldBudgetCents: oldEur * 100, newBudgetCents: newEur * 100, statusTo: null,
  });

  it("DESCALE déjà exécuté après la clôture → applied, prescription depuis le budget d'AVANT", () => {
    // Pilotage démarré le 14 (ancre), 2 NON purs (16+17, 17+18) → DESCALE.
    // Badr applique 300→255 à 00h30 (le 19).
    const rows = [...mkSeries([0.25, 0.25, 0.25, 0.25, 0.25, -0.1, -0.1]), row(TODAY, "c1", "POLO A", 100, roasForMargin(0.626, -0.1))];
    const r = computeScaling({
      today: TODAY, rows, thresholds: TH,
      live: new Map([["c1", { active: true, dailyBudgetCents: 25500, updatedTime: null }]]),
      activities: [mv("2026-08-14T10:00:00+0200", 350, 300), mv("2026-08-19T00:30:00+0200", 300, 255)],
    });
    const c = r.campaigns[0];
    expect(c.action).toBe("DESCALE");
    expect(c.applied).toBe(true);
    expect(c.appliedLabel).toContain("300 € → 255 €");
    // surtout PAS reductionCents(25500)=21700 : la base reste 300 €
    expect(c.suggestedCents).toBe(25500);
  });

  it("mouvement AVANT la clôture de la fenêtre jugée → pas « appliqué »", () => {
    const rows = [...mkSeries([0.25, 0.25, 0.25, 0.25, 0.25, -0.1, -0.1]), row(TODAY, "c1", "POLO A", 100, roasForMargin(0.626, -0.1))];
    const r = computeScaling({
      today: TODAY, rows, thresholds: TH, live: null,
      activities: [mv("2026-08-16T23:50:00+0200", 350, 300)],
    });
    expect(r.campaigns[0].applied).toBe(false);
  });

  it("I2 : 4 NON mais budget encore au-dessus du plancher → DESCALE", () => {
    // OUI sur 12+13 (compteur remis à zéro), puis 4 fenêtres NON (14+15 →
    // 17+18). Budget estimé (pas de live) : « au plancher » ne peut pas être
    // affirmé, donc jamais de sauvetage — on continue l'escalier.
    const rows = [
      ...[12, 13].map((n) => row(d(n), "c1", "POLO A", 100, roasForMargin(0.626, 0.25))),
      ...[14, 15, 16, 17].map((n) => row(d(n), "c1", "POLO A", 100, roasForMargin(0.626, -0.1))),
      row(TODAY, "c1", "POLO A", 100, roasForMargin(0.626, -0.1)),
    ];
    const r = computeScaling({
      today: TODAY, rows, thresholds: TH, live: null,
      activities: [mv("2026-08-12T00:30:00+0200", 350, 300)],
    });
    const c = r.campaigns[0];
    expect(c.action).toBe("DESCALE");
  });

  it("I3 : en mode nuit, le jour jugé garde le budget auquel il a TOURNÉ", () => {
    // Nuit du 19 (today=18 figé). Badr a exécuté 300→255 à 00h30 le 19 : la
    // ligne du 18 doit rester à 300 (le 18 a tourné à 300), pas à 255.
    const rows = mkSeries([0.2]).concat([row(TODAY, "c1", "POLO A", 100, roasForMargin(0.626, 0.2))]);
    const r = computeScaling({
      today: TODAY, rows, thresholds: TH,
      live: new Map([["c1", { active: true, dailyBudgetCents: 25500, updatedTime: null }]]),
      activities: [mv("2026-08-19T00:30:00+0200", 300, 255)],
      liveDay: false,
    });
    const t = r.campaigns[0].dailyTable;
    expect(t[t.length - 1].budgetCents).toBe(30000); // budget d'AVANT minuit
  });
});

describe("T37 : signal précoce et anti-redispatch", () => {
  const rescueRows2 = [...mkSeries([-0.1]), row(TODAY, "c1", "POLO A", 100, roasForMargin(0.626, -0.1))];
  const descales = [
    { campaignId: "c1", campaignName: "POLO A", eventTime: "2026-08-12T00:30:00+0200", kind: "budget" as const, oldBudgetCents: 30000, newBudgetCents: 25500, statusTo: null },
    { campaignId: "c1", campaignName: "POLO A", eventTime: "2026-08-13T00:30:00+0200", kind: "budget" as const, oldBudgetCents: 25500, newBudgetCents: 21600, statusTo: null },
  ];
  const mkAd = (adId: string, adName: string, roas: number, purchases: number): AdDailyRow[] =>
    [15, 16, 17, 18].map((n) => ({
      day: d(n),
      adId,
      adName,
      campaignId: "c1",
      spendCents: 3000,
      purchases,
      purchaseValueCents: Math.round(3000 * roas),
      impressions: 3000,
      clicks: 60,
      reach: 2500,
    }));

  it("< 6 ventes mais marge ≥ 15 % → SIGNAL précoce (T37 [05:12])", () => {
    // ROAS 3× → marge ≈ 29 % ; 1 vente/jour × 4 jours = 4 ventes (< 6)
    const adRows = mkAd("sig", "Hook curiosité", 3.0, 1);
    const r = computeScaling({ today: TODAY, rows: rescueRows2, thresholds: TH, live: null, activities: descales, adRows });
    const sig = r.campaigns[0].rescue!.ads.find((a) => a.adId === "sig")!;
    expect(sig.earlySignal).toBe(true);
    expect(sig.winner).toBe(false);
  });

  it("une ad déjà marquée WIN n'est jamais re-recommandée (T37 [05:57])", () => {
    const adRows = mkAd("w1", "WIN AUGUST 1 — UGC douleur", 3.0, 2); // 8 ventes, marquée
    const r = computeScaling({ today: TODAY, rows: rescueRows2, thresholds: TH, live: null, activities: descales, adRows });
    const w = r.campaigns[0].rescue!.ads.find((a) => a.adId === "w1")!;
    expect(w.alreadyMarked).toBe(true);
    // ni dans l'evidence winners ni dans le plan zombie
    expect(r.campaigns[0].rescue!.evidence.join(" ")).not.toContain("UGC douleur");
    expect(r.campaigns[0].rescue!.plan.join(" ")).not.toContain("UGC douleur");
  });
});

describe("départ officiel du protocole (Badr 19/08 : « on démarre aujourd'hui »)", () => {
  it("les fenêtres en perte d'AVANT le départ ne comptent pas — départ propre", () => {
    // Pertes tous les jours, mais protocole démarré le 17 → seules les
    // fenêtres finissant le 17+ comptent : streak 2, pas RESCUE.
    const rows = [...mkSeries([-0.1]), row(TODAY, "c1", "POLO A", 100, roasForMargin(0.626, -0.1))];
    const r = computeScaling({
      today: TODAY,
      rows,
      thresholds: TH,
      live: null,
      activities: null,
      protocolStartDay: d(17),
    });
    expect(r.campaigns[0].nonStreak).toBe(2);
    expect(r.campaigns[0].action).toBe("DESCALE");
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

describe("repairMoves — plus de « ? » quand la valeur se déduit de la chaîne (Badr 19/08)", () => {
  it("comble old depuis le new précédent, new depuis le old suivant, le dernier depuis le live", () => {
    const moves = [
      { eventTime: "2026-08-17T23:30:00+0200", oldBudgetCents: 30000, newBudgetCents: null },
      { eventTime: "2026-08-18T23:40:00+0200", oldBudgetCents: 50000, newBudgetCents: null },
    ];
    const fixed = repairMoves(moves, 75000);
    // new du 1er = old du 2e (le budget n'a pas bougé entre les deux)
    expect(fixed[0].newBudgetCents).toBe(50000);
    // new du dernier = budget live
    expect(fixed[1].newBudgetCents).toBe(75000);
  });

  it("comble old manquant depuis le new du mouvement précédent", () => {
    const moves = [
      { eventTime: "2026-08-17T23:30:00+0200", oldBudgetCents: 30000, newBudgetCents: 50000 },
      { eventTime: "2026-08-18T23:40:00+0200", oldBudgetCents: null, newBudgetCents: 75000 },
    ];
    const fixed = repairMoves(moves, 75000);
    expect(fixed[1].oldBudgetCents).toBe(50000);
  });

  it("n'invente jamais : premier old inconnu sans précédent reste null", () => {
    const moves = [{ eventTime: "2026-08-17T23:30:00+0200", oldBudgetCents: null, newBudgetCents: 50000 }];
    expect(repairMoves(moves, null)[0].oldBudgetCents).toBeNull();
  });
});

describe("SAUVETAGE = pas rentable ET on ne peut plus baisser (Badr 29/08)", () => {
  // « le rescue c'est quand t'arrive à 100 € par jour je crois, moi mes
  // campagnes reste rentable je vais pas faire rescue non ??? » — T35 lui
  // donne raison deux fois : [03:00] « vous êtes rentable… SINON on passe en
  // phase de sauvetage » et [04:29] « garder minimum 100 euros de budget ».
  const auPlancher = (rows: ScalingDailyRow[]) =>
    computeScaling({ today: TODAY, rows, thresholds: TH, live: AU_PLANCHER, activities: [] });
  const gros = (rows: ScalingDailyRow[]) =>
    computeScaling({
      today: TODAY,
      rows,
      thresholds: TH,
      live: new Map([["c1", { active: true, dailyBudgetCents: 60000, updatedTime: null }]]),
      activities: [],
    });

  it("rentable mais sous les 15 %, série longue, AU PLANCHER → jamais de sauvetage", () => {
    // LE cas de Badr : marge 5 %, donc au-dessus du break-even.
    const r = auPlancher(mkSeries([0.05]));
    const c = r.campaigns[0];
    expect(c.nonStreak).toBeGreaterThanOrEqual(4);
    expect(c.action).not.toBe("RESCUE");
    expect(c.rescue).toBeNull();
    expect(c.why).toContain("au-dessus du break-even");
  });

  it("rentable sous les 15 %, série longue, budget HAUT → on continue à réduire", () => {
    const c = gros(mkSeries([0.05])).campaigns[0];
    expect(c.action).toBe("DESCALE");
    expect(c.suggestedCents).toBe(reductionCents(60000));
  });

  it("EN PERTE mais budget encore haut → on réduit, pas encore de sauvetage", () => {
    const c = gros(mkSeries([-0.1])).campaigns[0];
    expect(c.action).toBe("DESCALE");
    expect(c.why).toContain("pas au plancher");
  });

  it("EN PERTE ET au plancher → SAUVETAGE (les deux conditions réunies)", () => {
    const c = auPlancher(mkSeries([-0.1])).campaigns[0];
    expect(c.action).toBe("RESCUE");
    expect(c.why).toContain("EN PERTE");
  });

  it("le budget ESTIMÉ ne peut jamais déclencher le sauvetage", () => {
    // Sans budget lu sur Meta, « au plancher » n'est pas affirmable : on ne
    // fabrique pas un sauvetage sur une supposition.
    const c = computeScaling({
      today: TODAY,
      rows: mkSeries([-0.1]),
      thresholds: TH,
      live: null,
      activities: [],
    }).campaigns[0];
    expect(c.action).toBe("DESCALE");
  });
});
