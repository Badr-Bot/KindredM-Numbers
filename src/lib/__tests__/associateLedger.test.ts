import { describe, expect, it } from "vitest";
import {
  ONE_OFF_COSTS,
  badrNetLedgerCentsForDay,
  oneOffCostsCentsForDay,
} from "../associateLedger";

/**
 * 🤝 Entre associés — avances payées de sa poche.
 * Règle du fichier : on fige les EUR réellement débités, ligne à ligne, et
 * seule la part de l'AUTRE est due au payeur (jamais le montant brut).
 */

describe("Google One — payé par Badr, 1,99 € PAR MOIS", () => {
  const lignes = ONE_OFF_COSTS.filter((c) => c.label === "Google One");

  it("étale les 3 débits sur 3 MOIS, pas sur un seul", () => {
    // Badr a d'abord annoncé 17,53 € + 3 × 1,99 €, puis : « enlève 17.53 € ».
    // Puis le 06/09, en parlant d'AOÛT : « y a 2 € de Google One que je paye »
    // → c'est 1,99 € par mois. Les trois débits étaient tous datés du 01/09,
    // donc août n'en voyait aucun et l'écart entre les deux parts sortait à
    // 8 € au lieu de 6 €.
    expect(lignes).toHaveLength(3);
    expect(lignes.reduce((a, c) => a + c.eurCents, 0)).toBe(597);
    expect(lignes.map((c) => c.eurCents)).toEqual([199, 199, 199]);
    expect(lignes.map((c) => c.day)).toEqual(["2026-07-01", "2026-08-01", "2026-09-01"]);
    expect(lignes.every((c) => c.paidBy === "BADR")).toBe(true);
  });

  it("entre dans le NET du mois — sinon la charge n'existerait nulle part", () => {
    // Google One n'a aucune ligne d'abonnement : si ce frais ne tombait pas
    // dans le net, la dépense serait invisible côté P&L.
    for (const jour of ["2026-07-01", "2026-08-01", "2026-09-01"]) {
      expect(oneOffCostsCentsForDay(jour)).toBe(199);
    }
  });

  it("ne doit à Badr que la MOITIÉ (la part d'Adnane), pas les 1,99 €", () => {
    // 199/2 arrondi → 1,00 € dû par Adnane, chaque mois.
    expect(badrNetLedgerCentsForDay("2026-08-01")).toBe(100);
    expect(badrNetLedgerCentsForDay("2026-09-01")).toBe(100);
  });

  it("ne pèse que sur son jour, jamais étalé", () => {
    expect(oneOffCostsCentsForDay("2026-08-31")).toBe(0);
    // Le 02/09 porte un AUTRE frais ponctuel (Google Ads, 04/09) — mais pas
    // une miette de Google One.
    expect(ONE_OFF_COSTS.filter((c) => c.day === "2026-09-02" && c.label === "Google One")).toHaveLength(0);
  });
});
