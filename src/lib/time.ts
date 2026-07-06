import { formatInTimeZone, toZonedTime } from "date-fns-tz";

// Loi §0.3 — tous les jours = fuseau Europe/Paris. Toute date ISO (Shopify,
// Meta) doit passer par ici avant d'être assignée à un jour.
export const APP_TIMEZONE = "Europe/Paris";

/** Convertit un timestamp UTC/ISO en jour Europe/Paris, format YYYY-MM-DD. */
export function toParisDay(utcIso: string | Date): string {
  return formatInTimeZone(utcIso, APP_TIMEZONE, "yyyy-MM-dd");
}

/** Heure actuelle Europe/Paris, pour comparer avec un jour calendaire. */
export function nowInParis(): Date {
  return toZonedTime(new Date(), APP_TIMEZONE);
}

/** Jour Europe/Paris courant, format YYYY-MM-DD. */
export function todayParisDay(): string {
  return toParisDay(new Date());
}

/** Décale un jour calendaire (YYYY-MM-DD) de `delta` jours. */
export function addDaysToDay(day: string, delta: number): string {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

/** Liste tous les jours calendaires entre `startDay` et `endDay` (inclus). */
export function listParisDays(startDay: string, endDay: string): string[] {
  const days: string[] = [];
  let cursor = startDay;
  while (cursor <= endDay) {
    days.push(cursor);
    cursor = addDaysToDay(cursor, 1);
  }
  return days;
}
