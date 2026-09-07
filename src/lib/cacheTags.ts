// ---------------------------------------------------------------------------
// Étiquette de cache unique du tableau de bord.
//
// Tout ce qui est mis en cache PERSISTANT (unstable_cache) et qui dépend des
// chiffres écrits par la synchro porte cette étiquette. La synchro appelle
// revalidateTag(DASHBOARD_TAG) quand elle a réellement écrit quelque chose :
// les caches tombent d'un coup, le rendu suivant repart des vraies données.
//
// Pourquoi une seule étiquette : Badr veut des onglets rapides ET des
// chiffres justes juste après une synchro. Une étiquette par table donnerait
// des vues incohérentes entre elles (le CA rafraîchi, la dépense non) — le
// défaut qu'il a signalé le 05/09 (« ça m'annonce un bénéfice puis une
// perte »). Tout tombe ensemble ou rien.
//
// N'étiquette PAS les caches de sources externes (Wise, Slash, Shopify en
// route) : ils ont leur propre rythme et la synchro ne les écrit pas.
// ---------------------------------------------------------------------------

export const DASHBOARD_TAG = "dashboard-data";

// ---------------------------------------------------------------------------
// PASSÉ FIGÉ vs FENÊTRE CHAUDE — idée de Badr (07/09) : « enregistrer ce qui
// s'est déjà passé les jours d'avant et relire que le jour J ».
//
// La synchro profonde réécrit J-7 → J (rescanFromDay, incrementalSync.ts).
// Tout ce qui précède ne bouge plus : le relire à chaque navigation était du
// travail jeté. Les lectures lourdes sont donc coupées en deux :
//   • le passé (jusqu'à J-8) — cache 24 h, étiqueté HISTORY_TAG ;
//   • la fenêtre encore réécrite (J-7 → aujourd'hui) — cache court,
//     étiqueté DASHBOARD_TAG, tombé à chaque synchro.
// Une synchro ordinaire ne jette donc plus jamais l'historique.
//
// HISTORY_TAG n'est vidé que par ce qui touche réellement le passé : la
// clôture de nuit (/api/cron) et un backfill complet.
// ---------------------------------------------------------------------------

export const HISTORY_TAG = "dashboard-history";

/** Nombre de jours que la synchro profonde réécrit (J-7 → J inclus). */
export const REWRITE_WINDOW_DAYS = 7;

/**
 * Dernier jour considéré comme DÉFINITIF (plus jamais réécrit) pour un
 * « aujourd'hui » donné. Tout ce qui est ≤ à ce jour peut être gardé
 * longtemps ; au-delà, la synchro peut encore changer les chiffres.
 */
export function frozenEndDay(today: string): string {
  const d = new Date(`${today}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - (REWRITE_WINDOW_DAYS + 1));
  return d.toISOString().slice(0, 10);
}
