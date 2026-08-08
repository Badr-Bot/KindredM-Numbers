// ---------------------------------------------------------------------------
// KLAVIYO — CA attribué aux campagnes email (Jeremy, branché 08/08).
//
// Clé lue via process.env.KLAVIYO_API_KEY (JAMAIS écrite en dur ici — une clé
// commitée reste en clair dans l'historique Git pour toujours). Ajoute-la
// dans Vercel → Settings → Environment Variables.
//
// DEUX filtres, jamais un seul :
//   1. CAMPAGNES seulement, jamais les FLOWS — le mail de bienvenue
//      automatique envoyé à l'inscription est un FLOW chez Klaviyo, pas une
//      campagne. En ne lisant que le rapport « campaign-values-report », les
//      flows sont exclus par construction. C'est aussi le vrai périmètre du
//      travail de Jeremy : il envoie des campagnes, pas les flows déjà en
//      place avant lui.
//   2. Toute campagne dont le NOM contient « bienvenue » est EXCLUE en plus —
//      demande explicite de Badr (08/08) : « chaque code promo avec bienvenue
//      dedans ne doit pas être compté, c'est toute personne qui atterrit sur
//      le site qui peut l'avoir » (donc pas un vrai geste de Jeremy). On
//      filtre sur le NOM de la campagne (donnée fiable, contrôlée par nous),
//      pas sur le contenu du mail (imprévisible à parser).
//
// AVERTISSEMENT : premier jet, jamais testé en conditions réelles (le réseau
// sortant de cette session de code n'a pas accès à l'API Klaviyo — politique
// de l'environnement). Le premier vrai test se fait au déploiement. En cas
// d'erreur HTTP ou de forme de réponse inattendue, la fonction lève une
// exception explicite plutôt que de renvoyer un chiffre inventé.
// ---------------------------------------------------------------------------

const KLAVIYO_BASE = "https://a.klaviyo.com/api";
const KLAVIYO_REVISION = "2024-10-15";

/** Nom de campagne exclu — insensible à la casse (« Bienvenue », « BIENVENUE15 »…). */
const EXCLUDED_CAMPAIGN_NAME_PATTERN = /bienvenue/i;

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

/**
 * Liste les campagnes email envoyées dans la fenêtre, avec leur nom — pour
 * savoir lesquelles exclure (bienvenue). Pagine tant que Klaviyo renvoie un
 * lien "next" (le nombre de campagnes reste modeste : pas de garde-fou de
 * page count ici, une vraie boucle infinie signalerait un bug Klaviyo, pas un
 * volume normal).
 */
async function listCampaignNames(sinceDay: string, untilDay: string): Promise<Map<string, string>> {
  const names = new Map<string, string>();
  const filter = encodeURIComponent(
    `and(equals(messages.channel,'email'),greater-or-equal(send_time,${sinceDay}T00:00:00Z),less-or-equal(send_time,${untilDay}T23:59:59Z))`
  );
  let url: string | null = `${KLAVIYO_BASE}/campaigns/?filter=${filter}&fields[campaign]=name`;
  while (url) {
    const res: Response = await fetch(url, { headers: authHeaders() });
    if (!res.ok) throw new Error(`Klaviyo /campaigns ${res.status}: ${await res.text()}`);
    const body = (await res.json()) as {
      data?: Array<{ id: string; attributes?: { name?: string } }>;
      links?: { next?: string | null };
    };
    for (const c of body.data ?? []) names.set(c.id, c.attributes?.name ?? "");
    url = body.links?.next ?? null;
  }
  return names;
}

export interface KlaviyoCampaignRevenue {
  /** CA attribué (en centimes de la devise du compte Klaviyo) sur la période, campagnes email seulement, hors « bienvenue ». */
  attributedRevenueCents: number;
  conversions: number;
  campaignsCount: number;
  /** Campagnes exclues car leur nom contient « bienvenue » — pour affichage/traçabilité. */
  excludedCampaignNames: string[];
}

/**
 * CA attribué aux campagnes email envoyées entre `sinceDay` et `untilDay`
 * (YYYY-MM-DD inclus) — jamais les flows automatiques, jamais les campagnes
 * « bienvenue » (voir le double filtre en tête de fichier). Lève une erreur
 * explicite plutôt que de renvoyer 0 en cas de souci réseau/schéma : mieux
 * vaut un écran d'erreur visible qu'un CA silencieusement faux.
 */
export async function fetchKlaviyoCampaignRevenue(
  sinceDay: string,
  untilDay: string
): Promise<KlaviyoCampaignRevenue> {
  const [metricId, campaignNames] = await Promise.all([
    findPlacedOrderMetricId(),
    listCampaignNames(sinceDay, untilDay),
  ]);
  const excludedIds = new Set(
    [...campaignNames.entries()].filter(([, name]) => EXCLUDED_CAMPAIGN_NAME_PATTERN.test(name)).map(([id]) => id)
  );

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
          groupings: ["campaign_id"],
        },
      },
    }),
  });
  if (!res.ok) throw new Error(`Klaviyo /campaign-values-reports ${res.status}: ${await res.text()}`);
  const body = (await res.json()) as {
    data?: {
      attributes?: {
        results?: Array<{
          groupings: { campaign_id?: string };
          statistics: { conversion_value?: number; conversions?: number };
        }>;
      };
    };
  };
  const results = body.data?.attributes?.results;
  if (!Array.isArray(results)) {
    throw new Error("Klaviyo : forme de réponse inattendue sur /campaign-values-reports (schéma probablement changé).");
  }

  let revenue = 0;
  let conversions = 0;
  let counted = 0;
  for (const r of results) {
    const campaignId = r.groupings?.campaign_id;
    if (campaignId && excludedIds.has(campaignId)) continue; // « bienvenue » — jamais compté
    revenue += r.statistics.conversion_value ?? 0;
    conversions += r.statistics.conversions ?? 0;
    counted += 1;
  }

  return {
    attributedRevenueCents: Math.round(revenue * 100),
    conversions,
    campaignsCount: counted,
    excludedCampaignNames: [...excludedIds].map((id) => campaignNames.get(id) ?? id),
  };
}
