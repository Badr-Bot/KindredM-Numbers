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
      ["Bill 20260909", 832631],
    ]);
  });

  it("les plages de commandes s'enchaînent sans trou ni recouvrement", () => {
    const num = (ref: string) => Number(ref.slice(1));
    for (let i = 1; i < SUPPLIER_BILLS.length; i++) {
      expect(num(SUPPLIER_BILLS[i].ordersFrom)).toBe(num(SUPPLIER_BILLS[i - 1].ordersTo) + 1);
    }
  });

  it("facture du 09/09 : payée à hauteur de 5 613,02 €, le reste retenu", () => {
    // Elle a retiré les 168,40 € de lignes suisses : réclamé 8 326,31 €.
    // Badr a viré 5 613,02 € le 10/09 → il reste exactement le montant retenu.
    expect(supplierOwedCents()).toBe(832631 - 561302);
    expect(supplierOwedCents()).toBe(271329);
    expect(supplierDisputedCents()).toBe(271329);
    // Rien de payable immédiatement : tout le reste est notifié en déduction.
    expect(supplierPayableCents()).toBe(0);
  });

  it("aucune facture ne peut être payée au-delà de son montant", () => {
    for (const b of SUPPLIER_BILLS) {
      expect(b.paidCents).toBeLessThanOrEqual(b.totalCents);
      expect(b.disputedCents).toBeLessThanOrEqual(b.totalCents);
      if (b.status === "payee") expect(b.paidCents).toBe(b.totalCents);
      if (b.status === "a_payer") expect(b.paidCents).toBe(0);
    }
  });

  it("les 6 lignes retenues du relevé du 10/09 somment au montant retenu", () => {
    // L'avoir Long Sleeves est abandonné (packing confirmé par Badr le 04/09),
    // les lignes suisses ont été retirées par le fournisseur lui-même.
    expect(SUPPLIER_PENDING_CREDITS.find((c) => c.label.includes("Long Sleeves"))).toBeUndefined();
    // 995,05 + 842,24 + 118,48 + 253,21 + 455,00 + 49,31 = 2 713,29 €,
    // exactement ce qui est retenu sur la facture du 09/09.
    expect(supplierPendingCreditsCents()).toBe(271329);
    expect(supplierPendingCreditsCents()).toBe(supplierDisputedCents());
  });
});
