"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { extractionStateLabel, tr } from "@/shared/copy/tr";

type SourceListItem = {
  id: string;
  originalFilename: string;
  subjectHint: string | null;
  extractionState: string;
  fingerprintState: string;
  mission: { id: string; title: string };
  href: string;
};

export function SourcesLibraryTable() {
  const [items, setItems] = useState<SourceListItem[]>([]);
  const [query, setQuery] = useState("");
  const [extraction, setExtraction] = useState("any");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (extraction !== "any") params.set("extraction", extraction);
    const res = await fetch(`/api/sources?${params.toString()}`);
    const json = (await res.json()) as { items: SourceListItem[] };
    setItems(json.items ?? []);
    setLoading(false);
  }, [query, extraction]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-4" data-testid="sources-library">
      <div className="flex flex-wrap gap-2">
        <input
          className="min-w-[200px] flex-1 rounded-md border border-[var(--qs-border)] px-3 py-2 text-sm"
          placeholder={tr.sources.filterPlaceholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          data-testid="sources-filter-query"
        />
        <select
          className="rounded-md border border-[var(--qs-border)] px-3 py-2 text-sm"
          value={extraction}
          onChange={(e) => setExtraction(e.target.value)}
          data-testid="sources-filter-extraction"
        >
          <option value="any">{tr.sources.allExtractionStates}</option>
          <option value="PENDING">{tr.sources.extractionQueued}</option>
          <option value="RUNNING">{tr.sources.extractionRunning}</option>
          <option value="SUCCEEDED">{tr.sources.extractionSucceeded}</option>
          <option value="FAILED">{tr.sources.extractionFailed}</option>
        </select>
        <button
          type="button"
          className="rounded-md border border-[var(--qs-border)] px-3 py-2 text-sm"
          onClick={() => void load()}
        >
          {tr.common.apply}
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-[var(--qs-border)]">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-[var(--qs-border)] bg-[var(--qs-canvas)] font-mono text-[10px] uppercase tracking-wide text-[var(--qs-text-muted)]">
            <tr>
              <th className="px-3 py-2">{tr.sources.colName}</th>
              <th className="px-3 py-2">{tr.sources.colSubject}</th>
              <th className="px-3 py-2">{tr.sources.colExtraction}</th>
              <th className="px-3 py-2">{tr.sources.colFingerprint}</th>
              <th className="px-3 py-2">{tr.sources.colMission}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-[var(--qs-text-muted)]">{tr.common.loading}</td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-[var(--qs-text-muted)]">
                  {tr.sources.noSources}{" "}
                  <Link href="/sources/new" className="text-[var(--qs-phase-intake)] underline">
                    {tr.common.upload}
                  </Link>
                </td>
              </tr>
            ) : (
              items.map((row) => (
                <tr key={row.id} className="border-b border-[var(--qs-border)] last:border-0">
                  <td className="px-3 py-2">
                    <Link
                      href={row.href}
                      className="font-medium text-[var(--qs-text)] underline-offset-2 hover:underline"
                      data-testid={`source-row-${row.id}`}
                    >
                      {row.originalFilename}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-[var(--qs-text-muted)]">
                    {row.subjectHint ?? tr.common.none}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">{extractionStateLabel(row.extractionState)}</td>
                  <td className="px-3 py-2 font-mono text-xs">{row.fingerprintState}</td>
                  <td className="px-3 py-2 text-xs text-[var(--qs-text-muted)]">{row.mission.title}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
