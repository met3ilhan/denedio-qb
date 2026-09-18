import { describe, expect, it } from "vitest";

import { verifyDistractorCausality } from "@/modules/verification/services/distractor-causality";
import { distractorAnalysisSchema } from "@/shared/validation/distractor-analysis";
import { SCHEMA_VERSION } from "@/shared/validation/primitives";
import { generatedQuestionSchema } from "@/shared/validation/generated-question";

const question = generatedQuestionSchema.parse({
  schemaVersion: SCHEMA_VERSION,
  stem: {
    questionText:
      "A ferry crosses 24 km at 12 km/h in still water with a 4 km/h current parallel to the crossing. Round trip minutes?",
  },
  choices: [
    { label: "A", text: "240 minutes", isCorrect: false },
    { label: "B", text: "270 minutes", isCorrect: true },
    { label: "C", text: "180 minutes", isCorrect: false },
    { label: "D", text: "360 minutes", isCorrect: false },
  ],
  solution: { solutionText: "270 minutes total." },
  provenance: {
    sourceQuestionId: "sq",
    fingerprintVersionId: "fv",
    generationRunId: "gr",
    mutationPlanId: "mp",
  },
});

const baseDistractor = distractorAnalysisSchema.parse({
  schemaVersion: SCHEMA_VERSION,
  wrong_choices: [
    {
      choice_label: "A",
      mechanism_id: "MECH_PARTIAL",
      misconception_id: "still_water_only",
      trap_type_ids: ["TRAP_PARTIAL"],
      steps: [{ order: 1, student_action: "Uses 12 km/h for both legs without current adjustment" }],
      produces_value: "240 minutes",
    },
  ],
  all_mechanisms_from_fingerprint: true,
});

describe("distractor expert edits and causality", () => {
  it("contradicts when produces_value no longer matches choice", () => {
    const edited = distractorAnalysisSchema.parse({
      ...baseDistractor,
      wrong_choices: [
        {
          ...baseDistractor.wrong_choices[0],
          produces_value: "999 minutes",
        },
      ],
    });
    const findings = verifyDistractorCausality(question, edited);
    expect(findings.some((f) => f.state === "CONTRADICTED")).toBe(true);
  });

  it("can regain supported state when produces_value aligns", () => {
    const findings = verifyDistractorCausality(question, baseDistractor);
    expect(findings.some((f) => f.choice_label === "A" && f.state !== "CONTRADICTED")).toBe(true);
  });
});
