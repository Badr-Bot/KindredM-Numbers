import { NextRequest, NextResponse } from "next/server";
import { getDataMode } from "@/lib/data";
import type { Market } from "@/lib/engine";

const MARKETS: Market[] = ["ES", "UK", "DE", "FR"];
const STATUSES = ["open", "won", "lost"] as const;

// Saisie manuelle d'une rétrofacturation (§ vue Contrôle). Derrière le
// basic-auth du proxy. Insère dans Supabase en mode live ; refuse proprement
// en démo/non configuré (pas de persistance).
export async function POST(request: NextRequest) {
  const mode = getDataMode();
  if (mode !== "live") {
    return NextResponse.json(
      { ok: false, reason: "La saisie n'est possible qu'en mode réel (Supabase configuré)." },
      { status: 400 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, reason: "JSON invalide." }, { status: 400 });
  }

  const day = String(body.day ?? "");
  const market = String(body.market ?? "");
  const amountCents = Math.round(Number(body.amountCents));
  const feeCents = Math.round(Number(body.feeCents ?? 0));
  const status = String(body.status ?? "open");
  const orderName = body.orderName ? String(body.orderName) : null;
  const reason = body.reason ? String(body.reason) : null;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) {
    return NextResponse.json({ ok: false, reason: "Date invalide (AAAA-MM-JJ)." }, { status: 400 });
  }
  if (!MARKETS.includes(market as Market)) {
    return NextResponse.json({ ok: false, reason: "Marché invalide." }, { status: 400 });
  }
  if (!Number.isFinite(amountCents) || amountCents <= 0) {
    return NextResponse.json({ ok: false, reason: "Montant invalide." }, { status: 400 });
  }
  if (!STATUSES.includes(status as (typeof STATUSES)[number])) {
    return NextResponse.json({ ok: false, reason: "Statut invalide." }, { status: 400 });
  }

  const { createSupabaseServerClient } = await import("@/lib/supabase");
  const supabase = createSupabaseServerClient();
  const { error } = await supabase.from("chargebacks").insert({
    day,
    market,
    order_name: orderName,
    amount_cents: amountCents,
    fee_cents: feeCents,
    status,
    reason,
  });
  if (error) {
    return NextResponse.json({ ok: false, reason: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
