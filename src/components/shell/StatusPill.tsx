import type { RoasStatus } from "@/lib/engine";

const CONFIG: Record<RoasStatus, { dot: string; text: string; ring: string; label: string }> = {
  red: { dot: "🔴", text: "text-red", ring: "border-red/40 bg-red/5", label: "sous seuil" },
  yellow: { dot: "🟡", text: "text-amber", ring: "border-amber/40 bg-amber/5", label: "vers cible" },
  green: { dot: "🟢", text: "text-phosphor", ring: "border-phosphor/40 bg-phosphor/5", label: "≥ cible" },
};

export function statusText(status: RoasStatus): string {
  return CONFIG[status].text;
}

export function StatusDot({ status }: { status: RoasStatus }) {
  return <span aria-hidden>{CONFIG[status].dot}</span>;
}

export function StatusPill({ status, merLabel }: { status: RoasStatus; merLabel: string }) {
  const c = CONFIG[status];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[11px] font-medium tnum ${c.ring} ${c.text}`}
    >
      <span aria-hidden>{c.dot}</span>
      {merLabel}
    </span>
  );
}
