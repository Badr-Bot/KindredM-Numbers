import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase";
import { buildEscalierReport } from "@/lib/escalier";
import { todayParisDay, addDaysToDay } from "@/lib/time";

export const dynamic = "force-dynamic";

/**
 * 🪜 Escalier — le rapport de décision nocturne en JSON (même moteur que
 * l'onglet /escalier, protocole de la formation leçon 35).
 *
 * Le jour EN COURS est toujours exclu : le rapport d'un appel à 15 h est
 * identique à celui de minuit (endDay = hier par défaut).
 *
 * GET /api/escalier             → fenêtres finissant à HIER (Europe/Paris)
 * GET /api/escalier?day=YYYY-MM-DD → fenêtres finissant à ce jour précis
 *
 * Lecture seule : recommande, n'exécute jamais (aucune écriture Meta).
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const raw = searchParams.get("day");
  const yesterday = addDaysToDay(todayParisDay(), -1);
  const day = !raw || raw === "hier" || raw === "yesterday" ? yesterday : raw;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) {
    return NextResponse.json({ error: `jour invalide : ${day} (attendu YYYY-MM-DD)` }, { status: 400 });
  }

  try {
    const report = await buildEscalierReport(createSupabaseServerClient(), day);
    return NextResponse.json(report);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message, day }, { status: 500 });
  }
}
