# LIVE AI SMOKE REPORT — Gemini source extraction

**Branch:** `build/question-studio-v1`  
**Date:** 2026-09-19  
**Command:** `pnpm test:live-gemini-smoke` (Playwright `e2e/live-gemini-smoke.spec.ts` via `playwright.live.config.ts`)

## Configuration (no secrets)

| Variable | Status |
|----------|--------|
| `QUESTION_STUDIO_GEMINI_API_KEY` | SET |
| `QUESTION_STUDIO_DEMO_MODE` | `0` (OFF) |
| `QUESTION_STUDIO_PROVIDER_MODE` | `LIVE` (forced for smoke runner) |
| `QUESTION_STUDIO_GEMINI_MODEL` | default → `gemini-2.5-flash` |

**Provider mode resolution (`resolveProviderMode`):** explicit `LIVE` for smoke; developer `.env.local` uses `QUESTION_STUDIO_DEMO_MODE=0` → LIVE when `QUESTION_STUDIO_PROVIDER_MODE` unset.

## Workflow path exercised

HOME → **Yeni Soru Oluştur** → PNG upload (`e2e/fixtures/live-smoke-tarih-question.png`) → S04 extraction queue → in-process worker → **GeminiSourceAnalystProvider** → `SourceExtractionSchema` validation → S05 structured review UI.

## Source identity

| Field | Value |
|-------|--------|
| SourceFile ID | `cmu7iekor0002u8k8bhnrdm7y` |
| ExtractionJob ID | `cmu7iekp00004u8k8gaw75ibt` |
| SourceQuestion ID | *(not accepted in smoke — extraction-only scope)* |
| Upload SHA-256 | `36bd39e63bf2bea3064d41e22f81d3df5ecd3c86074bfbb5e1a1df78d52f0ed1` |
| Stored checksum SHA-256 | `36bd39e63bf2bea3064d41e22f81d3df5ecd3c86074bfbb5e1a1df78d52f0ed1` |
| `analystMeta.inputBytesSha256` | matches upload |
| `analystMeta.sourceFileId` | matches SourceFile |

## Provider metadata

| Field | Value |
|-------|--------|
| `analystMeta.providerMode` | `LIVE` |
| `providerId` | `gemini` |
| `modelId` | `gemini-2.5-flash` |

No `mock`, `demo`, or `mock-source-analyst-v1` on the success path.

## Extraction quality (smoke)

- **Stem (preview):** `Kurtuluş Savaşı hangi yılda başlamıştır?`
- **Fixture intent:** Turkish history MCQ (Kurtuluş Savaşı / 1919–1921 choices on image).
- **UI:** uploaded image visible; execution label **Canlı AI**; no kayak/canary/demo substitution observed.
- **Silent fallback:** none — prior mock fallback removed from `GeminiSourceAnalystProvider`; failures surface as `EXTRACTION_FAILED`.

## Regression isolation

Default `pnpm test:e2e` forces `QUESTION_STUDIO_PROVIDER_MODE=MOCK` on the webServer so developer LIVE `.env.local` does not break CI/local regression.

## Result

**PASS** — one controlled live Gemini extraction through the real Question Studio pipeline.
