-- La vue Dépenses affichait "COGS upsells" à 0 € en permanence : la fonction
-- de calcul du breakdown accepte un split polo/upsells en paramètre, mais
-- personne ne le lui passait jamais — tout le COGS (polo + upsells combinés)
-- atterrissait silencieusement dans "COGS polo" (constaté 25/07). Le total
-- Net/Marge n'a JAMAIS été faux : cogs_cents (déjà utilisé partout) contient
-- toujours la somme des deux. Ce correctif ajoute juste la répartition pour
-- l'affichage, recalculée depuis orders (source de vérité), jamais devinée.

alter table daily_aggregates
  add column if not exists cogs_product_cents int not null default 0,
  add column if not exists cogs_upsells_cents int not null default 0;
