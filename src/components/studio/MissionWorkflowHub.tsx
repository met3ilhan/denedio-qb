import Link from "next/link";

import type { MissionWorkflowStep } from "@/modules/missions/services/mission-workflow";
import { tr } from "@/shared/copy/tr";

type MissionWorkflowHubProps = {
  steps: MissionWorkflowStep[];
  missionId: string;
};

function statusLabel(status: MissionWorkflowStep["status"]): string {
  switch (status) {
    case "done":
      return tr.workflow.statusDone;
    case "current":
      return tr.workflow.statusCurrent;
    case "blocked":
      return tr.workflow.statusBlocked;
    default:
      return tr.workflow.statusUpcoming;
  }
}

export function MissionWorkflowHub({ steps, missionId }: MissionWorkflowHubProps) {
  const current = steps.find((s) => s.status === "current") ?? steps[0];

  return (
    <section
      className="min-w-0 space-y-4 rounded-lg border border-[var(--qs-border)] bg-[var(--qs-surface)] p-4"
      data-testid="mission-workflow-hub"
      aria-label={tr.workflow.hubAria}
    >
      <div>
        <h2 className="text-sm font-semibold text-[var(--qs-text)]">{tr.workflow.hubTitle}</h2>
        <p className="mt-1 text-sm text-[var(--qs-text-muted)]">{tr.workflow.hubHint}</p>
      </div>

      {current ? (
        <div
          className="rounded-md border border-[var(--qs-phase-intake)] bg-[var(--qs-phase-intake-50)] p-4"
          data-testid="mission-next-step"
        >
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--qs-text-muted)]">
            {tr.workflow.nextStepLabel}
          </p>
          <p className="mt-1 font-medium text-[var(--qs-text)]">{current.label}</p>
          <p className="mt-1 text-sm text-[var(--qs-text-muted)]">{current.description}</p>
          <Link
            href={current.href}
            className="mt-3 inline-flex min-h-[44px] items-center rounded-md bg-[var(--qs-phase-intake)] px-4 py-2 text-sm font-medium text-white"
            data-testid="mission-next-step-cta"
          >
            {tr.workflow.continueStep}
          </Link>
        </div>
      ) : null}

      <ol className="space-y-2" data-testid="mission-workflow-steps">
        {steps.map((step) => (
          <li
            key={step.id}
            className={`flex flex-wrap items-center justify-between gap-2 rounded border border-[var(--qs-border)] px-3 py-2 text-sm ${
              step.status === "current" ? "border-[var(--qs-phase-intake)] bg-[var(--qs-canvas)]" : ""
            }`}
            data-testid={`workflow-step-${step.id}`}
          >
            <div className="min-w-0">
              <p className="font-medium text-[var(--qs-text)]">{step.label}</p>
              <p className="text-xs text-[var(--qs-text-muted)]">{step.description}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="text-xs text-[var(--qs-text-muted)]">{statusLabel(step.status)}</span>
              {step.status !== "blocked" ? (
                <Link
                  href={step.href}
                  className="text-xs font-medium text-[var(--qs-phase-intake)] underline"
                >
                  {tr.common.open}
                </Link>
              ) : null}
            </div>
          </li>
        ))}
      </ol>

      <Link
        href="/"
        className="inline-flex text-sm text-[var(--qs-text-muted)] underline"
        data-testid="mission-back-home"
      >
        {tr.workflow.backToHome}
      </Link>
      <span className="sr-only">{missionId}</span>
    </section>
  );
}
