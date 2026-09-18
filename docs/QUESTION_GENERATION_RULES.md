# Question Generation Rules

## Status

**DEFINED (Gate 1 discovery)** — depends on `docs/PEDAGOGICAL_FINGERPRINT_SPEC.md`. Pedagogy Expert authority. Gate 4+ generation must comply; Verifier enforces.

## Core principle

**Different question, same pedagogical challenge.**

Generation is **controlled mutation** of an approved fingerprint, not paraphrase of the source stem and not numeric substitution that leaves the mechanism unchanged in name only.

Preserve:

- Measured skill, cognitive operation, reasoning pattern, solution skeleton
- Critical signal **role**, hidden constraint, information order class
- Distractor mechanisms, misconception targets, trap types, elimination opportunities
- Burden bands (calculation, language, visual) and expected solve time band

Change freely on **mutable surface** (see fingerprint spec): context, names, operands, cosmetic layout—**only if** invariants and burden bands remain satisfied and trivial-mutation checks pass.

---

## Controlled mutation pipeline

Every generated candidate must be producible from an auditable chain:

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐     ┌──────────────────┐
│ Source item │ ──► │ Approved         │ ──► │ Mutation plan   │ ──► │ New question     │
│ (reference) │     │ fingerprint vN   │     │ (per candidate) │     │ (stem + choices) │
└─────────────┘     └──────────────────┘     └─────────────────┘     └──────────────────┘
```

### Stage A — Source (reference only)

- Source is **evidence** and **provenance**, not a template to paste.
- Extraction captures structure; fingerprint captures mechanism.

### Stage B — Approved fingerprint

- All invariant dimensions populated or NOT_APPLICABLE with rationale.
- Evidence bundle attached (see fingerprint spec).
- No generation from draft/unreviewed fingerprints in production paths.

### Stage C — Mutation plan (required per candidate)

A mutation plan is a structured intent document (human- or model-authored, schema-bound later). Minimum fields:

| Field | Purpose |
|-------|---------|
| `fingerprint_ref` | Version id of approved fingerprint |
| `surface_mutations` | Explicit list: context, names, numbers, diagram class changes |
| `invariant_assertions` | Statement that each invariant dimension is unchanged (by class, not by copied text) |
| `operand_constraints` | Rules keeping calculation/visual/language burden in band |
| `distractor_regeneration` | Map each choice slot to mechanism id + new parameters |
| `anti_copy_notes` | How stem wording diverges from source while preserving mechanism |

**Gate:** No candidate without a mutation plan record linked in provenance (Architect implements storage; semantics fixed here).

### Stage D — New question

- Stem, choices, media, metadata produced from plan.
- Each distractor carries **causality metadata** (error path id, mechanism id, misconception id).
- Candidate enters independent solver + Verifier fidelity bundle (Gate 6 / Verifier).

---

## Trivial mutation rejection

Reject (do not ship; do not auto-approve) when any of the following hold:

### T1 — Numeric substitution only

- Stem structure, signal placement, and step skeleton unchanged; only literals replaced.
- **And** burden band unchanged or **easier** (fewer steps, simpler arithmetic).
- **Test:** Remove numbers from stem and choices; if skeleton is isomorphic to source, require additional surface or structural mutation that still preserves invariants—or reject.

### T2 — Wording clone

- Sentence-level overlap with source above policy threshold (Verifier sets threshold; default: “reads as same item with edits”).
- Synonym swap without change to information order or trap placement.

### T3 — Mechanism collapse

- Generated item solvable with strictly fewer **reasoning phases** than fingerprint band.
- Critical signal or hidden constraint removed or stated explicitly without fingerprint update.
- Distractors no longer instantiate declared trap types / misconception targets.

### T4 — Decorative distractors

- Any wrong option lacks documented error path (see distractor causality).
- Option is “nearby number,” “longest choice,” or random without mechanism linkage.

### T5 — Difficulty drift

- Expected solve time band or primary difficulty factors change materially without fingerprint revision.
- Elimination opportunities removed when fingerprint marks them as required for intended difficulty.

### T6 — Near-duplicate siblings

- Same fingerprint version produces candidates that differ only by operand permutation or choice reorder.
- Batch policy: siblings must differ on at least one **non-cosmetic** mutable dimension (e.g. context class, information order presentation) while sharing invariants—or be deduplicated.

**Outcome codes:** `REJECT_TRIVIAL`, `REJECT_MECHANISM`, `REJECT_DISTRACTOR`, `REJECT_COPY`, `REJECT_SIBLING` — for audit and metrics, not a single quality score.

---

## Distractor taxonomy and causality

### Causality rule (hard)

Every wrong option must satisfy:

1. **Producible:** There exists a documented **error path**—a plausible student action or belief—that yields exactly this option (or this option rounded/permitted by item rules).
2. **Aligned:** The path maps to a **distractor mechanism** and **misconception target** on the fingerprint.
3. **Traceable:** Metadata stores mechanism id + path summary; Verifier can replay the path without inventing ad hoc excuses.

**Forbidden:** arbitrary proximity, “sounds right,” filler, or duplicate of correct answer with typo unless typo path is documented.

### Mechanism families (controlled taxonomy)

Use these labels in fingerprint and choice metadata (extend only via Pedagogy Expert revision):

| Mechanism id | Description | Typical misconception / error |
|--------------|-------------|--------------------------------|
| `MECH_PARTIAL` | Stopped mid-solution | “Do the first step only” |
| `MECH_REVERSED` | Inverse operation | “Divide instead of multiply” |
| `MECH_UNIT` | Unit / scale slip | Magnitude correct, unit wrong |
| `MECH_BOUNDARY` | Off-by-one / endpoint | Fence post, inclusive/exclusive |
| `MECH_SPECIAL_CASE` | Wrong generalization | Single example over-applied |
| `MECH_RED_HERRING` | Overweight irrelevant data | Given number used because salient |
| `MECH_ARITH` | Arithmetic slip | Sign, carry, order of ops |
| `MECH_CONCEPT_SWAP` | Confused quantities | Rate vs time, mean vs median |
| `MECH_READ` | Misread stem | “Not” ignored, wrong subject |
| `MECH_VISUAL` | Diagram misread | Axis, label, area vs length |
| `MECH_ELIM_FAIL` | False elimination | “Too big to be answer” incorrectly |

Mechanism ids on the candidate must be a **subset of** fingerprint `distractor_mechanisms`; new mechanisms require fingerprint version bump.

### Trap types (structural, cross-cut mechanisms)

Trap types from fingerprint spec (examples): `TRAP_PARTIAL`, `TRAP_UNIT`, `TRAP_BOUNDARY`, `TRAP_RED_HERRING`, `TRAP_CONCEPT_SWAP`, `TRAP_READ`, `TRAP_VISUAL`.

Each major distractor should reference at least one `MECH_*` and one `TRAP_*` where applicable.

### Error path record (per wrong choice)

Minimum semantic content (JSON schema later):

- `choice_label` — A/B/C/D/E or platform equivalent
- `mechanism_id` — from table above
- `misconception_id` — stable slug from fingerprint
- `steps` — 1–3 bullet student actions (“uses 12 without converting hours”)
- `produces_value` — how arithmetic/logic yields the distractor value
- `validator_note` — optional expert comment

Independent solver (Gate 6) must not be the **sole** author of causality metadata; generator proposes, Verifier spot-checks, expert resolves disputes.

---

## Distractor generation procedure

1. Read fingerprint **misconception targets** and **trap types**.
2. For each required wrong slot, pick mechanism from fingerprint set (vary surface, not mechanism mix, unless plan says otherwise).
3. Instantiate parameters (numbers, phrases) so **burden bands** hold and error path is valid.
4. Verify **produces_value** matches choice text under item rules (rounding, units).
5. Confirm correct answer is **unique** under stated constraints; if multiple defensible answers, reject item.

---

## Stem and context mutation rules

- **Paraphrase required:** new syntactic structure; preserve information order **class**.
- **Critical signal:** must appear in equivalent rhetorical position (e.g. still easy to skim past if invariant says so).
- **Hidden constraint:** must not be added to stem unless fingerprint updated to remove “hidden” class.
- **Media:** diagram changes allowed if `visual_reasoning_burden` class unchanged; redraw, don’t remove demand.

---

## Difficulty and solve-time alignment

- Do not tune difficulty solely by making numbers uglier; adjust constraint tightness, trap density, or signal subtlety within fingerprint bands.
- If mutation plan targets easier cohort, that is a **new fingerprint** or explicit `difficulty_factors` revision—not silent drift.

---

## Batch and sibling policy

- Max candidates per fingerprint version without human review: policy TBD by Product; default conservative (Verifier recommends small batches).
- Siblings must pass **T6** and vary mutation plan `surface_mutations` meaningfully.
- Catalog must not accumulate near-duplicates under different ids.

---

## AI usage boundaries

- Models **propose** mutation plans, stems, distractors, and error paths; they do **not** self-certify correctness or fidelity.
- **Independent solver** required before approval (Gate 6; see `docs/AI_PIPELINE.md`).
- Model output that fails trivial mutation or causality rules is discarded or sent for rework—not downgraded with a numeric score.

---

## Verification hooks

| Check | Owner |
|-------|--------|
| Invariant checklist + evidence bundle | Verifier |
| T1–T6 trivial / sibling rules | Verifier + automated linters where possible |
| Distractor error path replay | Verifier spot-check; expert adjudication |
| Excessive source copy | Verifier textual policy |

---

## Relationship to fingerprint spec

| Fingerprint dimension | Generation obligation |
|-------------------------|------------------------|
| Solution skeleton | Candidate solution decomposes to same phase types |
| Distractor mechanisms | Each wrong choice maps to declared mechanism |
| Burden bands | Operand and wording choices stay in band |
| Archetype | Candidate identifies same archetype id |

See `docs/PEDAGOGICAL_FINGERPRINT_SPEC.md` for full dimension definitions and fidelity bundle.

---

## Open items (non-blocking for Gate 1)

- Exact copy overlap threshold and sibling distance metrics (Verifier + Product).
- Machine schema for mutation plan and error path records (`docs/AI_SCHEMAS.md`).
