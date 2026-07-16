import { afterEach, describe, expect, it, vi } from "vitest";
import { computeRefundedCents, computeRefundedCentsAccurate, type ShopifyOrder } from "../shopify";

function orderWithRefund(amount: string): ShopifyOrder {
  return {
    id: 1,
    name: "#1",
    created_at: "2026-06-29T10:00:00Z",
    updated_at: "2026-06-29T10:00:00Z",
    total_price: "122.40",
    financial_status: "refunded",
    line_items: [],
    shipping_address: null,
    refunds: [{ id: 1, created_at: "2026-06-29T10:00:00Z", transactions: [{ amount, kind: "refund" }] }],
  };
}

function orderWithoutRefund(): ShopifyOrder {
  return {
    id: 2,
    name: "#2",
    created_at: "2026-06-29T10:00:00Z",
    updated_at: "2026-06-29T10:00:00Z",
    total_price: "59.98",
    financial_status: "paid",
    line_items: [],
    shipping_address: null,
    refunds: [],
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("computeRefundedCents (lecture naïve embarquée)", () => {
  it("lit `amount` tel quel — piège documenté : ce n'est PAS garanti en devise boutique", () => {
    // Régression 29/06 : un remboursement client en DZD (18594.56) a été
    // enregistré par Shopify avec ce montant dans `amount` (devise client
    // par défaut) — cette fonction le prend au pied de la lettre, d'où le
    // CA négatif. C'est pourquoi le pipeline réel n'utilise plus cette
    // fonction, seulement computeRefundedCentsAccurate ci-dessous.
    expect(computeRefundedCents(orderWithRefund("18594.56"))).toBe(1859456);
  });
});

describe("computeRefundedCentsAccurate (re-fetch in_shop_currency=true)", () => {
  it("n'appelle pas Shopify si la commande n'a aucun remboursement", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const cents = await computeRefundedCentsAccurate(
      { market: "FR", domain: "fr.test.myshopify.com" },
      "tok",
      orderWithoutRefund()
    );
    expect(cents).toBe(0);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("re-fetch les transactions et lit le montant normalisé en devise boutique", async () => {
    // Le montant embarqué (DZD) est ignoré ; seul le montant re-fetché via
    // in_shop_currency=true (garanti EUR) est utilisé.
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        expect(url).toContain("/orders/1/transactions.json");
        expect(url).toContain("in_shop_currency=true");
        return new Response(
          JSON.stringify({ transactions: [{ amount: "12.20", kind: "refund" }] }),
          { status: 200, headers: { "content-type": "application/json" } }
        );
      })
    );
    const cents = await computeRefundedCentsAccurate(
      { market: "FR", domain: "fr.test.myshopify.com" },
      "tok",
      orderWithRefund("18594.56")
    );
    expect(cents).toBe(1220);
  });
});
