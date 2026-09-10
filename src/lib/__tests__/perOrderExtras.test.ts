import { describe, expect, it } from "vitest";
import {
  PACKAGING_COST_CENTS,
  PACKAGING_START_DATE,
  PER_ORDER_EXTRAS_CENTS,
  THANKS_CARD_COST_CENTS,
  THANKS_CARD_START_DATE,
  computeOrderCogsTax,
  perOrderExtrasCents,
  poloCogsCents,
} from "../engine";

/**
 * Packaging (0,35 €) + carte de remerciement (0,03 €) par commande, annoncés
 * par Badr le 12/08.
 *
 * Le packaging est ACTIF depuis le 14/08/2026 : les 410 € de « custom
 * packing » de la facture du même jour sont une avance sur un stock
 * d'emballages, consommé commande par commande (Badr, 10/09).
 *
 * La carte reste INACTIVE : Badr la pense antérieure mais n'a pas la date.
 *
 * Ce test verrouille les trois propriétés qui comptent :
 *  1. les deux dates sont INDÉPENDANTES — activer l'une n'active pas l'autre ;
 *  2. aucun coût n'est jamais rétroactif ;
 *  3. tant qu'une date vaut `null`, son coût est nul, quoi qu'il arrive.
 */
describe("Coûts par commande — packaging + carte de remerciement", () => {
  it("les montants annoncés : 0,35 € + 0,03 € = 0,38 € par commande", () => {
    expect(PACKAGING_COST_CENTS).toBe(35);
    expect(THANKS_CARD_COST_CENTS).toBe(3);
    expect(PER_ORDER_EXTRAS_CENTS).toBe(38);
  });

  it("packaging actif au 14/08, jamais avant", () => {
    expect(PACKAGING_START_DATE).toBe("2026-08-14");
    expect(perOrderExtrasCents("2026-08-13", true)).toBe(0);
    expect(perOrderExtrasCents("2026-08-14", true)).toBe(35);
    expect(perOrderExtrasCents("2026-09-10", true)).toBe(35);
  });

  it("carte INACTIVE tant que la date n'est pas connue — jamais devinée", () => {
    // Garde-fou : si quelqu'un pose la date sans le vouloir, ce test le dit.
    expect(THANKS_CARD_START_DATE).toBeNull();
    // Le total reste à 0,35 € et non 0,38 € : la carte n'est pas comptée.
    expect(perOrderExtrasCents("2027-01-01", true)).toBe(35);
  });

  it("une commande vide ne consomme ni packaging ni carte", () => {
    expect(perOrderExtrasCents("2026-09-10", false)).toBe(0);
  });

  it("le packaging entre bien dans le COGS de la commande, côté upsells", () => {
    const avant = computeOrderCogsTax({
      store: "FR",
      shippingCountry: "FR",
      day: "2026-08-13",
      poloQty: 2,
      upsells: [],
    });
    const apres = computeOrderCogsTax({
      store: "FR",
      shippingCountry: "FR",
      day: "2026-08-14",
      poloQty: 2,
      upsells: [],
    });
    // Le polo ne bouge pas : le packaging n'est PAS fondu dans le COGS polo.
    expect(avant.cogsProductCents).toBe(poloCogsCents("FR", 2));
    expect(apres.cogsProductCents).toBe(poloCogsCents("FR", 2));
    expect(avant.cogsUpsellsCents).toBe(0);
    expect(apres.cogsUpsellsCents).toBe(35);
  });
});
