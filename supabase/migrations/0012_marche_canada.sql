-- Marché CANADA (Badr, 06/08) — NIRA Burn (booster) est vendu sur le marché
-- canadien, hors des 4 boutiques Shopify branchées ici. Son CA/COGS est saisi
-- à la main (app_state → manual_revenue), son spend Meta arrive par l'API.
--
-- Sans cette migration, toute écriture market='CA' est REJETÉE par la
-- contrainte CHECK : le spend NIRA disparaîtrait du Net (même symptôme que le
-- bug UNMAPPED du 22/07, corrigé par la migration 0009).

alter table meta_spend drop constraint if exists meta_spend_market_check;
alter table meta_spend add constraint meta_spend_market_check
  check (market in ('ES', 'UK', 'DE', 'FR', 'CA', 'UNMAPPED'));

alter table daily_aggregates drop constraint if exists daily_aggregates_market_check;
alter table daily_aggregates add constraint daily_aggregates_market_check
  check (market in ('ES', 'UK', 'DE', 'FR', 'CA', 'UNMAPPED'));
