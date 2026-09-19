import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { expect, test } from "@playwright/test";

const fixturePath = path.join(__dirname, "fixtures", "ottoman-adaletname-question.png");

test.describe("Real Ottoman LIVE analysis acceptance", () => {
  test("extracts, classifies, caches, persists, and does not rebill reloads", async ({
    page,
    request,
  }) => {
    test.setTimeout(300_000);
    expect(fs.existsSync(fixturePath)).toBeTruthy();
    const fixtureSha = createHash("sha256").update(fs.readFileSync(fixturePath)).digest("hex");

    await page.goto("/");
    await page.getByTestId("new-source-intake").click();
    await page.getByTestId("upload-file-input").setInputFiles(fixturePath);
    await page.getByRole("button", { name: "Devam et" }).click();
    await page.getByTestId("subject-hint").fill("Osmanlı tarihi");
    await page.getByTestId("submit-upload").click();

    await expect(page).toHaveURL(/\/sources\/[^/]+\/review/, { timeout: 180_000 });
    const sourceFileId = page.url().match(/\/sources\/([^/]+)\/review/)?.[1];
    expect(sourceFileId).toBeTruthy();

    let structuredResponse = await request.get(`/api/sources/${sourceFileId}/structured`);
    expect(structuredResponse.ok()).toBeTruthy();
    let structured = (await structuredResponse.json()) as {
      extraction: {
        stemText: string;
        choices: Array<{ label: string; text: string; isCorrect?: boolean }>;
      };
      analystMeta?: {
        providerMode?: string;
        inputBytesSha256?: string;
        pedagogicalAnalysis?: {
          classification?: {
            subject?: string;
            topic?: string;
            subtopic?: string;
            difficulty?: string;
            expected_solve_time_seconds?: { min: number; max: number };
          };
          fingerprint?: Record<string, unknown>;
          qualityWarnings?: string[];
        };
        aiUsageSummary?: Record<string, unknown>;
      };
      classification?: {
        subject?: string;
        topic?: string;
        subtopic?: string;
        difficulty?: string;
        expected_solve_time_seconds?: { min: number; max: number };
      } | null;
      correctAnswerProvenance?: string;
      jobId?: string;
      jobStatus?: string;
    };
    for (let attempt = 0; attempt < 90; attempt += 1) {
      if (structured.analystMeta?.pedagogicalAnalysis) break;
      await new Promise((resolve) => setTimeout(resolve, 1000));
      structuredResponse = await request.get(`/api/sources/${sourceFileId}/structured`);
      structured = (await structuredResponse.json()) as typeof structured;
    }
    expect(structured.analystMeta?.pedagogicalAnalysis).toBeTruthy();

    const extractionJobResponse = await request.get(`/api/sources/${sourceFileId}/extraction`);
    expect(extractionJobResponse.ok()).toBeTruthy();
    const extractionJob = (await extractionJobResponse.json()) as {
      job?: {
        status?: string;
        providerId?: string;
        modelId?: string;
        analystMeta?: Record<string, unknown>;
      };
    };

    expect(structured.analystMeta?.providerMode).toBe("LIVE");
    expect(structured.analystMeta?.inputBytesSha256).toBe(fixtureSha);
    expect(structured.jobStatus).toBe("SUCCEEDED");
    expect(extractionJob.job?.status).toBe("SUCCEEDED");
    expect(extractionJob.job?.providerId).toBe("openrouter");
    expect(extractionJob.job?.modelId).toBe("openai/gpt-5.6-luna");

    const choices = structured.extraction.choices;
    expect(choices).toHaveLength(5);
    expect(choices.map((choice) => `${choice.label}) ${choice.text}`)).toEqual([
      expect.stringMatching(/^A\).*Ahidn/),
      expect.stringMatching(/^B\).*Amann/),
      expect.stringMatching(/^C\).*Adaletn/),
      expect.stringMatching(/^D\).*Berat/),
      expect.stringMatching(/^E\).*Ferman/),
    ]);
    expect(choices.find((choice) => choice.isCorrect)?.label).toBe("C");
    expect(structured.correctAnswerProvenance).toBe("ai_inferred");

    const classification = structured.classification;
    expect(classification?.subject).toMatch(/tarih/i);
    expect(classification?.topic?.length ?? 0).toBeGreaterThan(3);
    expect(classification?.difficulty).toMatch(/^(EASY|MEDIUM|HARD)$/);
    expect(classification?.expected_solve_time_seconds?.min).toBeGreaterThan(0);

    const fingerprint = structured.analystMeta?.pedagogicalAnalysis?.fingerprint ?? {};
    expect(String(fingerprint.measured_skill)).not.toMatch(
      /Skill derived|Source-aligned|stem_guided|aligned to source/i,
    );
    expect(String(fingerprint.measured_skill)).toMatch(/osmanlı|belge|kavram|işlev|tarih/i);
    expect(String(fingerprint.learning_objective)).not.toMatch(
      /Learning objective aligned|aligned to source/i,
    );
    expect(String(fingerprint.hidden_constraint)).toMatch(/NOT_APPLICABLE/);
    const archetype = fingerprint.question_archetype as { label?: unknown } | undefined;
    expect(String(archetype?.label ?? fingerprint.question_archetype)).not.toMatch(
      /Source-aligned item/i,
    );
    expect(String(fingerprint.measured_skill)).not.toMatch(
      /skill derived from source stem/i,
    );

    const usageBeforeReload = JSON.stringify(structured.analystMeta?.aiUsageSummary ?? null);
    const reloadPaidRequests: string[] = [];
    const onRequest = (requestEvent: import("@playwright/test").Request) => {
      if (requestEvent.url().includes("openrouter.ai")) {
        reloadPaidRequests.push(requestEvent.url());
      }
    };
    page.on("request", onRequest);
    for (let i = 0; i < 3; i += 1) {
      await page.reload({ waitUntil: "networkidle" });
      await expect(page.getByTestId("source-expert-review")).toBeVisible();
    }
    page.off("request", onRequest);
    expect(reloadPaidRequests).toHaveLength(0);

    const afterReloadResponse = await request.get(`/api/sources/${sourceFileId}/structured`);
    const afterReload = (await afterReloadResponse.json()) as typeof structured;
    expect(JSON.stringify(afterReload.analystMeta?.aiUsageSummary ?? null)).toBe(usageBeforeReload);

    const subjectField = page.getByRole("textbox", { name: "Ders" });
    const topicField = page.getByRole("textbox", { name: "Konu", exact: true });
    const subtopicField = page.getByRole("textbox", { name: "Alt konu" });
    await subjectField.fill("Tarih — uzman düzenlemesi");
    await topicField.fill("Osmanlı yönetim ve hukuk belgeleri — uzman düzenlemesi");
    await subtopicField.fill("Adaletnâme — uzman düzenlemesi");
    await page.reload({ waitUntil: "networkidle" });
    await expect(
      page.getByRole("textbox", { name: "Ders" }),
    ).toHaveValue("Tarih — uzman düzenlemesi");
    await expect(
      page.getByRole("textbox", { name: "Konu", exact: true }),
    ).toHaveValue("Osmanlı yönetim ve hukuk belgeleri — uzman düzenlemesi");
    await expect(
      page.getByRole("textbox", { name: "Alt konu" }),
    ).toHaveValue("Adaletnâme — uzman düzenlemesi");

    console.log(
      JSON.stringify(
        {
          sourceFileId,
          extractionJobId: structured.jobId,
          provider: extractionJob.job?.providerId,
          model: extractionJob.job?.modelId,
          choices: choices.map((choice) => `${choice.label}) ${choice.text}`),
          correctAnswer: "C) Adaletnâme",
          provenance: structured.correctAnswerProvenance,
          classification,
          fingerprint,
          usage: structured.analystMeta?.aiUsageSummary,
          reloadPaidRequests: reloadPaidRequests.length,
        },
        null,
        2,
      ),
    );
  });
});
