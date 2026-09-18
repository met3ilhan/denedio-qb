import { createHash } from "node:crypto";

import { SCHEMA_VERSION } from "@/shared/validation/primitives";
import { sourceAnalystEnvelopeSchema } from "@/shared/validation/source-extraction";

import { SYNTHETIC_RIVER_FIXTURE } from "../fixtures/synthetic-river-problem";
import { isDemoMode } from "../demo";
import { buildBlockLayers } from "./layering";
import type { ISourceAnalystProvider, SourceAnalystInput } from "./types";

export class MockSourceAnalystProvider implements ISourceAnalystProvider {
  readonly providerId = "mock";
  readonly modelId = "mock-source-analyst-v1";

  async extract(input: SourceAnalystInput) {
    if (isDemoMode() || input.originalFilename.toLowerCase().includes("demo")) {
      return SYNTHETIC_RIVER_FIXTURE;
    }

    const digest = createHash("sha256").update(input.bytes).digest("hex").slice(0, 8);
    const stemText =
      `Synthetic preview for "${input.originalFilename}" (hash ${digest}). ` +
      "A plant nursery sells 5 seed packets for 20 coins. How many coins for 8 packets?";

    const extraction = {
      schemaVersion: SCHEMA_VERSION,
      sourceQuestionKey: `auto-${digest}`,
      language: input.languageHint ?? "en",
      stemText,
      choices: [
        { label: "A" as const, text: "28 coins" },
        { label: "B" as const, text: "32 coins", isCorrect: true },
        { label: "C" as const, text: "40 coins" },
        { label: "D" as const, text: "48 coins" },
      ],
      solutionText: "Unit rate 4 coins/packet × 8 = 32 coins.",
      blocks: [
        {
          blockId: "stem-auto",
          type: "stem" as const,
          text: stemText,
          confidence: 0.9,
          page: 1,
        },
        {
          blockId: "choice-a",
          type: "choice" as const,
          choiceLabel: "A" as const,
          text: "28 coins",
          confidence: 0.86,
          page: 1,
        },
        {
          blockId: "choice-b",
          type: "choice" as const,
          choiceLabel: "B" as const,
          text: "32 coins",
          confidence: 0.85,
          page: 1,
        },
        {
          blockId: "choice-c",
          type: "choice" as const,
          choiceLabel: "C" as const,
          text: "40 coins",
          confidence: 0.84,
          page: 1,
        },
        {
          blockId: "choice-d",
          type: "choice" as const,
          choiceLabel: "D" as const,
          text: "48 coins",
          confidence: 0.83,
          page: 1,
        },
      ],
      extractionWarnings: [
        "Mock analyst: structured fields are deterministic placeholders until a vision provider runs.",
      ],
    };

    const envelope = {
      schemaVersion: SCHEMA_VERSION,
      extraction,
      blockLayers: buildBlockLayers(extraction.blocks),
      providerId: this.providerId,
      modelId: this.modelId,
    };

    return sourceAnalystEnvelopeSchema.parse(envelope);
  }
}
