-- Petite table clé/valeur pour des marqueurs internes (ex : throttle de la
-- synchro incrémentale déclenchée automatiquement par les visites du site,
-- pour éviter de marteler Shopify/Meta si plusieurs personnes ouvrent le
-- dashboard en même temps).
create table if not exists app_state (
  key text primary key,
  value text,
  updated_at timestamptz not null default now()
);

alter table app_state enable row level security;
