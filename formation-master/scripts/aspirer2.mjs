/* ═══════════════════════════════════════════════════════════════════════
   ASPIRER v2 — version adaptée au Skool de 2026.

   Le classroom n'expose plus de liens <a> : tout est dans le JSON Next.js.
   On lit donc directement `pageProps.allCourses`, puis l'arbre de chaque
   cours, puis chaque leçon via `?md=<id>`.

   Produit : formation-master/.capture/capture-v2.json
     { courses: [ { title, name, desc, lessons: [ { title, desc, resources,
       videoLenMs, mux: {playbackId, token, expire}, sousTitres, texte } ] } ] }
   ═══════════════════════════════════════════════════════════════════════ */

import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ICI = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.resolve(ICI, "..");
const CAPTURE = path.join(RACINE, ".capture");
const PROFIL = path.join(RACINE, ".skool-profile");

const GROUPE = process.env.SKOOL_GROUPE || "master";
const BASE = `https://www.skool.com/${GROUPE}/classroom`;
const PAUSE = Number(process.env.SKOOL_PAUSE || 1200);
const LIMITE = Number(process.env.SKOOL_LIMITE || 0); // 0 = tout
const SEULEMENT = (process.env.SKOOL_COURS || "").trim(); // filtre par nom de cours

const log = (...a) => console.log(...a);
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

function nextData(page) {
  return page.evaluate(() => {
    const e = document.getElementById("__NEXT_DATA__");
    try { return e ? JSON.parse(e.textContent) : null; } catch { return null; }
  });
}

/* Aplati l'arbre { course, children } en gardant l'ordre. */
function aplatir(noeud, out = []) {
  const c = noeud.course || {};
  out.push(c);
  for (const ch of noeud.children || []) aplatir(ch, out);
  return out;
}

async function main() {
  fs.mkdirSync(CAPTURE, { recursive: true });
  const ctx = await chromium.launchPersistentContext(PROFIL, {
    headless: false,
    viewport: { width: 1400, height: 900 },
  });
  const page = ctx.pages()[0] || (await ctx.newPage());

  log("Classroom…");
  await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 60000 });
  await dormir(2500);
  let nd = await nextData(page);
  const pp = nd?.props?.pageProps || {};
  let courses = pp.allCourses || pp.renderData?.allCourses || [];
  if (!courses.length) {
    log("❌ allCourses introuvable — pas connecté ?");
    await ctx.close();
    process.exit(2);
  }
  log(`${courses.length} cours trouvés.`);
  if (SEULEMENT) {
    courses = courses.filter((c) =>
      (c.metadata?.title || "").toLowerCase().includes(SEULEMENT.toLowerCase()));
    log(`Filtre « ${SEULEMENT} » → ${courses.length} cours.`);
  }

  // Reprise : on recharge ce qui a déjà été capturé et on le saute.
  const DEST = path.join(CAPTURE, "capture-v2.json");
  let sortie = { capture: new Date().toISOString(), groupe: GROUPE, courses: [] };
  if (fs.existsSync(DEST)) {
    try {
      const prev = JSON.parse(fs.readFileSync(DEST, "utf-8"));
      if (prev.courses?.length) { sortie = prev; log(`Reprise : ${prev.courses.length} cours déjà capturés.`); }
    } catch {}
  }
  // cours complets → à sauter ; cours entamés → à reprendre où on en était
  const dejaFait = new Set();
  const partiels = new Map();
  for (const cc of sortie.courses) {
    if ((cc.lessons?.length || 0) >= (cc.numModules || Infinity)) dejaFait.add(cc.id);
    else partiels.set(cc.id, cc);
  }
  sortie.courses = sortie.courses.filter((cc) => dejaFait.has(cc.id));
  let totalLecons = 0, totalST = 0;

  for (const c of courses) {
    const meta = c.metadata || {};
    if (dejaFait.has(c.id)) { log(`⏭️  ${meta.title} — déjà capturé`); continue; }
    if (!meta.hasAccess) { log(`⏭️  ${meta.title} — pas d'accès`); continue; }
    const cours = partiels.get(c.id) || {
      id: c.id, name: c.name, title: meta.title || c.name,
      desc: meta.desc || "", numModules: meta.numModules || 0, lessons: [],
    };
    const dejaLecons = cours.lessons.length;
    if (dejaLecons) log(`  (reprise à la leçon ${dejaLecons + 1})`);
    log(`\n📗 ${cours.title} (${cours.numModules} éléments)`);
    try {
      await page.goto(`${BASE}/${c.name}`, { waitUntil: "domcontentloaded", timeout: 45000 });
      await dormir(PAUSE);
    } catch (e) { log(`  ⚠️ ${e.message.split("\n")[0]}`); continue; }
    nd = await nextData(page);
    const arbre = nd?.props?.pageProps?.course;
    if (!arbre) { log("  ⚠️ arbre introuvable"); continue; }
    const unites = aplatir(arbre);
    // les « module » sont les leçons ; les « set » sont des sections
    const sections = unites.filter((u) => u.unitType === "set");
    const lecons = unites.filter((u) => u.unitType === "module");
    // mémorise la section parente de chaque leçon (ordre du flux aplati)
    let sectionCourante = "";
    const sectionDe = new Map();
    for (const u of unites) {
      if (u.unitType === "set") sectionCourante = u.metadata?.title || "";
      else if (u.unitType === "module") sectionDe.set(u.id, sectionCourante);
    }
    log(`  ${lecons.length} leçon(s), ${sections.length} section(s)`);

    let liste = LIMITE > 0 ? lecons.slice(0, LIMITE) : lecons;
    for (let i = dejaLecons; i < liste.length; i++) {
      const l = liste[i];
      const lm = l.metadata || {};
      const item = {
        id: l.id, name: l.name, ordre: i + 1,
        section: sectionDe.get(l.id) || "",
        title: lm.title || l.name,
        videoLenMs: lm.videoLenMs || 0,
        hasAccess: lm.hasAccess ?? 1,
        url: `${BASE}/${c.name}?md=${l.id}`,
      };
      if (!item.hasAccess) { cours.lessons.push(item); log(`  [${i + 1}/${liste.length}] 🔒 ${item.title}`); continue; }
      try {
        await page.goto(item.url, { waitUntil: "domcontentloaded", timeout: 45000 });
        await dormir(PAUSE);
        nd = await nextData(page);
        const p2 = nd?.props?.pageProps || {};
        // retrouve la leçon sélectionnée dans l'arbre pour avoir sa metadata complète
        const toutes = aplatir(p2.course || {});
        const moi = toutes.find((u) => u.id === l.id) || {};
        const mm = moi.metadata || {};
        item.metadata = mm;               // tout, on triera à l'import
        item.desc = mm.desc || "";
        try { item.resources = JSON.parse(mm.resources || "[]"); } catch { item.resources = []; }
        const v = p2.video || null;
        if (v && v.playbackId) {
          item.mux = { playbackId: v.playbackId, token: v.playbackToken, expire: v.expire, duration: v.duration };
          // le master m3u8 dit s'il y a des sous-titres
          const m3u8 = await page.evaluate(async (u) => {
            try { const r = await fetch(u); return r.ok ? await r.text() : ""; } catch { return ""; }
          }, `https://stream.mux.com/${v.playbackId}.m3u8?token=${v.playbackToken}`);
          item.m3u8_ok = m3u8.length > 0;
          const st = [...m3u8.matchAll(/#EXT-X-MEDIA:TYPE=SUBTITLES[^\n]*URI="([^"]+)"/g)].map((m) => m[1]);
          if (st.length) {
            item.sousTitres = [];
            for (const uri of st) {
              const abs = uri.startsWith("http") ? uri : `https://stream.mux.com${uri}`;
              const pl = await page.evaluate(async (u) => {
                try { const r = await fetch(u); return r.ok ? await r.text() : ""; } catch { return ""; }
              }, abs);
              const segs = pl.split("\n").filter((x) => x && !x.startsWith("#"));
              let vtt = "";
              for (const s of segs) {
                const su = s.startsWith("http") ? s : abs.replace(/\/[^/]*$/, "/") + s;
                vtt += await page.evaluate(async (u) => {
                  try { const r = await fetch(u); return r.ok ? await r.text() : ""; } catch { return ""; }
                }, su);
              }
              if (vtt) { item.sousTitres.push({ uri: abs, vtt }); totalST++; }
            }
          }
        }
        // texte visible en secours
        item.texte = await page.evaluate(() => {
          const m = document.querySelector("main") || document.body;
          return (m.innerText || "").replace(/\n{3,}/g, "\n\n").slice(0, 60000);
        });
        totalLecons++;
        log(`  [${i + 1}/${liste.length}] ${item.title.slice(0, 55)}` +
            `${item.mux ? " 🎬" : ""}${item.sousTitres?.length ? " 💬ST" : ""}` +
            `${item.desc ? ` (${Math.round(item.desc.length / 1024)}Ko)` : ""}`);
      } catch (e) {
        log(`  [${i + 1}/${liste.length}] ⚠️ ${item.title} — ${e.message.split("\n")[0]}`);
      }
      cours.lessons.push(item);
      // sauvegarde incrémentale à chaque leçon : un arrêt ne perd (presque) rien
      if (i % 5 === 4 || i === liste.length - 1) {
        fs.writeFileSync(DEST, JSON.stringify({ ...sortie, courses: [...sortie.courses, cours] }, null, 1), "utf-8");
      }
    }
    sortie.courses.push(cours);
    fs.writeFileSync(DEST, JSON.stringify(sortie, null, 1), "utf-8");
  }

  const dest = DEST;
  fs.writeFileSync(dest, JSON.stringify(sortie, null, 1), "utf-8");
  log(`\n✅ ${sortie.courses.length} cours · ${totalLecons} leçons capturées · ${totalST} piste(s) de sous-titres`);
  log(`   → ${dest} (${Math.round(fs.statSync(dest).size / 1024)} Ko)`);
  await ctx.close();
}

main().catch((e) => { console.error("\n❌", e); process.exit(1); });
