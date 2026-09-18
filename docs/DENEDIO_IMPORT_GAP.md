# Denedio import gap (Studio dry-run vs persist)

Question Studio validates exports **locally** against `docs/DENEDIO_CONTRACT.md` and the **catalog mirror seed** (`src/modules/catalog/data/catalog-mirror.seed.json`). Denedio production is **not** queried from Studio (D-007).

## Checks Studio dry-run runs (S18)

| Check | Parity with Denedio `previewQuestionImport` |
|-------|---------------------------------------------|
| `QuestionImportPayloadSchema` / import item Zod | Yes — aligned with `importQuestionsSchema` |
| `validateChoiceInvariants` (labels, one correct, text or asset) | Yes |
| Duplicate `externalKey` within batch | Yes |
| Curriculum UUID chain vs **catalog mirror** | Studio extension (preview omits DB FK) |
| `trapTypeId` / `questionArchetypeId` vs mirror | Studio extension (persist uses live DB) |

## Checks only at Denedio persist (documented gap)

| Check | Denedio source |
|-------|----------------|
| `assertValidCurriculumSelection` | `curriculum-service.ts` |
| `assertTrapTypesExist` | `question-import-service.ts` |
| `assertArchetypeExists` | `question-import-service.ts` |
| `QUESTION_REVIEW` permission | import actions |
| `QuestionAsset` stem/solution upload | media routes after draft exists |

## Idempotency

- Studio assigns stable `GeneratedQuestion.importExternalKey` (convention `qs:{candidateId}` today).
- Wire export uses `externalKey` on each import item.
- Denedio `persistQuestionImport` **skips** rows when `importExternalKey` already exists; Studio models this in `partitionImportItemsByExistingKey` and dry-run info issue `IDEMPOTENT_SKIP`.

## Publishing

V1 UI exposes **download bundle only**; **Publish to Denedio** is disabled. Operators use Denedio admin JSON import with the downloaded `{ items: [...] }` payload.

## Refreshing catalog mirror

Replace or version the seed JSON snapshot (OQ-1). No Denedio DB connection required.
