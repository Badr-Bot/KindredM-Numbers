import { getDataMode } from "@/lib/data";
import { PageHeading } from "@/components/shell/PageHeading";
import { EmptyState } from "@/components/shell/EmptyState";
import { AdminSetup } from "@/components/views/AdminSetup";

export const dynamic = "force-dynamic";

export default function AdminPage() {
  const mode = getDataMode();
  if (mode !== "live") {
    return (
      <div>
        <PageHeading emoji="⚙️" title="Configuration" />
        <EmptyState />
        <p className="mt-3 text-center text-[11px] text-ink-faint">
          Cette page nécessite Supabase configuré (mode réel).
        </p>
      </div>
    );
  }

  return (
    <div>
      <PageHeading
        emoji="⚙️"
        title="Configuration"
        subtitle="Découverte produits → mapping → backfill, en 3 clics"
      />
      <AdminSetup />
    </div>
  );
}
