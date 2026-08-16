import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "./supabase";
import {
  getShopifyStoreConfigs,
  iterateOrders,
  computeRefundedCentsAccurate,
  resolveAccessToken,
  totalPriceShopCents,
  orderAcquisitionFields,
  acquisitionColumnsReady,
  realFeeColumnsReady,
} from "./shopify";
import {
  fetchMetaAdInsights,
  fetchMetaInsights,
  loadCampaignOverrides,
  resolveCampaignMarket,
} from "./meta";
import {
  classifyLineItemsTolerant,
  computeOrderCogsTaxTolerant,
  type ProductMapEntry,
} from "./engine";
import { toParisDay, todayParisDay, addDaysToDay } from "./time";
import { recomputeDailyAggregatesForDays } from "./aggregate";
import { upsertSpendRows, CA_MIGRATION_WARNING, type SpendRowForWrite } from "./spendWrite";
import { fetchOrderFees, type OrderFees } from "./shopifyFees";

export interface IncrementalSyncResult {
  ran: boolean;
  /** true = une étape de resync reste à faire — le client doit rappeler /api/sync tout de suite. */
  moreWork?: boolean;
  touchedDays?: string[];
  warnings?: string[];
}

/**
 * Rescan incrémental : commandes modifiées sur les 7 derniers jours (§4.7,
 * remboursements tardifs) + spend Meta J-7→J-1, puis recalcule les jours
 * touchés + toujours J-2/J-1/J en filet de sécurité (voir cron/route.ts).
 * Partagé entre le cron de minuit et la synchro auto déclenchée par les
 * visites du site (throttlée, voir /api/sync).
 */
export async function runIncrementalSync(
  supabase: SupabaseClient,
  productsMap: ProductMapEntry[]
): Promise<IncrementalSyncResult> {
  const today = todayParisDay();
  const rescanFromDay = addDaysToDay(today, -7);
  const yesterday = addDaysToDay(today, -1);
  const updatedAtMinIso = `${rescanFromDay}T00:00:00+02:00`;

  // FR d'abord : c'est ~90 % des ventes — s'il doit se passer quelque chose
  // (limite de temps, erreur), que les petits stores en pâtissent, pas FR.
  const configs = [...getShopifyStoreConfigs()].sort(
    (a, b) => Number(b.market === "FR") - Number(a.market === "FR")
  );
  const touchedDays = new Set<string>();
  const warnings: string[] = [];
  // Produits rencontrés dans les commandes mais absents de products_map (ou
  // des grilles COGS). Regroupés pour n'émettre qu'UN avertissement lisible
  // à la fin, plutôt qu'un par commande.
  const unmappedProducts = new Set<string>();

  // Écritures PAR LOTS (250) : commande par commande, le rescan J-7 de FR
  // (~600 commandes) prenait 1-2 min à chaque cycle → badge « synchro en
  // cours » interminable à chaque visite.
  const ORDER_CHUNK = 250;
  const hasAcqColumns = await acquisitionColumnsReady(supabase);
  const hasFeeColumns = await realFeeColumnsReady(supabase);
  // Angle mort corrigé le 06/08 : quand les colonnes manquaient, la lecture des
  // frais réels était sautée SANS RIEN DIRE — impossible de distinguer « tout
  // va bien » de « la migration n'est pas passée ». Un repli silencieux sur
  // l'ancien 3 % est exactement le genre d'erreur qui dort pendant des mois.
  if (!hasFeeColumns) {
    warnings.push(
      "⚠️ Frais Shopify réels NON lus : la migration 0013 n'est pas appliquée en base. " +
        "Le net retombe sur l'ancienne estimation 3 % — mesuré 6,54 % en réalité, donc " +
        "le bénéfice affiché est TROP OPTIMISTE d'environ 3,5 % du CA."
    );
  }
  for (const config of configs) {
    try {
      const token = await resolveAccessToken(config);
      // Frais Shopify RÉELS du store sur la fenêtre re-scannée : UNE requête
      // GraphQL par tranche de 250 commandes, au lieu d'un appel par commande.
      // Best effort : si ça échoue, les commandes restent enregistrées et le
      // net retombe sur l'ancienne estimation 3 % (jamais zéro).
      let feesByOrderId = new Map<string, OrderFees>();
      if (hasFeeColumns) {
        try {
          // Fenêtre COURTE (J-2 → J) et non les 7 jours du rescan : la lecture
          // des frais pagine 250 commandes par requête avec 550 ms d'attente,
          // ce qui allongeait une fonction déjà proche de sa limite de temps.
          // Si elle est tuée, AUCUNE commande n'est écrite et le CA se fige —
          // exactement le symptôme constaté le 06/08 (27 cmd affichées contre
          // 39 réelles). Les jours plus anciens reçoivent leurs frais via le
          // re-scan complet, qui tourne en étapes sans bloquer le jour courant.
          const feesFromDay = addDaysToDay(today, -2);
          const r = await fetchOrderFees(config, token, feesFromDay, today);
          feesByOrderId = r.byOrderId;
          if (r.unknownTypes.size > 0) {
            warnings.push(
              `Frais Shopify ${config.market} : type(s) inconnu(s) ${[...r.unknownTypes].join(", ")} — comptés en « autres », à vérifier.`
            );
          }
          if (r.sawRefundFees) {
            warnings.push(
              `Frais Shopify ${config.market} : des transactions REFUND portent des frais — suivis à part, PAS encore déduits (à valider).`
            );
          }
        } catch (err) {
          warnings.push(`Frais Shopify ${config.market} indisponibles (repli 3 %) : ${(err as Error).message}`);
        }
      }
      const rows: Record<string, unknown>[] = [];
      for await (const order of iterateOrders(config, { updatedAtMin: updatedAtMinIso })) {
        const day = toParisDay(order.created_at);
        const shippingCountry = order.shipping_address?.country_code ?? config.market;

        // Version TOLÉRANTE : un produit inconnu ne fait plus disparaître la
        // vente (ni, pire, tout le lot du store — computeOrderCogsTax était
        // hors du try/catch et tuait la boucle entière). On enregistre la
        // commande, on signale le produit à mapper.
        const classified = classifyLineItemsTolerant(
          order.line_items.map((li) => ({
            title: li.title,
            sku: li.sku ?? undefined,
            quantity: li.quantity,
            price_cents: Math.round(parseFloat(li.price) * 100),
          })),
          productsMap,
          config.market
        );
        for (const t of classified.unknownTitles) unmappedProducts.add(`${config.market} · ${t}`);

        touchedDays.add(day);
        const { cogsProductCents, cogsUpsellsCents, taxCents, unknownUpsellKeys } =
          computeOrderCogsTaxTolerant({
            store: config.market,
            shippingCountry,
            day,
            poloQty: classified.poloQty,
            upsells: classified.upsells,
            unknownDistinctCount: classified.unknownDistinctCount,
          });
        for (const k of unknownUpsellKeys) unmappedProducts.add(`${config.market} · clé ${k}`);

        rows.push({
          id: order.id,
          store: config.market,
          order_name: order.name,
          created_at_utc: order.created_at,
          day,
          shipping_country: shippingCountry,
          total_cents: totalPriceShopCents(order),
          refunded_cents: await computeRefundedCentsAccurate(config, token, order),
          line_items: order.line_items,
          polo_qty: classified.poloQty,
          upsells: classified.upsells,
          cogs_product_cents: cogsProductCents,
          cogs_upsells_cents: cogsUpsellsCents,
          tax_eu_cents: taxCents,
          updated_at_utc: order.updated_at,
          ...(hasAcqColumns ? orderAcquisitionFields(order) : {}),
          ...(hasFeeColumns && feesByOrderId.has(String(order.id))
            ? (() => {
                const f = feesByOrderId.get(String(order.id))!;
                return {
                  fee_processing_cents: f.processingCents,
                  fee_fx_cents: f.fxCents,
                  fee_other_cents: f.otherCents,
                  fee_total_cents: f.totalCents,
                  fee_refund_cents: f.refundFeeCents,
                };
              })()
            : {}),
        });
      }
      for (let i = 0; i < rows.length; i += ORDER_CHUNK) {
        const { error } = await supabase.from("orders").upsert(rows.slice(i, i + ORDER_CHUNK));
        // Une écriture qui échoue doit se VOIR (warning sur /debug), jamais
        // passer en silence — cause du « j'ai eu des ventes et rien ne bouge ».
        if (error) throw new Error(`écriture commandes échouée : ${error.message}`);
      }
      await supabase
        .from("sync_state")
        .upsert({ store: config.market, last_orders_sync: new Date().toISOString() });
    } catch (err) {
      warnings.push(`${config.market} ignoré : ${(err as Error).message}`);
    }
  }

  // ⚠️ RECALCUL IMMÉDIAT, AVANT TOUTE LA PARTIE META.
  // daily_aggregates est la table que le dashboard LIT. Tant que ce recalcul
  // n'a pas tourné, les commandes fraîchement écrites ci-dessus restent
  // invisibles. En le laissant à la toute fin (après les insights Meta,
  // annonces, pays, textes de créas), le moindre dépassement de temps sur
  // Meta gelait le CA du jour alors que les ventes ÉTAIENT en base — cause du
  // « toujours rien » du 26/07. Le CA passe donc avant tout le reste ; un
  // second recalcul en fin de cycle intégrera le spend.
  for (const d of [addDaysToDay(today, -2), yesterday, today]) touchedDays.add(d);
  try {
    await recomputeDailyAggregatesForDays(supabase, touchedDays);
  } catch (err) {
    warnings.push(`Recalcul des agrégats (commandes) échoué : ${(err as Error).message}`);
  }

  try {
    // Jusqu'à AUJOURD'HUI inclus : borné à hier, le spend du jour n'était
    // jamais rafraîchi entre deux backfills → ROAS du jour incohérent entre
    // Live (spend direct) et Mois (agrégats). Constaté le 19/07.
    const [metaRows, overrides] = await Promise.all([
      fetchMetaInsights(rescanFromDay, today),
      loadCampaignOverrides(supabase),
    ]);
    // Écritures PAR LOTS : la version commande-par-commande (~800 upserts
    // séquentiels avec les annonces + pays) faisait dépasser la limite de
    // temps de la fonction → « synchro en cours » sans fin.
    const CHUNK = 500;
    const spendUpserts: Record<string, unknown>[] = [];
    const insightUpserts: Record<string, unknown>[] = [];
    for (const row of metaRows) {
      touchedDays.add(row.day);
      const market = resolveCampaignMarket(row.campaignName, row.campaignId, overrides);
      spendUpserts.push({
        day: row.day,
        market,
        campaign_id: row.campaignId,
        campaign_name: row.campaignName,
        spend_cents: row.spendCents,
      });
      insightUpserts.push({
        day: row.day,
        campaign_id: row.campaignId,
        campaign_name: row.campaignName,
        market,
        spend_cents: row.spendCents,
        impressions: row.impressions,
        clicks: row.clicks,
        purchases: row.purchases,
        purchase_value_cents: row.purchaseValueCents,
        reach: row.reach,
        frequency: row.frequency,
        link_clicks: row.linkClicks,
        landing_page_views: row.landingPageViews,
        add_to_cart: row.addToCart,
        initiate_checkout: row.initiateCheckout,
        video_3s: row.video3s,
        thruplays: row.thruplays,
      });
    }
    // Écriture protégée : une ligne market='CA' refusée par la contrainte
    // (migration 0012 pas encore collée) ferait sinon rejeter TOUT le lot,
    // et l'erreur n'était pas relue → spend perdu en silence.
    let caDowngraded = false;
    for (let i = 0; i < spendUpserts.length; i += CHUNK) {
      const res = await upsertSpendRows(supabase, spendUpserts.slice(i, i + CHUNK) as SpendRowForWrite[]);
      if (res.downgradedToUnmapped) caDowngraded = true;
      if (res.error) warnings.push(`Spend Meta partiellement non enregistré : ${res.error}`);
    }
    if (caDowngraded) warnings.push(CA_MIGRATION_WARNING);
    for (let i = 0; i < insightUpserts.length; i += CHUNK) {
      await supabase.from("meta_insights").upsert(insightUpserts.slice(i, i + CHUNK));
    }
    // Niveau annonce (créas + hit rate). Isolé : son échec ne bloque rien.
    try {
      const adRows = await fetchMetaAdInsights(rescanFromDay, today);
      // video_p50/p75/p100 ajoutés par la migration 0011 — probe avant
      // d'inclure, même filet que UNMAPPED/cogs_split (colonne absente ferait
      // échouer tout le lot sinon).
      const { error: videoPctProbeError } = await supabase
        .from("meta_ad_insights")
        .select("video_p50")
        .limit(1);
      const hasVideoPct = !videoPctProbeError;
      const adUpserts = adRows.map((row) => ({
        day: row.day,
        ad_id: row.adId,
        ad_name: row.adName,
        campaign_id: row.campaignId,
        campaign_name: row.campaignName,
        market: resolveCampaignMarket(row.campaignName, row.campaignId, overrides),
        spend_cents: row.spendCents,
        impressions: row.impressions,
        clicks: row.clicks,
        purchases: row.purchases,
        purchase_value_cents: row.purchaseValueCents,
        reach: row.reach,
        frequency: row.frequency,
        link_clicks: row.linkClicks,
        landing_page_views: row.landingPageViews,
        add_to_cart: row.addToCart,
        initiate_checkout: row.initiateCheckout,
        video_3s: row.video3s,
        thruplays: row.thruplays,
        quality_ranking: row.qualityRanking,
        engagement_ranking: row.engagementRanking,
        conversion_ranking: row.conversionRanking,
        ...(hasVideoPct
          ? { video_p50: row.video50, video_p75: row.video75, video_p100: row.video100 }
          : {}),
      }));
      for (let i = 0; i < adUpserts.length; i += CHUNK) {
        await supabase.from("meta_ad_insights").upsert(adUpserts.slice(i, i + CHUNK));
      }
    } catch (err) {
      warnings.push(`Créas Meta (niveau annonce) indisponibles : ${(err as Error).message}`);
    }
    // (Le texte des créas n'est PAS récupéré ici : il faut parcourir tout le
    // compte, 300+ annonces, pour une donnée qui ne change quasiment jamais.
    // Le faire toutes les 5 min allongeait le cycle au point de le faire
    // dépasser sa limite de temps. Il est rafraîchi lors du rattrapage Meta.)
    // Breakdown pays : le vrai ROAS BE/CA/CH dans les campagnes « FR ».
    try {
      const { fetchMetaCountryInsights } = await import("./meta");
      const countryRows = await fetchMetaCountryInsights(rescanFromDay, today);
      const countryUpserts = countryRows.map((row) => ({
        day: row.day,
        campaign_id: row.campaignId,
        country: row.country,
        spend_cents: row.spendCents,
        impressions: row.impressions,
        clicks: row.clicks,
        purchases: row.purchases,
        purchase_value_cents: row.purchaseValueCents,
      }));
      for (let i = 0; i < countryUpserts.length; i += CHUNK) {
        await supabase.from("meta_country_insights").upsert(countryUpserts.slice(i, i + CHUNK));
      }
    } catch (err) {
      warnings.push(`Répartition pays Meta indisponible : ${(err as Error).message}`);
    }
  } catch (err) {
    warnings.push(`Spend Meta indisponible pour ce cycle : ${(err as Error).message}`);
  }

  // 📓 Journal : détection auto (campagne coupée/lancée, saut de budget)
  // depuis meta_spend — marche même quand le token Meta est HS (seed SQL).
  // Isolé : une erreur ici ne doit pas empêcher le recalcul final ci-dessous.
  try {
    const { detectCampaignEvents } = await import("./journal");
    await detectCampaignEvents(supabase);
  } catch (err) {
    warnings.push(`Journal auto indisponible : ${(err as Error).message}`);
  }

  // 2e recalcul : intègre le spend Meta arrivé ci-dessus. Le CA, lui, a déjà
  // été publié avant la phase Meta (voir plus haut).
  try {
    await recomputeDailyAggregatesForDays(supabase, touchedDays);
  } catch (err) {
    warnings.push(`Recalcul des agrégats (spend) échoué : ${(err as Error).message}`);
  }

  if (unmappedProducts.size > 0) {
    warnings.push(
      `⚠️ Produits à mapper dans /admin (COGS compté 0 € en attendant, le Net est donc trop optimiste) : ${[
        ...unmappedProducts,
      ].join(" · ")}`
    );
  }

  return { ran: true, touchedDays: [...touchedDays].sort(), warnings };
}

const THROTTLE_KEY = "last_incremental_sync_at";
const THROTTLE_MS = 5 * 60 * 1000;
// Clic manuel sur « Actualiser » (07/08, Badr : « ça ne s'actualise pas assez
// vite ») : fenêtre réduite à 60 s. Un humain qui clique attend du frais
// MAINTENANT ; 60 s suffisent à protéger Shopify/Meta d'un double-clic, et
// l'automatique (LiveSync) reste à 5 min pour ne pas marteler les API.
const FORCE_THROTTLE_MS = 60 * 1000;

// Marqueur de « migration de données » auto-appliquée. À chaque correction
// de bug qui fausse des données déjà en base (ex : devise de remboursement
// mal lue le 16/07), on bump cette version — la prochaine synchro auto
// détecte l'écart et relance un backfill complet de tout l'historique
// silencieusement, sans que Badr n'ait jamais à cliquer sur rien. Une fois
// à jour, elle repasse en synchro rapide (7 jours) normalement.
// Trois marqueurs SÉPARÉS, du moins cher au plus cher — un correctif qui ne
// touche qu'aux données Meta ne doit JAMAIS re-scanner deux mois de commandes
// Shopify (5 000+ commandes = dépassement de la limite de temps garanti, la
// synchro repartait de zéro à chaque appel et le jour en cours restait figé —
// constaté 26/07 : 12 ventes réelles, 1 affichée).
//
//   • recompute : relit orders/meta_spend en base et réécrit daily_aggregates.
//     Aucun appel API. À bumper quand seul le CALCUL change.
//   • orders    : re-télécharge tout l'historique Shopify. Très lent.
//     À bumper UNIQUEMENT quand un champ des commandes change.
//   • meta      : re-télécharge tout l'historique Meta. À bumper quand une
//     métrique Meta est ajoutée.
const RECOMPUTE_VERSION_KEY = "full_recompute_version";
// v14 (12/08) : COGS NIRA calculés depuis le devis Panda (grille par pays et
// par bundle, engine.ts) au lieu des 0 assumés, + frais 6 % du CA (taux donné
// par Badr). Recalcul SEUL.
// v13 (12/08) : NIRA recalé sur l'export des transactions (4 commandes
// réussies au lieu de 3 annoncées oralement, montants exacts au centime,
// #1004 imputée à son jour de commande et ses 2 tentatives en échec exclues).
// Recalcul SEUL : les entrées voyagent avec le code (manualRevenue.ts).
// v12 (12/08) : comblement 21/05→03/06 reconstruit depuis les VRAIES
// commandes (Badr : « sur mai y'a 20 % de marge nette, tes COGS ne sont pas
// bons »). L'ancien forfait portait un CA à plat avec COGS/frais à ZÉRO :
// ~2 164 € de COGS et ~165 € de frais jamais déduits, et un CA surévalué de
// ~999 € (04/06 double-compté + remboursements). Recalcul SEUL : les entrées
// voyagent avec le code (manualRevenue.ts), aucun appel API requis.
// v11 (12/08) : forfait « autres 1 % » SUPPRIMÉ du poste Frais (Badr : « ça
// ne correspond à rien, je veux les vrais frais ») — feesCents = frais
// Shopify réels (ou repli 3 %) uniquement. Recalcul SEUL : les frais par
// commande sont déjà en base, seule la formule d'agrégation change.
// v10 (08/08) : comblement manuel du CA FR du 21/05→03/06 (manualRevenue.ts,
// GAP_FILL_MAI_JUIN) — Shopify orders.json ne remonte pas au-delà de 60 j
// sans le scope read_all_orders. Recalcul SEUL (les entrées voyagent avec le
// code, aucun appel API requis pour les faire apparaître).
// v9 (06/08) : le spend NIRA REVIENT dans le calcul (Badr : « plus adapté à la
// réalité »), son CA étant désormais saisi à la main à chaque vente. Recalcul
// SEUL, sans appel API : les lignes meta_spend n'ont jamais quitté la base,
// elles étaient seulement écartées de la somme — il suffit de re-sommer.
// v8 (05/08) : le spend des campagnes NIRA sortait du calcul (CA non mesurable).
// v15 (16/08) : frais Shopify RÉELS du 04→13/06 (juneRealFees.ts) — ces 10
// jours restaient au repli 3 % (hors fenêtre 60 j de l'API) alors que le réel
// mesuré est 2,26 % : le forfait surestimait les frais de 142,02 €. Recompute
// seul, aucun appel API : les valeurs sont dans le code, consommées par
// aggregate.ts quand fee_total_cents est NULL.
const REQUIRED_RECOMPUTE_VERSION = "2026-08-16-frais-reels-juin-0413-v15";

const RESYNC_VERSION_KEY = "full_resync_version";
// v12 (14/08) : supplément packing du GILET PRIMAIRE (+3,50 FR x1 / +4,00 €
// par commande sans polo, depuis le 02/08) — litige fournisseur levé, son
// explication vérifiée dans les factures. Le COGS étant figé par commande,
// re-téléchargement requis pour appliquer aux commandes gilet depuis le 02/08.
// v11 (14/08) : grilles COGS RÉELLES tirées des factures Panda 01+14/08
// (1 187 lignes comparées au centime) — Canada x1/x2/x4 datés au 02/08,
// Suisse, caleçon Canada 2,46 €, grille Long Sleeve. Le COGS étant FIGÉ par
// commande à la synchro, seul un re-téléchargement recalcule l'historique
// (limite 60 j de l'API : les commandes plus anciennes gardent l'estimation).
// GILET volontairement PAS touché : la hausse (+3,50/4,00 €) de la facture
// du 14/08 est CONTESTÉE par Badr auprès du fournisseur — la grille suit le
// devis convenu tant que le litige n'est pas tranché.
// v8 : le CALEÇON n'a JAMAIS été présent dans products_map (ni FR ni ES) —
// découvert le 05/08 via l'avertissement « produit non mappé » d'un vrai
// passage de synchro. Conséquence : son COGS était compté 0 € sur TOUT
// l'historique (produit très souvent offert en bonus, donc présent dans une
// grosse part des commandes) → cogs_upsells_cents sous-évalué et Net
// légèrement SURESTIMÉ depuis le 04/06. Le mapping est désormais chargé
// (FR + ES), mais cogs_upsells_cents est figé par commande au moment de la
// synchro : il faut re-scanner tout l'historique pour l'appliquer.
// Couvre aussi le rebranding « rues parisiennes » du 05/08 (Le Polo Marceau,
// Le Gilet Sully, La Chemise Turenne, Le Pantalon Rivoli, Le Short Cassini) :
// les commandes passées avant le chargement du mapping étaient sorties du
// comptage produit.
// v7 : taxe UE forfait 3€/colis (ex-3€/produit distinct + exemption
// caleçon, toutes deux abandonnées le 04/08 — voir engine.ts §4.4) ET
// caleçon grille par pays (ex-forfait 2€/pièce). tax_eu_cents ET
// cogs_upsells_cents sont stockés par commande au moment de la synchro :
// tout l'historique EU (surtout les commandes multi-produits, sur-taxées
// par l'ancienne règle) doit être re-scanné. Le re-scan tourne en étapes
// après la synchro rapide (jamais bloquant).
// v9 (06/08) : frais Shopify RÉELS lus par commande (migration 0013) au lieu
// du forfait 3 % du CA — mesuré 6,54 % en vrai sur le store FR, soit ~4 000 €
// par mois de bénéfice qui n'existait pas. fee_total_cents est figé par
// commande au moment de la synchro : seul un re-scan complet l'applique à
// l'historique. Tant qu'une commande n'est pas re-scannée elle garde le repli
// 3 % (comportement d'avant), donc la bascule est progressive et jamais fausse.
// v10 (08/08) : ORDERS_SINCE_DAY passe du 04/06 au 21/05 (« l'ecom a démarré
// à partir du 21 mai », Badr) — va chercher les commandes Shopify du
// 21/05 au 03/06 qui n'avaient jamais été téléchargées.
const REQUIRED_FULL_RESYNC_VERSION = "2026-08-14-gilet-primaire-packing-v12";

const META_RESYNC_VERSION_KEY = "meta_resync_version";
// v7 : onglet Créas — hold rate vidéo 50/75/100 % (migration 0011).
// v8 (08/08) : META_SINCE_DAY passe du 04/06 au 21/05 (Badr : « n'oublie pas
// aussi le spend meta... en face » du rattrapage commandes) — va chercher le
// spend Meta du 21/05 au 03/06 jamais téléchargé.
const REQUIRED_META_RESYNC_VERSION = "2026-08-08-spend-21-mai-v8";

const FEES_BACKFILL_VERSION_KEY = "fees_backfill_version";
// v1 (12/08, Badr : « je veux voir dans l'onglet Mois les VRAIES valeurs de
// frais ») : les frais réels n'avaient JAMAIS été relus sur l'historique —
// fetchOrderFees ne tournait que sur J-2→J, donc tout jour antérieur à début
// août restait au repli 3 % + 1 % dans l'onglet Mois. Cette étape relit les
// frais par commande sur tout l'historique accessible (fenêtre 60 j de l'API
// sans le scope read_all_orders — les plus anciennes gardent le repli,
// signalé en warning), UN store par appel, puis recalcule les agrégats.
const REQUIRED_FEES_BACKFILL_VERSION = "2026-08-12-frais-reels-historique-v1";

const RESYNC_LOCK_KEY = "full_resync_in_progress_at";
const RESYNC_LOCK_TTL_MS = 10 * 60 * 1000; // > maxDuration (300s) du backfill
// (l'ancien marqueur d'étape "full_resync_stage" n'est plus utilisé : chaque
// type de rattrapage porte désormais son propre marqueur de version.)

/**
 * Version throttlée pour un déclenchement automatique depuis le navigateur
 * (§ « zéro clic » — aucune action de Badr ne doit être requise). Si une
 * synchro a tourné il y a moins de 5 min, ne refait rien (protège Shopify/
 * Meta d'un martèlement si plusieurs visites arrivent en même temps) — sauf
 * si un recalcul complet est requis (voir REQUIRED_FULL_RESYNC_VERSION),
 * auquel cas le throttle est ignoré pour ne pas retarder la correction.
 */
export async function runThrottledIncrementalSync(force = false): Promise<IncrementalSyncResult> {
  const supabase = createSupabaseServerClient();

  const [
    { data: marker },
    { data: ordersMarker },
    { data: metaMarker },
    { data: recomputeMarker },
    { data: feesMarker },
  ] = await Promise.all([
    supabase.from("app_state").select("updated_at, value").eq("key", THROTTLE_KEY).maybeSingle(),
    supabase.from("app_state").select("value").eq("key", RESYNC_VERSION_KEY).maybeSingle(),
    supabase.from("app_state").select("value").eq("key", META_RESYNC_VERSION_KEY).maybeSingle(),
    supabase.from("app_state").select("value").eq("key", RECOMPUTE_VERSION_KEY).maybeSingle(),
    supabase.from("app_state").select("value").eq("key", FEES_BACKFILL_VERSION_KEY).maybeSingle(),
  ]);
  const needsOrdersResync = ordersMarker?.value !== REQUIRED_FULL_RESYNC_VERSION;
  const needsMetaResync = metaMarker?.value !== REQUIRED_META_RESYNC_VERSION;
  const needsRecompute = recomputeMarker?.value !== REQUIRED_RECOMPUTE_VERSION;
  const needsFeesBackfill = feesMarker?.value !== REQUIRED_FEES_BACKFILL_VERSION;
  const needsMaintenance = needsOrdersResync || needsMetaResync || needsRecompute || needsFeesBackfill;

  if (
    !needsMaintenance &&
    marker?.value === "done" &&
    Date.now() - new Date(marker.updated_at as string).getTime() < (force ? FORCE_THROTTLE_MS : THROTTLE_MS)
  ) {
    return { ran: false };
  }

  const { data: productsMap } = await supabase.from("products_map").select("*");
  if (!productsMap || productsMap.length === 0) return { ran: false };

  // 1) TOUJOURS la synchro rapide (7 jours) EN PREMIER, quel que soit l'état
  //    des rattrapages historiques. C'est elle qui fait vivre le jour en
  //    cours ; la faire attendre la fin d'un backfill de deux mois gelait le
  //    dashboard pendant des heures (26/07). Ses écritures sont validées
  //    avant qu'un éventuel rattrapage ne risque de dépasser le temps limite.
  const result = await runIncrementalSync(supabase, productsMap as ProductMapEntry[]);

  // Le marqueur n'est posé ("done") qu'APRÈS un cycle réussi — sinon un
  // échec en cours de route bloquerait toute nouvelle tentative pendant
  // 5 min alors que rien n'a été écrit (constaté le 16/07 : CA resté figé
  // malgré 97 nouvelles commandes).
  await supabase
    .from("app_state")
    .upsert({ key: THROTTLE_KEY, value: "done", updated_at: new Date().toISOString() });

  if (!needsMaintenance) return result;

  // 2) UNE seule étape de rattrapage par appel, de la moins chère à la plus
  //    chère. Verrou anti-doublon : si Badr recharge la page pendant un
  //    backfill, on n'en relance pas un deuxième par-dessus.
  const { data: lock } = await supabase
    .from("app_state")
    .select("updated_at")
    .eq("key", RESYNC_LOCK_KEY)
    .maybeSingle();
  if (lock && Date.now() - new Date(lock.updated_at as string).getTime() < RESYNC_LOCK_TTL_MS) {
    return { ...result, moreWork: true };
  }
  await supabase
    .from("app_state")
    .upsert({ key: RESYNC_LOCK_KEY, value: "running", updated_at: new Date().toISOString() });

  const warnings = [...(result.warnings ?? [])];
  const { listParisDays } = await import("./time");
  const { HISTORY_START } = await import("./data");
  const allDays = listParisDays(HISTORY_START, todayParisDay());
  let feesBackfillStillRunning = false;

  try {
    if (needsRecompute) {
      // Le moins cher : aucun appel API, on relit la base et on réécrit les
      // agrégats (ex. répartition COGS polo/upsells ajoutée après coup).
      await recomputeDailyAggregatesForDays(supabase, allDays);
      await supabase.from("app_state").upsert({
        key: RECOMPUTE_VERSION_KEY,
        value: REQUIRED_RECOMPUTE_VERSION,
        updated_at: new Date().toISOString(),
      });
    } else if (needsMetaResync) {
      const { backfillMetaSpend } = await import("./backfillRun");
      await backfillMetaSpend(supabase);
      const { detectCampaignEvents } = await import("./journal");
      await detectCampaignEvents(supabase);
      await recomputeDailyAggregatesForDays(supabase, allDays);
      await supabase.from("app_state").upsert({
        key: META_RESYNC_VERSION_KEY,
        value: REQUIRED_META_RESYNC_VERSION,
        updated_at: new Date().toISOString(),
      });
    } else if (needsOrdersResync) {
      // Le plus lourd, et le plus rare : re-téléchargement de l'historique
      // Shopify complet.
      const { backfillOrders } = await import("./backfillRun");
      const res = await backfillOrders(supabase, productsMap as ProductMapEntry[]);
      warnings.push(...res.warnings);
      await recomputeDailyAggregatesForDays(supabase, allDays);
      await supabase.from("app_state").upsert({
        key: RESYNC_VERSION_KEY,
        value: REQUIRED_FULL_RESYNC_VERSION,
        updated_at: new Date().toISOString(),
      });
    } else {
      // Frais Shopify réels sur l'historique — UN store par appel (le client
      // rappelle /api/sync tant que moreWork=true). EN DERNIER dans la
      // chaîne : après un re-téléchargement de commandes, le scan couvre
      // aussi les lignes fraîchement écrites.
      const { backfillOrderFeesOneStore, FEES_BACKFILL_PROGRESS_KEY } = await import("./backfillRun");
      const res = await backfillOrderFeesOneStore(supabase);
      warnings.push(...res.warnings);
      if (res.done) {
        await recomputeDailyAggregatesForDays(supabase, allDays);
        await supabase.from("app_state").upsert({
          key: FEES_BACKFILL_VERSION_KEY,
          value: REQUIRED_FEES_BACKFILL_VERSION,
          updated_at: new Date().toISOString(),
        });
        // Progression nettoyée : un futur v2 repartira de zéro proprement.
        await supabase.from("app_state").delete().eq("key", FEES_BACKFILL_PROGRESS_KEY);
      } else {
        feesBackfillStillRunning = true;
      }
    }
  } catch (err) {
    warnings.push(`Rattrapage historique interrompu : ${(err as Error).message}`);
  } finally {
    // Libère le verrou tout de suite : l'étape suivante peut démarrer au
    // prochain appel sans attendre l'expiration des 10 min.
    await supabase
      .from("app_state")
      .upsert({ key: RESYNC_LOCK_KEY, value: "released", updated_at: new Date(0).toISOString() });
  }

  // Reste-t-il du travail après cette étape ? (une seule étape tourne par
  // appel : s'il restait plus d'une étape en attente, ou si le rattrapage
  // des frais n'a pas fini tous ses stores, le client doit rappeler.)
  const pendingBefore = [needsRecompute, needsMetaResync, needsOrdersResync, needsFeesBackfill].filter(
    Boolean
  ).length;
  const stillPending = pendingBefore > 1 || feesBackfillStillRunning;
  return { ...result, warnings, moreWork: stillPending };
}
