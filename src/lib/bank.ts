import { createSign } from "node:crypto";
import { unstable_cache } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { addDaysToDay, toParisDay, todayParisDay } from "./time";
import { monthlyEurCents, SUBSCRIPTIONS, USD_TO_EUR } from "./subscriptions";

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
export type TxCategory = "META" | "SHOPIFY" | "ABONNEMENT" | "AUTRE";
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
}

export interface BankBalance {
  bank: BankName;
  currency: string;
  amountCents: number;
}

// --- Catégorisation par mots-clés --------------------------------------------
// Les motifs abonnements dérivent de la liste OFFICIELLE du dashboard
// (subscriptions.ts) : un abonnement reconnu est rapproché de son montant
// attendu ; tout le reste part en AUTRE, jamais avalé en silence.
const SUBSCRIPTION_PATTERNS: { label: string; re: RegExp }[] = [
  { label: "Claude (Badr)", re: /anthropic|claude/i },
  { label: "Klaviyo", re: /klaviyo/i },
  { label: "Shopify (abonnement)", re: /shopify\s*(inc)?\b(?!.*payout)/i },
  { label: "WeTracked", re: /wetracked/i },
  { label: "Vercel", re: /vercel/i },
  { label: "Canva", re: /canva/i },
  { label: "Hushed", re: /hushed/i },
  // Apps Shopify — parfois débitées en direct, parfois via la facture
  // Shopify (Badr 19/08 : « je ne sais pas si c'est Shopify qui prélève ou
  // bien eux ») : si une facture Shopify est débitée sur la fenêtre, on ne
  // réclame pas ces apps individuellement (voir computeControl).
  { label: "CWILL (Parcel Panel)", re: /cwill|parcel\s*panel/i },
  { label: "Moon Bundles", re: /moon\s*bundles?/i },
];

export function categorizeTx(description: string, amountCents: number): { category: TxCategory; subscriptionLabel: string | null } {
  const d = description.toLowerCase();
  if (/facebk|facebook|meta\s*platforms|metaplatforms/.test(d)) return { category: "META", subscriptionLabel: null };
  // crédit Shopify = versement (payout) ; débit Shopify = abonnement/app
  if (/shopify/.test(d) && amountCents > 0) return { category: "SHOPIFY", subscriptionLabel: null };
  for (const p of SUBSCRIPTION_PATTERNS) {
    if (p.re.test(description)) return { category: "ABONNEMENT", subscriptionLabel: p.label };
  }
  return { category: "AUTRE", subscriptionLabel: null };
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
  merchantData?: { description?: string };
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
  return {
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

export async function fetchSlashData(sinceDay: string, untilDay: string): Promise<{ txs: BankTx[] }> {
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

  const txs: BankTx[] = [];
  for (let page = 0; page < 20; page++) {
    if (!res.ok) throw new Error(`Slash /transaction : HTTP ${res.status} — ${(await res.text()).slice(0, 200)}`);
    const json = (await res.json()) as { items?: SlashTx[]; metadata?: { nextCursor?: string } };
    for (const t of json.items ?? []) {
      const mapped = mapSlashTx(t);
      if (mapped) txs.push(mapped);
    }
    const next = json.metadata?.nextCursor;
    if (!next) break;
    res = await call(next);
  }
  return { txs };
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
    balances: balances.map((b) => ({ bank: "WISE" as const, currency: b.currency, amountCents: Math.round(b.amount.value * 100) })),
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
    const known = SUBSCRIPTIONS.find((sub) => sub.label === p.label || sub.label.startsWith(p.label.split(" ")[0]));
    // Avance perso (ex. Hushed payé par Adnane) : pas un flux LLC — masqué
    // tant que rien n'apparaît en banque (si un débit apparaît, on l'affiche).
    if (known?.paidBy && paid === 0) continue;
    if (paid !== 0 || known) {
      subs.push({
        label: p.label,
        paidCents: paid,
        expectedMonthlyCents: known ? monthlyEurCents(known) : 0,
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
  | "DOUBLE_DEBIT";

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
  for (const p of SUBSCRIPTION_PATTERNS) {
    const known = SUBSCRIPTIONS.find((sub) => sub.label === p.label || sub.label.startsWith(p.label.split(" ")[0]));
    if (!known || known.endDay !== null || known.amount <= 0) continue;
    if (known.paidBy) continue; // avance perso (Badr/Adnane) — pas un débit LLC
    if (known.category === "APP_SHOPIFY" && factureShopifyVue) continue;
    const paid = inWindow.some((t) => t.subscriptionLabel === p.label && t.amountCents < 0);
    if (!paid) {
      anomalies.push({
        kind: "ABO_NON_DEBITE",
        severity: "amber",
        label: `${p.label} : aucun débit vu depuis le ${sinceLabel} (attendu ~${eur(monthlyEurCents(known))}/mois)`,
        detail: slashConnected
          ? "Payé via la facture Shopify ? Sinon : impayé — vérifier avant une coupure de service."
          : "Peut passer sur la carte Slash (pas encore branchée) ou via la facture Shopify — à confirmer au branchement. Sinon : impayé.",
      });
    }
  }

  // 3) Abonnement débité à un montant qui ne colle pas (> ±20 % du mensuel).
  for (const p of SUBSCRIPTION_PATTERNS) {
    const known = SUBSCRIPTIONS.find((sub) => sub.label === p.label || sub.label.startsWith(p.label.split(" ")[0]));
    if (!known) continue;
    const expected = monthlyEurCents(known);
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

  // 6) Double débit : même jour, même montant, même libellé.
  const seen = new Map<string, BankTx>();
  for (const t of debits) {
    const key = `${t.day}|${t.amountCents}|${t.description.toLowerCase().replace(/\s+/g, " ").trim()}`;
    const dup = seen.get(key);
    if (dup) {
      anomalies.push({
        kind: "DOUBLE_DEBIT",
        severity: "amber",
        label: `Double débit possible le ${t.day.slice(8, 10)}/${t.day.slice(5, 7)} : « ${t.description} » ×2 (${eur(t.amountCents)})`,
        detail: "Deux passages identiques le même jour — si c'est voulu, marque l'un des deux « Ignorer ».",
      });
    } else {
      seen.set(key, t);
    }
  }

  // Parts : Société = catégories société + affectés SOCIETE ; perso = affectés.
  const sumAbs = (list: BankTx[]) => list.reduce((a, t) => a + Math.abs(t.amountEurCents ?? 0), 0);
  const societe = debits.filter(
    (t) => t.category === "META" || t.category === "ABONNEMENT" || (t.category === "SHOPIFY" && t.amountCents < 0) || t.label === "SOCIETE"
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
}

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
    { bank: "WISE", currency: "EUR", amountCents: 742596 },
    { bank: "WISE", currency: "USD", amountCents: 140000 },
    { bank: "WISE", currency: "CAD", amountCents: 178478 },
  ];
  const expected: ExpectedDaily[] = Array.from({ length: 7 }, (_, i) => ({
    day: d(i),
    caCents: 400000,
    spendCents: 150000,
    feesCents: 80000,
  }));
  return { txs, balances, expected };
}

const fetchWiseCached = unstable_cache(
  async (sinceDay: string, untilDay: string) => fetchWiseData(sinceDay, untilDay),
  ["wise-data"],
  { revalidate: 900, tags: ["bank"] } // 15 min — les banques ne bougent pas plus vite
);

const fetchSlashCached = unstable_cache(
  async (sinceDay: string, untilDay: string) => fetchSlashData(sinceDay, untilDay),
  ["slash-data"],
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
    };
  }

  let txs: BankTx[] = [];
  let balances: BankBalance[] = [];
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
      txs = txs.concat(slash.txs);
      txs.sort((a, b) => b.day.localeCompare(a.day) || a.txId.localeCompare(b.txId));
      slashConnected = true;
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

  return { ready: txs.length > 0, setup, slashConnected, balances, txs: txs.slice(0, 120), reconciliation, control, warnings };
}
