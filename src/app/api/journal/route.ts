import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase";

const TYPES = ["crea", "landing", "offre", "audience", "budget", "campagne", "autre"];

// 📓 Journal de bord — création d'un événement manuel depuis l'onglet Analyse.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { day, type, note } = body as { day?: string; type?: string; note?: string };
    if (!day || !/^\d{4}-\d{2}-\d{2}$/.test(day)) {
      return NextResponse.json({ ok: false, reason: "Date invalide." }, { status: 400 });
    }
    if (!type || !TYPES.includes(type)) {
      return NextResponse.json({ ok: false, reason: "Type invalide." }, { status: 400 });
    }
    if (!note || !note.trim()) {
      return NextResponse.json({ ok: false, reason: "Note vide." }, { status: 400 });
    }
    const supabase = createSupabaseServerClient();
    const { error } = await supabase
      .from("events")
      .insert({ day, type, note: note.trim().slice(0, 300), source: "manual" });
    if (error) {
      const missing = /does not exist|relation|schema cache/i.test(error.message);
      return NextResponse.json(
        {
          ok: false,
          reason: missing
            ? "Table absente — colle la migration 0006_journal.sql dans Supabase (SQL Editor → Run)."
            : error.message,
        },
        { status: 500 }
      );
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, reason: (err as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = (await request.json()) as { id?: number };
    if (!id) return NextResponse.json({ ok: false, reason: "id manquant" }, { status: 400 });
    const supabase = createSupabaseServerClient();
    const { error } = await supabase.from("events").delete().eq("id", id);
    if (error) return NextResponse.json({ ok: false, reason: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, reason: (err as Error).message }, { status: 500 });
  }
}
