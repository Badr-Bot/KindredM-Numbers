import type { SupabaseClient } from "@supabase/supabase-js";
import { isExcludedCampaign, type CampaignActivity } from "./meta";
import { addDaysToDay, toParisDay } from "./time";
import { formatInTimeZone } from "date-fns-tz";

// ---------------------------------------------------------------------------
// 🪜 Meta Scaling — protocole de prise de décision de la formation Master
// (MASTER ACQUISITION, leçon 35 « Le protocole de prise de décision »,
// transcription complète dans formation-master/ sur la branche formation).
// Arbitrage Badr 18/08 : CE protocole fait foi (celui du MEMO 03/08 est
// obsolète). Onglet 100 % Meta.
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
//    « moi je double le budget »). Compteur de NON remis à zéro. Créas neuves.
//  • NON n°1 → on attend 24 h sans toucher au budget (T35 [03:44-04:08]).
//  • NON n°2 et n°3 → on réduit de 15 % (défaut T24 [16:54] ; bande 10-15 %
//    T35 [19:09]) + créas neuves à chaque fois.
//  • NON n°4 → phase de SAUVETAGE (T35 [04:29]) : on ne rabote plus, on
//    diagnostique où ça fuit (cadran T35 [06:47-09:36] / T34 [03:47]) :
//      - CVR ok mais CPC mauvais  → problème CRÉAS (hooks, angles, mécanismes)
//      - CPC ok mais CVR mauvais  → problème FUNNEL (above the fold, Clarity)
//      - CPC et CVR corrects mais marge faible → problème AOV (upsell, bundle)
//      - tout mauvais → big swing (nouvelle LP / offre) voire couper
//  • Plancher absolu : 100 €/j (T35 [04:57]).
//
// Au-delà de 3 000 €/j on change de régime (phase de SCALING : barème
// quotidien à la marge T35 [15:03], condition « 3 derniers jours + hier
// rentables » [12:50], attribution click ≥ 70 % [13:11]). Aucune campagne n'y
// est : l'onglet le SIGNALE au lieu d'appliquer le mauvais régime en silence.
//
// DEUX verdicts par campagne (demande Badr 18/08) :
//  • la DÉCISION DE LA NUIT (fenêtre close, hier compris) — stable toute la
//    journée, c'est elle qu'on exécute entre minuit et 1 h ;
//  • la fenêtre EN COURS (avec le jour même, partiel) — PROVISOIRE, se met à
//    jour dans la journée. ⚠️ le ROAS Meta du jour J SOUS-ESTIME (attribution
//    24-72 h, fait vérifié) : ce provisoire ne peut que MONTER.
//
// L'application des décisions est VÉRIFIÉE sur Meta (journal d'activités du
// compte : changements de budget ancien → nouveau, horodatés) — plus aucun
// pointage manuel. Ce module RECOMMANDE, il n'exécute jamais (aucune écriture
// Meta ; Badr applique lui-même).
// ---------------------------------------------------------------------------

export type ScalingProduct = "GILET" | "POLO";

/** Mêmes conventions de nom que analytics.ts : Gilet = « LANCASTER » dans le
 * nom, produits en test = « NIRA »/« PRODTEST » (hors protocole, pas de
 * seuils produit), tout le reste = Polo. */
const GILET_KEYWORD = "LANCASTER";
const TESTING_KEYWORDS = ["NIRA", "PRODTEST"];

export function classifyCampaignProduct(name: string): ScalingProduct | "TESTING" {
  const n = name.toUpperCase();
  if (TESTING_KEYWORDS.some((k) => n.includes(k))) return "TESTING";
  if (n.includes(GILET_KEYWORD)) return "GILET";
  return "POLO";
}

// Échelle de montée du pré-scaling (€/j, en cents) — T35 [05:18] : « monter le
// budget de 500. 750, 1000 à 1500, 1800, 2000, 3000 ». Seule source vérifiable
// du corpus (Badr vérifie le schéma Whimsical — réaligner s'il dit 1850/2250).
// Au-delà du dernier palier : +30 % (« plus 30 % si vous êtes près des 3000 »).
export const MONTEE_PALIERS_CENTS = [50000, 75000, 100000, 150000, 180000, 200000, 300000];
export const PLANCHER_BUDGET_CENTS = 10000;
/** Seuil du régime SCALING (T35 [06:02] « dès que les 3K/jour sont atteints »). */
export const SEUIL_SCALING_CENTS = 300000;
/** Réduction par défaut des crans 2 et 3 : −15 % (T24 [16:54], prioritaire ;
 * bande 10-15 % chez T35 [19:09]). */
export const REDUCTION_DEFAUT = 0.15;
/** Marge nette qui fait basculer OUI/NON (T35 [03:44] « 15 % de marge minimum »). */
export const SEUIL_OUI = 0.15;
/** Sous ~15 conversions sur la fenêtre le verdict est un ajustement, pas un
 * jugement sur le produit (réserve d'échantillon — cf. Lancaster à 8 conv). */
export const MIN_CONVERSIONS_FIABLES = 15;
/** Fenêtres CLOSES affichées (la fenêtre en cours s'y ajoute). */
export const NB_FENETRES = 6;
/** Profondeur du tableau jour par jour. */
export const NB_JOURS_TABLEAU = 10;

export interface ScalingDailyRow {
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
  updatedTime: string | null;
}

export type WindowZone = "over" | "under" | "below" | "nodata";

export interface ScalingWindow {
  /** ex. « 16+17 » (ou « 31/08+01/09 » à cheval sur deux mois) */
  label: string;
  startDay: string;
  endDay: string;
  /** true = fenêtre qui contient le jour même (partiel) : PROVISOIRE. */
  inProgress: boolean;
  spendCents: number;
  valueCents: number;
  purchases: number;
  clicks: number;
  roas: number | null; // null si spend = 0
  /** CM − 1/ROAS. null si spend = 0 ou seuils incalculables. */
  margin: number | null;
  zone: WindowZone;
  verdict: "OUI" | "NON" | null;
  /** CPMr = CPM × fréquence — l'indicateur de saturation créative. */
  cpmr: number | null;
  cpcCents: number | null;
  cvr: number | null;
}

export type ScalingAction = "SCALE" | "HOLD" | "DESCALE" | "RESCUE";

export interface BudgetMove {
  time: string; // ISO Meta
  /** « 17/08 23h28 » (Europe/Paris), prêt à afficher */
  timeLabel: string;
  oldBudgetCents: number | null;
  newBudgetCents: number | null;
}

export interface DailyBudgetSpendRow {
  day: string;
  /** budget en vigueur au début du jour (reconstruit depuis les activités
   * Meta) ; le jour même porte le budget live. null = inconnu. */
  budgetCents: number | null;
  spendCents: number;
  roas: number | null;
  isToday: boolean;
}

export interface ScalingCampaign {
  campaignId: string;
  campaignName: string;
  product: ScalingProduct;
  active: boolean;
  /** Seuils du produit, affichés sur la carte (demande Badr). */
  breakEven: number | null;
  target: number | null;
  /** 6 fenêtres closes + 1 fenêtre en cours (inProgress). */
  windows: ScalingWindow[];
  // -- Décision de la nuit (fenêtre close) : STABLE toute la journée --
  nonStreak: number;
  cran: 1 | 2 | 3 | 4 | null;
  action: ScalingAction;
  /** UN chiffre : le budget cible à appliquer (−15 % ou palier suivant). */
  suggestedCents: number | null;
  /** Borne haute optionnelle de la montée (« ×2 si tout est parfait »). */
  suggestedMaxCents: number | null;
  /** Vérifié sur Meta : la décision de la nuit a-t-elle été exécutée ? */
  applied: "done" | "todo" | "nothing_to_do" | "unknown";
  appliedDetail: string | null;
  // -- Fenêtre en cours (jour même, partiel) : PROVISOIRE --
  liveVerdict: "OUI" | "NON" | null;
  liveMargin: number | null;
  liveAction: ScalingAction | null;
  // -- Contexte --
  budgetCents: number | null;
  budgetEstimated: boolean;
  /** Derniers changements de budget lus sur Meta (les plus récents d'abord). */
  moves: BudgetMove[];
  /** Tableau jour par jour : budget (pastille couleur côté UI) + spend + ROAS. */
  dailyTable: DailyBudgetSpendRow[];
  lowSample: boolean;
  cpmrRising: boolean;
  creasRequired: boolean;
  unstable: boolean;
  sauvetageDiagnostic: string | null;
  scalingRegime: boolean;
  why: string;
}

export interface ScalingReport {
  /** Jour même (Europe/Paris) — la fenêtre en cours finit ici. */
  today: string;
  /** Dernier jour CLOS — la décision de la nuit se prend sur la fenêtre qui finit ici. */
  officialEndDay: string;
  windowLabels: string[];
  thresholds: Record<ScalingProduct, ProductThresholdsInput | null>;
  campaigns: ScalingCampaign[];
  warnings: string[];
}

function windowLabel(startDay: string, endDay: string): string {
  const d1 = Number(startDay.slice(8, 10));
  const d2 = Number(endDay.slice(8, 10));
  if (startDay.slice(5, 7) !== endDay.slice(5, 7)) {
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
  // faux NON qui fabriquerait un SAUVETAGE.
  return "nodata";
}

/** Prochain palier de l'échelle strictement au-dessus du budget courant.
 * Au-delà du dernier palier : +30 % (T35 [05:18]). */
export function nextPalierCents(budgetCents: number): number {
  for (const p of MONTEE_PALIERS_CENTS) if (p > budgetCents) return p;
  return Math.round(budgetCents * 1.3);
}

/** Réduction par défaut (−15 %), arrondie à l'euro, plancher 100 €. */
export function reductionCents(budgetCents: number): number {
  return Math.max(PLANCHER_BUDGET_CENTS, Math.round((budgetCents * (1 - REDUCTION_DEFAUT)) / 100) * 100);
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const s = [...values].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

/** Budget en vigueur au DÉBUT de chaque jour, reconstruit depuis les
 * changements de budget Meta (triés par date croissante). Un changement fait
 * foi à partir du jour suivant (il n'a couvert qu'une fraction du jour où il
 * a eu lieu) ; le jour même porte le budget live. Sans aucun changement
 * connu : budget courant partout. */
export function budgetAtDayStart(
  moves: { eventTime: string; oldBudgetCents: number | null; newBudgetCents: number | null }[],
  currentBudgetCents: number | null,
  days: string[]
): (number | null)[] {
  return days.map((day, idx) => {
    const isLast = idx === days.length - 1;
    if (isLast && currentBudgetCents !== null) return currentBudgetCents;
    // dernier changement STRICTEMENT avant le début du jour
    let value: number | null = null;
    let hasBefore = false;
    for (const m of moves) {
      if (toParisDay(m.eventTime) < day) {
        value = m.newBudgetCents;
        hasBefore = true;
      }
    }
    if (hasBefore) return value;
    // avant le premier changement connu : sa valeur de départ
    const first = moves[0];
    if (first && toParisDay(first.eventTime) >= day) return first.oldBudgetCents;
    return currentBudgetCents;
  });
}

/** Cadran de la phase de sauvetage (T35 [06:47-09:36]) — CPC et CVR de la
 * dernière fenêtre JUGÉE comparés à l'historique de la campagne elle-même
 * (la formation lit ce cadran à l'œil, sans seuil absolu : on prend ±20 %,
 * paramètre ⚠️ hors formation, assumé comme tel). */
function diagnoseSauvetage(windows: ScalingWindow[], lastIdx: number): string {
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

function actionFromStreak(nonStreak: number): ScalingAction {
  return nonStreak === 0 ? "SCALE" : nonStreak === 1 ? "HOLD" : nonStreak <= 3 ? "DESCALE" : "RESCUE";
}

/** Compte les NON consécutifs en fin de série (fenêtres jugées seulement).
 * Les fenêtres vides en QUEUE sont ignorées ; un trou de diffusion au MILIEU
 * casse la série (relance après pause = nouveau départ). */
function streakOf(windows: ScalingWindow[]): { nonStreak: number; lastIdx: number } {
  let lastIdx = windows.length - 1;
  while (lastIdx >= 0 && windows[lastIdx].verdict === null) lastIdx--;
  let nonStreak = 0;
  for (let i = lastIdx; i >= 0; i--) {
    const v = windows[i].verdict;
    if (v === null) break;
    if (v === "NON") nonStreak++;
    else break;
  }
  return { nonStreak, lastIdx };
}

function fmtParis(timeIso: string, fmt: string): string {
  try {
    return formatInTimeZone(timeIso, "Europe/Paris", fmt);
  } catch {
    return timeIso;
  }
}

export function computeScaling(input: {
  today: string;
  rows: ScalingDailyRow[];
  thresholds: Record<ScalingProduct, ProductThresholdsInput | null>;
  live: Map<string, CampaignLiveInput> | null;
  activities: CampaignActivity[] | null;
  budgetOverridesCents?: Record<string, number> | null;
}): ScalingReport {
  const { today, rows, thresholds, live, activities } = input;
  const overrides = input.budgetOverridesCents ?? null;
  const warnings: string[] = [];
  const officialEndDay = addDaysToDay(today, -1);

  // 6 fenêtres closes (la plus récente finit HIER) + la fenêtre en cours
  // (finit AUJOURD'HUI, partielle, provisoire).
  const windowDefs: { startDay: string; endDay: string; inProgress: boolean }[] = [];
  for (let k = NB_FENETRES - 1; k >= 0; k--) {
    const e = addDaysToDay(officialEndDay, -k);
    windowDefs.push({ startDay: addDaysToDay(e, -1), endDay: e, inProgress: false });
  }
  windowDefs.push({ startDay: officialEndDay, endDay: today, inProgress: true });
  const windowLabels = windowDefs.map((w) => windowLabel(w.startDay, w.endDay));

  // Regroupement des lignes journalières par campagne.
  const byCampaign = new Map<string, { name: string; days: Map<string, ScalingDailyRow> }>();
  const testingSeen = new Set<string>();
  for (const r of rows) {
    const name = r.campaignName ?? r.campaignId;
    if (isExcludedCampaign(name)) continue;
    if (classifyCampaignProduct(name) === "TESTING") {
      testingSeen.add(name);
      continue;
    }
    let entry = byCampaign.get(r.campaignId);
    if (!entry) {
      entry = { name, days: new Map() };
      byCampaign.set(r.campaignId, entry);
    }
    entry.name = name;
    const prev = entry.days.get(r.day);
    if (prev) {
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
    warnings.push(`Hors protocole (produit en test, pas de seuils) : ${[...testingSeen].sort().join(", ")}.`);
  }

  // Activités Meta par campagne (changements de budget triés par date).
  const movesByCampaign = new Map<string, CampaignActivity[]>();
  if (activities) {
    for (const a of activities) {
      if (a.kind !== "budget") continue;
      const list = movesByCampaign.get(a.campaignId) ?? [];
      list.push(a);
      movesByCampaign.set(a.campaignId, list);
    }
  }

  const campaigns: ScalingCampaign[] = [];
  for (const [campaignId, entry] of byCampaign) {
    const product = classifyCampaignProduct(entry.name) as ScalingProduct;
    const th = thresholds[product];
    const cm = th?.cm ?? null;
    const liveInfo = live?.get(campaignId) ?? null;

    const winData: ScalingWindow[] = windowDefs.map((w) => {
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
      const margin = roas !== null && roas > 0 && cm !== null ? cm - 1 / roas : null;
      const zone = zoneFor(margin, roas, th?.breakEven ?? null);
      const verdict: "OUI" | "NON" | null =
        roas === null ? null : roas === 0 ? "NON" : cm === null ? null : margin !== null && margin >= SEUIL_OUI ? "OUI" : "NON";
      const cpmVal = impressions > 0 ? (spend / impressions) * 1000 : null;
      const freq = reach > 0 ? impressions / reach : null;
      return {
        label: windowLabel(w.startDay, w.endDay),
        startDay: w.startDay,
        endDay: w.endDay,
        inProgress: w.inProgress,
        spendCents: spend,
        valueCents: value,
        purchases: conv,
        clicks,
        roas,
        margin,
        zone,
        verdict,
        cpmr: cpmVal !== null && freq !== null ? cpmVal * freq : null,
        cpcCents: clicks > 0 ? spend / clicks : null,
        cvr: clicks > 0 ? conv / clicks : null,
      };
    });

    const closedWindows = winData.slice(0, NB_FENETRES);
    const liveWindow = winData[winData.length - 1];

    if (winData.every((w) => w.roas === null)) continue;
    if (winData.every((w) => w.verdict === null)) {
      warnings.push(
        `${entry.name} : seuils ${product} incalculables (pas de commandes ${product} sur 14 j ?) → aucun verdict rendu.`
      );
      continue;
    }

    // -- Décision de la nuit : sur les fenêtres CLOSES uniquement --
    const { nonStreak, lastIdx } = streakOf(closedWindows);
    const hasClosedVerdict = lastIdx >= 0;
    // Campagne lancée/relancée AUJOURD'HUI : aucune fenêtre close jugeable —
    // on n'invente pas de décision (le bug inverse fabriquait un SCALE avec
    // un « OUI » à marge négative). Première décision cette nuit.
    if (!hasClosedVerdict) {
      const lm = liveWindow.margin === null ? "—" : `${(liveWindow.margin * 100).toFixed(1)} %`;
      warnings.push(
        `${entry.name} : lancée/relancée aujourd'hui, aucune fenêtre close jugeable — première décision cette nuit (live : marge ${lm}, provisoire).`
      );
      continue;
    }
    const action = actionFromStreak(nonStreak);
    const last = closedWindows[lastIdx];

    // -- Fenêtre en cours : verdict provisoire --
    const liveStreak = streakOf(winData);
    const liveAction = liveWindow.verdict === null ? null : actionFromStreak(liveStreak.nonStreak);

    // Budget : override > live Meta > estimation.
    const budgetOverride = overrides?.[campaignId];
    const budgetLive = liveInfo?.dailyBudgetCents ?? null;
    const maxDailySpend = Math.max(0, ...[...entry.days.values()].map((d) => d.spendCents));
    const budgetCents = budgetOverride ?? budgetLive ?? (maxDailySpend > 0 ? maxDailySpend : null);
    const budgetEstimated = budgetOverride === undefined && budgetLive === null;
    const scalingRegime = budgetCents !== null && budgetCents >= SEUIL_SCALING_CENTS;

    // Mouvements de budget lus sur Meta (les plus récents d'abord pour l'UI).
    const rawMoves = movesByCampaign.get(campaignId) ?? [];
    const moves: BudgetMove[] = rawMoves
      .map((m) => ({
        time: m.eventTime,
        timeLabel: fmtParis(m.eventTime, "dd/MM HH'h'mm"),
        oldBudgetCents: m.oldBudgetCents,
        newBudgetCents: m.newBudgetCents,
      }))
      .reverse();

    // Tableau jour par jour : budget au début du jour + spend + ROAS.
    const tableDays: string[] = [];
    for (let k = NB_JOURS_TABLEAU - 1; k >= 0; k--) tableDays.push(addDaysToDay(today, -k));
    // override > live (jamais l'estimation : le tableau n'affiche que du sûr)
    const budgets = budgetAtDayStart(rawMoves, budgetOverride ?? budgetLive ?? null, tableDays);
    const dailyTable: DailyBudgetSpendRow[] = tableDays.map((day, i) => {
      const row = entry.days.get(day);
      const spend = row?.spendCents ?? 0;
      const value = row?.purchaseValueCents ?? 0;
      return {
        day,
        budgetCents: budgets[i],
        spendCents: spend,
        roas: spend > 0 ? value / spend : null,
        isToday: day === today,
      };
    });

    // Prescription : UN chiffre.
    let suggestedCents: number | null = null;
    let suggestedMaxCents: number | null = null;
    if (action === "SCALE" && budgetCents !== null) {
      suggestedCents = nextPalierCents(budgetCents);
      const x2 = Math.min(budgetCents * 2, SEUIL_SCALING_CENTS);
      suggestedMaxCents = x2 > suggestedCents ? x2 : null;
    } else if (action === "DESCALE" && budgetCents !== null) {
      suggestedCents = reductionCents(budgetCents);
    }

    // Application vérifiée sur Meta : un changement de budget depuis 21h la
    // veille du jour même (les décisions se prennent entre 23h et 1h).
    const appliedSince = `${officialEndDay} 21:00`;
    const movesSince = rawMoves.filter((m) => fmtParis(m.eventTime, "yyyy-MM-dd HH:mm") >= appliedSince);
    let applied: ScalingCampaign["applied"];
    let appliedDetail: string | null = null;
    const fmtMove = (m: CampaignActivity) =>
      `${m.oldBudgetCents !== null ? Math.round(m.oldBudgetCents / 100) : "?"} € → ${
        m.newBudgetCents !== null ? Math.round(m.newBudgetCents / 100) : "?"
      } € (${fmtParis(m.eventTime, "dd/MM HH'h'mm")})`;
    if (!activities) {
      applied = "unknown";
      appliedDetail = "Journal d'activités Meta indisponible — application non vérifiable.";
    } else if (action === "HOLD" || action === "RESCUE") {
      applied = "nothing_to_do";
      if (movesSince.length > 0) appliedDetail = `Mouvement détecté quand même : ${fmtMove(movesSince[movesSince.length - 1])}.`;
    } else {
      const wanted = action === "DESCALE" ? -1 : 1;
      const match = movesSince.find(
        (m) =>
          m.oldBudgetCents !== null &&
          m.newBudgetCents !== null &&
          Math.sign(m.newBudgetCents - m.oldBudgetCents) === wanted
      );
      if (match) {
        applied = "done";
        appliedDetail = `Vu sur Meta : ${fmtMove(match)}.`;
      } else {
        applied = "todo";
        appliedDetail =
          movesSince.length > 0 ? `Seul mouvement vu : ${fmtMove(movesSince[movesSince.length - 1])}.` : null;
      }
    }

    // Saturation créative : CPMr de la dernière fenêtre JUGÉE (close) vs
    // médiane des fenêtres closes précédentes.
    const prevCpmrs = closedWindows.slice(0, Math.max(0, lastIdx)).map((w) => w.cpmr).filter((v): v is number => v !== null);
    const cpmrMed = median(prevCpmrs);
    const cpmrRising = cpmrMed !== null && last.cpmr !== null && last.cpmr > cpmrMed * 1.2;

    const cran: ScalingCampaign["cran"] = nonStreak === 0 ? null : (Math.min(nonStreak, 4) as 1 | 2 | 3 | 4);
    const lowSample = last.purchases < MIN_CONVERSIONS_FIABLES;
    const creasRequired = action === "SCALE" || action === "DESCALE" || action === "RESCUE";
    const recentVerdicts = closedWindows.map((w) => w.verdict).filter((v): v is "OUI" | "NON" => v !== null).slice(-4);
    let flips = 0;
    for (let i = 1; i < recentVerdicts.length; i++) if (recentVerdicts[i] !== recentVerdicts[i - 1]) flips++;
    const unstable = flips >= 2;
    const sauvetageDiagnostic = action === "RESCUE" ? diagnoseSauvetage(closedWindows, lastIdx) : null;

    const marginTxt = last.margin === null ? "marge non calculable" : `marge ${(last.margin * 100).toFixed(1)} %`;
    const why =
      action === "SCALE"
        ? `OUI sur ${last.label} (${marginTxt} ≥ 15 %) : compteur remis à zéro → SCALE au palier suivant + créas neuves (T35).`
        : action === "HOLD"
          ? `1er NON sur ${last.label} (${marginTxt} < 15 %) : cran 1 → HOLD 24 h, on ne touche pas au budget (T35).`
          : action === "DESCALE"
            ? `${nonStreak}ᵉ NON consécutif (${last.label} : ${marginTxt}) : cran ${nonStreak} → DESCALE −15 % + créas neuves (T35/T24).`
            : `${nonStreak} NON consécutifs (dernier : ${last.label}, ${marginTxt}) : escalier épuisé → RESCUE, on ne rabote plus, on diagnostique (T35).`;

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
      active: liveInfo ? liveInfo.active : live ? false : true,
      breakEven: th?.breakEven ?? null,
      target: th?.target ?? null,
      windows: winData,
      nonStreak,
      cran,
      action,
      suggestedCents,
      suggestedMaxCents,
      applied,
      appliedDetail,
      liveVerdict: liveWindow.verdict,
      liveMargin: liveWindow.margin,
      liveAction,
      budgetCents,
      budgetEstimated,
      moves: moves.slice(0, 6),
      dailyTable,
      lowSample,
      cpmrRising,
      creasRequired,
      unstable,
      sauvetageDiagnostic,
      scalingRegime,
      why,
    });
  }

  const order: Record<ScalingAction, number> = { RESCUE: 0, DESCALE: 1, HOLD: 2, SCALE: 3 };
  campaigns.sort(
    (a, b) => order[a.action] - order[b.action] || b.nonStreak - a.nonStreak || a.campaignId.localeCompare(b.campaignId)
  );

  if (!live) {
    warnings.push(
      "Statut/budget live Meta indisponible (token ?) : budgets estimés depuis le spend, campagnes en pause non signalées."
    );
  }
  if (!activities) {
    warnings.push("Journal d'activités Meta indisponible : historique de budget et vérification d'application désactivés.");
  }
  if (thresholds.GILET === null && thresholds.POLO === null) {
    warnings.push("Seuils produit non calculables (commandes illisibles) : aucun verdict fiable.");
  }

  return { today, officialEndDay, windowLabels, thresholds, campaigns, warnings };
}

// ---------------------------------------------------------------------------
// Lecture des données (Supabase + Meta live) — même approche que
// buildRoasReport : tout le calcul est dans computeScaling (pur, testé).
// ---------------------------------------------------------------------------

export async function buildScalingReport(supabase: SupabaseClient, today: string): Promise<ScalingReport> {
  const startDay = addDaysToDay(today, -(NB_FENETRES + NB_JOURS_TABLEAU));

  // reach n'existe sur meta_insights que depuis la migration 0007 : on sonde
  // avant de le demander, sinon une base non migrée ferait échouer TOUT.
  const { error: reachProbeError } = await supabase.from("meta_insights").select("reach").limit(1);
  const hasReach = !reachProbeError;
  const insightCols =
    "day, campaign_id, campaign_name, spend_cents, purchases, purchase_value_cents, impressions, clicks" +
    (hasReach ? ", reach" : "");

  const MAX_ROWS = 5000;
  const [insightsRes, overridesRes] = await Promise.all([
    supabase
      .from("meta_insights")
      .select(insightCols)
      .gte("day", startDay)
      .lte("day", today)
      .order("day", { ascending: true })
      .order("campaign_id", { ascending: true })
      .limit(MAX_ROWS),
    supabase.from("app_state").select("value").eq("key", "campaign_daily_budgets").maybeSingle(),
  ]);
  if (insightsRes.error) throw new Error(insightsRes.error.message);

  const extraWarnings: string[] = [];
  if ((insightsRes.data ?? []).length >= MAX_ROWS) {
    extraWarnings.push(`Lecture meta_insights tronquée à ${MAX_ROWS} lignes — verdicts possiblement incomplets.`);
  }
  if (!hasReach) {
    extraWarnings.push("Colonne reach absente (migration 0007 non exécutée) : CPMr indisponible.");
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
  const rows: ScalingDailyRow[] = ((insightsRes.data ?? []) as unknown as RawInsightRow[]).map((r) => ({
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

  const [{ getProductRoasThresholds }, { fetchCampaignLiveInfos, fetchCampaignActivities }] = await Promise.all([
    import("./analytics"),
    import("./meta"),
  ]);
  // Seuils calculés sur les 14 jours CLOS (le jour même, partiel, fausserait le CM).
  const [productThresholds, liveInfos, activities] = await Promise.all([
    getProductRoasThresholds(addDaysToDay(today, -1)).catch(() => null),
    fetchCampaignLiveInfos().catch(() => null),
    fetchCampaignActivities(startDay).catch(() => null),
  ]);

  const report = computeScaling({
    today,
    rows,
    thresholds: {
      GILET: productThresholds?.GILET ?? null,
      POLO: productThresholds?.POLO ?? null,
    },
    live: liveInfos,
    activities,
    budgetOverridesCents: budgetOverrides,
  });
  report.warnings.push(...extraWarnings);
  return report;
}
