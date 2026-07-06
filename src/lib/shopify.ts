import type { Market } from "./engine";

const API_VERSION = "2025-01";
// Rate limit REST Shopify ~2 req/s (bucket leaky) — on reste conservateur (§2).
const MIN_DELAY_MS = 550;

export interface ShopifyStoreConfig {
  market: Market;
  domain: string;
  token: string;
}

const MARKETS: Market[] = ["ES", "UK", "DE", "FR"];

export function getShopifyStoreConfigs(): ShopifyStoreConfig[] {
  return MARKETS.map((market) => {
    const domain = process.env[`SHOPIFY_${market}_DOMAIN`];
    const token = process.env[`SHOPIFY_${market}_TOKEN`];
    if (!domain || !token) {
      throw new Error(
        `Variables manquantes pour le store ${market}: SHOPIFY_${market}_DOMAIN / SHOPIFY_${market}_TOKEN`
      );
    }
    return { market, domain, token };
  });
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

  let url: string | null = `https://${config.domain}/admin/api/${API_VERSION}/orders.json?${params.toString()}`;

  while (url) {
    const { body, nextUrl }: { body: { orders: ShopifyOrder[] }; nextUrl: string | null } = await shopifyFetch(url, config.token);
    for (const order of body.orders) {
      yield order;
    }
    url = nextUrl;
    if (url) await delay(MIN_DELAY_MS);
  }
}
