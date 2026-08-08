"use client";

import { useEffect, useRef, useState } from "react";

/** Fait apparaître son contenu (fondu + léger décalage vertical) quand il
 * entre dans le viewport au scroll — complète le `rise-in` au montage pour
 * les cartes plus bas dans la page, découvertes en scrollant plutôt qu'au
 * chargement. Se déclenche une seule fois (pas de va-et-vient en scrollant). */
export function Reveal({
  children,
  className = "",
  delayMs = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delayMs?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // Toujours false au premier rendu (serveur ET client) : `typeof
  // IntersectionObserver` diffère entre SSR (toujours "undefined", pas de
  // DOM côté serveur) et le client → point de départ commun obligatoire,
  // sinon hydration mismatch (testé, ça arrivait avec un lazy initializer).
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      // Repli très rare (pas de support) : révèle direct côté client.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVisible(true);
      return;
    }
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`${className} transition-all duration-500 ease-out ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
      style={{ transitionDelay: visible ? `${delayMs}ms` : "0ms" }}
    >
      {children}
    </div>
  );
}
