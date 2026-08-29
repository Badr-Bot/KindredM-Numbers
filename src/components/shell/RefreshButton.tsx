"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { useSound } from "../sound/SoundProvider";
import { formatRelativeTime } from "@/lib/relative";

// Au-delà de ce délai, les chiffres affichés sont signalés comme périmés
// (ambre). 15 min = 3 cycles de synchro auto ratés : en régime normal on ne
// dépasse jamais 5 min, donc l'ambre veut dire « plus personne ne synchronise »
// (aucun onglet ouvert, ou la synchro échoue → voir /debug).
const STALE_AFTER_MS = 15 * 60 * 1000;
// L'âge se réévalue tout seul : sans ça, une page laissée ouverte affiche
// « MAJ il y a 2 min » pendant une heure.
const TICK_MS = 30 * 1000;

/**
 * `fetchedAt` = heure de la dernière SYNCHRO réussie, pas de l'affichage
 * (voir lastSyncAt, data.ts). null = inconnue, on le dit — jamais « à
 * l'instant » par défaut : un chiffre périmé qui se présente comme frais est
 * pire que pas de chiffre du tout.
 */
export function RefreshButton({ fetchedAt }: { fetchedAt: string | null }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);
  const { play } = useSound();

  // Heure courante gardée en état (jamais lue pendant le rendu : ce serait
  // impur, et React peut re-rendre quand il veut). Elle se remet à jour toute
  // seule, ce qui fait aussi vieillir le libellé « il y a X min » d'une page
  // laissée ouverte.
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    // Première lecture juste après la peinture (pas dans le corps de l'effet :
    // un setState synchrone y déclenche un rendu en cascade), puis toutes les
    // TICK_MS.
    const read = () => setNow(Date.now());
    const first = setTimeout(read, 0);
    const id = setInterval(read, TICK_MS);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, []);

  const onClick = async () => {
    setBusy(true);
    play("beep");
    let ok = true;
    // Même logique que LiveSync : le CA est publié en base au milieu du
    // cycle, on rafraîchit l'écran toutes les 15 s au lieu d'attendre la fin
    // de la phase Meta pour montrer quoi que ce soit.
    const midRefresh = setInterval(() => router.refresh(), 15_000);
    try {
      // force=1 : clic humain → passage réel si les données ont plus de 60 s
      // (l'automatique reste throttlé à 5 min, voir incrementalSync.ts).
      await fetch("/api/sync?force=1", { method: "POST" });
    } catch {
      // en démo / non configuré, reste inoffensif
      ok = false;
    } finally {
      clearInterval(midRefresh);
    }
    startTransition(() => router.refresh());
    setBusy(false);
    if (ok) play("refreshDone");
  };

  const loading = busy || isPending;
  // now === null au tout premier rendu (serveur + hydratation) : on n'affiche
  // pas d'alerte « périmé » tant qu'on n'a pas d'horloge fiable.
  const ageMs = fetchedAt && now !== null ? now - new Date(fetchedAt).getTime() : null;
  const stale = ageMs !== null && ageMs > STALE_AFTER_MS;
  const label = fetchedAt ? `MAJ ${formatRelativeTime(fetchedAt)}` : "MAJ inconnue";

  return (
    <div className="flex items-center gap-2 text-[11px] text-ink-dim">
      {/* suppressHydrationWarning : l'âge est calculé avec l'horloge du
          serveur au rendu puis celle du navigateur — quelques secondes
          d'écart peuvent faire basculer le libellé, ce n'est pas une erreur. */}
      <span
        suppressHydrationWarning
        className={`tnum ${stale || !fetchedAt ? "text-amber" : ""}`}
        title={fetchedAt ? `Dernière synchro : ${new Date(fetchedAt).toLocaleString("fr-FR")}` : "Aucune synchro connue"}
      >
        {stale || !fetchedAt ? "⚠ " : ""}
        {label}
      </span>
      <button
        type="button"
        onClick={onClick}
        disabled={loading}
        className="flex items-center gap-1 rounded border border-line px-2 py-1 text-ink transition-colors hover:border-phosphor hover:text-phosphor disabled:opacity-50"
      >
        <span className={loading ? "inline-block animate-spin" : ""}>↻</span>
        {loading ? "…" : "Actualiser"}
      </button>
    </div>
  );
}
