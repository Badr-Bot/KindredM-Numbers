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
  it("les 4 factures connues, à leur montant exact", () => {
    expect(SUPPLIER_BILLS.map((b) => [b.ref, b.totalCents])).toEqual([
      ["Bill 20260801", 1427996],
      ["Bill 20260814", 1206441],
      ["Bill 20260903", 2544836],
      ["Bill 20260909", 849471],
    ]);
  });

  it("les plages de commandes s'enchaînent sans trou ni recouvrement", () => {
    const num = (ref: string) => Number(ref.slice(1));
    for (let i = 1; i < SUPPLIER_BILLS.length; i++) {
      expect(num(SUPPLIER_BILLS[i].ordersFrom)).toBe(num(SUPPLIER_BILLS[i - 1].ordersTo) + 1);
    }
  });

  it("tout est soldé sauf la facture du 09/09", () => {
    expect(supplierOwedCents()).toBe(849471);
    // Contesté sur la 09/09 : 168,40 € de lignes suisses re-facturées
    // + 533,50 € de « size up change cost » rétroactif.
    expect(supplierDisputedCents()).toBe(70190);
    expect(supplierPayableCents()).toBe(849471 - 70190);
  });

  it("aucune facture ne peut être payée au-delà de son montant", () => {
    for (const b of SUPPLIER_BILLS) {
      expect(b.paidCents).toBeLessThanOrEqual(b.totalCents);
      expect(b.disputedCents).toBeLessThanOrEqual(b.totalCents);
      if (b.status === "payee") expect(b.paidCents).toBe(b.totalCents);
      if (b.status === "a_payer") expect(b.paidCents).toBe(0);
    }
  });

  it("l'avoir Long Sleeves est abandonné (packing confirmé par Badr le 04/09)", () => {
    // Ce n'était pas une surfacturation : toute commande sans polo paie un
    // packing de colis primaire, la règle acceptée pour le gilet le 14/08.
    expect(SUPPLIER_PENDING_CREDITS.find((c) => c.label.includes("Long Sleeves"))).toBeUndefined();
    // Restent les deux réserves de la facture du 09/09 : 168,40 € de lignes
    // suisses re-facturées + 533,50 € de « size up change cost » rétroactif.
    expect(supplierPendingCreditsCents()).toBe(16840 + 53350);
  });
});
