import fs from "node:fs";
import path from "node:path";

import { expect, test } from "@playwright/test";

import {
  isTransientProviderFailure,
  markStage,
  readCheckpoint,
} from "./live-downstream-checkpoint";

const REPO_ROOT = path.resolve(__dirname, "..");

type Manifest = {
  fixtureKey: string;
  missionId: string;
  sourceFileId: string;
  sourceQuestionId: string;
  extractionJobId: string;
  fingerprintVersionId: string;
};

function loadManifest(): Manifest {
  const raw = fs.readFileSync(
    path.join(REPO_ROOT, "e2e", "fixtures", "live-downstream-manifest.json"),
    "utf8",
  );
  return JSON.parse(raw) as Manifest;
}

function assertNotTransient(label: string, res: { ok(): boolean; status(): number; text(): Promise<string> }) {
  return res.text().then((body) => {
    if (!res.ok() && isTransientProviderFailure(res.status(), body)) {
      throw new Error(`TRANSIENT-FAIL at ${label}: HTTP ${res.status()} — ${body.slice(0, 400)}`);
    }
    expect(res.ok(), `${label} failed: ${body.slice(0, 400)}`).toBeTruthy();
  });
}

test.describe.configure({ mode: "serial" });

test.describe("Live downstream pipeline (seeded fingerprint)", () => {
  test("MutationPlan → Candidate → Distractor → Solver → Verifier → UI", async ({ page, request }) => {
    test.setTimeout(600_000);

    const manifest = loadManifest();
    let checkpoint = readCheckpoint(REPO_ROOT, manifest.fixtureKey) ?? {
      fixtureKey: manifest.fixtureKey,
      completedStages: [],
      updatedAt: new Date().toISOString(),
    };

    const structuredRes = await request.get(`/api/sources/${manifest.sourceFileId}/structured`);
    await assertNotTransient("structured", structuredRes);
    const structured = (await structuredRes.json()) as {
      extraction?: { stemText?: string };
      jobId?: string;
      source?: { missionId?: string };
    };
    expect(structured.jobId).toBe(manifest.extractionJobId);
    expect(structured.source?.missionId).toBe(manifest.missionId);
    expect(structured.extraction?.stemText?.toLowerCase()).toContain("kurtuluş savaşı");
    expect(structured.extraction?.stemText?.toLowerCase()).not.toContain("kayak");

    const fpRes = await request.get(`/api/fingerprint/${manifest.fingerprintVersionId}`);
    await assertNotTransient("fingerprint", fpRes);
    const fpJson = (await fpRes.json()) as {
      version?: { status?: string; payload?: { measured_skill?: string } };
    };
    expect(fpJson.version?.status).toBe("LOCKED");
    expect(fpJson.version?.payload?.measured_skill?.toLowerCase()).not.toContain("kayak");

    markStage(REPO_ROOT, manifest.fixtureKey, "starting_artifacts_verified");

    let runId = checkpoint.runId;

    if (!checkpoint.completedStages.includes("mutation_plan_persisted") || !runId) {
      const setupPost = await request.post(`/api/missions/${manifest.missionId}/generation/setup`, {
        data: {
          action: "persist",
          fingerprintVersionId: manifest.fingerprintVersionId,
          siblingCount: 1,
        },
        timeout: 300_000,
      });
      await assertNotTransient("generation setup (LIVE mutation plan)", setupPost);
      const setupBody = (await setupPost.json()) as { runId?: string; planIds?: string[] };
      runId = setupBody.runId;
      expect(runId).toBeTruthy();
      expect(setupBody.planIds?.length).toBe(1);
      checkpoint = markStage(REPO_ROOT, manifest.fixtureKey, "mutation_plan_persisted", { runId });
    }

    let candidateId = checkpoint.candidateId;

    if (!checkpoint.completedStages.includes("spawn_complete") || !candidateId) {
      const spawnRes = await request.post(
        `/api/missions/${manifest.missionId}/generation/runs/${runId}/spawn`,
        { timeout: 480_000 },
      );
      await assertNotTransient("spawn (LIVE generation/distractor/solver)", spawnRes);
      const spawnBody = (await spawnRes.json()) as { candidateIds?: string[] };
      expect(spawnBody.candidateIds?.length).toBe(1);
      candidateId = spawnBody.candidateIds?.[0];
      expect(candidateId).toBeTruthy();
      checkpoint = markStage(REPO_ROOT, manifest.fixtureKey, "spawn_complete", {
        runId,
        candidateId,
      });
    }

    const candidateRes = await request.get(`/api/candidates/${candidateId}`);
    await assertNotTransient("candidate bundle", candidateRes);
    const candidate = (await candidateRes.json()) as {
      status?: string;
      draft?: { stem?: { questionText?: string } };
      distractorAnalysis?: { wrong_choices?: unknown[] };
      verification?: { quality_gate?: string; findings?: Array<{ group?: string }> };
      lineage?: {
        sourceQuestionId?: string;
        sourceFileId?: string;
        fingerprintVersionId?: string;
      };
      generation?: { providerId?: string; modelId?: string; status?: string };
      solver?: { providerId?: string; modelId?: string; result?: { selected_label?: string | null } };
    };

    expect(candidate.lineage?.sourceQuestionId).toBe(manifest.sourceQuestionId);
    expect(candidate.lineage?.sourceFileId).toBe(manifest.sourceFileId);
    expect(candidate.lineage?.fingerprintVersionId).toBe(manifest.fingerprintVersionId);
    expect(candidate.generation?.providerId).toBe("openrouter");
    expect(candidate.generation?.modelId).not.toContain("mock");
    expect(candidate.distractorAnalysis?.wrong_choices?.length).toBeGreaterThan(0);
    expect(candidate.solver?.providerId).toBe("openrouter");
    expect(candidate.solver?.modelId).not.toContain("mock");
    expect(candidate.draft?.stem?.questionText?.toLowerCase()).not.toContain("kayak");
    expect(candidate.verification?.quality_gate).toBeTruthy();
    expect(candidate.verification?.findings?.some((f) => f.group === "Solver")).toBeTruthy();

    markStage(REPO_ROOT, manifest.fixtureKey, "candidate_api_verified", { runId, candidateId });

    await page.goto(`/candidates/${candidateId}`);
    await expect(page.getByTestId("candidate-inspector")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId("expert-stem")).toBeVisible();
    await expect(page.getByTestId("expert-solution")).toBeVisible();
    await expect(page.getByTestId("distractor-editor-panel")).toBeVisible();

    await page.goto(`/candidates/${candidateId}/verification`);
    await expect(page.getByTestId("verification-findings")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId("quality-gate")).toBeVisible();
    await expect(page.getByText(/S\d+/)).toHaveCount(0);
    await expect(page.getByText(/P\d+/)).toHaveCount(0);

    markStage(REPO_ROOT, manifest.fixtureKey, "ui_verified", { runId, candidateId });
  });
});
