/**
 * Backfill initial (§7.4) — CLI équivalente au bouton "Lancer le backfill" de
 * /admin. À lancer EN LOCAL avec les vrais tokens dans .env.local, APRÈS que
 * products_map ait été chargé.
 *
 *   npm run backfill
 */
import "./load-env";
import { runFullBackfill } from "../src/lib/backfillRun";

async function main() {
  const result = await runFullBackfill();

  for (const [market, count] of Object.entries(result.ordersByStore)) {
    console.log(`${market}: ${count} commandes backfillées.`);
  }
  console.log(`Meta spend: ${result.metaSpendRows} lignes.`);
  if (result.unmappedCampaigns.length > 0) {
    console.warn(`⚠️  ${result.unmappedCampaigns.length} campagnes en UNMAPPED — à affecter dans l'onglet Contrôle :`);
    for (const name of result.unmappedCampaigns) console.warn(`   - ${name}`);
  }
  console.log(`daily_aggregates recalculé pour ${result.daysRecomputed} jours.`);
  console.log("Backfill terminé. Vérifie les totaux affichés contre l'admin Shopify de chaque store (§7.4).");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
