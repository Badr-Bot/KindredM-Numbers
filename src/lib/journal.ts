import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "./supabase";
import { addDaysToDay, todayParisDay } from "./time";

// 📓 Journal de bord — voir migration 0006. Les événements manuels viennent
// de l'UI (/api/journal) ; les auto sont détectés ici depuis meta_spend
// (campagne coupée / lancée / saut de budget), appelé par la synchro.

export type EventType =
  | "crea"
  | "landing"
  | "offre"
  | "audience"
  | "budget"
  | "campagne"
  | "autre";

export interface JournalEvent {
  id: number;
  day: string;
  type: EventType;
  note: string;
  source: "manual" | "auto";
}

export const EVENT_TYPE_META: Record<EventType, { emoji: string; label: string }> = {
  crea: { emoji: "🎨", label: "Créa" },
  landing: { emoji: "🖥️", label: "Landing" },
  offre: { emoji: "💰", label: "Offre / prix" },
  audience: { emoji: "🎯", label: "Audience" },
  budget: { emoji: "📈", label: "Budget" },
  campagne: { emoji: "🤖", label: "Campagne" },
  autre: { emoji: "📌", label: "Autre" },
};

export async function getJournalEvents(): Promise<{ events: JournalEvent[]; ready: boolean }> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("events")
    .select("id, day, type, note, source")
    .order("day", { ascending: false })
    .order("id", { ascending: false });
  if (error) return { events: [], ready: false };
  return {
    events: (data ?? []).map((r) => ({
      id: r.id as number,
      day: String(r.day),
      type: r.type as EventType,
      note: r.note as string,
      source: r.source as "manual" | "auto",
    })),
    ready: true,
  };
}

/**
 * Détection automatique d'événements depuis meta_spend (10 derniers jours) :
 * campagne coupée (spend significatif → 0), lancée (première apparition),
 * saut de budget (±50 % sur base solide). Dédupliqué par (day, type, ref) —
 * relançable sans doublon. Best effort : ne casse jamais la synchro.
 */
export async function detectCampaignEvents(supabase: SupabaseClient): Promise<void> {
  try {
    const today = todayParisDay();
    const since = addDaysToDay(today, -10);
    const { data, error } = await supabase
      .from("meta_spend")
      .select("day, campaign_id, campaign_name, spend_cents")
      .gte("day", since)
      .lte("day", today);
    if (error || !data) return;

    // spend par campagne et par jour
    const byCampaign = new Map<string, { name: string; byDay: Map<string, number> }>();
    const daysWithData = new Set<string>();
    for (const r of data) {
      const day = String(r.day);
      daysWithData.add(day);
      const c = byCampaign.get(r.campaign_id as string) ?? {
        name: (r.campaign_name as string) ?? r.campaign_id,
        byDay: new Map<string, number>(),
      };
      c.byDay.set(day, (c.byDay.get(day) ?? 0) + (r.spend_cents as number));
      byCampaign.set(r.campaign_id as string, c);
    }
    const orderedDays = [...daysWithData].sort();

    const euros = (c: number) => Math.round(c / 100).toLocaleString("fr-FR") + " €";
    const rows: Array<{ day: string; type: string; note: string; ref: string; source: string }> = [];

    for (const [id, c] of byCampaign) {
      for (let i = 1; i < orderedDays.length; i++) {
        const prev = c.byDay.get(orderedDays[i - 1]) ?? 0;
        const cur = c.byDay.get(orderedDays[i]) ?? 0;
        const day = orderedDays[i];
        // Coupée : dépensait ≥ 50 €/j, tombe sous 5 % de la veille
        if (prev >= 5000 && cur <= prev * 0.05) {
          rows.push({
            day,
            type: "campagne",
            note: `Campagne « ${c.name} » coupée (spend ${euros(prev)} → ${euros(cur)})`,
            ref: `cut:${id}`,
            source: "auto",
          });
        }
        // Lancée : rien la veille, ≥ 30 €/j maintenant (ignore le 1er jour de la fenêtre)
        if (i > 1 && prev === 0 && cur >= 3000 && !c.byDay.has(orderedDays[i - 1])) {
          const seenBefore = orderedDays.slice(0, i - 1).some((d) => (c.byDay.get(d) ?? 0) > 0);
          if (!seenBefore) {
            rows.push({
              day,
              type: "campagne",
              note: `Campagne « ${c.name} » lancée (${euros(cur)} le 1er jour)`,
              ref: `start:${id}`,
              source: "auto",
            });
          }
        }
        // Saut de budget : ±50 % sur une base ≥ 100 €/j
        if (prev >= 10000 && cur >= 5000 && (cur >= prev * 1.5 || cur <= prev * 0.5)) {
          const up = cur > prev;
          rows.push({
            day,
            type: "budget",
            note: `Budget « ${c.name} » ${up ? "poussé" : "réduit"} (${euros(prev)} → ${euros(cur)})`,
            ref: `jump:${id}:${day}`,
            source: "auto",
          });
        }
      }
    }

    const CHUNK = 100;
    for (let i = 0; i < rows.length; i += CHUNK) {
      await supabase
        .from("events")
        .upsert(rows.slice(i, i + CHUNK), { onConflict: "day,type,ref", ignoreDuplicates: true });
    }
  } catch {
    // table absente (migration 0006 pas encore collée) ou autre — non bloquant
  }
}
