"use client";

import { WorldSelfieGate } from "@/components/WorldSelfieGate";
import { DashboardCreatorPanel } from "@/components/DashboardCreatorPanel";
import { WorldVerificationProvider } from "@/components/WorldVerificationProvider";
import { DashboardStepRail } from "@/components/DashboardStepRail";
import { PageHeader } from "@/components/PageHeader";

export default function DashboardPage() {
  return (
    <WorldVerificationProvider>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-12">
        <PageHeader
          kicker="Creators"
          title="Creator dashboard"
          description="Connect, complete Selfie Check, then register a creator label and content claim. Duplicates are blocked via perceptual hash."
        />
        <DashboardStepRail />
        <DashboardCreatorPanel gate={<WorldSelfieGate />} />
      </div>
    </WorldVerificationProvider>
  );
}
