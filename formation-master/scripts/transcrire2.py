#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Transcrit .capture/audio/<module-slug>/NN-titre.m4a dans la fiche
transcriptions/<module-slug>/NN-*.md correspondante (Whisper local).

    python scripts/transcrire2.py                     # tout, ordre de priorité
    python scripts/transcrire2.py master-acquisition  # un seul module

Reprise sûre : une fiche déjà transcrite (sans le marqueur « colle ici ») est
sautée. Statut -> complet, source « audio (Whisper local) ».
"""
import glob
import os
import re
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from formation import ROOT, TRANSCRIPTIONS, lire, ecrire  # noqa: E402

AUDIO = os.path.join(ROOT, ".capture", "audio")
MARQUEUR = "_(colle ici le verbatim brut"
MODELE = os.environ.get("WHISPER_MODELE", "small")

# ordre de traitement : le cœur de la formation d'abord
PRIORITE = ["master-acquisition", "0-to-1-master-one", "creative-insight",
            "master-ia", "cro-booster-ca-aov", "email-messaging-marketing",
            "master-research", "quick-wins", "reussir-son-q4", "mindset-os",
            "business-operations", "master-insider", "gerer-son-sav-ia-by-onially",
            "legal-administratif", "introduction", "membres-plus",
            "live-replays"]

_modele = None


def transcrire(chemin):
    global _modele
    from faster_whisper import WhisperModel
    if _modele is None:
        print("Chargement du modèle « %s »…" % MODELE, flush=True)
        _modele = WhisperModel(MODELE, device="cpu", compute_type="int8")
    segments, info = _modele.transcribe(chemin, language="fr",
                                        vad_filter=True, beam_size=1)
    lignes, tampon, t0, fin = [], [], None, 0.0
    for s in segments:
        if t0 is None:
            t0 = s.start
        if s.start - t0 > 20 and tampon:
            lignes.append(_horo(t0) + " " + " ".join(tampon))
            tampon, t0 = [], s.start
        tampon.append(s.text.strip())
        fin = s.end
    if tampon:
        lignes.append(_horo(t0) + " " + " ".join(tampon))
    return "\n\n".join(lignes), fin


def _horo(s):
    h, r = divmod(int(s), 3600)
    mn, sec = divmod(r, 60)
    return ("[%d:%02d:%02d]" % (h, mn, sec)) if h else ("[%02d:%02d]" % (mn, sec))


def fiche_pour(mslug, base_audio):
    m = re.match(r"^(\d+)-", base_audio)
    if not m:
        return None
    num = m.group(1)
    cands = glob.glob(os.path.join(TRANSCRIPTIONS, mslug, "%s-*.md" % num))
    return cands[0] if len(cands) == 1 else None


def une_passe(filtre):
    """Une passe sur tous les modules présents. Renvoie le nombre de fiches faites."""
    modules = [m for m in PRIORITE if os.path.isdir(os.path.join(AUDIO, m))]
    # modules hors liste de priorité, à la fin
    for m in (sorted(os.listdir(AUDIO)) if os.path.isdir(AUDIO) else []):
        if m not in modules and os.path.isdir(os.path.join(AUDIO, m)):
            modules.append(m)
    if filtre:
        modules = [m for m in modules if filtre in m]

    total_fait = 0
    for mslug in modules:
        fichiers = sorted(glob.glob(os.path.join(AUDIO, mslug, "*.m4a")))
        for fa in fichiers:
            base = os.path.basename(fa)
            fiche = fiche_pour(mslug, base)
            if not fiche:
                print("  ❓ pas de fiche pour %s/%s" % (mslug, base), flush=True)
                continue
            c = lire(fiche)
            if MARQUEUR not in c:
                continue        # déjà transcrite
            t0 = time.time()
            print("▶ %s/%s" % (mslug, base), flush=True)
            try:
                texte, duree = transcrire(fa)
            except Exception as e:
                print("  ⚠️ %s" % str(e)[:200], flush=True)
                continue
            if not texte.strip():
                print("  ⚠️ transcription vide", flush=True)
                continue
            c = c.replace("> **Source : audio**", "> **Source : audio (Whisper local, modèle %s)**" % MODELE)
            c = c.replace(MARQUEUR + " — voir ../../COMMENT-TRANSCRIRE.md)_", texte)
            c = re.sub(r"^statut:.*$", "statut: complet", c, count=1, flags=re.MULTILINE)
            if duree:
                mn, sec = divmod(int(duree), 60)
                h, mn2 = divmod(mn, 60)
                d = ("%d:%02d:%02d" % (h, mn2, sec)) if h else ("%d:%02d" % (mn, sec))
                c = re.sub(r'^duree: ""', 'duree: "%s"' % d, c, count=1, flags=re.MULTILINE)
            ecrire(fiche, c)
            total_fait += 1
            print("  ✅ %d signes en %.1f min (audio %.1f min)" %
                  (len(texte), (time.time() - t0) / 60, (duree or 0) / 60), flush=True)
    return total_fait


def main():
    filtre = sys.argv[1] if len(sys.argv) > 1 else ""
    total = 0
    vides = 0
    while True:
        fait = une_passe(filtre)
        total += fait
        # le téléchargement remplit les dossiers en continu : on repasse tant
        # qu'il reste (ou qu'il arrive) du travail ; 3 passes vides = terminé
        vides = vides + 1 if fait == 0 else 0
        if vides >= 3:
            break
        print("— passe finie (%d nouvelles, %d au total), on re-scanne dans 5 min —"
              % (fait, total), flush=True)
        time.sleep(300)
    print("\nFini : %d fiche(s) transcrites." % total, flush=True)


if __name__ == "__main__":
    main()
