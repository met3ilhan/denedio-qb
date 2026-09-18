import { describe, expect, it } from "vitest";

import { buildSampleMutationPlan } from "@/modules/generation/domain/mutation-plan-template";

import { mutationPlanSchema } from "./mutation-plan";
import { previewTrivialMutationFlags } from "./trivial-mutation";
import { wordingOverlapRatio } from "./similarity-config";

describe("trivial mutation T1-T6 preview", () => {
  it("emits T1 for numbers-only surface mutations", () => {
    const plan = mutationPlanSchema.parse({
      ...buildSampleMutationPlan("fp"),
      surface_mutations: [{ dimension: "numbers", description: "swap digits only" }],
    });
    const flags = previewTrivialMutationFlags(plan);
    expect(flags.some((f) => f.code === "T1")).toBe(true);
  });

  it("computes wording overlap for W1 checks", () => {
    const a = "The river kayak rental charges a flat fee for two hours";
    const b = "The river kayak rental charges a flat fee for three hours";
    expect(wordingOverlapRatio(a, b)).toBeGreaterThan(0.5);
  });
});
