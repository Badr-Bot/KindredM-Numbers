import type { SupabaseClient } from "@supabase/supabase-js";
import { isExcludedCampaign } from "./meta";

// ---------------------------------------------------------------------------
// RAPPORT ROAS PAR CAMPAGNE (12/08) — remplace le recalcul à la main de la
// routine Slack de 23h05.
//
// POURQUOI CE FICHIER EXISTE (Badr, 12/08 : « le rapport ROAS sur Slack le
// fait merdiquement, c'est pas les bonnes valeurs sur Meta ») :
// jusqu'ici la routine n'avait AUCUN code dédié — à chaque déclenchement elle
// réinterrogeait Meta et Shopify puis refaisait les calculs de tête. Deux
// conséquences inévitables :
//   1. les chiffres variaient d'un run à l'autre (rien n'était reproductible) ;
//   2. surtout, le ROAS affiché était celui de META, qui SOUS-ESTIME
//      FORTEMENT le jour même à cause du délai d'attribution (fait déjà
//      vérifié et noté dans MEMO.md : ça se corrige tout seul en 24-72 h).
//      Un rapport de fin de journée basé là-dessus annonce donc des campagnes
//      bien pires qu'elles ne sont — et pousse à couper à tort.
//
// LA BONNE MESURE, déjà tranchée par Badr : ROAS réel = CA Shopify attribué
// à la campagne ÷ spend de la campagne. L'attribution passe par l'UTM
// (`utm_campaign` = ID de campagne Meta), lu dans `landing_site` que la
// synchro stocke déjà pour chaque commande (migration 0008) — donc calculable
// EN BASE, sans rappeler Shopify commande par commande.
//
// Ce module ne fait AUCUN appel réseau : il lit la base et calcule. La partie
// calcul est une fonction pure (`computeRoasReport`), testée sur fixtures.
// ---------------------------------------------------------------------------

/** Longueur à laquelle la synchro tronque `landing_site` (migration 0008). */
const LANDING_SITE_STORED_LENGTH = 300;

/**
 * Extrait l'ID de campagne Meta de l'URL d'atterrissage.
 *
 * `landing_site` ressemble à `/?utm_source=facebook&utm_campaign=1203...&...`.
 * Il est STOCKÉ TRONQUÉ à 300 caractères : sur une URL très longue, le
 * paramètre peut être coupé. On renvoie alors `null` (non attribué) plutôt
 * qu'un ID partiel — un faux rattachement fausserait deux campagnes à la fois.
 */
export function parseUtmCampaign(landingSite: string | null | undefined): string | null {
  if (!landingSite) return null;
  const q = landingSite.indexOf("?");
  if (q === -1) return null;
  const query = landingSite.slice(q + 1);
  for (const part of query.split("&")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    if (part.slice(0, eq) !== "utm_campaign") continue;
    const raw = part.slice(eq + 1);
    if (!raw) return null;
    // Valeur possiblement coupée par la troncature : si le paramètre touche
    // la fin de la chaîne stockée ET qu'on est pile à la limite, on ne peut
    // pas savoir s'il était complet → non attribué.
    const endsAtLimit =
      landingSite.length >= LANDING_SITE_STORED_LENGTH &&
      q + 1 + query.indexOf(part) + part.length >= landingSite.length;
    if (endsAtLimit) return null;
    try {
      return decodeURIComponent(raw.replace(/\+/g, " ")).trim() || null;
    } catch {
      return raw.trim() || null;
    }
  }
  return null;
}

export interface ReportOrderRow {
  total_cents: number;
  refunded_cents: number;
  landing_site: string | null;
}
export interface ReportSpendRow {
  campaign_id: string;
  campaign_name: string | null;
  market: string;
  spend_cents: number;
}
/** Valeur d'achat telle que META l'attribue — comparaison seulement. */
export interface ReportInsightRow {
  campaign_id: string;
  purchase_value_cents: number | null;
  purchases: number | null;
}

export interface CampaignRoas {
  campaignId: string;
  campaignName: string;
  market: string;
  spendCents: number;
  /** CA Shopify réel attribué par UTM (la mesure qui fait foi). */
  caShopifyCents: number;
  ordersAttributed: number;
  /** CA tel que Meta l'attribue — sous-estimé le jour même. */
  caMetaCents: number;
  /** ROAS attribué par UTM Shopify : CA de la campagne ÷ son spend. */
  roasShopify: number | null;
  /** CA Meta ÷ spend. null si spend = 0. */
  roasMeta: number | null;
}

export interface RoasReport {
  day: string;
  campaigns: CampaignRoas[];
  totals: {
    spendCents: number;
    /** CA Shopify du jour, TOUTES commandes (attribuées ou non). */
    caTotalCents: number;
    caAttributedCents: number;
    /** CA sans UTM de campagne : organique, direct, e-mail… */
    caUnattributedCents: number;
    ordersTotal: number;
    mer: number | null;
    caMetaCents: number;
    roasMetaGlobal: number | null;
  };
  warnings: string[];
}

function ratio(numCents: number, denomCents: number): number | null {
  return denomCents > 0 ? numCents / denomCents : null;
}

/**
 * Calcul pur — aucune I/O, donc testable au centime.
 *
 * Règles :
 *  • Le CA d'une commande est net de ses remboursements (même définition que
 *    `daily_aggregates`, sinon le ROAS du rapport ne collerait pas au net).
 *  • Les exclusions passent par `isExcludedCampaign` (meta.ts), source unique
 *    partagée avec le net et l'onglet Analyse — jamais une liste recopiée ici,
 *    qui divergerait. Elle est VIDE aujourd'hui (NIRA réintégré le 06/08 à la
 *    demande de Badr), donc rien n'est filtré ; le point de branchement reste
 *    en place pour le jour où elle est de nouveau remplie.
 *  • Le spend fait foi pour lister les campagnes : une campagne qui a dépensé
 *    sans vendre DOIT apparaître (ROAS 0), c'est le cas le plus important à
 *    voir dans un rapport de fin de journée.
 */
export function computeRoasReport(input: {
  day: string;
  orders: ReportOrderRow[];
  spend: ReportSpendRow[];
  insights: ReportInsightRow[];
}): RoasReport {
  const { day, orders, spend, insights } = input;
  const warnings: string[] = [];

  const caByCampaign = new Map<string, { cents: number; orders: number }>();
  let caTotalCents = 0;
  let caUnattributedCents = 0;
  let ordersWithoutLanding = 0;

  for (const o of orders) {
    const net = o.total_cents - o.refunded_cents;
    caTotalCents += net;
    const campaignId = parseUtmCampaign(o.landing_site);
    if (!campaignId) {
      caUnattributedCents += net;
      if (!o.landing_site) ordersWithoutLanding += 1;
      continue;
    }
    const cur = caByCampaign.get(campaignId) ?? { cents: 0, orders: 0 };
    cur.cents += net;
    cur.orders += 1;
    caByCampaign.set(campaignId, cur);
  }

  const metaByCampaign = new Map<string, number>();
  for (const i of insights) {
    metaByCampaign.set(i.campaign_id, (metaByCampaign.get(i.campaign_id) ?? 0) + (i.purchase_value_cents ?? 0));
  }

  // Spend agrégé par campagne (une campagne peut avoir plusieurs lignes).
  const spendByCampaign = new Map<string, ReportSpendRow>();
  for (const s of spend) {
    if (isExcludedCampaign(s.campaign_name)) continue;
    const cur = spendByCampaign.get(s.campaign_id);
    if (cur) cur.spend_cents += s.spend_cents;
    else spendByCampaign.set(s.campaign_id, { ...s });
  }

  const campaigns: CampaignRoas[] = [...spendByCampaign.values()]
    .map((s) => {
      const ca = caByCampaign.get(s.campaign_id) ?? { cents: 0, orders: 0 };
      const caMetaCents = metaByCampaign.get(s.campaign_id) ?? 0;
      return {
        campaignId: s.campaign_id,
        campaignName: s.campaign_name ?? s.campaign_id,
        market: s.market,
        spendCents: s.spend_cents,
        caShopifyCents: ca.cents,
        ordersAttributed: ca.orders,
        caMetaCents,
        roasShopify: ratio(ca.cents, s.spend_cents),
        roasMeta: ratio(caMetaCents, s.spend_cents),
      };
    })
    .sort((a, b) => b.spendCents - a.spendCents);

  // CA rattaché à un UTM qui ne correspond à aucune campagne ayant dépensé
  // ce jour-là (campagne stoppée la veille, clic d'hier converti aujourd'hui).
  // Compté dans le total mais pas dans une ligne campagne : on le dit.
  const attributedToKnown = campaigns.reduce((t, c) => t + c.caShopifyCents, 0);
  const caAttributedCents = [...caByCampaign.values()].reduce((t, c) => t + c.cents, 0);
  const orphan = caAttributedCents - attributedToKnown;
  if (orphan > 0) {
    warnings.push(
      `${(orphan / 100).toFixed(2)} € rattachés à une campagne sans spend le ${day} (clic antérieur converti aujourd'hui, ou campagne arrêtée) — comptés dans le total, pas dans une ligne.`
    );
  }
  if (ordersWithoutLanding > 0) {
    warnings.push(
      `${ordersWithoutLanding} commande(s) sans landing_site : attribution impossible, comptées en non attribué.`
    );
  }
  const spendTotal = campaigns.reduce((t, c) => t + c.spendCents, 0);
  const caMetaTotal = campaigns.reduce((t, c) => t + c.caMetaCents, 0);
  if (spendTotal > 0 && caMetaTotal > 0 && attributedToKnown > caMetaTotal * 1.15) {
    warnings.push(
      "Meta attribue nettement moins que Shopify — normal en fin de journée (délai d'attribution, se corrige en 24-72 h). Piloter au ROAS réel, jamais au ROAS Meta du jour même."
    );
  }

  return {
    day,
    campaigns,
    totals: {
      spendCents: spendTotal,
      caTotalCents,
      caAttributedCents,
      caUnattributedCents,
      ordersTotal: orders.length,
      mer: ratio(caTotalCents, spendTotal),
      caMetaCents: caMetaTotal,
      roasMetaGlobal: ratio(caMetaTotal, spendTotal),
    },
    warnings,
  };
}

const eur = (c: number) => `${(c / 100).toFixed(2)} €`;
const x = (r: number | null) => (r === null ? "—" : `${r.toFixed(2)}×`);

/**
 * Message prêt à poster sur Slack. Le ROAS RÉEL est la colonne principale ;
 * le ROAS Meta est affiché à côté, explicitement étiqueté comme sous-estimé,
 * pour que l'écart se voie au lieu d'être pris pour la vérité.
 */
export function formatRoasReportForSlack(r: RoasReport): string {
  const lines: string[] = [];
  lines.push(`*Rapport perf — ${r.day}*`);
  lines.push(
    `CA ${eur(r.totals.caTotalCents)} · spend ${eur(r.totals.spendCents)} · *MER ${x(r.totals.mer)}* · ROAS Meta ${x(r.totals.roasMetaGlobal)}`
  );
  lines.push("_MER = CA total ÷ spend (inclut organique/direct) · ROAS = CA attribué à la pub ÷ spend_");
  lines.push(
    `${r.totals.ordersTotal} commandes · attribué ${eur(r.totals.caAttributedCents)} · non attribué ${eur(r.totals.caUnattributedCents)} (organique/direct)`
  );
  lines.push("");
  if (r.campaigns.length === 0) {
    lines.push("_Aucune campagne avec du spend ce jour-là._");
  } else {
    lines.push("*Par campagne* — ROAS Meta (attribution Meta) · ROAS UTM (ventes Shopify tracées)");
    for (const c of r.campaigns) {
      lines.push(
        `• ${c.campaignName} — spend ${eur(c.spendCents)} · *ROAS Meta ${x(c.roasMeta)}* · ROAS UTM ${x(c.roasShopify)} (${eur(c.caShopifyCents)}, ${c.ordersAttributed} cmd)`
      );
    }
  }
  if (r.warnings.length > 0) {
    lines.push("");
    lines.push("⚠️ " + r.warnings.join("\n⚠️ "));
  }
  return lines.join("\n");
}

/** Charge les données du jour et produit le rapport. Aucun appel Meta/Shopify. */
export async function buildRoasReport(supabase: SupabaseClient, day: string): Promise<RoasReport> {
  const [ordersRes, spendRes, insightsRes] = await Promise.all([
    supabase.from("orders").select("total_cents, refunded_cents, landing_site").eq("day", day),
    supabase.from("meta_spend").select("campaign_id, campaign_name, market, spend_cents").eq("day", day),
    supabase.from("meta_insights").select("campaign_id, purchase_value_cents, purchases").eq("day", day),
  ]);
  if (ordersRes.error) throw new Error(`commandes du ${day} : ${ordersRes.error.message}`);
  if (spendRes.error) throw new Error(`spend du ${day} : ${spendRes.error.message}`);

  const report = computeRoasReport({
    day,
    orders: (ordersRes.data ?? []) as ReportOrderRow[],
    spend: (spendRes.data ?? []) as ReportSpendRow[],
    // meta_insights vient d'une migration ultérieure : son absence ne doit pas
    // faire échouer le rapport, elle prive juste de la colonne comparative.
    insights: insightsRes.error ? [] : ((insightsRes.data ?? []) as ReportInsightRow[]),
  });
  if (insightsRes.error) {
    report.warnings.push("Table meta_insights indisponible : colonne « ROAS Meta » vide (comparatif seulement).");
  }
  return report;
}
