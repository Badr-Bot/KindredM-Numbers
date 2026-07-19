/**
 * Squelette de chargement global : s'affiche INSTANTANÉMENT au changement
 * d'onglet pendant que le serveur prépare la page — la navigation paraît
 * fluide au lieu de sembler figée.
 */
export default function Loading() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-label="Chargement">
      <div className="h-6 w-44 animate-pulse rounded bg-panel" />
      <div className="skeleton-shimmer h-32 rounded-xl border border-line bg-panel/60" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="skeleton-shimmer h-28 rounded-lg border border-line bg-panel/40"
            style={{ animationDelay: `${i * 120}ms` }}
          />
        ))}
      </div>
      <div className="skeleton-shimmer h-56 rounded-lg border border-line bg-panel/40" />
      <p className="text-center text-[11px] text-ink-faint">
        <span className="mr-1 inline-block animate-spin">↻</span>chargement…
      </p>
    </div>
  );
}
