"use client";

import Link from "next/link";
import { useState } from "react";

type DryRunIssue = {
  level: string;
  code: string;
  message: string;
  remediationScreen?: string;
};

type DryRunConsoleProps = {
  generatedQuestionId: string;
  importExternalKey: string;
  initialPassed?: boolean;
};

export function DryRunConsole({
  generatedQuestionId,
  importExternalKey,
  initialPassed = false,
}: DryRunConsoleProps) {
  const [passed, setPassed] = useState(initialPassed);
  const [issues, setIssues] = useState<DryRunIssue[]>([]);
  const [running, setRunning] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const runDryRun = async () => {
    setRunning(true);
    setExportError(null);
    const res = await fetch(`/api/questions/${generatedQuestionId}/denedio/dry-run`, {
      method: "POST",
    });
    const data = await res.json();
    if (!res.ok) {
      setPassed(false);
      setIssues([{ level: "error", code: "HTTP", message: data.error ?? "Dry-run request failed" }]);
      setRunning(false);
      return;
    }
    setPassed(Boolean(data.passed));
    setIssues((data.issues as DryRunIssue[]) ?? []);
    setRunning(false);
  };

  const downloadBundle = async () => {
    setExportError(null);
    const res = await fetch(`/api/questions/${generatedQuestionId}/denedio/export`);
    if (!res.ok) {
      const body = (await res.json()) as { error?: string };
      setExportError(body.error ?? "Export blocked");
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `denedio-import-${generatedQuestionId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div data-testid="dry-run-console" className="space-y-4">
      <div
        data-testid="dry-run-banner"
        className={`rounded-lg border px-4 py-3 text-sm font-medium ${
          passed
            ? "border-green-300 bg-green-50 text-green-900"
            : "border-amber-300 bg-amber-50 text-amber-950"
        }`}
      >
        {passed ? "PASS — export bundle enabled" : "FAIL or not run — export disabled"}
      </div>

      <p className="font-mono text-xs text-[var(--qs-text-muted)]">
        importExternalKey preview: {importExternalKey}
      </p>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          data-testid="dry-run-run"
          disabled={running}
          className="rounded-md bg-[var(--qs-phase-ship)] px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
          onClick={() => void runDryRun()}
        >
          Run dry-run
        </button>
        <button
          type="button"
          data-testid="export-download"
          disabled={!passed}
          className="rounded-md border border-[var(--qs-border)] px-3 py-2 text-sm disabled:opacity-50"
          onClick={() => void downloadBundle()}
        >
          Download export bundle
        </button>
        <button
          type="button"
          data-testid="publish-denedio"
          disabled
          title="Publishing to Denedio is disabled in V1"
          className="rounded-md border border-dashed border-[var(--qs-border)] px-3 py-2 text-sm text-[var(--qs-text-muted)]"
        >
          Publish to Denedio (disabled)
        </button>
      </div>

      {exportError ? (
        <p className="text-sm text-red-600" data-testid="export-error">{exportError}</p>
      ) : null}

      <section>
        <h2 className="text-sm font-semibold">Issues</h2>
        <ul className="mt-2 space-y-2 text-sm" data-testid="dry-run-issues">
          {issues.length === 0 ? (
            <li className="text-[var(--qs-text-muted)]">No issues recorded.</li>
          ) : (
            issues.map((issue, idx) => (
              <li key={`${issue.code}-${idx}`} className="rounded border border-[var(--qs-border)] p-2">
                <span className="font-mono text-xs">{issue.level}</span> · {issue.message}
                {issue.remediationScreen === "S17" ? (
                  <Link className="ml-2 text-xs underline" href={`/questions/${generatedQuestionId}/denedio/map`}>
                    S17
                  </Link>
                ) : null}
                {issue.remediationScreen === "S16" ? (
                  <Link className="ml-2 text-xs underline" href="/catalog">S16</Link>
                ) : null}
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
