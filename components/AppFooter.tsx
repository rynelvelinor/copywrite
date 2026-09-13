"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandMark } from "@/components/BrandMark";

export function AppFooter() {
  const pathname = usePathname();
  const isAppRoute = pathname === "/dashboard" || pathname === "/checker";

  if (isAppRoute) {
    return (
      <footer className="relative z-10 border-t border-[var(--line)] px-4 py-5 text-center text-xs text-[var(--faint)] sm:px-6">
        Copywrite · ENSv2 claims gated by World ID Selfie Check
      </footer>
    );
  }

  return (
    <footer className="relative z-10 border-t border-[var(--line)]">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-1">
          <Link href="/" className="inline-flex items-center gap-2">
            <BrandMark className="h-7 w-7" />
            <span className="font-display text-lg tracking-tight">Copywrite</span>
          </Link>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-[var(--muted)]">
            Prove you made it first — as a real, unique human.
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--faint)]">
            Product
          </p>
          <ul className="mt-3 space-y-2 text-sm text-[var(--muted)]">
            <li>
              <Link href="/dashboard" className="hover:text-[var(--ink)]">
                Dashboard
              </Link>
            </li>
            <li>
              <Link href="/checker" className="hover:text-[var(--ink)]">
                Checker
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--faint)]">
            Tracks
          </p>
          <ul className="mt-3 space-y-2 text-sm text-[var(--muted)]">
            <li>ENSv2 subnames</li>
            <li>World ID Selfie Check</li>
            <li>Perceptual hash</li>
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--faint)]">
            Network
          </p>
          <ul className="mt-3 space-y-2 text-sm text-[var(--muted)]">
            <li>Sepolia</li>
            <li>Index + optional on-chain claims</li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
