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
  readonly modelId =
    process.env.QUESTION_STUDIO_GEMINI_MODEL?.trim() || "gemini-2.5-flash";

  constructor(private readonly apiKey: string) {}

  async extract(input: SourceAnalystInput): Promise<SourceAnalystEnvelope> {
    const mode = resolveProviderMode();
    if (mode !== "LIVE") {
      throw new Error("GeminiSourceAnalystProvider invoked outside LIVE provider mode");
    }

    const prompt =
      "You are a source analyst for Turkish exam questions. Return ONLY valid JSON (no markdown) matching " +
      "this shape: { schemaVersion, sourceQuestionKey, language, stemText, choices (2-5 with labels A-D consecutive), " +
      "solutionText optional, blocks (stem + choice blocks with blockId, type one of stem|choice|figure|table|solution|metadata|other, text, confidence 0-1, page as positive integer). " +
      "For a single uploaded image use page: 1 on every block; never use null. " +
      "extractionWarnings optional }. schemaVersion must be exactly " +
      SCHEMA_VERSION +
      ". Document filename: " +
      input.originalFilename;

    const body = {
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: input.mimeType,
                data: input.bytes.toString("base64"),
              },
            },
          ],
        },
      ],
    };

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.modelId}:generateContent?key=${this.apiKey}`;
    let response: Response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } catch (cause) {
      throw new Error(
        `Gemini source analyst network error: ${cause instanceof Error ? cause.message : String(cause)}`,
      );
    }

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error(
        `Gemini source analyst HTTP ${response.status}${detail ? `: ${detail.slice(0, 500)}` : ""}`,
      );
    }

    const json = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const text = json.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!text) {
      throw new Error("Gemini source analyst returned empty content");
    }

    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error("Gemini source analyst response did not contain JSON object");
    }

    let parsedExtraction: unknown;
    try {
      parsedExtraction = JSON.parse(match[0]);
    } catch {
      throw new Error("Gemini source analyst returned invalid JSON");
    }

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
          : `gemini-${input.sourceFileId.slice(0, 8)}`,
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
