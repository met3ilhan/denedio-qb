import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { expect, test } from "@playwright/test";

const SMOKE_MARKER = "LIVE-SMOKE-8842";
const EXPECTED_STEM_SNIPPET = "Kurtuluş Savaşı";

test.describe.configure({ mode: "serial" });

test.describe("Controlled live OpenRouter source extraction", () => {
  // Key presence is enforced in `e2e/live-global-setup.ts` (fail fast, not silent skip).

  let sourceFileId = "";
  let missionId = "";
  let uploadSha256 = "";
  let fingerprintVersionId = "";
  let structuredPayload: {
    jobId?: string;
    analystMeta?: {
      providerMode?: string;
      inputBytesSha256?: string;
      sourceFileId?: string;
    };
    extraction?: { stemText?: string };
  } = {};

  test("HOME → upload → LIVE extraction → review → fingerprint → optional generation", async ({
    page,
    request,
  }) => {
    test.setTimeout(600_000);

    const fixturePath = path.join(__dirname, "fixtures", "live-smoke-tarih-question.png");
    expect(fs.existsSync(fixturePath)).toBeTruthy();
    const bytes = fs.readFileSync(fixturePath);
    uploadSha256 = createHash("sha256").update(bytes).digest("hex");
    expect(bytes.length).toBeGreaterThan(500);

    await page.goto("/");
    await page.getByTestId("new-source-intake").click();
    await expect(page).toHaveURL(/\/sources\/new/);

    await page.getByTestId("upload-file-input").setInputFiles(fixturePath);
    await page.getByRole("button", { name: "Devam et" }).click();
    await page.getByTestId("subject-hint").fill("Tarih — canlı OpenRouter duman testi");
    await page.getByTestId("submit-upload").click();

    await expect(page).toHaveURL(/\/sources\/([^/]+)\/extraction/, { timeout: 60_000 });
    const match = page.url().match(/\/sources\/([^/]+)\/extraction/);
    sourceFileId = match?.[1] ?? "";
    expect(sourceFileId.length).toBeGreaterThan(8);

    await expect(page).toHaveURL(new RegExp(`/sources/${sourceFileId}/review`), { timeout: 180_000 });
    await expect(page.getByTestId("source-expert-review")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId("structured-source-image")).toBeVisible();
    await expect(
      page
        .getByTestId("source-expert-review")
        .getByRole("definition")
        .filter({ hasText: /Canlı AI/ }),
    ).toBeVisible();

    const stem = page.getByTestId("structured-stem-preview");
    await expect(stem).toBeVisible({ timeout: 15_000 });
    await expect(stem).not.toContainText(/kayak/i);
    await expect(stem).not.toContainText(/mock-source-analyst/i);
    await expect(stem).not.toContainText(/DENEDIO-CANARY/i);

    const stemText = (await stem.inputValue()) ?? "";
    expect(stemText.length).toBeGreaterThan(20);

    const extractionRes = await request.get(`/api/sources/${sourceFileId}/structured`);
    expect(extractionRes.ok()).toBeTruthy();
    structuredPayload = (await extractionRes.json()) as typeof structuredPayload;
    missionId = (structuredPayload as { source?: { missionId?: string } }).source?.missionId ?? "";

    const assetRes = await request.get(`/api/sources/${sourceFileId}/asset`);
    expect(assetRes.ok()).toBeTruthy();
    const assetSha = createHash("sha256").update(Buffer.from(await assetRes.body())).digest("hex");
    expect(assetSha).toBe(uploadSha256);

    expect(structuredPayload.analystMeta?.providerMode).toBe("LIVE");
    expect(structuredPayload.analystMeta?.inputBytesSha256).toBe(uploadSha256);
    expect(structuredPayload.analystMeta?.sourceFileId).toBe(sourceFileId);

    const jobRes = await request.get(`/api/sources/${sourceFileId}/extraction`);
    const jobBody = (await jobRes.json()) as {
      job?: { providerId?: string; modelId?: string; status?: string };
    };
    expect(jobBody.job?.status).toBe("SUCCEEDED");
    expect(jobBody.job?.providerId).toBe("openrouter");
    expect(jobBody.job?.modelId).not.toContain("mock");

    const qualityOk =
      stemText.includes(SMOKE_MARKER) ||
      stemText.includes(EXPECTED_STEM_SNIPPET) ||
      (/kurtulu/i.test(stemText) && /savas/i.test(stemText)) ||
      /19(18|19|20|21)/.test(stemText);
    expect(qualityOk).toBeTruthy();

    const previewRes = await request.post(`/api/sources/${sourceFileId}/fingerprint/preview`);
    expect(previewRes.ok()).toBeTruthy();
    const previewJson = (await previewRes.json()) as {
      payload: { measured_skill?: string; calculation_burden?: string };
    };
    expect(previewJson.payload.measured_skill?.toLowerCase()).not.toContain("kayak");
    expect(["none", "light_mental"]).toContain(previewJson.payload.calculation_burden);

    await expect(page.getByTestId("expert-review-pedagogical-profile")).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId("fingerprint-preview-error")).toHaveCount(0);

    const acceptRes = await request.post(`/api/sources/${sourceFileId}/structured`, {
      data: { action: "accept", extraction: structuredPayload.extraction },
    });
    expect(acceptRes.ok()).toBeTruthy();

    const draftRes = await request.post(`/api/sources/${sourceFileId}/fingerprint/draft`);
    expect(draftRes.ok()).toBeTruthy();
    const draftJson = (await draftRes.json()) as { version: { id: string; payload?: Record<string, unknown> } };
    fingerprintVersionId = draftJson.version.id;
    expect(fingerprintVersionId.length).toBeGreaterThan(8);

    const lockRes = await request.post(`/api/fingerprint/${fingerprintVersionId}/lock`);
    expect(lockRes.ok()).toBeTruthy();

    const fpGet = await request.get(`/api/fingerprint/${fingerprintVersionId}`);
    expect(fpGet.ok()).toBeTruthy();

    if (missionId) {
      const setupPost = await request.post(`/api/missions/${missionId}/generation/setup`, {
        data: {
          action: "persist",
          fingerprintVersionId,
          siblingCount: 1,
        },
      });
      expect(setupPost.ok()).toBeTruthy();
      const setupBody = (await setupPost.json()) as { runId?: string };
      expect(setupBody.runId).toBeTruthy();

      const spawnRes = await request.post(
        `/api/missions/${missionId}/generation/runs/${setupBody.runId}/spawn`,
        { timeout: 480_000 },
      );
      expect(spawnRes.ok()).toBeTruthy();
      const spawnBody = (await spawnRes.json()) as { candidateIds?: string[] };
      expect(spawnBody.candidateIds?.length).toBe(1);
    }

    process.env.__LIVE_SMOKE_EVIDENCE__ = JSON.stringify({
      sourceFileId,
      missionId,
      extractionJobId: structuredPayload.jobId ?? null,
      fingerprintVersionId,
      uploadSha256,
      providerMode: structuredPayload.analystMeta?.providerMode,
      providerId: jobBody.job?.providerId,
      modelId: jobBody.job?.modelId,
      stemPreview: stemText.slice(0, 200),
    });
  });
});
