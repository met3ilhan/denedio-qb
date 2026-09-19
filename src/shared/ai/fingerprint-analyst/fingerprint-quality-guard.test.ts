import { describe, expect, it } from "vitest";

import { findGenericFingerprintIssues, isAcceptableLiveFingerprint } from "./fingerprint-quality-guard";
import type { PedagogicalFingerprint } from "@/shared/validation/pedagogical-fingerprint";

function minimalFingerprint(overrides: Partial<PedagogicalFingerprint>): PedagogicalFingerprint {
  return {
    schemaVersion: "2026-09-18-gate1",
    measured_skill: "Osmanlı belge türlerini işlevlerine göre ayırt etme",
    learning_objective: "Adaletnâme kavramını haksızlık giderme işlevinden tanıma",
    cognitive_operation: "concept_recognition",
    reasoning_pattern: "işlev tanımı → belge adı eşlemesi",
    solution_skeleton: [
      {
        phase_id: "p1",
        operation_type: "parse",
        depends_on: [],
        critical_substep: true,
        description: "Kökteki yönetici haksızlığı giderme işlevini oku",
      },
    ],
    critical_signal: { role: "haksızlık giderme", surface_form_notes: "memurlar" },
    hidden_constraint: "NOT_APPLICABLE",
    reasoning_steps: { min: 2, max: 3 },
    information_order: "Kök → seçenekler",
    calculation_burden: "none",
    language_burden: "medium",
    visual_reasoning_burden: "none",
    distractor_mechanisms: [
      {
        slot: "A",
        mechanism_id: "MECH_CONCEPT_SWAP",
        trap_type_ids: ["TRAP_CONCEPT_SWAP"],
        misconception_id: "m1",
        summary: "Ahidnâme ile karıştırma",
      },
    ],
    misconception_targets: ["Belge türü karışıklığı"],
    trap_types: ["TRAP_CONCEPT_SWAP"],
    elimination_opportunities: ["Farklı işlev"],
    difficulty_factors: [{ factor: "terminoloji", weight: "primary" }],
    expected_solve_time_seconds: { min: 20, max: 40 },
    question_archetype: {
      archetype_id: "AR_HIST_TERM",
      version: "1",
      label: "Tarihsel kavram — işlevden tanıma",
    },
    ...overrides,
  } as PedagogicalFingerprint;
}

describe("fingerprint quality guard", () => {
  it("rejects English generic placeholders", () => {
    const bad = minimalFingerprint({
      measured_skill: "Skill derived from source stem",
    });
    expect(isAcceptableLiveFingerprint(bad)).toBe(false);
    expect(findGenericFingerprintIssues(bad).some((i) => i.reason === "generic_placeholder")).toBe(true);
  });

  it("accepts specific Turkish fingerprint", () => {
    const good = minimalFingerprint({});
    expect(isAcceptableLiveFingerprint(good)).toBe(true);
  });
});
