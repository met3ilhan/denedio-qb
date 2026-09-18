import type { ExtractionJobStatus } from "@prisma/client";

const TRANSITIONS: Record<ExtractionJobStatus, ExtractionJobStatus[]> = {
  PENDING: ["RUNNING", "CANCELLED"],
  RUNNING: ["SUCCEEDED", "FAILED", "CANCELLED"],
  SUCCEEDED: [],
  FAILED: ["PENDING"],
  CANCELLED: [],
};

export function canTransitionExtractionJob(
  from: ExtractionJobStatus,
  to: ExtractionJobStatus,
): boolean {
  return TRANSITIONS[from].includes(to);
}

export function assertExtractionJobTransition(
  from: ExtractionJobStatus,
  to: ExtractionJobStatus,
): void {
  if (!canTransitionExtractionJob(from, to)) {
    throw new Error(`Invalid extraction job transition ${from} → ${to}`);
  }
}

export type ExtractionLogLine = {
  at: string;
  level: "info" | "warn" | "error";
  message: string;
};

export function appendLogLine(
  logs: ExtractionLogLine[],
  level: ExtractionLogLine["level"],
  message: string,
): ExtractionLogLine[] {
  return [...logs, { at: new Date().toISOString(), level, message }];
}
