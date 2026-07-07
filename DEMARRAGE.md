# 🚀 Démarrage — chemin Vercel (sans terminal)

Zéro terminal, zéro Node.js. Tout se fait au clic : GitHub → Vercel →
Supabase → bouton "Configuration" dans le dashboard lui-même.

---

## 1. Créer la base Supabase (gratuit)

1. **https://supabase.com** → crée un compte → **New project**
2. Une fois créé : **Project Settings → API** → note **Project URL** et la
   clé **`service_role`** (tu les colleras dans Vercel à l'étape 3)
3. **SQL Editor → New query** → colle le contenu de
   `supabase/migrations/0001_init.sql` → **Run**
4. Refais pareil avec `0002_control.sql`, puis `0003_campaign_overrides.sql`
   (dans cet ordre, une seule fois)

---

## 2. Récupérer les clés restantes

- **Shopify** (ES/UK/DE/FR) : Dev Dashboard de chaque store → **Paramètres →
  Identifiants API** → Domain + Client ID + Client Secret
- **Meta** : business.facebook.com → **Utilisateurs système** → générer un
  token avec la permission `ads_read`
- **Mot de passe du dashboard** *(optionnel)* : si tu laisses `DASHBOARD_PASSWORD`
  vide/absent, le site reste **ouvert** — n'importe qui avec le lien voit ton
  CA/net/marge. Tu peux l'ajouter à tout moment dans Vercel sans toucher au
  code pour protéger le lien.

---

## 3. Déployer sur Vercel

1. **vercel.com** → connecte-toi avec ton compte **GitHub**
2. **Add New → Project** → sélectionne `Badr-Bot/KindredM-Numbers` →
   branche `claude/kindredm-dashboard-setup-epbxha` → **Import**
3. Section **Environment Variables**, colle une par une :

```
SHOPIFY_ES_DOMAIN, SHOPIFY_ES_CLIENT_ID, SHOPIFY_ES_CLIENT_SECRET
SHOPIFY_UK_DOMAIN, SHOPIFY_UK_CLIENT_ID, SHOPIFY_UK_CLIENT_SECRET
SHOPIFY_DE_DOMAIN, SHOPIFY_DE_CLIENT_ID, SHOPIFY_DE_CLIENT_SECRET
SHOPIFY_FR_DOMAIN, SHOPIFY_FR_CLIENT_ID, SHOPIFY_FR_CLIENT_SECRET
META_ACCESS_TOKEN, META_AD_ACCOUNT_ID
SUPABASE_URL, SUPABASE_SERVICE_KEY
DASHBOARD_PASSWORD
APP_TIMEZONE=Europe/Paris
```

4. **Deploy** → Vercel te donne un lien `https://xxx.vercel.app` en ~1 min

---

## 4. Charger tes produits et ton historique — tout dans le dashboard

Ouvre ton lien Vercel, connecte-toi (mot de passe), puis clique sur
**⚙️ (en haut à droite) → Configuration** :

1. **🔎 Découvrir** — lit tes 4 stores, liste les produits trouvés
2. **Vérifie chaque ligne** — le polo est deviné automatiquement ; toute
   ligne "A_VALIDER" doit être corrigée à la main (menu déroulant) avant de
   continuer
3. **💾 Charger ce mapping**
4. **🚀 Lancer le backfill** — télécharge tout depuis le 04/06, calcule le
   P&L, remplit Supabase (1-2 min)

Retourne sur **Aujourd'hui** : tes vrais chiffres sont là. 🎉

---

## Le cron de minuit

`vercel.json` déclare déjà le cron de clôture quotidienne (00:05
Europe/Paris) — rien à faire, il s'active tout seul après le déploiement.

---

## (Optionnel) Chemin local, si tu préfères un jour

Si tu veux plus tard tout faire tourner sur ta machine plutôt que sur
Vercel : installe Node.js (nodejs.org, LTS), télécharge le ZIP du repo,
crée un `.env.local` à partir de `.env.example`, `npm install`, puis
`npm run dev` / `npm run discover-products` / `npm run backfill` — mêmes
étapes que ci-dessus mais en CLI. Le code est strictement identique.

---

Bloqué à une étape ? Dis-moi le numéro et ce que tu vois, je débloque.
