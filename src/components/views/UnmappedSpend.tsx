"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { DataMode, UnmappedCampaign } from "@/lib/data";
import type { Market } from "@/lib/engine";
import { MARKET_META, MARKETS } from "@/lib/markets";
import { formatDayShort, formatEur0 } from "@/lib/format";
import { useSound } from "../sound/SoundProvider";

/**
 * §4.6 — spend Meta non affecté. Chaque campagne UNMAPPED est listée avec des
 * boutons marché : un clic persiste l'affectation (override) et recalcule les
 * agrégats des jours touchés. Rien n'est jamais agrégé silencieusement.
 */
export function UnmappedSpend({
  mode,
  campaigns,
}: {
  mode: DataMode;
  campaigns: UnmappedCampaign[];
}) {
  const { play } = useSound();
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  if (campaigns.length === 0) {
    return (
      <section className="rounded-lg border border-line bg-panel/40 p-3.5">
        <span className="text-sm font-semibold">📡 Spend non affecté</span>
        <p className="mt-1.5 text-[11px] text-ink-dim">
          Aucune campagne en attente — tout le spend Meta est affecté à un marché. ✅
        </p>
      </section>
    );
  }

  const assign = async (campaignId: string, market: Market) => {
    play("beep");
    setBusyId(campaignId);
    setMsg(null);
    try {
      const res = await fetch("/api/meta-map", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId, market }),
      });
      const json = await res.json();
      if (json.ok) {
        play("cash");
        setMsg(`Campagne affectée à ${market} (${json.days} jours recalculés).`);
        router.refresh();
      } else {
        play("error");
        setMsg(json.reason ?? "Échec de l'affectation.");
      }
    } catch {
      play("error");
      setMsg("Erreur réseau.");
    }
    setBusyId(null);
  };

  return (
    <section className="rounded-lg border border-amber/40 bg-amber/[0.04] p-3.5">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-semibold">📡 Spend non affecté</span>
        <span className="rounded border border-amber/50 bg-amber/10 px-1.5 py-0.5 text-[9px] font-bold text-amber">
          {campaigns.length} campagne{campaigns.length > 1 ? "s" : ""} à affecter
        </span>
      </div>
      <p className="mb-2 text-[10.5px] text-ink-dim">
        Ces campagnes Meta n&apos;ont pas pu être rattachées à un marché par leur nom.
        Leur spend n&apos;est compté nulle part tant que tu ne les affectes pas.
      </p>

      <ul className="flex flex-col gap-2.5">
        {campaigns.map((c) => (
          <li key={c.campaignId} className="rounded border border-line-soft bg-terminal/60 p-2.5">
            <div className="flex items-baseline justify-between gap-2">
              <span className="truncate text-[11.5px] font-semibold">{c.campaignName}</span>
              <span className="flex-none tnum text-[11.5px] text-amber">{formatEur0(c.spendCents)}</span>
            </div>
            <div className="mt-0.5 text-[9.5px] text-ink-faint tnum">
              {formatDayShort(c.firstDay)} → {formatDayShort(c.lastDay)}
            </div>
            <div className="mt-2 flex gap-1.5">
              {MARKETS.map((m) => (
                <button
                  key={m}
                  onClick={() => assign(c.campaignId, m)}
                  disabled={busyId !== null}
                  className="flex-1 rounded border border-line px-1.5 py-1 text-[10.5px] font-semibold text-ink-dim transition-colors hover:border-phosphor hover:text-phosphor disabled:opacity-40"
                >
                  {MARKET_META[m].flag} {m}
                </button>
              ))}
            </div>
          </li>
        ))}
      </ul>

      {mode !== "live" && (
        <p className="mt-2 rounded border border-amber/30 bg-amber/[0.05] p-2 text-[10px] text-amber">
          Mode démo : l&apos;affectation n&apos;est pas persistée. Elle fonctionnera en mode réel.
        </p>
      )}
      {msg && <p className="mt-2 text-[10.5px] text-ink-dim">{msg}</p>}
    </section>
  );
}
