import path from "node:path";

import { expect, test } from "@playwright/test";

test.describe.configure({ mode: "serial" });

test.describe("Candidate review and approval", () => {
  test.skip(!process.env.DATABASE_URL, "DATABASE_URL required for pipeline e2e");

  let candidateId: string;

  test("API: spawn candidate through generation pipeline", async ({ request }) => {
    const fixture = path.join(__dirname, "fixtures", "demo-source.txt");

    const upload = await request.post("/api/sources/upload", {
      multipart: {
        file: {
          name: "demo-source.txt",
          mimeType: "text/plain",
          buffer: await import("node:fs").then((fs) => fs.promises.readFile(fixture)),
        },
        missionTitle: "E2E candidates pipeline",
      },
    });
    expect(upload.ok()).toBeTruthy();
    const { sourceFileId, missionId } = (await upload.json()) as {
      sourceFileId: string;
      missionId: string;
    };

    let jobStatus = "PENDING";
    for (let i = 0; i < 30; i++) {
      const jobRes = await request.get(`/api/sources/${sourceFileId}/extraction`);
      const body = (await jobRes.json()) as { job?: { status: string } };
      jobStatus = body.job?.status ?? jobStatus;
      if (jobStatus === "SUCCEEDED") break;
      await new Promise((r) => setTimeout(r, 500));
    }
    expect(jobStatus).toBe("SUCCEEDED");

    const accept = await request.post(`/api/sources/${sourceFileId}/structured`, {
      data: { action: "accept" },
    });
    expect(accept.ok()).toBeTruthy();

    const draftFp = await request.post(`/api/sources/${sourceFileId}/fingerprint/draft`);
    expect(draftFp.ok()).toBeTruthy();
    const draftBody = (await draftFp.json()) as { version: { id: string } };
    const versionId = draftBody.version.id;

    const lock = await request.post(`/api/fingerprint/${versionId}/lock`, { data: {} });
    expect(lock.ok()).toBeTruthy();

    const setup = await request.post(`/api/missions/${missionId}/generation/setup`, {
      data: { action: "persist", fingerprintVersionId: versionId },
    });
    expect(setup.ok()).toBeTruthy();
    const { runId } = (await setup.json()) as { runId: string };

    const spawn = await request.post(`/api/missions/${missionId}/generation/runs/${runId}/spawn`);
    expect(spawn.ok()).toBeTruthy();
    const spawnBody = (await spawn.json()) as { candidateIds: string[] };
    expect(spawnBody.candidateIds.length).toBeGreaterThan(0);
    candidateId = spawnBody.candidateIds[0];
  });

  test("UI: verification, stale invalidation, approval blocked", async ({ page }) => {
    test.skip(!candidateId, "spawn step failed");

    await page.goto(`/candidates/${candidateId}/verification`);
    await expect(page.getByTestId("verification-findings")).toBeVisible();
    await expect(page.getByTestId("quality-gate")).toContainText(/GATE_/);

    await page.goto(`/candidates/${candidateId}`);
    const stem = page.locator("textarea").first();
    await stem.fill(`${"Edited stem for invalidation test. ".repeat(3)}`);
    await page.getByRole("button", { name: "Save edits" }).click();
    await expect(page.getByTestId("verification-stale-banner")).toBeVisible();

    await page.goto(`/candidates/${candidateId}/approve`);
    await expect(page.getByTestId("approval-blocked")).toBeVisible();
  });
});
