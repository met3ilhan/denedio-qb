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

**P25 final regression (2026-09-18):** **PASS** — `docs/TEST_REPORT.md`; vitest **58/58** (+1 skipped integration); Playwright **20/20** (`pnpm test:e2e` includes production build); S10 + distractor e2e added.

**Gate 10 / release readiness:** **FAIL** (Tester does not override Verifier **REJECT** or P27 prerequisites; see final section).

**P01 scaffold:** **PASS** (section below).

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

---

## Gate 10 — Final regression QA (P25 / release readiness)

| Field | Value |
|-------|--------|
| **Date** | 2026-09-18 |
| **Commit** | `a5f4982` (`a5f4982ae10b911750a1c01fc5591491c3ffd751`) |
| **Branch** | `build/question-studio-v1` |
| **Scope** | Full quality bar, Playwright workflows (intake → candidates → export/dry-run), responsive 390px, a11y basics, visual baseline screenshots for Gate 10 evidence |
| **Environment** | Windows 10; `DATABASE_URL=postgresql://question_studio:question_studio@localhost:5433/question_studio`; `QUESTION_STUDIO_DEMO_MODE=1` (matches Playwright `global-setup` / `.env.example`) |

### Commands executed

| Command | Result |
|---------|--------|
| `pnpm typecheck` | **PASS** |
| `pnpm lint` | **PASS** (0 errors, 7 `@typescript-eslint/no-unused-vars` warnings in mock/storage/validation stubs) |
| `pnpm test` | **PASS** — 29 passed, 1 skipped (`mission-repository.integration`) |
| `pnpm build` | **PASS** after removing locked `.next` (first attempt **FAIL**: `EPERM` on `.next/trace` — same class as P01-001) |
| `pnpm test:e2e` | **PASS** — **14/14** (`home`, `studio-shell`×5, `sources-intake`×2, `candidates-pipeline`×2, `export-dry-run`×4) |
| `pnpm exec playwright test e2e/qa-gate10-screenshots.spec.ts` | **PASS** — 2/2; writes PNGs under `artifacts/screenshots/` |

### Browser workflows (Playwright)

| Journey | Spec | Result |
|---------|------|--------|
| Mission board / shell / palette / `/studio` redirect | `e2e/studio-shell.spec.ts`, `e2e/home.spec.ts` | **PASS** |
| Upload demo source → extraction → structured review (S05) | `e2e/sources-intake.spec.ts` | **PASS** |
| API golden path: lock fingerprint → spawn candidate | `e2e/candidates-pipeline.spec.ts` | **PASS** |
| Verification UI, stale invalidation banner, approval blocked | `e2e/candidates-pipeline.spec.ts` | **PASS** (regression vs prior Verifier run G10-F1) |
| Approve → Denedio dry-run fail/pass, export gating, continue mission, catalog UUID | `e2e/export-dry-run.spec.ts` | **PASS** (regression vs prior G10-F2 flake) |

### Responsive (390px)

| Check | Result |
|-------|--------|
| Home: `scrollWidth` ≤ `clientWidth` at 390×844 | **PASS** (`studio-shell` “no horizontal overflow”) |
| Candidate review (`/candidates/[id]`) full-page capture at 390×844 | **PASS** (`candidate-review-390.png`) |

### Accessibility basics

| Check | Result |
|-------|--------|
| Document title / primary landmarks on home | **PASS** (`home.spec.ts`) |
| Workflow rail `navigation` “Workflow phases” | **PASS** |
| Keyboard: first Tab targets brand or skip-adjacent control; second Tab advances focus | **PASS** (`studio-shell` focus order) |
| Command palette: `Ctrl+K` → `dialog` “Command palette” + `data-testid="command-palette"` | **PASS** |
| Blockers region: empty state or panel visible | **PASS** |

*Not exercised in this run:* full axe audit, color-contrast sweep, or screen-reader pass on S05–S18 copy.

### Screenshots (`artifacts/screenshots/`)

| File | Route / screen |
|------|----------------|
| `home-1440.png` | `/` mission stream |
| `source-analysis-1440.png` | `/sources/{id}/structured` (S05 structured review) |
| `fingerprint-1440.png` | `/fingerprint/{versionId}` (locked studio) |
| `candidate-family-1440.png` | `/missions/{id}/generate/setup` (S08 mutation / generation setup) |
| `candidate-review-1440.png` | `/candidates/{id}` inspector |
| `candidate-review-390.png` | same at 390px width |
| `verification-1440.png` | `/candidates/{id}/verification` |
| `catalog-1440.png` | `/catalog` |
| `dry-run-1440.png` | `/questions/{id}/denedio/dry-run` (mapping primed; console visible) |

Capture harness: `e2e/qa-gate10-screenshots.spec.ts` (API bootstrap + Playwright `page.screenshot`).

### Defects / gaps (this run)

| ID | Severity | Summary |
|----|----------|---------|
| G10-QA-001 | LOW | Intermittent Windows `pnpm build` **EPERM** on `.next/trace` when `.next` is locked; clean `.next` recovers |
| G10-QA-002 | MEDIUM | CI (`.github/workflows/ci.yml`) still omits `pnpm test:e2e` (P01-003) |
| G10-QA-003 | LOW | Next.js dev server `allowedDevOrigins` warning during Playwright (P01-004) |
| G10-QA-004 | INFO | `artifacts/screenshots/` and screenshot spec are QA evidence; not wired into default `test:e2e` CI job |

### Gate 10 readiness verdict (honest)

| Question | Answer |
|----------|--------|
| **P25 regression QA (automation + UX smoke)?** | **PASS** — all requested commands green; workflows and 390px/a11y basics covered; screenshots captured |
| **Gate 10 / P27 release acceptance?** | **FAIL** — prerequisites and product bar not met |

**Rationale for Gate 10 FAIL:** `docs/VERIFICATION_REPORT.md` (same commit) **REJECT** stands on **G10-B1–G10-B5** (no golden `TEST_REPORT.md`, mock solver independence, verifier fidelity defaulting, distractor/pedagogy placeholders, demo-mode disclosure). Tester regression does **not** re-open Gate 10: engineering smoke is green, but **VERIFIER APPROVE** and Orchestrator P27 checklist are outstanding.

### Regression notes

- Prior Verifier e2e snapshot on `a5f4982`: 10/14 with 2 FAIL / 2 SKIP; **this Tester session: 14/14 + screenshot spec 2/2** with `DATABASE_URL` set and serial pipeline specs succeeding.
- P01-002 horizontal overflow on home **remains fixed** (390px assertion passes).

### HANDOFF

```
HANDOFF

Role: tester
Task: Gate 10 final regression QA — Question Studio V1
Status: COMPLETE

Artifacts:
- docs/QA_FINDINGS.md (this section)
- artifacts/screenshots/*.png (9 files)
- e2e/qa-gate10-screenshots.spec.ts (capture harness)

Commands: typecheck PASS; lint PASS (warnings); test PASS; build PASS (after .next clean); test:e2e 14/14 PASS; screenshot spec 2/2 PASS

Verdict:
- P25 regression QA: PASS
- Gate 10 readiness: FAIL (release blocked per Verifier + missing P27 artifacts)

Next: Orchestrator — reconcile .project-state; Implementer — G10-B2–B5; Verifier — re-run P26 golden mission after pedagogy fixes; wire Playwright into CI when stable on Ubuntu.
```

---

## GOLDEN PEDAGOGY MISSION (Quality Recovery — 2026-09-18)

| Field | Value |
|-------|--------|
| **Scope** | Gates 3–6 pedagogy core: golden suite, fingerprint fidelity, distractor causality, solver firewall, adversarial fixtures, demo disclosure |
| **Branch** | `build/question-studio-v1` |

### Commands

| Command | Result |
|---------|--------|
| `pnpm typecheck` | **PASS** |
| `pnpm lint` | **PASS** (warnings only) |
| `pnpm test` | **PASS** — **41/41** (1 integration skipped) |
| `pnpm build` | **PASS** |
| `pnpm test:e2e` | **PASS** — **17/17** (demo banner spec added) |

### Golden mission evidence

| Check | Result |
|-------|--------|
| Good candidate accepted | **YES** — ferry **GOOD** family → not `GATE_FAIL` |
| Number-swap / too-similar rejected | **YES** — `SIM_STRUCTURAL_ISOMORPHISM` FAIL |
| Pedagogical-drift candidate rejected | **YES** — `REJECT_MECHANISM` FAIL |
| Bad distractor detected | **YES** — `REJECT_DISTRACTOR` FAIL (T4 numeric noise) |
| Solver mismatch detected | **YES** — `SOLVER_MISMATCH` FAIL |
| Ambiguity path | **YES** — `solver-independence.test.ts` |
| Missing evidence → UNKNOWN not PRESERVED | **YES** — `rule-engine-fidelity.test.ts` |
| Demo disclosure visible | **YES** — `data-testid="demo-mode-banner"` |

### Tester verdict (golden mission)

**PASS**

---

## ZERO-ASSUMPTION UAT (2026-09-18)

| ID | Severity | Finding | Status |
|----|----------|---------|--------|
| UAT-001 | BLOCKER | No primary CTA when missions exist | **FIXED** |
| UAT-002 | HIGH | Mission page dead-end | **FIXED** (workflow hub) |
| UAT-003 | HIGH | English blocker strings | **FIXED** |
| UAT-004 | MEDIUM | S-code screen labels | Open |
| UAT-005 | MEDIUM | Windows `.next/trace` EPERM | Open (environment) |
