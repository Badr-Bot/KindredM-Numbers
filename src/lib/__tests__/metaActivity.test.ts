import { describe, expect, it } from "vitest";
import { activityBudgetCents, readActivityValue } from "../meta";

/**
 * 🪵 Journal d'activité Meta — lecture d'`extra_data`.
 *
 * Régression du 29/08 (Badr : « le budget est figé ») : Meta renvoie les
 * changements de budget sous forme COMPOSITE, le code ne lisait que la forme
 * plate, `Number({...})` valait NaN → tous les montants tombaient à null.
 * Conséquence : aucun repère scale/descale sur les courbes, et l'onglet
 * Scaling qui devine ses budgets. Les charges utiles ci-dessous sont COPIÉES
 * du journal réel du compte Niva (23-29/08) — ne pas les « simplifier ».
 */

// CBO TESTING DU 29/07 DES ZOMBIE, 28/08 à 23h27 : 750 € → 638 €.
const COMPOSITE = JSON.parse(
  '{"old_value":{"type":"payment_amount","currency":"EUR","old_value":75000,' +
    '"additional_type":"status_string","additional_value":""},' +
    '"new_value":{"type":"payment_amount","currency":"EUR","new_value":63800,' +
    '"additional_type":"status_string","additional_value":"Per day"},' +
    '"type":"composite_data"}'
) as Record<string, unknown>;

describe("extra_data composite (la forme que Meta envoie vraiment)", () => {
  it("lit le montant imbriqué sous la clé du même nom", () => {
    expect(activityBudgetCents(COMPOSITE, "old_value")).toBe(75000);
    expect(activityBudgetCents(COMPOSITE, "new_value")).toBe(63800);
  });

  it("ne renvoie plus null — c'était tout le bug", () => {
    expect(activityBudgetCents(COMPOSITE, "new_value")).not.toBeNull();
  });
});

describe("extra_data plat (forme historique, toujours acceptée)", () => {
  it("lit une valeur directe, nombre ou chaîne", () => {
    expect(activityBudgetCents({ old_value: 50000, new_value: "75000" }, "old_value")).toBe(50000);
    expect(activityBudgetCents({ old_value: 50000, new_value: "75000" }, "new_value")).toBe(75000);
  });

  it("garde les statuts lisibles (update_campaign_run_status)", () => {
    expect(readActivityValue({ new_value: "PAUSED" }, "new_value")).toBe("PAUSED");
    expect(
      readActivityValue({ new_value: { type: "status_string", new_value: "ACTIVE" } }, "new_value")
    ).toBe("ACTIVE");
  });
});

describe("valeurs absentes ou illisibles", () => {
  it("renvoie null, jamais 0 (un 0 se lirait « budget coupé »)", () => {
    expect(activityBudgetCents({}, "new_value")).toBeNull();
    expect(activityBudgetCents({ new_value: "abc" }, "new_value")).toBeNull();
    expect(activityBudgetCents({ new_value: 0 }, "new_value")).toBeNull();
    expect(activityBudgetCents({ new_value: null }, "new_value")).toBeNull();
  });
});
