import { NextResponse } from "next/server";
import { getShopifyStoreConfigs, resolveAccessToken } from "@/lib/shopify";

// Sonde READ-ONLY : quels droits Shopify le dashboard a-t-il RÉELLEMENT ?
//
// Créée le 17/08 quand Badr a publié une nouvelle version de l'app pour
// ajouter les litiges (chargebacks). Publier une version ne suffit pas : la
// doc Shopify est explicite, le marchand doit APPROUVER les nouvelles portées
// côté boutique, sinon le token continue avec les anciennes. Sans cette
// sonde, la seule façon de savoir était d'essayer un appel et d'interpréter
// une erreur — exactement le genre de devinette qui a coûté une nuit sur les
// frais. Ici la réponse est factuelle : Shopify liste lui-même les portées
// accordées (currentAppInstallation.accessScopes).
//
// Aucun secret exposé : uniquement des noms de portées et le domaine.

const API_VERSION = "2025-01";
const QUERY = `{ currentAppInstallation { accessScopes { handle } } }`;

/** Portées nécessaires au dashboard, et à quoi chacune sert. */
const NEEDED: Record<string, string> = {
  read_orders: "commandes (CA, COGS, remboursements, frais réels)",
  read_products: "titres produits (mapping COGS)",
};
/** Portées optionnelles : absentes = fonctionnalité indisponible, pas une panne. */
const OPTIONAL: Record<string, string> = {
  read_all_orders: "commandes de plus de 60 jours (historique mai/juin)",
  read_shopify_payments_disputes: "chargebacks (litiges) — à déduire du net",
  read_shopify_payments_payouts: "alternative acceptée pour lire les litiges",
};

export async function GET() {
  const stores = await Promise.all(
    getShopifyStoreConfigs().map(async (config) => {
      try {
        const token = await resolveAccessToken(config);
        const res = await fetch(`https://${config.domain}/admin/api/${API_VERSION}/graphql.json`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": token },
          body: JSON.stringify({ query: QUERY }),
        });
        if (!res.ok) {
          return { market: config.market, ok: false, reason: `HTTP ${res.status}` };
        }
        const body = (await res.json()) as {
          data?: { currentAppInstallation?: { accessScopes?: { handle: string }[] } };
          errors?: { message: string }[];
        };
        if (body.errors?.length) {
          return { market: config.market, ok: false, reason: body.errors[0].message };
        }
        const granted = (body.data?.currentAppInstallation?.accessScopes ?? []).map((s) => s.handle);
        const missingRequired = Object.keys(NEEDED).filter((s) => !granted.includes(s));
        // Les litiges acceptent l'une OU l'autre portée (doc Shopify).
        const canReadDisputes =
          granted.includes("read_shopify_payments_disputes") ||
          granted.includes("read_shopify_payments_payouts");
        return {
          market: config.market,
          ok: true,
          granted: granted.sort(),
          missingRequired,
          canReadDisputes,
          canReadOldOrders: granted.includes("read_all_orders"),
        };
      } catch (err) {
        return { market: config.market, ok: false, reason: (err as Error).message };
      }
    })
  );

  return NextResponse.json({
    ok: true,
    legend: { required: NEEDED, optional: OPTIONAL },
    stores,
    deployedCommit: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
  });
}
