// ---------------------------------------------------------------------------
// 📦 VERSEMENTS SHOPIFY ↔ BANQUE — demande Badr (08/09) : « je t'ai donné le
// read payout, donc tu dois savoir quel est le dernier encaissement reçu de
// Shopify, les versements programmés ou déjà réalisés et pas atterris sur le
// compte, et la diff entre banque et prévu Shopify doit correspondre à ce qui
// reste à verser ».
//
// Trois états côté Shopify, trois réponses côté banque :
//   • SCHEDULED  → programmé, l'argent est encore chez Shopify ;
//   • IN_TRANSIT → parti, pas encore arrivé (2-4 jours) ;
//   • PAID       → Shopify dit « versé » : il DOIT exister un crédit en banque.
//     S'il n'y en a pas passé le délai, ce n'est plus un retard, c'est un
//     versement parti ailleurs — exactement le genre de trou que cet onglet
//     existe pour attraper.
//
// Pur : aucune API ici. Le fetch Shopify et la lecture bancaire vivent dans
// bank.ts ; ce fichier ne fait que rapprocher, et il est testé.
// ---------------------------------------------------------------------------

export type PayoutStatus = "SCHEDULED" | "IN_TRANSIT" | "PAID" | "FAILED" | "CANCELED";

export interface ShopifyPayout {
  id: string;
  /** Boutique (FR, ES…). */
  market: string;
  /** Jour d'émission Europe/Paris (YYYY-MM-DD). */
  issuedDay: string;
  status: PayoutStatus;
  /** Montant NET versé, dans la devise du versement. */
  amountCents: number;
  currency: string;
}

export interface BankCredit {
  txId: string;
  day: string;
  bank: string;
  currency: string;
  amountCents: number;
  amountEurCents: number | null;
  description: string;
}

export interface PayoutMatch {
  payout: ShopifyPayout;
  credit: BankCredit;
  /** Frais retenus entre Shopify et la banque (crédit < net Shopify, même
   * devise). 0 quand ça tombe au centime. Vu le 01/09 : 40,38 £ annoncés,
   * 38,22 £ reçus sur Wise (2,16 £ de frais de réception en livres). */
  feeCents: number;
}

/** Tolérance pour un crédit AMPUTÉ de frais de réception : jusqu'à 10 % de
 * moins que le net Shopify, jamais plus, jamais davantage que le net. */
const FEE_TOLERANCE = 0.1;

export interface PayoutReconciliation {
  /** Dernier versement Shopify réellement ARRIVÉ en banque. */
  lastReceived: PayoutMatch | null;
  /** Versements « PAID » côté Shopify sans aucun crédit en banque. */
  paidNotInBank: ShopifyPayout[];
  /** Versements PAID dont la banque n'a pas encore la trace mais dans le délai. */
  paidPending: ShopifyPayout[];
  inTransit: ShopifyPayout[];
  scheduled: ShopifyPayout[];
  /** Rapprochés : un versement Shopify = un crédit banque. */
  matched: PayoutMatch[];
  /** Crédits « Shopify » en banque qu'aucun versement n'explique. */
  creditsUnmatched: BankCredit[];
  /** Totaux par devise, en centimes de la devise. */
  byCurrency: Record<string, { scheduled: number; inTransit: number; paidNotInBank: number; paidPending: number }>;
}

/** Au-delà de ce délai après émission, un versement PAID sans crédit en banque
 * n'est plus « en retard » : il est ARRIVÉ AILLEURS. Shopify annonce 2-4 j. */
export const PAYOUT_ARRIVAL_DAYS = 6;
/** Un crédit peut apparaître la veille du jour d'émission affiché (fuseau). */
const EARLIEST_OFFSET_DAYS = 1;

function addDays(day: string, n: number): string {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86400000);
}

/**
 * Rapproche chaque versement avec AU PLUS un crédit banque : même devise,
 * même montant au centime, crédit entre J-1 et J+PAYOUT_ARRIVAL_DAYS. En cas
 * de plusieurs candidats (deux versements identiques), le crédit le plus
 * proche dans le temps gagne, et chaque crédit ne sert qu'une fois.
 */
export function reconcilePayouts(
  payouts: ShopifyPayout[],
  credits: BankCredit[],
  today: string
): PayoutReconciliation {
  const used = new Set<string>();
  const matched: PayoutMatch[] = [];
  const paidNotInBank: ShopifyPayout[] = [];
  const paidPending: ShopifyPayout[] = [];
  const inTransit: ShopifyPayout[] = [];
  const scheduled: ShopifyPayout[] = [];

  // Les plus anciens d'abord : un crédit ancien ne doit pas être « volé » par
  // un versement récent de même montant.
  const ordered = [...payouts].sort((a, b) => a.issuedDay.localeCompare(b.issuedDay) || a.id.localeCompare(b.id));

  for (const p of ordered) {
    if (p.status === "FAILED" || p.status === "CANCELED") continue; // rien à attendre en banque
    if (p.status === "IN_TRANSIT") {
      inTransit.push(p);
      continue;
    }
    // Un versement encore « programmé » côté Shopify peut DÉJÀ être en banque
    // (statut mis à jour avec retard : le 08/09, 3 267,04 € « programmé » était
    // arrivé sur Wise le jour même). Le crédit fait foi : s'il existe, le
    // versement est reçu, quel que soit ce que dit Shopify.
    const from = addDays(p.issuedDay, -EARLIEST_OFFSET_DAYS);
    const to = addDays(p.issuedDay, PAYOUT_ARRIVAL_DAYS);
    const inWindow = (c: BankCredit) => !used.has(c.txId) && c.currency === p.currency && c.day >= from && c.day <= to;
    const byProximity = (a: BankCredit, b: BankCredit) =>
      Math.abs(daysBetween(p.issuedDay, a.day)) - Math.abs(daysBetween(p.issuedDay, b.day));
    // D'abord au centime ; à défaut, un crédit un peu plus petit (frais de
    // réception retenus par la banque) — jamais un crédit plus grand.
    const exact = credits.filter((c) => inWindow(c) && c.amountCents === p.amountCents).sort(byProximity)[0];
    const reduced = exact
      ? undefined
      : credits
          .filter((c) => inWindow(c) && c.amountCents < p.amountCents && c.amountCents >= p.amountCents * (1 - FEE_TOLERANCE))
          .sort(byProximity)[0];
    const credit = exact ?? reduced;
    if (credit) {
      used.add(credit.txId);
      matched.push({ payout: p, credit, feeCents: p.amountCents - credit.amountCents });
    } else if (p.status === "SCHEDULED") {
      scheduled.push(p);
    } else if (daysBetween(p.issuedDay, today) > PAYOUT_ARRIVAL_DAYS) {
      paidNotInBank.push(p);
    } else {
      paidPending.push(p);
    }
  }

  const creditsUnmatched = credits.filter((c) => !used.has(c.txId));
  const lastReceived =
    matched.length === 0
      ? null
      : [...matched].sort((a, b) => b.credit.day.localeCompare(a.credit.day) || b.payout.issuedDay.localeCompare(a.payout.issuedDay))[0];

  const byCurrency: PayoutReconciliation["byCurrency"] = {};
  const add = (cur: string, key: keyof PayoutReconciliation["byCurrency"][string], cents: number) => {
    const b = (byCurrency[cur] ??= { scheduled: 0, inTransit: 0, paidNotInBank: 0, paidPending: 0 });
    b[key] += cents;
  };
  for (const p of scheduled) add(p.currency, "scheduled", p.amountCents);
  for (const p of inTransit) add(p.currency, "inTransit", p.amountCents);
  for (const p of paidNotInBank) add(p.currency, "paidNotInBank", p.amountCents);
  for (const p of paidPending) add(p.currency, "paidPending", p.amountCents);

  return { lastReceived, paidNotInBank, paidPending, inTransit, scheduled, matched, creditsUnmatched, byCurrency };
}
