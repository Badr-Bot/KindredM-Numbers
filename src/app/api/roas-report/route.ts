import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase";
import { buildRoasReport, formatRoasReportForSlack } from "@/lib/roasReport";
import { todayParisDay, addDaysToDay } from "@/lib/time";

export const dynamic = "force-dynamic";

/**
 * Rapport de performance par campagne — LA source du rapport Slack de 23h05.
 *
 * Avant (12/08) la routine n'appelait rien : elle réinterrogeait Meta et
 * Shopify puis recalculait de tête, d'où des valeurs différentes à chaque run
 * et un ROAS Meta pris pour argent comptant alors qu'il sous-estime le jour
 * même. Désormais elle appelle CETTE route et poste `text` tel quel : le
 * calcul est en code, testé, identique d'un run à l'autre.
 *
 * GET /api/roas-report            → journée en cours (Europe/Paris)
 * GET /api/roas-report?day=…      → un jour précis (YYYY-MM-DD)
 * GET /api/roas-report?day=hier   → raccourci pratique pour un rapport de fin
 *                                    de journée déclenché après minuit
 *
 * Lecture seule : aucune écriture, aucun appel Meta/Shopify.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const raw = searchParams.get("day");
  const today = todayParisDay();
  const day = !raw || raw === "today" ? today : raw === "hier" || raw === "yesterday" ? addDaysToDay(today, -1) : raw;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) {
    return NextResponse.json({ error: `jour invalide : ${day} (attendu YYYY-MM-DD)` }, { status: 400 });
  }

  try {
    const report = await buildRoasReport(createSupabaseServerClient(), day);
    return NextResponse.json({ ...report, text: formatRoasReportForSlack(report) });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message, day }, { status: 500 });
  }
}
