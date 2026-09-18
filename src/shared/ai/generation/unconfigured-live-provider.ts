import type { GenerationInput, IGenerationProvider } from "./types";

export class UnconfiguredLiveGenerationProvider implements IGenerationProvider {
  readonly providerId = "gemini";
  readonly modelId = "unconfigured";

  async generate(_input: GenerationInput): Promise<never> {
    throw new Error(
      "Canlı üretim için QUESTION_STUDIO_GEMINI_API_KEY yapılandırılmalıdır. Mock moduna düşülmez.",
    );
  }
}
