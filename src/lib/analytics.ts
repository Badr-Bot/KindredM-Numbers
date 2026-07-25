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
  reach: number;
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
  reach: number | null;
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
      .select("day, market, spend_cents, impressions, clicks, purchases, reach")
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
        reach: r.reach ?? 0,
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

// ---------------------------------------------------------------------------
// Onglet 🎬 Créas — détail par créa (funnel complet, hook/hold vidéo, angle)
// ---------------------------------------------------------------------------

// Toutes les métriques variables jour par jour — permet de recalculer les
// totaux (et donc ratios/hook/hold) pour N'IMPORTE QUELLE période choisie
// côté client, sans re-solliciter le serveur (même logique que l'onglet
// Analyse : on charge tout l'historique une fois, le filtrage est local).
export interface CreaDailyRow {
  day: string;
  adId: string;
  spendCents: number;
  impressions: number;
  clicks: number;
  purchases: number;
  purchaseValueCents: number;
  reach: number;
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

// Info statique par créa — ne varie pas jour par jour (nom, campagne, texte,
// diagnostics Meta), pas besoin de la répéter à chaque ligne journalière.
export interface CreaMeta {
  adId: string;
  adName: string;
  campaignId: string;
  campaignName: string;
  body: string | null;
  qualityRanking: string | null;
  engagementRanking: string | null;
  conversionRanking: string | null;
}

export interface CreasData {
  meta: CreaMeta[];
  daily: CreaDailyRow[];
  /** Migration 0005 ou 0011 pas encore appliquée. */
  missingTables: boolean;
}

interface RawCreaRow {
  day: string;
  ad_id: string;
  ad_name: string | null;
  campaign_id: string;
  campaign_name: string | null;
  spend_cents: number;
  impressions: number;
  clicks: number;
  purchases: number;
  purchase_value_cents: number;
  reach: number | null;
  link_clicks: number | null;
  landing_page_views: number | null;
  add_to_cart: number | null;
  initiate_checkout: number | null;
  video_3s: number | null;
  thruplays: number | null;
  video_p50: number | null;
  video_p75: number | null;
  video_p100: number | null;
  quality_ranking: string | null;
  engagement_ranking: string | null;
  conversion_ranking: string | null;
}

export async function getCreasData(start: string, end: string): Promise<CreasData> {
  const supabase = createSupabaseServerClient();

  // video_p50/p75/p100 ajoutés par la migration 0011 — probe avant de les
  // demander (colonne absente ferait échouer toute la requête).
  const { error: videoPctProbeError } = await supabase.from("meta_ad_insights").select("video_p50").limit(1);
  const hasVideoPct = !videoPctProbeError;
  const cols =
    "day, ad_id, ad_name, campaign_id, campaign_name, spend_cents, impressions, clicks, purchases, " +
    "purchase_value_cents, reach, link_clicks, landing_page_views, add_to_cart, initiate_checkout, " +
    "video_3s, thruplays, quality_ranking, engagement_ranking, conversion_ranking" +
    (hasVideoPct ? ", video_p50, video_p75, video_p100" : "");

  const metaByAd = new Map<string, CreaMeta>();
  const daily: CreaDailyRow[] = [];
  let missingTables = false;

  for (let from = 0; ; from += PAGE) {
    const { data, error } = (await supabase
      .from("meta_ad_insights")
      .select(cols)
      .gte("day", start)
      .lte("day", end)
      .range(from, from + PAGE - 1)) as unknown as { data: RawCreaRow[] | null; error: { message: string } | null };
    if (error) {
      missingTables = /does not exist|relation|schema cache/i.test(error.message);
      break;
    }
    const rows = data ?? [];
    for (const r of rows) {
      const m = metaByAd.get(r.ad_id) ?? {
        adId: r.ad_id,
        adName: r.ad_name ?? r.ad_id,
        campaignId: r.campaign_id,
        campaignName: r.campaign_name ?? "",
        body: null,
        qualityRanking: null,
        engagementRanking: null,
        conversionRanking: null,
      };
      // Ranking Meta : catégoriel — on garde la valeur la plus récente
      // rencontrée (les lignes arrivent en ordre croissant de jour).
      if (r.quality_ranking) m.qualityRanking = r.quality_ranking;
      if (r.engagement_ranking) m.engagementRanking = r.engagement_ranking;
      if (r.conversion_ranking) m.conversionRanking = r.conversion_ranking;
      metaByAd.set(r.ad_id, m);

      daily.push({
        day: r.day,
        adId: r.ad_id,
        spendCents: r.spend_cents,
        impressions: r.impressions,
        clicks: r.clicks,
        purchases: r.purchases,
        purchaseValueCents: r.purchase_value_cents,
        reach: r.reach ?? 0,
        linkClicks: r.link_clicks ?? 0,
        landingPageViews: r.landing_page_views ?? 0,
        addToCart: r.add_to_cart ?? 0,
        initiateCheckout: r.initiate_checkout ?? 0,
        video3s: r.video_3s ?? 0,
        thruplays: r.thruplays ?? 0,
        video50: r.video_p50 ?? 0,
        video75: r.video_p75 ?? 0,
        video100: r.video_p100 ?? 0,
      });
    }
    if (rows.length < PAGE) break;
  }

  // Texte de la créa (angle/copy) — table séparée, snapshot courant.
  const { data: creativeRows, error: creativeError } = await supabase
    .from("meta_ad_creatives")
    .select("ad_id, body");
  if (!creativeError) {
    const bodyByAd = new Map((creativeRows ?? []).map((r) => [r.ad_id as string, r.body as string | null]));
    for (const m of metaByAd.values()) {
      m.body = bodyByAd.get(m.adId) ?? null;
    }
  }

  return { meta: [...metaByAd.values()], daily, missingTables };
}
