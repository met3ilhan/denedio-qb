import { z } from "zod";

import { validateChoiceLabels } from "./choices";
import { choiceLabel, schemaVersion } from "./primitives";

export const extractionBlockSchema = z
  .object({
    blockId: z.string(),
    type: z.enum([
      "stem",
      "choice",
      "figure",
      "table",
      "solution",
      "metadata",
      "other",
    ]),
    text: z.string().max(20_000).optional(),
    choiceLabel: choiceLabel.optional(),
    assetRef: z.string().optional(),
    confidence: z.number().min(0).max(1),
    page: z.number().int().positive().optional(),
    bbox: z
      .object({
        x: z.number(),
        y: z.number(),
        w: z.number(),
        h: z.number(),
      })
      .strict()
      .optional(),
  })
  .strict();

export const sourceExtractionChoiceSchema = z
  .object({
    label: choiceLabel,
    text: z.string().max(5000),
    isCorrect: z.boolean().optional(),
    assetRef: z.string().optional(),
  })
  .strict();

export const sourceExtractionSchema = z
  .object({
    schemaVersion,
    sourceQuestionKey: z.string(),
    language: z.string().min(2).max(10).optional(),
    blocks: z.array(extractionBlockSchema).min(1),
    stemText: z.string().min(1).max(20_000),
    choices: z.array(sourceExtractionChoiceSchema).min(2).max(5),
    solutionText: z.string().max(20_000).optional(),
    figures: z
      .array(
        z
          .object({
            figureId: z.string(),
            assetRef: z.string(),
            caption: z.string().max(500).optional(),
          })
          .strict(),
      )
      .optional(),
    extractionWarnings: z.array(z.string()).optional(),
  })
  .strict()
  .superRefine((val, ctx) => {
    validateChoiceLabels(val.choices.map((c) => c.label), ctx);
  });

export type SourceExtraction = z.infer<typeof sourceExtractionSchema>;
export type ExtractionBlock = z.infer<typeof extractionBlockSchema>;

export const blockReviewLayerSchema = z.enum([
  "visible_fact",
  "inference",
  "uncertainty",
]);

export type BlockReviewLayer = z.infer<typeof blockReviewLayerSchema>;

export const sourceAnalystEnvelopeSchema = z
  .object({
    schemaVersion,
    extraction: sourceExtractionSchema,
    blockLayers: z.record(z.string(), blockReviewLayerSchema),
    layerNotes: z.record(z.string(), z.string().max(500)).optional(),
    providerId: z.string(),
    modelId: z.string(),
    demoFixtureId: z.string().optional(),
    providerMode: z.enum(["LIVE", "DEMO", "MOCK", "MANUAL"]).optional(),
    inputBytesSha256: z.string().length(64).optional(),
  })
  .strict();

export type SourceAnalystEnvelope = z.infer<typeof sourceAnalystEnvelopeSchema>;
