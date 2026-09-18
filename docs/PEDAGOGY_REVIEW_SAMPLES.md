# Pedagogy review — Gate 3 sample fixtures

**Date:** 2026-09-18  
**Role:** Pedagogy review (Verifier / expert sample lens)  
**Scope:** Synthetic river fixture → `inferFingerprintDraftFromExtraction` draft payload and companion mutation-plan template.

---

## Artifacts reviewed

| Artifact | Path |
|----------|------|
| Source analyst envelope (synthetic item) | `src/shared/ai/fixtures/synthetic-river-problem.ts` |
| Draft inference (deterministic, no LLM) | `src/modules/fingerprints/services/draft-inference.ts` |
| Invariant / mutable enforcement | `src/shared/validation/pedagogical-fingerprint.ts`, `fingerprint-repository.ts` |
| Distractor controlled vocab | `src/shared/validation/pedagogy-enums.ts`, `docs/QUESTION_GENERATION_RULES.md` |
| Companion mutation plan sample | `src/modules/generation/domain/mutation-plan-template.ts` |
| Automated Gate 3 checks | `src/shared/validation/gate3-fingerprint.test.ts` (8/8 pass at review time) |

**Item:** Piecewise hourly rental — 12 coins first hour, 8 coins each additional hour, 4 hours total; correct **B = 36** (`12 + 3×8`).

---

## Invariants vs mutable surface

### Spec alignment (code)

- **Invariant fields** match `PEDAGOGICAL_FINGERPRINT_SPEC.md` summary table: all pedagogical dimensions live in `INVARIANT_FIELD_KEYS`; runtime merge rejects invariant patches (`mergeMutableFingerprintUpdate` / lock workflow).
- **Mutable on the fingerprint record:** only `mutable_surface_notes` is in `MUTABLE_FIELD_KEYS`. Stem wording, numbers, names, and choice order are **mutable at generation time** via mutation-plan `surface_mutations`, not via post-lock fingerprint edits — consistent with the spec’s split between “fingerprint invariants” and “generation surface dressing.”
- **Core invariant assertions (W2):** `CORE_INVARIANT_ASSERTION_DIMENSIONS` includes `distractor_mechanisms`; sample mutation plan expands to full core set — schema test enforces completeness.

### River draft — invariant *content* (expert read)

| Dimension | Draft quality | Notes |
|-----------|---------------|-------|
| Measured skill / learning objective | **Strong fit** | Piecewise rate → total cost matches stem. |
| Cognitive operation / reasoning pattern | **Plausible** | `apply` + `decompose_intervals_then_aggregate` fits solution. |
| Solution skeleton (4 phases) | **Good scaffold** | parse → model → compute → verify; aligns with solution block. |
| Critical signal / hidden constraint | **Good** | First vs additional hour boundary stated correctly. |
| Burden bands | **Plausible** | `light_mental` / `medium` language / `none` visual — consistent with text-only item. |
| Archetype | **Consistent** | `AR_RATE_PIECEWISE` v1 matches mechanism family. |
| `mutable_surface_notes` | **Present** | Correctly scopes context/numbers vs interval structure. |

**Gap:** `dimension_evidence` on the payload lists only `measured_skill` as **UNVERIFIED** with a stem excerpt. No per-dimension verdicts, no distractor traces, no PRESERVED attestation — below the spec’s Gate 3 “authored or inferred then human-reviewed” bar for a **golden** fixture.

---

## Distractor taxonomy readiness

### Schema / rules — **ready**

- Closed `MECH_*` (11) and `TRAP_*` (7) enums in Zod match generation rules and `AI_SCHEMAS.md`.
- `distractorMechanismSlot` requires `mechanism_id`, ≥1 `trap_type_ids`, stable `misconception_id`, and summary — sufficient for Gate 4 causality linkage.

### River wrong options — **error paths (reference for expert lock)**

| Slot | Value | Likely student path | Suggested `MECH_*` | Suggested `TRAP_*` |
|------|-------|---------------------|--------------------|--------------------|
| A | 32 | `4×8` — uniform additional rate (ignore first-hour premium) | `MECH_CONCEPT_SWAP` or `MECH_PARTIAL` | `TRAP_PARTIAL` / `TRAP_CONCEPT_SWAP` |
| C | 44 | `12 + 4×8` — off-by-one on **additional** interval count | `MECH_BOUNDARY` | `TRAP_BOUNDARY` |
| D | 48 | `4×12` — apply first-hour fee to every hour | `MECH_CONCEPT_SWAP` | `TRAP_PARTIAL` or `TRAP_CONCEPT_SWAP` |

### Inferred draft — **not taxonomy-ready (placeholder logic)**

`draft-inference.ts` assigns distractors by **index parity**, not by choice semantics:

- All slots use `trap_type_ids: ["TRAP_PARTIAL"]`; fingerprint-level `trap_types` is only `TRAP_PARTIAL`.
- Alternates `MECH_PARTIAL` / `MECH_ARITH` without mapping to A/C/D error paths above.
- `misconception_id` values are synthetic (`misc_partial_sum_a`, …) — not stable catalog ids aligned to mechanisms.
- `misconception_targets` are generic per-label strings, not distinct misconception families.

**Mutation plan template** (`buildSampleMutationPlan`) repeats the same weakness: all three wrong slots described as partial sum / arithmetic slip; slot D notes “all hours at additional rate” which **does not match** D=48 (first-rate-on-all-hours).

**Readiness verdict:** Taxonomy **enums and schema are ready**; **fixture draft + sample mutation plan are not ready** as pedagogical exemplars until distractor rows and regeneration notes are hand-authored from the table above (plus distractor_trace evidence per choice).

---

## Evidence bundle (Gate 3 sample)

| Required signal (spec) | Present on river draft? |
|------------------------|-------------------------|
| Source anchor (stem) | Yes — `evidenceRows` + partial `dimension_evidence` |
| Solution trace | Yes — when solution block exists (fixture has `solution-1`) |
| Distractor trace per wrong option | **No** |
| Diff check (mutable vs invariant) | **Partial** — notes only in `mutable_surface_notes` |
| Reviewer attestation | **No** |

`gapWarnings` correctly flags missing solution (N/A for river) and thin coverage if &lt;2 wrong choices (N/A — three wrong choices present).

---

## Relationship to demo / Gate 2

Same fixture is used for demo analyst path (`VERIFICATION_REPORT.md` § Sample synthetic extraction review). **Gate 2 APPROVE WITH WARNINGS** already scopes this as fixture-only, not upload-fidelity golden source. Gate 3 draft inference should be labeled **scaffold**, not expert-approved fingerprint content, until distractor and evidence rows are revised.

---

## HANDOFF — Gate 3 sample quality

| Layer | Verdict |
|-------|---------|
| Zod model, invariant/mutable enforcement, enum taxonomy, unit tests | **APPROVE** (infrastructure) |
| Synthetic river **pedagogical** draft + sample mutation distractor mapping | **NEEDS WORK** |

**Overall Gate 3 sample quality:** **NEEDS WORK**

**Minimum before treating river as golden Gate 3 sample:**

1. Replace index-based distractor inference with choice-specific `MECH_*` / `TRAP_*` / misconception ids tied to documented error paths (table above).
2. Expand `trap_types` and per-slot `trap_type_ids` to reflect boundary vs concept-swap traps, not only `TRAP_PARTIAL`.
3. Add `dimension_evidence` (or `FingerprintEvidence` rows) with **distractor_trace** per wrong slot and move core dimensions from **UNVERIFIED** to **PRESERVED** after expert review.
4. Align `buildSampleMutationPlan` `distractor_regeneration` parameter notes with actual mechanisms (fix slot D description).

---

## Cross-reference

- Invariant / mutable definitions: `docs/PEDAGOGICAL_FINGERPRINT_SPEC.md`
- Distractor causality rules: `docs/QUESTION_GENERATION_RULES.md`
- Intake fixture context: `docs/VERIFICATION_REPORT.md` (Sample synthetic extraction review)
