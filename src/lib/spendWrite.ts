import type { SupabaseClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Écriture du spend Meta — protégée contre la contrainte CHECK sur `market`.
//
// Le marché CA (Canada / NIRA Burn, 06/08) n'est accepté qu'une fois la
// migration 0012 appliquée. Sans filet, une seule ligne market='CA' fait
// rejeter par Postgres le LOT ENTIER (upsert = une seule instruction) : le
// spend de TOUTES les campagnes du lot disparaîtrait silencieusement, car
// l'erreur n'était pas relue. C'est exactement le scénario du bug UNMAPPED du
// 22/07 (1 158 € affichés au lieu de 1 275,75 €), en pire.
//
// Stratégie : on tente l'écriture normale ; si la contrainte la refuse, on
// rebascule les lignes CA sur UNMAPPED (valeur toujours autorisée, et déjà
// comptée dans le total GLOBAL — voir aggregate.ts) et on réessaie. Le spend
// reste donc TOUJOURS dans le net, même migration non appliquée ; il se
// reclassera tout seul sur CA au passage suivant, une fois le SQL collé.
// ---------------------------------------------------------------------------

const FALLBACK_MARKET = "UNMAPPED";

export interface SpendRowForWrite {
  market: string;
  [key: string]: unknown;
}

export interface SpendWriteResult {
  /** true si des lignes CA ont dû être rétrogradées faute de migration 0012. */
  downgradedToUnmapped: boolean;
  /** Message d'erreur si même le repli a échoué (jamais silencieux). */
  error?: string;
}

function looksLikeMarketConstraintError(message: string): boolean {
  return /check constraint|violates check|market_check/i.test(message);
}

/**
 * Upsert un lot de lignes meta_spend. Ne jette jamais : renvoie l'état, à
 * charge de l'appelant de le remonter dans les avertissements de synchro.
 */
export async function upsertSpendRows(
  supabase: SupabaseClient,
  rows: SpendRowForWrite[]
): Promise<SpendWriteResult> {
  if (rows.length === 0) return { downgradedToUnmapped: false };

  const { error } = await supabase.from("meta_spend").upsert(rows);
  if (!error) return { downgradedToUnmapped: false };

  const hasCa = rows.some((r) => r.market === "CA");
  if (!hasCa || !looksLikeMarketConstraintError(error.message)) {
    return { downgradedToUnmapped: false, error: error.message };
  }

  const retryRows = rows.map((r) => (r.market === "CA" ? { ...r, market: FALLBACK_MARKET } : r));
  const { error: retryError } = await supabase.from("meta_spend").upsert(retryRows);
  if (retryError) return { downgradedToUnmapped: true, error: retryError.message };
  return { downgradedToUnmapped: true };
}

/** Avertissement lisible par Badr, à afficher tel quel dans la synchro. */
export const CA_MIGRATION_WARNING =
  "⚠️ Marché Canada (NIRA) pas encore autorisé en base : le spend est " +
  "temporairement classé « non affecté » (il reste bien compté dans le total " +
  "global). Colle la migration 0012 dans Supabase pour qu'il bascule sur CA.";
