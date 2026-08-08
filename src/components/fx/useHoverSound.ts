"use client";

import { useCallback } from "react";
import { useSound } from "../sound/SoundProvider";

// Throttle global (pas par carte) : sinon balayer la souris sur une grille
// de cartes déclenche une rafale de sons qui se marchent dessus.
let lastHoverPlayMs = 0;

/** Petit son au survol d'une carte — souris/trackpad uniquement (jamais au
 * tactile, où "hover" n'existe pas et où ça jouerait à chaque tap). */
export function useHoverSound(minIntervalMs = 90): () => void {
  const { play } = useSound();
  return useCallback(() => {
    if (typeof window === "undefined") return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const now = performance.now();
    if (now - lastHoverPlayMs < minIntervalMs) return;
    lastHoverPlayMs = now;
    play("tick");
  }, [play, minIntervalMs]);
}
