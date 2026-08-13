/* ═══════════════════════════════════════════════════════════════════════
   ASPIRER — parcourt tout le classroom Skool et capture chaque leçon.

   À lancer sur la machine de l'utilisateur (là où Skool est joignable).

       npm i -D playwright
       npx playwright install chromium
       node formation-master/scripts/aspirer.mjs

   Ouvre un navigateur visible avec un profil persistant (.skool-profile/).
   Première fois : tu te connectes toi-même à Skool dans cette fenêtre, puis
   tu appuies sur Entrée dans le terminal. Les fois suivantes, la session est
   déjà là, plus rien à faire.

   ⚠️  Le mot de passe est tapé par TOI dans TON navigateur. Le script ne le
       lit pas, ne le stocke pas, ne l'envoie nulle part.

   Produit : formation-master/.capture/capture-complete.json
   Ensuite : python3 scripts/importer.py .capture/capture-complete.json --ecrire
   ═══════════════════════════════════════════════════════════════════════ */

import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";

const ICI = path.dirname(new URL(import.meta.url).pathname);
const RACINE = path.resolve(ICI, "..");
const CAPTURE = path.join(RACINE, ".capture");
const PROFIL = path.join(RACINE, ".skool-profile");

const DEPART = process.env.SKOOL_URL || "https://www.skool.com/master/classroom";
const PAUSE = Number(process.env.SKOOL_PAUSE || 1200);   // ms entre deux pages
const LIMITE = Number(process.env.SKOOL_LIMITE || 0);    // 0 = pas de limite

const log = (...a) => console.log(...a);

function attendreEntree(msg) {
  return new Promise((res) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(msg, () => { rl.close(); res(); });
  });
}

/* Extrait tout ce qui est exploitable de la page courante. Tourne DANS le
   navigateur : pas d'accès au disque, lecture seule. */
async function extraire(page) {
  return await page.evaluate(() => {
    const res = { url: location.href, titre: document.title };

    // 1. le JSON embarqué par Next.js
    try {
      const e = document.getElementById("__NEXT_DATA__");
      if (e) res.next = JSON.parse(e.textContent);
    } catch (_) {}

    // 2. le texte visible
    const main = document.querySelector("main") || document.body;
    res.texte = (main.innerText || "").replace(/\n{3,}/g, "\n\n").slice(0, 200000);

    // 3. liens sortants (Notion & co)
    res.liens = [...main.querySelectorAll("a[href]")]
      .map((a) => ({ t: (a.innerText || "").trim(), h: a.href }))
      .filter((l) => l.h && !l.h.includes("skool.com/"));

    // 4. médias
    const m = new Set();
    document.querySelectorAll("video, source, iframe").forEach((e) => e.src && m.add(e.src));
    try {
      performance.getEntriesByType("resource").forEach((r) => {
        if (/\.(m3u8|mpd|mp4|m4a|vtt|srt)(\?|$)/i.test(r.name) ||
            /vimeo|youtube|loom|mux|wistia|bunny|cloudflarestream/i.test(r.name)) m.add(r.name);
      });
    } catch (_) {}
    res.medias = [...m];

    // 5. sous-titres — s'il y en a, la transcription est quasi gratuite
    res.sousTitres = [];
    document.querySelectorAll("track").forEach((t) =>
      res.sousTitres.push({ src: t.src, lang: t.srclang, label: t.label }));
    document.querySelectorAll("video").forEach((v) => {
      for (const p of v.textTracks || []) {
        const l = [...(p.cues || [])].map((c) => c.text);
        if (l.length) res.sousTitres.push({ label: p.label || p.language, lignes: l });
      }
    });
    return res;
  });
}

/* Cherche récursivement les objets « titre + description » dans le JSON. */
function moissonne(noeud, vus = new Set(), out = []) {
  if (!noeud || typeof noeud !== "object" || vus.has(noeud)) return out;
  vus.add(noeud);
  if (Array.isArray(noeud)) { noeud.forEach((n) => moissonne(n, vus, out)); return out; }
  const t = noeud.name || noeud.title || noeud.label;
  const d = noeud.description || noeud.content || noeud.body || noeud.metadata;
  const txt = typeof d === "string" ? d : (d && typeof d === "object" && (d.description || d.content)) || "";
  if (typeof t === "string" && t.trim() && typeof txt === "string" && txt.trim().length > 30) {
    out.push({
      titre: t.trim(),
      texte: txt.trim().slice(0, 100000),
      video: noeud.videoLink || noeud.videoUrl || noeud.video_url || "",
      duree: noeud.duration || noeud.videoLength || "",
      id: noeud.id || noeud.uuid || "",
    });
  }
  for (const k in noeud) { try { moissonne(noeud[k], vus, out); } catch (_) {} }
  return out;
}

const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  fs.mkdirSync(CAPTURE, { recursive: true });

  log("Ouverture du navigateur…");
  const ctx = await chromium.launchPersistentContext(PROFIL, {
    headless: false,
    viewport: { width: 1400, height: 900 },
  });
  const page = ctx.pages()[0] || (await ctx.newPage());

  await page.goto(DEPART, { waitUntil: "domcontentloaded", timeout: 60000 }).catch(() => {});
  await dormir(2500);

  if (!page.url().includes("/classroom")) {
    log("\n⚠️  Pas encore connecté à Skool.");
    log("   Connecte-toi dans la fenêtre qui vient de s'ouvrir, va sur le classroom,");
    log("   puis reviens ici.\n");
    await attendreEntree("   Appuie sur Entrée quand tu es sur le classroom… ");
    await page.goto(DEPART, { waitUntil: "domcontentloaded" }).catch(() => {});
    await dormir(2000);
  }

  // ── 1. Recenser toutes les URLs à visiter ───────────────────────────────
  const aVisiter = new Map();   // url -> étiquette
  aVisiter.set(page.url(), "accueil classroom");

  async function recolterLiens(etiquette) {
    const liens = await page.evaluate(() =>
      [...document.querySelectorAll('a[href*="/classroom"]')].map((a) => ({
        h: a.href.split("#")[0],
        t: (a.innerText || "").trim().replace(/\s+/g, " ").slice(0, 120),
      })));
    let neufs = 0;
    for (const l of liens) {
      if (!l.h.includes("/classroom")) continue;
      if (!aVisiter.has(l.h)) { aVisiter.set(l.h, l.t || etiquette); neufs++; }
    }
    return neufs;
  }

  log("\nRecensement des modules…");
  await recolterLiens("module");
  log(`  ${aVisiter.size} URL(s) au premier niveau.`);

  // Deuxième passe : on entre dans chaque module pour trouver ses leçons.
  for (const url of [...aVisiter.keys()]) {
    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
      await dormir(PAUSE);
      const n = await recolterLiens("leçon");
      if (n) log(`  +${n} depuis ${aVisiter.get(url).slice(0, 50)}`);
    } catch (e) { log(`  ⚠️  ${url} — ${e.message.split("\n")[0]}`); }
  }

  let urls = [...aVisiter.keys()];
  if (LIMITE > 0) urls = urls.slice(0, LIMITE);
  log(`\n${urls.length} page(s) à capturer.\n`);

  // ── 2. Capturer chaque page ─────────────────────────────────────────────
  const pages = [];
  let sousTitresTrouves = 0;
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
      await dormir(PAUSE);
      const d = await extraire(page);
      pages.push(d);
      sousTitresTrouves += (d.sousTitres || []).length;
      log(`[${i + 1}/${urls.length}] ${(d.titre || "").slice(0, 60)}  ` +
          `(${Math.round((d.texte || "").length / 1024)} Ko` +
          `${d.sousTitres?.length ? `, ${d.sousTitres.length} sous-titres ✅` : ""})`);
    } catch (e) {
      log(`[${i + 1}/${urls.length}] ⚠️  ${url} — ${e.message.split("\n")[0]}`);
    }
  }

  // ── 3. Écrire le résultat au format attendu par importer.py ─────────────
  const blocs = [];
  const vus = new Set();
  for (const p of pages) {
    for (const b of moissonne(p.next || {})) {
      const cle = b.titre + "|" + b.texte.slice(0, 80);
      if (!vus.has(cle)) { vus.add(cle); blocs.push(b); }
    }
  }

  const sortie = {
    capture: new Date().toISOString(),
    url: DEPART,
    sources: ["playwright", "__NEXT_DATA__", "page-visible"],
    modules: blocs,
    menu: [...aVisiter.entries()].map(([h, t]) => ({ titre: t, href: h })),
    medias: [...new Set(pages.flatMap((p) => p.medias || []))],
    sous_titres: pages.flatMap((p) => p.sousTitres || []),
    pages,
  };

  const dest = path.join(CAPTURE, "capture-complete.json");
  fs.writeFileSync(dest, JSON.stringify(sortie, null, 2), "utf-8");

  log(`\n✅ ${blocs.length} bloc(s) de contenu · ${sortie.medias.length} média(s) · ` +
      `${sousTitresTrouves} piste(s) de sous-titres`);
  log(`   → ${path.relative(process.cwd(), dest)} ` +
      `(${Math.round(fs.statSync(dest).size / 1024)} Ko)\n`);
  if (sousTitresTrouves) log("   🎉 Des sous-titres existent : la transcription sera quasi gratuite.\n");

  await ctx.close();
}

main().catch((e) => { console.error("\n❌", e); process.exit(1); });
