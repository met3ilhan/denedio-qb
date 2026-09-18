import type { DenedioFieldMapping } from "@prisma/client";
import { z } from "zod";

import { uuid } from "@/shared/validation/primitives";

export const denedioFieldMappingSchema = z
  .object({
    examTypeId: uuid,
    examSectionId: uuid,
    subjectId: uuid,
    topicId: uuid,
    unitId: uuid.optional(),
    outcomeId: uuid.optional(),
    questionArchetypeId: uuid.optional(),
    trapTypeMap: z.record(z.string(), uuid).default({}),
  })
  .strict();

export type DenedioFieldMappingInput = z.infer<typeof denedioFieldMappingSchema>;

export function parseStoredDenedioFieldMapping(row: DenedioFieldMapping): DenedioFieldMappingInput {
  return denedioFieldMappingSchema.parse({
    examTypeId: row.examTypeId,
    examSectionId: row.examSectionId,
    subjectId: row.subjectId,
    topicId: row.topicId,
    unitId: row.unitId ?? undefined,
    outcomeId: row.outcomeId ?? undefined,
    questionArchetypeId: row.questionArchetypeId ?? undefined,
    trapTypeMap: (row.trapTypeMap as Record<string, string> | null) ?? {},
  });
}
