import type { MissionPhase } from "@prisma/client";

export const MISSION_PHASE_ORDER: MissionPhase[] = [
  "INTAKE",
  "MECHANISM",
  "CANDIDATES",
  "SHIP",
];

export const MISSION_PHASE_LABELS: Record<MissionPhase, string> = {
  INTAKE: "Alım",
  MECHANISM: "Mekanizma",
  CANDIDATES: "Adaylar",
  SHIP: "Yayın",
};

export const MISSION_PHASE_ROUTE_SEGMENT: Record<MissionPhase, string> = {
  INTAKE: "intake",
  MECHANISM: "mechanism",
  CANDIDATES: "candidates",
  SHIP: "ship",
};
