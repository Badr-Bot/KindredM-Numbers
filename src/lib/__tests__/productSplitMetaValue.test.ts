import { describe, expect, it } from "vitest";
import {
  bucketForCampaignName,
  emptyCaByBucket,
  splitMetaValueByProduct,
  type CaByBucket,
  type MetaCampaignValue,
} from "../analytics";

/**
 * Ventilation de la valeur Meta par produit (14/08) — Badr : « pk le MER du
 * Polo est en dessous du ROAS Meta alors que j'ai qu'une campagne Meta ? c'est
 * pas normal non ?? ».
 *
 * L'INVARIANT que ces tests verrouillent : sur une même carte, le MER ne peut
 * pas passer sous le ROAS Meta. Dénominateur identique (le spend du bucket) et
 * numérateur du MER = CA TOTAL du bucket, qui contient déjà le CA que Meta
 * s'attribue. Une inversion ne peut donc venir que de deux périmètres qui ne
 * se recouvrent pas — c'était le bug : CA découpé par lignes de commande,
 * valeur Meta découpée par nom de campagne.
 *
 * Ce qui est testé ici :
 *  • une campagne Polo qui vend un Gilet (cross-sell) rend sa valeur Meta au
 *    Gilet, comme le CA le fait déjà ;
 *  • le nom de campagne ne sert plus que de repli, sans commande UTM ;
 *  • la somme des trois buckets reste exactement le total Meta, au centime ;
 *  • le scénario réel du 14/08 ne réinverse plus MER et ROAS Meta.
 */

const caFor = (entries: Array<[string, Partial<CaByBucket>]>): Map<string, CaByBucket> => {
  const m = new Map<string, CaByBucket>();
  for (const [campaignId, parts] of entries) m.set(campaignId, { ...emptyCaByBucket(), ...parts });
  return m;
};

describe("bucketForCampaignName — repli par nom", () => {
  it("range le Gilet, les tests produit et tout le reste", () => {
    expect(bucketForCampaignName("CBO - LANCASTER")).toBe("GILET");
    expect(bucketForCampaignName("CBO - NIRA - TESTING DU 05/08")).toBe("TESTING");
    expect(bucketForCampaignName("CBO-PRODTEST-FR")).toBe("TESTING");
    expect(bucketForCampaignName("CBO-POLO-FR-TESTING")).toBe("POLO");
    // « TESTING » seul est inutilisable comme mot-clé : toutes les campagnes
    // du compte le portent déjà (cf. TESTING_CAMPAIGN_KEYWORDS).
    expect(bucketForCampaignName("CBO TESTING DU 29/07 DES ZOMBIE")).toBe("POLO");
    expect(bucketForCampaignName(null)).toBe("POLO");
  });

  it("donne la priorité au Gilet sur un nom hybride, comme le découpage du spend", () => {
    expect(bucketForCampaignName("CBO - LANCASTER - PRODTEST")).toBe("GILET");
  });
});

describe("splitMetaValueByProduct", () => {
  it("suit le CA : une campagne Polo qui vend un Gilet lui rend sa part", () => {
    const rows: MetaCampaignValue[] = [
      { campaignId: "polo1", campaignName: "CBO-POLO-FR-TESTING", purchaseValueCents: 100_000 },
    ];
    // 800 € de Polo + 200 € de Gilet sur les commandes portant cet UTM.
    const out = splitMetaValueByProduct({
      rows,
      caByCampaign: caFor([["polo1", { POLO: 80_000, GILET: 20_000 }]]),
    });
    expect(out.GILET).toBe(20_000);
    expect(out.POLO).toBe(80_000);
    expect(out.TESTING).toBe(0);
  });

  it("retombe sur le nom quand aucune commande du jour ne porte l'UTM", () => {
    // Cas courant et légitime : clic d'hier converti aujourd'hui, commande
    // sans landing_site, campagne qui a dépensé sans vendre.
    const out = splitMetaValueByProduct({
      rows: [
        { campaignId: "lanc", campaignName: "CBO - LANCASTER", purchaseValueCents: 18_495 },
        { campaignId: "nira", campaignName: "CBO - NIRA - TESTING DU 05/08", purchaseValueCents: 10_312 },
        { campaignId: "polo1", campaignName: "CBO-POLO-FR-TESTING", purchaseValueCents: 28_493 },
      ],
      caByCampaign: new Map(),
    });
    expect(out).toEqual({ GILET: 18_495, TESTING: 10_312, POLO: 28_493 });
  });

  it("conserve le total au centime malgré les arrondis", () => {
    // 1 001 centimes sur un CA 1/3 - 2/3 : aucun arrondi ne doit faire
    // disparaître (ni inventer) un centime, sinon `split()` en aval décale le
    // Polo, qui absorbe le reste.
    const out = splitMetaValueByProduct({
      rows: [{ campaignId: "c", campaignName: "CBO-POLO-FR", purchaseValueCents: 1_001 }],
      caByCampaign: caFor([["c", { GILET: 100, POLO: 200 }]]),
    });
    expect(out.GILET + out.TESTING + out.POLO).toBe(1_001);
    expect(out.GILET).toBe(334);
    expect(out.POLO).toBe(667);
  });

  it("ignore les valeurs nulles et ne produit jamais de part négative", () => {
    const out = splitMetaValueByProduct({
      rows: [
        { campaignId: "vide", campaignName: "CBO - LANCASTER", purchaseValueCents: 0 },
        // CA négatif (remboursements > ventes du jour) → traité comme zéro,
        // donc repli sur le nom plutôt qu'une part négative.
        { campaignId: "rembourse", campaignName: "CBO - LANCASTER", purchaseValueCents: 5_000 },
      ],
      caByCampaign: caFor([["rembourse", { GILET: -9_000, POLO: 0 }]]),
    });
    expect(out).toEqual({ GILET: 5_000, TESTING: 0, POLO: 0 });
  });

  it("14/08 : le MER du Polo ne repasse plus sous son ROAS Meta", () => {
    // Chiffres réels du jour (compte Niva) : LANCASTER dépense sans qu'aucun
    // achat ne lui soit attribué, pendant que 2 commandes Gilet (99,96 €)
    // sortent du CA Polo. Avant le correctif, la valeur Meta de ces commandes
    // restait au Polo : son MER passait sous son propre ROAS Meta.
    const CA_TOTAL = 92_374;
    const CA_GILET = 9_996;
    const CA_POLO = CA_TOTAL - CA_GILET;
    const SPEND_POLO = 35_910;

    const rows: MetaCampaignValue[] = [
      { campaignId: "polo_fr", campaignName: "CBO-POLO-FR-TESTING", purchaseValueCents: 28_493 },
      { campaignId: "polo_world", campaignName: "CBO 2 - POLO - WORLD - TESTING", purchaseValueCents: 42_084 },
      { campaignId: "zombie", campaignName: "CBO TESTING DU 29/07 DES ZOMBIE", purchaseValueCents: 8_100 },
      { campaignId: "lancaster", campaignName: "CBO - LANCASTER", purchaseValueCents: 0 },
    ];
    // Les 2 commandes Gilet ont été amenées par une campagne Polo (cross-sell).
    const out = splitMetaValueByProduct({
      rows,
      caByCampaign: caFor([
        ["polo_fr", { POLO: 28_493 }],
        ["polo_world", { POLO: 32_088, GILET: CA_GILET }],
        ["zombie", { POLO: 8_100 }],
      ]),
    });

    const merPolo = CA_POLO / SPEND_POLO;
    const roasMetaPolo = out.POLO / SPEND_POLO;
    expect(merPolo).toBeGreaterThanOrEqual(roasMetaPolo);
    // La part Gilet est bien sortie du Polo (elle valait 0 avant le correctif).
    expect(out.GILET).toBeGreaterThan(0);
    expect(out.GILET + out.POLO + out.TESTING).toBe(78_677);
  });
});
