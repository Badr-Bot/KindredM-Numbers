import { describe, expect, it } from "vitest";
import { buildDailyRates, hasLiveRates, usdToEurForDay, usdToEurLatest } from "../rates";
import { USD_TO_EUR } from "../subscriptions";

// 💱 Règle Badr 04/09 : ce qui est payé → taux DU JOUR ; l'argent qui dort →
// DERNIER taux de la journée ; sans série → taux figé (repli, jamais inventé).

const serie = buildDailyRates([
  { day: "2026-08-28", rate: 0.858 },
  { day: "2026-08-29", rate: 0.8576 }, // 802,90 € → 936,26 $ lu sur Slash
  { day: "2026-09-04", rate: 0.86 },
  { day: "2026-09-04", rate: 0.861 }, // deux points le même jour : le dernier gagne
]);

describe("buildDailyRates", () => {
  it("garde le DERNIER point d'un jour et trie les jours", () => {
    expect(serie.days).toEqual(["2026-08-28", "2026-08-29", "2026-09-04"]);
    expect(serie.byDay.get("2026-09-04")).toBe(0.861);
    expect(serie.latest).toEqual({ day: "2026-09-04", rate: 0.861 });
  });

  it("ignore un taux nul, négatif ou absent", () => {
    const r = buildDailyRates([
      { day: "2026-09-01", rate: 0 },
      { day: "2026-09-02", rate: -1 },
      { day: "", rate: 0.86 },
      { day: "2026-09-03", rate: Number.NaN },
    ]);
    expect(r.days).toEqual([]);
    expect(r.latest).toBeNull();
    expect(hasLiveRates(r)).toBe(false);
  });
});

describe("usdToEurForDay — ce qui est payé", () => {
  it("prend le taux exact du jour quand il existe", () => {
    expect(usdToEurForDay(serie, "2026-08-29")).toBe(0.8576);
  });

  it("sinon le dernier taux connu AVANT ce jour — jamais un taux postérieur", () => {
    expect(usdToEurForDay(serie, "2026-09-01")).toBe(0.8576); // pas 0,861 du 04/09
  });

  it("avant le premier point : repli sur le taux figé", () => {
    expect(usdToEurForDay(serie, "2026-05-21")).toBe(USD_TO_EUR);
  });

  it("sans série : taux figé", () => {
    expect(usdToEurForDay(null, "2026-08-29")).toBe(USD_TO_EUR);
    expect(usdToEurForDay(buildDailyRates([]), "2026-08-29")).toBe(USD_TO_EUR);
  });
});

describe("usdToEurLatest — l'argent qui dort", () => {
  it("prend le dernier taux de la série", () => {
    expect(usdToEurLatest(serie)).toBe(0.861);
  });

  it("sans série : taux figé", () => {
    expect(usdToEurLatest(null)).toBe(USD_TO_EUR);
  });
});

describe("écart entre taux figé et taux réel (pourquoi la règle existe)", () => {
  it("58 151 $ de Wise valent ~527 € de moins au taux réel du 29/08 qu'au taux figé", () => {
    const fige = Math.round(5815148 * USD_TO_EUR);
    const reel = Math.round(5815148 * usdToEurForDay(serie, "2026-08-29"));
    expect(fige - reel).toBeGreaterThan(50000);
    expect(fige - reel).toBeLessThan(55000);
  });
});
