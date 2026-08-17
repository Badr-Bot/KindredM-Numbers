# kindredm-skills

Skills [Claude Code](https://claude.com/claude-code) pour KindredM.
Quatre skills sur mesure + les dépendances externes recommandées.

## Installation (une fois)

```bash
git clone https://github.com/Badr-Bot/kindredm-skills.git
cd kindredm-skills
npm install && npx playwright install chromium

# rendre les skills disponibles dans TOUS tes projets
mkdir -p ~/.claude/skills
cp -r skills/* ~/.claude/skills/
```

Vérifier : ouvre Claude Code et tape `/` — les quatre skills apparaissent.

> Pour ne les activer que dans un projet : `cp -r skills/* /chemin/projet/.claude/skills/`

## Avant la première utilisation

```bash
cp BRAND.md.example BRAND.md   # puis remplis-le
# et remplis config/seuils.md
```

Ces deux fichiers sont ce qui évite qu'on te repose les mêmes questions à
chaque session. Chaque champ rempli = un aller-retour en moins.

## Les quatre skills

| Skill | Ce qu'elle fait | Dépend de |
|---|---|---|
| **clone-site** | Capture un site (screenshots + CSS calculé), en extrait le système, reconstruit, et **compare sa propre reconstruction à la référence** en boucle jusqu'à ce que ça colle | Playwright |
| **ugc-brand** | Route vers le bon workflow UGC Higgsfield, lit `BRAND.md` au lieu de te réinterroger, et **interdit de générer une vidéo avant qu'une image ait été validée** | MCP Higgsfield |
| **crea-review** | Analyse les créas Meta en les croisant avec la **marge réelle par marché**, pas le ROAS brut. Verdict SCALE / GARDER / FATIGUE / COUPER / TROP TÔT | MCP Meta + moteur NIVA |
| **produit-audit** | Audite les fiches produit sur les 4 boutiques, classe par impact CA, et **écrit les textes corrigés prêts à coller** | MCP Shopify |

### clone-site — les deux modes

- **REPRO** : reproduire *cette page-là*. Boucle screenshot-diff, minimum 2
  itérations. La skill n'a pas le droit de dire « c'est fini » sans avoir
  regardé sa propre capture.
- **SYSTÈME** : extraire le vocabulaire (couleurs classées par surface réelle,
  échelle typo, rythme d'espacement, bordure-vs-ombre) pour l'appliquer à des
  pages que le site source n'a jamais eues.

```bash
node skills/clone-site/scripts/capture.mjs https://exemple.com ./capture/exemple
node skills/clone-site/scripts/shot.mjs http://localhost:3000 ./capture/mine.png 1440
```

**Limite connue :** le mouvement n'est pas capturable par screenshot. Les
transitions se refont à la main.

### ugc-brand — l'échelle de coût

script (0) → critique (0) → character-sheet (faible) → images des plans
(faible) → **validation** → vidéo (élevé).

Ne jamais sauter un barreau. Une image ratée coûte une fraction d'une vidéo
ratée, et révèle exactement les mêmes défauts de cadrage, lumière et
packaging.

## Skills externes recommandées (non incluses ici)

```bash
# design : typographie, couleur, motion, états de composants, anti-slop
npx impeccable install                      # pbakaus/impeccable
git clone https://github.com/h3nryprod01/design-taste ~/.claude/skills/design-taste

# notation de créa vidéo sur 8 dimensions
git clone https://github.com/creatify-ai/ad-creative-evaluator ~/.claude/skills/ad-creative-evaluator
```

`design-taste` est une fusion de `emilkowalski/skill`, `pbakaus/impeccable` et
`taste-skill` — prends-la plutôt que les trois séparément.

## Prérequis MCP

Connecteurs à activer côté claude.ai : **Higgsfield** (UGC), **Meta** (créas),
**Shopify** (produits). `clone-site` ne dépend d'aucun MCP, juste de Playwright.

## Notes

- Les skills **analysent et proposent**. Aucune ne modifie un compte
  publicitaire ni une fiche produit sans validation explicite.
- `clone-site` reproduit structure et système de design, jamais les logos,
  photos ou textes de marque d'un tiers.
