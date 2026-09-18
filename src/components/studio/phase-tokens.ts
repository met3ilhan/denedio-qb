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
    tintClass: "bg-[var(--qs-phase-intake-50)]",
  },
  {
    id: "mechanism",
    phase: "MECHANISM",
    label: MISSION_PHASE_LABELS.MECHANISM,
    signalClass: "bg-[var(--qs-phase-mechanism)]",
    tintClass: "bg-[var(--qs-phase-mechanism-50)]",
  },
  {
    id: "candidates",
    phase: "CANDIDATES",
    label: MISSION_PHASE_LABELS.CANDIDATES,
    signalClass: "bg-[var(--qs-phase-candidates)]",
    tintClass: "bg-[var(--qs-phase-candidates-50)]",
  },
  {
    id: "ship",
    phase: "SHIP",
    label: MISSION_PHASE_LABELS.SHIP,
    signalClass: "bg-[var(--qs-phase-ship)]",
    tintClass: "bg-[var(--qs-phase-ship-50)]",
  },
];

export function phaseByMissionPhase(phase: MissionPhase) {
  return STUDIO_PHASES.find((p) => p.phase === phase) ?? STUDIO_PHASES[0];
}
