import { describe, expect, it } from "vitest";
import { principalProductForOrder, type PrincipalProductContext } from "../analytics";

/**
 * 🧭 Produit principal d'une commande — règle Badr du 24/08 :
 * « s'il est venu acheter le polo, même si ça contient un gilet, la commande
 * revient au polo ». Les cas ci-dessous sont de VRAIES commandes du 18→24/08.
 */

const LANCASTER = "120248705036500495";
const ZOMBIE = "120248704958030495"; // campagne Polo
const FRTEST = "120244623504320495"; // campagne Polo

const ctx: PrincipalProductContext = {
  giletTitles: new Set(["le gilet sully"]),
  poloTitles: new Set(["le polo marceau"]),
  productByCampaignId: new Map([
    [LANCASTER, "GILET"],
    [ZOMBIE, "POLO"],
    [FRTEST, "POLO"],
  ]),
};

const li = (title: string, quantity = 1, price_cents = 0) => ({ title, quantity, price_cents });
const utm = (campaign: string | null) => (campaign ? `/?utm_source=facebook&utm_campaign=${campaign}&x=1` : null);

describe("l'intention prime : la campagne d'arrivée décide", () => {
  it("#6456 — venu par une campagne POLO, un gilet dans le panier → POLO", () => {
    expect(
      principalProductForOrder(
        { line_items: [li("Le Polo Marceau", 2, 2999), li("Le Gilet Sully", 1, 4998)], landing_site: utm(ZOMBIE) },
        ctx
      )
    ).toBe("POLO");
  });

  it("venu par LANCASTER, même avec des polos dans le panier → GILET", () => {
    expect(
      principalProductForOrder(
        { line_items: [li("Le Polo Marceau", 2, 2999), li("Le Gilet Sully", 1, 4998)], landing_site: utm(LANCASTER) },
        ctx
      )
    ).toBe("GILET");
  });

  it("#6459 — LANCASTER, panier 100 % gilet → GILET", () => {
    expect(
      principalProductForOrder(
        { line_items: [li("Le Gilet Sully", 2, 3999), li("E-Book", 1, 0)], landing_site: utm(LANCASTER) },
        ctx
      )
    ).toBe("GILET");
  });
});

describe("sans UTM exploitable, le panier tranche sur le produit PRINCIPAL", () => {
  it("#6278 — Google, 2 polos + 1 gilet : le polo pèse plus → POLO", () => {
    expect(
      principalProductForOrder(
        { line_items: [li("Le Polo Marceau", 2, 4499), li("Le Gilet Sully", 1, 1999)], landing_site: null },
        ctx
      )
    ).toBe("POLO");
  });

  it("#6478 — Google, gilet + chemise (upsell) : la chemise ne décide pas → GILET", () => {
    expect(
      principalProductForOrder(
        { line_items: [li("La Chemise Turenne", 1, 4499), li("Le Gilet Sully", 1, 4998)], landing_site: null },
        ctx
      )
    ).toBe("GILET");
  });

  it("campagne inconnue (coupée depuis) : on ne devine pas, on lit le panier", () => {
    expect(
      principalProductForOrder(
        { line_items: [li("Le Gilet Sully", 2, 3999)], landing_site: utm("999999999999") },
        ctx
      )
    ).toBe("GILET");
  });

  it("commande 100 % upsell : revient au Polo, comme avant", () => {
    expect(principalProductForOrder({ line_items: [li("E-Book", 1, 999)], landing_site: null }, ctx)).toBe("POLO");
  });

  it("prix de ligne absents : la présence d'un gilet l'emporte sur rien", () => {
    expect(
      principalProductForOrder({ line_items: [{ title: "Le Gilet Sully" }], landing_site: null }, ctx)
    ).toBe("GILET");
  });
});

describe("l'ancienne règle aurait mal classé", () => {
  it("un panier de polos avec un gilet ajouté ne bascule plus au Gilet", () => {
    const order = {
      line_items: [li("Le Polo Marceau", 4, 2250), li("Le Gilet Sully", 1, 1999)],
      landing_site: utm(FRTEST),
    };
    // Ancienne règle : « contient un gilet » → GILET. Nouvelle : POLO.
    expect(order.line_items.some((l) => l.title === "Le Gilet Sully")).toBe(true);
    expect(principalProductForOrder(order, ctx)).toBe("POLO");
  });
});
