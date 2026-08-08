import { NextRequest, NextResponse } from "next/server";
import { fetchKlaviyoCampaignRevenue } from "@/lib/klaviyo";

// CA attribué aux campagnes email Klaviyo (jamais les flows automatiques,
// donc jamais BIENVENUE15) — demande Badr 08/08. Renvoie une erreur EXPLICITE
// plutôt qu'un 0 silencieux si la clé manque ou si Klaviyo répond mal :
// mieux vaut un message clair côté dashboard qu'un chiffre invisible et faux.
export async function GET(request: NextRequest) {
  const since = request.nextUrl.searchParams.get("since");
  const until = request.nextUrl.searchParams.get("until");
  if (!since || !until || !/^\d{4}-\d{2}-\d{2}$/.test(since) || !/^\d{4}-\d{2}-\d{2}$/.test(until)) {
    return NextResponse.json({ error: "Paramètres since/until invalides (AAAA-MM-JJ)." }, { status: 400 });
  }
  try {
    const revenue = await fetchKlaviyoCampaignRevenue(since, until);
    return NextResponse.json({ revenue });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 });
  }
}
