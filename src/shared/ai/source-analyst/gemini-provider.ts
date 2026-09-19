import { defaultGeminiModelId, extractJsonObject, geminiGenerateTextJson } from "../gemini-client";
import { inputBytesSha256, resolveProviderMode } from "../provider-mode";
import { SCHEMA_VERSION } from "@/shared/validation/primitives";
import {
  sourceAnalystEnvelopeSchema,
  type SourceAnalystEnvelope,
} from "@/shared/validation/source-extraction";

import { buildSourceExtractionPrompt } from "./extraction-prompt";
import { buildBlockLayers } from "./layering";
import { normalizeGeminiExtractionBlocks } from "./normalize-gemini-extraction";
import { syncChoicesFromBlocks } from "./sync-choices-from-blocks";
import type { ISourceAnalystProvider, SourceAnalystInput } from "./types";
import type { SourceExtraction } from "@/shared/validation/source-extraction";

function buildBlocksFromStemAndChoices(extraction: Pick<SourceExtraction, "stemText" | "choices">) {
  return [
    {
      blockId: "stem-gemini",
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

/**
 * Live Gemini source analyst — failures surface as errors (no mock/demo fallback).
 * Requires QUESTION_STUDIO_GEMINI_API_KEY.
 */
export class GeminiSourceAnalystProvider implements ISourceAnalystProvider {
  readonly providerId = "gemini";
  readonly modelId = defaultGeminiModelId();

  constructor(private readonly apiKey: string) {}

  async extract(input: SourceAnalystInput): Promise<SourceAnalystEnvelope> {
    const mode = resolveProviderMode();
    if (mode !== "LIVE") {
      throw new Error("GeminiSourceAnalystProvider invoked outside LIVE provider mode");
    }

    const stageLabel = "Gemini source analyst";
    const prompt = buildSourceExtractionPrompt(input);

    const text = await geminiGenerateTextJson({
      apiKey: this.apiKey,
      modelId: this.modelId,
      prompt,
      stageLabel,
      inlineImage: {
        mimeType: input.mimeType,
        base64: input.bytes.toString("base64"),
      },
    });

    const parsedExtraction = extractJsonObject(text, stageLabel);

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

    let mergedChoices = choices as SourceExtraction["choices"];
    const draftExtraction = {
      schemaVersion: SCHEMA_VERSION,
      sourceQuestionKey:
        typeof raw.sourceQuestionKey === "string"
          ? raw.sourceQuestionKey
          : `gemini-${input.sourceFileId.slice(0, 8)}`,
      stemText,
      choices: mergedChoices,
      blocks: blocks as SourceExtraction["blocks"],
      language: typeof raw.language === "string" ? raw.language : "tr",
      solutionText: typeof raw.solutionText === "string" ? raw.solutionText : undefined,
      extractionWarnings: Array.isArray(raw.extractionWarnings) ? raw.extractionWarnings : undefined,
    };
    mergedChoices = syncChoicesFromBlocks(draftExtraction);
    const extraction = { ...draftExtraction, choices: mergedChoices };

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
