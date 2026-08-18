"use client";

import type { ScalingAction, ScalingCampaign, ScalingReport, ScalingWindow } from "@/lib/scaling";
import { formatEur0, formatPct, formatRoasBare } from "@/lib/format";

// 🪜 Meta Scaling — un panneau par campagne : la décision de la nuit (un seul
// chiffre), son état d'application VÉRIFIÉ sur Meta (journal d'activités),
// la fenêtre en cours (provisoire, se met à jour dans la journée), les
// fenêtres 2 jours en barres avec BE/Cible, le rail des 4 crans et le tableau
// jour par jour budget (pastille couleur) + spend + ROAS.
// Le composant AFFICHE, il n'exécute jamais : aucune écriture Meta.

const ACTION_META: Record<ScalingAction, { label: string; badge: string; text: string }> = {
  SCALE: { label: "Scale", badge: "border-phosphor/60 bg-phosphor/10 text-phosphor", text: "text-phosphor" },
  HOLD: { label: "Hold", badge: "border-amber/60 bg-amber/10 text-amber", text: "text-amber" },
  DESCALE: { label: "Descale", badge: "border-red/60 bg-red/10 text-red", text: "text-red" },
  RESCUE: { label: "Rescue", badge: "border-red bg-red/20 text-red", text: "text-red" },
};

const ZONE_BAR: Record<ScalingWindow["zone"], string> = {
  over: "bg-phosphor/25 border-phosphor",
  under: "bg-amber/20 border-amber",
  below: "bg-red/15 border-red",
  nodata: "bg-panel border-line",
};
const ZONE_TEXT: Record<ScalingWindow["zone"], string> = {
  over: "text-phosphor",
  under: "text-amber",
  below: "text-red",
  nodata: "text-ink-faint",
};

// Pastilles du tableau budget : même budget = même couleur, l'évolution se
// lit d'un coup d'œil ; le budget ACTUEL (dernier rentré) est toujours en
// BEIGE pour se repérer immédiatement (demande Badr 18/08).
const BUDGET_CHIP_CURRENT = "border-phosphor-brand/60 bg-phosphor-brand/15 text-phosphor-brand";
const BUDGET_CHIP_CLASSES = [
  "border-cyan/50 bg-cyan/10 text-cyan",
  "border-net-5/50 bg-net-5/10 text-net-5",
  "border-ink-dim/40 bg-terminal-2 text-ink-dim",
  "border-phosphor/50 bg-phosphor/10 text-phosphor",
  "border-red/40 bg-red/10 text-red",
];

function eur(cents: number | null): string {
  return cents === null ? "?" : formatEur0(cents);
}

function VerdictZone({ c }: { c: ScalingCampaign }) {
  const meta = ACTION_META[c.action];
  // Badge = le verbe (anglais) + le % ; en dessous, LE budget d'arrivée en
  // gros — l'onglet dit exactement à combien passer (demande Badr 18/08).
  const pct =
    c.action === "DESCALE" ? "−15 %" : c.action === "SCALE" ? "palier" : c.action === "HOLD" ? "24 h" : "diagnostic";
  return (
    <div className="flex flex-col items-end gap-1 text-right">
      <span className={`rounded-md border px-2.5 py-1 text-[12px] font-extrabold uppercase tracking-wide ${meta.badge}`}>
        {meta.label} <span className="tnum normal-case">{pct}</span>
      </span>
      {(c.action === "DESCALE" || c.action === "SCALE") && c.suggestedCents !== null && (
        <span className={`tnum text-[15px] font-extrabold ${meta.text}`}>
          {c.budgetCents !== null ? `${eur(c.budgetCents)} ` : ""}→ {eur(c.suggestedCents)}/j
        </span>
      )}
      {c.action === "HOLD" && <span className="text-[11px] font-bold text-ink">budget inchangé — on rejuge à minuit</span>}
      {c.action === "RESCUE" && <span className="text-[11px] font-bold text-ink">on ne rabote plus — voir le diagnostic 🩺</span>}
      {c.action === "SCALE" && c.suggestedMaxCents !== null && (
        <span className="text-[9.5px] text-ink-dim">
          SURFSCALE ×2 possible → {eur(c.suggestedMaxCents)}/j si tout est parfait
        </span>
      )}
    </div>
  );
}

function WindowChart({ c }: { c: ScalingCampaign }) {
  const maxRoas = Math.max(1, c.target ?? 0, ...c.windows.map((w) => w.roas ?? 0)) * 1.15;
  const pct = (v: number) => Math.min(100, Math.max(0, (v / maxRoas) * 100));
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[520px]">
        <div className="relative flex h-36 items-end gap-2 border-b border-line pb-0">
          {c.breakEven !== null && (
            <div className="pointer-events-none absolute inset-x-0 border-t border-dashed border-ink-faint" style={{ bottom: `${pct(c.breakEven)}%` }}>
              <span className="absolute right-0 -top-2 rounded bg-panel px-1 text-[9px] font-bold text-ink-dim">
                BE {formatRoasBare(c.breakEven)}×
              </span>
            </div>
          )}
          {c.target !== null && (
            <div className="pointer-events-none absolute inset-x-0 border-t border-phosphor/70" style={{ bottom: `${pct(c.target)}%` }}>
              <span className="absolute right-0 -top-2 rounded bg-panel px-1 text-[9px] font-bold text-phosphor">
                CIBLE {formatRoasBare(c.target)}×
              </span>
            </div>
          )}
          {c.windows.map((w) => (
            <div key={w.label} className="relative flex h-full flex-1 flex-col justify-end">
              <span className={`absolute -top-0.5 left-0 right-0 text-center text-[10px] font-bold tnum ${ZONE_TEXT[w.zone]}`}>
                {w.roas === null ? "" : formatRoasBare(w.roas)}
              </span>
              <div
                className={`rounded-t-sm border border-b-0 ${ZONE_BAR[w.zone]} ${w.inProgress ? "opacity-60 [border-style:dashed]" : ""}`}
                style={{ height: `${w.roas === null ? 0 : Math.max(2, pct(w.roas))}%` }}
              />
            </div>
          ))}
        </div>
        <div className="mt-1 flex gap-2">
          {c.windows.map((w) => (
            <div key={w.label} className={`flex-1 text-center text-[10px] leading-tight ${w.inProgress ? "text-ink" : "text-ink-dim"}`}>
              <span className="block font-bold tnum">
                {w.label}
                {w.inProgress ? " ⏳" : ""}
              </span>
              <span className={`tnum ${ZONE_TEXT[w.zone]}`}>{w.margin === null ? "—" : formatPct(w.margin)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Rail({ c }: { c: ScalingCampaign }) {
  const rungs = [
    { n: 1, label: "hold" },
    { n: 2, label: "descale" },
    { n: 3, label: "descale" },
    { n: 4, label: "rescue" },
  ];
  return (
    <div className="flex flex-col gap-1">
      <div className="text-[9.5px] font-bold uppercase tracking-wider text-ink-faint">Escalier — crans</div>
      <div className="flex gap-1">
        {rungs.map((r) => {
          const state = c.cran === null ? "free" : r.n < c.cran ? "used" : r.n === c.cran ? "now" : "free";
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
            ? "Escalier épuisé : RESCUE."
            : `${4 - c.cran} cran${4 - c.cran > 1 ? "s" : ""} avant RESCUE.`}
      </div>
    </div>
  );
}

function DailyTable({ c }: { c: ScalingCampaign }) {
  // même budget → même pastille couleur ; le budget actuel (dernier rentré,
  // = celui du jour) est en beige où qu'il apparaisse.
  const current = c.dailyTable[c.dailyTable.length - 1]?.budgetCents ?? null;
  const distinct: number[] = [];
  for (const r of c.dailyTable) {
    if (r.budgetCents !== null && r.budgetCents !== current && !distinct.includes(r.budgetCents)) distinct.push(r.budgetCents);
  }
  const chipOf = (b: number | null) =>
    b === null
      ? "border-line text-ink-faint"
      : b === current
        ? BUDGET_CHIP_CURRENT
        : BUDGET_CHIP_CLASSES[distinct.indexOf(b) % BUDGET_CHIP_CLASSES.length];
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[380px] text-[10.5px]">
        <thead>
          <tr className="text-left text-[9px] font-bold uppercase tracking-wider text-ink-faint">
            <th className="py-1 pr-2">Jour</th>
            <th className="py-1 pr-2">Budget</th>
            <th className="py-1 pr-2 text-right">Spend</th>
            <th className="py-1 text-right">ROAS</th>
          </tr>
        </thead>
        <tbody>
          {c.dailyTable.map((r) => (
            <tr key={r.day} className={`border-t border-line-soft ${r.isToday ? "bg-terminal-2/60 font-semibold" : ""}`}>
              <td className="py-1 pr-2 tnum">
                {r.day.slice(8, 10)}/{r.day.slice(5, 7)}
                {r.isToday ? " ⚡" : ""}
              </td>
              <td className="py-1 pr-2">
                <span className={`tnum inline-block rounded border px-1.5 py-0.5 text-[10px] font-bold ${chipOf(r.budgetCents)}`}>
                  {r.budgetCents === null ? "—" : `${eur(r.budgetCents)}/j`}
                </span>
              </td>
              <td className="py-1 pr-2 text-right tnum">{formatEur0(r.spendCents)}</td>
              <td className={`py-1 text-right tnum ${r.roas !== null && c.breakEven !== null ? (r.roas >= (c.target ?? Infinity) ? "text-phosphor" : r.roas >= c.breakEven ? "text-amber" : "text-red") : "text-ink-faint"}`}>
                {r.roas === null ? "—" : `${formatRoasBare(r.roas)}×`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CampaignPanel({ c }: { c: ScalingCampaign }) {
  const closed = c.windows.filter((w) => !w.inProgress);
  const lastClosed = [...closed].reverse().find((w) => w.verdict !== null) ?? closed[closed.length - 1];
  const live = c.windows[c.windows.length - 1];
  return (
    <section className="card-shadow rounded-xl border border-line bg-panel">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line-soft p-3.5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-[13.5px] font-extrabold tracking-tight text-ink">{c.campaignName}</h2>
            <span className="rounded border border-line-soft bg-terminal-2 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-ink-dim">
              {c.product === "GILET" ? "🎽 Gilet" : "👕 Polo"}
            </span>
            {!c.active && <span className="rounded border border-red/40 bg-red/10 px-1.5 py-0.5 text-[9px] font-bold uppercase text-red">en pause</span>}
          </div>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[10.5px] text-ink-dim">
            <span>
              Budget <b className="tnum text-ink">{c.budgetCents !== null ? `${eur(c.budgetCents)}/j` : "?"}</b>
              {c.budgetEstimated && <span className="text-amber"> (estimé)</span>}
            </span>
            <span>
              BE <b className="tnum text-ink">{c.breakEven === null ? "—" : `${formatRoasBare(c.breakEven)}×`}</b>
            </span>
            <span>
              Cible 15 % <b className="tnum text-phosphor">{c.target === null ? "—" : `${formatRoasBare(c.target)}×`}</b>
            </span>
            {c.moves[0] && (
              <span>
                Dernier mouvement Meta{" "}
                <b className="tnum text-ink">
                  {eur(c.moves[0].oldBudgetCents)} → {eur(c.moves[0].newBudgetCents)} · {c.moves[0].timeLabel}
                </b>
              </span>
            )}
          </div>
        </div>
        <VerdictZone c={c} />
      </div>

      <div className="p-3.5">
        <WindowChart c={c} />
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4 border-t border-line-soft bg-terminal/50 p-3.5">
        <dl className="flex flex-wrap gap-x-4 gap-y-1">
          {[
            {
              t: `Fenêtre jugée (${lastClosed?.label ?? "—"})`,
              v: lastClosed?.margin == null ? "—" : formatPct(lastClosed.margin),
              cls: lastClosed ? ZONE_TEXT[lastClosed.zone] : "text-ink-faint",
            },
            {
              t: `Aujourd'hui ⏳ (${live.label})`,
              v: live.margin === null ? "—" : formatPct(live.margin),
              cls: ZONE_TEXT[live.zone],
            },
            { t: "Conversions (fenêtre jugée)", v: String(lastClosed?.purchases ?? 0), cls: c.lowSample ? "text-amber" : "text-ink" },
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

      <div className="border-t border-line-soft p-3.5">
        <h3 className="mb-1 text-[9.5px] font-bold uppercase tracking-wider text-ink-faint">
          Budget vs spend, jour par jour (même budget = même couleur)
        </h3>
        <DailyTable c={c} />
      </div>

      <div className="border-t border-line-soft p-3.5 text-[11px] leading-relaxed text-ink-dim">
        <p>
          <b className="text-ink">{c.why}</b>
        </p>
        {c.liveVerdict !== null && (
          <p className="mt-1">
            ⏳ <b className="text-ink">Fenêtre en cours ({live.label})</b> : marge{" "}
            {live.margin === null ? "—" : formatPct(live.margin)} → si ça tient jusqu&apos;à minuit, prochaine décision ={" "}
            <b className={`uppercase ${ACTION_META[c.liveAction ?? c.action].text}`}>{ACTION_META[c.liveAction ?? c.action].label}</b>. Provisoire :
            l&apos;attribution Meta du jour même sous-estime et se corrige en 24-72 h — ce chiffre ne peut que monter.
          </p>
        )}
        {c.sauvetageDiagnostic && <p className="mt-1 text-red">🩺 {c.sauvetageDiagnostic}</p>}
        {c.lowSample && (
          <p className="mt-1 text-amber">
            ⚠️ {lastClosed?.purchases ?? 0} conversions sur la fenêtre jugée (&lt; 15) : traite ce verdict comme un ajustement,
            pas comme un jugement sur le produit.
          </p>
        )}
        {c.unstable && (
          <p className="mt-1 text-amber">🌊 Verdicts instables (OUI/NON en alternance) : juger sur 3 jours avant d&apos;agir (T24).</p>
        )}
        {c.cpmrRising && (
          <p className="mt-1 text-amber">📈 CPMr en hausse vs l&apos;historique : l&apos;audience sature — créas neuves, jamais du budget.</p>
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

export function ScalingBoard({ report }: { report: ScalingReport }) {
  if (report.campaigns.length === 0) {
    return (
      <p className="rounded-lg border border-line bg-panel/40 p-3 text-[11.5px] text-ink-dim">
        Aucune campagne Meta avec du spend sur la période — rien à décider.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="rounded-lg border border-line bg-panel/40 p-2.5 text-[10.5px] leading-relaxed text-ink-dim">
        <b className="text-ink">La décision de la nuit</b> se prend sur la fenêtre close{" "}
        <b className="tnum text-ink">{report.windowLabels[report.windowLabels.length - 2]}</b> — stable toute la journée ;
        les budgets et leurs mouvements sont <b className="text-ink">lus sur Meta</b> (journal d&apos;activités du compte).
        La fenêtre <b className="tnum text-ink">{report.windowLabels[report.windowLabels.length - 1]} ⏳</b> tourne en live
        avec le jour même. Marge ≥ 15 % → <b className="text-phosphor">SCALE</b> (échelle{" "}
        <span className="tnum">500 → 750 → 1000 → 1500 → 1800 → 2000 → 3000</span>, SURFSCALE ×2 si parfait) ; sinon un
        cran par nuit : <b className="text-amber">HOLD</b> · <b className="text-red">DESCALE −15 %</b> ·{" "}
        <b className="text-red">DESCALE −15 %</b> · <b className="text-red">RESCUE</b>. Plancher 100 €/j.
      </p>

      {report.warnings.length > 0 && (
        <div className="rounded-lg border border-amber/40 bg-amber/[0.05] p-2.5 text-[10.5px] text-amber">
          {report.warnings.map((w) => (
            <p key={w}>⚠️ {w}</p>
          ))}
        </div>
      )}

      {report.campaigns.map((c) => (
        <CampaignPanel key={c.campaignId} c={c} />
      ))}

      <div className="flex flex-wrap gap-x-5 gap-y-1.5 rounded-lg border border-line bg-panel/40 p-2.5 text-[10.5px] text-ink-dim">
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm border border-phosphor bg-phosphor/25" /> marge ≥ 15 % — SCALE</span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm border border-amber bg-amber/20" /> entre BE et cible — un cran (HOLD/DESCALE)</span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm border border-red bg-red/15" /> sous le BE — la campagne perd de l&apos;argent</span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm border border-line bg-panel opacity-60" /> ⏳ fenêtre en cours (provisoire)</span>
      </div>

      <div className="rounded-lg border border-line bg-panel/40 p-3 text-[10px] leading-relaxed text-ink-faint">
        <p>
          <b className="text-ink-dim">Réserves.</b> Marges calculées sur le <b>ROAS Meta</b> (marge = CM − 1/ROAS), un
          plafond à confronter à <code className="tnum">/api/roas-report</code> (ROAS UTM Shopify). Attribution Meta :
          24-72 h pour se remplir. Budgets et mouvements : <b>lus sur Meta</b> (daily_budget + journal d&apos;activités du
          compte). Seuils BE/Cible : CM 14 j glissants par produit. Protocole : formation Master, leçon 35 (arbitrage
          18/08). L&apos;onglet recommande, <b>il n&apos;exécute jamais</b>.
        </p>
      </div>
    </div>
  );
}
