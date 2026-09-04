// ---------------------------------------------------------------------------
// 🧮 RAPPROCHEMENT TRÉSORERIE — « où est passé l'argent ? »
//
// Demande Badr (04/09) : « c'est pas à moi d'aller voir, c'est lui qui cherche
// tout ». Le contrôle bancaire existant regarde 30 jours et vérifie des
// DÉTAILS (un abonnement débité, un payout manquant). Ce module répond à la
// question de haut : le net gagné DEPUIS LE DÉBUT correspond-il à ce qu'il y a
// réellement sur les comptes — et sinon, où est la différence ?
//
// Le pont, dans l'ordre où on le lit :
//
//   Net cumulé (déjà net des charges fixes)
//   + Dette fournisseur pas encore payée   ← déduite du net, mais TOUJOURS en
//                                             banque tant qu'on n'a pas viré
//   = Cash théorique généré
//   − Argent en route chez Shopify
//   = Ce qui DEVRAIT être sur les comptes
//   vs Solde réel Wise + Slash
//   = Écart, ventilé par ce que le dashboard ne compte nulle part :
//       • frais bancaires / de change,
//       • Google Ads (aucune API branchée — seule la banque le voit),
//       • dépenses perso payées par la carte LLC,
//       • le supplément Meta : Meta facture en EUR, la carte paie en USD, donc
//         le débit réel dépasse le spend enregistré.
//
// Tout est PUR ici : les chiffres arrivent en entrée, aucune API, aucun
// arrondi caché. Ce qui n'est pas mesurable est renvoyé à null et affiché
// comme tel — jamais comblé par une estimation silencieuse.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// DÉCISIONS DU 04/09 (Badr) — ce qui borne le rapprochement.
// ---------------------------------------------------------------------------

/** Les frais bancaires relevés à la main sur Slash le 04/09 (change 866 $,
 * plan Shopify 571 $, Google Ads 65 $, SWIFT 50 $) ont été INSCRITS dans le net
 * ce jour-là (subscriptions.ts + associateLedger.ts). Le balayage bancaire ne
 * doit donc les compter comme « écart » qu'APRÈS cette date, sinon ils
 * expliqueraient deux fois. Tout frais postérieur ressort comme un écart neuf. */
export const NET_BOOKED_BANK_FEES_UNTIL = "2026-09-04";

/**
 * Badr, 04/09 : « l'écart, c'est sur le compte Revolut perso d'Adnane, avant
 * le transfert vers la nouvelle LLC (Slash + Wise) — à partir de ce jour on
 * part du principe qu'il n'y a pas de trou ».
 *
 * Le rapprochement du 04/09 laissait ~1 850 € non tracés (±700 € : dû Panda
 * estimé, taux CAD deviné, frais Shopify des vieilles commandes à 3 %).
 * L'activité a tourné sur le Revolut perso d'Adnane avant l'ouverture des
 * comptes LLC : ce reliquat est là-bas, pas perdu — et il est à LUI (100 %),
 * pas réparti 50/50. Figé à la valeur du 04/09 : c'est un PLAFOND. Tout
 * écart au-delà, à partir de ce jour, est une anomalie à chercher.
 */
export const PRE_LLC_RESIDUAL = {
  day: "2026-09-04",
  cents: 185000,
  label: "Revolut perso Adnane — période avant la LLC (figé 04/09)",
  note: "Reliquat du rapprochement du 04/09, resté sur le Revolut perso d'Adnane (l'activité tournait dessus avant Slash/Wise). Décision Badr : imputé 100 % Adnane. Plafond figé — un écart au-delà est un trou NEUF.",
} as const;

/** Seuil au-delà duquel l'inexpliqué depuis le 04/09 devient une anomalie
 * rouge. En dessous : arrondis de change, décalages de facturation. */
export const UNEXPLAINED_ALERT_CENTS = 100000;

/** Une ligne de la ventilation de l'écart : un poste que le net ne connaît pas. */
export interface TreasuryGapLine {
  label: string;
  /** Sortie de cash NON comptée dans le net (positif = explique l'écart). */
  cents: number;
  detail: string;
}

export interface TreasuryBridge {
  /** Net société cumulé, charges fixes déjà déduites. */
  netCumuleCents: number;
  /** COGS + taxe des commandes livrées mais pas encore facturées par le
   * fournisseur : déjà déduits du net, pas encore sortis de la banque. */
  supplierUnbilledCents: number;
  /** Reste dû sur les factures DÉJÀ reçues (suivi fournisseur). */
  supplierOwedCents: number;
  /** Acomptes virés au fournisseur AVANT sa facture (pas encore affectés) :
   * déjà sortis de la banque, à déduire de ce qu'il pourra réclamer. */
  supplierPrepaidCents: number;
  /** Détail de la prochaine facture attendue (plage, nombre de commandes). */
  supplierNext: SupplierUnbilled | null;
  /** Net + tout ce qui est dû au fournisseur = cash que l'activité a produit. */
  cashTheoriqueCents: number;
  /** Solde Shopify Payments (null si le scope manque). */
  enRouteCents: number | null;
  /** Somme des soldes bancaires convertis en EUR (null si aucun solde lu). */
  bankCents: number | null;
  /** Devises dont le solde n'a pas pu être converti — exclues du total. */
  bankSkipped: string[];
  /** Ce qui devrait être en banque = cash théorique − en route. */
  attenduEnBanqueCents: number | null;
  /** attendu − réel. Positif = il manque de l'argent sur les comptes. */
  gapCents: number | null;
  /** Postes qui expliquent l'écart, du plus gros au plus petit. */
  gapLines: TreasuryGapLine[];
  /** Reliquat imputé au Revolut perso d'Adnane (période pré-LLC), borné par
   * PRE_LLC_RESIDUAL : jamais plus que ce qui reste à expliquer, jamais plus
   * que le plafond figé le 04/09. */
  preLlcRevolutCents: number | null;
  /** Écart restant une fois la ventilation ET le reliquat Revolut retirés —
   * c'est l'inexpliqué DEPUIS le 04/09, le seul qui doit alerter. */
  unexplainedCents: number | null;
  /** Premier jour réellement balayé en banque pour la ventilation. */
  scanSinceDay: string | null;
  /** true quand la ventilation ne couvre PAS toute la vie de l'activité :
   * l'écart restant inclut alors ce qui s'est passé avant. */
  scanPartial: boolean;
  /** À qui l'écart est imputable (demande Badr 04/09 : « cet écart est
   * imputé à qui ? »). null quand il n'est pas calculable. */
  attribution: TreasuryAttribution | null;
  /** Frais de change depuis le début, par origine — null sans balayage. */
  fxSplit: { metaCents: number; persoCents: number; autreCents: number; totalCents: number } | null;
}

export interface TreasuryAttribution {
  badrCents: number;
  adnaneCents: number;
  /** Part nominative (dépenses perso), exacte — pas une répartition. */
  persoBadrCents: number;
  persoFahdCents: number;
  /** Part société de l'écart, répartie par la règle des associés. */
  societeCents: number;
  /** Part de l'écart répartie faute de date (supplément Meta + inexpliqué),
   * 50/50 — signalée pour ne jamais la faire passer pour une mesure. */
  reparti5050Cents: number;
  /** Reliquat Revolut pré-LLC, 100 % Adnane (décision Badr 04/09). */
  revolutAdnaneCents: number;
}

export interface TreasuryInput {
  netCumuleCents: number;
  supplierUnbilledCents: number;
  supplierOwedCents: number;
  /** Acomptes déjà virés au fournisseur, non encore affectés à une facture. */
  supplierPrepaidCents?: number;
  supplierNext?: SupplierUnbilled | null;
  enRouteCents: number | null;
  /** Soldes bancaires en EUR ; null = devise non convertible. */
  bankBalances: { currency: string; amountEurCents: number | null }[];
  /** Débits bancaires par catégorie sur la période balayée (valeurs
   * POSITIVES = argent sorti). */
  scan: {
    sinceDay: string;
    /** true si la période balayée démarre au lancement de l'activité. */
    coversHistory: boolean;
    /** Frais bancaires et de change (catégorie FRAIS). */
    feesCents: number;
    /** Débits Google Ads — invisible du dashboard, aucune API branchée. */
    googleAdsCents: number;
    /** Dépenses affectées PERSO_BADR (carte LLC, avance à Badr). */
    persoBadrCents: number;
    /** Dépenses affectées PERSO_FAHD — Fahd = Adnane (confirmé 19/08). */
    persoFahdCents: number;
    /** Part de Badr sur les frais + Google Ads, calculée JOUR PAR JOUR avec
     * la règle des charges (100 % Adnane avant le 14/07, 50/50 ensuite) —
     * jamais un 50/50 plaqué sur toute l'histoire. */
    societeDatedBadrCents: number;
    /** Débits Meta réellement passés en banque. */
    metaBankCents: number;
    /** Spend Meta enregistré par le dashboard sur la MÊME période. */
    metaSpendCents: number;
    /** Frais de change depuis le début, par origine (information) — Badr
     * 04/09 : « les frais de change c'est lié aux dépenses courantes ou à
     * Meta ? ». Cents EUR, positifs. */
    fxSplit?: { metaCents: number; persoCents: number; autreCents: number };
  } | null;
}

/** Somme des soldes convertibles ; les devises sans taux sont listées à part
 * plutôt que comptées à zéro (un solde ignoré en silence fausserait l'écart
 * exactement comme un trou). */
export function sumBankBalances(balances: { currency: string; amountEurCents: number | null }[]): {
  totalCents: number | null;
  skipped: string[];
} {
  if (balances.length === 0) return { totalCents: null, skipped: [] };
  let total = 0;
  const skipped: string[] = [];
  for (const b of balances) {
    if (b.amountEurCents === null) skipped.push(b.currency);
    else total += b.amountEurCents;
  }
  return { totalCents: total, skipped };
}

export function buildTreasuryBridge(input: TreasuryInput): TreasuryBridge {
  const { totalCents: bankCents, skipped: bankSkipped } = sumBankBalances(input.bankBalances);
  // Un acompte déjà viré est SORTI de la banque : la part de la dette qu'il
  // couvre n'y est plus. Sans cette soustraction, le cash théorique garderait
  // 25 000 € de « dette encore en banque » le jour même où ils sont partis, et
  // l'écart crierait au trou de 25 000 €.
  const prepaid = input.supplierPrepaidCents ?? 0;
  const cashTheoriqueCents = input.netCumuleCents + input.supplierUnbilledCents + input.supplierOwedCents - prepaid;

  const attenduEnBanqueCents = input.enRouteCents === null ? null : cashTheoriqueCents - input.enRouteCents;
  const gapCents = attenduEnBanqueCents === null || bankCents === null ? null : attenduEnBanqueCents - bankCents;

  const gapLines: TreasuryGapLine[] = [];
  const s = input.scan;
  if (s) {
    // Supplément Meta : Meta facture en euros, la carte LLC paie en dollars —
    // le débit réel dépasse le spend enregistré (conversion + frais). Compté
    // seulement s'il est POSITIF : un débit inférieur au spend, c'est du
    // décalage de facturation Meta (palier non encore prélevé), pas une
    // dépense cachée, et le passer en négatif gonflerait l'inexpliqué.
    const metaExtra = s.metaBankCents - s.metaSpendCents;
    if (metaExtra > 0) {
      gapLines.push({
        label: "Supplément Meta (change + frais carte)",
        cents: metaExtra,
        detail: `${eur(s.metaBankCents)} débités en banque vs ${eur(s.metaSpendCents)} de spend enregistré — Meta facture en euros, la carte paie en dollars.`,
      });
    }
    if (s.feesCents > 0) {
      gapLines.push({
        label: "Frais bancaires et de change",
        cents: s.feesCents,
        detail: "Frais Slash/Wise (transaction étrangère, virements) — jamais comptés dans le net.",
      });
    }
    if (s.googleAdsCents > 0) {
      gapLines.push({
        label: "Google Ads",
        cents: s.googleAdsCents,
        detail: "Vu uniquement en banque : aucune API Google n'est branchée sur le dashboard.",
      });
    }
    const perso = s.persoBadrCents + s.persoFahdCents;
    if (perso > 0) {
      gapLines.push({
        label: "Dépenses perso payées par la carte LLC",
        cents: perso,
        detail: `Badr ${eur(s.persoBadrCents)} · Adnane ${eur(s.persoFahdCents)} — avances de la société, à solder entre associés.`,
      });
    }
    gapLines.sort((a, b) => b.cents - a.cents);
  }

  const explained = gapLines.reduce((t, l) => t + l.cents, 0);
  const resteAvantRevolut = gapCents === null || s === null ? null : gapCents - explained;

  // 🏦 Reliquat Revolut perso Adnane (pré-LLC) : absorbe ce qui reste, dans la
  // limite du plafond figé le 04/09. Si le balayage explique déjà tout (ou si
  // la banque dépasse l'attendu), la ligne tombe à zéro — jamais négative.
  const preLlcRevolutCents =
    resteAvantRevolut === null ? null : Math.min(Math.max(resteAvantRevolut, 0), PRE_LLC_RESIDUAL.cents);
  if (preLlcRevolutCents !== null && preLlcRevolutCents > 0) {
    gapLines.push({ label: PRE_LLC_RESIDUAL.label, cents: preLlcRevolutCents, detail: PRE_LLC_RESIDUAL.note });
  }
  const unexplainedCents =
    resteAvantRevolut === null || preLlcRevolutCents === null ? null : resteAvantRevolut - preLlcRevolutCents;

  // 👥 À qui l'écart est imputable. Trois régimes, jamais mélangés :
  //   • les dépenses perso sont NOMINATIVES (exactes, aucune répartition) ;
  //   • les frais et Google Ads sont datés → règle des associés jour par jour
  //     (100 % Adnane avant le 14/07, 50/50 ensuite) ;
  //   • le supplément Meta et l'inexpliqué n'ont pas de date exploitable →
  //     50/50, et c'est DIT (champ reparti5050Cents), jamais présenté comme
  //     une mesure.
  //   • le reliquat Revolut pré-LLC est à Adnane, 100 % (décision Badr 04/09).
  let attribution: TreasuryAttribution | null = null;
  if (s && unexplainedCents !== null && preLlcRevolutCents !== null) {
    const metaExtra = Math.max(s.metaBankCents - s.metaSpendCents, 0);
    const dated = s.feesCents + s.googleAdsCents;
    const flou = metaExtra + unexplainedCents;
    const badrFlou = Math.round(flou / 2);
    const badr = s.persoBadrCents + s.societeDatedBadrCents + badrFlou;
    const adnane = s.persoFahdCents + (dated - s.societeDatedBadrCents) + (flou - badrFlou) + preLlcRevolutCents;
    attribution = {
      badrCents: badr,
      adnaneCents: adnane,
      persoBadrCents: s.persoBadrCents,
      persoFahdCents: s.persoFahdCents,
      societeCents: dated + flou,
      reparti5050Cents: flou,
      revolutAdnaneCents: preLlcRevolutCents,
    };
  }

  return {
    netCumuleCents: input.netCumuleCents,
    supplierUnbilledCents: input.supplierUnbilledCents,
    supplierOwedCents: input.supplierOwedCents,
    supplierPrepaidCents: prepaid,
    supplierNext: input.supplierNext ?? null,
    cashTheoriqueCents,
    enRouteCents: input.enRouteCents,
    bankCents,
    bankSkipped,
    attenduEnBanqueCents,
    gapCents,
    gapLines,
    preLlcRevolutCents,
    unexplainedCents,
    scanSinceDay: s?.sinceDay ?? null,
    scanPartial: s ? !s.coversHistory : false,
    attribution,
    fxSplit: s?.fxSplit
      ? { ...s.fxSplit, totalCents: s.fxSplit.metaCents + s.fxSplit.persoCents + s.fxSplit.autreCents }
      : null,
  };
}

function eur(cents: number): string {
  return `${Math.round(cents / 100).toLocaleString("fr-FR")} €`;
}

// --- Dette fournisseur pas encore facturée ----------------------------------

export interface OrderCostRow {
  store: string;
  orderName: string;
  day: string;
  /** COGS produit + upsells + taxe UE, en centimes : ce que le fournisseur
   * facture (vérifié sur les 2 factures d'août : sa ligne TOTAL tombe à
   * ±1 % de ce total, la taxe incluse). */
  costCents: number;
}

/** Numéro de commande d'un « #5995 » — null si le nom n'est pas numérique
 * (une boutique peut préfixer ses commandes autrement). */
export function orderNumber(orderName: string): number | null {
  const digits = orderName.replace(/[^0-9]/g, "");
  if (digits === "" || digits.length > 15) return null;
  const n = Number(digits);
  return Number.isFinite(n) ? n : null;
}

/**
 * Ce qu'on devra au fournisseur pour les commandes qu'il n'a PAS encore
 * facturées — le poste que personne ne voit passer et qui fait croire à une
 * trésorerie plus grasse qu'elle n'est.
 *
 * Règle de coupe : la dernière facture s'arrête à un NUMÉRO de commande
 * (`#5995`) et non à une date — deux commandes du même jour peuvent tomber de
 * part et d'autre. On coupe donc au numéro pour la boutique qui porte cette
 * numérotation, et à la DATE d'émission pour les autres boutiques (leur
 * numérotation est indépendante ; les compter au numéro mélangerait deux
 * séries et pourrait doubler ou effacer une facture entière).
 */
export interface SupplierUnbilled {
  cents: number;
  orders: number;
  /** Bornes de la boutique facturée (numéros), null si aucune commande. */
  firstOrder: string | null;
  lastOrder: string | null;
  firstDay: string | null;
  lastDay: string | null;
}

export function supplierUnbilledDetail(
  rows: OrderCostRow[],
  lastBill: { store: string; ordersTo: string; issuedDay: string } | null
): SupplierUnbilled {
  const cut = lastBill ? orderNumber(lastBill.ordersTo) : null;
  const kept: OrderCostRow[] = [];
  for (const r of rows) {
    if (!lastBill) {
      kept.push(r);
      continue;
    }
    if (r.store === lastBill.store && cut !== null) {
      const n = orderNumber(r.orderName);
      if (n !== null && n > cut) kept.push(r);
      continue;
    }
    if (r.day > lastBill.issuedDay) kept.push(r);
  }
  const numbered = kept
    .filter((r) => !lastBill || r.store === lastBill.store)
    .map((r) => ({ r, n: orderNumber(r.orderName) }))
    .filter((x): x is { r: OrderCostRow; n: number } => x.n !== null)
    .sort((a, b) => a.n - b.n);
  const days = kept.map((r) => r.day).sort();
  return {
    cents: kept.reduce((t, r) => t + r.costCents, 0),
    orders: kept.length,
    firstOrder: numbered[0]?.r.orderName ?? null,
    lastOrder: numbered[numbered.length - 1]?.r.orderName ?? null,
    firstDay: days[0] ?? null,
    lastDay: days[days.length - 1] ?? null,
  };
}

export function supplierUnbilledCents(
  rows: OrderCostRow[],
  lastBill: { store: string; ordersTo: string; issuedDay: string } | null
): number {
  return supplierUnbilledDetail(rows, lastBill).cents;
}
