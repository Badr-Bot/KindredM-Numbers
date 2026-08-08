// ---------------------------------------------------------------------------
// TRACÉ ENTRE ASSOCIÉS — demande de Badr (08/08) : « tout doit être tracé et
// clair comme ça tout est bon pour moi et Adnane ».
//
// Deux choses distinctes vivent ici, à ne jamais mélanger :
//
//   1. FRAIS PONCTUELS de la société (ex. création de la LLC) : de vraies
//      charges, déduites du net GLOBAL le jour où l'argent est sorti, et
//      partagées avec la même règle que les charges fixes (100 % Adnane avant
//      le 14/07, 50/50 ensuite). Quand celui qui a PAYÉ n'est pas celui qui
//      PORTE la charge, l'écart est un dû entre associés — c'est exactement ce
//      que la section « Entre associés » de l'onglet Année rend visible.
//
//   2. TRANSFERTS entre associés (ex. l'avance de 1 000 € de Badr à Adnane) :
//      ce n'est PAS une charge, ça ne touche jamais le net — c'est de l'argent
//      qui change de poche entre eux, à solder au moment du règlement.
//
// Montants : on fige les EUR réellement débités en banque (capture de Badr),
// jamais une conversion recalculée — le relevé bancaire est la vérité.
// ---------------------------------------------------------------------------

export type Payer = "BADR" | "ADNANE";

export interface OneOffCost {
  /** Jour Europe/Paris où l'argent est sorti (YYYY-MM-DD). */
  day: string;
  label: string;
  /** EUR réellement débités, en centimes (source : relevé bancaire). */
  eurCents: number;
  /** Montant d'origine tel qu'affiché par la banque, pour la traçabilité. */
  original?: string;
  paidBy: Payer;
  note?: string;
}

/**
 * Frais de création de la LLC (Corporate Filings LLC), payés par Badr le
 * 21/06 — capture bancaire transmise le 08/08. Trois débits distincts, gardés
 * ligne à ligne pour coller au relevé (les « card verification » à 0 € ne
 * sont pas des débits). Si d'autres lignes existent sous la capture, Badr
 * les envoie et on les ajoute.
 */
export const ONE_OFF_COSTS: OneOffCost[] = [
  { day: "2026-06-21", label: "Frais LLC — Corporate Filings", eurCents: 28456, original: "325 $", paidBy: "BADR" },
  { day: "2026-06-21", label: "Frais LLC — Corporate Filings", eurCents: 12433, original: "142 $", paidBy: "BADR" },
  { day: "2026-06-21", label: "Frais LLC — Corporate Filings", eurCents: 10945, original: "125 $", paidBy: "BADR" },
];

export interface AssociateTransfer {
  from: Payer;
  to: Payer;
  eurCents: number;
  /** Date du versement — null si Badr ne l'a pas (encore) donnée. */
  day: string | null;
  label: string;
  note?: string;
}

/** Argent passé d'une poche à l'autre — hors P&L, à solder entre eux. */
export const TRANSFERS: AssociateTransfer[] = [
  {
    from: "BADR",
    to: "ADNANE",
    eurCents: 100000,
    day: null,
    label: "Avance versée à Adnane",
    note: "« J'ai déjà avancé 1 000 € que j'ai donné à Adnane » (Badr 08/08) — date à préciser",
  },
];

export interface SubPayment {
  payer: Payer;
  label: string;
  eurCents: number;
  /** Date de la facture — null si Badr ne l'a pas (encore) donnée. */
  day: string | null;
  note?: string;
}

/**
 * FACTURES réellement payées de sa poche pour des abonnements de la société.
 * Ce n'est PAS une charge en plus (l'étalement quotidien de subscriptions.ts
 * couvre déjà le P&L) : c'est le compteur de ce qui est DÛ au payeur au
 * règlement. On enregistre les factures réelles, jamais un cumul théorique.
 */
export const SUB_PAYMENTS: SubPayment[] = [
  {
    payer: "BADR",
    label: "Claude — 1er abonnement (1 facture)",
    eurCents: 10000,
    day: null,
    note: "« J'ai payé 100 € pour le 1er abonnement » (Badr 08/08) — date de facture à préciser. Prochaines factures à ajouter au fil de l'eau.",
  },
];

export function subPaymentsTotalCentsBy(payer: Payer): number {
  let total = 0;
  for (const p of SUB_PAYMENTS) if (p.payer === payer) total += p.eurCents;
  return total;
}

/** Frais ponctuels d'un jour donné (centimes d'euro) — entre dans le net global. */
export function oneOffCostsCentsForDay(day: string): number {
  let total = 0;
  for (const c of ONE_OFF_COSTS) if (c.day === day) total += c.eurCents;
  return total;
}

export function oneOffTotalCentsBy(payer: Payer): number {
  let total = 0;
  for (const c of ONE_OFF_COSTS) if (c.paidBy === payer) total += c.eurCents;
  return total;
}

export function transfersTotalCentsFrom(payer: Payer): number {
  let total = 0;
  for (const t of TRANSFERS) if (t.from === payer) total += t.eurCents;
  return total;
}
