# Guide recherche produit — de zéro à un winner scalable

> Objectif : trouver un produit **proche de la niche legging** (fashion/shapewear femme),
> valider qu'il est winner **avec des chiffres**, et le scaler avec le protocole déjà codé
> dans l'onglet 🪜 Meta Scaling.
>
> Sources = transcriptions de la formation dans ce repo :
> `master-research/04-ecom-data-1` (filtres exacts), `05-ecom-data-2` (Brandsearch),
> `09-criteres-produit`, `11-methodes-et-outils-utilise`, `13-afterlib`, `16-ppspy`,
> `17-pipiads`, `19-methodes-et-outils-concurrence-analyse`,
> `0-to-1-master-one/31-tutoriel-2026-recherche-produit-de-a-a-z`,
> `master-research/02-master-product-formulatm`.
> Les seuils de scaling viennent de `docs/formation/PROTOCOLE-DECISION.md` (board Whimsical, leçon 35).

---

## Étape 0 — Le setup (30 min, une seule fois)

**Navigateur** : Chrome ou Arc, avec ces extensions (toutes gratuites) :

| Extension | À quoi elle sert |
|---|---|
| **BrandSearch** (extension seule, pas besoin de l'abonnement) | Calcule le **spend estimé** de chaque ad Meta à partir des impressions. C'est L'outil central. |
| **SimilarWeb** | Trafic mensuel d'une boutique + la courbe d'évolution. 25 boutiques/semaine par compte gratuit. |
| **PPSPY** | Date de création de la page produit + nouveaux produits/collections d'un concurrent. |
| **Meta Pixel Helper** / **TikTok Pixel Helper** | Voir en 1 clic si le concurrent fait du Meta ou du TikTok Ads. |

**Réglage BrandSearch** : CPM = **9** par défaut. Marché allemand ou Q4 → mets **12 à 15**
(sinon le spend est surestimé). C'est ce réglage qui transforme « impressions » en « euros/jour ».

**Ton fichier de suivi** (un Google Sheet, 6 colonnes, pas plus — L31 [03:49]) :

| Site | Date création boutique | Trafic (courbe) | Spend daily top ad | Ads actives | Marché |
|---|---|---|---|---|---|

---

## Étape 1 — Fabriquer tes mots-clés (ChatGPT, 15 min)

La formation est claire : **avant tout logiciel, ChatGPT** (L11 [00:45]).

Deux familles de mots-clés, tu as besoin des deux :

**A. Mots-clés produit (niche legging)** — demande à ChatGPT :
> « Donne-moi 40 mots-clés produits, en français, allemand, néerlandais, suédois et italien,
> autour de la niche legging / shapewear / sport femme : legging push-up, legging sculptant,
> anti-cellulite, gaine amincissante, short de sudation, collant thermique, brassière,
> combinaison sculptante, legging taille haute effet ventre plat… »

**B. Mots-clés « ad copy »** — ce que les dropshippers écrivent DANS leurs pubs
(L31 [06:45], L4 [24:54]) : `livraison gratuite`, `livraison offerte`, `-50 %`,
`2 achetés 1 offert`, `satisfait ou remboursé 30 jours`, `plus de 100 000 femmes`,
`cliquez ici`, `commandez maintenant`, `4.8 ⭐`. Puis traduits en allemand, néerlandais, suédois, italien.

**L'astuce des mots-clés infinis** (L31 [12:45]) : quand tu tombes sur une bonne pub, tu copies une
phrase de SON ad copy et tu la relances comme mot-clé. Tu ne tombes jamais à court.

---

## Étape 2 — Meta Ads Library : la source gratuite et la plus fraîche

C'est là que la data arrive **en moins de 24 h**, alors que les spy tools payants ont
1 à 2 semaines de retard (L31 [05:15], L4 [24:09]). Chronophage mais tu trouves ce que
personne ne trouve.

### Les filtres, dans l'ordre

1. **Pays** : PAS la France. Tu cherches en **Allemagne, Pays-Bas, Suède, Danemark, Italie,
   Espagne** — les pays où les produits sortent avant la France (L4 [14:11]). L'Allemagne est
   un filtre qualité naturel, les pays nordiques sont négligés par tout le monde.
2. **Catégorie** : toutes les publicités.
3. **Mot-clé** : un mot-clé de ta liste (produit OU ad copy).
4. **Shopify filter : ON** (paramètres de l'extension). Sinon tu es noyé sous Temu, Carrefour, Shein.
5. **Format : Vidéo uniquement.** ⚠️ Spécifique à ta niche : la formation le dit deux fois
   (L31 [11:17], L4 [26:04]) — dès qu'on est en fashion/bijoux, on filtre en vidéo sinon
   c'est illisible.
6. **Date** : recule de **4-5 jours** par rapport à aujourd'hui. Les ads d'hier sont des ads de
   testing, elles ne prouvent rien.
7. **Tri** : par impressions (les gros spenders) OU par plus récent (les nouveautés). Fais les deux.

### La lecture

Sur chaque boutique intéressante : ouvrir « toutes les pubs » → extension BrandSearch →
**Check all** → laisser tourner pendant que tu continues à scroller → revenir → **trier par Daily**.

---

## Étape 3 — Les seuils : winner ou pas winner ?

**Le chiffre roi = le spend DAILY d'une seule ad** (spend total ÷ nombre de jours d'activité).
Le spend total ne veut rien dire : une ad peut avoir dépensé 60 000 € mais dater de 2023.

| Spend daily d'UNE ad | Verdict (L31 [14:33], L4 [10:32]) |
|---|---|
| < 50 €/j | Testing. On ignore. |
| 50-70 €/j | Rien prouvé — les gens testent entre 50 et 100 €. |
| **≥ 70 €/j** | **Intéressant → dans le sheet.** |
| **≥ 100 €/j** | **Créa winner. Le produit est validé.** |
| ≥ 500 €/j cumulés sur la page | Grosse machine, produit confirmé. |

**Les 4 signaux à croiser avec le spend :**

| Signal | Bon | Mauvais |
|---|---|---|
| **Courbe de trafic** (SimilarWeb) | Plate puis **explose** (ex. 30 k → 160 k) | En déclin, ou en dents de scie |
| **Ads actives** | ≥ 50, idéalement 100-300+ ; et **en augmentation** (20 → 150 en une semaine) | < 50 = ça ne vend pas fort |
| **Âge de la boutique** | < 6 mois (max 1 an) | Boutique installée depuis 2 ans = trop tard, trop de concurrents |
| **Âge des créas** | Ad qui tourne depuis ~1-3 semaines | Créas de +90 jours = trend finie |

⚠️ **SimilarWeb sous-estime le trafic de ×5 à ×10** (L31 [02:16]). 10 000 affichés = 50-100 k réels.
Ce qui compte, c'est **la forme de la courbe**, pas le chiffre absolu.

**Le combo qui doit te faire sauter au plafond** (L31 [34:38]) : PPSPY dit que la page produit a
été créée il y a **10 jours**, et l'ad spend déjà **500 €/jour**. Là tu lances dans les 48 h.

---

## Étape 4 — Les outils payants (seulement quand l'étape 2 tourne)

Ordre d'achat recommandé par la formation : **Meta Ads Library (gratuit) → Brandsearch → Kalodata/FastMoss**.

### Brandsearch (~5-6 M de boutiques, code `MASTER` -35 % le 1er mois)
Filtres exacts utilisés en interne (L4 [38:12], L31 [19:12]) :

| Filtre | Valeur |
|---|---|
| Date de création boutique | **< 6 mois** (max 1 an) |
| Trafic | **min 1 000** (ou 10 000) — **max 50 000** (au-delà, la boutique est déjà trop grosse) |
| Ads actives | **min 50** |
| Techno | Shopify |
| Apps (repérer les dropshippers) | `Cashing bundle`, `Moon bundle` — et `Recharge` si tu veux de l'abonnement |
| Marché | DE / NL / SE / DK / IT — ou US pour voir 3 mois en avance |
| Tri | **Ad scaling** (évolution des ads) ou Ads actives ou Trafic |

Second filtre magique : **rien du tout, sauf « créé dans les 60 derniers jours »**, trié par trafic.
Une boutique de 2 mois avec 40 000 de trafic = elle vient d'exploser.

### USpy / AfterLib (Europe, basés sur les impressions Meta)
- **USpy** : date de création **14-30 j**, techno Shopify, tri par **Daily spend**.
  *Astuce* (L4 [07:39]) : mets **Daily spend max = 30 €**. Les ads mal rafraîchies par l'outil
  spendent souvent déjà 100 €/j en réalité → tu les vois avant tout le monde.
- **AfterLib** : 30 jours, Shopify, **un pays à la fois**, et surtout la **recherche multi-mots-clés**
  (colle 40 mots-clés séparés par des virgules, virgule finale comprise) — c'est exactement ce
  qu'il te faut pour rester dans la niche legging (L4 [15:00]).
  *Astuce Q1/Q4* : regarde ce qui était winner **au même trimestre l'année dernière** et relance-le
  avant tout le monde.

### FastMoss / Kalodata (TikTok Shop US = les trends 2-3 mois en avance)
- Section **Top products**, période 30 jours, **Launch date < 30 jours** → les vrais nouveaux bangers.
- *Astuce anti-saturation* : tout le monde s'arrête aux 50 premières pages. Va à la page 50, note le
  chiffre de revenus le plus bas (ex. 340 551 $), remets-le comme **revenu max** et recommence.
  Tu descends jusqu'à ~100 000 $ dans des produits que personne ne regarde.
- Bonus énorme pour la fashion : chaque produit te donne **des dizaines de vidéos créateurs**
  = matière première gratuite pour tes mashups.

---

## Étape 5 — Recherche concurrentielle sur TON marché (obligatoire avant de lancer)

Tu as un produit qui scale en Allemagne. Avant d'investir : **est-ce que quelqu'un le fait déjà en France ?**

1. **Meta Ads Library FR** avec le mot-clé produit traduit + les mots-clés de son ad copy traduits.
2. **Recherche Google par image** de sa créa → c'est là qu'on trouve le plus de copieurs (L31 [33:13]).
3. **Ecom Store / Brandsearch** → « similar store » ou recherche par mot-clé.
4. **isearchfrom.com** + Google Shopping : simule une recherche depuis le pays voulu (L19 [05:55]).

**Décision :**
- 0-2 concurrents FR, produit qui explose ailleurs → **GO**, tu es en avance.
- 3-10 concurrents FR récents → GO **seulement** avec un vrai différenciateur (offre, angle, prix, packaging).
- Concurrents FR installés depuis 6+ mois avec 300 ads → **passe ton chemin**, sauf si tu fais mieux
  sur l'offre.

⚠️ Nuance importante de la leçon 2 (formule produit) : **beaucoup de concurrents ≠ mauvais signal
pour le TAM**. Le bon marché a **≥ 5 concurrents avec 100+ ads actives et 50-100 k visiteurs/mois**.
Ce que tu ne veux pas, c'est être le 12e à faire exactement la même offre sur le même marché.

---

## Étape 6 — La grille de validation (avant de dépenser 1 €)

### Les 9 critères produit (L9)
1. Répond à un problème / besoin fort
2. Effet visuel ou viralité (avant/après compréhensible en **3 secondes**)
3. **Marge x3 à x4** minimum sur le coût produit
4. Preuve sociale existante (reviews Amazon, TikTok, YouTube)
5. Simple à comprendre et à utiliser
6. Aucun souci légal ou douanier — léger, pas trop volumineux
7. Difficilement trouvable en magasin
8. Compréhension immédiate
9. Upsell ou réachat possible

### Les maths (le point qui décide vraiment)
Ne lance rien sans avoir calculé ta **marge contributive** :

```
CM = (Prix de vente − COGS − taxe UE 3 €/commande − frais Shopify ~3 %) / Prix de vente
ROAS break-even  = 1 / CM
ROAS cible 15 %  = 1 / (CM − 0,15)
```

**Exemple legging, panier 2 pièces à 59,98 €**, COGS 15 €, taxe 3 €, frais 1,80 € :
CM = (59,98 − 19,80)/59,98 = **67 %** → BE ROAS **1,49** · cible 15 % **1,92**.
👉 C'est le même ordre de grandeur que ton Polo (BE 1,62 / cible 2,13) et ton Gilet (BE 1,57 / cible 2,06).
Si le calcul te sort une CM sous **60 %**, le produit n'est pas lançable en fashion Meta.

### Spécifique fashion / legging — les pièges
- **TAM énorme = bon point** (leçon 2 : « des t-shirts que tout le monde porte »), donc scalable très haut.
- **Mais différenciation faible** : c'est la niche la plus copiée. Ton avantage doit venir de l'**angle**
  (à qui tu parles), de l'**offre** (bundle 2/3 pièces comme sur ton Polo) et de la **créa**, pas du produit.
- **Tailles = retours + SAV.** Prévois le guide des tailles sur la LP et anticipe le taux de retour dans tes COGS.
- L'upsell est natif : legging + brassière, legging + short, pack 2/3 couleurs. Ça monte ton AOV
  et donc ta CM, exactement comme le Caleçon offert sur le Polo.

---

## Étape 7 — Tester, puis scaler (protocole leçon 35/36/37 déjà codé dans le dashboard)

**Le test** (T36) :
- Batch de **3 à 6 ads** dans un **nouvel adset**, jamais plus de 15 ads par adset.
- **2-3 ad copies × 2-3 titres × 1 description**, une ad copy par **angle**.
- Miniature choisie à la main. 50 % page marque / 50 % page tierce.
- **10-15 €/j minimum pendant 2 jours** pour forcer Meta à tester.
- Lancement **mardi → vendredi**, mise en ligne entre minuit et 7 h.
- Sous 3 000 €/j : **tout se joue dans la CBO**.

**Le pré-scaling** (< 3 000 €/j — la question est **binaire**) :
> Rentable au backend sur les **2 derniers jours**, marge ≥ **15 %** ?

- **OUI** → on monte : budget < 500 €/j → **×2 plafonné à 500** ; ≥ 500 €/j → palier suivant
  **500 → 750 → 1000 → 1500 → 1850 → 2250 → 3000**. Compteur remis à zéro.
- **NON n°1** → attendre 24 h.
- **NON n°2 et 3** → **−15 %** + nouvelles créas.
- **NON n°4** → **sauvetage** (cadran CPC × CVR : créas / funnel / AOV).
- Plancher : 100 €/j. On ne coupe **jamais** une annonce qui tourne.

**Créa winner** (T37) : **≥ 6 ventes ET ≥ 10 % de marge sur 14 jours**.
Entre BE et 10 % avec ≥ 6 ventes = *potential winner*. < 6 ventes mais marge ≥ 15 % = signal précoce.

👉 Tout ça est déjà calculé automatiquement dans l'onglet **🪜 Meta Scaling** du dashboard :
une fois le produit lancé, tu ne fais que lire le verdict (SCALE / HOLD / DESCALE / RESCUE).

---

## Ta routine hebdo (2 sessions de 2 h)

| Quand | Quoi |
|---|---|
| **Session 1 (lundi)** | Meta Ads Library, 3 pays (DE, NL, SE), 10 mots-clés legging + 5 ad copy. Objectif : 15-20 lignes dans le sheet. |
| **Session 2 (jeudi)** | Brandsearch (filtres ci-dessus) + FastMoss (launch date < 30 j). Objectif : 10 lignes de plus. |
| **Fin de semaine** | Tu gardes les **3 à 5** produits qui passent : spend daily ≥ 70 €, courbe en explosion, < 3 concurrents FR, CM ≥ 60 %. Tu en lances **1**. |

**Règle d'or de la formation** : si tu utilises les mêmes filtres que tout le monde, tu trouves les
mêmes produits que tout le monde. Les chiffres ci-dessus sont un point de départ — fais varier les
pays, les mots-clés et les fourchettes pour te construire ta propre sauce.
