// ---------------------------------------------------------------------------
// CHARGES FIXES MENSUELLES (abonnements + équipe) — source : PDF d'Adnane
// transmis par Badr le 08/08 (« Les abonnements.pdf »).
//
// Règles décidées par Badr (08/08) :
//   • Déduites du NET global, réparties PAR JOUR (mensuel ÷ 30,44).
//   • Partage associés : 100 % Adnane avant le 14/07, 50/50 à partir du
//     14/07 INCLUS — règle « comme d'hab », appliquée jour par jour.
//   • Affichées dans l'onglet Année : liste, coût par mois, par jour, par an.
//
// Conventions :
//   • USD converti au taux fourni par Badr (1 € = 1,1539 $), FIGÉ ici — pas
//     de taux flottant, pas de surprise. Montant € = source de vérité.
//   • startDay = date de début de facturation. Faute de dates précises dans
//     le PDF, DÉFAUT = début de l'activité (04/06) — approximation SIGNALÉE
//     à Badr le 08/08, à affiner s'il donne les vraies dates.
//   • endDay = null tant que l'abonnement court. Résilier un abonnement =
//     poser endDay, JAMAIS supprimer la ligne (l'historique doit continuer
//     de porter ce qui a été réellement payé).
//
// Réponses de Badr (08/08 au soir) :
//   • Jeremy / Seif : « oublie la commission pour le moment » → fixe seul,
//     décision actée (plus une question ouverte).
//   • Google Ads : « non, pas pour le moment » → rien à brancher.
//   • « Prorata » = Jeremy, Seif (et Google) ont COMMENCÉ RÉCEMMENT → leurs
//     vraies dates de début sont à poser dès que Badr les donne (en attendant
//     ils comptent depuis START_DEFAULT, ce qui SURESTIME les charges).
//   • « Tu la mets à 25 € » : compris comme KLAVIYO (emailing) à 25 €/mois —
//     par élimination, puisque Badr a précisé ensuite que SON Claude est à
//     100 €. Interprétation SIGNALÉE à Badr, à corriger s'il voulait autre
//     chose.
//   • Claude Badr : 100 €/mois, payé PERSONNELLEMENT par Badr → compté dans
//     les charges ET tracé dans « Entre associés » (associateLedger.ts).
// Encore en attente de Badr (jamais inventé) :
//   • Claude Badr (20 €) : « à mettre sur CB » d'après Adnane → pas encore
//     facturé, pas encore compté.
//   • CWILL : les « frais d'utilisation » variables ne sont pas comptés
//     (montant inconnu), seul l'abonnement l'est.
// ---------------------------------------------------------------------------

import { oneOffCostsCentsForDay } from "./associateLedger";

export const USD_TO_EUR = 1 / 1.1539;

/** Jours moyens par mois (365,25 ÷ 12) — pour l'étalement quotidien. */
export const DAYS_PER_MONTH = 30.44;

export type SubscriptionCategory = "OUTIL" | "APP_SHOPIFY" | "EQUIPE" | "CREDIT";

export interface Subscription {
  label: string;
  category: SubscriptionCategory;
  /** Montant mensuel dans la devise d'origine. Négatif = crédit. */
  amount: number;
  currency: "EUR" | "USD";
  /** Premier jour facturé (YYYY-MM-DD, Paris). */
  startDay: string;
  /** Dernier jour facturé, null = en cours. */
  endDay: string | null;
  /**
   * Qui paie de sa poche — seulement quand c'est SÛR. Sert au tracé « Entre
   * associés » : ce que l'un avance pour la société lui est dû au règlement.
   */
  paidBy?: "BADR" | "ADNANE";
  note?: string;
}

const START_DEFAULT = "2026-06-04"; // début d'activité — approximation signalée

export const SUBSCRIPTIONS: Subscription[] = [
  // Équipe (prestataires mensuels)
  { label: "Jeremy (fixe, hors %)", category: "EQUIPE", amount: 1500, currency: "USD", startDay: START_DEFAULT, endDay: null, note: "% de commission oublié pour le moment (Badr 08/08). Commencé « récemment » — vraie date de début en attente, compté depuis le 04/06 en attendant (surestime)." },
  { label: "Seif (fixe, hors %)", category: "EQUIPE", amount: 1500, currency: "USD", startDay: START_DEFAULT, endDay: null, note: "Idem Jeremy : % oublié pour le moment, vraie date de début en attente." },
  { label: "Monteur", category: "EQUIPE", amount: 650, currency: "USD", startDay: START_DEFAULT, endDay: null },
  { label: "Marwa", category: "EQUIPE", amount: 300, currency: "EUR", startDay: START_DEFAULT, endDay: null },
  // Apps Shopify (boutique FR)
  { label: "SmartSize", category: "APP_SHOPIFY", amount: 287.49, currency: "EUR", startDay: START_DEFAULT, endDay: null, note: "⚠️ Adnane : « URGENT à enlever » — compté tant qu'il n'est pas résilié (287 €/mois d'économie à la clé). Montant réel payé via Slash (249 $ affichés + taxes)." },
  { label: "CWILL (Parcel Panel)", category: "APP_SHOPIFY", amount: 59, currency: "USD", startDay: START_DEFAULT, endDay: null, note: "Hors frais d'utilisation variables (montant inconnu)" },
  { label: "Moon Bundles", category: "APP_SHOPIFY", amount: 59.99, currency: "USD", startDay: START_DEFAULT, endDay: null },
  // Outils
  { label: "WeTracked", category: "OUTIL", amount: 160, currency: "USD", startDay: START_DEFAULT, endDay: null },
  { label: "Klaviyo (emailing)", category: "OUTIL", amount: 25, currency: "EUR", startDay: START_DEFAULT, endDay: null, note: "25 €/mois fixé par Badr le 08/08 (« tu la mets à 25 € » — compris comme le prorata emailing, au lieu du plein tarif 150 $). À corriger si ce n'était pas ça." },
  { label: "Higgsfield ×2 (Adnane + Ismael)", category: "OUTIL", amount: 110, currency: "EUR", startDay: START_DEFAULT, endDay: null },
  { label: "Eleven Labs ×2 (Adnane + monteur)", category: "OUTIL", amount: 44, currency: "EUR", startDay: START_DEFAULT, endDay: null },
  { label: "Claude (Adnane)", category: "OUTIL", amount: 20, currency: "EUR", startDay: START_DEFAULT, endDay: null },
  { label: "Claude (Badr)", category: "OUTIL", amount: 100, currency: "EUR", startDay: START_DEFAULT, endDay: null, paidBy: "BADR", note: "100 €/mois payé personnellement par Badr (08/08) — tracé dans « Entre associés ». Date de début inconnue → 04/06 par défaut, à confirmer." },
  { label: "TrendTrack", category: "OUTIL", amount: 25, currency: "EUR", startDay: START_DEFAULT, endDay: null, note: "Oublié du PDF d'Adnane — ajouté par Badr le 08/08" },
  { label: "Vmake", category: "OUTIL", amount: 8.8, currency: "EUR", startDay: START_DEFAULT, endDay: null },
  { label: "Google Workspace", category: "OUTIL", amount: 8.1, currency: "EUR", startDay: START_DEFAULT, endDay: null },
  // Crédit
  { label: "Crédit d'abonnement (apps)", category: "CREDIT", amount: -88, currency: "EUR", startDay: START_DEFAULT, endDay: null, note: "« 88 € en crédit donc on ne les paie pas normalement » (Adnane)" },
];

export function monthlyEurCents(s: Subscription): number {
  const eur = s.currency === "USD" ? s.amount * USD_TO_EUR : s.amount;
  return Math.round(eur * 100);
}

/** Coût quotidien d'un abonnement, en centimes d'euro. */
export function dailyEurCents(s: Subscription): number {
  return Math.round(monthlyEurCents(s) / DAYS_PER_MONTH);
}

function isActiveOn(s: Subscription, day: string): boolean {
  if (day < s.startDay) return false;
  if (s.endDay && day > s.endDay) return false;
  return true;
}

/**
 * Charges fixes totales d'un jour donné (centimes d'euro) : abonnements
 * étalés + frais PONCTUELS tombés ce jour-là (ex. création LLC le 21/06) —
 * ces derniers pèsent sur leur vrai jour, pas étalés, parce que c'est là que
 * l'argent est réellement sorti.
 */
export function fixedCostsCentsForDay(day: string): number {
  let total = oneOffCostsCentsForDay(day);
  for (const s of SUBSCRIPTIONS) if (isActiveOn(s, day)) total += dailyEurCents(s);
  return total;
}

/**
 * Cumul de ce que `payer` a sorti de SA poche en abonnements récurrents entre
 * deux jours inclus (ex. le Claude 100 €/mois de Badr) — pour le tracé
 * « Entre associés ». Jour par jour, même arrondi que la déduction du net.
 */
export function recurringOutlayCents(payer: "BADR" | "ADNANE", fromDay: string, toDay: string): number {
  const subs = SUBSCRIPTIONS.filter((s) => s.paidBy === payer);
  if (subs.length === 0) return 0;
  let total = 0;
  const d = new Date(`${fromDay}T12:00:00Z`);
  for (let day = fromDay; day <= toDay; ) {
    for (const s of subs) if (isActiveOn(s, day)) total += dailyEurCents(s);
    d.setUTCDate(d.getUTCDate() + 1);
    day = d.toISOString().slice(0, 10);
  }
  return total;
}

/** Totaux courants (abonnements actifs aujourd'hui) pour l'affichage Année. */
export function subscriptionTotals(day: string): {
  monthlyCents: number;
  dailyCents: number;
  yearlyCents: number;
} {
  let monthly = 0;
  for (const s of SUBSCRIPTIONS) if (isActiveOn(s, day)) monthly += monthlyEurCents(s);
  return {
    monthlyCents: monthly,
    dailyCents: Math.round(monthly / DAYS_PER_MONTH),
    yearlyCents: monthly * 12,
  };
}

/**
 * Part de Badr sur les charges fixes d'un jour : 0 avant le 14/07, 50 %
 * ensuite (14/07 INCLUS) — règle « comme d'hab » de Badr (08/08). Adnane
 * porte toujours le solde exact.
 */
export const CHARGES_SPLIT_START = "2026-07-14";
export function badrFixedShareFor(day: string): number {
  return day >= CHARGES_SPLIT_START ? 0.5 : 0;
}
