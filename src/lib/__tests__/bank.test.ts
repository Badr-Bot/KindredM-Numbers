import { describe, expect, it } from "vitest";
import { categorizeTx, reconcile, type BankTx } from "../bank";

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
