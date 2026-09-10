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
// 2. COMMANDES ANNULÉES AVANT EXPÉDITION — un COGS qu'on n'a jamais payé
//
// Le moteur calcule le COGS dès qu'une commande existe, sans regarder si le
// colis est parti. Or une commande annulée n'est jamais expédiée, donc jamais
// facturée par le fournisseur : vérifié sur ses factures, il facture 0,00 €
// les commandes annulées (#6794, #6327, #6103 sur celle du 03/09).
//
// Ces 81 commandes portent 2 061,70 € de COGS + 21,00 € de taxe UE dans la
// base — un coût fantôme qui SOUS-ESTIME le bénéfice de 2 082,70 €.
//
// Source : note de remboursement Shopify « Commande annulée », relevée sur
// les 181 commandes remboursées le 10/09/2026. Le motif est confirmé par nos
// propres réponses aux clients (« nous n'avons pas pu assurer l'expédition »).
// 70 d'entre elles partaient vers des destinations qu'on ne livre pas
// (Guadeloupe, Nouvelle-Calédonie, Martinique…) — problème de configuration
// boutique, pas de fournisseur, mais le COGS est faux dans les deux cas.
//
// ⚠️ N'y figurent PAS les commandes « Colis non livré » (#1903) et « Non
// livrable » (#5458) : le colis est parti, donc le fournisseur l'a facturé.
//
// Correctif durable : stocker le statut d'expédition à la synchro et zéroer
// le COGS sur cette base. Cette liste tient le temps qu'on le fasse.
// ---------------------------------------------------------------------------

const CANCELLED_BEFORE_DISPATCH_FR_NUMBERS = [
  2195, 2295, 2298, 2303, 2376, 2384, 2419, 2420, 2461, 2468, 2516, 2554, 2560,
  2564, 2604, 2606, 2667, 2696, 2699, 2711, 2754, 2765, 2821, 2833, 2835, 2847,
  2850, 2854, 2864, 2874, 2951, 2959, 2978, 2979, 2999, 3002, 3054, 3069, 3070,
  3082, 3152, 3153, 3165, 3178, 3181, 3184, 3187, 3188, 3189, 3238, 3290, 3320,
  3346, 3381, 3398, 3400, 3439, 3470, 3618, 3802, 3805, 3841, 3851, 3888, 4025,
  4168, 4221, 4258, 4315, 4324, 4383, 4422, 4458, 4493, 4518, 4528, 4559, 4578,
  4589, 4615, 6327,
] as const;

/** Commandes FR annulées avant expédition : leur COGS et leur taxe UE n'ont
 * jamais été payés au fournisseur. Clé = `order_name`. */
export const CANCELLED_BEFORE_DISPATCH_FR: ReadonlySet<string> = new Set(
  CANCELLED_BEFORE_DISPATCH_FR_NUMBERS.map((n) => `#${n}`)
);

// ---------------------------------------------------------------------------
// API consommée par aggregate.ts
// ---------------------------------------------------------------------------

export interface OrderAdjustment {
  /** Centimes repris par la banque sur un litige perdu (0 si aucun). */
  lostChargebackCents: number;
  /** true = commande annulée avant expédition → COGS et taxe UE à zéro. */
  cancelledBeforeDispatch: boolean;
}

/**
 * Ajustements connus pour une commande. `store` autre que FR → rien : les
 * relevés du 10/09 ne couvrent que la boutique FR (97 % du volume), et on
 * n'invente pas ce qu'on n'a pas mesuré.
 */
export function orderAdjustment(store: string, orderName: string): OrderAdjustment {
  if (store !== "FR") return { lostChargebackCents: 0, cancelledBeforeDispatch: false };
  return {
    lostChargebackCents: LOST_CHARGEBACKS_FR.get(orderName) ?? 0,
    cancelledBeforeDispatch: CANCELLED_BEFORE_DISPATCH_FR.has(orderName),
  };
}
