import { describe, expect, it } from "vitest";

import { SCHEMA_VERSION } from "./primitives";
import { sourceAnalystEnvelopeSchema, sourceExtractionSchema } from "./source-extraction";
import { SYNTHETIC_RIVER_FIXTURE } from "@/shared/ai/fixtures/synthetic-river-problem";

describe("SourceExtractionSchema", () => {
  it("accepts synthetic river fixture", () => {
    const parsed = sourceExtractionSchema.parse(SYNTHETIC_RIVER_FIXTURE.extraction);
    expect(parsed.schemaVersion).toBe(SCHEMA_VERSION);
    expect(parsed.choices).toHaveLength(4);
  });

  it("rejects non-consecutive choice labels", () => {
    const bad = {
      ...SYNTHETIC_RIVER_FIXTURE.extraction,
      choices: [
        { label: "B", text: "x" },
        { label: "C", text: "y" },
      ],
    };
    expect(() => sourceExtractionSchema.parse(bad)).toThrow();
  });

  it("parses analyst envelope with block layers", () => {
    const env = sourceAnalystEnvelopeSchema.parse(SYNTHETIC_RIVER_FIXTURE);
    expect(env.blockLayers["stem-1"]).toBe("visible_fact");
  });
});
