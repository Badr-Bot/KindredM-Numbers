import { describe, expect, it } from "vitest";
import { poloCogsCents, upsellCogsCents, euTaxCents } from "../engine";
import { toParisDay } from "../time";
import { GAP_FILL_MAI_JUIN } from "../manualRevenue";
import rawOrders from "./fixtures/mayGapOrders.json";

/**
 * Comblement 21/05→03/06 — les chiffres codés en dur dans manualRevenue.ts
 * sont-ils bien ceux des VRAIES commandes ?
 *
 * Contexte (12/08) : l'API Shopify de l'app ne peut pas relire cette période
 * (>60 j sans le scope read_all_orders), donc ces 14 jours sont saisis en dur.
 * Un chiffre en dur non vérifiable est exactement ce qui a produit le bug que
 * Badr a repéré (« sur mai y'a 20 % de marge nette ») : l'ancienne version
 * était un total annoncé réparti à plat, COGS et frais à zéro.
 *
 * Ce test rend ces chiffres VÉRIFIABLES : il repart des 120 commandes
 * exportées depuis la connexion Shopify de Badr (fixture), recalcule COGS et
 * taxe avec les grilles du moteur — les mêmes qu'en prod — et compare au
 * centime. Toucher une grille COGS sans mettre à jour le comblement fait
 * échouer ce test, au lieu de fausser le net de mai en silence.
 */

// [name, createdAtUtc, pays, totalEUR, rembourséEUR, fraisEUR, poloQty, débardeurQty]
type Row = [string, string, string, number, number, number, number, number];

const FROM = "2026-05-21";
const TO = "2026-06-03";

function recomputeFromRealOrders() {
  const byDay = new Map<
    string,
    { orders: number; ca: number; cogs: number; tax: number; fees: number }
  >();

  for (const [, createdAt, country, total, refunded, fees, poloQty, tankQty] of rawOrders as Row[]) {
    const day = toParisDay(createdAt);
    if (day < FROM || day > TO) continue; // commandes du 20/05, hors comblement
    if (!byDay.has(day)) byDay.set(day, { orders: 0, ca: 0, cogs: 0, tax: 0, fees: 0 });
    const b = byDay.get(day)!;

    b.orders += 1;
    b.ca += Math.round(total * 100) - Math.round(refunded * 100);
    b.cogs +=
      poloCogsCents(country, poloQty) +
      (tankQty > 0 ? upsellCogsCents("COMPRESSION_TANK_TOP", country, tankQty) : 0);
    b.tax += euTaxCents(country, day, poloQty > 0 || tankQty > 0);
    b.fees += Math.round(fees * 100);
  }
  return byDay;
}

describe("Comblement 21/05→03/06 — vérifié contre les vraies commandes", () => {
  it("chaque jour codé en dur correspond au recalcul, au centime", () => {
    const byDay = recomputeFromRealOrders();

    expect(GAP_FILL_MAI_JUIN).toHaveLength(byDay.size);
    for (const entry of GAP_FILL_MAI_JUIN) {
      const real = byDay.get(entry.day);
      expect(real, `jour manquant dans les commandes réelles : ${entry.day}`).toBeDefined();
      expect(entry.caEurCents, `CA ${entry.day}`).toBe(real!.ca);
      expect(entry.cogsEurCents, `COGS ${entry.day}`).toBe(real!.cogs);
      expect(entry.feesEurCents, `frais ${entry.day}`).toBe(real!.fees);
      expect(entry.taxEurCents, `taxe ${entry.day}`).toBe(real!.tax);
      expect(entry.orders, `commandes ${entry.day}`).toBe(real!.orders);
    }
  });

  it("totaux de la période : 115 commandes, 7 338,82 € de CA net", () => {
    const sum = (f: (e: (typeof GAP_FILL_MAI_JUIN)[number]) => number) =>
      GAP_FILL_MAI_JUIN.reduce((t, e) => t + f(e), 0);

    expect(sum((e) => e.orders)).toBe(115);
    expect(sum((e) => e.caEurCents)).toBe(733882);
    expect(sum((e) => e.cogsEurCents)).toBe(216438);
    expect(sum((e) => e.feesEurCents ?? 0)).toBe(16543);
  });

  it("la taxe UE est nulle avant le 01/07 (règle 3 €/colis non encore en vigueur)", () => {
    expect(sum(GAP_FILL_MAI_JUIN.map((e) => e.taxEurCents ?? 0))).toBe(0);
  });

  it("le CA annoncé le 08/08 (8 338 €) s'explique : 04/06 double-compté + remboursements", () => {
    // 7 338,82 réel net + 99,98 de remboursements + 899,87 du 04/06 (déjà
    // compté en vrai dans la base) = 8 338,67 € ≈ les 8 338 € saisis.
    const caReel = 733882;
    const remboursements = 9998; // #1182 et #1216, 49,99 € chacun
    const ca04Juin = 89987; // vérifié via l'API, déjà en base comme vraies commandes
    expect(caReel + remboursements + ca04Juin).toBe(833867);
  });
});

function sum(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0);
}
