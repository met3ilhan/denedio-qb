import Link from "next/link";

import { StudioShell } from "@/components/studio/StudioShell";

export default function HomePage() {
  return (
    <StudioShell showBlockers>
      <section className="min-w-0 space-y-4" aria-label="Mission stream">
        <div className="rounded-lg border border-[var(--qs-border)] bg-[var(--qs-surface)] p-5">
          <h2 className="text-sm font-semibold text-[var(--qs-text)]">No missions yet</h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--qs-text-muted)]">
            Start with a source intake to open a mission thread. The board lists active work
            and blockers — not KPI charts.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/sources/new"
              className="inline-flex items-center rounded-md bg-[var(--qs-phase-intake)] px-3 py-2 text-sm font-medium text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--qs-phase-intake)]"
            >
              New source intake
            </Link>
            <button
              type="button"
              className="inline-flex items-center rounded-md border border-[var(--qs-border)] px-3 py-2 text-sm text-[var(--qs-text)]"
              disabled
              title="Available after your first mission"
            >
              Continue last mission
            </button>
          </div>
        </div>
        <p className="font-mono text-xs text-[var(--qs-text-muted)]">
          Tip: <kbd className="rounded border border-[var(--qs-border)] px-1">Ctrl+K</kbd> command
          palette (stub)
        </p>
      </section>
    </StudioShell>
  );
}
