import type { MissionPhase } from "@prisma/client";

import { phaseByMissionPhase } from "./phase-tokens";

type PhasePillProps = {
  phase: MissionPhase;
  className?: string;
};

export function PhasePill({ phase, className = "" }: PhasePillProps) {
  const meta = phaseByMissionPhase(phase);

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border border-[color-mix(in_srgb,var(--qs-border)_70%,transparent)] px-2 py-0.5 text-xs font-medium text-[var(--qs-text)] ${meta.tintClass} ${className}`}
    >
      <span
        className={`h-2 w-2 shrink-0 ${meta.signalClass}`}
        aria-hidden
      />
      {meta.label}
    </span>
  );
}
