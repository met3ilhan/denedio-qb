import {
  defaultOpenRouterModelId,
  openRouterGenerateJson,
} from "../openrouter/client";
import { inputBytesSha256, resolveProviderMode } from "../provider-mode";
import { SCHEMA_VERSION } from "@/shared/validation/primitives";
import {
  sourceAnalystEnvelopeSchema,
  type SourceAnalystEnvelope,
} from "@/shared/validation/source-extraction";

import { buildBlockLayers } from "./layering";
import { normalizeGeminiExtractionBlocks } from "./normalize-gemini-extraction";
import type { ISourceAnalystProvider, SourceAnalystInput } from "./types";
import type { SourceExtraction } from "@/shared/validation/source-extraction";

function buildBlocksFromStemAndChoices(extraction: Pick<SourceExtraction, "stemText" | "choices">) {
  return [
    {
      blockId: "stem-openrouter",
      type: "stem" as const,
      text: extraction.stemText,
      confidence: 0.88,
      page: 1,
    },
    ...extraction.choices.map((c) => ({
      blockId: `choice-${c.label.toLowerCase()}`,
      type: "choice" as const,
      choiceLabel: c.label,
      text: c.text,
      confidence: 0.85,
      page: 1,
    })),
  ];
}

/** Live OpenRouter source analyst — failures surface as errors (no mock/demo fallback). */
export class OpenRouterSourceAnalystProvider implements ISourceAnalystProvider {
  readonly providerId = "openrouter";
  readonly modelId = defaultOpenRouterModelId();

  constructor(private readonly apiKey: string) {}

  async extract(input: SourceAnalystInput): Promise<SourceAnalystEnvelope> {
    const mode = resolveProviderMode();
    if (mode !== "LIVE") {
      throw new Error("OpenRouterSourceAnalystProvider invoked outside LIVE provider mode");
    }

    const stageLabel = "OpenRouter source analyst";
    const prompt =
      "You are a source analyst for Turkish exam questions. Return ONLY valid JSON (no markdown) matching " +
      "this shape: { schemaVersion, sourceQuestionKey, language, stemText, choices (2-5 with labels A-D consecutive), " +
      "solutionText optional, blocks (stem + choice blocks with blockId, type one of stem|choice|figure|table|solution|metadata|other, text, confidence 0-1, page as positive integer). " +
      "For a single uploaded image use page: 1 on every block; never use null. " +
      "extractionWarnings optional }. schemaVersion must be exactly " +
      SCHEMA_VERSION +
      ". Document filename: " +
      input.originalFilename;

    const { parsed: parsedExtraction } = await openRouterGenerateJson({
      apiKey: this.apiKey,
      modelId: this.modelId,
      prompt,
      stageLabel,
      inlineImage: {
        mimeType: input.mimeType,
        base64: input.bytes.toString("base64"),
      },
    });

    const extractionRecord =
      typeof parsedExtraction === "object" &&
      parsedExtraction !== null &&
      "extraction" in parsedExtraction
        ? (parsedExtraction as { extraction: unknown }).extraction
        : parsedExtraction;

    const raw =
      typeof extractionRecord === "object" && extractionRecord !== null
        ? (extractionRecord as Record<string, unknown>)
        : {};

    const stemText = typeof raw.stemText === "string" ? raw.stemText : "";
    const choices = Array.isArray(raw.choices) ? raw.choices : [];
    let blocks = Array.isArray(raw.blocks) ? raw.blocks : [];
    if (blocks.length === 0 && stemText && choices.length >= 2) {
      blocks = buildBlocksFromStemAndChoices({
        stemText,
        choices: choices as SourceExtraction["choices"],
      });
    } else if (blocks.length > 0) {
      blocks = normalizeGeminiExtractionBlocks(blocks);
    }

    const extraction = {
      ...raw,
      schemaVersion: SCHEMA_VERSION,
      sourceQuestionKey:
        typeof raw.sourceQuestionKey === "string"
          ? raw.sourceQuestionKey
          : `openrouter-${input.sourceFileId.slice(0, 8)}`,
      stemText,
      choices,
      blocks,
    };

    const envelopeCandidate = {
      schemaVersion: SCHEMA_VERSION,
      extraction,
      blockLayers: buildBlockLayers(blocks as SourceExtraction["blocks"]),
      providerId: this.providerId,
      modelId: this.modelId,
      providerMode: "LIVE" as const,
      inputBytesSha256: inputBytesSha256(input.bytes),
    };

    return sourceAnalystEnvelopeSchema.parse(envelopeCandidate);
  }
}
