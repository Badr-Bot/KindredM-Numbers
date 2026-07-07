import type { Market } from "./engine";

const API_VERSION = "v21.0";

export interface MetaSpendRow {
  day: string; // YYYY-MM-DD
  campaignId: string;
  campaignName: string;
  spendCents: number;
}

interface MetaInsightsRow {
  campaign_id: string;
  campaign_name: string;
  spend: string;
  date_start: string;
}

interface MetaInsightsResponse {
  data: MetaInsightsRow[];
  paging?: { next?: string };
}

/** Spend Meta par jour/campagne via l'API Insights (level=campaign, time_increment=1). */
export async function fetchMetaSpend(sinceDay: string, untilDay: string): Promise<MetaSpendRow[]> {
  const token = process.env.META_ACCESS_TOKEN;
  const accountId = process.env.META_AD_ACCOUNT_ID;
  if (!token || !accountId) {
    throw new Error("META_ACCESS_TOKEN / META_AD_ACCOUNT_ID manquants.");
  }

  const rows: MetaSpendRow[] = [];
  let url: string | null =
    `https://graph.facebook.com/${API_VERSION}/act_${accountId}/insights?` +
    new URLSearchParams({
      level: "campaign",
      time_increment: "1",
      fields: "campaign_id,campaign_name,spend",
      time_range: JSON.stringify({ since: sinceDay, until: untilDay }),
      limit: "500",
      access_token: token,
    }).toString();

  while (url) {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Meta API error ${res.status}: ${await res.text()}`);
    }
    const body: MetaInsightsResponse = await res.json();
    for (const row of body.data) {
      rows.push({
        day: row.date_start,
        campaignId: row.campaign_id,
        campaignName: row.campaign_name,
        spendCents: Math.round(parseFloat(row.spend) * 100),
      });
    }
    url = body.paging?.next ?? null;
  }
  return rows;
}

// §4.6 — mapping campagne → marché par nom. UNMAPPED reste persisté pour
// affectation manuelle dans l'UI (jamais agrégé silencieusement dans un marché).
export function mapCampaignToMarket(campaignName: string): Market | "UNMAPPED" {
  const name = campaignName.toUpperCase();
  if (name.includes("ESP")) return "ES";
  if (name.includes("GE")) return "DE";
  if (name.includes("FR")) return "FR";
  if (/\bUK\b|CANADA|EUROPE|\bAUS\b|WORLDWIDE|\bANG\b/.test(name)) return "UK";
  return "UNMAPPED";
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
