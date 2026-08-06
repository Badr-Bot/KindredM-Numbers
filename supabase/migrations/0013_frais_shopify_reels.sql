-- Frais Shopify RÉELS par commande (Badr, 06/08) — remplacent le forfait 3 %
-- du CA, mesuré 2,2× trop bas sur 50 commandes réelles du store FR
-- (6,54 % réels : 4,67 % de traitement + 1,87 % de change).
--
-- Stockés par COMMANDE (et non par jour) parce que le taux varie d'une
-- commande à l'autre selon la carte (2,70 / 3,70 / 4,30 / 4,99 % observés le
-- même mois) : agréger par jour se fait ensuite, l'inverse est impossible.
--
-- NULL = frais pas encore lus pour cette commande (avant le re-scan) — à
-- distinguer de 0, qui signifie « lus, et réellement nuls ».

alter table orders add column if not exists fee_processing_cents integer;
alter table orders add column if not exists fee_fx_cents integer;
alter table orders add column if not exists fee_other_cents integer;
alter table orders add column if not exists fee_total_cents integer;
-- Frais portés par une transaction REFUND : suivis à part, PAS déduits tant
-- que le comportement n'est pas validé sur une commande remboursée connue.
alter table orders add column if not exists fee_refund_cents integer;

-- daily_aggregates : la ventilation qu'on affiche (traitement / change /
-- autres), en plus du total déjà porté par fees_cents.
alter table daily_aggregates add column if not exists fee_processing_cents integer not null default 0;
alter table daily_aggregates add column if not exists fee_fx_cents integer not null default 0;
alter table daily_aggregates add column if not exists fee_other_cents integer not null default 0;
