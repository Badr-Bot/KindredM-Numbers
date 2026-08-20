#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Évalue la qualité des pistes de sous-titres de capture-v2.json.

Deux signaux de charabia :
  - taux de répétition (le même sous-titre en boucle) ;
  - absence de mots-outils français (piste auto en anglais).
"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CAP = os.path.join(ROOT, ".capture", "capture-v2.json")

MOTS_FR = {"le", "la", "les", "de", "des", "un", "une", "et", "est", "vous",
           "nous", "je", "tu", "il", "elle", "on", "pas", "que", "qui", "pour",
           "dans", "avec", "sur", "ce", "cette", "ça", "être", "avoir", "faire"}


def lignes_texte(vtt):
    out = []
    for l in vtt.splitlines():
        l = l.strip()
        if not l or l.startswith(("WEBVTT", "X-TIMESTAMP-MAP", "NOTE")) or "-->" in l or l.isdigit():
            continue
        out.append(re.sub(r"<[^>]+>", "", l))
    return out


def score(vtt):
    lignes = lignes_texte(vtt)
    if not lignes:
        return None
    uniques = len(set(lignes)) / len(lignes)
    mots = re.findall(r"[a-zàâçéèêëîïôùûü']+", " ".join(lignes).lower())
    fr = sum(1 for m in mots if m in MOTS_FR) / max(len(mots), 1)
    return {"lignes": len(lignes), "uniques": round(uniques, 2), "fr": round(fr, 3)}


d = json.load(open(CAP, encoding="utf-8"))
bons, charabia, sans = 0, [], 0
for c in d["courses"]:
    for l in c["lessons"]:
        sts = l.get("sousTitres") or []
        if not sts:
            sans += 1
            continue
        s = max((score(st.get("vtt") or "") for st in sts),
                key=lambda x: (x or {}).get("fr", 0) if x else 0)
        if s is None:
            sans += 1
        elif s["uniques"] < 0.5 or s["fr"] < 0.05:
            charabia.append((c["title"], l["ordre"], l["title"], s))
        else:
            bons += 1

print("pistes correctes :", bons)
print("sans sous-titres :", sans)
print("charabia         :", len(charabia))
for m, n, t, s in charabia[:80]:
    print("  %-24s %02d %-45s uniq=%.2f fr=%.3f" % (m[:24], n, t[:45], s["uniques"], s["fr"]))
