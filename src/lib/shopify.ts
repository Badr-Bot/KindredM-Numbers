import type { Market } from "./engine";

const API_VERSION = "2025-01";
// Rate limit REST Shopify ~2 req/s (bucket leaky) — on reste conservateur (§2).
const MIN_DELAY_MS = 550;

export interface ShopifyStoreConfig {
  market: Market;
  domain: string;
  /** Token statique (shpat_…) si fourni directement. */
  token?: string;
  /** Sinon, identifiants pour le grant client_credentials (recommandé, Dev Dashboard 2026). */
  clientId?: string;
  clientSecret?: string;
}

const MARKETS: Market[] = ["ES", "UK", "DE", "FR"];

/**
 * Deux méthodes d'auth par store, au choix (dans .env.local) :
 *   1. SHOPIFY_<M>_TOKEN=shpat_…                          (token statique)
 *   2. SHOPIFY_<M>_CLIENT_ID + SHOPIFY_<M>_CLIENT_SECRET  (client_credentials)
 * La 2e est la méthode actuelle du Dev Dashboard : le token est obtenu
 * automatiquement à l'exécution (voir resolveAccessToken).
 */
export function getShopifyStoreConfigs(): ShopifyStoreConfig[] {
  return MARKETS.map((market) => {
    const domain = process.env[`SHOPIFY_${market}_DOMAIN`];
    const token = process.env[`SHOPIFY_${market}_TOKEN`];
    const clientId = process.env[`SHOPIFY_${market}_CLIENT_ID`];
    const clientSecret = process.env[`SHOPIFY_${market}_CLIENT_SECRET`];

    if (!domain) {
      throw new Error(`Variable manquante pour le store ${market}: SHOPIFY_${market}_DOMAIN`);
    }
    if (!token && !(clientId && clientSecret)) {
      throw new Error(
        `Auth manquante pour le store ${market}: définis SHOPIFY_${market}_TOKEN, ou SHOPIFY_${market}_CLIENT_ID + SHOPIFY_${market}_CLIENT_SECRET`
      );
    }
    return { market, domain, token, clientId, clientSecret };
  });
}

// Cache des tokens obtenus par client_credentials (par domaine), le temps du process.
const tokenCache = new Map<string, { token: string; expiresAt: number }>();

/** Résout le token d'accès d'un store : statique, ou via client_credentials (24 h, mis en cache). */
export async function resolveAccessToken(config: ShopifyStoreConfig): Promise<string> {
  if (config.token) return config.token;
  if (!config.clientId || !config.clientSecret) {
    throw new Error(`Store ${config.market}: ni token ni client_id/secret.`);
  }

  const cached = tokenCache.get(config.domain);
  if (cached && cached.expiresAt > Date.now() + 60_000) return cached.token;

  const res = await fetch(`https://${config.domain}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      grant_type: "client_credentials",
    }),
  });
  if (!res.ok) {
    throw new Error(
      `client_credentials échoué pour ${config.market} (${res.status}) : ${await summarizeErrorBody(res)}`
    );
  }
  const body: { access_token: string; expires_in?: number } = await res.json();
  const expiresAt = Date.now() + (body.expires_in ?? 86400) * 1000;
  tokenCache.set(config.domain, { token: body.access_token, expiresAt });
  return body.access_token;
}

export interface ShopifyLineItem {
  title: string;
  sku: string | null;
  quantity: number;
  price: string;
}

export interface ShopifyRefundTransaction {
  /** Doc Shopify : par défaut dans la devise DU CLIENT (presentment), pas
   * celle de la boutique — contrairement à Order.total_price. La commande
   * embarquée (order.refunds[].transactions[]) n'a PAS de variante « devise
   * boutique » (pas de amount_set sur Transaction, contrairement à Order ou
   * RefundLineItem) : impossible de lire un montant EUR fiable sans un
   * second appel — voir computeRefundedCentsAccurate. */
  amount: string;
  kind: string;
}

export interface ShopifyRefund {
  id: number;
  created_at: string;
  transactions: ShopifyRefundTransaction[];
}

export interface ShopifyMoneySet {
  shop_money?: { amount: string; currency_code: string };
  presentment_money?: { amount: string; currency_code: string };
}

export interface ShopifyOrder {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
  total_price: string;
  /** Identifiant client (numérique, aucune donnée personnelle) — réachat. */
  customer?: { id?: number } | null;
  /** Acquisition : canal déclaré + site référent + page d'atterrissage. */
  source_name?: string | null;
  referring_site?: string | null;
  landing_site?: string | null;
  /** Montant total dans les deux devises. shop_money = devise boutique
   * (EUR) = source de vérité pour le CA. total_price seul peut, sur certaines
   * commandes multi-devises, revenir en devise client (même piège que les
   * remboursements) — voir totalPriceShopCents. */
  total_price_set?: ShopifyMoneySet;
  currency?: string;
  financial_status: string;
  line_items: ShopifyLineItem[];
  shipping_address: { country_code: string } | null;
  refunds: ShopifyRefund[];
}

/** true si la migration 0008 (colonnes acquisition) est appliquée — sinon on
 * écrit les commandes SANS ces champs plutôt que d'échouer (les ventes
 * doivent TOUJOURS passer, migration ou pas). */
export async function acquisitionColumnsReady(
  supabase: import("@supabase/supabase-js").SupabaseClient
): Promise<boolean> {
  const { error } = await supabase.from("orders").select("customer_id").limit(1);
  return !error;
}

/** Champs acquisition/réachat d'une commande, prêts pour l'upsert. */
export function orderAcquisitionFields(order: ShopifyOrder): Record<string, unknown> {
  return {
    customer_id: order.customer?.id != null ? String(order.customer.id) : null,
    source_name: order.source_name ?? null,
    referring_site: (order.referring_site ?? "").slice(0, 300) || null,
    landing_site: (order.landing_site ?? "").slice(0, 300) || null,
  };
}

/** CA d'une commande en centimes, TOUJOURS en devise boutique (EUR) : lit
 * total_price_set.shop_money en priorité, retombe sur total_price si absent
 * (commandes anciennes / réponses partielles). */
export function totalPriceShopCents(order: ShopifyOrder): number {
  const shopAmount = order.total_price_set?.shop_money?.amount ?? order.total_price;
  return Math.round(parseFloat(shopAmount) * 100);
}

function sumRefundTransactions(transactions: ShopifyRefundTransaction[]): number {
  return transactions
    .filter((t) => t.kind === "refund")
    .reduce((s, t) => s + Math.round(parseFloat(t.amount) * 100), 0);
}

/** Lecture naïve depuis la commande embarquée — `amount` y est en devise
 * CLIENT par défaut (bug 29/06 : DZD lu comme EUR). Gardé pour compat/tests
 * uniquement ; le pipeline réel utilise computeRefundedCentsAccurate. */
export function computeRefundedCents(order: ShopifyOrder): number {
  return order.refunds.reduce((sum, refund) => sum + sumRefundTransactions(refund.transactions), 0);
}

/**
 * Version exacte, en devise boutique (EUR) : Shopify ne documente
 * `in_shop_currency=true` que sur l'endpoint dédié transactions.json, pas
 * sur orders.json — un second appel est donc nécessaire, mais UNIQUEMENT
 * pour les commandes qui ont effectivement un remboursement (rare), donc
 * sans impact notable sur le volume d'appels réseau du backfill.
 */
export async function computeRefundedCentsAccurate(
  config: ShopifyStoreConfig,
  token: string,
  order: ShopifyOrder
): Promise<number> {
  if (order.refunds.length === 0) return 0;
  // Anti rate-limit : ces appels partent en rafale (un par commande
  // remboursée du scan) sans le délai de 550 ms de la pagination — un 429
  // faisait échouer TOUT le lot du store pour le cycle (constaté 20/07 :
  // « 7 ventes, 1 affichée »). Retry sur 429, et en dernier recours repli
  // sur le montant embarqué plutôt que d'abandonner la commande.
  try {
    for (let attempt = 0; attempt < 3; attempt++) {
      const res = await fetch(
        `https://${config.domain}/admin/api/${API_VERSION}/orders/${order.id}/transactions.json?in_shop_currency=true`,
        { headers: { "X-Shopify-Access-Token": token } }
      );
      if (res.status === 429) {
        const retryAfter = Number(res.headers.get("Retry-After") ?? "2");
        await new Promise((r) => setTimeout(r, retryAfter * 1000));
        continue;
      }
      if (!res.ok) break;
      const body: { transactions: ShopifyRefundTransaction[] } = await res.json();
      return sumRefundTransactions(body.transactions);
    }
  } catch {
    /* réseau — repli ci-dessous */
  }
  return computeRefundedCents(order);
}

function parseNextLink(linkHeader: string | null): string | null {
  if (!linkHeader) return null;
  for (const part of linkHeader.split(",")) {
    const [urlPart, relPart] = part.split(";").map((s) => s.trim());
    if (relPart === 'rel="next"') {
      return urlPart.slice(1, -1);
    }
  }
  return null;
}

/**
 * Réduit un corps d'erreur Shopify à un message lisible : JSON tel quel,
 * HTML débarrassé de ses balises et tronqué. Évite qu'une page d'erreur
 * Shopify entière (CSS + SVG inline) ne s'affiche brute dans l'UI.
 */
async function summarizeErrorBody(res: Response): Promise<string> {
  const text = await res.text();
  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("json")) return text.slice(0, 300);
  const stripped = text
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return stripped.slice(0, 300) || `HTTP ${res.status}`;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function shopifyFetch(
  url: string,
  token: string
): Promise<{ body: { orders: ShopifyOrder[] }; nextUrl: string | null }> {
  const res = await fetch(url, {
    headers: { "X-Shopify-Access-Token": token, "Content-Type": "application/json" },
  });
  if (res.status === 429) {
    const retryAfter = Number(res.headers.get("Retry-After") ?? "2");
    await delay(retryAfter * 1000);
    return shopifyFetch(url, token);
  }
  if (!res.ok) {
    throw new Error(`Shopify API error ${res.status} sur ${url}: ${await res.text()}`);
  }
  const body = await res.json();
  return { body, nextUrl: parseNextLink(res.headers.get("Link")) };
}

export interface IterateOrdersOptions {
  createdAtMin?: string;
  updatedAtMin?: string;
  status?: string;
}

/** Itère toutes les commandes d'un store, paginées 250/page via l'en-tête Link (§2). */
export async function* iterateOrders(
  config: ShopifyStoreConfig,
  options: IterateOrdersOptions = {}
): AsyncGenerator<ShopifyOrder> {
  const params = new URLSearchParams({ limit: "250", status: options.status ?? "any" });
  if (options.createdAtMin) params.set("created_at_min", options.createdAtMin);
  if (options.updatedAtMin) params.set("updated_at_min", options.updatedAtMin);

  const token = await resolveAccessToken(config);
  let url: string | null = `https://${config.domain}/admin/api/${API_VERSION}/orders.json?${params.toString()}`;

  while (url) {
    const { body, nextUrl }: { body: { orders: ShopifyOrder[] }; nextUrl: string | null } = await shopifyFetch(url, token);
    for (const order of body.orders) {
      yield order;
    }
    url = nextUrl;
    if (url) await delay(MIN_DELAY_MS);
  }
}
