import { createHash } from "node:crypto";

import type { GeneratedQuestion } from "@/shared/validation/generated-question";
import { generatedQuestionSchema } from "@/shared/validation/generated-question";
import { SCHEMA_VERSION } from "@/shared/validation/primitives";

import type { GenerationInput, IGenerationProvider } from "./types";

export class MockGenerationProvider implements IGenerationProvider {
  readonly providerId = "mock";
  readonly modelId = "mock-generator-v1";

  async generate(input: GenerationInput) {
    const started = Date.now();
    const digest = createHash("sha256")
      .update(JSON.stringify(input.plan.surface_mutations))
      .digest("hex")
      .slice(0, 6);

    const contextLabel =
      input.plan.surface_mutations.find((m) => m.dimension === "context")?.description ??
      "Alternate scenario";

    const stem =
      `A workshop rents equipment using the same interval pricing mechanism as the locked fingerprint. ` +
      `${contextLabel} (variant ${digest}). ` +
      `The first 2 hours cost 18 credits and each additional hour costs 7 credits. How many credits for 5 hours?`;

    const output = generatedQuestionSchema.parse({
      schemaVersion: SCHEMA_VERSION,
      stem: { questionText: stem },
      choices: [
        { label: "A", text: "46 credits", isCorrect: false },
        { label: "B", text: "39 credits", isCorrect: true },
        { label: "C", text: "35 credits", isCorrect: false },
        { label: "D", text: "49 credits", isCorrect: false },
      ],
      solution: {
        solutionText:
          "First 2 hours: 18 credits. Remaining 3 hours × 7 = 21. Total 39 credits (choice B).",
      },
      metadata: { difficulty: "MEDIUM", expectedSolveTimeSeconds: 120 },
      provenance: {
        sourceQuestionId: input.context.sourceQuestionId,
        fingerprintVersionId: input.context.fingerprintVersionId,
        generationRunId: input.context.generationRunId,
        mutationPlanId: input.context.mutationPlanId,
      },
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
