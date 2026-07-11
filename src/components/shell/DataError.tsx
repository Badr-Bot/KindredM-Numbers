// Affiche la cause réelle d'une erreur de données (rendu côté serveur, donc
// non masquée par Next en production) + les vérifications utiles.

/** Une réponse HTML brute = URL de connexion erronée ; on traduit au lieu d'afficher le HTML. */
function readable(message: string): string {
  const t = message.trim();
  if (t.startsWith("<!DOCTYPE") || t.startsWith("<html")) {
    return "La base a renvoyé une page HTML au lieu de données : SUPABASE_URL pointe vers la mauvaise adresse. Dans Vercel, mets exactement https://<ton-projet>.supabase.co puis Redeploy.";
  }
  return t.slice(0, 400);
}

export function DataError({ message }: { message: string }) {
  return (
    <section className="rounded-lg border border-red/40 bg-red/[0.04] p-4">
      <div className="text-sm font-semibold text-red">❌ Impossible de lire les données</div>
      <p className="mt-2 max-h-32 overflow-y-auto break-words text-[11.5px] text-ink-dim">{readable(message)}</p>
      <ul className="mt-3 flex flex-col gap-1 text-[10.5px] text-ink-faint">
        <li>• Si le message parle d&apos;une table introuvable : exécute les 3 scripts SQL dans Supabase (SQL Editor).</li>
        <li>• Vérifie l&apos;autotest sur <a href="/debug" className="text-phosphor underline">/debug</a> (carte Supabase en haut).</li>
        <li>• Après toute modification de variable dans Vercel : Redeploy.</li>
      </ul>
    </section>
  );
}
