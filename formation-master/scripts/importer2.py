#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Importe .capture/capture-v2.json (produit par aspirer2.mjs) et construit le
corpus complet, organisé par module (= cours Skool), dans l'ordre Skool :

    python3 scripts/importer2.py             # aperçu
    python3 scripts/importer2.py --ecrire    # applique

Pour chaque leçon :
  - sous-titres Mux  -> section Transcription (verbatim horodaté) -> statut complet
  - texte de la page -> section « Ce que la leçon annonce »       -> statut partiel
  - resources        -> section Ressources
Une fiche existante dont la transcription est déjà remplie n'est jamais écrasée.
"""

import io
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from formation import (ROOT, TRANSCRIPTIONS, NOTES, lire, ecrire,  # noqa: E402
                       slugify, slug_court, champ)

CAPTURE = os.path.join(ROOT, ".capture", "capture-v2.json")
MARQUEUR_TRANSCRIPTION = "_(colle ici le verbatim brut"


# ------------------------------------------------------------------ ProseMirror -> markdown
MOTS_FR = {"le", "la", "les", "de", "des", "un", "une", "et", "est", "vous",
           "nous", "je", "tu", "il", "elle", "on", "pas", "que", "qui", "pour",
           "dans", "avec", "sur", "ce", "cette", "ça", "être", "avoir", "faire"}


def _pm_texte(node):
    """Rend un nœud inline ProseMirror en markdown."""
    t = node.get("text", "")
    for m in node.get("marks", []):
        typ = m.get("type")
        if typ == "code":
            t = "`%s`" % t
        elif typ in ("bold", "strong"):
            t = "**%s**" % t
        elif typ in ("italic", "em"):
            t = "*%s*" % t
        elif typ == "link":
            t = "[%s](%s)" % (t, m.get("attrs", {}).get("href", ""))
    return t


def _pm_inline(nodes):
    out = []
    for n in nodes or []:
        typ = n.get("type")
        if typ == "text":
            out.append(_pm_texte(n))
        elif typ == "hardBreak":
            out.append("\n")
        elif typ == "image":
            out.append("![image](%s)" % n.get("attrs", {}).get("src", ""))
        else:
            out.append(_pm_inline(n.get("content")))
    return "".join(out)


def _pm_bloc(node, indent=0):
    typ = node.get("type")
    if typ == "heading":
        niveau = node.get("attrs", {}).get("level", 2)
        return "#" * min(niveau + 1, 6) + " " + _pm_inline(node.get("content"))
    if typ == "paragraph":
        return _pm_inline(node.get("content"))
    if typ == "horizontalRule":
        return "---"
    if typ in ("bulletList", "orderedList"):
        lignes = []
        for i, li in enumerate(node.get("content") or [], 1):
            puce = "-" if typ == "bulletList" else ("%d." % i)
            corps = "\n".join(_pm_bloc(b, indent + 1) for b in li.get("content") or [])
            lignes.append("  " * indent + "%s %s" % (puce, corps.strip()))
        return "\n".join(lignes)
    if typ == "codeBlock":
        return "```\n%s\n```" % _pm_inline(node.get("content"))
    if typ == "blockquote":
        return "\n".join("> " + l for l in
                         "\n".join(_pm_bloc(b) for b in node.get("content") or []).splitlines())
    return _pm_inline(node.get("content"))


def desc_vers_markdown(desc):
    """Skool stocke la page en « [v2][ ...json ProseMirror... ] »."""
    desc = (desc or "").strip()
    if not desc:
        return ""
    if desc.startswith("[v2]"):
        try:
            blocs = json.loads(desc[4:])
            md = "\n\n".join(b for b in (_pm_bloc(n) for n in blocs) if b.strip())
            return re.sub(r"\n{3,}", "\n\n", md).strip()
        except Exception:
            pass
    return desc


# ------------------------------------------------------------------ VTT
def vtt_vers_verbatim(vtt):
    """Concatène des fichiers VTT Mux en verbatim horodaté lisible."""
    cues = []          # (start_seconds, texte)
    vus = set()
    bloc_temps = None
    for ligne in vtt.splitlines():
        l = ligne.strip()
        if not l or l.startswith(("WEBVTT", "X-TIMESTAMP-MAP", "NOTE")):
            bloc_temps = None
            continue
        m = re.match(r"^(\d+):(\d+):(\d+)[.,](\d+)\s+-->", l)
        m2 = re.match(r"^(\d+):(\d+)[.,](\d+)\s+-->", l)
        if m:
            bloc_temps = int(m.group(1)) * 3600 + int(m.group(2)) * 60 + int(m.group(3))
            continue
        if m2:
            bloc_temps = int(m2.group(1)) * 60 + int(m2.group(2))
            continue
        if bloc_temps is None:
            continue
        txt = re.sub(r"<[^>]+>", "", l).strip()
        if not txt:
            continue
        cle = (bloc_temps, txt)
        if cle in vus:      # segments HLS qui se recouvrent
            continue
        vus.add(cle)
        cues.append((bloc_temps, txt))
    cues.sort(key=lambda x: x[0])
    # filtre qualité : piste en boucle ou pas en français = charabia d'ASR auto
    if cues:
        textes = [t for _, t in cues]
        uniques = len(set(textes)) / len(textes)
        mots = re.findall(r"[a-zàâçéèêëîïôùûü']+", " ".join(textes).lower())
        fr = sum(1 for m in mots if m in MOTS_FR) / max(len(mots), 1)
        if uniques < 0.5 or fr < 0.05:
            return ""          # inutilisable : mieux vaut rien que faux
    # regroupe par tranche de ~20 s pour rester lisible
    lignes, tampon, t0 = [], [], None
    for t, txt in cues:
        if t0 is None:
            t0 = t
        if t - t0 > 20 and tampon:
            lignes.append(_horo(t0) + " " + " ".join(tampon))
            tampon, t0 = [], t
        tampon.append(txt)
    if tampon:
        lignes.append(_horo(t0) + " " + " ".join(tampon))
    return "\n\n".join(lignes)


def _horo(s):
    h, r = divmod(int(s), 3600)
    mn, sec = divmod(r, 60)
    return ("[%d:%02d:%02d]" % (h, mn, sec)) if h else ("[%02d:%02d]" % (mn, sec))


def duree_txt(ms):
    if not ms:
        return ""
    s = int(ms / 1000)
    h, r = divmod(s, 3600)
    mn, sec = divmod(r, 60)
    return ("%d:%02d:%02d" % (h, mn, sec)) if h else ("%d:%02d" % (mn, sec))


# ------------------------------------------------------------------ fiches
def gabarit(module, num, titre, duree, url, statut, maj,
            annonce, ressources, verbatim, section):
    tete = ['---',
            'module: %s' % module,
            'lecon: %d' % num,
            'titre: "%s"' % titre.replace('"', "'"),
            'duree: "%s"' % duree,
            'url: "%s"' % url,
            'statut: %s' % statut,
            'source: skool-master',
            'maj: %s' % maj,
            '---', '',
            '# %02d — %s' % (num, titre), '']
    if section:
        tete.append('`Section Skool : %s`' % section)
        tete.append('')
    corps = []
    if annonce:
        corps += ['## Ce que la leçon annonce', '',
                  '> **Source : page de la leçon (texte Skool)**', '',
                  annonce, '']
    if ressources:
        corps += ['## Ressources', '']
        for r in ressources:
            u = r.get('link') or r.get('url') or ''
            corps.append('- [%s](%s)' % (r.get('title') or r.get('label') or u, u))
        corps.append('')
    if verbatim:
        corps += ['## Transcription', '',
                  '> **Source : sous-titres automatiques de la vidéo (Mux)**', '',
                  verbatim, '']
    else:
        corps += ['## Transcription', '',
                  '> **Source : audio**', '',
                  '_(colle ici le verbatim brut — voir ../../COMMENT-TRANSCRIRE.md)_', '']
    return "\n".join(tete + corps)


def note_placeholder(module, num, titre, statut, chemin_source):
    return """# %02d — %s

`Module : %s` · `Statut source : %s`

---

> 🚧 **Note pas encore rédigée.**
>
> Source : `%s`
""" % (num, titre, module, statut, chemin_source)


def main():
    ecrire_vrai = "--ecrire" in sys.argv
    if not os.path.exists(CAPTURE):
        sys.exit("Introuvable : %s" % CAPTURE)
    d = json.load(io.open(CAPTURE, encoding="utf-8"))
    maj = (d.get("capture") or "")[:10]

    stats = {"complet": 0, "partiel": 0, "a-transcrire": 0, "intact": 0, "verrou": 0}
    lignes_catalogue = []

    for cours in d.get("courses", []):
        module = cours["title"].strip()
        mslug = slugify(module)
        lignes_catalogue.append("## " + module)
        for l in cours.get("lessons", []):
            titre = (l.get("title") or "").strip() or "Sans titre"
            num = l.get("ordre") or 0
            lignes_catalogue.append(titre)
            if not l.get("hasAccess", 1):
                stats["verrou"] += 1
                continue
            # verbatim depuis les sous-titres
            verbatim = ""
            for st in l.get("sousTitres") or []:
                v = vtt_vers_verbatim(st.get("vtt") or "")
                if len(v) > len(verbatim):
                    verbatim = v
            annonce = desc_vers_markdown(l.get("desc"))
            ressources = [r for r in (l.get("resources") or [])
                          if r.get("link") or r.get("url")]
            statut = "complet" if verbatim else ("partiel" if (annonce or ressources) else "a-transcrire")
            stats[statut] += 1

            base = "%02d-%s.md" % (num, slug_court(titre))
            chemin = os.path.join(TRANSCRIPTIONS, mslug, base)
            rel = os.path.join("transcriptions", mslug, base)
            if os.path.exists(chemin) and MARQUEUR_TRANSCRIPTION not in lire(chemin):
                stats["intact"] += 1
                continue  # déjà transcrite à la main : intouchable
            contenu = gabarit(module, num, titre, duree_txt(l.get("videoLenMs")),
                              l.get("url") or "", statut, maj,
                              annonce, ressources, verbatim, l.get("section") or "")
            if ecrire_vrai:
                ecrire(chemin, contenu)
                chemin_note = os.path.join(NOTES, mslug, base)
                if not os.path.exists(chemin_note):
                    ecrire(chemin_note, note_placeholder(module, num, titre, statut, rel))
        lignes_catalogue.append("")

    # catalogue.txt reconstruit dans l'ordre Skool
    if ecrire_vrai:
        entete = ("# Catalogue généré depuis la capture Skool du %s\n"
                  "# (ordre = ordre du classroom)\n\n" % maj)
        ecrire(os.path.join(ROOT, "catalogue.txt"), entete + "\n".join(lignes_catalogue) + "\n")

    print("Modules : %d" % len(d.get("courses", [])))
    for k in ("complet", "partiel", "a-transcrire"):
        print("  %-13s %d" % (k, stats[k]))
    print("  intactes      %d (déjà transcrites à la main, non touchées)" % stats["intact"])
    print("  verrouillées  %d (pas d'accès)" % stats["verrou"])
    if not ecrire_vrai:
        print("\nAperçu seul. Relance avec --ecrire pour écrire les fiches + catalogue.txt.")


if __name__ == "__main__":
    main()
