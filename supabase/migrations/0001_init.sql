-- NIVA Dashboard — schéma initial (§3 du cahier des charges)
-- Tous les montants en centimes (integers). orders/meta_spend = source de
-- vérité brute ; daily_aggregates est recalculé, jamais édité à la main.

create table if not exists orders (
  id bigint primary key,                    -- id Shopify
  store text not null check (store in ('ES', 'UK', 'DE', 'FR')),
  order_name text not null,                  -- #1042
  created_at_utc timestamptz not null,
  day date not null,                         -- jour Europe/Paris
  shipping_country text not null,            -- ISO-2 destination
  total_cents int not null,                  -- total encaissé
  refunded_cents int not null default 0,
  line_items jsonb not null,                 -- [{title, sku, quantity, price_cents}]
  polo_qty int not null default 0,           -- 0/1/2/4 (déduit des line items)
  upsells jsonb not null default '[]'::jsonb, -- [{product_key, qty, cogs_cents}]
  cogs_product_cents int not null default 0, -- COGS polo (grille §4.2)
  cogs_upsells_cents int not null default 0,
  tax_eu_cents int not null default 0,       -- 300 ou 0 (§4.4)
  updated_at_utc timestamptz not null default now()
);

create index if not exists orders_day_store_idx on orders (day, store);
create index if not exists orders_updated_at_idx on orders (updated_at_utc);

alter table orders enable row level security;

-- ---------------------------------------------------------------------------

create table if not exists meta_spend (
  day date not null,
  market text not null check (market in ('ES', 'UK', 'DE', 'FR', 'UNMAPPED')),
  campaign_id text not null,
  campaign_name text not null,
  spend_cents int not null,
  primary key (day, campaign_id)
);

create index if not exists meta_spend_day_market_idx on meta_spend (day, market);

alter table meta_spend enable row level security;

-- ---------------------------------------------------------------------------

create table if not exists daily_aggregates (             -- recalculé, jamais édité à la main
  day date not null,
  market text not null check (market in ('ES', 'UK', 'DE', 'FR')),
  orders int not null default 0,
  ca_cents int not null default 0,
  spend_cents int not null default 0,
  cogs_cents int not null default 0,
  tax_cents int not null default 0,
  fees_cents int not null default 0,
  net_cents int not null default 0,
  primary key (day, market)
);

alter table daily_aggregates enable row level security;

-- ---------------------------------------------------------------------------

create table if not exists products_map (                 -- mapping titres ↔ produits (§5)
  store text not null check (store in ('ES', 'UK', 'DE', 'FR')),
  title_pattern text not null,
  product_key text not null,
  unit_group text not null check (unit_group in ('polo', 'upsell')),
  primary key (store, title_pattern)
);

alter table products_map enable row level security;

-- ---------------------------------------------------------------------------

create table if not exists sync_state (
  store text primary key check (store in ('ES', 'UK', 'DE', 'FR')),
  last_orders_sync timestamptz
);

alter table sync_state enable row level security;

-- Aucune policy RLS n'est définie : cette app n'accède à Supabase que via la
-- service_role key côté serveur (Vercel), qui bypass RLS. RLS est activé ici
-- uniquement pour bloquer par défaut tout accès futur via une clé anon.
