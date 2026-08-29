import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase";
import type { ProductMapEntry } from "@/lib/engine";
import { runIncrementalSync } from "@/lib/incrementalSync";

export const maxDuration = 60;

/**
 * Clôture quotidienne (§2/§7.5) — Vercel Cron, planifié à 00:05 Europe/Paris
 * (voir vercel.json ; le décalage CET/CEST de ±1h sur l'heure UTC du trigger
 * est sans conséquence, la logique raisonne en jours calendaires Europe/
 * Paris, pas en heure de déclenchement). Filet de secours nocturne : la
 * synchro incrémentale (mêmes règles) tourne aussi en continu toute la
 * journée, déclenchée automatiquement par les visites du site (voir
 * /api/sync) — le cron garantit juste qu'une clôture a lieu même sans
 * aucune visite.
 */
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const supabase = createSupabaseServerClient();
  const { data: productsMap, error: mapError } = await supabase.from("products_map").select("*");
  if (mapError) {
    return NextResponse.json({ error: mapError.message }, { status: 500 });
  }

  // Filet de sécurité « zéro clic » : si la base n'a jamais été initialisée
  // (mapping vide), le cron fait l'init complète au lieu du rescan J-7.
  if (!productsMap || productsMap.length === 0) {
    const { runAutoSetup } = await import("@/lib/autoSetup");
    const setup = await runAutoSetup();
    return NextResponse.json({ autoSetup: setup }, { status: setup.ok ? 200 : 500 });
  }

  // Toujours COMPLET (rescan 7 j, annonces, pays, journal) : c'est la clôture
  // de la journée, elle n'a aucune contrainte de temps d'affichage. La synchro
  // auto de la journée, elle, alterne rapide/complet (voir incrementalSync.ts).
  const result = await runIncrementalSync(supabase, productsMap as ProductMapEntry[], { deep: true });
  return NextResponse.json({ ok: true, ...result });
}
