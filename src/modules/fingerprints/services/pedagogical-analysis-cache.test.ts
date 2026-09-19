import { describe, expect, it } from "vitest";

import type { SourceExtraction } from "@/shared/validation/source-extraction";

import { extractionChecksum, readCachedPedagogicalAnalysis } from "./pedagogical-analysis";

const sampleExtraction: SourceExtraction = {
  schemaVersion: "2026-09-18-gate1",
  sourceQuestionKey: "k",
  stemText: "Soru",
  choices: [
    { label: "A", text: "a" },
    { label: "B", text: "b" },
  ],
  blocks: [{ blockId: "stem", type: "stem", text: "Soru", confidence: 1, page: 1 }],
};

describe("readCachedPedagogicalAnalysis", () => {
  it("returns cache when checksum matches", () => {
    const checksum = extractionChecksum(sampleExtraction);
    const cached = readCachedPedagogicalAnalysis(
      {
        pedagogicalAnalysis: {
          extractionChecksum: checksum,
          fingerprint: { measured_skill: "x" },
          gapWarnings: [],
          qualityWarnings: [],
          providerId: "openrouter",
          modelId: "m",
          inferredAt: new Date().toISOString(),
        },
      },
      sampleExtraction,
    );
    expect(cached?.fingerprint).toEqual({ measured_skill: "x" });
  });

  it("misses when extraction changed", () => {
    const cached = readCachedPedagogicalAnalysis(
      {
        pedagogicalAnalysis: {
          extractionChecksum: "deadbeef",
          fingerprint: {},
          gapWarnings: [],
          qualityWarnings: [],
          providerId: "openrouter",
          modelId: "m",
          inferredAt: new Date().toISOString(),
        },
      },
      sampleExtraction,
    );
    expect(cached).toBeNull();
  });
});
