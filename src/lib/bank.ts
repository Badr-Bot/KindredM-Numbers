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
//  • SLASH — API en bêta (X-API-Key) ; la doc exacte (docs.slash.com) n'était
//    pas accessible depuis l'environnement de dev : le connecteur attend
//    l'URL exacte de l'endpoint transactions pour être branché.
//    Env : SLASH_API_TOKEN (déjà posé, non consommé tant que non branché).
//
// Côté « prévu », tout vient du dashboard : spend Meta et CA (daily_aggregates,
// GLOBAL = somme des marchés) et abonnements (subscriptions.ts).
//
// Lecture seule de bout en bout — aucun ordre de paiement, jamais.
// ---------------------------------------------------------------------------

const WISE_API = "https://api.wise.com";

export type BankName = "WISE" | "SLASH";
export type TxCategory = "META" | "SHOPIFY" | "ABONNEMENT" | "AUTRE";

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

function toEurCents(amountCents: number, currency: string): number | null {
  if (currency === "EUR") return amountCents;
  if (currency === "USD") return Math.round(amountCents * USD_TO_EUR);
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
        amountEurCents: toEurCents(amountCents, t.amount.currency),
        description,
        category,
        subscriptionLabel,
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
  /** Shopify : crédits banque (payouts) vs CA net des frais estimés. Les
   * payouts arrivent en DIFFÉRÉ (2-4 j) : indicatif sur la fenêtre. */
  shopify: { bankCents: number; expectedCents: number; gapCents: number };
  /** Abonnements reconnus : payé vs attendu (mensuel) par libellé. */
  subscriptions: { label: string; paidCents: number; expectedMonthlyCents: number }[];
  /** Tout ce qui n'est ni Meta, ni Shopify, ni un abonnement connu. */
  others: BankTx[];
  warnings: string[];
}

export function reconcile(txs: BankTx[], expected: ExpectedDaily[], sinceDay: string, untilDay: string): BankReconciliation {
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
  if (metaExpected > 0 && Math.abs(metaGap) > Math.max(1000, metaExpected * 0.05)) {
    warnings.push(
      `Meta : la banque a débité ${(metaBank / 100).toFixed(0)} € pour ${(metaExpected / 100).toFixed(0)} € de spend enregistré — écart ${(metaGap / 100).toFixed(0)} €. Meta facture par paliers : vérifier seulement si l'écart persiste plusieurs jours.`
    );
  }

  return {
    sinceDay,
    untilDay,
    meta: { bankCents: metaBank, expectedCents: metaExpected, gapCents: metaGap },
    shopify: { bankCents: shopifyBank, expectedCents: shopifyExpected, gapCents: shopifyBank - shopifyExpected },
    subscriptions: subs,
    others,
    warnings,
  };
}

// --- Rapport complet ------------------------------------------------------------

export interface BankReport {
  ready: boolean;
  /** message d'installation quand une banque n'est pas branchée */
  setup: string[];
  balances: BankBalance[];
  txs: BankTx[];
  reconciliation: BankReconciliation | null;
  warnings: string[];
}

const WINDOW_DAYS = 30;

const fetchWiseCached = unstable_cache(
  async (sinceDay: string, untilDay: string) => fetchWiseData(sinceDay, untilDay),
  ["wise-data"],
  { revalidate: 900, tags: ["bank"] } // 15 min — les banques ne bougent pas plus vite
);

export async function buildBankReport(supabase: SupabaseClient): Promise<BankReport> {
  const untilDay = todayParisDay();
  const sinceDay = addDaysToDay(untilDay, -(WINDOW_DAYS - 1));
  const setup: string[] = [];
  const warnings: string[] = [];

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
  if (process.env.SLASH_API_TOKEN) {
    setup.push(
      "Slash : jeton posé mais connecteur en attente — la doc API (docs.slash.com) n'était pas accessible depuis l'environnement de dev ; donner l'URL exacte de l'endpoint transactions pour brancher."
    );
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
      reconciliation = reconcile(txs, [...byDay.values()], sinceDay, untilDay);
      warnings.push(...reconciliation.warnings);
    }
  }

  return { ready: txs.length > 0, setup, balances, txs: txs.slice(0, 120), reconciliation, warnings };
}
