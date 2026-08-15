/**
 * Applique le style « maison NIVA » au checkout d'un store Shopify.
 *
 *   npm run checkout-branding -- --market FR            # dry-run (affiche le payload)
 *   npm run checkout-branding -- --market FR --apply    # envoie la mutation
 *
 * ⚠️ `checkoutBrandingUpsert` exige un plan **Plus** (ou une boutique de dev).
 * Les stores NIVA sont en Advanced : ce script répond « Access denied » tant
 * que ce n'est pas le cas. Le style se saisit alors à la main dans l'éditeur
 * de checkout — les valeurs exactes sont dans NIVA_CHECKOUT_STYLE.md, et ce
 * script reste la source de vérité pour ne rien oublier.
 *
 * À lancer EN LOCAL avec les vrais tokens dans .env.local.
 */
import "./load-env";
import { getShopifyStoreConfigs, resolveAccessToken } from "../src/lib/shopify";
import { CHECKOUT_BRANDING_MUTATION, nivaCheckoutBrandingInput } from "../src/lib/checkoutBranding";

const API_VERSION = "2025-01";

/** Fichiers du thème live (settings_data.json) — mêmes noms sur tous les stores. */
const LOGO_FILENAME = "niva-logo-noir.png";
const FAVICON_FILENAME = "niva-favicon-beige.png";

async function graphql<T>(
  domain: string,
  token: string,
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const res = await fetch(`https://${domain}/admin/api/${API_VERSION}/graphql.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": token },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`${domain}: HTTP ${res.status} ${await res.text()}`);

  const json = (await res.json()) as { data?: T; errors?: Array<{ message: string }> };
  if (json.errors?.length) {
    throw new Error(`${domain}: ${json.errors.map((e) => e.message).join(" · ")}`);
  }
  if (!json.data) throw new Error(`${domain}: réponse GraphQL vide`);
  return json.data;
}

/** Profil de checkout publié — c'est celui que voient les clients. */
async function publishedCheckoutProfileId(domain: string, token: string): Promise<string> {
  const data = await graphql<{
    checkoutProfiles: { nodes: Array<{ id: string; name: string; isPublished: boolean }> };
  }>(
    domain,
    token,
    `query { checkoutProfiles(first: 20) { nodes { id name isPublished } } }`
  );

  const published = data.checkoutProfiles.nodes.find((p) => p.isPublished);
  if (!published) throw new Error(`${domain}: aucun profil de checkout publié`);
  return published.id;
}

/** Résout un MediaImage par nom de fichier (les gid diffèrent d'un store à l'autre). */
async function mediaImageIdByFilename(
  domain: string,
  token: string,
  filename: string
): Promise<string | undefined> {
  const data = await graphql<{ files: { nodes: Array<{ id: string }> } }>(
    domain,
    token,
    `query FileByName($q: String!) { files(first: 1, query: $q) { nodes { id } } }`,
    { q: `filename:${filename}` }
  );
  return data.files.nodes[0]?.id;
}

async function main() {
  const args = process.argv.slice(2);
  const apply = args.includes("--apply");
  const marketArg = args[args.indexOf("--market") + 1];
  const market = args.includes("--market") ? marketArg?.toUpperCase() : "FR";

  const config = getShopifyStoreConfigs().find((c) => c.market === market);
  if (!config) throw new Error(`Marché inconnu : ${market} (attendu ES | UK | DE | FR)`);

  const token = await resolveAccessToken(config);
  const checkoutProfileId = await publishedCheckoutProfileId(config.domain, token);

  const [logoMediaImageId, faviconMediaImageId] = await Promise.all([
    mediaImageIdByFilename(config.domain, token, LOGO_FILENAME),
    mediaImageIdByFilename(config.domain, token, FAVICON_FILENAME),
  ]);
  if (!logoMediaImageId) console.warn(`⚠️  ${LOGO_FILENAME} introuvable → logo laissé tel quel`);
  if (!faviconMediaImageId) console.warn(`⚠️  ${FAVICON_FILENAME} introuvable → favicon laissé tel quel`);

  const checkoutBrandingInput = nivaCheckoutBrandingInput({ logoMediaImageId, faviconMediaImageId });

  console.log(`\n=== ${market} · ${config.domain} ===`);
  console.log(`profil de checkout publié : ${checkoutProfileId}`);

  if (!apply) {
    console.log(JSON.stringify(checkoutBrandingInput, null, 2));
    console.log("\n(dry-run — relance avec --apply pour envoyer)");
    return;
  }

  const data = await graphql<{
    checkoutBrandingUpsert: { userErrors: Array<{ field: string[]; message: string }> };
  }>(config.domain, token, CHECKOUT_BRANDING_MUTATION, {
    checkoutProfileId,
    checkoutBrandingInput,
  });

  const errors = data.checkoutBrandingUpsert.userErrors;
  if (errors.length) {
    for (const e of errors) console.error(`❌ ${e.field?.join(".")}: ${e.message}`);
    process.exitCode = 1;
    return;
  }
  console.log("✅ Style maison appliqué au checkout.");
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
