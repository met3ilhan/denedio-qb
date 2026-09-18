# Test Report — Pre-Live AI Stabilization

## Test Environment

| Field | Value |
|-------|--------|
| **Branch** | `build/question-studio-v1` |
| **Node** | v20+ (local) |
| **Database** | PostgreSQL `question_studio` @ `localhost:5433` |
| **E2E server** | `next build` → `next start` (production bundle) |
| **E2E provider** | `QUESTION_STUDIO_PROVIDER_MODE=MOCK` (webServer override) |
| **Live smoke** | `pnpm test:live-gemini-smoke` — see `docs/LIVE_AI_SMOKE_REPORT.md` |

## Static Validation

| Command | Result |
|---------|--------|
| `pnpm typecheck` | **PASS** |
| `pnpm lint` | **PASS** — **8 warnings** (unused imports/params; img element advisory) |

## Unit / Integration

| Command | Total | Passed | Failed | Skipped |
|---------|-------|--------|--------|---------|
| `pnpm test` | 67 | 66 | 0 | 1 |

**Skipped:** `mission-repository.integration` (requires integration env)

## Playwright

| Command | Count | Passed | Failed |
|---------|-------|--------|--------|
| `pnpm test:e2e` | 35 | 35 | 0 |

**Targeted flake re-run:** `candidates-pipeline`, `denedio-canary-lineage` — **PASS**

## Build

| Command | Result |
|---------|--------|
| `pnpm build` | **PASS** |

## Live Gemini

| Command | Result |
|---------|--------|
| `pnpm test:live-gemini-smoke` | **PASS** (1/1) |
