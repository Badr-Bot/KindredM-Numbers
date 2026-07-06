import { describe, expect, it } from "vitest";
import { toParisDay } from "../time";

describe("toParisDay — loi §0.3 (fuseau Europe/Paris)", () => {
  it("23:58 heure de Paris (CEST, UTC+2) appartient à ce jour-là", () => {
    // 2026-07-04 23:58 Europe/Paris (CEST) = 2026-07-04 21:58 UTC
    expect(toParisDay("2026-07-04T21:58:00Z")).toBe("2026-07-04");
  });

  it("une commande juste après minuit Paris bascule au jour suivant", () => {
    // 2026-07-05 00:30 Europe/Paris (CEST) = 2026-07-04 22:30 UTC
    expect(toParisDay("2026-07-04T22:30:00Z")).toBe("2026-07-05");
  });

  it("en hiver (CET, UTC+1) le décalage est correct", () => {
    // 2026-01-15 00:30 Europe/Paris (CET) = 2026-01-14 23:30 UTC
    expect(toParisDay("2026-01-14T23:30:00Z")).toBe("2026-01-15");
  });
});
