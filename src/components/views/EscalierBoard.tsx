"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { EscalierAction, EscalierCampaign, EscalierReport, EscalierWindow } from "@/lib/escalier";
import { formatEur0, formatPct, formatRoasBare } from "@/lib/format";

// 🪜 Escalier — un panneau par campagne : les 6 fenêtres 2 jours en barres,
// les deux lignes de seuil (BE pointillé, cible pleine), le rail des 4 crans
// et la prescription. Le composant AFFICHE et JOURNALISE, il n'exécute
// jamais : aucun bouton ne touche à Meta (protocole = Badr applique).

const ACTION_META: Record<
  EscalierAction,
  { label: string; badge: string; text: string }
> = {
  MONTER: { label: "Monter", badge: "border-phosphor/60 bg-phosphor/10 text-phosphor", text: "text-phosphor" },
  ATTENDRE: { label: "Attendre", badge: "border-amber/60 bg-amber/10 text-amber", text: "text-amber" },
  REDUIRE: { label: "Réduire", badge: "border-red/60 bg-red/10 text-red", text: "text-red" },
  SAUVETAGE: { label: "Sauvetage", badge: "border-red bg-red/20 text-red", text: "text-red" },
};

const ZONE_BAR: Record<EscalierWindow["zone"], string> = {
  over: "bg-phosphor/25 border-phosphor",
  under: "bg-amber/20 border-amber",
  below: "bg-red/15 border-red",
  nodata: "bg-panel border-line",
};
const ZONE_TEXT: Record<EscalierWindow["zone"], string> = {
  over: "text-phosphor",
  under: "text-amber",
  below: "text-red",
  nodata: "text-ink-faint",
};

function fmtDateTime(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/Paris",
    }).format(new Date(iso));
  } catch {
    return "—";
  }
}

function Rail({ c }: { c: EscalierCampaign }) {
  const rungs = [
    { n: 1, label: "attendre" },
    { n: 2, label: "réduire" },
    { n: 3, label: "réduire" },
    { n: 4, label: "sauvetage" },
  ];
  return (
    <div className="flex flex-col gap-1">
      <div className="text-[9.5px] font-bold uppercase tracking-wider text-ink-faint">Escalier — crans</div>
      <div className="flex gap-1">
        {rungs.map((r) => {
          const state =
            c.cran === null ? "free" : r.n < c.cran ? "used" : r.n === c.cran ? "now" : "free";
          return (
            <div
              key={r.n}
              className={`flex-1 rounded border px-1 py-1 text-center text-[9px] font-semibold leading-tight ${
                state === "now"
                  ? `${ACTION_META[c.action].text} border-current bg-panel`
                  : state === "used"
                    ? "border-line-soft bg-terminal-2 text-ink-faint"
                    : "border-line bg-panel text-ink-dim"
              }`}
            >
              <span className="block text-[11px]">{r.n}</span>
              {r.label}
            </div>
          );
        })}
      </div>
      <div className="text-[10px] text-ink-dim">
        {c.cran === null
          ? "Compteur à zéro (dernier verdict : OUI)."
          : c.cran >= 4
            ? "Escalier épuisé : phase de sauvetage."
            : `${4 - c.cran} cran${4 - c.cran > 1 ? "s" : ""} avant la phase de sauvetage.`}
      </div>
    </div>
  );
}

function WindowChart({ c, thresholds }: { c: EscalierCampaign; thresholds: { breakEven: number | null; target: number | null } }) {
  const maxRoas = Math.max(
    1,
    thresholds.target ?? 0,
    ...c.windows.map((w) => w.roas ?? 0)
  ) * 1.15;
  const pct = (v: number) => Math.min(100, Math.max(0, (v / maxRoas) * 100));
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[480px]">
        <div className="relative flex h-36 items-end gap-2 border-b border-line pb-0">
          {thresholds.breakEven !== null && (
            <div
              className="pointer-events-none absolute inset-x-0 border-t border-dashed border-ink-faint"
              style={{ bottom: `${pct(thresholds.breakEven)}%` }}
            >
              <span className="absolute right-0 -top-2 rounded bg-panel px-1 text-[9px] font-bold text-ink-dim">
                BE {formatRoasBare(thresholds.breakEven)}×
              </span>
            </div>
          )}
          {thresholds.target !== null && (
            <div
              className="pointer-events-none absolute inset-x-0 border-t border-phosphor/70"
              style={{ bottom: `${pct(thresholds.target)}%` }}
            >
              <span className="absolute right-0 -top-2 rounded bg-panel px-1 text-[9px] font-bold text-phosphor">
                CIBLE {formatRoasBare(thresholds.target)}×
              </span>
            </div>
          )}
          {c.windows.map((w, i) => {
            const isLast = i === c.windows.length - 1;
            return (
              <div key={w.label} className="relative flex h-full flex-1 flex-col justify-end">
                <span className={`absolute -top-0.5 left-0 right-0 text-center text-[10px] font-bold tnum ${ZONE_TEXT[w.zone]}`}>
                  {w.roas === null ? "" : formatRoasBare(w.roas)}
                </span>
                <div
                  className={`rounded-t-sm border border-b-0 ${ZONE_BAR[w.zone]} ${isLast ? "ring-1 ring-current " + ZONE_TEXT[w.zone] : ""}`}
                  style={{ height: `${w.roas === null ? 0 : Math.max(2, pct(w.roas))}%` }}
                />
              </div>
            );
          })}
        </div>
        <div className="mt-1 flex gap-2">
          {c.windows.map((w, i) => (
            <div key={w.label} className={`flex-1 text-center text-[10px] leading-tight ${i === c.windows.length - 1 ? "text-ink" : "text-ink-dim"}`}>
              <span className="block font-bold tnum">{w.label}</span>
              <span className={`tnum ${ZONE_TEXT[w.zone]}`}>{w.margin === null ? "—" : formatPct(w.margin)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CampaignPanel({
  c,
  report,
  today,
}: {
  c: EscalierCampaign;
  report: EscalierReport;
  today: string;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const th = report.thresholds[c.product];
  const last = c.windows[c.windows.length - 1];
  const cm = th?.cm ?? null;
  // Contribution € de la fenêtre = CA attribué × CM − spend (ce que la
  // fenêtre a réellement mis (ou pris) dans la poche, avant OPEX).
  const contributionCents = cm === null ? null : Math.round(last.valueCents * cm - last.spendCents);

  const move =
    c.action === "MONTER" && c.suggestedMinCents !== null && c.suggestedMaxCents !== null
      ? `${c.budgetCents !== null ? formatEur0(c.budgetCents) : "?"} → ${formatEur0(c.suggestedMinCents)}${
          c.suggestedMaxCents > c.suggestedMinCents ? `–${formatEur0(c.suggestedMaxCents)} (×2 si tout est parfait)` : ""
        }`
      : c.action === "REDUIRE" && c.suggestedMinCents !== null && c.suggestedMaxCents !== null
        ? `${c.budgetCents !== null ? formatEur0(c.budgetCents) : "?"} → ${formatEur0(c.suggestedMinCents)}–${formatEur0(c.suggestedMaxCents)}`
        : c.action === "ATTENDRE"
          ? "budget inchangé 24 h"
          : "diagnostic, on ne rabote plus";

  async function marquerApplique() {
    setSaving(true);
    try {
      const note = `ESCALIER ${c.campaignName} : ${ACTION_META[c.action].label.toUpperCase()} (${move})`.slice(0, 300);
      const res = await fetch("/api/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ day: today, type: "budget", note }),
      });
      if (res.ok) {
        setSaved(true);
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="card-shadow rounded-xl border border-line bg-panel">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line-soft p-3.5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-[13.5px] font-extrabold tracking-tight text-ink">{c.campaignName}</h2>
            <span className="rounded border border-line-soft bg-terminal-2 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-ink-dim">
              {c.product === "GILET" ? "🎽 Gilet" : "👕 Polo"}
            </span>
            {!c.active && (
              <span className="rounded border border-red/40 bg-red/10 px-1.5 py-0.5 text-[9px] font-bold uppercase text-red">en pause</span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[10.5px] text-ink-dim">
            <span>
              Budget <b className="tnum text-ink">{c.budgetCents !== null ? `${formatEur0(c.budgetCents)}/j` : "?"}</b>
              {c.budgetEstimated && <span className="text-amber"> (estimé)</span>}
            </span>
            <span>
              Dernière modif Meta <b className="tnum text-ink">{fmtDateTime(c.lastChange)}</b>
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 text-right">
          <span className={`rounded-md border px-2.5 py-1 text-[12px] font-extrabold uppercase tracking-wide ${ACTION_META[c.action].badge}`}>
            {ACTION_META[c.action].label}
          </span>
          <span className="tnum text-[11.5px] font-bold text-ink">{move}</span>
          <button
            onClick={marquerApplique}
            disabled={saving || saved}
            className={`rounded border px-2 py-0.5 text-[10px] font-semibold transition-colors ${
              saved
                ? "border-phosphor/50 bg-phosphor/10 text-phosphor"
                : "border-line text-ink-dim hover:border-phosphor/60 hover:text-phosphor"
            }`}
          >
            {saved ? "✓ noté au journal" : saving ? "…" : "✓ appliqué — noter au journal"}
          </button>
        </div>
      </div>

      <div className="p-3.5">
        <WindowChart c={c} thresholds={{ breakEven: th?.breakEven ?? null, target: th?.target ?? null }} />
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4 border-t border-line-soft bg-terminal/50 p-3.5">
        <dl className="flex flex-wrap gap-x-4 gap-y-1">
          {[
            { t: `ROAS ${last.label}`, v: last.roas === null ? "—" : `${formatRoasBare(last.roas)}×`, cls: ZONE_TEXT[last.zone] },
            { t: "Marge", v: last.margin === null ? "—" : formatPct(last.margin), cls: ZONE_TEXT[last.zone] },
            { t: "Conversions", v: String(last.purchases), cls: c.lowSample ? "text-amber" : "text-ink" },
            {
              t: "Contribution",
              v: contributionCents === null ? "—" : formatEur0(contributionCents),
              cls: contributionCents !== null && contributionCents < 0 ? "text-red" : "text-phosphor",
            },
          ].map((m) => (
            <div key={m.t}>
              <dt className="text-[9px] font-bold uppercase tracking-wider text-ink-faint">{m.t}</dt>
              <dd className={`tnum text-[13px] font-bold ${m.cls}`}>{m.v}</dd>
            </div>
          ))}
        </dl>
        <div className="min-w-[220px] flex-1 sm:max-w-[300px]">
          <Rail c={c} />
        </div>
      </div>

      <div className="border-t border-line-soft p-3.5 text-[11px] leading-relaxed text-ink-dim">
        <p>
          <b className="text-ink">{c.why}</b>
        </p>
        {c.sauvetageDiagnostic && <p className="mt-1 text-red">🩺 {c.sauvetageDiagnostic}</p>}
        {c.lowSample && (
          <p className="mt-1 text-amber">
            ⚠️ {last.purchases} conversions sur la fenêtre (&lt; 15) : traite ce verdict comme un ajustement, pas comme un
            jugement sur le produit.
          </p>
        )}
        {c.unstable && (
          <p className="mt-1 text-amber">
            🌊 Verdicts instables (OUI/NON en alternance) : la formation recommande alors de juger sur 3 jours avant
            d&apos;agir (T24).
          </p>
        )}
        {c.cpmrRising && (
          <p className="mt-1 text-amber">
            📈 CPMr en hausse vs l&apos;historique : l&apos;audience sature — la réponse est des créas neuves, jamais du budget.
          </p>
        )}
        {c.creasRequired && (
          <p className="mt-1">
            🎬 <b className="text-ink">Créas neuves obligatoires</b> avec ce mouvement (règle du protocole, montée comprise).
          </p>
        )}
      </div>
    </section>
  );
}

export function EscalierBoard({ report, today }: { report: EscalierReport; today: string }) {
  const legend = useMemo(
    () => [
      { cls: "bg-phosphor/25 border-phosphor", txt: "marge ≥ 15 % — OUI, on monte d'un palier" },
      { cls: "bg-amber/20 border-amber", txt: "entre break-even et cible — NON, on avance d'un cran" },
      { cls: "bg-red/15 border-red", txt: "sous le break-even — NON, la campagne perd de l'argent" },
    ],
    []
  );

  if (report.campaigns.length === 0) {
    return (
      <p className="rounded-lg border border-line bg-panel/40 p-3 text-[11.5px] text-ink-dim">
        Aucune campagne avec du spend sur les 7 derniers jours clos — rien à décider.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="rounded-lg border border-line bg-panel/40 p-2.5 text-[10.5px] leading-relaxed text-ink-dim">
        Fenêtre de décision <b className="text-ink tnum">{report.windowLabels[report.windowLabels.length - 1]}</b> (le jour
        en cours est exclu : le verdict de 15 h = celui de minuit). Chaque barre = 2 jours glissants ; la question se pose
        une fois par nuit et fait avancer d&apos;un seul cran. Un OUI remet le compteur à zéro et renvoie sur l&apos;échelle
        de montée <span className="tnum">500 → 750 → 1000 → 1500 → 1800 → 2000 → 3000</span>. Plancher 100 €/j.
      </p>

      {report.warnings.length > 0 && (
        <div className="rounded-lg border border-amber/40 bg-amber/[0.05] p-2.5 text-[10.5px] text-amber">
          {report.warnings.map((w) => (
            <p key={w}>⚠️ {w}</p>
          ))}
        </div>
      )}

      {report.campaigns.map((c) => (
        <CampaignPanel key={c.campaignId} c={c} report={report} today={today} />
      ))}

      <div className="flex flex-wrap gap-x-5 gap-y-1.5 rounded-lg border border-line bg-panel/40 p-2.5 text-[10.5px] text-ink-dim">
        {legend.map((l) => (
          <span key={l.txt} className="flex items-center gap-1.5">
            <span className={`h-3 w-3 rounded-sm border ${l.cls}`} />
            {l.txt}
          </span>
        ))}
      </div>

      {report.recentDecisions.length > 0 && (
        <section className="rounded-lg border border-line bg-panel/40 p-3">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-ink-faint">
            📓 Décisions appliquées (journal, 14 j)
          </h3>
          <ul className="mt-1.5 flex flex-col gap-1 text-[10.5px] text-ink-dim">
            {report.recentDecisions.map((e) => (
              <li key={e.id}>
                <span className="tnum font-semibold text-ink">{e.day.slice(8, 10)}/{e.day.slice(5, 7)}</span>{" "}
                <span className="rounded border border-line-soft bg-terminal-2 px-1 text-[9px] uppercase">{e.type}</span>{" "}
                {e.note}
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="rounded-lg border border-line bg-panel/40 p-3 text-[10px] leading-relaxed text-ink-faint">
        <p>
          <b className="text-ink-dim">Deux réserves.</b> Les marges sont calculées sur le <b>ROAS Meta</b> comme proxy
          (marge = CM − 1/ROAS) alors que le protocole dit « rentable au backend » : ces chiffres sont un plafond, à
          confronter à <code className="tnum">/api/roas-report</code> (ROAS UTM Shopify). Et l&apos;attribution Meta se
          remplit en 24-72 h — les fenêtres récentes ne peuvent que monter.
        </p>
        <p className="mt-1">
          <b className="text-ink-dim">Sources.</b> Spend/ROAS/conversions : <code>meta_insights</code> (sommes
          journalières). Seuils par produit : CM 14 j glissants (mêmes seuils que l&apos;onglet Analyse). Horodatage :{" "}
          <code>updated_time</code> Meta (proxy — marque toute modification). Protocole : formation Master, leçon 35.
          L&apos;onglet recommande, <b>il n&apos;exécute jamais</b>.
        </p>
      </div>
    </div>
  );
}
