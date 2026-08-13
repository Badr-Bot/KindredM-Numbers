#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Importe un fichier produit par scripts/skool-capture.js.

    python3 scripts/importer.py ~/Downloads/skool-capture-....json            # aperçu
    python3 scripts/importer.py ~/Downloads/skool-capture-....json --ecrire   # applique

En aperçu (par défaut) : n'écrit RIEN, montre ce qui serait fait.
Avec --ecrire :
  - complète catalogue.txt avec les leçons trouvées et absentes ;
  - remplit la section « Ce que la leçon annonce » des fiches vides ;
  - passe leur statut de `a-transcrire` à `partiel`.

Une fiche dont la transcription audio est déjà remplie n'est jamais touchée.
"""

import io
import json
import os
import re
import sys
import unicodedata

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from formation import (ROOT, TRANSCRIPTIONS, CATALOGUE, lire, ecrire, champ,  # noqa: E402
                       slugify, slug_court, parse_catalogue)

MARQUEUR_VIDE = "_(colle ici l'intro"


def cle(titre):
    """Clé de rapprochement : on ignore accents, ponctuation et casse."""
    t = unicodedata.normalize("NFKD", titre or "")
    t = "".join(c for c in t if not unicodedata.combining(c)).lower()
    return re.sub(r"[^a-z0-9]+", "", t)


def charge(chemin):
    with io.open(chemin, encoding="utf-8") as f:
        d = json.load(f)
    blocs = d.get("modules") or []
    menu = d.get("menu") or []
    print("Capture du %s" % d.get("capture", "?"))
    print("  sources        : %s" % ", ".join(d.get("sources", [])))
    print("  blocs contenu  : %d" % len(blocs))
    print("  entrées menu   : %d" % len(menu))
    print("  médias         : %d" % len(d.get("medias") or []))
    st = d.get("sous_titres") or []
    print("  sous-titres    : %d %s" % (len(st), "✅ (transcription quasi gratuite)" if st else ""))
    print()
    return d, blocs, menu


def fiches():
    """{clé_titre: chemin} pour toutes les fiches de transcription."""
    idx = {}
    for rep, _, fichiers in os.walk(TRANSCRIPTIONS):
        for f in sorted(fichiers):
            if f.endswith(".md") and not f.startswith("_"):
                p = os.path.join(rep, f)
                idx.setdefault(cle(champ(lire(p), "titre", "")), p)
    return idx


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    chemin = os.path.expanduser(sys.argv[1])
    ecrire_pour_de_vrai = "--ecrire" in sys.argv
    if not os.path.exists(chemin):
        sys.exit("Fichier introuvable : %s" % chemin)

    d, blocs, menu = charge(chemin)
    idx = fiches()
    connus = set(idx)

    # ---- 1. leçons vues dans la capture mais absentes du catalogue ---------
    vus, nouveaux = set(), []
    for source in (menu, blocs):
        for e in source:
            titre = (e.get("titre") or "").strip()
            if not titre or len(titre) < 3:
                continue
            k = cle(titre)
            if k in vus:
                continue
            vus.add(k)
            if k not in connus:
                nouveaux.append(titre)

    if nouveaux:
        print("Leçons présentes dans la capture mais PAS dans catalogue.txt (%d) :" % len(nouveaux))
        for t in nouveaux[:40]:
            print("   • %s" % t)
        if len(nouveaux) > 40:
            print("   … et %d autres" % (len(nouveaux) - 40))
        if ecrire_pour_de_vrai:
            with io.open(CATALOGUE, "a", encoding="utf-8") as f:
                f.write("\n## À CLASSER (importé automatiquement — renomme ce module)\n")
                for t in nouveaux:
                    f.write(t + "\n")
            print("   → ajoutées à la fin de catalogue.txt sous « ## À CLASSER ».")
            print("   → range-les dans les bons modules, puis : python3 scripts/formation.py scaffold")
        print()

    # ---- 2. remplissage des fiches vides avec le texte de la page ---------
    remplies, ignorees = 0, 0
    for b in blocs:
        k = cle(b.get("titre"))
        p = idx.get(k)
        texte = (b.get("texte") or "").strip()
        if not p or len(texte) < 60:
            continue
        c = lire(p)
        if MARQUEUR_VIDE not in c:
            ignorees += 1   # déjà remplie à la main : on n'y touche pas
            continue
        bloc = texte
        if b.get("video"):
            bloc += "\n\n_URL vidéo repérée : %s_" % b["video"]
        c = c.replace(MARQUEUR_VIDE + " et le « Ce que tu vas apprendre » de la page)_", bloc)
        c = re.sub(r"^statut:.*$", "statut: partiel", c, count=1, flags=re.MULTILINE)
        if b.get("duree"):
            c = re.sub(r'^duree:.*$', 'duree: "%s"' % b["duree"], c, count=1, flags=re.MULTILINE)
        if ecrire_pour_de_vrai:
            ecrire(p, c)
        remplies += 1
        print("   %s %s" % ("✍️ " if ecrire_pour_de_vrai else "→ ", os.path.relpath(p, ROOT)))

    print("\n%d fiche(s) %s, %d déjà remplie(s) (intactes)."
          % (remplies, "remplie(s)" if ecrire_pour_de_vrai else "à remplir", ignorees))
    if not ecrire_pour_de_vrai:
        print("\nAperçu uniquement. Rien n'a été écrit. Relance avec --ecrire pour appliquer.")
    else:
        print("Ensuite : python3 scripts/formation.py etat")


if __name__ == "__main__":
    main()
