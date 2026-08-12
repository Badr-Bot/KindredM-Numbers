# Plan d'automatisation & de scaling — Niva / Kindred

> Rédigé le 12/08/2026 après lecture de : la mémoire NIVA exportée, les 2 rapports
> de deep research Gemini (« Automatisation Flux Ecommerce Shopify » et
> « Automatisation Workflow Ecommerce Complet »), et **l'état réel du code** de ce
> dépôt (`MEMO.md`, `STATUT.md`, `src/lib/*`, migrations Supabase).
>
> Règle appliquée partout : la vérité, c'est `MEMO.md` + le code, pas la mémoire
> exportée (qui est périmée sur plusieurs points, voir §1).

---

## 0. Verdict en 30 secondes

Tu n'as **pas** un problème d'outils. Tu as déjà, en prod, plus d'infrastructure
que 95 % des dropshippers : P&L au centime, frais Shopify lus réellement, ROAS
réel par UTM, protocole de scaling formalisé, routine 23h05 qui produit des
verdicts, journal d'événements, tracé entre associés.

Ce qui te limite aujourd'hui, dans l'ordre :

1. **Tu ne sais pas *pourquoi* une créa gagne.** Tu mesures la performance
   (onglet Créas, hold rate, hit rate) mais aucune donnée *structurelle* n'est
   attachée à une créa (hook, angle, format, offre, acteur). Donc chaque nouvelle
   vague de 5 créas repart de l'intuition. C'est le levier n°1, et de loin.
2. **Toute ton attribution repose sur des noms de campagnes tapés à la main.**
   `PRODTEST`, `LANCASTER`, `NIRA`, mapping marché, exclusions — une faute de
   frappe d'Adnane ou d'un media buyer et le dashboard ment sans prévenir.
3. **Le SAV te coûte des nuits entières** (~400 fils, brouillons manuels,
   doublons Gmail impossibles à nettoyer).
4. **Un seul canal, un seul compte pub.** L'incident de juillet (PUB 85 + PUB 9
   bannies, dont des winneuses) a fait chuter le CA d'un coup. Ce risque n'est
   traité nulle part, ni dans ta mémoire, ni dans les deux rapports Gemini.
5. **Quasi zéro client récurrent** (22/23 premiers achats). Tu paies Meta pour
   chaque euro de CA. C'est le CA le moins cher du business et il n'est pas
   exploité.

Les deux rapports Gemini sont corrects sur le principe et **majoritairement
inadaptés à ton cas** : ils décrivent comment construire, de zéro, ce que tu as
déjà. Détail du tri en §2.

---

## 1. Écarts entre ta mémoire exportée et la réalité du repo

À corriger dans ta mémoire, sinon tu vas piloter sur des chiffres faux :

| Sujet | Mémoire exportée (périmée) | Réalité (`MEMO.md` / code) |
|---|---|---|
| Frais | 9,5 % du CA (5,5 TVA + 3 Shopify + 1 autres) | TVA **n'est pas un coût** (provisionnée à part). Frais Shopify **lus réellement** par commande (`shopifyFees.ts`) ≈ **6,5 %** avant le passage Advanced, + 1 % autres. L'ancien 3 % cachait ~4 000 €/mois. |
| Taxe UE | 3 €/commande, **ES et DE uniquement** | **3 € par colis, toute destination UE** (GB/CH/CA/US = 0). Confirmé par facture fournisseur du 01/08. |
| Poids marchés | 4 marchés équilibrés | **FR ≈ 90 % du volume.** ES/UK/DE encaissent sans porter de pub → leur net par pays est indicatif, pas fiable. |
| Produits | Polo seul + upsells | **Gilet lancé le 27/07** (« Le Gilet Sully »), 2ᵉ produit principal, campagne CBO-LANCASTER dédiée, sa propre landing, ses propres grilles COGS et seuils (BE 1,43× vs 1,62× Polo). |
| Prix | 59,99 €/2 pcs (ES) | Polo : 2 pcs **59,98 €** · 4 pcs **89,99 €**. Gilet : 49,98 / 79,98 / 104,97 €. |
| Seuils | BE 1,65× · cible 20 % | Cible passée à **15 % net** (aligné Master 04/08). Polo BE 1,62× / cible 2,13× · Gilet BE 1,43× / cible 1,98×. |
| Naming produit | Nivafit, polos | Rebranding « rues parisiennes » (05/08) : Marceau, Sully, Turenne, Rivoli, Cassini. |
| Charges | non suivies | **≈ 4 245 €/mois ≈ 50 700 €/an**, tracées dans `subscriptions.ts`, réparties 50/50 depuis le 14/07. |

Deux dettes techniques connues, non résolues, qui bloquent des chiffres :

- **Scope `read_all_orders` non accordé** → Shopify ne renvoie jamais de commande
  de plus de 60 jours, silencieusement. L'historique 21/05→03/06 est comblé à la
  main (8 338 € répartis à plat, COGS non calculés → net de ces 14 jours
  surestimé). **Toi seul peux accorder ce scope** (Shopify Admin → app perso →
  API access scopes). 10 minutes, ça répare l'historique tout seul.
- **Spend Meta avant le 04/06** : ~2 188 € en mars, ~1 700 € début avril, spend
  quasi continu jusqu'au 21/05, jamais intégré faute de savoir ce que c'est. À
  trancher (c'était quoi ? à compter depuis quand ?).

---

## 2. Tri des deux rapports Gemini : ce qui sert, ce qui est du bruit

### Ce qu'il faut prendre

| Idée | Pourquoi c'est bon pour toi |
|---|---|
| **Naming convention enforcement** (l'idée de `konquest-meta-ads-mcp`) | La seule idée réellement critique des deux rapports pour ton cas. Tout Weft attribue par **nom de campagne**. Un validateur de nommage = de la précision comptable, pas du confort. |
| **Taxonomie créative à 2 couches** (structurelle + performance) | C'est exactement ce qui manque à l'onglet Créas. Le rapport a raison : sans couche structurelle, ton tracker mesure sans expliquer. |
| **Dissocier extraction et analyse** (à cause des rate limits Meta) | Déjà fait chez toi, mais mieux que ce qu'ils proposent : tu as Supabase, pas Google Sheets. Ne régresse pas vers Sheets. |
| **Campagnes créées en statut PAUSED + validation humaine** | Aligné avec ta règle Master (« recommande, n'exécute jamais »). À garder comme loi. |
| **Shopify Dev MCP + `liquid-skills`** pour le thème | Tu l'avais déjà prévu pour la refonte landing. Confirmé : c'est la bonne voie, et c'est gratuit. |
| **Idempotence sur les webhooks Shopify** (`X-Shopify-Webhook-Id` dédupliqué) | Pertinent le jour où tu passes du polling aux webhooks. Note-le, ne le fais pas maintenant. |

### Ce qu'il faut ignorer

| Idée | Pourquoi non |
|---|---|
| **n8n auto-hébergé comme « système nerveux »** | Tu as déjà Vercel cron + `/api/sync` + routines Claude Code déclenchées par trigger. Ajouter n8n = un serveur de plus, des secrets dupliqués, une deuxième source de vérité, et un truc que tu ne peux pas déboguer depuis ton téléphone. **Zéro gain, dette garantie.** |
| **CrewAI / OpenClaw / flottes multi-agents** | Complexité d'orchestration pour un opérateur seul. Ton besoin réel = 4-5 tâches planifiées déterministes, pas des agents qui se parlent. |
| **Scraping TikTok Creative Center pour trouver un produit gagnant** | Tu n'as pas un problème de sourcing : tu as deux produits qui marchent et un avatar validé. Chercher le prochain « pantalon cargo Y2K » est une distraction — et NIRA (−430 €) vient de te le prouver. |
| **AutoDS / DSers / Dropified** | Tu as Panda Dropshipping en DDP avec des grilles COGS négociées. Ces outils te feraient perdre tes prix. |
| **Migrer l'analyse vers Google Sheets** | Régression. Tu as un moteur testé au centime avec des fixtures. |
| **Le tableau « j'ai testé 10 000 pubs Meta »** | Source Reddit, non reproductible, et **il contredit tes contraintes** (il recommande musique + voix off ; ta règle est *pas de musique*). À traiter comme des **hypothèses à tester chez toi**, jamais comme des faits. C'est précisément ce que le chantier n°1 permet de faire. |
| **Agentic Commerce Protocol / ACP / UCP** | Trop tôt. Rien à en tirer sur un dropshipping mono-produit en 2026. |

---

## 3. Les chantiers, classés par ROI

Notation : **Impact** = € ou heures gagnées · **Effort** = temps de build ·
**Qui** = ce que tu dois faire toi (le reste est automatisable par Claude Code).

---

### P0 — À faire dans les 2 semaines

#### 1. Taxonomie créa + boucle de patterns 🥇
**Impact : très élevé (c'est le levier de croissance n°1) · Effort : moyen (2-3 sessions)**

Le problème : `meta_ad_insights` stocke déjà `ad_name`, le hold rate vidéo
(p50/p75/p100) et le texte de la créa (`meta_ad_creatives.body`). Tu as la
performance, pas la cause.

Ce qu'on construit :

1. **Une convention de nommage d'ad obligatoire**, parsable, par exemple :
   `[PRODUIT]-[ANGLE]-[HOOK]-[FORMAT]-[RATIO]-[MONTEUR]-[vN]`
   → `GILET-AGE-QUESTION-UGC-9x16-JEREMY-v3`
   Angles déjà identifiés à encoder : `AGE` (« je n'ai plus l'âge »),
   `MINCE` (paraître 5 kg plus mince), `DURA` (anti-rétrécissement),
   `POV-COMPAGNE`, `HABILLE` (Gilet sur chemise).
2. **Une table `creative_tags`** (Supabase) alimentée par parsing du `ad_name`,
   avec fallback manuel pour les vieilles créas.
3. **Une vue « Patterns » dans l'onglet Créas** qui agrège *par dimension*, pas
   par créa : ROAS moyen / hit rate / hold rate par **angle**, par **hook**, par
   **format**, par **monteur**, par **produit**. Avec un seuil de significativité
   (n ≥ 3 créas et ≥ 100 € de spend cumulé, sinon on affiche « données
   insuffisantes » — jamais un chiffre non significatif).
4. **Un brief automatique** dans le rapport 23h05 : « les 3 angles à produire
   cette semaine » = angles au-dessus de la cible et sous-alimentés en volume de
   créas.

Pourquoi c'est le n°1 : tu lances des vagues de 5 créas tous les 2-3 jours. Sans
ça, tu répètes des paris. Avec ça, chaque vague est une expérience qui enrichit
un modèle. C'est aussi le seul moyen honnête de tester le tableau Reddit
(musique, durée 6-10 s, mouvement en frame 1) **sur ton avatar à toi**.

**Ce que tu dois faire toi** : imposer le nommage à Adnane, Jeremy, Seif et au
monteur. Non négociable — sans discipline de nommage, le chantier ne vaut rien.

---

#### 2. Validateur de nommage & sentinelle d'intégrité 🥈
**Impact : élevé (protège tous tes chiffres) · Effort : faible (1 session)**

Aujourd'hui, ces mots-clés pilotent silencieusement ta compta : `PRODTEST`,
`LANCASTER`, `NIRA`, `ESP/GE/FR/UK/CANADA/EUROPE/AUS/WORLDWIDE/ANG`, et le
défaut « sinon FR ». Une campagne mal nommée = du spend imputé au mauvais
produit ou au mauvais marché, sans aucune alerte.

Ce qu'on construit : un contrôle quotidien (branché sur la routine 23h05) qui
alerte sur Slack quand :
- une campagne active ne matche **aucun** marqueur de marché (donc tombe sur FR
  par défaut) ;
- une campagne apparaît avec un nom jamais vu (nouveau produit non déclaré) ;
- un `ad_name` ne respecte pas la convention du chantier n°1 ;
- un titre produit Shopify n'est pas dans `products_map` (le piège du Caleçon
  jamais mappé, qui a surestimé le net pendant 2 mois, et du rebranding
  « rues parisiennes » qui sort les ventes du comptage à chaque renommage) ;
- l'identité `net = CA − spend − COGS − taxe − frais` dérive sur un jour.

C'est peu de code et ça t'évite de re-découvrir une erreur 2 mois plus tard.

---

#### 3. SAV : industrialiser la boucle de brouillons 🥉
**Impact : très élevé en heures (des nuits entières) · Effort : moyen**

Le vrai problème n'est pas de rédiger les réponses — c'est que le processus est
**sans mémoire**. D'où : brouillons dupliqués, brouillons périmés, fils scindés
par Gmail avec un seul des deux porteur du brouillon, et aucun `delete_draft`
disponible pour nettoyer.

Ce qu'on construit :

1. **Un registre d'état dans Supabase** : `sav_threads(thread_id, customer_email,
   order_id, intent, state, draft_id, last_seen_at, resolved_at)`. C'est LA pièce
   manquante — elle résout les doublons structurellement, parce qu'on ne
   redemande jamais à Gmail « est-ce que j'ai déjà répondu ».
2. **Une clé de dédoublonnage par email client**, pas par `thread_id` — c'est ce
   qui règle les fils scindés (florence.ravazzoli, marguerite.plante).
3. **Une routine matinale** : nouveaux fils → classification d'intention
   (tracking / taille / retour / adresse / remboursement / autre) → lookup
   Shopify (les 4 boutiques) + ParcelPanel → brouillon rédigé → **digest Slack
   groupé** avec un lien par fil.
4. **Un seul cas passe en envoi automatique** : « où est ma commande » quand le
   tracking existe et montre un colis en transit. Aucune ambiguïté, aucun risque
   commercial. Tout le reste reste en brouillon validé.
5. **Le retard de ~340 fils du Label_2** est un rattrapage ponctuel : une session
   dédiée qui l'avale en batch une fois le registre en place (sinon on recrée des
   doublons).

**Ce que tu dois faire toi** : décider si le SAV reste sur Gmail. À ton volume,
Gmail est déjà le facteur limitant (pas de suppression de brouillon, fils
scindés, pas de statut). Un helpdesk (Crisp, Gorgias) réglerait la moitié des
anomalies par construction — mais c'est 50-300 €/mois de plus sur des charges
déjà à 4 245 €/mois. Mon avis : **reste sur Gmail + registre Supabase** tant que
tu es à ce volume, et rebascule si tu doubles.

---

#### 4. Résilience du compte Meta ⚠️
**Impact : existentiel · Effort : faible à moyen · Zéro ligne de code pour la moitié**

L'incident de juillet (PUB 85 et PUB 9 bannies, dont des winneuses, chute
soudaine du CA) est ton plus gros risque non traité. Tu vends un produit ciblant
les hommes de forte corpulence, avec des angles « paraître 5 kg plus mince » et
un VSL à claims corporels — tu es structurellement exposé à la policy Meta sur
l'image corporelle.

Ce qu'il faut mettre en place :

1. **Un pre-flight policy** sur les scripts et copies avant production : un
   contrôle automatique qui flague les formulations à risque (claims corporels,
   avant/après, « perdez du poids », ciblage implicite d'un défaut physique) et
   propose une reformulation. Ça se branche sur le pipeline créa, coût quasi nul.
2. **Un BM + compte pub de secours** déjà chauffés (pixel installé, quelques
   euros de spend, historique), pas créés en panique le jour du ban.
3. **Une bibliothèque d'assets ré-uploadables** : chaque créa qui tourne, avec
   son fichier source, son nom canonique et ses métadonnées, sur Drive. Aujourd'hui
   si un compte saute, tu perds l'accès aux créas *et* à leur historique.
4. **Une alerte de disparition** : la routine détecte une campagne active hier et
   absente aujourd'hui → alerte Slack immédiate. Un ban ne doit pas se découvrir
   en regardant le CA du lendemain.

---

### P1 — 30 à 60 jours

#### 5. Klaviyo : le CA le moins cher que tu n'exploites pas
**Impact : élevé (marge quasi pure) · Effort : faible à moyen**

Faits : ~15 300 € de CA email sur 90 j, dont 92 % de flows automatisés. Et
**quasi zéro client récurrent** (22/23 premiers achats). Tu paies Meta pour
chaque euro.

Actions, dans l'ordre de rentabilité :

1. **Flow Polo → Gilet** (et inverse). C'est l'évidence absolue : même avatar,
   registre complémentaire (décontracté vs habillé), positionnement déjà écrit
   (« le Gilet se porte uniquement sur chemise »), et le teaser existe déjà dans
   le Guide NivaFit. Un acheteur Polo à J+14 est le meilleur prospect Gilet du
   marché, et il te coûte 0 € d'acquisition.
2. **Résoudre l'anomalie du flow en `draft`** qui génère quand même 3 685 €
   (doublon probable avec « Abandoned Cart On »). Soit tu en perds une partie
   sans le savoir, soit tu envoies en double. À trancher.
3. **Réparer les flows faibles** : Site Abandonment (0,11 €/dest.) et Post
   Purchase (0,24 €/dest.) vs Abandoned Checkout (3,32 €). Le Post Purchase à
   0,24 € est l'aveu que le cross-sell n'existe pas.
4. **Rapport hebdo Klaviyo dans Weft** : revenu par flow, par destinataire, et
   alerte quand un flow décroche. La page `/klaviyo` existe déjà — il manque
   l'historisation et l'alerte.

Le connecteur Klaviyo MCP est actif : les flows peuvent être créés
programmatiquement, tu n'as qu'à valider le contenu.

---

#### 6. Garde-fou intraday sur Meta
**Impact : moyen-élevé (arrête l'hémorragie) · Effort : faible**

La routine 23h05 est excellente mais elle constate le lendemain. Un budget
saigneur peut brûler une journée entière.

Ce qu'on ajoute : 2 passages par jour (13h / 18h) qui **alertent seulement** sur
Slack quand une campagne dépasse un seuil de spend sans conversion, ou quand le
CPA du jour dépasse 1,5× le seuil.

Une seule exception d'exécution automatique, à valider par toi : **pause
automatique** d'une ad set qui a dépensé plus de 3× le CPA cible avec 0 achat sur
la journée. C'est la seule règle où l'inaction coûte plus cher que l'erreur. Tout
le reste (scale, descale, coupe) reste en recommandation — ta règle Master ne
bouge pas.

---

#### 7. File d'exceptions logistiques
**Impact : moyen (récupère du CA déjà payé) · Effort : faible**

Les commandes #4989, #4499, #4610 (colis retournés, adresses/codes postaux
incorrects), #1029 en attente de saisie, et le blocage tracking signalé par
l'agent SAV sur #4972/#5425/#5455 (probablement technique côté agent, pas côté
client) : ce sont des commandes payées dont le CA est en train de partir en
remboursement.

Ce qu'on construit : un scan quotidien des commandes Shopify (4 boutiques) qui
sort une file « exceptions » → adresse invalide, colis retourné, expédiée sans
tracking depuis > 72 h, tracking bloqué au même statut depuis > 7 j. Chaque ligne
avec un brouillon de relance client prêt. Affiché dans Weft + digest Slack.

---

#### 8. Simulateur d'unit economics avant lancement
**Impact : moyen (évite un 2ᵉ NIRA) · Effort : faible**

NIRA : 508 € de spend, 110 € de CA, −430 € net. Le vrai coût n'est pas les 430 €,
c'est que le test n'avait pas de critères de mort définis à l'avance.

Ce qu'on construit, dans Weft : un écran « nouveau produit » où tu entres COGS,
prix de vente et pays → il sort marge de contribution, ROAS break-even, ROAS
cible 15 %, budget de test recommandé, et **le seuil de mort** (spend max sans
X achats). Ensuite, dès que la campagne porte `PRODTEST`, le dashboard suit
automatiquement le test contre ces seuils et te dit « continue » ou « arrête ».

La convention `PRODTEST` existe déjà et la carte 🧪 Testing aussi — il manque le
cadre de décision *avant* le lancement.

---

### P2 — 60 à 90 jours

#### 9. Pipeline créa Higgsfield semi-automatique
Une fois le chantier n°1 en place (et **seulement** après), on branche la boucle :
angle gagnant sous-alimenté → génération de N variantes statiques via le
connecteur Higgsfield (déjà actif) → dépôt Drive nommé selon la convention →
validation humaine → upload Meta en PAUSED. Sans la taxonomie, cette boucle
produit du volume aveugle : c'est le piège des deux rapports Gemini.

Contraintes à encoder dans les prompts : pas de femmes à l'écran, pas de musique,
couleurs Gilet réelles uniquement (bleu nuit, rouge bordeaux, gris anthracite,
marron Oxford, noir intense, vert olive — jamais d'autres), vocabulaire « veste »
jamais « blazer ».

#### 10. Deuxième canal d'acquisition, instrumenté avant de dépenser
Meta à 100 % + un compte déjà banni une fois = fragilité structurelle. Avant de
dépenser un euro ailleurs, il faut que Weft sache le mesurer (le donut « CA par
canal » existe déjà via `getAcquisitionForRange`). Ordre logique : Google PMax /
Search de marque d'abord (tu récupères de la demande existante), TikTok ensuite
(même avatar, format compatible avec tes créas UGC).

#### 11. Test d'offre et de landing
Le trafic FR atterrit direct sur la fiche produit, sans VSL ni advertorial, avec
un seul upsell post-achat. Une fois la refonte landing terminée, teste **l'offre**
avant le design : 1 acheté = 1 offert vs remise directe vs bundle 4 pcs mis en
avant. Mesurable dans Weft par campagne, sans outil supplémentaire.

#### 12. Dettes techniques à solder
- Scope `read_all_orders` (répare l'historique 21/05→03/06 tout seul).
- Permission `read_shopify_payments_disputes` (rétrofacturations, en attente).
- Connecteur Slack de la session liée au trigger 23h05 (`enabledInChat:false`
  aujourd'hui → les rapports ne partent pas réellement).
- Trancher le spend Meta antérieur au 04/06.
- Décaler le cron 23h05 à l'heure d'hiver fin octobre.

---

## 4. Ce qui doit rester manuel (et pourquoi)

| Décision | Pourquoi jamais automatique |
|---|---|
| **Scale / descale / coupe de budget** | Ta règle Master. Un agent qui scale sur 3 jours de bruit statistique brûle du cash plus vite qu'il n'en gagne. Recommandation oui, exécution non. |
| **Envoi d'un email SAV hors « où est ma commande »** | Un remboursement, un échange de taille, un client mécontent : une erreur de ton coûte un avis négatif et un chargeback. Brouillon + validation. |
| **Remboursements et gestes commerciaux** | Argent qui sort. Toujours humain. |
| **Choix d'un nouveau produit** | Un agent peut chiffrer, il ne peut pas juger la cohérence avec l'avatar et la marque. NIRA en est la preuve. |
| **Copies à claims corporels** | Risque de ban de compte. Pre-flight automatique, décision humaine. |
| **Toute modification des grilles COGS / règles fiscales** | Source unique = facture fournisseur. Elle a déjà invalidé 2 modèles (taxe forfaitaire, caleçon par pays). Jamais d'inférence. |
| **Renommage de produits Shopify** | Chaque renommage sort les ventes du comptage tant que `products_map` n'est pas mis à jour. À faire consciemment, avec le réflexe de bump de version. |

---

## 5. Séquencement proposé

**Semaines 1-2** — Chantiers 1 (taxonomie créa), 2 (validateur nommage), 4
(résilience Meta : BM de secours + alerte disparition). Plus : accorder le scope
`read_all_orders` et activer le connecteur Slack (10 min chacun, côté toi).

**Semaines 3-6** — Chantier 3 (SAV : registre + routine + rattrapage des 340
fils), chantier 5 (Klaviyo : flow Polo→Gilet en priorité, anomalie du flow
draft), chantier 6 (garde-fou intraday).

**Semaines 7-12** — Chantiers 7 (exceptions logistiques), 8 (simulateur produit),
9 (pipeline créa), puis 10-11 selon ce que disent les données du chantier 1.

**Le point de bascule à surveiller** : à la fin du chantier 1, tu dois pouvoir
répondre à « quel angle × quel format × quel produit gagne, avec quelle
significativité ». Le jour où tu peux, ton coût d'acquisition baisse durablement
et tout le reste devient secondaire.

---

## 5 bis. L'outillage : ce qui existe déjà et qu'il faut installer

Vérifié le 12/08/2026 en interrogeant le registre de plugins/MCP réel + les dépôts
GitHub un par un (étoiles, activité, modèle éco, ce qu'ils touchent).
Critère de tri : **est-ce que je laisserais ce repo écrire sur un compte pub qui
dépense des milliers d'euros ?**

### Tier A — officiel, gratuit, à installer cette semaine

| Outil | Ce que ça fait | Pourquoi pour toi |
|---|---|---|
| **Shopify AI Toolkit** — `Shopify/Shopify-AI-Toolkit`, officiel, MIT (avril 2026)<br>`claude plugin install shopify-ai-toolkit@claude-plugins-official` | MCP officiel Shopify : docs, schémas GraphQL, validation Liquid/GraphQL, exécution store via CLI | Exactement ce que tu avais prévu pour la refonte de la landing Nivafit. Officiel = pas de risque. |
| **`Shopify/liquid-skills`** — plugin officiel Claude Code | Maîtrise Liquid, objets/tags/filtres, standards de thème (BEM, design tokens, accessibilité) | Le thème Dawn du store FR, la section avis custom, les bandeaux marquee traduits |
| **Meta Ads CLI officiel** — `pip install meta-ads-cli` (publié par Meta le 29/04/2026, Python 3.12+)<br>+ **Meta Ads MCP officiel** (`mcp.facebook.com/ads`, OAuth Business, gratuit en beta, 29 tools) | Wrappe la Marketing API en exécutable : campagnes, ad sets, ads, créas, catalogues, insights | Remplace les appels API artisanaux de la routine 23h05. **OAuth Business standard : pas de Developer App à faire reviewer, pas de token système qui traîne dans une variable d'env.** C'est le point qui le rend supérieur à tous les MCP tiers. |

### Tier B — le vrai gisement : deux repos à piller

**`TheMattBerman/meta-ads-kit`** — 291 ⭐, 6 skills :
`meta-ads` (reporting), **`ad-creative-monitor` (détection de fatigue créative
avant qu'elle tue le ROAS)**, `budget-optimizer`, `ad-copy-generator`,
`ad-upload` (PAUSED-only + dry-run obligatoire), **`pixel-capi` (audit du Pixel
et de la Conversions API, test des events serveur)**.

Il tourne sur OpenClaw — que je te déconseille. **Mais les skills sont des
fichiers markdown.** On prend `ad-creative-monitor` et `pixel-capi`, on les porte
en skills Claude Code branchés sur le CLI officiel : ~30 min de travail. Et
`pixel-capi` t'intéresse directement — tu paies WeTracked, tu perds des UTM sur
une partie des commandes, et tu n'as jamais audité ton setup Pixel/CAPI. Une
partie de ton bruit d'attribution vient peut-être de là.

**`brandu-mos/konquest-meta-ads-mcp`** — 42 ⭐, MIT, 57 tools publics.
Il fait **l'application dure des conventions de nommage avant toute écriture
API**, plus un journal d'exécution avec rollback, du rate limiting, et des
niveaux sandbox/standard/production.

C'est littéralement le chantier n°2 de ce plan, déjà codé. À lire absolument
comme référence d'implémentation. Attention : modèle open-core (41 tools de plus
en payant), donc l'installer t'expose à une pression commerciale — je
recommande de **lire le code, pas de s'y attacher**.

### Tier C — pour la production créative

- **`higgsfield-skills`** (pixelab-ch / higgsfield-ai) — 15 skills, dont
  `higgsfield-ecommerce-ad` (routé vers `marketing_studio_video`) et
  `higgsfield-fashion-lookbook` (routé vers `cinematic_studio_video_v2`).
  Install par `install.sh` vers `~/.claude/skills/`. **Nécessite le MCP
  Higgsfield — que tu as déjà connecté.** Seulement 2 ⭐, mais c'est du markdown
  de prompt : ça ne touche ni ton argent ni tes données. Coût du risque ≈ 0,
  gain = des prompts structurés au lieu d'improvisés.
- **Competitor Ad Intelligence** (skill de `github/awesome-copilot`) — scrape la
  Meta/Google Ad Library, décompose hooks, angles et offres des concurrents,
  produit un teardown. Tu copies déjà Breeze pour le Gilet : ça systématise le
  travail d'angles. **Réserve** : le scraping direct de l'Ad Library est devenu
  peu fiable (anti-bot Meta) ; la variante par recherche web fonctionne mieux.

### Tier D — vérifié, et à ne PAS installer

| Outil | Verdict |
|---|---|
| `serkanhaslak/meta-mcp` (77 tools, CRUD complet Meta) | **9 ⭐.** Un dépôt à 9 étoiles ne devrait jamais avoir `ads_management` sur un compte qui dépense des milliers d'euros par mois. Le ratio pouvoir/relecture est mauvais. |
| `lamorim-net/openads-ai` | 2 ⭐, 1 fork. Non. |
| `composio-community/support-skills` (45 skills SAV) | 18 ⭐, et surtout **dépend d'un compte Composio** et cible Gorgias/Zendesk/Intercom. Une dépendance et un abonnement de plus. Les prompts sont bons à lire, l'installation non. |
| `wiebekaai/ecommerce-skills` | 1 ⭐, 2 commits, fait pour un meetup. Non. |
| `jeremylongshore/claude-code-plugins-plus-skills` (471 plugins, 3 069 skills) | Ferme à contenu. Le volume n'est pas un signal de qualité. |

### Déjà dans ton catalogue, pas encore activés

- **Adspirer** (91 tools : Google, Meta, TikTok, LinkedIn) — disponible dans ton
  catalogue de plugins claude.ai, non installé. Pas maintenant, mais c'est le
  bon outil le jour du chantier 10 (diversification) : un seul plugin pour les
  quatre régies.
- **Customer Support** et **Marketing** (marketplace knowledge-work) — génériques,
  calibrés support B2B SaaS (Intercom, Guru, HubSpot). Peu adaptés à un SAV
  e-commerce en français. À ignorer.
- **Klaviyo et Gmail sont déjà connectés** en MCP : rien à chercher ailleurs pour
  les chantiers 3 et 5.

### Ce qui n'existe pas sur étagère

Personne ne vend la brique qui te manque vraiment : **la taxonomie créa croisée
avec ton schéma Supabase, tes grilles COGS et ton protocole Master.**
`meta-ads-kit` fait de la fatigue créative générique. `konquest` fait le nommage.
Aucun des deux ne connaît ton ROAS réel corrigé par UTM, ni la distinction
Polo/Gilet, ni tes seuils par produit. Ce croisement-là, c'est du code à écrire —
c'est le chantier 1, et c'est précisément pour ça qu'il vaut le plus.

---

## 6. Une remarque de fond

Ta mémoire liste 5 projets en parallèle (Niva, Silix France, Beaumont Paris,
Atlas Power, Gilet) plus un job salarié. Ta mémoire identifie elle-même le risque :
« focus fracturé ». Le plan ci-dessus vaut pour Niva. Silix et Beaumont sont des
duplications de sites : rapides à faire, mais chacun ramène un SAV, un compte pub,
des charges fixes et des créas. Atlas Power (import, reconditionnement au Maroc,
financement Intelaka) n'est pas un side project, c'est une entreprise.

Sur les chiffres du repo, Niva n'est pas encore un système qui tourne sans toi :
le SAV est manuel, l'attribution dépend de noms tapés à la main, le compte pub a
déjà été banni une fois. Les 12 chantiers ci-dessus, c'est ce qui transforme Niva
en actif qui tourne seul. Après, seulement, le deuxième projet coûte peu.
