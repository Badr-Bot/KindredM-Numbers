-- §4.6 — affectation manuelle persistée des campagnes Meta non mappables.
-- Quand Badr affecte une campagne UNMAPPED à un marché dans l'UI, l'override
-- est stocké ici et consulté par le cron et le backfill AVANT le mapping par
-- nom : la campagne reste affectée même sur les fetchs futurs.
create table if not exists campaign_market_overrides (
  campaign_id text primary key,
  market text not null check (market in ('ES', 'UK', 'DE', 'FR')),
  created_at timestamptz not null default now()
);

alter table campaign_market_overrides enable row level security;
