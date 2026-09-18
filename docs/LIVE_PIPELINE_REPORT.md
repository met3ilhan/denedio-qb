# LIVE Pipeline Report

**Updated:** 2026-09-19  
**Branch:** `build/question-studio-v1`

## Normal user path (`QUESTION_STUDIO_DEMO_MODE=0`, Gemini key set)

| Stage | Runtime mode | Provider selection |
|-------|----------------|-------------------|
| Source analysis | LIVE | `resolveProviderMode()` → `GeminiSourceAnalystProvider` |
| Fingerprint | LIVE | `GeminiFingerprintAnalystProvider` |
| Metadata (classification) | Expert + preview inference | Draft/preview APIs |
| Mutation plan | LIVE | `GeminiMutationPlannerProvider` via `proposeMutationPlanForFingerprintVersion` |
| Question writer | LIVE | `GeminiGenerationProvider` (no mock delegation) |
| Distractor analysis | LIVE | `GeminiDistractorAnalysisProvider` |
| Solver | LIVE + heuristic fallback | `GeminiSolverProvider`; `solveFromStemOnly` only when Gemini returns no label for quantitative stems |
| Verifier | Rule engine | `runVerificationEngine` on actual spawned candidate |
| Denedio readiness | Workspace strip + export gates | Contract-driven mapping status |

## MOCK path (`QUESTION_STUDIO_PROVIDER_MODE=MOCK` or demo default)

Explicit `Mock*` providers per stage; sample mutation plan uses history-aware mock planner (not kayak template for history stems).

## Failure behavior

LIVE stages throw on auth, HTTP, JSON, and schema errors. **No LIVE→MOCK fallback.**

## Critical fix

- `GeminiGenerationProvider` no longer wraps `MockGenerationProvider`.
- Shared provider cache is **namespaced per stage** (generation, distractor, solver, mutation-planner).
