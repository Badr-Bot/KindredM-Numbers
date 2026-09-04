import { describe, expect, it } from "vitest";
import {
  SUPPLIER_BILLS,
  SUPPLIER_PENDING_CREDITS,
  supplierDisputedCents,
  supplierOwedCents,
  supplierPayableCents,
  supplierPendingCreditsCents,
} from "../supplierBills";

/**
 * Le ledger fournisseur est saisi À LA MAIN (montants relevés sur les fichiers
 * Panda, statuts annoncés par Badr). Ces tests figent ce qui ne doit pas
 * dériver en silence : les totaux facturés, ce qui reste à payer, et le fait
 * qu'une facture ne peut pas être « payée » à moitié.
 *
 * Chiffres vérifiés ligne à ligne contre les fichiers du fournisseur
 * (audit du 14/08 pour les deux factures d'août, du 04/09 pour celle du 03/09).
 */
describe("Ledger fournisseur Panda", () => {
  it("les 3 factures connues, à leur montant exact", () => {
    expect(SUPPLIER_BILLS.map((b) => [b.ref, b.totalCents])).toEqual([
      ["Bill 20260801", 1427996],
      ["Bill 20260814", 1206441],
      ["Bill 20260903", 2546366],
    ]);
  });

  it("les plages de commandes s'enchaînent sans trou ni recouvrement", () => {
    const num = (ref: string) => Number(ref.slice(1));
    for (let i = 1; i < SUPPLIER_BILLS.length; i++) {
      expect(num(SUPPLIER_BILLS[i].ordersFrom)).toBe(num(SUPPLIER_BILLS[i - 1].ordersTo) + 1);
    }
  });

  it("août est soldé, seule la facture du 03/09 reste due", () => {
    expect(supplierOwedCents()).toBe(2546366);
    // À régler tout de suite = le dû moins les 6 € de taxe UE facturée 2×.
    expect(supplierPayableCents()).toBe(2546366 - 600);
    expect(supplierDisputedCents()).toBe(600);
  });

  it("aucune facture ne peut être payée au-delà de son montant", () => {
    for (const b of SUPPLIER_BILLS) {
      expect(b.paidCents).toBeLessThanOrEqual(b.totalCents);
      expect(b.disputedCents).toBeLessThanOrEqual(b.totalCents);
      if (b.status === "payee") expect(b.paidCents).toBe(b.totalCents);
      if (b.status === "a_payer") expect(b.paidCents).toBe(0);
    }
  });

  it("l'avoir promis le 14/08 est toujours en attente", () => {
    const ls = SUPPLIER_PENDING_CREDITS.find((c) => c.label.startsWith("Refund Long Sleeves"));
    expect(ls).toBeDefined();
    expect(ls!.estimatedCents).toBe(2855);
    expect(supplierPendingCreditsCents()).toBe(2855 + 600);
  });
});
