import { createClient } from "@supabase/supabase-js";

// Client serveur uniquement — utilise la service_role key (jamais exposée au
// navigateur, jamais préfixée NEXT_PUBLIC_). Import interdit depuis un
// composant "use client".
export function createSupabaseServerClient() {
  const rawUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_KEY?.trim();

  if (!rawUrl || !serviceKey) {
    throw new Error(
      "SUPABASE_URL et SUPABASE_SERVICE_KEY doivent être définis (variables d'environnement Vercel/locales)."
    );
  }

  // Tolère l'URL copiée depuis la page Data API de Supabase, qui se termine
  // par /rest/v1/ : le client ajoute lui-même ce chemin, le garder doublerait
  // la route et ferait échouer toutes les requêtes.
  const url = rawUrl.trim().replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");

  // Garde-fou : une SUPABASE_URL qui ne pointe pas vers *.supabase.co (ex.
  // l'URL du dashboard collée par erreur) renverrait du HTML à chaque requête.
  // On échoue immédiatement avec la valeur fautive (non secrète) en clair.
  let host = "";
  try {
    host = new URL(url).host;
  } catch {
    throw new Error(`SUPABASE_URL invalide : « ${url} ». Attendu : https://xxxx.supabase.co`);
  }
  if (!host.endsWith(".supabase.co")) {
    throw new Error(
      `SUPABASE_URL pointe vers « ${host} » au lieu d'un domaine *.supabase.co — corrige la variable dans Vercel (attendu : https://xxxx.supabase.co) puis Redeploy.`
    );
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}
