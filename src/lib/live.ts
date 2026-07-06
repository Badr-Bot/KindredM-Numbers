import { unstable_cache } from "next/cache";
import { createSupabaseServerClient } from "./supabase";
import { getShopifyStoreConfigs, iterateOrders, computeRefundedCents } from "./shopify";
import { fetchMetaSpend, mapCampaignToMarket } from "./meta";
import {
  classifyLineItems,
  computeOrderCogsTax,
  computeDailyAggregate,
  type DailyAggregate,
  type Market,
  type ProductMapEntry,
} from "./engine";
import { toParisDay, todayParisDay } from "./time";

export interface TodayMarketSnapshot extends DailyAggregate {
  market: Market;
}

export interface TodaySnapshot {
  day: string;
  fetchedAt: string;
  markets: TodayMarketSnapshot[];
}

const ALL_MARKETS: Market[] = ["ES", "UK", "DE", "FR"];

interface MarketAccumulator {
  orders: number;
  caCents: number;
  cogsCents: number;
  taxCents: number;
}

function emptyAccumulator(): MarketAccumulator {
  return { orders: 0, caCents: 0, cogsCents: 0, taxCents: 0 };
}

/**
 * §2 — à l'ouverture de la page : les agrégats historiques viennent de
 * Supabase (0 appel API), seul le jour en cours est fetché en direct ici.
 * Résultat mis en cache serveur 5-10 min (revalidate: 300) ; le bouton
 * « Actualiser » invalide le tag "today-snapshot" (voir /api/refresh).
 */
async function fetchTodaySnapshotUncached(): Promise<TodaySnapshot> {
  const supabase = createSupabaseServerClient();
  const { data: productsMap } = await supabase.from("products_map").select("*");
  const today = todayParisDay();
  const configs = getShopifyStoreConfigs();

  const perMarket: Record<Market, MarketAccumulator> = {
    ES: emptyAccumulator(),
    UK: emptyAccumulator(),
    DE: emptyAccumulator(),
    FR: emptyAccumulator(),
  };

  for (const config of configs) {
    for await (const order of iterateOrders(config, { createdAtMin: `${today}T00:00:00+02:00` })) {
      const day = toParisDay(order.created_at);
      if (day !== today) continue;

      const shippingCountry = order.shipping_address?.country_code ?? config.market;
      const classified = classifyLineItems(
        order.line_items.map((li) => ({
          title: li.title,
          sku: li.sku ?? undefined,
          quantity: li.quantity,
          price_cents: Math.round(parseFloat(li.price) * 100),
        })),
        (productsMap ?? []) as ProductMapEntry[],
        config.market
      );
      const { cogsProductCents, cogsUpsellsCents, taxCents } = computeOrderCogsTax({
        store: config.market,
        shippingCountry,
        day,
        poloQty: classified.poloQty,
        upsells: classified.upsells,
      });

      const caCents = Math.round(parseFloat(order.total_price) * 100) - computeRefundedCents(order);
      const bucket = perMarket[config.market];
      bucket.orders += 1;
      bucket.caCents += caCents;
      bucket.cogsCents += cogsProductCents + cogsUpsellsCents;
      bucket.taxCents += taxCents;
    }
  }

  const spendRows = await fetchMetaSpend(today, today);
  const spendByMarket: Record<Market, number> = { ES: 0, UK: 0, DE: 0, FR: 0 };
  for (const row of spendRows) {
    const market = mapCampaignToMarket(row.campaignName);
    if (market === "UNMAPPED") continue;
    spendByMarket[market] += row.spendCents;
  }

  const markets: TodayMarketSnapshot[] = ALL_MARKETS.map((market) => {
    const b = perMarket[market];
    return {
      market,
      ...computeDailyAggregate({
        orders: b.orders,
        caCents: b.caCents,
        spendCents: spendByMarket[market],
        cogsCents: b.cogsCents,
        taxCents: b.taxCents,
      }),
    };
  });

  return { day: today, fetchedAt: new Date().toISOString(), markets };
}

export const getTodaySnapshot = unstable_cache(fetchTodaySnapshotUncached, ["today-snapshot"], {
  revalidate: 300,
  tags: ["today-snapshot"],
});
