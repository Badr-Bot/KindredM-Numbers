"use client";

import { useEffect, useState } from "react";
import { useSound } from "../sound/SoundProvider";

const LINES = ["WEFT", "Marchés ES · UK · DE · FR", "Chiffres à jour."];

/** Séquence de boot terminal, une seule fois par session (sessionStorage). */
export function BootOverlay() {
  // Décidée une seule fois à l'état initial (lecture seule, pas d'écriture)
  // — contrairement à une relecture de sessionStorage dans l'effet, cette
  // valeur reste stable même si React (StrictMode, dev) rejoue l'effet
  // mount→cleanup→mount : sinon la 2e passe se relit "déjà booté" (écrit par
  // la 1re) et n'reprogramme jamais le timer de fermeture → overlay bloqué.
  const [shouldBoot] = useState(() => {
    if (typeof window === "undefined") return false;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const alreadyBooted = window.sessionStorage.getItem("niva:booted") === "1";
    return !alreadyBooted && !reduce;
  });
  const [show, setShow] = useState(shouldBoot);
  const [visibleLines, setVisibleLines] = useState(0);
  const { play } = useSound();

  useEffect(() => {
    if (!shouldBoot) return;
    window.sessionStorage.setItem("niva:booted", "1");
    play("boot");

    const timers: ReturnType<typeof setTimeout>[] = [];
    LINES.forEach((_, i) => {
      timers.push(
        setTimeout(() => {
          setVisibleLines(i + 1);
          if (i > 0) play("tick");
        }, 160 + i * 150)
      );
    });
    timers.push(setTimeout(() => setShow(false), 1550));

    return () => timers.forEach(clearTimeout);
  }, [shouldBoot, play]);

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-2 bg-ink"
      style={{ animation: "boot-out 1.6s ease-in forwards" }}
      aria-hidden
    >
      <span
        className="text-lg font-bold tracking-[0.2em] text-phosphor-brand rise-in"
        style={{ opacity: visibleLines > 0 ? 1 : 0 }}
      >
        {LINES[0]}
      </span>
      <div className="text-[11px] leading-relaxed text-white/50">
        {LINES.slice(1, visibleLines).map((line, i) => (
          <div key={i} className="rise-in text-center">
            {line}
          </div>
        ))}
      </div>
    </div>
  );
}
