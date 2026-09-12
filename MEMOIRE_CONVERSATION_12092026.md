# Mémoire complète — audit factures Panda & négociation du 10 au 12/09/2026

**Destinataire : Salma.** Ce fichier est le contexte complet de la conversation qui a
mené à l'état actuel du dossier fournisseur. Il ne remplace pas
`MEMO_FOURNISSEUR.md` (qui est la fiche opérationnelle, à consulter en premier pour
« que dois-je faire ») — celui-ci raconte **comment on en est arrivé là**, ce qui a
été essayé, ce qui a échoué, et pourquoi.

> **Règle numéro un de ce dossier, apprise à la dure :** avant d'affirmer quoi que ce
> soit à Badr ou au fournisseur, aller chercher la donnée complète. Six affirmations
> fausses ont été produites en deux jours, toutes par extrapolation depuis une donnée
> partielle. Le détail est en section 6 — c'est la section la plus utile du fichier.

---

## 1. Le contexte business

**NIVA / Nivafit** — dropshipping de polos et vêtements homme grandes tailles.
Boutique Shopify principale **FR** (~97 % du volume), plus ES, UK, DE, CA.
Dashboard Next.js + Supabase dans ce repo (`KindredM-Numbers`).

**Deux associés :** Badr et Adnane. Le partage se calcule **jour par jour et par
boutique** (`src/lib/associates.ts`) : Badr entre le **14/07/2026 sur FR** et le
**20/06/2026 sur ES/UK/DE/CA**. Avant ces dates, 100 % Adnane. C'est pourquoi tout
correctif portant sur des commandes FR de début juillet tombe presque entièrement
côté Adnane.

**Fournisseur : Panda Dropshipping Ltd**, agent **Claire** (WhatsApp +852 8437 3841).
Relation démarrée le **01/07/2026**. Avant, un autre fournisseur — rien d'antérieur
n'est opposable à Panda.

---

## 2. D'où vient ce travail

Badr a demandé, en substance et à plusieurs reprises :

> « vérifie tous stp, que tout se concorde et qu'il y a pas de loupé stp, je veux pas
> d'erreur, je veux que **mon net affiché dans le dash soit vrmt réel** »

Puis, une fois le relevé fournisseur envoyé et contesté par Claire :

> « il faut du coup faire un récap et être honnête avec elle mais tout en défendant
> mes intérêts, **je ne suis pas une association** »

Et sur la forme du document :

> « il doit être clair et rapide à lire et comprendre, et comprendre les raisons de
> chaque order — **ne parle pas trop dessus psk sinon elle voit pas** »

**Ces trois phrases résument la mission** : exactitude d'abord, fermeté ensuite,
concision toujours.

---

## 3. Volet A — le correctif du net (terminé, en attente de merge)

### Le « COGS fantôme »

Le moteur calculait un COGS dès qu'une commande existait, **sans regarder si un colis
était parti**. Or Panda facture **le colis, pas la commande** : pas d'expédition = pas
de ligne de facture. Ce COGS-là n'a jamais été payé à personne.

Badr avait challengé la première version : *« je vois pas les 2000 € tu les sors d'où,
comment tu sais qu'on les a jamais payés ? c'est visible sur les factures ? »* — il
avait raison, la première liste était bâtie sur les **notes de remboursement** Shopify
et non sur le statut d'expédition. Refaite sur la bonne source :

- `status:cancelled` renvoie **83** commandes FR (et non 81 : #2213 et #2257 manquaient) ;
- 5 de plus sont remboursées à 100 % sans colis sans être marquées annulées :
  #2409, #2965, #3277, #5420, #6103.

→ **88 commandes, 2 266,84 €** de COGS et taxe UE mis à zéro. Liste figée dans
`src/lib/orderAdjustments.ts` (`NO_PARCEL_FR`), consommée par `aggregate.ts`.

**52 de ces 88 sont des commandes DOM-TOM / îles** (Guadeloupe, Martinique,
Nouvelle-Calédonie, Guyane, Mayotte, Polynésie, Monaco…), pour **1 416,04 €** — soit
62 % du correctif. Vérifié le 12/09 : les 52 sont bien toutes dans la liste, aucune
manquante.

**Limite connue, écrite dans le code :** « non expédié côté Shopify » ne prouve pas
à 100 % « non facturé ». Contre-exemple réel : **#5458** est `UNFULFILLED`, sans
tracking, et pourtant facturée 39,22 €. On a pu l'écarter parce qu'on détient cette
facture ; pour les 77 commandes antérieures à #4814 aucune facture n'existe de notre
côté. Ce qui rend la liste tenable : 83 des 88 sont **annulées** avec un `cancelReason`
Shopify, et un fournisseur ne produit pas une commande annulée avant expédition.
Risque résiduel chiffré : 1 965,27 €, ~100 % côté Adnane.

### Les autres correctifs du même lot

| Correctif | Assiette | Effet |
|---|---|---|
| COGS fantôme — 88 commandes | 88 cmd | **+2 266,84 €** |
| Pantalon FR au vrai prix (6,90 € au lieu de 9,84) | 43 cmd ×1 + 7 cmd ×3 | +167,58 € |
| Chemise Turenne → manches longues | ~75 pièces | +6,75 € |
| Chargebacks perdus jamais déduits du CA | 5 cmd | −383,91 € |
| Packaging 0,35 €/cmd depuis le **14/08** | 1 599 cmd | −559,65 € |
| Forfait size-up 0,10 €/polo depuis le **03/09** | 1 235 polos | −123,50 € |
| Packing colis primaire +4 € depuis le 02/08 | 19 cmd | −76,00 € |
| Carte de remerciement 0,03 €/cmd depuis le **12/08** | 1 698 cmd | −50,94 € |
| **TOTAL** | | **+1 247,17 €** |

Dates confirmées par Badr lui-même (« donc oui c'est le 12 » pour la carte).

**Réparti au jour et par boutique, l'effet est asymétrique : Adnane +1 449,11 €,
Badr −208,69 €.** Le COGS fantôme est presque entièrement sur des commandes FR
d'avant le 14/07, alors que les nouveaux coûts par commande sont récents donc
partagés.

**Le rattrapage est ponctuel, la charge ne l'est pas :** packaging + size-up pèsent
≈ **1 000 €/mois** désormais, soit ~0,67 € de marge en moins par commande.

### ⚠️ Rien de tout ça n'est déployé

`app_state` en base porte encore :
```
full_recompute_version = 2026-08-16-frais-reels-juin-0413-v15
full_resync_version    = 2026-08-17-mapping-debardeur-chemise-mc-v13
```
alors que le code attend `2026-09-10-cogs-sans-colis-88-commandes-v17` et
`2026-09-10-packaging-14-08-carte-12-08-v15`. **La PR #112 n'est pas mergée : le
dashboard affiche encore l'ancien net.** Au premier passage après déploiement, le
resync complet part seul, puis le recompute.

**L'alerte de trésorerie va s'allumer et ce n'est PAS une régression.** L'attendu en
banque monte de 1 833,35 €, le seuil d'inexpliqué est à 1 000 € et `PRE_LLC_RESIDUAL`
est plafonné à 1 850 €. L'écart **ne se crée pas, il se révèle** : le COGS fantôme le
masquait depuis quatre mois. Badr a posé exactement cette question (« est-ce qu'on
aura un trou dans les comptes comptables ») — la réponse est oui, et c'est sain.

---

## 4. Volet B — la négociation avec Claire, heure par heure

### Point de départ, 10/09

Relevé envoyé réclamant **3 198,66 €**, dont 2 713,29 € retenus sur la facture
20260909 (8 326,31 € demandés, 5 613,02 € virés le 10/09).

### Ce qui s'est passé le 12/09

Claire a contesté **poste par poste, avec des preuves**. Résultat : **six
réclamations retirées, dont cinq parce que nous avions tort.**

| # | Poste | Départ | Fin | Pourquoi |
|---|---|---|---|---|
| 1 | Prix de vente sur commandes annulées | 842,24 € | **0** | Rembourser 89,99 € pour une marchandise jamais payée n'est pas une perte. Elle a raison sur le principe. |
| 2 | Annulations en quelques heures | (inclus) | **0** | #6327 annulée 7 h après commande, #3439 2 h, #3290 7 h. Rien à voir avec l'expédition. |
| 3 | 47 commandes « sans tracking » | 995,05 € | **54,02 €** | 45 commandées le 08/09, **toutes lignes physiques expédiées le 10/09** — le lendemain de la facture. Le relevé avait été pris trop tôt. |
| 4 | Prorata du forfait size-up | 47,41 € | **0** | Le forfait est à 0,10 €/pièce sur toute la plage, pas par réexpédition. Et les « 39 réexpéditions » invoquées étaient **4**. |
| 5 | Chargebacks #3285 / #4368 | 253,21 € | **0** | Les deux colis **livrés**. Le « délai de 43 jours » venait d'une colonne mal lue. #4368 : commandée 13/07, livrée à Arras 31/07 = **18 jours**. |
| 6 | #2870 | 62,24 € | **0** | Notre propre journal montre une réexpédition **déjà partie** (YT2621500711304158, statut « Shipped ») et le client n'a jamais été remboursé. |

### Ce que Claire a concédé, sans qu'on insiste

- **105,84 €** — #5455, #5842, #6945, #7023, adresses incomplètes : retirées de la
  facture, re-facturées au départ du colis.
- **54,02 €** — #7173, #7484, même traitement.
- **4,40 €** — elle a **refait le calcul elle-même** et confirmé : *« oh you get it
  with 6119 and there is 44 pcs difference yes ? so you take 4.4 euro out from the
  amount am i right ? »*
- Elle avait déjà retiré spontanément **168,40 €** de doublons sur #6953.

**Le mécanisme est net : chacune de ses concessions est arrivée juste après qu'on lui
a donné raison sur un point.** Un relevé qui se corrige contre lui-même n'est plus
discuté sur le reste. C'est la seule tactique qui a fonctionné.

### Son argumentaire, et ce qu'il vaut

| Elle dit | Verdict |
|---|---|
| « we always choose YUN FIRST unless they can't ship we switch to other shipping line » | **Vrai, et ça condamne #5458** : le basculement n'a pas eu lieu alors qu'il a eu lieu sur #5342, même facture. |
| « even if it's canceled because we can't ship, do we have to cover your selling price ? » | **Elle a raison.** Retiré. |
| « we haven't guaranteed we can ship to all those places » | **Vraie pour les îles lointaines**, fausse pour ES/BE/LU (voir tableau section 5). |
| « for many remote islands… your partner is very clear about it » | **Vrai** — Adnane avait convenu d'arrêter d'y vendre, et le blocage a été appliqué le **15/07**. |
| « my colleague has informed you in the group, she checks everyday » | **Vrai, preuves à l'appui.** Le reproche qu'on lui avait fait était injustifié et a été retiré par écrit. |
| « we never bill reshipped packages » | **À conserver précieusement** : tout article réexpédié apparaissant sur une facture est contestable de droit. |

---

## 5. État financier final au 12/09 au soir

### Le compte

| | € |
|---|---|
| Facture 20260909 demandée | 8 326,31 |
| Corrections sur cette facture (A1 + A2) | − 58,42 |
| **Montant correct** | **8 267,89** |
| Déjà viré le 10/09 | − 5 613,02 |
| Avoirs sur factures soldées (A3) | − 155,33 |
| Compensation (partie B) | − 293,48 |
| **À VIRER** | **2 206,06** |

**Retenue justifiée : 351,90 €** sur les 2 713,29 € retenus.
**Total réclamé : 775,03 €** (contre 3 198,66 € au départ).

### Le détail

| | € | État |
|---|---|---|
| A1 · #7173, #7484 non expédiées | 54,02 | ✅ accordé |
| A2 · comptage size-up (6 119 vs 6 163 polos) | 4,40 | ✅ accordé |
| A3 · #5455, #5842, #6945, #7023 (adresses) | 105,84 | ✅ accordé |
| A3 · **#5458** | 39,22 | ⏳ la meilleure ligne du dossier |
| A3 · **#4856** | 10,27 | ⏳ en discussion |
| B1 · chargebacks | 0,00 | ❌ retiré par nous |
| B2 · pub brûlée 5 × 35 € | 175,00 | ⏳ elle conteste |
| B3 · #4079, #5649 | 118,48 | ⏳ jamais abordé avec elle |
| Ouvert · #4486 | 267,80 | ⏳ elle a admis la faute |
| En sa faveur, signalé | −59,78 | sous-facturation, à re-facturer |

### #5458 — la ligne à ne jamais lâcher

Sur **sa propre facture 20260801** :

| Cmd | Pays | Bundle | Tracking | € |
|---|---|---|---|---|
| **#5342** | LU | POLOx4, CALECONx1 | **LX065511839NL** | 39,22 |
| **#5458** | LU | POLOx4, CALECONx1 | **—** | 39,22 |

Même facture, même pays, même bundle, même prix. L'une part, l'autre a un tiret écrit
par elle et est facturée quand même. Client remboursé 89,99 € à 100 %.
Sur les 4 factures : **Luxembourg = 21 lignes, 19 avec tracking.**

### #4856 — l'argument reformulé

Elle a envoyé la preuve de livraison du tracking 06086507184076. **Ça confirme la
réclamation au lieu de la casser** : la commande Shopify contient **3 articles
(2 polos + 1 short)**, sa ligne 1 les couvre tous les trois, sa ligne 2 est un
**4ᵉ article jamais commandé**. Formule à garder : *« montre-moi un 3ᵉ polo dans sa
commande et je paie le jour même »*.

### B2 — les 5 commandes de pub, avec leur preuve

Coût d'acquisition mesuré : **35,05 € juillet · 34,55 € août · 35,43 € septembre**
(dépense Meta ÷ commandes). On applique 35,00 €.

| Cmd | Pays | Commandée | Lignes physiques expédiées | Remboursée |
|---|---|---|---|---|
| #2850 | ES | 01/07 | **0 / 4** | 89,99 € le **21/07** |
| #3618 | BE | 07/07 | **0 / 4** | 89,99 € le **21/07** |
| #4458 | LU | 14/07 | **0 / 4** | 89,99 € le **21/07** |
| #4615 | ES | 16/07 | **0 / 1** | 59,98 € le **21/07** |
| #5458 | LU | 01/08 | **0 / 6** | 89,99 € le 05/08 |

Les quatre premières soldées **le même jour** — un nettoyage, pas quatre clients qui
changent d'avis.

Contre son « on ne dessert pas partout », compté dans **ses** factures :

| Pays | Lignes facturées | Avec tracking |
|---|---|---|
| Belgique | 405 | 371 |
| Luxembourg | 21 | 19 |
| Espagne | 5 | 5 |

**Faiblesse à connaître :** ces 4 commandes sont antérieures à #4814, donc absentes
des factures détenues — impossible de prouver par facture qu'elle ne les a pas
expédiées. C'est pour ça qu'on ne réclame **que la pub**, jamais la marchandise.
Deuxième faiblesse : elles datent du 1er au 16 juillet, soit exactement « the
beginning of our cooperation » dont elle parle. Si elle fait le lien, les 175 €
tombent — ne pas lui tendre la perche.

---

## 6. ⚠️ LES SIX ERREURS — à lire avant toute nouvelle affirmation

Toutes ont la même racine : **conclure sur une donnée partielle au lieu d'aller
chercher la donnée complète.** Elles ont coûté environ 1 380 € de réclamations
effondrées en une journée, et surtout de la crédibilité.

1. **`orders.updated_at_utc` n'est pas une date de livraison ni d'annulation.**
   C'est la dernière modification, quelle qu'elle soit — souvent l'enregistrement
   d'un chargeback. A produit le faux « délai de 43 jours » sur #4368, qui a été
   livrée en 18 jours.
   *Exception acceptable :* commande **0 ligne physique expédiée + remboursée à
   100 %** → la dernière modification EST le remboursement.

2. **« Pas de tracking sur sa facture » ≠ « jamais expédié ».** Elle facture souvent
   le jour de la commande, le tracking arrive le lendemain. **Attendre 3-4 jours.**

3. **L'e-book fausse tout comptage de lignes expédiées.** Produit numérique
   auto-`fulfilled`. Une commande « 1 ligne sur 5 expédiée » peut n'avoir expédié
   **aucun article physique**. Toujours l'exclure :
   `li->>'name' not ilike '%E-Book%'`.

4. **Un total historique n'est pas un problème actuel.** Les pertes DOM-TOM ont été
   présentées à Badr comme « 8 000 € à aller chercher » alors que la dernière
   occurrence date du 15/07 et que le blocage était fait. **`max(day)` avant `sum()`.**

5. **Ne pas proposer une action sans demander ce qui a déjà été décidé.** L'arrêt des
   ventes DOM-TOM avait été convenu avec Adnane — l'information n'est dans aucune
   table, seulement dans la tête de Badr.

6. **Lire NOS propres journaux avant de réclamer.** #2870 a été présentée comme « un
   t-shirt noir livré à la place d'un polo et d'un short, correction promise le 26/08
   jamais faite ». Les trois fichiers internes disent autre chose : **polo taché +
   erreur de taille sur les shorts, réexpédition déjà partie sous
   YT2621500711304158, statut « Shipped »**. Aucune source ne mentionne de promesse
   du 26/08.

**Règles de fond, à ne pas enfreindre :**

7. **Ne jamais réclamer une perte non réalisée.** `refunded_cents = 0` → le client n'a
   rien récupéré, la perte n'existe pas → section « ouvert, non réclamé ».

8. **Ne pas réclamer le prix de vente.** Acté avec Claire.

9. **Recompter depuis SES documents, pas les nôtres.** Le 6 119 vs 6 163 ne vaut que
   parce qu'il est calculé sur ses lignes de facture à elle.

10. **Signaler ce qui est en sa faveur.** Les 59,78 € de sous-facturation sur #5535,
    #5576, #5642 sont signalés et non encaissés. C'est ce qui rend le reste crédible.

---

## 7. Sources et requêtes

### Supabase — projet `eyfbkxdtxdoktscjaqsg`

```sql
-- état réel d'une commande (articles PHYSIQUES expédiés)
select o.order_name, o.day, o.shipping_country,
       o.total_cents/100.0 as paye, o.refunded_cents/100.0 as rembourse,
       li->>'name' as article,
       li->>'fulfillment_status' as statut,
       li->>'fulfillable_quantity' as reste
from orders o, jsonb_array_elements(o.line_items) li
where o.store='FR' and o.order_name = '#XXXX';

-- commandes remboursées à 100 % sans aucun article physique parti
select o.order_name, o.day, o.shipping_country
from orders o
where o.store='FR' and o.refunded_cents >= o.total_cents
  and (select count(*) from jsonb_array_elements(o.line_items) li
        where li->>'fulfillment_status'='fulfilled'
          and li->>'name' not ilike '%E-Book%') = 0;
```

Table `orders` : `day`, `shipping_country`, `total_cents`, `refunded_cents`,
`cogs_product_cents`, `cogs_upsells_cents`, `tax_eu_cents`, `line_items` (jsonb),
`fee_*`. **La table `chargebacks` est vide** — passer par Shopify.

### Fichiers de travail (scratchpad de session, à recopier si besoin)

| Fichier | Contenu |
|---|---|
| `bills_parsed.json` | Les 4 factures parsées, **2 697 lignes, #4814 → #7506** |
| `reexpeditions_fournisseur.txt` | Journal de réexpéditions, 46 lignes, TSV |
| `tracker.txt` | Tracker de réexpédition complet, avec notes client et trackings |
| `Litiges_et_fautes_fournisseur.xlsx` | Litiges classés par responsabilité |
| `Reexpeditions_responsabilite.xlsx` | Réexpéditions avec responsabilité et facture concernée |
| `art/deduction-statement.html` | Source du relevé envoyé à Claire |

Préfixes de tracking : `YT…` YunExpress · `LX…` canal Luxembourg ·
`0608650…` et `DOFR…` WanB Express.

**Répartition des transporteurs sur les 4 factures :** France = 1 703 YunExpress,
156 sans tracking, 0 WanB. WanB existe (27 lignes) mais sur la Suisse.

### Le relevé envoyé

Artefact : **https://claude.ai/code/artifact/dd4ed348-6a60-407e-a507-cf7691a1f6df**

---

## 8. Code — ce qui est à jour et ce qui ne l'est pas

| Fichier | État |
|---|---|
| `src/lib/orderAdjustments.ts` | ✅ à jour — `NO_PARCEL_FR` (88), `LOST_CHARGEBACKS_FR` (5) |
| `src/lib/engine.ts` | ✅ `PACKAGING_START_DATE = 2026-08-14`, `THANKS_CARD_START_DATE = 2026-08-12` |
| `src/lib/aggregate.ts` | ✅ applique `noParcelSent` et les chargebacks |
| `src/lib/supplierBills.ts` | ❌ **porte encore 2 713,29 € au lieu de 351,90 €** |
| `src/lib/__tests__/supplierBills.test.ts` | ❌ fige les anciennes valeurs, **cassera** |
| `src/components/views/ExpenseBoard.tsx` | ❌ affiche les 3 blocs aux anciens montants |

**Badr n'a pas donné son « go » pour figer les nouveaux chiffres.** Ne rien modifier
dans `supplierBills.ts` sans sa validation explicite.

> **Rappel structurel :** le ledger fournisseur est du **suivi de trésorerie
> uniquement**. Il ne doit JAMAIS servir de seconde comptabilisation du COGS — celui-ci
> est calculé commande par commande dans `engine.ts`. Retenir ou créditer une facture
> **ne déplace pas le net**, seulement le cash. Badr a posé la question directement
> (« donc on a rien gagné ? ») : sur le net, la négociation ne change rien ; le gain
> de +1 247,17 € vient du correctif COGS, pas de la négociation.

---

## 9. Ce qui reste ouvert

### Chez le fournisseur
- **#5458** (39,22 €) et **#4856** (10,27 €) — arguments prêts, voir section 5.
- **B2** (175,00 €) et **B3** (118,48 €) — B3 n'a jamais été présenté à Claire.
- **#4486** (267,80 €) — elle a admis *« first package is lost which is our
  responsibility so we reshipped and it's in transit »*. **Aucune trace chez nous :
  pas de second tracking, aucun mouvement sur la commande depuis le 15/07.**
  Demander le tracking de la réexpédition.
- **#2870** — plus d'argent en jeu. Demander seulement si YT2621500711304158 a été
  livré, pour clore avec le client.
- **Sous-facturation de 59,78 €** en sa faveur, signalée, à re-facturer par elle.

### Chez NIVA
- **Virer 2 206,06 €.**
- **Envoyer les adresses complètes de #7173 et #7484** — deux clients bloqués, dont un
  depuis le 03/09.
- **Merger la PR #112**, puis lancer resync + recompute.
- **4 commandes US du 12/09** — #7708, #7709, #7710, #7711, ~210 € remboursés le jour
  même sans expédition, dont une à 30,00 € qui ne correspond à aucun bundle. Les 10
  commandes US précédentes sont toutes parties normalement. **Profil à vérifier :
  annulation volontaire de Badr, ou test de carte.** Sans rapport avec le fournisseur.
- **Monaco** — dernière commande le 15/08, un mois après le blocage des autres zones.
  Vérifier dans Shopify si la zone est fermée. Enjeu faible (5 commandes en 2,5 mois).
- **Champ motif obligatoire sur chaque remboursement** — beaucoup de remboursements
  sans note, impossible de reconstituer une cause a posteriori.
- **3 litiges Shopify en cours** : #7205, #7076, #6798 (259,95 €).
- **Avance packaging** : 554 € comptabilisés contre 410 € réellement payés.

### Restes connus, chiffrés, volontairement non corrigés
- **9 commandes ES/UK/DE remboursées à 100 %, 183,47 € de COGS** : même profil que les
  88, mais la connexion Shopify pointe la boutique FR — non vérifiable, donc non
  retiré.
- **172 commandes du 14→18/06 au repli 3 %** (réel juin : 2,26 %) → frais surestimés
  d'environ 74 €. Le net penche du côté pessimiste, c'est volontaire.
- **5 sur-remboursements, 2,58 €** (écarts de change).
- L'effet `current_quantity` annoncé à « 82 commandes, 254 unités » est **marqué non
  vérifié** : deux mesures le contredisent (5 unités, puis 8).

---

## 10. Checklist pour la prochaine facture

1. **Parser et recompter le total ligne à ligne.** Les en-têtes Panda sur-annoncent
   (535 vs 533 le 14/08, 1157 vs 1153 le 03/09).
2. **Chercher les doublons de numéro de commande.** 2 trouvés sur 2 692 lignes.
3. **Vérifier les avances.** Une nouvelle avance tombera ; la marquer `appliedTo` sur
   la bonne facture. L'erreur a déjà été commise avec les 5 613,02 € — le montant
   vivait deux fois et la dette fournisseur était sous-estimée d'autant.
4. **Attendre 3-4 jours** avant de signaler des commandes « sans tracking ».
5. **Croiser les deux côtés.** Ne signaler que si sa facture n'a pas de tracking **ET**
   notre Shopify n'a aucune ligne physique `fulfilled`. Sur la seule facture du 03/09,
   136 commandes étaient sans tracking mais 134 bien expédiées.
6. **Recompter le forfait size-up** : 0,10 € × nombre de polos de la plage, calculé sur
   ses lignes à elle.
7. **Vérifier `refunded_cents`** avant de déduire quoi que ce soit.
8. **Rapprocher les commandes à adresse incomplète** — elles seront désormais facturées
   puis créditées. Corriger les adresses **le jour** où elle les signale, pas au moment
   de la facture.

---

## 11. Comment parler à Claire

- **Elle produit des preuves quand on lui en demande.** Trackings, captures de son
  système, relevés. Toujours demander avant d'affirmer.
- **Elle cède quand on lui donne raison d'abord.** Trois concessions le 12/09, chacune
  juste après une correction de notre part.
- **Elle lit vite, sur WhatsApp.** Messages courts, un point par paragraphe, les
  numéros de commande en clair. Badr l'a dit : *« ne parle pas trop dessus psk sinon
  elle voit pas »*.
- **Ne jamais l'accuser sans avoir vérifié nos propres traces d'abord.** Ça s'est
  retourné deux fois — sur les adresses signalées par sa collègue, et sur #2870.
- **Le français n'est pas sa langue, l'anglais non plus totalement.** Écrire simple.
- **Ce qui reste à obtenir d'elle n'est pas de l'argent, c'est du process :** facturer
  le colis au départ et non la commande à l'arrivée. C'est la cause unique de tous les
  litiges A1 et A3 de ce dossier.
