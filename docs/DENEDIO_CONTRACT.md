# Denedio Contract

## Status

**ANALYZED (Gate 1)** — Read-only inspection of `C:\Users\PC\Desktop\sinav` on 2026-09-18. Denedio repo was not modified.

## Purpose

Single source for Question Studio ↔ Denedio field mapping, enums, import shapes, and validation rules.

---

## Gate 1 answers (import safety)

| Question | Answer (from source) |
|----------|----------------------|
| **Safe import API for external automation?** | **No dedicated public HTTP bulk-import API.** Bulk import is implemented as Next.js **server actions** (`previewQuestionImportAction`, `importQuestionsAction`) posting JSON in FormData field `payload`. Underlying services: `previewQuestionImport`, `persistQuestionImport` in `src/modules/questions/application/question-import-service.ts`. Existing HTTP routes under `src/app/api/questions/` are for **media upload/delivery** on an existing draft, not JSON import. |
| **Dry-run / preview?** | **Yes.** `previewQuestionImport` validates Zod + choice invariants + duplicate `externalKey` within the batch; **no DB writes**. UI: `/admin/sorular/import` → “Önizleme” via `previewQuestionImportAction`. Preview does **not** run `assertValidCurriculumSelection`, `assertTrapTypesExist`, or `assertArchetypeExists` (those run only on persist). |
| **`importExternalKey` usage?** | Import JSON field **`externalKey`** (optional) → persisted on **`Question.importExternalKey`** (`prisma/schema.prisma`). Unique when non-null. On retry, existing row is **skipped** (idempotent); `persistQuestionImport` returns `skippedExternalKeys`. Single-create path `createQuestion` also accepts `externalKey` and returns existing question if key matches (`question-service.ts`). |
| **Mandatory import fields?** | Per item: `examTypeId`, `examSectionId`, `subjectId`, `topicId`, `difficulty`, `content.questionText`, `content.solutionText`, `content.choices` (2–5). Optional: `unitId`, `outcomeId`, `externalKey`, and all optional `content.*` metadata fields in Zod. |
| **Auto-generatable metadata?** | **Server-set on import:** `Question.id` (UUID), `status` = `DRAFT`, `createdById` = actor, `QuestionVersion.versionNumber` = 1, `workingVersionId`, timestamps. **Not in import payload:** review fields, `approvedVersionId`, provenance/licensing (none in schema). **Do not invent:** `trapTypeId` / `questionArchetypeId` — must be real UUIDs in DB if provided. |
| **Catalog ID requirements?** | Curriculum references are **UUIDs only** in Zod (`z.uuid()`). Must form a valid active chain: exam type → section → subject → topic (and optional unit/outcome under topic) — validated at persist by `assertValidCurriculumSelection` (`src/modules/curriculum/application/curriculum-service.ts`). Slugs exist on catalog models but are **not** accepted in import/create schemas. |
| **Missing Denedio capabilities (for Question Studio)?** | No REST/service-token bulk import; no CSV importer in `src/modules/questions` (MASTER_SPEC mentions CSV; UI is JSON only). Import cannot attach **`QuestionAsset`** stem/solution rows — only **`QuestionChoice.assetStorageKey`** (pre-existing object storage keys). Preview omits DB FK checks. Batch max **200** items; requires **`QUESTION_REVIEW`** permission (not `QUESTION_CREATE` alone). No dedicated source/provenance field on `Question`. |

---

## Mapping table (Question Studio concepts)

| Concept | Actual Denedio field / model | Type | Required / optional | Source path | Notes for Question Studio |
|---------|------------------------------|------|---------------------|-------------|---------------------------|
| Import batch | `{ items: ImportQuestionItem[] }` | Zod object | Required wrapper; `items` min 1, max 200 | `src/modules/questions/validation/schemas.ts` → `importQuestionsSchema` | Emit one JSON document matching this shape for Denedio admin import UI or future API wrapper. |
| Idempotency key (payload) | `externalKey` on each item | `string` 1–200 trim | Optional | `schemas.ts` → `importQuestionItemSchema` | Maps to DB column below; unique per batch in preview. |
| Idempotency key (DB) | `Question.importExternalKey` | `String?` `@unique` | Optional | `prisma/schema.prisma` → `Question` | Searchable in question lists (`question-service.ts` list search). |
| Exam type | `Question.examTypeId` / item `examTypeId` | UUID | Required | `schema.prisma`, `curriculumSelectionSchema` | Resolve Studio catalog → Denedio UUID via curriculum APIs/lists, not slug in payload. |
| Exam section | `Question.examSectionId` / item `examSectionId` | UUID | Required | Same | Must belong to selected exam type (persist validation). |
| Subject | `Question.subjectId` / item `subjectId` | UUID | Required | Same | |
| Topic | `Question.topicId` / item `topicId` | UUID | Required | Same | |
| Unit | `Question.unitId` / item `unitId` | UUID | Optional | Same | Validated against topic when present. |
| Outcome | `Question.outcomeId` / item `outcomeId` | UUID | Optional | Same | Validated against unit when present. |
| Difficulty | `Question.difficulty` / item `difficulty` | `QuestionDifficulty` enum | Required | `schema.prisma` enum; `questionDifficultySchema` | Values: `EASY`, `MEDIUM`, `HARD`. |
| Workflow status | `Question.status` | `QuestionStatus` | Set by server | `schema.prisma`; import sets `DRAFT` | `createQuestionInTransaction` — not in import JSON. |
| Stem text | `QuestionVersion.questionText` / `content.questionText` | string 1–20_000 | Required | `questionContentSchema`, `schema.prisma` | Supports multiline / math text in product; no separate rich-text type. |
| Solution text | `QuestionVersion.solutionText` / `content.solutionText` | string 1–20_000 | Required | Same | |
| Video solution URL | `QuestionVersion.videoSolutionUrl` / `content.videoSolutionUrl` | URL max 500 or `""` | Optional | `questionContentSchema` | Empty string coerced to null in `buildVersionData`. |
| Expected solve time | `QuestionVersion.expectedSolveTimeSeconds` / `content.expectedSolveTimeSeconds` | int 10–3600 | Optional | Same | |
| Critical clue | `QuestionVersion.criticalClue` / `content.criticalClue` | string max 2000 | Optional | Same | |
| Ideal approach | `QuestionVersion.idealApproach` / `content.idealApproach` | string max 5000 | Optional | Same | |
| Common mistake | `QuestionVersion.commonMistake` / `content.commonMistake` | string max 2000 | Optional | Same | |
| Strategy explanation | `QuestionVersion.strategyExplanation` / `content.strategyExplanation` | string max 5000 | Optional | Same | |
| Post-exam tip | `QuestionVersion.postExamTip` / `content.postExamTip` | string max 2000 | Optional | Same | |
| Cognitive skill | `QuestionVersion.cognitiveSkill` / `content.cognitiveSkill` | string max 200 | Optional | Same | Free string, not enum in schema. |
| Question archetype | `QuestionVersion.questionArchetypeId` / `content.questionArchetypeId` | UUID | Optional | `schema.prisma` → `QuestionArchetype`; `assertArchetypeExists` | Must reference active `QuestionArchetype.id`. |
| Choice label | `QuestionChoice.label` / `choices[].label` | `"A"`–`"E"` | Required per choice | `QUESTION_CHOICE_LABELS`, `choiceInputSchema` | Count 2–5; labels must be consecutive from A (`validateChoiceInvariants`). |
| Choice order | `QuestionChoice.order` | int | Server | `buildVersionData` | Set to `index + 1`; do not send in import JSON. |
| Choice text | `QuestionChoice.text` / `choices[].text` | string max 5000 | Required unless image-only | `choiceInputSchema` | Trim allowed empty if `assetStorageKey` set. |
| Choice image | `QuestionChoice.assetStorageKey` / `choices[].assetStorageKey` | string 1–500 | Optional | `schema.prisma`, `choiceInputSchema` | Key must already exist in object storage; upload via author APIs after draft exists if needed. |
| Choice image alt | `QuestionChoice.assetAltText` / `choices[].assetAltText` | string max 500 | Optional | Same | |
| Correct flag | `QuestionChoice.isCorrect` / `choices[].isCorrect` | boolean | Required | `validateChoiceInvariants` | Exactly one `true` per question. |
| Distractor trap type | `QuestionChoiceDistractorMetadata.trapTypeId` / `choices[].distractor.trapTypeId` | UUID | Required if `distractor` on wrong choice | `distractorMetadataSchema`, `schema.prisma` | Forbidden on correct choice. Validated via `assertTrapTypesExist`. |
| Distractor explanation | `…distractorExplanation` / `choices[].distractor.distractorExplanation` | string 1–2000 | Optional | Same | |
| Target misconception | `…targetMisconception` / `choices[].distractor.targetMisconception` | string 1–1000 | Optional | Same | |
| Stem figure (version asset) | `QuestionAsset` purpose `stem` | model + `storageKey`, etc. | Not in import JSON | `question-asset-purpose.ts`, `QuestionAsset` model | Upload via `POST /api/questions/[questionId]/media` after question exists. |
| Solution figure (version asset) | `QuestionAsset` purpose `solution` | same | Not in import JSON | Same | Not exam-visible (`isExamVisibleQuestionAsset`). |
| Author | `Question.createdById` | UUID | Server | Import uses authenticated actor | Studio cannot set arbitrary author via import schema. |
| Version number | `QuestionVersion.versionNumber` | int | Server (=1 on create) | `createQuestionInTransaction` | |

### Import item JSON shape (confirmed)

Each `items[]` element equals **`createQuestionSchema`** plus optional **`externalKey`** — flat curriculum keys at top level, nested **`content`**:

```json
{
  "items": [
    {
      "examTypeId": "<uuid>",
      "examSectionId": "<uuid>",
      "subjectId": "<uuid>",
      "topicId": "<uuid>",
      "unitId": "<uuid optional>",
      "outcomeId": "<uuid optional>",
      "difficulty": "EASY | MEDIUM | HARD",
      "externalKey": "<string optional>",
      "content": {
        "questionText": "...",
        "solutionText": "...",
        "choices": [
          {
            "label": "A",
            "text": "...",
            "isCorrect": true,
            "assetStorageKey": "...",
            "assetAltText": "...",
            "distractor": {
              "trapTypeId": "<uuid>",
              "distractorExplanation": "...",
              "targetMisconception": "..."
            }
          }
        ],
        "videoSolutionUrl": "...",
        "expectedSolveTimeSeconds": 120,
        "criticalClue": "...",
        "idealApproach": "...",
        "commonMistake": "...",
        "strategyExplanation": "...",
        "postExamTip": "...",
        "cognitiveSkill": "...",
        "questionArchetypeId": "<uuid>"
      }
    }
  ]
}
```

Reference tests: `src/modules/questions/fixtures/realistic-content.test.ts`, `question-import-service.integration.test.ts`.

### Import behavior (confirmed)

| Step | Behavior | Source |
|------|----------|--------|
| Preview | Zod parse → per-row `validateChoiceInvariants` → duplicate `externalKey` in batch | `question-import-service.ts` |
| Persist gate | Preview must have zero issues | Same |
| Pre-transaction | `assertValidCurriculumSelection`, `assertTrapTypesExist`, `assertArchetypeExists` per item | Same + `question-service.ts` |
| Transaction | All-or-nothing; skip existing `importExternalKey`; else `createQuestionInTransaction` | Same |
| Permission | `QUESTION_REVIEW` | `previewQuestionImport`, `persistQuestionImport`, actions |

---

## CONFIRMED FROM DENEDIO SOURCE

- **Prisma:** `Question`, `QuestionVersion`, `QuestionChoice`, `QuestionChoiceDistractorMetadata`, `QuestionAsset`, `QuestionArchetype`, `TrapType`, curriculum models — `prisma/schema.prisma`.
- **Enums:** `QuestionStatus`, `QuestionDifficulty` — `prisma/schema.prisma` (lines 44–56 area).
- **Zod:** `questionContentSchema`, `createQuestionSchema`, `importQuestionsSchema`, `importQuestionItemSchema`, `validateChoiceInvariants` — `src/modules/questions/validation/schemas.ts`.
- **Create/import persistence:** `buildVersionData`, `createQuestionInTransaction`, `createQuestion` — `src/modules/questions/application/question-service.ts`.
- **Bulk import:** `previewQuestionImport`, `persistQuestionImport` — `src/modules/questions/application/question-import-service.ts`.
- **UI/actions:** `previewQuestionImportAction`, `importQuestionsAction` — `src/modules/questions/application/actions.ts`; page `src/app/admin/sorular/import/page.tsx`.
- **Curriculum validation:** `assertValidCurriculumSelection` — `src/modules/curriculum/application/curriculum-service.ts`.
- **Version assets (stem/solution):** `QUESTION_ASSET_PURPOSE` — `src/modules/questions/domain/question-asset-purpose.ts`; HTTP `src/app/api/questions/[questionId]/media/route.ts`.
- **Choice media HTTP:** `src/app/api/questions/[questionId]/choices/[label]/media/route.ts`.
- **Migration for import key:** `prisma/migrations/20260916153000_question_import_external_key/migration.sql`.
- **MASTER_SPEC** §56 describes CSV/JSON import and preview at product level — `docs/MASTER_SPEC.md` (implementation in codebase is JSON bulk import only in questions module).

---

## PROPOSED FOR QUESTION STUDIO

*(Not present in Denedio source; requires Architect/Orchestrator decision.)*

- **Machine-facing import:** Thin authenticated API (or shared service module) wrapping `previewQuestionImport` / `persistQuestionImport` for Question Studio pipeline — Denedio today only exposes this through admin server actions + session auth.
- **Slug-based curriculum in import:** Map Studio human-readable slugs to UUIDs in the QB export step; Denedio import contract stays UUID-only.
- **Stem/solution asset bundling:** Pre-upload media to Denedio object storage and either reference keys in a follow-up API pass or extend import DTO (would be a Denedio product change).
- **Provenance / license / Studio question ID:** Store in `externalKey` convention (e.g. `qs:{id}`) until a first-class field exists — `importExternalKey` is the only stable external identifier on `Question`.
- **Preview parity:** Optional enhancement in Denedio to run curriculum/trap/archetype checks during preview so UI dry-run matches persist failures.
- **CSV import:** Align with MASTER_SPEC or drop from Studio export targets until implemented in Denedio.

---

## Question Studio implementation (P20 mapper review)

**Reviewed:** 2026-09-18 — branch `build/question-studio-v1`, commit through `6bd1741`.

**Verdict:** P20 **not implemented** in `denedio-qb` (no mapper module, no `QuestionImportPayload` Zod in `src/`, no S17 route). `src/modules/export/README.md` is a stub only. Spec target: `docs/AI_SCHEMAS.md` § QuestionImportPayloadSchema + `GeneratedQuestion` in `src/shared/validation/generated-question.ts`.

**Wire payload (Denedio admin import):** `{ "items": [ …importQuestionItem… ] }` only — no `schemaVersion` (CONFIRMED Denedio shape: `importQuestionsSchema` in `sinav` `schemas.ts`).

**Field-level export mapping (Studio source → Denedio import item):**

| Denedio export field | CONFIRMED / PROPOSED | Studio source / note |
|----------------------|----------------------|----------------------|
| `items[]` | **CONFIRMED** | Batch wrapper; max 200 (`importQuestionsSchema`). |
| `schemaVersion` (wrapper) | **PROPOSED** | Studio-only; strip before paste/import (`ARCHITECTURE.md`). |
| `examTypeId`, `examSectionId`, `subjectId`, `topicId` | **CONFIRMED** keys | Values from `DenedioFieldMapping` / catalog mirror (P19) — not in mapper code yet. |
| `unitId`, `outcomeId` | **CONFIRMED** optional | Same UUID mirror. |
| `difficulty` | **CONFIRMED** | Denedio **required**; Studio `metadata.difficulty` optional — mapper must require or block export. |
| `externalKey` | **CONFIRMED** field | Value convention `qs:{studioQuestionId}` — **PROPOSED** (D-008); maps to `Question.importExternalKey`. |
| `content.questionText` | **CONFIRMED** | `stem.questionText`. |
| `content.solutionText` | **CONFIRMED** | `solution.solutionText`. |
| `content.videoSolutionUrl` | **CONFIRMED** | `solution.videoSolutionUrl` (URL or `""`). |
| `content.expectedSolveTimeSeconds`, `criticalClue`, `idealApproach`, `commonMistake`, `strategyExplanation`, `postExamTip`, `cognitiveSkill` | **CONFIRMED** | `metadata.*` when present. |
| `content.questionArchetypeId` | **CONFIRMED** optional | UUID from mirror; Studio has no archetype field on `GeneratedQuestion`. |
| `content.choices[].label`, `text`, `isCorrect` | **CONFIRMED** | `choices[]`; same invariants as Denedio (`validateChoiceInvariants`). |
| `content.choices[].assetStorageKey`, `assetAltText` | **CONFIRMED** names | Studio uses `assetRef` — rename at map time (**PROPOSED** Studio alias only; Denedio key is confirmed). |
| `content.choices[].distractor.trapTypeId` | **CONFIRMED** | Denedio `z.uuid()` (`TrapType.id`); Studio `trap_type_ids` / `mechanism_id` are **PROPOSED** pedagogy enums — must not be emitted verbatim. |
| `content.choices[].distractor.distractorExplanation` | **CONFIRMED** optional | No dedicated Studio field; map from editorial copy or omit. |
| `content.choices[].distractor.targetMisconception` | **CONFIRMED** optional | Candidate: `misconception_id` (string, not UUID in Studio). |
| `content.choices[].order` | **CONFIRMED** server | Omit from export JSON. |
| `Question.status`, `createdById`, version ids | **CONFIRMED** server | Omit. |
| `stem.mediaRefs[]` | **PROPOSED** gap | Denedio `QuestionAsset` (stem/solution) — post-create media APIs only; not in import JSON. |
| `provenance.*`, `studioQuestionId` | **PROPOSED** | Not in Denedio import; fold id into `externalKey` only. |
| `error_path_id`, `mechanism_id`, `trap_type_ids[]` | **PROPOSED** Studio-only | Do not export; use for internal trap UUID lookup (P19/W5). |

**Parity check (2026-09-18):** `docs/AI_SCHEMAS.md` `QuestionImportPayloadSchema` matches `sinav` `importQuestionItemSchema` + `questionContentSchema` + choice/distractor shapes. **Not yet codified** in `src/shared/validation/` (P21 dry-run depends on P20).

Detail, blockers, and acceptance checklist: `docs/DENEDIO_IMPORT_GAP.md`.

---

## Change policy

Only **denedio-contract-reader** agent updates confirmed sections from source reads.

Architect and Implementer consume this doc; they do not invent Denedio fields without marking PROPOSED.
