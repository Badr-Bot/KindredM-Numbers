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
    let ok = true;
    try {
      // force=1 : clic humain → passage réel si les données ont plus de 60 s
      // (l'automatique reste throttlé à 5 min, voir incrementalSync.ts).
      await fetch("/api/sync?force=1", { method: "POST" });
    } catch {
      // en démo / non configuré, reste inoffensif
      ok = false;
    }
    startTransition(() => router.refresh());
    setBusy(false);
    if (ok) play("refreshDone");
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
