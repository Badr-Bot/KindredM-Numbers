import { describe, expect, it } from "vitest";
import { computeRefundedCents, type ShopifyOrder } from "../shopify";

function orderWithRefund(transaction: {
  amount: string;
  amount_set?: { shop_money?: { amount: string; currency_code: string } };
}): ShopifyOrder {
  return {
    id: 1,
    name: "#1",
    created_at: "2026-06-29T10:00:00Z",
    updated_at: "2026-06-29T10:00:00Z",
    total_price: "122.40",
    financial_status: "refunded",
    line_items: [],
    shipping_address: null,
    refunds: [{ id: 1, created_at: "2026-06-29T10:00:00Z", transactions: [{ ...transaction, kind: "refund" }] }],
  };
}

describe("computeRefundedCents", () => {
  it("lit le montant en devise boutique (amount_set.shop_money), pas la devise client", () => {
    // Régression 29/06 : un remboursement client en DZD (18594.56) avait été
    // lu comme des euros — CA de la journée devenu négatif. Le champ `amount`
    // brut d'une transaction est documenté par Shopify comme étant dans la
    // devise du CLIENT par défaut, contrairement à Order.total_price.
    const order = orderWithRefund({
      amount: "18594.56", // DZD, doit être ignoré
      amount_set: { shop_money: { amount: "12.20", currency_code: "EUR" } },
    });
    expect(computeRefundedCents(order)).toBe(1220);
  });

  it("retombe sur amount si amount_set est absent (compat anciennes réponses)", () => {
    const order = orderWithRefund({ amount: "12.20" });
    expect(computeRefundedCents(order)).toBe(1220);
  });
});
