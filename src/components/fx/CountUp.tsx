"use client";

import { useEffect, useRef, useState } from "react";

interface CountUpProps {
  /** valeur cible (déjà en unité d'affichage, ex. euros ou %) */
  value: number;
  format: (n: number) => string;
  durationMs?: number;
  className?: string;
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/** Compteur animé (respecte prefers-reduced-motion : saute direct à la valeur). */
export function CountUp({ value, format, durationMs = 900, className }: CountUpProps) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      // Pas d'animation : on affiche directement la valeur cible.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDisplay(value);
      fromRef.current = value;
      return;
    }

    const from = fromRef.current;
    const delta = value - from;
    if (delta === 0) {
      setDisplay(value);
      return;
    }
    const start = performance.now();

    const step = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      setDisplay(from + delta * easeOutCubic(t));
      if (t < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        fromRef.current = value;
      }
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      fromRef.current = value;
    };
  }, [value, durationMs]);

  return <span className={className}>{format(display)}</span>;
}
