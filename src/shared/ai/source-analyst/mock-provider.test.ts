import { describe, expect, it } from "vitest";

import { buildMockExtractionFromInput } from "./mock-provider";

describe("MockSourceAnalystProvider lineage", () => {
  it("DENEDIO-CANARY-7391: never returns kayak for user history upload", () => {
    const bytes = Buffer.from(
      "DENEDIO-CANARY-7391\nOsmanlı tarihi sorusu — II. Mahmud dönemi reformları.",
      "utf8",
    );
    const { envelope, demoFixtureId } = buildMockExtractionFromInput({
      sourceFileId: "sf-7391",
      storageKey: "m/sf-7391.png",
      mimeType: "image/png",
      originalFilename: "tarih-soru-7391.png",
      bytes,
    });

    expect(envelope.extraction.stemText).toContain("DENEDIO-CANARY-7391");
    expect(envelope.extraction.stemText.toLowerCase()).not.toContain("kayak");
    expect(demoFixtureId).toBeUndefined();
  });

  it("DENEDIO-CANARY-2846: distinct from 7391", () => {
    const bytesB = Buffer.from("DENEDIO-CANARY-2846\nCumhuriyet dönemi inkılapları.", "utf8");
    const { envelope } = buildMockExtractionFromInput({
      sourceFileId: "sf-2846",
      storageKey: "m/sf-2846.png",
      mimeType: "image/png",
      originalFilename: "tarih-2846.png",
      bytes: bytesB,
    });
    expect(envelope.extraction.stemText).toContain("DENEDIO-CANARY-2846");
    expect(envelope.extraction.stemText).not.toContain("DENEDIO-CANARY-7391");
  });

  it("explicit demo filename returns kayak fixture with demoFixtureId", () => {
    const { envelope, demoFixtureId } = buildMockExtractionFromInput({
      sourceFileId: "sf-demo",
      storageKey: "m/demo.txt",
      mimeType: "text/plain",
      originalFilename: "demo-source.txt",
      bytes: Buffer.from("anything", "utf8"),
    });
    expect(envelope.extraction.stemText.toLowerCase()).toContain("kayak");
    expect(demoFixtureId).toBe("synthetic-river-problem");
  });

  it("non-demo upload without canary uses honest mock placeholder, not kayak", () => {
    const { envelope } = buildMockExtractionFromInput({
      sourceFileId: "sf-real",
      storageKey: "m/history.jpg",
      mimeType: "image/jpeg",
      originalFilename: "history-exam-page.jpg",
      bytes: Buffer.from([0xff, 0xd8, 0xff, 0x00]),
    });
    expect(envelope.extraction.stemText.toLowerCase()).not.toContain("kayak");
    expect(envelope.extraction.extractionWarnings?.[0]).toMatch(/canlı yapay zekâ/i);
  });
});
