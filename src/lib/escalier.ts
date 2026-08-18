import type { SupabaseClient } from "@supabase/supabase-js";
import { isExcludedCampaign } from "./meta";
import { addDaysToDay } from "./time";

// ---------------------------------------------------------------------------
// 🪜 Escalier — protocole de prise de décision de la formation Master
// (MASTER ACQUISITION, leçon 35 « Le protocole de prise de décision »,
// transcription complète dans formation-master/ sur la branche formation).
//
// Phase de PRÉ-SCALING (budgets < 3 000 €/j — le cas de toutes les campagnes
// actuelles). Une seule question, posée chaque nuit entre minuit et une heure
// (T35 [19:09]), par campagne :
//   « est-on rentable AU BACKEND sur les 2 derniers jours, ≥ 15 % de marge ? »
//   (T35 [03:22-03:44] : « rentable dans votre poche : ads − shipping − frais
//    de processeur », donc marge de contribution APRÈS pub, hors OPEX)
//
//  • OUI → on monte le budget : palier suivant de l'échelle 500 → 750 → 1000
//    → 1500 → 1800 → 2000 → 3000, jusqu'à ×2 si tout est parfait (T35 [05:18]
//    « fois 2 si petit, +30 % si près des 3000 » ; T24 [17:36], prioritaire :
//    « moi je double le budget. Et si le lendemain c'est encore bien, je
//    double »). Le compteur de NON repart à zéro. Créas neuves à chaque montée.
//  • NON n°1 → on attend 24 h sans toucher au budget (T35 [03:44-04:08]).
//  • NON n°2 et n°3 → on réduit (10-15 %, T35 [19:09] « des fois juste
//    descendre de 10-15 % ça suffit ») + on ajoute des créatives à chaque fois.
//  • NON n°4 → phase de SAUVETAGE (T35 [04:29]) : on ne rabote plus, on
//    diagnostique où ça fuit (cadran T35 [06:47-09:36] / T34 [03:47]) :
//      - CVR ok mais CPC mauvais  → problème CRÉAS (hooks, angles, mécanismes)
//      - CPC ok mais CVR mauvais  → problème FUNNEL (above the fold, Clarity)
//      - CPC et CVR corrects mais marge faible → problème AOV (upsell, bundle)
//      - tout mauvais → big swing (nouvelle LP / offre) voire couper
//  • Plancher absolu : 100 €/j (T35 [04:57] « garder minimum 100 € »,
//    « 75 vraiment max des max »).
//
// Au-delà de 3 000 €/j on change de régime (phase de SCALING : barème
// quotidien à la marge T35 [15:03], condition « 3 derniers jours + hier
// rentables » [12:50], attribution click ≥ 70 % [13:11]). Aucune campagne n'y est : l'onglet le SIGNALE au lieu d'appliquer
// silencieusement le mauvais régime (règle ARBITRAGES §4 : pas de mélange).
//
// Ce module RECOMMANDE, il n'exécute jamais (même règle que la skill
// verdict-scaling : aucun appel d'écriture Meta, Badr décide et applique).
//
// ⚠️ Le jour EN COURS est toujours exclu : consulter l'onglet à 15 h donne le
// même verdict qu'à minuit — le chiffre ne bouge pas dans la journée.
//
// Marge de fenêtre = CM − 1/ROAS (ROAS Meta = purchase_value ÷ spend). C'est
// un PLAFOND : l'attribution Meta se remplit en 24-72 h. À confronter au
// ROAS UTM de /api/roas-report avant un mouvement lourd.
// ---------------------------------------------------------------------------

export type EscalierProduct = "GILET" | "POLO";

/** Mêmes conventions de nom que analytics.ts : Gilet = « LANCASTER » dans le
 * nom, produits en test = « NIRA »/« PRODTEST » (hors protocole, pas de
 * seuils produit), tout le reste = Polo. */
const GILET_KEYWORD = "LANCASTER";
const TESTING_KEYWORDS = ["NIRA", "PRODTEST"];

export function classifyCampaignProduct(name: string): EscalierProduct | "TESTING" {
  const n = name.toUpperCase();
  if (TESTING_KEYWORDS.some((k) => n.includes(k))) return "TESTING";
  if (n.includes(GILET_KEYWORD)) return "GILET";
  return "POLO";
}

// Échelle de montée du pré-scaling (€/j, en cents) — T35 [05:18] : « monter le
// budget de 500. 750, 1000 à 1500, 1800, 2000, 3000 ». Seule source
// vérifiable du corpus (le schéma Whimsical de la leçon, non archivé,
// donnerait peut-être 1850/2250 — à réaligner si Badr l'archive un jour).
// Au-delà du dernier palier : +30 % (« plus 30 % si vous êtes près des 3000 »).
export const MONTEE_PALIERS_CENTS = [50000, 75000, 100000, 150000, 180000, 200000, 300000];
export const PLANCHER_BUDGET_CENTS = 10000;
/** Seuil du régime SCALING (T35 [06:02] « dès que les 3K/jour sont atteints »). */
export const SEUIL_SCALING_CENTS = 300000;
/** Bande de réduction des crans 2 et 3 : −10 % à −15 % (T35 [19:09]) —
 * défaut −15 % (T24 [16:54], prioritaire : « désescaler de 15 % après 2 jours
 * consécutifs » ; suggestedMinCents porte donc la valeur par défaut). */
export const REDUCTION_MIN = 0.10;
export const REDUCTION_MAX = 0.15;
/** Marge nette qui fait basculer OUI/NON (T35 [03:44] « 15 % de marge minimum »). */
export const SEUIL_OUI = 0.15;
/** Sous ~15 conversions sur la fenêtre le verdict est un ajustement, pas un
 * jugement sur le produit (réserve d'échantillon — cf. Lancaster à 8 conv). */
export const MIN_CONVERSIONS_FIABLES = 15;
/** Nombre de fenêtres affichées. */
export const NB_FENETRES = 6;

export interface EscalierDailyRow {
  day: string; // YYYY-MM-DD (Europe/Paris)
  campaignId: string;
  campaignName: string | null;
  spendCents: number;
  purchases: number;
  purchaseValueCents: number;
  impressions: number;
  clicks: number;
  reach: number;
}

export interface ProductThresholdsInput {
  cm: number | null;
  breakEven: number | null;
  target: number | null;
}

export interface CampaignLiveInput {
  name?: string | null;
  active: boolean;
  dailyBudgetCents: number | null;
  /** updated_time Meta — PROXY du dernier changement de budget (il marque
   * n'importe quelle modification de la campagne, on l'affiche comme tel). */
  updatedTime: string | null;
}

export type WindowZone = "over" | "under" | "below" | "nodata";

export interface EscalierWindow {
  /** ex. « 16+17 » */
  label: string;
  startDay: string;
  endDay: string;
  spendCents: number;
  valueCents: number;
  purchases: number;
  clicks: number;
  roas: number | null; // null si spend = 0
  /** CM − 1/ROAS. null si spend = 0 ou ventes = 0. Une campagne qui dépense
   * sans vendre APPARAÎT quand même (zone below), jamais masquée. */
  margin: number | null;
  zone: WindowZone;
  /** OUI (≥ 15 %) / NON. null si la fenêtre n'a pas de spend. */
  verdict: "OUI" | "NON" | null;
  /** CPMr = CPM × fréquence — l'indicateur de saturation créative. */
  cpmr: number | null;
  /** CPC (cents) et CVR (achats/clics) — le cadran de la phase de sauvetage. */
  cpcCents: number | null;
  cvr: number | null;
}

export type EscalierAction = "MONTER" | "ATTENDRE" | "REDUIRE" | "SAUVETAGE";

export interface EscalierCampaign {
  campaignId: string;
  campaignName: string;
  product: EscalierProduct;
  active: boolean;
  windows: EscalierWindow[];
  /** NON consécutifs (fenêtres avec spend) en fin de série. 0 = dernier OUI. */
  nonStreak: number;
  /** Cran courant de l'escalier (1-4). null = la dernière fenêtre est un OUI. */
  cran: 1 | 2 | 3 | 4 | null;
  action: EscalierAction;
  /** Budget €/j : override app_state > daily_budget Meta > estimation spend. */
  budgetCents: number | null;
  budgetEstimated: boolean;
  /** Mouvement chiffré : MONTER → palier cible ; REDUIRE → bande basse/haute. */
  suggestedMinCents: number | null;
  suggestedMaxCents: number | null;
  lastChange: string | null;
  /** Conversions de la dernière fenêtre — réserve d'échantillon sous 15. */
  lowSample: boolean;
  /** CPMr dernière fenêtre > +20 % vs médiane des précédentes : l'audience
   * sature — la réponse de la formation est CRÉAS, jamais du budget. */
  cpmrRising: boolean;
  /** Créas neuves obligatoires (toute montée et toute réduction, T35). */
  creasRequired: boolean;
  /** Verdicts qui alternent OUI/NON sur les 4 dernières fenêtres : T24
   * [16:32] (prioritaire) recommande alors de juger sur 3 jours avant d'agir. */
  unstable: boolean;
  /** Diagnostic de sauvetage (cadran CPC × CVR) — rempli si action=SAUVETAGE. */
  sauvetageDiagnostic: string | null;
  /** true si le budget ≥ 3 000 €/j : autre régime (barème à la marge). */
  scalingRegime: boolean;
  why: string;
}

export interface EscalierReport {
  endDay: string; // dernier jour CLOS pris en compte
  windowLabels: string[];
  thresholds: Record<EscalierProduct, ProductThresholdsInput | null>;
  campaigns: EscalierCampaign[];
  /** Décisions récentes du journal (types budget/campagne) — la mémoire de ce
   * qui a réellement été appliqué sur Meta, nuit après nuit. */
  recentDecisions: { id: number; day: string; type: string; note: string }[];
  warnings: string[];
}

function windowLabel(startDay: string, endDay: string): string {
  const d1 = Number(startDay.slice(8, 10));
  const d2 = Number(endDay.slice(8, 10));
  if (startDay.slice(5, 7) !== endDay.slice(5, 7)) {
    // chevauchement de mois : « 31/08+01/09 » plutôt qu'un « 31+1 » ambigu
    return `${String(d1).padStart(2, "0")}/${startDay.slice(5, 7)}+${String(d2).padStart(2, "0")}/${endDay.slice(5, 7)}`;
  }
  return `${d1}+${d2}`;
}

function zoneFor(margin: number | null, roas: number | null, breakEven: number | null): WindowZone {
  if (roas === null) return "nodata";
  if (roas === 0) return "below"; // dépense sans vente : perte, jamais masquée
  if (margin !== null && margin >= SEUIL_OUI) return "over";
  if (breakEven !== null) return roas >= breakEven ? "under" : "below";
  // Seuils produit incalculables (cm null) : PAS de verdict — surtout pas un
  // faux NON qui fabriquerait un SAUVETAGE (bug relevé en review).
  return "nodata";
}

/** Prochain palier de l'échelle strictement au-dessus du budget courant.
 * Au-delà du dernier palier : +30 % (T35 [05:18]). */
export function nextPalierCents(budgetCents: number): number {
  for (const p of MONTEE_PALIERS_CENTS) if (p > budgetCents) return p;
  return Math.round(budgetCents * 1.3);
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const s = [...values].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

/** Cadran de la phase de sauvetage (T35 [06:47-09:36]) — CPC et CVR de la
 * dernière fenêtre JUGÉE comparés à l'historique de la campagne elle-même
 * (la formation lit ce cadran à l'œil, sans seuil absolu : on prend ±20 %,
 * paramètre ⚠️ hors formation, assumé comme tel). */
function diagnoseSauvetage(windows: EscalierWindow[], lastIdx: number): string {
  const last = windows[lastIdx];
  if (last.cpcCents === null && last.cvr === null) {
    return "Fenêtre sans clics mesurés : données insuffisantes pour le cadran CPC × CVR — vérifier la diffusion avant de diagnostiquer.";
  }
  const prevCpcs = windows.slice(0, lastIdx).map((w) => w.cpcCents).filter((v): v is number => v !== null);
  const prevCvrs = windows.slice(0, lastIdx).map((w) => w.cvr).filter((v): v is number => v !== null);
  const cpcMed = median(prevCpcs);
  const cvrMed = median(prevCvrs);
  const cpcBad = last.cpcCents !== null && cpcMed !== null && last.cpcCents > cpcMed * 1.2;
  const cvrBad = last.cvr !== null && cvrMed !== null && last.cvr < cvrMed * 0.8;
  if (cpcBad && cvrBad)
    return "CPC en hausse ET CVR en baisse vs l'historique → tout fuit : big swing (nouvelle LP / offre) voire couper si un compétiteur scale toujours (T35).";
  if (cpcBad)
    return "CVR tient mais le CPC dérape vs l'historique → problème CRÉAS : nouveaux hooks, nouveaux angles, nouveaux mécanismes (T35).";
  if (cvrBad)
    return "CPC tient mais le CVR chute vs l'historique → problème FUNNEL : revoir l'above-the-fold, objections, Microsoft Clarity (T35).";
  return "CPC et CVR dans les normes de la campagne mais marge insuffisante → problème AOV : upsells, bundles, e-mails (T35).";
}

export function computeEscalier(input: {
  endDay: string;
  rows: EscalierDailyRow[];
  thresholds: Record<EscalierProduct, ProductThresholdsInput | null>;
  live: Map<string, CampaignLiveInput> | null;
  budgetOverridesCents?: Record<string, number> | null;
  recentDecisions?: { id: number; day: string; type: string; note: string }[];
}): EscalierReport {
  const { endDay, rows, thresholds, live } = input;
  const overrides = input.budgetOverridesCents ?? null;
  const warnings: string[] = [];

  // Fenêtres 2 jours glissantes : la plus récente = (endDay-1, endDay).
  const windows: { startDay: string; endDay: string }[] = [];
  for (let k = NB_FENETRES - 1; k >= 0; k--) {
    const e = addDaysToDay(endDay, -k);
    windows.push({ startDay: addDaysToDay(e, -1), endDay: e });
  }
  const windowLabels = windows.map((w) => windowLabel(w.startDay, w.endDay));

  // Regroupement des lignes journalières par campagne.
  const byCampaign = new Map<string, { name: string; days: Map<string, EscalierDailyRow> }>();
  const testingSeen = new Set<string>();
  for (const r of rows) {
    const name = r.campaignName ?? r.campaignId;
    if (isExcludedCampaign(name)) continue;
    if (classifyCampaignProduct(name) === "TESTING") {
      testingSeen.add(name);
      continue; // produit en test : pas de seuils produit → hors protocole
    }
    let entry = byCampaign.get(r.campaignId);
    if (!entry) {
      entry = { name, days: new Map() };
      byCampaign.set(r.campaignId, entry);
    }
    entry.name = name;
    const prev = entry.days.get(r.day);
    if (prev) {
      // clé primaire (day, campaign_id) en base : un doublon = données à
      // additionner plutôt qu'à écraser silencieusement.
      prev.spendCents += r.spendCents;
      prev.purchases += r.purchases;
      prev.purchaseValueCents += r.purchaseValueCents;
      prev.impressions += r.impressions;
      prev.clicks += r.clicks;
      prev.reach += r.reach;
    } else {
      entry.days.set(r.day, { ...r });
    }
  }
  if (testingSeen.size > 0) {
    warnings.push(
      `Hors protocole (produit en test, pas de seuils) : ${[...testingSeen].sort().join(", ")}.`
    );
  }

  const campaigns: EscalierCampaign[] = [];
  for (const [campaignId, entry] of byCampaign) {
    const product = classifyCampaignProduct(entry.name) as EscalierProduct;
    const th = thresholds[product];
    const cm = th?.cm ?? null;
    const liveInfo = live?.get(campaignId) ?? null;

    // Fenêtres agrégées depuis les lignes journalières (sommes des journaliers
    // Supabase — pas les agrégats natifs Meta ; l'écart éventuel est minime et
    // couvert par la réserve d'attribution affichée).
    const winData: EscalierWindow[] = windows.map((w) => {
      let spend = 0, value = 0, conv = 0, impressions = 0, clicks = 0, reach = 0;
      for (const d of [w.startDay, w.endDay]) {
        const row = entry.days.get(d);
        if (!row) continue;
        spend += row.spendCents;
        value += row.purchaseValueCents;
        conv += row.purchases;
        impressions += row.impressions;
        clicks += row.clicks;
        reach += row.reach;
      }
      const roas = spend > 0 ? value / spend : null;
      // marge = CM − 1/ROAS. ROAS 0 (dépense sans vente) → marge non
      // calculable mais zone "below" : la campagne perd de l'argent.
      const margin = roas !== null && roas > 0 && cm !== null ? cm - 1 / roas : null;
      const zone = zoneFor(margin, roas, th?.breakEven ?? null);
      // Verdict : OUI/NON seulement si on SAIT juger. ROAS 0 = NON (perte
      // réelle) ; cm null = null (seuils incalculables, on ne condamne pas).
      const verdict: "OUI" | "NON" | null =
        roas === null ? null : roas === 0 ? "NON" : cm === null ? null : margin !== null && margin >= SEUIL_OUI ? "OUI" : "NON";
      const cpm = impressions > 0 ? (spend / impressions) * 1000 : null;
      const freq = reach > 0 ? impressions / reach : null;
      return {
        label: windowLabel(w.startDay, w.endDay),
        startDay: w.startDay,
        endDay: w.endDay,
        spendCents: spend,
        valueCents: value,
        purchases: conv,
        clicks,
        roas,
        margin,
        zone,
        verdict,
        cpmr: cpm !== null && freq !== null ? cpm * freq : null,
        cpcCents: clicks > 0 ? spend / clicks : null,
        cvr: clicks > 0 ? conv / clicks : null,
      };
    });

    // Campagne sans aucun spend sur la période : rien à décider.
    if (winData.every((w) => w.roas === null)) continue;
    // Campagne qui dépense mais AUCUN verdict possible (seuils produit
    // incalculables) : on la signale au lieu d'inventer une décision.
    if (winData.every((w) => w.verdict === null)) {
      warnings.push(
        `${entry.name} : seuils ${product} incalculables (pas de commandes ${product} sur 14 j ?) → aucun verdict rendu.`
      );
      continue;
    }

    // Compteur de NON consécutifs en fin de série. Les fenêtres vides en
    // QUEUE sont ignorées (pause toute récente), mais un trou de diffusion au
    // MILIEU casse la série : une campagne relancée après pause repart du
    // cran 1, le protocole ne pose pas la question les nuits sans diffusion.
    let lastIdx = winData.length - 1;
    while (lastIdx >= 0 && winData[lastIdx].verdict === null) lastIdx--;
    let nonStreak = 0;
    for (let i = lastIdx; i >= 0; i--) {
      const v = winData[i].verdict;
      if (v === null) break; // trou de diffusion → la série repart de zéro
      if (v === "NON") nonStreak++;
      else break;
    }

    const last = winData[lastIdx];
    const budgetOverride = overrides?.[campaignId];
    const budgetLive = liveInfo?.dailyBudgetCents ?? null;
    // Estimation faute de mieux : le spend journalier le plus élevé observé.
    const maxDailySpend = Math.max(0, ...[...entry.days.values()].map((d) => d.spendCents));
    const budgetCents = budgetOverride ?? budgetLive ?? (maxDailySpend > 0 ? maxDailySpend : null);
    const budgetEstimated = budgetOverride === undefined && budgetLive === null;
    const scalingRegime = budgetCents !== null && budgetCents >= SEUIL_SCALING_CENTS;

    // Saturation créative : CPMr de la dernière fenêtre JUGÉE vs médiane des
    // fenêtres précédentes renseignées.
    const prevCpmrs = winData.slice(0, lastIdx).map((w) => w.cpmr).filter((v): v is number => v !== null);
    const cpmrMed = median(prevCpmrs);
    const lastCpmr = last.cpmr;
    const cpmrRising = cpmrMed !== null && lastCpmr !== null && lastCpmr > cpmrMed * 1.2;

    const cran: EscalierCampaign["cran"] =
      nonStreak === 0 ? null : (Math.min(nonStreak, 4) as 1 | 2 | 3 | 4);
    const action: EscalierAction =
      nonStreak === 0 ? "MONTER" : nonStreak === 1 ? "ATTENDRE" : nonStreak <= 3 ? "REDUIRE" : "SAUVETAGE";

    let suggestedMin: number | null = null;
    let suggestedMax: number | null = null;
    if (action === "MONTER" && budgetCents !== null) {
      // Fourchette : palier suivant (prudent) → ×2 (« fois 2 si petit », T35
      // [05:18] ; T24 [17:36] double tant que c'est excellent), plafonnée au
      // seuil de scaling — au-delà de 3 000 €/j on change de régime.
      suggestedMin = nextPalierCents(budgetCents);
      suggestedMax = Math.max(suggestedMin, Math.min(budgetCents * 2, SEUIL_SCALING_CENTS));
    } else if (action === "REDUIRE" && budgetCents !== null) {
      suggestedMin = Math.max(PLANCHER_BUDGET_CENTS, Math.round(budgetCents * (1 - REDUCTION_MAX)));
      suggestedMax = Math.max(PLANCHER_BUDGET_CENTS, Math.round(budgetCents * (1 - REDUCTION_MIN)));
    }

    const lowSample = last.purchases < MIN_CONVERSIONS_FIABLES;
    const creasRequired = action === "MONTER" || action === "REDUIRE" || action === "SAUVETAGE";
    // Instabilité (T24 [16:32]) : ≥ 2 bascules OUI↔NON sur les 4 dernières
    // fenêtres renseignées → juger sur 3 jours avant d'exécuter le verdict.
    const recentVerdicts = winData.map((w) => w.verdict).filter((v): v is "OUI" | "NON" => v !== null).slice(-4);
    let flips = 0;
    for (let i = 1; i < recentVerdicts.length; i++) if (recentVerdicts[i] !== recentVerdicts[i - 1]) flips++;
    const unstable = flips >= 2;
    const sauvetageDiagnostic = action === "SAUVETAGE" ? diagnoseSauvetage(winData, lastIdx) : null;

    const marginTxt = last.margin === null ? "marge non calculable" : `marge ${(last.margin * 100).toFixed(1)} %`;
    const why =
      action === "MONTER"
        ? `OUI (${marginTxt} ≥ 15 %) : compteur remis à zéro, montée au palier suivant + créas neuves (T35).`
        : action === "ATTENDRE"
          ? `1er NON (${marginTxt} < 15 %) : cran 1, on attend 24 h sans toucher au budget (T35).`
          : action === "REDUIRE"
            ? `${nonStreak}ᵉ NON consécutif (${marginTxt}) : cran ${nonStreak}, réduction de 10-15 % + créas neuves (T35).`
            : `${nonStreak} NON consécutifs (${marginTxt}) : escalier épuisé → phase de sauvetage, on ne rabote plus, on diagnostique (T35).`;

    if (scalingRegime) {
      warnings.push(
        `${entry.name} : budget ≥ 3 000 €/j → régime SCALING (barème quotidien à la marge, T35 [15:03]) — ` +
          "l'onglet applique le pré-scaling, verdict à confirmer à la main tant que ce régime n'est pas codé."
      );
    }

    campaigns.push({
      campaignId,
      campaignName: entry.name,
      product,
      // Absente du snapshot live alors qu'on l'a : supprimée/archivée côté
      // Meta → inactive. Snapshot indisponible : on ne sait pas → active.
      active: liveInfo ? liveInfo.active : live ? false : true,
      windows: winData,
      nonStreak,
      cran,
      action,
      budgetCents,
      budgetEstimated,
      suggestedMinCents: suggestedMin,
      suggestedMaxCents: suggestedMax,
      lastChange: liveInfo?.updatedTime ?? null,
      lowSample,
      cpmrRising,
      creasRequired,
      unstable,
      sauvetageDiagnostic,
      scalingRegime,
      why,
    });
  }

  // Tri par urgence : sauvetage → réduire → attendre → monter.
  const order: Record<EscalierAction, number> = { SAUVETAGE: 0, REDUIRE: 1, ATTENDRE: 2, MONTER: 3 };
  campaigns.sort(
    (a, b) =>
      order[a.action] - order[b.action] ||
      b.nonStreak - a.nonStreak ||
      a.campaignId.localeCompare(b.campaignId)
  );

  if (!live) {
    warnings.push(
      "Statut/budget live Meta indisponible (token ?) : budgets estimés depuis le spend, campagnes en pause non signalées."
    );
  }
  if (thresholds.GILET === null && thresholds.POLO === null) {
    warnings.push("Seuils produit non calculables (commandes illisibles) : aucun verdict fiable.");
  }

  return {
    endDay,
    windowLabels,
    thresholds,
    campaigns,
    recentDecisions: input.recentDecisions ?? [],
    warnings,
  };
}

// ---------------------------------------------------------------------------
// Lecture des données (Supabase + Meta live) — même approche que
// buildRoasReport : tout le calcul est dans computeEscalier (pur, testé).
// ---------------------------------------------------------------------------

export async function buildEscalierReport(
  supabase: SupabaseClient,
  endDay: string
): Promise<EscalierReport> {
  const startDay = addDaysToDay(endDay, -NB_FENETRES);

  // reach n'existe sur meta_insights que depuis la migration 0007 : on sonde
  // avant de le demander (même filet qu'analytics.ts pour video_p100), sinon
  // une base non migrée ferait échouer TOUTE la requête.
  const { error: reachProbeError } = await supabase.from("meta_insights").select("reach").limit(1);
  const hasReach = !reachProbeError;
  const insightCols =
    "day, campaign_id, campaign_name, spend_cents, purchases, purchase_value_cents, impressions, clicks" +
    (hasReach ? ", reach" : "");

  const MAX_ROWS = 5000; // ~700 campagnes × 7 j — large, mais jamais silencieux
  const [insightsRes, overridesRes, decisionsRes] = await Promise.all([
    supabase
      .from("meta_insights")
      .select(insightCols)
      .gte("day", startDay)
      .lte("day", endDay)
      .order("day", { ascending: true })
      .order("campaign_id", { ascending: true })
      .limit(MAX_ROWS),
    supabase.from("app_state").select("value").eq("key", "campaign_daily_budgets").maybeSingle(),
    // Mémoire des décisions réellement appliquées sur Meta (journal de bord,
    // types budget/campagne) — 14 jours, les plus récentes d'abord.
    supabase
      .from("events")
      .select("id, day, type, note")
      .in("type", ["budget", "campagne"])
      .gte("day", addDaysToDay(endDay, -13))
      .order("day", { ascending: false })
      .order("id", { ascending: false })
      .limit(40),
  ]);
  if (insightsRes.error) throw new Error(insightsRes.error.message);

  const extraWarnings: string[] = [];
  if ((insightsRes.data ?? []).length >= MAX_ROWS) {
    extraWarnings.push(`Lecture meta_insights tronquée à ${MAX_ROWS} lignes — verdicts possiblement incomplets.`);
  }
  if (!hasReach) {
    extraWarnings.push("Colonne reach absente (migration 0007 non exécutée) : CPMr indisponible.");
  }
  if (decisionsRes.error) {
    extraWarnings.push(
      "Journal des décisions illisible (table events / migration 0006 ?) — la mémoire des décisions n'est pas affichée."
    );
  }

  type RawInsightRow = {
    day: string;
    campaign_id: string;
    campaign_name: string | null;
    spend_cents: number | null;
    purchases: number | null;
    purchase_value_cents: number | null;
    impressions: number | null;
    clicks: number | null;
    reach?: number | null;
  };
  const rows: EscalierDailyRow[] = ((insightsRes.data ?? []) as unknown as RawInsightRow[]).map((r) => ({
    day: String(r.day),
    campaignId: r.campaign_id,
    campaignName: r.campaign_name ?? null,
    spendCents: r.spend_cents ?? 0,
    purchases: r.purchases ?? 0,
    purchaseValueCents: r.purchase_value_cents ?? 0,
    impressions: r.impressions ?? 0,
    clicks: r.clicks ?? 0,
    reach: r.reach ?? 0,
  }));

  let budgetOverrides: Record<string, number> | null = null;
  const rawOverrides = overridesRes.data?.value;
  if (rawOverrides && typeof rawOverrides === "object") {
    budgetOverrides = {};
    for (const [id, v] of Object.entries(rawOverrides as Record<string, unknown>)) {
      const n = Number(v);
      if (Number.isFinite(n) && n > 0) budgetOverrides[id] = Math.round(n);
    }
  }

  const recentDecisions = (decisionsRes.data ?? []).map((e) => ({
    id: e.id as number,
    day: String(e.day),
    type: e.type as string,
    note: (e.note as string) ?? "",
  }));

  const [{ getProductRoasThresholds }, { fetchCampaignLiveInfos }] = await Promise.all([
    import("./analytics"),
    import("./meta"),
  ]);
  const [productThresholds, live] = await Promise.all([
    getProductRoasThresholds(endDay).catch(() => null),
    fetchCampaignLiveInfos().catch(() => null),
  ]);

  const report = computeEscalier({
    endDay,
    rows,
    thresholds: {
      GILET: productThresholds?.GILET ?? null,
      POLO: productThresholds?.POLO ?? null,
    },
    live,
    budgetOverridesCents: budgetOverrides,
    recentDecisions,
  });
  report.warnings.push(...extraWarnings);
  return report;
}
