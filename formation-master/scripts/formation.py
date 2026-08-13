#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Outil unique du projet « Formation MASTER ».
Aucune dépendance : python3 tout seul suffit.

    python3 scripts/formation.py scaffold   # catalogue.txt -> crée les fichiers manquants
    python3 scripts/formation.py etat       # où en est la transcription (+ écrit CATALOGUE.md)
    python3 scripts/formation.py pack       # construit dist/ à uploader dans le GPT / Projet Claude

`scaffold` n'écrase JAMAIS un fichier existant. On peut le relancer sans risque.
"""

import os
import re
import sys
import unicodedata

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CATALOGUE = os.path.join(ROOT, "catalogue.txt")
TRANSCRIPTIONS = os.path.join(ROOT, "transcriptions")
NOTES = os.path.join(ROOT, "notes")
DIST = os.path.join(ROOT, "dist")

# Un fichier de pack au-delà de cette taille est coupé en plusieurs parties,
# pour rester digeste pour l'upload et pour le découpage interne du modèle.
TAILLE_MAX_PACK = 700_000  # caractères

STATUTS = ("a-transcrire", "partiel", "complet")


# ---------------------------------------------------------------- utilitaires

def slugify(texte):
    """« L'algorithme Meta, ce que personne ne t'explique » -> « algorithme-meta-ce-que-personne-ne-t-explique »"""
    t = unicodedata.normalize("NFKD", texte)
    t = "".join(c for c in t if not unicodedata.combining(c))
    t = t.lower()
    t = re.sub(r"[^a-z0-9]+", "-", t)
    t = re.sub(r"-{2,}", "-", t).strip("-")
    return t or "sans-titre"


def slug_court(texte, mots=8):
    """Slug lisible : on garde les premiers mots significatifs."""
    plein = slugify(texte)
    bouts = [b for b in plein.split("-") if b]
    return "-".join(bouts[:mots]) or "sans-titre"


def lire(chemin):
    with open(chemin, encoding="utf-8") as f:
        return f.read()


def ecrire(chemin, contenu):
    os.makedirs(os.path.dirname(chemin), exist_ok=True)
    with open(chemin, "w", encoding="utf-8") as f:
        f.write(contenu)


def champ(contenu, nom, defaut=""):
    """Lit un champ du frontmatter YAML (format simple `cle: valeur`)."""
    m = re.search(r"^%s:\s*(.*)$" % re.escape(nom), contenu, re.MULTILINE)
    if not m:
        return defaut
    return m.group(1).strip().strip('"').strip("'")


# ---------------------------------------------------------------- catalogue

def parse_catalogue():
    """-> [(nom_module, [titre_lecon, ...]), ...]"""
    if not os.path.exists(CATALOGUE):
        sys.exit("catalogue.txt introuvable.")
    modules, courant = [], None
    for brute in lire(CATALOGUE).splitlines():
        ligne = brute.strip()
        if not ligne:
            continue
        if ligne.startswith("##"):
            courant = (ligne.lstrip("#").strip(), [])
            modules.append(courant)
        elif ligne.startswith("#"):
            continue  # commentaire
        elif courant is not None:
            courant[1].append(ligne)
        else:
            sys.exit("Leçon « %s » déclarée avant tout module (## Nom du module)." % ligne)
    if not modules:
        sys.exit("Aucun module trouvé dans catalogue.txt.")
    return modules


# ---------------------------------------------------------------- gabarits

def gabarit_transcription(module, num, titre):
    return """---
module: %s
lecon: %d
titre: "%s"
duree: ""
url: ""
statut: a-transcrire
source: skool-master
maj: ""
---

# %02d — %s

## Ce que la leçon annonce

> **Source : page de la leçon (texte Skool)**

_(colle ici l'intro et le « Ce que tu vas apprendre » de la page)_

## Ressources

- Notion : _(lien)_

## Transcription

> **Source : audio**

_(colle ici le verbatim brut — voir ../../COMMENT-TRANSCRIRE.md)_

## Slides / captures

> **Source : slides**

_(recopie le texte des slides ; c'est souvent la partie la plus dense)_

## À vérifier

- [ ] titre complet de la leçon
- [ ] durée
- [ ] URL Skool
""" % (module, num, titre.replace('"', "'"), num, titre)


def gabarit_note(module, num, titre, chemin_source):
    return """# %02d — %s

`Module : %s` · `Statut source : a-transcrire`

---

> 🚧 **Note pas encore rédigée** — la transcription source est vide.
>
> 1. Transcris la vidéo (voir `COMMENT-TRANSCRIRE.md`)
> 2. Colle le verbatim dans `%s`
> 3. Demande à Claude : **« ingère la leçon %d du module %s »**
""" % (num, titre, module, chemin_source, num, module)


# ---------------------------------------------------------------- commandes

def cmd_scaffold():
    modules = parse_catalogue()
    crees, existants = 0, 0
    for nom_module, lecons in modules:
        mslug = slugify(nom_module)
        dir_t = os.path.join(TRANSCRIPTIONS, mslug)
        dir_n = os.path.join(NOTES, mslug)
        os.makedirs(dir_t, exist_ok=True)
        os.makedirs(dir_n, exist_ok=True)
        # On indexe par slug, en COMPTANT les occurrences : deux leçons peuvent
        # partager le même slug (ex. « Partie 1 » / « Partie 2 » tronqués). Chaque
        # fichier existant ne peut « couvrir » qu'une seule entrée du catalogue.
        deja = {}
        for f in os.listdir(dir_t):
            m = re.match(r"^\d+-(.+)\.md$", f)
            if m:
                deja[m.group(1)] = deja.get(m.group(1), 0) + 1
        for i, titre in enumerate(lecons, start=1):
            lslug = slug_court(titre)
            if deja.get(lslug, 0) > 0:
                # Déjà sur le disque (même si le numéro a changé depuis) : on ne touche à rien.
                deja[lslug] -= 1
                existants += 1
                continue
            base = "%02d-%s.md" % (i, lslug)
            rel = os.path.join("transcriptions", mslug, base)
            ecrire(os.path.join(dir_t, base), gabarit_transcription(nom_module, i, titre))
            ecrire(os.path.join(dir_n, base), gabarit_note(nom_module, i, titre, rel))
            crees += 1
            print("  + %s" % rel)
    print("\n%d leçon(s) créée(s), %d déjà présente(s)." % (crees, existants))
    if crees:
        print("Rien n'a été écrasé.")


def inventaire():
    """Scanne le disque -> [(module_slug, module_nom, [(num, titre, statut, duree, chemin)])]"""
    res = []
    if not os.path.isdir(TRANSCRIPTIONS):
        return res
    for mslug in sorted(os.listdir(TRANSCRIPTIONS)):
        d = os.path.join(TRANSCRIPTIONS, mslug)
        if not os.path.isdir(d):
            continue
        lecons, nom_module = [], mslug
        for f in sorted(os.listdir(d)):
            if not f.endswith(".md") or f.startswith("_"):
                continue
            c = lire(os.path.join(d, f))
            nom_module = champ(c, "module", mslug) or mslug
            lecons.append((
                int(champ(c, "lecon", "0") or 0),
                champ(c, "titre", f),
                champ(c, "statut", "a-transcrire"),
                champ(c, "duree", ""),
                os.path.join(mslug, f),
            ))
        lecons.sort(key=lambda x: x[0])
        res.append((mslug, nom_module, lecons))
    return res


def cmd_etat():
    inv = inventaire()
    icone = {"complet": "✅", "partiel": "🟡", "a-transcrire": "⬜"}
    total = faits = 0
    lignes = ["# Catalogue — état de la transcription", "",
              "_Fichier généré par `python3 scripts/formation.py etat`. Ne pas éditer à la main._", ""]
    for _, nom_module, lecons in inv:
        n_ok = sum(1 for l in lecons if l[2] == "complet")
        n_part = sum(1 for l in lecons if l[2] == "partiel")
        total += len(lecons)
        faits += n_ok
        lignes += ["## %s" % nom_module, "",
                   "%d leçons · %d complètes · %d partielles" % (len(lecons), n_ok, n_part), "",
                   "| | # | Leçon | Durée | Statut |", "|-|---|-------|-------|--------|"]
        for num, titre, statut, duree, chemin in lecons:
            lignes.append("| %s | %d | [%s](transcriptions/%s) | %s | %s |" % (
                icone.get(statut, "⬜"), num, titre.replace("|", "\\|"), chemin, duree or "—", statut))
        lignes.append("")
        print("%-34s %2d leçons  ✅%-3d 🟡%-3d ⬜%d" % (
            nom_module[:34], len(lecons), n_ok, n_part, len(lecons) - n_ok - n_part))
    pct = (100 * faits // total) if total else 0
    entete = "**%d leçons au total · %d complètes (%d %%)**" % (total, faits, pct)
    lignes.insert(3, entete)
    lignes.insert(4, "")
    ecrire(os.path.join(ROOT, "CATALOGUE.md"), "\n".join(lignes) + "\n")
    print("\n%s" % entete.replace("**", ""))
    print("→ CATALOGUE.md mis à jour.")


def corps(contenu):
    """Enlève le frontmatter."""
    if contenu.startswith("---"):
        bouts = contenu.split("---", 2)
        if len(bouts) == 3:
            return bouts[2].lstrip("\n")
    return contenu


def cmd_pack():
    inv = inventaire()
    if os.path.isdir(DIST):
        for f in os.listdir(DIST):
            if f.endswith(".md"):
                os.remove(os.path.join(DIST, f))
    os.makedirs(DIST, exist_ok=True)

    index = ["# INDEX — Formation MASTER",
             "",
             "Ce document liste TOUT ce que contient la base de connaissance.",
             "Si une leçon est marquée ⬜ non transcrite, son contenu n'existe pas :",
             "il ne faut jamais répondre à sa place.",
             ""]
    fichiers = 0

    for i, (mslug, nom_module, lecons) in enumerate(inv, start=1):
        utiles = [l for l in lecons if l[2] in ("complet", "partiel")]
        index.append("## %s" % nom_module)
        index.append("")
        for num, titre, statut, duree, _ in lecons:
            marque = {"complet": "✅", "partiel": "🟡"}.get(statut, "⬜ NON TRANSCRITE")
            index.append("- %s **%02d — %s** %s" % (marque, num, titre, ("· %s" % duree) if duree else ""))
        index.append("")
        if not utiles:
            continue

        blocs = []
        for num, titre, statut, duree, chemin in utiles:
            t = corps(lire(os.path.join(TRANSCRIPTIONS, chemin)))
            n_path = os.path.join(NOTES, chemin)
            n = corps(lire(n_path)) if os.path.exists(n_path) else ""
            bloc = ["=" * 70,
                    "MODULE : %s" % nom_module,
                    "LEÇON %02d : %s" % (num, titre),
                    "STATUT DE LA SOURCE : %s" % statut,
                    "RÉFÉRENCE À CITER : %s / leçon %02d" % (nom_module, num),
                    "=" * 70, ""]
            if n and "pas encore rédigée" not in n:
                bloc += ["----- SYNTHÈSE (dérivée — à ne pas citer comme parole du formateur) -----", "", n, ""]
            bloc += ["----- SOURCE (verbatim de la vidéo — c'est ÇA qu'on cite) -----", "", t, "", ""]
            blocs.append("\n".join(bloc))

        parties, courant, taille = [], [], 0
        for b in blocs:
            if courant and taille + len(b) > TAILLE_MAX_PACK:
                parties.append(courant)
                courant, taille = [], 0
            courant.append(b)
            taille += len(b)
        if courant:
            parties.append(courant)

        for p, contenu_parts in enumerate(parties, start=1):
            suffixe = "" if len(parties) == 1 else "-partie%d" % p
            nom = "%02d-%s%s.md" % (i, mslug, suffixe)
            entete = "# %s%s\n\n_Transcriptions de la formation MASTER. Source unique de vérité._\n\n" % (
                nom_module, "" if len(parties) == 1 else " (partie %d/%d)" % (p, len(parties)))
            ecrire(os.path.join(DIST, nom), entete + "\n".join(contenu_parts))
            fichiers += 1
            print("  → dist/%s  (%d Ko)" % (nom, (len(entete) + sum(map(len, contenu_parts))) // 1024))

    ecrire(os.path.join(DIST, "00-INDEX.md"), "\n".join(index) + "\n")
    print("  → dist/00-INDEX.md")
    print("\n%d fichier(s) de contenu + l'index. À uploader dans le GPT / Projet Claude." % fichiers)
    if fichiers + 1 > 20:
        print("⚠️  Plus de 20 fichiers : un GPT OpenAI plafonne à 20. Regroupe des modules.")


if __name__ == "__main__":
    commandes = {"scaffold": cmd_scaffold, "etat": cmd_etat, "pack": cmd_pack}
    arg = sys.argv[1] if len(sys.argv) > 1 else ""
    if arg not in commandes:
        sys.exit("Usage : python3 scripts/formation.py [scaffold|etat|pack]")
    commandes[arg]()
