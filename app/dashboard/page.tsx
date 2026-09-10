import { WorldSelfieGate } from "@/components/WorldSelfieGate";
import { DashboardCreatorPanel } from "@/components/DashboardCreatorPanel";

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-8">
      <header className="space-y-2">
        <h1 className="font-[family-name:var(--font-display)] text-4xl tracking-tight text-[var(--ink)]">
          Creator dashboard
        </h1>
        <p className="max-w-2xl text-[var(--muted)]">
          Connect, complete Selfie Check, then register an ENSv2 creator subname
          and content claims. ENS writes land in a later phase — the gate is live
          now.
        </p>
      </header>

      <WorldSelfieGate />
      <DashboardCreatorPanel />
    </div>
  );
}
