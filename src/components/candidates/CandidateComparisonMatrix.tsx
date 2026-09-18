"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import type { ComparisonRow } from "@/modules/candidates/services/sibling-comparison";

type CandidateComparisonMatrixProps = {
  missionId: string;
  runId: string;
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

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div data-testid="candidate-comparison-matrix" className="space-y-4">
      <p className="text-mono text-sm text-[var(--qs-text-muted)]">
        Mission {missionId.slice(0, 8)}… · Run {runId.slice(0, 8)}…
      </p>
      <div className="overflow-x-auto rounded-lg border border-[var(--qs-border)]">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-[var(--qs-canvas)] text-left">
              <th className="px-3 py-2 font-medium">Dimension</th>
              {candidateIds.map((id) => (
                <th key={id} className="px-3 py-2 font-medium">
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
            {rows.map((row) => (
              <tr
                key={row.rowKey}
                className="border-t border-[var(--qs-border)] hover:bg-[var(--qs-canvas)]"
              >
                <td className="px-3 py-2">
                  <button
                    type="button"
                    className="text-left underline"
                    onClick={() => setPreviewRow(row)}
                    data-testid={`compare-row-${row.rowKey}`}
                  >
                    {row.label}
                  </button>
                </td>
                {candidateIds.map((id) => {
                  const cell = row.cells.find((c) => c.candidateId === id);
                  return (
                    <td key={id} className="px-3 py-2 font-mono text-xs">
                      {cell ? (
                        <span title={cell.detail}>
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
          <h3 className="text-sm font-semibold">{previewRow.label} — detail</h3>
          {sourceStem ? (
            <p className="mt-2 text-xs text-[var(--qs-text-muted)]">
              Source stem: {sourceStem.slice(0, 240)}
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
            Open editor · {candidateLabels[id] ?? id.slice(0, 8)}
          </Link>
        ))}
      </div>
    </div>
  );
}
