import { describe, expect, it } from "vitest";

import { buildSampleMutationPlan } from "@/modules/generation/domain/mutation-plan-template";
import {
  buildSiblingComparisonMatrix,
  rowHasMechanismDelta,
  rowMatchesVerificationFilter,
} from "@/modules/candidates/services/sibling-comparison";
import { mutationPlanSchema } from "@/shared/validation/mutation-plan";
import { SCHEMA_VERSION } from "@/shared/validation/primitives";
import { generatedQuestionSchema } from "@/shared/validation/generated-question";

const baseDraft = generatedQuestionSchema.parse({
  schemaVersion: SCHEMA_VERSION,
  stem: { questionText: "Stem" },
  choices: [
    { label: "A", text: "1", isCorrect: true },
    { label: "B", text: "2", isCorrect: false },
  ],
  solution: { solutionText: "Sol" },
  provenance: {
    sourceQuestionId: "sq",
    fingerprintVersionId: "fv",
    generationRunId: "gr",
    mutationPlanId: "mp",
  },
});

const richPlan = mutationPlanSchema.parse(buildSampleMutationPlan("fv"));
const thinPlan = mutationPlanSchema.parse({
  ...buildSampleMutationPlan("fv"),
  surface_mutations: [richPlan.surface_mutations[0]],
  distractor_regeneration: [richPlan.distractor_regeneration[0]],
});

describe("buildSiblingComparisonMatrix", () => {
  it("includes fingerprint dimension rows", () => {
    const rows = buildSiblingComparisonMatrix([
      {
        id: "c1",
        siblingIndex: 0,
        pipelineStatus: "SOLVED",
        draft: baseDraft,
        distractorAnalysis: null,
        verification: null,
        plan: richPlan,
      },
    ]);
    expect(rows.some((r) => r.rowKey === "fp_measured_skill")).toBe(true);
    expect(rows.some((r) => r.rowKey === "solver")).toBe(true);
  });

  it("flags mechanism delta between thin and rich plans", () => {
    const rows = buildSiblingComparisonMatrix([
      {
        id: "c1",
        siblingIndex: 0,
        pipelineStatus: "SOLVED",
        draft: baseDraft,
        distractorAnalysis: null,
        verification: null,
        plan: thinPlan,
      },
      {
        id: "c2",
        siblingIndex: 1,
        pipelineStatus: "SOLVED",
        draft: baseDraft,
        distractorAnalysis: null,
        verification: null,
        plan: richPlan,
      },
    ]);
    const mechanism = rows.find((r) => r.rowKey === "mechanism");
    expect(mechanism).toBeDefined();
    expect(rowHasMechanismDelta(mechanism!)).toBe(true);
  });
});

describe("comparison filters", () => {
  it("filters fingerprint drift rows", () => {
    const row = {
      rowKey: "fp_measured_skill",
      label: "Primary measured skill",
      category: "fingerprint" as const,
      cells: [
        {
          candidateId: "a",
          siblingIndex: 0,
          status: "fail" as const,
          detail: "DRIFT",
        },
      ],
    };
    expect(rowMatchesVerificationFilter(row, "fingerprint_drift")).toBe(true);
    expect(rowMatchesVerificationFilter(row, "all")).toBe(true);
  });
});
