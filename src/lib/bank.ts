import { createSign } from "node:crypto";
import { unstable_cache } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { addDaysToDay, toParisDay, todayParisDay } from "./time";
import { monthlyEurCents, SUBSCRIPTIONS, USD_TO_EUR } from "./subscriptions";
import { ONE_OFF_COSTS } from "./associateLedger";
import { SUPPLIER_BILLS } from "./supplierBills";

// ---------------------------------------------------------------------------
// 🏦 Banque — rapprochement PRÉVU vs RÉEL (demande Badr 19/08 : « vérifier
// l'argent qui rentre et sort et voir si ça colle avec ce qui est prévu »).
//
// Sources bancaires :
//  • WISE — API officielle. ⚠️ Les relevés (balance statements) sont protégés
//    par la SCA même en lecture seule : le premier appel renvoie 403 avec un
//    header x-2fa-approval (one-time token) qu'il faut SIGNER avec une clé
//    privée RSA dont la clé publique a été uploadée sur le compte Wise
//    (docs.wise.com/api-docs/guides/strong-customer-authentication-2fa).
//    Env : WISE_API_TOKEN (read-only) + WISE_PRIVATE_KEY (PEM, multi-ligne).
//  • SLASH — API en bêta, branchée le 19/08 (doc OpenAPI collée par Badr) :
//    GET /transaction, header X-API-Key, x-legal-entity auto-découvert pour
//    les clés user-scoped, pagination cursor/nextCursor, montants en cents
//    USD (négatif = débit). Env : SLASH_API_TOKEN.
//
// Côté « prévu », tout vient du dashboard : spend Meta et CA (daily_aggregates,
// GLOBAL = somme des marchés) et abonnements (subscriptions.ts).
//
// Lecture seule de bout en bout — aucun ordre de paiement, jamais.
// ---------------------------------------------------------------------------

const WISE_API = "https://api.wise.com";

export type BankName = "WISE" | "SLASH";
export type TxCategory = "META" | "GOOGLE_ADS" | "SHOPIFY" | "ABONNEMENT" | "FOURNISSEUR" | "FRAIS" | "INTERNE" | "AUTRE";
/** Affectation manuelle d'une transaction (table bank_tx_labels).
 * FAHD = ADNANE (confirmé Badr 19/08) : même personne que l'associé du
 * ledger « Entre associés ». Une dépense perso payée par la carte LLC est
 * une avance de la société : la moitié est due à l'AUTRE associé (50/50). */
export type TxLabel = "SOCIETE" | "PERSO_BADR" | "PERSO_FAHD" | "IGNORER";

export interface BankTx {
  bank: BankName;
  txId: string;
  day: string; // Europe/Paris
  /** négatif = débit, positif = crédit (cents de la devise d'origine) */
  amountCents: number;
  currency: string;
  /** équivalent EUR (taux figé USD→EUR du dashboard pour l'USD, 1:1 EUR) —
   * null si la devise n'est pas convertible avec les taux connus */
  amountEurCents: number | null;
  description: string;
  category: TxCategory;
  /** libellé d'abonnement reconnu (catégorie ABONNEMENT) */
  subscriptionLabel: string | null;
  /** affectation manuelle (bank_tx_labels) — null = pas encore affectée */
  label: TxLabel | null;
  labelNote: string | null;
  /** Contexte lisible pour identifier une ligne mystère : carte utilisée,
   * lieu du marchand, mémo, heure (demande Badr 19/08 : « tu expliques
   * pas ») — affiché sous la description dans « À affecter ». */
  detail?: string | null;
  /** « 🤖 Ressemble à : … » — rapprochement automatique d'une ligne
   * inconnue avec tout ce que le dashboard connaît (abonnements, frais
   * ponctuels, factures fournisseur) par similarité de montant. */
  suggestion?: string | null;
}

export interface BankBalance {
  bank: BankName;
  currency: string;
  amountCents: number;
  /** Contre-valeur EUR (taux figé USD / taux Wise du jour) — null si devise
   * sans taux : affichée mais hors du total « à qui appartient l'argent ». */
  amountEurCents: number | null;
}

// --- Catégorisation par mots-clés --------------------------------------------
// Les motifs abonnements dérivent de la liste OFFICIELLE du dashboard
// (subscriptions.ts) : un abonnement reconnu est rapproché de son montant
// attendu ; tout le reste part en AUTRE, jamais avalé en silence.
const SUBSCRIPTION_PATTERNS: { label: string; re: RegExp }[] = [
  // Claude : UN motif pour les DEUX comptes — 100 € (Badr) + 20 € (Adnane)
  // = 120 €/mois PLAFOND (Badr 19/08 : « normalement on ne dépassera plus
  // les 120 € par mois, le reste c'était des crédits consommés »).
  { label: "Claude (Badr + Adnane)", re: /anthropic|claude/i },
  { label: "Klaviyo", re: /klaviyo/i },
  { label: "Shopify (abonnement)", re: /shopify\s*(inc)?\b(?!.*payout)/i },
  { label: "WeTracked", re: /wetracked/i },
  { label: "Vercel", re: /vercel/i },
  { label: "Canva", re: /canva/i },
  { label: "Hushed", re: /hushed/i },
  // Ajouts 19/08 (Badr : « normalement tu connais tout ») — la liste
  // officielle de subscriptions.ts, reconnue en banque par mots-clés.
  { label: "Higgsfield ×2 (Adnane + Ismael)", re: /higgs\s*field|higgsfield/i },
  { label: "Eleven Labs ×2 (Adnane + monteur)", re: /eleven\s*labs/i },
  { label: "VMake", re: /v\s*make|vmake/i },
  { label: "TrendTrack", re: /trend\s*track/i },
  { label: "Floxy (proxy)", re: /floxy/i },
  { label: "Master Ecom (Skool)", re: /skool|master\s*ecom/i },
  { label: "Google Workspace", re: /google\s*[*.]?\s*workspace|gsuite/i },
  { label: "Marwa", re: /marwa/i },
  { label: "Seif (fixe, hors %)", re: /\bseif\b/i },
  // « Emailing : Altura » = la LLC de Jeremy (Badr 19/08 : « emailing c'est
  // pour Jeremy ») — ses virements ACH/wire sont sa presta emailing.
  { label: "Jeremy — emailing (fixe, hors %)", re: /emailing|altura/i },
  // Apps Shopify — parfois débitées en direct, parfois via la facture
  // Shopify (Badr 19/08 : « je ne sais pas si c'est Shopify qui prélève ou
  // bien eux ») : si une facture Shopify est débitée sur la fenêtre, on ne
  // réclame pas ces apps individuellement (voir computeControl).
  { label: "CWILL (Parcel Panel)", re: /cwill|parcel\s*panel/i },
  { label: "Moon Bundles", re: /moon\s*bundles?/i },
];

export function categorizeTx(description: string, amountCents: number): { category: TxCategory; subscriptionLabel: string | null } {
  const d = description.toLowerCase();
  // INTERNE : l'argent ne quitte pas le périmètre (conversion de devise dans
  // le compte, virement entre nos propres comptes Slash ↔ Wise). Jamais dans
  // « À affecter », jamais dans les parts — remarque Badr 19/08 : « juste
  // j'ai pris USD et je l'ai converti en euros, c'est resté dans le compte ».
  // (« wise » couvre les virements Slash → Wise vus côté Slash — un marchand
  // nommé « wise » serait un faux positif, assumé et signalé ici. « daily
  // credit » = remboursement quotidien automatique de la carte à débit
  // différé Slash, du compte cash vers le compte crédit : le compter serait
  // COMPTER DEUX FOIS chaque dépense carte, déjà présente individuellement.)
  if (/^converted\b/.test(d) || /kindredm/.test(d) || /\bwise\b/.test(d) || /daily\s*credit/.test(d))
    return { category: "INTERNE", subscriptionLabel: null };
  // Agrégat quotidien de frais Slash (« Slash fee: Foreign transaction fee
  // for MM.DD.YY ») : FRAIS — ventilé perso/société au prorata dans
  // fetchSlashData quand les fxFeeInfo du jour le permettent.
  if (/^slash fee/.test(d)) return { category: "FRAIS", subscriptionLabel: null };
  if (/facebk|facebook|meta\s*platforms|metaplatforms/.test(d)) return { category: "META", subscriptionLabel: null };
  // Fournisseur (Badr 19/08 : « Panda Dropshipping c'est le fournisseur ») —
  // les factures détaillées vivent dans l'onglet Dépenses ; ici le paiement
  // bancaire, et ses frais de virement lui sont rattachés (poste COGS réel).
  if (/panda/.test(d)) return { category: "FOURNISSEUR", subscriptionLabel: null };
  // crédit Shopify = versement (payout) ; débit Shopify = abonnement/app
  if (/shopify/.test(d) && amountCents > 0) return { category: "SHOPIFY", subscriptionLabel: null };
  for (const p of SUBSCRIPTION_PATTERNS) {
    if (p.re.test(description)) return { category: "ABONNEMENT", subscriptionLabel: p.label };
  }
  // Google Ads (identifié par Badr 19/08 : la ligne de 100 € = Google Ads).
  // APRÈS les motifs d'abonnement : « Google Workspace » est déjà capté
  // au-dessus. Suivi analytique via l'API Google à brancher (Badr : « je te
  // donnerai l'API plus tard ») — en attendant, le comptable le compte
  // côté banque comme un poste pub à part.
  if (/google[\s*]*ads?\b|adwords/.test(d)) return { category: "GOOGLE_ADS", subscriptionLabel: null };
  return { category: "AUTRE", subscriptionLabel: null };
}

/** Abonnements couverts par un motif bancaire. Un motif peut en couvrir
 * PLUSIEURS : « Claude (Badr + Adnane) » additionne les deux comptes Claude
 * (100 € + 20 € = 120 €/mois plafond, Badr 19/08). Match par label exact ou
 * premier mot ; un abonnement résilié reste couvert jusqu'à son endDay
 * (ex. Jeremy jusqu'au 31/08). */
function subsForPattern(patternLabel: string, untilDay: string) {
  const first = patternLabel.split(" ")[0];
  return SUBSCRIPTIONS.filter(
    (s) => (s.endDay === null || s.endDay >= untilDay) && s.amount > 0 && (s.label === patternLabel || s.label.startsWith(first))
  );
}

function toEurCents(amountCents: number, currency: string, liveRates?: Map<string, number>): number | null {
  if (currency === "EUR") return amountCents;
  if (currency === "USD") return Math.round(amountCents * USD_TO_EUR); // taux FIGÉ du dashboard (décision Badr 08/08)
  const rate = liveRates?.get(currency);
  if (rate !== undefined) return Math.round(amountCents * rate); // taux Wise du jour (CAD, CHF, MAD…)
  return null; // devise inconnue : on l'affiche telle quelle, jamais convertie au pif
}

// --- Client Wise --------------------------------------------------------------

async function wiseFetch(path: string, token: string, privateKeyPem: string | null): Promise<Response> {
  const url = `${WISE_API}${path}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  // SCA : 403 + x-2fa-approval → signer le one-time token et rejouer
  if (res.status === 403 && res.headers.get("x-2fa-approval")) {
    const ott = res.headers.get("x-2fa-approval")!;
    if (!privateKeyPem) {
      throw new Error(
        "Wise exige la SCA sur les relevés : ajoute WISE_PRIVATE_KEY (clé privée RSA dont la clé publique est uploadée sur le compte Wise, Paramètres → API tokens → Manage public keys)."
      );
    }
    const signer = createSign("RSA-SHA256");
    signer.update(ott);
    const signature = signer.sign(privateKeyPem.replace(/\\n/g, "\n"), "base64");
    return fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "x-2fa-approval": ott,
        "X-Signature": signature,
      },
    });
  }
  return res;
}

/** Taux du jour Wise (mid-market) pour les devises sans taux figé au
 * dashboard (CAD, CHF, MAD…). L'USD garde son taux figé. Un taux
 * introuvable laisse la devise hors totaux (jamais convertie au pif). */
async function fetchWiseRates(currencies: string[], token: string): Promise<Map<string, number>> {
  const rates = new Map<string, number>();
  await Promise.all(
    currencies.map(async (c) => {
      try {
        const res = await fetch(`${WISE_API}/v1/rates?source=${encodeURIComponent(c)}&target=EUR`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const arr = (await res.json()) as { rate?: number }[];
        const rate = arr?.[0]?.rate;
        if (typeof rate === "number" && rate > 0) rates.set(c, rate);
      } catch {
        // taux indisponible : la devise reste affichée mais hors totaux
      }
    })
  );
  return rates;
}

// --- Client Slash --------------------------------------------------------------
// Doc collée par Badr le 19/08 (docs.slash.com, OpenAPI) :
//   GET https://api.slash.com/transaction — header X-API-Key ; clé user-scoped
//   ⇒ header x-legal-entity obligatoire (entité découverte via GET
//   /legal-entity, seule route qui n'exige pas le header). Réponse
//   { items: Transaction[], metadata: { nextCursor?, count } } ; filtres
//   filter:from_date / filter:to_date en timestamp UNIX MILLISECONDES.
//   amountCents en cents USD, négatif = débit.

const SLASH_API = "https://api.slash.com";

export interface SlashTx {
  id: string;
  /** UTC — date de post (ou de création si pending/failed) */
  date: string;
  description: string;
  amountCents: number;
  status: "pending" | "posted" | "failed";
  detailedStatus: string;
  memo?: string;
  merchantData?: { description?: string; categoryCode?: string; location?: { city?: string; state?: string; country?: string } };
  /** Carte associée (absente hors transactions carte). */
  cardId?: string;
  /** Horodatage d'autorisation (transactions carte). */
  authorizedAt?: string;
  /** Présent quand la transaction est un FRAIS Slash (FX, virement…) —
   * relatedTransaction pointe la transaction d'origine du frais. */
  feeInfo?: { relatedTransaction?: { id?: string; amount?: number } };
  /** Frais FX facturé POUR cette transaction (sert à ventiler l'agrégat
   * quotidien « Slash fee: Foreign transaction fee for MM.DD.YY »). */
  fxFeeInfo?: { amountCents?: number };
  /** Cashback gagné sur cette transaction (à récupérer). */
  cashbackInfo?: { amountCents?: number; rate?: number };
}

/** Statuts qui n'ont PAS bougé d'argent : exclus du contrôle. `pending` et
 * `settled` (et refund/returned/dispute) restent — l'argent est engagé. */
const SLASH_STATUTS_SANS_ARGENT = new Set(["canceled", "failed", "declined", "reversed", "pending_approval", "in_review"]);

/** Mapping pur (testé) : une transaction Slash → BankTx, ou null si le
 * statut n'a pas bougé d'argent. Compte Slash en USD ⇒ conversion au taux
 * figé du dashboard, comme partout. */
export function mapSlashTx(t: SlashTx): BankTx | null {
  if (t.status === "failed" || SLASH_STATUTS_SANS_ARGENT.has(t.detailedStatus)) return null;
  const description = t.merchantData?.description || t.description || t.memo || "(sans libellé)";
  const { category, subscriptionLabel } = categorizeTx(description, t.amountCents);
  // Contexte pour identifier la ligne (Badr 19/08 : « ça correspond à
  // quoi ? ») : type, lieu du marchand, mémo, heure Paris.
  const loc = t.merchantData?.location;
  const bits: string[] = [t.cardId ? "carte" : "virement/ACH"];
  const place = [loc?.city, loc?.country].filter(Boolean).join(", ");
  if (place) bits.push(place);
  if (t.memo && t.memo !== description) bits.push(`mémo : ${t.memo}`);
  try {
    bits.push(
      `à ${new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", hour: "2-digit", minute: "2-digit" }).format(new Date(t.authorizedAt ?? t.date))}`
    );
  } catch {
    // date illisible : le reste du contexte suffit
  }
  return {
    detail: bits.join(" · "),
    bank: "SLASH",
    txId: t.id,
    day: toParisDay(t.date),
    amountCents: t.amountCents,
    currency: "USD",
    amountEurCents: toEurCents(t.amountCents, "USD"),
    description,
    category,
    subscriptionLabel,
    label: null,
    labelNote: null,
  };
}

export async function fetchSlashData(
  sinceDay: string,
  untilDay: string
): Promise<{ txs: BankTx[]; balances: BankBalance[]; cashbackCents: number }> {
  const token = process.env.SLASH_API_TOKEN;
  if (!token) throw new Error("SLASH_API_TOKEN manquant (variables d'environnement Vercel).");

  let legalEntity: string | null = null;
  const call = (cursor: string | null): Promise<Response> => {
    const qs = new URLSearchParams({
      "filter:from_date": String(Date.parse(`${sinceDay}T00:00:00.000Z`)),
      "filter:to_date": String(Date.parse(`${untilDay}T23:59:59.999Z`)),
    });
    if (cursor) qs.set("cursor", cursor);
    const headers: Record<string, string> = { "X-API-Key": token };
    if (legalEntity) headers["x-legal-entity"] = legalEntity;
    return fetch(`${SLASH_API}/transaction?${qs}`, { headers });
  };

  let res = await call(null);
  // Clé user-scoped sans header ⇒ 400 : découvrir l'entité puis rejouer.
  if (res.status === 400 && !legalEntity) {
    const leRes = await fetch(`${SLASH_API}/legal-entity`, { headers: { "X-API-Key": token } });
    if (!leRes.ok) throw new Error(`Slash /legal-entity : HTTP ${leRes.status} — ${(await leRes.text()).slice(0, 200)}`);
    const leJson = (await leRes.json()) as { items?: { id?: string }[] } | { id?: string }[];
    const arr = Array.isArray(leJson) ? leJson : (leJson.items ?? []);
    legalEntity = arr[0]?.id ?? null;
    if (!legalEntity) throw new Error("Slash : aucune legal entity accessible avec cette clé.");
    res = await call(null);
  }

  const raw: SlashTx[] = [];
  for (let page = 0; page < 20; page++) {
    if (!res.ok) throw new Error(`Slash /transaction : HTTP ${res.status} — ${(await res.text()).slice(0, 200)}`);
    const json = (await res.json()) as { items?: SlashTx[]; metadata?: { nextCursor?: string } };
    raw.push(...(json.items ?? []));
    const next = json.metadata?.nextCursor;
    if (!next) break;
    res = await call(next);
  }

  // Cartes : le TITULAIRE de la carte décide de la case (Badr 19/08 : « les
  // dépenses des cartes Fahd/Adnane, c'est le perso d'Adnane — moi j'ai zéro
  // dépense tant que je n'ai pas utilisé la carte Badr »). Seuls les débits
  // AUTRE sont auto-affectés (Meta/abos restent des charges société) ; une
  // affectation MANUELLE (bank_tx_labels) écrase toujours l'auto.
  const owners = new Map<string, { label: TxLabel; note: string }>();
  const cardNames = new Map<string, string>(); // TOUTES les cartes — pour le contexte des lignes
  try {
    const headers: Record<string, string> = { "X-API-Key": token };
    if (legalEntity) headers["x-legal-entity"] = legalEntity;
    const cardsRes = await fetch(`${SLASH_API}/card`, { headers });
    if (cardsRes.ok) {
      const cardsJson = (await cardsRes.json()) as { items?: Record<string, unknown>[] };
      for (const c of cardsJson.items ?? []) {
        const id = typeof c.id === "string" ? c.id : null;
        if (!id) continue;
        const name =
          [c.name, c.nickname, c.displayName, c.cardholderName]
            .concat(typeof c.cardholder === "object" && c.cardholder !== null ? [(c.cardholder as Record<string, unknown>).name, (c.cardholder as Record<string, unknown>).fullName] : [])
            .find((v): v is string => typeof v === "string" && v.length > 0) ?? "";
        if (name) cardNames.set(id, name);
        if (/adnane|fahd/i.test(name)) owners.set(id, { label: "PERSO_FAHD", note: `auto : carte « ${name} »` });
        else if (/badr/i.test(name)) owners.set(id, { label: "PERSO_BADR", note: `auto : carte « ${name} »` });
      }
    }
  } catch {
    // cartes illisibles : pas bloquant, l'affectation reste manuelle
  }

  // Frais Slash (FX, virement…) : chaque frais SUIT sa transaction d'origine
  // (Badr 19/08 : « les fees foreign transaction, c'est les dépenses
  // d'Adnane/Fahd ; si ça correspond au paiement Meta, rajoute-le dans les
  // frais Meta ; les frais du virement fournisseur vont au COGS ») —
  // frais d'une dépense perso → la case perso de la carte ; frais Meta →
  // META ; frais du virement Panda → FOURNISSEUR ; parent introuvable →
  // FRAIS (société, à surveiller).
  const byId = new Map(raw.map((t) => [t.id, t]));

  // Ventilation des frais FX : chaque transaction carte porte SON frais
  // (fxFeeInfo) ; l'agrégat quotidien « Slash fee: Foreign transaction fee
  // for MM.DD.YY » est redécoupé au prorata perso/société du jour référencé
  // (« ça part chez eux » pour le perso, le reste en frais société — le gros
  // vient de Meta facturé en EUR sur un compte USD). Cashback : sommé à part
  // (gagné, à récupérer — pas encore de l'argent entré).
  const fxByDay = new Map<string, { fahd: number; badr: number; societe: number }>();
  let cashbackCents = 0;
  for (const t of raw) {
    const cb = t.cashbackInfo?.amountCents;
    if (typeof cb === "number" && cb > 0) cashbackCents += cb;
    const fee = t.fxFeeInfo?.amountCents;
    if (typeof fee !== "number" || fee <= 0) continue;
    const day = toParisDay(t.date);
    const owner = t.cardId ? owners.get(t.cardId) : undefined;
    const slot = fxByDay.get(day) ?? { fahd: 0, badr: 0, societe: 0 };
    if (owner?.label === "PERSO_FAHD") slot.fahd += fee;
    else if (owner?.label === "PERSO_BADR") slot.badr += fee;
    else slot.societe += fee;
    fxByDay.set(day, slot);
  }

  const txs: BankTx[] = [];
  for (const t of raw) {
    const mapped = mapSlashTx(t);
    if (!mapped) continue;
    // Contexte : le NOM de la carte utilisée (toutes cartes, pas seulement
    // les perso) — c'est souvent ce qui identifie une ligne mystère.
    const cardName = t.cardId ? cardNames.get(t.cardId) : undefined;
    if (cardName && mapped.detail) mapped.detail = mapped.detail.replace(/^carte\b/, `carte « ${cardName} »`);
    // Agrégat quotidien de frais FX → redécoupé au prorata du jour référencé.
    const agg = /^slash fee: foreign transaction fee for (\d{2})\.(\d{2})\.(\d{2})/i.exec(t.description);
    if (agg) {
      const refDay = `20${agg[3]}-${agg[1]}-${agg[2]}`; // MM.DD.YY → YYYY-MM-DD
      const slot = fxByDay.get(refDay) ?? fxByDay.get(mapped.day);
      const total = slot ? slot.fahd + slot.badr + slot.societe : 0;
      if (slot && total > 0) {
        const parts = (
          [
            { suffix: "fahd", share: slot.fahd / total, label: "PERSO_FAHD", qui: "dépenses carte Adnane/Fahd" },
            { suffix: "badr", share: slot.badr / total, label: "PERSO_BADR", qui: "dépenses carte Badr" },
            { suffix: "ste", share: slot.societe / total, label: null, qui: "dépenses société (Meta en EUR surtout)" },
          ] as { suffix: string; share: number; label: TxLabel | null; qui: string }[]
        ).filter((p) => p.share > 0);
        let restCents = mapped.amountCents;
        parts.forEach((p, idx) => {
          const amount = idx === parts.length - 1 ? restCents : Math.round(mapped.amountCents * p.share);
          restCents -= amount;
          if (amount === 0) return;
          txs.push({
            ...mapped,
            txId: `${mapped.txId}-${p.suffix}`,
            amountCents: amount,
            amountEurCents: toEurCents(amount, "USD"),
            category: "FRAIS",
            label: p.label,
            labelNote: `frais FX du ${refDay.slice(8, 10)}/${refDay.slice(5, 7)} — part ${p.qui} (ventilé automatiquement)`,
          });
        });
      } else {
        txs.push({ ...mapped, category: "FRAIS", labelNote: "frais FX du jour — non ventilable (détail indisponible), compté société" });
      }
      continue;
    }
    const relId = t.feeInfo?.relatedTransaction?.id;
    if (relId !== undefined) {
      const parent = byId.get(relId);
      const parentDesc = parent ? parent.merchantData?.description || parent.description || "" : "";
      const parentCat = parent ? categorizeTx(parentDesc, parent.amountCents).category : "AUTRE";
      const parentOwner = parent?.cardId ? owners.get(parent.cardId) : undefined;
      mapped.subscriptionLabel = null;
      if (parentOwner && parentCat === "AUTRE") {
        mapped.category = "FRAIS";
        mapped.label = parentOwner.label;
        mapped.labelNote = `frais lié à « ${parentDesc} » (${parentOwner.note})`;
      } else {
        mapped.category = parentCat === "AUTRE" || parentCat === "INTERNE" ? "FRAIS" : parentCat;
        mapped.labelNote = parent ? `frais lié à « ${parentDesc} »` : "frais Slash — transaction d'origine hors fenêtre";
      }
      txs.push(mapped);
      continue;
    }
    const owner = t.cardId ? owners.get(t.cardId) : undefined;
    if (owner && mapped.category === "AUTRE" && mapped.amountCents < 0) {
      mapped.label = owner.label;
      mapped.labelNote = owner.note;
    }
    txs.push(mapped);
  }

  // Soldes (doc collée par Badr 19/08 : GET /account/{id}/balance). Pour une
  // charge card, cash (excédent) + credit (collatéral) sont TOUS LES DEUX
  // l'argent de la société ; debit pour un compte débit. On somme
  // l'AVAILABLE de chaque balance de chaque compte — un seul total Slash USD.
  let balances: BankBalance[] = [];
  try {
    const headers: Record<string, string> = { "X-API-Key": token };
    if (legalEntity) headers["x-legal-entity"] = legalEntity;
    const accRes = await fetch(`${SLASH_API}/account`, { headers });
    if (accRes.ok) {
      const accJson = (await accRes.json()) as { items?: { id?: string }[] };
      let totalCents = 0;
      let any = false;
      for (const a of accJson.items ?? []) {
        if (typeof a.id !== "string") continue;
        const balRes = await fetch(`${SLASH_API}/account/${encodeURIComponent(a.id)}/balance`, { headers });
        if (!balRes.ok) continue;
        const balJson = (await balRes.json()) as { balances?: { available?: { amountCents?: number } }[] };
        for (const b of balJson.balances ?? []) {
          if (typeof b.available?.amountCents === "number") {
            totalCents += b.available.amountCents;
            any = true;
          }
        }
      }
      if (any) {
        balances = [{ bank: "SLASH", currency: "USD", amountCents: totalCents, amountEurCents: toEurCents(totalCents, "USD") }];
      }
    }
  } catch {
    // solde illisible : signalé dans le rapport, les transactions restent valables
  }
  return { txs, balances, cashbackCents };
}

interface WiseStatementTx {
  type: "DEBIT" | "CREDIT";
  date: string;
  amount: { value: number; currency: string };
  details?: { description?: string; merchant?: { name?: string } | null; paymentReference?: string };
  referenceNumber: string;
}

export async function fetchWiseData(sinceDay: string, untilDay: string): Promise<{ txs: BankTx[]; balances: BankBalance[] }> {
  const token = process.env.WISE_API_TOKEN;
  if (!token) throw new Error("WISE_API_TOKEN manquant (variables d'environnement Vercel).");
  const privateKey = process.env.WISE_PRIVATE_KEY ?? null;

  const profilesRes = await wiseFetch("/v2/profiles", token, privateKey);
  if (!profilesRes.ok) throw new Error(`Wise /profiles : HTTP ${profilesRes.status} — ${(await profilesRes.text()).slice(0, 200)}`);
  const profiles = (await profilesRes.json()) as { id: number; type: string }[];
  // priorité au profil BUSINESS (la LLC) ; sinon le premier
  const profile = profiles.find((p) => p.type?.toUpperCase() === "BUSINESS") ?? profiles[0];
  if (!profile) throw new Error("Wise : aucun profil sur ce token.");

  const balancesRes = await wiseFetch(`/v4/profiles/${profile.id}/balances?types=STANDARD`, token, privateKey);
  if (!balancesRes.ok) throw new Error(`Wise /balances : HTTP ${balancesRes.status}`);
  const balances = (await balancesRes.json()) as { id: number; currency: string; amount: { value: number } }[];

  const extraCurrencies = [...new Set(balances.map((b) => b.currency))].filter((c) => c !== "EUR" && c !== "USD");
  const liveRates = extraCurrencies.length > 0 ? await fetchWiseRates(extraCurrencies, token) : new Map<string, number>();

  const txs: BankTx[] = [];
  for (const b of balances) {
    const qs = new URLSearchParams({
      currency: b.currency,
      intervalStart: `${sinceDay}T00:00:00.000Z`,
      intervalEnd: `${untilDay}T23:59:59.999Z`,
      type: "COMPACT",
    });
    const stRes = await wiseFetch(
      `/v1/profiles/${profile.id}/balance-statements/${b.id}/statement.json?${qs}`,
      token,
      privateKey
    );
    if (!stRes.ok) throw new Error(`Wise statement ${b.currency} : HTTP ${stRes.status} — ${(await stRes.text()).slice(0, 200)}`);
    const st = (await stRes.json()) as { transactions?: WiseStatementTx[] };
    for (const t of st.transactions ?? []) {
      const description = t.details?.merchant?.name || t.details?.description || t.details?.paymentReference || "(sans libellé)";
      const amountCents = Math.round(t.amount.value * 100); // signé : négatif = débit
      const { category, subscriptionLabel } = categorizeTx(description, amountCents);
      txs.push({
        bank: "WISE",
        txId: t.referenceNumber,
        day: toParisDay(t.date),
        amountCents,
        currency: t.amount.currency,
        amountEurCents: toEurCents(amountCents, t.amount.currency, liveRates),
        description,
        category,
        subscriptionLabel,
        label: null,
        labelNote: null,
      });
    }
  }
  txs.sort((a, b) => b.day.localeCompare(a.day) || a.txId.localeCompare(b.txId));
  return {
    txs,
    balances: balances.map((b) => {
      const amountCents = Math.round(b.amount.value * 100);
      return { bank: "WISE" as const, currency: b.currency, amountCents, amountEurCents: toEurCents(amountCents, b.currency, liveRates) };
    }),
  };
}

// --- Rapprochement (pur, testé) ------------------------------------------------

export interface ExpectedDaily {
  day: string;
  caCents: number;
  spendCents: number;
  feesCents: number;
}

export interface BankReconciliation {
  sinceDay: string;
  untilDay: string;
  /** Meta : débits banque vs spend dashboard sur la fenêtre. Meta facture par
   * PALIERS (pas jour par jour) : seul le TOTAL doit coller, l'écart
   * journalier est normal — dit dans l'UI. */
  meta: { bankCents: number; expectedCents: number; gapCents: number };
  /** true = AUCUN débit Meta visible sur les banques branchées ET Slash pas
   * encore connecté : Meta est débité sur la carte Slash (constaté 19/08 —
   * zéro débit facebk sur Wise pour 47 k€ de spend). Contrôle EN ATTENTE du
   * branchement Slash, pas une anomalie (règle Badr 19/08 : « pars du
   * principe que c'est prélevé »). */
  metaPending: boolean;
  /** Shopify : crédits banque (payouts) vs CA net des frais estimés. Les
   * payouts arrivent en DIFFÉRÉ (2-4 j) : indicatif sur la fenêtre. */
  shopify: { bankCents: number; expectedCents: number; gapCents: number };
  /** Abonnements reconnus : payé vs attendu (mensuel) par libellé. */
  subscriptions: { label: string; paidCents: number; expectedMonthlyCents: number }[];
  /** Tout ce qui n'est ni Meta, ni Shopify, ni un abonnement connu. */
  others: BankTx[];
  warnings: string[];
}

export function reconcile(
  txs: BankTx[],
  expected: ExpectedDaily[],
  sinceDay: string,
  untilDay: string,
  opts?: { slashConnected?: boolean }
): BankReconciliation {
  const slashConnected = opts?.slashConnected ?? false;
  const warnings: string[] = [];
  const inWindow = txs.filter((t) => t.day >= sinceDay && t.day <= untilDay);

  const sumEur = (list: BankTx[]) => list.reduce((a, t) => a + (t.amountEurCents ?? 0), 0);
  const unconvertible = inWindow.filter((t) => t.amountEurCents === null);
  if (unconvertible.length > 0) {
    warnings.push(`${unconvertible.length} transaction(s) dans une devise sans taux connu — affichées mais hors totaux.`);
  }

  const metaTx = inWindow.filter((t) => t.category === "META");
  const metaBank = -sumEur(metaTx); // débits → positif
  const metaExpected = expected.reduce((a, e) => a + e.spendCents, 0);

  const shopifyTx = inWindow.filter((t) => t.category === "SHOPIFY");
  const shopifyBank = sumEur(shopifyTx);
  const shopifyExpected = expected.reduce((a, e) => a + e.caCents - e.feesCents, 0);

  const subs: BankReconciliation["subscriptions"] = [];
  for (const p of SUBSCRIPTION_PATTERNS) {
    const paid = -sumEur(inWindow.filter((t) => t.subscriptionLabel === p.label));
    const matches = subsForPattern(p.label, untilDay);
    // Avances perso (ex. Hushed/Seif payés par Adnane) : pas un flux LLC —
    // masqué tant que rien n'apparaît en banque (un débit qui apparaît
    // quand même s'affiche).
    if (matches.length > 0 && matches.every((s) => s.paidBy) && paid === 0) continue;
    if (paid !== 0 || matches.length > 0) {
      subs.push({
        label: p.label,
        paidCents: paid,
        // Un motif peut couvrir PLUSIEURS abonnements (Claude : 100 + 20 =
        // 120 €/mois plafond, Badr 19/08) → somme des mensuels couverts.
        expectedMonthlyCents: matches.reduce((a, s) => a + monthlyEurCents(s), 0),
      });
    }
  }

  const others = inWindow.filter((t) => t.category === "AUTRE");

  const metaGap = metaBank - metaExpected;
  // Zéro débit Meta visible + Slash absent = Meta passe sur la carte Slash :
  // en attente du branchement, pas un écart (Badr 19/08).
  const metaPending = metaTx.length === 0 && metaExpected > 0 && !slashConnected;
  if (!metaPending && metaExpected > 0 && Math.abs(metaGap) > Math.max(1000, metaExpected * 0.05)) {
    warnings.push(
      `Meta : la banque a débité ${(metaBank / 100).toFixed(0)} € pour ${(metaExpected / 100).toFixed(0)} € de spend enregistré — écart ${(metaGap / 100).toFixed(0)} €. Meta facture par paliers : vérifier seulement si l'écart persiste plusieurs jours.`
    );
  }

  return {
    sinceDay,
    untilDay,
    meta: { bankCents: metaBank, expectedCents: metaExpected, gapCents: metaGap },
    metaPending,
    shopify: { bankCents: shopifyBank, expectedCents: shopifyExpected, gapCents: shopifyBank - shopifyExpected },
    subscriptions: subs,
    others,
    warnings,
  };
}

// --- Anomalies + parts (pur, testé) ---------------------------------------------

export type AnomalyKind =
  | "TX_NON_AFFECTEE"
  | "ABO_NON_DEBITE"
  | "ABO_MONTANT"
  | "META_ECART"
  | "PAYOUT_MANQUANT"
  | "DOUBLE_DEBIT"
  | "FOURNISSEUR_ECART";

export interface Anomaly {
  kind: AnomalyKind;
  severity: "red" | "amber";
  label: string;
  detail: string | null;
}

export interface OwnerParts {
  /** débits société identifiés (Meta + abonnements + affectés SOCIETE) */
  societeCents: number;
  persoBadrCents: number;
  persoFahdCents: number;
  /** débits pas encore affectés — la case interdite */
  aAffecterCents: number;
  aAffecterCount: number;
  /** Solde entre associés induit par les dépenses PERSO payées par la LLC
   * (50/50) : positif = Badr doit à Fahd, négatif = Fahd doit à Badr.
   * = (persoBadr − persoFahd) / 2. S'AJOUTE au ledger historique de l'onglet
   * Année (avances perso → société), il ne le remplace pas. */
  soldeBadrDoitAFahdCents: number;
}

export interface ControlReport {
  anomalies: Anomaly[];
  parts: OwnerParts;
  /** les transactions à affecter (inbox), plus récentes d'abord */
  toAssign: BankTx[];
  /** Pointage factures fournisseur ↔ virements bancaires (« relie toutes
   * les données entre elles », Badr 19/08) — une ligne par facture. */
  fournisseurPointage: string[];
}

/** Le cœur du contrôle : chaque euro sorti doit finir dans exactement une
 * case ; tout le reste est une anomalie affichée jusqu'à affectation. */
export function computeControl(input: {
  txs: BankTx[];
  reconciliation: BankReconciliation | null;
  sinceDay: string;
  untilDay: string;
  /** true seulement quand le connecteur Slash est branché — tant qu'il ne
   * l'est pas, les débits carte LLC (Meta, abonnements) passent sur Slash et
   * sont invisibles ici : on ne crie pas « impayé » sur ce qu'on ne voit pas. */
  slashConnected?: boolean;
}): ControlReport {
  const { txs, reconciliation, sinceDay, untilDay } = input;
  const slashConnected = input.slashConnected ?? false;
  const anomalies: Anomaly[] = [];
  const inWindow = txs.filter((t) => t.day >= sinceDay && t.day <= untilDay && t.label !== "IGNORER");
  const debits = inWindow.filter((t) => t.amountCents < 0);
  const eur = (c: number) => `${Math.round(Math.abs(c) / 100)} €`;

  // 1) La case interdite : débits sans affectation ni catégorie connue.
  const toAssign = debits.filter((t) => t.category === "AUTRE" && t.label === null);
  if (toAssign.length > 0) {
    anomalies.push({
      kind: "TX_NON_AFFECTEE",
      severity: "red",
      label: `${toAssign.length} transaction(s) non affectée(s) — ${eur(toAssign.reduce((a, t) => a + (t.amountEurCents ?? 0), 0))} sans case`,
      detail: "Affecte chacune ci-dessous : Société, Perso Badr, Perso Fahd (ou Ignorer).",
    });
  }

  // 1bis) CANDIDATS automatiques (« relie toutes les données, sois
  // intelligent » — Badr 19/08) : une ligne inconnue est comparée par
  // MONTANT (±5 %, mini 1 €) à tout ce que le dashboard connaît déjà —
  // abonnements officiels, frais ponctuels du ledger, factures fournisseur.
  const candidats: { label: string; cents: number }[] = [
    ...SUBSCRIPTIONS.filter((s) => s.amount > 0).map((s) => ({
      label: `${s.label} (~${eur(monthlyEurCents(s))}/mois)`,
      cents: monthlyEurCents(s),
    })),
    ...ONE_OFF_COSTS.map((c) => ({ label: `${c.label} (frais ponctuel, ${eur(c.eurCents)})`, cents: c.eurCents })),
    ...SUPPLIER_BILLS.map((b) => ({ label: `facture fournisseur ${b.ref} (${eur(b.totalCents)})`, cents: b.totalCents })),
  ];
  for (const t of toAssign) {
    const a = Math.abs(t.amountEurCents ?? 0);
    if (a === 0) continue;
    const proches = candidats.filter((c) => c.cents > 0 && Math.abs(a - c.cents) <= Math.max(100, c.cents * 0.05));
    if (proches.length > 0) {
      t.suggestion = `Ressemble à : ${proches.slice(0, 2).map((c) => c.label).join(" ou ")}`;
    }
  }

  // 2) Abonnement LLC attendu mais JAMAIS débité depuis le début de la
  //    fenêtre de contrôle. Précision Badr 19/08 : « Klaviyo etc. tout ça
  //    c'est la LLC qui paye — tu les trouveras » → on les CHERCHE. Exclus :
  //    • paidBy posé = avance perso d'un associé (ex. Hushed, payé par
  //      Adnane en continu) — jamais visible en banque LLC ;
  //    • apps Shopify quand une facture Shopify est débitée sur la fenêtre
  //      (elles passent peut-être dedans, pas en direct).
  const factureShopifyVue = inWindow.some(
    (t) => t.category === "ABONNEMENT" && /shopify/i.test(t.description) && t.amountCents < 0
  );
  const sinceLabel = `${sinceDay.slice(8, 10)}/${sinceDay.slice(5, 7)}`;
  // UNE seule alerte groupée — 13 cartes empilées noyaient la page (Badr
  // 19/08 : « bien organisé, on repère et on descend lire le détail »).
  const abosManquants: string[] = [];
  for (const p of SUBSCRIPTION_PATTERNS) {
    // Seuls les abonnements payés par la LLC et non couverts par la facture
    // Shopify sont réclamés (avances perso : paidBy posé → jamais réclamé).
    const actifs = subsForPattern(p.label, untilDay).filter((s) => !s.paidBy && !s.noBankClaim);
    if (actifs.length === 0) continue;
    if (actifs.every((s) => s.category === "APP_SHOPIFY") && factureShopifyVue) continue;
    const paid = inWindow.some((t) => t.subscriptionLabel === p.label && t.amountCents < 0);
    if (!paid) abosManquants.push(`${p.label} (~${eur(actifs.reduce((a, s) => a + monthlyEurCents(s), 0))}/mois)`);
  }
  if (abosManquants.length > 0) {
    anomalies.push({
      kind: "ABO_NON_DEBITE",
      severity: "amber",
      label: `${abosManquants.length} abonnement(s) sans débit vu depuis le ${sinceLabel}`,
      detail:
        `${abosManquants.join(" · ")}. ` +
        (slashConnected
          ? "Payés via la facture Shopify ? Sinon : impayés — vérifier avant une coupure de service."
          : "Peuvent passer sur la carte Slash (pas encore branchée) ou via la facture Shopify — à confirmer au branchement."),
    });
  }

  // 3) Abonnement débité à un montant qui ne colle pas (> ±20 % du mensuel
  //    couvert — Claude = 120 €/mois plafond, au-delà = crédits consommés).
  //    Un abonnement en FIN DE CONTRAT (endDay posé, ex. Jeremy payé en une
  //    fois : prorata juillet + août complet) fait des paiements de clôture
  //    atypiques NORMAUX → pas d'alerte de montant (Badr 19/08).
  for (const p of SUBSCRIPTION_PATTERNS) {
    const matches = subsForPattern(p.label, untilDay);
    if (matches.length === 0) continue;
    if (matches.every((s) => s.endDay !== null)) continue;
    const expected = matches.reduce((a, s) => a + monthlyEurCents(s), 0);
    if (expected <= 0) continue;
    const paidTx = inWindow.filter((t) => t.subscriptionLabel === p.label && t.amountCents < 0);
    const paid = -paidTx.reduce((a, t) => a + (t.amountEurCents ?? 0), 0);
    if (paidTx.length > 0 && (paid > expected * 1.2 || paid < expected * 0.8)) {
      anomalies.push({
        kind: "ABO_MONTANT",
        severity: "amber",
        label: `${p.label} : ${eur(paid)} débités vs ~${eur(expected)} attendus`,
        detail: paidTx.length > 1 ? `${paidTx.length} débits sur la fenêtre — double facturation ?` : "Montant inhabituel — changement de plan ou frais d'usage ?",
      });
    }
  }

  // 4) Écart Meta significatif (le total de fenêtre doit coller) — sauf en
  //    attente Slash (metaPending) : le spend est débité sur la carte Slash.
  if (reconciliation && !reconciliation.metaPending && reconciliation.meta.expectedCents > 0) {
    const gap = reconciliation.meta.gapCents;
    if (Math.abs(gap) > Math.max(1000, reconciliation.meta.expectedCents * 0.05)) {
      anomalies.push({
        kind: "META_ECART",
        severity: "red",
        label: `Meta : ${eur(reconciliation.meta.bankCents)} débités vs ${eur(reconciliation.meta.expectedCents)} de spend enregistré (écart ${gap > 0 ? "+" : "−"}${eur(gap)})`,
        detail: "Meta facture par paliers — ne s'inquiéter que si l'écart persiste plusieurs jours.",
      });
    }
  }

  // 5) Payout Shopify manquant : du CA récent mais aucun crédit depuis 5 j.
  if (reconciliation && reconciliation.shopify.expectedCents > 0) {
    const lastCredit = inWindow.filter((t) => t.category === "SHOPIFY" && t.amountCents > 0).map((t) => t.day).sort().pop() ?? null;
    const fiveDaysAgo = addDaysToDay(untilDay, -5);
    if (lastCredit === null || lastCredit < fiveDaysAgo) {
      anomalies.push({
        kind: "PAYOUT_MANQUANT",
        severity: "amber",
        label: lastCredit === null ? "Aucun versement Shopify vu sur 30 j" : `Dernier versement Shopify : ${lastCredit.slice(8, 10)}/${lastCredit.slice(5, 7)} (> 5 j)`,
        detail: "Les payouts vont peut-être sur un autre compte — sinon, vérifier Shopify Payments (versement suspendu ?).",
      });
    }
  }

  // 6) Double débit : même jour, même montant, même libellé — UNE alerte par
  //    groupe (3 passages identiques ne font pas 2 alertes), et uniquement
  //    sur l'argent SOCIÉTÉ : deux courses Careem identiques sur la carte
  //    perso d'Adnane ne sont pas un sujet de contrôle LLC (Badr 19/08).
  const seen = new Map<string, { tx: BankTx; count: number }>();
  for (const t of debits) {
    if (t.label === "PERSO_BADR" || t.label === "PERSO_FAHD") continue;
    const key = `${t.day}|${t.amountCents}|${t.description.toLowerCase().replace(/\s+/g, " ").trim()}`;
    const g = seen.get(key);
    if (g) g.count++;
    else seen.set(key, { tx: t, count: 1 });
  }
  for (const { tx: t, count } of seen.values()) {
    if (count < 2) continue;
    anomalies.push({
      kind: "DOUBLE_DEBIT",
      severity: "amber",
      label: `Double débit possible le ${t.day.slice(8, 10)}/${t.day.slice(5, 7)} : « ${t.description} » ×${count} (${eur(t.amountCents)} chacun)`,
      detail: "Passages identiques le même jour — si c'est voulu, marque les doublons « Ignorer ».",
    });
  }

  // 7) POINTAGE FOURNISSEUR : chaque facture Panda (supplierBills.ts, avec
  //    ses montants payés annoncés) doit avoir SON virement en banque, et
  //    chaque virement Panda SA facture — matching par montant (±2 %, les
  //    taux de change du jour varient). C'est le « relie toutes les
  //    données » de Badr 19/08 : les factures couvrent le stock DÉJÀ vendu.
  const pandaTxs = debits.filter((t) => t.category === "FOURNISSEUR" && !(t.labelNote?.startsWith("frais lié") ?? false));
  const fournisseurPointage: string[] = [];
  const pointes = new Set<string>();
  for (const bill of SUPPLIER_BILLS) {
    const target = bill.paidCents > 0 ? bill.paidCents : bill.totalCents;
    const match = pandaTxs.find(
      (t) => !pointes.has(t.txId) && t.amountEurCents !== null && Math.abs(Math.abs(t.amountEurCents) - target) <= target * 0.02
    );
    if (match) {
      pointes.add(match.txId);
      fournisseurPointage.push(
        `✓ ${bill.ref} (${eur(bill.totalCents)}) pointée en banque le ${match.day.slice(8, 10)}/${match.day.slice(5, 7)} (${match.bank})`
      );
    } else if (bill.status === "payee") {
      if (bill.issuedDay >= sinceDay) {
        anomalies.push({
          kind: "FOURNISSEUR_ECART",
          severity: "amber",
          label: `${bill.ref} : annoncée payée mais aucun virement bancaire de ~${eur(target)} trouvé`,
          detail: "Payée depuis un compte non branché ? Vérifier le montant du virement.",
        });
      } else {
        fournisseurPointage.push(`• ${bill.ref} : payée avant la fenêtre de contrôle (01/08)`);
      }
    } else {
      anomalies.push({
        kind: "FOURNISSEUR_ECART",
        severity: "amber",
        label: `${bill.ref} : ${eur(bill.totalCents - bill.paidCents)} restant à payer au fournisseur`,
        detail: "Facture non soldée dans le suivi fournisseur (onglet Dépenses).",
      });
    }
  }
  // Un virement Panda sans facture dans le suivi = le règlement d'une
  // facture ANTÉRIEURE au point de départ du ledger (réputée soldée,
  // décision Badr 14/08) — information, PAS une anomalie (Badr 19/08 :
  // « c'est forcément une facture d'avant début août, tu ne me remontes
  // pas l'anomalie »).
  for (const t of pandaTxs) {
    if (pointes.has(t.txId)) continue;
    fournisseurPointage.push(
      `• Virement Panda de ${eur(Math.abs(t.amountEurCents ?? 0))} le ${t.day.slice(8, 10)}/${t.day.slice(5, 7)} : facture antérieure au suivi (réputée soldée)`
    );
  }

  // Parts : Société = catégories société + affectés SOCIETE ; perso = affectés.
  // Un FRAIS hérité d'une dépense perso (label PERSO_*) reste dans la part
  // perso — jamais compté deux fois.
  const sumAbs = (list: BankTx[]) => list.reduce((a, t) => a + Math.abs(t.amountEurCents ?? 0), 0);
  const CATS_SOCIETE: TxCategory[] = ["META", "GOOGLE_ADS", "ABONNEMENT", "FOURNISSEUR", "FRAIS"];
  const societe = debits.filter(
    (t) =>
      ((CATS_SOCIETE.includes(t.category) || (t.category === "SHOPIFY" && t.amountCents < 0)) &&
        t.label !== "PERSO_BADR" &&
        t.label !== "PERSO_FAHD") ||
      t.label === "SOCIETE"
  );
  const badr = debits.filter((t) => t.label === "PERSO_BADR");
  const fahd = debits.filter((t) => t.label === "PERSO_FAHD");

  anomalies.sort((a, b) => (a.severity === b.severity ? 0 : a.severity === "red" ? -1 : 1));

  return {
    anomalies,
    parts: {
      societeCents: sumAbs(societe),
      persoBadrCents: sumAbs(badr),
      persoFahdCents: sumAbs(fahd),
      aAffecterCents: sumAbs(toAssign),
      aAffecterCount: toAssign.length,
      soldeBadrDoitAFahdCents: Math.round((sumAbs(badr) - sumAbs(fahd)) / 2),
    },
    toAssign: [...toAssign].sort((a, b) => b.day.localeCompare(a.day)),
    fournisseurPointage,
  };
}

// --- Rapport complet ------------------------------------------------------------

export interface BankReport {
  ready: boolean;
  /** message d'installation quand une banque n'est pas branchée */
  setup: string[];
  /** false tant que le connecteur Slash n'est pas branché (doc en attente) */
  slashConnected: boolean;
  balances: BankBalance[];
  txs: BankTx[];
  reconciliation: BankReconciliation | null;
  control: ControlReport | null;
  warnings: string[];
  /** Cashback Slash gagné sur la fenêtre (contre-valeur EUR) — à récupérer,
   * pas encore de l'argent entré. null = Slash absent. */
  slashCashbackEurCents: number | null;
  /** Cashback TOTAL depuis le tout début (macaron, Badr 19/08). */
  cashbackTotalEurCents: number | null;
  /** Argent EN ROUTE : le solde Shopify Payments réel (ce que Shopify doit,
   * toutes boutiques). missingScopes = ajouter read_shopify_payments_accounts
   * sur les apps custom (Badr 19/08 : « j'ajoute le scope »). */
  enRoute: { totalEurCents: number; missingScopes: boolean } | null;
}

/** Solde Shopify Payments réel (l'argent que Shopify DOIT, pas encore
 * versé) — la « part d'Adnane réaliste » en dépend (Badr 19/08 : « il y a de
 * l'argent qu'on n'a pas encaissé, comment on peut avoir la réalité ? »).
 * Nécessite le scope read_shopify_payments_accounts sur chaque app custom. */
async function fetchShopifyEnRoute(): Promise<{ totalEurCents: number; missingScopes: boolean; skipped: string[] }> {
  const { getShopifyStoreConfigs, resolveAccessToken } = await import("./shopify");
  let totalEurCents = 0;
  let missingScopes = false;
  const skipped: string[] = [];
  const pending: { amount: number; currency: string }[] = [];
  for (const config of getShopifyStoreConfigs()) {
    try {
      const token = await resolveAccessToken(config);
      const res = await fetch(`https://${config.domain}/admin/api/2025-01/graphql.json`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": token },
        body: JSON.stringify({ query: "{ shopifyPaymentsAccount { balance { amount currencyCode } } }" }),
      });
      if (!res.ok) {
        skipped.push(`${config.market} (HTTP ${res.status})`);
        continue;
      }
      const json = (await res.json()) as {
        data?: { shopifyPaymentsAccount?: { balance?: { amount?: string; currencyCode?: string }[] | { amount?: string; currencyCode?: string } } | null };
        errors?: { message?: string }[];
      };
      if (json.errors?.some((e) => /access denied|scope/i.test(e.message ?? ""))) {
        missingScopes = true;
        skipped.push(`${config.market} (scope manquant)`);
        continue;
      }
      const bal = json.data?.shopifyPaymentsAccount?.balance;
      const list = Array.isArray(bal) ? bal : bal ? [bal] : [];
      for (const b of list) {
        const amount = Number(b.amount);
        if (Number.isFinite(amount) && b.currencyCode) pending.push({ amount, currency: b.currencyCode });
      }
    } catch (err) {
      skipped.push(`${config.market} (${(err as Error).message.slice(0, 60)})`);
    }
  }
  // Conversion EUR : EUR direct, USD au taux figé, le reste (GBP…) au taux
  // Wise du jour quand le jeton Wise est là — sinon la devise est ignorée
  // et signalée (jamais convertie au pif).
  const others = [...new Set(pending.map((p) => p.currency).filter((c) => c !== "EUR" && c !== "USD"))];
  const wiseToken = process.env.WISE_API_TOKEN;
  const rates = others.length > 0 && wiseToken ? await fetchWiseRates(others, wiseToken) : new Map<string, number>();
  for (const p of pending) {
    const cents = Math.round(p.amount * 100);
    const eur = toEurCents(cents, p.currency, rates);
    if (eur === null) skipped.push(`${p.currency} sans taux`);
    else totalEurCents += eur;
  }
  return { totalEurCents, missingScopes, skipped };
}

const fetchShopifyEnRouteCached = unstable_cache(async () => fetchShopifyEnRoute(), ["shopify-enroute-v1"], {
  revalidate: 900,
  tags: ["bank"],
});

/** CASHBACK TOTAL depuis le tout début (macaron demandé par Badr 19/08 :
 * « pour se rendre compte de ce que ça représente ») — balayage léger de
 * toutes les transactions Slash depuis le début d'activité, on ne somme QUE
 * cashbackInfo. Cache 1 h : le total ne bouge pas à la minute. */
async function fetchSlashCashbackTotal(sinceDay: string): Promise<number> {
  const token = process.env.SLASH_API_TOKEN;
  if (!token) throw new Error("SLASH_API_TOKEN manquant.");
  let legalEntity: string | null = null;
  const call = (cursor: string | null): Promise<Response> => {
    const qs = new URLSearchParams({ "filter:from_date": String(Date.parse(`${sinceDay}T00:00:00.000Z`)) });
    if (cursor) qs.set("cursor", cursor);
    const headers: Record<string, string> = { "X-API-Key": token };
    if (legalEntity) headers["x-legal-entity"] = legalEntity;
    return fetch(`${SLASH_API}/transaction?${qs}`, { headers });
  };
  let res = await call(null);
  if (res.status === 400 && !legalEntity) {
    const leRes = await fetch(`${SLASH_API}/legal-entity`, { headers: { "X-API-Key": token } });
    if (!leRes.ok) throw new Error(`Slash /legal-entity : HTTP ${leRes.status}`);
    const leJson = (await leRes.json()) as { items?: { id?: string }[] } | { id?: string }[];
    const arr = Array.isArray(leJson) ? leJson : (leJson.items ?? []);
    legalEntity = arr[0]?.id ?? null;
    if (!legalEntity) throw new Error("Slash : aucune legal entity.");
    res = await call(null);
  }
  let totalCents = 0;
  for (let page = 0; page < 60; page++) {
    if (!res.ok) throw new Error(`Slash /transaction (cashback) : HTTP ${res.status}`);
    const json = (await res.json()) as { items?: SlashTx[]; metadata?: { nextCursor?: string } };
    for (const t of json.items ?? []) {
      const cb = t.cashbackInfo?.amountCents;
      if (typeof cb === "number" && cb > 0) totalCents += cb;
    }
    const next = json.metadata?.nextCursor;
    if (!next) break;
    res = await call(next);
  }
  return totalCents;
}

const fetchSlashCashbackTotalCached = unstable_cache(
  async (sinceDay: string) => fetchSlashCashbackTotal(sinceDay),
  ["slash-cashback-total-v1"],
  { revalidate: 3600, tags: ["bank"] }
);

const WINDOW_DAYS = 30;

/** Décision Badr 19/08 : « les abonnements du mois d'avant tu les oublies —
 * je veux les nouveaux problèmes à partir du début août ». Le CONTRÔLE
 * (anomalies, rapprochement, inbox À affecter) ne regarde JAMAIS avant ce
 * jour ; les transactions plus anciennes restent affichées, sans alerte. */
export const CONTROLE_START_DAY = "2026-08-01";

// --- Démo (NIVA_DEMO) : données synthétiques déterministes -------------------
// Même philosophie que le reste du mode démo : aucune API appelée, mais tout
// le pipeline réel (catégorisation → rapprochement → contrôle) s'exécute.
function demoBankData(untilDay: string): { txs: BankTx[]; balances: BankBalance[]; expected: ExpectedDaily[] } {
  const d = (n: number) => addDaysToDay(untilDay, -n);
  const mk = (day: string, description: string, eur: number): BankTx => {
    const amountCents = Math.round(eur * 100);
    const { category, subscriptionLabel } = categorizeTx(description, amountCents);
    return {
      bank: "WISE",
      txId: `demo-${day}-${description}`,
      day,
      amountCents,
      currency: "EUR",
      amountEurCents: amountCents,
      description,
      category,
      subscriptionLabel,
      label: null,
      labelNote: null,
    };
  };
  const txs = [
    mk(d(0), "Received money from Stripe Payments UK Ltd with reference Shopify D9K9P7", 2045.72),
    mk(d(1), "Received money from Stripe Payments UK Ltd with reference Shopify Q2U6X0", 1392.31),
    mk(d(2), "Received money from Stripe Payments UK Ltd with reference Shopify F0J6G0", 1654.43),
    mk(d(2), "OVH SAS", -34.9),
    mk(d(3), "KLAVIYO INC", -25),
    mk(d(5), "Received money from Stripe Payments UK Ltd with reference Shopify J6J0Z1", 1814.09),
    mk(d(6), "Received money from SLASH - KINDREDM", 2000),
  ];
  const balances: BankBalance[] = [
    { bank: "WISE", currency: "EUR", amountCents: 742596, amountEurCents: 742596 },
    { bank: "WISE", currency: "USD", amountCents: 140000, amountEurCents: Math.round(140000 * USD_TO_EUR) },
    { bank: "WISE", currency: "CAD", amountCents: 178478, amountEurCents: null },
  ];
  const expected: ExpectedDaily[] = Array.from({ length: 7 }, (_, i) => ({
    day: d(i),
    caCents: 400000,
    spendCents: 150000,
    feesCents: 80000,
  }));
  return { txs, balances, expected };
}

// ⚠️ Clés VERSIONNÉES : le cache survit aux déploiements — un nouveau code
// qui lit une entrée écrite par l'ancien (autre forme de retour) plantait la
// page en prod (crash « reading 'bank' », Badr 19/08 21h33). À CHAQUE
// changement de forme de retour, incrémenter le suffixe.
const fetchWiseCached = unstable_cache(
  async (sinceDay: string, untilDay: string) => fetchWiseData(sinceDay, untilDay),
  ["wise-data-v2"],
  { revalidate: 900, tags: ["bank"] } // 15 min — les banques ne bougent pas plus vite
);

const fetchSlashCached = unstable_cache(
  async (sinceDay: string, untilDay: string) => fetchSlashData(sinceDay, untilDay),
  ["slash-data-v2"],
  { revalidate: 900, tags: ["bank"] }
);

/** supabase = null ⇢ mode démo : données synthétiques, aucune lecture. */
export async function buildBankReport(supabase: SupabaseClient | null): Promise<BankReport> {
  const untilDay = todayParisDay();
  const sinceDay = addDaysToDay(untilDay, -(WINDOW_DAYS - 1));
  const setup: string[] = [];
  const warnings: string[] = [];
  // true dès que le fetch Slash réussit — débloque le contrôle Meta +
  // abonnements sur la carte LLC (metaPending, ABO_NON_DEBITE complet).
  let slashConnected = false;

  // Fenêtre de CONTRÔLE : jamais avant le 01/08 (décision Badr 19/08) —
  // l'affichage des transactions garde ses 30 j, les alertes non.
  const controlSince = sinceDay > CONTROLE_START_DAY ? sinceDay : CONTROLE_START_DAY;

  if (!supabase) {
    const demo = demoBankData(untilDay);
    const reconciliation = reconcile(demo.txs, demo.expected, controlSince, untilDay, { slashConnected });
    const control = computeControl({ txs: demo.txs, reconciliation, sinceDay: controlSince, untilDay, slashConnected });
    return {
      ready: true,
      setup: ["Mode démo : données bancaires synthétiques (aucune API appelée)."],
      slashConnected,
      balances: demo.balances,
      txs: demo.txs,
      reconciliation,
      control,
      warnings: [],
      slashCashbackEurCents: 2150,
      cashbackTotalEurCents: 9640,
      enRoute: { totalEurCents: 185000, missingScopes: false },
    };
  }

  let txs: BankTx[] = [];
  let balances: BankBalance[] = [];
  let slashCashbackEurCents: number | null = null;
  // Argent en route (solde Shopify Payments réel) + cashback total depuis le
  // début — lancés en parallèle des banques, jamais bloquants.
  const enRoutePromise = fetchShopifyEnRouteCached().catch(() => null);
  const cashbackTotalPromise = process.env.SLASH_API_TOKEN
    ? fetchSlashCashbackTotalCached("2026-05-01").catch(() => null)
    : Promise.resolve(null);
  if (!process.env.WISE_API_TOKEN) {
    setup.push("Wise : ajouter WISE_API_TOKEN (jeton read-only) dans les variables Vercel.");
  } else {
    try {
      const wise = await fetchWiseCached(sinceDay, untilDay);
      txs = wise.txs;
      balances = wise.balances;
    } catch (err) {
      warnings.push(`Wise : ${(err as Error).message}`);
    }
  }
  if (!process.env.SLASH_API_TOKEN) {
    setup.push("Slash : ajouter SLASH_API_TOKEN (clé API du dashboard Slash) dans les variables Vercel.");
  } else {
    try {
      const slash = await fetchSlashCached(sinceDay, untilDay);
      // « ?? [] » : ceinture-bretelles contre une entrée de cache d'une
      // version antérieure (le crash prod du 19/08).
      txs = txs.concat(slash.txs ?? []);
      txs.sort((a, b) => b.day.localeCompare(a.day) || a.txId.localeCompare(b.txId));
      balances = balances.concat(slash.balances ?? []);
      slashCashbackEurCents = typeof slash.cashbackCents === "number" ? toEurCents(slash.cashbackCents, "USD") : null;
      slashConnected = true;
      if ((slash.balances ?? []).length === 0) {
        warnings.push("Slash : transactions lues mais solde illisible — la répartition Badr/Adnane ne compte que Wise.");
      }
    } catch (err) {
      warnings.push(`Slash : ${(err as Error).message}`);
    }
  }

  // Affectations manuelles (bank_tx_labels) — table optionnelle : si la
  // migration 0013 n'est pas passée, on le dit au lieu de casser.
  if (txs.length > 0) {
    const { data: labelRows, error: labelErr } = await supabase
      .from("bank_tx_labels")
      .select("bank, tx_id, kind, note");
    if (labelErr) {
      if (/does not exist|relation|schema cache/i.test(labelErr.message)) {
        warnings.push("Table bank_tx_labels absente — colle la migration 0013_bank_labels.sql dans Supabase pour activer l'affectation des transactions.");
      } else {
        warnings.push(`Affectations illisibles : ${labelErr.message}`);
      }
    } else {
      const byKey = new Map((labelRows ?? []).map((r) => [`${r.bank}|${r.tx_id}`, r]));
      for (const t of txs) {
        const l = byKey.get(`${t.bank}|${t.txId}`);
        if (l) {
          t.label = l.kind as TxLabel;
          t.labelNote = (l.note as string | null) ?? null;
        }
      }
    }
  }

  let reconciliation: BankReconciliation | null = null;
  if (txs.length > 0) {
    const { data, error } = await supabase
      .from("daily_aggregates")
      .select("day, ca_cents, spend_cents, fees_cents")
      .gte("day", sinceDay)
      .lte("day", untilDay);
    if (error) {
      warnings.push(`Agrégats dashboard illisibles : ${error.message}`);
    } else {
      const byDay = new Map<string, ExpectedDaily>();
      for (const r of data ?? []) {
        const day = String(r.day);
        const e = byDay.get(day) ?? { day, caCents: 0, spendCents: 0, feesCents: 0 };
        e.caCents += (r.ca_cents as number) ?? 0;
        e.spendCents += (r.spend_cents as number) ?? 0;
        e.feesCents += (r.fees_cents as number) ?? 0;
        byDay.set(day, e);
      }
      reconciliation = reconcile(txs, [...byDay.values()].filter((e) => e.day >= controlSince), controlSince, untilDay, {
        slashConnected,
      });
      warnings.push(...reconciliation.warnings);
    }
  }

  const control =
    txs.length > 0 ? computeControl({ txs, reconciliation, sinceDay: controlSince, untilDay, slashConnected }) : null;

  const [enRouteRes, cashbackTotalRaw] = await Promise.all([enRoutePromise, cashbackTotalPromise]);
  const cashbackTotalEurCents = typeof cashbackTotalRaw === "number" ? toEurCents(cashbackTotalRaw, "USD") : null;
  const enRoute = enRouteRes ? { totalEurCents: enRouteRes.totalEurCents, missingScopes: enRouteRes.missingScopes } : null;
  if (enRouteRes?.missingScopes) {
    setup.push(
      "Argent en route : ajouter les scopes read_shopify_payments_accounts + read_shopify_payments_payouts sur chaque app custom (dev.shopify.com → app → Scopes) pour lire le solde exact que Shopify vous doit."
    );
  }

  return {
    ready: txs.length > 0,
    setup,
    slashConnected,
    balances,
    txs: txs.slice(0, 200),
    reconciliation,
    control,
    warnings,
    slashCashbackEurCents,
    cashbackTotalEurCents,
    enRoute,
  };
}
