import { describe, expect, it } from "vitest";
import { aggregateByCode, parseAdCode } from "../creaCode";

describe("parseAdCode (CODIFICATION.md)", () => {
  it("parse un nom codifié complet", () => {
    expect(parseAdCode("AD106v2 - POLO-VEN-UGC-QST-FR")).toEqual({
      seq: 106,
      variation: 2,
      produit: "POLO",
      angle: "VEN",
      format: "UGC",
      hook: "QST",
      langue: "FR",
      marquage: null,
    });
  });

  it("lit le marquage T37 apposé par-dessus", () => {
    expect(parseAdCode("WIN 2026-08 S4 - AD106v2 - POLO-VEN-UGC-QST-FR")?.marquage).toBe("WIN");
    expect(parseAdCode("POTENTIAL - AD9v1 - LANCASTER-CNF-VID-TMG-DE")?.marquage).toBe("POTENTIAL");
    expect(parseAdCode("BANGER - AD46v1 - POLO-VEN-VID-PRB-FR")?.marquage).toBe("BANGER");
  });

  it("tolère l'espace du format T36 (« AD 428v3 »)", () => {
    expect(parseAdCode("AD 428v3 - POLO-VAC-VID-CUR-FR")?.seq).toBe(428);
  });

  it("les anciens noms rendent null, jamais une erreur", () => {
    for (const n of ["PUB 46 TOFU VENTRE", "IMAGE 57", "reject", "5", "", null, undefined]) {
      expect(parseAdCode(n)).toBeNull();
    }
  });
});

describe("aggregateByCode", () => {
  const rows = [
    { adName: "AD1v1 - POLO-VEN-UGC-QST-FR", spendCents: 10000, purchases: 4, purchaseValueCents: 30000 },
    { adName: "AD2v1 - POLO-VEN-IMG-PRB-FR", spendCents: 5000, purchases: 1, purchaseValueCents: 6000 },
    { adName: "AD3v1 - POLO-FEM-UGC-QST-FR", spendCents: 20000, purchases: 5, purchaseValueCents: 44000 },
    { adName: "PUB 46 TOFU VENTRE", spendCents: 999999, purchases: 99, purchaseValueCents: 1 }, // non codée : ignorée
  ];

  it("agrège par angle, trié par spend, ROAS calculé", () => {
    const byAngle = aggregateByCode(rows, "angle");
    expect(byAngle.map((b) => b.key)).toEqual(["FEM", "VEN"]);
    expect(byAngle[1]).toMatchObject({ ads: 2, spendCents: 15000, purchases: 5 });
    expect(byAngle[0].roas).toBeCloseTo(2.2);
  });

  it("agrège par hook", () => {
    const byHook = aggregateByCode(rows, "hook");
    expect(byHook.find((b) => b.key === "QST")).toMatchObject({ ads: 2, spendCents: 30000 });
  });
});
