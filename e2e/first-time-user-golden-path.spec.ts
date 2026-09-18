import path from "node:path";

import { expect, test } from "@playwright/test";

const PNG_FIXTURE = path.join(__dirname, "fixtures", "test-upload.png");

test.describe.configure({ mode: "serial" });

test.describe("First-time user golden path", () => {
  test("discovers primary CTA from home and reaches fingerprint draft", async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto("/");
    await expect(page).toHaveTitle(/Soru Stüdyosu/);

    const primary = page.getByTestId("new-source-intake");
    await expect(primary).toBeVisible();
    await expect(primary).toContainText("Yeni Soru Oluştur");
    await primary.click();

    await expect(page).toHaveURL(/\/sources\/new/);
    await expect(page.getByTestId("source-upload-wizard")).toBeVisible();

    await page.getByTestId("upload-file-input").setInputFiles(PNG_FIXTURE);
    await expect(page.getByTestId("upload-image-preview")).toBeVisible();
    await page.getByRole("button", { name: "Devam et" }).click();
    await page.getByTestId("subject-hint").fill("UAT altın yol");
    await page.getByTestId("submit-upload").click();

    await expect(page).toHaveURL(/\/sources\/[^/]+\/structured/, { timeout: 90_000 });
    await page.getByTestId("accept-extraction").click();
    await expect(page).toHaveURL(/\/fingerprint\/draft/, { timeout: 30_000 });
    await expect(page.getByTestId("open-fingerprint-studio")).toBeVisible({ timeout: 45_000 });
  });

  test("mobile home primary CTA is visible at 390px", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    const primary = page.getByTestId("new-source-intake");
    await expect(primary).toBeVisible();
    await primary.scrollIntoViewIfNeeded();
    const box = await primary.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      expect(box.y + box.height).toBeLessThanOrEqual(844);
      expect(box.width).toBeGreaterThan(100);
    }
  });
});

test.describe("Home discoverability with existing missions", () => {
  test("primary CTA remains visible when mission list is populated", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("mission-stream")).toBeVisible();
    const rows = page.getByTestId("mission-row");
    if ((await rows.count()) > 0) {
      await expect(page.getByTestId("new-source-intake")).toBeVisible();
    }
  });
});
