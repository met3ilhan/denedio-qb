"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { tr } from "@/shared/copy/tr";

import { IntakeThreePanel } from "./IntakeThreePanel";

type Job = {
  id: string;
  status: string;
  attempt: number;
  logs: Array<{ at: string; level: string; message: string }>;
  errorMessage?: string | null;
};

type SourceMeta = {
  id: string;
  originalFilename: string;
  mimeType: string;
  missionId: string;
  createdAt?: string;
};

const STEP_TEST_IDS = ["queued", "running", "validate", "complete"] as const;

function stepIndex(status: string): number {
  switch (status) {
    case "PENDING":
      return 0;
    case "RUNNING":
      return 1;
    case "SUCCEEDED":
      return 3;
    case "FAILED":
      return 2;
    default:
      return 0;
  }
}

function statusLabel(status: string): string {
  const key = status as keyof typeof tr.jobStatus;
  return tr.jobStatus[key] ?? status;
}

export function ExtractionJobPanel({ sourceId }: { sourceId: string }) {
  const [job, setJob] = useState<Job | null>(null);
  const [source, setSource] = useState<SourceMeta | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [showTechnical, setShowTechnical] = useState(false);

  const refresh = useCallback(async () => {
    const [srcRes, jobRes] = await Promise.all([
      fetch(`/api/sources/${sourceId}`),
      fetch(`/api/sources/${sourceId}/extraction`),
    ]);
    if (srcRes.ok) {
      const srcJson = (await srcRes.json()) as { source: SourceMeta };
      setSource(srcJson.source);
    }
    if (jobRes.ok) {
      const jobJson = (await jobRes.json()) as { job: Job };
      setJob(jobJson.job);
    }
  }, [sourceId]);

  useEffect(() => {
    void refresh();
    const timer = setInterval(() => void refresh(), 1500);
    return () => clearInterval(timer);
  }, [refresh]);

  async function onRetry() {
    setRetrying(true);
    await fetch(`/api/sources/${sourceId}/extraction`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "retry" }),
    });
    setRetrying(false);
    await refresh();
  }

  const activeStep = job ? stepIndex(job.status) : 0;
  const isImage = source?.mimeType.startsWith("image/");

  return (
    <IntakeThreePanel
      navigator={
        <div className="space-y-2 text-sm" data-testid="extraction-source-identity">
          <p className="font-semibold text-[var(--qs-text)]">{source?.originalFilename ?? "…"}</p>
          <p className="text-xs text-[var(--qs-text-muted)]">{source?.mimeType}</p>
          {isImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`/api/sources/${sourceId}/asset`}
              alt={tr.upload.previewAlt}
              className="max-h-40 w-full rounded border border-[var(--qs-border)] object-contain bg-white"
              data-testid="extraction-source-thumb"
            />
          ) : null}
          <Link
            href={`/missions/${source?.missionId ?? ""}`}
            className="text-xs text-[var(--qs-phase-intake)] underline"
          >
            {tr.common.missionThread}
          </Link>
        </div>
      }
      main={
        <div className="space-y-4" data-testid="extraction-timeline">
          <h2 className="text-sm font-semibold">{tr.extraction.timeline}</h2>
          <ol className="space-y-2">
            {tr.extraction.steps.map((label, idx) => (
              <li
                key={STEP_TEST_IDS[idx]}
                className={`flex items-center gap-2 rounded-md px-2 py-1 text-sm ${
                  idx === activeStep ? "bg-[var(--qs-canvas)] font-medium" : "text-[var(--qs-text-muted)]"
                }`}
                data-testid={`timeline-step-${STEP_TEST_IDS[idx]}`}
              >
                <span className="text-xs">{idx + 1}</span>
                {label}
                {idx === activeStep && job ? (
                  <span className="ml-auto text-[10px] uppercase" data-testid="extraction-status-label">
                    {statusLabel(job.status)}
                  </span>
                ) : null}
              </li>
            ))}
          </ol>
          <button
            type="button"
            className="text-xs underline text-[var(--qs-text-muted)]"
            onClick={() => setShowTechnical((v) => !v)}
          >
            {tr.extraction.technicalDetails}
          </button>
          {showTechnical ? (
            <div
              className="max-h-64 overflow-y-auto rounded border border-[var(--qs-border)] bg-[var(--qs-canvas)] p-2 font-mono text-[11px]"
              data-testid="extraction-technical-log"
            >
              {(job?.logs ?? []).map((line, i) => (
                <p key={`${line.at}-${i}`} data-testid="extraction-log-line">
                  [{line.level}] {line.message}
                </p>
              ))}
              {job?.errorMessage ? (
                <p className="text-red-600" data-testid="extraction-error">
                  {job.errorMessage}
                </p>
              ) : null}
            </div>
          ) : null}
          {job?.status === "SUCCEEDED" ? (
            <Link
              href={`/sources/${sourceId}/structured`}
              className="inline-flex rounded-md bg-[var(--qs-phase-intake)] px-3 py-2 text-sm font-medium text-white"
              data-testid="goto-structured-review"
            >
              {tr.extraction.openStructured}
            </Link>
          ) : null}
        </div>
      }
      inspector={
        <div className="space-y-3 text-sm" data-testid="extraction-inspector">
          <p className="font-semibold">{tr.extraction.inspector}</p>
          <p className="text-xs text-[var(--qs-text-muted)]">
            {tr.extraction.attempt(job?.attempt ?? "—")}
          </p>
          <button
            type="button"
            className="w-full rounded-md border border-[var(--qs-border)] px-3 py-2 text-sm disabled:opacity-50"
            disabled={retrying || job?.status === "RUNNING"}
            onClick={() => void onRetry()}
            data-testid="retry-extraction"
          >
            {tr.extraction.retry}
          </button>
        </div>
      }
    />
  );
}
