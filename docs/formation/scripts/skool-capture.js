/* ═══════════════════════════════════════════════════════════════════════
   SKOOL CAPTURE — aspire tout le texte d'un classroom Skool d'un seul coup.

   ⚠️  Ce script ne fait que LIRE la page et télécharger un fichier.
       Il n'envoie rien nulle part, ne modifie rien sur Skool.

   ── MODE D'EMPLOI (2 minutes, sur ordinateur) ─────────────────────────
   1. Ouvre la formation dans Chrome, sur n'importe quelle leçon.
   2. Touche F12  →  onglet « Console ».
   3. Chrome demande peut-être de taper « allow pasting » : fais-le.
   4. Colle TOUT ce fichier, puis Entrée.
   5. Un fichier « skool-capture-....json » se télécharge.
   6. Donne-moi ce fichier (ou dépose-le dans Google Drive).

   Ce que ça récupère sans ouvrir une seule vidéo :
     - la liste complète des modules et des leçons,
     - le titre, la durée et l'URL de chaque leçon,
     - le texte de description de chaque leçon (l'« intro » + « ce que tu
       vas apprendre » — c'est déjà une grosse partie du contenu),
     - les liens de ressources (Notion, etc.),
     - l'URL de la vidéo quand elle est exposée par la page.

   Ce que ça ne récupère PAS : l'audio des vidéos. Voir COMMENT-TRANSCRIRE.md.
   ═══════════════════════════════════════════════════════════════════════ */

(async () => {
  const OUT = { capture: new Date().toISOString(), url: location.href, sources: [], modules: [], brut: null };

  const log = (...a) => console.log("%c[skool-capture]", "color:#22c55e;font-weight:bold", ...a);

  // ── 1. La voie royale : le JSON que Next.js embarque dans la page ──────
  // Skool est une app Next.js : l'arbre complet du classroom est souvent
  // déjà là, sans avoir à cliquer sur quoi que ce soit.
  function nextData() {
    const el = document.getElementById("__NEXT_DATA__");
    if (el) { try { return JSON.parse(el.textContent); } catch (e) {} }
    // Next.js récent (app router) : les données sont poussées dans un flux.
    if (Array.isArray(self.__next_f)) {
      const txt = self.__next_f.map((x) => (Array.isArray(x) ? x[1] : "")).filter((s) => typeof s === "string").join("");
      if (txt.length > 100) return { __flux: txt };
    }
    return null;
  }

  // ── 2. Repérage récursif des objets « leçon » dans n'importe quel JSON ──
  // On ne connaît pas le schéma exact de Skool et il change : plutôt que de
  // deviner des noms de champs, on cherche toute forme d'objet qui a un
  // titre ET (une description | une vidéo | un id de leçon).
  const CLES_TITRE = ["name", "title", "label"];
  const CLES_TEXTE = ["description", "content", "body", "metadata", "text", "richText", "notes"];
  const CLES_VIDEO = ["videoLink", "video_url", "videoUrl", "video", "mediaUrl", "hlsUrl", "playbackId"];

  function texteDe(v) {
    if (typeof v === "string") return v;
    if (v && typeof v === "object") {
      for (const k of CLES_TEXTE) if (typeof v[k] === "string" && v[k].length > 20) return v[k];
    }
    return "";
  }

  function moissonne(noeud, vus = new Set(), out = []) {
    if (!noeud || typeof noeud !== "object" || vus.has(noeud)) return out;
    vus.add(noeud);
    if (Array.isArray(noeud)) { noeud.forEach((n) => moissonne(n, vus, out)); return out; }

    let titre = "";
    for (const k of CLES_TITRE) if (typeof noeud[k] === "string" && noeud[k].trim()) { titre = noeud[k].trim(); break; }

    let texte = "";
    for (const k of CLES_TEXTE) { const t = texteDe(noeud[k]); if (t.length > texte.length) texte = t; }

    let video = "";
    for (const k of CLES_VIDEO) if (typeof noeud[k] === "string" && noeud[k]) { video = noeud[k]; break; }

    if (titre && (texte.length > 40 || video)) {
      out.push({
        titre,
        texte: texte.slice(0, 100000),
        video,
        id: noeud.id || noeud.uuid || noeud.slug || "",
        duree: noeud.duration || noeud.length || noeud.videoLength || "",
        parent: noeud.parentId || noeud.parent_id || "",
      });
    }
    for (const k in noeud) { try { moissonne(noeud[k], vus, out); } catch (e) {} }
    return out;
  }

  const nd = nextData();
  if (nd) {
    OUT.sources.push("__NEXT_DATA__");
    if (nd.__flux) {
      OUT.brut = nd.__flux.slice(0, 4_000_000);
      // Le flux est du texte : on en extrait les objets JSON récupérables.
      const trouves = [];
      for (const m of nd.__flux.matchAll(/\{"[^\n]{80,}?\}\s*(?=[,\]\}]|$)/g)) {
        try { trouves.push(JSON.parse(m[0])); } catch (e) {}
      }
      OUT.modules = moissonne(trouves);
    } else {
      OUT.modules = moissonne(nd);
    }
    log(OUT.modules.length, "bloc(s) de contenu trouvé(s) dans le JSON de la page");
  }

  // ── 3. Filet de sécurité : ce qui est visible à l'écran ────────────────
  const liens = [...document.querySelectorAll('a[href*="/classroom/"]')].map((a) => ({
    titre: (a.innerText || "").trim().replace(/\s+/g, " "),
    href: a.href,
  })).filter((x) => x.titre);
  OUT.menu = liens;
  if (liens.length) { OUT.sources.push("menu-dom"); log(liens.length, "leçon(s) dans le menu"); }

  const principal = document.querySelector("main") || document.body;
  OUT.page_visible = {
    titre: document.title,
    texte: (principal.innerText || "").replace(/\n{3,}/g, "\n\n").slice(0, 200000),
    liens_ressources: [...principal.querySelectorAll("a[href]")]
      .map((a) => ({ texte: (a.innerText || "").trim(), href: a.href }))
      .filter((l) => l.href && !l.href.includes("skool.com/")),
  };
  OUT.sources.push("page-visible");

  // ── 4. URLs vidéo réellement chargées par le lecteur ───────────────────
  const medias = new Set();
  document.querySelectorAll("video, source, iframe").forEach((e) => { if (e.src) medias.add(e.src); });
  try {
    performance.getEntriesByType("resource").forEach((r) => {
      if (/\.(m3u8|mpd|mp4|m4a|vtt|srt)(\?|$)/i.test(r.name) || /vimeo|youtube|loom|mux|wistia|bunny|cloudflarestream/i.test(r.name)) medias.add(r.name);
    });
  } catch (e) {}
  OUT.medias = [...medias];
  log(OUT.medias.length, "URL(s) média repérée(s)");

  // ── 5. Sous-titres déjà présents dans le lecteur (le jackpot s'il y en a) ─
  OUT.sous_titres = [];
  document.querySelectorAll("track").forEach((t) => OUT.sous_titres.push({ src: t.src, lang: t.srclang, label: t.label }));
  document.querySelectorAll("video").forEach((v) => {
    for (const p of v.textTracks || []) {
      const lignes = [...(p.cues || [])].map((c) => c.text);
      if (lignes.length) OUT.sous_titres.push({ label: p.label || p.language, lignes });
    }
  });
  if (OUT.sous_titres.length) log("✅ SOUS-TITRES TROUVÉS —", OUT.sous_titres.length, "piste(s). Dis-le moi, ça change tout.");
  else log("Pas de piste de sous-titres exposée sur cette page.");

  // ── 6. Téléchargement ─────────────────────────────────────────────────
  const blob = new Blob([JSON.stringify(OUT, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "skool-capture-" + new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-") + ".json";
  document.body.appendChild(a); a.click(); a.remove();

  log("Terminé →", a.download, "(" + Math.round(blob.size / 1024) + " Ko)");
  log("Blocs de contenu :", OUT.modules.length, "| Menu :", liens.length, "| Médias :", OUT.medias.length, "| Sous-titres :", OUT.sous_titres.length);
  console.log(OUT);
})();
