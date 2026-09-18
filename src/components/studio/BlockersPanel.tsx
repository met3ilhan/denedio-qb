export function BlockersPanel() {
  return (
    <aside
      className="min-w-0 rounded-lg border border-[var(--qs-border)] bg-[var(--qs-surface)] p-4"
      aria-label="Blockers panel"
    >
      <h2 className="text-sm font-semibold text-[var(--qs-text)]">Blockers</h2>
      <p className="mt-1 text-xs text-[var(--qs-text-muted)]">
        Sorted by severity when missions are active.
      </p>
      <div
        className="mt-4 rounded-md border border-dashed border-[var(--qs-border)] bg-[var(--qs-canvas)] px-3 py-6 text-center text-sm text-[var(--qs-text-muted)]"
        data-testid="blockers-empty"
      >
        No blockers on this mission.
      </div>
    </aside>
  );
}
