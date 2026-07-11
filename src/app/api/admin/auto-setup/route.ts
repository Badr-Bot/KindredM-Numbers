import { NextResponse } from "next/server";
import { getDataMode } from "@/lib/data";
import { runAutoSetup } from "@/lib/autoSetup";

export const maxDuration = 300;

// Initialisation « zéro clic » — appelée automatiquement par la page
// d'accueil quand la base est vide. Idempotente : relancer est sans risque.
export async function POST() {
  if (getDataMode() !== "live") {
    return NextResponse.json(
      { ok: false, stage: "discover", reason: "Supabase non configuré (mode réel requis)." },
      { status: 400 }
    );
  }
  const result = await runAutoSetup();
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}
