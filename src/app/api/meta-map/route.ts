import { NextRequest, NextResponse } from "next/server";
import { getDataMode } from "@/lib/data";
import type { Market } from "@/lib/engine";
import { recomputeDailyAggregatesForDays } from "@/lib/aggregate";

const MARKETS: Market[] = ["ES", "UK", "DE", "FR"];

/**
 * §4.6 — affectation manuelle d'une campagne UNMAPPED à un marché.
 * Persiste l'override (les fetchs futurs le respecteront), bascule les lignes
 * meta_spend existantes, puis recalcule les agrégats des jours touchés
 * (loi §0.6 : recalcul plutôt que patch).
 */
export async function POST(request: NextRequest) {
  const mode = getDataMode();
  if (mode !== "live") {
    return NextResponse.json(
      { ok: false, reason: "L'affectation n'est possible qu'en mode réel (Supabase configuré)." },
      { status: 400 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, reason: "JSON invalide." }, { status: 400 });
  }

  const campaignId = String(body.campaignId ?? "");
  const market = String(body.market ?? "");
  if (!campaignId) {
    return NextResponse.json({ ok: false, reason: "campaignId manquant." }, { status: 400 });
  }
  if (!MARKETS.includes(market as Market)) {
    return NextResponse.json({ ok: false, reason: "Marché invalide." }, { status: 400 });
  }

  const { createSupabaseServerClient } = await import("@/lib/supabase");
  const supabase = createSupabaseServerClient();

  const { error: overrideError } = await supabase
    .from("campaign_market_overrides")
    .upsert({ campaign_id: campaignId, market });
  if (overrideError) {
    return NextResponse.json({ ok: false, reason: overrideError.message }, { status: 500 });
  }

  const { data: touched, error: daysError } = await supabase
    .from("meta_spend")
    .select("day")
    .eq("campaign_id", campaignId);
  if (daysError) {
    return NextResponse.json({ ok: false, reason: daysError.message }, { status: 500 });
  }

  const { error: updateError } = await supabase
    .from("meta_spend")
    .update({ market })
    .eq("campaign_id", campaignId);
  if (updateError) {
    return NextResponse.json({ ok: false, reason: updateError.message }, { status: 500 });
  }

  const days = [...new Set((touched ?? []).map((r) => r.day as string))];
  await recomputeDailyAggregatesForDays(supabase, days, [market as Market]);

  return NextResponse.json({ ok: true, days: days.length });
}
