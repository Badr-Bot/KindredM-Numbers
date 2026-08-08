"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { isSoundEnabled, playSound, setSoundEnabled, unlockAudio, type SoundName } from "./sound";

interface SoundContextValue {
  enabled: boolean;
  toggle: () => void;
  play: (name: SoundName) => void;
}

const SoundContext = createContext<SoundContextValue | null>(null);
const STORAGE_KEY = "niva:sound";

export function SoundProvider({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const value = stored === null ? true : stored === "1";
    // Restauration de la préférence persistée au montage (localStorage
    // indisponible en SSR) — usage légitime de setState dans un effet.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEnabled(value);
    setSoundEnabled(value);

    // Débloque l'audio au premier geste (autoplay policy).
    const unlock = () => {
      unlockAudio();
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  const toggle = useCallback(() => {
    setEnabled((prev) => {
      const next = !prev;
      setSoundEnabled(next);
      window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      if (next) playSound("beep");
      return next;
    });
  }, []);

  const play = useCallback((name: SoundName) => {
    if (isSoundEnabled()) playSound(name);
  }, []);

  return (
    <SoundContext.Provider value={{ enabled, toggle, play }}>{children}</SoundContext.Provider>
  );
}

export function useSound(): SoundContextValue {
  const ctx = useContext(SoundContext);
  if (!ctx) {
    // Hors provider (ne devrait pas arriver) : no-op sûr.
    return { enabled: false, toggle: () => {}, play: () => {} };
  }
  return ctx;
}
