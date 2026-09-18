"use client";

import { useMemo, useState } from "react";

import type { CatalogMirrorSnapshot } from "@/modules/catalog";
import { isValidUuid } from "@/modules/catalog";

type CatalogBrowserProps = {
  mirror: CatalogMirrorSnapshot;
  selectedTopicId?: string;
  onSelectTopic?: (topicId: string) => void;
};

export function CatalogBrowser({ mirror, selectedTopicId, onSelectTopic }: CatalogBrowserProps) {
  const [uuidDraft, setUuidDraft] = useState("");
  const [uuidError, setUuidError] = useState<string | null>(null);

  const topics = useMemo(() => {
    const rows: Array<{ id: string; label: string; path: string }> = [];
    for (const exam of mirror.examTypes) {
      for (const section of exam.sections) {
        for (const subject of section.subjects) {
          for (const topic of subject.topics) {
            rows.push({
              id: topic.id,
              label: `${exam.name} › ${section.name} › ${subject.name} › ${topic.name}`,
              path: `${exam.slug}/${section.slug}/${subject.slug}/${topic.slug}`,
            });
          }
        }
      }
    }
    return rows;
  }, [mirror]);

  const validateUuid = () => {
    if (!uuidDraft.trim()) {
      setUuidError("Enter a UUID");
      return;
    }
    if (!isValidUuid(uuidDraft.trim())) {
      setUuidError("Invalid UUID format");
      return;
    }
    setUuidError(null);
  };

  return (
    <div data-testid="catalog-browser" className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,280px)]">
      <section className="rounded-lg border border-[var(--qs-border)] bg-[var(--qs-surface)] p-4">
        <h2 className="text-sm font-semibold text-[var(--qs-text)]">Curriculum tree</h2>
        <p className="mt-1 text-xs text-[var(--qs-text-muted)]">
          Read-only mirror ({mirror.source}) · {mirror.fetchedAt}
        </p>
        <ul className="mt-4 space-y-2 text-sm">
          {topics.map((topic) => {
            const active = topic.id === selectedTopicId;
            return (
              <li key={topic.id}>
                <button
                  type="button"
                  data-testid={`catalog-topic-${topic.id}`}
                  className={`w-full rounded-md border px-3 py-2 text-left ${
                    active
                      ? "border-[var(--qs-phase-ship)] bg-[var(--qs-canvas)]"
                      : "border-[var(--qs-border)]"
                  }`}
                  onClick={() => onSelectTopic?.(topic.id)}
                >
                  <span className="block font-medium">{topic.label}</span>
                  <span className="font-mono text-[11px] text-[var(--qs-text-muted)]">{topic.id}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="rounded-lg border border-[var(--qs-border)] bg-[var(--qs-surface)] p-4">
        <h2 className="text-sm font-semibold text-[var(--qs-text)]">UUID picker</h2>
        <p className="mt-1 text-xs text-[var(--qs-text-muted)]">Paste a catalog UUID to validate format.</p>
        <label className="mt-3 block text-xs font-medium" htmlFor="catalog-uuid-input">
          UUID
        </label>
        <input
          id="catalog-uuid-input"
          data-testid="catalog-uuid-input"
          className="mt-1 w-full rounded-md border border-[var(--qs-border)] px-2 py-2 font-mono text-xs"
          value={uuidDraft}
          onChange={(e) => setUuidDraft(e.target.value)}
        />
        <button
          type="button"
          className="mt-2 rounded-md bg-[var(--qs-phase-ship)] px-3 py-2 text-sm font-medium text-white"
          onClick={validateUuid}
        >
          Validate UUID
        </button>
        {uuidError ? (
          <p className="mt-2 text-sm text-red-600" data-testid="catalog-uuid-error">{uuidError}</p>
        ) : null}
        {!uuidError && uuidDraft && isValidUuid(uuidDraft) ? (
          <p className="mt-2 text-sm text-green-700" data-testid="catalog-uuid-ok">Valid UUID</p>
        ) : null}

        <h3 className="mt-6 text-xs font-semibold uppercase tracking-wide text-[var(--qs-text-muted)]">
          Trap types
        </h3>
        <ul className="mt-2 max-h-48 space-y-1 overflow-auto font-mono text-[11px]">
          {mirror.trapTypes.map((trap) => (
            <li key={trap.id}>
              {trap.slug} → {trap.id}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
