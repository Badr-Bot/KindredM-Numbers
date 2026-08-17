#!/usr/bin/env node
/**
 * capture.mjs — capture la vérité terrain d'une page web pour la skill clone-site.
 *
 *   node capture.mjs <url> [outdir]
 *
 * Produit dans <outdir> :
 *   desktop.png      screenshot 1440x900 (viewport)
 *   desktop-full.png screenshot pleine page
 *   mobile.png       screenshot 390x844
 *   dom.json         styles calculés agrégés (couleurs pondérées par surface,
 *                    échelle typo, rythme d'espacement, rayons, ombres, bordures)
 *
 * Prérequis : npm i -D playwright && npx playwright install chromium
 * (dans un environnement Claude Code distant, Chromium est déjà présent)
 */
import { chromium } from 'playwright';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const url = process.argv[2];
const outdir = process.argv[3] || './capture';

if (!url) {
  console.error('usage: node capture.mjs <url> [outdir]');
  process.exit(1);
}
mkdirSync(outdir, { recursive: true });

/** Agrégateur exécuté DANS la page. Renvoie du JSON sérialisable. */
function extract() {
  const bgArea = {};      // couleur de fond -> surface visible px²
  const textArea = {};    // couleur de texte -> surface approx px²
  const typeScale = {};   // "16px / lh 24px / w 400 / ls normal" -> occurrences
  const families = {};
  const radii = {};
  const shadows = {};
  const borders = {};
  const spacing = {};
  const widths = {};      // largeurs de conteneurs centrés

  const bump = (o, k, n = 1) => { if (k) o[k] = (o[k] || 0) + n; };

  // html + body inclus : c'est là que vit le fond dominant de la page.
  const all = [document.documentElement, document.body, ...document.querySelectorAll('body *')];
  for (const el of all) {
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) continue;
    if (r.bottom < 0 || r.top > document.documentElement.scrollHeight) continue;

    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0) continue;

    const surface = Math.round(r.width * r.height);

    // Fonds : pondérés par la surface réellement occupée.
    const bg = cs.backgroundColor;
    if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') bump(bgArea, bg, surface);
    if (cs.backgroundImage && cs.backgroundImage.includes('gradient')) {
      bump(bgArea, `GRADIENT ${cs.backgroundImage.slice(0, 120)}`, surface);
    }

    // Typographie : seulement les éléments qui portent du texte en propre.
    const ownText = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim().length > 0);
    if (ownText) {
      bump(families, cs.fontFamily);
      bump(typeScale, `${cs.fontSize} / lh ${cs.lineHeight} / w ${cs.fontWeight} / ls ${cs.letterSpacing}`);
      // surface texte approchée : largeur x hauteur de ligne
      bump(textArea, cs.color, Math.round(r.width * parseFloat(cs.lineHeight || cs.fontSize) || 0));
    }

    if (cs.borderRadius && cs.borderRadius !== '0px') bump(radii, cs.borderRadius);
    if (cs.boxShadow && cs.boxShadow !== 'none') bump(shadows, cs.boxShadow);

    for (const side of ['Top', 'Right', 'Bottom', 'Left']) {
      const w = cs[`border${side}Width`];
      if (w && w !== '0px' && cs[`border${side}Style`] !== 'none') {
        bump(borders, `${w} ${cs[`border${side}Style`]} ${cs[`border${side}Color`]}`);
      }
    }

    for (const p of ['paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight', 'marginBottom', 'rowGap', 'columnGap']) {
      const v = cs[p];
      if (v && v !== '0px' && v !== 'normal') bump(spacing, v);
    }

    if (cs.marginLeft === cs.marginRight && cs.marginLeft !== '0px' && r.width > 400) {
      bump(widths, `${Math.round(r.width)}px`);
    }
  }

  const top = (o, n) => Object.entries(o)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([value, weight]) => ({ value, weight }));

  const root = getComputedStyle(document.documentElement);
  const body = getComputedStyle(document.body);

  return {
    url: location.href,
    title: document.title,
    viewport: { w: innerWidth, h: innerHeight },
    pageHeight: document.documentElement.scrollHeight,
    root: {
      fontSize: root.fontSize,
      background: body.backgroundColor,
      color: body.color,
      fontFamily: body.fontFamily,
    },
    // Trié par surface : le premier est le fond dominant, pas une couleur d'accent.
    backgroundsBySurface: top(bgArea, 18),
    textColorsBySurface: top(textArea, 12),
    typeScale: top(typeScale, 22),
    fontFamilies: top(families, 6),
    spacingRhythm: top(spacing, 24),
    radii: top(radii, 10),
    shadows: top(shadows, 10),
    borders: top(borders, 10),
    containerWidths: top(widths, 6),
  };
}

/**
 * Résolution du binaire Chromium.
 * - CHROMIUM_PATH=/chemin/vers/chrome  → forcé
 * - /opt/pw-browsers/chromium existe   → environnement Claude Code distant
 * - sinon undefined                    → Playwright résout tout seul
 *   (sur ta machine : npx playwright install chromium)
 */
function chromiumPath() {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;
  const shared = '/opt/pw-browsers/chromium';
  return existsSync(shared) ? shared : undefined;
}

/**
 * Proxy sortant : uniquement si l'environnement en impose un
 * (cas des sessions Claude Code distantes). En local, aucun effet.
 */
function launchOpts() {
  const opts = { executablePath: chromiumPath() };
  const proxy = process.env.HTTPS_PROXY || process.env.https_proxy;
  if (proxy) {
    // bypass indispensable : sinon localhost:3000 (ta reconstruction) part dans le proxy
    opts.proxy = { server: proxy, bypass: 'localhost,127.0.0.1,::1,<local>' };
    // Le proxy re-termine TLS avec sa propre CA ; Chromium lancé par
    // Playwright n'hérite pas toujours du magasin système.
    opts.args = ['--ignore-certificate-errors'];
  }
  return opts;
}

const browser = await chromium.launch(launchOpts());
try {
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await ctx.newPage();

  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 }).catch(async () => {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  });
  await page.waitForTimeout(3000); // rendu client-side + fonts

  await page.screenshot({ path: join(outdir, 'desktop.png') });
  await page.screenshot({ path: join(outdir, 'desktop-full.png'), fullPage: true });

  const dom = await page.evaluate(extract);
  writeFileSync(join(outdir, 'dom.json'), JSON.stringify(dom, null, 2));

  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: join(outdir, 'mobile.png') });

  console.log(`OK  ${url}`);
  console.log(`    ${outdir}/desktop.png  desktop-full.png  mobile.png  dom.json`);
  console.log(`    fond dominant : ${dom.backgroundsBySurface[0]?.value}`);
  console.log(`    typo          : ${dom.fontFamilies[0]?.value}`);
  console.log(`    ${dom.typeScale.length} tailles de texte, ${dom.shadows.length} ombres, ${dom.radii.length} rayons`);
} finally {
  await browser.close();
}
