import { describe, expect, it } from "vitest";
import {
  classifyLineItems,
  classifyLineItemsTolerant,
  computeOrderCogsTaxTolerant,
  computeDailyAggregate,
  computeOrderCogsTax,
  distinctProductCount,
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
    // polo seul = 1 produit distinct, dest ES (UE) → 3 € × 8
    const taxCents = orders * euTaxCents("ES", "2026-07-04", 1);

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
    const taxCents = 7 * euTaxCents("ES", "2026-07-03", 1);

    expect(cogsCents).toBe(11575);
    expect(taxCents).toBe(2100);

    const agg = computeDailyAggregate({ orders: 7, caCents, spendCents, cogsCents, taxCents });
    expect(agg.feesCents).toBe(4274);
    expect(agg.netCents).toBe(-2565);
  });

  it("Fixture 3 — UK · 2026-07-03 : 1 cmd 2pcs (dest. GB), GB hors UE → pas de taxe", () => {
    const caCents = 5766;
    const spendCents = 4218;
    const cogsCents = poloCogsCents("GB", 2);
    // dest GB (hors UE depuis le Brexit) → 0
    const taxCents = euTaxCents("GB", "2026-07-03", 1);

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
    const taxCents = 4 * euTaxCents("DE", "2026-07-01", 1);

    expect(cogsCents).toBe(8334);
    expect(taxCents).toBe(1200);

    const agg = computeDailyAggregate({ orders: 4, caCents, spendCents, cogsCents, taxCents });
    expect(agg.feesCents).toBe(2850);
    expect(agg.netCents).toBe(11078);
  });
});

describe("Cas upsell synthétique — ES 2pcs polo + 1 CHINO_SHORTS", () => {
  it("COGS = 14.87€ + 6.27€, taxe = 6.00€ (2 produits distincts, dest UE)", () => {
    const order = computeOrderCogsTax({
      store: "ES",
      shippingCountry: "ES",
      day: "2026-07-04",
      poloQty: 2,
      upsells: [{ productKey: "CHINO_SHORTS", qty: 1 }],
    });
    expect(order.cogsProductCents).toBe(1487);
    expect(order.cogsUpsellsCents).toBe(627);
    // polo + chino = 2 produits distincts → 3 € × 2
    expect(order.taxCents).toBe(600);
  });
});

describe("Taxe UE — règle révisée (par produit distinct × destination UE)", () => {
  it("3 € par produit distinct, jamais multiplié par la quantité", () => {
    // 4 polos = 1 produit distinct = 3 €
    expect(euTaxCents("ES", "2026-07-04", distinctProductCount(4, []))).toBe(300);
    // 1 polo + 1 chemise = 2 produits distincts = 6 €
    expect(
      euTaxCents("ES", "2026-07-04", distinctProductCount(1, [{ productKey: "SHORT_SLEEVE_DRESS_SHIRT" }]))
    ).toBe(600);
    // 1 polo + 2 upsells différents = 3 produits distincts = 9 €
    expect(
      euTaxCents("FR", "2026-07-04", distinctProductCount(2, [
        { productKey: "CHINO_SHORTS" },
        { productKey: "DRESS_TROUSERS" },
      ]))
    ).toBe(900);
  });

  it("deux fois le même upsell = 1 seul produit distinct", () => {
    expect(distinctProductCount(0, [
      { productKey: "CHINO_SHORTS" },
      { productKey: "CHINO_SHORTS" },
    ])).toBe(1);
  });

  it("0 avant le 2026-07-01, quelle que soit la destination", () => {
    expect(euTaxCents("ES", "2026-06-30", 1)).toBe(0);
    expect(euTaxCents("FR", "2026-06-30", 3)).toBe(0);
  });

  it("uniquement pour une destination dans l'UE", () => {
    expect(euTaxCents("FR", "2026-07-01", 1)).toBe(300); // France = UE
    expect(euTaxCents("IT", "2026-07-01", 1)).toBe(300); // Italie = UE
    expect(euTaxCents("SE", "2026-07-01", 1)).toBe(300); // Suède = UE
    expect(euTaxCents("GB", "2026-07-01", 1)).toBe(0); // GB hors UE
    expect(euTaxCents("CA", "2026-07-01", 1)).toBe(0); // Canada hors UE
    expect(euTaxCents("CH", "2026-07-01", 1)).toBe(0); // Suisse hors UE
    expect(euTaxCents("US", "2026-07-01", 1)).toBe(0); // USA hors UE
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

describe("Grille COGS upsells — paliers 1/2/4 (correction 3→4 pcs, 06/07/2026)", () => {
  it("pays non listé = max(pays listés, même bundle) + 1,50€", () => {
    const max1 = Math.max(689, 699, 692, 689, 625, 740); // SHORT_SLEEVE_DRESS_SHIRT tier 1
    expect(upsellCogsCents("SHORT_SLEEVE_DRESS_SHIRT", "CA", 1)).toBe(max1 + 150);
  });

  it("le palier 4 pcs = la valeur ex-« 3 pcs » du tableau (inchangée)", () => {
    // DRESS_TROUSERS FR : la 3e colonne (2873) est désormais le bundle 4 pcs.
    expect(upsellCogsCents("DRESS_TROUSERS", "FR", 4)).toBe(2873);
  });

  it("qty=3 (hors grille) = grille[2] + (grille[2] − grille[1]) × 1, comme le polo", () => {
    const g2 = upsellCogsCents("DRESS_TROUSERS", "FR", 2); // 1926
    const g1 = upsellCogsCents("DRESS_TROUSERS", "FR", 1); // 984
    expect(upsellCogsCents("DRESS_TROUSERS", "FR", 3)).toBe(Math.round(g2 + (g2 - g1) * 1));
  });

  it("qty=5 (au-delà de 4) extrapole via le coût marginal grille[2]−grille[1]", () => {
    const g2 = upsellCogsCents("CHINO_SHORTS", "ES", 2); // 1235
    const g1 = upsellCogsCents("CHINO_SHORTS", "ES", 1); // 627
    expect(upsellCogsCents("CHINO_SHORTS", "ES", 5)).toBe(Math.round(g2 + (g2 - g1) * 3));
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

/**
 * Régression 26/07 : 12 ventes réelles, 1 seule affichée. Deux causes dans le
 * pipeline de synchro — un produit non mappé faisait « continue » (vente
 * perdue), et un upsell hors grille levait une exception NON rattrapée qui
 * annulait le lot entier du store. Le CA est la donnée la plus critique du
 * dashboard : ces variantes tolérantes garantissent qu'une vente n'est
 * JAMAIS perdue, quitte à signaler un COGS incomplet.
 */
describe("Variantes tolérantes — une vente ne se perd jamais", () => {
  const productsMap = [
    { store: "FR", title_pattern: "Nivafit™ - Polo ultra-confortable", product_key: "POLO", unit_group: "polo" as const },
    { store: "FR", title_pattern: "Nivafit™ - Short en coton extensible", product_key: "CHINO_SHORTS", unit_group: "upsell" as const },
    { store: "FR", title_pattern: "Nivafit — Caleçon Ultra Extensible", product_key: "CALECON", unit_group: "upsell" as const },
  ];

  it("classe la commande et signale le titre inconnu au lieu de la rejeter", () => {
    const res = classifyLineItemsTolerant(
      [
        { title: "Nivafit™ - Polo ultra-confortable", quantity: 2, price_cents: 5998 },
        { title: "E-Book : produit jamais mappé", quantity: 1, price_cents: 0 },
      ],
      productsMap,
      "FR"
    );
    expect(res.poloQty).toBe(2);
    expect(res.unknownTitles).toEqual(["E-Book : produit jamais mappé"]);
    expect(res.unknownDistinctCount).toBe(1);
  });

  it("un upsell hors grille COGS ne fait plus échouer la commande", () => {
    // « CALECON » est mappé dans products_map mais absent des grilles §4.3 :
    // c'est exactement ce qui tuait tout le lot FR le 26/07.
    expect(() =>
      computeOrderCogsTax({
        store: "FR",
        shippingCountry: "FR",
        day: "2026-07-26",
        poloQty: 4,
        upsells: [{ productKey: "CALECON", qty: 1 }],
      })
    ).toThrow(UnmappedProductError);

    const tolerant = computeOrderCogsTaxTolerant({
      store: "FR",
      shippingCountry: "FR",
      day: "2026-07-26",
      poloQty: 4,
      upsells: [{ productKey: "CALECON", qty: 1 }],
    });
    // Le COGS polo reste exact ; seul l'upsell inconnu est à 0 et signalé.
    expect(tolerant.cogsProductCents).toBe(poloCogsCents("FR", 4));
    expect(tolerant.cogsUpsellsCents).toBe(0);
    expect(tolerant.unknownUpsellKeys).toEqual(["CALECON"]);
  });

  it("compte le produit inconnu dans la taxe UE (prudence)", () => {
    const res = computeOrderCogsTaxTolerant({
      store: "FR",
      shippingCountry: "FR",
      day: "2026-07-26",
      poloQty: 2,
      upsells: [],
      unknownDistinctCount: 1,
    });
    // 1 polo distinct + 1 produit inconnu = 2 × 3 €
    expect(res.taxCents).toBe(600);
  });
});
