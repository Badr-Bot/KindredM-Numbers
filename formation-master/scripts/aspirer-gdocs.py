#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Exporte le contenu des Google Docs/Sheets publics référencés comme ressources
dans capture-v2.json. Produit .capture/gdocs/<slug>.txt|csv + gdocs-index.json.
"""
import io
import json
import os
import re
import sys
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CAP = os.path.join(ROOT, ".capture", "capture-v2.json")
DEST = os.path.join(ROOT, ".capture", "gdocs")
INDEX = os.path.join(ROOT, ".capture", "gdocs-index.json")

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from formation import slug_court  # noqa: E402

UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}


def telecharge(url):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=60) as r:
        data = r.read(5_000_000)
        return data, r.geturl()


def main():
    d = json.load(io.open(CAP, encoding="utf-8"))
    os.makedirs(DEST, exist_ok=True)
    vus, index = set(), []
    for c in d["courses"]:
        for l in c["lessons"]:
            for r in (l.get("resources") or []):
                u = r.get("link") or ""
                m_doc = re.search(r"docs\.google\.com/document/d/([\w-]+)", u)
                m_sheet = re.search(r"docs\.google\.com/spreadsheets/d/([\w-]+)", u)
                if not (m_doc or m_sheet):
                    continue
                fid = (m_doc or m_sheet).group(1)
                if fid in vus:
                    continue
                vus.add(fid)
                titre = (r.get("title") or "").strip() or fid
                ref = "%s / %02d %s" % (c["title"], l.get("ordre") or 0, l["title"])
                slug = slug_court(titre) + "-" + fid[:6]
                entree = {"id": fid, "titre": titre, "ref": ref, "url": u,
                          "type": "doc" if m_doc else "sheet"}
                try:
                    if m_doc:
                        data, _ = telecharge(
                            "https://docs.google.com/document/d/%s/export?format=txt" % fid)
                        chemin = os.path.join(DEST, slug + ".txt")
                    else:
                        data, _ = telecharge(
                            "https://docs.google.com/spreadsheets/d/%s/export?format=csv" % fid)
                        chemin = os.path.join(DEST, slug + ".csv")
                    texte = data.decode("utf-8", "replace")
                    if "<html" in texte[:400].lower():
                        raise RuntimeError("page de login (fichier privé)")
                    io.open(chemin, "w", encoding="utf-8").write(texte)
                    entree["fichier"] = os.path.basename(chemin)
                    entree["taille"] = len(texte)
                    print("  ✅ %-45s %5d car" % (titre[:45], len(texte)), flush=True)
                except Exception as e:
                    entree["erreur"] = str(e)[:120]
                    print("  🔒 %-45s %s" % (titre[:45], str(e)[:60]), flush=True)
                index.append(entree)
    io.open(INDEX, "w", encoding="utf-8").write(
        json.dumps(index, ensure_ascii=False, indent=1))
    ok = sum(1 for e in index if "fichier" in e)
    print("\n%d/%d fichiers Google exportés → %s" % (ok, len(index), DEST))


if __name__ == "__main__":
    main()
