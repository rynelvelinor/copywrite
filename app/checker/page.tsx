"use client";

import { type FormEvent, useState } from "react";

export default function CheckerPage() {
  const [originUrl, setOriginUrl] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [message, setMessage] = useState(
    "Upload an image or paste a URL. Hash + index lookup arrives in Phase 4.",
  );

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!originUrl && !fileName) {
      setMessage("Add an image file or origin URL to check.");
      return;
    }
    setMessage(
      `Checker stub ready${fileName ? ` for “${fileName}”` : ""}${
        originUrl ? ` / ${originUrl}` : ""
      }. Backend detection API is not wired yet.`,
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <header className="space-y-2">
        <h1 className="font-[family-name:var(--font-display)] text-4xl tracking-tight text-[var(--ink)]">
          Authenticity checker
        </h1>
        <p className="max-w-2xl text-[var(--muted)]">
          Anyone can check whether content is already claimed. Results will show
          the owner&apos;s ENS name and registration timestamp.
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
            onChange={(event) => {
              const file = event.target.files?.[0];
              setFileName(file?.name ?? null);
            }}
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
          className="inline-flex h-11 items-center justify-center rounded-md bg-[var(--accent)] px-5 text-sm font-semibold text-[var(--surface)] transition hover:brightness-110"
        >
          Check claim
        </button>
      </form>

      <p className="text-sm text-[var(--muted)]" role="status">
        {message}
      </p>
    </div>
  );
}
