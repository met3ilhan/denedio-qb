import type { GeneratedQuestion } from "@/shared/validation/generated-question";
import type { SolverResult } from "@/shared/validation/solver-result";

import type { AIStageMeta } from "../generation/types";

/** Solver input — stem and choices only (no plan, fingerprint, or writer solution). */
export type SolverInput = {
  stemText: string;
  choices: Array<{ label: string; text: string }>;
};

export interface ISolverProvider {
  readonly providerId: string;
  readonly modelId: string;
  readonly solverProfile: "independent";
  solve(input: SolverInput): Promise<{ output: SolverResult; meta: AIStageMeta }>;
}

export function toSolverInput(question: GeneratedQuestion): SolverInput {
  return {
    stemText: question.stem.questionText,
    choices: question.choices.map((c) => ({ label: c.label, text: c.text })),
  };
}
