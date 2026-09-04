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
      ["Bill 20260903", 2544836],
    ]);
  });

  it("les plages de commandes s'enchaînent sans trou ni recouvrement", () => {
    const num = (ref: string) => Number(ref.slice(1));
    for (let i = 1; i < SUPPLIER_BILLS.length; i++) {
      expect(num(SUPPLIER_BILLS[i].ordersFrom)).toBe(num(SUPPLIER_BILLS[i - 1].ordersTo) + 1);
    }
  });

  it("août est soldé, seule la facture du 03/09 reste due — et elle est payable en entier", () => {
    expect(supplierOwedCents()).toBe(2544836);
    // Plus rien de contesté : la taxe UE en double a été corrigée le 04/09.
    expect(supplierPayableCents()).toBe(2544836);
    expect(supplierDisputedCents()).toBe(0);
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
    // La taxe UE en double a été corrigée dans la facture elle-même : il ne
    // reste aucun avoir chiffré en attente, seulement des questions ouvertes.
    expect(supplierPendingCreditsCents()).toBe(0);
  });
});
