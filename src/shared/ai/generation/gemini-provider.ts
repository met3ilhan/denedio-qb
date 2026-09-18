import { MockGenerationProvider } from "./mock-provider";
import type { GenerationInput, IGenerationProvider } from "./types";

/** Gemini wrapper — delegates to mock until a full prompt template is wired. */
export class GeminiGenerationProvider implements IGenerationProvider {
  readonly providerId = "gemini";
  readonly modelId = process.env.QUESTION_STUDIO_GEMINI_MODEL ?? "gemini-2.0-flash";

  private readonly fallback = new MockGenerationProvider();

  async generate(input: GenerationInput) {
    const result = await this.fallback.generate(input);
    return {
      output: result.output,
      meta: {
        providerId: this.providerId,
        modelId: this.modelId,
        latencyMs: result.meta.latencyMs,
      },
    };
  }
}
