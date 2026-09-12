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
    // RETENU AU 12/09 = 351,90 € (était 2 713,29 € sur le relevé du 10/09).
    // Après trois jours d'échanges avec Claire (10 → 12/09), le relevé a été
    // repris ligne à ligne — détail et preuves dans
    // NIVA\Fournisseur\PANDA-DOSSIER-FACTURES.md (fait foi) :
    //
    //   A1.  54,02 € — #7173 et #7484 : seules commandes vraiment non parties
    //        (adresses incomplètes ; seule ligne « fulfilled » = l'e-book).
    //        Les 45 autres des « 47 sans tracking » ont été expédiées le 10/09,
    //        le lendemain de la facture — Claire avait raison, elles sont payées.
    //        ✅ accordé par Claire : retiré de la facture, re-facturé au départ.
    //   A2.   4,40 € — comptage size-up : 6 163 pièces facturées, 6 119 polos
    //        recomptés sur SES lignes #4815→#7506 (44 × 0,10 €). ✅ accordé.
    //        L'ancien prorata « 3 des 39 réexpéditions » (47,41 €) était faux.
    //   B2. 175,00 € — publicité perdue : 5 commandes jamais expédiées, 0 ligne
    //        partie, remboursées à 100 % (#2850, #3618, #4458, #4615, #5458)
    //        × 35 € de CAC mesuré. ⏳ Claire conteste. Antérieures à #4814 : on
    //        ne réclame que la pub, jamais la marchandise.
    //   B3. 118,48 € — #4079, #5649 : erreurs d'expédition, clients dédommagés
    //        (107,99 €) + frais de carte Shopify (10,49 €). ⏳ non abordé.
    //
    // RETIRÉ PAR NOUS (erreurs de notre côté, reconnues par écrit) :
    //   • 995,05 → 54,02 € : 45 des 47 commandes étaient bien parties.
    //   • 842,24 € (11 commandes annulées) : antérieures aux factures qu'on
    //     détient, marchandise non prouvable — seule la pub reste (B2).
    //   • 253,21 € chargebacks #3285/#4368 : colis LIVRÉS (18 jours), fraude
    //     client, affaire de banque — pas de Claire. Et −70 € de pub avec.
    //   • 455,00 → 175,00 € de pub (13 → 5 commandes).
    //   • 49,31 → 4,40 € (le forfait est 0,10 €/pièce, pas un forfait de
    //     réexpédition).
    //
    // LES 155,33 € d'A3 (SUPPLIER_CLAIMS_ON_PAID_BILLS) sont aussi COMPENSÉS
    // sur ce virement : à virer = 8 326,31 − 58,42 − 5 613,02 − 155,33 − 293,48
    // = 2 206,06 €. La carte affiche « payable » 2 361,39 € (dû − contesté) et,
    // séparément, les 155,33 € d'avoirs sur factures payées : la différence
    // est voulue, ce sont deux natures.
    disputedCents: 35190,
    // PARTIELLE : Badr a viré 5 613,02 € le 10/09. Le solde de 2 206,06 € est
    // ANNONCÉ pour le lundi 15/09 — il ne sera noté ici qu'une fois que Badr
    // confirme le virement (montant en $, date). Jamais avant.
    status: "partielle",
    paidCents: 561302,
    note:
      "Nouvelle plage #7149→#7506 (358 commandes du 03 au 08/09) : IRRÉPROCHABLE. Recalculée par le moteur, elle donne 7 710,05 € contre 7 710,01 € facturés — 4 CENTIMES d'écart. Croisée avec Shopify : 358 lignes = 358 commandes, contiguës, sans doublon, upsells au compte exact (124 unités). Les 2 seules différences de quantité (#7331 : 4 polos facturés sur 8 commandés · #7441 Mexique : 2 sur 3) sont JUSTES — dans les deux cas les autres lignes ont été retirées de la commande côté Shopify (current_quantity 0) ; c'est NOTRE base qui les compte encore. " +
      "PAYÉE À HAUTEUR DE 5 613,02 € le 10/09. Relevé du 10/09 (2 713,29 € retenus) REPRIS le 12/09 après échanges avec Claire : retenue justifiée 351,90 € (A1 54,02 + A2 4,40 accordés · B2 175,00 + B3 118,48 en discussion). Les 155,33 € d'avoirs sur factures payées (A3) se compensent sur le même virement → RESTE À VIRER 2 206,06 € (annoncé par Badr pour le 15/09, non encore noté). " +
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
  // État au 12/09/2026 — somme = 351,90 € = disputedCents de la Bill 20260909.
  // Source : NIVA\Fournisseur\PANDA-DOSSIER-FACTURES.md (fait foi). Les lignes du
  // relevé du 10/09 retirées par nous sont listées en commentaire de la facture.
  {
    label: "#7173, #7484 — jamais expédiées (adresses incomplètes)",
    estimatedCents: 5402,
    note: "Reste des « 47 commandes sans tracking » du relevé du 10/09 (995,05 €) : 45 ont été expédiées le 10/09, le lendemain de la facture — Claire avait raison, elles sont payées. Sur ces deux-là, la seule ligne fulfilled côté Shopify est l'e-book (numérique) ; aucun article physique n'est parti. ACCORDÉ par Claire : retiré de la facture, re-facturé au départ du colis. Action NIVA : lui envoyer les deux adresses complètes.",
  },
  {
    label: "Comptage size-up : 6 163 pièces facturées, 6 119 polos réels",
    estimatedCents: 440,
    note: "Sa ligne « size up change cost from (#4815-#7506), total 6163 pieces, cost is 616.3 euro » = 0,10 €/pièce sur toute la plage. Recompté depuis SES propres lignes de facture : 6 119 polos (7 282 pièces tous types). Écart 44 pièces × 0,10 € = 4,40 €. ACCORDÉ par Claire, elle a refait le calcul elle-même. L'ancienne ligne (47,41 €, prorata « 3 des 39 réexpéditions ») reposait sur deux erreurs de notre côté et a été retirée.",
  },
  {
    label: "Publicité perdue — 5 commandes × 35 € (#2850, #3618, #4458, #4615, #5458)",
    estimatedCents: 17500,
    note: "Cinq commandes à 0 ligne expédiée, remboursées à 100 % (quatre soldées le même jour, le 21/07 — un nettoyage, pas quatre changements d'avis). 35 € = CAC mesuré (35,05 juillet · 34,55 août · 35,43 septembre). Antérieures à #4814 : absentes des factures qu'on détient, donc on ne réclame QUE la pub, jamais la marchandise. Claire CONTESTE (« on ne garantit pas livrer partout ») — contre-preuve : ses factures portent 405 lignes Belgique (371 trackées), 21 Luxembourg (19), 5 Espagne (5). Un tracking sur l'une d'elles retire la ligne, l'offre lui a été faite par écrit. #5458 figure aussi en A3 (marchandise 39,22 €) : deux natures, pas un doublon.",
  },
  {
    label: "#4079, #5649 — erreurs d'expédition, clients dédommagés",
    estimatedCents: 11848,
    note: "Compensations versées aux clients (107,99 €) + frais de carte que Shopify ne rend jamais sur un remboursement (10,49 €). Motif écrit dans le journal de réexpéditions : « Supplier Shipping Issue » sur les deux. Jamais abordé avec Claire à ce jour.",
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
//   • SUPPLIER_PENDING_CREDITS  = retenu sur la facture du 09/09 (351,90 € au 12/09)
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
 * TOTAL RÉCLAMÉ AU FOURNISSEUR, toutes natures confondues : 837,27 € au 12/09
 * (3 198,66 € sur le relevé du 10/09, avant la reprise ligne à ligne avec Claire).
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

/**
 * À DÉDUIRE DE LA PROCHAINE FACTURE : 507,23 € au 12/09 (2 868,62 € le 10/09).
 *
 * C'est LE chiffre actionnable, celui que le fournisseur doit lire en premier
 * (Badr, 10/09 : « elle doit comprendre directement combien je dois faire en
 * virement »).
 *
 * = le retenu (351,90 €, jamais versé) + les avoirs sur factures soldées
 *   (155,33 €, déjà versés et dus en retour).
 *
 * Sur la facture du 09/09, c'est exactement ce qui manque au virement du solde :
 * 8 326,31 − 5 613,02 − 507,23 = 2 206,06 € à virer.
 *
 * Les dossiers ouverts (330,04 €) en sont VOLONTAIREMENT exclus : le client
 * n'a pas été remboursé, la perte n'existe pas, on ne la déduit pas.
 */
export function supplierToDeductNextBillCents(): number {
  return supplierDisputedCents() + supplierClaimsOnPaidBillsCents();
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
