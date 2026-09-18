# Master Build Plan — Question Studio

## Status

- **Gates 0–10** defined below with pass criteria.
- **Implementation phases P01–P27** sequenced; execution **NOT STARTED** (await Gate 1 acceptance).
- **Gate 1:** **ACCEPTED** (2026-09-18) — VERIFIER APPROVE WITH WARNINGS; discovery complete.

## Phase cycle (every delivery increment)

```
SPEC
→ SPECIALIST REVIEW
→ IMPLEMENTER
→ TESTER
→ VERIFIER
→ FIX IF NEEDED
→ RE-TEST
→ RE-VERIFY
→ ACCEPT
```

## Final acceptance rule

Requires **TESTER PASS** **AND** **VERIFIER APPROVE**.

---

## Quality gates (0–10)

### GATE 0 — Denedio Read-Only Safety

**Owner:** Orchestrator (+ Contract Reader discipline)

**Pass when:**

- Baseline in `docs/DENEDIO_READONLY_BASELINE.md` current
- No Denedio modifications; no forbidden env reads or app/DB commands

**Status:** Bootstrap baseline recorded — **CONDITIONAL PASS** for office-only work; re-check before Contract Reader runs.

---

### GATE 1 — Product / Architecture / Pedagogy / Design Definition

**Owners:** Orchestrator, Product discovery, Architect, Pedagogy Expert, Designer

**Pass when:**

- `docs/PRODUCT_SPEC.md` reviewed and actionable
- `docs/ARCHITECTURE.md` aligned with contract + pedagogy
- `docs/AI_PIPELINE.md` + `docs/AI_SCHEMAS.md` actionable for Implementer
- Fingerprint and generation rules drafted for implementation
- UX: three directions evaluated, **DESIGN AUTHORITY: LOCKED** in design docs

**Status:** **ACCEPTED** (2026-09-18) — All Gate 1 artifacts actionable; design locked (D-004); Verifier APPROVE WITH WARNINGS.

---

### GATE 2 — Source Extraction

**Pass when:** Source upload → structured extraction meets spec; Tester exercises workflow; Verifier samples fidelity to source (not copy-paste).

**Status:** NOT STARTED

---

### GATE 3 — Pedagogical Fingerprint

**Pass when:** Fingerprint spec implemented in schema + UI; invariants vs mutable surface documented in product; Verifier approves sample fingerprints.

**Status:** NOT STARTED

---

### GATE 4 — Controlled Generation

**Pass when:** Generation preserves mechanism (not number swaps); mutation plans required; schema enforced; samples reviewed.

**Status:** NOT STARTED

---

### GATE 5 — Distractor Causality

**Pass when:** Each distractor traceable to misconception/error path per pedagogy rules; Verifier spot-checks.

**Status:** NOT STARTED

---

### GATE 6 — Independent Solver + Verifier

**Pass when:** Solver independent of generator; answers verified; audit trail exists.

**Status:** NOT STARTED

---

### GATE 7 — Expert Review Workflow

**Pass when:** Human/expert review flows in UX work end-to-end; Tester PASS.

**Status:** NOT STARTED

---

### GATE 8 — Denedio Contract Compatibility

**Pass when:** Mapping complete in `docs/DENEDIO_CONTRACT.md`; dry-run/export validates against confirmed Denedio shapes; Verifier APPROVE.

**Status:** NOT STARTED

---

### GATE 9 — Browser / UX / Visual QA

**Pass when:** Locked design match; Playwright executed; responsive/error/a11y basics; **TESTER PASS**.

**Status:** NOT STARTED

---

### GATE 10 — Final Acceptance

**Pass when:** All prior gates accepted; **TESTER PASS** + **VERIFIER APPROVE**; Orchestrator logs acceptance.

**Status:** NOT STARTED

---

## Implementation phases (P01–P27)

Each phase lists: **Goal**, **Primary agent**, **Prerequisites**, **Artifacts**, **Scope**, **Tests**, **Review**, **Acceptance**, **Rollback**.

Phases map to gates in **Primary gate** field; multiple phases may roll up to one gate.

---

### P01 — Repository scaffold & quality bar

| Field | Content |
|-------|---------|
| **Goal** | pnpm monolith-ready Next.js App Router app with TS strict, Tailwind, ESLint, Vitest, Playwright harness, CI stub |
| **Primary agent** | implementer |
| **Prerequisites** | Gate 1 accepted; `docs/ARCHITECTURE.md` stack section |
| **Artifacts** | `package.json`, `app/layout.tsx`, test scripts, `.github/workflows` or documented local test command |
| **Scope** | No domain features; env sample without secrets; README run instructions |
| **Tests** | Tester: `pnpm test`, `pnpm lint`, smoke Playwright opens `/` |
| **Review** | Architect: module folder layout matches architecture doc |
| **Acceptance** | TESTER PASS on scaffold smoke |
| **Rollback** | Revert scaffold commit; no DB |
| **Primary gate** | Pre–Gate 2 |

---

### P02 — Core persistence: missions & provenance events

| Field | Content |
|-------|---------|
| **Goal** | PostgreSQL + Prisma models for `Mission`, `ProvenanceEvent`, user stub; migrations |
| **Primary agent** | implementer |
| **Prerequisites** | P01; architecture entity diagram |
| **Artifacts** | Prisma schema, migration, repository module |
| **Scope** | Mission phase enum aligned with UX phases; append-only provenance |
| **Tests** | Integration tests for create mission + append events |
| **Review** | Architect + Verifier: provenance fields sufficient for audit |
| **Acceptance** | TESTER PASS |
| **Rollback** | Migration down or reset dev DB |
| **Primary gate** | Gate 7 (foundation) |

---

### P03 — Studio shell: rail, phase pills, command palette stub (S01 skeleton)

| Field | Content |
|-------|---------|
| **Goal** | Implement studio rail IA, design tokens (Pedagogy Signal Lab), empty S01 layout |
| **Primary agent** | implementer |
| **Prerequisites** | P01; `docs/DESIGN_SYSTEM.md`, `docs/UX_SPEC.md` S01 |
| **Artifacts** | `StudioShell`, phase-colored rail, S01 route |
| **Scope** | No real mission data required; placeholder blockers panel |
| **Tests** | Playwright: rail navigation, focus order smoke |
| **Review** | Designer: token match; Verifier: anti-dashboard check |
| **Acceptance** | TESTER PASS; Designer spot-check |
| **Rollback** | Revert UI commit |
| **Primary gate** | Gate 9 (partial) |

---

### P04 — Source file storage & upload API (S03 backend)

| Field | Content |
|-------|---------|
| **Goal** | Upload PDF/DOCX/image with size/type validation; link to mission |
| **Primary agent** | implementer |
| **Prerequisites** | P02, P03 |
| **Artifacts** | `SourceDocument` model, upload route, object storage adapter (local or S3-compatible) |
| **Scope** | Virus scan hook interface; no extraction yet |
| **Tests** | API tests + Playwright upload happy path |
| **Review** | Architect: storage abstraction |
| **Acceptance** | TESTER PASS |
| **Rollback** | Delete storage bucket prefix; migration revert |
| **Primary gate** | Gate 2 |

---

### P05 — Sources library list & filters (S02)

| Field | Content |
|-------|---------|
| **Goal** | Dense list UI with extraction/fingerprint status columns |
| **Primary agent** | implementer |
| **Prerequisites** | P04 |
| **Artifacts** | S02 page, list query, filter bar |
| **Scope** | Row navigation rules per UX spec |
| **Tests** | Playwright: filter + row deep link |
| **Review** | Designer layout |
| **Acceptance** | TESTER PASS |
| **Rollback** | Revert UI |
| **Primary gate** | Gate 2 |

---

### P06 — Extraction job queue & worker contract (S04)

| Field | Content |
|-------|---------|
| **Goal** | Job states, retry, expert-readable logs; enqueue on upload accept |
| **Primary agent** | implementer |
| **Prerequisites** | P04; `docs/AI_PIPELINE.md` stage 1 |
| **Artifacts** | `ExtractionJob` model, worker interface, S04 timeline UI |
| **Scope** | Stub worker acceptable if schema + UI real; wire real provider in P07 |
| **Tests** | Job state machine unit tests; Playwright job view |
| **Review** | Architect: async pattern |
| **Acceptance** | TESTER PASS |
| **Rollback** | Drain queue; revert migration |
| **Primary gate** | Gate 2 |

---

### P07 — Source analyst AI + StructuredSource schema (S05)

| Field | Content |
|-------|---------|
| **Goal** | Run extraction pipeline; persist `StructuredSource` matching `SourceExtractionSchema` |
| **Primary agent** | implementer |
| **Prerequisites** | P06; `docs/AI_SCHEMAS.md` |
| **Artifacts** | Provider adapter, extraction prompt version record, S05 side-by-side review UI |
| **Scope** | Accept/reject extraction; defect annotations |
| **Tests** | Fixture-based schema validation; Playwright accept flow |
| **Review** | Verifier: sample extractions vs source |
| **Acceptance** | TESTER PASS + VERIFIER APPROVE sample set |
| **Rollback** | Flag jobs failed; no fingerprint dependency |
| **Primary gate** | Gate 2 |

---

### P08 — Fingerprint draft inference (S06)

| Field | Content |
|-------|---------|
| **Goal** | Model-assisted fingerprint draft from StructuredSource with evidence spans |
| **Primary agent** | implementer |
| **Prerequisites** | P07; `docs/PEDAGOGICAL_FINGERPRINT_SPEC.md` |
| **Artifacts** | `FingerprintDraft` storage, S06 UI, gap warnings |
| **Scope** | All dimensions present or NOT_APPLICABLE rationale |
| **Tests** | Schema validation tests; UI Playwright |
| **Review** | Pedagogy Expert spot-check; Verifier |
| **Acceptance** | TESTER PASS; VERIFIER APPROVE on golden source |
| **Rollback** | Delete drafts for source |
| **Primary gate** | Gate 3 |

---

### P09 — Fingerprint Studio lock & versioning (S07)

| Field | Content |
|-------|---------|
| **Goal** | Invariant vs mutable editor; lock creates immutable version |
| **Primary agent** | implementer |
| **Prerequisites** | P08 |
| **Artifacts** | `PedagogicalFingerprint` version model, S07 three-panel layout |
| **Scope** | Diff-aware invariant editing; lock stamp |
| **Tests** | Version immutability tests; Playwright lock flow |
| **Review** | Verifier: lock prevents silent invariant edit |
| **Acceptance** | TESTER PASS + VERIFIER APPROVE |
| **Rollback** | Supersede version via new version only |
| **Primary gate** | Gate 3 |

---

### P10 — Generation run setup & mutation plan records (S08)

| Field | Content |
|-------|---------|
| **Goal** | Persist `MutationPlan` per run; trivial-mutation guard preview |
| **Primary agent** | implementer |
| **Prerequisites** | P09; `docs/QUESTION_GENERATION_RULES.md` |
| **Artifacts** | S08 UI, plan schema validation |
| **Scope** | No LLM generation yet—plans can be hand-authored for test |
| **Tests** | Plan required before candidate spawn |
| **Review** | Architect + Pedagogy Expert |
| **Acceptance** | TESTER PASS |
| **Rollback** | Cancel runs |
| **Primary gate** | Gate 4 |

---

### P11 — Generation orchestrator & candidate spawn (S09)

| Field | Content |
|-------|---------|
| **Goal** | Execute generation stage; persist candidates + run provenance |
| **Primary agent** | implementer |
| **Prerequisites** | P10; `docs/AI_PIPELINE.md` |
| **Artifacts** | `GenerationRun`, `GeneratedCandidate`, S09 monitor |
| **Scope** | Token/step timeline; cancel |
| **Tests** | Run record audit tests; Playwright monitor |
| **Review** | Verifier: provenance completeness |
| **Acceptance** | TESTER PASS |
| **Rollback** | Mark run cancelled; discard candidates |
| **Primary gate** | Gate 4 |

---

### P12 — Trivial mutation rule engine (T1–T6)

| Field | Content |
|-------|---------|
| **Goal** | Automated rejection codes on spawn and pre-approval |
| **Primary agent** | implementer |
| **Prerequisites** | P11 |
| **Artifacts** | Rule module, finding records |
| **Scope** | Deterministic checks + hooks for Verifier thresholds (T2) |
| **Tests** | Golden negative cases per rule id |
| **Review** | Verifier + Pedagogy Expert |
| **Acceptance** | VERIFIER APPROVE rule suite |
| **Rollback** | Disable rule flags |
| **Primary gate** | Gate 4 |

---

### P13 — Candidate comparison matrix (S10)

| Field | Content |
|-------|---------|
| **Goal** | Mechanism-first matrix across siblings |
| **Primary agent** | implementer |
| **Prerequisites** | P11 |
| **Artifacts** | S10 grid UI |
| **Scope** | Rows = fingerprint dimensions; not stem diff only |
| **Tests** | Playwright keyboard grid a11y |
| **Review** | Designer + Verifier |
| **Acceptance** | TESTER PASS |
| **Rollback** | Revert UI |
| **Primary gate** | Gate 7 |

---

### P14 — Candidate editor + distractor causality panel (S11)

| Field | Content |
|-------|---------|
| **Goal** | Edit stem/choices; per-choice error path metadata |
| **Primary agent** | implementer |
| **Prerequisites** | P11; Gate 5 rules doc |
| **Artifacts** | S11 layout, `DistractorAnalysis` persistence |
| **Scope** | MECH_* + misconception ids |
| **Tests** | Validation: wrong choice without path blocked |
| **Review** | Verifier spot-check |
| **Acceptance** | TESTER PASS + VERIFIER APPROVE samples |
| **Rollback** | Revert candidate version |
| **Primary gate** | Gate 5 |

---

### P15 — Independent solver pipeline (Gate 6 backend)

| Field | Content |
|-------|---------|
| **Goal** | Separate provider/config from generator; store `SolverResult` |
| **Primary agent** | implementer |
| **Prerequisites** | P11; `docs/AI_PIPELINE.md` solver stage |
| **Artifacts** | Solver job runner, schema validation |
| **Scope** | Hard ban on shared prompt self-grading |
| **Tests** | Config isolation test; solver on fixtures |
| **Review** | Architect + Verifier |
| **Acceptance** | VERIFIER APPROVE independence proof |
| **Rollback** | Disable solver gate (feature flag) |
| **Primary gate** | Gate 6 |

---

### P16 — Verification findings UI (S12)

| Field | Content |
|-------|---------|
| **Goal** | Aggregate solver + rules + fingerprint fidelity findings |
| **Primary agent** | implementer |
| **Prerequisites** | P12, P14, P15 |
| **Artifacts** | S12 severity groups, PASS/WARNING/FAIL |
| **Scope** | PRESERVED/DRIFT display per dimension |
| **Tests** | Playwright findings navigation |
| **Review** | Verifier |
| **Acceptance** | TESTER PASS + VERIFIER APPROVE |
| **Rollback** | Re-run verification |
| **Primary gate** | Gate 6 / 7 |

---

### P17 — Approval gate & immutable approval record (S13)

| Field | Content |
|-------|---------|
| **Goal** | Checklist sign-off; attach verification bundle |
| **Primary agent** | implementer |
| **Prerequisites** | P16 |
| **Artifacts** | `ApprovalRecord`, S13 UI |
| **Scope** | Send-back reasons; no export until approved |
| **Tests** | Approval immutability; blocked export test |
| **Review** | Verifier |
| **Acceptance** | TESTER PASS |
| **Rollback** | Revoke via new workflow state (audit retained) |
| **Primary gate** | Gate 7 |

---

### P18 — Question record & version history (S14–S15)

| Field | Content |
|-------|---------|
| **Goal** | Canonical approved view; timeline diff stem/choices/fingerprint/payload |
| **Primary agent** | implementer |
| **Prerequisites** | P17 |
| **Artifacts** | S14, S15 routes, version diff engine |
| **Scope** | Provenance strip integration |
| **Tests** | Playwright diff; version rollback read-only |
| **Review** | Verifier audit trail |
| **Acceptance** | TESTER PASS |
| **Rollback** | N/A (history preserved) |
| **Primary gate** | Gate 7 |

---

### P19 — Catalog mirror & UUID picker (S16)

| Field | Content |
|-------|---------|
| **Goal** | Read-only curriculum/trap/archetype catalog for mapping |
| **Primary agent** | implementer |
| **Prerequisites** | P01; OQ-1 decision |
| **Artifacts** | Catalog sync job or import file, S16 browser |
| **Scope** | **No Denedio production DB**; snapshot or API per architecture |
| **Tests** | Picker resolves UUID; invalid UUID blocked |
| **Review** | Contract Reader + Architect |
| **Acceptance** | TESTER PASS |
| **Rollback** | Refresh snapshot |
| **Primary gate** | Gate 8 |

---

### P20 — Denedio payload mapper (S17)

| Field | Content |
|-------|---------|
| **Goal** | Map approved question → `importQuestionsSchema` item; confirmed vs proposed badges |
| **Primary agent** | implementer |
| **Prerequisites** | P18, P19; `docs/DENEDIO_CONTRACT.md` |
| **Artifacts** | Mapper module, S17 UI, `QuestionImportPayload` cache |
| **Scope** | `externalKey` convention; trap metadata when UUIDs known |
| **Tests** | Golden payload fixtures vs contract doc |
| **Review** | Contract Reader + Verifier |
| **Acceptance** | VERIFIER APPROVE mapping samples |
| **Rollback** | Remap from approved version |
| **Primary gate** | Gate 8 |

---

### P21 — Dry-run validator & export gate (S18)

| Field | Content |
|-------|---------|
| **Goal** | Local Zod + choice invariants + documented FK gap vs Denedio persist |
| **Primary agent** | implementer |
| **Prerequisites** | P20 |
| **Artifacts** | Dry-run engine, S18 console, export bundle download |
| **Scope** | Export disabled until pass; remediation links |
| **Tests** | Playwright fail/pass paths; batch ≤200 |
| **Review** | Verifier + Contract Reader |
| **Acceptance** | TESTER PASS + VERIFIER APPROVE |
| **Rollback** | Fix mapping/editor; re-dry-run |
| **Primary gate** | Gate 8 |

---

### P22 — Mission board live data & blockers (S01 complete)

| Field | Content |
|-------|---------|
| **Goal** | Wire S01 to real missions, phase pills, blocker severity |
| **Primary agent** | implementer |
| **Prerequisites** | P02, P17, P21 |
| **Artifacts** | S01 mission stream, blockers from dry-run/verification |
| **Scope** | No KPI charts |
| **Tests** | Playwright: continue mission deep link |
| **Review** | Designer + Verifier anti-pattern |
| **Acceptance** | TESTER PASS |
| **Rollback** | Feature flag home v2 |
| **Primary gate** | Gate 7 / 9 |

---

### P23 — AI provider abstraction & prompt registry

| Field | Content |
|-------|---------|
| **Goal** | Unified interface for extraction, fingerprint, generation, solver; versioned prompts |
| **Primary agent** | implementer |
| **Prerequisites** | P07, P11, P15; `docs/AI_PIPELINE.md` |
| **Artifacts** | Provider module, prompt version table |
| **Scope** | Model ID + prompt hash on every run |
| **Tests** | Mock provider swap test |
| **Review** | Architect |
| **Acceptance** | TESTER PASS |
| **Rollback** | Pin single provider |
| **Primary gate** | Cross-cutting |

---

### P24 — Auth & expert identity (minimal)

| Field | Content |
|-------|---------|
| **Goal** | Single-tenant or multi-tenant auth per OQ-5; attach actor to approvals |
| **Primary agent** | implementer |
| **Prerequisites** | P02 |
| **Artifacts** | Auth middleware, session, createdBy on events |
| **Scope** | No Denedio SSO required V1 unless decided |
| **Tests** | Protected route tests |
| **Review** | Architect |
| **Acceptance** | TESTER PASS |
| **Rollback** | Dev-only auth bypass flag (non-prod) |
| **Primary gate** | Gate 7 |

---

### P25 — Gate 9 Playwright suite & visual regression baseline

| Field | Content |
|-------|---------|
| **Goal** | Cross-screen journeys S01→S18; design token smoke; a11y checks |
| **Primary agent** | tester |
| **Prerequisites** | P22, core screens implemented |
| **Artifacts** | Playwright specs, CI artifacts, `docs/TEST_REPORT.md` |
| **Scope** | Responsive breakpoints per UX spec |
| **Tests** | Full suite green |
| **Review** | Designer visual spot-check |
| **Acceptance** | **TESTER PASS** |
| **Rollback** | Fix forward; quarantine flaky tests with Orchestrator approval |
| **Primary gate** | Gate 9 |

---

### P26 — End-to-end verification & golden mission

| Field | Content |
|-------|---------|
| **Goal** | Verifier-led golden path: source → approved export with bundle |
| **Primary agent** | verifier |
| **Prerequisites** | P21, P25 |
| **Artifacts** | `docs/VERIFICATION_REPORT.md` golden mission evidence |
| **Scope** | Pedagogy fidelity + mapping + dry-run |
| **Tests** | Verifier manual + automated checks cited |
| **Review** | Orchestrator |
| **Acceptance** | **VERIFIER APPROVE** |
| **Rollback** | Rework phases per finding |
| **Primary gate** | Gates 2–8 rollup |

---

### P27 — Gate 10 final acceptance & release log

| Field | Content |
|-------|---------|
| **Goal** | Orchestrator confirms all gates; log release readiness |
| **Primary agent** | orchestrator |
| **Prerequisites** | P25 TESTER PASS; P26 VERIFIER APPROVE |
| **Artifacts** | `docs/ORCHESTRATOR_LOG.md` acceptance entry; `.project-state.md` stage update |
| **Scope** | No new features |
| **Tests** | Checklist against all gates |
| **Review** | All owners sign-off in log |
| **Acceptance** | Gate 10 **ACCEPTED** |
| **Rollback** | N/A — forward fix policy |
| **Primary gate** | Gate 10 |

---

## Phase → gate map (summary)

| Gate | Phases |
|------|--------|
| 0 | (process) |
| 1 | (docs only) |
| 2 | P04–P07 |
| 3 | P08–P09 |
| 4 | P10–P12 |
| 5 | P14 |
| 6 | P15–P16 |
| 7 | P02, P13, P17–P18, P22, P24 |
| 8 | P19–P21 |
| 9 | P03, P25 |
| 10 | P27 |

---

## Current focus

**GATE 1** — Complete Architect deliverables → Orchestrator Gate 1 evidence review → accept Gate 1 → begin **P01** only after acceptance.

**Parallel track:** Orchestrator maintains `docs/PRODUCT_SPEC.md` coherence; Implementer **idle** until Gate 1 accepted.
