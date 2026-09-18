# Full Product Audit — Release Candidate Rescue (2026-09-19)

## Executive summary

Zero-trust rescue focused on **P0 extraction→fingerprint contamination** (Ottoman history receiving piecewise/kayak pedagogy while LIVE extraction was correct). Root cause was **`inferFingerprintDraftFromExtraction`** applying a **static piecewise template** to every accepted extraction, plus **stale DRAFT reuse** without refresh.

## P0 root cause

| Layer | Finding | Classification |
|-------|---------|----------------|
| `src/modules/fingerprints/services/draft-inference.ts` (pre-v2) | Hardcoded `AR_RATE_PIECEWISE`, piecewise skills, kayak-era English copy for **all** sources | **DANGEROUS FALLBACK** (silent wrong pedagogy) |
| Fingerprint draft page / API | Reused existing DRAFT without re-inference | **REAL PRODUCT** lineage bug |
| `src/shared/ai/generation/mock-provider.ts` | Kayak stem when fingerprint JSON contained "kayak" substring | **MOCK ONLY** — narrowed to `AR_RATE_PIECEWISE` |

## Fixes applied (v2)

- **`src/shared/ai/fingerprint-analyst/`** — provider boundary: LIVE Gemini, domain-aware MOCK, fail-loud unconfigured LIVE.
- **`ensureFingerprintDraftForSource`** — creates draft; **refreshes legacy piecewise drafts** when stem domain ≠ math piecewise.
- **Lineage helpers** — `fingerprintStemCoherent`, `fingerprintTracesToSourceQuestion` in `lineage-assertions.ts`.
- **UX** — post-extraction auto-navigate to structured review; Turkish “Kaynak soru analizi”; fingerprint dimension labels in Turkish.
- **E2E** — `e2e/fingerprint-lineage.spec.ts`; intake tests wait for `/structured` auto-route.

## Fixture / contamination inventory (abbreviated)

| Pattern | Representative paths | Class |
|---------|---------------------|-------|
| kayak / piecewise golden | `fixtures/pedagogy/*`, `synthetic-river-problem.ts` | **TEST/DEMO ONLY** |
| mock analyst kayak | `mock-provider.ts` + `isExplicitDemoSource()` | **DEMO ONLY** |
| mock generation kayak | `generation/mock-provider.ts` when `AR_RATE_PIECEWISE` | **MOCK ONLY** |
| stem-solver kayak regex | `stem-solver.ts` | **SAFE INTERNAL** (solver heuristic) |
| Sxx screen codes | `tr.ts` (many still in generation/candidate strings) | **USER-FACING INTERNAL COPY** — partial cleanup |

## AI stage matrix (normal user workflow, `QUESTION_STUDIO_PROVIDER_MODE=LIVE` + key)

| Stage | Implemented | Mode | Provider / notes |
|-------|-------------|------|------------------|
| A. Source extraction | Yes | LIVE | `GeminiSourceAnalystProvider` — no mock fallback |
| B. Pedagogical fingerprint | Yes | LIVE | **`GeminiFingerprintAnalystProvider`** (new) |
| C. Metadata classification | Partial | RULES/MANUAL | Structured review + expert edit; no separate LLM stage |
| D. Mutation planning | Yes | TEMPLATE/MANUAL | S08 template + expert persist |
| E. Question generation | Yes | MOCK* | `GeminiGenerationProvider` still delegates to mock (*documented gap) |
| F. Distractor analysis | Yes | MOCK | Mock distractor provider in CI/MOCK mode |
| G. Independent solver | Yes | HEURISTIC/MOCK | `stem-solver` — no writer answer in API contract tests |
| H. Verifier | Yes | RULES | Rule engine + fingerprint fidelity |
| I. Similarity | Partial | RULES | Trivial mutation + embedding hooks |
| J. Denedio readiness | Yes | RULES | S17 mapping + S18 dry-run |

MOCK mode: extraction bytes-aware; fingerprint **domain-detect** (history vs piecewise vs generic); no silent kayak except explicit demo filename.

## Data lineage

Intended chain enforced by repositories (scoped by `sourceFileId` / `sourceQuestionId`) + tests:

`SourceFile → ExtractionJob → SourceQuestion (ACCEPTED) → FingerprintVersion → GenerationRun → Candidate`

Added coherence assertion: **`fingerprintStemCoherent(stem, measured_skill)`**.

## Null / schema normalization

- Extraction: `normalizeGeminiExtractionBlocks` (`page: null` → `1`) — existing.
- Fingerprint: **`normalizeGeminiFingerprintPayload`** at Gemini boundary before Zod.

## Remaining issues (non-blocker)

- **Generation LIVE**: Gemini wrapper still uses mock generator (architectural debt).
- **S08–S18 screen codes** still appear in some `tr.ts` strings (candidates, generation, export).
- **Unified workspace**: Structured review + fingerprint still separate routes (improved flow, not single page).
- **Editable AI fields**: Structured review accept-only; inline edit not fully implemented.
- **Live smoke**: Run manually via `pnpm test:live-gemini-smoke` (excluded from default e2e).

## Regression evidence

| Command | Result |
|---------|--------|
| `pnpm typecheck` | PASS |
| `pnpm lint` | PASS (warnings only) |
| `pnpm test` | 77/77 pass (1 skipped integration) |
| `pnpm build` | PASS |
| `pnpm exec playwright test` | **36/36 PASS** |

## Denedio integrity

Read-only reference `C:\Users\PC\Desktop\sinav` — not modified. Contract refresh handoff recorded in orchestrator log.
