"use client";

import { type FormEvent, useState } from "react";

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
    <div className="flex flex-col gap-8">
      <header className="space-y-2">
        <h1 className="font-[family-name:var(--font-display)] text-4xl tracking-tight text-[var(--ink)]">
          Authenticity checker
        </h1>
        <p className="max-w-2xl text-[var(--muted)]">
          Paste an image or URL. We compute a perceptual hash and look for a
          near-match in the ContentProof index.
        </p>
      </header>

      <form
        onSubmit={onSubmit}
        className="max-w-xl space-y-4 rounded-lg border border-[var(--line)] bg-[var(--surface)] p-5"
      >
        <label className="block space-y-2 text-sm">
          <span className="font-semibold text-[var(--ink)]">Image file</span>
          <input
            type="file"
            accept="image/*"
            className="block w-full text-sm text-[var(--muted)] file:mr-3 file:rounded-md file:border-0 file:bg-[var(--accent-soft)] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-[var(--accent)]"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
        </label>

        <label className="block space-y-2 text-sm">
          <span className="font-semibold text-[var(--ink)]">Origin URL</span>
          <input
            type="url"
            value={originUrl}
            onChange={(event) => setOriginUrl(event.target.value)}
            placeholder="https://…"
            className="h-11 w-full rounded-md border border-[var(--line)] bg-white px-3 text-[var(--ink)] outline-none ring-[var(--accent)] focus:ring-2"
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex h-11 items-center justify-center rounded-md bg-[var(--accent)] px-5 text-sm font-semibold text-[var(--surface)] transition hover:brightness-110 disabled:opacity-60"
        >
          {loading ? "Checking…" : "Check claim"}
        </button>
      </form>

      {result && (
        <div
          className="max-w-xl rounded-lg border border-[var(--line)] bg-[var(--surface)] p-5 text-sm"
          role="status"
        >
          {result.error && <p className="text-[var(--warn)]">{result.error}</p>}
          {!result.error && result.match === false && (
            <p>
              No active claim found for hash{" "}
              <code className="font-mono text-xs">{result.contentHash}</code>.
            </p>
          )}
          {!result.error && result.match && result.claim && (
            <div className="space-y-2">
              <p className="font-semibold text-[var(--ink)]">
                {result.claim.revoked ? "Revoked claim match" : "Claimed content"}
              </p>
              <p>
                <span className="text-[var(--muted)]">Subname:</span>{" "}
                {result.claim.subname}
              </p>
              <p>
                <span className="text-[var(--muted)]">Owner:</span>{" "}
                {result.claim.ownerAddress}
              </p>
              <p>
                <span className="text-[var(--muted)]">Registered:</span>{" "}
                {result.claim.timestamp}
              </p>
              <p>
                <span className="text-[var(--muted)]">Origin:</span>{" "}
                {result.claim.originUrl}
              </p>
              <p>
                <span className="text-[var(--muted)]">License:</span>{" "}
                {result.claim.license}
              </p>
              {typeof result.distance === "number" && (
                <p>
                  <span className="text-[var(--muted)]">Hamming distance:</span>{" "}
                  {result.distance}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
