# Comment récupérer la formation sans y passer tes soirées

Le problème à résoudre : **beaucoup de modules, beaucoup de vidéos, pas de temps.**
Copier-coller leçon par leçon n'est pas une option viable, et ce document n'en
fait pas une.

## Ce que je ne peux pas faire, et pourquoi

Je n'ai **aucun accès à Skool**. Deux raisons, indépendantes :

1. `www.skool.com` est **bloqué par la politique réseau** de la session
   (le proxy répond `403` sur le CONNECT — refus journalisé par nom d'hôte).
2. Il existe bien un Chromium dans mon conteneur, mais c'est un navigateur
   vierge dans le cloud : il n'a pas ta session Skool, et il n'a aucun moyen
   de l'avoir.

Conclusion : **le contenu doit sortir de Skool depuis ton navigateur à toi.**
Tout le reste (structuration, notes, skill, GPT), je le fais.

---

## Route 1 — la capture navigateur ⭐ commence par là

**~2 minutes par module. Gratuit. Aucune vidéo à ouvrir.**

Skool est une application Next.js : la structure complète du classroom, avec le
texte de description de chaque leçon, est déjà chargée dans la page. On la lit
d'un coup au lieu de cliquer 100 fois.

1. Ouvre la formation dans Chrome, sur n'importe quelle leçon d'un module.
2. `F12` → onglet **Console**. Si Chrome le demande, tape `allow pasting`.
3. Colle tout le contenu de **`scripts/skool-capture.js`**, puis Entrée.
4. Un fichier `skool-capture-….json` se télécharge.
5. Donne-le moi (ici, ou dans Google Drive).

Récolté sans ouvrir une vidéo : tous les modules, tous les titres, les durées,
**le texte de description de chaque leçon**, les liens Notion, et les URLs vidéo.

> Le texte des pages Skool est loin d'être anecdotique. Sur la leçon
> « L'algorithme Meta », la seule page annonce déjà les 4 étapes du process,
> l'update Andromeda, l'équation du heavy ranking, les méthodes de bidding.
> C'est une base réelle, disponible immédiatement.

Puis, de mon côté :

```bash
python3 scripts/importer.py ~/Downloads/skool-capture-….json           # aperçu
python3 scripts/importer.py ~/Downloads/skool-capture-….json --ecrire  # applique
```

Le script regarde aussi s'il existe des **pistes de sous-titres** dans le
lecteur. S'il en trouve, dis-le moi tout de suite : la transcription devient
quasi gratuite et la Route 2 saute.

---

## Route 2 — l'audio des vidéos

C'est la seule partie qui demande vraiment quelque chose. Trois façons, du moins
cher en temps au plus cher.

### 2a. Les sous-titres du lecteur, s'ils existent

Si la capture a trouvé des pistes de sous-titres, ou si tu vois un bouton `CC` /
« Transcript » dans le lecteur : c'est fini, on récupère le texte tel quel.
Vérifie ça **avant** de faire quoi que ce soit d'autre.

### 2b. Whisper en local — gratuit, automatique, lent

Tu récupères les fichiers vidéo une fois, dans un dossier, nommés avec le numéro
de leçon en tête (`12 - L'algorithme Meta.mp4`). Puis :

```bash
pip install faster-whisper
python3 scripts/transcrire.py ~/videos-formation            # aperçu
python3 scripts/transcrire.py ~/videos-formation --ecrire   # lance
```

Ça remplit les fiches tout seul, passe leur statut à `complet` et met les
horodatages. Compte 1× à 3× la durée des vidéos sur un CPU récent : tu lances le
soir sur tout le dossier, c'est prêt le matin. Tu ne restes pas devant.

### 2c. Whisper via l'API — payant, mais rapide

~0,006 $/minute. **100 vidéos de 20 minutes ≈ 12 $** pour toute la formation.
Pertinent si ta machine est lente ou si tu veux le résultat dans l'heure.

---

## Route 3 — le copier-coller manuel

Le dernier recours, une leçon à la fois. Colle le texte ici et dis
« ingère la leçon 12 » : je fais la fiche et la note Notion.

À réserver aux 2-3 leçons vraiment critiques si tu veux un résultat ce soir.

---

## L'ordre que je te recommande

1. **Route 1** sur tous les modules → tu as la carte complète et une vraie base
   textuelle, en une dizaine de minutes.
2. Je construis le GPT / le Projet Claude **là-dessus**. Il est déjà utile.
3. **Route 2** en tâche de fond, module par module, en commençant par ceux que
   tu utilises vraiment.
4. À chaque module transcrit, on relance `pack` et on remplace les fichiers du
   GPT. Il devient meilleur sans jamais repartir de zéro.

Le système est fait pour ça : **il marche à 10 % transcrit, et il s'améliore
tout seul au fur et à mesure.** Tu n'as pas à tout faire avant d'en tirer
quelque chose.
