import { describe, expect, it } from "vitest";
import { HISTORY_TAG, DASHBOARD_TAG, REWRITE_WINDOW_DAYS, frozenEndDay } from "../cacheTags";

/**
 * 🗄️ Passé figé vs fenêtre chaude (Badr 07/09 : « enregistrer ce qui s'est
 * déjà passé les jours d'avant et relire que le jour J »).
 *
 * La coupure doit rester DERRIÈRE la fenêtre que la synchro profonde réécrit
 * (J-7 → J, voir rescanFromDay dans incrementalSync.ts). Si elle passait
 * devant, un jour encore réécrit serait servi depuis un cache de 24 h — donc
 * un chiffre faux affiché toute la journée.
 */
describe("frozenEndDay", () => {
  it("s'arrête un jour AVANT la fenêtre réécrite par la synchro profonde", () => {
    expect(REWRITE_WINDOW_DAYS).toBe(7);
    // J-7 = 2026-08-31 est encore réécrit ; le passé figé s'arrête au 30/08.
    expect(frozenEndDay("2026-09-07")).toBe("2026-08-30");
  });

  it("traverse correctement un changement de mois et une fin de mois courte", () => {
    expect(frozenEndDay("2026-03-01")).toBe("2026-02-21");
    expect(frozenEndDay("2026-01-05")).toBe("2025-12-28");
  });

  it("garde deux étiquettes DISTINCTES : une synchro ne doit pas jeter l'historique", () => {
    expect(HISTORY_TAG).not.toBe(DASHBOARD_TAG);
  });
});
