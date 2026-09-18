# Golden Pedagogy Suite (Wave Q0)

**Authority:** Pedagogy Expert  
**Date:** 2026-09-18  
**Code:** `fixtures/pedagogy/` (`GOLDEN_PEDAGOGY_SUITE` export in `index.ts`)

All items are **original synthetic** questions — not from published exams. Math goldens are **not** trivial number-swap variants of one another; the primary STRONGEST case is **ferry round trip with current** (`golden-math-ferry-current-roundtrip`). The kayak item locks expert distractor paths for the existing `SYNTHETIC_RIVER_FIXTURE`.

---

## Suite inventory

| ID | Discipline | Role | Module |
|----|------------|------|--------|
| `golden-math-ferry-current-roundtrip` | Math | **STRONGEST** — critical signal + hidden constraint + 3+ mechanisms | `math-ferry-current-roundtrip.ts` |
| `golden-math-piecewise-kayak` | Math | Piecewise interval boundary (river/kayak fixture lock) | `math-piecewise-kayak-golden.ts` |
| `golden-verbal-tr-author-inference` | Turkish verbal | Concessive attitude inference + lexical traps | `verbal-tr-author-inference.ts` |
| `golden-science-beam-moment` | Science (optional) | Uniform beam hidden center-of-mass moment | `science-beam-moment.ts` |

Generation-family regression (5 candidates): `generation-family-candidates.ts` → `GOLDEN_GENERATION_FAMILY_FERRY`.

---

## Per-item record shape

Each golden exports a `GoldenPedagogyRecord`:

| Section | Field |
|---------|--------|
| SOURCE | `source` (`SourceAnalystEnvelope`) |
| FINGERPRINT | `fingerprint` (`PedagogicalFingerprint`, expert-authored) |
| INVARIANTS | `invariants_summary` + fingerprint invariant fields |
| MUTABLE FEATURES | `mutable_features` + `mutable_surface_notes` |
| MUTATION PLAN | `mutation_plan` |
| EXPECTED PEDAGOGICAL FAMILY | `expected_pedagogical_family` |
| GOOD / BAD examples | `good_bad_examples` |
| DISTRACTOR CAUSALITY | `distractor_causality` |
| EXPECTED SOLVER RESULT | `expected_solver` |
| EXPECTED VERIFIER FINDINGS | `expected_verifier` |

---

## 1. Math STRONGEST — ferry round trip (`golden-math-ferry-current-roundtrip`)

### SOURCE (summary)

- **Stem:** 24 km crossing, 12 km/h still water, 4 km/h parallel current, **round trip** on same line.
- **Correct:** **B — 270 minutes** (1.5 h + 3 h).
- **Language:** en.

### FINGERPRINT (highlights)

| Dimension | Value |
|-----------|--------|
| Archetype | `AR_RELATIVE_SPEED_ROUNDTRIP` v1 |
| Reasoning pattern | `model_opposing_relative_rates_then_aggregate_legs` |
| Critical signal | Return leg reverses whether current helps or hinders |
| Hidden constraint | Opposite relative orientation on return without extra “against” wording |
| Reasoning steps | 4–5 |
| Burden | `light_mental` calc, `medium` language, `none` visual |
| Mechanisms | `MECH_CONCEPT_SWAP`, `MECH_READ`, `MECH_SPECIAL_CASE` (+ related `misc_arithmetic_mean_of_rates`) |

### INVARIANTS (checklist)

- Round-trip two-leg relative-rate model (not arithmetic mean of speeds).
- Distinct ground speeds on outbound vs return.
- Three documented wrong-option families tied to mechanism ids.
- Solution skeleton: parse → model_out → model_back → compute → verify.

### MUTABLE FEATURES

- Distance, still-water speed, current magnitude (with still > current).
- Vehicle/context nouns; units with consistent conversion.
- Choice order / labels.

### MUTATION PLAN (summary)

- `fingerprint_ref`: `fp-golden-math-ferry-v1`
- Regenerate A/C/D via `MECH_CONCEPT_SWAP`, `MECH_READ`, `MECH_SPECIAL_CASE` with new operands.
- `anti_copy_notes`: do not clone “parallel to the crossing” sentence skeleton.

### EXPECTED PEDAGOGICAL FAMILY

`AR_RELATIVE_SPEED_ROUNDTRIP` — relative-rate round trip; traps on ignoring current, same speed both legs, wrong orientation both legs.

### GOOD / BAD examples

| Label | Verdict |
|-------|---------|
| GOOD | 2 km channel, 10 km/h, 5 km/h current → 32 min (see `GOLDEN_GENERATION_FAMILY_FERRY[GOOD]`) |
| BAD_SURFACE | One-way crossing only → mechanism collapse |
| BAD_MECHANISM | Stem states arithmetic-mean speed rule → removes hidden constraint |

### DISTRACTOR CAUSALITY

| Slot | Value | MECH | TRAP | Misconception | Error path (short) |
|------|-------|------|------|---------------|-------------------|
| A | 240 min | `MECH_CONCEPT_SWAP` | `TRAP_CONCEPT_SWAP` | `misc_still_water_speed_for_whole_trip` | 48 km ÷ 12 km/h |
| C | 180 min | `MECH_READ` | `TRAP_READ`, `TRAP_CONCEPT_SWAP` | `misc_same_ground_speed_both_legs` | 16 km/h both legs |
| D | 360 min | `MECH_SPECIAL_CASE` | `TRAP_CONCEPT_SWAP` | `misc_unfavorable_speed_both_legs` | 8 km/h both legs |

### EXPECTED SOLVER RESULT

- Label **B**, 270 minutes, 5 reasoning phases, `independent_solver_should_match: true`.

### EXPECTED VERIFIER FINDINGS

- **Aggregate:** `APPROVE`
- Dimensions: `solution_skeleton`, `distractor_mechanisms`, `hidden_constraint` → **PRESERVED**
- Trivial codes: none

---

## 2. Math — piecewise kayak (`golden-math-piecewise-kayak`)

Tied to `src/shared/ai/fixtures/synthetic-river-problem.ts`.

### SOURCE

- 12 coins first hour, 8 each additional; 4 hours → **B = 36**.

### FINGERPRINT

- Archetype: `AR_RATE_PIECEWISE` v1  
- Hidden constraint: first hour is one interval; additional count = total − 1  
- Mechanisms: `MECH_CONCEPT_SWAP` (A, D), `MECH_BOUNDARY` (C)

### DISTRACTOR CAUSALITY

| Slot | Value | MECH | Path |
|------|-------|------|------|
| A | 32 | `MECH_CONCEPT_SWAP` | 4×8 |
| C | 44 | `MECH_BOUNDARY` | 12+4×8 |
| D | 48 | `MECH_CONCEPT_SWAP` | 4×12 |

### EXPECTED SOLVER / VERIFIER

- Solver: **B**, 36 coins  
- Verifier: **APPROVE** (expert distractor rows supersede `draft-inference` placeholders)

---

## 3. Turkish verbal (`golden-verbal-tr-author-inference`)

### SOURCE

- Passage: digital catalog praised as “kolaylık” while “henüz güvenilir ölçüt” warning retained.  
- **Correct: B** — temkinli beğeni.

### FINGERPRINT

- Archetype: `AR_VERBAL_ATTITUDE_CONCESSIVE` v1  
- Burden: `none` calc, **high** language  
- Four mechanisms: `MECH_PARTIAL`, `MECH_READ`, `MECH_SPECIAL_CASE`, `MECH_RED_HERRING`

### EXPECTED VERIFIER

- **APPROVE** with `language_burden` and `distractor_mechanisms` **PRESERVED**

---

## 4. Science — uniform beam (`golden-science-beam-moment`)

### SOURCE

- 4 m uniform plank, 40 N self-weight, 60 N at 1.0 m, supports at ends → **B = 35 N** at 4 m support.

### FINGERPRINT

- Archetype: `AR_SCIENCE_STATIC_TORQUE` v1  
- Hidden constraint: uniform → weight at 2.0 m  
- Visual burden: `decode_diagram` (text-implied diagram)

### DISTRACTOR CAUSALITY

| Slot | Value | MECH |
|------|-------|------|
| A | 15 N | `MECH_PARTIAL` — omit beam weight |
| C | 25 N | `MECH_BOUNDARY` — beam weight at 1 m |
| D | 65 N | `MECH_ARITH` — force split without moments |

---

## Fingerprint schema evaluation (math STRONGEST vs Zod)

**Reference schema:** `src/shared/validation/pedagogical-fingerprint.ts` + `docs/PEDAGOGICAL_FINGERPRINT_SPEC.md`

### Coverage — adequate

- All 19 spec dimensions map to Zod fields on `pedagogicalFingerprintSchema`.
- `distractorMechanismSlot` supports mechanism + trap + misconception id (Gate 4 causality).
- `dimension_evidence` + verdict enum align with evidence-based fidelity (no numeric score).

### Gaps / risks

| Gap | Impact | Proposed spec / schema update |
|-----|--------|------------------------------|
| **No first-class `distractor_trace` or `error_path` on fingerprint** — only slot summaries | Verifier cannot machine-link choice text to paths without separate candidate metadata | Add optional `error_paths: ErrorPathRecord[]` on fingerprint **or** require on each `GenerationCandidate` only; spec § evidence bundle should name which store is canonical |
| **`dimension_evidence` optional** — rule-engine may synthesize PRESERVED when absent (see `VERIFICATION_REPORT.md`) | False confidence vs spec | Spec addendum: **LOCKED fingerprints MUST have ≥1 evidence row per core invariant OR explicit UNVERIFIED blocks lock**; Zod refine on lock transition |
| **`cognitive_operation` / `reasoning_pattern` free text** | Cross-item regression harder | Gate 4: closed enum superset + free-text `label` field (spec open item) |
| **No `information_order` enum** | Drift detection subjective | Add controlled class enum: `rates_then_duration`, `simultaneous_givens`, `passage_then_question`, … |
| **Mutable surface only via `mutable_surface_notes` + mutation plan** — correct per spec split, but easy to under-document | T1 false negatives | Mutation plan schema should require `surface_mutations` min length when generating |
| **Golden math needs `visual_reasoning_burden: none` but science needs `decode_diagram`** — schema OK; verifier must not default visual to NOT_APPLICABLE for text-only science stems | Mis-verdict on science items | Verifier rule: text-implied geometry counts as `decode_diagram` when stem encodes positions |

### Schema change priority (Architect)

1. Lock-time evidence mandatory (W3).  
2. Candidate-level `error_path` records linked to `choice_label` (generation rules already define semantics).  
3. `information_order` enum (non-blocking).

---

## Golden generation family (5 candidates)

Parent fingerprint: **`golden-math-ferry-current-roundtrip`**.  
Implementation: `fixtures/pedagogy/generation-family-candidates.ts`.

| Kind | Intent | Expected verifier aggregate | Trivial / finding codes |
|------|--------|---------------------------|-------------------------|
| **GOOD** | Faithful mutation (2 km / 10 / 5 km/h → 32 min) | **APPROVE** | — |
| **TOO-SIMILAR** | Isomorphic stem to source | **REJECT** | `REJECT_TRIVIAL`, `REJECT_SIBLING` |
| **DRIFTED** | One-way / collapsed skeleton | **REJECT** | `REJECT_MECHANISM` |
| **BAD-DISTRACTOR** | Nearby minutes without paths | **REJECT** | `REJECT_DISTRACTOR` |
| **SOLVER-MISMATCH** | Keyed answer ≠ solver (180 vs 270) | **REJECT** | `REJECT_MECHANISM`; dimensions **UNVERIFIED** |

---

## Relationship to river synthetic fixture

| Artifact | Status |
|----------|--------|
| `SYNTHETIC_RIVER_FIXTURE` | Gate 2 demo / extraction scaffold |
| `GOLDEN_MATH_PIECEWISE_KAYAK` | Expert golden fingerprint + causality — use for Gate 3–4 pedagogy tests |
| `inferFingerprintDraftFromExtraction` | Still index-based distractors — **do not** treat as golden |

---

## HANDOFF — May Gates 3–4 proceed

| Gate | Verdict | Rationale |
|------|---------|-----------|
| **Gate 3** (fingerprint draft → expert lock) | **CONDITIONAL YES** | Golden suite + kayak lock **ready** for verifier samples; infra already **APPROVE** per `PEDAGOGY_REVIEW_SAMPLES.md`. **Conditions:** (1) wire tests to import `GOLDEN_PEDAGOGY_SUITE`; (2) mandatory evidence before LOCKED; (3) fix rule-engine synthetic PRESERVED when evidence absent. |
| **Gate 4** (mutation + generation) | **CONDITIONAL YES** | Generation-family negatives defined; mutation plan semantics clear. **Conditions:** (1) implement mutation-plan + error-path storage; (2) enforce T1–T6 against `GOLDEN_GENERATION_FAMILY_FERRY`; (3) replace draft distractor inference with golden-backed regression for river item. |

**Overall Wave Q0 pedagogy deliverable:** **COMPLETE** (fixtures + doc + schema gap list + 5-family table).  
**May Gates 3–4 proceed:** **CONDITIONAL** — proceed with golden-backed verification; block **LOCKED** promotion and production generation until evidence mandatory + rule-engine false-PRESERVED fix land (tracked in `VERIFICATION_REPORT.md` W2–W3).

---

## Cross-references

- `docs/PEDAGOGICAL_FINGERPRINT_SPEC.md`
- `docs/QUESTION_GENERATION_RULES.md`
- `docs/PEDAGOGY_REVIEW_SAMPLES.md`
- `docs/BUILD_LOG.md` (work package 2)
