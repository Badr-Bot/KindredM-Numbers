// Mode démo (activé par NIVA_DEMO=1) — données synthétiques DÉTERMINISTES pour
// juger le dashboard en contexte réel avant d'avoir branché Supabase/Shopify.
// Chaque journée est générée via le VRAI moteur (COGS/taxe/frais/net exacts),
// donc les chiffres sont internement cohérents. Se désactive dès que Supabase
// est configuré. Rien de tout ça ne touche la prod.
import {
  computeDailyAggregate,
  computeOrderCogsTax,
  type Market,
} from "./engine";
import type { Chargeback, ChargebackStatus, DailyRow } from "./data";

export const DEMO_TODAY = "2026-07-06";
export const DEMO_START = "2026-06-04";

const MARKETS: Market[] = ["ES", "UK", "DE", "FR"];
const MARKET_COUNTRY: Record<Market, string> = { ES: "ES", UK: "GB", DE: "DE", FR: "FR" };

// Profil par marché : volume typique de commandes/jour et bande de ROAS visée.
const MARKET_PROFILE: Record<Market, { baseOrders: number; roasLow: number; roasHigh: number }> = {
  ES: { baseOrders: 8, roasLow: 1.9, roasHigh: 3.1 },
  UK: { baseOrders: 5, roasLow: 1.5, roasHigh: 2.6 },
  DE: { baseOrders: 5, roasLow: 1.8, roasHigh: 3.4 },
  FR: { baseOrders: 4, roasLow: 1.6, roasHigh: 2.9 },
};

// Prix de vente typiques par bundle (centimes).
const TICKET: Record<1 | 2 | 4, number> = { 1: 3499, 2: 5999, 4: 9999 };

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seedFor(day: string, market: string): number {
  let h = 2166136261;
  const s = `${day}:${market}`;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function listDays(start: string, end: string): string[] {
  const days: string[] = [];
  const cur = new Date(`${start}T00:00:00Z`);
  const last = new Date(`${end}T00:00:00Z`);
  while (cur <= last) {
    days.push(cur.toISOString().slice(0, 10));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return days;
}

function generateRow(day: string, market: Market): DailyRow {
  const rnd = mulberry32(seedFor(day, market));
  const profile = MARKET_PROFILE[market];
  const country = MARKET_COUNTRY[market];

  // Weekend un peu plus calme, montée en régime sur juillet.
  const weekday = new Date(`${day}T12:00:00Z`).getUTCDay();
  const weekendFactor = weekday === 0 || weekday === 6 ? 0.75 : 1;
  const rampFactor = day >= "2026-06-21" ? 1.15 : 0.85;

  const orders = Math.max(
    0,
    Math.round(profile.baseOrders * weekendFactor * rampFactor * (0.6 + rnd() * 0.9))
  );

  let caCents = 0;
  let cogsCents = 0;
  let taxCents = 0;
  for (let i = 0; i < orders; i++) {
    const r = rnd();
    const bundle: 1 | 2 | 4 = r < 0.15 ? 1 : r < 0.85 ? 2 : 4;
    caCents += TICKET[bundle];
    const { cogsProductCents, taxCents: t } = computeOrderCogsTax({
      store: market,
      shippingCountry: country,
      day,
      poloQty: bundle,
      upsells: [],
    });
    cogsCents += cogsProductCents;
    taxCents += t;
  }

  // Spend visant un ROAS dans la bande du marché.
  const targetRoas = profile.roasLow + rnd() * (profile.roasHigh - profile.roasLow);
  const spendCents = orders === 0 ? Math.round(rnd() * 4000) : Math.round(caCents / targetRoas);

  // Remboursements : ~10 % des jours-marché ont une commande remboursée.
  // Le CA (donc le net) est net du remboursement ; refundedCents garde le brut.
  let refundedCents = 0;
  if (orders > 0 && rnd() < 0.1) {
    const rb = rnd();
    const bundle: 1 | 2 | 4 = rb < 0.5 ? 2 : rb < 0.8 ? 1 : 4;
    refundedCents = TICKET[bundle];
  }
  const netCa = Math.max(0, caCents - refundedCents);

  const agg = computeDailyAggregate({ orders, caCents: netCa, spendCents, cogsCents, taxCents });
  // Démo ne simule pas d'upsells (bundles polo seuls) : tout le COGS est "polo".
  return { day, market, ...agg, cogsProductCents: cogsCents, cogsUpsellsCents: 0, refundedCents };
}

// Rétrofacturations (litiges) synthétiques — quelques cas répartis sur la période.
function buildDemoChargebacks(): Chargeback[] {
  const specs: Array<[string, Market, number, ChargebackStatus, string]> = [
    ["2026-06-18", "UK", 5766, "lost", "Produit non reçu"],
    ["2026-06-27", "ES", 5999, "won", "Transaction non reconnue"],
    ["2026-07-01", "DE", 8999, "open", "Article non conforme"],
    ["2026-07-03", "FR", 5999, "lost", "Non reçu"],
    ["2026-07-05", "ES", 5499, "open", "Transaction non reconnue"],
  ];
  return specs.map(([day, market, amountCents, status, reason], i) => ({
    id: `demo-cb-${i + 1}`,
    day,
    market,
    orderName: `#${1050 + i * 7}`,
    amountCents,
    feeCents: 1500, // frais de litige typiques ~15 €
    status,
    reason,
  }));
}

let cachedChargebacks: Chargeback[] | null = null;

export function getDemoChargebacks(): Chargeback[] {
  if (!cachedChargebacks) cachedChargebacks = buildDemoChargebacks();
  return cachedChargebacks;
}

let cached: DailyRow[] | null = null;

/** Tout l'historique démo [DEMO_START, DEMO_TODAY], une ligne par (jour, marché). */
export function getDemoDailyRows(): DailyRow[] {
  if (cached) return cached;
  const rows: DailyRow[] = [];
  for (const day of listDays(DEMO_START, DEMO_TODAY)) {
    for (const market of MARKETS) {
      rows.push(generateRow(day, market));
    }
  }
  cached = rows;
  return rows;
}
