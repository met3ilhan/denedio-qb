import { describe, expect, it } from "vitest";

import { shouldInvalidateVerification } from "@/modules/candidates/services/edit-invalidation";
import type { GeneratedQuestion } from "@/shared/validation/generated-question";

const base: GeneratedQuestion = {
  schemaVersion: "2026-09-18-gate1",
  stem: { questionText: "Original stem text for the ferry problem." },
  choices: [
    { label: "A", text: "1", isCorrect: true },
    { label: "B", text: "2", isCorrect: false },
    { label: "C", text: "3", isCorrect: false },
    { label: "D", text: "4", isCorrect: false },
  ],
  solution: { solutionText: "Solve with relative speed." },
  metadata: { criticalClue: "current", difficulty: "MEDIUM" },
  provenance: {
    sourceQuestionId: "sq",
    fingerprintVersionId: "fv",
    generationRunId: "gr",
    mutationPlanId: "mp",
  },
};

describe("shouldInvalidateVerification", () => {
  it("invalidates on stem change", () => {
    expect(
      shouldInvalidateVerification(base, { stemText: "Edited stem text for the ferry problem." }, false),
    ).toBe(true);
  });

  it("invalidates on correct answer change", () => {
    const choices = base.choices.map((c) => ({ ...c, isCorrect: c.label === "B" }));
    expect(shouldInvalidateVerification(base, { choices }, false)).toBe(true);
  });

  it("invalidates on solution change", () => {
    expect(
      shouldInvalidateVerification(base, { solutionText: "Different solution path." }, false),
    ).toBe(true);
  });

  it("invalidates on critical signal change", () => {
    expect(
      shouldInvalidateVerification(base, { metadata: { criticalClue: "changed" } }, false),
    ).toBe(true);
  });

  it("invalidates on distractor analysis change flag", () => {
    expect(shouldInvalidateVerification(base, {}, true)).toBe(true);
  });

  it("does not invalidate on noop save", () => {
    expect(shouldInvalidateVerification(base, {}, false)).toBe(false);
  });
});
