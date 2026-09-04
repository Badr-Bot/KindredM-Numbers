// ---------------------------------------------------------------------------
// 💱 TAUX USD → EUR — règle Badr du 04/09 :
//   « pour ce qui est PAYÉ ça doit avoir le vrai taux ; pour l'argent qui DORT
//   je m'en fous de la conversion, prends le dernier taux enregistré de la
//   journée. »
//
// Donc deux lectures d'une même série de taux quotidiens (Wise, historique
// /v1/rates group=day) :
//   • une transaction bancaire est convertie au taux DE SON JOUR (à défaut,
//     le dernier taux connu avant ce jour) ;
//   • un solde, l'argent en route, le cashback sont convertis au DERNIER taux
//     de la série.
// Sans série (jeton Wise absent, API en erreur) : le taux figé de
// subscriptions.ts (1 € = 1,1539 $, décision Badr 08/08) reste le repli — et
// il reste la règle pour les ESTIMATIONS (abonnements en USD étalés par jour,
// frais ponctuels saisis à la main) : ce ne sont pas des débits datés lus en
// banque, un taux flottant les ferait bouger après coup.
//
// Pur : aucune API ici. Le fetch Wise vit dans bank.ts.
// ---------------------------------------------------------------------------

import { USD_TO_EUR } from "./subscriptions";

export interface RatePoint {
  /** Jour Europe/Paris (YYYY-MM-DD). */
  day: string;
  /** EUR pour 1 USD. */
  rate: number;
}

export interface DailyRates {
  /** Jour → taux (EUR pour 1 USD). */
  byDay: Map<string, number>;
  /** Dernier point de la série — « le dernier taux enregistré de la journée ». */
  latest: RatePoint | null;
  /** Jours triés, pour retrouver « le dernier taux connu avant ce jour ». */
  days: string[];
}

/** Construit la série à partir de points (un par jour ; en cas de doublon
 * le DERNIER point du jour gagne — c'est la lecture voulue par Badr). */
export function buildDailyRates(points: RatePoint[]): DailyRates {
  const byDay = new Map<string, number>();
  for (const p of points) {
    if (!p.day || !Number.isFinite(p.rate) || p.rate <= 0) continue;
    byDay.set(p.day, p.rate);
  }
  const days = [...byDay.keys()].sort();
  const lastDay = days[days.length - 1];
  return { byDay, latest: lastDay ? { day: lastDay, rate: byDay.get(lastDay)! } : null, days };
}

/** Taux d'UN JOUR (ce qui est payé) : le taux du jour, sinon le dernier taux
 * connu AVANT ce jour, sinon le taux figé. Jamais un taux postérieur : une
 * dépense du 12/08 ne se convertit pas au taux du 04/09. */
export function usdToEurForDay(rates: DailyRates | null | undefined, day: string): number {
  if (!rates || rates.days.length === 0) return USD_TO_EUR;
  const exact = rates.byDay.get(day);
  if (exact !== undefined) return exact;
  let best: string | null = null;
  for (const d of rates.days) {
    if (d <= day) best = d;
    else break;
  }
  return best ? rates.byDay.get(best)! : USD_TO_EUR;
}

/** Dernier taux de la série (l'argent qui dort), sinon le taux figé. */
export function usdToEurLatest(rates: DailyRates | null | undefined): number {
  return rates?.latest?.rate ?? USD_TO_EUR;
}

/** true quand la conversion utilise un vrai taux Wise et non le repli figé. */
export function hasLiveRates(rates: DailyRates | null | undefined): boolean {
  return !!rates && rates.days.length > 0;
}
