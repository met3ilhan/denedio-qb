import Link from "next/link";

import type { MissionBlocker } from "@/modules/missions/services/mission-blockers";

type MissionBlockersPanelProps = {
  blockers: MissionBlocker[];
};

export function MissionBlockersPanel({ blockers }: MissionBlockersPanelProps) {
  if (blockers.length === 0) {
    return (
      <aside
        className="min-w-0 rounded-lg border border-[var(--qs-border)] bg-[var(--qs-surface)] p-4"
        aria-label="Blockers panel"
      >
        <h2 className="text-sm font-semibold text-[var(--qs-text)]">Blockers</h2>
        <div
          className="mt-4 rounded-md border border-dashed border-[var(--qs-border)] bg-[var(--qs-canvas)] px-3 py-6 text-center text-sm text-[var(--qs-text-muted)]"
          data-testid="blockers-empty"
        >
          No blockers on this mission.
        </div>
      </aside>
    );
  }

  return (
    <aside
      className="min-w-0 rounded-lg border border-[var(--qs-border)] bg-[var(--qs-surface)] p-4"
      aria-label="Blockers panel"
      data-testid="blockers-panel"
    >
      <h2 className="text-sm font-semibold text-[var(--qs-text)]">Blockers</h2>
      <p className="mt-1 text-xs text-[var(--qs-text-muted)]">Sorted by severity (P0 first).</p>
      <ul className="mt-4 space-y-2">
        {blockers.map((blocker) => (
          <li
            key={blocker.id}
            data-testid={`blocker-${blocker.severity}`}
            className="rounded-md border border-[var(--qs-border)] p-3 text-sm"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-xs font-semibold">{blocker.severity}</span>
              <Link href={blocker.href} className="text-xs font-medium text-[var(--qs-phase-ship)] underline">
                Open
              </Link>
            </div>
            <p className="mt-1 font-medium">{blocker.title}</p>
            <p className="text-xs text-[var(--qs-text-muted)]">{blocker.detail}</p>
          </li>
        ))}
      </ul>
    </aside>
  );
}
