import { describe, expect, it } from "vitest";
import {
  SUBSCRIPTIONS,
  dailyEurCents,
  fixedCostsCentsForDay,
  monthlyEurCents,
  subscriptionTotals,
} from "../subscriptions";

/**
 * 💳 Charges fixes — fenêtres de facturation.
 * Le MEMO le dit : « un chiffre en dur non vérifiable finit par mentir ».
 * Ces tests figent les dates décidées par Badr : les toucher casse le test
 * au lieu de fausser les dépenses et la marge en silence.
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
  });

  it("fait tomber les charges du jour de ~147 € à ~105 €", () => {
    expect(Math.round(fixedCostsCentsForDay("2026-08-16") / 100)).toBe(147);
    expect(Math.round(fixedCostsCentsForDay("2026-08-17") / 100)).toBe(105);
  });

  it("sort des totaux courants une fois la fenêtre passée", () => {
    const avant = subscriptionTotals("2026-08-16").monthlyCents;
    const apres = subscriptionTotals("2026-08-17").monthlyCents;
    expect(avant - apres).toBe(monthlyEurCents(seif()));
  });

  it("n'est plus une avance perso d'Adnane : rien à rembourser entre associés", () => {
    expect(seif().paidBy).toBeUndefined();
    expect(seif().noBankClaim).toBe(true);
  });
});
