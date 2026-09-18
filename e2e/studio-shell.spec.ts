import { expect, test } from "@playwright/test";

test.describe("Studio shell", () => {
  test("demo mode banner visible when QUESTION_STUDIO_DEMO_MODE=1", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("demo-mode-banner")).toBeVisible();
    await expect(page.getByTestId("demo-mode-banner")).toContainText(/ÖRNEK|DEMO/i);
  });

  test("rail shows workflow phases on mission board", async ({ page }) => {
    await page.goto("/");
    const rail = page.getByRole("navigation", { name: "Workflow phases" });
    await expect(rail.getByText("Intake")).toBeVisible();
    await expect(rail.getByText("Mechanism")).toBeVisible();
    await expect(rail.getByText("Candidates")).toBeVisible();
    await expect(rail.getByText("Ship")).toBeVisible();
    const blockersEmpty = page.getByTestId("blockers-empty");
    const blockersPanel = page.getByTestId("blockers-panel");
    await expect(blockersEmpty.or(blockersPanel)).toBeVisible();
  });

  test("no horizontal overflow at 390px viewport", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    const overflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(overflow).toBe(false);
  });

  test("focus order: skip to main content landmarks", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");
    const first = await page.evaluate(() => document.activeElement?.textContent?.trim());
    expect(first).toMatch(/Pedagogy Signal Lab|New source intake/i);

    await page.keyboard.press("Tab");
    const second = await page.evaluate(() => document.activeElement?.textContent?.trim());
    expect(second).toBeTruthy();
  });

  test("command palette opens with Ctrl+K", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Control+K");
    await expect(page.getByTestId("command-palette")).toBeVisible();
    await expect(page.getByRole("dialog", { name: "Command palette" })).toBeVisible();
  });

  test("/studio redirects to mission board", async ({ page }) => {
    await page.goto("/studio");
    await expect(page).toHaveURL("/");
    await expect(page.getByRole("heading", { name: "Mission stream" })).toBeVisible();
  });
});
