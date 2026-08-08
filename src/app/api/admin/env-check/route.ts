import { NextResponse } from "next/server";

// Diagnostic sans risque : confirme la PRÉSENCE et la longueur de chaque
// variable vue par le serveur en production, jamais sa valeur. Sert à
// distinguer "variable absente" de "problème ailleurs" sans capture d'écran.
const VARS = [
  "SHOPIFY_ES_DOMAIN", "SHOPIFY_ES_CLIENT_ID", "SHOPIFY_ES_CLIENT_SECRET", "SHOPIFY_ES_TOKEN",
  "SHOPIFY_UK_DOMAIN", "SHOPIFY_UK_CLIENT_ID", "SHOPIFY_UK_CLIENT_SECRET", "SHOPIFY_UK_TOKEN",
  "SHOPIFY_DE_DOMAIN", "SHOPIFY_DE_CLIENT_ID", "SHOPIFY_DE_CLIENT_SECRET", "SHOPIFY_DE_TOKEN",
  "SHOPIFY_FR_DOMAIN", "SHOPIFY_FR_CLIENT_ID", "SHOPIFY_FR_CLIENT_SECRET", "SHOPIFY_FR_TOKEN",
  "META_ACCESS_TOKEN", "META_AD_ACCOUNT_ID",
  "SUPABASE_URL", "SUPABASE_SERVICE_KEY",
  "DASHBOARD_PASSWORD", "APP_TIMEZONE",
] as const;

export async function GET() {
  const status = VARS.map((name) => {
    const value = process.env[name];
    return {
      name,
      set: Boolean(value && value.trim().length > 0),
      length: value?.trim().length ?? 0,
      looksLikePlaceholder: /^\(.*\)$/.test(value?.trim() ?? ""),
    };
  });
  // Marqueur de commit deployé (rempli automatiquement par Vercel) — pour
  // savoir avec certitude quel code tourne vraiment avant de retester
  // (08/08 : plusieurs diagnostics avaient tourné contre un déploi pas
  // encore à jour, faisant perdre du temps à deviner).
  return NextResponse.json({ ok: true, status, deployedCommit: process.env.VERCEL_GIT_COMMIT_SHA ?? null });
}
