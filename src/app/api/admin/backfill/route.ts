import { NextResponse } from "next/server";
import { runFullBackfill } from "@/lib/backfillRun";

// Backfill complet (§7.4) déclenché depuis /admin. Peut approcher la limite
// de durée d'une fonction Vercel selon le volume d'historique : idempotent
// (upserts), donc relancer en cas de timeout est sans risque.
export const maxDuration = 300;

export async function POST() {
  try {
    const result = await runFullBackfill();
    return NextResponse.json({ ok: true, result });
  } catch (err) {
    return NextResponse.json({ ok: false, reason: (err as Error).message }, { status: 500 });
  }
}
