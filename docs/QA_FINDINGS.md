# QA Findings

## Status

P01 scaffold QA executed 2026-09-18 on branch `build/question-studio-v1`.

## Format for entries

- Date
- Build/commit (when applicable)
- Scope tested
- Commands executed (including Playwright)
- Result: PASS / FAIL
- Defects with repro steps
- Regression notes

## TESTER PASS

**Not issued** (see P01 section below for phase verdict).

---

## P01 — Repository scaffold & quality bar

| Field | Value |
|-------|--------|
| **Date** | 2026-09-18 |
| **Commit** | `15a29a6` |
| **Branch** | `build/question-studio-v1` |
| **Scope** | P01 scaffold: scripts, CI stub, home shell, Vitest/Playwright harness, no domain features |

### Commands executed

| Command | Result |
|---------|--------|
| `pnpm typecheck` | PASS |
| `pnpm lint` | PASS |
| `pnpm test` | PASS (1 test) |
| `pnpm build` | PASS (see defects — one intermittent failure on first attempt) |
| `pnpm test:e2e` | PASS (1 test: `e2e/home.spec.ts`) |

### Manual / exploratory checks

- **package.json scripts:** `dev`, `build`, `start`, `lint`, `typecheck`, `test`, `test:watch`, `test:e2e` — all present.
- **Artifacts vs `MASTER_BUILD_PLAN.md` P01:** `package.json`, `src/app/layout.tsx`, Vitest + Playwright, `.github/workflows/ci.yml`, `README.md`, `.env.example`, `src/modules/` placeholder — present.
- **Playwright:** `playwright.config.ts` starts dev server locally, `baseURL` `http://127.0.0.1:3000`, Chromium project; home smoke passes.
- **Accessibility (home):** `html lang="en"`; landmark `aside` with `aria-label="Studio rail"`; single `h1` (“Pedagogy Signal Lab”); main content `h2`+; phase rail items are static `div`s inside `nav` (no focusable controls — expected for standby scaffold).
- **Responsive 390×844:** Document `scrollWidth` **479px** vs viewport **390px** — horizontal overflow (~89px). Fixed `w-60 shrink-0` sidebar + main column without mobile collapse.

### Defects

| ID | Severity | Summary | Repro |
|----|----------|---------|-------|
| P01-001 | **MEDIUM** | Intermittent `next build` failure: `PageNotFoundError: Cannot find module for page: /_document` during “Collecting page data”. Subsequent builds succeeded (3/3 after first failure). | Clean tree: `pnpm build` — retry if fails. |
| P01-002 | **HIGH** | Horizontal overflow on home at 390px width (`scrollWidth` 479). | Playwright or DevTools: viewport 390×844, open `/`, compare `document.documentElement.scrollWidth` to `clientWidth`. |
| P01-003 | **MEDIUM** | CI (`.github/workflows/ci.yml`) runs lint, typecheck, unit tests, build — **not** `pnpm test:e2e`. Documented in `README.md`; E2E not gated in CI yet. | Inspect workflow; run e2e only locally. |
| P01-004 | **LOW** | Next.js dev server warns about cross-origin requests from `127.0.0.1` during Playwright (`allowedDevOrigins` not configured). | `pnpm test:e2e` — observe webServer stderr. |
| P01-005 | **LOW** | Studio phase rail is non-interactive (`div` labels, no links/buttons). Acceptable for P01 standby; revisit when S01+ navigation ships. | Visual/a11y review of `/`. |

### Blockers (P01 acceptance)

**None** — required smoke commands pass; Playwright home smoke passes; no missing scripts or broken harness detected.

### P01 verdict

**PASS** — Meets `MASTER_BUILD_PLAN.md` P01 acceptance (“TESTER PASS on scaffold smoke”: lint, unit test, Playwright opens `/`). Defects P01-001–P01-005 are tracked for Implementer/Designer; **P01-002** should be addressed before Gate 9 UX sign-off, not required to block P01 scaffold acceptance.

### Regression notes

- First `pnpm build` in session failed once; not reproduced on immediate retries.
- Temporary QA-only Playwright specs were run for overflow/a11y probes and removed; repo `test:e2e` count remains **1**.
