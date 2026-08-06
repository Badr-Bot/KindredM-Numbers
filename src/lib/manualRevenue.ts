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
export async function readManualRevenue(supabase: SupabaseClient): Promise<ManualRevenueEntry[]> {
  try {
    const { data, error } = await supabase
      .from("app_state")
      .select("value")
      .eq("key", MANUAL_REVENUE_KEY)
      .maybeSingle();
    if (error || !data?.value) return [];
    const parsed = JSON.parse(data.value as string);
    return Array.isArray(parsed) ? (parsed as ManualRevenueEntry[]) : [];
  } catch {
    return [];
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
