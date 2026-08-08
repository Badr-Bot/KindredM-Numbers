import Link from "next/link";
import type { DataMode } from "@/lib/data";
import { Clock } from "./Clock";
import { Cursor } from "../fx/Cursor";
import { SoundToggle } from "../sound/SoundToggle";

const MODE_BADGE: Record<DataMode, { label: string; className: string } | null> = {
  demo: { label: "DÉMO", className: "border-amber/50 text-amber" },
  unconfigured: { label: "HORS LIGNE", className: "border-red/50 text-red" },
  live: null,
};

export function Header({ mode }: { mode: DataMode }) {
  const badge = MODE_BADGE[mode];
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-terminal/95 backdrop-blur supports-[backdrop-filter]:bg-terminal/80">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-2.5 lg:max-w-6xl lg:px-8">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold tracking-[0.2em] text-phosphor">
            WEFT
            <Cursor />
          </span>
          {badge && (
            <span className={`rounded border px-1.5 py-0.5 text-[9px] font-bold tracking-wider ${badge.className}`}>
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
            className="flex h-8 w-8 items-center justify-center rounded border border-line text-ink-dim transition-colors hover:border-phosphor hover:text-phosphor"
          >
            ⚙️
          </Link>
          <SoundToggle />
        </div>
      </div>
    </header>
  );
}
