/**
 * Test d'intégration du pipeline « zéro clic » complet :
 * auth client_credentials → lecture des commandes des 4 stores → découverte
 * produits → mapping auto → backfill (orders + meta_spend) → recalcul des
 * agrégats. Shopify/Meta/Supabase sont simulés en mémoire ; les montants
 * sont validés AU CENTIME contre la Fixture 1 du cahier des charges
 * (ES · 2026-07-04). Si ce test passe, tout échec en production vient de la
 * configuration (clés, scopes, réseau), pas de la logique.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Supabase simulé en mémoire (surface utilisée par le pipeline uniquement)
// ---------------------------------------------------------------------------

type Row = Record<string, unknown>;

const KEYS: Record<string, string[]> = {
  orders: ["id"],
  meta_spend: ["day", "campaign_id"],
  daily_aggregates: ["day", "market"],
  sync_state: ["store"],
  products_map: ["store", "title_pattern"],
  campaign_market_overrides: ["campaign_id"],
};

function createMockSupabase() {
  const tables: Record<string, Row[]> = Object.fromEntries(
    Object.keys(KEYS).map((t) => [t, []])
  );

  function from(table: string) {
    const filters: Array<(r: Row) => boolean> = [];
    let head = false;

    const builder = {
      select(_cols?: string, opts?: { head?: boolean; count?: string }) {
        if (opts?.head) head = true;
        return builder;
      },
      eq(col: string, val: unknown) {
        filters.push((r) => r[col] === val);
        return builder;
      },
      gte(col: string, val: unknown) {
        filters.push((r) => String(r[col]) >= String(val));
        return builder;
      },
      lte(col: string, val: unknown) {
        filters.push((r) => String(r[col]) <= String(val));
        return builder;
      },
      in(col: string, vals: unknown[]) {
        filters.push((r) => vals.includes(r[col]));
        return builder;
      },
      order() {
        return builder;
      },
      upsert(rows: Row | Row[], opts?: { onConflict?: string }) {
        const arr = Array.isArray(rows) ? rows : [rows];
        const keyCols = opts?.onConflict
          ? opts.onConflict.split(",").map((s) => s.trim())
          : KEYS[table];
        for (const row of arr) {
          const idx = tables[table].findIndex((r) => keyCols.every((k) => r[k] === row[k]));
          if (idx >= 0) tables[table][idx] = { ...tables[table][idx], ...row };
          else tables[table].push({ ...row });
        }
        return Promise.resolve({ data: null, error: null });
      },
      insert(rows: Row | Row[]) {
        const arr = Array.isArray(rows) ? rows : [rows];
        tables[table].push(...arr.map((r) => ({ ...r })));
        return Promise.resolve({ data: null, error: null });
      },
      update(patch: Row) {
        return {
          eq(col: string, val: unknown) {
            for (const r of tables[table]) if (r[col] === val) Object.assign(r, patch);
            return Promise.resolve({ data: null, error: null });
          },
        };
      },
      then(resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) {
        const rows = tables[table].filter((r) => filters.every((f) => f(r)));
        const result = {
          data: head ? null : rows.map((r) => ({ ...r })),
          error: null,
          count: rows.length,
        };
        return Promise.resolve(result).then(resolve, reject);
      },
    };
    return builder;
  }

  return { from, _tables: tables };
}

let mockSupabase: ReturnType<typeof createMockSupabase>;

vi.mock("../supabase", () => ({
  createSupabaseServerClient: () => mockSupabase,
}));

// ---------------------------------------------------------------------------
// Shopify + Meta simulés au niveau fetch
// ---------------------------------------------------------------------------

interface FakeOrder {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
  total_price: string;
  line_items: Array<{ title: string; sku: string | null; quantity: number; price: string }>;
  shipping_address: { country_code: string } | null;
  refunds: never[];
}

function polo(title: string, qty: number): { title: string; sku: null; quantity: number; price: string } {
  return { title, sku: null, quantity: qty, price: "29.99" };
}

function makeOrder(id: number, createdAt: string, total: string, country: string, items: FakeOrder["line_items"]): FakeOrder {
  return {
    id,
    name: `#${id}`,
    created_at: createdAt,
    updated_at: createdAt,
    total_price: total,
    line_items: items,
    shipping_address: { country_code: country },
    refunds: [],
  };
}

const TITLE_ES = "Nivafit – Polo ultra-cómodo";
const TITLE_UK = "Nivafit – Ultra-Comfort Polo";
const TITLE_DE = "Nivafit – Ultra-bequemes Polo";
const TITLE_FR = "Nivafit – Polo ultra-confortable";

// Fixture 1 (§8) : ES · 2026-07-04 — 8 commandes toutes 2 pcs, CA 479,92 €.
// 10:00 UTC = 12:00 Europe/Paris → jour 2026-07-04. ✓
const ES_ORDERS: FakeOrder[] = Array.from({ length: 8 }, (_, i) =>
  makeOrder(1000 + i, "2026-07-04T10:00:00Z", "59.99", "ES", [polo(TITLE_ES, 1), polo(TITLE_ES, 1)])
);

let ordersByDomain: Record<string, FakeOrder[]>;
let tokenFailsFor: string | null;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

beforeEach(() => {
  // Vide le cache de tokens de lib/shopify (état de module) entre les tests.
  vi.resetModules();
  mockSupabase = createMockSupabase();
  tokenFailsFor = null;
  ordersByDomain = {
    "es.test.myshopify.com": ES_ORDERS,
    "uk.test.myshopify.com": [
      makeOrder(2000, "2026-07-03T10:00:00Z", "57.66", "GB", [polo(TITLE_UK, 2)]),
    ],
    "de.test.myshopify.com": [
      makeOrder(3000, "2026-07-01T10:00:00Z", "74.99", "DE", [polo(TITLE_DE, 2)]),
    ],
    "fr.test.myshopify.com": [
      makeOrder(4000, "2026-07-02T10:00:00Z", "59.99", "FR", [polo(TITLE_FR, 2)]),
    ],
  };

  for (const m of ["ES", "UK", "DE", "FR"]) {
    process.env[`SHOPIFY_${m}_DOMAIN`] = `${m.toLowerCase()}.test.myshopify.com`;
    process.env[`SHOPIFY_${m}_CLIENT_ID`] = `client-${m}`;
    process.env[`SHOPIFY_${m}_CLIENT_SECRET`] = `secret-${m}`;
    delete process.env[`SHOPIFY_${m}_TOKEN`];
  }
  process.env.META_ACCESS_TOKEN = "meta-token";
  process.env.META_AD_ACCOUNT_ID = "919559773962419";

  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      const host = new URL(url).host;

      if (url.includes("/admin/oauth/access_token")) {
        // tokenFailsFor: null = tous OK ; "" = tous en échec ; "xx" = préfixe.
        if (tokenFailsFor !== null && host.startsWith(tokenFailsFor)) {
          return jsonResponse({ error: "invalid_client" }, 401);
        }
        return jsonResponse({ access_token: `tok-${host}`, expires_in: 86400 });
      }
      if (url.includes("/admin/api/")) {
        return jsonResponse({ orders: ordersByDomain[host] ?? [] });
      }
      if (host === "graph.facebook.com") {
        return jsonResponse({
          data: [
            {
              campaign_id: "c-esp-1",
              campaign_name: "CBO-ESP-POLO-1",
              spend: "184.27",
              date_start: "2026-07-04",
            },
          ],
        });
      }
      throw new Error(`fetch inattendu vers ${url}`);
    })
  );
});

// ---------------------------------------------------------------------------

describe("Pipeline zéro clic — bout en bout sur services simulés", () => {
  it("découvre, mappe, backfill et produit la Fixture 1 au centime", async () => {
    const { runAutoSetup } = await import("../autoSetup");
    const result = await runAutoSetup();

    expect(result.storeErrors).toBeUndefined();
    expect(result.unmappedTitles).toBeUndefined();
    expect(result.ok).toBe(true);
    expect(result.stage).toBe("done");
    expect(result.mapped).toBe(4); // 1 titre polo par store

    // Mapping auto : les 4 titres localisés → POLO
    const map = mockSupabase._tables.products_map;
    expect(map).toHaveLength(4);
    expect(map.every((r) => r.product_key === "POLO" && r.unit_group === "polo")).toBe(true);

    // Commandes upsertées (8 ES + 1 UK + 1 DE + 1 FR)
    expect(mockSupabase._tables.orders).toHaveLength(11);

    // Spend Meta mappé ES via "ESP"
    const spend = mockSupabase._tables.meta_spend;
    expect(spend).toHaveLength(1);
    expect(spend[0]).toMatchObject({ market: "ES", spend_cents: 18427, day: "2026-07-04" });

    // 🎯 Fixture 1 au centime : ES · 2026-07-04
    const agg = mockSupabase._tables.daily_aggregates.find(
      (r) => r.day === "2026-07-04" && r.market === "ES"
    );
    expect(agg).toMatchObject({
      orders: 8,
      ca_cents: 47992,
      spend_cents: 18427,
      cogs_cents: 11896,
      tax_cents: 2400,
      fees_cents: 4559,
      net_cents: 10710,
      refunded_cents: 0,
    });

    // UK · 2026-07-03 (Fixture 3, sans spend) : COGS GB 1330, taxe 0
    const uk = mockSupabase._tables.daily_aggregates.find(
      (r) => r.day === "2026-07-03" && r.market === "UK"
    );
    expect(uk).toMatchObject({ orders: 1, ca_cents: 5766, cogs_cents: 1330, tax_cents: 0 });
  });

  it("s'arrête bruyamment sur un produit inconnu (§5) sans rien écrire", async () => {
    ordersByDomain["es.test.myshopify.com"] = [
      ...ES_ORDERS,
      makeOrder(1999, "2026-07-05T10:00:00Z", "19.99", "ES", [
        { title: "Gadget Mystère XYZ", sku: null, quantity: 1, price: "19.99" },
      ]),
    ];
    const { runAutoSetup } = await import("../autoSetup");
    const result = await runAutoSetup();

    expect(result.ok).toBe(false);
    expect(result.stage).toBe("mapping");
    expect(result.unmappedTitles).toEqual(["ES: Gadget Mystère XYZ"]);
    expect(mockSupabase._tables.products_map).toHaveLength(0);
    expect(mockSupabase._tables.orders).toHaveLength(0);
  });

  it("mode partiel : un store en échec est ignoré avec avertissement, les autres passent", async () => {
    tokenFailsFor = "de.test";
    const { runAutoSetup } = await import("../autoSetup");
    const result = await runAutoSetup();

    expect(result.ok).toBe(true);
    expect(result.stage).toBe("done");
    expect(result.warnings?.some((w) => w.includes("DE"))).toBe(true);
    // 8 ES + 1 UK + 1 FR (DE ignoré)
    expect(mockSupabase._tables.orders).toHaveLength(10);
  });

  it("échoue seulement si AUCUN store ne répond", async () => {
    tokenFailsFor = ""; // préfixe vide = tous les domaines échouent
    const { runAutoSetup } = await import("../autoSetup");
    const result = await runAutoSetup();

    expect(result.ok).toBe(false);
    expect(result.stage).toBe("discover");
    expect(result.storeErrors).toHaveLength(4);
    expect(mockSupabase._tables.orders).toHaveLength(0);
  });
});
