"use client";

// Filet de sécurité global : si une vue crashe, on garde le style terminal
// et on offre un chemin de sortie (recharger / diagnostic) au lieu de la
// page d'erreur brute du navigateur.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-md px-4 py-10 text-center">
      <div className="text-3xl">🛠️</div>
      <h1 className="mt-3 text-base font-bold text-red">Cette vue a rencontré une erreur</h1>
      <p className="mt-2 break-words text-[11.5px] text-ink-dim">
        {error.message || "Erreur serveur."}
        {error.digest && <span className="text-ink-faint"> · réf {error.digest}</span>}
      </p>
      <div className="mt-4 flex justify-center gap-2">
        <button
          onClick={reset}
          className="rounded border border-phosphor/60 bg-phosphor/10 px-3 py-1.5 text-xs font-semibold text-phosphor"
        >
          ↻ Réessayer
        </button>
        <a
          href="/admin"
          className="rounded border border-line px-3 py-1.5 text-xs font-semibold text-ink-dim"
        >
          ⚙️ Diagnostic
        </a>
      </div>
    </div>
  );
}
