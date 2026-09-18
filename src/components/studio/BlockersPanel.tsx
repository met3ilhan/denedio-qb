import { tr } from "@/shared/copy/tr";

export function BlockersPanel() {
  return (
    <aside
      className="min-w-0 rounded-lg border border-[var(--qs-border)] bg-[var(--qs-surface)] p-4"
      aria-label={tr.blockers.panelAria}
    >
      <h2 className="text-sm font-semibold text-[var(--qs-text)]">{tr.blockers.title}</h2>
      <p className="mt-1 text-xs text-[var(--qs-text-muted)]">{tr.blockers.sortedActive}</p>
      <div
        className="mt-4 rounded-md border border-dashed border-[var(--qs-border)] bg-[var(--qs-canvas)] px-3 py-6 text-center text-sm text-[var(--qs-text-muted)]"
        data-testid="blockers-empty"
      >
        {tr.blockers.empty}
      </div>
    </aside>
  );
}
