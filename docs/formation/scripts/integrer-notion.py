#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Intègre .capture/notion-docs.json au corpus : un pseudo-module
« RESSOURCES NOTION » avec une fiche par document.

    python scripts/integrer-notion.py --ecrire
"""
import io
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from formation import ROOT, TRANSCRIPTIONS, NOTES, ecrire, slug_court  # noqa: E402

CAP = os.path.join(ROOT, ".capture", "notion-docs.json")
MSLUG = "ressources-notion"
MODULE = "RESSOURCES NOTION"


def main():
    vrai = "--ecrire" in sys.argv
    d = json.load(io.open(CAP, encoding="utf-8"))
    maj = (d.get("capture") or "")[:10]
    n = 0
    for i, doc in enumerate(d.get("docs", []), 1):
        titre = (doc.get("titrePage") or doc.get("titre") or "").strip() or "Sans titre"
        texte = (doc.get("texte") or "").strip()
        if len(texte) < 200:
            print("  ⚠️ trop court, ignoré : %s" % titre[:60])
            continue
        refs = doc.get("refs") or []
        liens = doc.get("liens") or []
        corps = ["---",
                 "module: %s" % MODULE,
                 "lecon: %d" % i,
                 'titre: "%s"' % titre.replace('"', "'"),
                 'duree: ""',
                 'url: "%s"' % (doc.get("url") or ""),
                 "statut: complet",
                 "source: notion-public",
                 "maj: %s" % maj,
                 "---", "",
                 "# %02d — %s" % (i, titre), "",
                 "> **Source : document Notion public de la formation**",
                 "> Référencé par : %s" % ("; ".join(refs[:6]) or "—"), "",
                 "## Contenu du document", "",
                 texte, ""]
        if liens:
            corps += ["## Liens externes cités", ""]
            corps += ["- %s" % u for u in liens[:40]]
            corps.append("")
        if vrai:
            base = "%02d-%s.md" % (i, slug_court(titre))
            ecrire(os.path.join(TRANSCRIPTIONS, MSLUG, base), "\n".join(corps))
        n += 1
    print("%d documents intégrés%s." % (n, "" if vrai else " (aperçu, rien écrit)"))


if __name__ == "__main__":
    main()
