import seed from "./data/catalog-mirror.seed.json";
import {
  type CatalogMirrorSnapshot,
  type CurriculumSelection,
  catalogMirrorSnapshotSchema,
} from "./catalog-mirror-schema";

let cached: CatalogMirrorSnapshot | null = null;

export function loadCatalogMirror(): CatalogMirrorSnapshot {
  if (!cached) {
    cached = catalogMirrorSnapshotSchema.parse(seed);
  }
  return cached;
}

export function resetCatalogMirrorCache() {
  cached = null;
}

export function trapSlugToUuid(slug: string, mirror = loadCatalogMirror()): string | null {
  const hit = mirror.trapTypes.find((t) => t.slug === slug && t.active);
  return hit?.id ?? null;
}

export function resolveTrapUuid(
  studioTrapSlug: string,
  overrides: Record<string, string> = {},
  mirror = loadCatalogMirror(),
): string | null {
  const override = overrides[studioTrapSlug];
  if (override) return override;
  return trapSlugToUuid(studioTrapSlug, mirror);
}

export function isValidUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export function assertCurriculumChain(
  selection: CurriculumSelection,
  mirror = loadCatalogMirror(),
): { ok: true } | { ok: false; message: string } {
  const exam = mirror.examTypes.find((e) => e.id === selection.examTypeId && e.active);
  if (!exam) return { ok: false, message: "examTypeId not found in catalog mirror" };

  const section = exam.sections.find((s) => s.id === selection.examSectionId && s.active);
  if (!section) return { ok: false, message: "examSectionId not in exam type" };

  const subject = section.subjects.find((s) => s.id === selection.subjectId && s.active);
  if (!subject) return { ok: false, message: "subjectId not in section" };

  const topic = subject.topics.find((t) => t.id === selection.topicId && t.active);
  if (!topic) return { ok: false, message: "topicId not in subject" };

  if (selection.unitId) {
    const unit = topic.units.find((u) => u.id === selection.unitId && u.active);
    if (!unit) return { ok: false, message: "unitId not in topic" };
    if (selection.outcomeId) {
      const outcome = unit.outcomes.find((o) => o.id === selection.outcomeId && o.active);
      if (!outcome) return { ok: false, message: "outcomeId not in unit" };
    }
  } else if (selection.outcomeId) {
    const outcome = topic.outcomes.find((o) => o.id === selection.outcomeId && o.active);
    if (!outcome) return { ok: false, message: "outcomeId not in topic" };
  }

  return { ok: true };
}

export function listCatalogTree(mirror = loadCatalogMirror()) {
  return mirror;
}

export function defaultCurriculumSelection(mirror = loadCatalogMirror()): CurriculumSelection {
  return { ...mirror.defaults };
}
