/* SKOOL CAPTURE — version courte, à copier depuis le chat et coller dans la
   console Chrome (F12 → Console → taper « allow pasting » si demandé).

   Lit le JSON que Skool embarque déjà dans la page, en extrait tous les
   titres + descriptions, met le résultat dans le presse-papier ET le
   télécharge. Ne modifie rien, n'envoie rien. */

(() => {
  const e = document.getElementById("__NEXT_DATA__");
  if (!e) return console.error("__NEXT_DATA__ absent — préviens Claude.");
  const out = [], vus = new Set();
  (function walk(n) {
    if (!n || typeof n !== "object" || vus.has(n)) return;
    vus.add(n);
    if (Array.isArray(n)) return n.forEach(walk);
    const t = n.name || n.title || n.label;
    const d = n.description || n.content || n.body || n.metadata;
    const txt = typeof d === "string" ? d : (d && typeof d === "object" && (d.description || d.content)) || "";
    if (typeof t === "string" && t.trim() && typeof txt === "string" && txt.trim().length > 30)
      out.push("### " + t.trim() + "\n" + txt.trim());
    for (const k in n) try { walk(n[k]); } catch (_) {}
  })(JSON.parse(e.textContent));

  const r = "URL: " + location.href + "\n\n" + [...new Set(out)].join("\n\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([r], { type: "text/plain" }));
  a.download = "skool.txt";
  a.click();
  try { copy(r); } catch (_) {}
  console.log("%c✅ " + out.length + " bloc(s), " + Math.round(r.length / 1024) + " Ko — copié + téléchargé (skool.txt)", "color:#22c55e;font-size:14px");
})();
