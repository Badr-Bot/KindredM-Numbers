import type { SupabaseClient } from "@supabase/supabase-js";
import { computeDailyAggregate, fallbackShopifyFeeCents, type Market } from "./engine";
import { MARKETS } from "./markets";
import { isExcludedCampaign } from "./meta";
import { readManualRevenue } from "./manualRevenue";

// Dérivé de MARKETS (markets.ts) et non recopié : la liste avait divergé à
// l'ajout du Canada (06/08) — CA existait dans le type et l'UI mais pas ici,
// donc aucun bucket n'était créé pour lui et TOUT le spend NIRA (comme les
// recettes manuelles) était silencieusement jeté du total GLOBAL.
const ALL_MARKETS: Market[] = [...MARKETS];

// Un spend Meta dont la campagne n'est pas encore reconnue (nom qui ne
// contient ni FR/ESP/GE/UK ni les synonymes usuels, ex. campagne "WORLD"
// fraîchement créée) est écrit avec market="UNMAPPED" — voir mapCampaignToMarket
// (§4.6). Avant ce correctif, ce bucket n'était JAMAIS lu ici (`.in("market",
// markets)` l'excluait) : la dépense disparaissait purement et simplement du
// Net/Marge du jour tant que Badr n'allait pas l'assigner manuellement dans
// Contrôle (constaté 22/07 : spend du jour affiché 1 158 € au lieu de
// 1 275,75 € réels). On l'inclut désormais TOUJOURS dans le total GLOBAL —
// coût réel, marché encore inconnu — sans jamais l'assigner à un marché au
// hasard (l'affectation reste manuelle, §4.6).
const UNMAPPED_MARKET = "UNMAPPED";

interface OrderAggInput {
  day: string;
  store: string;
  total_cents: number;
  refunded_cents: number;
  cogs_product_cents: number;
  cogs_upsells_cents: number;
  tax_eu_cents: number;
  // Frais Shopify réels (migration 0013). null = commande pas encore
  // re-scannée → repli sur l'ancien 3 %, jamais 0 (qui gonflerait le net).
  fee_total_cents?: number | null;
  fee_processing_cents?: number | null;
  fee_fx_cents?: number | null;
  fee_other_cents?: number | null;
}

interface SpendAggInput {
  day: string;
  market: string;
  spend_cents: number;
}

// PostgREST plafonne chaque réponse à ~1000 lignes : sans pagination, tout
// backfill de plus de 1000 commandes calculait le CA sur un échantillon
// tronqué (bug « le CA affiché ne correspond pas à Shopify », 15/07).
const PAGE = 1000;

async function fetchAllPages<T>(
  build: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>
): Promise<T[]> {
  const all: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await build(from, from + PAGE - 1);
    if (error) throw error;
    const rows = data ?? [];
    all.push(...rows);
    if (rows.length < PAGE) break;
  }
  return all;
}

/**
 * Recalcule daily_aggregates(day, market) depuis les données brutes (orders +
 * meta_spend) — loi §0.6 "recalcul plutôt que patch". daily_aggregates n'est
 * jamais édité à la main, uniquement réécrit ici.
 *
 * Version en masse : 3 requêtes DB au total (au lieu de ~3 par (jour, marché)
 * avec la boucle séquentielle précédente — un backfill de 6 semaines × 4
 * marchés faisait ~500 aller-retours réseau, largement la cause des
 * initialisations qui semblaient bloquées). Regroupe en mémoire, upsert par
 * lots.
 */
export async function recomputeDailyAggregatesForDays(
  supabase: SupabaseClient,
  days: Iterable<string>,
  markets: Market[] = ALL_MARKETS
): Promise<void> {
  const dayList = [...days];
  if (dayList.length === 0) return;
  const minDay = dayList.reduce((a, b) => (b < a ? b : a));
  const maxDay = dayList.reduce((a, b) => (b > a ? b : a));

  // Tri STABLE obligatoire : sans ORDER BY, la pagination .range() n'est pas
  // déterministe — une commande écrite pendant la lecture décale les pages et
  // des lignes reviennent en double (constaté 20/07 : jour compté 2×, CA et
  // commandes exactement doublés). Ceinture + bretelles : tri par clé unique
  // ET déduplication en mémoire.
  // Migration 0013 (frais réels par commande) : probe avant de demander les
  // colonnes, même filet que 0009/0010/0011 — une colonne absente ferait
  // échouer toute la requête et donc tout le recalcul.
  const { error: feeProbeError } = await supabase.from("orders").select("fee_total_cents").limit(1);
  const hasRealFees = !feeProbeError;
  const orderCols =
    "id, day, store, total_cents, refunded_cents, cogs_product_cents, cogs_upsells_cents, tax_eu_cents" +
    (hasRealFees ? ", fee_total_cents, fee_processing_cents, fee_fx_cents, fee_other_cents" : "");

  const [ordersRaw, spendRaw] = await Promise.all([
    fetchAllPages<OrderAggInput & { id: number }>((from, to) =>
      supabase
        .from("orders")
        .select(orderCols)
        .gte("day", minDay)
        .lte("day", maxDay)
        .in("store", markets)
        .order("id", { ascending: true })
        .range(from, to) as unknown as PromiseLike<{ data: (OrderAggInput & { id: number })[] | null; error: { message: string } | null }>
    ),
    fetchAllPages<SpendAggInput & { campaign_id: string; campaign_name: string | null }>((from, to) =>
      supabase
        .from("meta_spend")
        .select("day, market, campaign_id, campaign_name, spend_cents")
        .gte("day", minDay)
        .lte("day", maxDay)
        .in("market", [...markets, UNMAPPED_MARKET])
        .order("day", { ascending: true })
        .order("campaign_id", { ascending: true })
        .range(from, to) as unknown as PromiseLike<{ data: (SpendAggInput & { campaign_id: string; campaign_name: string | null })[] | null; error: { message: string } | null }>
    ),
  ]);
  const seenOrderIds = new Set<number>();
  const orders = ordersRaw.filter((o) => {
    if (seenOrderIds.has(o.id)) return false;
    seenOrderIds.add(o.id);
    return true;
  });
  const seenSpendKeys = new Set<string>();
  const spendRows = spendRaw.filter((s) => {
    // Campagnes dont le CA n'est pas mesurable ici (NIRA, 05/08) : leur spend
    // est écarté du net, sinon on déduirait une dépense sans jamais compter la
    // recette en face. Voir isExcludedCampaign (meta.ts).
    if (isExcludedCampaign(s.campaign_name)) return false;
    const k = `${s.day}|${s.campaign_id}`;
    if (seenSpendKeys.has(k)) return false;
    seenSpendKeys.add(k);
    return true;
  });

  type Bucket = {
    orders: number;
    caCents: number;
    cogsCents: number;
    cogsProductCents: number;
    cogsUpsellsCents: number;
    taxCents: number;
    refundedCents: number;
    spendCents: number;
    shopifyFeeCents: number;
    feeProcessingCents: number;
    feeFxCents: number;
    feeOtherCents: number;
    /** true si au moins une commande du jour n'a pas encore ses frais réels. */
    feesEstimated: boolean;
  };
  const key = (day: string, market: string) => `${day}|${market}`;
  const buckets = new Map<string, Bucket>();
  const emptyBucket = (): Bucket => ({
    orders: 0,
    caCents: 0,
    cogsCents: 0,
    cogsProductCents: 0,
    cogsUpsellsCents: 0,
    taxCents: 0,
    refundedCents: 0,
    spendCents: 0,
    shopifyFeeCents: 0,
    feeProcessingCents: 0,
    feeFxCents: 0,
    feeOtherCents: 0,
    feesEstimated: false,
  });

  // Initialise tous les (jour, marché) demandés à zéro, pour bien écraser
  // un ancien agrégat si les données brutes ont disparu (remboursement total, etc).
  // UNMAPPED toujours inclus : voir commentaire en tête de fichier.
  for (const day of dayList) {
    for (const market of [...markets, UNMAPPED_MARKET]) buckets.set(key(day, market), emptyBucket());
  }

  for (const o of orders ?? []) {
    const k = key(o.day, o.store);
    const b = buckets.get(k);
    if (!b) continue; // hors de la plage de jours demandée
    b.orders += 1;
    b.caCents += o.total_cents - o.refunded_cents;
    b.cogsCents += o.cogs_product_cents + o.cogs_upsells_cents;
    b.cogsProductCents += o.cogs_product_cents;
    b.cogsUpsellsCents += o.cogs_upsells_cents;
    b.taxCents += o.tax_eu_cents;
    b.refundedCents += o.refunded_cents;
    // Frais Shopify : réels si lus, sinon repli 3 % SUR CETTE COMMANDE (et non
    // sur le jour entier) — une journée à moitié re-scannée reste juste.
    const orderCa = o.total_cents - o.refunded_cents;
    if (typeof o.fee_total_cents === "number") {
      b.shopifyFeeCents += o.fee_total_cents;
      b.feeProcessingCents += o.fee_processing_cents ?? 0;
      b.feeFxCents += o.fee_fx_cents ?? 0;
      b.feeOtherCents += o.fee_other_cents ?? 0;
    } else {
      b.shopifyFeeCents += fallbackShopifyFeeCents(orderCa);
      b.feesEstimated = true;
    }
  }
  for (const s of spendRows ?? []) {
    const b = buckets.get(key(s.day, s.market));
    if (!b) continue;
    b.spendCents += s.spend_cents;
  }

  // Recettes saisies à la main (NIRA : pas de boutique Shopify branchée, CA et
  // COGS annoncés par Badr). Converties en EUR à la saisie, au taux figé dans
  // l'entrée — voir manualRevenue.ts. Ajoutées au même (jour, marché) que le
  // spend de leur campagne, pour que le total GLOBAL reste juste.
  const manualEntries = await readManualRevenue(supabase);
  for (const m of manualEntries) {
    const b = buckets.get(key(m.day, m.market));
    if (!b) continue; // hors de la plage recalculée
    b.orders += m.orders;
    b.caCents += m.caEurCents;
    b.cogsCents += m.cogsEurCents;
    b.cogsProductCents += m.cogsEurCents;
    // Frais/taxe réels quand l'entrée les porte (comblement 21/05→03/06,
    // reconstruit depuis les vraies commandes le 12/08). Absents = 0 : c'est
    // le cas NIRA, vendu hors Shopify, dont les frais ne sont pas mesurables —
    // le net de ces jours-là reste optimiste d'autant, jamais un taux inventé.
    b.taxCents += m.taxEurCents ?? 0;
    b.shopifyFeeCents += m.feesEurCents ?? 0;
    // En mai les frais étaient 100 % `processing_fee` (aucun frais de change
    // avant le passage en LLC US) — vérifié sur l'export des 115 commandes,
    // donc la ventilation reste exacte et somme bien au total.
    b.feeProcessingCents += m.feesEurCents ?? 0;
  }

  // Répartition polo/upsells du COGS (affichage Dépenses uniquement — le
  // total cogs_cents ci-dessous, seul utilisé pour le Net/Marge, contient
  // déjà les deux combinés, migration ou pas). Colonnes ajoutées par la
  // migration 0010 : probe une fois, comme pour UNMAPPED (migration 0009).
  const { error: cogsSplitProbeError } = await supabase
    .from("daily_aggregates")
    .select("cogs_product_cents")
    .limit(1);
  const hasCogsSplit = !cogsSplitProbeError;

  const rows = [...buckets.entries()].map(([k, b]) => {
    const [day, market] = k.split("|");
    const agg = computeDailyAggregate({
      orders: b.orders,
      caCents: b.caCents,
      spendCents: b.spendCents,
      cogsCents: b.cogsCents,
      taxCents: b.taxCents,
      shopifyFeeCents: b.shopifyFeeCents,
    });
    return {
      day,
      market,
      orders: agg.orders,
      ca_cents: agg.caCents,
      spend_cents: agg.spendCents,
      cogs_cents: agg.cogsCents,
      tax_cents: agg.taxCents,
      fees_cents: agg.feesCents,
      net_cents: agg.netCents,
      refunded_cents: b.refundedCents,
      ...(hasCogsSplit
        ? { cogs_product_cents: b.cogsProductCents, cogs_upsells_cents: b.cogsUpsellsCents }
        : {}),
      ...(hasRealFees
        ? {
            fee_processing_cents: b.feeProcessingCents,
            fee_fx_cents: b.feeFxCents,
            fee_other_cents: b.feeOtherCents,
          }
        : {}),
    };
  });

  // Upsert par lots de 500 (limite raisonnable côté payload/Postgres).
  // UNMAPPED est isolé dans son propre lot : la colonne `market` a une
  // contrainte CHECK ('ES','UK','DE','FR') tant que la migration 0009 n'est
  // pas collée — un rejet sur ce lot ne doit jamais faire échouer le
  // recalcul des VRAIS marchés (régression bien pire que le bug qu'il corrige).
  const CHUNK = 500;
  // Le Canada est isolé comme UNMAPPED : sa valeur n'est acceptée qu'une fois
  // la migration 0012 collée. Laissé dans le lot principal, son rejet ferait
  // échouer TOUT le recalcul (un upsert = une instruction) et figerait le
  // dashboard entier — jamais acceptable pour un marché marginal.
  const knownRows = rows.filter((r) => r.market !== UNMAPPED_MARKET && r.market !== "CA");
  const caRows = rows.filter((r) => r.market === "CA");
  const unmappedRows = rows.filter((r) => r.market === UNMAPPED_MARKET);
  for (let i = 0; i < knownRows.length; i += CHUNK) {
    const { error } = await supabase.from("daily_aggregates").upsert(knownRows.slice(i, i + CHUNK));
    if (error) throw error;
  }

  // Canada : tenté d'abord ; si la contrainte le refuse, ses montants sont
  // REVERSÉS dans la ligne UNMAPPED du même jour. Le total GLOBAL reste donc
  // exact au centime (UNMAPPED y est compté), seule la ventilation par pays
  // attend le SQL. Sans ce report, le spend NIRA disparaîtrait du net.
  let caRejected = false;
  if (caRows.length > 0) {
    const { error } = await supabase.from("daily_aggregates").upsert(caRows);
    if (error) caRejected = true;
  }
  if (caRejected) {
    const NUMERIC_FIELDS = [
      "orders", "ca_cents", "spend_cents", "cogs_cents", "tax_cents",
      "fees_cents", "net_cents", "refunded_cents", "cogs_product_cents", "cogs_upsells_cents",
    ] as const;
    const unmappedByDay = new Map(unmappedRows.map((r) => [r.day, r as Record<string, unknown>]));
    for (const ca of caRows) {
      const target = unmappedByDay.get(ca.day);
      if (!target) continue; // une ligne UNMAPPED existe toujours (initialisée plus haut)
      for (const f of NUMERIC_FIELDS) {
        const add = (ca as Record<string, unknown>)[f];
        if (typeof add !== "number") continue;
        target[f] = ((target[f] as number) ?? 0) + add;
      }
    }
  }
  for (let i = 0; i < unmappedRows.length; i += CHUNK) {
    await supabase.from("daily_aggregates").upsert(unmappedRows.slice(i, i + CHUNK));
    // Erreur ignorée ici (ex. migration 0009 pas encore appliquée) : le spend
    // UNMAPPED redevient alors invisible du total, comme avant ce correctif —
    // jamais bloquant pour le reste.
  }
}
