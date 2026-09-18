import path from "node:path";

import { expect, test } from "@playwright/test";

async function uploadHistoryCanary(page: import("@playwright/test").Page) {
  await page.goto("/sources/new");
  const fixture = path.join(__dirname, "fixtures", "DENEDIO-CANARY-7391-history.txt");
  await page.getByTestId("upload-file-input").setInputFiles(fixture);
  await page.getByRole("button", { name: "Devam et" }).click();
  await page.getByTestId("subject-hint").fill("Tarih canary fingerprint");
  await page.getByTestId("submit-upload").click();
  await expect(page).toHaveURL(/\/sources\/[^/]+\/structured/, { timeout: 45_000 });
}

test.describe("Fingerprint lineage — history stem", () => {
  test("fingerprint draft excludes piecewise kayak pedagogy", async ({ page }) => {
    test.setTimeout(120_000);
    await uploadHistoryCanary(page);
    await expect(page.getByTestId("structured-stem-preview")).toContainText("DENEDIO-CANARY-7391");
    await page.getByRole("button", { name: /Analizi onayla/i }).click();
    await expect(page).toHaveURL(/\/fingerprint\/draft/, { timeout: 30_000 });
    await expect(page.getByTestId("open-fingerprint-studio")).toBeVisible({ timeout: 30_000 });

    const pageText = (await page.locator("body").innerText()).toLowerCase();
    expect(pageText).not.toContain("piecewise rate structure");
    expect(pageText).not.toContain("decompose_intervals_then_aggregate");
    expect(pageText).not.toContain("first hour from each additional");
    expect(pageText).not.toContain("kayak");
  });
});
