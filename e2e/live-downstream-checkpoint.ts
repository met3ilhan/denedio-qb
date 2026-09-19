import fs from "node:fs";
import path from "node:path";

export type DownstreamCheckpoint = {
  fixtureKey: string;
  runId?: string;
  candidateId?: string;
  completedStages: string[];
  updatedAt: string;
};

export function checkpointPath(root: string): string {
  return path.join(root, ".tmp", "live-downstream-checkpoint.json");
}

export function readCheckpoint(root: string, fixtureKey: string): DownstreamCheckpoint | null {
  const file = checkpointPath(root);
  if (!fs.existsSync(file)) {
    return null;
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(file, "utf8")) as DownstreamCheckpoint;
    if (parsed.fixtureKey !== fixtureKey) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function writeCheckpoint(root: string, checkpoint: DownstreamCheckpoint): void {
  const file = checkpointPath(root);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(checkpoint, null, 2)}\n`, "utf8");
}

export function markStage(
  root: string,
  fixtureKey: string,
  stage: string,
  patch: Partial<DownstreamCheckpoint> = {},
): DownstreamCheckpoint {
  const existing = readCheckpoint(root, fixtureKey) ?? {
    fixtureKey,
    completedStages: [],
    updatedAt: new Date().toISOString(),
  };
  const completedStages = existing.completedStages.includes(stage)
    ? existing.completedStages
    : [...existing.completedStages, stage];
  const next: DownstreamCheckpoint = {
    ...existing,
    ...patch,
    fixtureKey,
    completedStages,
    updatedAt: new Date().toISOString(),
  };
  writeCheckpoint(root, next);
  return next;
}

export function isTransientProviderFailure(status: number, body: string): boolean {
  return (
    status === 429 ||
    status === 503 ||
    status === 502 ||
    status === 504 ||
    body.includes("GeminiRetryExhausted") ||
    body.includes("transient Gemini failures exhausted") ||
    body.includes("RESOURCE_EXHAUSTED") ||
    body.includes("quota")
  );
}
