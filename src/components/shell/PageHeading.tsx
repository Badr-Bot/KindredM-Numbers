export function PageHeading({
  emoji,
  title,
  subtitle,
  right,
}: {
  emoji: string;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <h1 className="flex items-center gap-2 text-lg font-bold">
          <span aria-hidden>{emoji}</span>
          {title}
        </h1>
        {subtitle && <p className="mt-0.5 text-[11px] text-ink-dim">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}
