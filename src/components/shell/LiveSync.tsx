"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const INTERVAL_MS = 5 * 60 * 1000;

/**
 * Zéro clic, en continu : déclenche la synchro incrémentale (commandes +
 * spend Meta + agrégats) à l'ouverture du dashboard, puis toutes les 5 min
 * tant que l'onglet reste ouvert. Personne n'a jamais à cliquer sur un
 * bouton « Actualiser » ou « Backfill » pour voir des chiffres à jour —
 * l'endpoint est throttlé côté serveur, donc sans risque même si plusieurs
 * personnes ont le dashboard ouvert en même temps.
 *
 * Indicateur visible pendant la synchro (discret, coin bas-droit) : un
 * correctif de données peut déclencher un recalcul complet qui prend 1-2
 * min (voir incrementalSync.ts) — sans retour visuel, ça ressemble à une
 * page figée et pousse à recharger, ce qui relance la synchro depuis zéro.
 */
export function LiveSync() {
  const router = useRouter();
  const runningRef = useRef(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function tick() {
      if (runningRef.current) return;
      runningRef.current = true;
      setSyncing(true);
      try {
        const res = await fetch("/api/sync", { method: "POST" });
        const json: { ran?: boolean } = await res.json().catch(() => ({}));
        if (!cancelled && json.ran) router.refresh();
      } catch {
        // Silencieux : la prochaine visite ou le cron de minuit rattraperont.
      } finally {
        runningRef.current = false;
        if (!cancelled) setSyncing(false);
      }
    }

    tick();
    const id = setInterval(tick, INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [router]);

  if (!syncing) return null;
  return (
    <div className="fixed bottom-3 right-3 z-50 flex items-center gap-1.5 rounded border border-phosphor/30 bg-terminal/95 px-2 py-1 text-[10px] text-phosphor/80 shadow-lg backdrop-blur">
      <span className="inline-block animate-spin">↻</span>
      synchro en cours…
    </div>
  );
}
