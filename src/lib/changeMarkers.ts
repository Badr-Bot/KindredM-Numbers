/**
 * 📍 Repères de changement pour les courbes de l'onglet Analyse
 * (demande Badr 29/08 : « note en pointillés les jours de scale en vert et
 * descale en rouge […] ça permettra de voir ce que engendre le scale et
 * descale » + « pointillé violet quand on rajoute des créatives »).
 *
 * DEUX SOURCES, DANS CET ORDRE DE PRÉFÉRENCE :
 *
 * 1. **Le journal d'activité du compte Meta** (`detectBudgetMarkers`) — le
 *    geste lui-même : « budget passé de 250 € à 400 € », horodaté, par
 *    campagne. C'est ce que l'onglet Scaling utilise déjà pour savoir ce qui
 *    a été appliqué. EXACT : à utiliser dès qu'il répond.
 *
 * 2. **La dépense, à défaut** (`detectScaleMarkers`) — un saut de dépense
 *    ≥ 20 % d'un jour à l'autre. Repli quand le journal Meta est
 *    indisponible (token HS, historique hors de portée). C'est une
 *    INFÉRENCE, et l'UI doit le dire : une hausse de budget qui ne se
 *    dépense pas (apprentissage, plafond d'enchère) passe inaperçue, et
 *    Meta peut faire varier la dépense de ±10 % à budget CONSTANT — d'où le
 *    seuil à 20 %, en dessous on marquerait du bruit.
 *    Le jour EN COURS n'y est jamais comparé : sa dépense est partielle par
 *    construction, il produirait un « descale » tous les jours (même piège
 *    que la détection auto du journal, journal.ts).
 *
 * ⚠️ Ne JAMAIS mélanger les deux : un vrai changement de budget produit
 * AUSSI un saut de dépense le lendemain — cumuler les deux sources
 * dessinerait deux traits pour un seul geste.
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

export interface BudgetChangeInput {
  day: string;
  /** Heure Paris (HH:mm), optionnelle — affichée telle quelle. */
  at?: string;
  /** Requis dès que plusieurs campagnes sont mélangées (vue « toutes
   * campagnes ») : les montants d'une campagne ne doivent JAMAIS se chaîner
   * avec ceux d'une autre. */
  campaignId?: string;
  oldBudgetCents: number | null;
  newBudgetCents: number | null;
}

/**
 * Repères EXACTS depuis le journal d'activité Meta : le geste lui-même,
 * ancien → nouveau budget.
 *
 * Regroupement en DEUX temps, et l'ordre compte :
 *   1. par (jour, CAMPAGNE) : plusieurs retouches d'une même campagne dans la
 *      même journée sont fusionnées en un seul trajet (ancien du premier →
 *      nouveau du dernier). Un aller-retour qui revient à son point de départ
 *      ne laisse aucun repère.
 *   2. puis par JOUR : en vue « toutes campagnes », on somme les campagnes
 *      MODIFIÉES ce jour-là. ⚠️ Sans l'étape 1, le chaînage mélangeait les
 *      montants de campagnes différentes et affichait des trajets qui
 *      n'existent pas (« 750 € → 145 € »).
 *
 * Le total affiché en vue multi-campagnes ne prétend donc PAS être le budget
 * du compte : c'est la somme des campagnes touchées ce jour-là, et le texte
 * le dit.
 */
export function detectBudgetMarkers(changes: BudgetChangeInput[]): ChangeMarker[] {
  // 1) par (jour, campagne)
  type Leg = { first: number; last: number; at?: string };
  const byDayCampaign = new Map<string, Map<string, Leg>>();
  for (const c of changes) {
    if (c.oldBudgetCents === null || c.newBudgetCents === null) continue;
    const perCampaign = byDayCampaign.get(c.day) ?? new Map<string, Leg>();
    const key = c.campaignId ?? "";
    const cur = perCampaign.get(key);
    // L'ordre d'arrivée est chronologique (fetchCampaignActivities trie) :
    // le 1er vu porte l'ancien montant, le dernier le montant final.
    if (!cur) perCampaign.set(key, { first: c.oldBudgetCents, last: c.newBudgetCents, at: c.at });
    else cur.last = c.newBudgetCents;
    byDayCampaign.set(c.day, perCampaign);
  }

  // 2) par jour
  const out: ChangeMarker[] = [];
  for (const [day, perCampaign] of [...byDayCampaign.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    const legs = [...perCampaign.values()].filter((l) => l.last !== l.first);
    if (legs.length === 0) continue;
    const first = legs.reduce((sum, l) => sum + l.first, 0);
    const last = legs.reduce((sum, l) => sum + l.last, 0);
    if (last === first) continue;
    const up = last > first;
    const ratio = first > 0 ? Math.round((Math.abs(last - first) / first) * 100) : null;
    const at = legs.find((l) => l.at)?.at;
    out.push({
      day,
      kind: up ? "scale_up" : "scale_down",
      text:
        `Budget ${up ? "↑" : "↓"} ${euros(first)} → ${euros(last)}` +
        `${ratio !== null ? ` (${up ? "+" : "−"}${ratio} %)` : ""}` +
        `${legs.length > 1 ? ` sur ${legs.length} campagnes` : ""}` +
        `${at ? ` · ${at}` : ""}`,
    });
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
