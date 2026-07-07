# 🚀 Démarrage en local (guide pas à pas)

Ce guide te fait passer de zéro au dashboard qui tourne sur ton ordinateur.
Tout est confidentiel : tes clés restent sur ta machine, jamais sur GitHub.

> 💡 Tu peux déjà voir le dashboard **sans aucune clé** en mode démo (étape 5).
> Les vraies clés ne servent qu'à mettre TES chiffres à la place des chiffres
> d'exemple.

---

## 1. Installer Node.js (une seule fois)

1. Va sur **https://nodejs.org**
2. Télécharge la version **LTS** (le gros bouton de gauche)
3. Installe (Suivant → Suivant → Terminer)

Pour vérifier : ouvre une fenêtre de commande et tape `node -v` → tu dois voir un numéro (ex. `v22.x`).

---

## 2. Récupérer le projet sur ton ordinateur

**Le plus simple (sans rien installer d'autre) :**
1. Va sur ton dépôt GitHub `Badr-Bot/KindredM-Numbers`
2. Bouton vert **« Code »** → **« Download ZIP »**
3. Décompresse le ZIP quelque part (ex. `Documents\niva`)

**Ouvre un terminal DANS ce dossier :**
- Windows : ouvre le dossier décompressé, **clic droit dans un espace vide → « Ouvrir dans le terminal »**
  (ou « Ouvrir la fenêtre PowerShell ici »)

---

## 3. Créer ton fichier de clés `.env.local`

1. Dans le dossier du projet, repère le fichier **`.env.example`**
2. **Copie-le** et renomme la copie en **`.env.local`** (exactement ce nom, avec le point devant)
3. Ouvre `.env.local` avec le **Bloc-notes** et remplis tes valeurs :

```
# Shopify — un bloc par store (Client ID + Client Secret du Dev Dashboard)
SHOPIFY_ES_DOMAIN=xxxxx.myshopify.com
SHOPIFY_ES_CLIENT_ID=...
SHOPIFY_ES_CLIENT_SECRET=...

SHOPIFY_UK_DOMAIN=xxxxx.myshopify.com
SHOPIFY_UK_CLIENT_ID=...
SHOPIFY_UK_CLIENT_SECRET=...

SHOPIFY_DE_DOMAIN=a9uac7-bm.myshopify.com
SHOPIFY_DE_CLIENT_ID=23d8e43684016749396e86b492c59fa5
SHOPIFY_DE_CLIENT_SECRET=...

SHOPIFY_FR_DOMAIN=xxxxx.myshopify.com
SHOPIFY_FR_CLIENT_ID=...
SHOPIFY_FR_CLIENT_SECRET=...

# Meta Ads
META_ACCESS_TOKEN=...
META_AD_ACCOUNT_ID=919559773962419

# Supabase (créé à l'étape 6)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=...

# Mot de passe du dashboard (tu le choisis)
DASHBOARD_PASSWORD=choisis-un-mot-de-passe
APP_TIMEZONE=Europe/Paris
```

> ⚠️ Ce fichier `.env.local` ne doit **jamais** être envoyé sur GitHub. Il est
> déjà protégé (dans `.gitignore`), donc il restera chez toi.

---

## 4. Installer les dépendances (une seule fois)

Dans le terminal (toujours dans le dossier du projet) :

```bash
npm install
```

(Ça télécharge les briques du projet. Ça prend 1-2 min.)

---

## 5. Voir le dashboard tout de suite (mode démo, sans clés)

Ajoute cette ligne dans `.env.local` :

```
NIVA_DEMO=1
```

Puis :

```bash
npm run dev
```

Ouvre **http://localhost:3000** dans ton navigateur.
Identifiant : n'importe lequel · Mot de passe : celui de `DASHBOARD_PASSWORD`.

Tu verras les 6 écrans avec des chiffres d'exemple. **Quand tes vraies données
seront chargées (étapes 6-8), enlève la ligne `NIVA_DEMO=1`.**

---

## 6. Créer la base Supabase (gratuit)

1. Va sur **https://supabase.com** → crée un compte → **New project**
2. Une fois créé : menu **Project Settings → API** → copie **Project URL** et
   la clé **`service_role`** → mets-les dans `.env.local`
   (`SUPABASE_URL` et `SUPABASE_SERVICE_KEY`)
3. Menu **SQL Editor → New query** → copie-colle le contenu de
   **`supabase/migrations/0001_init.sql`** → **Run**
4. Refais pareil avec **`supabase/migrations/0002_control.sql`** → **Run**
5. Et enfin **`supabase/migrations/0003_campaign_overrides.sql`** → **Run**

(Ça crée les tables. À faire une seule fois, dans cet ordre.)

---

## 7. Découvrir tes produits

```bash
npm run discover-products
```

Ça crée un fichier `products_map.draft.json` avec la liste de tes produits par
store. **Envoie-moi cette liste** (juste les noms) et je te renvoie le mapping
final à charger dans Supabase (table `products_map`).

---

## 8. Charger tout l'historique

Une fois le `products_map` chargé dans Supabase :

```bash
npm run backfill
```

Ça télécharge tout depuis le 4 juin, calcule le P&L et remplit Supabase.
Enlève `NIVA_DEMO=1` de `.env.local`, relance `npm run dev`, et tu vois
**tes vrais chiffres**. 🎉

---

## Récap des commandes

| Commande | Ce que ça fait |
|---|---|
| `npm install` | Installe le projet (1 fois) |
| `npm run dev` | Lance le dashboard sur http://localhost:3000 |
| `npm run discover-products` | Liste tes produits (pour le mapping) |
| `npm run backfill` | Remplit Supabase avec ton historique |
| `npm test` | Vérifie que les calculs sont justes (21 tests) |

Bloqué à une étape ? Dis-moi le numéro de l'étape et ce que tu vois, je débloque.
