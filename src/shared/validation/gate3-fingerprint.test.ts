import { describe, expect, it } from "vitest";

import { buildSampleMutationPlan } from "@/modules/generation/domain/mutation-plan-template";
import { GenerationBlockedError, GenerationRepository } from "@/modules/generation/repository/generation-repository";
import {
  isFingerprintVersionImmutable,
  mergeMutableFingerprintUpdate,
} from "@/modules/fingerprints/repository/fingerprint-repository";
import { inferFingerprintDraftFromExtraction } from "@/modules/fingerprints/services/draft-inference";
import { SYNTHETIC_RIVER_FIXTURE } from "@/shared/ai/fixtures/synthetic-river-problem";
import { mutationPlanSchema } from "@/shared/validation/mutation-plan";
import { pedagogicalFingerprintSchema } from "@/shared/validation/pedagogical-fingerprint";
import { previewTrivialMutationFlags } from "@/shared/validation/trivial-mutation";

describe("PedagogicalFingerprintSchema", () => {
  it("round-trips inferred draft fixture", async () => {
    const draft = await inferFingerprintDraftFromExtraction(
      SYNTHETIC_RIVER_FIXTURE.extraction,
      "test-source-question",
    );
    expect(() => pedagogicalFingerprintSchema.parse(draft.payload)).not.toThrow();
    expect(draft.evidenceRows.length).toBeGreaterThan(0);
  });
});

describe("MutationPlanSchema W2 partial invariant_assertions", () => {
  it("rejects plans missing core invariant assertion dimensions", () => {
    expect(() =>
      mutationPlanSchema.parse({
        schemaVersion: "2026-09-18-gate1",
        fingerprint_ref: "cltest123",
        surface_mutations: [{ dimension: "context", description: "Change setting" }],
        invariant_assertions: [
          { dimension: "measured_skill", assertion: "same skill", expected: "same skill class" },
        ],
        operand_constraints: "keep integers small",
        distractor_regeneration: [
          {
            choice_slot: "A",
            mechanism_id: "MECH_PARTIAL",
            misconception_id: "misc_a",
            parameter_notes: "partial",
          },
        ],
        anti_copy_notes: "Reword stem with new names while preserving mechanism structure and signal.",
      }),
    ).toThrow();
  });

  it("accepts sample plan with full core assertions", () => {
    const plan = buildSampleMutationPlan("clfingerprintversion");
    expect(mutationPlanSchema.parse(plan)).toBeTruthy();
  });
});

describe("Fingerprint lock immutability", () => {
  it("treats LOCKED versions as immutable", () => {
    expect(isFingerprintVersionImmutable("LOCKED")).toBe(true);
    expect(isFingerprintVersionImmutable("DRAFT")).toBe(false);
  });

  it("blocks invariant field mutation in merge helper", async () => {
    const draft = (
      await inferFingerprintDraftFromExtraction(SYNTHETIC_RIVER_FIXTURE.extraction, "sq1")
    ).payload;
    expect(() =>
      mergeMutableFingerprintUpdate(draft, { measured_skill: "different skill" }),
    ).toThrow(/invariant/i);
  });

  it("allows mutable_surface_notes updates", async () => {
    const draft = (
      await inferFingerprintDraftFromExtraction(SYNTHETIC_RIVER_FIXTURE.extraction, "sq1")
    ).payload;
    const next = mergeMutableFingerprintUpdate(draft, {
      mutable_surface_notes: "Updated notes for surface dressing.",
    });
    expect(next.mutable_surface_notes).toContain("Updated notes");
  });
});

describe("Generation lock guard", () => {
  it("blocks generation when fingerprint is not LOCKED", () => {
    const repo = new GenerationRepository({} as never);
    expect(() => repo.assertGenerationAllowed("DRAFT")).toThrow(GenerationBlockedError);
    expect(() => repo.assertGenerationAllowed(undefined)).toThrow(GenerationBlockedError);
    expect(() => repo.assertGenerationAllowed("LOCKED")).not.toThrow();
  });
});

describe("Trivial mutation preview", () => {
  it("flags numbers-only surface mutations (T1)", () => {
    const plan = buildSampleMutationPlan("clv1");
    const t1Plan = {
      ...plan,
      surface_mutations: [{ dimension: "numbers" as const, description: "Scale literals only" }],
    };
    const flags = previewTrivialMutationFlags(t1Plan);
    expect(flags.some((f) => f.code === "T1")).toBe(true);
  });
});
