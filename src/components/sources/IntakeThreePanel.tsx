import type { ReactNode } from "react";

import { tr } from "@/shared/copy/tr";

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
        aria-label={tr.intake.sourceNavigatorAria}
      >
        {navigator}
      </section>
      <section
        className="min-w-0 rounded-lg border border-[var(--qs-border)] bg-[var(--qs-surface)] p-4"
        aria-label={tr.intake.mainPanelAria}
      >
        {main}
      </section>
      <section
        className="min-w-0 rounded-lg border border-[var(--qs-border)] bg-[var(--qs-surface)] p-4"
        aria-label={tr.intake.inspectorAria}
      >
        {inspector}
      </section>
    </div>
  );
}
