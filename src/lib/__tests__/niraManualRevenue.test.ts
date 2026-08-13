import { describe, expect, it } from "vitest";
import { NIRA_ENTRIES } from "../manualRevenue";

/**
 * NIRA (Canada, USD) — recalé sur l'export des transactions du 12/08.
 *
 * Deux pièges que ce test verrouille :
 *  1. DOUBLE COMPTAGE — 3 des 4 commandes de l'export étaient déjà saisies
 *     (annoncées oralement les 06 et 07/08). Les entrées doivent REMPLACER
 *     les anciennes, pas s'y ajouter : 4 commandes au total, jamais 7.
 *  2. TRANSACTIONS EN ÉCHEC — #1004 porte deux tentatives `failure` le 06/08
 *     avant de passer le 09/08. Seule la réussie compte (même règle que
 *     shopifyFees.ts) ; les compter aurait triplé cette commande.
 */
describe("NIRA — export transactions du 12/08", () => {
  const total = (f: (e: (typeof NIRA_ENTRIES)[number]) => number) =>
    NIRA_ENTRIES.reduce((t, e) => t + f(e), 0);

  it("compte exactement les 4 commandes réussies, sans les 2 échecs", () => {
    expect(total((e) => e.orders)).toBe(4);
    // 45,67 + 81,29 + 118,75 + 81,30 $ — les deux `failure` de #1004 exclues.
    expect(total((e) => e.caCents)).toBe(32701);
  });

  it("impute #1004 au jour de la COMMANDE (06/08), pas de l'encaissement (09/08)", () => {
    const jours = NIRA_ENTRIES.map((e) => e.day);
    expect(jours).toEqual(["2026-08-06", "2026-08-07"]);
    // 06/08 = #1001 + #1002 + #1004 (45,67 + 81,29 + 81,30 = 208,26 $)
    const j6 = NIRA_ENTRIES.find((e) => e.day === "2026-08-06")!;
    expect(j6.orders).toBe(3);
    expect(j6.caCents).toBe(20826);
  });

  it("aucune taxe UE : destination Canada", () => {
    expect(NIRA_ENTRIES.every((e) => e.taxEurCents === 0)).toBe(true);
  });

  it("convertit en EUR au taux fourni, sans arrondi recopié à la main", () => {
    for (const e of NIRA_ENTRIES) {
      expect(e.caEurCents).toBe(Math.round(e.caCents * e.rateToEur));
      expect(e.cogsEurCents).toBe(Math.round(e.cogsCents * e.rateToEur));
    }
    expect(total((e) => e.caEurCents)).toBe(28339); // 283,39 €
  });

  it("les COGS et frais non communiqués restent à 0 — signalés, jamais inventés", () => {
    // COGS connus : #1001 13,29 + #1002 22,26 = 35,55 $. #1003 et #1004 : 0.
    expect(total((e) => e.cogsCents)).toBe(3555);
    // Frais absents de l'export → aucune valeur inventée.
    expect(NIRA_ENTRIES.every((e) => e.feesEurCents === undefined)).toBe(true);
  });
});
