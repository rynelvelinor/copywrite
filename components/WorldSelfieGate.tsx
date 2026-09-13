"use client";

import { useState } from "react";
import {
  IDKitRequestWidget,
  selfieCheckLegacy,
  type IDKitResult,
  type RpContext,
} from "@worldcoin/idkit";
import { Fingerprint } from "lucide-react";
import { useAccount } from "wagmi";
import {
  WORLD_ACTION,
  getWorldEnvironment,
} from "@/lib/worldid/client-config";
import { useWorldVerification } from "@/components/WorldVerificationProvider";

type SignResponse = {
  appId: `app_${string}`;
  action: string;
  rp_context: RpContext;
  error?: string;
};

export function WorldSelfieGate() {
  const { address, isConnected } = useAccount();
  const { verified, loading: statusLoading, refresh, markVerified } =
    useWorldVerification();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appId, setAppId] = useState<`app_${string}` | null>(null);
  const [rpContext, setRpContext] = useState<RpContext | null>(null);

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
    const data = (await res.json()) as {
      error?: string;
      hint?: string;
      code?: string;
    };
    if (!res.ok) {
      const parts = [data.error || "Backend verification failed"];
      if (data.code) parts.push(`(${data.code})`);
      if (data.hint) parts.push(data.hint);
      throw new Error(parts.join(" — "));
    }

    markVerified();
    await refresh();

    // Best-effort on-chain unlock; never fail the Selfie Check over this.
    try {
      await fetch("/api/operator/sync-verified", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      });
    } catch {
      // ignore
    }
  }

  if (!isConnected || !address) {
    return (
      <div className="card p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--accent-dim)] text-[var(--accent)]">
            <Fingerprint size={20} strokeWidth={1.75} />
          </span>
          <div>
            <h2 className="font-display text-xl text-[var(--ink)]">Selfie Check</h2>
            <p className="mt-1 text-sm leading-relaxed text-[var(--muted)]">
              Connect a wallet to start World ID Selfie Check. Registration stays
              locked until you verify as a unique human.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--accent-dim)] text-[var(--accent)]">
            <Fingerprint size={20} strokeWidth={1.75} />
          </span>
          <div>
            <h2 className="font-display text-xl text-[var(--ink)]">Selfie Check</h2>
            <p className="mt-1 max-w-xl text-sm leading-relaxed text-[var(--muted)]">
              World ID gates creator registration so sybil wallets cannot race to
              claim someone else&apos;s content.
            </p>
          </div>
        </div>
        <span
          className={`inline-flex h-7 shrink-0 items-center rounded-full px-2.5 text-xs font-semibold ${
            verified
              ? "bg-[color-mix(in_oklab,var(--ok)_16%,transparent)] text-[var(--ok)]"
              : "bg-[color-mix(in_oklab,var(--warn)_16%,transparent)] text-[var(--warn)]"
          }`}
        >
          {statusLoading
            ? "Checking…"
            : verified
              ? "Verified human"
              : "Not verified"}
        </span>
      </div>

      {!verified && (
        <button
          type="button"
          onClick={() => void prepareAndOpen()}
          disabled={loading}
          className="btn-primary mt-4"
        >
          {loading ? "Preparing…" : "Verify with World ID"}
        </button>
      )}

      {verified && (
        <p className="mt-4 text-sm text-[var(--ok)]">
          Selfie Check complete. You can register content below.
        </p>
      )}

      {error && !verified && (
        <p className="mt-3 text-sm text-[var(--danger)]" role="alert">
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
          onSuccess={async () => {
            setError(null);
            markVerified();
            await refresh();
            setOpen(false);
          }}
          onError={(code) => {
            // Ignore host-app noise if cookie/status already says verified.
            void refresh().then((isVerified) => {
              if (isVerified) {
                setError(null);
                return;
              }
              setError(
                code === "failed_by_host_app"
                  ? "Verification reached the app but the server rejected the proof. Check the action name `register-creator` exists in production and Selfie Check is enabled, then try again."
                  : `World ID error: ${code}`,
              );
            });
          }}
        />
      )}
    </div>
  );
}
