"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const INTERVAL_MS = 5 * 60 * 1000;
// Rafraîchissement de l'écran PENDANT la synchro (29/08). Le CA est publié en
// base au milieu du cycle, avant toute la phase Meta (voir le 1er recalcul
// dans incrementalSync.ts) : n'appeler router.refresh() qu'à la fin du POST
// faisait regarder les chiffres de la synchro PRÉCÉDENTE pendant tout le
// cycle — le CA était en base depuis longtemps mais restait invisible.
const MID_REFRESH_MS = 15 * 1000;

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
      let moreWork = false;
      // Tant que le POST est en vol, on redemande la page toutes les 15 s :
      // dès que la phase commandes a publié le CA, il s'affiche, sans
      // attendre la fin de la phase Meta. Un cycle throttlé (< 15 s) ne
      // déclenche aucun de ces rafraîchissements.
      const midRefresh = setInterval(() => {
        if (!cancelled) router.refresh();
      }, MID_REFRESH_MS);
      try {
        const res = await fetch("/api/sync", { method: "POST" });
        const json: { ran?: boolean; moreWork?: boolean } = await res.json().catch(() => ({}));
        moreWork = Boolean(json.moreWork);
        if (!cancelled && json.ran) router.refresh();
      } catch {
        // Silencieux : la prochaine visite ou le cron de minuit rattraperont.
      } finally {
        clearInterval(midRefresh);
        runningRef.current = false;
        if (!cancelled) setSyncing(false);
      }
      // Resync par étapes : tant que le serveur dit qu'il reste du travail,
      // on enchaîne tout de suite (petite pause) au lieu d'attendre 5 min.
      if (!cancelled && moreWork) setTimeout(tick, 2500);
    }

    tick();
    const id = setInterval(tick, INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [router]);

  if (!syncing) return null;
  // Au-dessus de la barre de navigation (jamais par-dessus les onglets),
  // non cliquable pour ne rien bloquer en dessous.
  return (
    <div className="pointer-events-none fixed bottom-16 right-3 z-30 flex items-center gap-1.5 rounded border border-phosphor/30 bg-terminal/95 px-2 py-1 text-[10px] text-phosphor/80 shadow-lg backdrop-blur">
      <span className="inline-block animate-spin">↻</span>
      synchro en cours…
    </div>
  );
}
