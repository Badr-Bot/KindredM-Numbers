import { describe, expect, it } from "vitest";
import { NIRA_ENTRIES } from "../manualRevenue";
import { niraCogsUsdCents } from "../engine";

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

  it("COGS calculés depuis le devis Panda, pas annoncés à la main", () => {
    // 06/08 : 1 pack (13,29) + 2 packs (22,26) + 2 packs (22,26) = 57,81 $
    const j6 = NIRA_ENTRIES.find((e) => e.day === "2026-08-06")!;
    expect(j6.cogsCents).toBe(1329 + 2226 + 2226);
    // 07/08 : #1003 = 3 packs Canada = 31,03 $ (packs déduits du prix)
    const j7 = NIRA_ENTRIES.find((e) => e.day === "2026-08-07")!;
    expect(j7.cogsCents).toBe(niraCogsUsdCents("CA", 3));
    expect(j7.cogsCents).toBe(3103);
    // La grille recoupe exactement les 2 COGS connus avant le devis — c'est
    // ce raccord qui valide qu'on lit la bonne ligne du tableau.
    expect(niraCogsUsdCents("CA", 1)).toBe(1329);
    expect(niraCogsUsdCents("CA", 2)).toBe(2226);
  });

  it("applique 6 % de frais sur le CA (taux donné par Badr)", () => {
    for (const e of NIRA_ENTRIES) {
      const fraisUsd = Math.round(e.caCents * 0.06);
      expect(e.feesEurCents).toBe(Math.round(fraisUsd * e.rateToEur));
    }
  });
});

describe("Grille COGS NIRA (devis Panda Dropshipping, USD)", () => {
  it("reprend le devis au centime : produit + livraison, par pays", () => {
    expect(niraCogsUsdCents("US", 1)).toBe(1476); // 3,10 + 11,66
    expect(niraCogsUsdCents("US", 4)).toBe(4517); // 12,41 + 32,76
    expect(niraCogsUsdCents("GB", 2)).toBe(1883); // 6,20 + 12,63
    expect(niraCogsUsdCents("CA", 4)).toBe(3980); // 12,41 + 27,39
    expect(niraCogsUsdCents("AU", 3)).toBe(2044); // 9,31 + 11,13
  });

  it("pays hors devis = le plus cher des pays devisés + surcharge prudente", () => {
    // Le devis ne couvre que US/GB/CA/AU. Un 5e pays ne doit jamais coûter 0.
    expect(niraCogsUsdCents("FR", 1)).toBe(1476 + 150); // max(1 pack) = USA
    expect(niraCogsUsdCents("DE", 2)).toBe(2391 + 150);
  });

  it("au-delà de 4 packs : extrapolation par le coût marginal 3→4", () => {
    // Canada : 4p = 3980, 3p = 3103 → 5p = 3980 + 877
    expect(niraCogsUsdCents("CA", 5)).toBe(3980 + (3980 - 3103));
    expect(niraCogsUsdCents("CA", 0)).toBe(0);
  });
});
