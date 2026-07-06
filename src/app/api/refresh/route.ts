import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

// Bouton « Actualiser » (§2/§6.1) — invalide le cache 5-10 min du jour en cours.
export async function POST() {
  revalidateTag("today-snapshot", { expire: 0 });
  return NextResponse.json({ ok: true });
}
