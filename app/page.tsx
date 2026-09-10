import Link from "next/link";

export default function HomePage() {
  return (
    <section className="flex flex-1 flex-col justify-center gap-10 py-6 sm:py-16">
      <div className="max-w-3xl space-y-5">
        <p className="font-[family-name:var(--font-display)] text-5xl leading-[1.05] tracking-tight text-[var(--ink)] sm:text-6xl md:text-7xl">
          ContentProof
        </p>
        <h1 className="max-w-2xl text-2xl font-medium leading-snug text-[var(--ink)] sm:text-3xl">
          Prove you made it first — as a real, unique human.
        </h1>
        <p className="max-w-xl text-lg leading-relaxed text-[var(--muted)]">
          Register content under your ENSv2 subname, gated by World ID Selfie
          Check. Anyone can check whether a piece of media is already claimed.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Link
          href="/dashboard"
          className="inline-flex h-12 items-center justify-center rounded-md bg-[var(--accent)] px-6 text-base font-semibold text-[var(--surface)] transition hover:brightness-110"
        >
          Open dashboard
        </Link>
        <Link
          href="/checker"
          className="inline-flex h-12 items-center justify-center rounded-md border border-[var(--line)] bg-[var(--surface)] px-6 text-base font-semibold text-[var(--ink)] transition hover:border-[var(--accent)]"
        >
          Check a claim
        </Link>
      </div>
    </section>
  );
}
