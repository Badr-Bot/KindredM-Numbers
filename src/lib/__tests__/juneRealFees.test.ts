import { describe, expect, it } from "vitest";
import { JUNE_REAL_FEES, JUNE_REAL_FEES_ROWS } from "../juneRealFees";

/**
 * Frais réels 04→13/06 — les chiffres en dur de juneRealFees.ts sont-ils bien
 * ceux mesurés sur les vraies transactions Shopify ?
 *
 * Les totaux attendus ci-dessous viennent de la mesure du 16/08 (276
 * commandes #1290→#1565 relues via la connexion Shopify de Badr, sommées par
 * script — jamais de tête). Même filet que mayGapFill.test.ts : modifier une
 * ligne de la table sans mettre à jour ce test le fait échouer, au lieu de
 * fausser les frais de juin en silence.
 */

// jour Paris → [commandes, frais réels en cents]
const EXPECTED_BY_DAY: Record<string, [number, number]> = {
  "2026-06-04": [13, 2135],
  "2026-06-05": [26, 3862],
  "2026-06-06": [15, 2563],
  "2026-06-07": [31, 6002],
  "2026-06-08": [25, 3382],
  "2026-06-09": [32, 4974],
  "2026-06-10": [35, 5449],
  "2026-06-11": [32, 5011],
  "2026-06-12": [32, 4514],
  "2026-06-13": [35, 5461],
};

describe("frais réels juin 04→13 (juneRealFees.ts)", () => {
  it("couvre exactement les 276 commandes #1290→#1565, sans doublon", () => {
    expect(JUNE_REAL_FEES_ROWS).toHaveLength(276);
    expect(JUNE_REAL_FEES.size).toBe(276); // un doublon de nom ferait size < length
    const nums = JUNE_REAL_FEES_ROWS.map(([name]) => Number(name.slice(1)));
    expect(Math.min(...nums)).toBe(1290);
    expect(Math.max(...nums)).toBe(1565);
    for (const [name] of JUNE_REAL_FEES_ROWS) expect(name).toMatch(/^#\d+$/);
  });

  it("retombe au centime sur les totaux mesurés, jour par jour", () => {
    const byDay = new Map<string, { orders: number; fees: number }>();
    for (const [, day, cents] of JUNE_REAL_FEES_ROWS) {
      if (!byDay.has(day)) byDay.set(day, { orders: 0, fees: 0 });
      const b = byDay.get(day)!;
      b.orders += 1;
      b.fees += cents;
    }
    expect([...byDay.keys()].sort()).toEqual(Object.keys(EXPECTED_BY_DAY).sort());
    for (const [day, [orders, fees]] of Object.entries(EXPECTED_BY_DAY)) {
      expect(byDay.get(day), day).toEqual({ orders, fees });
    }
  });

  it("total période : 433,53 € (2,26 % du CA — le repli 3 % surestimait de 142,02 €)", () => {
    const total = JUNE_REAL_FEES_ROWS.reduce((sum, [, , cents]) => sum + cents, 0);
    expect(total).toBe(43353);
  });
});
