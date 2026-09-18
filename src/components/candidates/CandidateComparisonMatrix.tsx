"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import type { ComparisonRow } from "@/modules/candidates/services/sibling-comparison";
import { tr } from "@/shared/copy/tr";
import {
  rowHasMechanismDelta,
  rowMatchesVerificationFilter,
} from "@/modules/candidates/services/sibling-comparison";

type CandidateComparisonMatrixProps = {
  missionId: string;
  runId: string;
  fingerprintVersionLabel?: string;
  rows: ComparisonRow[];
  candidateLabels: Record<string, string>;
  stemExcerpts: Record<string, string>;
  sourceStem?: string;
};

const statusGlyph: Record<string, string> = {
  pass: "✓",
  warn: "⚠",
  fail: "✗",
  na: "—",
};

export function CandidateComparisonMatrix({
  missionId,
  runId,
  fingerprintVersionLabel,
  rows,
  candidateLabels,
  stemExcerpts,
  sourceStem,
}: CandidateComparisonMatrixProps) {
  const candidateIds = useMemo(() => {
    const ids = new Set<string>();
    for (const row of rows) {
      for (const cell of row.cells) ids.add(cell.candidateId);
    }
    return [...ids].sort((a, b) => a.localeCompare(b));
  }, [rows]);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [previewRow, setPreviewRow] = useState<ComparisonRow | null>(null);
  const [mechanismDeltasOnly, setMechanismDeltasOnly] = useState(false);
  const [verificationFilter, setVerificationFilter] = useState<"all" | "fail_warn" | "fingerprint_drift">(
    "all",
  );
  const [distractorQualityOnly, setDistractorQualityOnly] = useState(false);

  const visibleRows = useMemo(() => {
    return rows.filter((row) => {
      if (mechanismDeltasOnly && !rowHasMechanismDelta(row)) return false;
      if (!rowMatchesVerificationFilter(row, verificationFilter)) return false;
      if (distractorQualityOnly && row.rowKey !== "distractor") return false;
      return true;
    });
  }, [rows, mechanismDeltasOnly, verificationFilter, distractorQualityOnly]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div data-testid="candidate-comparison-matrix" className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <p className="text-mono text-sm text-[var(--qs-text-muted)]" data-testid="compare-run-header">
          {tr.common.run} {runId.slice(0, 8)}…
          {fingerprintVersionLabel ? tr.candidates.fingerprintRun(fingerprintVersionLabel) : ""}
          <span className="ml-2 text-xs">{tr.common.mission} {missionId.slice(0, 8)}…</span>
        </p>
        <div className="flex flex-wrap gap-3 text-sm" data-testid="compare-filters">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={mechanismDeltasOnly}
              onChange={(e) => setMechanismDeltasOnly(e.target.checked)}
              data-testid="compare-filter-mechanism-deltas"
            />
            {tr.candidates.mechanismDeltasOnly}
          </label>
          <label className="flex items-center gap-2">
            <span className="text-xs text-[var(--qs-text-muted)]">{tr.common.quality}</span>
            <select
              className="rounded-md border border-[var(--qs-border)] px-2 py-1 text-sm"
              value={verificationFilter}
              onChange={(e) =>
                setVerificationFilter(e.target.value as "all" | "fail_warn" | "fingerprint_drift")
              }
              data-testid="compare-filter-verification"
            >
              <option value="all">{tr.candidates.allRows}</option>
              <option value="fail_warn">{tr.candidates.failWarnOnly}</option>
              <option value="fingerprint_drift">{tr.candidates.fingerprintDrift}</option>
            </select>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={distractorQualityOnly}
              onChange={(e) => setDistractorQualityOnly(e.target.checked)}
              data-testid="compare-filter-distractor"
            />
            {tr.candidates.distractorRowOnly}
          </label>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-[var(--qs-border)]">
        <table
          className="min-w-full text-body"
          role="grid"
          aria-label={tr.candidates.matrixAria}
        >
          <thead className="sticky top-0 z-20 bg-[var(--qs-canvas)]">
            <tr className="text-left">
              <th scope="col" className="sticky left-0 z-30 bg-[var(--qs-canvas)] px-3 py-3 font-medium">
                {tr.common.dimension}
              </th>
              {candidateIds.map((id) => (
                <th key={id} scope="col" className="px-3 py-3 font-medium">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selected.has(id)}
                      onChange={() => toggle(id)}
                      data-testid={`compare-select-${id}`}
                    />
                    {candidateLabels[id] ?? id.slice(0, 8)}
                  </label>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row) => (
              <tr
                key={row.rowKey}
                className="border-t border-[var(--qs-border)] hover:bg-[var(--qs-canvas)]"
              >
                <th
                  scope="row"
                  className="sticky left-0 z-10 bg-[var(--qs-surface)] px-3 py-3 text-left font-normal"
                >
                  <button
                    type="button"
                    className="min-h-11 text-left underline"
                    onClick={() => setPreviewRow(row)}
                    data-testid={`compare-row-${row.rowKey}`}
                    aria-label={tr.candidates.compareRowAria(row.label)}
                  >
                    {row.label}
                  </button>
                </th>
                {candidateIds.map((id) => {
                  const cell = row.cells.find((c) => c.candidateId === id);
                  const tone =
                    cell?.status === "fail"
                      ? "text-[var(--qs-severity-blocker)]"
                      : cell?.status === "warn"
                        ? "text-[var(--qs-severity-major)]"
                        : cell?.status === "pass"
                          ? "text-[var(--qs-severity-pass)]"
                          : "";
                  return (
                    <td key={id} className={`px-3 py-3 text-mono ${tone}`}>
                      {cell ? (
                        <span title={cell.detail} data-status={cell.status}>
                          {statusGlyph[cell.status]} {cell.detail}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {previewRow ? (
        <aside
          className="rounded-lg border border-[var(--qs-border)] bg-[var(--qs-surface)] p-4"
          data-testid="compare-preview-drawer"
        >
          <h3 className="text-sm font-semibold">{previewRow.label} — {tr.candidates.detail}</h3>
          {sourceStem ? (
            <p className="mt-2 text-xs text-[var(--qs-text-muted)]">
              {tr.candidates.sourceStem}: {sourceStem.slice(0, 240)}
              {sourceStem.length > 240 ? "…" : ""}
            </p>
          ) : null}
          <ul className="mt-2 space-y-2 text-sm">
            {previewRow.cells.map((cell) => (
              <li key={cell.candidateId}>
                <p className="font-medium">
                  {candidateLabels[cell.candidateId] ?? cell.candidateId.slice(0, 8)}: {cell.detail}
                </p>
                <p className="text-xs text-[var(--qs-text-muted)]">
                  {stemExcerpts[cell.candidateId]?.slice(0, 200)}
                </p>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="mt-3 text-sm underline"
            onClick={() => setPreviewRow(null)}
          >
            {tr.candidates.closePreview}
          </button>
        </aside>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {[...selected].map((id) => (
          <Link
            key={id}
            href={`/candidates/${id}`}
            className="rounded-md border border-[var(--qs-border)] px-3 py-2 text-sm underline"
            data-testid="compare-open-candidate"
          >
            {tr.candidates.openEditor} · {candidateLabels[id] ?? id.slice(0, 8)}
          </Link>
        ))}
      </div>
    </div>
  );
}
