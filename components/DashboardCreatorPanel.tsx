"use client";

import { type FormEvent, useCallback, useEffect, useState } from "react";
import { useAccount, useWriteContract } from "wagmi";
import {
  contentProofClaimsAbi,
  getClaimsAddress,
  hashToBytes32,
} from "@/lib/contracts/contentProofClaims";
import { useWorldVerification } from "@/components/WorldVerificationProvider";

type ClaimRow = {
  id: string;
  subname: string;
  contentHash: string;
  originUrl: string;
  license: string;
  timestamp: string;
  revoked: boolean;
  ensName?: string;
};

export function DashboardCreatorPanel() {
  const { address, isConnected } = useAccount();
  const { verified, loading: verifiedLoading } = useWorldVerification();
  const [loading, setLoading] = useState(false);
  const [creatorLabel, setCreatorLabel] = useState("");
  const [originUrl, setOriginUrl] = useState("");
  const [license, setLicense] = useState("All rights reserved");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [claims, setClaims] = useState<ClaimRow[]>([]);
  const claimsAddress = getClaimsAddress();
  const { writeContractAsync, isPending } = useWriteContract();

  const refreshClaims = useCallback(async () => {
    if (!address) {
      setClaims([]);
      return;
    }
    setLoading(true);
    try {
      const claimsRes = await fetch(
        `/api/claims?address=${encodeURIComponent(address)}`,
      );
      const claimsData = (await claimsRes.json()) as {
        claims?: ClaimRow[];
        error?: string;
      };
      setClaims(claimsData.claims ?? []);
      if (claimsData.error) {
        setError(claimsData.error);
      }
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    void refreshClaims();
  }, [refreshClaims]);

  async function onRegister(event: FormEvent) {
    event.preventDefault();
    if (!address) return;
    setError(null);
    setStatus("Hashing content…");

    try {
      const form = new FormData();
      if (file) form.append("file", file);
      if (originUrl) form.append("url", originUrl);
      if (!file && !originUrl) {
        throw new Error("Upload an image or paste an origin URL");
      }

      const hashRes = await fetch("/api/hash", { method: "POST", body: form });
      const hashData = (await hashRes.json()) as { contentHash?: string; error?: string };
      if (!hashRes.ok || !hashData.contentHash) {
        throw new Error(hashData.error || "Hash failed");
      }

      setStatus("Checking for duplicates…");
      const checkRes = await fetch("/api/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentHash: hashData.contentHash }),
      });
      const checkData = (await checkRes.json()) as {
        match?: boolean;
        claim?: { subname: string; ownerAddress: string };
        error?: string;
      };
      if (checkData.match) {
        throw new Error(
          `Duplicate detected: already claimed as ${checkData.claim?.subname} by ${checkData.claim?.ownerAddress}`,
        );
      }

      let txHash: string | undefined;
      if (claimsAddress) {
        setStatus("Submitting on-chain claim…");
        try {
          await writeContractAsync({
            address: claimsAddress,
            abi: contentProofClaimsAbi,
            functionName: "registerCreator",
            args: [creatorLabel.trim().toLowerCase()],
          });
        } catch {
          // creator may already be registered
        }
        txHash = await writeContractAsync({
          address: claimsAddress,
          abi: contentProofClaimsAbi,
          functionName: "registerContent",
          args: [
            hashToBytes32(hashData.contentHash),
            originUrl || `upload://${file?.name ?? "image"}`,
            license,
          ],
        });
      }

      setStatus("Writing off-chain index…");
      const regRes = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address,
          creatorLabel,
          contentHash: hashData.contentHash,
          originUrl: originUrl || `upload://${file?.name ?? "image"}`,
          license,
          txHash,
        }),
      });
      const regData = (await regRes.json()) as {
        error?: string;
        claim?: { subname: string };
        match?: unknown;
      };
      if (!regRes.ok) {
        throw new Error(regData.error || "Registration failed");
      }

      setStatus(`Registered ${regData.claim?.subname}`);
      setFile(null);
      await refreshClaims();
    } catch (err) {
      setStatus(null);
      setError(err instanceof Error ? err.message : "Registration failed");
    }
  }

  async function onRevoke(contentHash: string) {
    if (!address) return;
    setError(null);
    try {
      if (claimsAddress) {
        await writeContractAsync({
          address: claimsAddress,
          abi: contentProofClaimsAbi,
          functionName: "revokeContent",
          args: [hashToBytes32(contentHash)],
        });
      }
      const res = await fetch("/api/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, contentHash }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Revoke failed");
      setStatus("Claim revoked");
      await refreshClaims();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Revoke failed");
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-5">
        <h2 className="font-[family-name:var(--font-display)] text-xl text-[var(--ink)]">
          Register content
        </h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          After Selfie Check, claim{" "}
          <code className="rounded bg-[var(--accent-soft)] px-1.5 py-0.5 font-mono text-xs">
            {creatorLabel || "you"}.contentproof.eth
          </code>{" "}
          and attach a perceptual-hash content record.
        </p>

        {!isConnected && (
          <p className="mt-4 text-sm text-[var(--warn)]">Wallet not connected.</p>
        )}
        {isConnected && (loading || verifiedLoading) && (
          <p className="mt-4 text-sm text-[var(--muted)]">Loading…</p>
        )}
        {isConnected && !loading && !verifiedLoading && !verified && (
          <p className="mt-4 text-sm text-[var(--warn)]">
            Registration locked until Selfie Check succeeds.
          </p>
        )}

        {isConnected && !loading && !verifiedLoading && verified && (
          <form onSubmit={onRegister} className="mt-4 space-y-3">
            <label className="block space-y-1 text-sm">
              <span className="font-semibold">Creator label</span>
              <input
                required
                value={creatorLabel}
                onChange={(e) => setCreatorLabel(e.target.value)}
                placeholder="alice"
                className="h-11 w-full rounded-md border border-[var(--line)] bg-white px-3"
              />
            </label>
            <label className="block space-y-1 text-sm">
              <span className="font-semibold">Image</span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="block w-full text-sm"
              />
            </label>
            <label className="block space-y-1 text-sm">
              <span className="font-semibold">Origin URL (optional)</span>
              <input
                type="url"
                value={originUrl}
                onChange={(e) => setOriginUrl(e.target.value)}
                placeholder="https://…"
                className="h-11 w-full rounded-md border border-[var(--line)] bg-white px-3"
              />
            </label>
            <label className="block space-y-1 text-sm">
              <span className="font-semibold">License</span>
              <input
                value={license}
                onChange={(e) => setLicense(e.target.value)}
                className="h-11 w-full rounded-md border border-[var(--line)] bg-white px-3"
              />
            </label>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex h-11 items-center rounded-md bg-[var(--accent)] px-5 text-sm font-semibold text-[var(--surface)] disabled:opacity-60"
            >
              {isPending ? "Confirm in wallet…" : "Register claim"}
            </button>
            {!claimsAddress && (
              <p className="text-xs text-[var(--muted)]">
                No `NEXT_PUBLIC_CONTENTPROOF_CLAIMS_ADDRESS` — index-only mode (off-chain
                duplicate detection still works).
              </p>
            )}
          </form>
        )}

        {status && <p className="mt-3 text-sm text-[var(--ok)]">{status}</p>}
        {error && (
          <p className="mt-3 text-sm text-[var(--warn)]" role="alert">
            {error}
          </p>
        )}
      </div>

      <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-5">
        <h2 className="font-[family-name:var(--font-display)] text-xl">Your claims</h2>
        {claims.length === 0 ? (
          <p className="mt-2 text-sm text-[var(--muted)]">No claims yet.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {claims.map((claim) => (
              <li
                key={claim.id}
                className="flex flex-col gap-2 border-b border-[var(--line)] pb-3 last:border-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="text-sm">
                  <p className="font-semibold">{claim.subname}</p>
                  <p className="text-[var(--muted)]">
                    {claim.revoked ? "Revoked" : "Active"} · {claim.timestamp}
                  </p>
                </div>
                {!claim.revoked && (
                  <button
                    type="button"
                    onClick={() => void onRevoke(claim.contentHash)}
                    className="h-9 rounded-md border border-[var(--line)] px-3 text-sm font-semibold"
                  >
                    Revoke
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
