import { describe, expect, it } from "vitest";
import { categorizeTx, computeControl, reconcile, type BankTx } from "../bank";

/** 🏦 Rapprochement bancaire — catégorisation et écarts (pur, sans réseau). */

const tx = (day: string, description: string, amountEur: number, over?: Partial<BankTx>): BankTx => {
  const amountCents = Math.round(amountEur * 100);
  const { category, subscriptionLabel } = categorizeTx(description, amountCents);
  return {
    bank: "WISE",
    txId: `${day}-${description}-${amountEur}`,
    day,
    amountCents,
    currency: "EUR",
    amountEurCents: amountCents,
    description,
    category,
    subscriptionLabel,
    label: null,
    labelNote: null,
    ...over,
  };
};

describe("categorizeTx", () => {
  it("reconnaît Meta, les payouts Shopify (crédit) et les abonnements", () => {
    expect(categorizeTx("FACEBK *ADS 12345", -25000).category).toBe("META");
    expect(categorizeTx("Meta Platforms Ireland", -25000).category).toBe("META");
    expect(categorizeTx("Shopify Payments payout", 150000).category).toBe("SHOPIFY");
    expect(categorizeTx("SHOPIFY INC monthly", -3900).category).toBe("ABONNEMENT");
    expect(categorizeTx("ANTHROPIC PBC", -2706).subscriptionLabel).toBe("Claude (Badr)");
    expect(categorizeTx("Fournisseur Panda", -80000).category).toBe("AUTRE");
  });
});

describe("reconcile", () => {
  const expected = [
    { day: "2026-08-18", caCents: 300000, spendCents: 100000, feesCents: 20000 },
    { day: "2026-08-19", caCents: 200000, spendCents: 80000, feesCents: 14000 },
  ];

  it("compare débits Meta et crédits Shopify aux totaux du dashboard", () => {
    const txs = [
      tx("2026-08-18", "FACEBK *ADS", -1200), // 1200 € débités
      tx("2026-08-19", "FACEBK *ADS", -650),
      tx("2026-08-19", "Shopify payout", 4500),
    ];
    const r = reconcile(txs, expected, "2026-08-18", "2026-08-19");
    expect(r.meta.bankCents).toBe(185000);
    expect(r.meta.expectedCents).toBe(180000);
    expect(r.meta.gapCents).toBe(5000);
    expect(r.shopify.bankCents).toBe(450000);
    expect(r.shopify.expectedCents).toBe(466000); // CA − frais
  });

  it("un gros écart Meta déclenche un warning ; un petit non", () => {
    const small = reconcile([tx("2026-08-18", "FACEBK", -1810)], expected, "2026-08-18", "2026-08-19");
    expect(small.warnings.some((w) => w.includes("Meta"))).toBe(false);
    const big = reconcile([tx("2026-08-18", "FACEBK", -2500)], expected, "2026-08-18", "2026-08-19");
    expect(big.warnings.some((w) => w.includes("Meta"))).toBe(true);
  });

  it("le reste part en AUTRE, jamais avalé ; devise inconnue signalée", () => {
    const txs = [
      tx("2026-08-18", "Virement Panda Dropshipping", -900),
      tx("2026-08-18", "Mystère", -50, { currency: "GBP", amountEurCents: null }),
    ];
    const r = reconcile(txs, expected, "2026-08-18", "2026-08-19");
    expect(r.others).toHaveLength(2);
    expect(r.warnings.some((w) => w.includes("devise"))).toBe(true);
  });
});


describe("computeControl — anomalies et parts", () => {
  const W = { sinceDay: "2026-07-21", untilDay: "2026-08-19" };

  it("un débit AUTRE sans affectation = anomalie rouge + inbox + case À affecter", () => {
    const txs = [tx("2026-08-18", "Virement mystère", -250)];
    const c = computeControl({ txs, reconciliation: null, ...W });
    expect(c.anomalies.some((a) => a.kind === "TX_NON_AFFECTEE" && a.severity === "red")).toBe(true);
    expect(c.toAssign).toHaveLength(1);
    expect(c.parts.aAffecterCents).toBe(25000);
  });

  it("affecté PERSO_FAHD → sort de l'inbox, compte dans la part Fahd", () => {
    const txs = [tx("2026-08-18", "Restaurant", -80, { label: "PERSO_FAHD" })];
    const c = computeControl({ txs, reconciliation: null, ...W });
    expect(c.toAssign).toHaveLength(0);
    expect(c.parts.persoFahdCents).toBe(8000);
    expect(c.anomalies.some((a) => a.kind === "TX_NON_AFFECTEE")).toBe(false);
  });

  it("abonnement actif jamais débité sur 30 j → anomalie « non débité »", () => {
    const txs = [tx("2026-08-18", "FACEBK", -100)];
    const c = computeControl({ txs, reconciliation: null, ...W });
    expect(c.anomalies.some((a) => a.kind === "ABO_NON_DEBITE" && a.label.includes("Klaviyo"))).toBe(true);
  });

  it("double débit même jour / même montant / même libellé → anomalie", () => {
    const txs = [
      tx("2026-08-18", "KLAVIYO INC", -25),
      tx("2026-08-18", "KLAVIYO INC", -25, { txId: "autre-id" }),
    ];
    const c = computeControl({ txs, reconciliation: null, ...W });
    expect(c.anomalies.some((a) => a.kind === "DOUBLE_DEBIT")).toBe(true);
  });

  it("une transaction IGNORER ne compte nulle part", () => {
    const txs = [tx("2026-08-18", "Doublon technique", -50, { label: "IGNORER" })];
    const c = computeControl({ txs, reconciliation: null, ...W });
    expect(c.toAssign).toHaveLength(0);
    expect(c.parts.aAffecterCents).toBe(0);
  });
});
