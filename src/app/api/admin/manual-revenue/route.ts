import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase";
import {
  buildManualRevenueEntry,
  readManualRevenue,
  upsertManualRevenue,
} from "@/lib/manualRevenue";
import { recomputeDailyAggregatesForDays } from "@/lib/aggregate";

// Recettes saisies à la main pour les produits sans boutique Shopify branchée
// (NIRA). GET : liste ce qui est enregistré. POST : ajoute/remplace l'entrée
// d'un (jour, produit) puis recalcule immédiatement le jour concerné, pour que
// le dashboard reflète la vente sans attendre la synchro suivante.
//
// Le taux de change est OBLIGATOIRE quand la devise n'est pas EUR : aucun taux
// par défaut n'est appliqué (jamais de chiffre inventé dans le net).

export async function GET() {
  const supabase = createSupabaseServerClient();
  const entries = await readManualRevenue(supabase);
  const totalEurCents = entries.reduce((s, e) => s + e.caEurCents, 0);
  return NextResponse.json({ ok: true, count: entries.length, totalEurCents, entries });
}

export async function POST(request: NextRequest) {
  let body: {
    day?: string;
    market?: string;
    productKey?: string;
    currency?: string;
    caCents?: number;
    cogsCents?: number;
    rateToEur?: number;
    orders?: number;
    note?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, reason: "JSON invalide." }, { status: 400 });
  }

  const currency = (body.currency ?? "EUR").toUpperCase();
  const rateToEur = currency === "EUR" ? 1 : body.rateToEur;
  if (rateToEur === undefined || rateToEur === null) {
    return NextResponse.json(
      {
        ok: false,
        reason:
          `Devise ${currency} : le taux de conversion (rateToEur) est obligatoire. ` +
          "Aucun taux par défaut n'est appliqué pour ne pas fausser le net.",
      },
      { status: 400 }
    );
  }

  let entry;
  try {
    entry = buildManualRevenueEntry({
      day: body.day ?? "",
      market: body.market ?? "FR",
      productKey: body.productKey ?? "",
      currency,
      caCents: body.caCents ?? 0,
      cogsCents: body.cogsCents ?? 0,
      rateToEur,
      orders: body.orders,
      note: body.note,
    });
  } catch (err) {
    return NextResponse.json({ ok: false, reason: (err as Error).message }, { status: 400 });
  }
  if (!entry.productKey) {
    return NextResponse.json({ ok: false, reason: "productKey manquant." }, { status: 400 });
  }

  const supabase = createSupabaseServerClient();
  let entries;
  try {
    entries = await upsertManualRevenue(supabase, entry);
  } catch (err) {
    return NextResponse.json({ ok: false, reason: (err as Error).message }, { status: 500 });
  }

  // Recalcul immédiat du jour touché : la vente apparaît tout de suite.
  let recomputed = true;
  try {
    await recomputeDailyAggregatesForDays(supabase, [entry.day]);
  } catch {
    recomputed = false;
  }

  return NextResponse.json({ ok: true, entry, count: entries.length, recomputed });
}
