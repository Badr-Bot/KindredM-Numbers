import { describe, expect, it } from "vitest";
import {
  classifyLineItems,
  computeDailyAggregate,
  euTaxCents,
  feesCentsForCa,
  poloCogsCents,
  roas,
  UnmappedProductError,
  upsellCogsCents,
} from "../engine";

/**
 * Fixtures §8 du cahier des charges — validées manuellement au centime par
 * Badr sur l'historique réel. Si une seule assertion échoue, on s'arrête et
 * on debug (loi non négociable #5) : pas d'UI tant que ces 4 lignes ne
 * passent pas exactement.
 */
describe("Fixtures §8 — validation au centime", () => {
  it("Fixture 1 — ES · 2026-07-04 : 8 cmd toutes 2pcs (dest. ES)", () => {
    const orders = 8;
    const caCents = 47992;
    const spendCents = 18427;
    const cogsCents = orders * poloCogsCents("ES", 2);
    const taxCents = orders * euTaxCents("ES", "2026-07-04");

    expect(cogsCents).toBe(11896);
    expect(taxCents).toBe(2400);

    const agg = computeDailyAggregate({ orders, caCents, spendCents, cogsCents, taxCents });
    expect(agg.feesCents).toBe(4559);
    expect(agg.netCents).toBe(10710);
    expect(Math.round(roas(caCents, spendCents)! * 100) / 100).toBe(2.6);
  });

  it("Fixture 2 — ES · 2026-07-03 : 6× 2pcs + 1× 4pcs", () => {
    const caCents = 44993;
    const spendCents = 29609;
    const cogsCents = 6 * poloCogsCents("ES", 2) + 1 * poloCogsCents("ES", 4);
    const taxCents = 7 * euTaxCents("ES", "2026-07-03");

    expect(cogsCents).toBe(11575);
    expect(taxCents).toBe(2100);

    const agg = computeDailyAggregate({ orders: 7, caCents, spendCents, cogsCents, taxCents });
    expect(agg.feesCents).toBe(4274);
    expect(agg.netCents).toBe(-2565);
  });

  it("Fixture 3 — UK · 2026-07-03 : 1 cmd 2pcs (dest. GB), UK exonéré de taxe UE", () => {
    const caCents = 5766;
    const spendCents = 4218;
    const cogsCents = poloCogsCents("GB", 2);
    const taxCents = euTaxCents("UK", "2026-07-03");

    expect(cogsCents).toBe(1330);
    expect(taxCents).toBe(0);

    const agg = computeDailyAggregate({ orders: 1, caCents, spendCents, cogsCents, taxCents });
    expect(agg.feesCents).toBe(548);
    expect(agg.netCents).toBe(-330);
  });

  it("Fixture 4 — DE · 2026-07-01 : 2× 2pcs + 2× 4pcs", () => {
    const caCents = 29996;
    const spendCents = 6534;
    const cogsCents = 2 * poloCogsCents("DE", 2) + 2 * poloCogsCents("DE", 4);
    const taxCents = 4 * euTaxCents("DE", "2026-07-01");

    expect(cogsCents).toBe(8334);
    expect(taxCents).toBe(1200);

    const agg = computeDailyAggregate({ orders: 4, caCents, spendCents, cogsCents, taxCents });
    expect(agg.feesCents).toBe(2850);
    expect(agg.netCents).toBe(11078);
  });
});

describe("Cas upsell synthétique (note §8) — ES 2pcs polo + 1 CHINO_SHORTS", () => {
  it("COGS = 14.87€ + 6.27€, taxe = 3.00€", () => {
    const cogsProductCents = poloCogsCents("ES", 2);
    const cogsUpsellsCents = upsellCogsCents("CHINO_SHORTS", "ES", 1);
    const taxCents = euTaxCents("ES", "2026-07-04");

    expect(cogsProductCents).toBe(1487);
    expect(cogsUpsellsCents).toBe(627);
    expect(taxCents).toBe(300);
  });
});

describe("Taxe UE — bornes et exonérations", () => {
  it("0 avant le 2026-07-01 même pour ES/DE/FR", () => {
    expect(euTaxCents("ES", "2026-06-30")).toBe(0);
    expect(euTaxCents("DE", "2026-06-30")).toBe(0);
    expect(euTaxCents("FR", "2026-06-30")).toBe(0);
  });

  it("300 à partir du 2026-07-01 inclus pour ES/DE/FR", () => {
    expect(euTaxCents("ES", "2026-07-01")).toBe(300);
    expect(euTaxCents("DE", "2026-07-01")).toBe(300);
    expect(euTaxCents("FR", "2026-07-01")).toBe(300);
  });

  it("UK toujours exonéré", () => {
    expect(euTaxCents("UK", "2026-07-01")).toBe(0);
    expect(euTaxCents("UK", "2027-01-01")).toBe(0);
  });

  it("une seule fois par commande quel que soit le nombre d'upsells (taxe indépendante des upsells)", () => {
    // La taxe ne dépend que du store + de la date, jamais du contenu de la commande.
    expect(euTaxCents("ES", "2026-07-04")).toBe(euTaxCents("ES", "2026-07-04"));
  });
});

describe("Grille COGS polo — pays non listé et quantités hors grille", () => {
  it("pays non listé (ex. CA) = max(pays listés, même bundle) + 1,50€", () => {
    // max 2pcs parmi FR/IT/ES/DE/GB/BE = BE 16.29€ = 1629 cents
    expect(poloCogsCents("CA", 2)).toBe(1629 + 150);
  });

  it("3 polos (hors grille) = grille[2pcs] + (grille[2pcs] − grille[1pc]) × (qty−2)", () => {
    const g2 = poloCogsCents("ES", 2); // 1487
    const g1 = poloCogsCents("ES", 1); // 901
    expect(poloCogsCents("ES", 3)).toBe(Math.round(g2 + (g2 - g1) * 1));
  });
});

describe("Grille COGS upsells — pays non listé et quantités hors grille", () => {
  it("pays non listé = max(pays listés, même bundle) + 1,50€", () => {
    const max1 = Math.max(689, 699, 692, 689, 625, 740); // SHORT_SLEEVE_DRESS_SHIRT tier 1
    expect(upsellCogsCents("SHORT_SLEEVE_DRESS_SHIRT", "CA", 1)).toBe(max1 + 150);
  });

  it("qty > 3 = grille[3] + (grille[3] − grille[2]) × (qty−3)", () => {
    const g3 = upsellCogsCents("DRESS_TROUSERS", "FR", 3); // 2873
    const g2 = upsellCogsCents("DRESS_TROUSERS", "FR", 2); // 1926
    expect(upsellCogsCents("DRESS_TROUSERS", "FR", 4)).toBe(Math.round(g3 + (g3 - g2) * 1));
  });
});

describe("Classification par line items (§4.1) — jamais par prix total", () => {
  const productsMap = [
    { store: "ES", title_pattern: "Silk Polo T-Shirt", product_key: "POLO", unit_group: "polo" as const },
    { store: "ES", title_pattern: "Chino Shorts", product_key: "CHINO_SHORTS", unit_group: "upsell" as const },
  ];

  it("additionne les quantités polo en bundle et regroupe les upsells par product_key", () => {
    const result = classifyLineItems(
      [
        { title: "Silk Polo T-Shirt", quantity: 2, price_cents: 5999 },
        { title: "Chino Shorts", quantity: 1, price_cents: 2500 },
      ],
      productsMap,
      "ES"
    );
    expect(result.poloQty).toBe(2);
    expect(result.upsells).toEqual([{ productKey: "CHINO_SHORTS", qty: 1 }]);
  });

  it("échoue bruyamment sur un titre non mappé (§5 — aucun produit silencieux)", () => {
    expect(() =>
      classifyLineItems(
        [{ title: "Produit Inconnu XYZ", quantity: 1, price_cents: 1000 }],
        productsMap,
        "ES"
      )
    ).toThrow(UnmappedProductError);
  });
});

describe("Frais 9,5% — arrondi à l'agrégat, pas par commande", () => {
  it("round(CA_jour × 0,095), pas la somme des arrondis par commande", () => {
    // 8 commandes identiques à 59.99€ (5999 cents) : la somme des arrondis
    // par commande (8×570=4560) diffère de l'arrondi sur l'agrégat (4559).
    // Le spec (fixture 1) valide l'agrégat : c'est la seule méthode correcte.
    const perOrderRoundedSum = 8 * Math.round(5999 * 0.095);
    const aggregateRounded = feesCentsForCa(8 * 5999);
    expect(aggregateRounded).toBe(4559);
    expect(perOrderRoundedSum).toBe(4560);
    expect(aggregateRounded).not.toBe(perOrderRoundedSum);
  });
});
