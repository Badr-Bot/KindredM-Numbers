"use client";

import { useEffect, useState } from "react";

interface VarStatus {
  name: string;
  set: boolean;
  length: number;
  looksLikePlaceholder: boolean;
}

const GROUPS: Array<{ label: string; vars: string[] }> = [
  {
    label: "🇪🇸 ES",
    vars: ["SHOPIFY_ES_DOMAIN", "SHOPIFY_ES_CLIENT_ID", "SHOPIFY_ES_CLIENT_SECRET"],
  },
  {
    label: "🇬🇧 UK",
    vars: ["SHOPIFY_UK_DOMAIN", "SHOPIFY_UK_CLIENT_ID", "SHOPIFY_UK_CLIENT_SECRET"],
  },
  {
    label: "🇩🇪 DE",
    vars: ["SHOPIFY_DE_DOMAIN", "SHOPIFY_DE_CLIENT_ID", "SHOPIFY_DE_CLIENT_SECRET"],
  },
  {
    label: "🇫🇷 FR",
    vars: ["SHOPIFY_FR_DOMAIN", "SHOPIFY_FR_CLIENT_ID", "SHOPIFY_FR_CLIENT_SECRET"],
  },
  { label: "📣 Meta", vars: ["META_ACCESS_TOKEN", "META_AD_ACCOUNT_ID"] },
  { label: "🗄️ Supabase", vars: ["SUPABASE_URL", "SUPABASE_SERVICE_KEY"] },
];

/**
 * Auto-diagnostic : confirme quelles variables d'environnement le serveur
 * voit réellement en production, sans jamais afficher leur valeur. Évite les
 * allers-retours de captures d'écran pour un problème de config Vercel.
 */
export function EnvCheck() {
  const [statuses, setStatuses] = useState<VarStatus[] | null>(null);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    fetch("/api/admin/env-check")
      .then((r) => r.json())
      .then((j) => setStatuses(j.ok ? j.status : null))
      .catch(() => setStatuses(null));
  }, []);

  if (!statuses) return null;

  const byName = new Map(statuses.map((s) => [s.name, s]));
  const missing = statuses.filter((s) => !s.set && !s.name.endsWith("_TOKEN")).length;
  const placeholders = statuses.filter((s) => s.looksLikePlaceholder);

  return (
    <section
      className={`rounded-lg border p-3.5 ${
        missing > 0 || placeholders.length > 0 ? "border-red/40 bg-red/[0.04]" : "border-phosphor/30 bg-phosphor/[0.03]"
      }`}
    >
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between text-sm font-semibold">
        <span>🩺 Diagnostic des variables</span>
        <span className="text-ink-dim">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="mt-2.5 flex flex-col gap-2">
          {placeholders.length > 0 && (
            <p className="rounded border border-red/40 bg-red/[0.06] p-2 text-[11px] text-red">
              ⚠️ {placeholders.length} variable(s) contiennent un texte du type &quot;(...)&quot; — on dirait un
              exemple non remplacé : {placeholders.map((p) => p.name).join(", ")}
            </p>
          )}
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
            {GROUPS.map((g) => {
              const allSet = g.vars.every((v) => byName.get(v)?.set);
              return (
                <div
                  key={g.label}
                  className={`rounded border p-2 text-[10.5px] ${
                    allSet ? "border-line-soft bg-terminal/40" : "border-red/40 bg-red/[0.05]"
                  }`}
                >
                  <div className="mb-1 font-semibold">{g.label}</div>
                  {g.vars.map((v) => {
                    const s = byName.get(v);
                    return (
                      <div key={v} className="flex items-center justify-between gap-1 text-[9.5px] text-ink-dim">
                        <span className="truncate">{v.split("_").slice(-1)[0]}</span>
                        <span>{s?.set ? "✅" : "❌"}</span>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
          <p className="text-[9.5px] text-ink-faint">
            ✅/❌ = présence côté serveur (jamais la valeur). Si tout est ❌ malgré des variables ajoutées dans
            Vercel : il manque probablement un <b>Redeploy</b> après leur ajout (Deployments → ⋯ → Redeploy).
          </p>
        </div>
      )}
    </section>
  );
}
