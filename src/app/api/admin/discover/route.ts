import { NextResponse } from "next/server";
import { discoverProducts } from "@/lib/discover";

export const maxDuration = 60;

// Derrière le basic-auth du proxy (§2). Phase découverte (§5), déclenchée
// depuis /admin plutôt qu'en CLI — pour les utilisateurs sans terminal.
export async function GET() {
  try {
    const results = await discoverProducts();
    return NextResponse.json({ ok: true, stores: results });
  } catch (err) {
    return NextResponse.json({ ok: false, reason: (err as Error).message }, { status: 500 });
  }
}
