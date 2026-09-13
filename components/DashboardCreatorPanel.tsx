"use client";

import { type FormEvent, type ReactNode, useCallback, useEffect, useState } from "react";
import { Ban, CircleCheck, FilePlus2 } from "lucide-react";
import { useAccount, useWriteContract } from "wagmi";
import {
  contentProofClaimsAbi,
  getClaimsAddress,
  hashToBytes32,
} from "@/lib/contracts/contentProofClaims";
import { useWorldVerification } from "@/components/WorldVerificationProvider";
import { FileDropzone } from "@/components/FileDropzone";

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

export function DashboardCreatorPanel({ gate }: { gate: ReactNode }) {
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
      const raw = await claimsRes.text();
      let claimsData: { claims?: ClaimRow[]; error?: string } = {};
      try {
        claimsData = raw ? (JSON.parse(raw) as { claims?: ClaimRow[]; error?: string }) : {};
      } catch {
        setError(claimsRes.ok ? "Invalid claims response" : `Claims request failed (${claimsRes.status})`);
        setClaims([]);
        return;
      }
      setClaims(claimsData.claims ?? []);
      if (claimsData.error) {
        setError(claimsData.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load claims");
      setClaims([]);
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
    <div className="grid gap-6 lg:grid-cols-12">
      <div className="space-y-6 lg:col-span-5">
        {gate}
        <div className="card p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--accent-dim)] text-[var(--accent)]">
              <FilePlus2 size={20} strokeWidth={1.75} />
            </span>
            <div>
              <h2 className="font-display text-xl text-[var(--ink)]">Register content</h2>
              <p className="mt-1 text-sm leading-relaxed text-[var(--muted)]">
                After Selfie Check, claim{" "}
                <code className="rounded bg-[var(--accent-dim)] px-1.5 py-0.5 font-mono text-xs text-[var(--accent)]">
                  {creatorLabel || "you"}.copywrite.eth
                </code>{" "}
                and attach a perceptual-hash record.
              </p>
            </div>
          </div>

          {!isConnected && (
            <p className="mt-4 text-sm text-[var(--warn)]">
              Connect a wallet to start registration.
            </p>
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
            <form onSubmit={onRegister} className="mt-5 space-y-4">
              <label className="block space-y-1.5 text-sm">
                <span className="font-semibold">Creator label</span>
                <input
                  required
                  value={creatorLabel}
                  onChange={(e) => setCreatorLabel(e.target.value)}
                  placeholder="alice"
                  className="field"
                />
              </label>
              <FileDropzone file={file} onFileChange={setFile} label="Image" />
              <label className="block space-y-1.5 text-sm">
                <span className="font-semibold">Origin URL (optional)</span>
                <input
                  type="url"
                  value={originUrl}
                  onChange={(e) => setOriginUrl(e.target.value)}
                  placeholder="https://…"
                  className="field"
                />
              </label>
              <label className="block space-y-1.5 text-sm">
                <span className="font-semibold">License</span>
                <input
                  value={license}
                  onChange={(e) => setLicense(e.target.value)}
                  className="field"
                />
              </label>
              <button type="submit" disabled={isPending} className="btn-primary w-full">
                {isPending ? "Confirm in wallet…" : "Register claim"}
              </button>
              {!claimsAddress && (
                <p className="text-xs text-[var(--faint)]">
                  Index-only mode — no on-chain address set. Duplicate detection still works.
                </p>
              )}
            </form>
          )}

          {status && <p className="mt-3 text-sm text-[var(--ok)]">{status}</p>}
          {error && (
            <p className="mt-3 text-sm text-[var(--danger)]" role="alert">
              {error}
            </p>
          )}
        </div>
      </div>

      <div className="lg:col-span-7">
        <div className="card h-full p-5 sm:p-6">
          <h2 className="font-display text-xl text-[var(--ink)]">Your claims</h2>
          {claims.length === 0 ? (
            <div className="mt-8 flex flex-col items-center justify-center gap-3 py-10 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--surface-2)] text-[var(--muted)]">
                <CircleCheck size={22} strokeWidth={1.75} />
              </span>
              <p className="text-sm text-[var(--muted)]">
                No claims yet. Verify and register to seal your first record.
              </p>
            </div>
          ) : (
            <ul className="mt-4 space-y-3">
              {claims.map((claim) => (
                <li
                  key={claim.id}
                  className="flex flex-col gap-3 rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface-2)] p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 text-sm">
                    <p className="truncate font-semibold text-[var(--ink)]">
                      {claim.subname}
                    </p>
                    <p className="mt-1 flex flex-wrap items-center gap-2 text-[var(--muted)]">
                      <span
                        className={`inline-flex h-6 items-center rounded-full px-2 text-[11px] font-semibold ${
                          claim.revoked
                            ? "bg-[color-mix(in_oklab,var(--danger)_16%,transparent)] text-[var(--danger)]"
                            : "bg-[var(--accent-dim)] text-[var(--accent)]"
                        }`}
                      >
                        {claim.revoked ? "Revoked" : "Active"}
                      </span>
                      <span className="text-xs text-[var(--faint)]">
                        {claim.timestamp}
                      </span>
                    </p>
                  </div>
                  {!claim.revoked && (
                    <button
                      type="button"
                      onClick={() => void onRevoke(claim.contentHash)}
                      className="btn-danger"
                    >
                      <Ban size={14} strokeWidth={1.75} />
                      Revoke
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
