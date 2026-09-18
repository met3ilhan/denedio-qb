import { describe, expect, it } from "vitest";

import { GOLDEN_GENERATION_FAMILY_FERRY } from "../../../../fixtures/pedagogy/generation-family-candidates";
import { GOLDEN_MATH_FERRY_CURRENT } from "../../../../fixtures/pedagogy/math-ferry-current-roundtrip";
import { buildSampleMutationPlan } from "@/modules/generation/domain/mutation-plan-template";
import { generatedQuestionSchema } from "@/shared/validation/generated-question";
import { distractorAnalysisSchema } from "@/shared/validation/distractor-analysis";
import { pedagogicalFingerprintSchema } from "@/shared/validation/pedagogical-fingerprint";
import { mutationPlanSchema } from "@/shared/validation/mutation-plan";
import { SCHEMA_VERSION } from "@/shared/validation/primitives";
import { solverResultSchema } from "@/shared/validation/solver-result";
import { solveFromStemOnly } from "@/shared/ai/solver/stem-solver";
import { toSolverInput } from "@/shared/ai/solver/types";

import { verifyDistractorCausality } from "./distractor-causality";
import { buildFingerprintChecklistRows } from "./fingerprint-fidelity";
import { runVerificationEngine } from "./rule-engine";

const ferryFingerprint = pedagogicalFingerprintSchema.parse(GOLDEN_MATH_FERRY_CURRENT.fingerprint);

function questionFromFamily(
  member: (typeof GOLDEN_GENERATION_FAMILY_FERRY)[number],
) {
  return generatedQuestionSchema.parse({
    schemaVersion: SCHEMA_VERSION,
    stem: { questionText: member.stem_text },
    choices: member.choices.map((c) => ({
      label: c.label,
      text: c.text,
      isCorrect: Boolean(c.isCorrect),
    })),
    solution: { solutionText: "golden fixture" },
    provenance: {
      sourceQuestionId: "golden",
      fingerprintVersionId: "fp-golden",
      generationRunId: "run-golden",
      mutationPlanId: "plan-golden",
    },
  });
}

function ferryDistractorFromGolden() {
  return distractorAnalysisSchema.parse({
    schemaVersion: SCHEMA_VERSION,
    wrong_choices: GOLDEN_MATH_FERRY_CURRENT.distractor_causality.map((row) => ({
      choice_label: row.choice_label,
      mechanism_id: row.mechanism_id,
      misconception_id: row.misconception_id,
      trap_type_ids: row.trap_type_ids,
      steps: row.steps.map((s, i) => ({ order: i + 1, student_action: s })),
      produces_value: row.produces_value,
    })),
    all_mechanisms_from_fingerprint: true,
    decorative_distractor_flags: [],
  });
}

function scaledRoundTripDistractor(question: ReturnType<typeof questionFromFamily>) {
  const stem = question.stem.questionText;
  const dist = Number(stem.match(/(\d+(?:\.\d+)?)\s*km/i)?.[1] ?? 0);
  const still = Number(stem.match(/still(?:\s|-)?water[^0-9]*(\d+(?:\.\d+)?)\s*km\/h/i)?.[1] ?? 0);
  const current = Number(stem.match(/current[^0-9]*(\d+(?:\.\d+)?)\s*km\/h/i)?.[1] ?? 0);

  const fmt = (minutes: number) => `${Math.round(minutes)} minutes`;
  const stillOnly = ((dist * 2) / still) * 60;
  const fastBoth = ((dist / (still + current)) * 2) * 60;
  const slowBoth = ((dist / (still - current)) * 2) * 60;

  const byValue = new Map(
    question.choices.filter((c) => !c.isCorrect).map((c) => {
      const n = Number(c.text.replace(/[^\d.]/g, ""));
      return [n, c.label] as const;
    }),
  );

  return distractorAnalysisSchema.parse({
    schemaVersion: SCHEMA_VERSION,
    wrong_choices: [
      {
        choice_label: byValue.get(Math.round(stillOnly)) ?? "A",
        mechanism_id: "MECH_CONCEPT_SWAP",
        misconception_id: "misc_still_water_speed_for_whole_trip",
        trap_type_ids: ["TRAP_CONCEPT_SWAP"],
        steps: [{ order: 1, student_action: `${dist * 2} km at ${still} km/h still-water only` }],
        produces_value: fmt(stillOnly),
      },
      {
        choice_label: byValue.get(Math.round(fastBoth)) ?? "C",
        mechanism_id: "MECH_READ",
        misconception_id: "misc_same_ground_speed_both_legs",
        trap_type_ids: ["TRAP_READ"],
        steps: [{ order: 1, student_action: `Use ${still + current} km/h for both legs` }],
        produces_value: fmt(fastBoth),
      },
      {
        choice_label: byValue.get(Math.round(slowBoth)) ?? "D",
        mechanism_id: "MECH_SPECIAL_CASE",
        misconception_id: "misc_unfavorable_speed_both_legs",
        trap_type_ids: ["TRAP_CONCEPT_SWAP"],
        steps: [{ order: 1, student_action: `Use ${still - current} km/h for both legs` }],
        produces_value: fmt(slowBoth),
      },
    ],
    all_mechanisms_from_fingerprint: true,
    decorative_distractor_flags: [],
  });
}

function basePlan() {
  const plan = buildSampleMutationPlan("fp-golden");
  return mutationPlanSchema.parse({
    ...plan,
    invariant_assertions: plan.invariant_assertions.map((a) =>
      a.dimension === "solution_skeleton"
        ? {
            ...a,
            expected: "Round trip with two relative-rate legs preserved",
          }
        : a,
    ),
  });
}

describe("GOLDEN PEDAGOGY MISSION — mathematics ferry family", () => {
  it("missing dimension_evidence never defaults to PRESERVED", () => {
    const sparse = pedagogicalFingerprintSchema.parse({
      ...ferryFingerprint,
      dimension_evidence: undefined,
    });
    const rows = buildFingerprintChecklistRows(sparse);
    expect(rows.every((r) => r.verdict !== "PRESERVED" || r.evidence.length > 0)).toBe(true);
    expect(rows.some((r) => r.verdict === "UNVERIFIED")).toBe(true);
  });

  it("golden distractor causality is SUPPORTED for quantitative traps", () => {
    const sourceQ = questionFromFamily({
      kind: "GOOD",
      parent_fingerprint_id: "golden-math-ferry-current-roundtrip",
      stem_text: GOLDEN_MATH_FERRY_CURRENT.source.extraction.stemText,
      choices: GOLDEN_MATH_FERRY_CURRENT.source.extraction.choices.map((c) => ({
        label: c.label,
        text: c.text,
        isCorrect: c.isCorrect,
      })),
      mutation_plan_summary: "",
      expected_verifier: GOLDEN_GENERATION_FAMILY_FERRY[0].expected_verifier,
    });
    const findings = verifyDistractorCausality(sourceQ, ferryDistractorFromGolden());
    const supported = findings.filter((f) => f.state === "SUPPORTED");
    expect(supported.length).toBeGreaterThanOrEqual(3);
    expect(findings.some((f) => f.state === "CONTRADICTED")).toBe(false);
  });

  it("accepts GOOD candidate when solver agrees", () => {
    const good = questionFromFamily(
      GOLDEN_GENERATION_FAMILY_FERRY.find((g) => g.kind === "GOOD")!,
    );
    const solverStem = solveFromStemOnly(toSolverInput(good));
    const solver = solverResultSchema.parse({
      schemaVersion: SCHEMA_VERSION,
      selected_label: solverStem.selected_label,
      is_unique: solverStem.is_unique,
      reasoning_trace: solverStem.reasoning_trace,
      confidence_band: solverStem.confidence_band,
      providerId: "mock",
      modelId: "mock-solver-independent-v2",
    });

    const result = runVerificationEngine({
      candidateId: "good",
      question: good,
      plan: basePlan(),
      fingerprint: ferryFingerprint,
      distractor: scaledRoundTripDistractor(good),
      solver,
    });

    expect(result.quality_gate).not.toBe("GATE_FAIL");
    expect(result.findings.some((f) => f.code === "SOLVER_MISMATCH" && f.level === "FAIL")).toBe(
      false,
    );
  });

  it("rejects TOO-SIMILAR candidate via structural isomorphism", () => {
    const tooSimilar = questionFromFamily(
      GOLDEN_GENERATION_FAMILY_FERRY.find((g) => g.kind === "TOO-SIMILAR")!,
    );
    const solverStem = solveFromStemOnly(toSolverInput(tooSimilar));
    const solver = solverResultSchema.parse({
      schemaVersion: SCHEMA_VERSION,
      selected_label: solverStem.selected_label,
      is_unique: solverStem.is_unique,
      reasoning_trace: solverStem.reasoning_trace,
      confidence_band: solverStem.confidence_band,
      providerId: "mock",
      modelId: "mock-solver-independent-v2",
    });

    const result = runVerificationEngine({
      candidateId: "too-similar",
      question: tooSimilar,
      plan: {
        ...basePlan(),
        surface_mutations: [{ dimension: "numbers", description: "scale operands only" }],
      },
      fingerprint: ferryFingerprint,
      distractor: ferryDistractorFromGolden(),
      solver,
      sourceStem: GOLDEN_MATH_FERRY_CURRENT.source.extraction.stemText,
    });

    expect(result.quality_gate).toBe("GATE_FAIL");
    expect(
      result.findings.some((f) => f.code === "SIM_STRUCTURAL_ISOMORPHISM" && f.level === "FAIL"),
    ).toBe(true);
  });

  it("rejects DRIFTED one-way collapse", () => {
    const drifted = questionFromFamily(
      GOLDEN_GENERATION_FAMILY_FERRY.find((g) => g.kind === "DRIFTED")!,
    );
    const solverStem = solveFromStemOnly(toSolverInput(drifted));
    const solver = solverResultSchema.parse({
      schemaVersion: SCHEMA_VERSION,
      selected_label: solverStem.selected_label,
      is_unique: solverStem.is_unique,
      reasoning_trace: solverStem.reasoning_trace,
      confidence_band: solverStem.confidence_band,
      providerId: "mock",
      modelId: "mock-solver-independent-v2",
    });

    const result = runVerificationEngine({
      candidateId: "drifted",
      question: drifted,
      plan: basePlan(),
      fingerprint: ferryFingerprint,
      distractor: ferryDistractorFromGolden(),
      solver,
    });

    expect(result.findings.some((f) => f.code === "REJECT_MECHANISM" && f.level === "FAIL")).toBe(
      true,
    );
  });

  it("detects SOLVER-MISMATCH when key disagrees with stem solver", () => {
    const mismatch = questionFromFamily(
      GOLDEN_GENERATION_FAMILY_FERRY.find((g) => g.kind === "SOLVER-MISMATCH")!,
    );
    const solverStem = solveFromStemOnly(toSolverInput(mismatch));
    expect(solverStem.selected_label).toBe("C");

    const solver = solverResultSchema.parse({
      schemaVersion: SCHEMA_VERSION,
      selected_label: solverStem.selected_label,
      is_unique: solverStem.is_unique,
      reasoning_trace: solverStem.reasoning_trace,
      confidence_band: solverStem.confidence_band,
      providerId: "mock",
      modelId: "mock-solver-independent-v2",
    });

    const result = runVerificationEngine({
      candidateId: "solver-mismatch",
      question: mismatch,
      plan: basePlan(),
      fingerprint: ferryFingerprint,
      distractor: ferryDistractorFromGolden(),
      solver,
    });

    expect(result.findings.some((f) => f.code === "SOLVER_MISMATCH" && f.level === "FAIL")).toBe(
      true,
    );
  });

  it("rejects BAD-DISTRACTOR numeric cluster without causal paths", () => {
    const bad = questionFromFamily(
      GOLDEN_GENERATION_FAMILY_FERRY.find((g) => g.kind === "BAD-DISTRACTOR")!,
    );
    const weakMeta = distractorAnalysisSchema.parse({
      schemaVersion: SCHEMA_VERSION,
      wrong_choices: bad.choices
        .filter((c) => !c.isCorrect)
        .map((c) => ({
          choice_label: c.label,
          mechanism_id: "MECH_ARITH",
          misconception_id: "misc_noise",
          trap_type_ids: ["TRAP_PARTIAL"],
          steps: [{ order: 1, student_action: "Guess nearby minute values" }],
          produces_value: c.text,
        })),
      all_mechanisms_from_fingerprint: true,
      decorative_distractor_flags: [],
    });

    const solverStem = solveFromStemOnly(toSolverInput(bad));
    const solver = solverResultSchema.parse({
      schemaVersion: SCHEMA_VERSION,
      selected_label: solverStem.selected_label,
      is_unique: solverStem.is_unique,
      reasoning_trace: solverStem.reasoning_trace,
      confidence_band: solverStem.confidence_band,
      providerId: "mock",
      modelId: "mock-solver-independent-v2",
    });

    const result = runVerificationEngine({
      candidateId: "bad-distractor",
      question: bad,
      plan: basePlan(),
      fingerprint: ferryFingerprint,
      distractor: weakMeta,
      solver,
    });

    expect(result.quality_gate).toBe("GATE_FAIL");
    expect(result.findings.some((f) => f.code === "REJECT_DISTRACTOR" && f.level === "FAIL")).toBe(
      true,
    );
  });

  it("flags adversarial distractor metadata contradiction", () => {
    const good = questionFromFamily(
      GOLDEN_GENERATION_FAMILY_FERRY.find((g) => g.kind === "GOOD")!,
    );
    const badMeta = distractorAnalysisSchema.parse({
      schemaVersion: SCHEMA_VERSION,
      wrong_choices: [
        {
          choice_label: "A",
          mechanism_id: "MECH_CONCEPT_SWAP",
          misconception_id: "misc_still_water_speed_for_whole_trip",
          trap_type_ids: ["TRAP_CONCEPT_SWAP"],
          steps: [{ order: 1, student_action: "48 km at 12 km/h → 240 min" }],
          produces_value: "999 minutes",
        },
      ],
      all_mechanisms_from_fingerprint: true,
      decorative_distractor_flags: [],
    });

    const findings = verifyDistractorCausality(good, badMeta);
    expect(findings.some((f) => f.state === "CONTRADICTED")).toBe(true);
  });
});
