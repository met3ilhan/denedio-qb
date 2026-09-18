import { describe, expect, it } from "vitest";

import { buildSampleMutationPlan } from "@/modules/generation/domain/mutation-plan-template";
import { generatedQuestionSchema } from "@/shared/validation/generated-question";
import { distractorAnalysisSchema } from "@/shared/validation/distractor-analysis";
import { pedagogicalFingerprintSchema } from "@/shared/validation/pedagogical-fingerprint";
import { SCHEMA_VERSION } from "@/shared/validation/primitives";
import { solverResultSchema } from "@/shared/validation/solver-result";

import { buildFingerprintChecklistRows } from "./fingerprint-fidelity";
import { runVerificationEngine } from "./rule-engine";

describe("fingerprint fidelity defaults", () => {
  it("never assigns PRESERVED without evidence rows", () => {
    const fingerprint = pedagogicalFingerprintSchema.parse({
      schemaVersion: SCHEMA_VERSION,
      measured_skill: "skill",
      learning_objective: "obj",
      cognitive_operation: "analyze",
      reasoning_pattern: "pattern",
      solution_skeleton: [
        {
          phase_id: "p1",
          operation_type: "parse",
          depends_on: [],
          critical_substep: true,
          description: "parse",
        },
      ],
      critical_signal: { role: "signal" },
      hidden_constraint: "hidden",
      reasoning_steps: { min: 1, max: 3 },
      information_order: "stem first",
      calculation_burden: "light_mental",
      language_burden: "low",
      visual_reasoning_burden: "none",
      distractor_mechanisms: [
        {
          slot: "A",
          mechanism_id: "MECH_PARTIAL",
          trap_type_ids: ["TRAP_PARTIAL"],
          misconception_id: "m",
          summary: "s",
        },
      ],
      misconception_targets: ["m"],
      trap_types: ["TRAP_PARTIAL"],
      elimination_opportunities: [],
      difficulty_factors: [{ factor: "f", weight: "primary" }],
      expected_solve_time_seconds: { min: 60, max: 120 },
      question_archetype: { archetype_id: "a", version: "1", label: "A" },
    });

    const rows = buildFingerprintChecklistRows(fingerprint);
    expect(rows.every((r) => r.verdict === "UNVERIFIED")).toBe(true);
    expect(rows.some((f) => f.verdict === "PRESERVED")).toBe(false);
  });

  it("surfaces UNVERIFIED dimensions in verification checklist", () => {
    const fingerprint = pedagogicalFingerprintSchema.parse({
      schemaVersion: SCHEMA_VERSION,
      measured_skill: "skill",
      learning_objective: "obj",
      cognitive_operation: "analyze",
      reasoning_pattern: "pattern",
      solution_skeleton: [
        {
          phase_id: "p1",
          operation_type: "parse",
          depends_on: [],
          critical_substep: true,
          description: "parse",
        },
      ],
      critical_signal: { role: "signal" },
      hidden_constraint: "hidden",
      reasoning_steps: { min: 1, max: 3 },
      information_order: "stem first",
      calculation_burden: "light_mental",
      language_burden: "low",
      visual_reasoning_burden: "none",
      distractor_mechanisms: [
        {
          slot: "A",
          mechanism_id: "MECH_PARTIAL",
          trap_type_ids: ["TRAP_PARTIAL"],
          misconception_id: "m",
          summary: "s",
        },
      ],
      misconception_targets: ["m"],
      trap_types: ["TRAP_PARTIAL"],
      elimination_opportunities: [],
      difficulty_factors: [{ factor: "f", weight: "primary" }],
      expected_solve_time_seconds: { min: 60, max: 120 },
      question_archetype: { archetype_id: "a", version: "1", label: "A" },
    });

    const question = generatedQuestionSchema.parse({
      schemaVersion: SCHEMA_VERSION,
      stem: { questionText: "Test question stem for fidelity." },
      choices: [
        { label: "A", text: "1", isCorrect: false },
        { label: "B", text: "2", isCorrect: true },
      ],
      solution: { solutionText: "2" },
      provenance: {
        sourceQuestionId: "s",
        fingerprintVersionId: "f",
        generationRunId: "r",
        mutationPlanId: "p",
      },
    });

    const distractor = distractorAnalysisSchema.parse({
      schemaVersion: SCHEMA_VERSION,
      wrong_choices: [
        {
          choice_label: "A",
          mechanism_id: "MECH_PARTIAL",
          misconception_id: "m",
          trap_type_ids: ["TRAP_PARTIAL"],
          steps: [{ order: 1, student_action: "Skip final interval in tiered sum" }],
          produces_value: "1",
        },
      ],
      all_mechanisms_from_fingerprint: true,
      decorative_distractor_flags: [],
    });

    const solver = solverResultSchema.parse({
      schemaVersion: SCHEMA_VERSION,
      selected_label: "B",
      is_unique: true,
      reasoning_trace: [{ step: 1, description: "Select choice B.", operation_type: "verify" }],
      confidence_band: "high",
      providerId: "mock",
      modelId: "mock",
    });

    const result = runVerificationEngine({
      candidateId: "c1",
      question,
      plan: buildSampleMutationPlan("fp"),
      fingerprint,
      distractor,
      solver,
    });

    expect(
      result.fingerprint_checklist.some(
        (r) => r.verdict === "UNVERIFIED" && r.dimensionKey === "measured_skill",
      ),
    ).toBe(true);
    expect(
      result.findings.some((f) => f.code === "FINGERPRINT_UNVERIFIED" && f.level === "WARNING"),
    ).toBe(true);
  });
});
