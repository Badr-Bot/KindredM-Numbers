#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Intègre .capture/gdocs/ au corpus : module « RESSOURCES GOOGLE »."""
import io
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from formation import ROOT, TRANSCRIPTIONS, ecrire, slug_court  # noqa: E402

GDOCS = os.path.join(ROOT, ".capture", "gdocs")
INDEX = os.path.join(ROOT, ".capture", "gdocs-index.json")
MSLUG = "ressources-google"
MODULE = "RESSOURCES GOOGLE"


def main():
    idx = json.load(io.open(INDEX, encoding="utf-8"))
    n = 0
    for e in idx:
        if "fichier" not in e:
            continue
        contenu = io.open(os.path.join(GDOCS, e["fichier"]), encoding="utf-8").read().strip()
        if len(contenu) < 120:
            continue
        n += 1
        # beaucoup s'appellent juste « Document » : on précise avec la leçon
        titre = e["titre"]
        if titre.lower() in ("document", "template", "doc video", "google doc", "doc"):
            titre = "%s (%s)" % (e["ref"].split("/", 1)[1].strip(), e["titre"])
        est_csv = e["fichier"].endswith(".csv")
        corps = ["---",
                 "module: %s" % MODULE,
                 "lecon: %d" % n,
                 'titre: "%s"' % titre.replace('"', "'")[:120],
                 'duree: ""',
                 'url: "%s"' % e["url"],
                 "statut: complet",
                 "source: google-docs-public",
                 "maj: 2026-08-15",
                 "---", "",
                 "# %02d — %s" % (n, titre), "",
                 "> **Source : %s Google public de la formation**" %
                 ("tableur" if est_csv else "document"),
                 "> Référencé par : %s" % e["ref"], "",
                 "## Contenu", ""]
        if est_csv:
            corps += ["```csv", contenu[:80000], "```", ""]
        else:
            corps += [contenu[:120000], ""]
        ecrire(os.path.join(TRANSCRIPTIONS, MSLUG, "%02d-%s.md" % (n, slug_court(titre))),
               "\n".join(corps))
    print("%d fiches RESSOURCES GOOGLE" % n)


if __name__ == "__main__":
    main()
