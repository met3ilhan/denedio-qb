# Build Log

## Application code

- 2026-09-18: **P19–P22** — catalog mirror seed, Denedio mapper, dry-run S18, live mission blockers, `DENEDIO_IMPORT_GAP.md`.
- 2026-09-18: **P01** — Next.js scaffold, Vitest, Playwright, CI stub (`15a29a6`).
- 2026-09-18: **P02–P03** — Prisma missions, Studio shell, docker-compose (`23384ce`).
- 2026-09-18: **P04–P07** — Gate 2 intake pipeline, demo extraction (`1b8009c`).
- 2026-09-18: **P03 polish** — typography utilities, phase `-50` tints, 4px rail signal strip, phase-colored `PhasePill`, neutral blockers empty state, `p-4` panels.
- 2026-09-18: **Gate 3 (P08–P09)** — `PedagogicalFingerprint*` + `FingerprintEvidence` models, Zod schemas, S06 draft inference UI, S07 lock/version studio.
- 2026-09-18: **P10** — `MutationPlan` + `GenerationRun`, trivial-mutation preview (T1–T6 heuristics), S08 setup UI (no LLM generation).
- 2026-09-18: **P11–P18** — Generation spawn orchestrator (mock/Gemini), question-family siblings, distractor schema + S11, W1 similarity, independent solver, verifier S12, approval S13, edit invalidation, S14–S15 record.

## Bootstrap

- 2026-09-18: Agent office files and documentation skeleton created.

## Future entries

Implementer logs modules, migrations, and notable commits here.

---

## QUALITY RECOVERY — INITIAL FAILURE ANALYSIS

**Mission:** Pedagogical core repair only (Gates 3–6); no new product features.  
**Branch:** `build/question-studio-v1` · **Baseline commit:** `a5f4982` (Verifier Gate 10 **REJECT**; Tester regression **PASS**).  
**Denedio:** `C:\Users\PC\Desktop\sinav` — read-only; unchanged.

### What passed (do not regress)

| Layer | Evidence |
|-------|----------|
| Gates 0–2 | Denedio safety; Gate 1 definition; Gate 2 intake scaffold (APPROVE WITH WARNINGS) |
| Engineering bar | `pnpm typecheck`, `pnpm test` (29 unit), Playwright 16/16 in latest Tester rollup |
| Vertical wiring | Intake → fingerprint lock → mutation setup → mock generation → verifier → approval → Denedio dry-run (API golden path in e2e) |
| Gate 3 **infra** | Prisma models, Zod enums, lock/version UI, `gate3-fingerprint.test.ts` |

### Root cause clusters (pedagogy, not scaffold)

| ID | Symptom | Root cause | Primary owner |
|----|---------|------------|---------------|
| **RC-1** | Verifier shows PASS on fingerprint dimensions without evidence | `rule-engine.ts` synthesizes missing `dimension_evidence` as **PRESERVED** (G10-B3) | Implementer + Verifier spec |
| **RC-2** | Distractors “pass” schema but not mechanism | Mock + `draft-inference.ts` index-parity `MECH_*` / tautological `produces_value` (G10-B4) | Pedagogy → Implementer |
| **RC-3** | Solver independence nominal only | Mock solver always prefers label **B**; collusion with keyed correct (G10-B2) | Architect → Implementer |
| **RC-4** | No trustworthy golden pedagogy corpus | River fixture NEEDS WORK; no `docs/TEST_REPORT.md` golden mission (G10-B1) | Pedagogy → Tester |
| **RC-5** | Experts misread demo as production OCR | `QUESTION_STUDIO_DEMO_MODE` default; no persistent demo disclosure (G10-B5) | Implementer (UI scope: quality states only) |
| **RC-6** | Invariant enforcement text-heavy | `invariant_assertions` not bound to full invariant set at lock/generate (W2) | Architect + Implementer |
| **RC-7** | Fidelity engine not evidence-driven | No structured fingerprint fidelity checks beyond verdict strings | Pedagogy + Implementer |

### Gate status (recovery scope)

| Gate | Pre-recovery | Blocker to accept |
|------|--------------|-------------------|
| **3** | PARTIAL / FAIL | Golden fingerprint suite + evidence rows + Verifier sample APPROVE |
| **4** | PARTIAL | Mechanism-preserving generation on goldens; trivial mutation rejects; 5 candidate-family types with tests |
| **5** | PARTIAL | Distractor causality engine + adversarial fixtures; no tautology |
| **6** | PARTIAL | Solver firewall + mismatch fixtures; fidelity default **UNKNOWN** not PRESERVED |
| **10** | FAIL | Out of recovery scope except full regression after 3–6 |

### Recovery loop (mandatory)

```
Orchestrator
  → Pedagogy Expert (spec + goldens + acceptance tables)
  → [Architect if schema/Zod/Prisma changes]
  → Implementer (code + fixtures; cannot self-approve)
  → Tester (unit + e2e + TEST_REPORT)
  → Verifier (independent sample + rule suite)
  → rework until APPROVE or scoped REJECT with findings
```

### Ordered work packages (maps to user mission items)

1. This section + `docs/ORCHESTRATOR_LOG.md` recovery kickoff  
2. Golden pedagogy suite (`fixtures/pedagogy/` — math primary, Turkish + science optional)  
3. Fingerprint schema evaluation (Architect) + evidence mandatory before LOCKED  
4. Invariant assertions — structural checks, not stem text diff only  
5. Rule-engine: missing evidence → **UNKNOWN** / **UNVERIFIED**, never **PRESERVED**  
6. Evidence-based fingerprint fidelity engine in verifier  
7. Trivial mutation (T1–T6) golden negatives  
8. W1 originality thresholds (defaults in `similarity-config` + tests)  
9. Distractor causality validation + adversarial tests  
10. Mock solver independence + solver input firewall  
11. Adversarial solver-mismatch fixtures  
12. Golden generation family (5 candidate archetypes)  
13. UI: quality states + demo disclosure only (no feature creep)  
14. Refresh `QA_FINDINGS`, `VERIFICATION_REPORT`, `OVERNIGHT_BUILD_REPORT`  
15. Regression: typecheck, lint, test, build, e2e  

**Next orchestrator delegation:** Wave Q0 — **pedagogy-expert** (golden suite + distractor tables + fidelity acceptance matrix).
