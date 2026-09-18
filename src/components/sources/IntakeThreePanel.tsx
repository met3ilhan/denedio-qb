import type { ReactNode } from "react";

type IntakeThreePanelProps = {
  navigator: ReactNode;
  main: ReactNode;
  inspector: ReactNode;
};

export function IntakeThreePanel({ navigator, main, inspector }: IntakeThreePanelProps) {
  return (
    <div
      className="grid min-h-[480px] min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2.5fr)_minmax(0,1.5fr)]"
      data-testid="intake-three-panel"
    >
      <section
        className="min-w-0 rounded-lg border border-[var(--qs-border)] bg-[var(--qs-surface)] p-4"
        aria-label="Source navigator"
      >
        {navigator}
      </section>
      <section
        className="min-w-0 rounded-lg border border-[var(--qs-border)] bg-[var(--qs-surface)] p-4"
        aria-label="Main panel"
      >
        {main}
      </section>
      <section
        className="min-w-0 rounded-lg border border-[var(--qs-border)] bg-[var(--qs-surface)] p-4"
        aria-label="Inspector"
      >
        {inspector}
      </section>
    </div>
  );
}
