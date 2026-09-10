// ---------------------------------------------------------------------------
// AJUSTEMENTS PAR COMMANDE — deux réalités que le pipeline Shopify ne voit pas
// tout seul, corrigées à l'agrégat (10/09/2026).
//
// Même principe que juneRealFees.ts : une liste figée, datée, vérifiable,
// consommée par aggregate.ts. La base `orders` n'est pas modifiée — seul le
// calcul du jour change, donc un vrai branchement API écrasera ces listes
// sans rien avoir à défaire.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// 1. CHARGEBACKS PERDUS — la banque a repris l'argent, personne ne le déduit
//
// Le pipeline lit les `refunds` Shopify ; un chargeback est un autre objet
// (`disputes`) qu'on ne lisait pas. Résultat constaté le 10/09 : 5 des 7
// litiges perdus n'étaient déduits NULLE PART — le CA les comptait encore.
//
// Les 2 autres litiges perdus (#1447 et #2787) ont AUSSI été remboursés côté
// Shopify : ils sont donc déjà dans `refunded_cents` et ne figurent pas ici,
// sinon on déduirait deux fois. Le garde-fou reste posé dans aggregate.ts
// (on ne déduit que ce qui dépasse le remboursement déjà enregistré).
//
// Source : Shopify, filtre `chargeback_status:*` sur les commandes + champ
// `disputes { status }`, relevé le 10/09/2026. Ce filtre fonctionne SANS le
// scope `read_shopify_payments` (seuls le motif bancaire et les frais de
// litige le réclament) — donc la lecture automatique est possible dès qu'on
// branche la synchro ; cette liste n'est qu'un rattrapage en attendant.
// ---------------------------------------------------------------------------

/** Commandes du store FR dont le litige est PERDU et dont l'argent n'est
 * repris nulle part ailleurs. Clé = `order_name`, valeur = centimes repris. */
export const LOST_CHARGEBACKS_FR: ReadonlyMap<string, number> = new Map([
  ["#2005", 8999],
  ["#2232", 5998],
  ["#2291", 5998],
  ["#3285", 11398],
  ["#4368", 5998],
]);

/** Total repris par la banque et jamais déduit avant le 10/09 : 383,91 €. */
export function lostChargebacksTotalCents(): number {
  let total = 0;
  for (const cents of LOST_CHARGEBACKS_FR.values()) total += cents;
  return total;
}

// ---------------------------------------------------------------------------
// 2. COMMANDES SANS COLIS — un COGS qu'on n'a jamais payé
//
// Le moteur calcule le COGS dès qu'une commande existe, sans regarder si le
// colis est parti. Or le fournisseur facture le COLIS, pas la commande : pas
// d'expédition = pas de ligne de facture. Ce COGS-là est un coût fantôme.
//
// PREUVE, commande par commande (Shopify Admin API, relevé du 10/09/2026) :
// chacune des commandes listées ici est `UNFULFILLED`, avec `fulfillments: []`
// — aucun colis, aucun numéro de suivi, jamais. Ce n'est plus une déduction
// tirée de trois exemples de facture, c'est l'état de chaque commande.
//
// Recoupé avec les factures fournisseur là où on les a (#4814→#7506, les 4
// fichiers Panda) : les commandes de cette liste qui tombent dans une plage
// facturée y figurent bien à 0,00 € (#5420, #6103, #6327). Aucune ne porte de
// montant. En dessous de #4814 aucune facture n'existe de notre côté (le
// ledger part du 01/08, tout ce qui précède est réputé soldé) — c'est le
// statut Shopify qui fait foi, et il est sans ambiguïté.
//
// ⚠️ N'y figurent PAS les commandes dont le colis EST parti, même mal :
//   • #1903 « Colis non livré », #5458 « Non livrable » : colis expédié et
//     facturé (39,22 € pour #5458 sur la facture du 01/08).
//   • #5599 (Croatie) et #5759 (Réunion) : facturées 0,00 € avec la mention
//     « country not covered by polo quote » MAIS avec un tracking. Le colis
//     est parti : le prix viendra, on garde le COGS. → point de vigilance.
//
// Correctif durable : stocker le statut d'expédition à la synchro et zéroer
// le COGS sur cette base. Cette liste tient le temps qu'on le fasse.
// ---------------------------------------------------------------------------

/**
 * Les 83 commandes FR `status:cancelled` de la boutique — la totalité, pas un
 * échantillon : la requête Shopify `status:cancelled` en a retourné 83, toutes
 * `UNFULFILLED` et sans aucun fulfillment.
 *
 * (La liste en comptait 81 jusqu'au 10/09 : #2213 et #2257 manquaient — elles
 * sortent du relevé exhaustif, pas d'une estimation.)
 */
const CANCELLED_BEFORE_DISPATCH_FR_NUMBERS = [
  2195, 2213, 2257, 2295, 2298, 2303, 2376, 2384, 2419, 2420, 2461, 2468, 2516,
  2554, 2560, 2564, 2604, 2606, 2667, 2696, 2699, 2711, 2754, 2765, 2821, 2833,
  2835, 2847, 2850, 2854, 2864, 2874, 2951, 2959, 2978, 2979, 2999, 3002, 3054,
  3069, 3070, 3082, 3152, 3153, 3165, 3178, 3181, 3184, 3187, 3188, 3189, 3238,
  3290, 3320, 3346, 3381, 3398, 3400, 3439, 3470, 3618, 3802, 3805, 3841, 3851,
  3888, 4025, 4168, 4221, 4258, 4315, 4324, 4383, 4422, 4458, 4493, 4518, 4528,
  4559, 4578, 4589, 4615, 6327,
] as const;

/**
 * Commandes JAMAIS EXPÉDIÉES mais pas marquées « annulée » dans Shopify :
 * remboursées à 100 %, `UNFULFILLED`, `fulfillments: []`. Le client a été
 * remboursé sans que le colis parte — même réalité comptable qu'une annulation,
 * autre étiquette. Relevé exhaustif du 10/09 : ce sont les 5 seules commandes
 * antérieures à #7517 dans ce cas (les suivantes sont le flux en cours, pas
 * encore expédié, dont le coût arrivera bien).
 *
 * Deux d'entre elles sont doublement prouvées, elles tombent dans une plage
 * facturée et le fournisseur les y a mises à 0,00 € :
 *   • #5420 (Monaco) — facture du 01/08, ligne « POLOx4, CALECONx1 » à 0,00 €
 *   • #6103 (Monaco) — facture du 03/09, réduite à « FREE_DIGITALx1 », 0,00 €
 */
const NEVER_DISPATCHED_FR_NUMBERS = [2409, 2965, 3277, 5420, 6103] as const;

/** Commandes FR annulées avant expédition (statut Shopify `cancelled`). */
export const CANCELLED_BEFORE_DISPATCH_FR: ReadonlySet<string> = new Set(
  CANCELLED_BEFORE_DISPATCH_FR_NUMBERS.map((n) => `#${n}`)
);

/** Commandes FR remboursées sans expédition, non marquées annulées. */
export const NEVER_DISPATCHED_FR: ReadonlySet<string> = new Set(
  NEVER_DISPATCHED_FR_NUMBERS.map((n) => `#${n}`)
);

/**
 * Toutes les commandes FR dont AUCUN colis n'est parti : 88 au total, qui
 * portent 2 266,84 € de COGS et de taxe UE jamais payés au fournisseur.
 * C'est cet ensemble que l'agrégat met à zéro — la distinction entre les deux
 * sources reste au-dessus, pour qu'on sache d'où vient chaque numéro.
 */
export const NO_PARCEL_FR: ReadonlySet<string> = new Set([
  ...CANCELLED_BEFORE_DISPATCH_FR,
  ...NEVER_DISPATCHED_FR,
]);

// ---------------------------------------------------------------------------
// API consommée par aggregate.ts
// ---------------------------------------------------------------------------

export interface OrderAdjustment {
  /** Centimes repris par la banque sur un litige perdu (0 si aucun). */
  lostChargebackCents: number;
  /** true = aucun colis n'est jamais parti → COGS et taxe UE à zéro. */
  noParcelSent: boolean;
}

/**
 * Ajustements connus pour une commande. `store` autre que FR → rien : les
 * relevés du 10/09 ne couvrent que la boutique FR (97 % du volume), et on
 * n'invente pas ce qu'on n'a pas mesuré.
 */
export function orderAdjustment(store: string, orderName: string): OrderAdjustment {
  if (store !== "FR") return { lostChargebackCents: 0, noParcelSent: false };
  return {
    lostChargebackCents: LOST_CHARGEBACKS_FR.get(orderName) ?? 0,
    noParcelSent: NO_PARCEL_FR.has(orderName),
  };
}
