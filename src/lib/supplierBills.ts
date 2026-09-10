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

/** Boutique dont les factures portent la numérotation (#4814, #5995…) : le
 * fournisseur facture toute l'activité, mais ses plages de commandes suivent
 * les numéros de la boutique FR. Les autres boutiques ont leur propre série,
 * indépendante — les couper au même numéro mélangerait deux comptes. */
export const SUPPLIER_BILL_STORE = "FR";

/** Dernière facture reçue — la coupe à partir de laquelle les commandes ne
 * sont PAS encore facturées (et donc pas encore payées, alors que leur coût
 * est déjà déduit du net). null si le suivi est vide. */
export function lastSupplierBill(): SupplierBill | null {
  return SUPPLIER_BILLS.length === 0 ? null : SUPPLIER_BILLS[SUPPLIER_BILLS.length - 1];
}

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
    // 533 lignes dans le fichier, une par commande, couvrant #5463→#5995 sans
    // trou ni doublon (recompté le 10/09 — la valeur 531 saisie le 14/08 était
    // fausse de 2). ⚠️ L'en-tête annonce « 535 Orders | 533 billed | 2 not
    // charged yet » : même défaut d'en-tête que sur la facture du 03/09, le
    // TOTAL est juste, le compte annoncé non. Les « 2 not charged » sont
    // #5599 (Croatie) et #5759 (Réunion), expédiées avec tracking mais
    // facturées 0,00 € « country not covered by polo quote » — leur prix peut
    // encore tomber, leur COGS reste compté chez nous.
    ordersCount: 533,
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
    // (1 151 LIGNES : deux d'entre elles couvrent chacune 2 commandes parties
    // dans le même colis — les 1 153 numéros #5996→#7148 sont tous couverts,
    // exactement une fois.)
    // Version CORRIGÉE du 04/09 (2e envoi du fichier) : 25 448,36 €.
    // La 1re version réclamait 25 463,66 € — le fournisseur a fusionné les deux
    // paires de commandes parties dans un seul colis (#6919+#6917 et
    // #6864+#6865) et les a re-tarifées : −15,30 €, soit PLUS que les 6,00 €
    // de taxe UE en double qu'on réclamait (il enlève aussi la 2e livraison).
    totalCents: 2544836, // ligne CONFIRMED TOTAL : 25 448,36 € (= 29 563,27 $)
    // Le 2e nombre de la ligne TOTAL (29 563,27) = le même total EN DOLLARS,
    // comme sur la facture du 14/08 : taux implicite 1,1617 (contre 1,1534
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
    // PLUS RIEN DE CONTESTÉ : les 6,00 € de taxe UE en double ont été corrigés
    // dans la version du 04/09 (les deux paires sont fusionnées en une ligne,
    // taxées 3 € une fois). Reste UNE question ouverte, pas chiffrée et pas
    // bloquante : #6953/6954/6955/6981 (Suisse, même client, MÊME tracking
    // YT2624500709168612, 203,15 €) sont toujours 4 lignes livraison comprise
    // pour un seul colis — même logique que les paires fusionnées, à demander
    // en avoir sur la prochaine facture.
    disputedCents: 0,
    // PAYÉE le 04/09 (Badr : « 25 448,36 € j'ai viré ça aujourd'hui, on a payé
    // jusqu'à la commande #7148 ») — montant réglé en entier, avant même que la
    // vérification ligne à ligne ci-dessus soit fusionnée (deux sessions le
    // même jour : celle-ci a vérifié la facture, l'autre a enregistré le
    // paiement ; réconciliées le 04/09, un seul enregistrement).
    status: "payee",
    paidCents: 2544836,
    note:
      "Payée le 04/09 : 25 448,36 € virés par Badr (montant demandé réglé en entier). Version corrigée du 04/09, VALIDÉE. Recalculée par le moteur : 25 445,07 €, écart +3,29 € (0,013 % — contre 1,4 % sur les factures d'août), 90,7 % des lignes identiques au centime, taxe 3 €/colis désormais respectée partout. Aucun dérapage de prix : polo FR 15,06/26,76 · caleçon 2,46 · gilet aux prix du 14/08 · Canada aux prix relevés le 02/08 · Suisse constante. Pas de ligne « custom packing » cette fois. Panier moyen 22,10 € (22,00 le 01/08, 21,95 le 14/08 hors packing). " +
      "⚠️ PAYÉE, mais À DEMANDER : 136 commandes facturées SANS numéro de suivi (3 066,86 €), dont un bloc contigu #6619→#6658 + #6945 (41 cmd, 894,76 €) qui date du milieu de période — lot jamais expédié ou tracking non renseigné, à éclaircir. " +
      "Reste ouvert, non bloquant : #6953/6954/6955/6981 (Suisse, même client, MÊME tracking, 203,15 € = 4 prix DDP livraison comprise pour UN envoi) — à demander en avoir sur la prochaine facture, comme les 2 paires déjà corrigées. " +
      "CROISÉE AVEC SHOPIFY le 04/09 (Supabase, les 1 153 commandes du store FR sur #5996→#7148) : une ligne = une commande, quantités identiques à l'unité produit par produit (polos 2 511 vs 2 505 facturés, caleçons 259/258, gilets 203/203, chemises 67/67, shorts 26/26, pantalons 21/21, débardeurs 13/13). Les seuls écarts sont les 3 commandes remboursées/annulées (#6103, #6327, #6794) facturées 0 € — en notre faveur. Aucune commande facturée deux fois, aucune unité en trop, aucun reshipment refacturé.",
  },
  {
    ref: "Bill 20260909",
    issuedDay: "2026-09-09",
    ordersFrom: "#7149",
    ordersTo: "#7506",
    ordersCount: 358,
    // FINAL TOTAL du fichier : 8 494,71 € = 7 878,41 € de lignes commandes
    // + 616,30 € d'une ligne nouvelle, « size up change cost from (#4815-#7506),
    // total 6163 pieces, cost is 616.3 euro » (0,10 € la pièce).
    // Le fournisseur a RETIRÉ les 168,40 € de lignes suisses re-facturées
    // (Claire, 09/09 : « Yes you are right for Stéphane, I delete it ») →
    // le montant réclamé tombe à 8 326,31 €, la valeur retenue ici.
    totalCents: 832631,
    //
    // RETENU = 2 713,29 €, notifiés par un relevé de déduction détaillé envoyé
    // le 10/09 (chaque numéro de commande listé, une source par ligne) :
    //
    //   1. 995,05 € — 47 commandes facturées sans AUCUNE preuve d'expédition
    //      (#7173 + #7460→#7506 sauf #7493) : ni tracking sur leur fichier, ni
    //      fulfilment côté Shopify au 10/09. Ce n'est PAS un litige, c'est du
    //      décalage : payé le jour où ils envoient les trackings. Règle posée
    //      par Badr : « si c'est pas expédié, je paye pas » — expédition, pas
    //      livraison.
    //   2. 842,24 € — 11 commandes annulées et remboursées parce que le colis
    //      n'est jamais parti, vers des pays qu'on livre. Jamais facturées par
    //      eux (donc aucun COGS payé), mais la vente est perdue.
    //   3. 118,48 € — #4079 et #5649 : compensations versées aux clients
    //      (107,99 €) + frais de carte jamais rendus par Shopify (10,49 €).
    //   4. 253,21 € — #3285 et #4368 : chargebacks PERDUS (173,96 € repris par
    //      la banque) + marchandise déjà payée dessus (49,25 €) + frais de
    //      litige Shopify estimés (30,00 €, seul chiffre estimé du relevé).
    //   5. 455,00 € — publicité perdue : 13 commandes totalement perdues × 35 €.
    //      35 € = le CAC MESURÉ (35,05 juillet · 34,55 août · 35,43 septembre),
    //      pas un objectif. Badr voulait 40 €, ramené à la valeur prouvable.
    //   6. 49,31 € — forfait size-up : leur part (3 des 39 réexpéditions sur
    //      #4815→#7506 sont de leur faute = 7,7 % de 616,30 € = 47,41 €) +
    //      1,90 € de comptage gonflé (6 163 pièces facturées vs 6 144 polos).
    //
    // BORNE DE PÉRIODE : ce fournisseur ne travaille avec nous que depuis le
    // 01/07/2026 (Badr, 10/09). Tout ce qui précède a été RETIRÉ de la
    // réclamation même quand la perte était réelle — #2195, #1903, #2593 et
    // 5 chargebacks de juin, soit ~1 107 € abandonnés volontairement. C'est ce
    // qui rend le reste crédible en négociation.
    disputedCents: 271329,
    // PARTIELLE : Badr a viré 5 613,02 € le 10/09 (8 326,31 − 2 713,29).
    status: "partielle",
    paidCents: 561302,
    note:
      "Nouvelle plage #7149→#7506 (358 commandes du 03 au 08/09) : IRRÉPROCHABLE. Recalculée par le moteur, elle donne 7 710,05 € contre 7 710,01 € facturés — 4 CENTIMES d'écart. Croisée avec Shopify : 358 lignes = 358 commandes, contiguës, sans doublon, upsells au compte exact (124 unités). Les 2 seules différences de quantité (#7331 : 4 polos facturés sur 8 commandés · #7441 Mexique : 2 sur 3) sont JUSTES — dans les deux cas les autres lignes ont été retirées de la commande côté Shopify (current_quantity 0) ; c'est NOTRE base qui les compte encore. " +
      "PAYÉE À HAUTEUR DE 5 613,02 € le 10/09. Les 2 713,29 € restants sont retenus et notifiés par un relevé détaillé (6 catégories, chaque numéro de commande listé) — détail en commentaire ci-dessus. La plus grosse ligne (995,05 €) n'est pas un litige mais un décalage : elle se paie dès réception des trackings. " +
      "Le forfait size-up (0,10 €/pièce) est ACCEPTÉ pour l'avenir, sur les seuls changements de taille demandés par le client, et à condition qu'il soit facturé chaque mois sur sa propre ligne. À encoder dans le moteur (coût par commande absent aujourd'hui) — cf. MEMO.",
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
    label: "Trackings des 47 commandes non expédiées (facture 09/09)",
    estimatedCents: 99505,
    note: "#7173 + #7460→#7506 sauf #7493. Ni tracking sur leur fichier, ni fulfilment côté Shopify au 10/09. Retenu sur la facture, PAS contesté : payable le jour où ils envoient les numéros de suivi. C'est la ligne à relancer en premier, c'est la plus grosse et la plus simple à solder.",
  },
  {
    label: "Commandes qu'ils n'ont pas pu expédier (11 cmd)",
    estimatedCents: 84224,
    note: "Annulées et remboursées au client parce que le colis n'est jamais parti, vers des pays qu'on livre : #6327, #5458, #4615, #4493, #4458, #3618, #3439, #3346, #3290, #2874, #2850. Jamais facturées par eux — donc aucun COGS payé — mais la vente est perdue. Preuve : note de remboursement Shopify « Commande annulée » + notre réponse au client « nous n'avons pas pu assurer l'expédition ».",
  },
  {
    label: "Leurs erreurs sur commandes livrées (#4079, #5649)",
    estimatedCents: 11848,
    note: "Compensations versées aux clients (107,99 €) + frais de carte que Shopify ne rend jamais sur un remboursement (10,49 €). Motif écrit dans le tracker : « Supplier Shipping Issue » sur les deux.",
  },
  {
    label: "Chargebacks perdus (#3285, #4368)",
    estimatedCents: 25321,
    note: "173,96 € repris par la banque + 49,25 € de marchandise déjà payée + 30,00 € de frais de litige Shopify ESTIMÉS (~15 €/litige, seul chiffre non lu du relevé — le scope `read_shopify_payments` reste refusé). Claire a écrit le 09/09 : « let me know on the chargebacks or any loss you got as of the shipping issue, we will cover ».",
  },
  {
    label: "Publicité perdue — 13 commandes × 35 €",
    estimatedCents: 45500,
    note: "Le coût d'acquisition est payé AVANT que la commande existe : quand elle est totalement perdue, il l'est aussi. 35 € = CAC mesuré dans le dashboard (35,05 juillet · 34,55 août · 35,43 septembre), pas un objectif — Badr voulait 40 €, ramené à la valeur prouvable. Appliqué aux seules commandes totalement perdues (catégories 2 et 4), jamais aux remboursements partiels où le client garde la marchandise.",
  },
  {
    label: "Forfait size-up : leur part + comptage gonflé",
    estimatedCents: 4931,
    note: "47,41 € = 3 des 39 réexpéditions sur #4815→#7506 sont de leur faute (#4933, #5446, #5649) = 7,7 % des 616,30 €. Le ratio est calculé sur la FENÊTRE DU FORFAIT, pas sur les 295 réexpéditions depuis le début — c'est ce qui le rend incontestable. + 1,90 € : ils comptent 6 163 pièces là où Shopify en a 6 144.",
  },
  {
    label: "Réexpédition #2994 — réelle mais NON réclamée",
    estimatedCents: 0,
    note: "Renvoyée à nos frais après une erreur de taille inscrite de leur côté, mais le tracker ne porte aucun montant pour elle. Volontairement laissée hors du relevé : on ne chiffre pas ce qu'on ne peut pas prouver. Même logique pour #2859, retirée après vérification (statut « Not Shipped » — la réexpédition n'est jamais partie).",
  },
];

// ---------------------------------------------------------------------------
// ACOMPTES — virements faits au fournisseur AVANT sa facture (Badr 04/09 :
// « une fois que je t'envoie la facture tu la déduis de ce qui a été déjà
// viré, c'est pour anticiper et savoir ce qu'il pourra me réclamer »).
//
// Un acompte vit ici tant qu'aucune facture ne l'absorbe. Quand la facture
// arrive : on crée la SupplierBill, on reporte l'acompte dans son paidCents et
// on pose `appliedTo` = sa ref. Jamais supprimé — l'historique des virements
// doit rester lisible ligne à ligne, comme les factures.
// ---------------------------------------------------------------------------
export interface SupplierPrepayment {
  /** Jour du virement (YYYY-MM-DD). */
  day: string;
  /** Montant en EUR (centimes) — contre-valeur au moment du virement. */
  eurCents: number;
  /** Montant d'origine tel que viré (le fournisseur encaisse en USD). */
  original: string;
  /** Ref de la facture qui l'a absorbé — null tant qu'elle n'est pas reçue. */
  appliedTo: string | null;
  note?: string;
}

export const SUPPLIER_PREPAYMENTS: SupplierPrepayment[] = [
  // 10/09 : virement Wise « Sent money to Panda Dropshipping Limited »
  // 5 613,02 €, vu en banque, d'abord enregistré en ACOMPTE parce que la
  // facture n'était pas encore dans le suivi (sans cette ligne le
  // rapprochement affichait un faux trou de 6 819 €).
  //
  // ABSORBÉ le 10/09 au soir : la facture est arrivée — Bill 20260909,
  // #7149 → #7506, 8 326,31 € réclamés, dont ces 5 613,02 € payés et
  // 2 713,29 € retenus. C'est exactement la manœuvre prévue par la note
  // d'origine (« dès réception : créer la SupplierBill, reporter ce montant
  // dans son paidCents, appliedTo = sa ref »).
  //
  // ⚠️ POURQUOI `appliedTo` DOIT ÊTRE RENSEIGNÉ : la dette fournisseur vaut
  // `unbilled + owed − prepaid`. Le montant vit désormais dans le `paidCents`
  // de la facture, donc dans `owed` ; le laisser aussi dans les acomptes le
  // déduirait UNE DEUXIÈME FOIS et sous-estimerait la dette de 5 613,02 €.
  // `supplierPrepaidCents()` ne compte que les `appliedTo === null`.
  {
    day: "2026-09-10",
    eurCents: 561302,
    original: "5 613,02 € (Wise EUR)",
    appliedTo: "Bill 20260909",
    note: "Absorbé par la facture 20260909 (#7149→#7506) le 10/09 : il en constitue le paidCents. L'estimation faite à l'aveugle (#7149→#7408, 5 607 à 5 625 €) était bonne à 0,2 % — la vraie facture couvre une plage plus large et 2 713,29 € en sont retenus.",
  },
  // Aucun acompte enregistré : Badr annonce le virement (montant, jour) et on
  // l'ajoute ici — jamais déduit d'une capture de solde, jamais deviné.
];

/** Acomptes pas encore absorbés par une facture — à déduire de la prochaine. */
export function supplierPrepaidCents(): number {
  return SUPPLIER_PREPAYMENTS.filter((p) => p.appliedTo === null).reduce((t, p) => t + p.eurCents, 0);
}

export function supplierPendingCreditsCents(): number {
  return SUPPLIER_PENDING_CREDITS.reduce((t, c) => t + c.estimatedCents, 0);
}

// ---------------------------------------------------------------------------
// AVOIRS À RÉCLAMER SUR DES FACTURES DÉJÀ PAYÉES (audit ligne à ligne du
// 10/09/2026, les 4 fichiers Panda repassés au peigne fin).
//
// Distinct de SUPPLIER_PENDING_CREDITS : ces montants ne sont retenus sur
// RIEN — ils sont déjà partis. Ils se réclament en avoir sur la prochaine
// facture. Les garder dans une liste séparée évite de gonfler le « contesté »
// avec de l'argent qu'on a déjà versé.
// ---------------------------------------------------------------------------
export const SUPPLIER_CLAIMS_ON_PAID_BILLS: SupplierPendingCredit[] = [
  {
    label: "#4856 facturée DEUX FOIS (facture du 01/08, payée)",
    estimatedCents: 1027,
    note: "Seul doublon de tout l'historique : deux lignes pour #4856, trackings différents (06086507176810 « SHORTSx1, POLOx2 » 24,39 € et 06086507184076 « POLOx1 » 10,27 €). Shopify ne connaît QU'UN seul colis pour cette commande (2 polos + 1 short, tracking 06086507176810) et le client n'a jamais commandé de 3e polo. La 2e ligne n'a donc pas de contrepartie : 10,27 € à rendre. Vérification : les 650 lignes du fichier ne couvrent que 649 numéros — c'est ce trou d'un qui a mis le doublon en évidence.",
  },
  {
    label: "#5458 facturée sans colis, client remboursé à 100 % (01/08, payée)",
    estimatedCents: 3922,
    note: "La ligne la plus nette de l'audit : aucun tracking sur leur facture, aucun fulfilment côté Shopify, et le client a été remboursé de 89,99 € EN ENTIER — il n'a rien gardé. On a donc payé 39,22 € pour une marchandise qui n'est jamais partie. C'est aussi le contre-exemple qui prouve que « annulée » et « non expédiée » ne sont pas la même chose : le fournisseur FACTURE parfois une commande qu'il n'expédie pas, d'où l'obligation de croiser ses factures avec Shopify plutôt que de se fier à un seul des deux.",
  },
  {
    label: "#5455, #5842, #6945, #7023 — aucune preuve d'expédition des deux côtés",
    estimatedCents: 10584,
    note: "Même test que la catégorie 1 du relevé du 10/09 (les 47 commandes, 995,05 €), appliqué cette fois aux trois factures ANTÉRIEURES : ni tracking sur leur fichier, ni fulfilment côté Shopify au 10/09. #5455 (Suisse, 17,07 €) date du 01/08, six semaines. #5842 (Belgique, 34,73 €), #6945 (Belgique, 19,29 €), #7023 (Suisse, 34,75 €). Ce n'est PAS un litige : dès qu'ils envoient les numéros de suivi, la réclamation tombe. " +
      "Garde-fou du test : on ne signale une commande que si LES DEUX sources sont muettes. Sur la seule facture du 03/09, 136 commandes sont facturées sans tracking — mais 134 sont bien fulfilled côté Shopify, donc le colis est parti et on ne dit rien. Seules #6945 et #7023 échouent aux deux.",
  },
];

// ---------------------------------------------------------------------------
// EN NOTRE DÉFAVEUR, VOLONTAIREMENT NON ENCAISSÉ — le pendant honnête de la
// liste ci-dessus, et la raison pour laquelle elle est crédible.
//
// #5535, #5576 et #5642 : Shopify montre 4 polos (+ caleçon) expédiés sous UN
// seul tracking, la facture du 14/08 ne porte qu'un « POLOx1 » avec un tracking
// DIFFÉRENT — 12,23 / 9,65 / 12,91 € facturés au lieu de ~31 €. Le fournisseur
// nous a SOUS-facturés d'environ 59,78 €.
//
// Le COGS reste INCHANGÉ sur ces trois commandes : le colis complet est bien
// parti, la facturation peut revenir. On le signale à Claire au lieu de
// l'empocher — et on ne l'inscrit nulle part comme un gain.
// ---------------------------------------------------------------------------
export const SUPPLIER_UNDERBILLED_CENTS = 5978;

// ---------------------------------------------------------------------------
// DOSSIERS OUVERTS — faute fournisseur établie, montant PAS ENCORE dû
// (trouvés par Badr le 10/09 au soir, vérifiés dans Shopify le même jour).
//
// Troisième liste, et la distinction est délibérée :
//   • SUPPLIER_PENDING_CREDITS  = retenu sur la facture du 09/09 (2 713,29 €)
//   • SUPPLIER_CLAIMS_ON_PAID_BILLS = avoir à réclamer, argent déjà versé
//   • ici = RIEN n'est encore sorti ni réclamé. Sur ces deux commandes le
//     client n'a PAS été remboursé (`refunded_cents` = 0, aucun litige) : la
//     perte n'existe pas encore. On ne réclame pas une perte qui n'a pas eu
//     lieu — c'est ce qui rend le reste du relevé crédible.
//
// Les deux sont postérieures au 01/07 (périmètre Panda) et ont un tracking,
// donc le colis a été facturé. Mais elles sont sous #4814 : aucune facture de
// cette période n'est en notre possession, le COGS est donc PRIXÉ sur leurs
// grilles, pas cité d'un document — et le relevé le dit noir sur blanc.
// ---------------------------------------------------------------------------
export const SUPPLIER_OPEN_CASES: SupplierPendingCredit[] = [
  {
    label: "#2870 — mauvais article envoyé, jamais corrigé depuis le 26/08",
    estimatedCents: 6224,
    note: "01/07, France, 179,98 € payés pour POLOx4 + SHORTSx3, expédiée le 03/07 (YT2621500711304158). Un tee-shirt noir est arrivé à la place d'un polo et d'un short. Correction promise le 26/08, toujours rien. " +
      "49,44 € = la valeur RÉELLEMENT PAYÉE des 2 articles, au prorata du panier (124,98 € catalogue × 179,98 ÷ 454,93) et non au prix affiché — la commande est un bundle remisé, facturer le prix catalogue serait gonfler. " +
      "12,80 € = le COGS de ces 2 articles à leurs propres tarifs (1 polo au palier 4 : 6,69 € · 1 short au palier 3 : 6,11 €). " +
      "PAS de coût publicitaire réclamé : le client garde 5 articles sur 7, la vente tient. Le réclamer serait indéfendable.",
  },
  {
    label: "#4486 — tracking contredit par le transporteur",
    estimatedCents: 26780,
    note: "14/07, France, 179,97 € pour POLOx4 + SSx1 + SHORTSx1. Tracking fourni : DOFR9010176136745HD, WanbExpress — un transporteur qui n'apparaît sur AUCUNE de leurs 4 factures, où tout ce qui part vers la France est en YunExpress. La Poste annonce le colis encore chez nous, donc jamais remis. Client sans rien depuis le 14/07. " +
      "179,97 € de CA (remboursable, PAS encore remboursé) + 9,94 € de frais de carte que Shopify garde sur un remboursement (7,28 + 2,66, lus sur la transaction) + 35,00 € de pub (CAC mesuré, commande totalement perdue) + 42,89 € de marchandise (26,76 polos + 13,13 chemise/short + 3,00 taxe UE). " +
      "Une preuve de remise au transporteur annule la totalité de la ligne — c'est ce qu'on leur demande d'abord.",
  },
];

/** 330,04 € annoncés mais PAS encore dus — jamais mélangés au contesté. */
export function supplierOpenCasesCents(): number {
  return SUPPLIER_OPEN_CASES.reduce((t, c) => t + c.estimatedCents, 0);
}

/**
 * TOTAL RÉCLAMÉ AU FOURNISSEUR, toutes natures confondues : 3 198,66 €.
 *
 * Badr, 10/09 : « le chiffre demandé au fournisseur n'a pas bougé alors que
 * je t'ai rajouté des choses où il a merdé ». Il avait raison — on ajoutait
 * des catégories au relevé sans qu'AUCUN total ne les additionne. Cette
 * fonction existe pour qu'un ajout futur se voie forcément quelque part.
 *
 * Les trois natures restent séparées à l'affichage (elles n'ont pas le même
 * statut : retenu / déjà versé / pas encore dû), mais elles ont désormais UNE
 * somme, et c'est elle qu'on met en tête du relevé.
 */
export function supplierTotalClaimedCents(): number {
  return supplierDisputedCents() + supplierClaimsOnPaidBillsCents() + supplierOpenCasesCents();
}

export function supplierClaimsOnPaidBillsCents(): number {
  return SUPPLIER_CLAIMS_ON_PAID_BILLS.reduce((t, c) => t + c.estimatedCents, 0);
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


// ---------------------------------------------------------------------------
// 🏭 ANCIEN FOURNISSEUR (avant Panda) — Badr 08/09.
//
// Jusqu'au 30/06, les commandes étaient produites par un autre fournisseur,
// payé depuis le Revolut d'Adnane, environ 5 % plus cher que Panda (« remet
// 5 % et pas 10 % »). Panda a commencé le 01/07. Le moteur COGS ne connaît que
// les prix Panda : sur cette période, le coût réel est donc sous-estimé.
//
// Le surcoût est appliqué À LA LECTURE, jour par jour, partout où le COGS des
// agrégats est lu (onglets, rapprochement, brief) — jamais réécrit en base :
// une seule règle, un seul endroit, et on peut la retirer d'un trait. Tout
// tombe avant le 14/07 : 100 % Adnane, le net de Badr ne bouge pas.
// ---------------------------------------------------------------------------

export const OLD_SUPPLIER_LAST_DAY = "2026-06-30";
export const OLD_SUPPLIER_MARKUP = 0.05;

/** Surcoût (centimes) à ajouter au COGS d'un jour donné — 0 dès le 01/07. */
export function oldSupplierExtraCents(day: string, cogsCents: number): number {
  if (day > OLD_SUPPLIER_LAST_DAY) return 0;
  return Math.round(cogsCents * OLD_SUPPLIER_MARKUP);
}
