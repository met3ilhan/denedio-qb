import { z } from "zod";

import { validateChoiceInvariants } from "./choices";
import { choiceLabel, schemaVersion, uuid } from "./primitives";

const denedioDifficulty = z.enum(["EASY", "MEDIUM", "HARD"]);

const denedioDistractor = z.object({
  trapTypeId: uuid,
  distractorExplanation: z.string().trim().min(1).max(2000).optional(),
  targetMisconception: z.string().trim().min(1).max(1000).optional(),
});

const denedioChoice = z.object({
  label: choiceLabel,
  text: z.string().trim().max(5000),
  isCorrect: z.boolean(),
  assetStorageKey: z.string().trim().min(1).max(500).optional(),
  assetAltText: z.string().trim().max(500).optional(),
  distractor: denedioDistractor.optional(),
});

const denedioQuestionContent = z.object({
  questionText: z.string().trim().min(1).max(20_000),
  solutionText: z.string().trim().min(1).max(20_000),
  choices: z.array(denedioChoice).min(2).max(5),
  videoSolutionUrl: z.string().url().max(500).or(z.literal("")).optional(),
  expectedSolveTimeSeconds: z.number().int().min(10).max(3600).optional(),
  criticalClue: z.string().trim().max(2000).optional(),
  idealApproach: z.string().trim().max(5000).optional(),
  commonMistake: z.string().trim().max(2000).optional(),
  strategyExplanation: z.string().trim().max(5000).optional(),
  postExamTip: z.string().trim().max(2000).optional(),
  cognitiveSkill: z.string().trim().max(200).optional(),
  questionArchetypeId: uuid.optional(),
});

export const importQuestionItemSchema = z
  .object({
    examTypeId: uuid,
    examSectionId: uuid,
    subjectId: uuid,
    topicId: uuid,
    unitId: uuid.optional(),
    outcomeId: uuid.optional(),
    difficulty: denedioDifficulty,
    externalKey: z.string().trim().min(1).max(200).optional(),
    content: denedioQuestionContent,
  })
  .strict()
  .superRefine((val, ctx) => {
    validateChoiceInvariants(
      val.content.choices.map((c) => ({
        label: c.label,
        text: c.text,
        isCorrect: c.isCorrect,
        assetStorageKey: c.assetStorageKey,
      })),
      ctx,
      ["content", "choices"],
    );
    val.content.choices.forEach((c, i) => {
      if (c.isCorrect && c.distractor) {
        ctx.addIssue({
          code: "custom",
          path: ["content", "choices", i, "distractor"],
          message: "distractor on correct choice",
        });
      }
      if (!c.isCorrect && c.distractor && !c.distractor.trapTypeId) {
        ctx.addIssue({
          code: "custom",
          path: ["content", "choices", i, "distractor", "trapTypeId"],
          message: "trapTypeId required when distractor present",
        });
      }
    });
  });

export const questionImportPayloadSchema = z
  .object({
    schemaVersion,
    items: z.array(importQuestionItemSchema).min(1).max(200),
  })
  .strict()
  .superRefine((val, ctx) => {
    const keys = val.items.map((i) => i.externalKey).filter(Boolean) as string[];
    const dup = keys.find((k, idx) => keys.indexOf(k) !== idx);
    if (dup) {
      ctx.addIssue({
        code: "custom",
        message: `duplicate externalKey in batch: ${dup}`,
      });
    }
  });

export const denedioWireImportSchema = z.object({
  items: z.array(importQuestionItemSchema).min(1).max(200),
});

export type ImportQuestionItem = z.infer<typeof importQuestionItemSchema>;
export type QuestionImportPayload = z.infer<typeof questionImportPayloadSchema>;

export function toDenedioWirePayload(payload: QuestionImportPayload) {
  return denedioWireImportSchema.parse({ items: payload.items });
}
