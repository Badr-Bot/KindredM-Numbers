import { unstable_cache } from "next/cache";
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
// LE RÉGIME DÉCIDE DU PROTOCOLE. Le board pose trois phases et prévient :
// « trois phases distinctes, trois protocoles différents, ne jamais les
// mélanger ». Ici deux nous concernent, séparées par les 3 000 €/j (T35
// [05:39] : « dès que les 3K par jour sont atteints, là on passe en phase de
// scaling ; AVANT ÇA, ON N'EST PAS EN PHASE DE SCALING »).
//
// ── PRÉ-SCALING (< 3 000 €/j — toutes les campagnes actuelles) ────────────
// Une seule question, binaire, posée chaque nuit par campagne :
//   « rentable AU BACKEND sur les 2 derniers jours, marge ≥ 15 % ? »
//   (« rentable dans votre poche » : ads − COGS − shipping − frais de
//    processeur, hors OPEX — T35 [02:39-03:00])
// Il n'y a PAS de bande intermédiaire : une fenêtre au-dessus du break-even
// mais sous les 15 % est un NON, et elle consomme un cran.
//
//  • OUI → on monte le budget sur l'échelle : sous 500 €/j → ×2 plafonné à
//    500 (« ×2 si le budget est petit ») ; à partir de 500 → palier par
//    palier 500 → 750 → 1000 → 1500 → 1850 → 2250 → 3000, puis +30 % au-delà
//    (« +20-30 % quand on approche de 3K »). Créas neuves à chaque montée —
//    obligatoire, pas optionnel. Compteur de NON remis à zéro.
//    Pourquoi ×2 et pas +20-30 % à bas budget — T34 [09:59] : « ça sert à
//    rien de mourir entre 300 et 500 à monter à hauteur de 20-30 % » ; à bas
//    spend Meta n'élargit pas le pool d'audience, c'est à partir de 3 000
//    qu'une grosse marche change l'audience et menace la rentabilité.
//  • NON n°1 → on attend 24 h SANS toucher au budget, puis on repose la
//    question.
//  • NON n°2 et n°3 → on réduit de 10-15 % (−15 % ici, haut de la bande) +
//    nouvelles créas à chaque cran.
//  • NON n°4 → phase de SAUVETAGE — RESCUE seulement si les crans ont été
//    RÉELLEMENT déroulés : la série ne compte qu'à partir du premier
//    mouvement de budget vu sur Meta, et il faut au moins une réduction
//    exécutée ; sinon le verdict est plafonné à DESCALE. On ne rabote plus,
//    on diagnostique où ça fuit (cadran T35 [06:47-09:36] / T34 [03:47]) :
//      - CVR ok mais CPC mauvais  → problème CRÉAS (hooks, angles, mécanismes)
//      - CPC ok mais CVR mauvais  → problème FUNNEL (above the fold, Clarity)
//      - CPC et CVR corrects mais marge faible → problème AOV (upsell, bundle)
//      - tout mauvais → big swing (nouvelle LP / offre)
//  • Plancher absolu : 100 €/j (T35 [04:57]).
//
// ── SCALING (≥ 3 000 €/j) ────────────────────────────────────────────────
// Entrée : KPI cible atteint (3 derniers jours + hier). Puis la table de
// marge du board §3 : 0-10 % ne rien faire · 10-15 % hold · 15-30 % scale
// 20-30 % · 30 %+ scale 40-100 %, doubler. Si le KPI n'est pas atteint :
// au-dessus du break-even → stabiliser ; sous le break-even → attendre 72 h,
// puis −10-15 %, et si on est DÉJÀ au spend minimum → sauvetage sans baisser.
// ⚠️ La condition « plus de 70 % de la perf en attribution click-based »
// n'est pas calculable depuis les données du dashboard : l'onglet la SIGNALE
// en warning au lieu de la passer sous silence.
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

// Échelle de montée du pré-scaling (€/j, en cents) — source d'autorité : le board
// Whimsical de la leçon 35, transcrit dans docs/formation/PROTOCOLE-DECISION.md §2
// (« 500 → 750 → 1000 → 1500 → 1850 → 2250 → 3000 »). L'audio de T35 [05:18] dit
// « 1800, 2000 » : c'est la transcription Whisper qui déforme, le schéma fait foi
// (consigne MEMO du 18/08 : réaligner si le board dit autre chose que l'audio).
// Au-delà du dernier palier : +30 % (« plus 30 % si vous êtes près des 3000 »).
export const MONTEE_PALIERS_CENTS = [50000, 75000, 100000, 150000, 185000, 225000, 300000];
export const PLANCHER_BUDGET_CENTS = 10000;
/** Seuil du régime SCALING (T35 [06:02] « dès que les 3K/jour sont atteints »). */
export const SEUIL_SCALING_CENTS = 300000;
/** Réduction par défaut des crans 2 et 3 : −15 % (T24 [16:54], prioritaire ;
 * bande 10-15 % chez T35 [19:09]). */
export const REDUCTION_DEFAUT = 0.15;
/** Marge nette qui fait basculer OUI/NON (T35 [03:44] « 15 % de marge minimum »). */
export const SEUIL_OUI = 0.15;
/** Départ officiel du protocole T24 (Badr, 19/08 : « on démarre ce nouveau
 * protocole à partir d'aujourd'hui ») : les fenêtres closes AVANT ce jour ne
 * comptent dans AUCUNE série de perte — départ propre, les verdicts rendus
 * sous l'ancien barème ne pénalisent personne. */
export const PROTOCOLE_T24_START_DAY = "2026-08-19";

/** Bandes de la table de marge du board §3 (RÉGIME SCALING, ≥ 3 000 €/j) :
 * 0-10 ne rien faire · 10-15 hold · 15-30 scale 20-30 % · 30+ scale 40-100 %. */
export const BANDE_STABLE_MAX = 0.10;
export const BANDE_LIGHT_MAX = 0.15;
export const BANDE_TOP_MIN = 0.30;

export type MarginBand = "PERTE" | "STABLE" | "LIGHT" | "GOOD" | "TOP";

/** La bande T24 d'une fenêtre jugée. PERTE = sous le break-even. */
export function marginBand(margin: number | null, roas: number | null, breakEven: number | null): MarginBand | null {
  if (roas === null) return null;
  if (roas === 0) return "PERTE";
  if (breakEven !== null && roas < breakEven) return "PERTE";
  if (margin === null) return null; // cm incalculable : pas de bande
  if (margin < BANDE_STABLE_MAX) return "STABLE";
  if (margin < BANDE_LIGHT_MAX) return "LIGHT";
  if (margin <= BANDE_TOP_MIN) return "GOOD";
  return "TOP";
}
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
  /** Bande du barème T24 (PERTE/STABLE/LIGHT/GOOD/TOP). null = injugeable. */
  band: MarginBand | null;
  /** NON = fenêtre EN PERTE (sous le break-even, T24 [16:54] — c'est elle qui
   * avance les crans). OUI = rentable backend. null = injugeable. */
  verdict: "OUI" | "NON" | null;
  /** CPMr = CPM × fréquence — l'indicateur de saturation créative. */
  cpmr: number | null;
  cpcCents: number | null;
  cvr: number | null;
}

export type ScalingAction = "SCALE" | "HOLD" | "DESCALE" | "RESCUE";
/** Déclinaison de la montée (T24 [17:15-17:36]) : LIGHT = +10 % (10-15 %),
 * LADDER = palier/×2 plafonné (15-30 %), DOUBLE = ×2 (> 30 %). */
/** LADDER = montée sur l'échelle (§2) · DOUBLE = bande 30 %+ du §3. */
export type ScaleKind = "LADDER" | "DOUBLE";

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
  /** < 6 ventes mais très bon ROAS (marge ≥ 15 %, T37 [05:12] « moins de six
   * mais un très bon ROAS… vous pouvez les injecter ») → signal précoce. */
  earlySignal: boolean;
  /** Nom contenant WIN/POT : déjà marquée et dispatchée UNE FOIS (T37
   * [03:05], [05:57]) — on ne la re-recommande jamais. */
  alreadyMarked: boolean;
  /** CPM ou fréquence en forte hausse sur la 2ᵉ moitié de la fenêtre. */
  saturating: boolean;
  /** ≥ 6 ventes mais SOUS le break-even (T37 [05:33]) → à injecter dans la
   * campagne ZOMBIE. On ne coupe jamais une annonce qui tourne : la formation
   * la déplace, elle ne la supprime pas (arbitrage Badr 19/08). */
  toZombie: boolean;
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
  /** La prescription courante a DÉJÀ été exécutée sur Meta (mouvement dans le
   * bon sens depuis la clôture de la fenêtre jugée) : on affiche « appliqué »
   * au lieu de re-prescrire un 2ᵉ mouvement depuis le budget déjà bougé. */
  applied: boolean;
  appliedLabel: string | null;
  /** Déclinaison de la montée : LIGHT +10 % · LADDER palier · DOUBLE ×2. */
  scaleKind: ScaleKind | null;
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
  /** true = série de NON complète MAIS aucune réduction exécutée : RESCUE
   * plafonné à DESCALE (les crans n'ont pas été déroulés). */
  rescueCapped: boolean;
  /** Diagnostic annonce par annonce — rempli en RESCUE et au cran 3 (juste
   * avant de basculer), calculé côté serveur depuis meta_ad_insights. */
  rescue: RescueDiagnostic | null;
  unstable: boolean;
  sauvetageDiagnostic: string | null;
  scalingRegime: boolean;
  why: string;
  /** Le dernier jour de la fenêtre jugée est SEUL en perte alors que la
   * fenêtre (jour + veille additionnés) reste bonne — affiché pour expliquer
   * un SCALE avec un jour rouge (remarque Badr 19/08, campagne Lancaster). */
  dayAloneNote: string | null;
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
    // arrondi à l'euro, comme la réduction — pas de 255,98 € dans le JSON
    return Math.min(Math.round((budgetCents * 2) / 100) * 100, MONTEE_PALIERS_CENTS[0]);
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
  days: string[],
  /** true (défaut) = le dernier jour est le jour calendaire réel → budget
   * live. En mode nuit le « dernier jour » est HIER : il doit porter le
   * budget auquel il a TOURNÉ, pas celui d'après l'exécution de minuit. */
  applyLiveToLast: boolean = true
): (number | null)[] {
  return days.map((day, idx) => {
    const isLast = idx === days.length - 1;
    if (isLast && applyLiveToLast && currentBudgetCents !== null) return currentBudgetCents;
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

/** Répare les trous des activités Meta (extra_data parfois sans ancienne ou
 * nouvelle valeur) : la NOUVELLE d'un mouvement se déduit de l'ANCIENNE du
 * suivant (le budget n'a pas bougé entre deux mouvements), celle du dernier
 * = le budget live ; l'ANCIENNE d'un mouvement = la NOUVELLE du précédent.
 * « Je ne veux pas voir des points d'interrogation alors que tu connais le
 * dernier changement de budget » (Badr 19/08). Jamais de valeur inventée :
 * uniquement des déductions de la chaîne réelle. */
export function repairMoves<T extends { oldBudgetCents: number | null; newBudgetCents: number | null }>(
  moves: T[],
  liveBudgetCents: number | null
): T[] {
  const out = moves.map((m) => ({ ...m }));
  for (let i = out.length - 1; i >= 0; i--) {
    if (out[i].newBudgetCents === null) {
      out[i].newBudgetCents = i + 1 < out.length ? out[i + 1].oldBudgetCents : liveBudgetCents;
    }
  }
  for (let i = 0; i < out.length; i++) {
    if (out[i].oldBudgetCents === null && i > 0) out[i].oldBudgetCents = out[i - 1].newBudgetCents;
  }
  return out;
}

/** Cadran de la phase de sauvetage (T35 [06:47-09:36]) — CPC et CVR de la
 * dernière fenêtre JUGÉE comparés à l'historique de la campagne elle-même
 * (la formation lit ce cadran à l'œil, sans seuil absolu : on prend ±20 %,
 * paramètre ⚠️ hors formation, assumé comme tel).
 *
 * SOURCE UNIQUE : le même cadran alimente le verdict campagne, le diagnostic
 * annonce (diagnoseRescue) et le plan créas (buildCreaPlan) — deux cadrans
 * séparés avaient divergé (audit 19/08 : « problème AOV » affiché à côté de
 * « seuils incalculables »). */
export function computeCadran(
  windows: ScalingWindow[],
  lastIdx: number,
  cm: number | null
): { leak: RescueLeak; verdict: string } {
  const last = windows[lastIdx];
  if (cm === null) {
    return {
      leak: "INSUFFISANT",
      verdict:
        "Seuils produit incalculables (pas de commandes récentes sur ce produit ?) : ni marge, ni winner, ni cadran fiables — vérifier les données avant de décider.",
    };
  }
  if (last.cpcCents === null && last.cvr === null) {
    return {
      leak: "INSUFFISANT",
      verdict:
        "Fenêtre sans clics mesurés : données insuffisantes pour le cadran CPC × CVR — vérifier la diffusion avant de diagnostiquer.",
    };
  }
  const prevCpcs = windows.slice(0, lastIdx).map((w) => w.cpcCents).filter((v): v is number => v !== null);
  const prevCvrs = windows.slice(0, lastIdx).map((w) => w.cvr).filter((v): v is number => v !== null);
  const cpcMed = median(prevCpcs);
  const cvrMed = median(prevCvrs);
  const cpcBad = last.cpcCents !== null && cpcMed !== null && last.cpcCents > cpcMed * 1.2;
  const cvrBad = last.cvr !== null && cvrMed !== null && last.cvr < cvrMed * 0.8;
  if (cpcBad && cvrBad)
    return {
      leak: "BIG_SWING",
      verdict:
        "CPC en hausse ET CVR en baisse vs l'historique → tout fuit : big swing (nouvelle LP / offre) SANS attendre — « on ne va pas passer cinq jours, on change tout direct » (T35 [11:21]). Si un compétiteur scale toujours, c'est qu'on fait une erreur → on corrige d'abord ; couper seulement si le big swing ne sauve pas.",
    };
  if (cpcBad)
    return {
      leak: "CREAS",
      verdict: "CVR tient mais le CPC dérape vs l'historique → problème CRÉAS : nouveaux hooks, nouveaux angles, nouveaux mécanismes (T35).",
    };
  if (cvrBad)
    return {
      leak: "FUNNEL",
      verdict: "CPC tient mais le CVR chute vs l'historique → problème FUNNEL : revoir l'above-the-fold, objections, Microsoft Clarity (T35).",
    };
  return {
    leak: "AOV",
    verdict: "CPC et CVR dans les normes de la campagne mais marge insuffisante → problème AOV : upsells, bundles, e-mails (T35).",
  };
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
    // Critère T37 [05:33] tel quel : ≥ 6 ventes ET sous le break-even →
    // direction ZOMBIE. Aucun seuil de dépense inventé, aucun « couper ».
    // On exige seulement qu'elle diffuse encore (une annonce déjà éteinte
    // n'a rien à dispatcher).
    const stillRunning = lastDay >= last.startDay;
    const toZombie =
      stillRunning && purchases >= 6 && roas !== null && breakEven !== null && roas < breakEven;

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
      // Seuils winner/potential/signal : T37 [01:08], [04:28], [05:12].
      winner: purchases >= 6 && margin !== null && margin >= 0.1,
      potentialWinner:
        purchases >= 6 && margin !== null && margin < 0.1 && roas !== null && breakEven !== null && roas >= breakEven,
      earlySignal: purchases > 0 && purchases < 6 && margin !== null && margin >= 0.15,
      alreadyMarked: /\bwin\b|\bpot\b|winner|potential/i.test(sorted[sorted.length - 1].adName ?? ""),
      saturating,
      toZombie,
    });
  }
  adDiags.sort((a, b) => b.spendCents - a.spendCents);

  // --- 2. Le cadran, sur l'historique de la campagne ---
  const prevCpcs = windows.slice(0, lastIdx).map((w) => w.cpcCents).filter((v): v is number => v !== null);
  const prevCvrs = windows.slice(0, lastIdx).map((w) => w.cvr).filter((v): v is number => v !== null);
  const cpcMed = median(prevCpcs);
  const cvrMed = median(prevCvrs);

  const evidence: string[] = [];
  const eur = (c: number) => `${(c / 100).toFixed(2).replace(".", ",")} €`;
  if (last.cpcCents !== null && cpcMed !== null) {
    const delta = Math.round((last.cpcCents / cpcMed - 1) * 100);
    evidence.push(`CPC ${eur(last.cpcCents)} vs ${eur(cpcMed)} médian (${delta >= 0 ? "+" : ""}${delta} %)`);
  }
  if (last.cvr !== null && cvrMed !== null) {
    const delta = Math.round((last.cvr / cvrMed - 1) * 100);
    evidence.push(
      `CVR ${(last.cvr * 100).toFixed(2).replace(".", ",")} % vs ${(cvrMed * 100).toFixed(2).replace(".", ",")} % médian (${delta >= 0 ? "+" : ""}${delta} %)`
    );
  }
  const saturated = adDiags.filter((a) => a.saturating);
  if (saturated.length > 0) evidence.push(`${saturated.length} annonce(s) en saturation (CPM/fréquence en hausse)`);
  // T37 [05:57] : une ad marquée WIN/POT a déjà été dispatchée UNE FOIS —
  // on ne la re-recommande pas à chaque chargement.
  const fresh = adDiags.filter((a) => !a.alreadyMarked);
  const zombies = fresh.filter((a) => a.toZombie);
  if (zombies.length > 0) {
    evidence.push(`${zombies.length} annonce(s) sous le break-even avec ≥ 6 ventes → campagne ZOMBIE`);
  }

  const { leak, verdict } = computeCadran(windows, lastIdx, cm);
  if (cm === null) {
    evidence.push("Marge de contribution indisponible : aucune annonce ne peut être classée winner");
  }

  // --- 3. Le plan, priorisé, avec les annonces nommées ---
  const plan: string[] = [];
  const nameOf = (a: AdDiagnostic) => (a.adName.length > 42 ? a.adName.slice(0, 42) + "…" : a.adName);
  if (zombies.length > 0) {
    plan.push(
      `Dispatche en campagne ZOMBIE (≥ 6 ventes mais sous le break-even) : ${zombies.slice(0, 3).map(nameOf).join(", ")} — on ne coupe pas, on déplace (T37 [05:33]).`
    );
  }
  const winners = fresh.filter((a) => a.winner);
  const potentials = fresh.filter((a) => a.potentialWinner);
  const signals = fresh.filter((a) => a.earlySignal);
  // ⚠️ T37 [01:32] réserve le dispatch winners au passage ABO → CBO : « si
  // vous êtes en CBO il n'y aura rien à faire, vos ads seront déjà là ». En
  // compte 100 % CBO (< 3 000 €/j), les gagnantes sont donc seulement
  // ÉTIQUETÉES (visibilité), jamais « à dupliquer » — seule l'injection
  // ZOMBIE s'applique en CBO (T37 [01:59-02:21]).
  if (winners.length > 0) {
    evidence.push(
      `${winners.length} winner(s) (≥ 6 ventes, ≥ 10 % de marge) — déjà dans la CBO, rien à dupliquer (T37 [01:32]) : marque-les WIN <mois> <semaine>.`
    );
  }
  if (potentials.length > 0 || signals.length > 0) {
    evidence.push(
      `${potentials.length + signals.length} annonce(s) à surveiller : potential winners et signaux précoces (< 6 ventes mais marge ≥ 15 %, T37 [05:12]).`
    );
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
  /** Cadran calculé UNE fois (computeCadran) — jamais de sniffing de texte. */
  leak: RescueLeak | null;
}): string[] {
  const { action, scalingRegime, cpmrRising } = input;
  const where = scalingRegime
    ? "Campagne ABO testing dédiée (~20 % du budget) : nouvel adset par batch, budget ≈ 2-2,5 × CPA, décision à 2-3 j (T36 [02:28-02:48])."
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
        (cpmrRising ? " — priorité aux HOOKS : le CPMr monte, l'audience sature (T24 [10:16])." : " (T36)."),
      setup,
    ];
  }
  // RESCUE : le focus dépend du cadran (T35 [06:47-09:36])
  if (input.leak === "INSUFFISANT")
    return [
      "Données insuffisantes (seuils produit ou clics manquants) : vérifier la diffusion et la synchro AVANT tout plan — on ne lance rien à l'aveugle.",
    ];
  if (input.leak === "CREAS")
    return [
      "Le cadran pointe les CRÉAS : batch complet 3-6 ads avec nouveaux HOOKS, nouveaux ANGLES, nouveaux MÉCANISMES — pas des variantes de l'existant (T35 [06:47]).",
      where,
      setup,
    ];
  if (input.leak === "FUNNEL")
    return [
      "Le cadran pointe le FUNNEL : le focus est la LP (above-the-fold, objections, Microsoft Clarity) — les créas continuent en fond (« toujours ajouter », T35 [08:13]) mais ce n'est pas là que ça fuit.",
    ];
  if (input.leak === "AOV")
    return [
      "Le cadran pointe l'AOV : upsells, bundles, e-mails d'abord (T35 [08:33-09:15]) — les créas continuent en fond, le déblocage est dans l'offre.",
    ];
  return [
    "Tout fuit (big swing) : nouvelle LP voire nouvelle offre, ET batch complet nouveaux hooks/angles/mécanismes — re-analyse les compétiteurs (T35 [10:17-10:59]).",
    where,
  ];
}

/** Crans sur les fenêtres EN PERTE (T24 [16:54] : « après 2 jours
 * consécutifs », jamais au 1er rouge → 1re perte = HOLD ; escalier T35
 * ensuite). Hors perte, l'action vient de la bande (voir actionFromBand). */
function actionFromStreak(nonStreak: number): ScalingAction {
  return nonStreak === 0 ? "SCALE" : nonStreak === 1 ? "HOLD" : nonStreak <= 3 ? "DESCALE" : "RESCUE";
}

/** Table de marge du board §3 — RÉGIME SCALING UNIQUEMENT (≥ 3 000 €/j). */
function actionFromBand(band: MarginBand): { action: ScalingAction; scaleKind: ScaleKind | null } {
  if (band === "STABLE") return { action: "HOLD", scaleKind: null }; // 0-10 % : « ne rien faire, on stabilise »
  if (band === "LIGHT") return { action: "HOLD", scaleKind: null }; // 10-15 % : « Hold (scale 10-20 % max) »
  if (band === "TOP") return { action: "SCALE", scaleKind: "DOUBLE" }; // 30 %+ : « scale 40-100 %, doubler »
  return { action: "SCALE", scaleKind: "LADDER" }; // 15-30 % : « scale 20-30 % »
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
  /** Plancher du comptage des pertes : les fenêtres finissant AVANT ce jour
   * ne comptent pas (départ du protocole). null = pas de plancher (tests). */
  protocolStartDay?: string | null;
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
      const band = marginBand(margin, roas, th?.breakEven ?? null);
      // Verdict : LA question pivot du board (§2) — « rentable au backend sur
      // les 2 derniers jours, marge ≥ 15 % ? ». OUI ou NON, rien entre les
      // deux : une fenêtre au-dessus du break-even mais sous les 15 % est un
      // NON et consomme un cran d'escalier. `zoneFor` porte déjà ce seuil
      // (SEUIL_OUI) — une seule définition du « rentable » pour la couleur de
      // la fenêtre et pour le verdict. nodata (cm incalculable, ROAS absent)
      // ne tranche rien : surtout pas un faux NON qui fabriquerait un RESCUE.
      const verdict: "OUI" | "NON" | null = zone === "nodata" ? null : zone === "over" ? "OUI" : "NON";
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
        band,
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
    // NB : les activités sont lues sur ~16 j ; si le premier mouvement date
    // de plus loin, l'ancre est simplement plus récente que la réalité —
    // conservateur (jamais un RESCUE de trop).
    // Un mouvement exécuté dans la plage nocturne (00h-07h) répond à la
    // décision de la VEILLE : son jour d'ancrage est le jour de décision
    // (même règle que la bascule 7 h), sinon l'exécution elle-même
    // effacerait le streak qu'elle vient de sanctionner (audit 19/08).
    const moveAnchorDay = (m: CampaignActivity) =>
      decisionDayFor(toParisDay(m.eventTime), Number(fmtParis(m.eventTime, "H")));
    // Chaîne réparée : plus de « ? » quand la valeur se déduit du mouvement
    // voisin ou du budget live (Badr 19/08).
    const rawMovesForAnchor = repairMoves(movesByCampaign.get(campaignId) ?? [], liveInfo?.dailyBudgetCents ?? null);
    const moveAnchor = rawMovesForAnchor.length > 0 ? moveAnchorDay(rawMovesForAnchor[0]) : null;
    // Double plancher : le premier mouvement réel ET le départ officiel du
    // protocole T24 — le plus récent des deux gagne.
    const startFloor = input.protocolStartDay ?? null;
    const anchorDay =
      moveAnchor !== null && startFloor !== null
        ? (moveAnchor > startFloor ? moveAnchor : startFloor)
        : (moveAnchor ?? startFloor);
    // Budget : override > live Meta > dernier changement connu > estimation.
    const budgetOverride = overrides?.[campaignId];
    const budgetLive = liveInfo?.dailyBudgetCents ?? null;
    // Le dernier changement de budget lu sur Meta fait foi quand le live
    // manque — jamais un « ? » alors qu'on connaît le dernier mouvement.
    const lastMoveBudget = [...rawMovesForAnchor].reverse().find((m) => m.newBudgetCents !== null)?.newBudgetCents ?? null;
    const maxDailySpend = Math.max(0, ...[...entry.days.values()].map((d) => d.spendCents));
    const budgetCents = budgetOverride ?? budgetLive ?? lastMoveBudget ?? (maxDailySpend > 0 ? maxDailySpend : null);
    const budgetEstimated = budgetOverride === undefined && budgetLive === null && lastMoveBudget === null;
    // Le régime décide du protocole appliqué : on ne le fait JAMAIS basculer sur
    // un budget deviné à partir du spend max. Sans budget lu sur Meta, on reste
    // en pré-scaling (le régime prudent) et on le signale (audit 20/08).
    const scalingRegime = budgetCents !== null && !budgetEstimated && budgetCents >= SEUIL_SCALING_CENTS;
    const regimeIncertain = budgetCents !== null && budgetEstimated && budgetCents >= SEUIL_SCALING_CENTS;

    const streak = streakOf(winData, anchorDay);
    const lastIdx = streak.lastIdx;
    const last = winData[lastIdx];
    // La fenêtre jugée EST le cran courant : si elle est un NON, on est au
    // minimum au cran 1, même quand l'ancre tronque tout ce qui précède.
    // Sans ça, une série entièrement antérieure au départ du protocole rendait
    // nonStreak = 0 → SCALE, c'est-à-dire une HAUSSE de budget prescrite sur
    // une campagne en perte (audit 20/08).
    const nonStreak = last?.verdict === "NON" ? Math.max(1, streak.nonStreak) : streak.nonStreak;
    // LE RÉGIME DÉCIDE DU PROTOCOLE (board §« identifier la phase » : trois
    // phases, trois protocoles, ne jamais les mélanger).
    //  • PRÉ-SCALING (< 3 000 €/j) : la question est binaire (« rentable au
    //    backend sur les 2 derniers jours, marge ≥ 15 % ? »). OUI → on monte
    //    par l'échelle ; NON → l'escalier (attendre · −15 % · −15 % ·
    //    sauvetage). Aucune bande de marge n'intervient.
    //  • SCALING (≥ 3 000 €/j) : là seulement s'applique la table de marge du
    //    board §3 (0-10 rien · 10-15 hold · 15-30 +20-30 % · 30+ doubler).
    let action = actionFromStreak(nonStreak);
    let scaleKind: ScaleKind | null = action === "SCALE" ? "LADDER" : null;
    // « Au plancher » n'est affirmé que sur un budget RÉELLEMENT lu sur Meta :
    // un budget estimé depuis le spend vaut souvent le spend d'une journée
    // faible et ferait croire à tort qu'on ne peut plus descendre.
    const atFloor = budgetCents !== null && !budgetEstimated && budgetCents <= PLANCHER_BUDGET_CENTS;
    if (scalingRegime && last.band !== null) {
      if (nonStreak === 0) {
        // KPI cible atteint → table de marge du board §3.
        const fromBand = actionFromBand(last.band);
        action = fromBand.action;
        scaleKind = fromBand.scaleKind;
      } else if (last.band !== "PERTE") {
        // « Est-on SOUS le KPI breakeven ? NON → ne rien faire, stabiliser. »
        action = "HOLD";
        scaleKind = null;
      } else {
        // Sous le break-even : 72 h d'abord (3 fenêtres), puis −15 % ; et si on
        // est DÉJÀ au spend minimum, sauvetage — « ne PAS baisser le spend ».
        // Le board ne chiffre pas le « spend quotidien minimum » du §3 : on
        // n'invente pas de seuil. Le sauvetage reste atteignable sans ça — les
        // −15 % successifs font repasser sous 3 000 €/j, et l'escalier du §2
        // (qui, lui, finit en sauvetage au cran 4) reprend la main.
        action = nonStreak < 3 ? "HOLD" : atFloor ? "RESCUE" : "DESCALE";
        scaleKind = null;
      }
    }
    // RESCUE exige au moins une réduction RÉELLEMENT exécutée sur Meta ;
    // sinon on plafonne à DESCALE (les crans n'ont pas été déroulés).
    let rescueCapped = false;
    if (action === "RESCUE") {
      // La réduction exécutée doit dater du streak COURANT (depuis la 1re
      // fenêtre NON de la série) — une descale d'un streak passé, déjà
      // remise à zéro par un OUI, ne compte pas (audit 19/08).
      const streakStartDay = winData[Math.max(0, lastIdx - nonStreak + 1)].startDay;
      const hasExecutedDecrease =
        activities !== null &&
        rawMovesForAnchor.some(
          (m) =>
            m.oldBudgetCents !== null &&
            m.newBudgetCents !== null &&
            m.newBudgetCents < m.oldBudgetCents &&
            moveAnchorDay(m) >= streakStartDay
        );
      // Exception : au plancher, le budget ne PEUT plus baisser (reductionCents
      // rend 100 €). Exiger une réduction exécutée y bloquerait le sauvetage
      // pour toujours — les crans ont bien été déroulés, ils n'ont juste plus
      // de marge de manœuvre (audit 20/08).
      if (activities !== null && !hasExecutedDecrease && !atFloor) {
        action = "DESCALE";
        rescueCapped = true;
      }
    }

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
    const budgets = budgetAtDayStart(rawMoves, budgetOverride ?? budgetLive ?? lastMoveBudget ?? null, tableDays, liveDay);
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

    // Application déjà faite ? Un mouvement dans le sens prescrit depuis la
    // clôture de la fenêtre jugée (21 h le soir de son dernier jour — les
    // exécutions réelles vont de 23 h à 7 h). Sans ça, un rechargement après
    // exécution re-prescrivait un 2ᵉ −15 % depuis le budget déjà réduit
    // (bug relevé à l'audit 19/08).
    const executedSince = `${last.endDay} 21:00`;
    const executedMove =
      action === "SCALE" || action === "DESCALE"
        ? rawMovesForAnchor.find(
            (m) =>
              m.oldBudgetCents !== null &&
              m.newBudgetCents !== null &&
              Math.sign(m.newBudgetCents - m.oldBudgetCents) === (action === "SCALE" ? 1 : -1) &&
              fmtParis(m.eventTime, "yyyy-MM-dd HH:mm") >= executedSince
          ) ?? null
        : null;
    const applied = executedMove !== null;
    const appliedLabel = executedMove
      ? `${executedMove.oldBudgetCents !== null ? Math.round(executedMove.oldBudgetCents / 100) : "?"} € → ${
          executedMove.newBudgetCents !== null ? Math.round(executedMove.newBudgetCents / 100) : "?"
        } € à ${fmtParis(executedMove.eventTime, "HH'h'mm")}`
      : null;

    // Prescription : UN chiffre — calculée sur le budget d'AVANT exécution
    // quand le mouvement a déjà été fait (sinon on cascade les -15 %).
    const basisCents = executedMove?.oldBudgetCents ?? budgetCents;
    let suggestedCents: number | null = null;
    if (action === "SCALE" && basisCents !== null) {
      if (scaleKind === "DOUBLE") {
        // Régime SCALING, bande 30 %+ : « scale 40-100 %, on peut doubler le
        // budget » (board §3). AUCUN plafond : cette bande n'existe qu'à
        // partir de 3 000 €/j, et la source double justement à partir de là
        // (T35 [15:23] : « la Hero, 3K, je passe à 5K »). Le plafond au seuil
        // de régime qui traînait ici faisait prescrire une BAISSE — un budget
        // de 4 000 €/j « doublé » retombait à 3 000 (audit 20/08).
        suggestedCents = Math.round((basisCents * 2) / 100) * 100;
      } else {
        suggestedCents = scaleTargetCents(basisCents);
      }
    } else if (action === "DESCALE" && basisCents !== null) {
      suggestedCents = reductionCents(basisCents);
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
    const cadran = action === "RESCUE" ? computeCadran(winData, lastIdx, cm) : null;
    const sauvetageDiagnostic = cadran?.verdict ?? null;

    const marginTxt = `${last.margin === null ? "marge non calculable" : `marge ${(last.margin * 100).toFixed(1).replace(".", ",")} %`}${last.inProgress ? ", fenêtre en cours ⏳" : ""}`;
    const why =
      action === "SCALE"
        ? scaleKind === "DOUBLE"
          ? `Régime SCALING, marge > 30 % sur ${last.label} (${marginTxt}) → « scale 40-100 %, on peut doubler le budget » + créas neuves (board §3).`
          : scalingRegime
            ? `Régime SCALING, marge entre 15 et 30 % sur ${last.label} (${marginTxt}) → « scale 20-30 % » + créas neuves (board §3).`
            : `OUI sur ${last.label} (${marginTxt} ≥ 15 %) : rentable au backend sur les 2 derniers jours → on monte le budget sur l'échelle (×2 si petit) + créas neuves (board §2).`
        : action === "HOLD"
          ? scalingRegime
            ? last.band !== "PERTE"
              ? `Régime SCALING : au-dessus du break-even mais sous la cible sur ${last.label} (${marginTxt}) → « ne rien faire, on stabilise » (board §3).`
              : `Régime SCALING, sous le break-even sur ${last.label} (${marginTxt}) → on attend d'abord 72 h avant de toucher au budget (board §3). ${nonStreak} fenêtre(s) sur 3.`
            : `1er NON sur ${last.label} (${marginTxt}, sous les 15 %) → cran 1 de l'escalier : on attend 24 h SANS toucher au budget, puis on repose la question (board §2). Encore NON demain → −15 % + créas. (L'attribution de la fenêtre se remplit encore en 24-72 h.)`
          : action === "DESCALE"
            ? scalingRegime
              ? `Régime SCALING : sous le break-even depuis plus de 72 h (${last.label} : ${marginTxt}) et le spend minimum n'est pas atteint → −15 % (board §3).`
              : `${nonStreak}ᵉ NON consécutif (${last.label} : ${marginTxt}) → cran ${nonStreak} de l'escalier : −15 % + nouvelles créas (board §2).`
            : scalingRegime
              ? `Régime SCALING : sous le break-even depuis plus de 72 h ET déjà au spend minimum (${last.label} : ${marginTxt}) → on ne baisse PLUS le spend, phase de SAUVETAGE (board §3).`
              : `${nonStreak} NON consécutifs (dernier : ${last.label}, ${marginTxt}) : l'escalier est épuisé → phase de SAUVETAGE, on ne rabote plus, on diagnostique où ça fuit (board §2 → §1).`;
    const whyFinal = rescueCapped
      ? `${nonStreak} NON consécutifs (${marginTxt}) MAIS aucune réduction encore exécutée sur Meta : les crans n'ont pas été déroulés → DESCALE −15 % d'abord (RESCUE seulement après avoir réellement bougé le budget).`
      : why;

    if (scalingRegime) {
      warnings.push(
        `${entry.name} : budget ≥ 3 000 €/j → régime SCALING, la table de marge du board §3 s'applique. ` +
          "Une condition n'est PAS vérifiable ici : « plus de 70 % de la perf vient de l'attribution click-based ? » " +
          "(board §3) — à contrôler à la main dans Meta (colonnes → Vue et attribution) avant d'exécuter la montée."
      );
    }
    if (regimeIncertain) {
      warnings.push(
        `${entry.name} : le budget (${Math.round((budgetCents ?? 0) / 100)} €/j) est ESTIMÉ depuis le spend, pas lu sur Meta — ` +
          "il dépasse les 3 000 €/j mais on reste volontairement au protocole de pré-scaling. " +
          "Renseigne le budget réel pour que le régime bascule."
      );
    }

    // Divergence jour/fenêtre : le DERNIER JOUR de la fenêtre jugée est seul
    // en perte alors que la fenêtre (jour + veille ADDITIONNÉS, T24 [16:32])
    // reste bonne → on l'affiche pour que le SCALE ne ressemble pas à une
    // erreur (« Lancaster dit SCALE alors qu'elle perd aujourd'hui », Badr
    // 19/08). Aucune décision changée : la fenêtre reste l'unité de jugement.
    let dayAloneNote: string | null = null;
    if (action === "SCALE") {
      const dayRow = entry.days.get(last.endDay);
      const daySpend = dayRow?.spendCents ?? 0;
      const dayRoas = dayRow && daySpend > 0 ? dayRow.purchaseValueCents / daySpend : null;
      const dayMargin = dayRoas !== null && dayRoas > 0 && cm !== null ? cm - 1 / dayRoas : null;
      const dayBand = marginBand(dayMargin, dayRoas, th?.breakEven ?? null);
      if (dayBand === "PERTE") {
        const dd = `${last.endDay.slice(8, 10)}/${last.endDay.slice(5, 7)}`;
        dayAloneNote =
          `Le ${dd} seul est EN PERTE${dayMargin !== null ? ` (marge ${(dayMargin * 100).toFixed(1).replace(".", ",")} %)` : ""} — ` +
          `le verdict reste SCALE parce que la fenêtre jugée additionne jour + veille et reste bonne (T24 [16:32]).` +
          (last.inProgress
            ? " Fenêtre en cours : si la journée reste rouge, le verdict basculera d'ici la décision de minuit — ne pas exécuter le scale avant (T24 [16:11])."
            : "");
      }
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
      scaleKind,
      applied,
      appliedLabel,
      budgetCents,
      budgetEstimated,
      moves: moves.slice(0, 6),
      budgetSinceLabel,
      dailyTable,
      lowSample,
      cpmrRising,
      creasRequired,
      creaPlan: buildCreaPlan({ action, scalingRegime, cpmrRising, leak: cadran?.leak ?? null }),
      rescueCapped,
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
      dayAloneNote,
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

// P4 (audit perf) — les 2 appels Meta live, cachés 60 s : les budgets et
// activités ne bougent que quand Badr les bouge ; 60 s de retard est
// invisible pour une décision nocturne, et le tag « meta-live » est invalidé
// par le bouton Actualiser. ⚠️ unstable_cache sérialise en JSON : la Map de
// fetchCampaignLiveInfos passe par un tableau d'entrées.
const fetchCampaignLiveInfosCached = unstable_cache(
  async () => {
    const { fetchCampaignLiveInfos } = await import("./meta");
    return [...(await fetchCampaignLiveInfos())];
  },
  ["meta-live-infos"],
  { revalidate: 60, tags: ["meta-live"] }
);
const fetchCampaignActivitiesCached = unstable_cache(
  async (sinceDay: string) => {
    const { fetchCampaignActivities } = await import("./meta");
    return fetchCampaignActivities(sinceDay);
  },
  ["meta-activities"],
  { revalidate: 60, tags: ["meta-live"] }
);
// Insights du JOUR en DIRECT sur Meta. Le cron n'écrit meta_insights qu'à
// 01h05 Paris : sans ce fetch, la fenêtre « hier + aujourd'hui » jugeait
// hier tout seul pendant la journée — bug Lancaster (Badr 19/08) : SCALE
// affiché alors que la campagne perdait de l'argent le jour même, parce que
// le jour même était absent des données. Cache 5 min, invalidé par
// Actualiser (tag meta-live). Même parsing que le sync (fetchMetaInsights).
const fetchTodayInsightsCached = unstable_cache(
  async (day: string) => {
    const { fetchMetaInsights } = await import("./meta");
    return fetchMetaInsights(day, day);
  },
  ["meta-today-insights"],
  { revalidate: 300, tags: ["meta-live"] }
);

// P2 (audit perf) — la sonde « reach » ne peut pas régresser dans la vie d'un
// process (un schéma migré le reste) : on ne re-sonde que tant qu'elle n'a
// pas répondu vrai. Économise 1 aller-retour séquentiel à chaque chargement.
let hasReachMemo: boolean | null = null;

export async function buildScalingReport(
  supabase: SupabaseClient,
  today: string,
  liveDay: boolean = true
): Promise<ScalingReport> {
  const startDay = addDaysToDay(today, -(NB_FENETRES + NB_JOURS_TABLEAU));

  // P1 (audit perf) — seuils produit + Meta live ne dépendent d'AUCUNE lecture
  // Supabase ci-dessous : lancés immédiatement, leur latence (Meta : 0,3-2 s)
  // est recouverte par la chaîne Supabase au lieu de s'y additionner.
  const sidePromise = import("./analytics").then(({ getProductRoasThresholds }) =>
    Promise.all([
      getProductRoasThresholds(liveDay ? addDaysToDay(today, -1) : today).catch(() => null),
      fetchCampaignLiveInfosCached().catch(() => null),
      fetchCampaignActivitiesCached(startDay).catch(() => null),
      // Jour J en direct — seulement en mode jour (la nuit, les données de la
      // veille sont déjà stabilisées par le sync de 01h05).
      liveDay ? fetchTodayInsightsCached(today).catch(() => null) : Promise.resolve(null),
    ] as const)
  );

  if (hasReachMemo !== true) {
    const { error: reachProbeError } = await supabase.from("meta_insights").select("reach").limit(1);
    hasReachMemo = !reachProbeError;
  }
  const hasReach = hasReachMemo;
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
  // Seules les campagnes du protocole (ni exclues ni TESTING) : leurs annonces
  // n'alimentent aucun diagnostic et gonfleraient la limite pour rien.
  const campaignIds = [
    ...new Set(
      rows
        .filter((r) => {
          const name = r.campaignName ?? r.campaignId;
          return !isExcludedCampaign(name) && classifyCampaignProduct(name) !== "TESTING";
        })
        .map((r) => r.campaignId)
    ),
  ];
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

  // Seuils calculés sur les 14 jours CLOS (un jour partiel fausserait le CM).
  const [productThresholds, liveEntries, activities, todayLive] = await sidePromise;
  const liveInfos = liveEntries ? new Map(liveEntries) : null;

  // Mode jour : le jour J vient du LIVE Meta, jamais du snapshot (écrit à
  // 01h05 seulement) — les lignes « today » de la table sont remplacées.
  let mergedRows = rows;
  if (liveDay && todayLive) {
    mergedRows = rows
      .filter((r) => r.day !== today)
      .concat(
        todayLive.map((r) => ({
          day: r.day,
          campaignId: r.campaignId,
          campaignName: r.campaignName,
          spendCents: r.spendCents,
          purchases: r.purchases,
          purchaseValueCents: r.purchaseValueCents,
          impressions: r.impressions,
          clicks: r.clicks,
          reach: r.reach,
        }))
      );
  } else if (liveDay && !todayLive) {
    extraWarnings.push(
      "Insights du jour indisponibles en direct (Meta) — verdicts basés sur le dernier snapshot (sync 01h05) : le jour J peut être incomplet."
    );
  }

  const report = computeScaling({
    today,
    rows: mergedRows,
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
    protocolStartDay: PROTOCOLE_T24_START_DAY,
  });
  report.warnings.push(...extraWarnings);
  return report;
}
