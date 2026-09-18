"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { EvidenceSpan } from "@/components/fingerprint/EvidenceSpan";

type DimensionRow = {
  key: string;
  label: string;
  value: string;
  confidence: "high" | "medium" | "low";
};

type EvidenceRow = {
  id: string;
  dimensionKey: string;
  excerpt: string;
  pointer: { sourceBlockId?: string };
};

type FingerprintDraftWorkspaceProps = {
  sourceFileId: string;
  versionId: string;
  dimensions: DimensionRow[];
  evidence: EvidenceRow[];
  gapWarnings: string[];
  blocks: Array<{ blockId: string; text?: string }>;
};

export function FingerprintDraftWorkspace({
  sourceFileId,
  versionId,
  dimensions,
  evidence,
  gapWarnings,
  blocks,
}: FingerprintDraftWorkspaceProps) {
  const [activeEvidenceId, setActiveEvidenceId] = useState(evidence[0]?.id);
  const activeBlockId = evidence.find((e) => e.id === activeEvidenceId)?.pointer.sourceBlockId;

  const blockPreview = useMemo(() => {
    const block = blocks.find((b) => b.blockId === activeBlockId);
    return block?.text ?? blocks[0]?.text ?? "No structured block selected.";
  }, [activeBlockId, blocks]);

  return (
    <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <section className="min-w-0 rounded-lg border border-[var(--qs-border)] bg-[var(--qs-surface)] p-4">
        <h2 className="text-title text-[var(--qs-text)]">Dimensions</h2>
        <ul className="mt-4 space-y-2">
          {dimensions.map((row) => (
            <li
              key={row.key}
              className="rounded-md border border-[var(--qs-border)] px-3 py-2"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[10px] uppercase text-[var(--qs-text-muted)]">
                  {row.key}
                </span>
                <span className="font-mono text-[10px] text-[var(--qs-text-muted)]">
                  {row.confidence}
                </span>
              </div>
              <p className="text-body mt-1 text-[var(--qs-text)]">{row.value}</p>
            </li>
          ))}
        </ul>
        {gapWarnings.length > 0 ? (
          <div
            className="mt-4 rounded-md border border-[var(--qs-severity-minor)] bg-[var(--qs-mutable-bg)] p-3 text-sm text-[var(--qs-text)]"
            data-testid="fingerprint-gap-warnings"
          >
            <p className="font-semibold">Gap warnings</p>
            <ul className="mt-2 list-disc pl-5">
              {gapWarnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          </div>
        ) : null}
        <Link
          href={`/fingerprint/${versionId}`}
          className="mt-4 inline-flex rounded-md bg-[var(--qs-phase-mechanism)] px-3 py-2 text-sm font-medium text-white"
          data-testid="open-fingerprint-studio"
        >
          Open in Fingerprint Studio
        </Link>
      </section>

      <section className="min-w-0 rounded-lg border border-[var(--qs-border)] bg-[var(--qs-surface)] p-4">
        <h2 className="text-title text-[var(--qs-text)]">Evidence spans</h2>
        <div className="mt-4 space-y-2">
          {evidence.map((row) => (
            <EvidenceSpan
              key={row.id}
              dimensionKey={row.dimensionKey}
              excerpt={row.excerpt}
              blockId={row.pointer.sourceBlockId}
              active={row.id === activeEvidenceId}
              onSelect={() => setActiveEvidenceId(row.id)}
            />
          ))}
        </div>
        <div className="mt-4 rounded-md border border-[var(--qs-border)] bg-[var(--qs-canvas)] p-4">
          <p className="font-mono text-[10px] uppercase text-[var(--qs-text-muted)]">
            Structured source highlight
          </p>
          <p className="text-body mt-2 whitespace-pre-wrap text-[var(--qs-text)]">{blockPreview}</p>
        </div>
        <p className="mt-3 font-mono text-xs text-[var(--qs-text-muted)]">
          Source file {sourceFileId}
        </p>
      </section>
    </div>
  );
}
