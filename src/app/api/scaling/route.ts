import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase";
import { buildScalingReport } from "@/lib/scaling";
import { todayParisDay } from "@/lib/time";

export const dynamic = "force-dynamic";

/**
 * 🪜 Meta Scaling — le rapport de décision en JSON (même moteur que l'onglet
 * /scaling, protocole de la formation leçon 35).
 *
 * Deux verdicts par campagne : la décision de la NUIT (fenêtre close, stable,
 * application vérifiée via le journal d'activités Meta) et la fenêtre EN
 * COURS (jour même partiel, provisoire).
 *
 * GET /api/scaling                → aujourd'hui (Europe/Paris)
 * GET /api/scaling?day=YYYY-MM-DD → rejouer un jour passé (fenêtres closes
 *                                   seulement fiables ; activités = actuelles)
 *
 * Lecture seule : recommande, n'exécute jamais (aucune écriture Meta).
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const raw = searchParams.get("day");
  const day = !raw || raw === "today" ? todayParisDay() : raw;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) {
    return NextResponse.json({ error: `jour invalide : ${day} (attendu YYYY-MM-DD)` }, { status: 400 });
  }

  try {
    const report = await buildScalingReport(createSupabaseServerClient(), day);
    return NextResponse.json(report);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message, day }, { status: 500 });
  }
}
