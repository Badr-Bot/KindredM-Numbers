import { NextResponse } from "next/server";
import { runThrottledIncrementalSync } from "@/lib/incrementalSync";

// 300s (pas 60) : une correction de bug peut déclencher un backfill complet
// de tout l'historique (voir REQUIRED_FULL_RESYNC_VERSION), aussi long que
// le bouton manuel qu'on a supprimé — ce chemin ne s'emprunte qu'une fois
// par correctif, ensuite la synchro repasse en mode rapide.
export const maxDuration = 300;

/**
 * Synchro « zéro clic » déclenchée automatiquement par le navigateur à
 * l'ouverture du dashboard (voir LiveSync) — personne n'a jamais besoin
 * d'appuyer sur un bouton pour rafraîchir. Throttlée à 1 exécution/5 min
 * côté serveur (voir runThrottledIncrementalSync), donc peut être appelée
 * sans risque à chaque visite.
 */
export async function POST() {
  try {
    const result = await runThrottledIncrementalSync();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json({ ok: false, reason: (err as Error).message }, { status: 500 });
  }
}
