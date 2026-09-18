import { z } from "zod";

import { schemaVersion, uuid } from "@/shared/validation/primitives";

const catalogNodeBase = z.object({
  id: uuid,
  slug: z.string().min(1),
  name: z.string().min(1),
  active: z.boolean(),
});

const outcomeNode = catalogNodeBase;
const unitNode = catalogNodeBase.extend({
  outcomes: z.array(outcomeNode),
});

const topicNode = catalogNodeBase.extend({
  units: z.array(unitNode),
  outcomes: z.array(outcomeNode),
});

const subjectNode = catalogNodeBase.extend({
  topics: z.array(topicNode),
});

const sectionNode = catalogNodeBase.extend({
  subjects: z.array(subjectNode),
});

const examTypeNode = catalogNodeBase.extend({
  sections: z.array(sectionNode),
});

export const catalogMirrorSnapshotSchema = z
  .object({
    schemaVersion,
    fetchedAt: z.string().datetime(),
    source: z.string().min(1),
    examTypes: z.array(examTypeNode).min(1),
    trapTypes: z.array(catalogNodeBase).min(1),
    questionArchetypes: z.array(catalogNodeBase),
    defaults: z.object({
      examTypeId: uuid,
      examSectionId: uuid,
      subjectId: uuid,
      topicId: uuid,
    }),
  })
  .strict();

export type CatalogMirrorSnapshot = z.infer<typeof catalogMirrorSnapshotSchema>;

export type CurriculumSelection = {
  examTypeId: string;
  examSectionId: string;
  subjectId: string;
  topicId: string;
  unitId?: string;
  outcomeId?: string;
};
