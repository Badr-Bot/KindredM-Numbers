/**
 * Scaffolde une leçon de formation : crée la transcription vierge et la note
 * vierge à partir des gabarits, avec l'en-tête déjà rempli.
 *
 *   node scripts/formation-nouvelle-lecon.mjs <module> <numero> "<titre>"
 *   node scripts/formation-nouvelle-lecon.mjs media-buying 7 "0-10k Day Protocole"
 *
 * Node pur, aucune dépendance : ça doit marcher même sans npm install.
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const FORMATION = join(ROOT, "formation");

/** Préfixe de citation par module. Ajoute ici tout nouveau module. */
const CODES = {
  "media-buying": "MB",
  crea: "CR",
  offre: "OF",
  "back-end": "BE",
};

function slugify(titre) {
  return titre
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['\u2019]/g, "-")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

const [moduleArg, numeroArg, ...titreParts] = process.argv.slice(2);
const titre = titreParts.join(" ").trim();

if (!moduleArg || !numeroArg || !titre) {
  console.error(
    'Usage : node scripts/formation-nouvelle-lecon.mjs <module> <numero> "<titre>"',
  );
  console.error(`Modules connus : ${Object.keys(CODES).join(", ")}`);
  process.exit(1);
}

const prefixe = CODES[moduleArg];
if (!prefixe) {
  console.error(
    `Module inconnu : « ${moduleArg} ». Ajoute-le dans CODES en haut de ce script,\n` +
      `puis dans formation/INDEX.md et dans .claude/skills/formation-master/SKILL.md.`,
  );
  process.exit(1);
}

const numero = String(numeroArg).padStart(2, "0");
const code = `${prefixe}-${numero}`;
const slug = slugify(titre);
const nomFichier = `${numero}-${slug}.md`;

const aujourdhui = new Date().toISOString().slice(0, 10);

/** Remplit un gabarit avec les métadonnées de la leçon. */
function instancier(cheminGabarit) {
  return readFileSync(cheminGabarit, "utf8")
    .replaceAll("MB-XX", code)
    .replaceAll("TITRE DE LA LEÇON", titre)
    .replace(/^module: .*$/m, `module: ${moduleArg}`)
    .replace(/^lecon: .*$/m, `lecon: ${titre}`)
    .replace(/^capture_le: .*$/m, `capture_le: ${aujourdhui}`);
}

const cibles = [
  {
    quoi: "transcription",
    gabarit: join(FORMATION, "templates", "transcription.md"),
    sortie: join(FORMATION, "transcriptions", moduleArg, nomFichier),
  },
  {
    quoi: "note",
    gabarit: join(FORMATION, "templates", "note.md"),
    sortie: join(FORMATION, "notes", moduleArg, nomFichier),
  },
];

let cree = 0;
for (const { quoi, gabarit, sortie } of cibles) {
  if (existsSync(sortie)) {
    console.log(`↷ ${quoi} déjà présente, on ne touche à rien : ${sortie}`);
    continue;
  }
  mkdirSync(dirname(sortie), { recursive: true });
  writeFileSync(sortie, instancier(gabarit), "utf8");
  console.log(`✓ ${quoi} créée : ${sortie.replace(ROOT + "/", "")}`);
  cree += 1;
}

if (cree > 0) {
  console.log(
    `\n${code} — « ${titre} »\n` +
      `1. Colle le verbatim dans la transcription, sous <!-- VERBATIM -->\n` +
      `2. Demande à Claude : « applique le prompt formation/prompts/transcription-vers-note.md à ${code} »\n` +
      `3. Ajoute la ligne ${code} dans formation/INDEX.md\n` +
      `4. node scripts/formation-bundle.mjs`,
  );
}
