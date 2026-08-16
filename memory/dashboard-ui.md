# Dashboard — UI, thème, onglets

> Tout ce qui est visible par Badr : thème, disposition des onglets, cartes. Badr est non-technique, sur téléphone, et veut « le minimum d'onglets ».
>
> Mémoire Kindred — chargée automatiquement via `CLAUDE.md`.
> Mise à jour à chaque changement de règle, jamais en double ailleurs.

## 🎯 Prochaine étape (08/08 soir → en cours) : LE THÈME
Toute la logique métier/données est réglée pour l'instant (rien en attente
côté calculs, tout ci-dessous est déjà en prod). Badr veut une **refonte
visuelle** — c'est la seule tâche ouverte. **Prototype en cours de
validation** (branche `claude/theme-pour-7ebcne`) : voir statut ci-dessous.

- **Référence donnée par Badr** : capture d'écran de « Floxy » (dashboard
  proxy) — style SaaS clair, sidebar noire épurée, cartes blanches à coins
  arrondis, badges verts, typo sans-serif propre, très pro/fintech.
- **Ce qu'il a dit textuellement** : « ton style ça se voit que c'est
  Claude, je veux un style cool stylé et classe... propose des trucs avec
  des effets sonores et visuels, je veux un truc qui vend, pour que les
  gens kiffent ». Inspiration Floxy, pas copie conforme — une proposition,
  pas un clone.
- **Nouveau thème « Direction C · Clair, sobre, fintech » (globals.css,
  08/08)** : fond blanc cassé (`--color-terminal: #f4f5f7`), cartes
  blanches pleines + ombre douce (`.card-shadow`, plus d'opacité genre
  `bg-panel/40` qui ne fonctionnait qu'sur fond sombre), positif = vert
  (`--color-phosphor: #16a34a`, conforme à la réf Floxy), rouge = négatif,
  **or gardé en accent secondaire** (`--color-phosphor-brand`, logo/badges/
  alertes uniquement — validé par Badr, pas tout misé sur le vert). Police
  Geist Sans (plus mono), gros chiffres en `font-black` très contrasté vs
  labels plus légers (validé par Badr : « sans-serif + gras marqué »). Noms
  de tokens gardés stables (terminal/panel/ink/phosphor/amber/red/cyan)
  pour propager sans retoucher chaque composant, comme les thèmes d'avant.
- **Prototype construit** : Header, BottomNav (devient une pill flottante
  noire en bas — traduction mobile du « sidebar noire » Floxy), layout,
  page Aujourd'hui (TodayBoard) entièrement restylés. Le reste de l'app
  (Mois/Analyse/Créas/Année/Dépenses/Admin + composants partagés type
  EmptyState/DataError/loading) hérite déjà des nouvelles couleurs via les
  tokens mais garde les anciennes bordures/opacités « fond sombre » tant
  que non retouché — à généraliser après feu vert Badr.
- **Effets ajoutés (validé par Badr, réponses du 08/08)** : cartes avec
  léger lift au survol/tap (`.card-interactive`), confettis + son
  `celebrate` (arpège 4 notes) quand le net du jour ≥ cible, sons distincts
  `statusYellow`/`statusRed` (doux, jamais une alarme) et `refreshDone`.
  BootOverlay gardé sombre (splash de ~1,5 s) comme moment de transition
  avant de révéler le dashboard clair.
- **Bug trouvé et corrigé au passage** : BootOverlay pouvait rester bloqué
  à l'écran en dev (`next dev`, React Strict Mode double-invoque l'effet
  mount→cleanup→mount ; la 2e passe relisait sessionStorage déjà écrit par
  la 1re et ne reprogrammait jamais le timer de fermeture). Fix : la
  décision « faut-il booter » est calculée une seule fois (lazy state), pas
  relue dans l'effet à chaque passe. N'affectait pas la prod (`next build`
  n'a pas ce double-invoke), mais bloquait aussi mes captures d'écran.
- **Nom déjà changé en Weft** (08/08) : Header, BootOverlay, `<title>`,
  auth realm. `NIVA_DEMO`/`NIVAFIT` restent en interne (non visibles),
  jamais touchés.
- Rien d'autre en attente de Badr sauf : COGS de la vente NIRA du 07/08
  (118,74 $), qui paie les autres abonnements (Adnane), la question du
  spend Meta avant le 04/06 (voir plus bas) — aucun ne bloque le thème.

## Onglet Dépenses — réorganisation (08/08)
- Abonnements & charges fixes + Entre associés ont DÉMÉNAGÉ depuis l'onglet Année (qui reste concentré sur le bilan/parts mensuelles). Rangement demandé par Badr, « minimum d'onglet ».
- `buildExpenseBreakdown` (data.ts) : le split fictif « Shopify 3 % / Autres 1 % » (reliquat d'avant les vrais frais Shopify) est retiré → un seul poste « Frais Shopify réels » au pourcentage RÉEL calculé (jamais figé). Bug repéré par Badr le 08/08.
- **Nouveau : CA par canal** (donut Google/Meta/direct/autres, `getAcquisitionForRange` dans data.ts, route `/api/acquisition-summary`) + **carte Klaviyo** (CA attribué aux campagnes email uniquement, jamais les flows/BIENVENUE15, `lib/klaviyo.ts` + route `/api/klaviyo/summary`) — les deux sont des mesures INDÉPENDANTES, jamais additionnées (une vente email peut apparaître « Direct » côté Shopify).
- **Clé Klaviyo** : Badr l'a donnée en chat (`pk_SWVS8q_...`) — JAMAIS commitée dans le code (fuiterait dans l'historique Git). Lue via `process.env.KLAVIYO_API_KEY`, à ajouter dans Vercel. Le réseau sortant de cette session de code n'a pas accès à `a.klaviyo.com` (politique de l'environnement) → l'intégration n'a JAMAIS été testée en conditions réelles, le premier vrai test se fait au déploiement. En cas d'erreur/schéma inattendu la fonction lève une exception explicite plutôt que de renvoyer un chiffre inventé.
- **Bug trouvé au 1er vrai test en prod (08/08 soir, capture Badr)** : `findPlacedOrderMetricId()` filtrait `/metrics/` par `name`, un champ NON filtrable côté Klaviyo (400 « filterable fields : integration.category, integration.name »). Corrigé : liste toutes les métriques (paginée) et cherche « Placed Order » côté client. Les autres filtres (`/campaigns/`, `/campaign-values-reports/`) n'ont pas encore renvoyé d'erreur — à surveiller au prochain chargement.
- Section « 💡 Pistes d'économies » ajoutée (SmartSize, Moon Bundles, Jeremy/Seif).
- **Charges fixes dans le donut (08/08)** : `buildExpenseBreakdown(t, fixedCostsCents)` prend maintenant les charges de la période en 2e paramètre — sur GLOBAL, `netCents` les avait déjà déduites en silence, sans jamais apparaître nulle part dans le macaron (repéré par Badr). Tranches somment exactement au CA désormais. Marchés/produits restent hors charges (0 passé).
- **Onglet Contrôle retiré de la nav (08/08)** : le bloc remboursements/rétrofacturations ne servait plus à rien (remboursements déjà automatiques, rétrofacturations en attente de permission Shopify). `ControlBoard.tsx` supprimé. La page `/controle` reste UNIQUEMENT pour affecter une campagne Meta neuve à un marché (lien direct depuis le bandeau ⚠️ du Live) — Badr sait qu'il devra repenser aux rétrofacturations plus tard (permission `read_shopify_payments_disputes` à activer côté Shopify).

## Mois — colonnes cachées sur mobile (08/08 soir)
- Badr (sur téléphone) ne voyait pas COGS/Taxe/Frais/Marge dans le tableau jour par jour de l'onglet Mois — PAS un bug de données (les valeurs réelles étaient déjà calculées), une classe Tailwind `hidden ... sm:table-cell` les masquait sous un certain breakpoint. Retiré ; « COGS+tx » scindé en deux colonnes séparées (COGS, Taxe) pour plus de clarté. Le tableau défile horizontalement si besoin (`overflow-x-auto` déjà en place).
