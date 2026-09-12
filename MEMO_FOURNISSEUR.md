# Mémoire — dossier fournisseur Panda Dropshipping

**Dernière mise à jour : 12/09/2026.** Ce fichier est la mémoire de travail de l'agent
qui gère les factures fournisseur. Il contient l'état financier, ce qui a été
concédé et pourquoi, les preuves, et surtout **les pièges méthodologiques** qui ont
coûté trois erreurs dans la même journée.

---

## 1. Qui, quoi

| | |
|---|---|
| Fournisseur | **Panda Dropshipping Ltd** (agent : Claire, WhatsApp +852 8437 3841) |
| Acheteur | NIVA / Nivafit — boutique Shopify FR (97 % du volume) |
| Début de la relation | **01/07/2026**. Rien d'antérieur ne lui est opposable (autre fournisseur). |
| Modèle | Dropshipping DDP, facturation par lots de commandes, paiement par virement |

Claire est réactive, factuelle et **produit des preuves quand on lui en demande**
(trackings, captures de son propre système). Elle a cédé trois fois dans la journée
du 12/09 **sans qu'on insiste**, chaque fois après qu'on lui a donné raison sur un
point où elle avait raison. C'est le mode de fonctionnement à conserver.

---

## 2. État financier au 12/09/2026

### Les 4 factures détenues

| Réf | Plage | Commandes | Total € | État |
|---|---|---|---|---|
| Bill 20260801 | #4814 → #5462 | 649 | 14 279,96 | payée |
| Bill 20260814 | #5463 → #5995 | 533 | 12 064,41 | payée |
| Bill 20260903 | #5996 → #7148 | 1 152 | 25 448,36 | payée |
| Bill 20260909 | #7149 → #7506 | 358 | **8 326,31** | **partiellement payée** |

> La 20260909 était émise à 8 494,71 €. Claire a **retiré elle-même** 168,40 € de
> lignes en double sur **#6953** (3 lignes le 09/09 alors que la commande était déjà
> facturée 34,75 € le 03/09). Reste demandé : 8 326,31 €.

### Le compte de la facture 20260909

| | € |
|---|---|
| Demandé | 8 326,31 |
| Corrections sur CETTE facture (A1 + A2) | − 58,42 |
| **Montant correct** | **8 267,89** |
| Déjà viré le 10/09 | − 5 613,02 |
| Avoirs sur factures déjà soldées (A3) | − 155,33 |
| Compensation (partie B) | − 293,48 |
| **À VIRER** | **2 206,06** |

**Retenue justifiée sur les 2 713,29 € retenus : 351,90 €** (= A1 + A2 + partie B).

### Le détail

| | € | État au 12/09 |
|---|---|---|
| **A1** · #7173, #7484 non expédiées | 54,02 | ✅ accordé par Claire |
| **A2** · comptage size-up | 4,40 | ✅ accordé par Claire |
| **A3** · #5455, #5842, #6945, #7023 (adresses) | 105,84 | ✅ accordé par Claire |
| **A3** · #5458 | 39,22 | ⏳ en discussion |
| **A3** · #4856 | 10,27 | ⏳ en discussion |
| **B1** · chargebacks | 0,00 | ❌ **retiré par nous** |
| **B2** · pub brûlée, 5 × 35 € | 175,00 | ⏳ elle conteste |
| **B3** · #4079, #5649 | 118,48 | ⏳ non abordé |
| **Ouvert, non déduit** · #2870, #4486 | 330,04 | ⏳ en attente d'elle |
| **En sa faveur, signalé** · #5535, #5576, #5642 | −59,78 | sous-facturé, à re-facturer |

**Total réclamé : 837,27 €** (contre 3 198,66 € au départ le 10/09).

---

## 3. Position ligne par ligne — avec la preuve

### ✅ A1 · #7173 et #7484 — 54,02 €
**Position initiale (fausse) :** 47 commandes facturées sans tracking = 995,05 €.
**Ce qui s'est passé :** Claire répond que ce sont des commandes du jour de la
facture, expédiées juste après. Vérification en base : **45 des 47 ont été commandées
le 08/09 et toutes leurs lignes physiques sont passées `fulfilled` le 10/09** — le
lendemain de la facture. Elle avait raison, les 45 sont payées.
**Ce qui reste :** #7173 et #7484. Sur les deux, la **seule** ligne `fulfilled` est
l'**e-book** (numérique, auto-expédié). Aucun article physique n'est parti.
Claire a confirmé : adresses incomplètes. Elle retire de la facture et re-facturera
au départ du colis.
**Action NIVA en attente :** envoyer les deux adresses complètes.

### ✅ A2 · comptage size-up — 4,40 €
**Position initiale (fausse) :** prorata de son forfait 616,30 € sur « 3 des 39
réexpéditions sont tes erreurs » = 47,41 €.
**Pourquoi c'était faux — DEUX erreurs :**
1. Le forfait n'est pas un forfait de réexpédition. Sa ligne dit :
   *« size up change cost from (#4815-#7506) total 6163 pieces, cost is 616.3 euro »*
   → c'est **0,10 €/pièce sur toute la plage**. Le prorata n'a aucun sens.
2. Les « 39 réexpéditions » n'existaient pas. Le fichier
   `scratchpad/reexpeditions_fournisseur.txt` contient **46 lignes au total depuis le
   début**, dont **4 seulement** dans la plage : #4933, #5446, #5649 (sa faute) et
   #6577 (notre faute).

**Ce qui tient :** le comptage. Recompté depuis **ses propres lignes de facture** sur
#4815→#7506 : **6 119 polos** (7 282 pièces tous types). Elle facture 6 163.
Écart **44 pièces = 4,40 €**. Claire a confirmé le calcul elle-même.

### ✅ A3 · #5455, #5842, #6945, #7023 — 105,84 €
Adresses incomplètes. **Sa collègue nous avait prévenus les 02/09 et 04/09** dans le
groupe WhatsApp, et Badr n'a pas agi. Elle retire de la facture et re-facturera au
départ du colis. **Le reproche qu'on lui avait adressé était injustifié et a été
retiré par écrit** — c'était la bonne décision, elle a cédé sur le reste juste après.

### ⏳ A3 · #5458 — 39,22 € — LE MEILLEUR ARGUMENT DU DOSSIER
Sa réponse : *« 5458 is to LX and YUN Clothes channel dont ship there that is why »*.
**Contre-preuve, dans sa propre facture 20260801 :**

| Cmd | Pays | Bundle | Tracking | € |
|---|---|---|---|---|
| **#5342** | LU | POLOx4, CALECONx1 | **LX065511839NL** | 39,22 |
| **#5458** | LU | POLOx4, CALECONx1 | **—** | 39,22 |

Même facture, même pays, même bundle, même prix. L'une part avec un vrai tracking
luxembourgeois, l'autre a un tiret — **écrit par elle** — et est facturée quand même.
Sur l'ensemble des 4 factures : **Luxembourg = 21 lignes, 19 avec tracking LX…**.
Le Luxembourg est desservi. Client remboursé 89,99 € à 100 %.

### ⏳ A3 · #4856 — 10,27 €
Elle a envoyé la preuve de livraison du tracking 06086507184076 (livré 06/08).
**Ça ne casse pas la réclamation, ça la confirme :** la commande Shopify #4856
contient **3 articles — 2 polos + 1 short**. Sa ligne 1 (SHORTSx1, POLOx2, 24,39 €,
tracking …176810) couvre déjà toute la commande. Sa ligne 2 (POLOx1, 10,27 €,
tracking …184076) est un **4ᵉ article jamais commandé**. Soit une réexpédition —
qu'elle ne facture jamais, dixit elle — soit une erreur d'envoi.
**Formule à garder :** « montre-moi un 3ᵉ polo dans sa commande et je paie le jour même ».

### ❌ B1 · chargebacks #3285 et #4368 — RETIRÉ, 253,21 €
**Erreur de notre côté.** On avait argué d'un délai de livraison de 43-45 jours.
**Faux :** ce chiffre venait de `orders.updated_at_utc`, qui est la **dernière
modification de la commande** — laquelle correspondait à l'enregistrement du
chargeback, pas à la livraison. Claire a envoyé les trackings :
**#4368 commandée le 13/07, livrée à Arras le 31/07 — 18 jours.** #3285 livrée aussi.
Deux clients ont reçu leur marchandise et ont contesté quand même : c'est de la
fraude au remboursement côté client, à traiter avec la banque, pas avec elle.
Les 70 € de pub rattachés à ces deux commandes ont été retirés avec (B2 passe de 7 à
5 commandes).

### ⏳ B2 · pub brûlée, 5 × 35 € = 175,00 €
Coût d'acquisition mesuré : **35,05 € juillet · 34,55 € août · 35,43 € septembre**
(dépense Meta ÷ nombre de commandes, mois par mois). On applique 35,00 €.

| Cmd | Pays | Commandée | Lignes expédiées | Remboursée |
|---|---|---|---|---|
| #2850 | ES | 01/07 | **0 / 4** | 89,99 € le **21/07** (20 j) |
| #3618 | BE | 07/07 | **0 / 4** | 89,99 € le **21/07** (14 j) |
| #4458 | LU | 14/07 | **0 / 4** | 89,99 € le **21/07** (7 j) |
| #4615 | ES | 16/07 | **0 / 1** | 59,98 € le **21/07** (5 j) |
| #5458 | LU | 01/08 | **0 / 6** | 89,99 € le 05/08 |

**Les quatre premières soldées le même jour** : ce n'est pas quatre clients qui
changent d'avis, c'est un nettoyage de tout ce qui dormait sans bouger.

**Contre son argument « on ne garantit pas livrer partout »** — compté dans ses
propres factures :

| Pays | Lignes facturées | Avec tracking |
|---|---|---|
| Belgique | 405 | 371 |
| Luxembourg | 21 | 19 |
| Espagne | 5 | 5 |

**Limite à connaître :** ces 4 commandes sont **antérieures à #4814**, donc absentes
des factures qu'on détient. On ne peut pas prouver par facture qu'elle ne les a pas
expédiées. C'est pour ça qu'on ne réclame **que la pub** dessus, jamais la
marchandise. Si elle sort un tracking, on retire immédiatement — l'offre lui a été
faite par écrit.

### ⏳ B3 · #4079, #5649 — 118,48 €
Erreurs d'expédition documentées dans notre journal de réexpéditions, client
dédommagé. 107,99 € rendus + 10,49 € de frais de carte conservés par Shopify.
**Jamais abordé avec elle à ce jour.**

### ⏳ Ouvert — #2870 (62,24 €) et #4486 (267,80 €)
**Non déduits**, car dans les deux cas **le client n'a pas encore été remboursé**
(`refunded_cents = 0` vérifié). Les compter serait réclamer une perte qui n'existe
pas — c'est exactement ce qui décrédibiliserait le relevé.

- **#2870** — t-shirt noir livré à la place d'un polo et d'un short. Correction
  promise le **26/08**, toujours rien. 49,44 € (prorata réel payé par le client sur
  le bundle : 124,98 × 179,98 ÷ 454,93) + 12,80 € de marchandise. Pas de pub
  réclamée : le client a gardé 5 articles sur 7, la vente tient.
- **#4486** — Claire a admis : *« first package is lost which is our responsibility
  so we reshipped and it's in transit »*. **Aucune trace chez nous** : pas de second
  tracking, **aucun mouvement sur la commande depuis le 15/07**. Demander le tracking
  de la réexpédition.

### ℹ️ En sa faveur — ~59,78 €
#5535, #5576, #5642 facturées « POLOx1 » chacune (12,23 + 9,65 + 12,91 = 34,79 €)
alors que Shopify montre 4 polos + 1 caleçon expédiés sur chacune (~94,57 € à ses
tarifs). **On le signale, on ne l'encaisse pas.** C'est ce qui rend le reste crédible.

---

## 4. ⚠️ RÈGLES DE MÉTHODE — à lire avant toute nouvelle réclamation

Trois erreurs commises le 12/09, toutes du même type : **conclure sur une donnée
partielle au lieu d'aller chercher la donnée complète.** Elles ont coûté 1 318 € de
réclamations qui se sont effondrées en une journée.

1. **`orders.updated_at_utc` n'est PAS une date de livraison ni d'annulation.**
   C'est la dernière modification de la commande, quelle qu'elle soit — un
   chargeback enregistré, un remboursement, une note. Ne jamais en déduire un délai.
   *Exception acceptable :* une commande **0 ligne expédiée + remboursée à 100 %** —
   là, la dernière modification EST le remboursement (cas des 4 commandes de B2).

2. **« Pas de tracking sur sa facture » ≠ « jamais expédié ».** Elle facture souvent
   le jour même de la commande, le tracking arrive le lendemain. Vérifier
   `line_items[].fulfillment_status` **quelques jours après**, jamais le jour même.

3. **L'e-book fausse le comptage des lignes expédiées.** C'est un produit numérique
   auto-`fulfilled`. Une commande avec « 1 ligne sur 5 expédiée » peut n'avoir
   expédié **aucun article physique**. Toujours exclure l'e-book.

4. **Recompter depuis SES documents, pas depuis les nôtres.** Le 6 119 vs 6 163 du
   size-up ne vaut que parce qu'il est calculé sur ses propres lignes de facture. Un
   écart calculé contre Shopify serait contestable.

5. **Ne jamais réclamer une perte qui n'est pas encore réalisée.** Si
   `refunded_cents = 0`, le client n'a rien récupéré, la perte n'existe pas. → section
   « ouvert, non réclamé », jamais dans le montant déduit.

6. **Ne pas réclamer le prix de vente.** Principe acté avec Claire : un remboursement
   sur une commande jamais expédiée n'est **pas une perte** (on rend un argent reçu
   pour une marchandise jamais payée). On réclame : la marchandise payée, les frais
   bancaires réellement retenus, et la pub dépensée.

7. **Vérifier avant d'accuser.** Le reproche « préviens-nous le jour où tu vois le
   problème » était faux : sa collègue nous avait prévenus. Chercher dans le groupe
   WhatsApp avant d'affirmer qu'on n'a pas été prévenu.

8. **Quand elle a raison, le dire vite et par écrit.** Chacune de ses trois
   concessions du 12/09 est arrivée juste après qu'on lui a donné raison sur un
   point. Un relevé qui se corrige contre lui-même n'est plus discuté sur le reste.

9. **Un problème mesuré dans l'historique n'est pas un problème actuel.** Avant de
   présenter une perte comme un chantier ouvert, regarder la **date de la dernière
   occurrence**, pas seulement le total. Les pertes DOM-TOM (section 8) ont été
   annoncées à Badr comme 8 000 € à aller chercher alors qu'elles s'arrêtent toutes
   au 15/07 : le problème était déjà réglé. `max(day)` avant `sum()`.

10. **Demander à Badr ce qui a déjà été convenu avant de proposer une action.**
    L'arrêt des ventes sur ces zones avait été décidé avec Adnane dès le début —
    l'information n'est dans aucune table, seulement dans sa tête.

---

## 5. Ce que Claire a admis par écrit — à opposer plus tard

- *« As an agent we can be responsible for product shipping mistake, like missing
  items, shipping to wrong place and product size wrong — if we sent wrong we can
  reship and cover cost no problem »*
- *« We would never ask you to pay for reship if it's our mistake for shipment,
  actually all reshipped packages we don't add to bill »* → **tout article
  réexpédié qui apparaît sur une facture est contestable de droit.**
- *« let me know on the chargebacks or any loss you got as of the shipping issue,
  we will cover »* (09/09)
- *« #4486 first package is lost which is our responsibility »* (12/09)
- *« we can remove from bill whenever the address is corrected we will charge »*
- Elle a retiré spontanément les 168,40 € de doublons sur #6953.

**Position d'elle à ne PAS combattre :** elle refuse de couvrir le prix de vente sur
une commande annulée, et elle a raison. Elle refuse aussi de garantir toutes les
destinations — également légitime, et c'est à nous de bloquer.

---

## 6. Sources et comment vérifier

### Base Supabase (projet `eyfbkxdtxdoktscjaqsg`)
```sql
-- état réel d'une commande : articles physiques expédiés ou non
select o.order_name, o.day, o.shipping_country, o.total_cents, o.refunded_cents,
       li->>'name' as article,
       li->>'fulfillment_status' as statut,
       li->>'fulfillable_quantity' as reste
from orders o, jsonb_array_elements(o.line_items) li
where o.store='FR' and o.order_name = '#XXXX';
```
Colonnes utiles : `day`, `shipping_country`, `total_cents`, `refunded_cents`,
`cogs_product_cents`, `cogs_upsells_cents`, `tax_eu_cents`, `line_items` (jsonb).
**Pas de table des litiges** (`chargebacks` est vide) — passer par Shopify.

### Factures parsées
`scratchpad/bills_parsed.json` — dict `{"0801": [...], "0814": [...], "0903": [...],
"0909": [...]}`, chaque ligne `{order, country, tracking, bundle, sub, tax, tot,
status}`. **2 697 lignes, plage #4814 → #7506.** Rien en dessous de #4814.

Préfixes de tracking : `YT…` = YunExpress · `LX…` = canal Luxembourg ·
`0608650…` et `DOFR…` = WanB Express.

### Journal de réexpéditions
`scratchpad/reexpeditions_fournisseur.txt` — 46 lignes, format TSV :
`#commande <TAB> motif <TAB> état <TAB> description`.

### Le relevé envoyé à Claire
Artefact : **https://claude.ai/code/artifact/dd4ed348-6a60-407e-a507-cf7691a1f6df**
Source : `scratchpad/art/deduction-statement.html`
Fichier autonome (envoyable / imprimable) : `scratchpad/art/NIVA_Invoice_Review_20260912.html`

---

## 7. État du code — ⚠️ NON À JOUR

`src/lib/supplierBills.ts` porte encore les chiffres du 10/09 :

| Constante | Valeur actuelle | Valeur correcte au 12/09 |
|---|---|---|
| `SUPPLIER_PENDING_CREDITS` (total) | 2 713,29 € | **351,90 €** |
| `Bill 20260909.disputedCents` | 271329 | **35190** |
| `SUPPLIER_CLAIMS_ON_PAID_BILLS` | 155,33 € | inchangé |
| `SUPPLIER_OPEN_CASES` | 330,04 € | inchangé |
| `SUPPLIER_UNDERBILLED_CENTS` | 5978 | inchangé |

`src/lib/__tests__/supplierBills.test.ts` fige les anciennes valeurs → **les tests
casseront**, c'est voulu, il faut les mettre à jour en même temps.

**Tant que ce n'est pas fait, la trésorerie du dashboard est fausse d'environ
2 360 €** (elle compte 2 713,29 € comme retenus alors que 2 206,06 € doivent sortir).

**Séparément** : la PR #112 (branche `claude/invoice-payment-verification-n033vp`)
n'est pas mergée. Les marqueurs en base sont à
`full_recompute_version = 2026-08-16-…-v15` et `full_resync_version = 2026-08-17-…-v13`
alors que le code attend les versions `2026-09-10-…`. **Les correctifs COGS du 10/09
(+1 247,17 € de net) ne sont donc pas déployés.**

> **Rappel structurel :** le ledger fournisseur est du **suivi de trésorerie
> uniquement**. Il ne doit JAMAIS servir de seconde comptabilisation du COGS — le
> COGS est calculé commande par commande dans `engine.ts`. Retenir ou créditer une
> facture ne déplace pas le net, seulement le cash.

---

## 8. Destinations non desservies — DOSSIER CLOS, ne pas le rouvrir

⚠️ **Erreur commise le 12/09 : ce dossier a été présenté à Badr comme un chantier
ouvert à ~8 000 €. C'est faux, il est réglé depuis le 15/07.** Badr et Adnane
avaient convenu avec Panda d'arrêter de vendre sur ces zones dès le début de la
collaboration, et le blocage a bien été appliqué. Ne pas redemander à Claire sa
« liste de destinations non desservies » : elle sait que c'est fermé depuis juillet,
et la question ferait passer NIVA pour quelqu'un qui ne suit pas son propre dossier.

Mesuré en base (commandes FR remboursées à 100 % sans aucun article physique
expédié, hors e-book, depuis le 01/07) :

| Destination | Cmd | Première | **Dernière** | € remboursés |
|---|---|---|---|---|
| Guadeloupe | 14 | 01/07 | **15/07** | 1 196,80 |
| Nouvelle-Calédonie | 11 | 01/07 | **15/07** | 1 039,84 |
| Martinique | 12 | 02/07 | **15/07** | 939,82 |
| Guyane | 2 | 13/07 | **15/07** | 249,95 |
| Mayotte, Polynésie, St-Pierre, St-Martin, Andorre, Guernesey, Lituanie | 7 | 01/07 | 14/07 | ~471 |

**Tout s'arrête au 15/07.** La perte est historique, concentrée sur les deux
premières semaines de la collaboration. Il n'y a rien à récupérer et rien à bloquer.

**Deux résidus seulement :**
- **Monaco** — 5 commandes, toutes remboursées sans colis, dernière le **15/08**,
  soit un mois après le blocage des autres zones. Aucune depuis, mais 5 commandes en
  deux mois et demi ne permettent pas de dire si c'est fermé ou s'il n'y a plus de
  trafic. À confirmer dans Shopify.
- **États-Unis** — les USA fonctionnent (10 commandes expédiées entre le 12/07 et le
  02/09, zéro remboursement). Mais **4 commandes du 12/09 — #7708, #7709, #7710,
  #7711 — ont été remboursées le jour même, sans expédition, pour ~210 €**, dont une
  à 30,00 € qui ne correspond à aucun bundle. Profil à vérifier (annulation
  volontaire ou test de carte). **Sans rapport avec le fournisseur.**

Autres chantiers ouverts, hors fournisseur :
- Champ **motif obligatoire sur chaque remboursement** (aujourd'hui beaucoup de
  remboursements sans note → impossible de reconstituer une cause a posteriori).
- 3 litiges Shopify en cours : #7205, #7076, #6798 (259,95 €).
- Avance packaging : 554 € comptabilisés contre 410 € réellement payés.

---

## 9. Checklist pour la prochaine facture

1. **Parser la facture** et recompter le total ligne à ligne (les en-têtes Panda
   sur-annoncent : 535 vs 533 le 14/08, 1157 vs 1153 le 03/09).
2. **Chercher les doublons de numéro de commande** — 2 trouvés sur 2 692 lignes
   (#4856, #6953).
3. **Vérifier les avances** : une nouvelle avance tombera, la marquer `appliedTo`
   sur la bonne facture pour ne pas la compter deux fois (erreur déjà commise avec
   les 5 613,02 €).
4. **Attendre 3-4 jours** avant de signaler des commandes « sans tracking ».
5. **Croiser** : ne signaler une commande que si **sa** facture n'a pas de tracking
   **ET** notre Shopify n'a aucune ligne physique `fulfilled`. Sur la seule facture
   du 03/09, 136 commandes étaient facturées sans tracking mais 134 étaient bien
   expédiées côté Shopify.
6. **Recompter le forfait size-up** : 0,10 € × nombre de polos de la plage, calculé
   sur ses lignes à elle.
7. **Vérifier `refunded_cents`** avant de déduire quoi que ce soit.
8. Les commandes à **adresse incomplète** seront désormais facturées puis créditées —
   les rapprocher à chaque facture, et corriger les adresses le jour où elle les
   signale (pas au moment de la facture).
