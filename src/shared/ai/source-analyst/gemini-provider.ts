import { MockSourceAnalystProvider } from "./mock-provider";
import type { ISourceAnalystProvider, SourceAnalystInput } from "./types";
import type { SourceAnalystEnvelope } from "@/shared/validation/source-extraction";

/**
 * Optional Gemini adapter — falls back to mock when API call fails or response is not parseable.
 * Requires QUESTION_STUDIO_GEMINI_API_KEY.
 */
export class GeminiSourceAnalystProvider implements ISourceAnalystProvider {
  readonly providerId = "gemini";
  readonly modelId = "gemini-2.0-flash";

  private readonly fallback = new MockSourceAnalystProvider();

  constructor(private readonly apiKey: string) {}

  async extract(input: SourceAnalystInput): Promise<SourceAnalystEnvelope> {
    try {
      const prompt =
        "You are a source analyst. Return JSON matching SourceExtractionSchema for the first question " +
        "in the uploaded document. Use schemaVersion 2026-09-18-gate1, 2-5 choices labeled A-D consecutive, " +
        "include blocks with confidence 0-1. Document filename: " +
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
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        return this.fallback.extract(input);
      }

      const json = (await response.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };
      const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        return this.fallback.extract(input);
      }

      const match = text.match(/\{[\s\S]*\}/);
      if (!match) {
        return this.fallback.extract(input);
      }

      const parsed = JSON.parse(match[0]) as SourceAnalystEnvelope["extraction"];
      const mock = await this.fallback.extract(input);
      return {
        ...mock,
        extraction: { ...mock.extraction, ...parsed, schemaVersion: mock.extraction.schemaVersion },
        providerId: this.providerId,
        modelId: this.modelId,
      };
    } catch {
      return this.fallback.extract(input);
    }
  }
}
