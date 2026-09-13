"use client";

import { Check, Fingerprint, FilePlus2, Wallet } from "lucide-react";
import { useAccount } from "wagmi";
import { useWorldVerification } from "@/components/WorldVerificationProvider";

const steps = [
  { id: "connect", label: "Connect wallet", icon: Wallet },
  { id: "selfie", label: "Selfie Check", icon: Fingerprint },
  { id: "register", label: "Register claim", icon: FilePlus2 },
] as const;

export function DashboardStepRail() {
  const { isConnected } = useAccount();
  const { verified } = useWorldVerification();

  const done = [isConnected, verified, false] as const;

  return (
    <ol className="grid gap-2 sm:grid-cols-3">
      {steps.map((step, index) => {
        const Icon = step.icon;
        const isDone = done[index];
        const isCurrent =
          (index === 0 && !isConnected) ||
          (index === 1 && isConnected && !verified) ||
          (index === 2 && isConnected && verified);
        return (
          <li
            key={step.id}
            className={`flex items-center gap-3 rounded-[var(--radius-lg)] border px-4 py-3 ${
              isCurrent
                ? "border-[var(--accent)] bg-[var(--accent-dim)]"
                : "border-[var(--line)] bg-[var(--surface)]"
            }`}
          >
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-full ${
                isDone
                  ? "bg-[color-mix(in_oklab,var(--ok)_18%,transparent)] text-[var(--ok)]"
                  : isCurrent
                    ? "bg-[var(--accent)] text-[var(--void)]"
                    : "bg-[var(--surface-2)] text-[var(--muted)]"
              }`}
            >
              {isDone ? (
                <Check size={16} strokeWidth={1.75} />
              ) : (
                <Icon size={16} strokeWidth={1.75} />
              )}
            </span>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--faint)]">
                Step {index + 1}
              </p>
              <p className="text-sm font-semibold text-[var(--ink)]">
                {step.label}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
