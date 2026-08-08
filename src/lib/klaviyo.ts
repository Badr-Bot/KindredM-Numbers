// ---------------------------------------------------------------------------
// KLAVIYO — CA attribué aux campagnes email (Jeremy, branché 08/08).
//
// Clé lue via process.env.KLAVIYO_API_KEY (JAMAIS écrite en dur ici — une clé
// commitée reste en clair dans l'historique Git pour toujours). Ajoute-la
// dans Vercel → Settings → Environment Variables.
//
// Pourquoi les CAMPAGNES et pas les FLOWS : Badr a demandé d'exclure le code
// BIENVENUE15 (le mail de bienvenue automatique envoyé à l'inscription). Chez
// Klaviyo, ce genre de mail automatique est un FLOW, pas une CAMPAGNE — en ne
// lisant QUE le rapport « campaign-values-report », les flows (donc
// BIENVENUE15) sont exclus par construction, sans avoir à connaître le nom du
// code promo. C'est aussi le vrai périmètre du travail de Jeremy : il envoie
// des campagnes, pas les flows automatiques déjà en place avant lui.
//
// AVERTISSEMENT : premier jet, jamais testé en conditions réelles (le réseau
// sortant de cette session de code n'a pas accès à l'API Klaviyo — politique
// de l'environnement). Le premier vrai test se fait au déploiement. En cas
// d'erreur HTTP ou de forme de réponse inattendue, la fonction lève une
// exception explicite plutôt que de renvoyer un chiffre inventé.
// ---------------------------------------------------------------------------

const KLAVIYO_BASE = "https://a.klaviyo.com/api";
const KLAVIYO_REVISION = "2024-10-15";

function authHeaders(): Record<string, string> {
  const key = process.env.KLAVIYO_API_KEY;
  if (!key) throw new Error("KLAVIYO_API_KEY manquante — ajoute-la dans les variables d'environnement Vercel.");
  return {
    Authorization: `Klaviyo-API-Key ${key}`,
    revision: KLAVIYO_REVISION,
    accept: "application/json",
    "content-type": "application/json",
  };
}

/** Trouve l'ID interne (opaque, propre à chaque compte) de la métrique « Placed Order ». */
async function findPlacedOrderMetricId(): Promise<string> {
  const url = `${KLAVIYO_BASE}/metrics/?filter=${encodeURIComponent("equals(name,\"Placed Order\")")}`;
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) throw new Error(`Klaviyo /metrics ${res.status}: ${await res.text()}`);
  const body = (await res.json()) as { data?: Array<{ id: string }> };
  const id = body.data?.[0]?.id;
  if (!id) throw new Error("Klaviyo : métrique « Placed Order » introuvable sur ce compte.");
  return id;
}

export interface KlaviyoCampaignRevenue {
  /** CA attribué (en centimes de la devise du compte Klaviyo) sur la période, campagnes email seulement. */
  attributedRevenueCents: number;
  conversions: number;
  campaignsCount: number;
}

/**
 * CA attribué aux campagnes email envoyées entre `sinceDay` et `untilDay`
 * (YYYY-MM-DD inclus) — jamais les flows automatiques (donc jamais
 * BIENVENUE15). Lève une erreur explicite plutôt que de renvoyer 0 en cas de
 * souci réseau/schéma : mieux vaut un écran d'erreur visible qu'un CA
 * silencieusement faux.
 */
export async function fetchKlaviyoCampaignRevenue(
  sinceDay: string,
  untilDay: string
): Promise<KlaviyoCampaignRevenue> {
  const metricId = await findPlacedOrderMetricId();
  const res = await fetch(`${KLAVIYO_BASE}/campaign-values-reports/`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      data: {
        type: "campaign-values-report",
        attributes: {
          timeframe: { start: `${sinceDay}T00:00:00Z`, end: `${untilDay}T23:59:59Z` },
          conversion_metric_id: metricId,
          statistics: ["conversion_value", "conversions"],
          filter: "equals(campaign_messages.channel,'email')",
        },
      },
    }),
  });
  if (!res.ok) throw new Error(`Klaviyo /campaign-values-reports ${res.status}: ${await res.text()}`);
  const body = (await res.json()) as {
    data?: { attributes?: { results?: Array<{ statistics: { conversion_value?: number; conversions?: number } }> } };
  };
  const results = body.data?.attributes?.results;
  if (!Array.isArray(results)) {
    throw new Error("Klaviyo : forme de réponse inattendue sur /campaign-values-reports (schéma probablement changé).");
  }
  let revenue = 0;
  let conversions = 0;
  for (const r of results) {
    revenue += r.statistics.conversion_value ?? 0;
    conversions += r.statistics.conversions ?? 0;
  }
  return {
    attributedRevenueCents: Math.round(revenue * 100),
    conversions,
    campaignsCount: results.length,
  };
}
