import type { IMutationPlannerProvider, MutationPlannerInput } from "./types";

export class UnconfiguredLiveMutationPlannerProvider implements IMutationPlannerProvider {
  readonly providerId = "gemini";
  readonly modelId = "unconfigured";

  async plan(_input: MutationPlannerInput): Promise<never> {
    throw new Error(
      "Canlı mutasyon planlama için QUESTION_STUDIO_GEMINI_API_KEY yapılandırılmalıdır.",
    );
  }
}
