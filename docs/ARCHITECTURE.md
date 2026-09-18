# Architecture — Question Studio

## Status

**DEFINED (Gate 1 Architect)** — Spec-only. No application scaffold, no Prisma files, and no Denedio database connection in this repo until Implementer Gate 2+.

## Summary

Question Studio is a **modular monolith**: one deployable Next.js application with **domain modules** behind clear boundaries, shared infrastructure, and strict validation at module edges. It owns the full expert workflow (source → fingerprint → generation → verification → export) and emits **Denedio-shaped import JSON** without connecting to Denedio production data stores.

| Layer | Choice |
|-------|--------|
| App framework | Next.js **App Router** (React, TypeScript) |
| Styling | Tailwind CSS (tokens from `docs/DESIGN_SYSTEM.md`) |
| Validation | **Zod** at all AI and API boundaries (`docs/AI_SCHEMAS.md`) |
| Persistence | **PostgreSQL** via **Prisma** (schema lives in Implementer phase; not in Gate 1 repo) |
| Package manager | **pnpm** |
| Unit / integration tests | **Vitest** |
| E2E | **Playwright** (Gate 9 UX flows) |

---

## Architectural goals

1. **Pedagogy-first data model** — Separate **source evidence** from **generated catalog items**; never treat the source stem as the export artifact.
2. **Auditability** — Every approved item carries a **provenance chain**: source → fingerprint version → generation run → mutation plan → candidate → solver → verifier → approval → export payload.
3. **Contract fidelity** — Export payloads match confirmed Denedio import shapes in `docs/DENEDIO_CONTRACT.md` (UUID curriculum, choice invariants, optional `externalKey`).
4. **Safety** — No Denedio DB connection; idempotent export keys; independent solver path isolated from generator providers.
5. **Evolvability** — AI **provider abstraction** so models and hosts can change without rewriting domain logic.

---

## Modular monolith layout (target)

Implementer creates this structure; names are normative for Gate 2+.

```
src/
  app/                          # Routes, layouts, server actions (thin)
  modules/
    missions/                   # Mission thread (UX S01–S18 aggregate)
    sources/                    # Upload, extraction jobs, SourceQuestion
    fingerprints/               # PedagogicalFingerprint versions, lock
    generation/                 # GenerationRun, MutationPlan, candidates
    questions/                  # GeneratedQuestion, QuestionVersion
    verification/               # SolverRun, VerifierRun, findings
    catalog/                    # Read-only Denedio taxonomy mirror
    export/                     # Payload map, dry-run, export bundles
    audit/                      # Immutable provenance events
  shared/
    ai/                         # Provider interfaces + registry
    db/                         # Prisma client (when added)
    validation/                 # Zod schemas (from AI_SCHEMAS)
    storage/                    # Object storage for source PDFs, assets
```

**Rules:**

- **Domain logic** lives under `modules/*/domain` and `modules/*/application`; routes only orchestrate.
- **Cross-module calls** go through application services or explicit ports — no deep imports of another module’s Prisma models from UI.
- **AI stages** invoke `shared/ai` providers; they do not embed vendor SDKs in domain entities.

---

## Core domain separation: SourceQuestion vs GeneratedQuestion

| Concept | Purpose | Lifecycle | Exported to Denedio? |
|---------|---------|-----------|----------------------|
| **SourceQuestion** | Canonical record for one **reference item** extracted from an uploaded source (stem, choices, media refs, extraction quality). | Created after extraction acceptance (S05); immutable content except re-extraction → new extraction revision. | **No** — evidence and provenance only. |
| **GeneratedQuestion** | Studio-owned **assessment item** produced from an approved fingerprint + mutation plan; may become the catalog record after approval. | Born as **candidate**; promoted to **GeneratedQuestion** on approval (S13); versions track editorial changes. | **Yes** — via `QuestionImportPayload` after mapping (S17–S18). |

**Invariant:** A GeneratedQuestion MUST reference:

- `sourceQuestionId` (provenance),
- `pedagogicalFingerprintVersionId` (mechanism lock),
- `generationRunId` + `mutationPlanId` (for generated path),
- optional `approvedQuestionVersionId` (current published version).

Source text MUST NOT be copied into export without passing **similarity/originality** checks (see `docs/AI_PIPELINE.md` quality gate).

---

## Entity model (conceptual)

### Intake & source

| Entity | Key fields | Notes |
|--------|------------|-------|
| `SourceFile` | id, storageKey, mime, checksum, uploadedAt | Virus/size policy at upload. |
| `ExtractionJob` | id, sourceFileId, status, attempts, structuredOutputRef | Async worker; UX S04. |
| `SourceQuestion` | id, sourceFileId, extractionJobId, acceptedAt, `structured` (SourceExtractionSchema) | One logical item per reference question in source. |
| `SourceQuestionRevision` | id, sourceQuestionId, revision, structured, reason | Re-extraction or expert correction to structured blocks only. |

### Mechanism

| Entity | Key fields | Notes |
|--------|------------|-------|
| `PedagogicalFingerprint` | id, sourceQuestionId | Container for versions. |
| `PedagogicalFingerprintVersion` | id, fingerprintId, versionNumber, status DRAFT\|LOCKED, `payload` (PedagogicalFingerprintSchema), lockedAt, lockedBy | Generation blocked until LOCKED. |
| `FingerprintEvidence` | id, versionId, dimensionKey, evidenceType, pointer, excerpt | Supports S06–S07 evidence panel. |

### Generation

| Entity | Key fields | Notes |
|--------|------------|-------|
| `GenerationRun` | id, missionId, fingerprintVersionId, status, providerRefs, startedAt, completedAt | UX S09 timeline. |
| `MutationPlan` | id, generationRunId, fingerprintVersionId, `payload` (MutationPlanSchema) | Required per candidate (`QUESTION_GENERATION_RULES`). |
| `GeneratedQuestionCandidate` | id, runId, mutationPlanId, status, `draft` (GeneratedQuestionSchema) | Pre-approval sibling; UX S10–S11. |

### Catalog item (approved)

| Entity | Key fields | Notes |
|--------|------------|-------|
| `GeneratedQuestion` | id, candidateId?, sourceQuestionId, fingerprintVersionId, status DRAFT\|APPROVED\|ARCHIVED, `importExternalKey` | Stable `importExternalKey` for Denedio idempotency. |
| `QuestionVersion` | id, generatedQuestionId, versionNumber, `content` (GeneratedQuestionSchema), createdBy, createdAt | Immutable versions; new edit → new version. |
| `ApprovalRecord` | id, questionVersionId, approverId, comment, checklistSnapshot | S13 sign-off. |

### Verification

| Entity | Key fields | Notes |
|--------|------------|-------|
| `SolverRun` | id, candidateId or questionVersionId, providerRef, independentOfGenerationRunId, `result` (SolverResultSchema) | **Must not** reuse generation run’s model config. |
| `VerifierRun` | id, targetType, targetId, `result` (VerificationResultSchema) | Aggregates rules + fingerprint fidelity. |

### Export & catalog mirror

| Entity | Key fields | Notes |
|--------|------------|-------|
| `CatalogMirrorSnapshot` | id, fetchedAt, payload | Cached Denedio curriculum UUID tree — **read-only**, no prod DB. |
| `DenedioFieldMapping` | id, generatedQuestionId, mappedCurriculumIds, trapTypeIds, archetypeId | S17; UUIDs only in export. |
| `ExportAttempt` | id, generatedQuestionId, dryRunResult, payloadHash, exportExternalKey | S18 audit. |

### Cross-cutting

| Entity | Key fields | Notes |
|--------|------------|-------|
| `Mission` | id, phase, title, ownerId, artifactRefs | UX workflow thread S01. |
| `AuditEvent` | id, missionId?, entityType, entityId, action, actorId, metadata, at | Provenance strip + S15. |

---

## Versioning rules

| Artifact | Versioning strategy |
|----------|---------------------|
| Structured source | `SourceQuestionRevision` increments on re-extract or structured fix. |
| Fingerprint | Integer `versionNumber`; **invariant change** → new version + re-verify dependents. |
| Generated question content | `QuestionVersion.versionNumber` monotonic; approval pins `approvedVersionId`. |
| Export payload | Derived from approved version + mapping; hash stored on `ExportAttempt`. |
| AI prompts / templates | Semantic version string stored on `GenerationRun` / stage records (reproducibility). |

---

## Generation provenance (required chain)

Every **GeneratedQuestionCandidate** and approved **QuestionVersion** MUST be reconstructable from:

```
SourceQuestion (accepted)
  → PedagogicalFingerprintVersion (LOCKED)
  → GenerationRun
  → MutationPlan (1:1 with candidate minimum)
  → GeneratedQuestionSchema (draft)
  → SolverRun (independent provider)
  → VerifierRun (VerificationResultSchema)
  → [optional expert edits] → QuestionVersion
  → QuestionImportPayloadSchema (export)
```

Persist **model id**, **prompt template id + version**, and **input/output schema version** on each AI stage row. UI provenance strip reads from `AuditEvent` + stage foreign keys.

### Pedagogical anti-collapse (normative)

Architecture MUST NOT admit a **paraphrase-only** path. Implementer guards:

| Forbidden shortcut | Required alternative |
|--------------------|----------------------|
| Source structured text → generated stem/export without fingerprint + plan | Full chain in [Generation provenance](#generation-provenance-required-chain) |
| `generateQuestion` without persisted `MutationPlan` row | Stage 3 plan persisted; Stage 4 blocked if `mutationPlanId` missing or `fingerprint_ref` ≠ locked version |
| Source stem as **primary** LLM input for generation (Stage 4) | `IGenerationProvider.generateQuestion` inputs: **MutationPlan + fingerprint only**; source appears in Verifier copy checks (Stage 7), not generation provider contract |
| Approval/export with incomplete provenance on candidate | `GeneratedQuestionSchema.provenance` required at persistence; verifier emits `MUTATION_PLAN_MISSING` → **FAIL** |

Product principle: **controlled mutation of locked fingerprint**, not rewrite of source (`docs/QUESTION_GENERATION_RULES.md`).

---

## Import payload & Denedio boundary

Question Studio **does not** connect to the Denedio production database (extends D-002).

| Concern | Architecture |
|---------|----------------|
| Payload shape | `QuestionImportPayloadSchema` mirrors Denedio `importQuestionsSchema` (`docs/DENEDIO_CONTRACT.md`). Studio adds optional `schemaVersion` for internal blobs; **wire payload to Denedio admin import is `{ items: [...] }` only** (strip wrapper). |
| Curriculum IDs | UUIDs from **catalog mirror** (API/sync TBD); slug resolution happens in Studio before export. |
| Dry-run | **Local validator** implements Denedio preview rules (Zod + full `validateChoiceInvariants` including text-or-`assetStorageKey` per choice + batch duplicate `externalKey`). Optional future: authenticated call to Denedio `previewQuestionImport` — still no DB connection from Studio. |
| Persist to Denedio | Out of scope for Studio runtime — human or automation posts JSON via Denedio admin import; Studio produces the bundle. |
| Stem/solution assets | Not in bulk import JSON; follow-up media upload in Denedio after draft exists (document in export checklist). |

### Import idempotency (Contract Reader)

Per confirmed Denedio behavior:

- Each export item SHOULD include stable **`externalKey`** → Denedio `Question.importExternalKey` (unique when set).
- On retry, Denedio **skips** existing keys (`skippedExternalKeys`).
- **Studio policy:** assign `importExternalKey` at first successful mapping as `qs:{generatedQuestionId}` (or org convention); never rotate on retry; new logical item → new GeneratedQuestion id → new key.
- Batch export: max **200** items per payload document; no duplicate `externalKey` within batch (mirror preview validation).
- Preview in Denedio does **not** run curriculum/trap/archetype FK checks — Studio dry-run SHOULD run FK checks against **catalog mirror** to reduce persist-time surprises.

---

## Independent solver

| Rule | Rationale |
|------|-----------|
| Solver uses **`ISolverProvider`** with config **disjoint** from generation provider on the same run (different model id or explicit `solverProfile`). | Prevents self-grading (`QUESTION_GENERATION_RULES`, Gate 6). |
| Solver output is **SolverResultSchema** only; it does not mutate candidate text. | Expert/editor remains authoritative for fixes. |
| Causality metadata on distractors is **proposed by generator**, spot-checked by verifier — solver is not sole author of error paths. | Pedagogy spec. |
| Failed solver (no unique answer, ambiguity) → verifier **FAIL** finding; blocks approval. | Safety. |

---

## AI provider abstraction

See `docs/AI_PIPELINE.md` for stage mapping. At architecture level:

| Interface | Stages |
|-----------|--------|
| `ISourceAnalystProvider` | Extraction structuring |
| `IFingerprintInferenceProvider` | Fingerprint draft |
| `IGenerationProvider` | Mutation plan + stem/choices |
| `IDistractorAnalysisProvider` | Error paths, mechanism tagging |
| `ISolverProvider` | Independent solve |
| `IVerifierProvider` | Optional LLM-assisted checks; rule engine remains primary for hard gates |
| `IEmbeddingProvider` | Similarity/originality signals (non-gating alone) |

Registry selects implementation via env/config; each call logs `providerId`, `modelId`, `promptTemplateVersion`.

---

## Similarity & originality (architecture)

Not a single score gate (per pedagogy spec). Studio stores:

- **Embedding distance** / **n-gram overlap** / **structure-stripping isomorphism** (T1) as **verifier inputs**.
- Findings emitted as PASS/WARNING/FAIL with evidence (`docs/AI_SCHEMAS.md`).

Automated **FAIL** blocks approval; **WARNING** requires expert acknowledgment (maps to UX P1).

---

## Security & permissions (v1 sketch)

- Studio auth TBD (Product); role **expert** vs **ops** aligns with UX secondary persona.
- Export bundles may contain full items — treat as confidential assessment content.
- No Denedio credentials in client bundles; dry-run against Denedio (if added) is server-side only.

---

## Testing strategy (architecture)

| Layer | Tool | Focus |
|-------|------|-------|
| Domain + Zod | Vitest | Schema round-trips, choice invariants, idempotency key rules |
| Module services | Vitest + test DB | Generation provenance chain, version monotonicity |
| UX flows | Playwright | S01–S18 happy paths, dry-run console |
| Contract | Vitest fixtures | Golden files vs `QuestionImportPayloadSchema` |

---

## Explicit non-goals (Gate 1)

- Prisma schema files or migrations in this repo (Implementer adds when scaffold starts).
- npm/yarn lockfiles or running install in architect assignment.
- Modifying Denedio (`sinav`) or connecting to its production DB.
- Machine REST import into Denedio (proposed in contract doc — Denedio-side change).

---

## References

- `docs/DENEDIO_CONTRACT.md` — import shape, idempotency, preview vs persist
- `docs/PEDAGOGICAL_FINGERPRINT_SPEC.md` — fingerprint dimensions, fidelity bundle
- `docs/QUESTION_GENERATION_RULES.md` — mutation plan, trivial rejection
- `docs/UX_SPEC.md` — missions, screens, artifacts
- `docs/AI_PIPELINE.md` — staged AI pipeline
- `docs/AI_SCHEMAS.md` — Zod specifications
- `docs/MASTER_BUILD_PLAN.md` — gates 2–10
