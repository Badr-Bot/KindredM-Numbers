import type { ShopifyStoreConfig } from "./shopify";

// ---------------------------------------------------------------------------
// FRAIS SHOPIFY RÉELS, lus commande par commande (Badr, 06/08).
//
// Le modèle précédent appliquait 3 % forfaitaire sur le CA. Mesuré sur 50
// commandes réelles du store FR (01→06/08) : le vrai coût est de 6,54 % du CA
// (4,67 % de traitement + 1,87 % de change) — soit 2,2× plus cher, ~4 000 €
// par mois de bénéfice qui n'existait pas. Aucun taux moyen n'est fiable : sur
// le même mois on observe 2,70 / 3,70 / 4,30 / 4,99 % selon la carte utilisée.
//
// Le change (foreign_exchange_fee) n'est PAS une anomalie corrigeable : la LLC
// est américaine, Shopify convertit donc EUR → USD à chaque virement. C'est un
// coût structurel, à compter comme tel.
//
// L'API REST des transactions ne porte PAS le bloc `fees` — d'où GraphQL.
// Une seule requête couvre 250 commandes, contre un appel par commande.
// ---------------------------------------------------------------------------

const API_VERSION = "2025-01";
const PAGE = 250;

export interface OrderFees {
  processingCents: number;
  fxCents: number;
  otherCents: number;
  /** Somme des trois — le seul chiffre utilisé pour le net. */
  totalCents: number;
  /** Frais portés par des transactions REFUND (comportement non validé). */
  refundFeeCents: number;
}

export interface FeesFetchResult {
  byOrderId: Map<string, OrderFees>;
  /** Types de frais inconnus rencontrés — à signaler, jamais à ignorer. */
  unknownTypes: Set<string>;
  /** true si des transactions REFUND portaient des frais (à faire valider). */
  sawRefundFees: boolean;
}

interface GqlMoney {
  amount: string;
  currencyCode: string;
}
interface GqlFee {
  type: string | null;
  amount: (GqlMoney & { currencyCode?: string }) | null;
}
interface GqlTransaction {
  kind: string | null;
  status: string | null;
  amountSet: { shopMoney: GqlMoney | null; presentmentMoney: GqlMoney | null } | null;
  fees: GqlFee[] | null;
}
interface GqlOrderNode {
  legacyResourceId: string;
  transactions: GqlTransaction[] | null;
}

const QUERY = `query Fees($query: String!, $cursor: String) {
  orders(first: ${PAGE}, query: $query, sortKey: CREATED_AT, after: $cursor) {
    pageInfo { hasNextPage endCursor }
    edges { node {
      legacyResourceId
      transactions(first: 10) {
        kind status
        amountSet {
          shopMoney { amount currencyCode }
          presentmentMoney { amount currencyCode }
        }
        fees { type amount { amount currencyCode } }
      }
    } }
  }
}`;

function toCents(v: string | null | undefined): number {
  if (!v) return 0;
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}

function emptyFees(): OrderFees {
  return { processingCents: 0, fxCents: 0, otherCents: 0, totalCents: 0, refundFeeCents: 0 };
}

/**
 * Lit les frais réels de toutes les commandes créées entre `fromDay` et
 * `toDay` (inclus, dates Europe/Paris au format YYYY-MM-DD).
 *
 * Règles (validées avec Badr) :
 *  1. Seules les transactions status=SUCCESS comptent. Une transaction FAILURE
 *     porte quand même un bloc `fees` rempli (paiement retenté) — la compter
 *     doublerait les frais.
 *  2. Les frais = somme de `fees[].amount`, déjà en devise boutique, tout
 *     compris. On ne recalcule JAMAIS depuis `rate × montant` : sur une
 *     commande partiellement remboursée l'assiette ne correspond plus, l'écart
 *     peut dépasser 50 %.
 *  3. Les frais portés par une transaction REFUND sont comptés à part et NON
 *     déduits pour l'instant (comportement non validé). Choix prudent : ne pas
 *     déduire surestime le coût, donc sous-estime le bénéfice — l'erreur va
 *     dans le sens sûr pour décider.
 */
export async function fetchOrderFees(
  config: ShopifyStoreConfig,
  token: string,
  fromDay: string,
  toDay: string
): Promise<FeesFetchResult> {
  const byOrderId = new Map<string, OrderFees>();
  const unknownTypes = new Set<string>();
  let sawRefundFees = false;

  const search = `created_at:>=${fromDay} created_at:<=${toDay}`;
  let cursor: string | null = null;

  for (let guard = 0; guard < 200; guard++) {
    const res: Response = await fetch(`https://${config.domain}/admin/api/${API_VERSION}/graphql.json`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": token },
      body: JSON.stringify({ query: QUERY, variables: { query: search, cursor } }),
    });
    if (res.status === 429) {
      const retryAfter = Number(res.headers.get("Retry-After") ?? "2");
      await new Promise((r) => setTimeout(r, retryAfter * 1000));
      continue;
    }
    if (!res.ok) throw new Error(`frais Shopify ${config.market} : HTTP ${res.status}`);

    const body = (await res.json()) as {
      data?: { orders?: { pageInfo: { hasNextPage: boolean; endCursor: string | null }; edges: { node: GqlOrderNode }[] } };
      errors?: { message: string }[];
    };
    if (body.errors?.length) throw new Error(`frais Shopify ${config.market} : ${body.errors[0].message}`);
    const orders = body.data?.orders;
    if (!orders) break;

    for (const { node } of orders.edges) {
      // Valeur FRAÎCHE à chaque rencontre (jamais accumulée sur l'existant) :
      // si la pagination livre deux fois la même commande — pages décalées par
      // une commande arrivée pendant la lecture, même instabilité que le bug
      // du 20/07 — accumuler doublerait ses frais en silence.
      const acc = emptyFees();
      for (const t of node.transactions ?? []) {
        if (t.status !== "SUCCESS") continue; // règle 1
        const isRefund = t.kind === "REFUND";
        // PIÈGE DEVISE (trouvé le 07/08, ~140 €/jour de frais fantômes) : sur
        // une commande payée dans une devise étrangère (client TH/CA/…),
        // `fees[].amount` est renvoyé dans la DEVISE DE LA TRANSACTION, pas en
        // devise boutique — 100 THB de frais (~2,60 €) étaient comptés 100 €.
        // L'échantillon de validation initial (50 commandes) était 100 % EUR,
        // le piège y était invisible. Conversion via le ratio de la
        // transaction elle-même (shopMoney ÷ presentmentMoney) : exact, aucun
        // taux externe. Ratio indisponible → frais IGNORÉ + à défaut le
        // repli 3 % s'applique, jamais un montant dans la mauvaise devise.
        const shopCur = t.amountSet?.shopMoney?.currencyCode;
        const presAmt = Number(t.amountSet?.presentmentMoney?.amount ?? "");
        const shopAmt = Number(t.amountSet?.shopMoney?.amount ?? "");
        const fxRatio =
          Number.isFinite(presAmt) && presAmt > 0 && Number.isFinite(shopAmt) && shopAmt > 0
            ? shopAmt / presAmt
            : null;
        for (const f of t.fees ?? []) {
          const feeCur = f.amount?.currencyCode;
          let cents = toCents(f.amount?.amount);
          if (cents !== 0 && feeCur && shopCur && feeCur !== shopCur) {
            if (fxRatio === null) continue; // pas de ratio fiable → repli 3 %
            cents = Math.round(cents * fxRatio);
          }
          if (cents === 0) continue;
          if (isRefund) {
            acc.refundFeeCents += cents;
            sawRefundFees = true;
            continue; // règle 3 : jamais déduit tant que non validé
          }
          if (f.type === "processing_fee") acc.processingCents += cents;
          // `international_currency_payout_fee` = le 1 % de conversion du plan
          // Advanced (passage 08/08) : il REMPLACE `foreign_exchange_fee`
          // (1,5 %) sur les paiements carte Shopify Payments. Même nature
          // (coût de change EUR→USD de la LLC), donc même colonne — sinon la
          // ventilation affichait « change 0 » + un faux poste « autres ».
          // PayPal garde `foreign_exchange_fee` à 3 %, non couvert par le plan.
          else if (f.type === "foreign_exchange_fee" || f.type === "international_currency_payout_fee")
            acc.fxCents += cents;
          else {
            acc.otherCents += cents;
            if (f.type) unknownTypes.add(f.type);
          }
        }
      }
      acc.totalCents = acc.processingCents + acc.fxCents + acc.otherCents;
      byOrderId.set(node.legacyResourceId, acc);
    }

    if (!orders.pageInfo.hasNextPage) break;
    cursor = orders.pageInfo.endCursor;
    // Même précaution que la pagination REST : rester sous la limite d'appels.
    await new Promise((r) => setTimeout(r, 550));
  }

  return { byOrderId, unknownTypes, sawRefundFees };
}
