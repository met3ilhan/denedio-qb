import { describe, expect, it } from "vitest";

import { normalizeGeminiDistractorPayload } from "../distractor/normalize-gemini-distractor";
import { normalizeGeminiQuestionPayload } from "../generation/normalize-gemini-question";
import { normalizeGeminiMutationPlanPayload } from "../mutation-planner/normalize-gemini-mutation-plan";
import { normalizeGeminiSolverPayload } from "../solver/normalize-gemini-solver";
import { generatedQuestionSchema } from "@/shared/validation/generated-question";
import { SCHEMA_VERSION } from "@/shared/validation/primitives";

const fingerprintStub = {
  distractor_mechanisms: [
    { slot: "A", mechanism_id: "MECH_CONCEPT_SWAP", misconception_id: "misc_a" },
    { slot: "B", mechanism_id: "MECH_READ", misconception_id: "misc_b" },
    { slot: "D", mechanism_id: "MECH_CONCEPT_SWAP", misconception_id: "misc_d" },
  ],
};

const baseQuestion = generatedQuestionSchema.parse({
  schemaVersion: SCHEMA_VERSION,
  provenance: {
    sourceQuestionId: "sq-test",
    fingerprintVersionId: "fp-test",
    generationRunId: "run-test",
    mutationPlanId: "plan-test",
  },
  stem: { questionText: "Kurtuluş Savaşı ile ilgili yeni bir soru kökü" },
  choices: [
    { label: "A", text: "Yanlış 1", isCorrect: false },
    { label: "B", text: "Doğru", isCorrect: true },
    { label: "C", text: "Yanlış 2", isCorrect: false },
    { label: "D", text: "Yanlış 3", isCorrect: false },
  ],
  solution: { solutionText: "Gerekçe metni" },
});

describe("downstream Gemini live-like schema normalization", () => {
  it("normalizes aliased mutation plan invariant dimensions and mechanism ids", () => {
    const plan = normalizeGeminiMutationPlanPayload(
      {
        invariant_assertions: [{ dimension: "Measured Skill", assertion: "keep", expected: "same" }],
        distractor_regeneration: [
          {
            choice_slot: "A",
            mechanism_id: "MECH_MISCONCEPTION",
            misconception_id: "misc_a",
            parameter_notes: "notes",
          },
        ],
        surface_mutations: [{ dimension: "context", description: "Change setting" }],
      },
      "fp-version-1",
      fingerprintStub,
    );
    expect(plan.invariant_assertions.some((a) => a.dimension === "measured_skill")).toBe(true);
    expect(plan.invariant_assertions.some((a) => a.dimension === "distractor_mechanisms")).toBe(true);
    expect(plan.distractor_regeneration[0]?.mechanism_id).toMatch(/^MECH_/);
    expect(
      normalizeGeminiMutationPlanPayload(
        {
          distractor_regeneration: [{ choice_slot: "Choice A", mechanism_id: "MECH_READ", parameter_notes: "x" }],
          surface_mutations: [{ dimension: "context", description: "Change setting" }],
        },
        "fp-version-1",
        fingerprintStub,
      ).distractor_regeneration.find((d) => d.choice_slot === "A"),
    ).toBeTruthy();
  });

  it("normalizes generation numeric strings and choice labels", () => {
    const question = normalizeGeminiQuestionPayload(
      {
        stem: { questionText: "  Tarih sorusu  " },
        choices: [
          { label: "a", text: "opt1", isCorrect: "false" },
          { label: "b", text: "opt2", isCorrect: "true" },
          { label: "c", text: "opt3" },
          { label: "d", text: "opt4" },
        ],
        solution: { solutionText: "Çözüm" },
        metadata: { expected_solve_time_seconds: "90" },
      },
      {
        missionId: "m1",
        generationRunId: "run1",
        mutationPlanId: "plan1",
        sourceQuestionId: "sq1",
        fingerprintVersionId: "fp1",
      },
    );
    expect(question.choices.find((c) => c.isCorrect)?.label).toBe("B");
    expect(question.metadata?.expectedSolveTimeSeconds).toBe(90);
  });

  it("normalizes distractor trap enums and solver confidence casing", () => {
    const distractor = normalizeGeminiDistractorPayload(
      {
        wrong_choices: [
          {
            choice_label: "A",
            mechanism_id: "trap_read",
            trap_type_ids: ["trap_concept_swap"],
            misconception_id: "misc_a",
            steps: [{ student_action: "Confused dates" }],
          },
        ],
      },
      baseQuestion,
      "candidate-1",
    );
    expect(distractor.wrong_choices[0]?.trap_type_ids[0]).toMatch(/^TRAP_/);

    const solver = normalizeGeminiSolverPayload(
      { selected_label: "b", confidence_band: "HIGH", reasoning_trace: [{ step: "1", description: "x" }] },
      "gemini",
      "gemini-test",
    );
    expect(solver.confidence_band).toBe("high");
    expect(solver.selected_label).toBe("B");
  });
});
