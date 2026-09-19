import { describe, expect, it } from "vitest";

import { SCHEMA_VERSION } from "@/shared/validation/primitives";
import { sourceExtractionSchema } from "@/shared/validation/source-extraction";

import { normalizeGeminiFingerprintPayload } from "./normalize-gemini-fingerprint";

const baseExtraction = sourceExtractionSchema.parse({
  schemaVersion: SCHEMA_VERSION,
  sourceQuestionKey: "hist-1",
  stemText: "Kurtuluş Savaşı sırasında aşağıdakilerden hangisi doğrudur?",
  choices: [
    { label: "A", text: "Yanlış 1" },
    { label: "B", text: "Doğru", isCorrect: true },
    { label: "C", text: "Yanlış 2" },
    { label: "D", text: "Yanlış 3" },
  ],
  blocks: [
    {
      blockId: "stem",
      type: "stem",
      text: "Kurtuluş Savaşı sırasında aşağıdakilerden hangisi doğrudur?",
      confidence: 0.9,
      page: 1,
    },
  ],
});

/** Shape observed in LIVE smoke Zod failures (503 retry path succeeded; schema failed). */
const liveLikeGeminiRaw = {
  measured_skill: "Tarihsel olayları hatırlama",
  learning_objective: "Kurtuluş Savaşı dönemi bilgisi",
  cognitive_operation: "recall",
  reasoning_pattern: "stem_recall",
  solution_skeleton: [
    {
      phase_id: 1,
      operation_type: "parse",
      depends_on: null,
      critical_substep: "yes",
      description: "Read the stem",
    },
    {
      phase_id: 2,
      operation_type: "infer",
      depends_on: 1,
      critical_substep: "no",
      description: "Select matching fact",
    },
  ],
  critical_signal: { role: "Time period cue", surface_form_notes: "Kurtuluş Savaşı" },
  hidden_constraint: null,
  reasoning_steps: { min: "2", max: "4" },
  information_order: "Stem then options",
  calculation_burden: "none",
  language_burden: "medium",
  visual_reasoning_burden: "none",
  distractor_mechanisms: [
    {
      slot: "A",
      mechanism_id: "MECH_MISCONCEPTION",
      trap_type_ids: ["TRAP_MISCONCEPTION", "trap_concept_swap"],
      misconception_id: "misc_a",
      summary: "Wrong era",
    },
    {
      slot: "C",
      mechanism_id: "mech_read",
      trap_type_ids: ["TRAP_READING"],
      misconception_id: "misc_c",
      summary: "Misread",
    },
    {
      slot: "D",
      mechanism_id: "MECH_PARTIAL",
      trap_type_ids: ["TRAP_PARTIAL"],
      misconception_id: "misc_d",
      summary: "Partial truth",
    },
  ],
  misconception_targets: ["Confusing dates", "Confusing actors"],
  trap_types: ["trap_concept_swap", "TRAP_MISCONCEPTION"],
  elimination_opportunities: ["Remove anachronisms"],
  difficulty_factors: [{ factor: "recall_load", weight: "primary" }],
  expected_solve_time_seconds: { min: 60, max: 90 },
  question_archetype: { archetype_id: "AR_HISTORY_RECALL", version: 1, label: "Tarih hatırlama" },
  mutable_surface_notes: "Names and dates may change",
};

describe("normalizeGeminiFingerprintPayload", () => {
  it("normalizes LIVE-like Gemini quirks into canonical PedagogicalFingerprint", () => {
    const payload = normalizeGeminiFingerprintPayload(
      liveLikeGeminiRaw,
      baseExtraction,
      "preview-source",
    );

    expect(payload.solution_skeleton[0]?.phase_id).toBe("1");
    expect(Array.isArray(payload.solution_skeleton[0]?.depends_on)).toBe(true);
    expect(typeof payload.solution_skeleton[0]?.critical_substep).toBe("boolean");
    expect(payload.hidden_constraint).toMatch(/NOT_APPLICABLE/);
    expect(payload.calculation_burden).toBe("none");
    expect(payload.visual_reasoning_burden).toBe("none");
    expect(payload.distractor_mechanisms.length).toBe(3);
    for (const mech of payload.distractor_mechanisms) {
      expect(mech.mechanism_id).toMatch(/^MECH_/);
      expect(mech.trap_type_ids.length).toBeGreaterThan(0);
      mech.trap_type_ids.forEach((t) => expect(t).toMatch(/^TRAP_/));
    }
    expect(payload.trap_types.every((t) => t.startsWith("TRAP_"))).toBe(true);
    expect(payload.measured_skill.toLowerCase()).not.toContain("kayak");
  });

  it("uses domain fallback when measured_skill is blank whitespace", () => {
    const payload = normalizeGeminiFingerprintPayload(
      { ...liveLikeGeminiRaw, measured_skill: "   " },
      baseExtraction,
      "preview-source",
    );
    expect(payload.measured_skill).toBe("NOT_ANALYZED");
  });

  it("uses defaults for missing solution_skeleton", () => {
    const payload = normalizeGeminiFingerprintPayload(
      { ...liveLikeGeminiRaw, solution_skeleton: [] },
      baseExtraction,
      "preview-source",
    );
    expect(payload.solution_skeleton.length).toBeGreaterThan(0);
    expect(payload.solution_skeleton[0]?.operation_type).toBe("parse");
  });
});
