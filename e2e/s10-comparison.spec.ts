import path from "node:path";

import { expect, test } from "@playwright/test";

test.describe.configure({ mode: "serial" });

test.describe("S10 candidate comparison", () => {
  test.skip(!process.env.DATABASE_URL, "DATABASE_URL required for comparison e2e");

  let missionId: string;
  let runId: string;
  let candidateIds: string[] = [];

  test("API: prepare generation run with multiple candidates", async ({ request }) => {
    const fixture = path.join(__dirname, "fixtures", "demo-source.txt");

    const upload = await request.post("/api/sources/upload", {
      multipart: {
        file: {
          name: "demo-source.txt",
          mimeType: "text/plain",
          buffer: await import("node:fs").then((fs) => fs.promises.readFile(fixture)),
        },
        missionTitle: "E2E S10 comparison",
      },
    });
    expect(upload.ok()).toBeTruthy();
    const body = (await upload.json()) as { sourceFileId: string; missionId: string };
    missionId = body.missionId;
    const { sourceFileId } = body;

    let jobStatus = "PENDING";
    for (let i = 0; i < 30; i++) {
      const jobRes = await request.get(`/api/sources/${sourceFileId}/extraction`);
      const jobBody = (await jobRes.json()) as { job?: { status: string } };
      jobStatus = jobBody.job?.status ?? jobStatus;
      if (jobStatus === "SUCCEEDED") break;
      await new Promise((r) => setTimeout(r, 500));
    }
    expect(jobStatus).toBe("SUCCEEDED");

    await request.post(`/api/sources/${sourceFileId}/structured`, { data: { action: "accept" } });
    const draftFp = await request.post(`/api/sources/${sourceFileId}/fingerprint/draft`);
    const { version } = (await draftFp.json()) as { version: { id: string } };
    await request.post(`/api/fingerprint/${version.id}/lock`, { data: {} });

    const setup = await request.post(`/api/missions/${missionId}/generation/setup`, {
      data: { action: "persist", fingerprintVersionId: version.id },
    });
    const setupBody = (await setup.json()) as { runId: string };
    runId = setupBody.runId;

    const spawn = await request.post(`/api/missions/${missionId}/generation/runs/${runId}/spawn`);
    const spawnBody = (await spawn.json()) as { candidateIds: string[] };
    candidateIds = spawnBody.candidateIds;
    expect(candidateIds.length).toBeGreaterThan(0);

    for (const id of candidateIds) {
      await request.post(`/api/candidates/${id}/verify`, { data: {} });
    }
  });

  test("UI: comparison matrix, filter, preview, editor navigation", async ({ page }) => {
    test.skip(!missionId || !runId, "setup failed");

    await page.goto(`/missions/${missionId}/candidates/compare?runId=${runId}`);
    await expect(page.getByTestId("candidate-comparison-matrix")).toBeVisible();
    await expect(page.getByTestId("compare-run-header")).toBeVisible();
    await expect(page.getByTestId("compare-row-mechanism")).toBeVisible();
    await expect(page.getByTestId("compare-row-fp_measured_skill")).toBeVisible();

    await page.getByTestId("compare-row-distractor").click();
    await page.getByTestId("compare-filter-mechanism-deltas").check();
    await expect(page.getByTestId("compare-preview-drawer")).toBeVisible();

    const firstId = candidateIds[0];
    await page.getByTestId(`compare-select-${firstId}`).check();
    await page.getByTestId("compare-open-candidate").first().click();
    await expect(page.getByTestId("candidate-inspector")).toBeVisible();
    await expect(page.getByTestId("distractor-editor-panel")).toBeVisible();

    await page.goto(`/missions/${missionId}/candidates/compare?runId=${runId}`);
    await expect(page.getByTestId("candidate-comparison-matrix")).toBeVisible();
  });
});
