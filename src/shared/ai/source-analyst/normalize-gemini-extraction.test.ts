import { describe, expect, it } from "vitest";

import { SCHEMA_VERSION } from "@/shared/validation/primitives";
import { sourceExtractionSchema } from "@/shared/validation/source-extraction";

import {
  normalizeGeminiExtractionBlocks,
  SINGLE_SOURCE_DEFAULT_PAGE,
} from "./normalize-gemini-extraction";

function baseBlock(overrides: Record<string, unknown>) {
  return {
    blockId: "b1",
    type: "stem",
    text: "Soru kökü",
    confidence: 0.9,
    ...overrides,
  };
}

function minimalExtraction(blocks: ReturnType<typeof normalizeGeminiExtractionBlocks>) {
  return {
    schemaVersion: SCHEMA_VERSION,
    sourceQuestionKey: "test-key",
    stemText: "Soru kökü",
    choices: [
      { label: "A" as const, text: "A seçeneği" },
      { label: "B" as const, text: "B seçeneği" },
    ],
    blocks,
  };
}

describe("normalizeGeminiExtractionBlocks", () => {
  it("maps single block page null → 1", () => {
    const blocks = normalizeGeminiExtractionBlocks([baseBlock({ page: null })]);
    expect(blocks[0].page).toBe(1);
    expect(() => sourceExtractionSchema.parse(minimalExtraction(blocks))).not.toThrow();
  });

  it("preserves explicit page 1", () => {
    const blocks = normalizeGeminiExtractionBlocks([baseBlock({ page: 1 })]);
    expect(blocks[0].page).toBe(1);
  });

  it("maps multiple blocks with page null → default page", () => {
    const blocks = normalizeGeminiExtractionBlocks([
      baseBlock({ blockId: "stem", type: "stem", page: null }),
      baseBlock({ blockId: "c-a", type: "choice", choiceLabel: "A", page: null }),
      baseBlock({ blockId: "c-b", type: "choice", choiceLabel: "B", page: null }),
    ]);
    expect(blocks.every((b) => b.page === SINGLE_SOURCE_DEFAULT_PAGE)).toBe(true);
    expect(() => sourceExtractionSchema.parse(minimalExtraction(blocks))).not.toThrow();
  });

  it("preserves valid explicit page number", () => {
    const blocks = normalizeGeminiExtractionBlocks([baseBlock({ page: 2 })]);
    expect(blocks[0].page).toBe(2);
  });

  it("rejects invalid page type string", () => {
    expect(() => normalizeGeminiExtractionBlocks([baseBlock({ page: "abc" })])).toThrow(
      /positive integer/i,
    );
  });

  it("normalizes block type aliases (question → stem)", () => {
    const blocks = normalizeGeminiExtractionBlocks([baseBlock({ type: "Question", page: null })]);
    expect(blocks[0].type).toBe("stem");
    expect(blocks[0].page).toBe(1);
  });

  it("canonical schema still rejects raw page null without normalization", () => {
    const raw = minimalExtraction([
      baseBlock({ page: null }) as never,
    ]);
    expect(() => sourceExtractionSchema.parse(raw)).toThrow();
  });
});
