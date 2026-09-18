const PLACEHOLDER_BLOCKERS = [
  { severity: "blocker", label: "No blocking findings" },
] as const;

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
      <ul className="mt-4 space-y-2">
        {PLACEHOLDER_BLOCKERS.map((item) => (
          <li
            key={item.label}
            className="flex items-start gap-2 rounded-md border border-[var(--qs-border)] px-3 py-2 text-sm text-[var(--qs-text-muted)]"
          >
            <span
              className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--qs-severity-pass)]"
              aria-hidden
            />
            {item.label}
          </li>
        ))}
      </ul>
    </aside>
  );
}
