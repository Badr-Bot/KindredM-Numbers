// ---------------------------------------------------------------------------
// 🏷️ Codification des ads — parseur du nommage docs/creas/CODIFICATION.md
// `[WIN 2026-08 S4 - ]AD<seq>v<var> - <PROD>-<ANGLE>-<FMT>-<HOOK>-<LANG>`
// Le nom est un INDEX : une fois les ads codifiées, le dashboard agrège la
// performance par angle / hook / format sans ouvrir une seule créa — c'est le
// rapport « quels patterns produisent des winners » demandé par Badr (21/08).
// Les anciens noms (« PUB 46 », « IMAGE 57 ») ne parsent pas : parseAdCode
// rend null et l'ad reste simplement hors agrégats, jamais une erreur.
// ---------------------------------------------------------------------------

export interface AdCode {
  seq: number;
  variation: number;
  produit: string; // POLO, LANCASTER…
  angle: string; // VEN, FEM, VAC, PRO…
  format: string; // VID, UGC, IMG, CAR
  hook: string; // QST, CHC, PRB, CUR, TMG, DEM
  langue: string; // FR, EN, ES, DE
  /** Marquage T37 apposé par-dessus le nom (WIN / POTENTIAL / BANGER). */
  marquage: "WIN" | "POTENTIAL" | "BANGER" | null;
}

const CODE_RE = /\bAD\s?(\d+)\s?v(\d+)\s*-\s*([A-Z]+)-([A-Z]{2,4})-([A-Z]{2,4})-([A-Z]{2,4})-([A-Z]{2})\b/i;

export function parseAdCode(adName: string | null | undefined): AdCode | null {
  if (!adName) return null;
  const m = CODE_RE.exec(adName);
  if (!m) return null;
  const head = adName.slice(0, m.index).toUpperCase();
  const marquage = /\bWIN\b/.test(head)
    ? ("WIN" as const)
    : /\bPOTENTIAL\b/.test(head)
      ? ("POTENTIAL" as const)
      : /\bBANGER\b/.test(head)
        ? ("BANGER" as const)
        : null;
  return {
    seq: Number(m[1]),
    variation: Number(m[2]),
    produit: m[3].toUpperCase(),
    angle: m[4].toUpperCase(),
    format: m[5].toUpperCase(),
    hook: m[6].toUpperCase(),
    langue: m[7].toUpperCase(),
    marquage,
  };
}

export interface PatternBucket {
  key: string;
  ads: number;
  spendCents: number;
  purchases: number;
  purchaseValueCents: number;
  /** valeur/spend — null sans spend. */
  roas: number | null;
}

/** Agrège des ads codifiées par une dimension du code (angle, hook, format…).
 * Tri : spend décroissant — on juge d'abord ce qui a réellement dépensé. */
export function aggregateByCode(
  rows: { adName: string; spendCents: number; purchases: number; purchaseValueCents: number }[],
  dim: "angle" | "hook" | "format" | "produit" | "langue"
): PatternBucket[] {
  const buckets = new Map<string, PatternBucket>();
  for (const r of rows) {
    const code = parseAdCode(r.adName);
    if (!code) continue;
    const key = code[dim];
    let b = buckets.get(key);
    if (!b) {
      b = { key, ads: 0, spendCents: 0, purchases: 0, purchaseValueCents: 0, roas: null };
      buckets.set(key, b);
    }
    b.ads += 1;
    b.spendCents += r.spendCents;
    b.purchases += r.purchases;
    b.purchaseValueCents += r.purchaseValueCents;
  }
  const out = [...buckets.values()];
  for (const b of out) b.roas = b.spendCents > 0 ? b.purchaseValueCents / b.spendCents : null;
  return out.sort((a, b) => b.spendCents - a.spendCents);
}
