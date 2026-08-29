/**
 * 📍 Repères de changement pour les courbes de l'onglet Analyse
 * (demande Badr 29/08 : « note en pointillés les jours de scale en vert et
 * descale en rouge […] ça permettra de voir ce que engendre le scale et
 * descale » + « pointillé violet quand on rajoute des créatives »).
 *
 * ⚠️ CE QUI EST MESURÉ, ET CE QUI NE L'EST PAS.
 * Le BUDGET d'une campagne n'existe nulle part dans la base : meta_spend et
 * meta_insights ne stockent que la DÉPENSE réalisée. Un « scale » est donc
 * déduit d'un saut de dépense d'un jour sur l'autre, pas lu sur le budget —
 * c'est une inférence, et l'UI le dit. Conséquences assumées :
 *   • une hausse de budget qui ne se dépense pas (apprentissage, plafond
 *     d'enchère) ne fera pas de repère ;
 *   • Meta peut faire varier la dépense de ±10 % à budget CONSTANT, d'où le
 *     seuil à ±20 % : en dessous, on marquerait du bruit et les courbes
 *     deviendraient illisibles (le but est de repérer le geste de Badr, pas
 *     la respiration de l'algo).
 * Le jour EN COURS n'est jamais comparé : sa dépense est partielle par
 * construction, il produirait un « descale » tous les jours (même piège que
 * la détection auto du journal, journal.ts).
 *
 * Les créas, elles, sont MESURÉES : meta_ad_insights porte une ligne par
 * (jour, annonce), donc le 1er jour où un ad_id apparaît est factuel.
 */

export type ChangeKind = "scale_up" | "scale_down" | "crea";

export interface ChangeMarker {
  day: string;
  kind: ChangeKind;
  /** Phrase prête à afficher (tooltip), en français. */
  text: string;
}

/** Saut de dépense minimum pour parler de scale (±20 %). */
export const SCALE_RATIO = 0.2;
/** En dessous de 50 €/jour, un écart en % ne veut rien dire (petits montants). */
export const SCALE_MIN_BASE_CENTS = 5000;

const euros = (cents: number) => `${Math.round(cents / 100).toLocaleString("fr-FR")} €`;

/**
 * Repères de scale / descale déduits de la dépense quotidienne.
 * `spendByDay` : dépense (centimes) par jour, pour UNE campagne isolée ou
 * pour tout un marché. `today` est exclu de la comparaison.
 *
 * On compare chaque jour au jour PRÉCÉDENT PRÉSENT dans la série (et non à
 * J-1 calendaire) : une campagne en pause le week-end ne doit pas produire un
 * faux « descale » le samedi puis un faux « scale » le lundi.
 */
export function detectScaleMarkers(
  spendByDay: Map<string, number>,
  today: string
): ChangeMarker[] {
  const days = [...spendByDay.keys()].filter((d) => d < today).sort();
  const out: ChangeMarker[] = [];
  for (let i = 1; i < days.length; i++) {
    const prev = spendByDay.get(days[i - 1]) ?? 0;
    const cur = spendByDay.get(days[i]) ?? 0;
    // Base solide des DEUX côtés : un 0 € → 60 € n'est pas un scale, c'est un
    // (re)démarrage de campagne — autre événement, pas celui-ci.
    if (prev < SCALE_MIN_BASE_CENTS || cur < SCALE_MIN_BASE_CENTS) continue;
    const ratio = (cur - prev) / prev;
    if (ratio >= SCALE_RATIO) {
      out.push({
        day: days[i],
        kind: "scale_up",
        text: `Scale ↑ ${Math.round(ratio * 100)} % (${euros(prev)} → ${euros(cur)})`,
      });
    } else if (ratio <= -SCALE_RATIO) {
      out.push({
        day: days[i],
        kind: "scale_down",
        text: `Descale ↓ ${Math.round(Math.abs(ratio) * 100)} % (${euros(prev)} → ${euros(cur)})`,
      });
    }
  }
  return out;
}

export interface AdFirstDayInput {
  day: string;
  adId: string;
  adName: string;
}

/**
 * Repères « nouvelles créas » : jour où une annonce apparaît pour la PREMIÈRE
 * fois. `rows` doit couvrir tout l'historique disponible, pas seulement la
 * fenêtre affichée — sinon toutes les annonces semblent naître le 1er jour de
 * la fenêtre. Le tout premier jour de la série est ignoré pour cette raison :
 * les annonces déjà en route ce jour-là ne sont pas des ajouts.
 */
export function detectCreaMarkers(rows: AdFirstDayInput[]): ChangeMarker[] {
  if (rows.length === 0) return [];
  const firstDayByAd = new Map<string, string>();
  const nameByAd = new Map<string, string>();
  for (const r of rows) {
    const known = firstDayByAd.get(r.adId);
    if (!known || r.day < known) firstDayByAd.set(r.adId, r.day);
    if (!nameByAd.has(r.adId)) nameByAd.set(r.adId, r.adName);
  }
  const firstDayOverall = [...firstDayByAd.values()].sort()[0];

  const byDay = new Map<string, string[]>();
  for (const [adId, day] of firstDayByAd) {
    if (day === firstDayOverall) continue;
    const list = byDay.get(day) ?? [];
    list.push(nameByAd.get(adId) ?? adId);
    byDay.set(day, list);
  }

  return [...byDay.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([day, names]) => ({
      day,
      kind: "crea" as const,
      text:
        names.length === 1
          ? `Nouvelle créa : ${names[0]}`
          : `${names.length} nouvelles créas : ${names.slice(0, 3).join(", ")}${names.length > 3 ? "…" : ""}`,
    }));
}
