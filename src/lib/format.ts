// Formatage pour l'affichage — les montants sont toujours stockés/calculés en
// centimes (loi §0.2), l'arrondi n'arrive qu'ici.

const EUR = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const EUR0 = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/** Centimes → "479,92 €". */
export function formatEur(cents: number): string {
  return EUR.format(cents / 100);
}

/** Centimes → "480 €" (compact, pour tableaux denses). */
export function formatEur0(cents: number): string {
  return EUR0.format(cents / 100);
}

/** Centimes → "+107,10 €" / "−25,65 €" avec signe explicite. */
export function formatEurSigned(cents: number): string {
  const sign = cents > 0 ? "+" : cents < 0 ? "−" : "";
  return sign + EUR.format(Math.abs(cents) / 100);
}

export function formatEurSigned0(cents: number): string {
  const sign = cents > 0 ? "+" : cents < 0 ? "−" : "";
  return sign + EUR0.format(Math.abs(cents) / 100);
}

/** Ratio (0.223) → "22,3 %". null → "—". */
export function formatPct(ratio: number | null): string {
  if (ratio === null || !Number.isFinite(ratio)) return "—";
  return (
    (ratio * 100).toLocaleString("fr-FR", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }) + " %"
  );
}

/** ROAS (2.6) → "2,60×". null → "—". */
export function formatRoas(roas: number | null): string {
  if (roas === null || !Number.isFinite(roas)) return "—";
  return (
    roas.toLocaleString("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + "×"
  );
}

/** ROAS brut sans suffixe (pour les seuils affichés côte à côte). */
export function formatRoasBare(roas: number | null): string {
  if (roas === null || !Number.isFinite(roas)) return "—";
  return roas.toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatInt(n: number): string {
  return n.toLocaleString("fr-FR");
}

// Paliers de couleur du net (Badr, 04/08) — négatif en rouge, puis un palier
// de couleur toutes les 500 €, plafonné à 5 paliers (au-delà de 2000 €, la
// couleur ne change plus). Rampe mono-teinte or définie dans globals.css
// (--color-net-1..5, la dernière = --color-phosphor). Classes Tailwind
// générées automatiquement depuis ces tokens @theme.
const NET_TIER_CENTS = 50000; // 500 €
const NET_TIER_CLASSES = ["text-net-1", "text-net-2", "text-net-3", "text-net-4", "text-net-5"];

/** Centimes → classe Tailwind de couleur du net, par palier de 500 €. */
export function netTierClass(netCents: number): string {
  if (netCents < 0) return "text-red";
  const tier = Math.min(Math.floor(netCents / NET_TIER_CENTS), NET_TIER_CLASSES.length - 1);
  return NET_TIER_CLASSES[tier];
}

const MONTHS_FR = [
  "janv.", "févr.", "mars", "avr.", "mai", "juin",
  "juil.", "août", "sept.", "oct.", "nov.", "déc.",
];
const MONTHS_FR_LONG = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

/** "2026-07-04" → "04/07". */
export function formatDayShort(day: string): string {
  const [, m, d] = day.split("-");
  return `${d}/${m}`;
}

/** "2026-07-04" → "ven. 04 juil.". */
export function formatDayLabel(day: string): string {
  const date = new Date(`${day}T12:00:00Z`);
  const weekday = date.toLocaleDateString("fr-FR", { weekday: "short", timeZone: "UTC" });
  const [, m, d] = day.split("-");
  return `${weekday} ${d} ${MONTHS_FR[Number(m) - 1]}`;
}

/** "2026-07" → "juillet 2026". */
export function formatMonthLabel(yearMonth: string): string {
  const [y, m] = yearMonth.split("-");
  return `${MONTHS_FR_LONG[Number(m) - 1]} ${y}`;
}

/** "2026-07" → "juil. 26". */
export function formatMonthShort(yearMonth: string): string {
  const [y, m] = yearMonth.split("-");
  return `${MONTHS_FR[Number(m) - 1]} ${y.slice(2)}`;
}
