import { describe, expect, it } from "vitest";
import {
  SUPPLIER_BILLS,
  SUPPLIER_CLAIMS_ON_PAID_BILLS,
  SUPPLIER_PENDING_CREDITS,
  SUPPLIER_OPEN_CASES,
  SUPPLIER_UNDERBILLED_CENTS,
  supplierClaimsOnPaidBillsCents,
  supplierOpenCasesCents,
  supplierTotalClaimedCents,
  supplierDisputedCents,
  supplierOwedCents,
  supplierPayableCents,
  supplierPendingCreditsCents,
  OLD_SUPPLIER_LAST_DAY,
  OLD_SUPPLIER_MARKUP,
  oldSupplierExtraCents,
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

  it("les avoirs sur factures PAYÉES restent hors du contesté", () => {
    // 10,27 € de doublon sur la facture du 01/08 : l'argent est déjà parti,
    // il se réclame en avoir. Le mélanger au contesté ferait croire qu'on
    // retient 2 723,56 € alors qu'on en retient 2 713,29 €.
    // 10,27 (#4856 en double) + 39,22 (#5458) + 105,84 (les 4 sans preuve).
    expect(supplierClaimsOnPaidBillsCents()).toBe(15533);
    expect(SUPPLIER_CLAIMS_ON_PAID_BILLS.map((c) => c.label.slice(0, 5))).toEqual([
      "#4856",
      "#5458",
      "#5455",
    ]);
    // Le contesté ne bouge PAS : ces 155,33 € sont sur des factures soldées.
    expect(supplierDisputedCents()).toBe(271329);
  });

  it("les dossiers ouverts sont annoncés mais PAS comptés comme dus", () => {
    // #2870 (62,24 €) + #4486 (267,80 €). Sur les deux, le client n'a pas
    // encore été remboursé : la perte n'existe pas. Les compter dans le
    // contesté ou dans les avoirs ferait réclamer de l'argent qu'on n'a pas
    // perdu — c'est précisément ce qui décrédibiliserait tout le relevé.
    expect(supplierOpenCasesCents()).toBe(33004);
    expect(SUPPLIER_OPEN_CASES.map((c) => c.label.slice(0, 5))).toEqual(["#2870", "#4486"]);
    expect(supplierDisputedCents()).toBe(271329);
    expect(supplierClaimsOnPaidBillsCents()).toBe(15533);
  });

  it("le TOTAL réclamé additionne bien les trois natures", () => {
    // Le relevé envoyé au fournisseur affiche ce chiffre en tête. Sans lui,
    // on ajoutait des catégories sans qu'aucun total ne bouge (remarque de
    // Badr le 10/09) — un ajout futur doit se voir ici, forcément.
    expect(supplierTotalClaimedCents()).toBe(271329 + 15533 + 33004);
    expect(supplierTotalClaimedCents()).toBe(319866);
  });

  it("les trois listes fournisseur restent étanches", () => {
    // Retenu / avoir à réclamer / annoncé non dû : aucune commande ne doit
    // apparaître dans deux listes à la fois, sinon on réclame deux fois.
    const refs = (cs: { label: string }[]) =>
      cs.flatMap((c) => c.label.match(/#\d+/g) ?? []);
    const toutes = [
      ...refs(SUPPLIER_PENDING_CREDITS),
      ...refs(SUPPLIER_CLAIMS_ON_PAID_BILLS),
      ...refs(SUPPLIER_OPEN_CASES),
    ];
    expect(new Set(toutes).size).toBe(toutes.length);
  });

  it("la sous-facturation en notre faveur est tracée, jamais encaissée", () => {
    // #5535/#5576/#5642 : 4 polos expédiés, POLOx1 facturé. On le signale.
    expect(SUPPLIER_UNDERBILLED_CENTS).toBe(5978);
  });

  it("les nombres de commandes suivent les fichiers, pas leurs en-têtes", () => {
    // Les en-têtes Panda sur-annoncent (535 vs 533 le 14/08, 1157 vs 1153 le
    // 03/09) : on retient le nombre de LIGNES recompté, seul aligné sur le
    // TOTAL réclamé.
    expect(SUPPLIER_BILLS.map((b) => b.ordersCount)).toEqual([649, 533, 1152, 358]);
  });
});


describe("ancien fournisseur (avant Panda) — Badr 08/09", () => {
  it("+5 % de COGS jusqu'au 30/06 inclus, rien dès le 01/07", () => {
    expect(OLD_SUPPLIER_MARKUP).toBe(0.05);
    expect(OLD_SUPPLIER_LAST_DAY).toBe("2026-06-30");
    expect(oldSupplierExtraCents("2026-06-30", 10000)).toBe(500);
    expect(oldSupplierExtraCents("2026-07-01", 10000)).toBe(0);
    expect(oldSupplierExtraCents("2026-05-21", 0)).toBe(0);
  });

  it("tombe entièrement avant l'entrée de Badr : son net ne bouge pas", () => {
    // La règle par boutique donne 0 % à Badr avant le 20/06 (ES/UK/DE) et
    // avant le 14/07 (FR) ; le surcoût s'arrête au 30/06, donc seule ES/UK/DE
    // du 20 au 30/06 pourrait le toucher — trois boutiques à ~1 % du CA.
    expect(OLD_SUPPLIER_LAST_DAY < "2026-07-14").toBe(true);
  });
});
