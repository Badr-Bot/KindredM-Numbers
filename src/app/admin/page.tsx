import { getDataMode } from "@/lib/data";
import { PageHeading } from "@/components/shell/PageHeading";
import { EmptyState } from "@/components/shell/EmptyState";
import { AdminSetup } from "@/components/views/AdminSetup";
import { EnvCheck } from "@/components/views/EnvCheck";

export const dynamic = "force-dynamic";

export default function AdminPage() {
  const mode = getDataMode();

  return (
    <div>
      <PageHeading
        emoji="⚙️"
        title="Configuration"
        subtitle="Découverte produits → mapping → backfill, en 3 clics"
      />
      <div className="mb-3">
        <EnvCheck />
      </div>
      {mode !== "live" ? (
        <>
          <EmptyState />
          <p className="mt-3 text-center text-[11px] text-ink-faint">
            Supabase n&apos;est pas encore reconnu — regarde le diagnostic ci-dessus.
          </p>
        </>
      ) : (
        <AdminSetup />
      )}
    </div>
  );
}
