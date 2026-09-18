import { describe, expect, it } from "vitest";

import { inferFingerprintDraftFromExtraction, isStaleLegacyFingerprintDraft } from "./draft-inference";
import { pedagogicalFingerprintSchema } from "@/shared/validation/pedagogical-fingerprint";
import { SCHEMA_VERSION } from "@/shared/validation/primitives";
import type { SourceExtraction } from "@/shared/validation/source-extraction";
import { SYNTHETIC_RIVER_FIXTURE } from "@/shared/ai/fixtures/synthetic-river-problem";

const HISTORY_EXTRACTION: SourceExtraction = {
  schemaVersion: SCHEMA_VERSION,
  sourceQuestionKey: "hist-1",
  language: "tr",
  stemText:
    "Osmanlı Devleti'nde Tanzimat Dönemi'nde yapılan 1839 Tanzimat Fermanı ile ilgili aşağıdakilerden hangisi doğrudur?",
  choices: [
    { label: "A", text: "Padişahın mutlak yetkisi artırılmıştır" },
    { label: "B", text: "Can, mal ve namus güvencesi vurgulanmıştır", isCorrect: true },
    { label: "C", text: "Saltanat tamamen kaldırılmıştır" },
    { label: "D", text: "Cumhuriyet ilan edilmiştir" },
  ],
  blocks: [
    {
      blockId: "stem-h",
      type: "stem",
      text:
        "Osmanlı Devleti'nde Tanzimat Dönemi'nde yapılan 1839 Tanzimat Fermanı ile ilgili aşağıdakilerden hangisi doğrudur?",
      confidence: 0.9,
      page: 1,
    },
  ],
};

describe("inferFingerprintDraftFromExtraction domain isolation", () => {
  it("history stem never receives piecewise kayak measured_skill", async () => {
    const draft = await inferFingerprintDraftFromExtraction(HISTORY_EXTRACTION, "sq-hist");
    expect(draft.payload.measured_skill.toLowerCase()).not.toContain("piecewise");
    expect(draft.payload.measured_skill.toLowerCase()).not.toContain("kayak");
    expect(draft.payload.question_archetype.archetype_id).toBe("AR_HISTORY_CONTEXT_FACT");
    pedagogicalFingerprintSchema.parse(draft.payload);
  });

  it("river fixture still maps to piecewise math archetype", async () => {
    const draft = await inferFingerprintDraftFromExtraction(
      SYNTHETIC_RIVER_FIXTURE.extraction,
      "sq-math",
    );
    expect(draft.payload.question_archetype.archetype_id).toBe("AR_RATE_PIECEWISE");
  });

  it("detects stale legacy draft for history extraction", () => {
    const legacy = {
      measured_skill: "Apply piecewise rate structure to total cost",
    } as never;
    expect(isStaleLegacyFingerprintDraft(legacy, HISTORY_EXTRACTION)).toBe(true);
    expect(isStaleLegacyFingerprintDraft(legacy, SYNTHETIC_RIVER_FIXTURE.extraction)).toBe(false);
  });
});
