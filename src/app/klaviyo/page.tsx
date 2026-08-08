import { listAllCampaigns, listAllFlows, type KlaviyoCampaignListItem, type KlaviyoFlowListItem } from "@/lib/klaviyo";
import { PageHeading } from "@/components/shell/PageHeading";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Page volontairement HORS de BottomNav (demande Badr 08/08 : pas sur le
// dashboard principal, un lien à part suffit — /klaviyo). Même protection
// mot de passe que le reste du site (proxy.ts, matcher global).
// Lecture seule : appelle l'API Klaviyo à chaque chargement, rien n'est mis
// en cache ni stocké.

const CAMPAIGN_STATUS_LABEL: Record<string, string> = {
  Sent: "✅ Envoyée",
  Scheduled: "🕒 Programmée",
  Draft: "📝 Brouillon",
  Sending: "📤 En cours d'envoi",
  Cancelled: "🚫 Annulée",
};

const FLOW_STATUS_LABEL: Record<string, string> = {
  live: "✅ Actif",
  draft: "📝 Brouillon",
  manual: "🖐️ Manuel",
};

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("fr-FR", {
    timeZone: "Europe/Paris",
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function KlaviyoPage() {
  let campaigns: KlaviyoCampaignListItem[] | null = null;
  let flows: KlaviyoFlowListItem[] | null = null;
  let error: string | null = null;

  try {
    [campaigns, flows] = await Promise.all([listAllCampaigns("email"), listAllFlows()]);
  } catch (err) {
    error = (err as Error).message;
  }

  return (
    <div>
      <PageHeading
        emoji="📧"
        title="Klaviyo — campagnes & flows"
        subtitle="Lecture seule, pas dans la navigation principale — état réel du compte à l'instant du chargement"
      />

      {error ? (
        <p className="rounded-lg border border-red/40 bg-red/[0.04] p-3 text-[11.5px] text-red">
          ⚠️ {error.includes("KLAVIYO_API_KEY") ? "Clé Klaviyo pas encore ajoutée dans Vercel." : error}
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          <section className="rounded-lg border border-line bg-panel/40 p-3.5">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-semibold">📬 Campagnes email</span>
              <span className="rounded border border-line-soft px-1.5 py-0.5 text-[9px] font-bold text-ink-dim">
                {campaigns!.length}
              </span>
            </div>
            {campaigns!.length === 0 ? (
              <p className="text-[11px] text-ink-dim">Aucune campagne email trouvée sur ce compte.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px]">
                  <thead>
                    <tr className="text-ink-faint">
                      <th className="pb-1.5 pr-2 font-medium">Nom</th>
                      <th className="pb-1.5 pr-2 font-medium">Statut</th>
                      <th className="pb-1.5 pr-2 font-medium">Programmée / envoyée</th>
                      <th className="pb-1.5 font-medium">Créée</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns!.map((c) => (
                      <tr key={c.id} className="border-t border-line-soft">
                        <td className="py-1.5 pr-2">
                          {c.name}
                          {c.archived ? " 🗄️" : ""}
                        </td>
                        <td className="py-1.5 pr-2">{CAMPAIGN_STATUS_LABEL[c.status] ?? c.status}</td>
                        <td className="py-1.5 pr-2 tnum">{formatDateTime(c.sendTime ?? c.scheduledAt)}</td>
                        <td className="py-1.5 tnum">{formatDateTime(c.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="rounded-lg border border-line bg-panel/40 p-3.5">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-semibold">🔁 Flows (automatiques)</span>
              <span className="rounded border border-line-soft px-1.5 py-0.5 text-[9px] font-bold text-ink-dim">
                {flows!.length}
              </span>
            </div>
            {flows!.length === 0 ? (
              <p className="text-[11px] text-ink-dim">Aucun flow trouvé sur ce compte.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px]">
                  <thead>
                    <tr className="text-ink-faint">
                      <th className="pb-1.5 pr-2 font-medium">Nom</th>
                      <th className="pb-1.5 pr-2 font-medium">Statut</th>
                      <th className="pb-1.5 pr-2 font-medium">Déclencheur</th>
                      <th className="pb-1.5 font-medium">Mis à jour</th>
                    </tr>
                  </thead>
                  <tbody>
                    {flows!.map((f) => (
                      <tr key={f.id} className="border-t border-line-soft">
                        <td className="py-1.5 pr-2">
                          {f.name}
                          {f.archived ? " 🗄️" : ""}
                        </td>
                        <td className="py-1.5 pr-2">{FLOW_STATUS_LABEL[f.status] ?? f.status}</td>
                        <td className="py-1.5 pr-2">{f.triggerType ?? "—"}</td>
                        <td className="py-1.5 tnum">{formatDateTime(f.updatedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
