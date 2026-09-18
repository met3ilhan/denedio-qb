import path from "node:path";

import { expect, test } from "@playwright/test";

test.describe.configure({ mode: "serial" });

test.describe("S18 dry-run export gate", () => {
  test.skip(!process.env.DATABASE_URL, "DATABASE_URL required");

  let generatedQuestionId: string;
  let missionId: string;

  test("setup approved question via pipeline", async ({ request }) => {
    const fixture = path.join(__dirname, "fixtures", "demo-source.txt");
    const upload = await request.post("/api/sources/upload", {
      multipart: {
        file: {
          name: "demo-source.txt",
          mimeType: "text/plain",
          buffer: await import("node:fs").then((fs) => fs.promises.readFile(fixture)),
        },
        missionTitle: "E2E export dry-run",
      },
    });
    const body = (await upload.json()) as { sourceFileId: string; missionId: string };
    missionId = body.missionId;

    let jobStatus = "PENDING";
    for (let i = 0; i < 30; i++) {
      const jobRes = await request.get(`/api/sources/${body.sourceFileId}/extraction`);
      const jobBody = (await jobRes.json()) as { job?: { status: string } };
      jobStatus = jobBody.job?.status ?? jobStatus;
      if (jobStatus === "SUCCEEDED") break;
      await new Promise((r) => setTimeout(r, 500));
    }
    expect(jobStatus).toBe("SUCCEEDED");

    await request.post(`/api/sources/${body.sourceFileId}/structured`, { data: { action: "accept" } });
    const draftFp = await request.post(`/api/sources/${body.sourceFileId}/fingerprint/draft`);
    const { version } = (await draftFp.json()) as { version: { id: string } };
    await request.post(`/api/fingerprint/${version.id}/lock`, { data: {} });

    const setup = await request.post(`/api/missions/${missionId}/generation/setup`, {
      data: { action: "persist", fingerprintVersionId: version.id },
    });
    const { runId } = (await setup.json()) as { runId: string };
    const spawn = await request.post(`/api/missions/${missionId}/generation/runs/${runId}/spawn`);
    expect(spawn.ok()).toBeTruthy();
    const { candidateIds } = (await spawn.json()) as { candidateIds: string[] };
    expect(candidateIds.length).toBeGreaterThan(0);

    let candidateId: string | null = null;
    for (const id of candidateIds) {
      const detail = await request.get(`/api/candidates/${id}`);
      expect(detail.ok()).toBeTruthy();
      const { verification } = (await detail.json()) as { verification?: { quality_gate?: string } };
      if (verification?.quality_gate !== "GATE_FAIL") {
        candidateId = id;
        break;
      }
    }
    if (!candidateId) {
      const debug = await request.get(`/api/candidates/${candidateIds[0]}`);
      const debugBody = (await debug.json()) as {
        verification?: { quality_gate?: string; findings?: Array<{ level: string; code: string }> };
      };
      const fails = debugBody.verification?.findings?.filter((f) => f.level === "FAIL") ?? [];
      expect(candidateId, `no sibling passed verification: ${JSON.stringify(fails)}`).toBeTruthy();
    }

    const approve = await request.post(`/api/candidates/${candidateId}/approve`, {
      data: { checklist: { mechanism_preserved: true, solver_consistent: true } },
    });
    expect(approve.ok()).toBeTruthy();
    const approveBody = (await approve.json()) as { generatedQuestionId: string };
    generatedQuestionId = approveBody.generatedQuestionId;
    expect(generatedQuestionId).toBeTruthy();
  });

  test("dry-run fail then pass", async ({ page, request }) => {
    test.skip(!generatedQuestionId, "no approved question");

    await page.goto(`/questions/${generatedQuestionId}/denedio/dry-run`);
    await expect(page.getByTestId("dry-run-console")).toBeVisible();
    await expect(page.getByTestId("export-download")).toBeDisabled();

    await request.put(`/api/questions/${generatedQuestionId}/denedio/mapping`, {
      data: {
        examTypeId: "00000000-0000-4000-8000-000000000099",
        examSectionId: "22222222-2222-4222-8222-222222222222",
        subjectId: "33333333-3333-4333-8333-333333333333",
        topicId: "44444444-4444-4444-8444-444444444444",
        trapTypeMap: {},
      },
    });

    const failResponse = await Promise.all([
      page.waitForResponse(
        (r) =>
          r.url().includes("/denedio/dry-run") && r.request().method() === "POST" && r.status() === 200,
      ),
      page.getByTestId("dry-run-run").click(),
    ]);
    const failBody = (await failResponse[0].json()) as { passed: boolean };
    expect(failBody.passed).toBe(false);
    await expect(page.getByTestId("dry-run-banner")).toContainText(/BAŞARISIZ|çalıştırılmadı/i);
    await expect(page.getByTestId("export-download")).toBeDisabled();

    await request.put(`/api/questions/${generatedQuestionId}/denedio/mapping`, {
      data: {
        examTypeId: "11111111-1111-4111-8111-111111111111",
        examSectionId: "22222222-2222-4222-8222-222222222222",
        subjectId: "33333333-3333-4333-8333-333333333333",
        topicId: "44444444-4444-4444-8444-444444444444",
        trapTypeMap: {},
      },
    });

    const passResponse = await Promise.all([
      page.waitForResponse(
        (r) =>
          r.url().includes("/denedio/dry-run") && r.request().method() === "POST" && r.status() === 200,
      ),
      page.getByTestId("dry-run-run").click(),
    ]);
    const passBody = (await passResponse[0].json()) as { passed: boolean; issues?: unknown[] };
    expect(passBody.passed, JSON.stringify(passBody.issues)).toBe(true);
    await expect(page.getByTestId("dry-run-banner")).toContainText(/GEÇTİ/i);
    await expect(page.getByTestId("export-download")).toBeEnabled();
    await expect(page.getByTestId("publish-denedio")).toBeDisabled();
  });

  test("continue mission deep link from home", async ({ page }) => {
    await page.goto("/");
    const continueLink = page.getByTestId("continue-last-mission");
    await expect(continueLink).toBeVisible();
    await continueLink.click();
    await expect(page).toHaveURL(/\/missions\/[a-z0-9]+/);
  });

  test("catalog UUID picker blocks invalid UUID", async ({ page }) => {
    await page.goto("/catalog");
    await page.getByTestId("catalog-uuid-input").fill("not-a-uuid");
    await page.getByRole("button", { name: "UUID doğrula" }).click();
    await expect(page.getByTestId("catalog-uuid-error")).toBeVisible();
  });
});
