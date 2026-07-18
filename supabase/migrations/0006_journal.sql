-- 📓 Journal de bord : chaque changement (créa, landing, offre, prix,
-- audience, budget) devient un événement daté, affiché en marqueur sur les
-- courbes de l'onglet Analyse, avec verdict avant/après automatique.
-- source='auto' = détecté par la synchro (campagne coupée/lancée, saut de
-- budget) ; ref sert à dédupliquer les événements auto (nom de campagne…).

create table if not exists events (
  id bigint generated always as identity primary key,
  day date not null,
  type text not null check (type in ('crea','landing','offre','audience','budget','campagne','autre')),
  note text not null,
  ref text,
  source text not null default 'manual' check (source in ('manual','auto')),
  created_at timestamptz not null default now(),
  unique (day, type, ref)
);

alter table events enable row level security;
