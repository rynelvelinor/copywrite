"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";

export function DashboardCreatorPanel() {
  const { address, isConnected } = useAccount();
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!address) {
        setVerified(false);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(
          `/api/worldid/status?address=${encodeURIComponent(address)}`,
        );
        const data = (await res.json()) as { verified?: boolean };
        if (!cancelled) setVerified(Boolean(data.verified));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [address]);

  return (
    <div className="rounded-lg border border-dashed border-[var(--line)] bg-[color-mix(in_oklab,var(--surface)_70%,transparent)] p-5">
      <h2 className="font-[family-name:var(--font-display)] text-xl text-[var(--ink)]">
        ENS registration
      </h2>
      <p className="mt-2 text-sm text-[var(--muted)]">
        After Selfie Check, you will mint{" "}
        <code className="rounded bg-[var(--accent-soft)] px-1.5 py-0.5 font-mono text-xs">
          you.contentproof.eth
        </code>{" "}
        and attach content subnames. Contract wiring is Phase 3+.
      </p>

      {!isConnected && (
        <p className="mt-4 text-sm text-[var(--warn)]">Wallet not connected.</p>
      )}
      {isConnected && loading && (
        <p className="mt-4 text-sm text-[var(--muted)]">Checking verification…</p>
      )}
      {isConnected && !loading && !verified && (
        <p className="mt-4 text-sm text-[var(--warn)]">
          Registration locked until Selfie Check succeeds.
        </p>
      )}
      {isConnected && !loading && verified && (
        <button
          type="button"
          disabled
          className="mt-4 inline-flex h-11 cursor-not-allowed items-center rounded-md border border-[var(--line)] px-5 text-sm font-semibold text-[var(--muted)]"
        >
          Claim ENS subname (coming next)
        </button>
      )}
    </div>
  );
}
