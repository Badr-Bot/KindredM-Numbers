import { describe, expect, it } from "vitest";
import {
  ONE_OFF_COSTS,
  badrNetLedgerCentsForDay,
  oneOffCostsCentsForDay,
} from "../associateLedger";
import { fixedCostsCentsForDay } from "../subscriptions";

/**
 * 🤝 Entre associés — avances payées de sa poche.
 * Règle du fichier : on fige les EUR réellement débités, ligne à ligne, et
 * seule la part de l'AUTRE est due au payeur (jamais le montant brut).
 */

describe("Google One — payé par Badr (01/09)", () => {
  const lignes = ONE_OFF_COSTS.filter((c) => c.label === "Google One");

  it("garde les 3 débits ligne à ligne, 5,97 € au total", () => {
    // Badr a d'abord annoncé 17,53 € + 3 × 1,99 €, puis : « enlève 17.53 € ».
    expect(lignes).toHaveLength(3);
    expect(lignes.reduce((a, c) => a + c.eurCents, 0)).toBe(597);
    expect(lignes.map((c) => c.eurCents)).toEqual([199, 199, 199]);
    expect(lignes.every((c) => c.paidBy === "BADR")).toBe(true);
  });

  it("entre dans le NET du jour — sinon la charge n'existerait nulle part", () => {
    // Google One n'a aucune ligne d'abonnement : si ce frais ne tombait pas
    // dans le net, la dépense serait invisible côté P&L.
    expect(oneOffCostsCentsForDay("2026-09-01")).toBe(597);
    // Le net du jour = abonnements étalés + ce frais : la différence entre les
    // deux est exactement les 5,97 €. (Comparer avec le 02/09 ne marche plus :
    // il porte son propre frais ponctuel, Google Ads 65,08 $ inscrit le 04/09.)
    expect(fixedCostsCentsForDay("2026-09-01") - oneOffCostsCentsForDay("2026-09-01")).toBe(
      fixedCostsCentsForDay("2026-09-01") - 597
    );
  });

  it("ne doit à Badr que la MOITIÉ (la part d'Adnane), pas les 5,97 €", () => {
    // 3 × 199/2, arrondis ligne à ligne comme le reste du fichier → 3,00 €.
    expect(badrNetLedgerCentsForDay("2026-09-01")).toBe(300);
  });

  it("ne pèse que sur son jour, jamais étalé", () => {
    expect(oneOffCostsCentsForDay("2026-08-31")).toBe(0);
    // Le 02/09 porte un AUTRE frais ponctuel (Google Ads, 04/09) — mais pas
    // une miette de Google One.
    expect(ONE_OFF_COSTS.filter((c) => c.day === "2026-09-02" && c.label === "Google One")).toHaveLength(0);
  });
});
