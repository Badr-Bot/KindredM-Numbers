-- NIVA Dashboard — vue Contrôle (remboursements + rétrofacturations).

-- Remboursements : le CA de daily_aggregates est déjà net des remboursements
-- (comportement "Total sales"). On stocke en plus le montant brut remboursé
-- pour la visibilité, sans changer net_cents (validé au centime).
alter table daily_aggregates
  add column if not exists refunded_cents int not null default 0;

-- Rétrofacturations (chargebacks / litiges). Calque de suivi séparé : n'altère
-- jamais net_cents. La vue Contrôle en dérive un "net ajusté après litiges".
create table if not exists chargebacks (
  id uuid primary key default gen_random_uuid(),
  day date not null,                         -- jour Europe/Paris du litige
  market text not null check (market in ('ES', 'UK', 'DE', 'FR')),
  order_name text,                           -- #1042 (optionnel)
  amount_cents int not null,                 -- montant contesté
  fee_cents int not null default 0,          -- frais de litige du processeur
  status text not null default 'open' check (status in ('open', 'won', 'lost')),
  reason text,
  created_at timestamptz not null default now()
);

create index if not exists chargebacks_day_market_idx on chargebacks (day, market);

alter table chargebacks enable row level security;
