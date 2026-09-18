import { describe, expect, it } from "vitest";

import {
  getSourceAnalystProvider,
  resetSourceAnalystProviderCache,
  setSourceAnalystProviderForTests,
} from "@/shared/ai/source-analyst";
import type { ISourceAnalystProvider, SourceAnalystInput } from "@/shared/ai/source-analyst/types";
import { SCHEMA_VERSION } from "@/shared/validation/primitives";
import { sourceAnalystEnvelopeSchema } from "@/shared/validation/source-extraction";

describe("provider boundary spy", () => {
  it("receives the correct sourceFileId and bytes for uploaded canary", async () => {
    const calls: SourceAnalystInput[] = [];
    const spy: ISourceAnalystProvider = {
      providerId: "spy",
      modelId: "spy-v1",
      extract: async (input) => {
        calls.push(input);
        const marker = input.bytes.toString("utf8").match(/DENEDIO-CANARY-\d+/)?.[0] ?? "MISSING";
        return sourceAnalystEnvelopeSchema.parse({
          schemaVersion: SCHEMA_VERSION,
          extraction: {
            schemaVersion: SCHEMA_VERSION,
            sourceQuestionKey: `spy-${input.sourceFileId}`,
            stemText: `${marker} spy stem`,
            choices: [
              { label: "A", text: "a" },
              { label: "B", text: "b" },
              { label: "C", text: "c" },
              { label: "D", text: "d" },
            ],
            blocks: [
              {
                blockId: "stem",
                type: "stem",
                text: `${marker} spy stem`,
                confidence: 1,
              },
            ],
          },
          blockLayers: { stem: "visible_fact" },
          providerId: "spy",
          modelId: "spy-v1",
          providerMode: "MOCK",
          inputBytesSha256: "ab".repeat(32),
        });
      },
    };

    setSourceAnalystProviderForTests(spy);
    resetSourceAnalystProviderCache();

    const bytes = Buffer.from("DENEDIO-CANARY-7391", "utf8");
    const provider = getSourceAnalystProvider();
    const result = await provider.extract({
      sourceFileId: "correct-source-id",
      storageKey: "mission/key",
      mimeType: "image/png",
      originalFilename: "canary.png",
      bytes,
    });

    expect(calls).toHaveLength(1);
    expect(calls[0]?.sourceFileId).toBe("correct-source-id");
    expect(calls[0]?.bytes.equals(bytes)).toBe(true);
    expect(result.extraction.stemText).toContain("DENEDIO-CANARY-7391");

    setSourceAnalystProviderForTests(undefined);
    resetSourceAnalystProviderCache();
  });
});
