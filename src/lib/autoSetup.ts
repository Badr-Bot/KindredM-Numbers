import { createSupabaseServerClient } from "./supabase";
import { discoverProducts } from "./discover";
import { runFullBackfill, type BackfillResult } from "./backfillRun";

/**
 * Initialisation automatique « zéro clic » : découverte produits → mapping
 * auto → backfill, sans intervention. Déclenchée à l'ouverture du site quand
 * la base est vide (et par le cron en filet de sécurité).
 *
 * Garde-fou §5 (fail loudly) : le mapping n'est automatique QUE si chaque
 * titre découvert est reconnu avec certitude (polo ou upsell du catalogue).
 * Un titre inconnu arrête tout et est remonté pour validation manuelle sur
 * /admin — aucun produit n'est jamais mappé silencieusement au hasard.
 */

export interface AutoSetupResult {
  ok: boolean;
  stage: "discover" | "mapping" | "backfill" | "done";
  storeErrors?: string[];
  unmappedTitles?: string[];
  mapped?: number;
  backfill?: BackfillResult;
  reason?: string;
  /** Mode partiel : problèmes non bloquants (store ignoré, spend absent…). */
  warnings?: string[];
}

/** true si la base est vide (pas de mapping ou pas d'agrégats) → init à faire. */
export async function isSetupNeeded(): Promise<boolean> {
  const supabase = createSupabaseServerClient();
  const { count: mapCount, error: e1 } = await supabase
    .from("products_map")
    .select("*", { count: "exact", head: true });
  if (e1) return false; // base injoignable : ne pas déclencher l'init
  if ((mapCount ?? 0) === 0) return true;
  const { count: aggCount, error: e2 } = await supabase
    .from("daily_aggregates")
    .select("*", { count: "exact", head: true });
  if (e2) return false;
  return (aggCount ?? 0) === 0;
}

export async function runAutoSetup(): Promise<AutoSetupResult> {
  const supabase = createSupabaseServerClient();

  // 1 — Découverte. Mode partiel : un store en échec est ignoré et signalé,
  // on ne bloque que si AUCUN store ne répond.
  const stores = await discoverProducts();
  const storeErrors = stores.filter((s) => s.error).map((s) => `${s.market}: ${s.error}`);
  const okStores = stores.filter((s) => !s.error);
  if (okStores.length === 0) {
    return { ok: false, stage: "discover", storeErrors };
  }
  const warnings = storeErrors.map((e) => `Store ignoré — ${e}`);

  // 2 — Mapping automatique, uniquement à coup sûr.
  const rows: Array<{ store: string; title_pattern: string; product_key: string; unit_group: string }> = [];
  const unmappedTitles: string[] = [];
  for (const store of okStores) {
    for (const t of store.titles) {
      if (t.guessedProductKey === "A_VALIDER") {
        unmappedTitles.push(`${store.market}: ${t.title}`);
      } else {
        rows.push({
          store: store.market,
          title_pattern: t.title,
          product_key: t.guessedProductKey,
          unit_group: t.guessedUnitGroup,
        });
      }
    }
  }
  if (unmappedTitles.length > 0) {
    return { ok: false, stage: "mapping", unmappedTitles, warnings };
  }
  if (rows.length === 0) {
    return { ok: false, stage: "discover", reason: "Aucun produit trouvé.", warnings };
  }

  const { error: mapError } = await supabase
    .from("products_map")
    .upsert(rows, { onConflict: "store,title_pattern" });
  if (mapError) {
    return { ok: false, stage: "mapping", reason: mapError.message, warnings };
  }

  // 3 — Backfill (idempotent, tolérant : stores/Meta en échec → warnings).
  try {
    const backfill = await runFullBackfill();
    warnings.push(...backfill.warnings);
    return { ok: true, stage: "done", mapped: rows.length, backfill, warnings };
  } catch (err) {
    return { ok: false, stage: "backfill", reason: (err as Error).message, warnings };
  }
}
