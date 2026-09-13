"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ScanSearch } from "lucide-react";
import { ConnectButton } from "@/components/ConnectButton";
import { BrandMark } from "@/components/BrandMark";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/checker", label: "Checker", icon: ScanSearch },
] as const;

export function AppHeader() {
  const pathname = usePathname();

  return (
    <header className="glass-header sticky top-0 z-40 border-b border-[var(--line)]">
      <div className="mx-auto flex h-[72px] w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5">
            <BrandMark />
            <span className="font-display text-xl tracking-tight text-[var(--ink)]">
              Copywrite
            </span>
          </Link>
          <nav className="hidden items-center gap-1 sm:flex">
            {links.map((link) => {
              const active =
                pathname === link.href || pathname.startsWith(`${link.href}/`);
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`inline-flex items-center gap-1.5 rounded-[var(--radius-md)] px-3 py-1.5 text-sm transition-colors ${
                    active
                      ? "bg-[var(--accent-dim)] text-[var(--accent)]"
                      : "text-[var(--muted)] hover:text-[var(--ink)]"
                  }`}
                >
                  <Icon size={16} strokeWidth={1.75} />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <ConnectButton />
      </div>
      <nav className="flex gap-1 border-t border-[var(--line)] px-4 py-2 sm:hidden">
        {links.map((link) => {
          const active =
            pathname === link.href || pathname.startsWith(`${link.href}/`);
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-[var(--radius-md)] px-3 py-2 text-sm ${
                active
                  ? "bg-[var(--accent-dim)] text-[var(--accent)]"
                  : "text-[var(--muted)]"
              }`}
            >
              <Icon size={16} strokeWidth={1.75} />
              {link.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
