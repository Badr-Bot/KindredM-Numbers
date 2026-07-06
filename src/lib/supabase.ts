import { createClient } from "@supabase/supabase-js";

// Client serveur uniquement — utilise la service_role key (jamais exposée au
// navigateur, jamais préfixée NEXT_PUBLIC_). Import interdit depuis un
// composant "use client".
export function createSupabaseServerClient() {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "SUPABASE_URL et SUPABASE_SERVICE_KEY doivent être définis (variables d'environnement Vercel/locales)."
    );
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}
