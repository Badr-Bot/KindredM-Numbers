import { unstable_cache } from "next/cache";
import { createSupabaseServerClient } from "./supabase";
import { contributionMargin, feesCentsForCa, roasBreakEven, roasTarget15, TARGET_NET_MARGIN } from "./engine";
import { parseUtmCampaign } from "./roasReport";
import { isExcludedCampaign } from "./meta";
import { readManualRevenue } from "./manualRevenue";
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
  /** Valeur d'achat attribuée par META (≠ CA Shopify) — 0 si non renseigné. */
  purchaseValueCents: number;
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
  /** Valeur d'achat ATTRIBUÉE PAR META (≠ CA Shopify) — sert au CPA/CVR/
   * panier moyen quand une campagne est isolée dans l'onglet Analyse :
   * Shopify ne relie pas une commande à une campagne, Meta si (à son
   * attribution près). Toujours affiché comme « Meta », jamais confondu
   * avec le CA réel. */
  purchase_value_cents: number | null;
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

/**
 * 📍 Changements de BUDGET réels, lus dans le journal d'activité du compte
 * Meta (`act_.../activities`) — la même source que l'onglet Scaling utilise
 * déjà pour savoir « ce qui a été appliqué ».
 *
 * Sert aux pointillés vert/rouge de l'onglet Analyse (Badr 29/08). La 1re
 * version les DÉDUISAIT d'un saut de dépense ≥ 20 % faute de budget
 * historisé — approximation assumée mais qui rate un scale absorbé
 * progressivement et invente un scale quand Meta accélère toute seule. Ici
 * c'est le geste lui-même, horodaté, avec l'ancien et le nouveau montant.
 *
 * Le jour est calculé en heure de PARIS côté serveur (l'événement arrive avec
 * son propre décalage : +0200 l'été, +0000 ailleurs) — jamais côté client,
 * dont le fuseau est inconnu.
 */
export interface BudgetChange {
  day: string;
  /** Heure du changement en heure de Paris (HH:mm) — Badr modifie ses budgets
   * vers 23 h : l'effet se voit surtout le LENDEMAIN, autant qu'il le lise. */
  at: string;
  campaignId: string;
  campaignName: string | null;
  oldBudgetCents: number | null;
  newBudgetCents: number | null;
}

const fetchBudgetChangesUncached = async (sinceDay: string): Promise<BudgetChange[]> => {
  const [{ fetchCampaignActivities }, { toParisDay }, { formatInTimeZone }] = await Promise.all([
    import("./meta"),
    import("./time"),
    import("date-fns-tz"),
  ]);
  const activities = await fetchCampaignActivities(sinceDay);
  return activities
    .filter((a) => a.kind === "budget" && a.newBudgetCents !== null && a.oldBudgetCents !== null)
    .filter((a) => !isExcludedCampaign(a.campaignName))
    .map((a) => ({
      day: toParisDay(a.eventTime),
      at: (() => {
        try {
          return formatInTimeZone(a.eventTime, "Europe/Paris", "HH:mm");
        } catch {
          return "";
        }
      })(),
      campaignId: a.campaignId,
      campaignName: a.campaignName,
      oldBudgetCents: a.oldBudgetCents,
      newBudgetCents: a.newBudgetCents,
    }));
};

/** Cache 5 min, tag « meta-live » (invalidé par le bouton Actualiser) : un
 * budget ne bouge que quand Badr le bouge, et l'onglet ne doit pas refaire un
 * appel Meta à chaque rendu. */
export const getBudgetChanges = unstable_cache(fetchBudgetChangesUncached, ["meta-budget-changes"], {
  revalidate: 300,
  tags: ["meta-live"],
});

export async function getAnalyticsData(start: string, end: string): Promise<AnalyticsData> {
  const supabase = createSupabaseServerClient();

  const insights: InsightDaily[] = [];
  let missingTables = false;

  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from("meta_insights")
      .select(
        "day, market, campaign_id, campaign_name, spend_cents, impressions, clicks, purchases, purchase_value_cents, reach"
      )
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
        purchaseValueCents: r.purchase_value_cents ?? 0,
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
  /**
   * CA Shopify dont l'`utm_campaign` pointe VRAIMENT vers une campagne de ce
   * produit (24/08). C'est le numérateur du ROAS UTM — la mesure la plus
   * honnête d'une campagne le jour même, parce qu'elle lit de l'argent
   * réellement encaissé au lieu de ce que Meta revendique.
   *
   * Les trois chiffres ne disent PAS la même chose :
   *  • MER        = tout le CA du bloc ÷ spend (inclut organique/direct/e-mail) ;
   *  • ROAS UTM   = CA tagué par la campagne ÷ spend ;
   *  • ROAS Meta  = ce que Meta s'attribue ÷ spend — SOUS-ESTIME le jour même
   *    (rattrapage sous 24-72 h), puis dépasse l'UTM sur les jours clos
   *    (il voit des conversions que l'UTM perd : CAPI, cross-device).
   * Mesuré le 24/08 à 16h sur Lancaster : MER 2,87x · UTM 2,35x · Meta 1,86x.
   */
  utmCaCents: number;
  utmOrders: number;
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
  line_items: { title: string; quantity?: number | null; price_cents?: number | null }[];
  /** URL d'atterrissage tronquée : porte l'`utm_campaign` (migration 0008). */
  landing_site?: string | null;
}

// ---------------------------------------------------------------------------
// PRODUIT PRINCIPAL D'UNE COMMANDE (règle Badr, 24/08)
//
// « Il faudra envoyer la commande selon le produit principal : s'il est venu
// acheter le polo, même si ça contient un gilet, la commande revient au polo. »
//
// L'ancienne règle (« contient un gilet → Gilet ») versait au Gilet des
// paniers de clients venus pour le Polo, et gonflait son MER sans une ligne
// de spend Lancaster en face. Mesuré sur le 18→24/08 : 752 € sur 3 889 €
// (19 % du bucket) ne venaient pas de Lancaster.
//
// On tranche par l'INTENTION, dans cet ordre :
//   1. La campagne d'arrivée (utm_campaign de `landing_site`) : c'est
//      littéralement ce qu'il est venu acheter. LANCASTER → Gilet, toute
//      autre campagne connue → Polo.
//   2. Campagne inconnue ou absente (Google, direct, e-mail, UTM perdue —
//      ~15 % des commandes) : on retombe sur le panier et on garde le
//      produit PRINCIPAL qui pèse le plus en euros. Gilet et Polo sont les
//      seuls principaux ; Chemise/Short/Caleçon/E-Book sont des upsells et
//      ne décident jamais.
//   3. Aucun principal identifiable (commande 100 % upsell) : Polo, comme
//      avant — c'est lui qui absorbe le reste.
// ---------------------------------------------------------------------------

export type PrincipalProduct = "GILET" | "POLO";

/**
 * `landing_site` vient de la migration 0008, qui peut ne PAS être appliquée
 * (tout le reste du dépôt le suppose déjà — cf. `acquisitionColumnsReady`).
 * Sans elle, on ne perd que l'étape « campagne d'arrivée » : la règle du
 * panier prend le relais, au lieu de faire échouer tout le découpage.
 */
async function ordersHaveLandingSite(
  supabase: ReturnType<typeof createSupabaseServerClient>
): Promise<boolean> {
  const { error } = await supabase.from("orders").select("landing_site").limit(1);
  return !error;
}

/** Colonnes à lire sur `orders`, selon que la migration 0008 est là ou non. */
function orderColumns(hasLandingSite: boolean, extra = ""): string {
  return (
    `${extra}total_cents, refunded_cents, cogs_product_cents, cogs_upsells_cents, tax_eu_cents, line_items` +
    (hasLandingSite ? ", landing_site" : "")
  );
}

export interface PrincipalProductContext {
  /** Titres (minuscules) des produits rattachés au Gilet. */
  giletTitles: Set<string>;
  /** Titres (minuscules) des produits rattachés au Polo. */
  poloTitles: Set<string>;
  /** campaign_id → produit visé par la campagne (lu dans meta_spend). */
  productByCampaignId: Map<string, PrincipalProduct>;
}

function lineRevenueCents(li: { quantity?: number | null; price_cents?: number | null }): number {
  const q = li.quantity ?? 1;
  const p = li.price_cents ?? 0;
  return q * p;
}

/** Produit principal d'une commande — voir le bloc ci-dessus. Pur et testé. */
export function principalProductForOrder(
  order: Pick<RawOrderForSplit, "line_items" | "landing_site">,
  ctx: PrincipalProductContext
): PrincipalProduct {
  // 1. L'intention, telle que la campagne d'arrivée la donne.
  const campaignId = parseUtmCampaign(order.landing_site);
  if (campaignId) {
    const viaCampaign = ctx.productByCampaignId.get(campaignId);
    // Campagne inconnue (clic sur une campagne coupée depuis, ou test
    // produit) : on ne devine pas, on passe au panier.
    if (viaCampaign) return viaCampaign;
  }

  // 2. À défaut, le principal qui pèse le plus dans le panier.
  let giletCents = 0;
  let poloCents = 0;
  let giletQty = 0;
  let poloQty = 0;
  let giletLines = 0;
  let poloLines = 0;
  for (const li of order.line_items ?? []) {
    const t = (li.title ?? "").trim().toLowerCase();
    if (ctx.giletTitles.has(t)) {
      giletCents += lineRevenueCents(li);
      giletQty += li.quantity ?? 1;
      giletLines += 1;
    } else if (ctx.poloTitles.has(t)) {
      poloCents += lineRevenueCents(li);
      poloQty += li.quantity ?? 1;
      poloLines += 1;
    }
  }

  // Un seul principal au panier : aucune ambiguïté, et surtout aucune
  // dépendance aux prix de ligne (ils peuvent être absents en base — c'est
  // ce cas qui décidait POLO à tort).
  if (giletLines > 0 && poloLines === 0) return "GILET";
  if (poloLines > 0 && giletLines === 0) return "POLO";

  // 3. Commande 100 % upsell : le Polo absorbe, comme avant.
  if (giletLines === 0 && poloLines === 0) return "POLO";

  // Les deux principaux au panier : les euros tranchent, puis les unités.
  // Vrai ex æquo (rare) → POLO : la règle de Badr vise justement à ne plus
  // sur-créditer le Gilet, on ne lui donne pas les cas douteux.
  if (giletCents !== poloCents) return giletCents > poloCents ? "GILET" : "POLO";
  if (giletQty !== poloQty) return giletQty > poloQty ? "GILET" : "POLO";
  return "POLO";
}

/** Lit products_map + meta_spend et construit le contexte de décision. */
async function loadPrincipalProductContext(
  supabase: ReturnType<typeof createSupabaseServerClient>,
  endDay: string
): Promise<PrincipalProductContext> {
  // Les campagnes sont lues sur 30 jours, pas seulement le jour même : un
  // clic d'hier sur une campagne coupée depuis doit rester attribuable.
  const from = new Date(`${endDay}T00:00:00Z`);
  from.setUTCDate(from.getUTCDate() - 30);
  const [{ data: mapRows, error: mapError }, { data: campRows, error: campError }] = await Promise.all([
    supabase.from("products_map").select("title_pattern, product_key"),
    supabase
      .from("meta_spend")
      .select("campaign_id, campaign_name")
      .gte("day", from.toISOString().slice(0, 10))
      .lte("day", endDay),
  ]);
  if (mapError) {
    // Message EXACT : la 1re version renvoyait « products_map illisible »
    // pour n'importe quel échec de lecture, y compris celui des commandes —
    // un diagnostic faux fait chercher au mauvais endroit.
    throw new Error(`products_map illisible : ${mapError.message}`);
  }

  const giletTitles = new Set<string>();
  const poloTitles = new Set<string>();
  for (const r of mapRows ?? []) {
    const t = ((r.title_pattern as string) ?? "").trim().toLowerCase();
    if (!t) continue;
    if ((r.product_key as string) === "GILET") giletTitles.add(t);
    else if ((r.product_key as string) === "POLO") poloTitles.add(t);
  }

  const productByCampaignId = new Map<string, PrincipalProduct>();
  for (const r of campError ? [] : (campRows ?? [])) {
    const name = ((r.campaign_name as string) ?? "").toUpperCase();
    // Les campagnes de TEST PRODUIT ne décident de rien : leurs commandes
    // repassent par le panier (le bloc Testing a sa propre carte).
    if (TESTING_CAMPAIGN_KEYWORDS.some((k) => name.includes(k))) continue;
    productByCampaignId.set(
      r.campaign_id as string,
      name.includes(GILET_CAMPAIGN_KEYWORD) ? "GILET" : "POLO"
    );
  }

  return { giletTitles, poloTitles, productByCampaignId };
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
  metaPurchaseValueCents: number,
  utm: { caCents: number; orders: number } = { caCents: 0, orders: 0 }
): ProductSplitCard {
  const netCents = bucket.caCents - spendCents - bucket.cogsCents - bucket.taxCents - feesCents;
  return {
    key, label, emoji, spendCents, feesCents, netCents, metaPurchaseValueCents,
    utmCaCents: utm.caCents, utmOrders: utm.orders,
    ...bucket,
  };
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
  return getProductSplitForRange(day, day, global);
}

/**
 * Même découpage, sur une PLAGE de jours — c'est ce que sert l'onglet
 * Produits (demande Badr 24/08 : « un truc comme pour les pays mais pour les
 * produits, pour voir ce que le Lancaster seul a rapporté »).
 */
export async function getProductSplitForRange(
  startDay: string,
  endDay: string,
  global: Totals
): Promise<ProductSplitCard[]> {
  const day = endDay;
  const supabase = createSupabaseServerClient();

  const [
    principalCtx,
    { data: spendRows, error: spendError },
    { data: insightRows, error: insightError },
  ] = await Promise.all([
    loadPrincipalProductContext(supabase, day),
    supabase.from("meta_spend").select("campaign_name, spend_cents").gte("day", startDay).lte("day", endDay),
    // Valeur d'achat attribuée par Meta, pour le ROAS Meta par produit (12/08).
    // Table issue d'une migration ultérieure : son absence ne casse rien, elle
    // laisse juste le ROAS Meta à 0 (le MER, lui, reste calculé).
    supabase
      .from("meta_insights")
      .select("campaign_name, purchase_value_cents")
      .gte("day", startDay)
      .lte("day", endDay),
  ]);
  const hasLandingSite = await ordersHaveLandingSite(supabase);

  const orders: RawOrderForSplit[] = [];
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = (await supabase
      .from("orders")
      .select(orderColumns(hasLandingSite))
      .gte("day", startDay)
      .lte("day", endDay)
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
  // CA réellement TAGUÉ par une campagne du produit (≠ bucket : ici on ne
  // compte QUE les commandes dont l'UTM pointe vers la campagne).
  const utm = { GILET: { caCents: 0, orders: 0 }, POLO: { caCents: 0, orders: 0 } };
  for (const o of orders) {
    const net = o.total_cents - o.refunded_cents;
    const viaCampaign = principalCtx.productByCampaignId.get(parseUtmCampaign(o.landing_site) ?? "");
    if (viaCampaign) {
      utm[viaCampaign].caCents += net;
      utm[viaCampaign].orders += 1;
    }
    // Règle Badr 24/08 : la commande suit le produit qu'il est venu acheter,
    // pas le simple fait qu'un gilet traîne dans le panier.
    if (principalProductForOrder(o, principalCtx) !== "GILET") continue;
    gilet.orders += 1;
    gilet.caCents += net;
    gilet.cogsCents += o.cogs_product_cents + o.cogs_upsells_cents;
    gilet.taxCents += o.tax_eu_cents;
  }

  // NIRA Burn : aucune commande Shopify (marché canadien, pas de boutique
  // branchée) — son CA/COGS vient des saisies manuelles, son spend des
  // campagnes dont le nom contient NIRA. Mesuré comme le Gilet, puis retiré du
  // Polo pour que les 3 cartes somment exactement au Global.
  const niraEntries = (await readManualRevenue(supabase)).filter(
    (e) => e.day >= startDay && e.day <= endDay && TESTING_PRODUCT_KEYS.has(e.productKey)
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

  // Valeur attribuée par Meta, découpée EXACTEMENT comme le spend (mêmes
  // mots-clés de campagne) : sans ça, un ROAS Meta par produit rapporterait
  // une recette et une dépense qui ne parlent pas des mêmes campagnes.
  const metaValues = insightError ? [] : (insightRows ?? []);
  const metaValueByKeywords = (kws: string[]) =>
    metaValues
      .filter((r) => {
        const name = ((r.campaign_name as string) ?? "").toUpperCase();
        return kws.some((k) => name.includes(k));
      })
      .reduce((s, r) => s + ((r.purchase_value_cents as number) ?? 0), 0);
  const metaValueTotal = metaValues.reduce((s, r) => s + ((r.purchase_value_cents as number) ?? 0), 0);

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
  const mv = split(
    metaValueByKeywords([GILET_CAMPAIGN_KEYWORD]),
    metaValueByKeywords(TESTING_CAMPAIGN_KEYWORDS),
    metaValueTotal
  );

  const cards = [
    toCard("GILET", "Gilet", "🎽", { orders: o.g, caCents: ca.g, cogsCents: cogs.g, taxCents: tax.g }, sp.g, fees.g, mv.g, utm.GILET),
    toCard("POLO", "Polo", "👕", { orders: o.polo, caCents: ca.polo, cogsCents: cogs.polo, taxCents: tax.polo }, sp.polo, fees.polo, mv.polo, utm.POLO),
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

// ---------------------------------------------------------------------------
// 🎽 Matrice PRODUIT × MARCHÉ × JOUR — demandée par Badr (24/08) : « je vois
// toujours pas un truc dans l'onglet Mois pour activer juste Polo ou juste
// Lancaster par pays, ou tous les produits ».
//
// Rend, pour chaque produit, la MÊME forme que `getTabDayData` (une série
// DayAgg par onglet marché) : l'onglet Mois n'a qu'à choisir la série et tout
// le reste de son code (tableau, graphe, totaux) fonctionne sans y toucher.
//
// Le marché d'une commande est son `store` — c'est exactement la clé que
// `aggregate.ts` utilise pour daily_aggregates, donc les blocs produit
// somment au global de LEUR onglet, marché par marché.
//
// « Tous les produits » n'est PAS recalculé ici : c'est la série existante,
// inchangée. Elle seule porte les charges fixes (transverses, jamais
// ventilées par produit ni par pays — doctrine du dashboard).
// ---------------------------------------------------------------------------

export type ProductSeriesKey = "GILET" | "POLO" | "TESTING";

type DayAggLike = Totals & { day: string };

const emptyTotals = (): Totals => ({
  orders: 0, caCents: 0, spendCents: 0, cogsCents: 0, cogsProductCents: 0,
  cogsUpsellsCents: 0, taxCents: 0, feesCents: 0, netCents: 0, refundedCents: 0,
});

interface OrderForMatrix extends RawOrderForSplit {
  day: string;
  store: string;
}

/** Ingrédients bruts du découpage, par `jour|onglet`. Sérialisable : c'est
 * CE morceau qui est caché, jamais les séries assemblées (passer tout
 * l'historique en argument d'unstable_cache en ferait la clé de cache). */
export interface ProductRawBuckets {
  gilet: Record<string, { orders: number; caCents: number; cogsCents: number; taxCents: number }>;
  nira: Record<string, { orders: number; caCents: number; cogsCents: number; taxCents: number }>;
  spend: Record<string, { gilet: number; testing: number }>;
}

interface OrderForMatrix extends RawOrderForSplit {
  day: string;
  store: string;
}

async function getProductRawBucketsUncached(
  startDay: string,
  endDay: string
): Promise<ProductRawBuckets> {
  const supabase = createSupabaseServerClient();
  const [principalCtx, hasLandingSite] = await Promise.all([
    loadPrincipalProductContext(supabase, endDay),
    ordersHaveLandingSite(supabase),
  ]);

  const gilet: ProductRawBuckets["gilet"] = {};
  const bump = (
    box: ProductRawBuckets["gilet"],
    k: string,
    o: { orders: number; caCents: number; cogsCents: number; taxCents: number }
  ) => {
    const b = (box[k] ??= { orders: 0, caCents: 0, cogsCents: 0, taxCents: 0 });
    b.orders += o.orders;
    b.caCents += o.caCents;
    b.cogsCents += o.cogsCents;
    b.taxCents += o.taxCents;
  };

  // 1. Bloc Gilet par (jour, marché), avec la règle du produit principal.
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = (await supabase
      .from("orders")
      .select(orderColumns(hasLandingSite, "day, store, "))
      .gte("day", startDay)
      .lte("day", endDay)
      .order("id", { ascending: true })
      .range(from, from + PAGE - 1)) as unknown as {
      data: OrderForMatrix[] | null;
      error: { message: string } | null;
    };
    if (error) throw new Error(`lecture des commandes : ${error.message}`);
    const rows = data ?? [];
    for (const o of rows) {
      if (principalProductForOrder(o, principalCtx) !== "GILET") continue;
      const inc = {
        orders: 1,
        caCents: o.total_cents - o.refunded_cents,
        cogsCents: o.cogs_product_cents + o.cogs_upsells_cents,
        taxCents: o.tax_eu_cents,
      };
      bump(gilet, `${o.day}|${o.store}`, inc);
      bump(gilet, `${o.day}|GLOBAL`, inc);
    }
    if (rows.length < PAGE) break;
  }

  // 2. Spend des campagnes Gilet et Testing par (jour, marché). Le spend
  // UNMAPPED n'appartient à aucun pays mais compte dans le GLOBAL, comme
  // partout ailleurs dans le dashboard.
  const { data: spendRows } = await supabase
    .from("meta_spend")
    .select("day, market, campaign_name, spend_cents")
    .gte("day", startDay)
    .lte("day", endDay);
  const spend: ProductRawBuckets["spend"] = {};
  for (const r of spendRows ?? []) {
    const name = ((r.campaign_name as string) ?? "").toUpperCase();
    const isGilet = name.includes(GILET_CAMPAIGN_KEYWORD);
    const isTesting = TESTING_CAMPAIGN_KEYWORDS.some((k) => name.includes(k));
    if (!isGilet && !isTesting) continue;
    for (const k of [`${r.day}|${r.market}`, `${r.day}|GLOBAL`]) {
      const b = (spend[k] ??= { gilet: 0, testing: 0 });
      if (isGilet) b.gilet += r.spend_cents as number;
      else b.testing += r.spend_cents as number;
    }
  }

  // 3. NIRA : aucune commande Shopify, CA saisi à la main sur le marché CA.
  const nira: ProductRawBuckets["nira"] = {};
  for (const e of await readManualRevenue(supabase)) {
    if (e.day < startDay || e.day > endDay) continue;
    if (!TESTING_PRODUCT_KEYS.has(e.productKey)) continue;
    const inc = { orders: e.orders, caCents: e.caEurCents, cogsCents: e.cogsEurCents, taxCents: 0 };
    bump(nira, `${e.day}|CA`, inc);
    bump(nira, `${e.day}|GLOBAL`, inc);
  }

  return { gilet, nira, spend };
}

/** Lecture cachée 5 min — le calcul pagine toute la table orders (line_items
 * compris) et ne sert qu'à de l'affichage agrégé sur des jours clos.
 * Invalidable par le bouton Actualiser. */
export const getProductRawBuckets = unstable_cache(
  getProductRawBucketsUncached,
  ["product-day-matrix"],
  { revalidate: 300, tags: ["product-day-matrix"] }
);

/**
 * Assemble les séries par produit à partir des ingrédients bruts et des
 * séries globales de chaque onglet. PUR : c'est ici que vit l'invariant
 * « Gilet + Polo + Testing = le global de CET onglet », et il est testé.
 */
export function buildProductSeries(
  raw: ProductRawBuckets,
  globalByTab: Record<string, DayAggLike[]>
): Record<ProductSeriesKey, Record<string, DayAggLike[]>> {
  const out = {
    GILET: {} as Record<string, DayAggLike[]>,
    POLO: {} as Record<string, DayAggLike[]>,
    TESTING: {} as Record<string, DayAggLike[]>,
  };
  const clamp = (v: number, g: number) => Math.min(v, Math.max(g, 0));
  const zero = { orders: 0, caCents: 0, cogsCents: 0, taxCents: 0 };

  for (const [tab, rows] of Object.entries(globalByTab)) {
    const gSeries: DayAggLike[] = [];
    const pSeries: DayAggLike[] = [];
    const tSeries: DayAggLike[] = [];
    for (const r of rows) {
      const k = `${r.day}|${tab}`;
      const gRaw = raw.gilet[k] ?? zero;
      const nRaw = raw.nira[k] ?? zero;
      const sp = raw.spend[k] ?? { gilet: 0, testing: 0 };

      // Chaque composant est clampé au global de l'onglet, le Polo absorbe le
      // reste : la somme des trois séries redonne ce global, au centime.
      const part = (giletRaw: number, niraRaw: number, g: number) => {
        const gg = clamp(giletRaw, g);
        const nn = clamp(niraRaw, Math.max(g - gg, 0));
        return { g: gg, n: nn, polo: Math.max(g - gg - nn, 0) };
      };
      const o = part(gRaw.orders, nRaw.orders, r.orders);
      const ca = part(gRaw.caCents, nRaw.caCents, r.caCents);
      const cogs = part(gRaw.cogsCents, nRaw.cogsCents, r.cogsCents);
      const tax = part(gRaw.taxCents, 0, r.taxCents);
      const spl = part(sp.gilet, sp.testing, r.spendCents);
      // Frais dérivés du CA de chaque bloc, solde au Polo — jamais deux
      // arrondis indépendants qui ne sommeraient pas au frais du global.
      const fees = part(feesCentsForCa(ca.g), feesCentsForCa(ca.n), r.feesCents);

      const mk = (
        orders: number, caCents: number, cogsCents: number, taxCents: number,
        spendCents: number, feesCents: number
      ): DayAggLike => ({
        ...emptyTotals(),
        day: r.day,
        orders, caCents, cogsCents, taxCents, spendCents, feesCents,
        netCents: caCents - spendCents - cogsCents - taxCents - feesCents,
      });

      gSeries.push(mk(o.g, ca.g, cogs.g, tax.g, spl.g, fees.g));
      pSeries.push(mk(o.polo, ca.polo, cogs.polo, tax.polo, spl.polo, fees.polo));
      tSeries.push(mk(o.n, ca.n, cogs.n, tax.n, spl.n, fees.n));
    }
    out.GILET[tab] = gSeries;
    out.POLO[tab] = pSeries;
    out.TESTING[tab] = tSeries;
  }
  return out;
}


/** endDay inclus, 14 jours glissants. null si les commandes sont illisibles
 * (le composant retombe alors sur les seuils GLOBAL). */
async function getProductRoasThresholdsUncached(
  endDay: string
): Promise<Record<CreaProduct, ProductRoasThresholds> | null> {
  const supabase = createSupabaseServerClient();
  const start = new Date(`${endDay}T00:00:00Z`);
  start.setUTCDate(start.getUTCDate() - 13);
  const startDay = start.toISOString().slice(0, 10);

  const [principalCtx, hasLandingSite] = await Promise.all([
    loadPrincipalProductContext(supabase, endDay),
    ordersHaveLandingSite(supabase),
  ]);

  const gilet = emptyBucket();
  const polo = emptyBucket();
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = (await supabase
      .from("orders")
      .select(orderColumns(hasLandingSite))
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
      // Même règle que getProductSplitForDay (produit principal, pas
      // « contient un gilet ») : les deux vues doivent bucketer pareil.
      const b = principalProductForOrder(o, principalCtx) === "GILET" ? gilet : polo;
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

/**
 * Version cachée 5 min (même pattern que getTodaySnapshot, live.ts) : le
 * calcul pagine la table orders (line_items compris, ~Mo de JSON) à chaque
 * appel alors qu'il ne porte que sur des jours CLOS — 5 min de staleness sur
 * un CM 14 j est indiscernable pour un seuil comparé à 15 %. endDay fait
 * partie de la clé (unstable_cache intègre les arguments). Invalidable par
 * le bouton Actualiser (tag, cf. /api/refresh).
 */
export const getProductRoasThresholds = unstable_cache(
  getProductRoasThresholdsUncached,
  ["product-roas-thresholds"],
  { revalidate: 300, tags: ["product-roas-thresholds"] }
);
