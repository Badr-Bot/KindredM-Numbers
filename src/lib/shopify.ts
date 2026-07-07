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
  amount: string;
  kind: string;
}

export interface ShopifyRefund {
  id: number;
  created_at: string;
  transactions: ShopifyRefundTransaction[];
}

export interface ShopifyOrder {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
  total_price: string;
  financial_status: string;
  line_items: ShopifyLineItem[];
  shipping_address: { country_code: string } | null;
  refunds: ShopifyRefund[];
}

/** Somme des transactions de remboursement (kind === "refund"), en centimes. */
export function computeRefundedCents(order: ShopifyOrder): number {
  return order.refunds.reduce((sum, refund) => {
    const refundTotal = refund.transactions
      .filter((t) => t.kind === "refund")
      .reduce((s, t) => s + Math.round(parseFloat(t.amount) * 100), 0);
    return sum + refundTotal;
  }, 0);
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
