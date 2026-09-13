export function PageHeader({
  kicker,
  title,
  description,
}: {
  kicker?: string;
  title: string;
  description: string;
}) {
  return (
    <header className="fade-up space-y-3">
      {kicker && (
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
          {kicker}
        </p>
      )}
      <h1 className="font-display text-4xl tracking-tight text-[var(--ink)] sm:text-[2.75rem]">
        {title}
      </h1>
      <p className="max-w-2xl text-base leading-relaxed text-[var(--muted)]">
        {description}
      </p>
    </header>
  );
}
