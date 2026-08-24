import { describe, expect, it } from "vitest";
import { buildProductSeries, type ProductRawBuckets } from "../analytics";
import type { Totals } from "../data";

/**
 * 🎽 Séries par produit de l'onglet Mois (filtre Badr, 24/08).
 * L'invariant qui compte : Gilet + Polo + Testing = le global de CET onglet,
 * composant par composant. S'il casse, le tableau ment sur le CA d'un pays.
 */

const day = (d: string, t: Partial<Totals>): Totals & { day: string } => ({
  day: d,
  orders: 0, caCents: 0, spendCents: 0, cogsCents: 0, cogsProductCents: 0,
  cogsUpsellsCents: 0, taxCents: 0, feesCents: 0, netCents: 0, refundedCents: 0,
  ...t,
});

const raw: ProductRawBuckets = {
  gilet: {
    "2026-08-24|GLOBAL": { orders: 5, caCents: 42989, cogsCents: 12000, taxCents: 1500 },
    "2026-08-24|FR": { orders: 4, caCents: 32989, cogsCents: 9000, taxCents: 1200 },
  },
  nira: {},
  spend: {
    "2026-08-24|GLOBAL": { gilet: 18312, testing: 0 },
    "2026-08-24|FR": { gilet: 14000, testing: 0 },
  },
};

const globalByTab = {
  GLOBAL: [day("2026-08-24", { orders: 34, caCents: 258038, spendCents: 97253, cogsCents: 70000, taxCents: 9000, feesCents: 13000 })],
  FR: [day("2026-08-24", { orders: 20, caCents: 150000, spendCents: 50000, cogsCents: 40000, taxCents: 5000, feesCents: 7500 })],
};

describe("buildProductSeries", () => {
  const out = buildProductSeries(raw, globalByTab);

  it("somme exactement au global de chaque onglet, composant par composant", () => {
    for (const tab of ["GLOBAL", "FR"] as const) {
      const g = globalByTab[tab][0];
      const parts = [out.GILET[tab][0], out.POLO[tab][0], out.TESTING[tab][0]];
      for (const field of ["orders", "caCents", "spendCents", "cogsCents", "taxCents", "feesCents"] as const) {
        expect(parts.reduce((s, p) => s + p[field], 0), `${tab}.${field}`).toBe(g[field]);
      }
    }
  });

  it("mesure le Gilet, et laisse le Polo absorber le solde", () => {
    expect(out.GILET.GLOBAL[0].caCents).toBe(42989);
    expect(out.GILET.GLOBAL[0].spendCents).toBe(18312);
    expect(out.POLO.GLOBAL[0].caCents).toBe(258038 - 42989);
    expect(out.POLO.GLOBAL[0].spendCents).toBe(97253 - 18312);
  });

  it("croise bien produit × pays : le FR ne voit que ses commandes", () => {
    expect(out.GILET.FR[0].caCents).toBe(32989);
    expect(out.GILET.FR[0].orders).toBe(4);
  });

  it("recalcule le net de chaque bloc depuis ses composants", () => {
    const g = out.GILET.GLOBAL[0];
    expect(g.netCents).toBe(g.caCents - g.spendCents - g.cogsCents - g.taxCents - g.feesCents);
  });

  it("ne dépasse jamais le global même si la mesure brute est plus grande (désynchro)", () => {
    const gonfle = buildProductSeries(
      { ...raw, gilet: { "2026-08-24|FR": { orders: 99, caCents: 999999, cogsCents: 0, taxCents: 0 } } },
      { FR: globalByTab.FR }
    );
    expect(gonfle.GILET.FR[0].caCents).toBe(150000);
    expect(gonfle.POLO.FR[0].caCents).toBe(0);
    expect(gonfle.POLO.FR[0].caCents).toBeGreaterThanOrEqual(0);
  });

  it("rend une série par jour même sans aucune donnée produit", () => {
    const vide = buildProductSeries({ gilet: {}, nira: {}, spend: {} }, globalByTab);
    expect(vide.GILET.GLOBAL[0].caCents).toBe(0);
    expect(vide.POLO.GLOBAL[0].caCents).toBe(258038);
  });
});
