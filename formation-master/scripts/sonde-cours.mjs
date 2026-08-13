/* Sonde : ouvre UNE page de cours et dump son __NEXT_DATA__ pour analyse. */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ICI = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.resolve(ICI, "..");
const PROFIL = path.join(RACINE, ".skool-profile");
const URL_COURS = process.argv[2] || "https://www.skool.com/master/classroom/08461975";

const ctx = await chromium.launchPersistentContext(PROFIL, {
  headless: false,
  viewport: { width: 1400, height: 900 },
});
const page = ctx.pages()[0] || (await ctx.newPage());
await page.goto(URL_COURS, { waitUntil: "domcontentloaded", timeout: 60000 });
await new Promise((r) => setTimeout(r, 3000));
const next = await page.evaluate(() => {
  const e = document.getElementById("__NEXT_DATA__");
  return e ? e.textContent : "";
});
fs.mkdirSync(path.join(RACINE, ".capture"), { recursive: true });
fs.writeFileSync(path.join(RACINE, ".capture", "sonde-cours.json"), next, "utf-8");
console.log("OK", next.length, "octets");
await ctx.close();
