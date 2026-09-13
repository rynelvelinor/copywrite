"use client";

import { type FormEvent, useState } from "react";
import { Ban, CircleCheck, CircleDashed, ScanSearch } from "lucide-react";
import { FileDropzone } from "@/components/FileDropzone";
import { PageHeader } from "@/components/PageHeader";

type CheckResponse = {
  contentHash?: string;
  match?: boolean;
  active?: boolean;
  distance?: number;
  claim?: {
    subname: string;
    ownerAddress: string;
    timestamp: string;
    originUrl: string;
    license: string;
    revoked: boolean;
  };
  error?: string;
};

export default function CheckerPage() {
  const [originUrl, setOriginUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CheckResponse | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const form = new FormData();
      if (file) form.append("file", file);
      if (originUrl) form.append("url", originUrl);
      if (!file && !originUrl) {
        setResult({ error: "Add an image file or origin URL." });
        return;
      }
      const res = await fetch("/api/check", { method: "POST", body: form });
      const data = (await res.json()) as CheckResponse;
      setResult(data);
    } catch (err) {
      setResult({
        error: err instanceof Error ? err.message : "Check failed",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-12">
      <PageHeader
        kicker="Public"
        title="Authenticity checker"
        description="Paste an image or URL. We compute a perceptual hash and look for a near-match in the Copywrite index."
      />

      <div className="grid gap-6 lg:grid-cols-12">
        <form onSubmit={onSubmit} className="card space-y-4 p-5 sm:p-6 lg:col-span-5">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--accent-dim)] text-[var(--accent)]">
              <ScanSearch size={20} strokeWidth={1.75} />
            </span>
            <div>
              <h2 className="font-display text-xl text-[var(--ink)]">Check media</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                File or origin URL is enough. Both together is fine.
              </p>
            </div>
          </div>

          <FileDropzone file={file} onFileChange={setFile} />

          <label className="block space-y-1.5 text-sm">
            <span className="font-semibold text-[var(--ink)]">Origin URL</span>
            <input
              type="url"
              value={originUrl}
              onChange={(event) => setOriginUrl(event.target.value)}
              placeholder="https://…"
              className="field"
            />
          </label>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Checking…" : "Check claim"}
          </button>
        </form>

        <div className="lg:col-span-7">
          {result ? (
            <CheckerVerdict result={result} />
          ) : (
            <div className="card flex h-full min-h-64 flex-col items-center justify-center gap-3 p-8 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--surface-2)] text-[var(--muted)]">
                <CircleDashed size={22} strokeWidth={1.75} />
              </span>
              <p className="text-sm text-[var(--muted)]">
                Results appear here after you check a file or URL.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CheckerVerdict({ result }: { result: CheckResponse }) {
  if (result.error) {
    return (
      <div className="card p-6" role="status">
        <p className="text-sm font-semibold text-[var(--danger)]">{result.error}</p>
      </div>
    );
  }

  if (result.match === false) {
    return (
      <div className="card p-6" role="status">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--surface-2)] text-[var(--muted)]">
            <CircleDashed size={20} strokeWidth={1.75} />
          </span>
          <div>
            <p className="font-display text-xl text-[var(--ink)]">No active claim</p>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Nothing in the index matches this fingerprint.
            </p>
            {result.contentHash && (
              <p className="mt-3 font-mono text-xs text-[var(--faint)]">
                {result.contentHash}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (result.match && result.claim) {
    const revoked = result.claim.revoked;
    return (
      <div className="card p-6" role="status">
        <div className="flex items-start gap-3">
          <span
            className={`flex h-10 w-10 items-center justify-center rounded-full ${
              revoked
                ? "bg-[color-mix(in_oklab,var(--warn)_16%,transparent)] text-[var(--warn)]"
                : "bg-[color-mix(in_oklab,var(--ok)_16%,transparent)] text-[var(--ok)]"
            }`}
          >
            {revoked ? (
              <Ban size={20} strokeWidth={1.75} />
            ) : (
              <CircleCheck size={20} strokeWidth={1.75} />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-display text-xl text-[var(--ink)]">
              {revoked ? "Revoked claim" : "Claimed content"}
            </p>
            <p className="mt-1 font-mono text-sm text-[var(--accent)]">
              {result.claim.subname}
            </p>
            <dl className="mt-5 grid gap-3 text-sm">
              <VerdictRow label="Owner" value={result.claim.ownerAddress} mono />
              <VerdictRow label="Registered" value={result.claim.timestamp} />
              <VerdictRow label="Origin" value={result.claim.originUrl} />
              <VerdictRow label="License" value={result.claim.license} />
              {typeof result.distance === "number" && (
                <VerdictRow label="Hamming distance" value={String(result.distance)} />
              )}
            </dl>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

function VerdictRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5 border-t border-[var(--line)] pt-3 sm:flex-row sm:justify-between sm:gap-4">
      <dt className="shrink-0 text-[var(--faint)]">{label}</dt>
      <dd
        className={`break-all text-[var(--ink)] ${mono ? "font-mono text-xs" : ""}`}
      >
        {value}
      </dd>
    </div>
  );
}
