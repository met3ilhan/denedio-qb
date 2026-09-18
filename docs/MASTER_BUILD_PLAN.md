# Master Build Plan

## Status

Phases defined; execution **NOT STARTED**.

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

## Quality gates

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
- Fingerprint and generation rules drafted for implementation
- UX: three directions evaluated, **DESIGN AUTHORITY: LOCKED** in design docs

**Status:** NOT STARTED

---

### GATE 2 — Source Extraction

**Pass when:** Source upload → structured extraction meets spec; Tester exercises workflow; Verifier samples fidelity to source (not copy-paste).

**Status:** NOT STARTED

---

### GATE 3 — Pedagogical Fingerprint

**Pass when:** Fingerprint spec complete; invariants vs mutable surface documented; Verifier approves sample fingerprints.

**Status:** NOT STARTED

---

### GATE 4 — Controlled Generation

**Pass when:** Generation preserves mechanism (not number swaps); schema enforced; samples reviewed.

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

## Current focus

**AGENT OFFICE BOOTSTRAP** → next: **ORCHESTRATED PRODUCT DISCOVERY**
