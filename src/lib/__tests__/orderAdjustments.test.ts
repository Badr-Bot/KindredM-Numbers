import { describe, expect, it } from "vitest";
import {
  CANCELLED_BEFORE_DISPATCH_FR,
  LOST_CHARGEBACKS_FR,
  lostChargebacksTotalCents,
  orderAdjustment,
} from "../orderAdjustments";
import {
  computeOrderCogsTax,
  perOrderExtrasCents,
  primaryParcelPackingCents,
  sizeUpFeeCents,
  upsellCogsCents,
} from "../engine";

/**
 * Les lignes ci-dessous reproduisent ce que le FOURNISSEUR facture. Notre COGS
 * ajoute par-dessus nos propres coûts par commande (packaging depuis le
 * 14/08) : on les retire pour comparer ce qui est comparable, au lieu de
 * figer un total qui bougerait au prochain coût interne ajouté.
 */
const factureFournisseur = (res: { cogsProductCents: number; cogsUpsellsCents: number }, day: string) =>
  res.cogsProductCents + res.cogsUpsellsCents - perOrderExtrasCents(day, true);

/**
 * Les corrections du 10/09/2026, chacune adossée à une ligne de facture ou à
 * un relevé Shopify daté. Si un chiffre bouge sans que la source bouge, le
 * test casse — c'est tout l'intérêt.
 */
describe("Chargebacks perdus (relevé Shopify du 10/09)", () => {
  it("les 5 litiges perdus que rien ne déduisait, 383,91 € au total", () => {
    expect([...LOST_CHARGEBACKS_FR.keys()].sort()).toEqual([
      "#2005",
      "#2232",
      "#2291",
      "#3285",
      "#4368",
    ]);
    expect(lostChargebacksTotalCents()).toBe(38391);
  });

  it("les 2 litiges déjà remboursés côté Shopify n'y sont PAS (jamais deux fois)", () => {
    // #1447 et #2787 sont perdus aussi, mais leur `refunded_cents` porte déjà
    // la perte : les compter ici les déduirait une deuxième fois.
    expect(LOST_CHARGEBACKS_FR.has("#1447")).toBe(false);
    expect(LOST_CHARGEBACKS_FR.has("#2787")).toBe(false);
  });

  it("rien n'est appliqué hors du store FR (on n'invente pas ce qu'on n'a pas mesuré)", () => {
    expect(orderAdjustment("ES", "#2005").lostChargebackCents).toBe(0);
    expect(orderAdjustment("FR", "#2005").lostChargebackCents).toBe(8999);
  });
});

describe("Commandes annulées avant expédition", () => {
  it("81 commandes, jamais expédiées donc jamais facturées par le fournisseur", () => {
    expect(CANCELLED_BEFORE_DISPATCH_FR.size).toBe(81);
    expect(orderAdjustment("FR", "#6327").cancelledBeforeDispatch).toBe(true);
    expect(orderAdjustment("FR", "#2195").cancelledBeforeDispatch).toBe(true);
  });

  it("les colis PARTIS n'y sont pas — le fournisseur les a bien facturés", () => {
    // #1903 « Colis non livré » et #5458 « Non livrable » : le colis existe.
    expect(orderAdjustment("FR", "#1903").cancelledBeforeDispatch).toBe(false);
    expect(orderAdjustment("FR", "#5458").cancelledBeforeDispatch).toBe(false);
  });
});

describe("Packing colis primaire — généralisé à tous les produits (facture 03/09)", () => {
  const noPolo = (upsells: { productKey: string; qty: number }[]) =>
    primaryParcelPackingCents("FR", "2026-09-01", 0, upsells);

  it("commande sans polo : +4,00 € une seule fois", () => {
    expect(noPolo([{ productKey: "LONG_SLEEVE_DRESS_SHIRT", qty: 1 }])).toBe(400);
    expect(noPolo([{ productKey: "COMPRESSION_TANK_TOP", qty: 1 }])).toBe(400);
    expect(noPolo([{ productKey: "CHINO_SHORTS", qty: 3 }])).toBe(400);
  });

  it("commande AVEC polo : rien (le colis part avec le polo)", () => {
    expect(
      primaryParcelPackingCents("FR", "2026-09-01", 2, [{ productKey: "LONG_SLEEVE_DRESS_SHIRT", qty: 1 }])
    ).toBe(0);
  });

  it("commande avec gilet : rien de plus, le gilet porte déjà son packing", () => {
    // #7121 et #7000 : GILETx1 + LSx1 en France = 19,20 € facturés.
    expect(noPolo([{ productKey: "GILET", qty: 1 }, { productKey: "LONG_SLEEVE_DRESS_SHIRT", qty: 1 }])).toBe(0);
    const gilet = upsellCogsCents("GILET", "FR", 1, { day: "2026-09-01", giletPrimaryParcel: true });
    const ls = upsellCogsCents("LONG_SLEEVE_DRESS_SHIRT", "FR", 1);
    expect(gilet + ls).toBe(1920);
  });

  it("avant le 02/08 : pas de supplément", () => {
    expect(primaryParcelPackingCents("FR", "2026-07-30", 0, [{ productKey: "CHINO_SHORTS", qty: 1 }])).toBe(0);
  });

  it("reproduit les lignes réelles de la facture du 03/09", () => {
    // #6772 : LSx1 seul en France = 10,80 € facturés.
    const lsSeul = computeOrderCogsTax({
      store: "FR",
      shippingCountry: "FR",
      day: "2026-08-28",
      poloQty: 0,
      upsells: [{ productKey: "LONG_SLEEVE_DRESS_SHIRT", qty: 1 }],
    });
    expect(factureFournisseur(lsSeul, "2026-08-28")).toBe(1080);

    // #6541 : TANKx1 seul en France = 7,16 € facturés.
    const tankSeul = computeOrderCogsTax({
      store: "FR",
      shippingCountry: "FR",
      day: "2026-08-25",
      poloQty: 0,
      upsells: [{ productKey: "COMPRESSION_TANK_TOP", qty: 1 }],
    });
    expect(factureFournisseur(tankSeul, "2026-08-25")).toBe(716);
  });
});

describe("Pantalon FR : prix réels de la facture du 03/09", () => {
  it("6,90 € l'unité en upsell — 12 commandes identiques au centime", () => {
    // #7122, #7056, #6619… : POLOx2 + TROUSERSx1 = 21,96 € facturés.
    const res = computeOrderCogsTax({
      store: "FR",
      shippingCountry: "FR",
      day: "2026-08-20",
      poloQty: 2,
      upsells: [{ productKey: "DRESS_TROUSERS", qty: 1 }],
    });
    expect(factureFournisseur(res, "2026-08-20")).toBe(2196);
  });

  it("le palier 2 reproduit la seule commande multi-pantalons observée", () => {
    // #6060 : POLOx4 + TROUSERSx3 = 49,56 € facturés.
    const res = computeOrderCogsTax({
      store: "FR",
      shippingCountry: "FR",
      day: "2026-08-20",
      poloQty: 4,
      upsells: [{ productKey: "DRESS_TROUSERS", qty: 3 }],
    });
    expect(factureFournisseur(res, "2026-08-20")).toBe(4956);
  });

  it("pantalon SEUL = 6,90 + 4,00 de packing = 10,90 € (#6264)", () => {
    const res = computeOrderCogsTax({
      store: "FR",
      shippingCountry: "FR",
      day: "2026-08-18",
      poloQty: 0,
      upsells: [{ productKey: "DRESS_TROUSERS", qty: 1 }],
    });
    expect(factureFournisseur(res, "2026-08-18")).toBe(1090);
  });
});

describe("Forfait size-up (0,10 €/polo, accepté pour l'avenir le 10/09)", () => {
  it("s'applique à partir du 03/09 — 1re commande de la facture du 09/09", () => {
    expect(sizeUpFeeCents("2026-09-02", 2)).toBe(0);
    expect(sizeUpFeeCents("2026-09-03", 2)).toBe(20);
    expect(sizeUpFeeCents("2026-09-10", 4)).toBe(40);
  });

  it("jamais rétroactif, jamais sur une commande sans polo", () => {
    expect(sizeUpFeeCents("2026-08-31", 4)).toBe(0);
    expect(sizeUpFeeCents("2026-09-10", 0)).toBe(0);
    expect(sizeUpFeeCents(undefined, 4)).toBe(0);
  });
});
