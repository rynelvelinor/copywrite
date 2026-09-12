"use client";

import { WorldSelfieGate } from "@/components/WorldSelfieGate";
import { DashboardCreatorPanel } from "@/components/DashboardCreatorPanel";
import { WorldVerificationProvider } from "@/components/WorldVerificationProvider";

export default function DashboardPage() {
  return (
    <WorldVerificationProvider>
      <div className="flex flex-col gap-8">
        <header className="space-y-2">
          <h1 className="font-[family-name:var(--font-display)] text-4xl tracking-tight text-[var(--ink)]">
            Creator dashboard
          </h1>
          <p className="max-w-2xl text-[var(--muted)]">
            Connect, complete Selfie Check, then register a creator label and
            content claim. Duplicates are blocked via perceptual hash.
          </p>
        </header>

        <WorldSelfieGate />
        <DashboardCreatorPanel />
      </div>
    </WorldVerificationProvider>
  );
}
