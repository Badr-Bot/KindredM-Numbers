import { describe, expect, it } from "vitest";
import {
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

  it("fusionne plusieurs retouches d'UNE campagne en un seul trajet", () => {
    const m = detectBudgetMarkers([
      { day: day(12), campaignId: "c1", oldBudgetCents: 20000, newBudgetCents: 30000 },
      { day: day(12), campaignId: "c1", oldBudgetCents: 30000, newBudgetCents: 50000 },
    ]);
    expect(m).toHaveLength(1);
    expect(m[0].text).toContain("200 €");
    expect(m[0].text).toContain("500 €");
  });

  it("ne CHAÎNE JAMAIS les montants de deux campagnes différentes", () => {
    // Le vrai cas Badr : il retouche ses 4 CBO le même soir. Sans séparation
    // par campagne, on affichait un trajet inventé (750 € → 145 €).
    const m = detectBudgetMarkers([
      { day: day(12), campaignId: "c1", oldBudgetCents: 75000, newBudgetCents: 63800 },
      { day: day(12), campaignId: "c2", oldBudgetCents: 17000, newBudgetCents: 14500 },
    ]);
    expect(m).toHaveLength(1);
    // Somme des campagnes MODIFIÉES : 920 € → 783 €.
    expect(m[0].text).toContain("920 €");
    expect(m[0].text).toContain("783 €");
    expect(m[0].text).toContain("2 campagnes");
    expect(m[0].kind).toBe("scale_down");
  });

  it("compense correctement une hausse et une baisse le même jour", () => {
    const m = detectBudgetMarkers([
      { day: day(12), campaignId: "c1", oldBudgetCents: 10000, newBudgetCents: 30000 },
      { day: day(12), campaignId: "c2", oldBudgetCents: 20000, newBudgetCents: 15000 },
    ]);
    expect(m).toHaveLength(1);
    expect(m[0].kind).toBe("scale_up"); // +200 − 50 = +150 €
  });

  it("affiche l'heure du changement quand elle est connue", () => {
    const m = detectBudgetMarkers([
      { day: day(12), at: "23:27", campaignId: "c1", oldBudgetCents: 25000, newBudgetCents: 40000 },
    ]);
    expect(m[0].text).toContain("23:27");
  });

  it("ne marque rien quand la campagne revient à son point de départ", () => {
    const m = detectBudgetMarkers([
      { day: day(12), campaignId: "c1", oldBudgetCents: 20000, newBudgetCents: 30000 },
      { day: day(12), campaignId: "c1", oldBudgetCents: 30000, newBudgetCents: 20000 },
    ]);
    expect(m).toEqual([]);
  });

  it("ignore un événement dont un des deux montants manque", () => {
    expect(
      detectBudgetMarkers([{ day: day(12), oldBudgetCents: null, newBudgetCents: 30000 }])
    ).toEqual([]);
  });
});
