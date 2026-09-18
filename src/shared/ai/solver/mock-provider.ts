import { solverResultSchema } from "@/shared/validation/solver-result";
import { SCHEMA_VERSION } from "@/shared/validation/primitives";

import { solveFromStemOnly } from "./stem-solver";
import type { ISolverProvider, SolverInput } from "./types";

export class MockSolverProvider implements ISolverProvider {
  readonly providerId = "mock";
  readonly modelId = "mock-solver-independent-v2";
  readonly solverProfile = "independent" as const;

  async solve(input: SolverInput) {
    const started = Date.now();
    const solved = solveFromStemOnly(input);

    const output = solverResultSchema.parse({
      schemaVersion: SCHEMA_VERSION,
      selected_label: solved.selected_label,
      is_unique: solved.is_unique,
      ambiguity_reason: solved.ambiguity_reason,
      reasoning_trace: solved.reasoning_trace,
      confidence_band: solved.confidence_band,
      providerId: this.providerId,
      modelId: this.modelId,
    });

    return {
      output,
      meta: {
        providerId: this.providerId,
        modelId: this.modelId,
        latencyMs: Date.now() - started,
      },
    };
  }
}
