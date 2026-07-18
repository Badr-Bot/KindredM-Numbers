import { createSupabaseServerClient } from "./supabase";
import { addDaysToDay, todayParisDay } from "./time";

// 🧠 Brief du jour v1 — le résumé qui vient à toi (plan Intelligence §5).
// v1 = données Shopify + spend : net d'hier vs moyenne 7 j, anomalies
// CA/CPA/panier (±20 %), rappels d'événements campagne auto-détectés.
// v2 (waterfall CPM/CTR/CVR) s'activera avec le token Meta.

export interface BriefLine {
  emoji: string;
  text: string;
  tone: "good" | "bad" | "neutral";
}

export interface Brief {
  day: string;
  lines: BriefLine[];
}

interface DayTotals {
  caCents: number;
  spendCents: number;
  netCents: number;
  orders: number;
}

const eur = (c: number) =>
  (c >= 0 ? "+" : "−") + Math.abs(Math.round(c / 100)).toLocaleString("fr-FR") + " €";
const eurAbs = (c: number) => Math.round(c / 100).toLocaleString("fr-FR") + " €";
const pct = (v: number) => (v >= 0 ? "+" : "−") + Math.round(Math.abs(v) * 100) + " %";

export async function computeBrief(): Promise<Brief | null> {
  const supabase = createSupabaseServerClient();
  const today = todayParisDay();
  const yesterday = addDaysToDay(today, -1);
  const since = addDaysToDay(today, -9);

  const { data, error } = await supabase
    .from("daily_aggregates")
    .select("day, ca_cents, spend_cents, net_cents, orders")
    .gte("day", since)
    .lte("day", yesterday);
  if (error || !data || data.length === 0) return null;

  const byDay = new Map<string, DayTotals>();
  for (const r of data) {
    const day = String(r.day);
    const t = byDay.get(day) ?? { caCents: 0, spendCents: 0, netCents: 0, orders: 0 };
    t.caCents += r.ca_cents as number;
    t.spendCents += r.spend_cents as number;
    t.netCents += r.net_cents as number;
    t.orders += r.orders as number;
    byDay.set(day, t);
  }

  const y = byDay.get(yesterday);
  if (!y) return null;

  // moyenne des 7 jours pleins précédant hier
  const refDays: DayTotals[] = [];
  for (let i = 2; i <= 8; i++) {
    const t = byDay.get(addDaysToDay(today, -i));
    if (t) refDays.push(t);
  }
  if (refDays.length < 3) return null;
  const avg = (f: (t: DayTotals) => number) =>
    refDays.reduce((s, t) => s + f(t), 0) / refDays.length;

  const lines: BriefLine[] = [];

  // 1 · Net d'hier vs moyenne
  const avgNet = avg((t) => t.netCents);
  const netDelta = avgNet !== 0 ? (y.netCents - avgNet) / Math.abs(avgNet) : 0;
  lines.push({
    emoji: y.netCents >= 0 ? "💰" : "🔻",
    text: `Hier : net ${eur(y.netCents)} (${pct(netDelta)} vs moyenne 7 j).`,
    tone: y.netCents >= 0 ? "good" : "bad",
  });

  // 2 · Anomalies ±20 % : CA, CPA, panier moyen
  const checks: { label: string; cur: number; ref: number; upIsBad: boolean; fmt: (v: number) => string }[] = [
    { label: "CA", cur: y.caCents, ref: avg((t) => t.caCents), upIsBad: false, fmt: eurAbs },
    {
      label: "CPA",
      cur: y.orders > 0 ? y.spendCents / y.orders : 0,
      ref: avg((t) => (t.orders > 0 ? t.spendCents / t.orders : 0)),
      upIsBad: true,
      fmt: (v) => (v / 100).toLocaleString("fr-FR", { maximumFractionDigits: 2 }) + " €",
    },
    {
      label: "Panier moyen",
      cur: y.orders > 0 ? y.caCents / y.orders : 0,
      ref: avg((t) => (t.orders > 0 ? t.caCents / t.orders : 0)),
      upIsBad: false,
      fmt: (v) => (v / 100).toLocaleString("fr-FR", { maximumFractionDigits: 2 }) + " €",
    },
  ];
  for (const c of checks) {
    if (c.ref === 0 || c.cur === 0) continue;
    const d = (c.cur - c.ref) / Math.abs(c.ref);
    if (Math.abs(d) < 0.2) continue;
    const bad = c.upIsBad ? d > 0 : d < 0;
    lines.push({
      emoji: bad ? "🚨" : "✨",
      text: `${c.label} ${pct(d)} vs moyenne 7 j (${c.fmt(c.cur)}).`,
      tone: bad ? "bad" : "good",
    });
  }

  // 3 · Rappels : campagnes coupées récemment (événements auto du journal)
  try {
    const { data: ev } = await supabase
      .from("events")
      .select("day, note")
      .eq("source", "auto")
      .eq("type", "campagne")
      .gte("day", addDaysToDay(today, -5))
      .order("day", { ascending: false })
      .limit(2);
    for (const e of ev ?? []) {
      lines.push({ emoji: "📓", text: `${String(e.day).slice(8)}/${String(e.day).slice(5, 7)} · ${e.note}`, tone: "neutral" });
    }
  } catch {
    // journal pas encore migré — ignorer
  }

  if (lines.length === 1) {
    lines.push({ emoji: "✅", text: "Rien d'anormal détecté sur CA, CPA et panier.", tone: "neutral" });
  }

  return { day: yesterday, lines: lines.slice(0, 5) };
}
