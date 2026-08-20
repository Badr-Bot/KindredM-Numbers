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
//     le PDF, DÉFAUT = début de l'activité (21/05 — Badr confirmé le 08/08 :
//     « les abonnements ont commencé depuis le début », sauf WeTracked).
//   • endDay = null tant que l'abonnement court. Résilier un abonnement =
//     poser endDay, JAMAIS supprimer la ligne (l'historique doit continuer
//     de porter ce qui a été réellement payé).
//
// Réponses de Badr (08/08 au soir) :
//   • Jeremy / Seif : « oublie la commission pour le moment » → fixe seul,
//     décision actée (plus une question ouverte).
//   • Google Ads : « non, pas pour le moment » → rien à brancher.
//   • « Prorata » = Jeremy, Seif (et Google) ont commencé récemment → dates
//     réelles données par Badr : Seif 15/07, Jeremy (emailing) 16/07.
//   • « Tu la mets à 25 € » : compris comme KLAVIYO (emailing) à 25 €/mois —
//     par élimination, puisque Badr a précisé ensuite que SON Claude est à
//     100 €. Interprétation SIGNALÉE à Badr, à corriger s'il voulait autre
//     chose.
//   • Claude Badr : UN abonnement de 100 €/mois (depuis le 15/07). Seule la
//     1re facture est perso — tracée dans « Entre associés » ; à partir de la
//     2e (08/08) la CARTE LLC paie (charge société directe, rien à tracer).
//   • « Les abonnements ont commencé depuis le début, sauf WeTracked.io » →
//     START_DEFAULT passe de 04/06 à 21/05 (aligné sur HISTORY_START/le
//     vrai début d'activité). WeTracked reste sur l'ancien 04/06 en
//     attendant sa vraie date — SIGNALÉ, pas une vraie date confirmée.
// Encore en attente de Badr (jamais inventé) :
//   • WeTracked : date de départ réelle (démarré APRÈS les autres, mais
//     04/06 reste une approximation, pas une date donnée).
//   • CWILL : les « frais d'utilisation » variables ne sont pas comptés
//     (montant inconnu), seul l'abonnement l'est.
// ---------------------------------------------------------------------------

import { badrFixedShareFor, oneOffBadrShareCentsForDay, oneOffCostsCentsForDay } from "./associateLedger";
export { badrFixedShareFor, CHARGES_SPLIT_START } from "./associateLedger";

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
  /** true = charge comptée mais PAS encore prélevée en banque (paiement
   * différé annoncé) : le contrôle bancaire ne la réclame pas. */
  noBankClaim?: boolean;
  note?: string;
}

const START_DEFAULT = "2026-05-21"; // début d'activité (Badr 08/08 : « depuis le début »)
// WeTracked a démarré APRÈS les autres (Badr 08/08) — vraie date inconnue,
// l'ancien défaut (04/06) reste comme approximation SIGNALÉE en attendant.
const WETRACKED_START = "2026-06-04";

export const SUBSCRIPTIONS: Subscription[] = [
  // Équipe (prestataires mensuels)
  // 13/08 (Badr) : c'est 1 500 EUROS, pas 1 500 $ — l'entrée du 08/08 était en
  // USD et affichait donc ~1 300 € après conversion, d'où l'écart repéré par
  // Badr. Arrêté FIN AOÛT : endDay 31/08 inclus, plus compté dès le 01/09
  // (la ligne reste : l'historique doit porter ce qui a été réellement payé).
  // 19/08 (Badr) : les 2 747 $ payés à « Emailing : Altura » (sa LLC) le
  // 13/08 = prorata de juillet + août complet, collaboration TERMINÉE fin
  // août — paiement conforme, pas une anomalie.
  { label: "Jeremy — emailing (fixe, hors %)", category: "EQUIPE", amount: 1500, currency: "EUR", startDay: "2026-07-16", endDay: "2026-08-31", note: "1 500 €/mois. Payé en une fois le 13/08 (2 747 $ = prorata juillet + août complet, Badr 19/08) — collaboration terminée fin août." },
  // 19/08 (Badr) : « Seif, je le trouve pas [en banque], Adnane l'a payé
  // avec son perso je pense » → paidBy posé (exclu du contrôle bancaire
  // LLC), À CONFIRMER — si c'est une avance société, elle devra entrer dans
  // le tracé « Entre associés ».
  { label: "Seif (fixe, hors %)", category: "EQUIPE", amount: 1500, currency: "USD", startDay: "2026-07-15", endDay: null, paidBy: "ADNANE", note: "Commencé le 15/07 (Badr 08/08). Payé perso par Adnane (Badr 19/08, à confirmer). % de commission oublié pour le moment." },
  { label: "Monteur", category: "EQUIPE", amount: 650, currency: "USD", startDay: START_DEFAULT, endDay: null },
  // 19/08 (Badr) : « Marwa sera payée plus tard » → la charge court, mais le
  // contrôle bancaire ne la réclame pas tant que le paiement n'est pas fait.
  { label: "Marwa", category: "EQUIPE", amount: 300, currency: "EUR", startDay: START_DEFAULT, endDay: null, noBankClaim: true, note: "Paiement différé (Badr 19/08 : « sera payée plus tard »)." },
  // Apps Shopify (boutique FR)
  { label: "SmartSize", category: "APP_SHOPIFY", amount: 287.49, currency: "EUR", startDay: START_DEFAULT, endDay: "2026-08-08", note: "Résilié par Badr le 08/08 — dernier jour compté 08/08, plus de charge à partir du 09/08 (287 €/mois d'économie). Montant réel payé via Slash (249 $ affichés + taxes)." },
  { label: "CWILL (Parcel Panel)", category: "APP_SHOPIFY", amount: 59, currency: "USD", startDay: START_DEFAULT, endDay: null, note: "Hors frais d'utilisation variables (montant inconnu)" },
  { label: "Moon Bundles", category: "APP_SHOPIFY", amount: 59.99, currency: "USD", startDay: START_DEFAULT, endDay: null },
  // Outils
  { label: "WeTracked", category: "OUTIL", amount: 160, currency: "USD", startDay: WETRACKED_START, endDay: null, note: "Démarré après les autres abonnements (Badr 08/08) — vraie date à préciser, 04/06 est une approximation." },
  { label: "Klaviyo (emailing)", category: "OUTIL", amount: 25, currency: "EUR", startDay: START_DEFAULT, endDay: null, note: "25 €/mois fixé par Badr le 08/08 (« tu la mets à 25 € » — compris comme le prorata emailing, au lieu du plein tarif 150 $). À corriger si ce n'était pas ça." },
  // Hushed : payé PERSONNELLEMENT par Adnane depuis ~2 mois (juillet + août),
  // puis par la CARTE LLC à partir du 3e mois (septembre) — même schéma que
  // le Claude de Badr. Les 2 premiers mois sont tracés en avance dans
  // « Entre associés » (associateLedger.ts), le reste est une charge société
  // directe. Mois de départ exact non donné → juillet assumé (cohérent avec
  // « depuis 2 mois » dit le 08/08 et « 3e mois = septembre »), signalé.
  // 19/08 (Badr) : « Hushed ça continue, c'est Adnane qui le paye toujours
  // depuis son compte perso » — ANNULE le passage carte LLC prévu en
  // septembre (08/08). paidBy posé → exclu du contrôle bancaire LLC.
  { label: "Hushed (Adnane)", category: "OUTIL", amount: 7.99, currency: "EUR", startDay: "2026-07-01", endDay: null, paidBy: "ADNANE", note: "Payé perso par Adnane en continu (Badr 19/08 — annule le passage carte LLC de septembre). Mois de départ approximatif." },
  { label: "Higgsfield ×2 (Adnane + Ismael)", category: "OUTIL", amount: 110, currency: "EUR", startDay: START_DEFAULT, endDay: null },
  { label: "Eleven Labs ×2 (Adnane + monteur)", category: "OUTIL", amount: 44, currency: "EUR", startDay: START_DEFAULT, endDay: null },
  { label: "Claude (Adnane)", category: "OUTIL", amount: 20, currency: "EUR", startDay: START_DEFAULT, endDay: null },
  // Claude Badr : UN SEUL abonnement à 100 €/mois depuis le 15/07. « Le 1er /
  // le 2e » dans les messages de Badr = les FACTURES mensuelles successives,
  // pas deux abonnements — compté deux fois par erreur le 08/08, corrigé sur
  // sa remarque le jour même. 1re facture (15/07) payée perso (tracée en
  // avance dans associateLedger), les suivantes sur la CARTE LLC. Démarré
  // après le 14/07 → partagé 50/50 naturellement par la règle par date.
  { label: "Claude (Badr)", category: "OUTIL", amount: 100, currency: "EUR", startDay: "2026-07-15", endDay: null, note: "1re facture (15/07) payée perso par Badr — tracée dans « Entre associés ». Factures suivantes (dès la 2e, 08/08) sur la carte LLC." },
  { label: "TrendTrack", category: "OUTIL", amount: 25, currency: "EUR", startDay: START_DEFAULT, endDay: null, note: "Oublié du PDF d'Adnane — ajouté par Badr le 08/08" },
  // Floxy (proxy résidentiel) : payé DIRECTEMENT par la carte LLC dès le
  // départ (pas d'avance perso à tracer, contrairement à Hushed/Claude).
  // 19/08 (Badr) : « Floxy c'est le nouveau prix, c'est 8 € » — était 7 $.
  { label: "Floxy (proxy)", category: "OUTIL", amount: 8, currency: "EUR", startDay: "2026-08-01", endDay: null, note: "8 €/mois — nouveau prix (Badr 19/08, était 7 $). Payé par la carte LLC dès le départ." },
  { label: "VMake", category: "OUTIL", amount: 9.99, currency: "EUR", startDay: "2026-08-14", endDay: null, note: "Pris le 14/08 (Badr : « on le prend à partir d'aujourd'hui »)." },
  { label: "Master Ecom (Skool)", category: "OUTIL", amount: 249, currency: "USD", startDay: "2026-07-26", endDay: null, note: "Communauté/formation rejointe le 26/07 (Badr 08/08)." },
  { label: "Vmake", category: "OUTIL", amount: 8.8, currency: "EUR", startDay: START_DEFAULT, endDay: null },
  { label: "Google Workspace", category: "OUTIL", amount: 8.1, currency: "EUR", startDay: START_DEFAULT, endDay: null },
  // Crédit d'abonnement (−88 €, Adnane) : RETIRÉ le 08/08. Badr a clarifié
  // qu'il ne finance QUE l'abonnement Shopify de base (le plan Shopify
  // lui-même) — un poste qu'on ne compte pas du tout ici — jamais les apps
  // listées ci-dessus. L'appliquer en remise sur les apps aurait sous-compté
  // les charges de ~88 €/mois pour de mauvaises raisons.
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
 * Part de BADR sur les charges fixes d'un jour : abonnements selon la règle
 * par date (badrFixedShareFor), frais ponctuels selon LEUR règle propre (ex.
 * LLC 50/50 le 21/06, décision Badr). Adnane = fixedCostsCentsForDay − ceci,
 * pour sommer au centime.
 */
export function badrFixedCostsCentsForDay(day: string): number {
  let subs = 0;
  for (const s of SUBSCRIPTIONS) if (isActiveOn(s, day)) subs += dailyEurCents(s);
  return Math.round(subs * badrFixedShareFor(day)) + oneOffBadrShareCentsForDay(day);
}

// NB : le tracé « ce que Badr a réellement sorti de sa poche » ne se déduit
// PAS de l'étalement quotidien (qui est une convention comptable) — il vit en
// FACTURES réelles dans associateLedger.ts (SUB_PAYMENTS). Un cumul accru
// depuis le 04/06 affichait 217 € alors que Badr n'avait payé que 100 € :
// corrigé le 08/08 sur sa remarque.

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

