"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SourceUploadWizard() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [file, setFile] = useState<File | null>(null);
  const [subjectHint, setSubjectHint] = useState("");
  const [languageHint, setLanguageHint] = useState("en");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit() {
    if (!file) {
      setError("Choose a file first");
      return;
    }
    setSubmitting(true);
    setError(null);
    const form = new FormData();
    form.set("file", file);
    form.set("subjectHint", subjectHint);
    form.set("languageHint", languageHint);
    form.set("notes", notes);

    const response = await fetch("/api/sources/upload", { method: "POST", body: form });
    const json = (await response.json()) as {
      sourceFileId?: string;
      error?: string;
    };

    setSubmitting(false);
    if (!response.ok) {
      setError(json.error ?? "Upload failed");
      return;
    }

    router.push(`/sources/${json.sourceFileId}/extraction`);
  }

  return (
    <div className="mx-auto max-w-[720px] space-y-6" data-testid="source-upload-wizard">
      <ol className="flex gap-2 font-mono text-xs text-[var(--qs-text-muted)]">
        <li className={step === 1 ? "text-[var(--qs-phase-intake)]" : ""}>1 · Files</li>
        <li>→</li>
        <li className={step === 2 ? "text-[var(--qs-phase-intake)]" : ""}>2 · Metadata</li>
      </ol>

      {step === 1 ? (
        <div className="space-y-4">
          <label
            className="flex min-h-[160px] cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-[var(--qs-border)] bg-[var(--qs-canvas)] p-6 text-center"
            data-testid="upload-dropzone"
          >
            <span className="text-sm font-medium text-[var(--qs-text)]">
              Drag & drop or browse
            </span>
            <span className="mt-1 text-xs text-[var(--qs-text-muted)]">
              PDF, DOCX, HTML, images · max 25 MB
            </span>
            <input
              type="file"
              className="sr-only"
              accept=".pdf,.docx,.html,.png,.jpg,.jpeg,.webp,.txt"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              data-testid="upload-file-input"
            />
          </label>
          {file ? (
            <p className="text-sm text-[var(--qs-text)]" data-testid="selected-filename">
              Selected: {file.name}
            </p>
          ) : null}
          <button
            type="button"
            className="rounded-md bg-[var(--qs-phase-intake)] px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
            disabled={!file}
            onClick={() => setStep(2)}
          >
            Continue
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-[var(--qs-text-muted)]">Subject hint</label>
            <input
              className="mt-1 w-full rounded-md border border-[var(--qs-border)] px-3 py-2 text-sm"
              value={subjectHint}
              onChange={(e) => setSubjectHint(e.target.value)}
              placeholder="e.g. Grade 7 proportional reasoning"
              data-testid="subject-hint"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--qs-text-muted)]">Language</label>
            <input
              className="mt-1 w-full rounded-md border border-[var(--qs-border)] px-3 py-2 text-sm"
              value={languageHint}
              onChange={(e) => setLanguageHint(e.target.value)}
              data-testid="language-hint"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--qs-text-muted)]">Notes</label>
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
              Back
            </button>
            <button
              type="button"
              className="rounded-md bg-[var(--qs-phase-intake)] px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
              disabled={submitting}
              onClick={() => void onSubmit()}
              data-testid="submit-upload"
            >
              {submitting ? "Uploading…" : "Start extraction"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
