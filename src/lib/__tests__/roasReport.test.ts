import { describe, expect, it } from "vitest";
import { computeRoasReport, parseUtmCampaign } from "../roasReport";

/**
 * Rapport de perf par campagne (12/08) — Badr : « le rapport ROAS sur Slack
 * le fait merdiquement, c'est pas les bonnes valeurs sur Meta ».
 *
 * Ce test existe parce que la routine n'avait AUCUN code : elle recalculait
 * de tête à chaque run. Les propriétés verrouillées ici sont exactement
 * celles qui se perdaient :
 *  • MER ≠ ROAS (le MER inclut l'organique, le ROAS non) ;
 *  • une campagne qui dépense sans vendre doit apparaître, pas disparaître ;
 *  • les exclusions suivent la liste partagée de meta.ts, jamais une copie ;
 *  • le CA est net des remboursements, comme partout ailleurs.
 */
describe("parseUtmCampaign", () => {
  it("extrait l'ID de campagne de l'URL d'atterrissage", () => {
    expect(parseUtmCampaign("/?utm_source=facebook&utm_campaign=120321&utm_medium=paid")).toBe("120321");
    expect(parseUtmCampaign("/collections/polo?utm_campaign=999")).toBe("999");
  });

  it("renvoie null quand il n'y a pas d'UTM (organique, direct)", () => {
    expect(parseUtmCampaign("/")).toBeNull();
    expect(parseUtmCampaign(null)).toBeNull();
    expect(parseUtmCampaign("")).toBeNull();
    expect(parseUtmCampaign("/?utm_source=google")).toBeNull();
    expect(parseUtmCampaign("/?utm_campaign=")).toBeNull();
  });

  it("décode les valeurs encodées", () => {
    expect(parseUtmCampaign("/?utm_campaign=CBO%202%20-%20FR")).toBe("CBO 2 - FR");
  });

  it("refuse une valeur coupée par la troncature à 300 caractères", () => {
    // landing_site est stocké tronqué : un ID à moitié coupé rattacherait le
    // CA à la mauvaise campagne, ce qui en fausse deux d'un coup.
    const tronque = "/?a=" + "x".repeat(280) + "&utm_campaign=1203";
    expect(tronque.length).toBeGreaterThanOrEqual(300);
    expect(parseUtmCampaign(tronque)).toBeNull();
  });
});

describe("computeRoasReport", () => {
  const base = {
    day: "2026-08-12",
    orders: [
      // 2 commandes attribuées à la campagne A (dont une remboursée en partie)
      { total_cents: 6000, refunded_cents: 0, landing_site: "/?utm_campaign=A" },
      { total_cents: 9000, refunded_cents: 1000, landing_site: "/?utm_campaign=A" },
      // 1 commande sur la campagne B
      { total_cents: 5000, refunded_cents: 0, landing_site: "/?utm_campaign=B" },
      // organique : aucune campagne
      { total_cents: 4000, refunded_cents: 0, landing_site: "/" },
    ],
    spend: [
      { campaign_id: "A", campaign_name: "CBO FR", market: "FR", spend_cents: 5000 },
      { campaign_id: "B", campaign_name: "CBO ES", market: "ES", spend_cents: 5000 },
      // Campagne qui a dépensé sans vendre : DOIT apparaître avec ROAS 0.
      { campaign_id: "C", campaign_name: "ZOMBIE", market: "FR", spend_cents: 2000 },
      // NIRA : plus exclue depuis le 06/08 (voir test dédié plus bas).
      { campaign_id: "N", campaign_name: "CBO NIRA CA", market: "CA", spend_cents: 10000 },
    ],
    insights: [
      { campaign_id: "A", purchase_value_cents: 7000, purchases: 1 }, // Meta sous-estime
      { campaign_id: "B", purchase_value_cents: 5000, purchases: 1 },
    ],
  };

  it("sépare MER (CA total ÷ spend) et ROAS (CA attribué ÷ spend)", () => {
    const r = computeRoasReport(base);
    // CA total = 6000 + 8000 + 5000 + 4000 = 23000 ; spend = 22000 (toutes
    // campagnes : la liste d'exclusion est vide aujourd'hui, cf. test plus bas)
    expect(r.totals.caTotalCents).toBe(23000);
    expect(r.totals.spendCents).toBe(22000);
    expect(r.totals.mer).toBeCloseTo(23000 / 22000, 6);
    // Le MER est forcément SUPÉRIEUR au ROAS : il inclut les 4 000 d'organique
    // et tout le CA que Meta ne s'attribue pas.
    expect(r.totals.mer! > r.totals.roasMetaGlobal!).toBe(true);
  });

  it("compte le CA net des remboursements", () => {
    const r = computeRoasReport(base);
    const a = r.campaigns.find((c) => c.campaignId === "A")!;
    expect(a.caShopifyCents).toBe(6000 + 8000); // 9000 − 1000 de remboursement
    expect(a.ordersAttributed).toBe(2);
    expect(a.roasShopify).toBeCloseTo(14000 / 5000, 6);
  });

  it("montre le ROAS Meta à côté du ROAS UTM, sans les confondre", () => {
    const r = computeRoasReport(base);
    const a = r.campaigns.find((c) => c.campaignId === "A")!;
    expect(a.caMetaCents).toBe(7000);
    expect(a.roasMeta).toBeCloseTo(7000 / 5000, 6); // 1,40× annoncé par Meta
    expect(a.roasShopify).toBeCloseTo(14000 / 5000, 6); // 2,80× réellement tracés
    // C'est exactement l'écart qui faisait couper des campagnes à tort.
    expect(a.roasMeta! < a.roasShopify!).toBe(true);
  });

  it("garde les campagnes qui dépensent sans vendre (ROAS 0, pas absentes)", () => {
    const r = computeRoasReport(base);
    const zombie = r.campaigns.find((c) => c.campaignId === "C");
    expect(zombie).toBeDefined();
    expect(zombie!.caShopifyCents).toBe(0);
    expect(zombie!.roasShopify).toBe(0);
  });

  it("délègue les exclusions à isExcludedCampaign — liste vide aujourd'hui", () => {
    // La liste `EXCLUDED_CAMPAIGN_KEYWORDS` (meta.ts) est VIDE depuis le 06/08
    // (Badr a réintégré le spend NIRA : « plus adapté à la réalité »). Le
    // rapport ne filtre donc rien, exactement comme le net et l'onglet Analyse
    // qui utilisent la même fonction. Ce test documente l'état réel : si la
    // liste est un jour re-remplie, il échouera et rappellera de vérifier que
    // le rapport suit bien le reste du dashboard.
    const r = computeRoasReport(base);
    expect(r.campaigns.some((c) => c.campaignId === "N")).toBe(true);
    expect(r.totals.spendCents).toBe(22000);
  });

  it("isole le CA non attribué (organique/direct)", () => {
    const r = computeRoasReport(base);
    expect(r.totals.caUnattributedCents).toBe(4000);
    expect(r.totals.caAttributedCents).toBe(19000);
    expect(r.totals.caAttributedCents + r.totals.caUnattributedCents).toBe(r.totals.caTotalCents);
  });

  it("classe les campagnes par spend décroissant (le plus gros risque en tête)", () => {
    const r = computeRoasReport(base);
    expect(r.campaigns.map((c) => c.campaignId)).toEqual(["N", "A", "B", "C"]);
  });

  it("signale le CA rattaché à une campagne sans spend du jour", () => {
    const r = computeRoasReport({
      ...base,
      orders: [{ total_cents: 5000, refunded_cents: 0, landing_site: "/?utm_campaign=VIEILLE" }],
    });
    expect(r.warnings.some((w) => w.includes("sans spend"))).toBe(true);
  });

  it("ne divise jamais par zéro", () => {
    const r = computeRoasReport({ day: "2026-08-12", orders: [], spend: [], insights: [] });
    expect(r.totals.mer).toBeNull();
    expect(r.totals.roasMetaGlobal).toBeNull();
    expect(r.campaigns).toEqual([]);
  });
});
