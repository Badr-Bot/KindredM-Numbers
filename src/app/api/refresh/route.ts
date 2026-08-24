import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

// Bouton « Actualiser » (§2/§6.1) — invalide les caches courts : snapshot du
// jour, seuils produit (5 min) et lectures Meta live de l'onglet Scaling (60 s).
export async function POST() {
  revalidateTag("today-snapshot", { expire: 0 });
  revalidateTag("product-roas-thresholds", { expire: 0 });
  revalidateTag("product-day-matrix", { expire: 0 });
  revalidateTag("meta-live", { expire: 0 });
  revalidateTag("bank", { expire: 0 });
  return NextResponse.json({ ok: true });
}
