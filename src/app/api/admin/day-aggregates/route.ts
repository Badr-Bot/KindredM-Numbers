import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase";

// Lecture BRUTE de daily_aggregates pour un jour donné — outil de diagnostic.
// Créé le 07/08 : Badr contestait le net France du matin (−168 € affichés là
// où le recalcul manuel des mêmes commandes donnait ≈ −26 €) et le poste
// gonflé n'était identifiable qu'en lisant la ligne réelle (l'environnement
// de Claude ne joint ni Vercel ni Supabase directement — c'est un runner
// GitHub qui appelle cette route). Read-only, aucun secret exposé.
export async function GET(request: NextRequest) {
  const day = request.nextUrl.searchParams.get("day");
  if (!day || !/^\d{4}-\d{2}-\d{2}$/.test(day)) {
    return NextResponse.json({ ok: false, reason: "paramètre ?day=YYYY-MM-DD requis" }, { status: 400 });
  }
  const supabase = createSupabaseServerClient();

  // ?raw=orders : lit la table orders BRUTE (pas daily_aggregates) pour ce
  // jour — diagnostic 08/08 : un backfill déclarait des commandes écrites
  // (ordersByStore) mais daily_aggregates restait vide pour certains jours ;
  // ce mode isole si le problème est à l'écriture (orders) ou au recalcul
  // (daily_aggregates).
  if (request.nextUrl.searchParams.get("raw") === "orders") {
    const { data, error } = await supabase
      .from("orders")
      .select("id, day, store, order_name, created_at_utc, total_cents")
      .eq("day", day)
      .order("store", { ascending: true });
    if (error) return NextResponse.json({ ok: false, reason: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, day, count: data?.length ?? 0, rows: data });
  }

  const { data, error } = await supabase
    .from("daily_aggregates")
    .select("*")
    .eq("day", day)
    .order("market", { ascending: true });
  if (error) return NextResponse.json({ ok: false, reason: error.message }, { status: 500 });

  // Contrôle de cohérence inline : net doit valoir CA−spend−COGS−taxe−frais.
  const rows = (data ?? []).map((r) => {
    const recomputed =
      (r.ca_cents ?? 0) - (r.spend_cents ?? 0) - (r.cogs_cents ?? 0) - (r.tax_cents ?? 0) - (r.fees_cents ?? 0);
    return { ...r, identity_ok: recomputed === (r.net_cents ?? 0), identity_delta_cents: (r.net_cents ?? 0) - recomputed };
  });
  return NextResponse.json({ ok: true, day, rows });
}
