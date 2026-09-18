import { SCHEMA_VERSION } from "@/shared/validation/primitives";
import { SYNTHETIC_RIVER_FIXTURE } from "@/shared/ai/fixtures/synthetic-river-problem";
import type { GoldenPedagogyRecord } from "./types";

/** Expert-authored fingerprint for the existing synthetic kayak / piecewise rental item. */
export const GOLDEN_MATH_PIECEWISE_KAYAK: GoldenPedagogyRecord = {
  id: "golden-math-piecewise-kayak",
  title: "Piecewise first-hour vs additional-hour rental",
  language: "en",
  discipline: "math",
  source: SYNTHETIC_RIVER_FIXTURE,
  fingerprint: {
    schemaVersion: SCHEMA_VERSION,
    fingerprintId: "fp-golden-piecewise-kayak-v1",
    sourceQuestionId: "p1-q1",
    measured_skill: "Aggregate cost over a duration with a non-uniform first interval rate",
    learning_objective:
      "Translate ‘first hour’ vs ‘each additional hour’ into correct interval count before multiplying",
    cognitive_operation: "apply",
    reasoning_pattern: "decompose_intervals_then_aggregate",
    solution_skeleton: [
      {
        phase_id: "parse",
        operation_type: "parse",
        depends_on: [],
        critical_substep: true,
        description: "Separate first hour from remaining whole hours in total rental duration.",
      },
      {
        phase_id: "model",
        operation_type: "model",
        depends_on: ["parse"],
        critical_substep: true,
        description: "Count additional hours as (total − 1) when total is whole hours.",
      },
      {
        phase_id: "compute",
        operation_type: "compute",
        depends_on: ["model"],
        critical_substep: false,
        description: "First interval fee + (additional count × additional rate).",
      },
      {
        phase_id: "verify",
        operation_type: "verify",
        depends_on: ["compute"],
        critical_substep: false,
        description: "Check additional count is not total hours; total exceeds uniform-rate shortcuts.",
      },
    ],
    critical_signal: {
      role: "Lexical boundary between first hour and each additional hour",
      surface_form_notes: "‘First hour’ and ‘each additional hour’ must remain distinct rates.",
    },
    hidden_constraint: "Total duration is counted in whole hours; the first hour is a single interval even when total > 1",
    reasoning_steps: { min: 3, max: 4 },
    information_order: "rates_then_duration_then_question",
    calculation_burden: "light_mental",
    language_burden: "medium",
    visual_reasoning_burden: "none",
    distractor_mechanisms: [
      {
        slot: "A",
        mechanism_id: "MECH_CONCEPT_SWAP",
        trap_type_ids: ["TRAP_CONCEPT_SWAP", "TRAP_PARTIAL"],
        misconception_id: "misc_uniform_additional_rate_all_hours",
        summary: "Charge additional rate for all 4 hours (ignore first-hour premium).",
      },
      {
        slot: "C",
        mechanism_id: "MECH_BOUNDARY",
        trap_type_ids: ["TRAP_BOUNDARY"],
        misconception_id: "misc_off_by_one_additional_interval",
        summary: "Treat ‘additional’ count as total hours instead of total minus one.",
      },
      {
        slot: "D",
        mechanism_id: "MECH_CONCEPT_SWAP",
        trap_type_ids: ["TRAP_PARTIAL", "TRAP_CONCEPT_SWAP"],
        misconception_id: "misc_first_rate_on_every_hour",
        summary: "Apply first-hour rate to every hour.",
      },
    ],
    misconception_targets: [
      "misc_uniform_additional_rate_all_hours",
      "misc_off_by_one_additional_interval",
      "misc_first_rate_on_every_hour",
    ],
    trap_types: ["TRAP_BOUNDARY", "TRAP_CONCEPT_SWAP", "TRAP_PARTIAL"],
    elimination_opportunities: [
      "Correct total must exceed 4×additional-only shortcut (eliminate A if student notices premium)",
    ],
    difficulty_factors: [
      { factor: "trap_density", weight: "primary" },
      { factor: "low_signal_to_noise", weight: "secondary" },
    ],
    expected_solve_time_seconds: { min: 45, max: 90 },
    question_archetype: {
      archetype_id: "AR_RATE_PIECEWISE",
      version: "1",
      label: "Piecewise hourly rate — first interval premium",
    },
    mutable_surface_notes:
      "Shop name, currency label, rates, hours; preserve first/additional interval structure.",
    dimension_evidence: [
      {
        dimensionKey: "critical_signal",
        verdict: "PRESERVED",
        evidence: [
          {
            excerpt: "12 coins for the first hour and 8 coins for each additional hour",
          },
        ],
      },
      {
        dimensionKey: "distractor_mechanisms",
        verdict: "PRESERVED",
        evidence: [
          {
            excerpt: "A=4×8, C=12+4×8, D=4×12 — boundary and concept-swap traps documented in golden causality table.",
          },
        ],
      },
    ],
  },
  invariants_summary: [
    "Piecewise rate with distinct first interval",
    "Additional-hour count = total hours − 1",
    "Three distractor families: uniform additional, off-by-one boundary, first rate everywhere",
    "Skeleton parse → model → compute → verify",
  ],
  mutable_features: ["Context (kayak → parking, locker), names, coin amounts, hour count", "Choice order"],
  mutation_plan: {
    fingerprint_ref: "fp-golden-piecewise-kayak-v1",
    surface_mutations: [
      "Parking garage: first 60 minutes 15 coins, each extra 30 minutes 9 coins for 3.5 hours — requires fingerprint revision if interval not whole hours",
      "Keep whole-hour rental class for v1 mutations",
    ],
    invariant_assertions: [
      "AR_RATE_PIECEWISE archetype",
      "MECH_BOUNDARY on off-by-one additional count",
      "critical_signal role unchanged",
    ],
    operand_constraints: [
      "Total hours integer > 1",
      "First rate ≠ additional rate",
    ],
    distractor_regeneration: [
      { slot: "A", mechanism_id: "MECH_CONCEPT_SWAP", parameter_notes: "total_hours × additional_rate" },
      { slot: "C", mechanism_id: "MECH_BOUNDARY", parameter_notes: "first + total_hours × additional" },
      { slot: "D", mechanism_id: "MECH_CONCEPT_SWAP", parameter_notes: "total_hours × first_rate" },
    ],
    anti_copy_notes: "Avoid ‘kayak rental shop charges’ template; use new syntax for interval boundary.",
  },
  expected_pedagogical_family: "AR_RATE_PIECEWISE / interval boundary aggregation",
  good_bad_examples: [
    {
      label: "GOOD",
      stem_excerpt: "Camp cabin: 20 coins first night, 14 each extra night, 5 nights…",
      why: "Same interval decomposition; new context.",
    },
    {
      label: "BAD_SURFACE",
      stem_excerpt: "12 coins per hour for 4 hours…",
      why: "Removes piecewise structure (T3 collapse).",
    },
    {
      label: "BAD_MECHANISM",
      stem_excerpt: "Same stem with numbers scaled 12→24, 8→16, hours 4→2 so only one multiplication remains.",
      why: "T1 trivial numeric collapse; easier burden.",
    },
  ],
  distractor_causality: [
    {
      choice_label: "A",
      choice_text: "32 coins",
      mechanism_id: "MECH_CONCEPT_SWAP",
      trap_type_ids: ["TRAP_CONCEPT_SWAP", "TRAP_PARTIAL"],
      misconception_id: "misc_uniform_additional_rate_all_hours",
      steps: ["Ignore first-hour premium", "4 × 8 = 32"],
      produces_value: "32 coins",
    },
    {
      choice_label: "C",
      choice_text: "44 coins",
      mechanism_id: "MECH_BOUNDARY",
      trap_type_ids: ["TRAP_BOUNDARY"],
      misconception_id: "misc_off_by_one_additional_interval",
      steps: ["Use 4 additional hours", "12 + 4×8 = 44"],
      produces_value: "44 coins",
    },
    {
      choice_label: "D",
      choice_text: "48 coins",
      mechanism_id: "MECH_CONCEPT_SWAP",
      trap_type_ids: ["TRAP_PARTIAL", "TRAP_CONCEPT_SWAP"],
      misconception_id: "misc_first_rate_on_every_hour",
      steps: ["Apply first-hour rate to all hours", "4 × 12 = 48"],
      produces_value: "48 coins",
    },
  ],
  expected_solver: {
    correct_label: "B",
    correct_value_summary: "36 coins (12 + 3×8)",
    reasoning_phase_count: 4,
    independent_solver_should_match: true,
  },
  expected_verifier: {
    aggregate: "APPROVE",
    trivial_codes: [],
    dimension_findings: [
      { dimension: "distractor_mechanisms", verdict: "PRESERVED", note: "Expert paths replace index-based draft inference" },
      { dimension: "reasoning_steps", verdict: "PRESERVED", note: "Band 3–4" },
    ],
  },
  evidence_notes: [
    "Replaces placeholder distractor rows in `inferFingerprintDraftFromExtraction` for this fixture.",
    "Aligns with PEDAGOGY_REVIEW_SAMPLES.md choice table.",
  ],
};
