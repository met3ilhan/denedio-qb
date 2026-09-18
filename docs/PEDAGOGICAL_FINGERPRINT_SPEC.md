# Pedagogical Fingerprint Spec

## Status

**DEFINED (Gate 1 discovery)** — Pedagogy Expert authority. Implementer and Architect must not weaken semantics for schema or UI convenience. Verifier validates fidelity against this document (Gates 3+).

## North star

**Different question, same pedagogical challenge.**

A generated item is faithful when a prepared student faces the **same intellectual work** as on the source item: same skill demand, same reasoning moves, same traps and eliminations—not the same numbers, names, or surface story.

Superficial surface mutation (numeric substitution, synonym swap, reordering that removes a trap) is **out of scope** for “generation”; it is trivial mutation and must be rejected (see `docs/QUESTION_GENERATION_RULES.md`).

---

## What a fingerprint is

A **pedagogical fingerprint** is a structured, reviewable description of **why the source question is hard and what it teaches**, independent of incidental wording and context dressing.

| Role | Description |
|------|-------------|
| **Fingerprint** | Canonical mechanism record for one source item (or approved archetype instance). |
| **Invariant set** | Fields that generation must preserve unless an expert explicitly revises the fingerprint. |
| **Mutable surface** | Fields that may change while the invariant set stays fixed. |
| **Evidence bundle** | Pointers to source text, worked solution, and reviewer notes that justify each non-default field value. |

Fingerprints are **authored or inferred then human-reviewed** (Gate 3). They are not inferred solely by the generator at generation time.

---

## Fingerprint fidelity (evidence-based, not one score)

**Forbidden:** a single 0–100 “similarity” or “fidelity” score as the approval gate.

**Required:** dimension-level findings with **evidence**, each labeled:

| Verdict | Meaning |
|---------|---------|
| **PRESERVED** | Candidate matches the fingerprint on this dimension; evidence cited. |
| **DRIFT** | Material mismatch; blocks approval until fixed or fingerprint revised. |
| **NOT_APPLICABLE** | Dimension intentionally unused for this archetype; rationale recorded. |
| **UNVERIFIED** | Insufficient evidence; blocks approval for automated paths. |

### Evidence types (non-exhaustive)

- **Source anchor** — excerpt + location (page, item id) showing the mechanism in the original.
- **Solution trace** — step list showing reasoning moves (may be expert or independent solver output).
- **Distractor trace** — for each wrong option, the error path that produces it (see generation rules).
- **Diff check** — explicit note of what changed on the mutable surface vs what stayed invariant.
- **Reviewer attestation** — human expert sign-off on ambiguous dimensions.

### Minimum fidelity bundle for Verifier (Gate 4+)

Verifier treats a candidate as **unproven** unless the bundle includes:

1. Side-by-side **invariant checklist** (all invariant fields: PRESERVED or justified NOT_APPLICABLE).
2. **Solution skeleton alignment** — same step count band and same operation types per step.
3. **Distractor mechanism alignment** — same trap types and misconception targets (wrong options may differ numerically).
4. **Burden alignment** — calculation, language, and visual reasoning within agreed bands (see dimensions below).
5. **No trivial-mutation flags** from generation rules.

Aggregate outcome is **APPROVE / REJECT / REVISE_FINGERPRINT**, not a numeric grade.

---

## INVARIANTS vs MUTABLE SURFACE

**Rule:** If changing a field would let a weaker strategy succeed, or would remove the intended misconception trap, that field is an **invariant**. When in doubt, classify as invariant until expert review says otherwise.

### Summary table

| Dimension | Default class | Notes |
|-----------|---------------|-------|
| Measured skill | **Invariant** | What competence is assessed. |
| Learning objective | **Invariant** | Intended learning outcome (may be broader than skill). |
| Cognitive operation | **Invariant** | Primary mental act (e.g. compare, infer, optimize). |
| Reasoning pattern | **Invariant** | Recurring structure of thought (e.g. work backwards from constraint). |
| Solution skeleton | **Invariant** | Ordered reasoning phases, not final numbers. |
| Critical signal | **Invariant** | Cue the student must notice to avoid failure. |
| Hidden constraint | **Invariant** | Unstated or easy-to-miss limit that shapes the solution. |
| Number of reasoning steps | **Invariant (band)** | Integer or range; step *types* must match. |
| Information order | **Invariant** | What must be discovered before what; red herring placement. |
| Calculation burden | **Invariant (band)** | Arithmetic complexity class, not specific operands. |
| Language burden | **Invariant (band)** | Reading load, ambiguity, register—not exact sentences. |
| Visual reasoning burden | **Invariant (band)** | Diagram/table/spatial demand class. |
| Distractor mechanisms | **Invariant** | How wrong options tempt the student. |
| Misconception targets | **Invariant** | Beliefs or habits each distractor exploits. |
| Trap types | **Invariant** | Structural trap families (e.g. partial solution, unit slip). |
| Elimination opportunities | **Invariant** | Legitimate shortcuts that preserve difficulty intent. |
| Difficulty factors | **Invariant (set)** | Which factors dominate; bands may shift slightly with surface. |
| Expected solve time | **Invariant (band)** | Target duration class for prepared cohort. |
| Question archetype | **Invariant** | Template family for mechanism (see below). |
| Stem wording | Mutable | Must preserve mechanism; no excessive copy (generation rules). |
| Numerical values | Mutable | Must preserve burden bands and trap logic. |
| Names, settings, objects | Mutable | Context dressing. |
| Diagram labels / cosmetic layout | Mutable | Unless visual reasoning burden depends on specific layout class. |
| Choice order | Mutable | Unless elimination order is part of mechanism (then invariant). |
| Letter labels (A–E) | Mutable | — |

### Examples

**Faithful (same challenge, different surface)**

- Source: rate problem with a hidden “consistent units” constraint; distractors from unit conversion error.
- Generated: different rates and context (pipes, workers); same hidden unit constraint, same trap types, same step skeleton.

**Unfaithful (trivial or mechanism break)**

- Same stem with coefficients scaled linearly so mental steps collapse to one division.
- Distractors replaced with random nearby integers with no documented error path.
- Information reordered so the critical signal appears in the first sentence, removing the intended read-carefully demand.

---

## Required dimensions (full model)

Each field below must appear on every fingerprint record (nullable only where NOT_APPLICABLE is documented). Values use **controlled vocabularies** where noted; free text is for nuance, not a substitute for enums/bands.

### 1. Measured skill

**Definition:** The narrow capability the item scores (e.g. “apply Pythagorean theorem in 3D,” “distinguish correlation from causation in a short passage”).

**Invariant.** Must be stable across generation.

**Evidence:** Source metadata (if any), expert mapping to curriculum/skill taxonomy when available.

---

### 2. Learning objective

**Definition:** The teaching intent one level above skill—what the student should be better at after mastering items like this.

**Invariant.**

**Evidence:** Curriculum alignment note or expert statement.

---

### 3. Cognitive operation

**Definition:** Primary operation from Bloom-style or discipline-specific taxonomy (recall, apply, analyze, evaluate, create; or discipline verbs).

**Invariant.** Single primary; secondary operations optional.

**Evidence:** Solution trace showing where the operation occurs.

---

### 4. Reasoning pattern

**Definition:** Named pattern of thought the student must execute (e.g. “constraint propagation,” “eliminate impossible cases,” “compare extremes,” “translate verbal to symbolic then invert”).

**Invariant.**

**Evidence:** Solution skeleton step types map to this pattern.

---

### 5. Solution skeleton

**Definition:** Ordered list of **reasoning phases**, each with:

- `phase_id`
- `operation_type` (from a small closed set: parse, model, compute, compare, verify, eliminate, …)
- `depends_on` (prior phases)
- `critical_substep` (yes/no)

**Invariant.** Phase count and operation types must match within documented bands; numeric outputs in skeleton are illustrative only.

**Evidence:** Worked solution decomposed into phases; independent solver trace may corroborate.

---

### 6. Critical signal

**Definition:** The word, relation, diagram feature, or data point that unlocks the correct approach; missing it leads to a predictable wrong path.

**Invariant** (presence and *role*; exact surface form mutable).

**Evidence:** Highlight in source; link to trap types that activate when signal is missed.

---

### 7. Hidden constraint

**Definition:** Limit not shouted in the stem (domain restriction, integer-only, conservation law, “at most one,” sign convention).

**Invariant.**

**Evidence:** Show how solution fails if constraint ignored; link to at least one distractor mechanism.

---

### 8. Number of reasoning steps

**Definition:** Count of non-trivial reasoning phases in solution skeleton (not arithmetic micro-steps unless they define burden).

**Invariant band:** e.g. 3–4 steps, or exact N when archetype requires it.

**Evidence:** Skeleton length; reject generation that collapses or inflates steps outside band.

---

### 9. Information order

**Definition:** How facts become usable—sequential discovery, simultaneous constraints, misleading early fact, diagram-after-text, etc.

**Invariant.**

**Evidence:** Source layout description; note if mutable surface may reorder only when order class preserved.

---

### 10. Calculation burden

**Definition:** Arithmetic demand class: none, light mental, multi-step numeric, symbolic, calculator-expected, etc.

**Invariant band.**

**Evidence:** Approximate operation count and number size class from source; candidate must match band.

---

### 11. Language burden

**Definition:** Reading load: sentence length, clause depth, discipline jargon density, ambiguity intentional or not.

**Invariant band.**

**Evidence:** Readable metrics or expert judgment with source quote.

---

### 12. Visual reasoning burden

**Definition:** None | decode diagram | spatial transform | graph read | table cross-reference | combined.

**Invariant band** and layout **class** if mechanism depends on visual structure.

**Evidence:** Describe what must be seen; NOT_APPLICABLE only for purely textual items.

---

### 13. Distractor mechanisms

**Definition:** For each wrong option slot (or mechanism type if count flexible): how the option is **produced**—not its value.

**Invariant** at mechanism-type level; specific values mutable.

**Evidence:** Error path per mechanism (see `docs/QUESTION_GENERATION_RULES.md`).

---

### 14. Misconception targets

**Definition:** Stable student beliefs or habits exploited (e.g. “add denominators,” “ignore base rate,” “treat average speed as arithmetic mean of speeds”).

**Invariant set** aligned with distractor mechanisms.

**Evidence:** One misconception per major distractor family.

---

### 15. Trap types

**Definition:** Structural trap taxonomy (controlled list maintained in generation rules): partial answer, reversed operation, unit slip, boundary off-by-one, plausible special case, overfitting to red herring, etc.

**Invariant set.**

**Evidence:** Map each trap type to at least one distractor or failure mode.

---

### 16. Elimination opportunities

**Definition:** Valid non-solution reasoning that narrows choices (order of magnitude, dimensional analysis, symmetry, monotonicity) without fully solving.

**Invariant:** which elimination **types** exist; optional whether they are required for intended difficulty.

**Evidence:** Show elimination still available in candidate.

---

### 17. Difficulty factors

**Definition:** Dominant contributors: novelty, trap density, time pressure, multi-constraint, low signal-to-noise, etc.

**Invariant set** (which factors apply); relative weights qualitative (primary / secondary).

**Evidence:** Reviewer note; compare source vs candidate factor set.

---

### 18. Expected solve time

**Definition:** Target seconds or band for the intended cohort under exam-like conditions.

**Invariant band** (e.g. 60–90s).

**Evidence:** Pilot data if available; else expert estimate with cohort stated.

---

### 19. Question archetype

**Definition:** Named mechanism family (e.g. “hidden constraint word problem,” “inverse proportion with distractor partial,” “reading: inference with lexical trap”).

**Invariant.** Archetype id + version; links to org-wide catalog when it exists.

**Evidence:** Similar items list; archetype definition paragraph.

---

## Fingerprint lifecycle (conceptual)

```
Source item
  → extraction (structured stem, choices, media refs)
  → fingerprint draft (model-assisted, schema-bound later)
  → expert review (invariants locked, evidence attached)
  → approved fingerprint (versioned)
  → mutation plans & generation (Gate 4+)
```

Revisions to invariants after approval require **new fingerprint version** and re-verification of dependents.

---

## Relationship to other docs

| Document | Relationship |
|----------|----------------|
| `docs/QUESTION_GENERATION_RULES.md` | Mutation pipeline, distractor taxonomy, trivial rejection |
| `docs/AI_SCHEMAS.md` | Future JSON shape; must encode this model without dropping dimensions |
| `docs/AI_PIPELINE.md` | Stage 2–4 consume fingerprints |
| `docs/VERIFICATION_REPORT.md` | Verifier applies fidelity bundle above |

---

## Open items (non-blocking for Gate 1)

- Org skill taxonomy ids and archetype catalog numbering (Product / curriculum owners).
- Exact closed enums for `operation_type` and trap types in machine schema (Architect + Pedagogy, Gate 3–4).

---

## Addendum — Gate 3 sample review (2026-09-18)

**Synthetic river fixture** (`SYNTHETIC_RIVER_FIXTURE` → `inferFingerprintDraftFromExtraction`): invariant **mechanism fields** (skill, skeleton, critical signal, piecewise archetype) are directionally correct for the stem; **mutable surface** is correctly scoped via `mutable_surface_notes` and mutation-plan surface dimensions, not fingerprint patch fields.

**Distractor mechanisms on the inferred draft are placeholder** (index-based `MECH_PARTIAL` / `MECH_ARITH`, all `TRAP_PARTIAL`) and do not match the item’s wrong-option arithmetic paths. Closed `MECH_*` / `TRAP_*` enums in code satisfy taxonomy **schema** readiness; **sample payload quality** requires expert-authored distractor rows and evidence before lock.

Full findings and HANDOFF: **`docs/PEDAGOGY_REVIEW_SAMPLES.md`** — Gate 3 sample quality **NEEDS WORK** (infra/tests **APPROVE**).
