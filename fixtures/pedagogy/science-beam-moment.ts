import { SCHEMA_VERSION } from "@/shared/validation/primitives";
import type { GoldenPedagogyRecord } from "./types";

/** Science golden — torque balance with unstated uniform beam. Original synthetic. */
export const GOLDEN_SCIENCE_BEAM_MOMENT: GoldenPedagogyRecord = {
  id: "golden-science-beam-moment",
  title: "Uniform beam — hidden weight at center",
  language: "en",
  discipline: "science",
  source: {
    schemaVersion: SCHEMA_VERSION,
    providerId: "golden-pedagogy",
    modelId: "expert-authored-v1",
    demoFixtureId: "golden-science-beam-moment",
    extraction: {
      schemaVersion: SCHEMA_VERSION,
      sourceQuestionKey: "golden-science-beam-1",
      language: "en",
      stemText:
        "A uniform 4.0 m plank rests on two supports at its ends (0 m and 4.0 m). " +
        "A 60 N weight hangs at the 1.0 m mark. The plank itself weighs 40 N. " +
        "What is the upward force exerted by the support at 4.0 m?",
      choices: [
        { label: "A", text: "15 N" },
        { label: "B", text: "35 N", isCorrect: true },
        { label: "C", text: "25 N" },
        { label: "D", text: "65 N" },
      ],
      solutionText:
        "Total load 100 N. Take moments about 0 m: R4×4 = 60×1 + 40×2 → R4 = (60+80)/4 = 35 N.",
      blocks: [],
      extractionWarnings: [],
    },
    blockLayers: {},
    layerNotes: {},
  },
  fingerprint: {
    schemaVersion: SCHEMA_VERSION,
    fingerprintId: "fp-golden-science-beam-v1",
    sourceQuestionId: "golden-science-beam-1",
    measured_skill: "Static equilibrium: torque about a pivot with distributed beam weight",
    learning_objective: "Place uniform rod weight at geometric center when modeling moments",
    cognitive_operation: "apply",
    reasoning_pattern: "torque_balance_about_support_eliminate_other_reaction",
    solution_skeleton: [
      {
        phase_id: "parse",
        operation_type: "parse",
        depends_on: [],
        critical_substep: true,
        description: "Identify point load location, beam weight, support positions.",
      },
      {
        phase_id: "model",
        operation_type: "model",
        depends_on: ["parse"],
        critical_substep: true,
        description: "Model plank weight as 40 N at 2.0 m (uniform beam center).",
      },
      {
        phase_id: "compute",
        operation_type: "compute",
        depends_on: ["model"],
        critical_substep: false,
        description: "Στ about left support; solve for right support force.",
      },
      {
        phase_id: "verify",
        operation_type: "verify",
        depends_on: ["compute"],
        critical_substep: false,
        description: "Check ΣF ≈ 100 N with complementary support.",
      },
    ],
    critical_signal: {
      role: "Uniform plank → weight acts at midpoint",
      surface_form_notes: "Word ‘uniform’ easy to skip; not repeated in question sentence.",
    },
    hidden_constraint: "Beam self-weight contributes moment about end support at L/2, not at load point",
    reasoning_steps: { min: 3, max: 4 },
    information_order: "geometry_then_loads_then_target_reaction",
    calculation_burden: "light_mental",
    language_burden: "medium",
    visual_reasoning_burden: "decode_diagram",
    distractor_mechanisms: [
      {
        slot: "A",
        mechanism_id: "MECH_PARTIAL",
        trap_type_ids: ["TRAP_PARTIAL"],
        misconception_id: "misc_ignore_beam_weight",
        summary: "Only 60 N load in moment equation.",
      },
      {
        slot: "C",
        mechanism_id: "MECH_BOUNDARY",
        trap_type_ids: ["TRAP_BOUNDARY", "TRAP_CONCEPT_SWAP"],
        misconception_id: "misc_beam_weight_at_load_point",
        summary: "Place 40 N moment arm at 1.0 m instead of 2.0 m.",
      },
      {
        slot: "D",
        mechanism_id: "MECH_ARITH",
        trap_type_ids: ["TRAP_PARTIAL"],
        misconception_id: "misc_total_force_halved_without_moments",
        summary: "100 N / 2 supports without torque balance.",
      },
    ],
    misconception_targets: [
      "misc_ignore_beam_weight",
      "misc_beam_weight_at_load_point",
      "misc_total_force_halved_without_moments",
    ],
    trap_types: ["TRAP_PARTIAL", "TRAP_BOUNDARY", "TRAP_CONCEPT_SWAP"],
    elimination_opportunities: ["Right support must exceed half of point load only case if beam counted"],
    difficulty_factors: [
      { factor: "multi_constraint", weight: "primary" },
      { factor: "low_signal_to_noise", weight: "secondary" },
    ],
    expected_solve_time_seconds: { min: 70, max: 110 },
    question_archetype: {
      archetype_id: "AR_SCIENCE_STATIC_TORQUE",
      version: "1",
      label: "Uniform beam — hidden center-of-weight moment",
    },
    mutable_surface_notes: "Lengths, forces, support positions; keep uniform beam + end supports class.",
    dimension_evidence: [
      {
        dimensionKey: "hidden_constraint",
        verdict: "PRESERVED",
        evidence: [{ excerpt: "uniform 4.0 m plank… weighs 40 N" }],
        rationale: "Center-of-mass placement is unstated but required.",
      },
    ],
  },
  invariants_summary: [
    "Torque balance about one support",
    "Uniform rod weight at L/2",
    "Three science distractor paths: omit beam, wrong lever arm, naive half-split",
    "Visual decode_diagram burden (implicit diagram from text)",
  ],
  mutable_features: ["Numeric values preserving integer moment arithmetic", "Plank → bar, meters → cm with scale care"],
  mutation_plan: {
    fingerprint_ref: "fp-golden-science-beam-v1",
    surface_mutations: ["3 m beam, supports at ends, point load at 0.75 m"],
    invariant_assertions: ["uniform beam center moment", "AR_SCIENCE_STATIC_TORQUE"],
    operand_constraints: ["Keep clean moment arithmetic in band"],
    distractor_regeneration: [
      { slot: "A", mechanism_id: "MECH_PARTIAL", parameter_notes: "Point load only" },
      { slot: "C", mechanism_id: "MECH_BOUNDARY", parameter_notes: "Wrong lever arm for distributed weight" },
      { slot: "D", mechanism_id: "MECH_ARITH", parameter_notes: "Equal split without moments" },
    ],
    anti_copy_notes: "Avoid copying ‘4.0 m plank’ triplet; redraw equivalent geometry.",
  },
  expected_pedagogical_family: "AR_SCIENCE_STATIC_TORQUE / uniform body center moment",
  good_bad_examples: [
    {
      label: "GOOD",
      stem_excerpt: "Uniform 6 m bar, 90 N at 2 m, bar 30 N, reaction at right end…",
      why: "Same hidden center-of-mass moment.",
    },
    {
      label: "BAD_SURFACE",
      stem_excerpt: "Weightless plank, 60 N at 1 m…",
      why: "Removes beam-weight trap (T3).",
    },
    {
      label: "BAD_MECHANISM",
      stem_excerpt: "Stem adds ‘ignore the plank’s mass’.",
      why: "Hidden constraint stated away (DRIFT).",
    },
  ],
  distractor_causality: [
    {
      choice_label: "A",
      choice_text: "15 N",
      mechanism_id: "MECH_PARTIAL",
      trap_type_ids: ["TRAP_PARTIAL"],
      misconception_id: "misc_ignore_beam_weight",
      steps: ["Omit plank weight in moments", "Στ about 0: R4×4 = 60×1 → R4 = 15 N"],
      produces_value: "15 N",
    },
    {
      choice_label: "C",
      choice_text: "25 N",
      mechanism_id: "MECH_BOUNDARY",
      trap_type_ids: ["TRAP_BOUNDARY", "TRAP_CONCEPT_SWAP"],
      misconception_id: "misc_beam_weight_at_load_point",
      steps: ["Use 1.0 m lever arm for plank weight", "R4×4 = 60×1 + 40×1 → R4 = 25 N"],
      produces_value: "25 N",
    },
    {
      choice_label: "D",
      choice_text: "65 N",
      mechanism_id: "MECH_ARITH",
      trap_type_ids: ["TRAP_PARTIAL"],
      misconception_id: "misc_total_force_halved_without_moments",
      steps: ["Total 100 N", "Assign majority to right support without torque"],
      produces_value: "65 N",
    },
  ],
  expected_solver: {
    correct_label: "B",
    correct_value_summary: "35 N upward at 4.0 m support",
    reasoning_phase_count: 4,
    independent_solver_should_match: true,
  },
  expected_verifier: {
    aggregate: "APPROVE",
    trivial_codes: [],
    dimension_findings: [
      { dimension: "hidden_constraint", verdict: "PRESERVED", note: "Uniform → center" },
      { dimension: "visual_reasoning_burden", verdict: "PRESERVED", note: "decode_diagram class" },
    ],
  },
  evidence_notes: ["Slot A is the pure partial-moment path (omit plank weight)."],
};
