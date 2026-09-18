# Release Candidate Report

**Branch:** `build/question-studio-v1`  
**Date:** 2026-09-19

## Verdict

**CONDITIONAL** — Architecture completes LIVE pipeline wiring; controlled LIVE Gemini acceptance must be run locally with API key before production UAT sign-off.

## Evidence

- `GeminiGenerationProvider` calls Gemini directly.
- Mutation planner, distractor, solver use namespaced `createStageProvider` + LIVE/MOCK split.
- Unified expert review at `/sources/[id]/review`.
- MOCK regression: 80 unit, 36 Playwright.

## Before full RC

1. Run `pnpm exec playwright test --config=playwright.live.config.ts` with history + one quantitative source.
2. Pedagogy sign-off on LIVE artifacts.
3. Designer browser pass on review workspace at 1440/390.
