"use client";

import { useCallback, useEffect, useState } from "react";

const STUB_SCREENS = [
  { id: "S01", label: "Mission Board", href: "/" },
  { id: "S03", label: "Source Upload", href: "/sources/new" },
  { id: "S07", label: "Fingerprint Studio", href: "/fingerprint" },
];

export function CommandPaletteStub() {
  const [open, setOpen] = useState(false);

  const onKeyDown = useCallback((event: KeyboardEvent) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      setOpen((value) => !value);
    }
    if (event.key === "Escape") {
      setOpen(false);
    }
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onKeyDown]);

  if (!open) {
    return (
      <p className="sr-only" data-testid="command-palette-closed">
        Command palette closed. Press Control+K to open.
      </p>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-[rgba(15,23,42,0.4)] px-4 pt-[20vh]"
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
      data-testid="command-palette"
    >
      <div
        className="w-full max-w-md rounded-lg border border-[var(--qs-border)] bg-[var(--qs-surface)] p-2 shadow-[0_8px_24px_rgba(15,23,42,0.08)]"
      >
        <p className="px-2 py-1 font-mono text-xs text-[var(--qs-text-muted)]">
          Jump to screen (stub)
        </p>
        <ul className="mt-1 flex flex-col gap-0.5">
          {STUB_SCREENS.map((screen) => (
            <li key={screen.id}>
              <a
                href={screen.href}
                className="flex items-center justify-between rounded-md px-2 py-2 text-sm text-[var(--qs-text)] hover:bg-[var(--qs-invariant-bg)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--qs-phase-intake)]"
                onClick={() => setOpen(false)}
              >
                <span>{screen.label}</span>
                <span className="font-mono text-xs text-[var(--qs-text-muted)]">
                  {screen.id}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
