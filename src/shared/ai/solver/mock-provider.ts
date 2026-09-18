import { solverResultSchema } from "@/shared/validation/solver-result";
import { SCHEMA_VERSION } from "@/shared/validation/primitives";

import type { ISolverProvider, SolverInput } from "./types";

export class MockSolverProvider implements ISolverProvider {
  readonly providerId = "mock";
  readonly modelId = "mock-solver-independent-v1";
  readonly solverProfile = "independent" as const;

  async solve(input: SolverInput) {
    const started = Date.now();
    const selected = pickByHeuristic(input);

    const output = solverResultSchema.parse({
      schemaVersion: SCHEMA_VERSION,
      selected_label: selected.label,
      is_unique: true,
      reasoning_trace: [
        { step: 1, description: "Parse interval pricing cues in stem.", operation_type: "parse" },
        { step: 2, description: "Apply tiered rate model.", operation_type: "model" },
        { step: 3, description: `Select choice ${selected.label}.`, operation_type: "verify" },
      ],
      confidence_band: "high",
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

function pickByHeuristic(input: SolverInput) {
  const preferred = input.choices.find((c) => c.label === "B");
  if (preferred) return preferred;
  return input.choices[0] ?? { label: "A", text: "" };
}
