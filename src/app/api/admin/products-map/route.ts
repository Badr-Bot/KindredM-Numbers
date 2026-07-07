import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase";

interface MappingRow {
  store: string;
  title_pattern: string;
  product_key: string;
  unit_group: "polo" | "upsell";
}

// GET : nombre d'entrées déjà chargées (pour savoir si /admin doit proposer
// "découvrir" ou "déjà fait"). POST : upsert le mapping revu par l'utilisateur.
export async function GET() {
  const supabase = createSupabaseServerClient();
  const { count, error } = await supabase
    .from("products_map")
    .select("*", { count: "exact", head: true });
  if (error) return NextResponse.json({ ok: false, reason: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, count: count ?? 0 });
}

export async function POST(request: NextRequest) {
  let body: { rows?: MappingRow[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, reason: "JSON invalide." }, { status: 400 });
  }

  const rows = body.rows ?? [];
  if (rows.length === 0) {
    return NextResponse.json({ ok: false, reason: "Aucune ligne à charger." }, { status: 400 });
  }
  const invalid = rows.find(
    (r) => !r.store || !r.title_pattern || !r.product_key || !r.unit_group
  );
  if (invalid) {
    return NextResponse.json({ ok: false, reason: "Ligne incomplète détectée." }, { status: 400 });
  }

  const supabase = createSupabaseServerClient();
  const { error } = await supabase.from("products_map").upsert(
    rows.map((r) => ({
      store: r.store,
      title_pattern: r.title_pattern,
      product_key: r.product_key,
      unit_group: r.unit_group,
    })),
    { onConflict: "store,title_pattern" }
  );
  if (error) return NextResponse.json({ ok: false, reason: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, count: rows.length });
}
