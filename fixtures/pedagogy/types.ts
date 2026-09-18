import type { PedagogicalFingerprint } from "@/shared/validation/pedagogical-fingerprint";
import type { SourceAnalystEnvelope } from "@/shared/validation/source-extraction";

/** Expert-authored golden record — not inferred from draft-inference heuristics. */
export type GoldenPedagogyFixtureId =
  | "golden-math-ferry-current-roundtrip"
  | "golden-math-piecewise-kayak"
  | "golden-verbal-tr-author-inference"
  | "golden-science-beam-moment";

export type DistractorCausalityRow = {
  choice_label: string;
  choice_text: string;
  mechanism_id: string;
  trap_type_ids: string[];
  misconception_id: string;
  steps: string[];
  produces_value: string;
  validator_note?: string;
};

export type MutationPlanGolden = {
  fingerprint_ref: string;
  surface_mutations: string[];
  invariant_assertions: string[];
  operand_constraints: string[];
  distractor_regeneration: Array<{
    slot: string;
    mechanism_id: string;
    parameter_notes: string;
  }>;
  anti_copy_notes: string;
};

export type VerifierExpectation = {
  aggregate: "APPROVE" | "REJECT" | "REVISE_FINGERPRINT";
  trivial_codes: string[];
  dimension_findings: Array<{
    dimension: string;
    verdict: "PRESERVED" | "DRIFT" | "NOT_APPLICABLE" | "UNVERIFIED";
    note: string;
  }>;
};

export type SolverExpectation = {
  correct_label: string;
  correct_value_summary: string;
  reasoning_phase_count: number;
  independent_solver_should_match: boolean;
  mismatch_note?: string;
};

export type PedagogicalFamilyExample = {
  label: "GOOD" | "BAD_SURFACE" | "BAD_MECHANISM";
  stem_excerpt: string;
  why: string;
};

export type GoldenPedagogyRecord = {
  id: GoldenPedagogyFixtureId;
  title: string;
  language: "en" | "tr";
  discipline: "math" | "verbal" | "science";
  source: SourceAnalystEnvelope;
  fingerprint: PedagogicalFingerprint;
  invariants_summary: string[];
  mutable_features: string[];
  mutation_plan: MutationPlanGolden;
  expected_pedagogical_family: string;
  good_bad_examples: PedagogicalFamilyExample[];
  distractor_causality: DistractorCausalityRow[];
  expected_solver: SolverExpectation;
  expected_verifier: VerifierExpectation;
  evidence_notes: string[];
};

export type GenerationFamilyCandidateKind =
  | "GOOD"
  | "TOO-SIMILAR"
  | "DRIFTED"
  | "BAD-DISTRACTOR"
  | "SOLVER-MISMATCH";

export type GenerationFamilyCandidate = {
  kind: GenerationFamilyCandidateKind;
  parent_fingerprint_id: GoldenPedagogyFixtureId;
  stem_text: string;
  choices: Array<{ label: string; text: string; isCorrect?: boolean }>;
  mutation_plan_summary: string;
  expected_verifier: VerifierExpectation;
};
