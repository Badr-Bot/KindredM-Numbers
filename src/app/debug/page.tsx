import { getDataMode } from "@/lib/data";
import { PageHeading } from "@/components/shell/PageHeading";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface CheckResult {
  name: string;
  ok: boolean;
  detail: string;
}

function shorten(msg: string): string {
  return msg.replace(/\s+/g, " ").trim().slice(0, 220);
}

/**
 * Autotest complet côté serveur : Supabase, chaque store Shopify, Meta.
 * Une seule capture de cette page = diagnostic complet, sans deviner.
 */
async function runChecks(): Promise<CheckResult[]> {
  const results: CheckResult[] = [];

  // --- Supabase ---
  try {
    const { createSupabaseServerClient } = await import("@/lib/supabase");
    const supabase = createSupabaseServerClient();
    const { count: mapCount, error: e1 } = await supabase
      .from("products_map")
      .select("*", { count: "exact", head: true });
    if (e1) throw new Error(e1.message);
    const { count: aggCount, error: e2 } = await supabase
      .from("daily_aggregates")
      .select("*", { count: "exact", head: true });
    if (e2) throw new Error(e2.message);
    const { count: ordCount, error: e3 } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true });
    if (e3) throw new Error(e3.message);
    results.push({
      name: "🗄️ Supabase",
      ok: true,
      detail: `products_map: ${mapCount ?? 0} · orders: ${ordCount ?? 0} · daily_aggregates: ${aggCount ?? 0}`,
    });
  } catch (err) {
    results.push({ name: "🗄️ Supabase", ok: false, detail: shorten((err as Error).message) });
  }

  // --- Shopify, store par store ---
  try {
    const { getShopifyStoreConfigs, resolveAccessToken } = await import("@/lib/shopify");
    for (const config of getShopifyStoreConfigs()) {
      try {
        const token = await resolveAccessToken(config);
        const res = await fetch(
          `https://${config.domain}/admin/api/2025-01/orders.json?limit=1&status=any`,
          { headers: { "X-Shopify-Access-Token": token } }
        );
        if (!res.ok) {
          const body = await res.text();
          throw new Error(`HTTP ${res.status} — ${shorten(body)}`);
        }
        const body: { orders: unknown[] } = await res.json();
        results.push({
          name: `🛍️ Shopify ${config.market}`,
          ok: true,
          detail: `token OK · lecture commandes OK (${body.orders.length ? "≥1 commande visible" : "0 commande"})`,
        });
      } catch (err) {
        results.push({
          name: `🛍️ Shopify ${config.market}`,
          ok: false,
          detail: shorten((err as Error).message),
        });
      }
    }
  } catch (err) {
    results.push({ name: "🛍️ Shopify (config)", ok: false, detail: shorten((err as Error).message) });
  }

  // --- Meta ---
  try {
    const { fetchMetaSpend } = await import("@/lib/meta");
    const { todayParisDay } = await import("@/lib/time");
    const today = todayParisDay();
    const rows = await fetchMetaSpend(today, today);
    results.push({
      name: "📣 Meta Ads",
      ok: true,
      detail: `token OK · ${rows.length} ligne(s) de spend aujourd'hui`,
    });
  } catch (err) {
    results.push({ name: "📣 Meta Ads", ok: false, detail: shorten((err as Error).message) });
  }

  return results;
}

export default async function DebugPage() {
  const mode = getDataMode();
  const checks = mode === "live" ? await runChecks() : [];
  const allOk = checks.length > 0 && checks.every((c) => c.ok);

  return (
    <div>
      <PageHeading
        emoji="🔬"
        title="Autotest"
        subtitle="Teste chaque connexion côté serveur — une capture de cette page = diagnostic complet"
      />
      {mode !== "live" ? (
        <p className="rounded-lg border border-line bg-panel/40 p-4 text-[11.5px] text-ink-dim">
          Mode {mode} — l&apos;autotest ne tourne qu&apos;en mode réel (Supabase configuré).
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          <div
            className={`rounded-lg border p-3 text-sm font-bold ${
              allOk ? "border-phosphor/40 bg-phosphor/[0.05] text-phosphor" : "border-red/40 bg-red/[0.05] text-red"
            }`}
          >
            {allOk ? "✅ Tout est opérationnel" : "❌ Au moins une connexion échoue — détails ci-dessous"}
          </div>
          {checks.map((c) => (
            <section
              key={c.name}
              className={`rounded-lg border p-3 ${
                c.ok ? "border-line bg-panel/40" : "border-red/40 bg-red/[0.04]"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[12.5px] font-semibold">{c.name}</span>
                <span>{c.ok ? "✅" : "❌"}</span>
              </div>
              <p className="mt-1 break-words text-[11px] text-ink-dim">{c.detail}</p>
            </section>
          ))}
          <p className="mt-1 text-center text-[10px] text-ink-faint">
            Recharge la page pour relancer l&apos;autotest.
          </p>
        </div>
      )}
    </div>
  );
}
