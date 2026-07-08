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

## Reste à faire (dans l'ordre)

1. **ES, UK, FR — approuver le scope** : Dev Dashboard de chaque app →
   **Versions → Nouvelle version** → champ *Admin API access scopes* :
   `read_orders,read_products` → publier → **Aperçu → Installer l'application**
   → approuver. (La page "Example Domain" après = normal.)
2. **DE — corriger le secret** : Dev Dashboard app DE → Paramètres →
   Identifiants → copier le Secret → Vercel → Edit `SHOPIFY_DE_CLIENT_SECRET`
   → Save → **Redeploy**.
3. `/admin` → **🔎 Découvrir** → vérifier le mapping (le polo est deviné
   automatiquement) → **💾 Charger** → **🚀 Lancer le backfill**.
4. Vérifier les totaux affichés vs l'admin Shopify de chaque store (§7.4).
5. Le lendemain : vérifier que le cron de minuit a bien clôturé J-1 (§7.5).

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
