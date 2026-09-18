import { expect, test } from "@playwright/test";

test("home page loads", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Soru Stüdyosu/);
  await expect(page.getByRole("link", { name: "Pedagoji Sinyal Laboratuvarı" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Görev akışı" })).toBeVisible();
});
