# 📍 Statut du déploiement — mis à jour au fil de l'eau

Dashboard en ligne : **https://kindred-m-numbers.vercel.app** (sans mot de
passe, choix de Badr — ajouter `DASHBOARD_PASSWORD` dans Vercel pour protéger).

## État des briques

| Brique | État | Note |
|---|---|---|
| Code (6 vues + admin + cron) | ✅ | branche `claude/kindredm-dashboard-setup-epbxha` |
| Supabase (3 migrations SQL) | ✅ | projet `eyfbkxdtxdoktscjaqsg` |
| Vercel (deploy + variables) | ✅ | diagnostic 🩺 sur `/admin` |
| Auth Shopify (client_credentials) | ✅ | token obtenu pour ES/UK/FR |
| Scope `read_orders` ES/UK/FR | ⏳ | à approuver (voir ci-dessous) |
| Secret DE dans Vercel | ⏳ | invalide — à re-copier depuis le Dev Dashboard |
| Token Meta | ✅ | dans Vercel |
| Découverte produits → mapping → backfill | ⏳ | via `/admin`, après les 2 points ci-dessus |

## Mode « zéro clic » (ajouté 08/07)

Plus besoin de passer par /admin : **ouvrir le site suffit**. Si la base est
vide, une bannière « Initialisation automatique » apparaît sur l'accueil et
fait tout (découverte → mapping auto → backfill, 1-2 min), puis la page se
rafraîchit avec les vrais chiffres. Le cron de minuit fait pareil en filet de
sécurité. Les erreurs s'affichent en clair dans la bannière.
Garde-fou §5 : un produit inconnu arrête tout → validation manuelle sur /admin.

Pipeline validé bout en bout par test d'intégration (Shopify/Meta/Supabase
simulés) : Fixture 1 reproduite au centime (24 tests verts).

## Reste à faire (dans l'ordre)

1. Scopes ES/UK/FR : ✅ faits (08/07). Secret DE corrigé + Redeploy : ✅.
2. **Ouvrir https://kindred-m-numbers.vercel.app/** → laisser la bannière
   d'init tourner (~1-2 min) → chiffres réels partout.
3. Vérifier les totaux affichés vs l'admin Shopify de chaque store (§7.4).
4. Le lendemain : vérifier que le cron de minuit a bien clôturé J-1 (§7.5).
5. Plus tard (quand tout tourne) : faire pivoter les secrets qui ont transité
   par le chat (Dev Dashboard → Paramètres → « Faire pivoter ») + màj Vercel.

## Notes techniques utiles

- `read_orders` = 60 jours d'historique max. Lancement = 04/06 → OK si le
  backfill est fait avant début août. Le cron ne relit que J-7, donc aucun
  souci ensuite. (Sinon : demander `read_all_orders`.)
- Le backfill est **idempotent** : en cas de timeout/erreur, re-cliquer est
  sans risque.
- Erreur `requires merchant approval for read_orders scope` = scope pas
  encore approuvé sur le store (étape 1 ci-dessus).
- Erreur `invalid client secret` = secret erroné dans Vercel (étape 2).
- Rotation recommandée à terme : les secrets ont transité par le chat —
  bouton **« Faire pivoter »** (Dev Dashboard → Paramètres → Secret) puis
  mettre à jour Vercel. À faire quand tout tourne.
