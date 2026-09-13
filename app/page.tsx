import Link from "next/link";
import {
  ArrowUpRight,
  AtSign,
  BadgeCheck,
  Ban,
  Fingerprint,
  Hash,
  ScanSearch,
  ShieldCheck,
} from "lucide-react";

const steps = [
  {
    icon: Fingerprint,
    title: "Verify you’re human",
    body: "World ID Selfie Check gates registration so sybil wallets cannot race to claim someone else’s work.",
  },
  {
    icon: AtSign,
    title: "Claim your ENS name",
    body: "Register alice.copywrite.eth, then attach a perceptual-hash record to each piece of media.",
  },
  {
    icon: ScanSearch,
    title: "Anyone can check",
    body: "Platforms and collectors paste a file or URL and see who claimed it first — or that it is still free.",
  },
];

const features = [
  {
    icon: Fingerprint,
    title: "World ID gate",
    body: "Selfie Check proves a unique human is behind every creator label before claims unlock.",
  },
  {
    icon: AtSign,
    title: "ENSv2 subnames",
    body: "Portable identity: post-<hash>.alice.copywrite.eth, independent of any social platform.",
  },
  {
    icon: Hash,
    title: "Perceptual hash",
    body: "Fingerprints survive recompress, crop, and light edits — unlike exact file hashes.",
  },
  {
    icon: ShieldCheck,
    title: "Duplicate block",
    body: "Near-matches are rejected at Hamming distance ≤ 10 so copies cannot sneak in.",
  },
  {
    icon: ScanSearch,
    title: "Public checker",
    body: "No wallet required to ask whether a piece of media is already claimed, and by whom.",
  },
  {
    icon: Ban,
    title: "Owner revoke",
    body: "Claims are non-transferable. Only the original registrant can revoke a record.",
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-col">
      <section className="relative overflow-hidden px-4 py-16 sm:px-6 sm:py-24">
        <div
          className="orb h-64 w-64 bg-[rgba(62,207,190,0.22)]"
          style={{ top: "-4rem", left: "8%" }}
        />
        <div
          className="orb h-52 w-52 bg-[rgba(196,176,138,0.16)]"
          style={{ top: "2rem", right: "6%", animationDelay: "-6s" }}
        />

        <div className="relative mx-auto grid w-full max-w-6xl items-center gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div className="fade-up space-y-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
              ENS · World ID · perceptual hash
            </p>
            <h1 className="font-display text-[2.75rem] leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
              <span className="text-gradient">Prove you made it first</span>
              <span className="mt-2 block text-[var(--ink)]">
                — as a real human.
              </span>
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-[var(--muted)]">
              Copywrite is a creator authenticity registry. Register media
              under your ENSv2 subname, gated by World ID Selfie Check. Anyone
              can check whether a file is already claimed.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link href="/dashboard" className="btn-primary">
                Open dashboard
                <ArrowUpRight size={16} strokeWidth={1.75} />
              </Link>
              <Link href="/checker" className="btn-secondary">
                Check a claim
              </Link>
            </div>
          </div>

          <div className="fade-up relative" style={{ animationDelay: "80ms" }}>
            <div className="card card-hover relative overflow-hidden p-6">
              <div className="mb-5 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--faint)]">
                  Claim certificate
                </p>
                <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-[color-mix(in_oklab,var(--ok)_16%,transparent)] px-2.5 text-xs font-semibold text-[var(--ok)]">
                  <BadgeCheck size={14} strokeWidth={1.75} />
                  Verified human
                </span>
              </div>
              <p className="font-display text-2xl tracking-tight text-[var(--ink)]">
                alice.copywrite.eth
              </p>
              <p className="mt-1 font-mono text-xs text-[var(--muted)]">
                post-7f3a…c91e.alice.copywrite.eth
              </p>
              <dl className="mt-6 grid gap-3 text-sm">
                <div className="flex justify-between gap-4 border-t border-[var(--line)] pt-3">
                  <dt className="text-[var(--faint)]">Hash</dt>
                  <dd className="font-mono text-xs text-[var(--ink)]">
                    7f3a9c…e91b
                  </dd>
                </div>
                <div className="flex justify-between gap-4 border-t border-[var(--line)] pt-3">
                  <dt className="text-[var(--faint)]">Registered</dt>
                  <dd className="text-[var(--ink)]">13 Sep 2026</dd>
                </div>
                <div className="flex justify-between gap-4 border-t border-[var(--line)] pt-3">
                  <dt className="text-[var(--faint)]">License</dt>
                  <dd className="text-[var(--ink)]">All rights reserved</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-[var(--line)] px-4 py-20 sm:px-6 sm:py-24">
        <div className="mx-auto w-full max-w-6xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
            How it works
          </p>
          <h2 className="mt-3 font-display text-4xl tracking-tight sm:text-5xl">
            Three steps to a sealed claim
          </h2>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <article key={step.title} className="card card-hover p-6">
                  <div className="mb-5 flex items-center justify-between">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent-dim)] text-[var(--accent)]">
                      <Icon size={20} strokeWidth={1.75} />
                    </span>
                    <span className="font-mono text-xs text-[var(--faint)]">
                      0{index + 1}
                    </span>
                  </div>
                  <h3 className="font-display text-xl text-[var(--ink)]">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                    {step.body}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-t border-[var(--line)] px-4 py-20 sm:px-6 sm:py-24">
        <div className="mx-auto w-full max-w-6xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
            Capabilities
          </p>
          <h2 className="mt-3 max-w-2xl font-display text-4xl tracking-tight sm:text-5xl">
            Attribution that actually means something
          </h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <article key={feature.title} className="card card-hover p-6">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent-dim)] text-[var(--accent)]">
                    <Icon size={20} strokeWidth={1.75} />
                  </span>
                  <h3 className="mt-4 font-display text-xl text-[var(--ink)]">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                    {feature.body}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-t border-[var(--line)] px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto w-full max-w-6xl">
          <div className="card relative overflow-hidden px-6 py-10 sm:px-10 sm:py-12">
            <div
              className="orb h-40 w-40 bg-[rgba(62,207,190,0.2)]"
              style={{ right: "8%", top: "-2rem" }}
            />
            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-xl space-y-3">
                <h2 className="font-display text-3xl tracking-tight sm:text-4xl">
                  Register your first claim
                </h2>
                <p className="text-[var(--muted)]">
                  Connect on Sepolia, complete Selfie Check, then seal a file
                  under your name. Or skip ahead and check whether a piece of
                  media is already taken.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link href="/dashboard" className="btn-primary">
                  Open dashboard
                </Link>
                <Link href="/checker" className="btn-secondary">
                  Open checker
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
