"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSound } from "../sound/SoundProvider";

interface AutoSetupResponse {
  ok: boolean;
  stage: string;
  storeErrors?: string[];
  unmappedTitles?: string[];
  mapped?: number;
  reason?: string;
  warnings?: string[];
  backfill?: { ordersByStore: Record<string, number>; daysRecomputed: number };
}

type Phase = "running" | "done" | "error";

/**
 * Initialisation « zéro clic » : monté par la page d'accueil quand la base
 * est vide, lance l'auto-setup immédiatement et affiche l'avancement. Aucun
 * bouton à cliquer — on ouvre le site, ça se remplit.
 */
export function AutoInit() {
  const { play } = useSound();
  const router = useRouter();
  const startedRef = useRef(false);
  const [phase, setPhase] = useState<Phase>("running");
  const [detail, setDetail] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    (async () => {
      try {
        const res = await fetch("/api/admin/auto-setup", { method: "POST" });
        const json: AutoSetupResponse = await res.json();
        if (json.ok) {
          play("cash");
          setPhase("done");
          const stores = Object.entries(json.backfill?.ordersByStore ?? {})
            .map(([m, c]) => `${m}: ${c} cmd`)
            .join(" · ");
          setDetail([`${json.mapped} produits mappés`, stores]);
          setWarnings(json.warnings ?? []);
          setTimeout(() => router.refresh(), 1200);
        } else {
          play("error");
          setPhase("error");
          const lines: string[] = [];
          if (json.storeErrors) lines.push(...json.storeErrors);
          if (json.unmappedTitles) {
            lines.push(
              `Produits inconnus à valider sur /admin : ${json.unmappedTitles.join(", ")}`
            );
          }
          if (json.reason) lines.push(json.reason);
          setDetail(lines.length ? lines : ["Erreur inconnue."]);
        }
      } catch {
        setPhase("error");
        setDetail(["Erreur réseau ou délai dépassé — recharge la page, l'init reprendra toute seule (opération sans risque)."]);
      }
    })();
  }, [play, router]);

  return (
    <section
      className={`mb-4 rounded-lg border p-3.5 ${
        phase === "error"
          ? "border-red/40 bg-red/[0.04]"
          : "border-phosphor/40 bg-phosphor/[0.04]"
      }`}
    >
      {phase === "running" && (
        <>
          <div className="flex items-center gap-2 text-sm font-semibold text-phosphor">
            <span className="inline-block animate-spin">↻</span>
            Initialisation automatique en cours…
          </div>
          <p className="mt-1.5 text-[11px] text-ink-dim">
            Première ouverture détectée : lecture des 4 boutiques, mapping des produits et calcul de
            tout l&apos;historique. ~1-2 min, la page se mettra à jour toute seule. Tu peux rester ici.
          </p>
        </>
      )}
      {phase === "done" && (
        <>
          <div className="text-sm font-semibold text-phosphor">
            {warnings.length > 0 ? "✅ Initialisation partielle terminée" : "✅ Initialisation terminée"}
          </div>
          <p className="mt-1 text-[11px] text-ink-dim">{detail.filter(Boolean).join(" — ")}</p>
          {warnings.map((w) => (
            <p key={w} className="mt-1.5 break-words rounded border border-amber/30 bg-amber/[0.05] p-1.5 text-[10.5px] text-amber">
              ⚠️ {w}
            </p>
          ))}
        </>
      )}
      {phase === "error" && (
        <>
          <div className="text-sm font-semibold text-red">❌ Initialisation incomplète</div>
          <ul className="mt-1.5 flex flex-col gap-1">
            {detail.map((d) => (
              <li key={d} className="max-h-24 overflow-y-auto break-words text-[11px] text-ink-dim">
                {d}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[10.5px] text-ink-faint">
            Corrige puis recharge la page (l&apos;init reprend toute seule), ou passe par{" "}
            <Link href="/admin" className="text-phosphor underline">
              /admin
            </Link>{" "}
            pour le pas-à-pas.
          </p>
        </>
      )}
    </section>
  );
}
