# Kindred — mémoire de travail

> Ce fichier est chargé **automatiquement au démarrage de chaque session
> Claude** sur ce dépôt. Les `@imports` ci-dessous tirent toute la mémoire
> avec lui : n'importe quelle session arrive donc avec le contexte complet
> en tête, sans que personne ait à le recoller à la main.

Kindred LLC / marque **Niva** (mynivashop.com) — 4 boutiques Shopify
(ES/UK/DE/FR, FR ≈ 90 % du volume) + Meta Ads, avec un dashboard financier
qui calcule le P&L réel au centime.

**Interlocuteur : Badr** — non-technique, français, sur téléphone, veut de
l'autonomie totale et **zéro tolérance aux chiffres faux**. Répondre en
français, ton simple, sans jargon inutile.

## Mémoire par domaine

@memory/conventions.md
@memory/business.md
@memory/produits-couts.md
@memory/ads-scaling.md
@memory/emailing-sav.md
@memory/finances-charges.md
@memory/dashboard-ui.md
@memory/infra-donnees.md

| Fichier | Ce qu'il contient | Le mettre à jour quand… |
|---|---|---|
| `memory/conventions.md` | Règles de travail transverses | une règle de méthode change |
| `memory/business.md` | Société, associés, produits, prix, noms Shopify | un produit, un prix ou un nom bouge |
| `memory/produits-couts.md` | COGS, taxe UE, frais Shopify réels, marges, factures Panda | une grille de coût ou une facture change |
| `memory/ads-scaling.md` | Protocole scaling, attribution, MER/ROAS, rapport 23h05 | une règle d'arbitrage pub change |
| `memory/emailing-sav.md` | Klaviyo, SPF/DKIM/DMARC, ParcelPanel, suivi colis, SAV | la délivrabilité ou les flows changent |
| `memory/finances-charges.md` | Abonnements, partage associés, factures fournisseur | un abonnement/paiement est annoncé |
| `memory/dashboard-ui.md` | Thème, onglets, cartes, ce que Badr voit | l'UI change |
| `memory/infra-donnees.md` | Next/Supabase/Vercel, resync, limites API | l'infra ou une limite API change |

## Règles d'entretien de cette mémoire

1. **Une info vit dans UN seul fichier.** Si elle touche deux domaines, elle
   va dans le plus spécifique et l'autre fichier y renvoie par une ligne.
   Jamais de copie — deux copies divergent toujours.
2. **Chaque fait est daté et sourcé** (« Badr 12/08 », « vérifié via l'API
   Meta le 08/08 »). Un fait sans source n'a pas sa place ici.
3. **On ne supprime jamais une ligne périmée** : on la barre (`~~…~~`) en
   indiquant ce qui la remplace, ou on pose un `endDay`. L'historique
   explique pourquoi les chiffres d'avant étaient ce qu'ils étaient.
4. **Une correction se propage partout** : code + fichier mémoire concerné +
   `STATUT.md` si l'état du projet change.
5. Documents longs et non-mémoire : `NIVA_DASHBOARD_SPEC.md` (spec métier
   complète), `STATUT.md` (historique détaillé), `DEMARRAGE.md` (déploiement).
   Ils ne sont **pas** auto-chargés — les ouvrir à la demande.

## Développement

- Branche par défaut : `claude/kindredm-dashboard-setup-epbxha`. Le lien
  Vercel de Badr ne bouge QUE si le code y arrive.
- `npm test` (vitest) — les fixtures sont validées au centime, ne jamais les
  casser pour faire passer un test.
- Montants en **centimes (integers)** dans le code. UI en français.
