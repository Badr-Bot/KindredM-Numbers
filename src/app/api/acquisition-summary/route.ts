import { NextRequest, NextResponse } from "next/server";
import { getAcquisitionForRange } from "@/lib/data";

// CA par canal (Google/Meta/direct/autres) sur une période — pour le donut
// « quel canal rapporte combien » de l'onglet Dépenses (demande Badr 08/08).
export async function GET(request: NextRequest) {
  const from = request.nextUrl.searchParams.get("from");
  const to = request.nextUrl.searchParams.get("to");
  if (!from || !to || !/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
    return NextResponse.json({ error: "Paramètres from/to invalides (AAAA-MM-JJ)." }, { status: 400 });
  }
  const acquisition = await getAcquisitionForRange(from, to);
  if (!acquisition) return NextResponse.json({ acquisition: null });
  return NextResponse.json({ acquisition });
}
