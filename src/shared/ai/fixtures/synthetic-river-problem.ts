import { SCHEMA_VERSION } from "@/shared/validation/primitives";
import type { SourceAnalystEnvelope } from "@/shared/validation/source-extraction";

/** Original synthetic practice item — not from any published exam. */
export const SYNTHETIC_RIVER_FIXTURE: SourceAnalystEnvelope = {
  schemaVersion: SCHEMA_VERSION,
  providerId: "mock",
  modelId: "deterministic-fixture-river-v1",
  demoFixtureId: "synthetic-river-problem",
  extraction: {
    schemaVersion: SCHEMA_VERSION,
    sourceQuestionKey: "p1-q1",
    language: "en",
    stemText:
      "A kayak rental shop charges 12 coins for the first hour and 8 coins for each additional hour. " +
      "Mira rents a kayak for 4 hours. How many coins does she pay in total?",
    choices: [
      { label: "A", text: "32 coins" },
      { label: "B", text: "36 coins", isCorrect: true },
      { label: "C", text: "44 coins" },
      { label: "D", text: "48 coins" },
    ],
    solutionText:
      "First hour: 12. Additional 3 hours × 8 = 24. Total 12 + 24 = 36 coins.",
    blocks: [
      {
        blockId: "stem-1",
        type: "stem",
        text:
          "A kayak rental shop charges 12 coins for the first hour and 8 coins for each additional hour. " +
          "Mira rents a kayak for 4 hours. How many coins does she pay in total?",
        confidence: 0.97,
        page: 1,
      },
      {
        blockId: "choice-a",
        type: "choice",
        choiceLabel: "A",
        text: "32 coins",
        confidence: 0.94,
        page: 1,
      },
      {
        blockId: "choice-b",
        type: "choice",
        choiceLabel: "B",
        text: "36 coins",
        confidence: 0.93,
        page: 1,
      },
      {
        blockId: "choice-c",
        type: "choice",
        choiceLabel: "C",
        text: "44 coins",
        confidence: 0.92,
        page: 1,
      },
      {
        blockId: "choice-d",
        type: "choice",
        choiceLabel: "D",
        text: "48 coins",
        confidence: 0.91,
        page: 1,
      },
      {
        blockId: "solution-1",
        type: "solution",
        text: "First hour: 12. Additional 3 hours × 8 = 24. Total 12 + 24 = 36 coins.",
        confidence: 0.88,
        page: 1,
      },
    ],
    extractionWarnings: ["Answer key inferred from solution arithmetic; verify against source key if present."],
  },
  blockLayers: {
    "stem-1": "visible_fact",
    "choice-a": "visible_fact",
    "choice-b": "visible_fact",
    "choice-c": "visible_fact",
    "choice-d": "visible_fact",
    "solution-1": "inference",
  },
  layerNotes: {
    "solution-1": "Solution steps reconstructed from visible rate structure.",
  },
};
