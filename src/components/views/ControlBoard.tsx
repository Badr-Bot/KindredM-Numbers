"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Chargeback, DataMode, DayAgg } from "@/lib/data";
import type { Market } from "@/lib/engine";
import { MARKET_META, MARKETS, type MarketTab } from "@/lib/markets";
import {
  formatDayShort,
  formatEur0,
  formatEurSigned0,
  formatMonthLabel,
  formatPct,
} from "@/lib/format";
import { MarketTabs } from "../shell/MarketTabs";
import { useSound } from "../sound/SoundProvider";

type Granularity = "month" | "year";

// Au-delà de ce taux de remboursement (part du CA brut), c'est un signal
// produit/transporteur à investiguer — badge rouge. Ajustable ici.
const REFUND_ALERT_RATE = 0.03;

const STATUS_META: Record<Chargeback["status"], { label: string; emoji: string; className: string }> = {
  open: { label: "En cours", emoji: "⏳", className: "text-amber" },
  won: { label: "Gagné", emoji: "✅", className: "text-phosphor" },
  lost: { label: "Perdu", emoji: "❌", className: "text-red" },
};

function prevMonth(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 2, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function ControlBoard({
  mode,
  dayData,
  chargebacks,
  months,
  years,
}: {
  mode: DataMode;
  dayData: Record<MarketTab, DayAgg[]>;
  chargebacks: Chargeback[];
  months: string[];
  years: string[];
}) {
  const { play } = useSound();
  const router = useRouter();
  const [tab, setTab] = useState<MarketTab>("GLOBAL");
  const [gran, setGran] = useState<Granularity>("month");
  const [monthIdx, setMonthIdx] = useState(months.length - 1);
  const [yearIdx, setYearIdx] = useState(years.length - 1);

  const period = gran === "month" ? months[monthIdx] : years[yearIdx];

  const rows = dayData[tab];
  const periodRows = useMemo(() => rows.filter((r) => r.day.startsWith(period)), [rows, period]);

  const caNetCents = periodRows.reduce((s, r) => s + r.caCents, 0);
  const netCents = periodRows.reduce((s, r) => s + r.netCents, 0);
  const refundedCents = periodRows.reduce((s, r) => s + r.refundedCents, 0);
  const grossCaCents = caNetCents + refundedCents;
  const refundRate = grossCaCents > 0 ? refundedCents / grossCaCents : 0;

  const cbInPeriod = useMemo(
    () =>
      chargebacks.filter(
        (c) => c.day.startsWith(period) && (tab === "GLOBAL" || c.market === tab)
      ),
    [chargebacks, period, tab]
  );

  const cbLostCents = cbInPeriod.filter((c) => c.status === "lost").reduce((s, c) => s + c.amountCents, 0);
  const cbOpenCents = cbInPeriod.filter((c) => c.status === "open").reduce((s, c) => s + c.amountCents, 0);
  const cbFeesCents = cbInPeriod.filter((c) => c.status !== "won").reduce((s, c) => s + c.feeCents, 0);

  // Argent repris = remboursements (déjà dans le net) + litiges perdus + frais.
  const moneyBackCents = refundedCents + cbLostCents + cbFeesCents;
  // Net ajusté : le net (qui inclut déjà les remboursements) moins les pertes
  // de litiges + leurs frais (qui ne sont PAS dans le net validé).
  const netAdjustedCents = netCents - cbLostCents - cbFeesCents;

  const changePeriod = (delta: number) => {
    play("tab");
    if (gran === "month") setMonthIdx((i) => Math.min(months.length - 1, Math.max(0, i + delta)));
    else setYearIdx((i) => Math.min(years.length - 1, Math.max(0, i + delta)));
  };

  const periodLabel = gran === "month" ? formatMonthLabel(period) : period;
  const canPrev = gran === "month" ? monthIdx > 0 : yearIdx > 0;
  const canNext = gran === "month" ? monthIdx < months.length - 1 : yearIdx < years.length - 1;

  void prevMonth; // réservé pour un futur Δ vs période précédente

  return (
    <div className="flex flex-col gap-3">
      {/* Granularité + période */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-1">
          {(["month", "year"] as Granularity[]).map((g) => (
            <button
              key={g}
              onClick={() => {
                play("tab");
                setGran(g);
              }}
              className={`rounded-md border px-3 py-1 text-xs font-semibold ${
                g === gran ? "border-phosphor/60 bg-phosphor/10 text-phosphor" : "border-line text-ink-dim"
              }`}
            >
              {g === "month" ? "Mois" : "Année"}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => changePeriod(-1)}
            disabled={!canPrev}
            aria-label="Période précédente"
            className="flex h-7 w-7 items-center justify-center rounded border border-line text-ink-dim hover:border-phosphor hover:text-phosphor disabled:opacity-30"
          >
            ◀
          </button>
          <span className="min-w-[104px] text-center text-sm font-semibold capitalize">{periodLabel}</span>
          <button
            onClick={() => changePeriod(1)}
            disabled={!canNext}
            aria-label="Période suivante"
            className="flex h-7 w-7 items-center justify-center rounded border border-line text-ink-dim hover:border-phosphor hover:text-phosphor disabled:opacity-30"
          >
            ▶
          </button>
        </div>
      </div>

      <MarketTabs active={tab} onChange={setTab} />

      {/* Argent repris + net ajusté (les 2 chiffres à maîtriser) */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-red/30 bg-red/[0.04] p-4">
          <div className="text-[10px] uppercase tracking-wide text-ink-faint">💸 Argent repris</div>
          <div className="mt-1 text-2xl font-bold tnum text-red">−{formatEur0(moneyBackCents)}</div>
          <div className="mt-0.5 text-[10px] text-ink-faint tnum">
            {formatPct(grossCaCents > 0 ? moneyBackCents / grossCaCents : 0)} du CA brut
          </div>
        </div>
        <div className="rounded-xl border border-line bg-panel/50 p-4">
          <div className="text-[10px] uppercase tracking-wide text-ink-faint">Net ajusté (après litiges)</div>
          <div className={`mt-1 text-2xl font-bold tnum ${netAdjustedCents >= 0 ? "text-phosphor" : "text-red"}`}>
            {formatEurSigned0(netAdjustedCents)}
          </div>
          <div className="mt-0.5 text-[10px] text-ink-faint tnum">net {formatEurSigned0(netCents)} − litiges perdus/frais</div>
        </div>
      </div>

      {/* Remboursements */}
      <section
        className={`rounded-lg border p-3.5 ${
          refundRate > REFUND_ALERT_RATE ? "border-red/40 bg-red/[0.04]" : "border-line bg-panel/40"
        }`}
      >
        <div className="mb-2 flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm font-semibold">
            ↩︎ Remboursements
            {refundRate > REFUND_ALERT_RATE && (
              <span className="rounded border border-red/50 bg-red/10 px-1 py-0.5 text-[9px] font-bold text-red">
                🚨 taux &gt; {formatPct(REFUND_ALERT_RATE)}
              </span>
            )}
          </span>
          <span className="text-[10px] text-ink-faint">déjà déduits du net</span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <Stat label="Remboursé" value={formatEur0(refundedCents)} />
          <Stat
            label="Taux"
            value={formatPct(refundRate)}
            valueClass={refundRate > REFUND_ALERT_RATE ? "text-red" : ""}
          />
          <Stat label="CA brut" value={formatEur0(grossCaCents)} />
        </div>
      </section>

      {/* Rétrofacturations */}
      <section className="rounded-lg border border-line bg-panel/40 p-3.5">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-semibold">⚖️ Rétrofacturations (litiges)</span>
          <span className="text-[10px] text-ink-faint">{cbInPeriod.length} cas</span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <Stat label="Perdu ❌" value={formatEur0(cbLostCents)} valueClass="text-red" />
          <Stat label="En cours ⏳" value={formatEur0(cbOpenCents)} valueClass="text-amber" />
          <Stat label="Frais" value={formatEur0(cbFeesCents)} />
        </div>

        {cbInPeriod.length > 0 && (
          <ul className="mt-3 flex flex-col divide-y divide-line-soft">
            {cbInPeriod.map((c) => {
              const st = STATUS_META[c.status];
              return (
                <li key={c.id} className="flex items-center justify-between gap-2 py-1.5 text-[11.5px]">
                  <span className="flex items-center gap-1.5">
                    <span aria-hidden>{MARKET_META[c.market].flag}</span>
                    <span className="text-ink-dim">{formatDayShort(c.day)}</span>
                    {c.orderName && <span className="text-ink-faint">{c.orderName}</span>}
                    {c.reason && <span className="hidden text-ink-faint sm:inline">· {c.reason}</span>}
                  </span>
                  <span className="flex items-center gap-2 tnum">
                    <span className="font-semibold">{formatEur0(c.amountCents)}</span>
                    <span className={`text-[10px] ${st.className}`}>
                      {st.emoji} {st.label}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <ChargebackForm mode={mode} onSaved={() => router.refresh()} />

      <p className="text-center text-[10px] text-ink-faint">
        Le « net ajusté » ne modifie pas le net validé au centime : c&apos;est un calque de contrôle. Les
        remboursements sont déjà dans le net ; les litiges perdus + frais s&apos;en déduisent en plus.
      </p>
    </div>
  );
}

function Stat({ label, value, valueClass = "" }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[9px] uppercase tracking-wide text-ink-faint">{label}</span>
      <span className={`text-sm font-bold tnum ${valueClass}`}>{value}</span>
    </div>
  );
}

function ChargebackForm({ mode, onSaved }: { mode: DataMode; onSaved: () => void }) {
  const { play } = useSound();
  const isDemo = mode !== "live";
  const [open, setOpen] = useState(false);
  const [day, setDay] = useState("");
  const [market, setMarket] = useState<Market>("ES");
  const [amount, setAmount] = useState("");
  const [fee, setFee] = useState("15");
  const [status, setStatus] = useState<Chargeback["status"]>("open");
  const [orderName, setOrderName] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true);
    setMsg(null);
    play("beep");
    try {
      const res = await fetch("/api/chargebacks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          day,
          market,
          amountCents: Math.round(parseFloat(amount.replace(",", ".")) * 100),
          feeCents: Math.round(parseFloat((fee || "0").replace(",", ".")) * 100),
          status,
          orderName: orderName || null,
          reason: reason || null,
        }),
      });
      const json = await res.json();
      if (json.ok) {
        setMsg("Litige enregistré.");
        setAmount("");
        setOrderName("");
        setReason("");
        onSaved();
      } else {
        setMsg(json.reason ?? "Échec de l'enregistrement.");
      }
    } catch {
      setMsg("Erreur réseau.");
    }
    setBusy(false);
  };

  return (
    <section className="rounded-lg border border-line bg-panel/40 p-3.5">
      <button
        onClick={() => {
          play("tick");
          setOpen((o) => !o);
        }}
        className="flex w-full items-center justify-between text-sm font-semibold"
        aria-expanded={open}
      >
        <span>➕ Logger une rétrofacturation</span>
        <span className="text-ink-dim">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="mt-3 flex flex-col gap-2">
          {isDemo && (
            <p className="rounded border border-amber/30 bg-amber/[0.05] p-2 text-[10.5px] text-amber">
              Mode démo : la saisie n&apos;est pas persistée. Elle fonctionnera en mode réel (Supabase).
            </p>
          )}
          <div className="grid grid-cols-2 gap-2">
            <Field label="Date">
              <input type="date" value={day} onChange={(e) => setDay(e.target.value)} className={inputCls} />
            </Field>
            <Field label="Marché">
              <select value={market} onChange={(e) => setMarket(e.target.value as Market)} className={inputCls}>
                {MARKETS.map((m) => (
                  <option key={m} value={m}>
                    {MARKET_META[m].flag} {m}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Montant (€)">
              <input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="59,99" className={inputCls} />
            </Field>
            <Field label="Frais (€)">
              <input inputMode="decimal" value={fee} onChange={(e) => setFee(e.target.value)} placeholder="15" className={inputCls} />
            </Field>
            <Field label="Statut">
              <select value={status} onChange={(e) => setStatus(e.target.value as Chargeback["status"])} className={inputCls}>
                <option value="open">⏳ En cours</option>
                <option value="won">✅ Gagné</option>
                <option value="lost">❌ Perdu</option>
              </select>
            </Field>
            <Field label="Commande (opt.)">
              <input value={orderName} onChange={(e) => setOrderName(e.target.value)} placeholder="#1042" className={inputCls} />
            </Field>
          </div>
          <Field label="Motif (opt.)">
            <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Transaction non reconnue" className={inputCls} />
          </Field>
          <div className="flex items-center gap-3">
            <button
              onClick={submit}
              disabled={busy || !day || !amount}
              className="rounded border border-phosphor/60 bg-phosphor/10 px-3 py-1.5 text-xs font-semibold text-phosphor transition-colors hover:bg-phosphor/20 disabled:opacity-40"
            >
              {busy ? "…" : "Enregistrer"}
            </button>
            {msg && <span className="text-[10.5px] text-ink-dim">{msg}</span>}
          </div>
        </div>
      )}
    </section>
  );
}

const inputCls =
  "w-full rounded border border-line bg-terminal px-2 py-1.5 text-[12px] text-ink outline-none focus:border-phosphor";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[9px] uppercase tracking-wide text-ink-faint">{label}</span>
      {children}
    </label>
  );
}
