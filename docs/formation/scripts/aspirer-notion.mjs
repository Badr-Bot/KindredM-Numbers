/* Aspire le CONTENU des pages Notion publiques référencées comme ressources
   dans capture-v2.json. Produit .capture/notion-docs.json.

       node formation-master/scripts/aspirer-notion.mjs
*/
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ICI = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.resolve(ICI, "..");
const CAPTURE = path.join(RACINE, ".capture");
const PROFIL = path.join(RACINE, ".skool-profile");
const DEST = path.join(CAPTURE, "notion-docs.json");
const PAUSE = Number(process.env.NOTION_PAUSE || 1500);

const log = (...a) => console.log(...a);
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

const capture = JSON.parse(fs.readFileSync(path.join(CAPTURE, "capture-v2.json"), "utf-8"));
const docs = new Map(); // url sans query -> {titre, url, refs: [module/leçon]}
for (const c of capture.courses) {
  for (const l of c.lessons || []) {
    for (const r of l.resources || []) {
      const u = (r.link || "").split("?")[0];
      if (!u || !/notion\.(site|so)\//.test(u)) continue;
      if (!docs.has(u)) docs.set(u, { titre: r.title || u, url: r.link, refs: [] });
      docs.get(u).refs.push(`${c.title} / ${String(l.ordre).padStart(2, "0")} ${l.title}`);
    }
  }
}
log(`${docs.size} documents Notion à aspirer.`);

// reprise
let sortie = { capture: new Date().toISOString(), docs: [] };
if (fs.existsSync(DEST)) {
  try { sortie = JSON.parse(fs.readFileSync(DEST, "utf-8")); } catch {}
}
const dejaFait = new Set(sortie.docs.map((d) => d.cle));

const ctx = await chromium.launchPersistentContext(PROFIL, {
  headless: false,
  viewport: { width: 1300, height: 900 },
});
const page = ctx.pages()[0] || (await ctx.newPage());

let i = 0;
for (const [cle, d] of docs) {
  i++;
  if (dejaFait.has(cle)) { log(`[${i}/${docs.size}] ⏭️ ${d.titre.slice(0, 50)}`); continue; }
  try {
    await page.goto(d.url, { waitUntil: "domcontentloaded", timeout: 90000 });
    await page.waitForLoadState("networkidle", { timeout: 30000 }).catch(() => {});
    await dormir(PAUSE + 3000);
    // Notion charge en scrollant : on descend jusqu'à stabilisation
    let prev = -1;
    for (let s = 0; s < 30; s++) {
      const h = await page.evaluate(() => {
        const sc = document.querySelector(".notion-scroller.vertical") || document.scrollingElement;
        sc.scrollTop = sc.scrollHeight;
        return sc.scrollHeight;
      }).catch(() => 0);
      await dormir(700);
      if (h === prev) break;
      prev = h;
    }
    const res = await page.evaluate(() => {
      const main = document.querySelector(".notion-page-content") ||
                   document.querySelector("main") || document.body;
      const texte = (main.innerText || "").replace(/\n{3,}/g, "\n\n");
      const titre = document.title.replace(/ \| Notion$/, "").trim();
      const images = [...main.querySelectorAll("img")].map((im) => im.src)
        .filter((s) => s && !s.startsWith("data:")).slice(0, 60);
      const liens = [...main.querySelectorAll("a[href]")].map((a) => a.href)
        .filter((h) => !h.includes("notion.so") && !h.includes("notion.site")).slice(0, 60);
      return { titre, texte, images, liens };
    });
    sortie.docs.push({ cle, titre: d.titre, titrePage: res.titre, url: d.url,
                       refs: d.refs, texte: res.texte, images: res.images, liens: res.liens });
    fs.writeFileSync(DEST, JSON.stringify(sortie, null, 1), "utf-8");
    log(`[${i}/${docs.size}] ${res.titre.slice(0, 55)} (${Math.round(res.texte.length / 1024)} Ko)`);
  } catch (e) {
    log(`[${i}/${docs.size}] ⚠️ ${d.titre.slice(0, 40)} — ${e.message.split("\n")[0]}`);
  }
}
log(`\n✅ ${sortie.docs.length} documents → ${DEST}`);
await ctx.close();
