import { unstable_cache } from "next/cache";
import type { Market } from "./engine";

const API_VERSION = "v21.0";

export interface MetaSpendRow {
  day: string; // YYYY-MM-DD
  campaignId: string;
  campaignName: string;
  spendCents: number;
}

interface MetaAction {
  action_type: string;
  value: string;
}

interface MetaInsightsRow {
  campaign_id: string;
  campaign_name: string;
  ad_id?: string;
  ad_name?: string;
  spend: string;
  impressions?: string;
  clicks?: string;
  reach?: string;
  frequency?: string;
  actions?: MetaAction[];
  action_values?: MetaAction[];
  outbound_clicks?: MetaAction[];
  video_thruplay_watched_actions?: MetaAction[];
  video_p50_watched_actions?: MetaAction[];
  video_p75_watched_actions?: MetaAction[];
  video_p100_watched_actions?: MetaAction[];
  quality_ranking?: string;
  engagement_rate_ranking?: string;
  conversion_rate_ranking?: string;
  country?: string;
  date_start: string;
}

interface MetaInsightsResponse {
  data: MetaInsightsRow[];
  paging?: { next?: string };
}

export interface MetaInsightRow {
  day: string;
  campaignId: string;
  campaignName: string;
  spendCents: number;
  impressions: number;
  clicks: number;
  purchases: number;
  purchaseValueCents: number;
  reach: number;
  frequency: number;
  linkClicks: number;
  landingPageViews: number;
  addToCart: number;
  initiateCheckout: number;
  video3s: number;
  thruplays: number;
  video50: number;
  video75: number;
  video100: number;
}

export interface MetaAdInsightRow extends MetaInsightRow {
  adId: string;
  adName: string;
  qualityRanking: string | null;
  engagementRanking: string | null;
  conversionRanking: string | null;
}

export interface MetaCountryInsightRow {
  day: string;
  campaignId: string;
  country: string;
  spendCents: number;
  impressions: number;
  clicks: number;
  purchases: number;
  purchaseValueCents: number;
}

function pickPurchase(actions: MetaAction[] | undefined): number {
  const hit = actions?.find(
    (a) => a.action_type === "omni_purchase" || a.action_type === "purchase"
  );
  return hit ? Math.round(parseFloat(hit.value) * 100) / 100 : 0;
}

/** Premier action_type trouvé dans la liste, arrondi entier (compteurs). */
function pickAction(list: MetaAction[] | undefined, ...types: string[]): number {
  for (const t of types) {
    const hit = list?.find((a) => a.action_type === t);
    if (hit) return Math.round(parseFloat(hit.value));
  }
  return 0;
}

async function* iterateInsights(
  level: "campaign" | "ad",
  sinceDay: string,
  untilDay: string,
  options: { countryBreakdown?: boolean } = {}
): AsyncGenerator<MetaInsightsRow> {
  const token = process.env.META_ACCESS_TOKEN;
  const accountId = process.env.META_AD_ACCOUNT_ID;
  if (!token || !accountId) {
    throw new Error("META_ACCESS_TOKEN / META_AD_ACCOUNT_ID manquants.");
  }
  const fields = options.countryBreakdown
    ? // breakdown pays : Meta n'autorise pas les rankings/fréquence ici,
      // on reste sur le cœur transactionnel
      "campaign_id,campaign_name,spend,impressions,clicks,actions,action_values"
    : (level === "ad"
        ? "ad_id,ad_name,quality_ranking,engagement_rate_ranking,conversion_rate_ranking," +
          "video_p50_watched_actions,video_p75_watched_actions,video_p100_watched_actions,"
        : "") +
      "campaign_id,campaign_name,spend,impressions,clicks,reach,frequency," +
      "actions,action_values,outbound_clicks,video_thruplay_watched_actions";
  const params = new URLSearchParams({
    level,
    time_increment: "1",
    fields,
    time_range: JSON.stringify({ since: sinceDay, until: untilDay }),
    limit: "500",
    access_token: token,
  });
  if (options.countryBreakdown) params.set("breakdowns", "country");
  let url: string | null =
    `https://graph.facebook.com/${API_VERSION}/act_${accountId}/insights?` + params.toString();

  while (url) {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Meta API error ${res.status}: ${await res.text()}`);
    }
    const body: MetaInsightsResponse = await res.json();
    for (const row of body.data) yield row;
    url = body.paging?.next ?? null;
  }
}

function toInsight(row: MetaInsightsRow): MetaInsightRow {
  return {
    day: row.date_start,
    campaignId: row.campaign_id,
    campaignName: row.campaign_name,
    spendCents: Math.round(parseFloat(row.spend) * 100),
    impressions: Number(row.impressions ?? 0),
    clicks: Number(row.clicks ?? 0),
    purchases: Math.round(pickPurchase(row.actions)),
    purchaseValueCents: Math.round(pickPurchase(row.action_values) * 100),
    reach: Number(row.reach ?? 0),
    frequency: Number(row.frequency ?? 0),
    linkClicks: pickAction(row.actions, "link_click"),
    landingPageViews: pickAction(row.actions, "landing_page_view", "omni_landing_page_view"),
    addToCart: pickAction(row.actions, "omni_add_to_cart", "add_to_cart"),
    initiateCheckout: pickAction(row.actions, "omni_initiated_checkout", "initiate_checkout"),
    video3s: pickAction(row.actions, "video_view"),
    thruplays: pickAction(row.video_thruplay_watched_actions, "video_view"),
    video50: pickAction(row.video_p50_watched_actions, "video_view"),
    video75: pickAction(row.video_p75_watched_actions, "video_view"),
    video100: pickAction(row.video_p100_watched_actions, "video_view"),
  };
}

/** Métriques complètes par jour/campagne (spend, impressions, clics, achats). */
export async function fetchMetaInsights(
  sinceDay: string,
  untilDay: string
): Promise<MetaInsightRow[]> {
  const rows: MetaInsightRow[] = [];
  for await (const row of iterateInsights("campaign", sinceDay, untilDay)) {
    rows.push(toInsight(row));
  }
  return rows;
}

/** Métriques par jour/annonce — alimente le suivi des créas + hit rate. */
export async function fetchMetaAdInsights(
  sinceDay: string,
  untilDay: string
): Promise<MetaAdInsightRow[]> {
  const rows: MetaAdInsightRow[] = [];
  for await (const row of iterateInsights("ad", sinceDay, untilDay)) {
    rows.push({
      ...toInsight(row),
      adId: row.ad_id ?? "",
      adName: row.ad_name ?? "",
      qualityRanking: row.quality_ranking ?? null,
      engagementRanking: row.engagement_rate_ranking ?? null,
      conversionRanking: row.conversion_rate_ranking ?? null,
    });
  }
  return rows;
}

/** Spend/achats par PAYS réel de diffusion (breakdown country) — le vrai
 * ROAS Belgique/Canada/Suisse à l'intérieur d'une campagne « FR ». */
export async function fetchMetaCountryInsights(
  sinceDay: string,
  untilDay: string
): Promise<MetaCountryInsightRow[]> {
  const rows: MetaCountryInsightRow[] = [];
  for await (const row of iterateInsights("campaign", sinceDay, untilDay, { countryBreakdown: true })) {
    rows.push({
      day: row.date_start,
      campaignId: row.campaign_id,
      country: (row.country ?? "??").toUpperCase(),
      spendCents: Math.round(parseFloat(row.spend) * 100),
      impressions: Number(row.impressions ?? 0),
      clicks: Number(row.clicks ?? 0),
      purchases: Math.round(pickPurchase(row.actions)),
      purchaseValueCents: Math.round(pickPurchase(row.action_values) * 100),
    });
  }
  return rows;
}

interface MetaAdsListRow {
  id: string;
  creative?: { body?: string };
}

interface MetaAdsListResponse {
  data: MetaAdsListRow[];
  paging?: { next?: string };
}

/** Texte (angle/copy) de chaque annonce active — snapshot courant, pas
 * historisé jour par jour (la créa attachée à une annonce change rarement).
 * Alimente l'onglet Créas pour identifier l'angle sans rouvrir Ads Manager. */
export async function fetchAdCreativeBodies(): Promise<Map<string, string>> {
  const token = process.env.META_ACCESS_TOKEN;
  const accountId = process.env.META_AD_ACCOUNT_ID;
  if (!token || !accountId) {
    throw new Error("META_ACCESS_TOKEN / META_AD_ACCOUNT_ID manquants.");
  }
  const bodies = new Map<string, string>();
  const params = new URLSearchParams({
    fields: "id,creative{body}",
    limit: "500",
    access_token: token,
  });
  let url: string | null = `https://graph.facebook.com/${API_VERSION}/act_${accountId}/ads?` + params.toString();

  while (url) {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Meta API error ${res.status}: ${await res.text()}`);
    }
    const body: MetaAdsListResponse = await res.json();
    for (const row of body.data) {
      if (row.creative?.body) bodies.set(row.id, row.creative.body);
    }
    url = body.paging?.next ?? null;
  }
  return bodies;
}

interface MetaCampaignsListRow {
  id: string;
  effective_status: string;
}

interface MetaCampaignsListResponse {
  data: MetaCampaignsListRow[];
  paging?: { next?: string };
}

/** IDs des campagnes actuellement ACTIVE (snapshot live, pas historisé) —
 * sert à exclure une créa gagnante dont la campagne mère a été coupée/mise en
 * pause depuis (demande Badr, 04/08 : « la campagne mère doit être active
 * sinon aucune créa gagnante »). */
export async function fetchActiveCampaignIds(): Promise<Set<string>> {
  const token = process.env.META_ACCESS_TOKEN;
  const accountId = process.env.META_AD_ACCOUNT_ID;
  if (!token || !accountId) {
    throw new Error("META_ACCESS_TOKEN / META_AD_ACCOUNT_ID manquants.");
  }
  const active = new Set<string>();
  const params = new URLSearchParams({
    fields: "id,effective_status",
    limit: "500",
    access_token: token,
  });
  let url: string | null =
    `https://graph.facebook.com/${API_VERSION}/act_${accountId}/campaigns?` + params.toString();

  while (url) {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Meta API error ${res.status}: ${await res.text()}`);
    }
    const body: MetaCampaignsListResponse = await res.json();
    for (const row of body.data) {
      if (row.effective_status === "ACTIVE") active.add(row.id);
    }
    url = body.paging?.next ?? null;
  }
  return active;
}

/** Spend Meta par jour/campagne (compat : dérivé de fetchMetaInsights). */
export async function fetchMetaSpend(sinceDay: string, untilDay: string): Promise<MetaSpendRow[]> {
  const insights = await fetchMetaInsights(sinceDay, untilDay);
  return insights.map(({ day, campaignId, campaignName, spendCents }) => ({
    day,
    campaignId,
    campaignName,
    spendCents,
  }));
}

// §4.6 — mapping campagne → marché par nom. UNMAPPED reste persisté pour
// affectation manuelle dans l'UI (jamais agrégé silencieusement dans un marché).
export function mapCampaignToMarket(campaignName: string): Market | "UNMAPPED" {
  const name = campaignName.toUpperCase();
  // NIRA = marché canadien (Badr, 06/08). Testé AVANT les autres motifs : le
  // nom "CBO - NIRA - TESTING" ne porte aucun indice pays, il tomberait sinon
  // dans le défaut FR et gonflerait la France du spend d'un produit canadien.
  if (name.includes("NIRA")) return "CA";
  if (name.includes("ESP")) return "ES";
  if (name.includes("GE")) return "DE";
  if (name.includes("FR")) return "FR";
  if (/\bUK\b|CANADA|EUROPE|\bAUS\b|WORLDWIDE|\bANG\b/.test(name)) return "UK";
  // Par défaut, sans indice pays dans le nom → FR (règle Badr, 29/07) : en
  // pratique une campagne sans mention de pays est presque toujours FR, le
  // plus gros marché. Les cas vraiment ambigus restent réassignables à la
  // main dans Contrôle (l'override prime toujours, voir resolveCampaignMarket).
  return "FR";
}

// ---------------------------------------------------------------------------
// Campagnes EXCLUES du calcul (Badr, 05/08) — leur spend est réel mais leur CA
// n'est PAS mesurable ici : elles vendent un produit dont les commandes ne
// remontent pas dans les boutiques Shopify branchées au dashboard (pas de
// token). Compter la dépense sans la recette fausserait le net à la baisse et
// tous les ROAS/marges qui en découlent. On les sort donc entièrement du
// calcul plutôt que d'afficher un chiffre faux (convention §0 : jamais de
// chiffre faux, on le dit).
//
// 05/08 : NIRA exclue (spend réel, CA non mesurable → net faussé à la baisse).
// 06/08 : Badr REMET le spend NIRA (« pour que ça soit plus adapté à la
// réalité ») et fournit désormais le CA à la main à chaque vente. La liste est
// donc vide — plus aucune campagne n'est écartée. Le mécanisme reste en place :
// il suffit d'y remettre un mot-clé si le cas se represente.
const EXCLUDED_CAMPAIGN_KEYWORDS: string[] = [];

/**
 * true si la campagne doit être ignorée dans tous les agrégats (spend, ROAS,
 * marges, journal, analyse). Comparaison sur le NOM (insensible à la casse) :
 * couvre aussi les futures campagnes du même produit (« CBO 2 - NIRA … »)
 * sans avoir à lister chaque id.
 */
export function isExcludedCampaign(campaignName: string | null | undefined): boolean {
  const name = (campaignName ?? "").toUpperCase();
  return EXCLUDED_CAMPAIGN_KEYWORDS.some((k) => name.includes(k));
}

export type CampaignOverrides = Map<string, Market>;

/**
 * Résolution complète : l'override manuel (persisté via l'UI, §4.6) prime
 * toujours sur le mapping par nom.
 */
export function resolveCampaignMarket(
  campaignName: string,
  campaignId: string,
  overrides: CampaignOverrides
): Market | "UNMAPPED" {
  return overrides.get(campaignId) ?? mapCampaignToMarket(campaignName);
}

/** Charge les overrides depuis Supabase (vide si la table n'existe pas encore). */
export async function loadCampaignOverrides(
  supabase: import("@supabase/supabase-js").SupabaseClient
): Promise<CampaignOverrides> {
  const { data, error } = await supabase
    .from("campaign_market_overrides")
    .select("campaign_id, market");
  if (error) return new Map();
  return new Map((data ?? []).map((r) => [r.campaign_id as string, r.market as Market]));
}

// ---------------------------------------------------------------------------
// 🪜 Escalier — snapshot live des campagnes (statut, budget quotidien,
// updated_time). Lecture seule, comme tout ce fichier côté décision.
// ---------------------------------------------------------------------------

export interface CampaignLiveInfo {
  name: string | null;
  active: boolean;
  /** daily_budget Meta (CBO) en cents de la devise du compte. null = budget
   * porté par les adsets (ABO) ou non exposé. */
  dailyBudgetCents: number | null;
  /** updated_time — PROXY du dernier changement de budget : il marque
   * n'importe quelle modification de la campagne. */
  updatedTime: string | null;
}

interface MetaCampaignsBudgetRow {
  id: string;
  name?: string;
  effective_status: string;
  daily_budget?: string;
  updated_time?: string;
}

export async function fetchCampaignLiveInfos(): Promise<Map<string, CampaignLiveInfo>> {
  const token = process.env.META_ACCESS_TOKEN;
  const accountId = process.env.META_AD_ACCOUNT_ID;
  if (!token || !accountId) {
    throw new Error("META_ACCESS_TOKEN / META_AD_ACCOUNT_ID manquants.");
  }
  const infos = new Map<string, CampaignLiveInfo>();
  const params = new URLSearchParams({
    fields: "id,name,effective_status,daily_budget,updated_time",
    limit: "500",
    access_token: token,
  });
  let url: string | null =
    `https://graph.facebook.com/${API_VERSION}/act_${accountId}/campaigns?` + params.toString();

  while (url) {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Meta API error ${res.status}: ${await res.text()}`);
    }
    const body: { data: MetaCampaignsBudgetRow[]; paging?: { next?: string } } = await res.json();
    for (const row of body.data) {
      const budget = row.daily_budget ? Number(row.daily_budget) : NaN;
      infos.set(row.id, {
        name: row.name ?? null,
        active: row.effective_status === "ACTIVE",
        dailyBudgetCents: Number.isFinite(budget) && budget > 0 ? Math.round(budget) : null,
        updatedTime: row.updated_time ?? null,
      });
    }
    url = body.paging?.next ?? null;
  }
  return infos;
}

// ---------------------------------------------------------------------------
// 🪜 Meta Scaling — journal d'activités du compte : les changements de budget
// RÉELS (ancien → nouveau, horodatés) et les pauses/relances de campagne.
// C'est la source de vérité de « qu'est-ce qui a été appliqué » — plus aucun
// pointage manuel. Lecture seule.
// ---------------------------------------------------------------------------

export interface CampaignActivity {
  campaignId: string;
  campaignName: string | null;
  /** ISO Meta (ex. 2026-08-17T23:28:41+0200) */
  eventTime: string;
  kind: "budget" | "status";
  /** budget : anciens/nouveaux daily_budget en cents. status : null. */
  oldBudgetCents: number | null;
  newBudgetCents: number | null;
  /** status : la valeur d'arrivée (ACTIVE, PAUSED…). budget : null. */
  statusTo: string | null;
}

interface MetaActivityRow {
  event_type: string;
  event_time: string;
  object_id?: string;
  object_name?: string;
  extra_data?: string;
}

/**
 * Lit une valeur d'`extra_data` du journal d'activité Meta.
 *
 * ⚠️ BUG TROUVÉ LE 29/08 (Badr : « le budget est figé »). Meta renvoie DEUX
 * formes pour ce champ, et le code n'en lisait qu'une :
 *
 *   • plate      : {"old_value": "50000", "new_value": "75000"}
 *   • composite  : {"type": "composite_data",
 *                   "old_value": {"type":"payment_amount","currency":"EUR","old_value":75000,…},
 *                   "new_value": {"type":"payment_amount","currency":"EUR","new_value":63800,…}}
 *
 * Les changements de budget de CE compte arrivent tous en composite (vérifié
 * sur le journal réel du compte Niva, 23-29/08). `Number({...})` valant NaN,
 * chaque montant repartait à `null` : les repères scale/descale de l'onglet
 * Analyse ne s'affichaient JAMAIS, et l'onglet Scaling devait deviner ses
 * budgets de proche en proche (`repairMoves`). Le montant est bien là, il
 * est juste imbriqué sous une clé du même nom.
 *
 * Exporté pour être testé sur la charge utile réelle.
 */
export function readActivityValue(
  extra: Record<string, unknown>,
  side: "old_value" | "new_value"
): unknown {
  const raw = extra[side];
  if (raw !== null && typeof raw === "object" && !Array.isArray(raw)) {
    // Forme composite : la vraie valeur est imbriquée sous la MÊME clé.
    return (raw as Record<string, unknown>)[side];
  }
  return raw;
}

/** Montant en centimes d'un côté d'un changement de budget, quelle que soit
 * la forme d'`extra_data`. null = absent ou illisible — jamais 0, qui se
 * lirait comme un budget coupé. */
export function activityBudgetCents(
  extra: Record<string, unknown>,
  side: "old_value" | "new_value"
): number | null {
  const n = Number(readActivityValue(extra, side));
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
}

/** Les activités budget/statut du compte depuis `sinceDay` (YYYY-MM-DD),
 * triées par date croissante. extra_data des changements de budget porte
 * new_value/old_value en sous-unité de la devise du compte (cents). */
export async function fetchCampaignActivities(sinceDay: string): Promise<CampaignActivity[]> {
  const token = process.env.META_ACCESS_TOKEN;
  const accountId = process.env.META_AD_ACCOUNT_ID;
  if (!token || !accountId) {
    throw new Error("META_ACCESS_TOKEN / META_AD_ACCOUNT_ID manquants.");
  }
  const params = new URLSearchParams({
    fields: "event_type,event_time,object_id,object_name,extra_data",
    since: sinceDay,
    limit: "500",
    access_token: token,
  });
  let url: string | null =
    `https://graph.facebook.com/${API_VERSION}/act_${accountId}/activities?` + params.toString();

  const out: CampaignActivity[] = [];
  while (url) {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Meta API error ${res.status}: ${await res.text()}`);
    }
    const body: { data: MetaActivityRow[]; paging?: { next?: string } } = await res.json();
    for (const row of body.data) {
      if (!row.object_id) continue;
      let extra: Record<string, unknown> = {};
      try {
        extra = row.extra_data ? JSON.parse(row.extra_data) : {};
      } catch {
        /* extra_data illisible : on garde l'événement sans détail */
      }
      if (row.event_type === "update_campaign_budget") {
        out.push({
          campaignId: row.object_id,
          campaignName: row.object_name ?? null,
          eventTime: row.event_time,
          kind: "budget",
          newBudgetCents: activityBudgetCents(extra, "new_value"),
          oldBudgetCents: activityBudgetCents(extra, "old_value"),
          statusTo: null,
        });
      } else if (row.event_type === "update_campaign_run_status") {
        const statusValue = readActivityValue(extra, "new_value");
        out.push({
          campaignId: row.object_id,
          campaignName: row.object_name ?? null,
          eventTime: row.event_time,
          kind: "status",
          newBudgetCents: null,
          oldBudgetCents: null,
          statusTo: typeof statusValue === "string" ? statusValue : null,
        });
      }
    }
    url = body.paging?.next ?? null;
  }
  // tri par instant réel : deux ISO à offsets différents (+0200 vs +0000)
  // se comparent mal en chaîne.
  out.sort((a, b) => new Date(a.eventTime).getTime() - new Date(b.eventTime).getTime());
  return out;
}


/** Version CACHÉE de fetchActiveCampaignIds pour les rendus de page (onglet
 * Analyse) : l'appel live à Meta à chaque affichage faisait attendre 2-5 s
 * (Badr 04/09 : « l'onglet analyse est trop lent »). Un snapshot de 5 min
 * suffit — une campagne coupée apparaît au prochain rendu, pas à la seconde.
 * Tableau (un Set ne se sérialise pas dans le cache). */
export const getActiveCampaignIdsCached = unstable_cache(
  async () => [...(await fetchActiveCampaignIds())],
  ["meta-active-campaign-ids"],
  { revalidate: 300, tags: ["meta-live"] }
);
