# Overnight Build Report — Question Studio V1

**Date:** 2026-09-18  
**Branch:** `build/question-studio-v1`  
**Base:** Gate 1 commit `71ce97c`

## Executive Summary

Overnight autonomous implementation established a **working local Question Studio** on the approved modular monolith stack: Next.js App Router, Prisma/PostgreSQL (Docker), Vitest, Playwright, mock-first AI pipeline with optional Gemini, Pedagogy Signal Lab shell, end-to-end workflows from source upload through approval and **local Denedio-shaped dry-run export**. Publishing to Denedio remains **disabled**.

**Gate 10 final acceptance was not achieved.** Independent Verifier **REJECT** and Tester regression **PASS** with Gate 10 readiness **FAIL** due to mock pedagogy depth (solver, distractor causality, golden fingerprint sample), demo-mode disclosure gaps, and incomplete visual QA sign-off. Engineering quality bar for scaffold and workflow wiring is strong; product correctness bar for V1 completion requires another quality cycle.

## Agent Office Execution

Orchestrator coordinated specialist subagents with evidence in `docs/ORCHESTRATOR_LOG.md`:

| Phase cluster | Implementer | Tester | Architect | Designer | Pedagogy | Contract Reader | Verifier |
|---------------|-------------|--------|-----------|----------|----------|-----------------|----------|
| P01 scaffold | ✓ | ✓ | ✓ (layout) | — | — | — | APPROVE w/ warnings |
| P02–P03 persistence + shell | ✓ | ✓ | — | NEEDS WORK → polish | — | — | — |
| P04–P07 Gate 2 intake | ✓ | ✓ | — | — | — | — | APPROVE w/ warnings |
| P08–P10 fingerprint + plan | ✓ | ✓ | — | polish applied | NEEDS WORK sample | — | conditional |
| P11–P18 generation + review | ✓ | ✓ | — | — | — | — | partial |
| P19–P22 export + blockers | ✓ | ✓ | — | — | — | review (timing) | partial |
| Final | — | regression PASS | — | — | — | — | **REJECT** Gate 10 |

## Phases Completed

| Phase | Status |
|-------|--------|
| P01 Repository scaffold | **Accepted** |
| P02 Core persistence | **Delivered** |
| P03 Studio shell | **Delivered** (designer polish applied) |
| P04–P07 Source intake + extraction | **Delivered** |
| P08–P09 Fingerprint draft + lock | **Delivered** |
| P10 Mutation plan setup | **Delivered** |
| P11–P18 Generation, solver, verifier, approval | **Delivered** (mock-heavy) |
| P19–P22 Catalog, mapper, dry-run, live blockers | **Delivered** |
| P23–P27 Visual QA / final acceptance | **Partial** (screenshots captured; Gate 10 fail) |

## Gates Passed

| Gate | Status | Notes |
|------|--------|-------|
| 0 Denedio read-only | **PASS** | HEAD `cab8643…` unchanged |
| 1 Discovery | **PASS** | Prior session |
| 2 Source extraction | **PASS w/ warnings** | Mock analyst; S05 preview not true file side-by-side |
| 3 Fingerprint | **FAIL / partial** | Schema + UI; golden sample **NEEDS WORK** |
| 4 Controlled generation | **Partial** | Orchestrator + trivial rules; not expert-validated siblings |
| 5 Distractor causality | **Partial** | Schema + UI; mock causality not expert-grade |
| 6 Solver + verifier | **Partial** | Independence config; mock solver not adversarial |
| 7 Expert review | **Partial** | S11–S13 paths; S10 comparison matrix not built |
| 8 Denedio compatibility | **Partial** | Mapper + dry-run local; no live import |
| 9 Browser/UX QA | **Partial** | 16 Playwright tests; not full S01–S18 Designer sign-off |
| 10 Final acceptance | **FAIL** | Verifier REJECT |

## Product Built

Expert workflow skeleton: mission board with blockers, sources library, upload, extraction job, structured review (fact/inference/uncertainty layers), fingerprint draft + lock studio, generation setup + run monitor, candidate inspector, verification findings, approval/rejection, question record, catalog mirror picker, Denedio map + dry-run console, export bundle download.

## Architecture

Implemented per `docs/ARCHITECTURE.md`: `src/app` thin routes, `src/modules/*` domain areas, `src/shared` for db, validation, storage, ai providers.

## Database Model

PostgreSQL via Docker (`5433`). Prisma models include Mission, ProvenanceEvent, SourceFile, ExtractionJob, SourceQuestion, PedagogicalFingerprint*, FingerprintEvidence, GenerationRun, MutationPlan, GeneratedQuestionCandidate, SolverRun, VerifierRun, GeneratedQuestion, QuestionVersion, ApprovalRecord, DenedioFieldMapping, catalog mirror tables.

## Demo Mode

`QUESTION_STUDIO_DEMO_MODE=1` (default in e2e) forces mock AI and deterministic river fixture. **Gap:** UI should more prominently label demo vs live generation (Verifier G10-B5).

## AI Provider

Mock providers for extraction, fingerprint inference, generation, distractor, solver, verifier narrative. Optional `QUESTION_STUDIO_GEMINI_API_KEY` when demo off. `.env.example` documents variables.

## Test Results

- **Vitest:** 29 passed, 1 skipped (integration)
- **Playwright:** 16 passed (includes screenshot harness)
- **typecheck / build:** PASS (lint: 7 warnings, 0 errors)

## Screenshots

`artifacts/screenshots/`: home-1440, source-analysis-1440, fingerprint-1440, candidate-family-1440, candidate-review-1440, candidate-review-390, verification-1440, catalog-1440, dry-run-1440.

## Gate 1 Warnings W1–W6

| ID | Resolution |
|----|------------|
| W1 | **Partial** — configurable `QUESTION_STUDIO_W1_*` + T1/T6 tests; thresholds not product-tuned |
| W2 | **Partial** — core invariant_assertions Zod on mutation plan; not all 19 dimensions |
| W3 | **Partial** — warn on sparse evidence at lock; not hard-block |
| W4 | **Partial** — local JSON catalog mirror seed; not live Denedio sync |
| W5 | **Open** — trap/archetype UUIDs via seed picker; ops process TBD |
| W6 | **Resolved** — `.project-state.md` updated this report cycle |

## Denedio Read-Only Integrity

**VERIFIED** — `cab8643698943c365203b483f138e285ac5be82a`, clean tree.

## Git Checkpoints

See `git log` on `build/question-studio-v1` from `15a29a6` through `a5f4982` plus doc/QA commits.

## How To Run Locally

```bash
pnpm install
cp .env.example .env.local
pnpm db:up
pnpm db:migrate
pnpm dev
pnpm test
pnpm test:e2e
```

## Recommended Next 15 Improvements

1. Golden river fingerprint + distractor causality (pedagogy expert sign-off)  
2. Adversarial mock solver fixtures + writer/solver mismatch e2e  
3. Rule engine: do not default missing evidence to PRESERVED  
4. S10 fingerprint-dimension comparison matrix  
5. True S05 source file preview pane  
6. Demo mode banner in shell  
7. CI: Playwright + integration job  
8. STIX Two Text for stem preview  
9. Live Gemini smoke (one original sample)  
10. Sibling generation quality review samples  
11. Full 19-dimension invariant_assertions enforcement  
12. Mandatory evidence before lock (product decision)  
13. Catalog mirror refresh workflow  
14. P26 verifier re-run checklist  
15. Designer Pass B typography/spacing audit  

## QUALITY RECOVERY MISSION (2026-09-18)

| Item | Status |
|------|--------|
| Golden pedagogy suite (`fixtures/pedagogy/`, `docs/GOLDEN_PEDAGOGY_SUITE.md`) | **Delivered** |
| Fingerprint fidelity (no false PRESERVED) | **Fixed** — `fingerprint-fidelity.ts` |
| Invariant assertions (`expected` on mutation plan) | **Extended** |
| Similarity / trivial (W1, T1) | **Tested** on golden TOO-SIMILAR |
| Distractor causality engine | **Delivered** — replay + T4 cluster FAIL |
| Mock solver redesign + firewall | **Delivered** — `stem-solver.ts` |
| Adversarial golden family (5 kinds) | **Regression tests** |
| Demo disclosure | **Delivered** — `DemoModeBanner` |
| Tester golden mission | **PASS** (41 unit, 17 e2e) |
| Verifier Gates 3–6 | **APPROVE** (see `VERIFICATION_REPORT.md` GOLDEN PEDAGOGY RE-REVIEW) |
| Gate 3 | **PASS** |
| Gate 4 | **PASS** |
| Gate 5 | **PASS** |
| Gate 6 | **PASS** |
| Gate 10 | **Still FAIL** (out of scope) |
| Live AI smoke | **NOT RUN** |
| Denedio integrity | **VERIFIED** (`cab8643…`) |

## What Was Deliberately Not Built

Denedio publish, production deploy, student/teacher portals, billing, live Denedio DB, copyrighted question banks.
