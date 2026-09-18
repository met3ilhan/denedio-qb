import type { GenerationFamilyCandidate } from "./types";

/**
 * Five golden generation-family candidates anchored on
 * `golden-math-ferry-current-roundtrip` (STRONGEST math).
 * Used by Verifier regression for Gates 3–4.
 */
export const GOLDEN_GENERATION_FAMILY_FERRY: GenerationFamilyCandidate[] = [
  {
    kind: "GOOD",
    parent_fingerprint_id: "golden-math-ferry-current-roundtrip",
    stem_text:
      "A rescue boat crosses a 2 km channel and returns on the same heading. Still-water speed 10 km/h; " +
      "along-channel current 5 km/h. How many minutes for the round trip?",
    choices: [
      { label: "A", text: "24 minutes" },
      { label: "B", text: "32 minutes", isCorrect: true },
      { label: "C", text: "16 minutes" },
      { label: "D", text: "48 minutes" },
    ],
    mutation_plan_summary:
      "Surface: boat/channel; operands 2 km / 10 / 5 km/h (legs 8 min + 24 min). Invariants: round trip, relative rates, trap families A=still-water-only, C=fast leg both ways, D=slow leg both ways.",
    expected_verifier: {
      aggregate: "APPROVE",
      trivial_codes: [],
      dimension_findings: [
        { dimension: "solution_skeleton", verdict: "PRESERVED", note: "Dual-leg relative rates" },
        { dimension: "distractor_mechanisms", verdict: "PRESERVED", note: "Mapped MECH_* families" },
      ],
    },
  },
  {
    kind: "TOO-SIMILAR",
    parent_fingerprint_id: "golden-math-ferry-current-roundtrip",
    stem_text:
      "A ferry crosses a straight channel that is 24 km wide. In still water the ferry travels at 12 km/h. " +
      "A constant current of 4 km/h runs parallel to the crossing. The ferry goes across and returns along the same line. " +
      "How many minutes does the full round trip take?",
    choices: [
      { label: "A", text: "240 minutes" },
      { label: "B", text: "270 minutes", isCorrect: true },
      { label: "C", text: "180 minutes" },
      { label: "D", text: "360 minutes" },
    ],
    mutation_plan_summary: "Operand permutation only; stem isomorphic to source (T1/T6).",
    expected_verifier: {
      aggregate: "REJECT",
      trivial_codes: ["REJECT_TRIVIAL", "REJECT_SIBLING"],
      dimension_findings: [
        { dimension: "mutable_surface", verdict: "DRIFT", note: "No meaningful surface mutation" },
      ],
    },
  },
  {
    kind: "DRIFTED",
    parent_fingerprint_id: "golden-math-ferry-current-roundtrip",
    stem_text:
      "A ferry crosses 24 km at 12 km/h in still water with a 4 km/h current helping the entire trip both ways. " +
      "How many minutes for the one-way crossing?",
    choices: [
      { label: "A", text: "90 minutes" },
      { label: "B", text: "100 minutes", isCorrect: true },
      { label: "C", text: "120 minutes" },
      { label: "D", text: "150 minutes" },
    ],
    mutation_plan_summary: "Collapsed to one leg; current direction error baked into stem (T3 mechanism collapse).",
    expected_verifier: {
      aggregate: "REJECT",
      trivial_codes: ["REJECT_MECHANISM"],
      dimension_findings: [
        { dimension: "reasoning_steps", verdict: "DRIFT", note: "Band collapsed to 1–2 phases" },
        { dimension: "hidden_constraint", verdict: "DRIFT", note: "Round-trip reversal removed" },
      ],
    },
  },
  {
    kind: "BAD-DISTRACTOR",
    parent_fingerprint_id: "golden-math-ferry-current-roundtrip",
    stem_text:
      "A ferry crosses 24 km and returns; still water 12 km/h, current 4 km/h parallel to travel. Round trip time?",
    choices: [
      { label: "A", text: "241 minutes" },
      { label: "B", text: "270 minutes", isCorrect: true },
      { label: "C", text: "269 minutes" },
      { label: "D", text: "271 minutes" },
    ],
    mutation_plan_summary: "Wrong options are nearby integers without documented error paths (T4).",
    expected_verifier: {
      aggregate: "REJECT",
      trivial_codes: ["REJECT_DISTRACTOR"],
      dimension_findings: [
        { dimension: "distractor_mechanisms", verdict: "DRIFT", note: "No replayable MECH_* paths for A,C,D" },
      ],
    },
  },
  {
    kind: "SOLVER-MISMATCH",
    parent_fingerprint_id: "golden-math-ferry-current-roundtrip",
    stem_text:
      "A ferry crosses 24 km and returns; still water 12 km/h, current 4 km/h parallel. How many minutes round trip?",
    choices: [
      { label: "A", text: "240 minutes" },
      { label: "B", text: "180 minutes", isCorrect: true },
      { label: "C", text: "270 minutes" },
      { label: "D", text: "360 minutes" },
    ],
    mutation_plan_summary:
      "Answer key marks B but independent solver yields 270 min (C) — key/solver disagreement; causality metadata still claims B.",
    expected_verifier: {
      aggregate: "REJECT",
      trivial_codes: ["REJECT_MECHANISM"],
      dimension_findings: [
        { dimension: "solution_skeleton", verdict: "UNVERIFIED", note: "Solver trace conflicts with keyed answer" },
        { dimension: "distractor_mechanisms", verdict: "UNVERIFIED", note: "Cannot attest PRESERVED without solver agreement" },
      ],
    },
  },
];
