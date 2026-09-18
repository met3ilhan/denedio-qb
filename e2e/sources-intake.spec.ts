import path from "node:path";

import { expect, test } from "@playwright/test";

test.describe.configure({ mode: "serial" });

test.describe("Sources intake (Gate 2)", () => {
  test("upload demo source and reach structured review", async ({ page }) => {
    await page.goto("/sources/new");
    await expect(page.getByTestId("source-upload-wizard")).toBeVisible();

    const fixture = path.join(__dirname, "fixtures", "demo-source.txt");
    await page.getByTestId("upload-file-input").setInputFiles(fixture);
    await expect(page.getByTestId("selected-filename")).toContainText("demo-source.txt");

    await page.getByRole("button", { name: "Devam et" }).click();
    await page.getByTestId("subject-hint").fill("Synthetic math demo");
    await page.getByTestId("submit-upload").click();

    await expect(page).toHaveURL(/\/sources\/[^/]+\/extraction/);
    await expect(page.getByTestId("extraction-timeline")).toBeVisible();

    await expect(page.getByTestId("goto-structured-review")).toBeVisible({ timeout: 30_000 });
    await page.getByTestId("goto-structured-review").click();

    await expect(page).toHaveURL(/\/structured/);
    await expect(page.getByTestId("review-layer-visible_fact")).toBeVisible();
    await expect(page.getByTestId("review-layer-inference")).toBeVisible();
    await expect(page.getByTestId("accept-extraction")).toBeVisible();
  });

  test("sources library lists uploaded source", async ({ page }) => {
    await page.goto("/sources");
    await expect(page.getByTestId("sources-library")).toBeVisible();
    const rows = page.locator("[data-testid^=source-row-]");
    await expect(rows.first()).toBeVisible({ timeout: 15_000 });
  });
});
