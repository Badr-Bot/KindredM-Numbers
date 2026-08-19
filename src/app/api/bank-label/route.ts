import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase";

const KINDS = ["SOCIETE", "PERSO_BADR", "PERSO_FAHD", "IGNORER"];

// 🛃 Contrôle — affectation d'une transaction bancaire à une case.
// Chaque euro sorti doit finir dans exactement une case (règle Badr 19/08).
export async function POST(request: NextRequest) {
  try {
    const { bank, txId, kind, note } = (await request.json()) as {
      bank?: string;
      txId?: string;
      kind?: string;
      note?: string;
    };
    if (!bank || !txId) return NextResponse.json({ ok: false, reason: "bank/txId manquants" }, { status: 400 });
    if (!kind || !KINDS.includes(kind)) return NextResponse.json({ ok: false, reason: "kind invalide" }, { status: 400 });
    const supabase = createSupabaseServerClient();
    const { error } = await supabase
      .from("bank_tx_labels")
      .upsert({ bank, tx_id: txId, kind, note: note?.trim().slice(0, 200) || null });
    if (error) {
      const missing = /does not exist|relation|schema cache/i.test(error.message);
      return NextResponse.json(
        { ok: false, reason: missing ? "Table absente — colle la migration 0013_bank_labels.sql dans Supabase (SQL Editor → Run)." : error.message },
        { status: 500 }
      );
    }
    revalidateTag("bank", { expire: 0 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, reason: (err as Error).message }, { status: 500 });
  }
}
