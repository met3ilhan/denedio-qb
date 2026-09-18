import type { CurriculumSelection } from "@/modules/catalog";
import { loadCatalogMirror, resolveTrapUuid } from "@/modules/catalog";
import type { DenedioFieldMappingInput } from "@/modules/export/denedio-field-mapping";
import type { GeneratedQuestion } from "@/shared/validation/generated-question";
import {
  type ImportQuestionItem,
  type QuestionImportPayload,
  questionImportPayloadSchema,
} from "@/shared/validation/question-import-payload";
import { SCHEMA_VERSION } from "@/shared/validation/primitives";

export type MappingFieldStatus = "confirmed" | "proposed";

export type MappingFieldRow = {
  field: string;
  status: MappingFieldStatus;
  value: string | null;
  note?: string;
};

export type MapApprovedQuestionInput = {
  question: GeneratedQuestion;
  curriculum: CurriculumSelection;
  importExternalKey: string;
  trapTypeMap?: Record<string, string>;
  questionArchetypeId?: string;
};

export function mapApprovedQuestionToImportItem(
  input: MapApprovedQuestionInput,
): { item: ImportQuestionItem; fieldRows: MappingFieldRow[] } {
  const mirror = loadCatalogMirror();
  const trapMap = input.trapTypeMap ?? {};
  const difficulty = input.question.metadata?.difficulty ?? "MEDIUM";
  const archetypeId = input.questionArchetypeId;

  const choices = input.question.choices.map((choice) => {
    const base = {
      label: choice.label,
      text: choice.text.trim(),
      isCorrect: choice.isCorrect,
      assetStorageKey: choice.assetRef?.trim() || undefined,
      assetAltText: choice.assetAltText?.trim() || undefined,
    };

    if (choice.isCorrect) {
      return base;
    }

    const studioTrap = choice.trap_type_ids?.[0];
    let distractor: ImportQuestionItem["content"]["choices"][number]["distractor"];

    if (studioTrap) {
      const trapUuid = resolveTrapUuid(studioTrap, trapMap, mirror);
      if (trapUuid) {
        distractor = {
          trapTypeId: trapUuid,
          targetMisconception: choice.misconception_id?.slice(0, 1000),
          distractorExplanation: choice.error_path_id
            ? `Studio error path: ${choice.error_path_id}`
            : undefined,
        };
      }
    }

    return { ...base, distractor };
  });

  const content: ImportQuestionItem["content"] = {
    questionText: input.question.stem.questionText.trim(),
    solutionText: input.question.solution.solutionText.trim(),
    choices,
    videoSolutionUrl: input.question.solution.videoSolutionUrl,
    expectedSolveTimeSeconds: input.question.metadata?.expectedSolveTimeSeconds,
    criticalClue: input.question.metadata?.criticalClue,
    idealApproach: input.question.metadata?.idealApproach,
    commonMistake: input.question.metadata?.commonMistake,
    strategyExplanation: input.question.metadata?.strategyExplanation,
    postExamTip: input.question.metadata?.postExamTip,
    cognitiveSkill: input.question.metadata?.cognitiveSkill,
    questionArchetypeId: archetypeId,
  };

  const item: ImportQuestionItem = {
    examTypeId: input.curriculum.examTypeId,
    examSectionId: input.curriculum.examSectionId,
    subjectId: input.curriculum.subjectId,
    topicId: input.curriculum.topicId,
    unitId: input.curriculum.unitId,
    outcomeId: input.curriculum.outcomeId,
    difficulty,
    externalKey: input.importExternalKey,
    content,
  };

  const fieldRows: MappingFieldRow[] = [
    { field: "examTypeId", status: "confirmed", value: item.examTypeId },
    { field: "examSectionId", status: "confirmed", value: item.examSectionId },
    { field: "subjectId", status: "confirmed", value: item.subjectId },
    { field: "topicId", status: "confirmed", value: item.topicId },
    { field: "externalKey", status: "confirmed", value: item.externalKey ?? null },
    { field: "difficulty", status: "confirmed", value: item.difficulty },
    {
      field: "questionArchetypeId",
      status: archetypeId ? "confirmed" : "proposed",
      value: archetypeId ?? null,
      note: archetypeId ? undefined : "Optional — pick on S16/S17",
    },
    {
      field: "distractor.trapTypeId",
      status: trapStatusForChoices(choices),
      value: null,
      note: "Studio TRAP_* → catalog mirror UUID per wrong choice",
    },
    {
      field: "stem/solution assets",
      status: "proposed",
      value: null,
      note: "QuestionAsset not in bulk import — upload in Denedio after draft",
    },
  ];

  return { item, fieldRows };
}

function trapStatusForChoices(
  choices: ImportQuestionItem["content"]["choices"],
): MappingFieldStatus {
  const wrong = choices.filter((c) => !c.isCorrect);
  if (wrong.length === 0) return "proposed";
  const allMapped = wrong.every((c) => c.distractor?.trapTypeId);
  return allMapped ? "confirmed" : "proposed";
}

export function buildQuestionImportPayload(
  input: MapApprovedQuestionInput,
): QuestionImportPayload {
  const { item } = mapApprovedQuestionToImportItem(input);
  return questionImportPayloadSchema.parse({
    schemaVersion: SCHEMA_VERSION,
    items: [item],
  });
}

export function curriculumFromMapping(mapping: DenedioFieldMappingInput): CurriculumSelection {
  return {
    examTypeId: mapping.examTypeId,
    examSectionId: mapping.examSectionId,
    subjectId: mapping.subjectId,
    topicId: mapping.topicId,
    unitId: mapping.unitId,
    outcomeId: mapping.outcomeId,
  };
}
