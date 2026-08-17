#!/usr/bin/env node
/**
 * shot.mjs — screenshot de MA reconstruction, au même cadrage que la référence.
 *
 *   node shot.mjs <url> <out.png> [width] [--full]
 *
 * Sert la boucle de diff : on compare toujours à cadrage identique.
 */
import { chromium } from 'playwright';
import { existsSync } from 'node:fs';

const [, , url, out = 'mine.png', width = '1440'] = process.argv;
const full = process.argv.includes('--full');

if (!url) {
  console.error('usage: node shot.mjs <url> <out.png> [width] [--full]');
  process.exit(1);
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
  const page = await browser.newPage({
    viewport: { width: Number(width), height: width === '390' ? 844 : 900 },
    deviceScaleFactor: 2,
  });
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 }).catch(() =>
    page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 })
  );
  await page.waitForTimeout(1500);
  await page.screenshot({ path: out, fullPage: full });
  console.log(`OK  ${out}  (${width}px${full ? ', pleine page' : ''})`);
} finally {
  await browser.close();
}
