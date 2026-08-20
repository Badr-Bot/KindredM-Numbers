#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Transcrit en masse des fichiers audio/vidéo et remplit les fiches de leçon.

    pip install faster-whisper
    python3 scripts/transcrire.py ~/videos-formation              # aperçu
    python3 scripts/transcrire.py ~/videos-formation --ecrire     # applique

Nomme tes fichiers avec le numéro de la leçon en tête, c'est le plus fiable :
    12 - L'algorithme Meta.mp4   →   transcriptions/media-buying/12-....md
Sinon le script rapproche par ressemblance de titre et demande confirmation.

Modèle : `medium` par défaut (bon compromis en français). `--modele large-v3`
pour la meilleure qualité, `--modele small` pour aller vite.

Coût : zéro, tout tourne en local. Compte ~1× à ~3× la durée de la vidéo sur un
CPU récent. Lance-le le soir sur tout le dossier et va te coucher.
"""

import argparse
import os
import re
import sys
import unicodedata

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from formation import ROOT, TRANSCRIPTIONS, lire, ecrire, champ  # noqa: E402

EXTENSIONS = (".mp4", ".mkv", ".mov", ".webm", ".m4a", ".mp3", ".wav", ".aac", ".flac", ".ogg")
MARQUEUR = "_(colle ici le verbatim brut"


def normalise(s):
    s = unicodedata.normalize("NFKD", s or "")
    s = "".join(c for c in s if not unicodedata.combining(c)).lower()
    return re.sub(r"[^a-z0-9]+", " ", s).strip()


def toutes_les_fiches():
    out = []
    for rep, _, fichiers in os.walk(TRANSCRIPTIONS):
        for f in sorted(fichiers):
            if f.endswith(".md") and not f.startswith("_"):
                p = os.path.join(rep, f)
                c = lire(p)
                out.append({
                    "chemin": p,
                    "num": int(champ(c, "lecon", "0") or 0),
                    "titre": champ(c, "titre", ""),
                    "module": champ(c, "module", ""),
                    "statut": champ(c, "statut", ""),
                })
    return out


def rapproche(nom_fichier, fiches):
    """Trouve la fiche correspondant à un fichier média."""
    base = os.path.splitext(os.path.basename(nom_fichier))[0]
    m = re.match(r"^\s*(\d{1,3})\b", base)
    if m:
        num = int(m.group(1))
        candidats = [f for f in fiches if f["num"] == num]
        if len(candidats) == 1:
            return candidats[0], "numéro"
    n = set(normalise(base).split())
    meilleur, score = None, 0.0
    for f in fiches:
        t = set(normalise(f["titre"]).split())
        if not t:
            continue
        s = len(n & t) / len(t)
        if s > score:
            meilleur, score = f, s
    if meilleur and score >= 0.5:
        return meilleur, "titre (%.0f %%)" % (score * 100)
    return None, "aucune correspondance"


def transcrire(chemin, modele):
    from faster_whisper import WhisperModel
    if not hasattr(transcrire, "_m"):
        print("  chargement du modèle « %s » (une seule fois)…" % modele)
        transcrire._m = WhisperModel(modele, device="auto", compute_type="auto")
    segments, info = transcrire._m.transcribe(
        chemin, language="fr", vad_filter=True, beam_size=5,
    )
    lignes, duree = [], 0.0
    for s in segments:
        h, reste = divmod(int(s.start), 3600)
        mn, sec = divmod(reste, 60)
        horo = ("%d:%02d:%02d" % (h, mn, sec)) if h else ("%02d:%02d" % (mn, sec))
        lignes.append("[%s] %s" % (horo, s.text.strip()))
        duree = s.end
    return "\n\n".join(lignes), duree


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("dossier")
    ap.add_argument("--ecrire", action="store_true", help="applique (sinon : aperçu seul)")
    ap.add_argument("--modele", default="medium", help="small | medium | large-v3")
    ap.add_argument("--forcer", action="store_true", help="réécrit même une fiche déjà transcrite")
    a = ap.parse_args()

    dossier = os.path.expanduser(a.dossier)
    if not os.path.isdir(dossier):
        sys.exit("Dossier introuvable : %s" % dossier)

    medias = sorted(f for f in os.listdir(dossier) if f.lower().endswith(EXTENSIONS))
    if not medias:
        sys.exit("Aucun fichier audio/vidéo dans %s" % dossier)

    fiches = toutes_les_fiches()
    print("%d fichier(s) média · %d fiche(s) de leçon\n" % (len(medias), len(fiches)))

    plan = []
    for nom in medias:
        fiche, comment = rapproche(nom, fiches)
        if not fiche:
            print("  ❓ %-50s → %s" % (nom[:50], comment))
            continue
        deja = MARQUEUR not in lire(fiche["chemin"])
        if deja and not a.forcer:
            print("  ⏭️  %-50s → déjà transcrite (--forcer pour écraser)" % nom[:50])
            continue
        print("  ✓  %-50s → %02d %s  [%s]" % (nom[:50], fiche["num"], fiche["titre"][:30], comment))
        plan.append((nom, fiche))

    if not plan:
        print("\nRien à faire.")
        return
    if not a.ecrire:
        print("\nAperçu seul — %d leçon(s) seraient transcrites. Relance avec --ecrire." % len(plan))
        return

    print("\nTranscription de %d fichier(s)…\n" % len(plan))
    for i, (nom, fiche) in enumerate(plan, 1):
        print("[%d/%d] %s" % (i, len(plan), nom))
        texte, duree = transcrire(os.path.join(dossier, nom), a.modele)
        c = lire(fiche["chemin"])
        c = c.replace(MARQUEUR + " — voir ../../COMMENT-TRANSCRIRE.md)_", texte)
        c = re.sub(r"^statut:.*$", "statut: complet", c, count=1, flags=re.MULTILINE)
        if duree:
            c = re.sub(r"^duree:.*$", 'duree: "%d:%02d"' % (int(duree // 60), int(duree % 60)),
                       c, count=1, flags=re.MULTILINE)
        ecrire(fiche["chemin"], c)
        print("       → %s (%d signes)\n" % (os.path.relpath(fiche["chemin"], ROOT), len(texte)))

    print("Fini. Ensuite :")
    print("  python3 scripts/formation.py etat")
    print("  puis demande à Claude de rédiger les notes Notion (skill « formation-ingest »).")


if __name__ == "__main__":
    main()
