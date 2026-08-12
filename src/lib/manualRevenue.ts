import type { SupabaseClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Recettes saisies À LA MAIN (Badr, 06/08) — pour les produits dont les
// commandes ne remontent PAS dans les boutiques Shopify branchées au dashboard.
// Cas actuel : NIRA (marché US, pas de token Shopify) — Badr annonce le CA et
// le COGS à chaque vente, le spend Meta arrive lui normalement par l'API.
//
// Stocké dans `app_state` (table clé/valeur qui existe déjà) plutôt que dans
// une nouvelle table : ça évite une migration SQL à coller à la main dans
// Supabase, pour un volume de quelques lignes par jour. À basculer vers une
// vraie table le jour où ça devient un vrai flux.
//
// DEVISE : les montants sont saisis dans leur devise d'origine (USD pour NIRA)
// et convertis en EUR au taux fourni AVEC la saisie. Le taux est stocké par
// entrée : changer le taux plus tard ne réécrit jamais le passé, et on peut
// toujours refaire le calcul à la main. Jamais de taux inventé par défaut —
// une entrée sans taux explicite est refusée (convention §0 : aucun chiffre
// approximatif dans le net).
// ---------------------------------------------------------------------------

export const MANUAL_REVENUE_KEY = "manual_revenue";

export interface ManualRevenueEntry {
  /** Jour Europe/Paris (YYYY-MM-DD) auquel la recette est imputée. */
  day: string;
  /** Marché portant la ligne dans daily_aggregates (celui où tombe le spend). */
  market: string;
  /** Clé produit (registre products.ts), ex. "NIRA_BURN". */
  productKey: string;
  currency: string;
  /** Montants tels que fournis, dans `currency`, en centimes. */
  caCents: number;
  cogsCents: number;
  /** EUR pour 1 unité de `currency`. 1 si la saisie est déjà en EUR. */
  rateToEur: number;
  /** Montants convertis, EUR en centimes — figés à la saisie. */
  caEurCents: number;
  cogsEurCents: number;
  /**
   * Frais de paiement RÉELS de la période, EUR centimes (12/08). Absent =
   * frais inconnus → aucun frais compté pour cette entrée (cas NIRA, vendu
   * hors Shopify : inventer un taux serait pire que de l'assumer à 0, mais le
   * net de ces jours est optimiste de ce montant).
   */
  feesEurCents?: number;
  /** Taxe UE réelle, EUR centimes. Absent = 0 (avant le 01/07 elle n'existe pas). */
  taxEurCents?: number;
  orders: number;
  note?: string;
  savedAt: string;
}

function eurCents(amountCents: number, rateToEur: number): number {
  return Math.round(amountCents * rateToEur);
}

/** Construit une entrée validée (lève si le taux ou les montants sont absurdes). */
export function buildManualRevenueEntry(input: {
  day: string;
  market: string;
  productKey: string;
  currency: string;
  caCents: number;
  cogsCents: number;
  rateToEur: number;
  orders?: number;
  note?: string;
}): ManualRevenueEntry {
  const { day, market, productKey, currency, caCents, cogsCents, rateToEur } = input;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) throw new Error(`jour invalide: ${day}`);
  if (!Number.isFinite(rateToEur) || rateToEur <= 0) {
    throw new Error("taux de change manquant ou invalide — aucun taux par défaut n'est appliqué");
  }
  if (!Number.isFinite(caCents) || caCents < 0) throw new Error("CA invalide");
  if (!Number.isFinite(cogsCents) || cogsCents < 0) throw new Error("COGS invalide");
  return {
    day,
    market,
    productKey,
    currency: currency.toUpperCase(),
    caCents: Math.round(caCents),
    cogsCents: Math.round(cogsCents),
    rateToEur,
    caEurCents: eurCents(caCents, rateToEur),
    cogsEurCents: eurCents(cogsCents, rateToEur),
    orders: input.orders ?? 0,
    note: input.note,
    savedAt: new Date().toISOString(),
  };
}

/**
 * Best effort : ne casse JAMAIS le recalcul des agrégats. Si `app_state` est
 * absente/illisible (base fraîche, environnement de test), on renvoie zéro
 * recette manuelle plutôt que de faire échouer tout le calcul du net.
 */
// ---------------------------------------------------------------------------
// ENTRÉES EMBARQUÉES DANS LE CODE — canal de secours (06/08 au soir).
// Le canal normal (runner GitHub → POST /api/admin/manual-revenue) s'est mis
// à être ANNULÉ par GitHub après 15 min de file (« All jobs were cancelled »,
// deux fois dans la journée) : les ventes NIRA annoncées par Badr n'arrivaient
// jamais en base. Vercel, lui, déploie à chaque push sans passer par Actions :
// ces entrées voyagent donc avec le code et sont lues par la synchro sans
// dépendre d'aucun runner.
// Règle de fusion : pour un même (jour, produit), la saisie la plus récente
// (savedAt) gagne — un seed plus frais corrige une vieille entrée API, et une
// correction API postérieure bat le seed. Jamais d'addition entre les deux.
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// COMBLEMENT 21/05→03/06 — VRAIES COMMANDES (12/08, remplace le forfait plat
// du 08/08).
//
// Le backfill Shopify de l'app ne peut PAS aller chercher ces commandes :
// l'API ne renvoie rien au-delà de 60 jours sans le scope protégé
// `read_all_orders` (non accordé) — confirmé par diagnostic le 08/08.
// Le 04/06 et après ont de vraies données (<60 j à l'époque) : la fenêtre
// ci-dessous s'arrête donc au 03/06.
//
// POURQUOI CETTE CORRECTION (Badr 12/08 : « sur mai y'a 20 % de marge nette,
// donc tes COGS ne sont pas bons ») — il avait raison, et la cause était plus
// large que le COGS. L'ancienne version reposait sur un total annoncé de
// 8 338 € réparti ÉGALEMENT sur 14 jours, avec COGS/taxe/frais à ZÉRO :
//   1. COGS 0 → ~2 164 € de coût produit jamais déduit (29,5 % du CA) ;
//   2. frais 0 → ~165 € de frais de paiement jamais déduits (2,25 %) ;
//   3. le total 8 338 € lui-même était FAUX : il comptait le 04/06
//      (899,87 €, DÉJÀ compté en vrai dans la base → double comptage) et
//      n'enlevait pas les remboursements (99,98 €). Vérification :
//      7 338,82 (réel net) + 99,98 (remb.) + 899,87 (04/06) = 8 338,67 €.
//   4. la répartition à plat écrasait la réalité (21/05 = 2 commandes /
//      99,98 € contre 01/06 = 19 commandes / 1 289,80 €).
//
// Les valeurs ci-dessous sont calculées à partir des 115 vraies commandes de
// la période, exportées depuis la connexion Shopify de Badr (qui, elle, a
// l'historique complet) et conservées dans
// `__tests__/fixtures/mayGapOrders.json`. Les COGS passent par les GRILLES DU
// MOTEUR (poloCogsCents / upsellCogsCents), pas par un ratio moyen : le test
// `mayGapFill.test.ts` recalcule tout et échoue si un seul centime bouge.
// Taxe UE = 0 : la règle des 3 €/colis ne s'applique qu'à partir du 01/07.
// Frais = frais RÉELS lus sur les transactions (100 % processing_fee en mai,
// aucun frais de change à l'époque).
//
// À jeter dès que le scope read_all_orders est accordé + backfill relancé.
// ---------------------------------------------------------------------------
export const GAP_FILL_MAI_JUIN: ManualRevenueEntry[] = (
  [
    // [jour, CA net remb., COGS, frais réels, commandes]
    ["2026-05-21", 9998, 3012, 200, 2],
    ["2026-05-22", 38992, 12991, 860, 8],
    ["2026-05-23", 7999, 2899, 267, 1],
    ["2026-05-24", 45992, 14621, 865, 7],
    ["2026-05-25", 63989, 20199, 1517, 11],
    ["2026-05-26", 38994, 12769, 815, 6],
    ["2026-05-27", 74988, 25797, 1685, 13],
    ["2026-05-28", 48992, 16027, 1015, 8],
    ["2026-05-29", 40993, 12534, 1005, 6],
    ["2026-05-30", 50992, 13218, 1383, 8],
    ["2026-05-31", 20997, 5911, 390, 3],
    ["2026-06-01", 128980, 34337, 2858, 19],
    ["2026-06-02", 71989, 19252, 1543, 11],
    ["2026-06-03", 89987, 22871, 2140, 12],
  ] as const
).map(([day, caCents, cogsCents, feesCents, orders]) => ({
  day,
  market: "FR",
  productKey: "GAP_MAI_JUIN",
  currency: "EUR",
  caCents,
  cogsCents,
  rateToEur: 1,
  caEurCents: caCents,
  cogsEurCents: cogsCents,
  feesEurCents: feesCents,
  taxEurCents: 0,
  orders,
  note: "Vraies commandes Shopify (115 sur la période), COGS via les grilles du moteur. Remplace le forfait 8 338 €/14 j du 08/08. Voir mayGapFill.test.ts.",
  savedAt: "2026-08-12T14:00:00.000Z",
}));

const SEED_ENTRIES: ManualRevenueEntry[] = [
  ...GAP_FILL_MAI_JUIN,
  {
    day: "2026-08-06",
    market: "CA",
    productKey: "NIRA_BURN",
    currency: "USD",
    caCents: 12697, // 45,67 + 81,30 $
    cogsCents: 3555, // 13,29 + 22,26 $
    rateToEur: 0.8666262241, // 1 EUR = 1,1539 USD (taux fourni par Badr)
    caEurCents: 11004,
    cogsEurCents: 3081,
    orders: 2,
    note: "Seed embarqué (file GitHub en panne le 06/08)",
    savedAt: "2026-08-06T17:00:00.000Z",
  },
  {
    day: "2026-08-07",
    market: "CA",
    productKey: "NIRA_BURN",
    currency: "USD",
    caCents: 11874, // vente annoncée par Badr le 07/08 après-midi
    // COGS NON communiqué pour cette vente — 0 assumé et SIGNALÉ (jamais
    // inventé). Le net NIRA du 07/08 est optimiste d'environ ce COGS (~34 $
    // si le ratio des ventes précédentes se répète). À compléter dès que
    // Badr le donne.
    cogsCents: 0,
    rateToEur: 0.8666262241,
    caEurCents: 10290,
    cogsEurCents: 0,
    orders: 1,
    note: "Vente 118,74 $ du 07/08 (Badr). COGS à compléter.",
    savedAt: "2026-08-07T21:10:00.000Z",
  },
];

export async function readManualRevenue(supabase: SupabaseClient): Promise<ManualRevenueEntry[]> {
  try {
    const { data, error } = await supabase
      .from("app_state")
      .select("value")
      .eq("key", MANUAL_REVENUE_KEY)
      .maybeSingle();
    const fromDb: ManualRevenueEntry[] = (() => {
      if (error || !data?.value) return [];
      try {
        const parsed = JSON.parse(data.value as string);
        return Array.isArray(parsed) ? (parsed as ManualRevenueEntry[]) : [];
      } catch {
        return [];
      }
    })();
    // Fusion par (jour, produit) : la saisie la plus RÉCENTE (savedAt) gagne.
    // « La base prime toujours » aurait bloqué ce seed : la 1re vente seule
    // (45,67 $) était déjà en base via le run de midi, et aurait masqué le
    // cumul complet à 2 ventes. À l'inverse, une correction API postérieure
    // au seed le battra naturellement par sa date.
    const byKey = new Map<string, ManualRevenueEntry>();
    for (const e of [...SEED_ENTRIES, ...fromDb]) {
      const k = `${e.day}|${e.productKey}`;
      const cur = byKey.get(k);
      if (!cur || (e.savedAt ?? "") > (cur.savedAt ?? "")) byKey.set(k, e);
    }
    return [...byKey.values()].sort((a, b) =>
      a.day === b.day ? a.productKey.localeCompare(b.productKey) : a.day.localeCompare(b.day)
    );
  } catch {
    return [...SEED_ENTRIES];
  }
}

/**
 * Ajoute/remplace l'entrée d'un (jour, produit). Idempotent : re-saisir le
 * même jour écrase la valeur précédente au lieu de s'additionner — Badr
 * annonce souvent un cumul « jusqu'à maintenant » dans la journée.
 */
export async function upsertManualRevenue(
  supabase: SupabaseClient,
  entry: ManualRevenueEntry
): Promise<ManualRevenueEntry[]> {
  const current = await readManualRevenue(supabase);
  const next = current.filter((e) => !(e.day === entry.day && e.productKey === entry.productKey));
  next.push(entry);
  next.sort((a, b) => (a.day === b.day ? a.productKey.localeCompare(b.productKey) : a.day.localeCompare(b.day)));
  const { error } = await supabase
    .from("app_state")
    .upsert({ key: MANUAL_REVENUE_KEY, value: JSON.stringify(next), updated_at: new Date().toISOString() });
  if (error) throw error;
  return next;
}
