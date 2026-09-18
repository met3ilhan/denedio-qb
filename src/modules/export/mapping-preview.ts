import type { PrismaClient } from "@/shared/db/client";
import { generatedQuestionSchema } from "@/shared/validation/generated-question";

import { defaultCurriculumSelection } from "@/modules/catalog";
import { mapApprovedQuestionToImportItem, curriculumFromMapping } from "./denedio-mapper";
import { parseStoredDenedioFieldMapping } from "./denedio-field-mapping";

export async function buildMappingPreview(db: PrismaClient, generatedQuestionId: string) {
  const question = await db.generatedQuestion.findUnique({
    where: { id: generatedQuestionId },
    include: {
      versions: { orderBy: { versionNumber: "desc" }, take: 1 },
      denedioMapping: true,
    },
  });
  if (!question || question.versions.length === 0) {
    return null;
  }

  const content = generatedQuestionSchema.parse(question.versions[0].content);
  const mappingRow = question.denedioMapping;
  const curriculum = mappingRow
    ? curriculumFromMapping(parseStoredDenedioFieldMapping(mappingRow))
    : defaultCurriculumSelection();

  const trapTypeMap =
    (mappingRow?.trapTypeMap as Record<string, string> | null | undefined) ?? {};

  const preview = mapApprovedQuestionToImportItem({
    question: content,
    curriculum,
    importExternalKey: question.importExternalKey,
    trapTypeMap,
    questionArchetypeId: mappingRow?.questionArchetypeId ?? undefined,
  });

  return {
    mapping: mappingRow,
    fieldRows: preview.fieldRows,
    itemPreview: preview.item,
  };
}
