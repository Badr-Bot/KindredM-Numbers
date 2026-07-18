import { createSupabaseServerClient } from "./supabase";

// Couche data de l'onglet 📊 Analyse. Les tables meta_insights /
// meta_ad_insights (migration 0005) se remplissent via la synchro dès que le
// token Meta fonctionne — d'ici là, tout renvoie vide + un drapeau pour que
// l'UI explique quoi faire au lieu de planter.

export interface InsightDaily {
  day: string;
  market: string;
  spendCents: number;
  impressions: number;
  clicks: number;
  purchases: number;
}

export interface AdPerf {
  adId: string;
  adName: string;
  campaignName: string;
  spendCents: number;
  impressions: number;
  clicks: number;
  purchases: number;
  purchaseValueCents: number;
}

export interface AnalyticsData {
  insights: InsightDaily[];
  ads: AdPerf[];
  /** Migration 0005 pas encore appliquée dans Supabase. */
  missingTables: boolean;
}

const PAGE = 1000;

interface RawInsight {
  day: string;
  market: string;
  spend_cents: number;
  impressions: number;
  clicks: number;
  purchases: number;
}

interface RawAdInsight {
  ad_id: string;
  ad_name: string | null;
  campaign_name: string | null;
  spend_cents: number;
  impressions: number;
  clicks: number;
  purchases: number;
  purchase_value_cents: number;
}

export async function getAnalyticsData(start: string, end: string): Promise<AnalyticsData> {
  const supabase = createSupabaseServerClient();

  const insights: InsightDaily[] = [];
  let missingTables = false;

  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from("meta_insights")
      .select("day, market, spend_cents, impressions, clicks, purchases")
      .gte("day", start)
      .lte("day", end)
      .range(from, from + PAGE - 1);
    if (error) {
      missingTables = /does not exist|relation|schema cache/i.test(error.message);
      break;
    }
    const rows = (data ?? []) as RawInsight[];
    for (const r of rows) {
      insights.push({
        day: String(r.day),
        market: r.market,
        spendCents: r.spend_cents,
        impressions: r.impressions,
        clicks: r.clicks,
        purchases: r.purchases,
      });
    }
    if (rows.length < PAGE) break;
  }

  // Créas : agrégées par annonce sur la fenêtre demandée.
  const byAd = new Map<string, AdPerf>();
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from("meta_ad_insights")
      .select("ad_id, ad_name, campaign_name, spend_cents, impressions, clicks, purchases, purchase_value_cents")
      .gte("day", start)
      .lte("day", end)
      .range(from, from + PAGE - 1);
    if (error) break; // même cause que missingTables, déjà signalée
    const rows = (data ?? []) as RawAdInsight[];
    for (const r of rows) {
      const cur = byAd.get(r.ad_id) ?? {
        adId: r.ad_id,
        adName: r.ad_name ?? r.ad_id,
        campaignName: r.campaign_name ?? "",
        spendCents: 0,
        impressions: 0,
        clicks: 0,
        purchases: 0,
        purchaseValueCents: 0,
      };
      cur.spendCents += r.spend_cents;
      cur.impressions += r.impressions;
      cur.clicks += r.clicks;
      cur.purchases += r.purchases;
      cur.purchaseValueCents += r.purchase_value_cents;
      byAd.set(r.ad_id, cur);
    }
    if (rows.length < PAGE) break;
  }

  return { insights, ads: [...byAd.values()], missingTables };
}
