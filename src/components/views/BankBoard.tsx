import type { BankReport, BankTx } from "@/lib/bank";
import { formatEur0 } from "@/lib/format";

// 🏦 Rapprochement bancaire — lecture seule, aucun ordre de paiement.

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

export function BankBoard({ report }: { report: BankReport }) {
  return (
    <div className="flex flex-col gap-4">
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
