import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { expect, test } from "@playwright/test";

const SMOKE_MARKER = "LIVE-SMOKE-8842";
const EXPECTED_STEM_SNIPPET = "Kurtuluş Savaşı";

test.describe.configure({ mode: "serial" });

test.describe("Controlled live Gemini source extraction", () => {
  test.skip(
    !process.env.QUESTION_STUDIO_GEMINI_API_KEY?.trim(),
    "QUESTION_STUDIO_GEMINI_API_KEY required",
  );

  let sourceFileId = "";
  let uploadSha256 = "";
  let structuredPayload: {
    jobId?: string;
    analystMeta?: {
      providerMode?: string;
      inputBytesSha256?: string;
      sourceFileId?: string;
    };
  } = {};

  test("HOME → upload → LIVE extraction → structured review", async ({ page, request }) => {
    test.setTimeout(180_000);

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
    await page.getByTestId("subject-hint").fill("Tarih — canlı Gemini duman testi");
    await page.getByTestId("submit-upload").click();

    await expect(page).toHaveURL(/\/sources\/([^/]+)\/extraction/, { timeout: 60_000 });
    const match = page.url().match(/\/sources\/([^/]+)\/extraction/);
    sourceFileId = match?.[1] ?? "";
    expect(sourceFileId.length).toBeGreaterThan(8);

    await expect(page.getByTestId("goto-structured-review")).toBeVisible({ timeout: 120_000 });
    await page.getByTestId("goto-structured-review").click();
    await expect(page).toHaveURL(/\/review/, { timeout: 30_000 });

    await expect(page.getByTestId("structured-source-image")).toBeVisible();
    await expect(page.getByText(/Canlı AI/i)).toBeVisible();

    const stem = page.getByTestId("structured-stem-preview");
    await expect(stem).toBeVisible({ timeout: 15_000 });
    await expect(stem).not.toContainText(/kayak/i);
    await expect(stem).not.toContainText(/mock-source-analyst/i);
    await expect(stem).not.toContainText(/DENEDIO-CANARY/i);

    const stemText = (await stem.textContent()) ?? "";
    expect(stemText.length).toBeGreaterThan(20);

    const extractionRes = await request.get(`/api/sources/${sourceFileId}/structured`);
    expect(extractionRes.ok()).toBeTruthy();
    structuredPayload = (await extractionRes.json()) as typeof structuredPayload;

    const assetRes = await request.get(`/api/sources/${sourceFileId}/asset`);
    expect(assetRes.ok()).toBeTruthy();
    const assetBytes = Buffer.from(await assetRes.body());
    const assetSha = createHash("sha256").update(assetBytes).digest("hex");
    expect(assetSha).toBe(uploadSha256);

    expect(structuredPayload.analystMeta?.providerMode).toBe("LIVE");
    expect(structuredPayload.analystMeta?.inputBytesSha256).toBe(uploadSha256);
    expect(structuredPayload.analystMeta?.sourceFileId).toBe(sourceFileId);

    const jobRes = await request.get(`/api/sources/${sourceFileId}/extraction`);
    const jobBody = (await jobRes.json()) as {
      job?: { providerId?: string; modelId?: string; status?: string };
    };
    expect(jobBody.job?.status).toBe("SUCCEEDED");
    expect(jobBody.job?.providerId).toBe("gemini");
    expect(jobBody.job?.modelId).not.toContain("mock");

    const qualityOk =
      stemText.includes(SMOKE_MARKER) ||
      stemText.includes(EXPECTED_STEM_SNIPPET) ||
      /19(18|19|20|21)/.test(stemText);
    expect(qualityOk).toBeTruthy();

    process.env.__LIVE_SMOKE_EVIDENCE__ = JSON.stringify({
      sourceFileId,
      extractionJobId: structuredPayload.jobId ?? null,
      uploadSha256,
      providerMode: structuredPayload.analystMeta?.providerMode,
      providerId: jobBody.job?.providerId,
      modelId: jobBody.job?.modelId,
      stemPreview: stemText.slice(0, 200),
    });
  });
});
