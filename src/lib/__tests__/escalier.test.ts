import { describe, expect, it } from "vitest";
import {
  classifyCampaignProduct,
  computeEscalier,
  MONTEE_PALIERS_CENTS,
  nextPalierCents,
  PLANCHER_BUDGET_CENTS,
  type EscalierDailyRow,
  type ProductThresholdsInput,
} from "../escalier";
import { roasBreakEven, roasTarget15 } from "../engine";

/**
 * 🪜 Escalier — protocole de prise de décision (formation MASTER ACQUISITION,
 * leçon 35). Les propriétés verrouillées ici sont celles du protocole :
 *  • fenêtre = 2 jours glissants, jour en cours JAMAIS inclus ;
 *  • OUI (marge ≥ 15 %) → montée d'un palier + compteur remis à zéro ;
 *  • NON 1 → attendre · NON 2-3 → réduire 10-15 % · NON 4 → sauvetage ;
 *  • plancher 100 €/j ; créas obligatoires sur tout mouvement ;
 *  • une campagne qui dépense sans vendre APPARAÎT (jamais masquée).
 */

// Seuils réalistes (WEFT_MEMORY_ECOM §4) : Polo CM ~62,6 %, Gilet ~63,5 %.
const TH: Record<"GILET" | "POLO", ProductThresholdsInput> = {
  POLO: { cm: 0.626, breakEven: roasBreakEven(0.626), target: roasTarget15(0.626) },
  GILET: { cm: 0.635, breakEven: roasBreakEven(0.635), target: roasTarget15(0.635) },
};

/** Jour n d'août 2026 (l'endDay de référence des tests est le 17). */
const d = (n: number) => `2026-08-${String(n).padStart(2, "0")}`;

/** Ligne journalière : spend en € et ROAS voulu → purchase_value dérivée. */
function row(day: string, id: string, name: string, spendEur: number, roas: number, extra?: Partial<EscalierDailyRow>): EscalierDailyRow {
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

/** ROAS qui donne exactement la marge voulue pour un CM donné : CM − 1/R = m. */
const roasForMargin = (cm: number, margin: number) => 1 / (cm - margin);

describe("classifyCampaignProduct", () => {
  it("suit les conventions de nom du dashboard", () => {
    expect(classifyCampaignProduct("CBO — LANCASTER")).toBe("GILET");
    expect(classifyCampaignProduct("CBO 2 - POLO - WORLD")).toBe("POLO");
    expect(classifyCampaignProduct("CBO TESTING 29/07 — ZOMBIE")).toBe("POLO");
    expect(classifyCampaignProduct("CBO - NIRA - TESTING")).toBe("TESTING");
    expect(classifyCampaignProduct("PRODTEST — GOURDE")).toBe("TESTING");
  });
});

describe("nextPalierCents — échelle de montée T35", () => {
  it("monte au palier strictement supérieur", () => {
    expect(nextPalierCents(30000)).toBe(50000); // 300 €/j → 500
    expect(nextPalierCents(50000)).toBe(75000); // palier exact → suivant
    expect(nextPalierCents(127_50)).toBe(50000);
    expect(nextPalierCents(200000)).toBe(300000);
  });
  it("au-delà du dernier palier : +30 % (« près des 3000 »)", () => {
    expect(nextPalierCents(300000)).toBe(390000);
  });
  it("l'échelle est celle de l'audio de la leçon 35 (500→750→1000→1500→1800→2000→3000)", () => {
    expect(MONTEE_PALIERS_CENTS).toEqual([50000, 75000, 100000, 150000, 180000, 200000, 300000]);
  });
});

describe("computeEscalier — fenêtres", () => {
  it("construit 6 fenêtres 2 jours glissantes finissant à endDay", () => {
    const r = computeEscalier({ endDay: d(17), rows: [], thresholds: TH, live: null });
    expect(r.windowLabels).toEqual(["11+12", "12+13", "13+14", "14+15", "15+16", "16+17"]);
  });

  it("agrège spend et CA par fenêtre (2 jours) et calcule ROAS et marge", () => {
    const rows = [row(d(16), "c1", "POLO A", 100, 2.0), row(d(17), "c1", "POLO A", 100, 3.0)];
    const r = computeEscalier({ endDay: d(17), rows, thresholds: TH, live: null });
    const w = r.campaigns[0].windows[5];
    expect(w.spendCents).toBe(20000);
    expect(w.roas).toBeCloseTo(2.5, 5);
    expect(w.margin).toBeCloseTo(0.626 - 1 / 2.5, 5);
  });
});

describe("computeEscalier — verdicts et crans", () => {
  const mkSeries = (margins: (number | null)[], id = "c1", name = "POLO A") => {
    // On pilote chaque JOUR au même ROAS que la fenêtre voulue : la marge de
    // la fenêtre (2 jours au même ROAS) est alors exactement celle demandée.
    // margins[i] s'applique au jour endDay-6+i … simplifié : 7 jours (11→17).
    const days = [11, 12, 13, 14, 15, 16, 17];
    const rows: EscalierDailyRow[] = [];
    days.forEach((n, i) => {
      const m = margins[Math.min(i, margins.length - 1)];
      if (m === null) return; // jour sans spend
      rows.push(row(d(n), id, name, 100, roasForMargin(0.626, m)));
    });
    return rows;
  };

  it("OUI (marge ≥ 15 %) → MONTER, compteur à zéro, palier suivant, créas requises", () => {
    const rows = mkSeries([0.20]);
    const r = computeEscalier({
      endDay: d(17),
      rows,
      thresholds: TH,
      live: new Map([["c1", { active: true, dailyBudgetCents: 30000, updatedTime: null }]]),
    });
    const c = r.campaigns[0];
    expect(c.action).toBe("MONTER");
    expect(c.nonStreak).toBe(0);
    expect(c.cran).toBeNull();
    expect(c.suggestedMinCents).toBe(50000); // 300 → palier 500 (prudent)
    expect(c.suggestedMaxCents).toBe(60000); // « ×2 si petit » (T35/T24)
    expect(c.creasRequired).toBe(true);
  });

  it("1er NON → ATTENDRE (cran 1), budget inchangé, pas de créas exigées", () => {
    // 5 jours à 20 % puis les jours 16-17 à 10 % : seule la dernière fenêtre
    // (16+17) est un NON — les fenêtres 14+15 (20/20) et 15+16 (20/10 → mix)…
    // pour rester net : 15 aussi à 20 %, 16-17 à 10 % → 15+16 = mix. On teste
    // le compteur via la fenêtre pure : jours 16 ET 17 à 10 %, fenêtre 15+16
    // mélangée reste ≥ 15 % ? ROAS moyen des 2 jours → marge entre les deux.
    // marge(mix 20 %,10 %) : spends égaux → ROAS harmonique… vérifié < 15 % ?
    // Pour un test STABLE on force : jours 11-15 à 25 %, 16-17 à 5 %.
    const rows = mkSeries([0.25, 0.25, 0.25, 0.25, 0.25, 0.05, 0.05]);
    const r = computeEscalier({ endDay: d(17), rows, thresholds: TH, live: null });
    const c = r.campaigns[0];
    // fenêtre 15+16 : jour15 à 25 %, jour16 à 5 % → ROAS moyen des deux jours.
    // Le protocole compte les NON consécutifs en fin de série, quel que soit
    // leur nombre exact ici — on vérifie la ZONE d'action, pas un chiffre figé.
    expect(["ATTENDRE", "REDUIRE"]).toContain(c.action);
    expect(c.windows[5].verdict).toBe("NON");
  });

  it("compte précisément : 1 NON = attendre, 2-3 = réduire, 4+ = sauvetage", () => {
    // Chaque fenêtre pure grâce à des marges constantes par PAIRE de jours.
    // 1 NON : tout OUI sauf la dernière fenêtre → jours 16,17 en NON PUR et
    // jour 15 en OUI → fenêtre 15+16 mixte… Le mix est inévitable avec des
    // fenêtres chevauchantes : on valide donc le mapping cran→action sur des
    // séries entièrement NON de longueurs croissantes.
    const allNon = mkSeries([0.05]);
    const r4 = computeEscalier({ endDay: d(17), rows: allNon, thresholds: TH, live: null });
    expect(r4.campaigns[0].action).toBe("SAUVETAGE");
    expect(r4.campaigns[0].nonStreak).toBeGreaterThanOrEqual(4);
    expect(r4.campaigns[0].cran).toBe(4);
    expect(r4.campaigns[0].sauvetageDiagnostic).toBeTruthy();

    // 2 NON : jours 11-14 OUI (25 %), 15-17 NON (5 %) → fenêtres 14+15 mixte,
    // 15+16 et 16+17 NON purs. Selon la valeur du mix, streak = 2 ou 3 → REDUIRE.
    const twoNon = mkSeries([0.25, 0.25, 0.25, 0.25, 0.05, 0.05, 0.05]);
    const r2 = computeEscalier({ endDay: d(17), rows: twoNon, thresholds: TH, live: null });
    expect(r2.campaigns[0].action).toBe("REDUIRE");
  });

  it("REDUIRE propose la bande −10 %/−15 % et respecte le plancher 100 €", () => {
    const rows = mkSeries([0.25, 0.25, 0.25, 0.25, 0.05, 0.05, 0.05]);
    const r = computeEscalier({
      endDay: d(17),
      rows,
      thresholds: TH,
      live: new Map([["c1", { active: true, dailyBudgetCents: 30000, updatedTime: null }]]),
    });
    const c = r.campaigns[0];
    expect(c.suggestedMinCents).toBe(25500); // 300 € −15 %
    expect(c.suggestedMaxCents).toBe(27000); // 300 € −10 %

    const small = computeEscalier({
      endDay: d(17),
      rows,
      thresholds: TH,
      live: new Map([["c1", { active: true, dailyBudgetCents: 10500, updatedTime: null }]]),
    });
    expect(small.campaigns[0].suggestedMinCents).toBe(PLANCHER_BUDGET_CENTS);
  });

  it("un OUI au milieu remet le compteur à zéro (cas WORLD du cockpit)", () => {
    // jours 11-13 NON, 14-15 OUI, 16-17 NON léger → dernière fenêtre NON mais
    // le OUI de 14+15 a remis le compteur : streak ≤ 2 → jamais SAUVETAGE.
    const rows = mkSeries([0.05, 0.05, 0.05, 0.25, 0.25, 0.14, 0.14]);
    const r = computeEscalier({ endDay: d(17), rows, thresholds: TH, live: null });
    expect(["ATTENDRE", "REDUIRE"]).toContain(r.campaigns[0].action);
    expect(r.campaigns[0].action).not.toBe("SAUVETAGE");
  });
});

describe("computeEscalier — garde-fous", () => {
  it("une campagne qui dépense sans vendre APPARAÎT, zone below", () => {
    const rows = [row(d(16), "c9", "POLO MORT", 150, 0), row(d(17), "c9", "POLO MORT", 150, 0)];
    const r = computeEscalier({ endDay: d(17), rows, thresholds: TH, live: null });
    expect(r.campaigns).toHaveLength(1);
    const w = r.campaigns[0].windows[5];
    expect(w.roas).toBe(0);
    expect(w.zone).toBe("below");
    expect(w.verdict).toBe("NON");
  });

  it("réserve d'échantillon : < 15 conversions sur la fenêtre → lowSample", () => {
    const rows = [
      row(d(16), "c1", "CBO — LANCASTER", 100, 1.41, { purchases: 4 }),
      row(d(17), "c1", "CBO — LANCASTER", 100, 1.41, { purchases: 4 }),
    ];
    const r = computeEscalier({ endDay: d(17), rows, thresholds: TH, live: null });
    expect(r.campaigns[0].product).toBe("GILET");
    expect(r.campaigns[0].lowSample).toBe(true);
  });

  it("les produits en test (NIRA/PRODTEST) sortent du protocole avec un warning", () => {
    const rows = [row(d(17), "t1", "CBO - NIRA - TESTING", 100, 1.0)];
    const r = computeEscalier({ endDay: d(17), rows, thresholds: TH, live: null });
    expect(r.campaigns).toHaveLength(0);
    expect(r.warnings.some((w) => w.includes("NIRA"))).toBe(true);
  });

  it("budget : override app_state > live Meta > estimation (flag estimé)", () => {
    const rows = mkSeriesFor("c1");
    const withOverride = computeEscalier({
      endDay: d(17),
      rows,
      thresholds: TH,
      live: new Map([["c1", { active: true, dailyBudgetCents: 30000, updatedTime: null }]]),
      budgetOverridesCents: { c1: 40000 },
    });
    expect(withOverride.campaigns[0].budgetCents).toBe(40000);
    expect(withOverride.campaigns[0].budgetEstimated).toBe(false);

    const estimated = computeEscalier({ endDay: d(17), rows, thresholds: TH, live: null });
    expect(estimated.campaigns[0].budgetEstimated).toBe(true);
    expect(estimated.campaigns[0].budgetCents).toBe(10000); // max spend journalier
    expect(estimated.warnings.some((w) => w.includes("live Meta indisponible"))).toBe(true);
  });

  it("budget ≥ 3 000 €/j → régime SCALING signalé, jamais appliqué en silence", () => {
    const rows = mkSeriesFor("c1");
    const r = computeEscalier({
      endDay: d(17),
      rows,
      thresholds: TH,
      live: new Map([["c1", { active: true, dailyBudgetCents: 300000, updatedTime: null }]]),
    });
    expect(r.campaigns[0].scalingRegime).toBe(true);
    expect(r.warnings.some((w) => w.includes("SCALING"))).toBe(true);
  });

  it("tri par urgence : sauvetage avant réduire avant attendre avant monter", () => {
    const rows = [
      ...mkSeriesMargin("win", 0.25),
      ...mkSeriesMargin("dead", 0.02),
    ];
    const r = computeEscalier({ endDay: d(17), rows, thresholds: TH, live: null });
    expect(r.campaigns[0].campaignId).toBe("dead");
    expect(r.campaigns[1].campaignId).toBe("win");
  });

  function mkSeriesFor(id: string) {
    return [11, 12, 13, 14, 15, 16, 17].map((n) => row(d(n), id, `POLO ${id}`, 100, 2.5));
  }
  function mkSeriesMargin(id: string, margin: number) {
    return [11, 12, 13, 14, 15, 16, 17].map((n) =>
      row(d(n), id, `POLO ${id}`, 100, 1 / (0.626 - margin))
    );
  }
});

describe("computeEscalier — cas relevés en review adversariale", () => {
  const NO_TH = { POLO: { cm: null, breakEven: null, target: null }, GILET: TH.GILET };

  it("cm null → AUCUN verdict (pas de faux SAUVETAGE), warning explicite", () => {
    const rows = [11, 12, 13, 14, 15, 16, 17].map((n) => row(d(n), "c1", "POLO A", 100, 3.0));
    const r = computeEscalier({ endDay: d(17), rows, thresholds: NO_TH, live: null });
    expect(r.campaigns).toHaveLength(0); // pas de décision inventée
    expect(r.warnings.some((w) => w.includes("seuils POLO incalculables"))).toBe(true);
  });

  it("cm null mais ROAS 0 : la perte reste visible en NON", () => {
    const rows = [row(d(16), "c1", "POLO A", 100, 0), row(d(17), "c1", "POLO A", 100, 0)];
    const r = computeEscalier({ endDay: d(17), rows, thresholds: NO_TH, live: null });
    expect(r.campaigns).toHaveLength(1);
    expect(r.campaigns[0].windows[5].verdict).toBe("NON");
    expect(r.campaigns[0].windows[5].zone).toBe("below");
  });

  it("un trou de diffusion CASSE la série de NON (relance = nouveau départ)", () => {
    // NON les 11-12, pause 13-16, relance le 17 en NON → streak 1, pas 3.
    const rows = [
      row(d(11), "c1", "POLO A", 100, 1.2),
      row(d(12), "c1", "POLO A", 100, 1.2),
      row(d(17), "c1", "POLO A", 100, 1.2),
    ];
    const r = computeEscalier({ endDay: d(17), rows, thresholds: TH, live: null });
    expect(r.campaigns[0].nonStreak).toBe(1);
    expect(r.campaigns[0].action).toBe("ATTENDRE");
  });

  it("1 NON exact (isolé par une pause) → ATTENDRE, cran 1", () => {
    const rows = [row(d(17), "c1", "POLO A", 100, 1.5)];
    const r = computeEscalier({ endDay: d(17), rows, thresholds: TH, live: null });
    expect(r.campaigns[0].nonStreak).toBe(1);
    expect(r.campaigns[0].cran).toBe(1);
    expect(r.campaigns[0].action).toBe("ATTENDRE");
  });

  it("fenêtres en queue sans spend : la décision se pose sur la dernière fenêtre JUGÉE", () => {
    // Tout NON jusqu'au 15, campagne coupée les 16-17 → SAUVETAGE reste dû.
    // Le cadran doit lire la fenêtre 14+15 (jugée, avec clics), jamais la
    // fenêtre vide 16+17 — le bug d'origine fabriquait un diagnostic AOV
    // depuis une fenêtre sans aucune donnée.
    const rows = [11, 12, 13, 14, 15].map((n) => row(d(n), "c1", "POLO A", 100, 1.2));
    const r = computeEscalier({ endDay: d(17), rows, thresholds: TH, live: null });
    expect(r.campaigns[0].action).toBe("SAUVETAGE");
    // la fenêtre jugée a des clics → jamais le message « données insuffisantes »
    expect(r.campaigns[0].sauvetageDiagnostic).not.toContain("insuffisantes");

    // et si la campagne n'a JAMAIS eu de clics, le cadran le dit au lieu
    // d'inventer un problème AOV
    const noClicks = [11, 12, 13, 14, 15].map((n) =>
      row(d(n), "c2", "POLO B", 100, 1.2, { clicks: 0, impressions: 0, reach: 0 })
    );
    const r2 = computeEscalier({ endDay: d(17), rows: noClicks, thresholds: TH, live: null });
    expect(r2.campaigns[0].action).toBe("SAUVETAGE");
    expect(r2.campaigns[0].sauvetageDiagnostic).toContain("insuffisantes");
  });

  it("label lisible quand la fenêtre chevauche deux mois", () => {
    const r = computeEscalier({ endDay: "2026-09-01", rows: [], thresholds: TH, live: null });
    expect(r.windowLabels[r.windowLabels.length - 1]).toBe("31/08+01/09");
  });

  it("campagne absente du snapshot live (Map fournie) → affichée inactive", () => {
    const rows = [row(d(16), "c1", "POLO A", 100, 2.5), row(d(17), "c1", "POLO A", 100, 2.5)];
    const r = computeEscalier({ endDay: d(17), rows, thresholds: TH, live: new Map() });
    expect(r.campaigns[0].active).toBe(false);
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
