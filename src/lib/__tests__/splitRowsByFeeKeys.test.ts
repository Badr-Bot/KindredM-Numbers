import { describe, expect, it } from "vitest";
import { splitRowsByFeeKeys } from "../incrementalSync";

/**
 * Verrou anti-régression du bug d'effacement des frais réels (16/08).
 *
 * postgrest-js construit `columns` = union des clés de toutes les lignes d'un
 * upsert, et une ligne à qui il manque une clé listée se fait écrire NULL :
 * un lot mélangeant commandes avec/sans fee_* effaçait les frais réels déjà
 * en base des commandes hors fenêtre J-2→J, à chaque synchro. Les lots
 * doivent donc rester homogènes.
 */
describe("splitRowsByFeeKeys (effacement des frais réels, 16/08)", () => {
  it("sépare strictement les lignes avec fee_* des lignes sans", () => {
    const avec = { id: 1, total_cents: 5999, fee_total_cents: 294, fee_processing_cents: 236 };
    const sans = { id: 2, total_cents: 8999 };
    const { withFees, withoutFees } = splitRowsByFeeKeys([avec, sans, { ...avec, id: 3 }]);

    expect(withFees.map((r) => r.id)).toEqual([1, 3]);
    expect(withoutFees.map((r) => r.id)).toEqual([2]);
    // La garantie qui compte : AUCUNE clé fee_* dans le lot « sans », sinon
    // l'union des colonnes réintroduit l'écrasement à NULL.
    for (const row of withoutFees) {
      expect(Object.keys(row).some((k) => k.startsWith("fee_"))).toBe(false);
    }
  });

  it("lots vides acceptés (aucune commande dans la fenêtre de frais)", () => {
    const { withFees, withoutFees } = splitRowsByFeeKeys([]);
    expect(withFees).toEqual([]);
    expect(withoutFees).toEqual([]);
  });
});
