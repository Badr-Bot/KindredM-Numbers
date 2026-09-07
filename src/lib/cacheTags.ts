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
