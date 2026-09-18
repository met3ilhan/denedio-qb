# Denedio field mapping matrix (V1)

Studio field → Denedio model/field → transformation → required → catalog → validation → export

| Studio field | Denedio field | Transformation | Required | Catalog dependency | Validation | Export |
|--------------|---------------|----------------|----------|-------------------|------------|--------|
| `importExternalKey` | `Question.importExternalKey` / item `externalKey` | `qs:{candidateId}` stable | Yes | None | Unique in Studio DB | Always |
| `stem.questionText` | `content.questionText` | Trim | Yes | None | Zod + non-empty | After S17 mapping + dry-run PASS |
| `solution.solutionText` | `content.solutionText` | Trim | Yes | None | Zod | Same |
| `solution.videoSolutionUrl` | `content.videoSolutionUrl` | URL or omit | No | None | URL Zod | Same |
| `metadata.difficulty` | item `difficulty` | Enum map | Yes (Denedio) | None | EASY/MEDIUM/HARD default MEDIUM | Same |
| `metadata.expectedSolveTimeSeconds` | `content.expectedSolveTimeSeconds` | int | No | None | Range | Same |
| `metadata.criticalClue` | `content.criticalClue` | string | No | None | max length | Same |
| `metadata.idealApproach` | `content.idealApproach` | string | No | None | max length | Same |
| `metadata.commonMistake` | `content.commonMistake` | string | No | None | max length | Same |
| `metadata.strategyExplanation` | `content.strategyExplanation` | string | No | None | max length | Same |
| `metadata.postExamTip` | `content.postExamTip` | string | No | None | max length | Same |
| `metadata.cognitiveSkill` | `content.cognitiveSkill` | string | No | None | max length | Same |
| `choices[].label/text/isCorrect` | `content.choices[]` | 1:1 | Yes | None | `validateChoiceInvariants` | Same |
| `choices[].assetRef` | `content.choices[].assetStorageKey` | Rename | No | None | string | Same |
| `choices[].misconception_id` | `distractor.targetMisconception` | truncate 1000 | No | None | string | Wrong choices only |
| `trap_type_ids` / MECH | `distractor.trapTypeId` | `resolveTrapUuid` + S17 `trapTypeMap` | When distractor present | **Mirror UUID** (`catalog-mirror.seed.json`) | Mirror FK in dry-run | Missing → omit distractor or TRAP_UUID error |
| S17 `examTypeId`…`topicId` | item curriculum UUIDs | Direct | Yes | **Mirror** | `assertCurriculumChain` | `MISSING_MAPPING` if no S17 row |
| S17 `questionArchetypeId` | `content.questionArchetypeId` | UUID | No | Mirror archetypes | ARCHETYPE_UUID in dry-run | Optional |
| `mechanism_id`, `error_path_id` | — | **Not exported** | — | — | Studio-only pedagogy | Never |

Implementation: `src/modules/export/denedio-mapper.ts`, eligibility `export-eligibility.ts`, dry-run `dry-run.ts`.
