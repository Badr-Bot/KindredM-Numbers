"use client";

import { MARKET_META, MARKET_TABS, type MarketTab } from "@/lib/markets";
import { useSound } from "../sound/SoundProvider";

export function MarketTabs({
  active,
  onChange,
}: {
  active: MarketTab;
  onChange: (tab: MarketTab) => void;
}) {
  const { play } = useSound();
  return (
    <div className="flex gap-1 overflow-x-auto pb-1" role="tablist" aria-label="Marché">
      {MARKET_TABS.map((tab) => {
        const meta = MARKET_META[tab];
        const isActive = tab === active;
        return (
          <button
            key={tab}
            role="tab"
            aria-selected={isActive}
            onClick={() => {
              if (!isActive) {
                play("tab");
                onChange(tab);
              }
            }}
            className={`flex-none rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors ${
              isActive
                ? "border-phosphor/60 bg-phosphor/10 text-phosphor"
                : "border-line text-ink-dim hover:border-line hover:text-ink"
            }`}
          >
            <span aria-hidden>{meta.flag}</span> {meta.label}
          </button>
        );
      })}
    </div>
  );
}
