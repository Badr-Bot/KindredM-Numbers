import { describe, expect, it } from "vitest";
import {
  classifyLineItems,
  classifyLineItemsTolerant,
  computeOrderCogsTaxTolerant,
  computeDailyAggregate,
  computeOrderCogsTax,
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
 *
 * feesCents/netCents mis à jour le 27/07 (frais 9,5% → 4%, TVA 5,5% retirée
 * du calcul du net sur demande Badr) — caCents/spendCents/cogsCents
 * inchangés depuis, seule la formule des frais change. taxCents mis à jour
 * le 04/08 (taxe UE : forfait 3€/colis au lieu de 3€/produit distinct) —
 * dans ces 4 fixtures (1 seul type de produit par commande), le montant ne
 * change pas, seul le raisonnement (calculé via `true`, pas un compteur).
 */
describe("Fixtures §8 — validation au centime", () => {
  it("Fixture 1 — ES · 2026-07-04 : 8 cmd toutes 2pcs (dest. ES)", () => {
    const orders = 8;
    const caCents = 47992;
    const spendCents = 18427;
    const cogsCents = orders * poloCogsCents("ES", 2);
    // dest ES (UE), commande non vide → 3 € × 8 colis
    const taxCents = orders * euTaxCents("ES", "2026-07-04", true);

    expect(cogsCents).toBe(11896);
    expect(taxCents).toBe(2400);

    const agg = computeDailyAggregate({ orders, caCents, spendCents, cogsCents, taxCents });
    expect(agg.feesCents).toBe(1920);
    expect(agg.netCents).toBe(13349);
    expect(Math.round(roas(caCents, spendCents)! * 100) / 100).toBe(2.6);
  });

  it("Fixture 2 — ES · 2026-07-03 : 6× 2pcs + 1× 4pcs", () => {
    const caCents = 44993;
    const spendCents = 29609;
    const cogsCents = 6 * poloCogsCents("ES", 2) + 1 * poloCogsCents("ES", 4);
    const taxCents = 7 * euTaxCents("ES", "2026-07-03", true);

    expect(cogsCents).toBe(11575);
    expect(taxCents).toBe(2100);

    const agg = computeDailyAggregate({ orders: 7, caCents, spendCents, cogsCents, taxCents });
    expect(agg.feesCents).toBe(1800);
    expect(agg.netCents).toBe(-91);
  });

  it("Fixture 3 — UK · 2026-07-03 : 1 cmd 2pcs (dest. GB), GB hors UE → pas de taxe", () => {
    const caCents = 5766;
    const spendCents = 4218;
    const cogsCents = poloCogsCents("GB", 2);
    // dest GB (hors UE depuis le Brexit) → 0
    const taxCents = euTaxCents("GB", "2026-07-03", true);

    expect(cogsCents).toBe(1330);
    expect(taxCents).toBe(0);

    const agg = computeDailyAggregate({ orders: 1, caCents, spendCents, cogsCents, taxCents });
    expect(agg.feesCents).toBe(231);
    expect(agg.netCents).toBe(-13);
  });

  it("Fixture 4 — DE · 2026-07-01 : 2× 2pcs + 2× 4pcs", () => {
    const caCents = 29996;
    const spendCents = 6534;
    const cogsCents = 2 * poloCogsCents("DE", 2) + 2 * poloCogsCents("DE", 4);
    const taxCents = 4 * euTaxCents("DE", "2026-07-01", true);

    expect(cogsCents).toBe(8334);
    expect(taxCents).toBe(1200);

    const agg = computeDailyAggregate({ orders: 4, caCents, spendCents, cogsCents, taxCents });
    expect(agg.feesCents).toBe(1200);
    expect(agg.netCents).toBe(12728);
  });
});

describe("Cas upsell synthétique — ES 2pcs polo + 1 CHINO_SHORTS", () => {
  it("COGS = 14.87€ + 6.27€, taxe = 3.00€ forfait/colis (04/08, plus par produit)", () => {
    const order = computeOrderCogsTax({
      store: "ES",
      shippingCountry: "ES",
      day: "2026-07-04",
      poloQty: 2,
      upsells: [{ productKey: "CHINO_SHORTS", qty: 1 }],
    });
    expect(order.cogsProductCents).toBe(1487);
    expect(order.cogsUpsellsCents).toBe(627);
    // 1 colis vers l'UE, peu importe le nombre de produits dedans → 3 €
    expect(order.taxCents).toBe(300);
  });
});

describe("GILET — grille DDP par pays, paliers 1/2/3 (devis Panda, 31/07)", () => {
  it("paliers directs 1/2/3 pcs, par pays de destination", () => {
    expect(upsellCogsCents("GILET", "FR", 1)).toBe(890);
    expect(upsellCogsCents("GILET", "FR", 2)).toBe(1720);
    expect(upsellCogsCents("GILET", "FR", 3)).toBe(2555);
    expect(upsellCogsCents("GILET", "GB", 2)).toBe(1564);
    expect(upsellCogsCents("GILET", "DE", 2)).toBe(1694);
    // Suisse : présente pour le Gilet uniquement (absente des autres grilles).
    expect(upsellCogsCents("GILET", "CH", 1)).toBe(1125);
  });

  it("hors grille (4 pcs+) : coût marginal basé sur l'écart 2→3 pcs (dernier palier connu)", () => {
    // FR : 3pcs=2555, 2pcs=1720, écart=835 → 4pcs = 2555+835=3390
    expect(upsellCogsCents("GILET", "FR", 4)).toBe(3390);
  });

  it("pays non listé (ex. Luxembourg) : max des pays listés + surcharge conservatrice", () => {
    // 1pc : max listé = Suisse 1125 + 150 (NON_LISTED_SURCHARGE_CENTS)
    expect(upsellCogsCents("GILET", "LU", 1)).toBe(1275);
  });
});

describe("CALECON — grille par pays (Badr, 04/08, déduite de la facture Panda du 01/08)", () => {
  it("linéaire (qty × prix/pièce), prix qui varie par pays de destination", () => {
    // FR/BE/ES = grille officielle déduite de 54 commandes de la facture fournisseur.
    expect(upsellCogsCents("CALECON", "FR", 1)).toBe(246);
    expect(upsellCogsCents("CALECON", "FR", 2)).toBe(492);
    expect(upsellCogsCents("CALECON", "FR", 6)).toBe(1476);
    expect(upsellCogsCents("CALECON", "BE", 1)).toBe(274);
    expect(upsellCogsCents("CALECON", "ES", 1)).toBe(247);
  });

  it("pays non listé (ex. GB/CH/LU) = max des pays listés + surcharge conservatrice", () => {
    // max listé = BE 2,74€ = 274 cents + 150 (NON_LISTED_SURCHARGE_CENTS)
    expect(upsellCogsCents("CALECON", "GB", 1)).toBe(424);
    expect(upsellCogsCents("CALECON", "CH", 1)).toBe(424);
    expect(upsellCogsCents("CALECON", "LU", 1)).toBe(424);
  });
});

describe("EBOOK — numérique, coût nul (régression 06/08)", () => {
  // Le 06/08, EBOOK était dans UPSELL_PRODUCT_KEYS sans coût défini : le
  // moteur levait TypeError (grille inexistante) et la synchro SAUTAIT LE
  // STORE ENTIER (« FR ignoré » — plus aucune commande FR/ES enregistrée).
  // Ce test garantit qu'une clé numérique renvoie 0 au lieu de planter.
  it("renvoie 0 pour toute quantité et tout pays, sans lever", () => {
    expect(upsellCogsCents("EBOOK", "FR", 1)).toBe(0);
    expect(upsellCogsCents("EBOOK", "ES", 2)).toBe(0);
    expect(upsellCogsCents("EBOOK", "US", 7)).toBe(0);
  });
});

describe("Taxe UE — forfait 3€/colis (révision Badr 04/08, ex-« 3€/produit distinct »)", () => {
  it("3 € par commande UE non vide, peu importe le nombre ou le type de produits dedans", () => {
    // 4 polos seuls = 3 €
    expect(euTaxCents("ES", "2026-07-04", true)).toBe(300);
    // 1 polo + 1 chemise = toujours 3 € (pas 6 € comme dans l'ancienne règle)
    expect(euTaxCents("ES", "2026-07-04", true)).toBe(300);
    // 1 polo + 2 upsells différents = toujours 3 € (pas 9 €)
    expect(euTaxCents("FR", "2026-07-04", true)).toBe(300);
  });

  it("une commande 100% caleçons (colis quand même expédié) est taxée comme les autres", () => {
    // Confirmé par la facture fournisseur (commande #5304, CALECONx6, taxée 3€) —
    // contredit l'ancienne exemption caleçon du 03/08, abandonnée.
    expect(euTaxCents("FR", "2026-08-04", true)).toBe(300);
  });

  it("commande vide (aucun article) = 0 €, cas défensif", () => {
    expect(euTaxCents("FR", "2026-08-04", false)).toBe(0);
  });

  it("0 avant le 2026-07-01, quelle que soit la destination", () => {
    expect(euTaxCents("ES", "2026-06-30", true)).toBe(0);
    expect(euTaxCents("FR", "2026-06-30", true)).toBe(0);
  });

  it("uniquement pour une destination dans l'UE", () => {
    expect(euTaxCents("FR", "2026-07-01", true)).toBe(300); // France = UE
    expect(euTaxCents("IT", "2026-07-01", true)).toBe(300); // Italie = UE
    expect(euTaxCents("SE", "2026-07-01", true)).toBe(300); // Suède = UE
    expect(euTaxCents("GB", "2026-07-01", true)).toBe(0); // GB hors UE
    expect(euTaxCents("CA", "2026-07-01", true)).toBe(0); // Canada hors UE
    expect(euTaxCents("CH", "2026-07-01", true)).toBe(0); // Suisse hors UE
    expect(euTaxCents("US", "2026-07-01", true)).toBe(0); // USA hors UE
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

describe("Frais 4% — arrondi à l'agrégat, pas par commande", () => {
  it("round(CA_jour × 0,04), pas la somme des arrondis par commande", () => {
    // 13 commandes identiques à 59.99€ (5999 cents) : la somme des arrondis
    // par commande (13×240=3120) diffère de l'arrondi sur l'agrégat (3119).
    // Le spec (fixture 1) valide l'agrégat : c'est la seule méthode correcte.
    const perOrderRoundedSum = 13 * Math.round(5999 * 0.04);
    const aggregateRounded = feesCentsForCa(13 * 5999);
    expect(aggregateRounded).toBe(3119);
    expect(perOrderRoundedSum).toBe(3120);
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
    // Scénario du 26/07 qui tuait tout le lot FR : une clé mappée dans
    // products_map mais absente des grilles §4.3. (À l'époque c'était CALECON ;
    // il a désormais un vrai COGS — cf. describe « CALECON » plus bas — donc on
    // reproduit le cas avec une clé encore non tarifée.)
    expect(() =>
      computeOrderCogsTax({
        store: "FR",
        shippingCountry: "FR",
        day: "2026-07-26",
        poloQty: 4,
        upsells: [{ productKey: "CEINTURE_PAS_ENCORE_TARIFEE", qty: 1 }],
      })
    ).toThrow(UnmappedProductError);

    const tolerant = computeOrderCogsTaxTolerant({
      store: "FR",
      shippingCountry: "FR",
      day: "2026-07-26",
      poloQty: 4,
      upsells: [{ productKey: "CEINTURE_PAS_ENCORE_TARIFEE", qty: 1 }],
    });
    // Le COGS polo reste exact ; seul l'upsell inconnu est à 0 et signalé.
    expect(tolerant.cogsProductCents).toBe(poloCogsCents("FR", 4));
    expect(tolerant.cogsUpsellsCents).toBe(0);
    expect(tolerant.unknownUpsellKeys).toEqual(["CEINTURE_PAS_ENCORE_TARIFEE"]);
  });

  it("CALECON a désormais un vrai COGS (grille par pays) et n'est plus signalé", () => {
    const res = computeOrderCogsTaxTolerant({
      store: "FR",
      shippingCountry: "FR",
      day: "2026-07-31",
      poloQty: 4,
      upsells: [{ productKey: "CALECON", qty: 3 }],
    });
    expect(res.cogsUpsellsCents).toBe(738); // 3 × 246 (grille FR)
    expect(res.unknownUpsellKeys).toEqual([]);
  });

  it("un produit inconnu compte comme un colis non vide pour la taxe UE (prudence)", () => {
    const res = computeOrderCogsTaxTolerant({
      store: "FR",
      shippingCountry: "FR",
      day: "2026-07-26",
      poloQty: 0,
      upsells: [],
      unknownDistinctCount: 1,
    });
    // Commande "vide" côté connu, mais 1 produit inconnu = quand même un colis → 3 €
    expect(res.taxCents).toBe(300);
  });
});
