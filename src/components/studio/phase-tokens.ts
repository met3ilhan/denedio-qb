import type { MissionPhase } from "@prisma/client";

import { MISSION_PHASE_LABELS } from "@/modules/missions/domain/mission-phase";

export type StudioPhaseId = Lowercase<MissionPhase>;

export const STUDIO_PHASES: {
  id: StudioPhaseId;
  phase: MissionPhase;
  label: string;
  signalClass: string;
  tintClass: string;
}[] = [
  {
    id: "intake",
    phase: "INTAKE",
    label: MISSION_PHASE_LABELS.INTAKE,
    signalClass: "bg-[var(--qs-phase-intake)]",
    tintClass: "bg-[color-mix(in_srgb,var(--qs-phase-intake)_8%,white)]",
  },
  {
    id: "mechanism",
    phase: "MECHANISM",
    label: MISSION_PHASE_LABELS.MECHANISM,
    signalClass: "bg-[var(--qs-phase-mechanism)]",
    tintClass: "bg-[color-mix(in_srgb,var(--qs-phase-mechanism)_8%,white)]",
  },
  {
    id: "candidates",
    phase: "CANDIDATES",
    label: MISSION_PHASE_LABELS.CANDIDATES,
    signalClass: "bg-[var(--qs-phase-candidates)]",
    tintClass: "bg-[color-mix(in_srgb,var(--qs-phase-candidates)_8%,white)]",
  },
  {
    id: "ship",
    phase: "SHIP",
    label: MISSION_PHASE_LABELS.SHIP,
    signalClass: "bg-[var(--qs-phase-ship)]",
    tintClass: "bg-[color-mix(in_srgb,var(--qs-phase-ship)_8%,white)]",
  },
];

export function phaseByMissionPhase(phase: MissionPhase) {
  return STUDIO_PHASES.find((p) => p.phase === phase) ?? STUDIO_PHASES[0];
}
