import { describe, expect, it } from "vitest";
import {
  buildTreasuryBridge,
  orderNumber,
  PRE_LLC_RESIDUAL,
  sumBankBalances,
  supplierUnbilledCents,
  supplierUnbilledDetail,
  UNEXPLAINED_ALERT_CENTS,
  type OrderCostRow,
  type TreasuryInput,
} from "../treasury";

// 🧮 Rapprochement trésorerie — le pont entre le net gagné et l'argent qui est
// vraiment sur les comptes. Cas construits sur la situation réelle du 04/09
// (net 59 316 €, dette fournisseur ~27 000 €, banque ~58 840 €).

const BASE: TreasuryInput = {
  netCumuleCents: 5931571,
  supplierUnbilledCents: 2698847,
  supplierOwedCents: 0,
  enRouteCents: 1950500,
  bankBalances: [
    { currency: "EUR", amountEurCents: 4479958 },
    { currency: "USD", amountEurCents: 116561 },
    { currency: "CAD", amountEurCents: 405400 },
  ],
  scan: null,
};

describe("sumBankBalances", () => {
  it("additionne les soldes convertis", () => {
    expect(sumBankBalances(BASE.bankBalances).totalCents).toBe(4479958 + 116561 + 405400);
  });

  it("liste les devises sans taux au lieu de les compter à zéro", () => {
    const { totalCents, skipped } = sumBankBalances([
      { currency: "EUR", amountEurCents: 100000 },
      { currency: "MAD", amountEurCents: null },
    ]);
    expect(totalCents).toBe(100000);
    expect(skipped).toEqual(["MAD"]);
  });

  it("rend null quand aucun solde n'est lu (banque non branchée)", () => {
    expect(sumBankBalances([]).totalCents).toBeNull();
  });
});

describe("buildTreasuryBridge", () => {
  it("construit le pont net → cash théorique → attendu en banque", () => {
    const b = buildTreasuryBridge(BASE);
    expect(b.cashTheoriqueCents).toBe(5931571 + 2698847);
    expect(b.attenduEnBanqueCents).toBe(5931571 + 2698847 - 1950500);
    expect(b.bankCents).toBe(5001919);
    expect(b.gapCents).toBe(b.attenduEnBanqueCents! - 5001919);
  });

  it("compte la dette sur factures reçues comme de l'argent encore en banque", () => {
    const b = buildTreasuryBridge({ ...BASE, supplierOwedCents: 500000 });
    expect(b.cashTheoriqueCents).toBe(5931571 + 2698847 + 500000);
  });

  it("ne calcule ni attendu ni écart quand le scope Shopify manque", () => {
    const b = buildTreasuryBridge({ ...BASE, enRouteCents: null });
    expect(b.attenduEnBanqueCents).toBeNull();
    expect(b.gapCents).toBeNull();
    expect(b.unexplainedCents).toBeNull();
  });

  it("ventile l'écart et laisse l'inexpliqué à part", () => {
    const b = buildTreasuryBridge({
      ...BASE,
      scan: {
        sinceDay: "2026-05-21",
        coversHistory: true,
        feesCents: 120000,
        googleAdsCents: 90000,
        persoBadrCents: 53100,
        persoFahdCents: 301800,
        societeDatedBadrCents: 84000,
        metaBankCents: 21550000,
        metaSpendCents: 21337236,
      },
    });
    const meta = 21550000 - 21337236;
    expect(b.gapLines.map((l) => l.label)).toEqual([
      "Dépenses perso payées par la carte LLC",
      "Supplément Meta (change + frais carte)",
      "Frais bancaires et de change",
      "Google Ads",
      PRE_LLC_RESIDUAL.label,
    ]);
    // Ce qui reste après la ventilation part d'abord dans le reliquat Revolut
    // (plafonné), l'inexpliqué n'est que l'au-delà.
    const resteAvantRevolut = b.gapCents! - (meta + 120000 + 90000 + 354900);
    expect(b.preLlcRevolutCents).toBe(Math.min(Math.max(resteAvantRevolut, 0), PRE_LLC_RESIDUAL.cents));
    expect(b.unexplainedCents).toBe(resteAvantRevolut - b.preLlcRevolutCents!);
    expect(b.scanPartial).toBe(false);
  });

  it("ignore un débit Meta INFÉRIEUR au spend (décalage de facturation, pas une dépense cachée)", () => {
    const b = buildTreasuryBridge({
      ...BASE,
      scan: {
        sinceDay: "2026-05-21",
        coversHistory: true,
        feesCents: 0,
        googleAdsCents: 0,
        persoBadrCents: 0,
        persoFahdCents: 0,
        societeDatedBadrCents: 0,
        metaBankCents: 20000000,
        metaSpendCents: 21337236,
      },
    });
    // Aucun poste mesuré : seul le reliquat Revolut pré-LLC absorbe l'écart.
    expect(b.gapLines.map((l) => l.label)).toEqual([PRE_LLC_RESIDUAL.label]);
    expect(b.unexplainedCents).toBe(b.gapCents! - b.preLlcRevolutCents!);
  });

  it("signale un balayage partiel (l'inexpliqué contient alors le passé non lu)", () => {
    const b = buildTreasuryBridge({
      ...BASE,
      scan: {
        sinceDay: "2026-08-06",
        coversHistory: false,
        feesCents: 1000,
        googleAdsCents: 0,
        persoBadrCents: 0,
        persoFahdCents: 0,
        societeDatedBadrCents: 0,
        metaBankCents: 0,
        metaSpendCents: 0,
      },
    });
    expect(b.scanPartial).toBe(true);
    expect(b.scanSinceDay).toBe("2026-08-06");
  });
});

describe("attribution de l'écart", () => {
  const withScan = (over: Partial<NonNullable<TreasuryInput["scan"]>> = {}) =>
    buildTreasuryBridge({
      ...BASE,
      scan: {
        sinceDay: "2026-05-21",
        coversHistory: true,
        feesCents: 120000,
        googleAdsCents: 90000,
        persoBadrCents: 53100,
        persoFahdCents: 301800,
        societeDatedBadrCents: 84000,
        metaBankCents: 21550000,
        metaSpendCents: 21337236,
        ...over,
      },
    });

  it("impute le perso NOMINATIVEMENT et le reste par la règle des associés", () => {
    const b = withScan();
    const a = b.attribution!;
    const metaExtra = 21550000 - 21337236;
    const flou = metaExtra + b.unexplainedCents!;
    expect(a.persoBadrCents).toBe(53100);
    expect(a.persoFahdCents).toBe(301800);
    expect(a.badrCents).toBe(53100 + 84000 + Math.round(flou / 2));
    expect(a.reparti5050Cents).toBe(flou);
  });

  it("Badr + Adnane = l'écart total, au centime", () => {
    const b = withScan();
    const a = b.attribution!;
    expect(a.badrCents + a.adnaneCents).toBe(b.gapCents);
  });

  it("somme encore juste quand la part flou est impaire (aucun centime perdu)", () => {
    const b = withScan({ feesCents: 120001 });
    const a = b.attribution!;
    expect(a.badrCents + a.adnaneCents).toBe(b.gapCents);
  });

  it("pas d'attribution sans balayage bancaire", () => {
    expect(buildTreasuryBridge(BASE).attribution).toBeNull();
  });
});

describe("reliquat Revolut pré-LLC (décision Badr 04/09)", () => {
  const scan = {
    sinceDay: "2026-05-21",
    coversHistory: true,
    feesCents: 0,
    googleAdsCents: 0,
    persoBadrCents: 0,
    persoFahdCents: 0,
    societeDatedBadrCents: 0,
    metaBankCents: 0,
    metaSpendCents: 0,
  };
  const withGap = (gapCents: number) =>
    buildTreasuryBridge({
      ...BASE,
      enRouteCents: 0,
      bankBalances: [{ currency: "EUR", amountEurCents: BASE.netCumuleCents + BASE.supplierUnbilledCents - gapCents }],
      scan,
    });

  it("absorbe l'écart jusqu'au plafond figé, imputé 100 % Adnane", () => {
    const b = withGap(150000);
    expect(b.gapCents).toBe(150000);
    expect(b.preLlcRevolutCents).toBe(150000);
    expect(b.unexplainedCents).toBe(0);
    expect(b.attribution!.revolutAdnaneCents).toBe(150000);
    expect(b.attribution!.adnaneCents).toBe(150000);
    expect(b.attribution!.badrCents).toBe(0);
    expect(b.gapLines.map((l) => l.label)).toEqual([PRE_LLC_RESIDUAL.label]);
  });

  it("au-delà du plafond, le reste est un trou NEUF (inexpliqué depuis le 04/09)", () => {
    const b = withGap(PRE_LLC_RESIDUAL.cents + 250000);
    expect(b.preLlcRevolutCents).toBe(PRE_LLC_RESIDUAL.cents);
    expect(b.unexplainedCents).toBe(250000);
    expect(b.unexplainedCents!).toBeGreaterThan(UNEXPLAINED_ALERT_CENTS);
    // le trou neuf est réparti 50/50, le reliquat reste à Adnane
    expect(b.attribution!.badrCents).toBe(125000);
    expect(b.attribution!.adnaneCents).toBe(125000 + PRE_LLC_RESIDUAL.cents);
  });

  it("jamais négatif : une banque au-dessus de l'attendu ne crée pas de reliquat", () => {
    const b = withGap(-50000);
    expect(b.gapCents).toBe(-50000);
    expect(b.preLlcRevolutCents).toBe(0);
    expect(b.unexplainedCents).toBe(-50000);
    expect(b.gapLines).toEqual([]);
  });
});

describe("acomptes fournisseur", () => {
  it("un acompte viré sort du cash théorique (l'argent n'est plus en banque)", () => {
    const sans = buildTreasuryBridge(BASE);
    const avec = buildTreasuryBridge({ ...BASE, supplierPrepaidCents: 2500000 });
    expect(avec.cashTheoriqueCents).toBe(sans.cashTheoriqueCents - 2500000);
    expect(avec.supplierPrepaidCents).toBe(2500000);
  });
});

describe("supplierUnbilledDetail", () => {
  it("donne la plage, le nombre et le montant de la prochaine facture", () => {
    const d = supplierUnbilledDetail(
      [
        { store: "FR", orderName: "#5996", day: "2026-08-14", costCents: 2200 },
        { store: "FR", orderName: "#7214", day: "2026-09-04", costCents: 1900 },
        { store: "FR", orderName: "#5990", day: "2026-08-13", costCents: 9999 },
        { store: "ES", orderName: "#1162", day: "2026-09-03", costCents: 1487 },
      ],
      { store: "FR", ordersTo: "#5995", issuedDay: "2026-08-14" }
    );
    expect(d).toEqual({
      cents: 2200 + 1900 + 1487,
      orders: 3,
      firstOrder: "#5996",
      lastOrder: "#7214",
      firstDay: "2026-08-14",
      lastDay: "2026-09-04",
    });
  });

  it("sans commande : bornes nulles, zéro euro", () => {
    expect(supplierUnbilledDetail([], null)).toEqual({
      cents: 0,
      orders: 0,
      firstOrder: null,
      lastOrder: null,
      firstDay: null,
      lastDay: null,
    });
  });
});

describe("frais de change par origine (information)", () => {
  it("expose la répartition Meta / perso / autre et son total", () => {
    const b = buildTreasuryBridge({
      ...BASE,
      scan: {
        sinceDay: "2026-05-21",
        coversHistory: true,
        feesCents: 0,
        googleAdsCents: 0,
        persoBadrCents: 0,
        persoFahdCents: 0,
        societeDatedBadrCents: 0,
        metaBankCents: 0,
        metaSpendCents: 0,
        fxSplit: { metaCents: 70000, persoCents: 3000, autreCents: 1300 },
      },
    });
    expect(b.fxSplit).toEqual({ metaCents: 70000, persoCents: 3000, autreCents: 1300, totalCents: 74300 });
  });

  it("null sans balayage", () => {
    expect(buildTreasuryBridge(BASE).fxSplit).toBeNull();
  });
});

describe("orderNumber", () => {
  it("lit le numéro d'une commande Shopify", () => {
    expect(orderNumber("#5995")).toBe(5995);
    expect(orderNumber("5995")).toBe(5995);
  });

  it("rend null sur un nom sans chiffres", () => {
    expect(orderNumber("EXCHANGE")).toBeNull();
  });
});

describe("supplierUnbilledCents", () => {
  const rows: OrderCostRow[] = [
    // FR : à cheval sur la coupe de la facture (#5995), le MÊME jour
    { store: "FR", orderName: "#5994", day: "2026-08-14", costCents: 2000 },
    { store: "FR", orderName: "#5996", day: "2026-08-14", costCents: 2200 },
    { store: "FR", orderName: "#7214", day: "2026-09-04", costCents: 1900 },
    // Autre boutique : numérotation indépendante, coupe à la DATE
    { store: "ES", orderName: "#1162", day: "2026-09-03", costCents: 1487 },
    { store: "ES", orderName: "#1100", day: "2026-08-10", costCents: 1000 },
  ];

  it("coupe au NUMÉRO sur la boutique facturée, à la DATE sur les autres", () => {
    expect(
      supplierUnbilledCents(rows, { store: "FR", ordersTo: "#5995", issuedDay: "2026-08-14" })
    ).toBe(2200 + 1900 + 1487);
  });

  it("ne rate pas une commande postérieure portant un numéro du même jour", () => {
    // #5996 est daté du 14/08 comme la facture : une coupe à la date seule
    // l'aurait avalée, et 2 200 € auraient disparu du dû fournisseur.
    const only = supplierUnbilledCents(
      [{ store: "FR", orderName: "#5996", day: "2026-08-14", costCents: 2200 }],
      { store: "FR", ordersTo: "#5995", issuedDay: "2026-08-14" }
    );
    expect(only).toBe(2200);
  });

  it("compte tout quand aucune facture n'est encore suivie", () => {
    expect(supplierUnbilledCents(rows, null)).toBe(2000 + 2200 + 1900 + 1487 + 1000);
  });
});

describe("point de départ du rapprochement", () => {
  it("colle au lancement de l'activité (sinon l'écart démarre au mauvais jour)", async () => {
    const { TREASURY_START_DAY, RATES_START_DAY } = await import("../bank");
    const { HISTORY_START } = await import("../data");
    expect(TREASURY_START_DAY).toBe(HISTORY_START);
    expect(RATES_START_DAY).toBe(HISTORY_START);
  });
});
