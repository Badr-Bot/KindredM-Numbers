"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const INTERVAL_MS = 5 * 60 * 1000;

/**
 * Zéro clic, en continu : déclenche la synchro incrémentale (commandes +
 * spend Meta + agrégats) à l'ouverture du dashboard, puis toutes les 5 min
 * tant que l'onglet reste ouvert. Personne n'a jamais à cliquer sur un
 * bouton « Actualiser » ou « Backfill » pour voir des chiffres à jour —
 * l'endpoint est throttlé côté serveur, donc sans risque même si plusieurs
 * personnes ont le dashboard ouvert en même temps.
 */
export function LiveSync() {
  const router = useRouter();
  const runningRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function tick() {
      if (runningRef.current) return;
      runningRef.current = true;
      try {
        const res = await fetch("/api/sync", { method: "POST" });
        const json: { ran?: boolean } = await res.json().catch(() => ({}));
        if (!cancelled && json.ran) router.refresh();
      } catch {
        // Silencieux : la prochaine visite ou le cron de minuit rattraperont.
      } finally {
        runningRef.current = false;
      }
    }

    tick();
    const id = setInterval(tick, INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [router]);

  return null;
}
