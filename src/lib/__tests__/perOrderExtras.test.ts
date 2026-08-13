import { describe, expect, it } from "vitest";
import {
  PACKAGING_COST_CENTS,
  PER_ORDER_EXTRAS_CENTS,
  PER_ORDER_EXTRAS_START_DATE,
  THANKS_CARD_COST_CENTS,
  perOrderExtrasCents,
} from "../engine";

/**
 * Packaging (0,35 €) + carte de remerciement (0,03 €) par commande — annoncés
 * par Badr le 12/08, date d'entrée en vigueur à venir.
 *
 * Ce test verrouille les deux propriétés qui comptent :
 *  1. TANT QUE LA DATE N'EST PAS POSÉE, le coût est NUL — aucun chiffre du
 *     dashboard ne doit bouger avant que Badr donne la date. Un coût activé
 *     par erreur fausserait le net de toutes les commandes de l'historique.
 *  2. Une fois la date posée, le coût ne s'applique JAMAIS rétroactivement :
 *     les commandes d'avant n'ont pas supporté ce coût.
 */
describe("Coûts par commande — packaging + carte de remerciement", () => {
  it("les montants annoncés : 0,35 € + 0,03 € = 0,38 € par commande", () => {
    expect(PACKAGING_COST_CENTS).toBe(35);
    expect(THANKS_CARD_COST_CENTS).toBe(3);
    expect(PER_ORDER_EXTRAS_CENTS).toBe(38);
  });

  it("INACTIF tant que la date n'est pas fournie : 0 € partout", () => {
    // Garde-fou : si quelqu'un pose la date sans le vouloir, ce test le dit.
    expect(PER_ORDER_EXTRAS_START_DATE).toBeNull();
    expect(perOrderExtrasCents("2026-08-12", true)).toBe(0);
    expect(perOrderExtrasCents("2027-01-01", true)).toBe(0);
  });

  it("une fois la date posée : appliqué à partir du jour J inclus, jamais avant", () => {
    // Simule le comportement futur sans toucher à la constante réelle.
    const futur = (day: string, start: string, hasItems = true) =>
      start !== null && day >= start && hasItems ? PER_ORDER_EXTRAS_CENTS : 0;

    expect(futur("2026-08-31", "2026-09-01")).toBe(0); // veille → rien
    expect(futur("2026-09-01", "2026-09-01")).toBe(38); // jour J → appliqué
    expect(futur("2026-09-02", "2026-09-01")).toBe(38);
    expect(futur("2026-09-02", "2026-09-01", false)).toBe(0); // commande vide
  });

  it("une commande vide ne consomme ni packaging ni carte", () => {
    expect(perOrderExtrasCents("2027-01-01", false)).toBe(0);
  });
});
