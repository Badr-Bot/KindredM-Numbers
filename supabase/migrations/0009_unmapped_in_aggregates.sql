-- Avant ce correctif, une campagne Meta pas encore reconnue (nom sans FR/ESP/
-- GE/UK, ex. "WORLD" au lieu de "WORLDWIDE") était écrite en market=UNMAPPED
-- dans meta_spend, mais daily_aggregates n'acceptait QUE ('ES','UK','DE','FR')
-- — cette dépense disparaissait purement et simplement du Net/Marge du jour
-- jusqu'à affectation manuelle dans Contrôle (constaté 22/07 : spend affiché
-- 1 158 € au lieu de 1 275,75 € réels). On l'autorise ici comme marché
-- temporaire, pour que le total GLOBAL reste exact même avant affectation.

alter table daily_aggregates drop constraint if exists daily_aggregates_market_check;
alter table daily_aggregates add constraint daily_aggregates_market_check
  check (market in ('ES', 'UK', 'DE', 'FR', 'UNMAPPED'));
