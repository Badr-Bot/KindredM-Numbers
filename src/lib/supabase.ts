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

  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}
