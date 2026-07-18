-- Audit 18/07 — métriques avancées pour la découverte de patterns :
-- 1) Funnel complet (clic lien → landing → panier → checkout → achat)
-- 2) Fatigue/saturation (reach + frequency)
-- 3) CTR propre (clics de lien vs tous clics)
-- 4) Hook/hold vidéo (vues 3 s, thruplays)
-- 5) Diagnostics Meta par annonce (quality/engagement/conversion ranking)
-- 6) Répartition par PAYS réel de diffusion (vrai ROAS BE/CA/CH du store FR)

alter table meta_insights
  add column if not exists reach bigint not null default 0,
  add column if not exists frequency numeric not null default 0,
  add column if not exists link_clicks bigint not null default 0,
  add column if not exists landing_page_views bigint not null default 0,
  add column if not exists add_to_cart bigint not null default 0,
  add column if not exists initiate_checkout bigint not null default 0,
  add column if not exists video_3s bigint not null default 0,
  add column if not exists thruplays bigint not null default 0;

alter table meta_ad_insights
  add column if not exists reach bigint not null default 0,
  add column if not exists frequency numeric not null default 0,
  add column if not exists link_clicks bigint not null default 0,
  add column if not exists landing_page_views bigint not null default 0,
  add column if not exists add_to_cart bigint not null default 0,
  add column if not exists initiate_checkout bigint not null default 0,
  add column if not exists video_3s bigint not null default 0,
  add column if not exists thruplays bigint not null default 0,
  add column if not exists quality_ranking text,
  add column if not exists engagement_ranking text,
  add column if not exists conversion_ranking text;

create table if not exists meta_country_insights (
  day date not null,
  campaign_id text not null,
  country text not null,
  spend_cents bigint not null default 0,
  impressions bigint not null default 0,
  clicks bigint not null default 0,
  purchases bigint not null default 0,
  purchase_value_cents bigint not null default 0,
  primary key (day, campaign_id, country)
);
alter table meta_country_insights enable row level security;
