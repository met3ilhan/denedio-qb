import { z } from "zod";

import { validateChoiceInvariants } from "./choices";
import { mechanismId, trapTypeId } from "./pedagogy-enums";
import { choiceLabel, nonEmptyTrimmed, schemaVersion } from "./primitives";

const studioId = z.string().min(1);

export const generatedChoiceSchema = z.object({
  label: choiceLabel,
  text: z.string().max(5000),
  isCorrect: z.boolean(),
  assetRef: z.string().max(500).optional(),
  assetAltText: z.string().max(500).optional(),
  mechanism_id: mechanismId.optional(),
  trap_type_ids: z.array(trapTypeId).optional(),
  misconception_id: z.string().max(200).optional(),
  error_path_id: z.string().optional(),
});

export const generatedQuestionSchema = z
  .object({
    schemaVersion,
    studioQuestionId: studioId.optional(),
    stem: z.object({
      questionText: z.string().min(1).max(20_000),
      mediaRefs: z.array(z.string()).optional(),
    }),
    choices: z.array(generatedChoiceSchema).min(2).max(5),
    solution: z.object({
      solutionText: z.string().min(1).max(20_000),
      videoSolutionUrl: z.string().url().max(500).or(z.literal("")).optional(),
    }),
    metadata: z
      .object({
        expectedSolveTimeSeconds: z.number().int().min(10).max(3600).optional(),
        criticalClue: z.string().max(2000).optional(),
        idealApproach: z.string().max(5000).optional(),
        commonMistake: z.string().max(2000).optional(),
        strategyExplanation: z.string().max(5000).optional(),
        postExamTip: z.string().max(2000).optional(),
        cognitiveSkill: z.string().max(200).optional(),
        difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).optional(),
      })
      .optional(),
    provenance: z.object({
      sourceQuestionId: studioId,
      fingerprintVersionId: studioId,
      generationRunId: studioId,
      mutationPlanId: studioId,
    }),
  })
  .strict()
  .superRefine((val, ctx) => {
    validateChoiceInvariants(val.choices, ctx);
  });

export type GeneratedQuestion = z.infer<typeof generatedQuestionSchema>;
export type GeneratedChoice = z.infer<typeof generatedChoiceSchema>;

export function wrongChoices(question: GeneratedQuestion) {
  return question.choices.filter((c) => !c.isCorrect);
}

export function correctChoiceLabel(question: GeneratedQuestion): string {
  const correct = question.choices.find((c) => c.isCorrect);
  return correct?.label ?? "A";
}
