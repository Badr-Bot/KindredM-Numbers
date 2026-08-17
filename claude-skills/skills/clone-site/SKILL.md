---
name: clone-site
description: Reproduire fidèlement le design d'un site web existant, ou en extraire le système de design réutilisable. Utiliser quand on demande de copier/cloner/reproduire l'apparence d'un site, de s'inspirer d'une référence, de "faire pareil que <url>", d'extraire les couleurs/typo/espacements d'un site, ou de refaire une page "dans le style de". Déclencheurs : clone, cloner, copier le design, même look, comme <url>, reproduis ce site, design tokens, inspire-toi de.
---

# clone-site

Reproduire un design **en le regardant**, pas de mémoire.

La règle qui gouverne tout : **je n'ai le droit de dire que c'est fini
qu'après avoir screenshoté ma propre reconstruction et comparé les deux
images.** Sans ça je code à l'aveugle et le résultat est générique.

## Choisir le mode dès le départ

Poser la question si ce n'est pas évident, puis l'annoncer :

- **Mode REPRO** — reproduire *cette page-là* le plus fidèlement possible.
  Boucle de diff obligatoire, minimum 2 itérations.
- **Mode SYSTÈME** — extraire le vocabulaire (couleurs, échelle, rythme,
  gestes) pour l'appliquer à des pages que le site source n'a jamais eues.
  Produit un fichier de tokens, pas une copie.

Le plus souvent l'utilisateur demande REPRO en croyant demander SYSTÈME, ou
l'inverse. Trancher explicitement avant de coder.

## Phase 1 — Capturer la vérité terrain

```bash
node scripts/capture.mjs <url> ./capture/<domaine>
```

Produit `desktop.png`, `desktop-full.png`, `mobile.png`, `dom.json`.

Prérequis : `npm i -D playwright` puis `npx playwright install chromium`.
Le script détecte tout seul un Chromium partagé (`/opt/pw-browsers/chromium`)
et un proxy sortant s'il y en a un.

**Ensuite : ouvrir les PNG avec l'outil Read.** Ce n'est pas optionnel. Le
`dom.json` donne les chiffres, l'image tranche les conflits. Un `dom.json` lu
sans regarder l'image produit des reconstructions qui ont les bonnes valeurs
et la mauvaise allure.

Pour plusieurs pages : relancer sur 2-3 liens de navigation. Une valeur
présente sur 2+ pages est un **signal de système** ; présente sur une seule,
c'est **local** — ne pas la généraliser.

## Phase 2 — Lire le dom.json correctement

`backgroundsBySurface` est **trié par surface réellement occupée**. Le
premier est le fond de page. Une couleur en bas de liste n'est pas une
couleur de marque, c'est un accent.

> Une couleur qui couvre moins de 5 % de la surface visible ne doit jamais
> être listée comme couleur de marque.

Ce qu'il faut en tirer, dans l'ordre :

1. **Fond + texte** — les deux ou trois surfaces dominantes, et le contraste
   entre elles. C'est 80 % de la sensation.
2. **Échelle typo** — lister les tailles de `typeScale` triées. Combien de
   pas réels ? (souvent 4-6, jamais 12). Noter graisse ET interligne :
   `16px/26px` et `16px/20px` sont deux styles différents.
3. **Rythme d'espacement** — les valeurs de `spacingRhythm` sont-elles
   toutes multiples de 4 ? de 8 ? Trouver la base, puis les 3-4 pas réellement
   utilisés. Un site cohérent en a peu.
4. **Séparation** — regarder `shadows` vs `borders`. Un site qui sépare par
   bordure 1px et un site qui sépare par ombre portée ne se ressemblent
   jamais, même avec la même palette. C'est le choix le plus discriminant.
5. **Rayons** — combien de valeurs distinctes ? Une seule = système strict.
6. **Largeur de conteneur** — depuis `containerWidths`.

## Phase 3 — Reconstruire

Cible par défaut : Next.js + Tailwind.

**Interdit : la valeur Tailwind approchante quand la valeur exacte est
connue.** Si l'ombre réelle est `0 1px 2px rgba(0,0,0,.4)`, on écrit
`shadow-[0_1px_2px_rgba(0,0,0,0.4)]`, pas `shadow-lg`. C'est précisément
l'écart entre « ça ressemble vaguement » et « c'est la même chose ».

Poser d'abord les tokens dans le thème (couleurs, échelle, espacements), puis
construire avec les tokens. Jamais de valeur en dur dispersée dans le JSX.

## Phase 4 — La boucle de diff (obligatoire en mode REPRO)

```bash
npm run dev &
node scripts/shot.mjs http://localhost:3000 ./capture/mine.png 1440
```

Puis **ouvrir les deux images côte à côte avec Read** et lister les écarts
par ordre de visibilité :

1. densité / échelle générale (le plus visible, le plus souvent faux)
2. contraste fond-texte
3. graisse et taille des titres
4. espacement vertical entre blocs
5. traitement des bordures et ombres
6. rayons, détails

Corriger, re-shooter, recomparer. **Minimum 2 itérations.** Le premier jet
est toujours trop aéré ou trop dense — c'est systématique.

Refaire la boucle en 390px avant de conclure.

## Phase 5 — Audit anti-slop

Avant de rendre, relire ses propres notes et supprimer tout mot vague :
« clean », « moderne », « épuré », « élégant », « intuitif », « premium ».
Chaque affirmation doit porter un px, un hex ou un ratio. Si une phrase
survit sans chiffre, elle ne décrit rien.

Vérifier aussi qu'on n'a pas réintroduit les tics par défaut :
dégradé violet, `shadow-lg` générique, `rounded-xl` partout, gris pur non
teinté, texte gris sur fond coloré, easing `ease-in` sur une sortie.

## Limites — à dire à l'utilisateur, pas à cacher

- **Le mouvement n'est pas capturé.** Screenshots et styles calculés ne
  disent rien de la qualité ressentie des transitions. C'est le trou du
  clonage — le combler à la main ou avec une skill de motion.
- **Les polices payantes ne se copient pas.** Identifier la fonte, proposer
  la substitution la plus proche, et le signaler explicitement.
- **Le contenu derrière authentification n'est pas accessible.**
- **Certains environnements bloquent les hôtes externes** (proxy d'egress).
  Dans ce cas la capture échoue avec un 403 : le signaler, ne pas contourner.

## Périmètre légal

On reproduit **structure, système et logique de design**. On ne copie
jamais logo, photographies, illustrations propriétaires ni textes de marque.
Si l'utilisateur demande une copie incluant ces éléments, le dire une fois et
livrer le reste avec des placeholders.
