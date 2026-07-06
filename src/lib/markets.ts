import type { Market } from "./engine";

export type MarketTab = Market | "GLOBAL";

export const MARKET_TABS: MarketTab[] = ["GLOBAL", "ES", "UK", "DE", "FR"];
export const MARKETS: Market[] = ["ES", "UK", "DE", "FR"];

interface MarketMeta {
  label: string;
  flag: string;
  full: string;
}

export const MARKET_META: Record<MarketTab, MarketMeta> = {
  GLOBAL: { label: "Global", flag: "🌍", full: "Tous marchés" },
  ES: { label: "ES", flag: "🇪🇸", full: "Espagne" },
  UK: { label: "UK", flag: "🇬🇧", full: "International (GB + reste)" },
  DE: { label: "DE", flag: "🇩🇪", full: "Allemagne" },
  FR: { label: "FR", flag: "🇫🇷", full: "France" },
};

export function marketFlag(m: MarketTab): string {
  return MARKET_META[m].flag;
}

export function marketLabel(m: MarketTab): string {
  return MARKET_META[m].label;
}
