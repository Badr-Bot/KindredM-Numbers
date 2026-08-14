---
name: maj-memoire
description: Met à jour WEFT_MEMORY_ECOM.md (la mémoire business durable) proprement — nouveau coût, nouvelle règle, changement de prix, décision structurante, piège découvert. À utiliser quand Badr annonce un changement durable de son business ou demande de "mettre à jour la mémoire".
---

# Mise à jour de la mémoire business

`WEFT_MEMORY_ECOM.md` (racine du repo) est le fichier canonique, versionné
par git. Il ne contient QUE le durable : coûts unitaires, règles, protocoles,
pièges vérifiés. Jamais de chiffre de performance du jour (ça vit dans le
dashboard).

## Procédure

1. **Lire le fichier** avant d'écrire — repérer la section concernée
   (1 business · 2 produits/prix · 3 coûts · 4 marges/seuils · 5 métriques ·
   6 protocole · 7 campagnes snapshot · 8 fournisseur · 9 pièges · 10 outils ·
   11 en attente).
2. **Modifier chirurgicalement** : la ligne concernée, pas de réécriture
   globale. Convertir les dates relatives en dates absolues. Si un changement
   invalide un seuil dérivé (ex. nouveau coût → BE ROAS), recalculer et
   mettre à jour les deux, en montrant le calcul à Badr.
3. **Mettre à jour la ligne de date du snapshot** en tête de fichier.
4. **Récapituler à Badr** ce qui a changé (avant → après) en 2-3 lignes.
5. **Committer** : `git add WEFT_MEMORY_ECOM.md` + commit court
   (« maj mémoire : <quoi> ») + push sur la branche courante.

## Garde-fous

- Un chiffre annoncé à l'oral sans source ne remplace JAMAIS un chiffre
  vérifié sur facture : le noter en « à confirmer » dans la section 11.
- Ne jamais supprimer un piège de la section 9 — ils sont payés cher.
- Si le changement contredit le protocole de décision (section 6), le
  signaler avant d'écrire.
