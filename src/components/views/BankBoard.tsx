"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { BankReport, BankTx, TxLabel } from "@/lib/bank";
import { formatEur0 } from "@/lib/format";

// 🏦 Contrôle bancaire — chaque euro sorti doit finir dans exactement une
// case (Société / Perso Badr / Perso Fahd), tout le reste est une anomalie
// affichée jusqu'à affectation. Lecture seule côté banque : aucun ordre de
// paiement, l'affectation n'écrit que dans le dashboard.

const CAT_CHIP: Record<BankTx["category"], { txt: string; cls: string }> = {
  META: { txt: "META", cls: "border-cyan/50 bg-cyan/10 text-cyan" },
  SHOPIFY: { txt: "SHOPIFY", cls: "border-phosphor/50 bg-phosphor/10 text-phosphor" },
  ABONNEMENT: { txt: "ABO", cls: "border-amber/50 bg-amber/10 text-amber" },
  AUTRE: { txt: "AUTRE", cls: "border-line text-ink-dim" },
};

function money(cents: number | null, currency = "EUR"): string {
  if (cents === null) return "—";
  const v = (cents / 100).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${v} ${currency === "EUR" ? "€" : currency}`;
}

function GapTile({ title, bank, expected, note }: { title: string; bank: number; expected: number; note: string }) {
  const gap = bank - expected;
  const gapCls = Math.abs(gap) <= Math.max(1000, expected * 0.05) ? "text-phosphor" : "text-red";
  return (
    <div className="flex-1 rounded-lg border border-line bg-panel p-3">
      <div className="text-[9.5px] font-bold uppercase tracking-wider text-ink-faint">{title}</div>
      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[12px]">
        <span>
          Banque <b className="tnum text-ink">{formatEur0(bank)}</b>
        </span>
        <span>
          Prévu <b className="tnum text-ink">{formatEur0(expected)}</b>
        </span>
        <span>
          Écart <b className={`tnum ${gapCls}`}>{gap >= 0 ? "+" : ""}{formatEur0(gap)}</b>
        </span>
      </div>
      <p className="mt-1 text-[10px] leading-snug text-ink-faint">{note}</p>
    </div>
  );
}

const LABEL_META: Record<TxLabel, { txt: string; cls: string }> = {
  SOCIETE: { txt: "SOCIÉTÉ", cls: "border-cyan/50 bg-cyan/10 text-cyan" },
  PERSO_BADR: { txt: "BADR", cls: "border-net-5/50 bg-net-5/10 text-net-5" },
  PERSO_FAHD: { txt: "FAHD", cls: "border-amber/50 bg-amber/10 text-amber" },
  IGNORER: { txt: "IGNORÉE", cls: "border-line text-ink-faint" },
};

function AssignButtons({ tx, compact = false }: { tx: BankTx; compact?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function assign(kind: TxLabel) {
    setBusy(true);
    try {
      const res = await fetch("/api/bank-label", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bank: tx.bank, txId: tx.txId, kind }),
      });
      if (res.ok) router.refresh();
      else alert((await res.json()).reason ?? "Erreur");
    } finally {
      setBusy(false);
    }
  }
  const btn = "rounded border px-1.5 py-0.5 text-[9.5px] font-bold transition-colors disabled:opacity-40";
  return (
    <span className={`flex flex-wrap gap-1 ${compact ? "" : "mt-1"}`}>
      <button disabled={busy} onClick={() => assign("SOCIETE")} className={`${btn} border-cyan/50 text-cyan hover:bg-cyan/10`}>Société</button>
      <button disabled={busy} onClick={() => assign("PERSO_BADR")} className={`${btn} border-net-5/50 text-net-5 hover:bg-net-5/10`}>Badr</button>
      <button disabled={busy} onClick={() => assign("PERSO_FAHD")} className={`${btn} border-amber/50 text-amber hover:bg-amber/10`}>Fahd</button>
      <button disabled={busy} onClick={() => assign("IGNORER")} className={`${btn} border-line text-ink-faint hover:bg-terminal-2`}>Ignorer</button>
    </span>
  );
}

export function BankBoard({ report }: { report: BankReport }) {
  const control = report.control;
  return (
    <div className="flex flex-col gap-4">
      {control && control.anomalies.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {control.anomalies.map((a, i) => (
            <div
              key={`${a.kind}-${i}`}
              className={`rounded-lg border p-2.5 text-[11px] leading-snug ${
                a.severity === "red" ? "border-red/50 bg-red/[0.06] text-red" : "border-amber/50 bg-amber/[0.06] text-amber"
              }`}
            >
              <b>{a.severity === "red" ? "🚨" : "⚠️"} {a.label}</b>
              {a.detail && <span className="block text-[10px] opacity-80">{a.detail}</span>}
            </div>
          ))}
        </div>
      )}
      {control && control.anomalies.length === 0 && report.ready && (
        <div className="rounded-lg border border-phosphor/40 bg-phosphor/[0.05] p-2.5 text-[11px] font-semibold text-phosphor">
          ✅ Aucune anomalie : tout l&apos;argent sorti est identifié et les montants collent.
        </div>
      )}

      {control && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { t: "Société (30 j)", v: control.parts.societeCents, cls: "text-cyan" },
            { t: "Perso Badr", v: control.parts.persoBadrCents, cls: "text-net-5" },
            { t: "Perso Fahd", v: control.parts.persoFahdCents, cls: "text-amber" },
            { t: `À affecter (${control.parts.aAffecterCount})`, v: control.parts.aAffecterCents, cls: control.parts.aAffecterCount > 0 ? "text-red" : "text-phosphor" },
          ].map((x) => (
            <div key={x.t} className="rounded-lg border border-line bg-panel p-2.5">
              <div className="text-[9px] font-bold uppercase tracking-wider text-ink-faint">{x.t}</div>
              <div className={`tnum text-[15px] font-extrabold ${x.cls}`}>{formatEur0(x.v)}</div>
            </div>
          ))}
        </div>
      )}

      {control && (control.parts.persoBadrCents > 0 || control.parts.persoFahdCents > 0) && (
        <p className="rounded-lg border border-line bg-panel/40 p-2.5 text-[10.5px] text-ink-dim">
          👥 <b className="text-ink">Entre associés (via banque, 30 j)</b> — le perso payé par la LLC est une avance,
          moitié due à l&apos;autre (50/50) :{" "}
          {control.parts.soldeBadrDoitAFahdCents === 0 ? (
            <b className="text-phosphor">équilibré</b>
          ) : control.parts.soldeBadrDoitAFahdCents > 0 ? (
            <b className="tnum text-amber">Badr doit {formatEur0(control.parts.soldeBadrDoitAFahdCents)} à Fahd</b>
          ) : (
            <b className="tnum text-amber">Fahd doit {formatEur0(-control.parts.soldeBadrDoitAFahdCents)} à Badr</b>
          )}
          . S&apos;ajoute au solde historique « Entre associés » de l&apos;onglet Année (avances perso → société).
        </p>
      )}

      {control && control.toAssign.length > 0 && (
        <div className="rounded-lg border border-red/40 bg-panel p-3">
          <div className="text-[9.5px] font-bold uppercase tracking-wider text-red">📥 À affecter — chaque euro doit avoir une case</div>
          <table className="mt-1 w-full text-[11px]">
            <tbody>
              {control.toAssign.map((t) => (
                <tr key={`${t.bank}-${t.txId}`} className="border-t border-line-soft align-top">
                  <td className="py-1.5 pr-2 tnum text-ink-dim">{t.day.slice(8, 10)}/{t.day.slice(5, 7)}</td>
                  <td className="py-1.5 pr-2">
                    <span className="text-ink">{t.description}</span>
                    <AssignButtons tx={t} />
                  </td>
                  <td className="py-1.5 text-right tnum font-bold text-red">{money(t.amountCents, t.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {report.setup.length > 0 && (
        <div className="rounded-lg border border-cyan/40 bg-cyan/[0.05] p-2.5 text-[10.5px] text-cyan">
          {report.setup.map((s) => (
            <p key={s}>🔧 {s}</p>
          ))}
        </div>
      )}
      {report.warnings.length > 0 && (
        <div className="rounded-lg border border-amber/40 bg-amber/[0.05] p-2.5 text-[10.5px] text-amber">
          {report.warnings.map((w) => (
            <p key={w}>⚠️ {w}</p>
          ))}
        </div>
      )}

      {report.balances.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {report.balances.map((b) => (
            <span key={`${b.bank}-${b.currency}`} className="tnum rounded-lg border border-line bg-panel px-2.5 py-1.5 text-[12px] font-bold text-ink">
              {b.bank} · {money(b.amountCents, b.currency)}
            </span>
          ))}
        </div>
      )}

      {report.reconciliation && (
        <>
          <div className="flex flex-col gap-2 sm:flex-row">
            <GapTile
              title={`Meta Ads (${report.reconciliation.sinceDay.slice(8)}/${report.reconciliation.sinceDay.slice(5, 7)} → aujourd'hui)`}
              bank={report.reconciliation.meta.bankCents}
              expected={report.reconciliation.meta.expectedCents}
              note="Meta facture par paliers, pas jour par jour : seul le TOTAL de la fenêtre doit coller."
            />
            <GapTile
              title="Versements Shopify"
              bank={report.reconciliation.shopify.bankCents}
              expected={report.reconciliation.shopify.expectedCents}
              note="Prévu = CA − frais estimés. Les payouts arrivent en différé (2-4 j) : écart de bord de fenêtre normal."
            />
          </div>

          {report.reconciliation.subscriptions.length > 0 && (
            <div className="rounded-lg border border-line bg-panel p-3">
              <div className="text-[9.5px] font-bold uppercase tracking-wider text-ink-faint">Abonnements (30 j)</div>
              <table className="mt-1 w-full text-[11px]">
                <tbody>
                  {report.reconciliation.subscriptions.map((s) => (
                    <tr key={s.label} className="border-t border-line-soft">
                      <td className="py-1">{s.label}</td>
                      <td className="py-1 text-right tnum">payé {formatEur0(s.paidCents)}</td>
                      <td className="py-1 text-right tnum text-ink-dim">attendu ~{formatEur0(s.expectedMonthlyCents)}/mois</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {report.txs.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-line bg-panel p-3">
          <div className="text-[9.5px] font-bold uppercase tracking-wider text-ink-faint">Transactions (30 j)</div>
          <table className="mt-1 w-full min-w-[480px] text-[11px]">
            <tbody>
              {report.txs.map((t) => (
                <tr key={`${t.bank}-${t.txId}`} className="border-t border-line-soft">
                  <td className="py-1 pr-2 tnum text-ink-dim">{t.day.slice(8, 10)}/{t.day.slice(5, 7)}</td>
                  <td className="py-1 pr-2">
                    <span className={`mr-1.5 rounded border px-1 text-[9px] font-bold ${CAT_CHIP[t.category].cls}`}>{CAT_CHIP[t.category].txt}</span>
                    {t.label && (
                      <span className={`mr-1.5 rounded border px-1 text-[9px] font-bold ${LABEL_META[t.label].cls}`}>{LABEL_META[t.label].txt}</span>
                    )}
                    <span className="text-ink">{t.description}</span>
                  </td>
                  <td className={`py-1 text-right tnum font-bold ${t.amountCents < 0 ? "text-red" : "text-phosphor"}`}>
                    {money(t.amountCents, t.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-[10px] text-ink-faint">
        Lecture seule (aucun ordre de paiement possible). Wise : relevés sur 30 j, rafraîchis toutes les 15 min — le bouton
        Actualiser force la relecture. USD converti au taux figé du dashboard (1 € = 1,1539 $).
      </p>
    </div>
  );
}
