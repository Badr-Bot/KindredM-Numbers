import { describe, expect, it } from "vitest";
import {
  SUBSCRIPTIONS,
  dailyEurCents,
  fixedCostsCentsForDay,
  monthlyEurCents,
  nonCashChargesCentsForDay,
  subscriptionTotals,
} from "../subscriptions";

/**
 * 💳 Charges fixes — fenêtres de facturation et charges non décaissées.
 * Le MEMO le dit : « un chiffre en dur non vérifiable finit par mentir ».
 * Ces tests figent les décisions de Badr pour qu'un changement de grille
 * casse le test au lieu de fausser la marge en silence.
 */

const seif = () => SUBSCRIPTIONS.find((s) => s.label.startsWith("Seif"))!;

describe("Seif — « ne sera pas payé, du 16/07 au 16/08 » (Badr 20/08)", () => {
  it("est facturé du 16/07 au 16/08 inclus, et plus rien après", () => {
    const s = seif();
    expect(s.startDay).toBe("2026-07-16");
    expect(s.endDay).toBe("2026-08-16");
  });

  it("pèse sur les charges du 16/08 mais plus sur celles du 17/08", () => {
    const jour = dailyEurCents(seif());
    expect(fixedCostsCentsForDay("2026-08-16") - fixedCostsCentsForDay("2026-08-17")).toBe(jour);
    // La veille du départ ne le compte pas non plus (le 15/07 de l'ancienne
    // saisie a été corrigé en 16/07).
    expect(fixedCostsCentsForDay("2026-07-16") - fixedCostsCentsForDay("2026-07-15")).toBeGreaterThan(jour);
  });

  it("sort des totaux courants une fois la fenêtre passée", () => {
    const avant = subscriptionTotals("2026-08-16").monthlyCents;
    const apres = subscriptionTotals("2026-08-17").monthlyCents;
    expect(avant - apres).toBe(monthlyEurCents(seif()));
  });

  it("n'est plus une avance perso d'Adnane : rien à rembourser entre associés", () => {
    expect(seif().paidBy).toBeUndefined();
  });

  it("ne sortira jamais de la banque LLC : compté en charge non décaissée", () => {
    expect(seif().noBankClaim).toBe(true);
    expect(nonCashChargesCentsForDay("2026-08-10")).toBeGreaterThanOrEqual(dailyEurCents(seif()));
    // Après le 16/08 il ne pèse plus nulle part, ni en charge ni en écart.
    expect(nonCashChargesCentsForDay("2026-08-17")).toBeLessThan(dailyEurCents(seif()));
  });
});

describe("nonCashChargesCentsForDay", () => {
  it("ne retient que les charges avancées perso ou sans décaissement attendu", () => {
    const jour = "2026-08-10";
    const attendu = SUBSCRIPTIONS.filter(
      (s) => s.startDay <= jour && (s.endDay === null || s.endDay >= jour) && (s.paidBy || s.noBankClaim)
    ).reduce((a, s) => a + dailyEurCents(s), 0);
    expect(nonCashChargesCentsForDay(jour)).toBe(attendu);
    expect(attendu).toBeGreaterThan(0);
  });

  it("reste un sous-ensemble des charges fixes du jour (jamais compté en double)", () => {
    for (const jour of ["2026-07-20", "2026-08-10", "2026-08-20", "2026-09-15"]) {
      expect(nonCashChargesCentsForDay(jour)).toBeLessThanOrEqual(fixedCostsCentsForDay(jour));
    }
  });
});
