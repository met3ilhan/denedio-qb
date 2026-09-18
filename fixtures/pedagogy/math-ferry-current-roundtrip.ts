import { SCHEMA_VERSION } from "@/shared/validation/primitives";
import type { GoldenPedagogyRecord } from "./types";

/**
 * STRONGEST math golden — relative speed with current, round-trip hidden symmetry.
 * Original synthetic item; not from any published exam.
 */
export const GOLDEN_MATH_FERRY_CURRENT: GoldenPedagogyRecord = {
  id: "golden-math-ferry-current-roundtrip",
  title: "Ferry round trip with parallel current",
  language: "en",
  discipline: "math",
  source: {
    schemaVersion: SCHEMA_VERSION,
    providerId: "golden-pedagogy",
    modelId: "expert-authored-v1",
    demoFixtureId: "golden-math-ferry-current-roundtrip",
    extraction: {
      schemaVersion: SCHEMA_VERSION,
      sourceQuestionKey: "golden-math-ferry-1",
      language: "en",
      stemText:
        "A ferry crosses a straight channel that is 24 km wide. In still water the ferry travels at 12 km/h. " +
        "A constant current of 4 km/h runs parallel to the crossing (the same direction the ferry points on the outbound leg). " +
        "The ferry goes across and returns along the same line. How many minutes does the full round trip take?",
      choices: [
        { label: "A", text: "240 minutes" },
        { label: "B", text: "270 minutes", isCorrect: true },
        { label: "C", text: "180 minutes" },
        { label: "D", text: "360 minutes" },
      ],
      solutionText:
        "Outbound with current: 12+4=16 km/h → 24/16=1.5 h. Return against current: 12−4=8 km/h → 24/8=3 h. " +
        "Total 4.5 h = 270 minutes.",
      blocks: [],
      extractionWarnings: [],
    },
    blockLayers: {},
    layerNotes: {},
  },
  fingerprint: {
    schemaVersion: SCHEMA_VERSION,
    fingerprintId: "fp-golden-math-ferry-v1",
    sourceQuestionId: "golden-math-ferry-1",
    measured_skill:
      "Combine relative speeds for motion with and against a current on a fixed route segment",
    learning_objective:
      "Recognize that a round trip reverses the current’s effect on ground speed; avoid averaging speeds naively",
    cognitive_operation: "analyze",
    reasoning_pattern: "model_opposing_relative_rates_then_aggregate_legs",
    solution_skeleton: [
      {
        phase_id: "parse",
        operation_type: "parse",
        depends_on: [],
        critical_substep: true,
        description: "Identify one-way distance, still-water speed, current, and full round trip (two legs).",
      },
      {
        phase_id: "model_out",
        operation_type: "model",
        depends_on: ["parse"],
        critical_substep: true,
        description: "Ground speed with current on outbound leg (add current to still-water speed).",
      },
      {
        phase_id: "model_back",
        operation_type: "model",
        depends_on: ["parse"],
        critical_substep: true,
        description: "Ground speed against current on return leg (subtract current).",
      },
      {
        phase_id: "compute",
        operation_type: "compute",
        depends_on: ["model_out", "model_back"],
        critical_substep: false,
        description: "Time per leg = distance/rate; sum hours; convert to minutes.",
      },
      {
        phase_id: "verify",
        operation_type: "verify",
        depends_on: ["compute"],
        critical_substep: false,
        description: "Sanity: return leg slower than outbound; total between one-leg extremes.",
      },
    ],
    critical_signal: {
      role: "Round trip on the same line reverses whether the current helps or hinders",
      surface_form_notes:
        "Phrases “returns along the same line” and “parallel to the crossing” must stay easy to skim past but load-bearing.",
    },
    hidden_constraint:
      "The return leg uses opposite relative orientation to the current even though the stem does not repeat the word “against” explicitly",
    reasoning_steps: { min: 4, max: 5 },
    information_order: "simultaneous_givens_then_goal; no diagram required",
    calculation_burden: "light_mental",
    language_burden: "medium",
    visual_reasoning_burden: "none",
    distractor_mechanisms: [
      {
        slot: "A",
        mechanism_id: "MECH_CONCEPT_SWAP",
        trap_type_ids: ["TRAP_CONCEPT_SWAP"],
        misconception_id: "misc_still_water_speed_for_whole_trip",
        summary: "Uses 12 km/h for all 48 km, ignoring current entirely.",
      },
      {
        slot: "C",
        mechanism_id: "MECH_READ",
        trap_type_ids: ["TRAP_READ", "TRAP_CONCEPT_SWAP"],
        misconception_id: "misc_same_ground_speed_both_legs",
        summary: "Applies favorable downstream ground speed to both legs.",
      },
      {
        slot: "D",
        mechanism_id: "MECH_SPECIAL_CASE",
        trap_type_ids: ["TRAP_CONCEPT_SWAP"],
        misconception_id: "misc_unfavorable_speed_both_legs",
        summary: "Treats return leg as also against favorable orientation (upstream speed both ways).",
      },
    ],
    misconception_targets: [
      "misc_still_water_speed_for_whole_trip",
      "misc_same_ground_speed_both_legs",
      "misc_unfavorable_speed_both_legs",
      "misc_arithmetic_mean_of_rates",
    ],
    trap_types: ["TRAP_CONCEPT_SWAP", "TRAP_READ", "TRAP_PARTIAL"],
    elimination_opportunities: [
      "One-leg time bounds: round trip must exceed slower single-leg time × 2",
      "Dimensional: minutes scale with hours × 60",
    ],
    difficulty_factors: [
      { factor: "multi_constraint", weight: "primary" },
      { factor: "low_signal_to_noise", weight: "secondary" },
      { factor: "trap_density", weight: "secondary" },
    ],
    expected_solve_time_seconds: { min: 75, max: 120 },
    question_archetype: {
      archetype_id: "AR_RELATIVE_SPEED_ROUNDTRIP",
      version: "1",
      label: "Relative speed with current — round trip",
    },
    mutable_surface_notes:
      "Distance, speeds, current magnitude, vehicle (ferry/boat/swimmer), units; preserve round-trip + parallel current class and two-leg relative-rate model.",
    dimension_evidence: [
      {
        dimensionKey: "measured_skill",
        verdict: "PRESERVED",
        evidence: [
          {
            excerpt:
              "constant current of 4 km/h runs parallel… goes across and returns along the same line",
          },
        ],
        rationale: "Stem encodes relative motion with external current.",
      },
      {
        dimensionKey: "distractor_mechanisms",
        verdict: "PRESERVED",
        evidence: [
          {
            excerpt: "Wrong options 240 / 180 / 360 min map to still-water-only, same leg speed, and both-legs-slow paths.",
          },
        ],
      },
    ],
  },
  invariants_summary: [
    "Round-trip structure with current aiding one leg and opposing the other",
    "Relative-rate model (not average of still water and current)",
    "Four- to five-phase skeleton: parse → two models → compute → verify",
    "Three distinct distractor families: ignore current, same speed both legs, wrong orientation both legs",
    "Calculation band: light mental arithmetic; language medium",
  ],
  mutable_features: [
    "Numeric distance and speeds (keep burden band and leg asymmetry)",
    "Context nouns (ferry, kayak, swimmer)",
    "Unit labels (km/h vs mph) with consistent conversion",
    "Choice order and letter labels",
  ],
  mutation_plan: {
    fingerprint_ref: "fp-golden-math-ferry-v1",
    surface_mutations: [
      "Replace channel with river crossing; swap 24/12/4 for proportional triple preserving outbound faster than return",
      "Rephrase stem without copying sentence skeleton",
    ],
    invariant_assertions: [
      "measured_skill unchanged: relative speed round trip",
      "solution_skeleton phase types unchanged",
      "critical_signal role: return reverses current effect",
      "distractor mechanism ids per slot family preserved",
    ],
    operand_constraints: [
      "Still-water speed > current speed so both legs have positive ground speed",
      "Total time not equal to still-water-only time (keeps A trap alive)",
    ],
    distractor_regeneration: [
      {
        slot: "A",
        mechanism_id: "MECH_CONCEPT_SWAP",
        parameter_notes: "48 km at still-water rate only",
      },
      {
        slot: "C",
        mechanism_id: "MECH_READ",
        parameter_notes: "Use favorable ground speed for both 24 km segments",
      },
      {
        slot: "D",
        mechanism_id: "MECH_SPECIAL_CASE",
        parameter_notes: "Use unfavorable ground speed for both segments",
      },
    ],
    anti_copy_notes:
      "Do not reuse ‘parallel to the crossing’ clause verbatim; keep round-trip + current parallelism in equivalent rhetorical position (late stem).",
  },
  expected_pedagogical_family: "AR_RELATIVE_SPEED_ROUNDTRIP / relative-rate round trip with misconception traps on averaging",
  good_bad_examples: [
    {
      label: "GOOD",
      stem_excerpt:
        "A swimmer crosses 0.5 km pool lane and back; still 2 m/s, current 0.4 m/s along the lane…",
      why: "Different surface; same two-leg relative-rate structure and trap families.",
    },
    {
      label: "BAD_SURFACE",
      stem_excerpt: "Ferry 24 km, 12 km/h, current 4 km/h — how long one way?",
      why: "Collapses to single leg; reasoning_steps band violated (T3 mechanism collapse).",
    },
    {
      label: "BAD_MECHANISM",
      stem_excerpt: "Same numbers but stem states average speed for round trips is the arithmetic mean of leg speeds.",
      why: "Removes hidden constraint and makes MECH_CONCEPT_SWAP the correct path (T3).",
    },
  ],
  distractor_causality: [
    {
      choice_label: "A",
      choice_text: "240 minutes",
      mechanism_id: "MECH_CONCEPT_SWAP",
      trap_type_ids: ["TRAP_CONCEPT_SWAP"],
      misconception_id: "misc_still_water_speed_for_whole_trip",
      steps: [
        "Total distance 48 km",
        "Use still-water speed 12 km/h for entire trip",
        "48 ÷ 12 = 4 h → 240 min",
      ],
      produces_value: "240 minutes",
    },
    {
      choice_label: "C",
      choice_text: "180 minutes",
      mechanism_id: "MECH_READ",
      trap_type_ids: ["TRAP_READ", "TRAP_CONCEPT_SWAP"],
      misconception_id: "misc_same_ground_speed_both_legs",
      steps: [
        "Compute outbound ground speed 16 km/h",
        "Assume return is also 16 km/h",
        "24/16 + 24/16 = 3 h → 180 min",
      ],
      produces_value: "180 minutes",
    },
    {
      choice_label: "D",
      choice_text: "360 minutes",
      mechanism_id: "MECH_SPECIAL_CASE",
      trap_type_ids: ["TRAP_CONCEPT_SWAP"],
      misconception_id: "misc_unfavorable_speed_both_legs",
      steps: [
        "Compute upstream ground speed 8 km/h",
        "Misread stem as current opposes both legs",
        "24/8 + 24/8 = 6 h → 360 min",
      ],
      produces_value: "360 minutes",
    },
  ],
  expected_solver: {
    correct_label: "B",
    correct_value_summary: "270 minutes (4.5 h total)",
    reasoning_phase_count: 5,
    independent_solver_should_match: true,
  },
  expected_verifier: {
    aggregate: "APPROVE",
    trivial_codes: [],
    dimension_findings: [
      { dimension: "solution_skeleton", verdict: "PRESERVED", note: "Five phases with dual model legs" },
      { dimension: "distractor_mechanisms", verdict: "PRESERVED", note: "Three documented error paths" },
      { dimension: "hidden_constraint", verdict: "PRESERVED", note: "Return leg opposes current without extra hint" },
    ],
  },
  evidence_notes: [
    "Golden expert lock — supersedes draft-inference placeholders for any ferry-like derivative.",
    "Distractor A is also reachable via arithmetic mean of leg speeds (related misconception misc_arithmetic_mean_of_rates) but primary path is still-water-only.",
  ],
};
