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
      detail: `URL: ${process.env.SUPABASE_URL?.trim()} · products_map: ${mapCount ?? 0} · orders: ${ordCount ?? 0} · daily_aggregates: ${aggCount ?? 0}`,
    });
  } catch (err) {
    results.push({
      name: "🗄️ Supabase",
      ok: false,
      detail: `URL: ${process.env.SUPABASE_URL?.trim() ?? "(absente)"} — ${shorten((err as Error).message)}`,
    });
  }

  // --- Shopify, store par store : RÉCONCILIATION comptes Shopify vs base ---
  // Compare, depuis le 04/06 : nb de commandes côté Shopify (orders/count.json)
  // vs nb de commandes brutes en base vs ce que les agrégats affichent.
  // Un écart Shopify→base = perte à l'ingestion ; base→agrégats = bug de calcul.
  try {
    const { getShopifyStoreConfigs, resolveAccessToken } = await import("@/lib/shopify");
    const { createSupabaseServerClient } = await import("@/lib/supabase");
    const { BACKFILL_SINCE_ISO } = await import("@/lib/discover");
    const supabase = createSupabaseServerClient();
    const sinceParam = encodeURIComponent(BACKFILL_SINCE_ISO);

    for (const config of getShopifyStoreConfigs()) {
      try {
        const token = await resolveAccessToken(config);
        const headers = { "X-Shopify-Access-Token": token };
        const countUrl = (qs: string) =>
          `https://${config.domain}/admin/api/2025-01/orders/count.json?status=any${qs}`;

        const [sinceRes, shopRes, sampleRes] = await Promise.all([
          fetch(countUrl(`&created_at_min=${sinceParam}`), { headers }),
          fetch(`https://${config.domain}/admin/api/2025-01/shop.json?fields=currency,money_format`, { headers }),
          fetch(
            `https://${config.domain}/admin/api/2025-01/orders.json?status=any&limit=1&fields=currency,presentment_currency,total_price,total_price_set`,
            { headers }
          ),
        ]);
        if (!sinceRes.ok) {
          const body = await sinceRes.text();
          throw new Error(`HTTP ${sinceRes.status} — ${shorten(body)}`);
        }
        const shopifySince = ((await sinceRes.json()) as { count: number }).count;

        // Devise de la boutique : si ≠ EUR, total_price n'est PAS en euros et
        // le CA est faux (on lit une autre monnaie comme des euros).
        const shopCurrency = shopRes.ok
          ? ((await shopRes.json()) as { shop?: { currency?: string } }).shop?.currency ?? "?"
          : "?";
        let sampleInfo = "";
        if (sampleRes.ok) {
          const sample = ((await sampleRes.json()) as {
            orders?: Array<{
              currency?: string;
              presentment_currency?: string;
              total_price?: string;
              total_price_set?: { shop_money?: { amount?: string; currency_code?: string } };
            }>;
          }).orders?.[0];
          if (sample) {
            const shopMoney = sample.total_price_set?.shop_money;
            sampleInfo = ` · ex. commande : total_price ${sample.total_price} ${sample.currency} (client paie en ${sample.presentment_currency}) · shop_money ${shopMoney?.amount} ${shopMoney?.currency_code}`;
          }
        }

        const { count: dbCount, error: dbErr } = await supabase
          .from("orders")
          .select("*", { count: "exact", head: true })
          .eq("store", config.market);
        if (dbErr) throw new Error(dbErr.message);

        const { data: aggRows, error: aggErr } = await supabase
          .from("daily_aggregates")
          .select("orders, ca_cents")
          .eq("market", config.market);
        if (aggErr) throw new Error(aggErr.message);
        const aggOrders = (aggRows ?? []).reduce((s, r) => s + (r.orders as number), 0);
        const aggCa = (aggRows ?? []).reduce((s, r) => s + (r.ca_cents as number), 0);

        const delta = shopifySince - (dbCount ?? 0);
        results.push({
          name: `🛍️ Shopify ${config.market}`,
          ok: delta === 0 && shopCurrency === "EUR",
          detail:
            `💱 Devise boutique : ${shopCurrency}${shopCurrency !== "EUR" ? " ⚠️ PAS en euros — CA faux" : ""}` +
            ` · Shopify depuis 04/06 : ${shopifySince} cmd` +
            ` · Base : ${dbCount ?? 0} cmd (écart ${delta >= 0 ? "−" : "+"}${Math.abs(delta)})` +
            ` · Agrégats : ${aggOrders} cmd, CA ${(aggCa / 100).toFixed(2)} €` +
            sampleInfo,
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

  // --- Synchro auto (LiveSync/app_state) ---
  // Appelle la même fonction que /api/sync pour révéler directement une
  // panne silencieuse (ex : table app_state manquante) au lieu de deviner.
  try {
    const { runThrottledIncrementalSync } = await import("@/lib/incrementalSync");
    const result = await runThrottledIncrementalSync();
    results.push({
      name: "🔄 Synchro auto",
      ok: true,
      detail: result.ran
        ? `Synchro exécutée · jours touchés : ${(result.touchedDays ?? []).join(", ") || "aucun"}${
            result.warnings?.length ? ` · ⚠️ ${result.warnings.join(" | ")}` : ""
          }`
        : "Ignorée (déjà synchronisé il y a moins de 5 min, ou base pas encore initialisée) — normal si tu viens de recharger la page.",
    });
  } catch (err) {
    results.push({
      name: "🔄 Synchro auto",
      ok: false,
      detail: shorten((err as Error).message),
    });
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
