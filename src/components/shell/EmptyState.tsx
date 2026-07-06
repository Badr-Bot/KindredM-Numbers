export function EmptyState() {
  return (
    <div className="rounded-xl border border-line bg-panel/40 p-6 text-center">
      <div className="text-3xl">🛰️</div>
      <h2 className="mt-3 text-base font-semibold text-ink">Aucune donnée branchée</h2>
      <p className="mx-auto mt-2 max-w-sm text-[12px] leading-relaxed text-ink-dim">
        Le terminal est prêt mais aucune source n&apos;est connectée. Deux options :
      </p>
      <div className="mx-auto mt-4 grid max-w-md gap-2 text-left text-[11.5px]">
        <div className="rounded-lg border border-line-soft bg-terminal/60 p-3">
          <span className="font-semibold text-amber">Mode démo</span>
          <p className="mt-1 text-ink-dim">
            Lance avec <code className="rounded bg-terminal px-1 text-phosphor">NIVA_DEMO=1</code> pour explorer
            l&apos;interface avec des données synthétiques.
          </p>
        </div>
        <div className="rounded-lg border border-line-soft bg-terminal/60 p-3">
          <span className="font-semibold text-phosphor">Mode réel</span>
          <p className="mt-1 text-ink-dim">
            Renseigne les variables Supabase (+ Shopify/Meta) et lance le backfill. Voir le README.
          </p>
        </div>
      </div>
    </div>
  );
}
