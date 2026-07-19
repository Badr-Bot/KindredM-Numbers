-- Acquisition & réachat (demande Badr 19/07) :
-- « combien de ventes Google » → source de chaque commande (referring_site /
-- source_name) · « combien de clients récurrents » → identifiant client par
-- commande (id numérique Shopify, pas de données personnelles).

alter table orders
  add column if not exists customer_id text,
  add column if not exists source_name text,
  add column if not exists referring_site text,
  add column if not exists landing_site text;

create index if not exists orders_customer_idx on orders (customer_id);
