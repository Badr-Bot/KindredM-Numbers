import { fetchUnmappedCampaigns, getDataMode, type DataMode } from "@/lib/data";
import { PageHeading } from "@/components/shell/PageHeading";
import { EmptyState } from "@/components/shell/EmptyState";
import { UnmappedSpend } from "@/components/views/UnmappedSpend";

export const dynamic = "force-dynamic";

// Simplifié le 08/08 (demande Badr : « l'onglet Contrôle sert à rien ») —
// retiré de la navigation principale (BottomNav) et allégé du bloc
// remboursements/rétrofacturations (les remboursements sont déjà 100 %
// automatiques et affichés dans Mois ; les rétrofacturations attendent une
// permission Shopify supplémentaire, voir MEMO.md). Cette page RESTE en
// place pour une seule chose utile : affecter une campagne Meta toute
// neuve à un marché (lien depuis le bandeau ⚠️ du Live).
export default async function ControlPage() {
  const mode: DataMode = getDataMode();
  if (mode === "unconfigured") {
    return (
      <div>
        <PageHeading emoji="📡" title="Spend non affecté" />
        <EmptyState />
      </div>
    );
  }

  const unmappedCampaigns = await fetchUnmappedCampaigns();

  return (
    <div>
      <PageHeading
        emoji="📡"
        title="Spend non affecté"
        subtitle="Nouvelles campagnes Meta pas encore rattachées à un marché"
      />
      <UnmappedSpend mode={mode} campaigns={unmappedCampaigns} />
    </div>
  );
}
