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
//  • OUI → on monte le budget (T35 [05:18] « fois 2 si petit », lecture Badr
//    18/08) : sous 500 €/j → ×2 PLAFONNÉ à 500 ; à partir de 500 → palier
//    par palier sur 500 → 750 → 1000 → 1500 → 1800 → 2000 → 3000 (+30 % au
//    delà). Compteur de NON remis à zéro. Créas neuves à chaque montée.
//  • NON n°1 → on attend 24 h sans toucher au budget (T35 [03:44-04:08]).
//  • NON n°2 et n°3 → on réduit de 15 % (défaut T24 [16:54] ; bande 10-15 %
//    T35 [19:09]) + créas neuves à chaque fois.
//  • NON n°4 → phase de SAUVETAGE (T35 [04:29]) — RESCUE seulement si les
//    crans ont été RÉELLEMENT déroulés : la série de NON ne compte qu'à
//    partir du premier mouvement de budget vu sur Meta (Badr n'a commencé à
//    piloter les budgets que le 17/08), et il faut au moins une réduction
//    exécutée ; sinon le verdict est plafonné à DESCALE. On ne rabote plus, on
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
// LA fenêtre de décision = LE JOUR MÊME + LA VEILLE, avec la règle horaire de
// Badr (18/08 soir) :
//  • de MINUIT à 7 H : on garde les données figées de la veille 23h59
//    (fenêtre avant-hier + hier) — c'est la plage d'exécution SCALE/DESCALE ;
//  • à partir de 7 H : bascule sur le jour J (hier + aujourd'hui, live, le
//    verdict se met à jour dans la journée et se fige à minuit).
// ⚠️ le ROAS Meta du jour J SOUS-ESTIME (attribution 24-72 h, fait vérifié) :
// en journée la marge affichée ne peut que S'AMÉLIORER d'ici minuit.
//
// Les budgets et leurs mouvements sont LUS sur Meta (journal d'activités du
// compte : changements ancien → nouveau, horodatés) — aucun pointage manuel.
// Ce module RECOMMANDE, il n'exécute jamais (aucune écriture Meta ; Badr
// applique lui-même).
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
/** Fenêtres affichées (la dernière = la fenêtre de décision). */
export const NB_FENETRES = 6;
/** Heure (Paris) de bascule : avant 7 h on reste sur les données de la
 * veille 23h59 (plage d'exécution), après on suit le jour J en live. */
export const BASCULE_HEURE = 7;

/** Le jour de décision selon l'heure de Paris : avant 7 h → hier. */
export function decisionDayFor(todayDay: string, parisHour: number): string {
  return parisHour < BASCULE_HEURE ? addDaysToDay(todayDay, -1) : todayDay;
}
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

/** Une annonce de la campagne, sur la fenêtre de diagnostic (14 j). */
export interface AdDiagnostic {
  adId: string;
  adName: string;
  spendCents: number;
  purchases: number;
  valueCents: number;
  roas: number | null;
  /** Marge = CM − 1/ROAS (null si pas de vente ou seuils inconnus). */
  margin: number | null;
  cpcCents: number | null;
  cvr: number | null;
  cpmCents: number | null;
  frequency: number | null;
  /** Jours de diffusion observés, et âge depuis le 1er jour vu. */
  daysLive: number;
  ageDays: number;
  /** Dernier jour où l'annonce a réellement dépensé. */
  lastDay: string;
  /** Premier jour de diffusion vu dans la fenêtre lue. */
  lastFirstDay: string;
  /** true = l'annonce existait déjà avant la fenêtre lue : son âge réel est
   * SUPÉRIEUR à ageDays (on ne l'invente pas, on le dit). */
  ageTruncated: boolean;
  /** ≥ 6 ventes ET ≥ 10 % de marge (T37) → à dupliquer (même post ID). */
  winner: boolean;
  /** ≥ 6 ventes, entre BE et 10 % de marge (T37) → potential winner. */
  potentialWinner: boolean;
  /** CPM ou fréquence en forte hausse sur la 2ᵉ moitié de la fenêtre. */
  saturating: boolean;
  /** Dépense significative sans rentabilité : elle mange le budget. */
  bleeding: boolean;
}

export type RescueLeak = "CREAS" | "FUNNEL" | "AOV" | "BIG_SWING" | "INSUFFISANT";

/** Diagnostic complet, calculé côté serveur (aucune session Claude requise). */
export interface RescueDiagnostic {
  /** Où ça fuit, selon le cadran de la formation (T35). */
  leak: RescueLeak;
  /** Phrase de conclusion du cadran. */
  verdict: string;
  /** Les chiffres qui déclenchent le diagnostic, prêts à afficher. */
  evidence: string[];
  /** Annonces triées par spend décroissant sur 14 j. */
  ads: AdDiagnostic[];
  /** Le plan d'action, déjà priorisé. */
  plan: string[];
  /** Date du dernier batch injecté (1re diffusion de l'annonce la plus jeune). */
  lastBatchDay: string | null;
}

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
  /** 6 fenêtres 2 jours ; la dernière (hier + aujourd'hui) est en cours. */
  windows: ScalingWindow[];
  nonStreak: number;
  cran: 1 | 2 | 3 | 4 | null;
  action: ScalingAction;
  /** UN chiffre : le budget cible à appliquer (−15 % ou palier suivant). */
  suggestedCents: number | null;
  /** Borne haute de la montée (SURFSCALE ×2 si tout est parfait). */
  suggestedMaxCents: number | null;
  // -- Contexte --
  budgetCents: number | null;
  budgetEstimated: boolean;
  /** Derniers changements de budget lus sur Meta (les plus récents d'abord). */
  moves: BudgetMove[];
  /** « depuis 17/08 23h28 » — horodatage du dernier changement de budget. */
  budgetSinceLabel: string | null;
  /** Tableau jour par jour : budget (pastille couleur côté UI) + spend + ROAS. */
  dailyTable: DailyBudgetSpendRow[];
  lowSample: boolean;
  cpmrRising: boolean;
  creasRequired: boolean;
  /** Plan créas concret selon le verdict — combien, quelles variantes, dans
   * quel adset (T36 « Processus de testing », T37 « Dispatcher les winners »). */
  creaPlan: string[];
  /** Diagnostic annonce par annonce — rempli en RESCUE et au cran 3 (juste
   * avant de basculer), calculé côté serveur depuis meta_ad_insights. */
  rescue: RescueDiagnostic | null;
  unstable: boolean;
  sauvetageDiagnostic: string | null;
  scalingRegime: boolean;
  why: string;
}

export interface ScalingReport {
  /** Jour de décision (Europe/Paris) — la dernière fenêtre finit ici. */
  today: string;
  /** "night" = 00h-07h, données figées de la veille 23h59 (plage d'exécution) ;
   * "day" = fenêtre du jour J, live. */
  mode: "night" | "day";
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

/** Montée SCALE : sous 500 €/j → ×2 plafonné à 500 (« fois 2 si petit »,
 * lecture Badr 18/08) ; à partir de 500 → palier suivant de l'échelle. */
export function scaleTargetCents(budgetCents: number): number {
  if (budgetCents < MONTEE_PALIERS_CENTS[0]) {
    return Math.min(budgetCents * 2, MONTEE_PALIERS_CENTS[0]);
  }
  return nextPalierCents(budgetCents);
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

export interface AdDailyRow {
  day: string;
  adId: string;
  adName: string | null;
  campaignId: string;
  spendCents: number;
  purchases: number;
  purchaseValueCents: number;
  impressions: number;
  clicks: number;
  reach: number;
}

/**
 * 🩺 Diagnostic de sauvetage — le travail que faisait le media buyer à la
 * main : descendre au niveau des ANNONCES pour trouver où ça fuit.
 * Tourne côté serveur, à chaque chargement de l'onglet (aucune session Claude,
 * aucun connecteur, aucune autorisation à donner).
 *
 * Cadran de la formation (T35 [06:47-09:36]), lu sur l'historique de la
 * campagne elle-même : CPC qui dérape → créas · CVR qui chute → funnel ·
 * les deux corrects mais marge faible → AOV · les deux mauvais → big swing.
 */
export function diagnoseRescue(input: {
  windows: ScalingWindow[];
  lastIdx: number;
  ads: AdDailyRow[];
  cm: number | null;
  breakEven: number | null;
  today: string;
  /** 1er jour de la fenêtre LUE en base — sert à savoir si l'âge d'une
   * annonce est tronqué (elle diffusait peut-être bien avant). */
  windowStartDay: string;
}): RescueDiagnostic {
  const { windows, lastIdx, ads, cm, breakEven, today, windowStartDay } = input;
  const last = windows[lastIdx];

  // --- 1. Agrégation par annonce sur la fenêtre de diagnostic ---
  const byAd = new Map<string, AdDailyRow[]>();
  for (const r of ads) {
    const list = byAd.get(r.adId) ?? [];
    list.push(r);
    byAd.set(r.adId, list);
  }
  const dayNumber = (d: string) => Math.round(new Date(`${d}T00:00:00Z`).getTime() / 86400000);
  const todayN = dayNumber(today);

  const adDiags: AdDiagnostic[] = [];
  for (const [adId, rows] of byAd) {
    const sorted = [...rows].sort((a, b) => a.day.localeCompare(b.day));
    const sum = (f: (r: AdDailyRow) => number) => sorted.reduce((acc, r) => acc + f(r), 0);
    const spend = sum((r) => r.spendCents);
    if (spend === 0) continue;
    const value = sum((r) => r.purchaseValueCents);
    const purchases = sum((r) => r.purchases);
    const clicks = sum((r) => r.clicks);
    const impressions = sum((r) => r.impressions);
    const reach = sum((r) => r.reach);
    const roas = spend > 0 ? value / spend : null;
    const margin = roas !== null && roas > 0 && cm !== null ? cm - 1 / roas : null;

    // Saturation : CPM et fréquence de la 2ᵉ moitié vs la 1re moitié.
    const half = Math.floor(sorted.length / 2);
    const slice = (rs: AdDailyRow[]) => {
      const sp = rs.reduce((a, r) => a + r.spendCents, 0);
      const im = rs.reduce((a, r) => a + r.impressions, 0);
      const re = rs.reduce((a, r) => a + r.reach, 0);
      return {
        cpm: im > 0 ? (sp / im) * 1000 : null,
        freq: re > 0 ? im / re : null,
      };
    };
    const first = slice(sorted.slice(0, half || 1));
    const second = slice(sorted.slice(half || 1));
    // 4 jours minimum et du volume des deux côtés : sur 1 jour contre 1 jour,
    // +20 % de CPM est du bruit quotidien, pas une saturation.
    const enoughForSaturation =
      sorted.length >= 4 &&
      sorted.slice(0, half).reduce((a, r) => a + r.impressions, 0) >= 1000 &&
      sorted.slice(half).reduce((a, r) => a + r.impressions, 0) >= 1000;
    const saturating =
      enoughForSaturation &&
      ((first.cpm !== null && second.cpm !== null && second.cpm > first.cpm * 1.2) ||
        (first.freq !== null && second.freq !== null && second.freq > first.freq * 1.2));

    const lastDay = sorted[sorted.length - 1].day;
    const ageDays = todayN - dayNumber(sorted[0].day);
    // « Saigne » seulement si l'annonce DÉPENSE ENCORE (présente dans la
    // fenêtre de décision) et a passé sa phase d'apprentissage (≥ 3 j) :
    // sinon on ferait couper une créa lancée hier, ou une déjà arrêtée.
    const stillRunning = lastDay >= last.startDay;
    const bleeding =
      stillRunning &&
      ageDays >= 3 &&
      spend >= 5000 &&
      (roas === 0 || (roas !== null && breakEven !== null && roas < breakEven * 0.7));

    adDiags.push({
      adId,
      // dernier nom connu : une annonce renommée doit s'afficher sous son
      // nom actuel, pas sous l'ancien.
      adName: sorted[sorted.length - 1].adName ?? sorted[0].adName ?? adId,
      spendCents: spend,
      purchases,
      valueCents: value,
      roas,
      margin,
      cpcCents: clicks > 0 ? spend / clicks : null,
      cvr: clicks > 0 ? purchases / clicks : null,
      cpmCents: impressions > 0 ? (spend / impressions) * 1000 : null,
      frequency: reach > 0 ? impressions / reach : null,
      daysLive: sorted.length,
      ageDays,
      lastDay,
      lastFirstDay: sorted[0].day,
      ageTruncated: sorted[0].day <= windowStartDay,
      // Seuils winner/potential winner : T37 [01:08] et [04:28].
      winner: purchases >= 6 && margin !== null && margin >= 0.1,
      potentialWinner:
        purchases >= 6 && margin !== null && margin < 0.1 && roas !== null && breakEven !== null && roas >= breakEven,
      saturating,
      bleeding,
    });
  }
  adDiags.sort((a, b) => b.spendCents - a.spendCents);

  // --- 2. Le cadran, sur l'historique de la campagne ---
  const prevCpcs = windows.slice(0, lastIdx).map((w) => w.cpcCents).filter((v): v is number => v !== null);
  const prevCvrs = windows.slice(0, lastIdx).map((w) => w.cvr).filter((v): v is number => v !== null);
  const cpcMed = median(prevCpcs);
  const cvrMed = median(prevCvrs);
  const cpcBad = last.cpcCents !== null && cpcMed !== null && last.cpcCents > cpcMed * 1.2;
  const cvrBad = last.cvr !== null && cvrMed !== null && last.cvr < cvrMed * 0.8;

  const evidence: string[] = [];
  const eur = (c: number) => `${(c / 100).toFixed(2)} €`;
  if (last.cpcCents !== null && cpcMed !== null) {
    const delta = Math.round((last.cpcCents / cpcMed - 1) * 100);
    evidence.push(`CPC ${eur(last.cpcCents)} vs ${eur(cpcMed)} médian (${delta >= 0 ? "+" : ""}${delta} %)`);
  }
  if (last.cvr !== null && cvrMed !== null) {
    const delta = Math.round((last.cvr / cvrMed - 1) * 100);
    evidence.push(
      `CVR ${(last.cvr * 100).toFixed(2)} % vs ${(cvrMed * 100).toFixed(2)} % médian (${delta >= 0 ? "+" : ""}${delta} %)`
    );
  }
  const saturated = adDiags.filter((a) => a.saturating);
  if (saturated.length > 0) evidence.push(`${saturated.length} annonce(s) en saturation (CPM/fréquence en hausse)`);
  const bleeders = adDiags.filter((a) => a.bleeding);
  if (bleeders.length > 0) {
    const wasted = bleeders.reduce((a, b) => a + b.spendCents, 0);
    evidence.push(`${bleeders.length} annonce(s) mangent ${eur(wasted)} sans rentabilité`);
  }

  let leak: RescueLeak;
  let verdict: string;
  if (cm === null) {
    // Sans marge de contribution calculable, ni marge ni winner ne le sont :
    // on ne fabrique surtout pas un « c'est l'AOV » par défaut.
    leak = "INSUFFISANT";
    verdict =
      "Seuils produit incalculables (pas de commandes récentes sur ce produit ?) : ni marge, ni winner, ni cadran fiables — vérifier les données avant de décider.";
    evidence.push("Marge de contribution indisponible : aucune annonce ne peut être classée winner");
  } else if (last.cpcCents === null && last.cvr === null) {
    leak = "INSUFFISANT";
    verdict = "Pas de clics mesurés sur la fenêtre : vérifier la diffusion avant tout diagnostic.";
  } else if (cpcBad && cvrBad) {
    leak = "BIG_SWING";
    verdict = "CPC en hausse ET CVR en baisse : tout fuit — big swing (nouvelle LP / nouvelle offre), voire couper.";
  } else if (cpcBad) {
    leak = "CREAS";
    verdict = "Le CVR tient mais le CPC dérape : le problème est CRÉATIF, pas la page ni l'offre.";
  } else if (cvrBad) {
    leak = "FUNNEL";
    verdict = "Le CPC tient mais le CVR chute : le problème est le FUNNEL (landing page), pas les créas.";
  } else {
    leak = "AOV";
    verdict = "CPC et CVR dans les normes mais la marge ne suit pas : le problème est l'AOV (panier moyen).";
  }

  // --- 3. Le plan, priorisé, avec les annonces nommées ---
  const plan: string[] = [];
  const nameOf = (a: AdDiagnostic) => (a.adName.length > 42 ? a.adName.slice(0, 42) + "…" : a.adName);
  if (bleeders.length > 0) {
    plan.push(
      `Coupe d'abord ce qui saigne : ${bleeders.slice(0, 3).map(nameOf).join(", ")} — ${eur(bleeders.reduce((a, b) => a + b.spendCents, 0))} dépensés sous 70 % du break-even.`
    );
  }
  const winners = adDiags.filter((a) => a.winner);
  const potentials = adDiags.filter((a) => a.potentialWinner);
  if (winners.length > 0) {
    plan.push(
      `Duplique tes gagnantes AVEC LE MÊME POST ID (garde commentaires et social proof) dans un nouvel adset « winners » : ${winners.slice(0, 3).map(nameOf).join(", ")} (T37).`
    );
  }
  if (potentials.length > 0) {
    plan.push(`Potential winners à injecter aussi (≥ 6 ventes, entre BE et 10 % de marge) : ${potentials.slice(0, 3).map(nameOf).join(", ")} (T37).`);
  }
  if (leak === "CREAS" || leak === "BIG_SWING") {
    plan.push(
      "Batch de 3 à 6 ads NEUVES dans un nouvel adset de la CBO (minimum spend 10-15 €/j, 2 jours) : nouveaux HOOKS, nouveaux ANGLES, nouveaux MÉCANISMES — pas des variantes de l'existant (T35/T36)."
    );
  }
  if (leak === "FUNNEL") {
    plan.push("Priorité LP : above-the-fold, objections répondues, Microsoft Clarity pour voir où ça décroche. Les créas continuent en fond mais ce n'est pas là que ça fuit (T35).");
  }
  if (leak === "AOV") {
    plan.push("Priorité offre : upsells, bundles, e-mails post-achat — remonter le panier moyen suffit souvent à repasser rentable (T35 [08:33-09:15]).");
  }
  if (leak === "BIG_SWING") {
    plan.push("Nouvelle landing page voire nouvelle offre, et re-analyse ce que font les compétiteurs qui scalent (T35 [10:17]).");
  }
  if (saturated.length > 0) {
    plan.push(`Audience saturée sur ${saturated.slice(0, 3).map(nameOf).join(", ")} : la réponse est des créas neuves, jamais du budget (T36).`);
  }
  plan.push("Réglages du batch : 2-3 adcopies + 2-3 titres + 1 description par ad, une adcopy par angle, miniature choisie à la main, 50 % page marque / 50 % page tierce, Advantage+ créative OFF sauf relevant comments, lancement mardi→vendredi entre minuit et 7 h.");

  // Dernier batch : uniquement si l'annonce la plus jeune est apparue DANS la
  // fenêtre lue. Sinon son âge est tronqué et donner une date serait un
  // mensonge (elle diffusait peut-être depuis des mois).
  const youngest = adDiags.length > 0 ? adDiags.reduce((a, b) => (a.ageDays <= b.ageDays ? a : b)) : null;
  const lastBatchDay = youngest && !youngest.ageTruncated ? youngest.lastFirstDay : null;
  if (youngest && youngest.ageTruncated) {
    evidence.push(`Aucune créa neuve depuis au moins ${youngest.ageDays} jours`);
  }

  const shown = adDiags.slice(0, 8);
  if (adDiags.length > shown.length) {
    evidence.push(`${shown.length} annonces affichées sur ${adDiags.length} (les plus grosses dépenses)`);
  }

  return { leak, verdict, evidence, ads: shown, plan, lastBatchDay };
}

/** Le plan créas de la formation, adapté au verdict et au budget du compte.
 * Source : T36 (batch 3-6 ads / nouvel adset / minimum spend / variantes) et
 * T37 (dispatch des winners). En dessous de 3 000 €/j de spend, tout se joue
 * DANS la CBO ([04:23] « alimenter la CBO ») ; l'ABO testing dédiée (~20 % du
 * budget) n'arrive qu'à 3K+/j ([02:07]). */
function buildCreaPlan(input: {
  action: ScalingAction;
  scalingRegime: boolean;
  cpmrRising: boolean;
  sauvetageDiagnostic: string | null;
}): string[] {
  const { action, scalingRegime, cpmrRising } = input;
  const where = scalingRegime
    ? "Campagne ABO testing dédiée (~20 % du budget) : nouvel adset par batch, budget ≈ 2-2,5 × CPA, décision à 2-3 j (T36 [02:07])."
    : "Nouvel adset DANS la CBO (ou complète un adset existant s'il a < 15 ads), minimum spend 10-15 €/j pendant 2 jours pour forcer Meta à tester (T36 [04:23-05:05]).";
  const batch =
    "Batch de 3 à 6 ads : 2-3 adcopies + 2-3 titres + 1 description par ad, angles VARIÉS (une adcopy par angle), miniature choisie à la main, 50 % page marque / 50 % page tierce (T36).";
  const setup =
    "Réglages : Advantage+ créative OFF sauf relevant comments, placements originaux, exclure les acheteurs. Lancement mardi→vendredi (jamais lundi), adset live entre minuit et 7 h (T36 [00:20-01:03]).";

  if (action === "HOLD") {
    return cpmrRising
      ? ["Pas d'obligation au cran 1, MAIS le CPMr monte : prépare le prochain batch (hooks neufs) pour être prêt à injecter au premier mouvement (T35/T36)."]
      : [];
  }
  if (action === "SCALE") {
    return [
      where,
      batch,
      "Et dispatch tes winners : une ad à ≥ 6 ventes et ≥ 10 % de marge (14 j) → duplique-la AVEC LE MÊME POST ID (garde les commentaires) dans un NOUVEL adset « <mois> winners » de la CBO, minimum spend 10-15 €/j (T37).",
      setup,
    ];
  }
  if (action === "DESCALE") {
    return [
      where,
      "Batch de 3 à 6 ads « valeurs sûres » (T35 [04:08] : des trucs dont on est sûrs) + 1-2 hooks neufs" +
        (cpmrRising ? " — priorité aux HOOKS : le CPMr monte, l'audience sature (T36)." : " (T36)."),
      setup,
    ];
  }
  // RESCUE : le focus dépend du cadran (T35 [06:47-09:36])
  const diag = input.sauvetageDiagnostic ?? "";
  if (diag.includes("CRÉAS"))
    return [
      "Le cadran pointe les CRÉAS : batch complet 3-6 ads avec nouveaux HOOKS, nouveaux ANGLES, nouveaux MÉCANISMES — pas des variantes de l'existant (T35 [06:47]).",
      where,
      setup,
    ];
  if (diag.includes("FUNNEL"))
    return [
      "Le cadran pointe le FUNNEL : le focus est la LP (above-the-fold, objections, Microsoft Clarity) — les créas continuent en fond (« toujours ajouter », T35 [08:13]) mais ce n'est pas là que ça fuit.",
    ];
  if (diag.includes("AOV"))
    return [
      "Le cadran pointe l'AOV : upsells, bundles, e-mails d'abord (T35 [08:33-09:15]) — les créas continuent en fond, le déblocage est dans l'offre.",
    ];
  return [
    "Tout fuit (big swing) : nouvelle LP voire nouvelle offre, ET batch complet nouveaux hooks/angles/mécanismes — re-analyse les compétiteurs (T35 [10:17-10:59]).",
    where,
  ];
}

function actionFromStreak(nonStreak: number): ScalingAction {
  return nonStreak === 0 ? "SCALE" : nonStreak === 1 ? "HOLD" : nonStreak <= 3 ? "DESCALE" : "RESCUE";
}

/** Compte les NON consécutifs en fin de série (fenêtres jugées seulement).
 * Les fenêtres vides en QUEUE sont ignorées ; un trou de diffusion au MILIEU
 * casse la série (relance après pause = nouveau départ). `anchorDay` (jour du
 * premier mouvement de budget réel) tronque l'historique : les fenêtres
 * closes AVANT le pilotage effectif ne comptent pas (règle Badr 18/08). */
function streakOf(windows: ScalingWindow[], anchorDay: string | null = null): { nonStreak: number; lastIdx: number } {
  let lastIdx = windows.length - 1;
  while (lastIdx >= 0 && windows[lastIdx].verdict === null) lastIdx--;
  let nonStreak = 0;
  for (let i = lastIdx; i >= 0; i--) {
    const w = windows[i];
    if (anchorDay !== null && w.endDay < anchorDay) break;
    if (w.verdict === null) break;
    if (w.verdict === "NON") nonStreak++;
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
  /** Jour de DÉCISION (= jour J après 7 h, la veille entre minuit et 7 h). */
  today: string;
  rows: ScalingDailyRow[];
  thresholds: Record<ScalingProduct, ProductThresholdsInput | null>;
  live: Map<string, CampaignLiveInput> | null;
  activities: CampaignActivity[] | null;
  budgetOverridesCents?: Record<string, number> | null;
  /** false = fenêtre FIGÉE (mode nuit 00h-07h ou rejeu d'un jour passé). */
  liveDay?: boolean;
  /** Lignes ANNONCE (14 j) — alimentent le diagnostic de sauvetage. */
  adRows?: AdDailyRow[];
  /** 1er jour de la fenêtre annonce réellement lue en base. */
  adWindowStartDay?: string;
}): ScalingReport {
  const { today, rows, thresholds, live, activities } = input;
  const liveDay = input.liveDay ?? true;
  const adRowsByCampaign = new Map<string, AdDailyRow[]>();
  for (const r of input.adRows ?? []) {
    const list = adRowsByCampaign.get(r.campaignId) ?? [];
    list.push(r);
    adRowsByCampaign.set(r.campaignId, list);
  }
  const overrides = input.budgetOverridesCents ?? null;
  const warnings: string[] = [];

  // 6 fenêtres 2 jours glissantes ; la plus récente = HIER + AUJOURD'HUI
  // (en cours, se met à jour dans la journée).
  const windowDefs: { startDay: string; endDay: string; inProgress: boolean }[] = [];
  for (let k = NB_FENETRES - 1; k >= 0; k--) {
    const e = addDaysToDay(today, -k);
    windowDefs.push({ startDay: addDaysToDay(e, -1), endDay: e, inProgress: k === 0 && liveDay });
  }
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

    if (winData.every((w) => w.roas === null)) continue;
    if (winData.every((w) => w.verdict === null)) {
      warnings.push(
        `${entry.name} : seuils ${product} incalculables (pas de commandes ${product} sur 14 j ?) → aucun verdict rendu.`
      );
      continue;
    }

    // -- Décision : streak ancré au premier mouvement de budget réel --
    const rawMovesForAnchor = movesByCampaign.get(campaignId) ?? [];
    const anchorDay = rawMovesForAnchor.length > 0 ? toParisDay(rawMovesForAnchor[0].eventTime) : null;
    const { nonStreak, lastIdx } = streakOf(winData, anchorDay);
    let action = actionFromStreak(nonStreak);
    const last = winData[lastIdx];
    // RESCUE exige au moins une réduction RÉELLEMENT exécutée sur Meta ;
    // sinon on plafonne à DESCALE (les crans n'ont pas été déroulés).
    let rescueCapped = false;
    if (action === "RESCUE") {
      const hasExecutedDecrease =
        activities !== null &&
        rawMovesForAnchor.some(
          (m) => m.oldBudgetCents !== null && m.newBudgetCents !== null && m.newBudgetCents < m.oldBudgetCents
        );
      if (activities !== null && !hasExecutedDecrease) {
        action = "DESCALE";
        rescueCapped = true;
      }
    }

    // Budget : override > live Meta > estimation.
    const budgetOverride = overrides?.[campaignId];
    const budgetLive = liveInfo?.dailyBudgetCents ?? null;
    const maxDailySpend = Math.max(0, ...[...entry.days.values()].map((d) => d.spendCents));
    const budgetCents = budgetOverride ?? budgetLive ?? (maxDailySpend > 0 ? maxDailySpend : null);
    const budgetEstimated = budgetOverride === undefined && budgetLive === null;
    const scalingRegime = budgetCents !== null && budgetCents >= SEUIL_SCALING_CENTS;

    // Mouvements de budget lus sur Meta (les plus récents d'abord pour l'UI).
    const rawMoves = rawMovesForAnchor;
    const moves: BudgetMove[] = rawMoves
      .map((m) => ({
        time: m.eventTime,
        timeLabel: fmtParis(m.eventTime, "dd/MM HH'h'mm"),
        oldBudgetCents: m.oldBudgetCents,
        newBudgetCents: m.newBudgetCents,
      }))
      .reverse();

    // Tableau jour par jour : budget au début du jour + spend + ROAS. Le
    // tracking commence là où on SAIT (activités Meta / live) : les jours du
    // passé sans budget connu ne s'affichent pas (retour Badr 18/08).
    const tableDays: string[] = [];
    for (let k = NB_JOURS_TABLEAU - 1; k >= 0; k--) tableDays.push(addDaysToDay(today, -k));
    // override > live (jamais l'estimation : le tableau n'affiche que du sûr)
    const budgets = budgetAtDayStart(rawMoves, budgetOverride ?? budgetLive ?? null, tableDays);
    let firstKnown = tableDays.length - 1; // au minimum le jour même
    for (let i = 0; i < tableDays.length; i++) {
      if (budgets[i] !== null) {
        firstKnown = i;
        break;
      }
    }
    const dailyTable: DailyBudgetSpendRow[] = tableDays.slice(firstKnown).map((day, j) => {
      const i = firstKnown + j;
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
    // « dernier budget + date/heure » pour l'affichage compact : l'horodatage
    // du dernier changement Meta ; sans historique, le live sans date.
    const lastMoveActivity = rawMoves.length > 0 ? rawMoves[rawMoves.length - 1] : null;
    const budgetSinceLabel = lastMoveActivity ? fmtParis(lastMoveActivity.eventTime, "dd/MM HH'h'mm") : null;

    // Prescription : UN chiffre.
    let suggestedCents: number | null = null;
    const suggestedMaxCents: number | null = null;
    if (action === "SCALE" && budgetCents !== null) {
      suggestedCents = scaleTargetCents(budgetCents);
    } else if (action === "DESCALE" && budgetCents !== null) {
      suggestedCents = reductionCents(budgetCents);
    }

    // Saturation créative : CPMr de la dernière fenêtre jugée vs médiane des
    // fenêtres précédentes.
    const prevCpmrs = winData.slice(0, Math.max(0, lastIdx)).map((w) => w.cpmr).filter((v): v is number => v !== null);
    const cpmrMed = median(prevCpmrs);
    const cpmrRising = cpmrMed !== null && last.cpmr !== null && last.cpmr > cpmrMed * 1.2;

    const cran: ScalingCampaign["cran"] =
      nonStreak === 0 ? null : rescueCapped ? 3 : (Math.min(nonStreak, 4) as 1 | 2 | 3 | 4);
    const lowSample = last.purchases < MIN_CONVERSIONS_FIABLES;
    const creasRequired = action === "SCALE" || action === "DESCALE" || action === "RESCUE";
    const recentVerdicts = winData.map((w) => w.verdict).filter((v): v is "OUI" | "NON" => v !== null).slice(-4);
    let flips = 0;
    for (let i = 1; i < recentVerdicts.length; i++) if (recentVerdicts[i] !== recentVerdicts[i - 1]) flips++;
    const unstable = flips >= 2;
    const sauvetageDiagnostic = action === "RESCUE" ? diagnoseSauvetage(winData, lastIdx) : null;

    const marginTxt = `${last.margin === null ? "marge non calculable" : `marge ${(last.margin * 100).toFixed(1)} %`}${last.inProgress ? ", fenêtre en cours ⏳" : ""}`;
    const why =
      action === "SCALE"
        ? `OUI sur ${last.label} (${marginTxt} ≥ 15 %) : compteur remis à zéro → SCALE au palier suivant + créas neuves (T35).`
        : action === "HOLD"
          ? `1er NON sur ${last.label} (${marginTxt} < 15 %) : cran 1 → HOLD 24 h, on ne touche pas au budget — l'attribution de la fenêtre se remplit encore (24-72 h) et, si un mouvement récent a eu lieu, Meta ré-explore. Encore < 15 % demain → DESCALE (T35 ; arbitrage Badr 18/08 : le NON compte même sans mouvement récent, sinon une dérive lente ne serait jamais réduite).`
          : action === "DESCALE"
            ? `${nonStreak}ᵉ NON consécutif (${last.label} : ${marginTxt}) : cran ${nonStreak} → DESCALE −15 % + créas neuves (T35/T24).`
            : `${nonStreak} NON consécutifs (dernier : ${last.label}, ${marginTxt}) : escalier épuisé → RESCUE, on ne rabote plus, on diagnostique (T35).`;
    const whyFinal = rescueCapped
      ? `${nonStreak} NON consécutifs (${marginTxt}) MAIS aucune réduction encore exécutée sur Meta : les crans n'ont pas été déroulés → DESCALE −15 % d'abord (RESCUE seulement après avoir réellement bougé le budget).`
      : why;

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
      budgetCents,
      budgetEstimated,
      moves: moves.slice(0, 6),
      budgetSinceLabel,
      dailyTable,
      lowSample,
      cpmrRising,
      creasRequired,
      creaPlan: buildCreaPlan({ action, scalingRegime, cpmrRising, sauvetageDiagnostic }),
      // Diagnostic annonce par annonce : en RESCUE, et dès le cran 3 pour
      // anticiper (un NON de plus et la campagne bascule).
      rescue:
        (action === "RESCUE" || cran === 3) && adRowsByCampaign.has(campaignId)
          ? diagnoseRescue({
              windows: winData,
              lastIdx,
              ads: adRowsByCampaign.get(campaignId) ?? [],
              cm,
              breakEven: th?.breakEven ?? null,
              today,
              windowStartDay: input.adWindowStartDay ?? addDaysToDay(today, -13),
            })
          : null,
      unstable,
      sauvetageDiagnostic,
      scalingRegime,
      why: whyFinal,
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

  return { today, mode: liveDay ? "day" : "night", windowLabels, thresholds, campaigns, warnings };
}

// ---------------------------------------------------------------------------
// Lecture des données (Supabase + Meta live) — même approche que
// buildRoasReport : tout le calcul est dans computeScaling (pur, testé).
// ---------------------------------------------------------------------------

export async function buildScalingReport(
  supabase: SupabaseClient,
  today: string,
  liveDay: boolean = true
): Promise<ScalingReport> {
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

  // Fenêtre du diagnostic annonce : 14 jours (horizon T37 pour les winners).
  // Requêtée APRÈS les insights pour être filtrée sur les seules campagnes
  // retenues (le compte porte 300+ annonces : sans filtre on sature la limite),
  // et triée du plus RÉCENT au plus ancien — une troncature éventuelle doit
  // manger les vieux jours, jamais ceux qui portent la décision.
  const adStartDay = addDaysToDay(today, -13);
  const AD_MAX_ROWS = 20000;
  const campaignIds = [...new Set(rows.map((r) => r.campaignId))];
  const adRes = campaignIds.length
    ? await supabase
        .from("meta_ad_insights")
        .select("day, ad_id, ad_name, campaign_id, spend_cents, purchases, purchase_value_cents, impressions, clicks" + (hasReach ? ", reach" : ""))
        .in("campaign_id", campaignIds)
        .gte("day", adStartDay)
        .lte("day", today)
        .order("day", { ascending: false })
        .order("ad_id", { ascending: true })
        .limit(AD_MAX_ROWS)
    : { data: [], error: null };

  type RawAdRow = {
    day: string;
    ad_id: string;
    ad_name: string | null;
    campaign_id: string | null;
    spend_cents: number | null;
    purchases: number | null;
    purchase_value_cents: number | null;
    impressions: number | null;
    clicks: number | null;
    reach?: number | null;
  };
  const adRows: AdDailyRow[] = adRes.error
    ? []
    : ((adRes.data ?? []) as unknown as RawAdRow[])
        .filter((r) => r.campaign_id)
        .map((r) => ({
          day: String(r.day),
          adId: r.ad_id,
          adName: r.ad_name ?? null,
          campaignId: r.campaign_id as string,
          spendCents: r.spend_cents ?? 0,
          purchases: r.purchases ?? 0,
          purchaseValueCents: r.purchase_value_cents ?? 0,
          impressions: r.impressions ?? 0,
          clicks: r.clicks ?? 0,
          reach: r.reach ?? 0,
        }));
  if (adRes.error) {
    extraWarnings.push("Détail par annonce illisible : le diagnostic de sauvetage reste au niveau campagne.");
  } else if (adRows.length >= AD_MAX_ROWS) {
    extraWarnings.push(
      `Détail par annonce tronqué à ${AD_MAX_ROWS} lignes — le diagnostic de sauvetage peut être incomplet.`
    );
  } else if (adRows.length === 0 && campaignIds.length > 0) {
    extraWarnings.push(
      "Aucune donnée par annonce sur 14 j (synchro des annonces en retard ?) : le diagnostic de sauvetage est indisponible."
    );
  }

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
  // Seuils calculés sur les 14 jours CLOS (un jour partiel fausserait le CM).
  const [productThresholds, liveInfos, activities] = await Promise.all([
    getProductRoasThresholds(liveDay ? addDaysToDay(today, -1) : today).catch(() => null),
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
    liveDay,
    adRows,
    adWindowStartDay: adStartDay,
  });
  report.warnings.push(...extraWarnings);
  return report;
}
