import { describe, expect, it } from "vitest";
import {
  buildBudgetTimeline,
  detectBudgetMarkers,
  detectCreaMarkers,
  detectScaleMarkers,
  SCALE_MIN_BASE_CENTS,
} from "../changeMarkers";

/**
 * 📍 Repères scale / descale / créas (onglet Analyse, demande Badr 29/08).
 * Ces tests figent les règles : un repère qui apparaît sur du bruit rend les
 * courbes illisibles, un repère manquant fait rater le geste qu'on cherche
 * justement à évaluer.
 */

const day = (n: number) => `2026-08-${String(n).padStart(2, "0")}`;
const TODAY = "2026-08-29";

describe("scale / descale déduits de la dépense", () => {
  it("marque une hausse ≥ 20 % en scale ↑", () => {
    const m = detectScaleMarkers(new Map([[day(10), 20000], [day(11), 30000]]), TODAY);
    expect(m).toHaveLength(1);
    expect(m[0]).toMatchObject({ day: day(11), kind: "scale_up" });
    expect(m[0].text).toContain("50 %");
  });

  it("marque une baisse ≥ 20 % en descale ↓", () => {
    const m = detectScaleMarkers(new Map([[day(10), 20000], [day(11), 14000]]), TODAY);
    expect(m).toHaveLength(1);
    expect(m[0]).toMatchObject({ day: day(11), kind: "scale_down" });
  });

  it("ignore la respiration de l'algo (< 20 %) — sinon les courbes se noient", () => {
    const m = detectScaleMarkers(
      new Map([[day(10), 20000], [day(11), 22000], [day(12), 20500]]),
      TODAY
    );
    expect(m).toEqual([]);
  });

  it("ignore les petits montants des deux côtés (base < 50 €)", () => {
    const petit = SCALE_MIN_BASE_CENTS - 1;
    expect(detectScaleMarkers(new Map([[day(10), petit], [day(11), petit * 3]]), TODAY)).toEqual([]);
    // 0 € → 60 € = (re)démarrage de campagne, pas un scale.
    expect(detectScaleMarkers(new Map([[day(10), 0], [day(11), 6000]]), TODAY)).toEqual([]);
  });

  it("ne compare JAMAIS le jour en cours (dépense partielle = faux descale)", () => {
    const m = detectScaleMarkers(new Map([[day(28), 20000], [TODAY, 3000]]), TODAY);
    expect(m).toEqual([]);
  });

  it("compare au jour PRÉSENT précédent, pas à J-1 calendaire (campagne en pause)", () => {
    // Rien le 11 et le 12 (campagne à l'arrêt) : le 13 se compare au 10.
    const m = detectScaleMarkers(new Map([[day(10), 20000], [day(13), 26000]]), TODAY);
    expect(m).toHaveLength(1);
    expect(m[0].kind).toBe("scale_up");
  });
});

describe("nouvelles créas", () => {
  const rows = [
    { day: day(10), adId: "a1", adName: "Créa A" },
    { day: day(11), adId: "a1", adName: "Créa A" },
    { day: day(11), adId: "a2", adName: "Créa B" },
    { day: day(12), adId: "a3", adName: "Créa C" },
    { day: day(12), adId: "a4", adName: "Créa D" },
  ];

  it("marque le 1er jour d'apparition d'une annonce", () => {
    const m = detectCreaMarkers(rows);
    expect(m.map((x) => x.day)).toEqual([day(11), day(12)]);
    expect(m.every((x) => x.kind === "crea")).toBe(true);
  });

  it("regroupe les créas ajoutées le même jour", () => {
    const m = detectCreaMarkers(rows);
    expect(m[1].text).toContain("2 nouvelles créas");
  });

  it("n'invente pas un ajout le tout premier jour de l'historique", () => {
    // Les annonces déjà en route au début de l'historique ne sont pas des
    // ajouts : sinon chaque campagne « ajouterait » toutes ses créas au J1.
    expect(detectCreaMarkers(rows).some((x) => x.day === day(10))).toBe(false);
  });

  it("ne renvoie rien sans données", () => {
    expect(detectCreaMarkers([])).toEqual([]);
  });
});

describe("scale / descale EXACTS (journal d'activité Meta)", () => {
  it("lit le vrai changement de budget, ancien → nouveau", () => {
    const m = detectBudgetMarkers([
      { day: day(12), oldBudgetCents: 25000, newBudgetCents: 40000 },
    ]);
    expect(m).toHaveLength(1);
    expect(m[0].kind).toBe("scale_up");
    expect(m[0].text).toContain("250 €");
    expect(m[0].text).toContain("400 €");
    expect(m[0].text).toContain("+60 %");
  });

  it("marque une baisse de budget en descale, même petite", () => {
    // −15 % = un cran d'escalier du protocole : la déduction par la dépense
    // le raterait (seuil 20 %), le journal d'activité non.
    const m = detectBudgetMarkers([
      { day: day(12), oldBudgetCents: 100000, newBudgetCents: 85000 },
    ]);
    expect(m).toHaveLength(1);
    expect(m[0].kind).toBe("scale_down");
  });

  it("fusionne plusieurs changements du même jour en un seul trajet", () => {
    const m = detectBudgetMarkers([
      { day: day(12), oldBudgetCents: 20000, newBudgetCents: 30000 },
      { day: day(12), oldBudgetCents: 30000, newBudgetCents: 50000 },
    ]);
    expect(m).toHaveLength(1);
    expect(m[0].text).toContain("200 €");
    expect(m[0].text).toContain("500 €");
  });

  it("ne marque rien quand la journée revient à son point de départ", () => {
    const m = detectBudgetMarkers([
      { day: day(12), oldBudgetCents: 20000, newBudgetCents: 30000 },
      { day: day(12), oldBudgetCents: 30000, newBudgetCents: 20000 },
    ]);
    expect(m).toEqual([]);
  });

  it("ignore un événement dont un des deux montants manque", () => {
    expect(
      detectBudgetMarkers([{ day: day(12), oldBudgetCents: null, newBudgetCents: 30000 }])
    ).toEqual([]);
  });
});

describe("budget quotidien reconstitué (Badr : « le budget, pas le spent »)", () => {
  const days = [day(10), day(11), day(12), day(13)];

  it("applique le nouveau budget À PARTIR du jour du changement", () => {
    const tl = buildBudgetTimeline({
      changes: [{ day: day(12), oldBudgetCents: 25000, newBudgetCents: 40000 }],
      days,
      currentBudgetCents: 40000,
    });
    expect(tl.get(day(11))).toBe(25000);
    expect(tl.get(day(12))).toBe(40000);
    expect(tl.get(day(13))).toBe(40000);
  });

  it("remonte le temps avec l'ancien montant du 1er changement connu", () => {
    const tl = buildBudgetTimeline({
      changes: [{ day: day(12), oldBudgetCents: 25000, newBudgetCents: 40000 }],
      days,
      currentBudgetCents: 40000,
    });
    expect(tl.get(day(10))).toBe(25000);
  });

  it("garde le DERNIER changement du jour quand il y en a plusieurs", () => {
    const tl = buildBudgetTimeline({
      changes: [
        { day: day(12), oldBudgetCents: 20000, newBudgetCents: 30000 },
        { day: day(12), oldBudgetCents: 30000, newBudgetCents: 50000 },
      ],
      days,
      currentBudgetCents: 50000,
    });
    expect(tl.get(day(12))).toBe(50000);
  });

  it("campagne jamais touchée : le budget live, à plat", () => {
    const tl = buildBudgetTimeline({ changes: [], days, currentBudgetCents: 60000 });
    expect([...tl.values()]).toEqual([60000, 60000, 60000, 60000]);
  });

  it("budget inconnu = TROU, jamais un zéro (qui se lirait « campagne coupée »)", () => {
    const tl = buildBudgetTimeline({ changes: [], days, currentBudgetCents: null });
    expect(tl.size).toBe(0);
  });

  it("ne confond jamais budget et dépense : un budget non dépensé reste entier", () => {
    // 500 €/j de budget, la campagne n'en dépense que 380 : le budget affiché
    // doit rester 500 — c'est tout l'objet de la correction.
    const tl = buildBudgetTimeline({ changes: [], days, currentBudgetCents: 50000 });
    expect(tl.get(day(11))).toBe(50000);
  });
});
