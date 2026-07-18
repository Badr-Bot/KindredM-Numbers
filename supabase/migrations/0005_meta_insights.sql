-- Analyse (CPA/CTR/CPC/CPM/CVR + créas) — métriques Meta détaillées.
-- Remplies automatiquement par la synchro dès que le token Meta (app avec
-- Marketing API) fonctionne ; vides d'ici là, l'onglet Analyse l'indique.

create table if not exists meta_insights (
  day date not null,
  campaign_id text not null,
  campaign_name text,
  market text not null default 'UNMAPPED',
  spend_cents bigint not null default 0,
  impressions bigint not null default 0,
  clicks bigint not null default 0,
  purchases bigint not null default 0,
  purchase_value_cents bigint not null default 0,
  primary key (day, campaign_id)
);
alter table meta_insights enable row level security;

create table if not exists meta_ad_insights (
  day date not null,
  ad_id text not null,
  ad_name text,
  campaign_id text,
  campaign_name text,
  market text not null default 'UNMAPPED',
  spend_cents bigint not null default 0,
  impressions bigint not null default 0,
  clicks bigint not null default 0,
  purchases bigint not null default 0,
  purchase_value_cents bigint not null default 0,
  primary key (day, ad_id)
);
alter table meta_ad_insights enable row level security;
