"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useSound } from "../sound/SoundProvider";
import { formatRelativeTime } from "@/lib/relative";

export function RefreshButton({ fetchedAt }: { fetchedAt: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);
  const { play } = useSound();

  const onClick = async () => {
    setBusy(true);
    play("beep");
    try {
      // Déclenche une vraie synchro (throttlée côté serveur à 1×/5 min) :
      // si les données ont plus de 5 min, elles se rafraîchissent vraiment.
      await fetch("/api/sync", { method: "POST" });
    } catch {
      // en démo / non configuré, reste inoffensif
    }
    startTransition(() => router.refresh());
    setBusy(false);
  };

  const loading = busy || isPending;

  return (
    <div className="flex items-center gap-2 text-[11px] text-ink-dim">
      <span className="tnum">MAJ {formatRelativeTime(fetchedAt)}</span>
      <button
        type="button"
        onClick={onClick}
        disabled={loading}
        className="flex items-center gap-1 rounded border border-line px-2 py-1 text-ink transition-colors hover:border-phosphor hover:text-phosphor disabled:opacity-50"
      >
        <span className={loading ? "inline-block animate-spin" : ""}>↻</span>
        {loading ? "…" : "Actualiser"}
      </button>
    </div>
  );
}
