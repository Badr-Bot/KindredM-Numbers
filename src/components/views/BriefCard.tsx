import type { Brief } from "@/lib/brief";

const TONE_CLASS = {
  good: "text-phosphor",
  bad: "text-red",
  neutral: "text-ink-dim",
} as const;

/** 🧠 Brief du jour — le résumé quotidien en 4 lignes, sur l'accueil. */
export function BriefCard({ brief }: { brief: Brief }) {
  return (
    <section className="rise-in mb-4 rounded-lg border border-line bg-panel/40 p-3.5 lg:p-4">
      <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-dim lg:text-xs">
        🧠 Brief du jour
      </div>
      <ul className="flex flex-col gap-1">
        {brief.lines.map((l, i) => (
          <li key={i} className="text-[11.5px] leading-snug lg:text-[13px]">
            <span aria-hidden className="mr-1">{l.emoji}</span>
            <span className={TONE_CLASS[l.tone]}>{l.text}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
