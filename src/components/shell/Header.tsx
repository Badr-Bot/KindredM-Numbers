import Link from "next/link";
import type { DataMode } from "@/lib/data";
import { Clock } from "./Clock";
import { SoundToggle } from "../sound/SoundToggle";

const MODE_BADGE: Record<DataMode, { label: string; className: string } | null> = {
  demo: { label: "DÉMO", className: "border-amber/30 bg-amber/10 text-amber" },
  unconfigured: { label: "HORS LIGNE", className: "border-red/30 bg-red/10 text-red" },
  live: null,
};

export function Header({ mode }: { mode: DataMode }) {
  const badge = MODE_BADGE[mode];
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-panel/90 backdrop-blur supports-[backdrop-filter]:bg-panel/75">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-2.5 lg:max-w-6xl lg:px-8">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-sm font-bold tracking-[0.16em] text-ink">
            WEFT
            {mode === "live" && (
              <span
                aria-hidden
                className="live-pulse ml-0.5 h-1.5 w-1.5 rounded-full bg-phosphor"
                title="Données en direct"
              />
            )}
          </span>
          {badge && (
            <span className={`rounded-full border px-1.5 py-0.5 text-[9px] font-bold tracking-wider ${badge.className}`}>
              {badge.label}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-[11px]">
          <Clock />
          <Link
            href="/admin"
            aria-label="Configuration"
            title="Configuration"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-line text-ink-dim transition-colors hover:border-phosphor-brand hover:text-phosphor-brand"
          >
            ⚙️
          </Link>
          <SoundToggle />
        </div>
      </div>
    </header>
  );
}
