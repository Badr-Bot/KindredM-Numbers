import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { runFullBackfill } from "@/lib/backfillRun";
import { DASHBOARD_TAG, HISTORY_TAG } from "@/lib/cacheTags";

// Backfill complet (§7.4) déclenché depuis /admin. Peut approcher la limite
// de durée d'une fonction Vercel selon le volume d'historique : idempotent
// (upserts), donc relancer en cas de timeout est sans risque.
export const maxDuration = 300;

export async function POST() {
  try {
    const result = await runFullBackfill();
    // Un backfill réécrit TOUT l'historique : c'est le seul autre cas, avec la
    // clôture de nuit, où le cache du passé figé doit tomber.
    revalidateTag(DASHBOARD_TAG, "max");
    revalidateTag(HISTORY_TAG, "max");
    return NextResponse.json({ ok: true, result });
  } catch (err) {
    return NextResponse.json({ ok: false, reason: (err as Error).message }, { status: 500 });
  }
}
