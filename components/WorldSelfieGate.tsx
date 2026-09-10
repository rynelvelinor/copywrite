"use client";

import { useCallback, useEffect, useState } from "react";
import {
  IDKitRequestWidget,
  selfieCheckLegacy,
  type IDKitResult,
  type RpContext,
} from "@worldcoin/idkit";
import { useAccount } from "wagmi";
import {
  WORLD_ACTION,
  getWorldEnvironment,
} from "@/lib/worldid/client-config";

type SignResponse = {
  appId: `app_${string}`;
  action: string;
  rp_context: RpContext;
  error?: string;
};

type StatusResponse = {
  verified: boolean;
};

export function WorldSelfieGate() {
  const { address, isConnected } = useAccount();
  const [open, setOpen] = useState(false);
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appId, setAppId] = useState<`app_${string}` | null>(null);
  const [rpContext, setRpContext] = useState<RpContext | null>(null);

  const refreshStatus = useCallback(async () => {
    if (!address) {
      setVerified(false);
      return;
    }
    const res = await fetch(
      `/api/worldid/status?address=${encodeURIComponent(address)}`,
    );
    const data = (await res.json()) as StatusResponse;
    setVerified(Boolean(data.verified));
  }, [address]);

  useEffect(() => {
    void refreshStatus();
  }, [refreshStatus]);

  async function prepareAndOpen() {
    if (!address) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/worldid/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signal: address }),
      });
      const data = (await res.json()) as SignResponse;
      if (!res.ok) {
        throw new Error(data.error || "Could not prepare World ID request");
      }
      setAppId(data.appId);
      setRpContext(data.rp_context);
      setOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "World ID setup failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(result: IDKitResult) {
    if (!address) throw new Error("Wallet not connected");
    const res = await fetch("/api/worldid/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        address,
        idkitResponse: result,
      }),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      throw new Error(data.error || "Backend verification failed");
    }
  }

  if (!isConnected || !address) {
    return (
      <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-5">
        <h2 className="font-[family-name:var(--font-display)] text-xl text-[var(--ink)]">
          Selfie Check
        </h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Connect a wallet to start World ID Selfie Check. Registration stays
          locked until you verify as a unique human.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-xl text-[var(--ink)]">
            Selfie Check
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-[var(--muted)]">
            World ID gates creator registration so sybil wallets cannot race to
            claim someone else&apos;s content.
          </p>
        </div>
        <span
          className={`inline-flex h-8 items-center rounded-full px-3 text-xs font-semibold ${
            verified
              ? "bg-[color-mix(in_oklab,var(--ok)_18%,white)] text-[var(--ok)]"
              : "bg-[color-mix(in_oklab,var(--warn)_16%,white)] text-[var(--warn)]"
          }`}
        >
          {verified ? "Verified human" : "Not verified"}
        </span>
      </div>

      {!verified && (
        <button
          type="button"
          onClick={() => void prepareAndOpen()}
          disabled={loading}
          className="mt-4 inline-flex h-11 items-center justify-center rounded-md bg-[var(--accent)] px-5 text-sm font-semibold text-[var(--surface)] transition hover:brightness-110 disabled:opacity-60"
        >
          {loading ? "Preparing…" : "Verify with World ID"}
        </button>
      )}

      {error && (
        <p className="mt-3 text-sm text-[var(--warn)]" role="alert">
          {error}
        </p>
      )}

      {appId && rpContext && (
        <IDKitRequestWidget
          open={open}
          onOpenChange={setOpen}
          app_id={appId}
          action={WORLD_ACTION}
          rp_context={rpContext}
          allow_legacy_proofs
          environment={getWorldEnvironment()}
          preset={selfieCheckLegacy({ signal: address })}
          handleVerify={handleVerify}
          onSuccess={() => {
            setVerified(true);
            void refreshStatus();
          }}
          onError={(code) => {
            setError(`World ID error: ${code}`);
          }}
        />
      )}
    </div>
  );
}
