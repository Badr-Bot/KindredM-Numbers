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

describe("Vmake — un seul outil, deux tarifs (Badr 20/08 : « c'est le même outil »)", () => {
  it("ne compte jamais les deux lignes le même jour", () => {
    const lignes = SUBSCRIPTIONS.filter((s) => s.label.startsWith("Vmake"));
    expect(lignes).toHaveLength(2);
    for (const jour of ["2026-06-01", "2026-08-13", "2026-08-14", "2026-08-20"]) {
      const actives = lignes.filter((s) => jour >= s.startDay && (s.endDay === null || jour <= s.endDay));
      expect(actives).toHaveLength(1);
    }
  });

  it("bascule de 8,80 € à 9,99 € le 14/08", () => {
    const actif = (jour: string) =>
      SUBSCRIPTIONS.find((s) => s.label.startsWith("Vmake") && jour >= s.startDay && (s.endDay === null || jour <= s.endDay))!;
    expect(actif("2026-08-13").amount).toBe(8.8);
    expect(actif("2026-08-14").amount).toBe(9.99);
  });
});

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

  it("fait tomber les charges du jour de ~147 € à ~104 €", () => {
    expect(Math.round(fixedCostsCentsForDay("2026-08-16") / 100)).toBe(147);
    expect(Math.round(fixedCostsCentsForDay("2026-08-17") / 100)).toBe(104);
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

describe("Monteur — arrêté le 29/08 (Badr : « plus de monteur depuis aujourd'hui »)", () => {
  const monteur = () => SUBSCRIPTIONS.find((s) => s.label === "Monteur")!;

  it("est compté jusqu'au 28/08 inclus, et plus rien à partir du 29/08", () => {
    const s = monteur();
    expect(s.endDay).toBe("2026-08-28");
    const jour = dailyEurCents(s);
    expect(fixedCostsCentsForDay("2026-08-28") - fixedCostsCentsForDay("2026-08-29")).toBe(jour);
  });

  it("garde tout son historique depuis le 21/05 (pause, pas suppression)", () => {
    // La ligne doit rester : les jours déjà payés ne doivent JAMAIS perdre
    // leur charge parce qu'un contrat s'arrête plus tard.
    expect(monteur().startDay).toBe("2026-05-21");
    expect(fixedCostsCentsForDay("2026-08-27")).toBeGreaterThan(fixedCostsCentsForDay("2026-08-29"));
  });

  it("sort des totaux mensuels courants (~563 € de moins)", () => {
    const avant = subscriptionTotals("2026-08-28").monthlyCents;
    const apres = subscriptionTotals("2026-08-29").monthlyCents;
    expect(avant - apres).toBe(monthlyEurCents(monteur()));
  });
});
