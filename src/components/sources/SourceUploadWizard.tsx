"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { uploadErrorMessage } from "@/shared/copy/upload-errors";
import { tr } from "@/shared/copy/tr";
import { MAX_SOURCE_FILE_BYTES } from "@/shared/storage/policy";

const ACCEPTED_EXTENSIONS = new Set([
  ".pdf",
  ".docx",
  ".html",
  ".htm",
  ".txt",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".gif",
]);

function extensionOf(name: string): string {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i).toLowerCase() : "";
}

function validateClientFile(file: File): string | null {
  const ext = extensionOf(file.name);
  if (!ACCEPTED_EXTENSIONS.has(ext)) {
    return tr.upload.errors.unsupportedType;
  }
  if (file.size <= 0) {
    return tr.upload.errors.fileRequired;
  }
  if (file.size > MAX_SOURCE_FILE_BYTES) {
    return tr.upload.errors.sizeTooLarge;
  }
  return null;
}

export function SourceUploadWizard() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [subjectHint, setSubjectHint] = useState("");
  const [languageHint, setLanguageHint] = useState("tr");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!file?.type.startsWith("image/")) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const applyFile = useCallback((next: File | null) => {
    setError(null);
    if (!next) {
      setFile(null);
      return;
    }
    const validation = validateClientFile(next);
    if (validation) {
      setError(validation);
      setFile(null);
      return;
    }
    setFile(next);
  }, []);

  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }

  function onDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setDragActive(false);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const dropped = e.dataTransfer.files;
    if (dropped.length > 1) {
      setError(tr.upload.errors.multipleFiles);
      return;
    }
    const candidate = dropped[0];
    if (!candidate) return;
    applyFile(candidate);
  }

  async function onSubmit() {
    if (!file) {
      setError(tr.upload.errors.fileRequired);
      return;
    }
    setSubmitting(true);
    setError(null);
    const form = new FormData();
    form.set("file", file);
    form.set("subjectHint", subjectHint);
    form.set("languageHint", languageHint);
    form.set("notes", notes);

    let json: { sourceFileId?: string; error?: string; code?: string } = {};
    try {
      const response = await fetch("/api/sources/upload", { method: "POST", body: form });
      json = (await response.json()) as typeof json;
      if (!response.ok) {
        setError(uploadErrorMessage(json.code));
        return;
      }
    } catch {
      setError(tr.upload.errors.generic);
      return;
    } finally {
      setSubmitting(false);
    }

    router.push(`/sources/${json.sourceFileId}/extraction`);
  }

  return (
    <div className="mx-auto max-w-[720px] space-y-6" data-testid="source-upload-wizard">
      <ol className="flex gap-2 font-mono text-xs text-[var(--qs-text-muted)]">
        <li className={step === 1 ? "text-[var(--qs-phase-intake)]" : ""}>{tr.upload.stepFiles}</li>
        <li>→</li>
        <li className={step === 2 ? "text-[var(--qs-phase-intake)]" : ""}>{tr.upload.stepMetadata}</li>
      </ol>

      {step === 1 ? (
        <div className="space-y-4">
          <div
            role="button"
            tabIndex={0}
            className={`flex min-h-[160px] cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed p-6 text-center transition-colors ${
              dragActive
                ? "border-[var(--qs-phase-intake)] bg-[var(--qs-phase-intake-50)]"
                : "border-[var(--qs-border)] bg-[var(--qs-canvas)]"
            }`}
            data-testid="upload-dropzone"
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                inputRef.current?.click();
              }
            }}
          >
            <span className="text-sm font-medium text-[var(--qs-text)]">
              {dragActive ? tr.upload.dropzoneActive : tr.upload.dropzoneTitle}
            </span>
            <span className="mt-1 text-xs text-[var(--qs-text-muted)]">{tr.upload.dropzoneHint}</span>
            <span className="mt-3 text-xs font-medium text-[var(--qs-phase-intake)] underline">
              {tr.upload.browse}
            </span>
            <input
              ref={inputRef}
              type="file"
              className="sr-only"
              accept=".pdf,.docx,.html,.png,.jpg,.jpeg,.webp,.txt"
              onChange={(e) => applyFile(e.target.files?.[0] ?? null)}
              data-testid="upload-file-input"
            />
          </div>
          {previewUrl ? (
            <img
              src={previewUrl}
              alt={tr.upload.previewAlt}
              className="max-h-48 rounded-md border border-[var(--qs-border)] object-contain"
              data-testid="upload-image-preview"
            />
          ) : null}
          {file ? (
            <p className="text-sm text-[var(--qs-text)]" data-testid="selected-filename">
              {tr.upload.selected(file.name)}
            </p>
          ) : null}
          {error ? (
            <p className="text-sm text-red-600" role="alert" data-testid="upload-error">
              {error}
            </p>
          ) : null}
          <button
            type="button"
            className="rounded-md bg-[var(--qs-phase-intake)] px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
            disabled={!file}
            onClick={() => setStep(2)}
          >
            {tr.common.continue}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-[var(--qs-text-muted)]">
              {tr.upload.subjectLabel}
            </label>
            <input
              className="mt-1 w-full rounded-md border border-[var(--qs-border)] px-3 py-2 text-sm"
              value={subjectHint}
              onChange={(e) => setSubjectHint(e.target.value)}
              placeholder={tr.upload.subjectPlaceholder}
              data-testid="subject-hint"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--qs-text-muted)]">
              {tr.upload.languageLabel}
            </label>
            <input
              className="mt-1 w-full rounded-md border border-[var(--qs-border)] px-3 py-2 text-sm"
              value={languageHint}
              onChange={(e) => setLanguageHint(e.target.value)}
              data-testid="language-hint"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--qs-text-muted)]">
              {tr.upload.notesLabel}
            </label>
            <textarea
              className="mt-1 w-full rounded-md border border-[var(--qs-border)] px-3 py-2 text-sm"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          {error ? (
            <p className="text-sm text-red-600" role="alert" data-testid="upload-error">
              {error}
            </p>
          ) : null}
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded-md border border-[var(--qs-border)] px-3 py-2 text-sm"
              onClick={() => setStep(1)}
            >
              {tr.common.back}
            </button>
            <button
              type="button"
              className="rounded-md bg-[var(--qs-phase-intake)] px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
              disabled={submitting}
              onClick={() => void onSubmit()}
              data-testid="submit-upload"
            >
              {submitting ? tr.upload.uploading : tr.upload.startExtraction}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
