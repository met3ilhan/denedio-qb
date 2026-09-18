# Full Product Audit (post real pipeline completion)

**Date:** 2026-09-19

## Resolved

1. **LIVE question generation** — Real Gemini structured output with Zod normalization.
2. **Mutation planning** — LIVE Gemini + mock history-aware planner; setup API uses `proposeMutationPlanForFingerprintVersion`.
3. **Distractor analysis** — LIVE Gemini with domain-sensitive prompts.
4. **Solver** — LIVE Gemini independent solver; stem+choices only; optional heuristic for numeric stems when model abstains.
5. **Post-upload UX** — Unified `/sources/[id]/review` expert workspace.
6. **Inline editing** — Stem, choices, solution, key fingerprint text fields on draft.
7. **Provider honesty** — `resolveProviderMode()` for all gen stages; unconfigured LIVE throws.

## Remaining (non-blocker for MOCK CI)

- Candidate inspector still uses separate routes for deep edit (by design desktop-first).
- Some internal `remediationScreen` enums retain S-codes in JSON (not shown in primary copy).
- LIVE history + second-subject browser acceptance requires paid Gemini run (`playwright.live.config.ts`).

## Regression

- Vitest: 80/80
- Playwright (MOCK): 36/36
