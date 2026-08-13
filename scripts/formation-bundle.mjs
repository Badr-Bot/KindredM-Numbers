/**
 * Concatène toutes les notes de formation dans formation/BUNDLE.md — le fichier
 * unique à uploader dans un Projet Claude ou un GPT personnalisé.
 *
 *   node scripts/formation-bundle.mjs
 *   node scripts/formation-bundle.mjs --avec-transcriptions
 *
 * Par défaut seules les notes sont incluses : elles sont denses et relues. Les
 * transcriptions brutes (5 à 10× plus volumineuses) ne servent qu'à vérifier
 * une citation, et noient le contexte d'un GPT si on les embarque.
 */
import { readdirSync, readFileSync, writeFileSync, existsSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const FORMATION = join(ROOT, "formation");
const avecTranscriptions = process.argv.includes("--avec-transcriptions");

/** Liste récursivement les .md d'un dossier, triés par chemin. */
function fichiersMarkdown(racine) {
  if (!existsSync(racine)) return [];
  const out = [];
  for (const entree of readdirSync(racine)) {
    const chemin = join(racine, entree);
    if (statSync(chemin).isDirectory()) out.push(...fichiersMarkdown(chemin));
    else if (entree.endsWith(".md")) out.push(chemin);
  }
  return out.sort();
}

/** Extrait le frontmatter YAML plat en tête de fichier. */
function frontmatter(contenu) {
  const m = contenu.match(/^---\n([\s\S]*?)\n---\n/);
  if (!m) return {};
  const meta = {};
  for (const ligne of m[1].split("\n")) {
    const sep = ligne.indexOf(":");
    if (sep === -1) continue;
    meta[ligne.slice(0, sep).trim()] = ligne.slice(sep + 1).trim();
  }
  return meta;
}

function corps(contenu) {
  return contenu.replace(/^---\n[\s\S]*?\n---\n/, "").trim();
}

const toutes = fichiersMarkdown(join(FORMATION, "notes")).map((chemin) => {
  const contenu = readFileSync(chemin, "utf8");
  return { chemin, meta: frontmatter(contenu), corps: corps(contenu) };
});

// Une note `vide` n'est qu'un gabarit scaffoldé : l'embarquer apprendrait au
// modèle des titres de sections sans contenu, ce qui l'incite à les remplir.
const vides = toutes.filter((n) => n.meta.statut === "vide");
const notes = toutes.filter((n) => n.meta.statut !== "vide");

if (notes.length === 0) {
  console.error(
    "Aucune note rédigée dans formation/notes/ (seulement des gabarits vides).\n" +
      "Colle un verbatim dans formation/transcriptions/, puis demande à Claude :\n" +
      '  « applique le prompt formation/prompts/transcription-vers-note.md à MB-07 »',
  );
  process.exit(1);
}

const parStatut = notes.reduce((acc, n) => {
  const s = n.meta.statut || "inconnu";
  acc[s] = (acc[s] || 0) + 1;
  return acc;
}, {});

const genereLe = new Date().toISOString().slice(0, 10);
const validees = notes.filter((n) => n.meta.statut === "ok");
const incompletes = notes.filter((n) => n.meta.statut !== "ok");

const morceaux = [];

morceaux.push(
  `# Corpus formation MASTER — media-buying\n\n` +
    `> Fichier **généré** par \`scripts/formation-bundle.mjs\` le ${genereLe}.\n` +
    `> Ne l'édite pas à la main : édite les notes dans \`formation/notes/\` et relance le script.\n\n` +
    `Ce document est l'unique source autorisée pour répondre aux questions de media-buying.\n` +
    `Chaque leçon porte un code (\`MB-07\`, \`MB-12\`…) : toute affirmation tirée de ce corpus\n` +
    `doit citer son code. Ce qui n'est pas ici n'est pas dans la formation — et doit être\n` +
    `annoncé comme tel, jamais comblé par des connaissances générales sur Meta Ads.\n\n` +
    `**État du corpus** : ${notes.length} leçon(s) — ` +
    Object.entries(parStatut)
      .map(([s, n]) => `${n} ${s}`)
      .join(", ") +
    `.\n`,
);

if (incompletes.length > 0) {
  morceaux.push(
    `> ⚠️ **Leçons non validées** (statut ≠ \`ok\`) : ` +
      incompletes.map((n) => n.meta.code || "?").join(", ") +
      `.\n> Leur contenu est partiel. Signale-le quand tu t'appuies dessus.\n`,
  );
}

morceaux.push(
  `## Sommaire\n\n` +
    notes
      .map((n) => `- \`${n.meta.code || "?"}\` — ${n.meta.lecon || "?"} *(${n.meta.statut || "?"})*`)
      .join("\n"),
);

for (const n of notes) {
  morceaux.push(
    `---\n\n<!-- source: ${n.chemin.replace(ROOT + "/", "")} | statut: ${n.meta.statut || "?"} -->\n\n${n.corps}`,
  );
}

if (avecTranscriptions) {
  const transcriptions = fichiersMarkdown(join(FORMATION, "transcriptions"));
  morceaux.push(
    `---\n\n# Annexe — transcriptions brutes\n\n` +
      `Verbatim non retouché. À ne citer que pour vérifier un propos exact ; les notes\n` +
      `ci-dessus font foi pour l'usage courant.`,
  );
  for (const chemin of transcriptions) {
    const contenu = readFileSync(chemin, "utf8");
    morceaux.push(
      `---\n\n<!-- source: ${chemin.replace(ROOT + "/", "")} -->\n\n${corps(contenu)}`,
    );
  }
}

const sortie = join(FORMATION, avecTranscriptions ? "BUNDLE-COMPLET.md" : "BUNDLE.md");
const texte = morceaux.join("\n\n") + "\n";
writeFileSync(sortie, texte, "utf8");

const ko = Math.round(texte.length / 1024);
console.log(`✓ ${sortie.replace(ROOT + "/", "")} — ${notes.length} leçon(s), ${ko} Ko`);
console.log(
  `  validées (ok) : ${validees.length} · en cours : ${incompletes.length}` +
    (vides.length > 0 ? ` · ${vides.length} gabarit(s) vide(s) ignoré(s)` : ""),
);
if (ko > 400) {
  console.log(
    `  ⚠️ Au-delà de ~400 Ko, découpe par module avant d'uploader dans un GPT :\n` +
      `     la plupart des interfaces tronquent silencieusement les gros fichiers.`,
  );
}
