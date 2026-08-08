import type { Market } from "./engine";
import { badrFixedCostsCentsForDay, fixedCostsCentsForDay } from "./subscriptions";

// ---------------------------------------------------------------------------
// Répartition du résultat entre associés (Badr, 06/08).
//
// Adnane a démarré seul. Badr est entré à 50/50 PAR BOUTIQUE, à des dates
// différentes : ES/UK/DE le 20/06, FR le 14/07. Avant sa date d'entrée sur une
// boutique, 100 % du résultat de cette boutique revient à Adnane.
//
// Ce qui est calculé ici est une PART DE RÉSULTAT (ce que chacun a gagné), pas
// un salaire réellement versé : un mois peut afficher une part positive sans
// qu'un euro soit sorti de la société. Choix explicite de Badr le 06/08.
//
// Le Canada (NIRA Burn) n'a pas de date d'entrée renseignée — traité comme les
// autres boutiques associées faute d'instruction contraire, et signalé comme
// tel plutôt que réparti au hasard.
// ---------------------------------------------------------------------------

export type AssociateKey = "BADR" | "ADNANE";

export interface Associate {
  key: AssociateKey;
  label: string;
  emoji: string;
}

export const ASSOCIATES: Associate[] = [
  { key: "BADR", label: "Badr", emoji: "🟠" },
  { key: "ADNANE", label: "Adnane", emoji: "🔵" },
];

/** Jour (inclus) à partir duquel Badr touche 50 % de la boutique. */
const BADR_ENTRY_BY_MARKET: Record<Market, string | null> = {
  ES: "2026-06-20",
  UK: "2026-06-20",
  DE: "2026-06-20",
  FR: "2026-07-14",
  // Non renseigné : NIRA Burn est postérieur à l'association, on applique le
  // même 50/50 dès son lancement. À corriger si Badr donne une autre règle.
  CA: "2026-06-20",
};

/** Part de Badr (0 ou 0,5) sur une boutique un jour donné. */
export function badrShareFor(market: Market, day: string): number {
  const entry = BADR_ENTRY_BY_MARKET[market];
  if (!entry) return 0;
  return day >= entry ? 0.5 : 0;
}

export interface MonthlyShare {
  /** "2026-06" */
  yearMonth: string;
  netCents: number;
  badrCents: number;
  adnaneCents: number;
}

export interface DailyNetByMarket {
  day: string;
  market: Market;
  netCents: number;
}

/**
 * Répartit le net JOUR PAR JOUR et PAR BOUTIQUE avant de cumuler par mois —
 * jamais l'inverse. Sur juin et juillet, la date d'entrée de Badr tombe au
 * milieu du mois : répartir un total mensuel déjà agrégé donnerait un chiffre
 * faux pour les deux associés.
 *
 * Les mois à perte sont répartis avec la même règle (une perte se partage
 * comme un gain), et les mois sans activité ressortent à 0.
 */
export function monthlySharesFrom(rows: DailyNetByMarket[]): MonthlyShare[] {
  const byMonth = new Map<string, MonthlyShare>();
  for (const r of rows) {
    const ym = r.day.slice(0, 7);
    const cur =
      byMonth.get(ym) ?? { yearMonth: ym, netCents: 0, badrCents: 0, adnaneCents: 0 };
    const badrPart = Math.round(r.netCents * badrShareFor(r.market, r.day));
    cur.netCents += r.netCents;
    cur.badrCents += badrPart;
    // Adnane prend le solde exact : garantit badr + adnane = net au centime,
    // sans jamais laisser traîner un centime d'arrondi.
    cur.adnaneCents += r.netCents - badrPart;
    byMonth.set(ym, cur);
  }
  return [...byMonth.values()].sort((a, b) => a.yearMonth.localeCompare(b.yearMonth));
}

/**
 * Déduit les CHARGES FIXES (abonnements/équipe, 08/08) des parts mensuelles,
 * jour par jour : 100 % Adnane avant le 14/07, 50/50 ensuite (règle Badr
 * « comme d'hab », distincte du partage par boutique — les charges sont
 * transverses). `days` = tous les jours calendaires de la période, y compris
 * ceux sans vente : un abonnement se paie aussi les jours à 0 commande.
 */
export function applyFixedCharges(shares: MonthlyShare[], days: string[]): MonthlyShare[] {
  const byYm = new Map(shares.map((s) => [s.yearMonth, { ...s }]));
  for (const day of days) {
    const fixed = fixedCostsCentsForDay(day);
    if (fixed === 0) continue;
    const ym = day.slice(0, 7);
    const cur = byYm.get(ym) ?? { yearMonth: ym, netCents: 0, badrCents: 0, adnaneCents: 0 };
    // Part de Badr : règle par date pour les abonnements, règle PROPRE pour
    // les frais ponctuels (ex. LLC 50/50 le 21/06 malgré l'avant-14/07).
    const badrPart = badrFixedCostsCentsForDay(day);
    cur.netCents -= fixed;
    cur.badrCents -= badrPart;
    cur.adnaneCents -= fixed - badrPart; // solde exact : somme au centime
    byYm.set(ym, cur);
  }
  return [...byYm.values()].sort((a, b) => a.yearMonth.localeCompare(b.yearMonth));
}

/**
 * Mois d'une année civile à afficher, bornés à la période qui a un sens :
 * jamais avant le lancement de l'activité, jamais après le mois en cours.
 * Afficher les 12 mois remplissait la grille de cartes vides — dont des mois
 * FUTURS à 0 €, ce qui n'a aucun sens (remarque Badr 06/08).
 *
 * Un mois dans la fenêtre mais sans vente reste affiché à 0 : c'est une
 * information (« ce mois-là on n'a rien fait »), contrairement à un mois
 * qui n'existe pas encore.
 */
export function fillYearMonths(
  year: string,
  shares: MonthlyShare[],
  bounds?: { minYm?: string; maxYm?: string }
): MonthlyShare[] {
  const byYm = new Map(shares.map((s) => [s.yearMonth, s]));
  const out: MonthlyShare[] = [];
  for (let m = 1; m <= 12; m++) {
    const ym = `${year}-${String(m).padStart(2, "0")}`;
    if (bounds?.minYm && ym < bounds.minYm) continue;
    if (bounds?.maxYm && ym > bounds.maxYm) continue;
    out.push(byYm.get(ym) ?? { yearMonth: ym, netCents: 0, badrCents: 0, adnaneCents: 0 });
  }
  return out;
}
