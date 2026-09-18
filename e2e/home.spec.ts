import { expect, test } from "@playwright/test";

test("home page loads", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Question Studio/);
  await expect(page.getByRole("heading", { name: "Pedagogy Signal Lab" })).toBeVisible();
  await expect(page.getByText("Instrumentation for judgment")).toBeVisible();
});
