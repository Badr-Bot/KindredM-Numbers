// ---------------------------------------------------------------------------
// FACTURES FOURNISSEUR (Panda Dropshipping) — suivi des paiements.
//
// Demandé par Badr le 14/08 : « une carte avec ce qu'on doit payer au
// fournisseur chaque mois et la facture qu'on a reçue, comme ça j'ai un
// suivi, je sais si on l'a payé comme il faut ou pas. On part à zéro pour le
// fournisseur depuis les deux dernières bills. »
//
// POINT DE DÉPART DU LEDGER : les factures 20260801 et 20260814. Tout ce qui
// précède est réputé soldé (décision Badr) — aucune dette antérieure suivie.
//
// Règles :
//   • Les montants viennent des fichiers Excel du fournisseur, vérifiés
//     ligne à ligne contre les grilles du moteur (audit du 14/08, MEMO).
//     On reprend LEUR ligne TOTAL, jamais un montant recalculé — c'est ce
//     qu'ils réclament, le suivi sert à vérifier qu'on paie ça et pas plus.
//   • `status` est mis à jour À LA MAIN quand Badr annonce un paiement
//     (même canal que les recettes manuelles). Jamais déduit, jamais deviné.
//   • `disputedCents` = montant contesté auprès du fournisseur, inclus dans
//     le total facturé mais à NE PAS payer tant que le litige court.
//   • Une facture réglée ne se supprime jamais : status "payee" + payedNote.
//
// Ces montants ne touchent PAS le net du dashboard : le COGS est déjà compté
// commande par commande. Cette carte est un suivi de TRÉSORERIE fournisseur
// (ce qu'on doit vs ce qu'on a payé), pas une deuxième comptabilisation.
// ---------------------------------------------------------------------------

export type SupplierBillStatus = "a_payer" | "payee" | "partielle";

export interface SupplierBill {
  /** Référence du fournisseur (nom de fichier). */
  ref: string;
  /** Date d'émission (YYYY-MM-DD). */
  issuedDay: string;
  /** Plage de commandes couvertes. */
  ordersFrom: string;
  ordersTo: string;
  ordersCount: number;
  /** Ligne TOTAL du fournisseur, en centimes EUR (ce qu'il réclame). */
  totalCents: number;
  /** Part contestée (incluse dans totalCents), 0 si rien. */
  disputedCents: number;
  status: SupplierBillStatus;
  /** Montant déjà réglé, en centimes (0 tant que rien n'est payé). */
  paidCents: number;
  note?: string;
}

export const SUPPLIER_NAME = "Panda Dropshipping";

export const SUPPLIER_BILLS: SupplierBill[] = [
  {
    ref: "Bill 20260801",
    issuedDay: "2026-08-01",
    ordersFrom: "#4814",
    ordersTo: "#5462",
    ordersCount: 649,
    totalCents: 1427996, // ligne TOTAL du fichier : 14 279,96 €
    disputedCents: 0,
    // SOLDÉE (Badr, 14/08) : virement international de 16 388,40 $ le 06/08
    // (Settled, Panda Dropshipping Limited, SWIFT SCBLHKHH) — capture fournie.
    // Taux impliqué : 16 388,40 ÷ 14 279,96 = 1,1476 (taux banque du jour).
    status: "payee",
    paidCents: 1427996,
    note: "Payée le 06/08 : virement 16 388,40 $ (settled). Vérifiée ligne à ligne le 14/08 : conforme au devis. 1 commande non tarifée par le fournisseur (#5420).",
  },
  {
    ref: "Bill 20260814",
    issuedDay: "2026-08-14",
    ordersFrom: "#5463",
    ordersTo: "#5995",
    ordersCount: 531,
    // Ligne TOTAL du fournisseur : 11 654,41 € de commandes + 410,00 € de
    // « custom packing » = 12 064,41 €. Le « 13 914,91 » en bout de ligne est
    // LE MÊME TOTAL EN DOLLARS (confirmé par Badr le 14/08 — vérifié :
    // 13 914,91 ÷ 12 064,41 = taux 1,1534, cohérent avec le 1,1539 maison).
    // Le fournisseur (Hong Kong) encaisse en USD : c'est le montant à virer.
    totalCents: 1206441,
    // Litige gilet LEVÉ (14/08) : le fournisseur a expliqué — le devis est le
    // prix du gilet EN UPSELL ; en produit primaire (son propre colis) il y a
    // un packing de +3,50/4,00 €. Vérifié dans leurs factures (#5591 : gilet
    // AVEC polo facturé 8,90 €, l'ancien prix). Accepté par Badr, grille du
    // moteur mise à jour en conséquence — la facture est due EN ENTIER.
    disputedCents: 0,
    // PAYÉE (Badr, 14/08 : « je lui ai payé ce qu'il a demandé ce matin,
    // tout est réglo ») — montant demandé réglé en entier (13 914,91 $).
    status: "payee",
    paidCents: 1206441,
    note: "Payée le 14/08 (annonce Badr) : montant demandé réglé en entier (13 914,91 $, taux 1,1534). Contient 410 € de « custom packing ». Litige gilet levé (packing du gilet primaire, vérifié et accepté).",
  },
  {
    ref: "Bill 20260903",
    issuedDay: "2026-09-03",
    ordersFrom: "#5996",
    ordersTo: "#7148",
    // 1 153 lignes dans le fichier : 1 152 facturées + 1 annulée (#6794,
    // Islande) facturée 0,00 € — correct. ⚠️ L'en-tête du fichier annonce
    // « 1157 Orders | 1156 orders billed » : 4 commandes de plus que ce que
    // le fichier contient. Le TOTAL, lui, correspond EXACTEMENT à la somme
    // des lignes présentes (recalculée au centime) — donc aucune
    // surfacturation, mais l'en-tête est faux.
    ordersCount: 1152,
    totalCents: 2546366, // ligne CONFIRMED TOTAL : 25 463,66 €
    // Le 2e nombre de la ligne TOTAL (29 577,19) = le même total EN DOLLARS,
    // comme sur la facture du 14/08 : taux implicite 1,1615 (contre 1,1534
    // le 14/08 et 1,1476 le 06/08). À vérifier contre le taux du jour avant
    // de virer : +0,7 % vs le 14/08, soit ~195 $ d'écart sur cette facture.
    //
    // Packing « colis primaire » (+4,00 € par commande sans polo, 3,50 € pour
    // un gilet FR ×1) : CONFIRMÉ NORMAL par Badr le 04/09 — même règle que le
    // gilet primaire acceptée le 14/08, vérifiée ici sur 15 commandes (LS, tank,
    // short, chemise). L'avoir Long Sleeves promis le 14/08 est donc ABANDONNÉ,
    // ce n'était pas une surfacturation. Reste à encoder la règle côté moteur
    // (aujourd'hui appliquée au seul gilet) — cf. MEMO, en attente du feu vert.
    //
    // CONTESTÉ = 6,00 € de taxe UE payée DEUX FOIS sur des colis groupés :
    // #6917 + #6919 (même client, MÊME tracking YT2624300711024105) et
    // #6864 + #6865 (Irlande, même tracking YT2624500708990669) sont taxés
    // 3 € chacun alors qu'un seul colis est parti. Leur propre règle est
    // 3 €/COLIS, pas 3 €/commande.
    disputedCents: 600,
    status: "a_payer",
    paidCents: 0,
    note:
      "Vérifiée ligne à ligne le 04/09 : 25 454,43 € recalculés par le moteur, écart +9,23 € (0,04 % — contre 1,4 % sur les factures d'août), 90,6 % des lignes identiques au centime, taxe 3 €/colis respectée sur 1 151/1 153. Aucun dérapage de prix : polo FR 15,06/26,76 · caleçon 2,46 · gilet aux prix du 14/08 · Canada aux prix relevés le 02/08 · Suisse constante. Pas de ligne « custom packing » cette fois. Panier moyen 22,10 € (22,00 le 01/08, 21,95 le 14/08 hors packing). " +
      "⚠️ AVANT DE PAYER : 136 commandes facturées SANS numéro de suivi (3 066,86 €), dont un bloc contigu #6619→#6658 + #6945 (41 cmd, 894,76 €) qui date du milieu de période — lot jamais expédié ou tracking non renseigné, à éclaircir. " +
      "⚠️ Colis groupés facturés plusieurs fois en plein : #6953/6954/6955/6981 (Suisse, même client, MÊME tracking, 203,15 € = 4 prix DDP livraison comprise pour UN envoi) + les 2 paires ci-dessus. " +
      "CROISÉE AVEC SHOPIFY le 04/09 (Supabase, les 1 153 commandes du store FR sur #5996→#7148) : une ligne = une commande, quantités identiques à l'unité produit par produit (polos 2 511 vs 2 505 facturés, caleçons 259/258, gilets 203/203, chemises 67/67, shorts 26/26, pantalons 21/21, débardeurs 13/13). Les seuls écarts sont les 3 commandes remboursées/annulées (#6103, #6327, #6794) facturées 0 € — en notre faveur. Aucune commande facturée deux fois, aucune unité en trop, aucun reshipment refacturé.",
  },
];

// ---------------------------------------------------------------------------
// AVOIRS ATTENDUS sur les PROCHAINES factures — promesses du fournisseur,
// à pointer à la réception (c'est tout l'intérêt du suivi : vérifier qu'ils
// arrivent vraiment, pas les oublier).
// ---------------------------------------------------------------------------
export interface SupplierPendingCredit {
  label: string;
  /** Estimation maison, centimes EUR — le fournisseur fixera le montant réel. */
  estimatedCents: number;
  note: string;
}

export const SUPPLIER_PENDING_CREDITS: SupplierPendingCredit[] = [
  {
    label: "Taxe UE facturée 2× sur colis groupés (03/09)",
    estimatedCents: 600,
    note: "#6917+#6919 (même client FR, MÊME tracking) et #6864+#6865 (Irlande, même tracking) : 3 € de taxe sur CHAQUE commande alors qu'un seul colis part. Leur règle est 3 €/colis — confirmée par leurs propres factures depuis le 01/08. Porté en `disputedCents` sur la facture 20260903.",
  },
  {
    label: "Reshipments : où sont-ils facturés ? (à demander)",
    estimatedCents: 0,
    note: "Le tracker Drive (NIVA_Reshipment_Tracker) liste ~250 réexpéditions, dont plusieurs notées « payed by niva » — mais AUCUNE ligne de reshipment n'apparaît sur les 3 factures : les trois sont des plages de commandes contiguës (une ligne = une commande Shopify), et la seule ligne hors commande jamais vue est le « custom packing » de 410 € du 14/08. Vérifié le 04/09 : les cas du tracker vont de #1003 à #5838, tous ANTÉRIEURS à cette facture, et les quantités facturées collent à Shopify à l'unité — donc rien n'est facturé deux fois. Reste à leur faire dire où passent les réexpéditions à notre charge (dans le « custom packing » ? gratuites ? sur un autre document ?).",
  },
];

export function supplierPendingCreditsCents(): number {
  return SUPPLIER_PENDING_CREDITS.reduce((t, c) => t + c.estimatedCents, 0);
}

export function supplierOwedCents(): number {
  return SUPPLIER_BILLS.reduce((t, b) => t + (b.totalCents - b.paidCents), 0);
}

/** Ce qu'il est raisonnable de payer aujourd'hui : le dû MOINS le contesté. */
export function supplierPayableCents(): number {
  return SUPPLIER_BILLS.reduce(
    (t, b) => t + Math.max(b.totalCents - b.disputedCents - b.paidCents, 0),
    0
  );
}

export function supplierDisputedCents(): number {
  return SUPPLIER_BILLS.reduce((t, b) => t + (b.status === "payee" ? 0 : b.disputedCents), 0);
}
