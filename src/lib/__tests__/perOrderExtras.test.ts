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
  sizeUpFeeCents,
} from "../engine";

/**
 * Packaging (0,35 €) + carte de remerciement (0,03 €) par commande, annoncés
 * par Badr le 12/08.
 *
 * Les deux sont ACTIFS depuis le 10/09 :
 *  • packaging au 14/08/2026 — les 410 € de « custom packing » de la facture
 *    du même jour sont une avance sur un stock consommé commande par commande ;
 *  • carte au 12/08/2026 — la date annoncée par Badr, confirmée par lui le
 *    10/09 après recherche (elle n'existe nulle part ailleurs). Elle précède
 *    bien le packaging de 2 jours, comme il le disait.
 *
 * Ce test verrouille les trois propriétés qui comptent :
 *  1. les deux dates sont INDÉPENDANTES et DISTINCTES — il existe une fenêtre
 *     (12 et 13/08) où la carte compte et le packaging non ;
 *  2. aucun coût n'est jamais rétroactif ;
 *  3. une date à `null` neutralise son coût, quoi qu'il arrive.
 */
describe("Coûts par commande — packaging + carte de remerciement", () => {
  it("les montants annoncés : 0,35 € + 0,03 € = 0,38 € par commande", () => {
    expect(PACKAGING_COST_CENTS).toBe(35);
    expect(THANKS_CARD_COST_CENTS).toBe(3);
    expect(PER_ORDER_EXTRAS_CENTS).toBe(38);
  });

  it("les deux dates, à leur valeur confirmée", () => {
    expect(THANKS_CARD_START_DATE).toBe("2026-08-12");
    expect(PACKAGING_START_DATE).toBe("2026-08-14");
  });

  it("rien avant le 12/08 : les commandes d'avant n'ont pas supporté ces coûts", () => {
    expect(perOrderExtrasCents("2026-08-11", true)).toBe(0);
  });

  it("la fenêtre 12-13/08 : la carte seule, 0,03 €", () => {
    // C'est CE cas qui prouve que les deux dates sont bien indépendantes —
    // les fusionner ferait payer le packaging deux jours trop tôt.
    expect(perOrderExtrasCents("2026-08-12", true)).toBe(3);
    expect(perOrderExtrasCents("2026-08-13", true)).toBe(3);
  });

  it("à partir du 14/08 : les deux, 0,38 €", () => {
    expect(perOrderExtrasCents("2026-08-14", true)).toBe(38);
    expect(perOrderExtrasCents("2026-09-10", true)).toBe(38);
  });

  it("une commande vide ne consomme ni packaging ni carte", () => {
    expect(perOrderExtrasCents("2026-09-10", false)).toBe(0);
  });

  it("ces coûts entrent dans le COGS côté UPSELLS, jamais dans le COGS polo", () => {
    const jour = (day: string) =>
      computeOrderCogsTax({
        store: "FR",
        shippingCountry: "FR",
        day,
        poloQty: 2,
        upsells: [],
      });
    const avant = jour("2026-08-11");
    const carteSeule = jour("2026-08-13");
    const lesDeux = jour("2026-08-14");
    // Le COGS polo ne bouge à AUCUNE des trois dates : c'est le garde-fou
    // contre le raccourci d'étiquetage qui avait produit le bug de mai.
    // Le COGS polo ne porte que le polo + le forfait size-up (facturé par le
    // fournisseur sur toute la plage #4815→#7506, donc actif à ces trois dates) :
    // il ne bouge pas d'un centime quand packaging et carte s'activent.
    for (const res of [avant, carteSeule, lesDeux]) {
      expect(res.cogsProductCents).toBe(poloCogsCents("FR", 2) + sizeUpFeeCents("2026-08-11", 2));
    }
    expect(avant.cogsUpsellsCents).toBe(0);
    expect(carteSeule.cogsUpsellsCents).toBe(3);
    expect(lesDeux.cogsUpsellsCents).toBe(38);
  });
});
