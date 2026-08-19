-- 🛃 Contrôle — affectation des transactions bancaires (19/08).
-- Chaque mouvement doit finir dans exactement une case : société, perso
-- Badr, perso Fahd, ou ignoré (doublon technique). Tout le reste est une
-- anomalie affichée dans l'onglet Contrôle jusqu'à affectation.
create table if not exists bank_tx_labels (
  bank text not null,
  tx_id text not null,
  kind text not null check (kind in ('SOCIETE', 'PERSO_BADR', 'PERSO_FAHD', 'IGNORER')),
  note text,
  labeled_at timestamptz not null default now(),
  primary key (bank, tx_id)
);
alter table bank_tx_labels enable row level security;
