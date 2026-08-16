# Emailing, délivrabilité, suivi colis, SAV

> Klaviyo, authentification du domaine (SPF/DKIM/DMARC), ParcelPanel, notifications d'expédition et charge SAV. L'intégration technique de la carte Klaviyo du dashboard est décrite dans `dashboard-ui.md` (section « Onglet Dépenses »), clé API incluse.
>
> Mémoire Kindred — chargée automatiquement via `CLAUDE.md`.
> Mise à jour à chaque changement de règle, jamais en double ailleurs.

## 📧 Emails en spam + suivi colis muet → SAV saturé (diagnostic 15/08)
Question Badr : « pourquoi mes clients reçoivent mes emails en spam et Parcel
Panel n'envoie pas de mail de suivi, le SAV est saturé ». Trois causes
DISTINCTES, mesurées (DNS réel + API Shopify + API Klaviyo), pas des
hypothèses. La saturation SAV vient surtout de la n°3.

### 1. Klaviyo (marketing) — SAIN, ce n'est PAS la cause
- Domaine d'envoi dédié `envoi.mynivashop.com` : CNAME + DKIM `km1`/`km2` +
  SPF `v=spf1 include:spf.klaviyodns.com ~all` — **tout vérifié, statut
  `active`**. Expéditeur `contact@mynivashop.com` : alignement DMARC relâché
  OK (même domaine org).
- **Plaintes spam sur 30 j (16/07→15/08) : 5 sur ~18 479 emails délivrés =
  0,027 %.** Seuil Gmail/Yahoo = 0,30 % → on est 11× SOUS la limite.
- Bounces : 32 hard + 198 soft ≈ 1,2 %. Normal.
- ⇒ Ne pas toucher à Klaviyo pour « régler le spam ». Le problème est ailleurs.

### 2. Le domaine racine `mynivashop.com` n'est PAS protégé — c'est LÀ le trou
- **AUCUN enregistrement SPF sur `mynivashop.com`.** Les seuls TXT à la racine
  sont `google-site-verification=…` et `klaviyo-site-verification=SWVS8q`.
  Aucun `v=spf1`. Or les MX pointent sur `smtp.google.com` (Workspace) →
  **tous les emails SAV envoyés depuis `contact@mynivashop.com` partent avec
  SPF = none.**
- DKIM Google existe (`google._domainkey` présent) donc DMARC passe encore par
  la jambe DKIM — mais SPF=none est un malus lourd chez **Orange.fr, SFR,
  Free.fr, La Poste**, qui pèsent ~5 600 destinataires sur 30 j (Orange 3 960,
  SFR 862, Free 538, La Poste 270). Base client très FR/senior = filtres FAI
  les plus stricts du marché.
- **Aucun DKIM Shopify** (`shopify._domainkey`, `shopify2._domainkey`,
  `shopifyemail._domainkey`, `em._domainkey` : tous absents) → le domaine
  n'est pas authentifié côté Shopify, les mails de commande/expédition ne
  partent donc pas sous la marque et ne construisent aucune réputation pour
  `mynivashop.com`.
- `_dmarc.mynivashop.com` = `v=DMARC1; p=none` **sans `rua=`** → aucune
  remontée, zéro visibilité sur qui échoue.
- ⇒ Correctifs (DNS chez Google Domains, ns-cloud-c*.googledomains.com) :
  publier un SPF racine incluant Workspace, authentifier le domaine dans
  Shopify (Paramètres → Notifications → expéditeur), ajouter `rua=` au DMARC
  avant d'envisager `p=quarantine`.

### 3. Le suivi colis est MUET — la vraie cause de la saturation SAV
- **ParcelPanel fonctionne et pousse bien ses événements dans Klaviyo** : les
  métriques `Package picked up`, `Package in transit`, `Package out for
  delivery`, `Package delivered`, `Package delayed`, `Package delivery
  exception` existent, plus les métriques Shopify `Confirmed Shipment`,
  `Marked Out for Delivery`, `Delivered Shipment` (créées 21/03 et 29/07).
- **MAIS AUCUN FLOW NE LES CONSOMME.** Les 9 flows Klaviyo sont : Sunset,
  Abandoned Checkout, Welcome, Site Abandonment, Winback, Browse Abandonment,
  Abandoned Cart On, Post Purchase (live) + un brouillon panier abandonné.
  **Zéro flow déclenché par un événement colis.** Les événements arrivent et
  tombent dans le vide → le client ne reçoit jamais rien après l'expédition.
- Chaîne actuelle par commande : confirmation Shopify → email « Produit
  numérique » (Digital Downloads) → confirmation d'expédition envoyée par
  **Dianxiaomi (店小秘)** au moment du fulfillment → **puis plus rien**.
  ParcelPanel (CWILL) réécrit l'URL de suivi ~15-20 s après le fulfillment.
- **Le trou mesuré (2 échantillons de 50 commandes, données Shopify) :**
  - expédiées le 06/08 (J+9) : **23/50 = 46 % n'ont AUCUN événement de
    tracking** (`displayStatus:FULFILLED`, `inTransitAt:null`), 10 en transit,
    1 en livraison, 1 échec de livraison, 15 livrées (30 %).
  - expédiées le 30/07 (J+16) : 8/50 = 16 % toujours sans aucun événement,
    40 livrées (80 %).
  - 1er scan transporteur typiquement **4 à 7 jours après le fulfillment**,
    livraison à J+7/J+9 (YunExpress).
- ⇒ Le client reçoit un numéro de suivi qui **n'affiche rien pendant ~1
  semaine**, sans le moindre email d'ici là. C'est le WISMO (« where is my
  order ») qui remplit le SAV, pas un problème de délivrabilité.
- ⇒ Correctif à plus fort levier : créer les flows Klaviyo sur les
  événements colis déjà disponibles (en transit / retard / en livraison /
  livré / **exception** — le cas `ATTEMPTED_DELIVERY` exige une action du
  client et ne déclenche aujourd'hui aucun email), + un email « colis pris en
  charge, premier scan sous X jours » qui désamorce l'attente à J+2.

### Ordre de priorité
1. Flows Klaviyo sur les événements colis (résout la saturation SAV).
2. SPF racine + DKIM Shopify (résout le spam des réponses SAV).
3. `rua=` sur le DMARC, puis durcissement en `p=quarantine`.
