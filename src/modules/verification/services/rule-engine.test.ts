import { describe, expect, it } from "vitest";

import { buildSampleMutationPlan } from "@/modules/generation/domain/mutation-plan-template";
import { mutationPlanSchema } from "@/shared/validation/mutation-plan";
import { SCHEMA_VERSION } from "@/shared/validation/primitives";
import { generatedQuestionSchema } from "@/shared/validation/generated-question";
import { distractorAnalysisSchema } from "@/shared/validation/distractor-analysis";
import { solverResultSchema } from "@/shared/validation/solver-result";
import { pedagogicalFingerprintSchema } from "@/shared/validation/pedagogical-fingerprint";

import { runVerificationEngine } from "./rule-engine";

const fingerprint = pedagogicalFingerprintSchema.parse({
  schemaVersion: SCHEMA_VERSION,
  measured_skill: "rate problems",
  learning_objective: "tiered pricing",
  cognitive_operation: "multi-step",
  reasoning_pattern: "interval sum",
  solution_skeleton: [
    {
      phase_id: "p1",
      operation_type: "parse",
      depends_on: [],
      critical_substep: true,
      description: "Identify intervals",
    },
  ],
  critical_signal: { role: "first interval flat fee" },
  hidden_constraint: "additional hours billed separately",
  reasoning_steps: { min: 2, max: 4 },
  information_order: "stem then choices",
  calculation_burden: "light_mental",
  language_burden: "low",
  visual_reasoning_burden: "none",
  distractor_mechanisms: [
    {
      slot: "A",
      mechanism_id: "MECH_PARTIAL",
      trap_type_ids: ["TRAP_PARTIAL"],
      misconception_id: "partial",
      summary: "partial sum",
    },
  ],
  misconception_targets: ["partial"],
  trap_types: ["TRAP_PARTIAL"],
  elimination_opportunities: ["unit check"],
  difficulty_factors: [{ factor: "interval count", weight: "primary" }],
  expected_solve_time_seconds: { min: 60, max: 180 },
  question_archetype: { archetype_id: "rate", version: "1", label: "Rate" },
});

function baseQuestion() {
  return generatedQuestionSchema.parse({
    schemaVersion: SCHEMA_VERSION,
    stem: { questionText: "Workshop rental variant with unique wording for verification tests." },
    choices: [
      { label: "A", text: "39", isCorrect: false },
      { label: "B", text: "46", isCorrect: true },
      { label: "C", text: "35", isCorrect: false },
      { label: "D", text: "49", isCorrect: false },
    ],
    solution: { solutionText: "Tiered total 46." },
    provenance: {
      sourceQuestionId: "src1",
      fingerprintVersionId: "fp1",
      generationRunId: "run1",
      mutationPlanId: "plan1",
    },
  });
}

function baseDistractor(question: ReturnType<typeof baseQuestion>) {
  return distractorAnalysisSchema.parse({
    schemaVersion: SCHEMA_VERSION,
    wrong_choices: question.choices
      .filter((c) => !c.isCorrect)
      .map((c) => ({
        choice_label: c.label,
        mechanism_id: "MECH_PARTIAL",
        misconception_id: "misc",
        trap_type_ids: ["TRAP_PARTIAL"],
        steps: [{ order: 1, student_action: "Skip interval" }],
        produces_value: c.text,
      })),
    all_mechanisms_from_fingerprint: true,
    decorative_distractor_flags: [],
  });
}

describe("runVerificationEngine", () => {
  it("aggregates SOLVER_MISMATCH as FAIL", () => {
    const question = baseQuestion();
    const plan = buildSampleMutationPlan("fp1");
    const solver = solverResultSchema.parse({
      schemaVersion: SCHEMA_VERSION,
      selected_label: "D",
      is_unique: true,
      reasoning_trace: [{ step: 1, description: "picked D" }],
      confidence_band: "high",
      providerId: "mock",
      modelId: "mock-solver",
    });

    const result = runVerificationEngine({
      candidateId: "cand1",
      question,
      plan,
      fingerprint,
      distractor: baseDistractor(question),
      solver,
    });

    expect(result.quality_gate).toBe("GATE_FAIL");
    expect(result.findings.some((f) => f.code === "SOLVER_MISMATCH" && f.level === "FAIL")).toBe(
      true,
    );
  });

  it("flags trivial numbers-only mutation (T1) with FAIL similarity finding", () => {
    const question = baseQuestion();
    const trivialPlan = mutationPlanSchema.parse({
      ...buildSampleMutationPlan("fp1"),
      surface_mutations: [{ dimension: "numbers", description: "Change 5 to 7 only" }],
    });

    const solver = solverResultSchema.parse({
      schemaVersion: SCHEMA_VERSION,
      selected_label: "B",
      is_unique: true,
      reasoning_trace: [{ step: 1, description: "ok" }],
      confidence_band: "high",
      providerId: "mock",
      modelId: "mock-solver",
    });

    const result = runVerificationEngine({
      candidateId: "cand2",
      question,
      plan: trivialPlan,
      fingerprint,
      distractor: baseDistractor(question),
      solver,
      sourceStem: "Original river kayak stem with interval pricing.",
    });

    expect(
      result.findings.some(
        (f) => f.code === "SIM_STRUCTURAL_ISOMORPHISM" && f.level === "FAIL",
      ),
    ).toBe(true);
  });
});
