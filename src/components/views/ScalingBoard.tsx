"use client";

import type { AdDiagnostic, ScalingAction, ScalingCampaign, ScalingReport, ScalingWindow } from "@/lib/scaling";
import { formatEur, formatEur0, formatPct, formatRoasBare } from "@/lib/format";

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
    c.action === "DESCALE"
      ? "−15 %"
      : c.action === "SCALE"
        ? c.scaleKind === "DOUBLE"
          ? "×2"
          : "palier"
        : c.action === "HOLD"
          ? c.scalingRegime
            ? "72 h" // board §3 : sous le BE, on attend 72 h avant de toucher au budget
            : "24 h" // board §2 : cran 1 de l'escalier
          : "diagnostic";
  return (
    <div className="flex flex-col items-end gap-1 text-right">
      <span className={`rounded-md border px-2.5 py-1 text-[12px] font-extrabold uppercase tracking-wide ${meta.badge}`}>
        {meta.label} <span className="tnum normal-case">{pct}</span>
      </span>
      {c.applied ? (
        // Le mouvement a DÉJÀ été fait sur Meta : on le dit au lieu de
        // re-prescrire un 2ᵉ mouvement depuis le budget déjà bougé.
        <span className="tnum text-[12px] font-bold text-phosphor">✓ appliqué : {c.appliedLabel} — on rejuge à la prochaine fenêtre</span>
      ) : (
        (c.action === "DESCALE" || c.action === "SCALE") && c.suggestedCents !== null && (
          <span className={`tnum text-[15px] font-extrabold ${meta.text}`}>
            {c.budgetCents !== null ? `${eur(c.budgetCents)} ` : ""}→ {eur(c.suggestedCents)}/j
          </span>
        )
      )}
      {c.action === "HOLD" && <span className="text-[11px] font-bold text-ink">budget inchangé — on rejuge à minuit</span>}
      {c.action === "RESCUE" && <span className="text-[11px] font-bold text-ink">on ne rabote plus — voir le diagnostic 🩺</span>}
      {c.dayAloneNote && (
        <span className="max-w-[340px] rounded-md border border-amber/50 bg-amber/[0.07] px-2 py-1 text-[10.5px] font-semibold leading-snug text-amber">
          ⚠️ {c.dayAloneNote}
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

function AdRow({ a, breakEven }: { a: AdDiagnostic; breakEven: number | null }) {
  const tag = a.alreadyMarked
    ? { txt: "MARQUÉE", cls: "border-line text-ink-faint" }
    : a.winner
      ? { txt: "WINNER", cls: "border-phosphor/50 bg-phosphor/10 text-phosphor" }
      : a.potentialWinner
        ? { txt: "POTENTIEL", cls: "border-cyan/50 bg-cyan/10 text-cyan" }
        : a.earlySignal
          ? { txt: "SIGNAL", cls: "border-cyan/50 bg-cyan/10 text-cyan" }
          : a.toZombie
            ? { txt: "→ ZOMBIE", cls: "border-red/50 bg-red/10 text-red" }
            : a.saturating
              ? { txt: "SATURE", cls: "border-amber/50 bg-amber/10 text-amber" }
              : null;
  const roasCls =
    a.roas === null || breakEven === null
      ? "text-ink-faint"
      : a.roas >= breakEven
        ? "text-phosphor"
        : "text-red";
  return (
    <tr className="border-t border-line-soft align-top">
      <td className="py-1 pr-2">
        <span className="block max-w-[220px] truncate text-ink" title={a.adName}>
          {a.adName}
        </span>
        <span className="flex flex-wrap items-center gap-1 text-[9px] text-ink-faint">
          {tag && <span className={`rounded border px-1 font-bold ${tag.cls}`}>{tag.txt}</span>}
          <span className="tnum">{a.ageTruncated ? `≥ ${a.ageDays} j` : `${a.ageDays} j`}</span>
        </span>
      </td>
      <td className="py-1 pr-2 text-right tnum">{formatEur0(a.spendCents)}</td>
      <td className="py-1 pr-2 text-right tnum">{a.purchases}</td>
      <td className={`py-1 pr-2 text-right tnum ${roasCls}`}>{a.roas === null ? "—" : `${formatRoasBare(a.roas)}×`}</td>
      <td className="py-1 pr-2 text-right tnum">{a.cpcCents === null ? "—" : formatEur(Math.round(a.cpcCents))}</td>
      <td className="py-1 text-right tnum">{a.cvr === null ? "—" : `${(a.cvr * 100).toFixed(1)} %`}</td>
    </tr>
  );
}

function RescueBlock({ c }: { c: ScalingCampaign }) {
  const r = c.rescue;
  if (!r) return null;
  // Le diagnostic s'affiche AVANT le sauvetage (dès le cran 3, et sur toute
  // la suite de l'escalier) : depuis le 29/08 le sauvetage attend le plancher
  // de 100 €/j, donc une série peut s'allonger en DESCALE — on ne promet
  // jamais une bascule qui ne viendra pas mécaniquement.
  const anticipated = c.action !== "RESCUE";
  const long = anticipated && (c.cran ?? 0) >= 4;
  return (
    <details className="group border-t border-line-soft" open={!anticipated || long}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3.5 py-2.5 text-[11px] [&::-webkit-details-marker]:hidden">
        <span className="font-semibold text-ink">
          🩺 Diagnostic{" "}
          {!anticipated
            ? "de sauvetage"
            : long
              ? "(escalier qui s'allonge — le sauvetage attend le plancher de 100 €/j)"
              : "(anticipé — avant même le 4ᵉ NON)"}
        </span>
        <span className="text-[10px] text-ink-faint transition-transform group-open:rotate-180">▾</span>
      </summary>
      <div className="flex flex-col gap-2.5 px-3.5 pb-3.5 text-[11px] leading-relaxed text-ink-dim">
        <p className="rounded-lg border border-red/30 bg-red/[0.04] p-2 font-semibold text-red">{r.verdict}</p>

        {r.evidence.length > 0 && (
          <ul className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10.5px]">
            {r.evidence.map((e) => (
              <li key={e} className="tnum">
                • {e}
              </li>
            ))}
          </ul>
        )}

        {r.ads.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[460px] text-[10.5px]">
              <thead>
                <tr className="text-left text-[9px] font-bold uppercase tracking-wider text-ink-faint">
                  <th className="py-1 pr-2">Annonce (14 j)</th>
                  <th className="py-1 pr-2 text-right">Spend</th>
                  <th className="py-1 pr-2 text-right">Ventes</th>
                  <th className="py-1 pr-2 text-right">ROAS</th>
                  <th className="py-1 pr-2 text-right">CPC</th>
                  <th className="py-1 text-right">CVR</th>
                </tr>
              </thead>
              <tbody>
                {r.ads.map((a) => (
                  <AdRow key={a.adId} a={a} breakEven={c.breakEven} />
                ))}
              </tbody>
            </table>
          </div>
        )}

        <ol className="flex flex-col gap-1">
          {r.plan.map((line, i) => (
            <li key={line} className="flex gap-1.5">
              <span className="font-bold text-ink">{i + 1}.</span>
              <span>{line}</span>
            </li>
          ))}
        </ol>

        {r.lastBatchDay && (
          <p className="text-[10px] text-ink-faint">
            Dernier batch injecté : <span className="tnum">{r.lastBatchDay.slice(8, 10)}/{r.lastBatchDay.slice(5, 7)}</span>
          </p>
        )}
      </div>
    </details>
  );
}

function CampaignPanel({ c }: { c: ScalingCampaign }) {
  const judged = [...c.windows].reverse().find((w) => w.verdict !== null) ?? c.windows[c.windows.length - 1];
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
              t: `Fenêtre de décision (${judged.label}${judged.inProgress ? " ⏳" : ""})`,
              v: judged.margin === null ? "—" : formatPct(judged.margin),
              cls: ZONE_TEXT[judged.zone],
            },
            {
              t: "ROAS fenêtre",
              v: judged.roas === null ? "—" : `${formatRoasBare(judged.roas)}×`,
              cls: ZONE_TEXT[judged.zone],
            },
            { t: "Conversions", v: String(judged.purchases), cls: c.lowSample ? "text-amber" : "text-ink" },
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

      <details className="group border-t border-line-soft">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3.5 py-2.5 text-[11px] [&::-webkit-details-marker]:hidden">
          <span className="flex items-center gap-2">
            <span className={`tnum inline-block rounded border px-1.5 py-0.5 text-[10.5px] font-bold ${BUDGET_CHIP_CURRENT}`}>
              {c.budgetCents !== null ? `${eur(c.budgetCents)}/j` : "budget ?"}
            </span>
            <span className="text-ink-dim">
              {c.budgetSinceLabel ? `depuis le ${c.budgetSinceLabel}` : "budget actuel (Meta)"}
            </span>
          </span>
          <span className="text-[10px] text-ink-faint transition-transform group-open:rotate-180">▾ historique</span>
        </summary>
        <div className="px-3.5 pb-3">
          <DailyTable c={c} />
        </div>
      </details>

      <RescueBlock c={c} />

      <div className="border-t border-line-soft p-3.5 text-[11px] leading-relaxed text-ink-dim">
        <p>
          <b className="text-ink">{c.why}</b>
        </p>
        {judged.inProgress && (
          <p className="mt-1">
            ⏳ <b className="text-ink">Fenêtre en cours</b> : la journée n&apos;est pas finie et l&apos;attribution Meta se
            remplit en 24-72 h — cette marge ne peut que <b className="text-ink">monter</b> d&apos;ici minuit. Exécute le
            mouvement sur le chiffre figé, entre minuit et 7 h (idéalement 00h-1h, T35).
          </p>
        )}
        {c.sauvetageDiagnostic && <p className="mt-1 text-red">🩺 {c.sauvetageDiagnostic}</p>}
        {c.lowSample && (
          <p className="mt-1 text-amber">
            ⚠️ {judged.purchases} conversions sur la fenêtre (&lt; 15) : traite ce verdict comme un ajustement,
            pas comme un jugement sur le produit. <span className="text-ink-faint">(seuil hors formation)</span>
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
        {c.creaPlan.length > 0 && c.rescue === null && (
          <ul className="mt-1 flex flex-col gap-1 rounded-lg border border-line-soft bg-terminal/50 p-2.5">
            {c.creaPlan.map((line) => (
              <li key={line} className="flex gap-1.5">
                <span aria-hidden>▸</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
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
        {report.mode === "night" ? (
          <>
            🌙 <b className="text-ink">Mode nuit (00 h → 7 h)</b> : données figées d&apos;hier 23h59, fenêtre{" "}
            <b className="tnum text-ink">{report.windowLabels[report.windowLabels.length - 1]}</b> — c&apos;est TA plage
            d&apos;exécution SCALE / DESCALE. À 7 h, l&apos;onglet bascule sur le jour J.
          </>
        ) : (
          <>
            <b className="text-ink">Fenêtre de décision : hier + aujourd&apos;hui</b>{" "}
            (<b className="tnum text-ink">{report.windowLabels[report.windowLabels.length - 1]} ⏳</b>) — en live jusqu&apos;à
            minuit ; exécution entre 00 h et 7 h sur les chiffres figés.
          </>
        )}{" "}
        Budgets et mouvements <b className="text-ink">lus sur Meta</b>.{" "}
        <b className="text-ink">Régime PRÉ-SCALING</b> (sous 3 000 €/j — toutes les campagnes actuelles) : la question est{" "}
        <b className="text-ink">binaire</b>, « rentable au backend sur les 2 derniers jours, marge ≥ 15 % ? ».{" "}
        <b className="text-phosphor">OUI</b> → on monte sur l&apos;échelle (×2 plafonné à 500 sous 500 €/j, puis{" "}
        <span className="tnum">500 → 750 → 1000 → 1500 → 1850 → 2250 → 3000</span>, +30 % au-delà) + créas neuves ·{" "}
        <b className="text-amber">NON</b> → l&apos;escalier : cran 1 <b className="text-amber">on attend 24 h</b>,
        crans 2 et 3 <b className="text-red">−15 % + créas</b>, cran 4 <b className="text-red">SAUVETAGE</b>{" "}
        (seulement après des réductions réellement exécutées). Plancher 100 €/j. La table de marge
        (0-10 rien · 10-15 hold · 15-30 → +20-30 % · 30 %+ → doubler) appartient au{" "}
        <b className="text-ink">régime SCALING</b> et ne s&apos;applique qu&apos;à partir de 3 000 €/j.
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
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm border border-phosphor bg-phosphor/25" /> ≥ 15 % — OUI : on monte sur l&apos;échelle</span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm border border-amber bg-amber/20" /> entre BE et 15 % — NON : ça consomme un cran d&apos;escalier</span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm border border-red bg-red/15" /> sous le BE — NON aussi (perte)</span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm border border-line bg-panel opacity-60" /> ⏳ fenêtre en cours (provisoire)</span>
      </div>

      <div className="rounded-lg border border-line bg-panel/40 p-3 text-[10.5px] leading-relaxed text-ink-dim">
        <h3 className="mb-1 text-[9.5px] font-bold uppercase tracking-wider text-ink-faint">
          🎬 SOP créas (formation T36/T37) — le rappel complet
        </h3>
        <ul className="flex flex-col gap-1">
          <li>
            ▸ <b className="text-ink">Batch</b> : 3-6 ads par NOUVEL adset · 2-3 adcopies + 2-3 titres + 1 description par
            ad · une adcopy par ANGLE · miniature choisie à la main · 50 % page marque / 50 % page tierce.
          </li>
          <li>
            ▸ <b className="text-ink">Où</b> (compte &lt; 3 000 €/j) : nouvel adset dans la CBO — jamais plus de 15 ads par
            adset — avec minimum spend 10-15 €/j pendant 2 jours. L&apos;ABO testing dédiée (~20 % du budget) n&apos;arrive
            qu&apos;à 3K+/j.
          </li>
          <li>
            ▸ <b className="text-ink">Lancement</b> : mardi → vendredi (jamais lundi), adset live entre minuit et 7 h ·
            Advantage+ créative OFF sauf relevant comments · placements originaux · exclure les acheteurs · audience
            identique au 1er lancement (même pays, même langue, on ne teste rien d&apos;autre) · adcopy et titre doivent
            matcher la LP et l&apos;offre (Meta les lit) · attribution : 7-day-click + 1-day-view en ABO testing,
            7-day-click only en CBO/scaling · naming : « Creative Testing &lt;mois&gt; &lt;semaine&gt; — &lt;batch&gt; ».
          </li>
          <li>
            ▸ <b className="text-ink">Winners</b> (≥ 6 ventes ET ≥ 10 % de marge sur 14 j) : marquer « WIN &lt;mois&gt;
            &lt;semaine&gt; » — une ad marquée n&apos;est dispatchée qu&apos;UNE fois. ⚠️ Le dispatch (dupliquer avec le
            MÊME POST ID dans un nouvel adset « winners », min spend ≈ AOV×2÷7, en pratique 10-15 $) est le process
            ABO → CBO : « si vous êtes en CBO, il n&apos;y a rien à faire, vos ads sont déjà là » (T37). En CBO, seuls
            partent en ZOMBIE les ≥ 6 ventes sous le BE. Potential winner (entre BE et 10 %) et signal précoce (&lt; 6
            ventes mais marge ≥ 15 %) : à surveiller/injecter (T37). À ≥ 50 ventes toujours rentable → renommer BANGER.
            Un adset qui performe peut recevoir 1-2 créas max à la fois.
          </li>
        </ul>
      </div>

      <div className="rounded-lg border border-line bg-panel/40 p-3 text-[10px] leading-relaxed text-ink-faint">
        <p>
          <b className="text-ink-dim">Réserves.</b> Paramètres chiffrés <b>hors formation</b> (elle lit ces signaux à
          l&apos;œil, sans seuil) : ±20 % vs la médiane de la campagne pour le cadran CPC/CVR et la saturation (4 j et
          1 000 impressions minimum par moitié), 15 conversions pour la réserve d&apos;échantillon, série de NON cassée
          par un trou de diffusion. Marges calculées sur le <b>ROAS Meta</b> (marge = CM − 1/ROAS), un
          plafond à confronter à <code className="tnum">/api/roas-report</code> (ROAS UTM Shopify). Attribution Meta :
          24-72 h pour se remplir. Budgets et mouvements : <b>lus sur Meta</b> (daily_budget + journal d&apos;activités du
          compte). Seuils BE/Cible : CM 14 j glissants par produit. Protocole : formation Master, leçon 35 (arbitrage
          18/08). L&apos;onglet recommande, <b>il n&apos;exécute jamais</b>.
        </p>
      </div>
    </div>
  );
}
