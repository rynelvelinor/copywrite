"use client";

import { useCallback, useEffect, useState } from "react";
import { FileImage, Upload, X } from "lucide-react";

type FileDropzoneProps = {
  file: File | null;
  onFileChange: (file: File | null) => void;
  label?: string;
};

export function FileDropzone({
  file,
  onFileChange,
  label = "Image file",
}: FileDropzoneProps) {
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreview((current) => {
        if (current) URL.revokeObjectURL(current);
        return null;
      });
    }
  }, [file]);

  const applyFile = useCallback(
    (next: File | null) => {
      setPreview((current) => {
        if (current) URL.revokeObjectURL(current);
        return next ? URL.createObjectURL(next) : null;
      });
      onFileChange(next);
    },
    [onFileChange],
  );

  return (
    <label className="block space-y-2 text-sm">
      <span className="font-semibold text-[var(--ink)]">{label}</span>
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragOver(false);
          const dropped = event.dataTransfer.files?.[0];
          if (dropped?.type.startsWith("image/")) applyFile(dropped);
        }}
        className={`relative flex min-h-36 cursor-pointer flex-col items-center justify-center gap-2 rounded-[var(--radius-lg)] border border-dashed px-4 py-6 text-center transition-[border-color,background-color] duration-120 ${
          dragOver
            ? "border-[var(--accent)] bg-[var(--accent-dim)]"
            : "border-[var(--line)] bg-[var(--surface-2)]"
        }`}
      >
        <input
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(event) => applyFile(event.target.files?.[0] ?? null)}
        />
        {preview && file ? (
          <div className="relative z-10 flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt=""
              className="h-16 w-16 rounded-md object-cover"
            />
            <div className="text-left">
              <p className="text-sm font-semibold text-[var(--ink)]">{file.name}</p>
              <p className="text-xs text-[var(--faint)]">
                {(file.size / 1024).toFixed(1)} KB
              </p>
            </div>
            <button
              type="button"
              className="relative z-20 ml-2 rounded-md p-1 text-[var(--muted)] hover:text-[var(--ink)]"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                applyFile(null);
              }}
            >
              <X size={16} strokeWidth={1.75} />
            </button>
          </div>
        ) : (
          <>
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent-dim)] text-[var(--accent)]">
              {dragOver ? (
                <FileImage size={20} strokeWidth={1.75} />
              ) : (
                <Upload size={20} strokeWidth={1.75} />
              )}
            </span>
            <p className="text-sm text-[var(--ink)]">
              Drop an image, or click to browse
            </p>
            <p className="text-xs text-[var(--faint)]">PNG, JPG, WebP, GIF</p>
          </>
        )}
      </div>
    </label>
  );
}
