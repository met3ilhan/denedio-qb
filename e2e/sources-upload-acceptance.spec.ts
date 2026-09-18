import fs from "node:fs";
import path from "node:path";

import { expect, test, type Locator, type Page } from "@playwright/test";

const FIXTURES = path.join(__dirname, "fixtures");
const PNG_FIXTURE = path.join(FIXTURES, "test-upload.png");
const JPG_FIXTURE = path.join(FIXTURES, "test-upload.jpg");

const MAX_SOURCE_FILE_BYTES = 25 * 1024 * 1024;

async function openUploadWizard(page: Page) {
  await page.goto("/sources/new");
  await expect(page.getByTestId("source-upload-wizard")).toBeVisible();
}

async function dropFileOnDropzone(
  dropzone: Locator,
  file: { name: string; mimeType: string; buffer: Buffer },
) {
  const bytes = Array.from(file.buffer);
  await dropzone.evaluate(
    (el, payload) => {
      const dt = new DataTransfer();
      const blob = new File([new Uint8Array(payload.bytes)], payload.name, {
        type: payload.mimeType,
      });
      dt.items.add(blob);
      el.dispatchEvent(new DragEvent("drop", { bubbles: true, dataTransfer: dt }));
    },
    { name: file.name, mimeType: file.mimeType, bytes },
  );
}

async function continueToMetadata(page: Page) {
  await page.getByRole("button", { name: "Devam et" }).click();
  await expect(page.getByTestId("subject-hint")).toBeVisible();
}

test.describe("Source upload acceptance", () => {
  test("accepts PNG via file input and shows image preview", async ({ page }) => {
    await openUploadWizard(page);
    await page.getByTestId("upload-file-input").setInputFiles(PNG_FIXTURE);
    await expect(page.getByTestId("selected-filename")).toContainText("test-upload.png");
    await expect(page.getByTestId("upload-image-preview")).toBeVisible();
    await expect(page.getByTestId("upload-error")).toHaveCount(0);
  });

  test("accepts JPG via file input and shows image preview", async ({ page }) => {
    await openUploadWizard(page);
    await page.getByTestId("upload-file-input").setInputFiles(JPG_FIXTURE);
    await expect(page.getByTestId("selected-filename")).toContainText("test-upload.jpg");
    await expect(page.getByTestId("upload-image-preview")).toBeVisible();
  });

  test("accepts PNG via DataTransfer drop on upload-dropzone", async ({ page }) => {
    await openUploadWizard(page);
    const buffer = fs.readFileSync(PNG_FIXTURE);
    const dropzone = page.getByTestId("upload-dropzone");
    await dropFileOnDropzone(dropzone, {
      name: "dropped-upload.png",
      mimeType: "image/png",
      buffer,
    });
    await expect(page.getByTestId("selected-filename")).toContainText("dropped-upload.png");
    await expect(page.getByTestId("upload-image-preview")).toBeVisible();
  });

  test("rejects unsupported file type with Turkish error", async ({ page }) => {
    await openUploadWizard(page);
    await page.getByTestId("upload-file-input").setInputFiles({
      name: "malware.exe",
      mimeType: "application/octet-stream",
      buffer: Buffer.from("not-a-source"),
    });
    await expect(page.getByTestId("upload-error")).toHaveText("Dosya türü desteklenmiyor.");
    await expect(page.getByRole("button", { name: "Devam et" })).toBeDisabled();
  });

  test("rejects oversized file on client before upload", async ({ page }) => {
    await openUploadWizard(page);
    const oversized = Buffer.alloc(MAX_SOURCE_FILE_BYTES + 1, 0);
    await page.getByTestId("upload-file-input").setInputFiles({
      name: "too-large.png",
      mimeType: "image/png",
      buffer: oversized,
    });
    await expect(page.getByTestId("upload-error")).toHaveText(
      "Dosya boyutu çok büyük (en fazla 25 MB).",
    );
    await expect(page.getByRole("button", { name: "Devam et" })).toBeDisabled();
  });

  test("shows mapped error when upload API fails", async ({ page }) => {
    await openUploadWizard(page);
    await page.getByTestId("upload-file-input").setInputFiles(PNG_FIXTURE);
    await continueToMetadata(page);

    await page.route("**/api/sources/upload", async (route) => {
      if (route.request().method() !== "POST") {
        await route.continue();
        return;
      }
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ code: "STORAGE_UNAVAILABLE", error: "mock storage failure" }),
      });
    });

    await page.getByTestId("subject-hint").fill("Görsel yükleme hata yolu");
    await page.getByTestId("submit-upload").click();
    await expect(page.getByTestId("upload-error")).toHaveText(
      "Yerel dosya depolaması kullanılamıyor.",
    );
    await expect(page).toHaveURL(/\/sources\/new$/);
  });

  test("continues wizard after image upload into extraction flow", async ({ page }) => {
    test.setTimeout(60_000);
    await openUploadWizard(page);
    await page.getByTestId("upload-file-input").setInputFiles(PNG_FIXTURE);
    await expect(page.getByTestId("upload-image-preview")).toBeVisible();
    await continueToMetadata(page);

    await page.getByTestId("subject-hint").fill("E2E görsel kaynak");
    await page.getByTestId("submit-upload").click();

    await expect(page).toHaveURL(/\/sources\/[^/]+\/extraction/, { timeout: 30_000 });
    await expect(page.getByTestId("extraction-timeline")).toBeVisible();
  });
});
