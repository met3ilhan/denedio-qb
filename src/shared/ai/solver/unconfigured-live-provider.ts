import type { ISolverProvider, SolverInput } from "./types";

export class UnconfiguredLiveSolverProvider implements ISolverProvider {
  readonly providerId = "gemini";
  readonly modelId = "unconfigured";
  readonly solverProfile = "independent" as const;

  async solve(_input: SolverInput): Promise<never> {
    throw new Error(
      "Canlı bağımsız çözücü için QUESTION_STUDIO_GEMINI_API_KEY yapılandırılmalıdır.",
    );
  }
}
