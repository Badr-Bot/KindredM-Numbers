import { describe, expect, it } from "vitest";
import { PAYOUT_ARRIVAL_DAYS, reconcilePayouts, type BankCredit, type ShopifyPayout } from "../payouts";

// 📦 Versements Shopify ↔ banque (Badr 08/09). Cas construits sur la capture
// Shopify du 08/09 : versements en USD/EUR/CAD, statuts Programmé/Déposé.

const payout = (over: Partial<ShopifyPayout>): ShopifyPayout => ({
  id: over.id ?? `p-${over.issuedDay}-${over.amountCents}`,
  market: "FR",
  issuedDay: "2026-09-06",
  status: "PAID",
  amountCents: 113919,
  currency: "USD",
  ...over,
});
const credit = (over: Partial<BankCredit>): BankCredit => ({
  txId: over.txId ?? `c-${over.day}-${over.amountCents}`,
  day: "2026-09-08",
  bank: "SLASH",
  currency: "USD",
  amountCents: 113919,
  amountEurCents: 98000,
  description: "SHOPIFY PAYOUT",
  ...over,
});

describe("reconcilePayouts", () => {
  it("rapproche un versement PAID avec le crédit banque de même montant et devise", () => {
    const r = reconcilePayouts([payout({})], [credit({})], "2026-09-08");
    expect(r.matched).toHaveLength(1);
    expect(r.lastReceived?.credit.day).toBe("2026-09-08");
    expect(r.paidNotInBank).toEqual([]);
    expect(r.creditsUnmatched).toEqual([]);
  });

  it("ne confond JAMAIS deux devises, même à montant égal", () => {
    // 1 139,19 $ n'est pas 1 139,19 € : un versement USD ne se rapproche pas
    // d'un crédit EUR — la devise fait partie de l'identité du versement.
    const r = reconcilePayouts([payout({})], [credit({ currency: "EUR" })], "2026-09-08");
    expect(r.matched).toEqual([]);
    expect(r.creditsUnmatched).toHaveLength(1);
  });

  it("un versement PAID sans crédit passé le délai est ARRIVÉ AILLEURS, pas en retard", () => {
    const r = reconcilePayouts([payout({ issuedDay: "2026-08-20" })], [], "2026-09-08");
    expect(r.paidNotInBank).toHaveLength(1);
    expect(r.paidPending).toEqual([]);
  });

  it("un versement PAID d'hier sans crédit est simplement en attente", () => {
    const r = reconcilePayouts([payout({ issuedDay: "2026-09-07" })], [], "2026-09-08");
    expect(r.paidPending).toHaveLength(1);
    expect(r.paidNotInBank).toEqual([]);
  });

  it("le délai est celui de PAYOUT_ARRIVAL_DAYS, ni plus ni moins", () => {
    const limite = reconcilePayouts([payout({ issuedDay: "2026-09-02" })], [], "2026-09-08");
    expect(PAYOUT_ARRIVAL_DAYS).toBe(6);
    expect(limite.paidPending).toHaveLength(1); // J+6 : encore dans le délai
    const depasse = reconcilePayouts([payout({ issuedDay: "2026-09-01" })], [], "2026-09-08");
    expect(depasse.paidNotInBank).toHaveLength(1); // J+7 : dehors
  });

  it("deux versements identiques prennent chacun UN crédit, le plus ancien d'abord", () => {
    const p1 = payout({ id: "a", issuedDay: "2026-09-01" });
    const p2 = payout({ id: "b", issuedDay: "2026-09-05" });
    const c1 = credit({ txId: "c1", day: "2026-09-02" });
    const c2 = credit({ txId: "c2", day: "2026-09-06" });
    const r = reconcilePayouts([p2, p1], [c2, c1], "2026-09-08");
    expect(r.matched.map((m) => [m.payout.id, m.credit.txId])).toEqual([
      ["a", "c1"],
      ["b", "c2"],
    ]);
  });

  it("SCHEDULED et IN_TRANSIT ne cherchent aucun crédit ; FAILED/CANCELED sont ignorés", () => {
    const r = reconcilePayouts(
      [
        payout({ id: "s", status: "SCHEDULED", issuedDay: "2026-09-12", amountCents: 78746 }),
        payout({ id: "t", status: "IN_TRANSIT", issuedDay: "2026-09-08", amountCents: 115682 }),
        payout({ id: "f", status: "FAILED", issuedDay: "2026-09-01", amountCents: 100 }),
      ],
      [],
      "2026-09-08"
    );
    expect(r.scheduled.map((p) => p.id)).toEqual(["s"]);
    expect(r.inTransit.map((p) => p.id)).toEqual(["t"]);
    expect(r.paidNotInBank).toEqual([]);
    expect(r.byCurrency.USD).toEqual({ scheduled: 78746, inTransit: 115682, paidNotInBank: 0, paidPending: 0 });
  });

  it("un versement encore « programmé » chez Shopify mais DÉJÀ en banque compte comme reçu", () => {
    // 08/09 : 3 267,04 € « programmé » côté Shopify, arrivé sur Wise le jour
    // même. Le crédit fait foi.
    const r = reconcilePayouts(
      [payout({ status: "SCHEDULED", issuedDay: "2026-09-08", amountCents: 326704, currency: "EUR" })],
      [credit({ day: "2026-09-08", amountCents: 326704, currency: "EUR", bank: "WISE" })],
      "2026-09-08"
    );
    expect(r.matched).toHaveLength(1);
    expect(r.scheduled).toEqual([]);
    expect(r.lastReceived?.credit.currency).toBe("EUR");
  });

  it("un crédit un peu plus petit (frais de réception) est rapproché, et les frais sont comptés", () => {
    // 01/09 : 40,38 £ annoncés par Shopify, 38,22 £ reçus sur Wise.
    const r = reconcilePayouts(
      [payout({ issuedDay: "2026-09-01", amountCents: 4038, currency: "GBP" })],
      [credit({ day: "2026-09-01", amountCents: 3822, currency: "GBP", bank: "WISE" })],
      "2026-09-08"
    );
    expect(r.matched).toHaveLength(1);
    expect(r.matched[0].feeCents).toBe(216);
    expect(r.paidNotInBank).toEqual([]);
  });

  it("jamais un crédit PLUS GRAND, ni plus de 10 % plus petit", () => {
    const plusGrand = reconcilePayouts([payout({ amountCents: 1000 })], [credit({ amountCents: 1001 })], "2026-09-08");
    expect(plusGrand.matched).toEqual([]);
    const tropPetit = reconcilePayouts([payout({ amountCents: 1000 })], [credit({ amountCents: 899 })], "2026-09-08");
    expect(tropPetit.matched).toEqual([]);
  });

  it("un crédit Shopify en banque sans versement connu est signalé, jamais avalé", () => {
    const r = reconcilePayouts([], [credit({ amountCents: 5392, currency: "EUR", bank: "WISE" })], "2026-09-08");
    expect(r.creditsUnmatched).toHaveLength(1);
    expect(r.lastReceived).toBeNull();
  });

  it("le dernier versement REÇU est celui dont le crédit banque est le plus récent", () => {
    const r = reconcilePayouts(
      [payout({ id: "old", issuedDay: "2026-09-01", amountCents: 100 }), payout({ id: "new", issuedDay: "2026-09-06" })],
      [credit({ txId: "x", day: "2026-09-02", amountCents: 100 }), credit({ txId: "y", day: "2026-09-08" })],
      "2026-09-08"
    );
    expect(r.lastReceived?.payout.id).toBe("new");
  });
});
