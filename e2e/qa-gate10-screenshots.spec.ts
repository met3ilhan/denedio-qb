import fs from "node:fs";
import path from "node:path";

import { expect, test } from "@playwright/test";

const OUT_DIR = path.join(process.cwd(), "artifacts", "screenshots");

async function shot(page: import("@playwright/test").Page, name: string) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  await page.screenshot({
    path: path.join(OUT_DIR, `${name}.png`),
    fullPage: true,
  });
}

test.describe.configure({ mode: "serial" });

test.describe("Gate 10 QA screenshot capture", () => {
  test.skip(!process.env.DATABASE_URL, "DATABASE_URL required");

  let sourceFileId: string;
  let missionId: string;
  let versionId: string;
  let runId: string;
  let candidateId: string;
  let generatedQuestionId: string;

  test("bootstrap golden path via API", async ({ request }) => {
    const fixture = path.join(__dirname, "fixtures", "demo-source.txt");
    const upload = await request.post("/api/sources/upload", {
      multipart: {
        file: {
          name: "demo-source.txt",
          mimeType: "text/plain",
          buffer: await import("node:fs").then((fs) => fs.promises.readFile(fixture)),
        },
        missionTitle: "QA Gate 10 screenshot mission",
      },
    });
    expect(upload.ok()).toBeTruthy();
    const body = (await upload.json()) as { sourceFileId: string; missionId: string };
    sourceFileId = body.sourceFileId;
    missionId = body.missionId;

    let jobStatus = "PENDING";
    for (let i = 0; i < 40; i++) {
      const jobRes = await request.get(`/api/sources/${sourceFileId}/extraction`);
      const jobBody = (await jobRes.json()) as { job?: { status: string } };
      jobStatus = jobBody.job?.status ?? jobStatus;
      if (jobStatus === "SUCCEEDED") break;
      await new Promise((r) => setTimeout(r, 500));
    }
    expect(jobStatus).toBe("SUCCEEDED");

    await request.post(`/api/sources/${sourceFileId}/structured`, { data: { action: "accept" } });
    const draftFp = await request.post(`/api/sources/${sourceFileId}/fingerprint/draft`);
    const draft = (await draftFp.json()) as { version: { id: string } };
    versionId = draft.version.id;
    await request.post(`/api/fingerprint/${versionId}/lock`, { data: {} });

    const setup = await request.post(`/api/missions/${missionId}/generation/setup`, {
      data: { action: "persist", fingerprintVersionId: versionId },
    });
    const setupBody = (await setup.json()) as { runId: string };
    runId = setupBody.runId;

    const spawn = await request.post(`/api/missions/${missionId}/generation/runs/${runId}/spawn`);
    const spawnBody = (await spawn.json()) as { candidateIds: string[] };
    candidateId = spawnBody.candidateIds[0];
    const detail = await request.get(`/api/candidates/${candidateId}`);
    const { verification } = (await detail.json()) as { verification?: { quality_gate?: string } };
    expect(verification?.quality_gate).not.toBe("GATE_FAIL");
    const approve = await request.post(`/api/candidates/${candidateId}/approve`, {
      data: { checklist: { mechanism_preserved: true, solver_consistent: true } },
    });
    expect(approve.ok()).toBeTruthy();
    const approveBody = (await approve.json()) as { generatedQuestionId: string };
    generatedQuestionId = approveBody.generatedQuestionId;
  });

  test("capture 1440 and 390 screenshots", async ({ page, request }) => {
    test.skip(!candidateId, "bootstrap failed");

    await page.setViewportSize({ width: 1440, height: 900 });

    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Görev akışı" })).toBeVisible();
    await shot(page, "home-1440");

    await page.goto(`/sources/${sourceFileId}/review`);
    await expect(page.getByTestId("source-expert-review")).toBeVisible({ timeout: 15_000 });
    await shot(page, "source-analysis-1440");

    await page.goto(`/fingerprint/${versionId}`);
    await expect(page.getByTestId("fingerprint-studio")).toBeVisible({ timeout: 15_000 });
    await shot(page, "fingerprint-1440");

    await page.goto(`/missions/${missionId}/generate/setup`);
    await expect(page.getByTestId("generation-setup")).toBeVisible({ timeout: 15_000 });
    await shot(page, "candidate-family-1440");

    await page.goto(`/missions/${missionId}/candidates/compare?runId=${runId}`);
    await expect(page.getByTestId("candidate-comparison-matrix")).toBeVisible({ timeout: 15_000 });
    await shot(page, "candidate-comparison-1440");

    await page.goto(`/candidates/${candidateId}`);
    await expect(page.getByTestId("candidate-inspector")).toBeVisible({ timeout: 15_000 });
    await page.getByTestId(/^distractor-rail-/).first().click();
    await shot(page, "candidate-review-1440");
    await shot(page, "distractor-editor-1440");
    await shot(page, "expert-editor-1440");

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/candidates/${candidateId}`);
    await expect(page.getByTestId("candidate-inspector")).toBeVisible({ timeout: 15_000 });
    await shot(page, "candidate-review-390");

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`/candidates/${candidateId}/verification`);
    await expect(page.getByTestId("verification-findings")).toBeVisible();
    await shot(page, "verification-1440");

    await page.goto("/catalog");
    await expect(page.getByTestId("catalog-browser")).toBeVisible();
    await shot(page, "catalog-1440");

    await request.put(`/api/questions/${generatedQuestionId}/denedio/mapping`, {
      data: {
        examTypeId: "11111111-1111-4111-8111-111111111111",
        examSectionId: "22222222-2222-4222-8222-222222222222",
        subjectId: "33333333-3333-4333-8333-333333333333",
        topicId: "44444444-4444-4444-8444-444444444444",
        trapTypeMap: {},
      },
    });

    await page.goto(`/questions/${generatedQuestionId}/denedio/dry-run`);
    await expect(page.getByTestId("dry-run-console")).toBeVisible();
    await shot(page, "dry-run-1440");
  });
});
