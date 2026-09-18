import path from "node:path";

import { expect, test } from "@playwright/test";

test.describe.configure({ mode: "serial" });

async function uploadCanary(
  page: import("@playwright/test").Page,
  fixtureName: string,
  subjectHint: string,
) {
  await page.goto("/sources/new");
  const fixture = path.join(__dirname, "fixtures", fixtureName);
  await page.getByTestId("upload-file-input").setInputFiles(fixture);
  await page.getByRole("button", { name: "Devam et" }).click();
  await page.getByTestId("subject-hint").fill(subjectHint);
  await page.getByTestId("submit-upload").click();
  await expect(page).toHaveURL(/\/sources\/[^/]+\/structured/, { timeout: 90_000 });
}

test.describe("P0 source lineage canaries", () => {
  let sourceAUrl: string;
  let sourceBUrl: string;

  test("upload canary A — extraction matches marker, not kayak", async ({ page }) => {
    await uploadCanary(page, "DENEDIO-CANARY-7391-history.txt", "Tarih canary A");
    sourceAUrl = page.url();
    await expect(page.getByTestId("structured-stem-preview")).toContainText("DENEDIO-CANARY-7391");
    await expect(page.getByTestId("structured-stem-preview")).not.toContainText(/kayak/i);
    await expect(page.getByTestId("structured-stem-preview")).not.toContainText(/12 coins/i);
  });

  test("upload canary B — distinct marker", async ({ page }) => {
    await page.goto("/");
    await uploadCanary(page, "DENEDIO-CANARY-2846-history.txt", "Tarih canary B");
    sourceBUrl = page.url();
    await expect(page.getByTestId("structured-stem-preview")).toContainText("DENEDIO-CANARY-2846");
    await expect(page.getByTestId("structured-stem-preview")).not.toContainText("DENEDIO-CANARY-7391");
  });

  test("reopen source A after B — no cross-contamination", async ({ page }) => {
    await page.goto(sourceAUrl);
    await expect(page.getByTestId("structured-stem-preview")).toContainText("DENEDIO-CANARY-7391");
    await expect(page.getByTestId("structured-stem-preview")).not.toContainText("DENEDIO-CANARY-2846");
    await page.goto(sourceBUrl);
    await expect(page.getByTestId("structured-stem-preview")).toContainText("DENEDIO-CANARY-2846");
  });

  test("reload persistence on source A", async ({ page }) => {
    await page.goto(sourceAUrl);
    await page.reload();
    await expect(page.getByTestId("structured-stem-preview")).toContainText("DENEDIO-CANARY-7391");
    await expect(page.getByTestId("structured-stem-preview")).not.toContainText(/kayak/i);
  });

  test("PNG canary embeds marker in bytes", async ({ page }) => {
    const pngPath = path.join(__dirname, "fixtures", "canary-7391.png");
    await page.goto("/sources/new");
    await page.getByTestId("upload-file-input").setInputFiles(pngPath);
    await page.getByRole("button", { name: "Devam et" }).click();
    await page.getByTestId("subject-hint").fill("PNG canary");
    await page.getByTestId("submit-upload").click();
    await expect(page).toHaveURL(/\/sources\/[^/]+\/structured/, { timeout: 90_000 });
    await expect(page.getByTestId("structured-stem-preview")).toContainText("DENEDIO-CANARY-7391", {
      timeout: 15_000,
    });
    await expect(page.getByTestId("structured-source-image")).toBeVisible();
  });
});
