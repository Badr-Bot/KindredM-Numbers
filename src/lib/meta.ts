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
// NIRA : exclue à partir du 05/08 (jour de son lancement) et rétroactivement.
// À RETIRER de cette liste le jour où le CA NIRA est branché — Badr veut
// alors réintégrer CA **et** spend ensemble, jamais l'un sans l'autre.
const EXCLUDED_CAMPAIGN_KEYWORDS = ["NIRA"];

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
