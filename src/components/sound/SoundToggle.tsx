"use client";

import { useSound } from "./SoundProvider";

export function SoundToggle() {
  const { enabled, toggle } = useSound();
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={enabled}
      aria-label={enabled ? "Couper le son" : "Activer le son"}
      title={enabled ? "Son activé" : "Son coupé"}
      className="flex h-8 w-8 items-center justify-center rounded border border-line text-ink-dim transition-colors hover:border-phosphor hover:text-phosphor"
    >
      <span className="text-sm">{enabled ? "🔊" : "🔇"}</span>
    </button>
  );
}
