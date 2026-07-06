"use client";

import { useEffect, useState } from "react";
import { useSound } from "../sound/SoundProvider";

const LINES = [
  "NIVA // FINANCIAL TERMINAL",
  "> init engine ......... ok",
  "> load aggregates ..... ok",
  "> markets ES UK DE FR . ok",
  "> ready.",
];

/** Séquence de boot terminal, une seule fois par session (sessionStorage). */
export function BootOverlay() {
  const [show, setShow] = useState(false);
  const [visibleLines, setVisibleLines] = useState(0);
  const { play } = useSound();

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const alreadyBooted = window.sessionStorage.getItem("niva:booted") === "1";
    if (alreadyBooted || reduce) return;

    window.sessionStorage.setItem("niva:booted", "1");
    // Déclenche la séquence de boot une seule fois par session (dépend de
    // sessionStorage + reduced-motion, indisponibles en SSR).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShow(true);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-terminal"
      style={{ animation: "boot-out 1.6s ease-in forwards" }}
      aria-hidden
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-phosphor/20 to-transparent"
        style={{ animation: "scan-sweep 1.4s ease-in-out" }}
      />
      <pre className="text-[11px] leading-relaxed text-phosphor sm:text-sm">
        {LINES.slice(0, visibleLines).map((line, i) => (
          <div key={i}>{line}</div>
        ))}
      </pre>
    </div>
  );
}
