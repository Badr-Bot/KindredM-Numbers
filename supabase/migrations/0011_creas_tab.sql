-- Onglet "Créas" (25/07) — hold rate vidéo complet (50/75/100%) et texte de
-- la créa (angle/copy) affiché à côté des métriques.

alter table meta_ad_insights
  add column if not exists video_p50 bigint not null default 0,
  add column if not exists video_p75 bigint not null default 0,
  add column if not exists video_p100 bigint not null default 0;

-- Texte de la créa : ne varie pas jour par jour (contrairement aux métriques
-- de perf) — table séparée plutôt que de le répéter sur chaque ligne de
-- meta_ad_insights. Rafraîchi à chaque synchro (upsert).
create table if not exists meta_ad_creatives (
  ad_id text primary key,
  body text,
  updated_at timestamptz not null default now()
);
alter table meta_ad_creatives enable row level security;
