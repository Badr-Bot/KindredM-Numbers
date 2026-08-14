import { createSupabaseServerClient } from "./supabase";
import { contributionMargin, feesCentsForCa, roasBreakEven, roasTarget15, TARGET_NET_MARGIN } from "./engine";
import { isExcludedCampaign } from "./meta";
import { readManualRevenue } from "./manualRevenue";
import { parseUtmCampaign } from "./roasReport";
import type { Totals } from "./data";

// Couche data de l'onglet 📊 Analyse. Les tables meta_insights /
// meta_ad_insights (migration 0005) se remplissent via la synchro dès que le
// token Meta fonctionne — d'ici là, tout renvoie vide + un drapeau pour que
// l'UI explique quoi faire au lieu de planter.

export interface InsightDaily {
  day: string;
  market: string;
  campaignId: string;
  campaignName: string;
  spendCents: number;
  impressions: number;
  clicks: number;
  purchases: number;
  reach: number;
}

/** Une ligne PAR JOUR et par créa — l'agrégation (lifetime ou période
 * sélectionnée) se fait côté client, comme l'onglet Créas (demande Badr
 * 04/08 : le tableau des gagnantes doit suivre le sélecteur de période). */
export interface AdDailyPerf {
  day: string;
  adId: string;
  adName: string;
  campaignId: string;
  campaignName: string;
  spendCents: number;
  impressions: number;
  clicks: number;
  purchases: number;
  purchaseValueCents: number;
  video3s: number;
  video100: number;
  reach: number;
  linkClicks: number;
  landingPageViews: number;
  addToCart: number;
  initiateCheckout: number;
}

export interface AnalyticsData {
  insights: InsightDaily[];
  adsDaily: AdDailyPerf[];
  /** Migration 0005 pas encore appliquée dans Supabase. */
  missingTables: boolean;
}

const PAGE = 1000;

interface RawInsight {
  day: string;
  market: string;
  campaign_id: string;
  campaign_name: string | null;
  spend_cents: number;
  impressions: number;
  clicks: number;
  purchases: number;
  reach: number | null;
}

interface RawAdInsight {
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
  video_3s: number | null;
  video_p100: number | null;
  reach: number | null;
  link_clicks: number | null;
  landing_page_views: number | null;
  add_to_cart: number | null;
  initiate_checkout: number | null;
}

export async function getAnalyticsData(start: string, end: string): Promise<AnalyticsData> {
  const supabase = createSupabaseServerClient();

  const insights: InsightDaily[] = [];
  let missingTables = false;

  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from("meta_insights")
      .select("day, market, campaign_id, campaign_name, spend_cents, impressions, clicks, purchases, reach")
      .gte("day", start)
      .lte("day", end)
      .order("day", { ascending: true })
      .order("campaign_id", { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) {
      missingTables = /does not exist|relation|schema cache/i.test(error.message);
      break;
    }
    const rows = (data ?? []) as RawInsight[];
    for (const r of rows) {
      // Campagne au CA non mesurable (NIRA) : écartée partout, sinon son spend
      // gonfle les CPA/ROAS de l'onglet sans recette en face.
      if (isExcludedCampaign(r.campaign_name)) continue;
      insights.push({
        day: String(r.day),
        market: r.market,
        campaignId: r.campaign_id,
        campaignName: r.campaign_name ?? "",
        spendCents: r.spend_cents,
        impressions: r.impressions,
        clicks: r.clicks,
        purchases: r.purchases,
        reach: r.reach ?? 0,
      });
    }
    if (rows.length < PAGE) break;
  }

  // Créas : agrégées par annonce sur la fenêtre demandée. video_p100 vient de
  // la migration 0011 — probe avant de le demander (même filet que getCreasData).
  const { error: videoPctProbeError } = await supabase.from("meta_ad_insights").select("video_p100").limit(1);
  const hasVideoPct = !videoPctProbeError;
  const adCols =
    "day, ad_id, ad_name, campaign_id, campaign_name, spend_cents, impressions, clicks, purchases, " +
    "purchase_value_cents, video_3s, reach, link_clicks, landing_page_views, add_to_cart, initiate_checkout" +
    (hasVideoPct ? ", video_p100" : "");
  const adsDaily: AdDailyPerf[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = (await supabase
      .from("meta_ad_insights")
      .select(adCols)
      .gte("day", start)
      .lte("day", end)
      .order("day", { ascending: true })
      .order("ad_id", { ascending: true })
      .range(from, from + PAGE - 1)) as unknown as { data: RawAdInsight[] | null; error: { message: string } | null };
    if (error) break; // même cause que missingTables, déjà signalée
    const rows = data ?? [];
    for (const r of rows) {
      if (isExcludedCampaign(r.campaign_name)) continue;
      adsDaily.push({
        day: r.day,
        adId: r.ad_id,
        adName: r.ad_name ?? r.ad_id,
        campaignId: r.campaign_id,
        campaignName: r.campaign_name ?? "",
        spendCents: r.spend_cents,
        impressions: r.impressions,
        clicks: r.clicks,
        purchases: r.purchases,
        purchaseValueCents: r.purchase_value_cents,
        video3s: r.video_3s ?? 0,
        video100: r.video_p100 ?? 0,
        reach: r.reach ?? 0,
        linkClicks: r.link_clicks ?? 0,
        landingPageViews: r.landing_page_views ?? 0,
        addToCart: r.add_to_cart ?? 0,
        initiateCheckout: r.initiate_checkout ?? 0,
      });
    }
    if (rows.length < PAGE) break;
  }

  return { insights, adsDaily, missingTables };
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
      .order("day", { ascending: true })
      .order("ad_id", { ascending: true })
      .range(from, from + PAGE - 1)) as unknown as { data: RawCreaRow[] | null; error: { message: string } | null };
    if (error) {
      missingTables = /does not exist|relation|schema cache/i.test(error.message);
      break;
    }
    const rows = data ?? [];
    for (const r of rows) {
      if (isExcludedCampaign(r.campaign_name)) continue;
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

// ---------------------------------------------------------------------------
// Onglet ⚡ Aujourd'hui — carte par produit PRINCIPAL (demandé 02-03/08).
// Seuls Gilet et Polo sont des produits principaux — tout le reste (Caleçon,
// Chemise, Débardeur, E-Book...) est un upsell ajouté à une commande d'un des
// deux : pas de carte séparée pour eux, leur CA/COGS/taxe sont comptés dans
// le produit principal de LEUR commande (Badr, 03/08).
//
// Chaque commande du jour est classée ENTIÈREMENT dans un seul bucket (Gilet
// si elle contient un Gilet, sinon Polo par défaut — le Polo absorbe donc
// aussi les commandes 100% upsell, marginal en volume) : on lit directement
// les montants déjà calculés par la synchro (total_cents, cogs_*, tax_eu_cents)
// au lieu de les redériver, pour ne jamais diverger du reste du dashboard.
//
// Spend : Gilet = campagnes dont le nom contient "LANCASTER". Polo = TOUT LE
// RESTE (Badr, 03/08 : "le polo c'est toutes les campagnes qui ciblent pas
// le gilet") — inclut donc aussi le spend UNMAPPED, comme le total GLOBAL.
//
// VALEUR META PAR PRODUIT — CORRIGÉE LE 14/08 (Badr : « pk le MER du Polo est
// en dessous du ROAS Meta ? c'est pas normal non ?? »). Il avait raison : par
// construction le MER ne PEUT PAS passer sous le ROAS d'une même carte —
// dénominateur identique (le spend), et le numérateur du MER (CA TOTAL du
// bucket) contient déjà le CA que Meta s'attribue. Quand ça s'inverse, c'est
// que les deux numérateurs ne parlent pas du même périmètre.
//
// C'était exactement le cas : le CA était découpé PAR LIGNES DE COMMANDE
// (toute commande contenant un Gilet sort du Polo) tandis que la valeur Meta
// l'était PAR NOM DE CAMPAGNE (seul "LANCASTER" sortait). Deux axes
// différents pour une même carte → chaque commande Gilet vendue par une
// campagne Polo (cross-sell) retirait du CA au Polo sans lui retirer la
// valeur Meta correspondante. Constaté le 14/08 : 2 commandes Gilet (99,96 €)
// sorties du CA Polo alors que LANCASTER n'avait AUCUN achat attribué à
// retirer côté Meta → MER Polo sous son propre ROAS Meta.
//
// Depuis : la valeur Meta d'une campagne est ventilée entre les buckets AU
// PRORATA DU CA de ses commandes (rattachées par `utm_campaign`, déjà stocké
// dans `landing_site` — migration 0008), donc sur le MÊME axe que le CA. Le
// nom de campagne ne sert plus que de REPLI, quand aucune commande du jour ne
// porte l'UTM de la campagne (clic d'hier converti aujourd'hui, UTM perdu).
// Ce qui reste possible après ce correctif, c'est un vrai excès d'attribution
// de Meta (view-through + imputation au jour du clic : le 13/08 Meta
// revendiquait 43 des 45 commandes, soit 97 % du CA) — un fait à lire, pas un
// bug à corriger : c'est précisément ce que le MER sert à démentir.
// ---------------------------------------------------------------------------

export interface ProductSplitCard {
  key: string;
  label: string;
  emoji: string;
  orders: number;
  caCents: number;
  spendCents: number;
  cogsCents: number;
  taxCents: number;
  feesCents: number;
  netCents: number;
  /**
   * Valeur d'achat telle que META l'attribue à ce produit (12/08). Sert au
   * ROAS Meta, à ne PAS confondre avec le MER (= caCents / spendCents) :
   *  • MER = CA TOTAL ÷ spend total — inclut l'organique, le direct, l'e-mail,
   *    les récurrents. Mesure l'efficacité globale de la boutique.
   *  • ROAS Meta = CA que Meta s'attribue ÷ spend. Mesure la performance de
   *    la pub seule, et SOUS-ESTIME le jour même (délai d'attribution, se
   *    corrige en 24-72 h — voir MEMO).
   * Les deux sont utiles, mais ne se comparent pas aux mêmes seuils.
   */
  metaPurchaseValueCents: number;
}

/** Mot-clé (dans le nom de campagne, en majuscules) identifiant le Gilet. */
const GILET_CAMPAIGN_KEYWORD = "LANCASTER";
// ---------------------------------------------------------------------------
// PRODUITS EN TEST (convention Badr, 07/08) — « on met un truc spécifique dans
// les campagnes et tu le mets à part ». Toute campagne dont le nom contient un
// de ces mots-clés est un TEST PRODUIT : son spend sort du calcul Polo/Gilet
// et atterrit dans la carte 🧪 Testing, avec le CA saisi à la main
// (manualRevenue) si le produit n'a pas de boutique Shopify branchée.
// Mot-clé convenu pour les prochains tests : « PRODTEST » dans le nom de
// campagne — rien d'autre à faire, la carte se crée seule. (« TESTING » seul
// est inutilisable : toutes les campagnes du compte le portent déjà.)
// NIRA reste listé pour l'HISTORIQUE (test du 05-07/08, campagnes coupées) :
// l'argent dépensé était réel, il reste dans les livres.
const TESTING_CAMPAIGN_KEYWORDS = ["NIRA", "PRODTEST"];
/** Clés produit (manualRevenue/products.ts) rattachées à la carte Testing. */
const TESTING_PRODUCT_KEYS = new Set(["NIRA_BURN"]);

interface RawOrderForSplit {
  total_cents: number;
  refunded_cents: number;
  cogs_product_cents: number;
  cogs_upsells_cents: number;
  tax_eu_cents: number;
  line_items: { title: string }[];
  /** URL d'atterrissage (migration 0008) : porte l'`utm_campaign`. */
  landing_site?: string | null;
}

/** Les trois cartes produit. Une commande / un euro de CA n'est JAMAIS dans
 * deux buckets à la fois. */
export type ProductBucketKey = "GILET" | "TESTING" | "POLO";

export type CaByBucket = Record<ProductBucketKey, number>;

export function emptyCaByBucket(): CaByBucket {
  return { GILET: 0, TESTING: 0, POLO: 0 };
}

/**
 * Bucket déduit du seul nom de campagne — le REPLI, quand aucune commande du
 * jour ne porte l'UTM de cette campagne. Le Gilet est testé AVANT les tests
 * produit, comme le fait le découpage du spend (Gilet d'abord, Testing sur le
 * reste) : même précédence des deux côtés, sinon une campagne au nom hybride
 * atterrirait dans deux buckets différents selon la métrique.
 */
export function bucketForCampaignName(campaignName: string | null): ProductBucketKey {
  const name = (campaignName ?? "").toUpperCase();
  if (name.includes(GILET_CAMPAIGN_KEYWORD)) return "GILET";
  if (TESTING_CAMPAIGN_KEYWORDS.some((k) => name.includes(k))) return "TESTING";
  return "POLO";
}

export interface MetaCampaignValue {
  campaignId: string;
  campaignName: string | null;
  purchaseValueCents: number;
}

/**
 * Ventile la valeur d'achat attribuée par Meta entre les buckets produit, sur
 * le MÊME axe que le CA (voir le pavé en tête de section).
 *
 * Pour chaque campagne :
 *  • si des commandes du jour portent son `utm_campaign`, sa valeur Meta est
 *    répartie AU PRORATA du CA de ces commandes par bucket — une campagne
 *    Polo qui a vendu un Gilet en cross-sell rend donc au Gilet la part
 *    correspondante, exactement comme le CA le fait déjà ;
 *  • sinon, repli sur le nom de campagne (comportement d'avant le 14/08).
 *
 * Fonction PURE : aucune I/O, testée au centime. La somme des trois buckets
 * est toujours EXACTEMENT le total d'entrée (les deux premiers sont arrondis,
 * le troisième absorbe le reste) — sans ça, `split()` en aval attribuerait au
 * Polo les centimes perdus en arrondi et le total ne collerait plus.
 */
export function splitMetaValueByProduct(input: {
  rows: MetaCampaignValue[];
  /** CA du jour par campagne UTM, déjà bucketé par produit. */
  caByCampaign: Map<string, CaByBucket>;
}): CaByBucket {
  const out = emptyCaByBucket();
  for (const row of input.rows) {
    const value = row.purchaseValueCents;
    if (!value) continue;
    const ca = input.caByCampaign.get(row.campaignId);
    // Un CA négatif (remboursements > ventes du jour sur ce bucket) ne doit
    // pas produire une part négative : on le traite comme zéro.
    const g = Math.max(ca?.GILET ?? 0, 0);
    const t = Math.max(ca?.TESTING ?? 0, 0);
    const p = Math.max(ca?.POLO ?? 0, 0);
    const total = g + t + p;
    if (total <= 0) {
      out[bucketForCampaignName(row.campaignName)] += value;
      continue;
    }
    const giletPart = Math.round((value * g) / total);
    const testingPart = Math.round((value * t) / total);
    out.GILET += giletPart;
    out.TESTING += testingPart;
    out.POLO += value - giletPart - testingPart;
  }
  return out;
}

function emptyBucket() {
  return { orders: 0, caCents: 0, cogsCents: 0, taxCents: 0 };
}

function toCard(
  key: string,
  label: string,
  emoji: string,
  bucket: ReturnType<typeof emptyBucket>,
  spendCents: number,
  feesCents: number,
  metaPurchaseValueCents: number
): ProductSplitCard {
  const netCents = bucket.caCents - spendCents - bucket.cogsCents - bucket.taxCents - feesCents;
  return { key, label, emoji, spendCents, feesCents, netCents, metaPurchaseValueCents, ...bucket };
}

/**
 * `global` = totaux GLOBAL déjà calculés pour ce jour (daily_aggregates, même
 * source que le reste de l'onglet Aujourd'hui — voir getTodayView). Le split
 * Gilet/Polo doit toujours sommer EXACTEMENT à ces totaux, composant par
 * composant (CA/spend/COGS/taxe/frais) : on ne re-somme AUCUN composant Polo
 * depuis une requête indépendante (la table `orders` peut être désynchronisée
 * de `daily_aggregates` en cours de journée — constaté 04/08 sur le spend,
 * ~86€ d'écart ; constaté 05/08 sur le CA/COGS/taxe, ~1€ d'écart net qui
 * cassait Gilet+Polo ≠ Global). Seule la part Gilet (Lancaster) est mesurée
 * (line items pour le CA/COGS/taxe, campagnes meta_spend pour le spend) ;
 * la part Polo = Global − Gilet pour CHAQUE composant, garantissant la somme
 * par construction (Net inclus, par linéarité).
 */
export async function getProductSplitForDay(
  day: string,
  global: Totals
): Promise<ProductSplitCard[]> {
  const supabase = createSupabaseServerClient();

  const [
    { data: mapRows, error: mapError },
    { data: spendRows, error: spendError },
    { data: insightRows, error: insightError },
  ] = await Promise.all([
    supabase.from("products_map").select("title_pattern").eq("product_key", "GILET"),
    supabase.from("meta_spend").select("campaign_name, spend_cents").eq("day", day),
    // Valeur d'achat attribuée par Meta, pour le ROAS Meta par produit (12/08).
    // Table issue d'une migration ultérieure : son absence ne casse rien, elle
    // laisse juste le ROAS Meta à 0 (le MER, lui, reste calculé).
    supabase.from("meta_insights").select("campaign_id, campaign_name, purchase_value_cents").eq("day", day),
  ]);
  if (mapError) return [];
  const giletTitles = new Set((mapRows ?? []).map((r) => (r.title_pattern as string).trim().toLowerCase()));

  const orders: RawOrderForSplit[] = [];
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = (await supabase
      .from("orders")
      .select(
        "total_cents, refunded_cents, cogs_product_cents, cogs_upsells_cents, tax_eu_cents, line_items, landing_site"
      )
      .eq("day", day)
      .order("id", { ascending: true })
      .range(from, from + PAGE - 1)) as unknown as {
      data: RawOrderForSplit[] | null;
      error: { message: string } | null;
    };
    if (error) return [];
    const rows = data ?? [];
    orders.push(...rows);
    if (rows.length < PAGE) break;
  }
  if (orders.length === 0) return [];

  const gilet = emptyBucket();
  // CA du jour par campagne UTM ET par bucket produit : c'est CETTE table qui
  // permet de ventiler la valeur Meta sur le même axe que le CA. Une commande
  // sans `landing_site` exploitable n'y entre pas — sa campagne retombera
  // alors sur le repli par nom (voir splitMetaValueByProduct).
  const caByCampaign = new Map<string, CaByBucket>();
  for (const o of orders) {
    const isGilet = (o.line_items ?? []).some((li) => giletTitles.has((li.title ?? "").trim().toLowerCase()));
    const caCents = o.total_cents - o.refunded_cents;
    const campaignId = parseUtmCampaign(o.landing_site);
    if (campaignId) {
      const cur = caByCampaign.get(campaignId) ?? emptyCaByBucket();
      cur[isGilet ? "GILET" : "POLO"] += caCents;
      caByCampaign.set(campaignId, cur);
    }
    if (!isGilet) continue;
    gilet.orders += 1;
    gilet.caCents += caCents;
    gilet.cogsCents += o.cogs_product_cents + o.cogs_upsells_cents;
    gilet.taxCents += o.tax_eu_cents;
  }

  // NIRA Burn : aucune commande Shopify (marché canadien, pas de boutique
  // branchée) — son CA/COGS vient des saisies manuelles, son spend des
  // campagnes dont le nom contient NIRA. Mesuré comme le Gilet, puis retiré du
  // Polo pour que les 3 cartes somment exactement au Global.
  const niraEntries = (await readManualRevenue(supabase)).filter(
    (e) => e.day === day && TESTING_PRODUCT_KEYS.has(e.productKey)
  );
  const nira = emptyBucket();
  for (const e of niraEntries) {
    nira.orders += e.orders;
    nira.caCents += e.caEurCents;
    nira.cogsCents += e.cogsEurCents;
  }

  const spend = spendError ? [] : (spendRows ?? []);
  const spendByKeywords = (kws: string[]) =>
    spend
      .filter((r) => {
        const name = ((r.campaign_name as string) ?? "").toUpperCase();
        return kws.some((k) => name.includes(k));
      })
      .reduce((s, r) => s + (r.spend_cents as number), 0);

  // Valeur attribuée par Meta, ventilée sur le MÊME axe que le CA (commande →
  // produit) via l'UTM, avec repli sur le nom de campagne. Corrigé le 14/08 :
  // le découpage par mots-clés seuls pouvait laisser au Polo la valeur Meta de
  // commandes Gilet dont le CA, lui, en était retiré (voir tête de section).
  const metaValues = insightError ? [] : (insightRows ?? []);
  const metaValueTotal = metaValues.reduce((s, r) => s + ((r.purchase_value_cents as number) ?? 0), 0);
  const metaValueByProduct = splitMetaValueByProduct({
    rows: metaValues.map((r) => ({
      campaignId: String(r.campaign_id ?? ""),
      campaignName: (r.campaign_name as string) ?? null,
      purchaseValueCents: (r.purchase_value_cents as number) ?? 0,
    })),
    caByCampaign,
  });

  // Chaque composant est clampé au Global, puis le POLO absorbe le reste :
  // Polo = Global − Gilet − NIRA. Garantit la somme exacte même si `orders`
  // ou `meta_spend` sont temporairement désynchronisées de daily_aggregates.
  const clampToGlobal = (value: number, globalValue: number) =>
    Math.min(value, Math.max(globalValue, 0));
  const split = (giletRaw: number, niraRaw: number, globalValue: number) => {
    const g = clampToGlobal(giletRaw, globalValue);
    const n = clampToGlobal(niraRaw, Math.max(globalValue - g, 0));
    return { g, n, polo: Math.max(globalValue - g - n, 0) };
  };

  const o = split(gilet.orders, nira.orders, global.orders);
  const ca = split(gilet.caCents, nira.caCents, global.caCents);
  const cogs = split(gilet.cogsCents, nira.cogsCents, global.cogsCents);
  const tax = split(gilet.taxCents, 0, global.taxCents);
  const sp = split(spendByKeywords([GILET_CAMPAIGN_KEYWORD]), spendByKeywords(TESTING_CAMPAIGN_KEYWORDS), global.spendCents);
  // Frais : dérivés du CA de chaque bloc puis solde au Polo — jamais
  // feesCentsForCa(poloCaCents) séparément (deux arrondis indépendants ne
  // sommeraient pas forcément au frais Global).
  const fees = split(feesCentsForCa(ca.g), feesCentsForCa(ca.n), global.feesCents);
  const mv = split(metaValueByProduct.GILET, metaValueByProduct.TESTING, metaValueTotal);

  const cards = [
    toCard("GILET", "Gilet", "🎽", { orders: o.g, caCents: ca.g, cogsCents: cogs.g, taxCents: tax.g }, sp.g, fees.g, mv.g),
    toCard("POLO", "Polo", "👕", { orders: o.polo, caCents: ca.polo, cogsCents: cogs.polo, taxCents: tax.polo }, sp.polo, fees.polo, mv.polo),
  ];
  // Carte NIRA affichée seulement si elle a une réalité ce jour-là (spend ou
  // vente) — inutile d'afficher une carte vide sur tous les jours d'avant son
  // lancement.
  if (ca.n > 0 || sp.n > 0) {
    cards.push(
      toCard("TESTING", "Testing", "🧪", { orders: o.n, caCents: ca.n, cogsCents: cogs.n, taxCents: tax.n }, sp.n, fees.n, mv.n)
    );
  }
  return cards;
}

// ---------------------------------------------------------------------------
// Seuils ROAS PAR PRODUIT (Badr, 04/08) — le BE/cible blended du compte est
// dominé par le polo (~90 % du CA) : juger une créa Gilet (Lancaster) contre
// la cible blended la disqualifiait à tort (le gilet a une marge plus haute,
// donc un BE ET une cible PLUS BAS). Même méthode que computeThresholds
// (CM sur 14 jours glissants → BE = 1/CM, cible = 1/(CM−0,20)), mais les
// totaux CA/COGS/taxe sont bucketés par produit comme getProductSplitForDay
// (commande entière → GILET si elle contient un gilet, sinon POLO).
// ---------------------------------------------------------------------------

export type CreaProduct = "GILET" | "POLO";

export interface ProductRoasThresholds {
  cm: number | null;
  breakEven: number | null;
  target: number | null;
}

/** endDay inclus, 14 jours glissants. null si les commandes sont illisibles
 * (le composant retombe alors sur les seuils GLOBAL). */
export async function getProductRoasThresholds(
  endDay: string
): Promise<Record<CreaProduct, ProductRoasThresholds> | null> {
  const supabase = createSupabaseServerClient();
  const start = new Date(`${endDay}T00:00:00Z`);
  start.setUTCDate(start.getUTCDate() - 13);
  const startDay = start.toISOString().slice(0, 10);

  const { data: mapRows, error: mapError } = await supabase
    .from("products_map")
    .select("title_pattern")
    .eq("product_key", "GILET");
  if (mapError) return null;
  const giletTitles = new Set((mapRows ?? []).map((r) => (r.title_pattern as string).trim().toLowerCase()));

  const gilet = emptyBucket();
  const polo = emptyBucket();
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = (await supabase
      .from("orders")
      .select("total_cents, refunded_cents, cogs_product_cents, cogs_upsells_cents, tax_eu_cents, line_items")
      .gte("day", startDay)
      .lte("day", endDay)
      .order("id", { ascending: true })
      .range(from, from + PAGE - 1)) as unknown as {
      data: RawOrderForSplit[] | null;
      error: { message: string } | null;
    };
    if (error) return null;
    const rows = data ?? [];
    for (const o of rows) {
      const isGilet = (o.line_items ?? []).some((li) => giletTitles.has((li.title ?? "").trim().toLowerCase()));
      const b = isGilet ? gilet : polo;
      b.caCents += o.total_cents - o.refunded_cents;
      b.cogsCents += o.cogs_product_cents + o.cogs_upsells_cents;
      b.taxCents += o.tax_eu_cents;
    }
    if (rows.length < PAGE) break;
  }

  const toThresholds = (b: ReturnType<typeof emptyBucket>): ProductRoasThresholds => {
    const cm = contributionMargin(b.caCents, b.cogsCents, b.taxCents, feesCentsForCa(b.caCents));
    if (cm === null || cm <= 0) return { cm, breakEven: null, target: null };
    return {
      cm,
      breakEven: roasBreakEven(cm),
      // Même règle que thresholdsFromTotals (data.ts) : cible définie
      // seulement si la marge laisse la place aux 20 % visés.
      target: cm > TARGET_NET_MARGIN ? roasTarget15(cm) : null,
    };
  };

  return { GILET: toThresholds(gilet), POLO: toThresholds(polo) };
}
