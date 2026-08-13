#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Télécharge l'audio de toutes les vidéos de capture-v2.json (flux Mux HLS).
Les tokens expirent ~24 h après la capture : à lancer sans tarder.

    python scripts/telecharger-audio.py            # tout
    python scripts/telecharger-audio.py "ACQUIS"   # seulement les cours dont le titre matche

Sortie : .capture/audio/<module-slug>/NN-titre.m4a  (audio AAC, léger)
Reprise : un fichier déjà présent et non vide est sauté.
"""
import json
import os
import re
import subprocess
import sys
import time
import unicodedata
from concurrent.futures import ThreadPoolExecutor, as_completed

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CAP = os.path.join(ROOT, ".capture", "capture-v2.json")
AUDIO = os.path.join(ROOT, ".capture", "audio")

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from formation import slugify, slug_court  # noqa: E402


def ffmpeg_bin():
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except ImportError:
        return "ffmpeg"


FFMPEG = ffmpeg_bin()
FILTRE = sys.argv[1].lower() if len(sys.argv) > 1 else ""


def tache(mslug, num, titre, mux):
    dest_dir = os.path.join(AUDIO, mslug)
    os.makedirs(dest_dir, exist_ok=True)
    dest = os.path.join(dest_dir, "%02d-%s.m4a" % (num, slug_court(titre)))
    if os.path.exists(dest) and os.path.getsize(dest) > 10000:
        return ("skip", dest)
    url = "https://stream.mux.com/%s.m3u8?token=%s" % (mux["playbackId"], mux["token"])
    # les tokens Mux de Skool sont restreints par domaine : Referer obligatoire
    entetes = ("Referer: https://www.skool.com/\r\n"
               "Origin: https://www.skool.com\r\n"
               "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64)\r\n")
    cmd = [FFMPEG, "-y", "-loglevel", "error", "-headers", entetes, "-i", url,
           "-vn", "-acodec", "aac", "-b:a", "48k", "-ac", "1", dest]
    try:
        r = subprocess.run(cmd, capture_output=True, timeout=3600)
        if r.returncode == 0 and os.path.exists(dest) and os.path.getsize(dest) > 10000:
            return ("ok", dest)
        return ("err", dest + " : " + (r.stderr or b"").decode("utf-8", "replace")[-200:])
    except Exception as e:
        return ("err", dest + " : " + str(e)[:200])


def main():
    d = json.load(open(CAP, encoding="utf-8"))
    jobs = []
    for c in d["courses"]:
        if FILTRE and FILTRE not in c["title"].lower():
            continue
        mslug = slugify(c["title"])
        for l in c["lessons"]:
            if l.get("mux"):
                jobs.append((mslug, l.get("ordre") or 0, l.get("title") or "", l["mux"]))
    print("%d audio(s) à télécharger (ffmpeg : %s)" % (len(jobs), FFMPEG))
    ok = skip = err = 0
    t0 = time.time()
    with ThreadPoolExecutor(max_workers=4) as ex:
        futs = {ex.submit(tache, *j): j for j in jobs}
        for i, f in enumerate(as_completed(futs), 1):
            statut, info = f.result()
            if statut == "ok":
                ok += 1
            elif statut == "skip":
                skip += 1
            else:
                err += 1
                print("  ⚠️ %s" % info)
            if i % 10 == 0 or i == len(jobs):
                print("[%d/%d] ok=%d skip=%d err=%d (%.0f min)" %
                      (i, len(jobs), ok, skip, err, (time.time() - t0) / 60), flush=True)
    print("Fini : %d téléchargés, %d déjà là, %d erreurs." % (ok, skip, err))


if __name__ == "__main__":
    main()
