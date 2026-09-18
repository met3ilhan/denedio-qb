# Design QA — Gate 9 (Direction B: Pedagogy Signal Lab)

| Field | Value |
|-------|--------|
| **Date** | 2026-09-18 |
| **Authority** | D-004 locked design (`docs/DESIGN_SYSTEM.md`, `docs/UX_SPEC.md`) |
| **Scope (this review)** | **S10** `CandidateComparisonMatrix` · **S11** `DistractorCausalityEditor` + `CandidateInspectorWorkspace` shell |
| **Evidence** | Source review, `e2e/s10-comparison.spec.ts`, screenshot `artifacts/screenshots/candidate-review-1440.png` (S11); S10 matrix not in screenshot baseline yet |
| **Reviewer role** | Designer Gate 9 Pass A + Pass B |

## Pass definitions

| Pass | Focus | Rejects when |
|------|--------|--------------|
| **Pass A** | Screen IA, normative layouts, component behavior (`ComparisonMatrix`, `ChoiceRail`, `CausalityDrawer`), phase tokens, flows, Gate 9 accessibility baseline | Material deviation from `UX_SPEC.md` complex layouts or missing required interactions |
| **Pass B** | Typography scale (`text-display` … `text-stem`), 4px spacing system, 24px gutters, 16px panel padding, 6px/8px radius, 44px row/action targets | Systematic type/spacing drift that hurts scanability or touch usability |

Status values: **PASS** · **FIX REQUIRED** · **N/A** (out of scope or not shipped in v1)

---

## Global Gate 9 checklist (`docs/DESIGN_SYSTEM.md`)

| # | Item | Status | Notes |
|---|------|--------|-------|
| G1 | Studio rail + phase signal strip on all S01–S18 | **PASS** | S10/S11 use `StudioShell` + `activePhase="CANDIDATES"` |
| G2 | S01 has **no** chart/KPI dashboard modules | **N/A** | Not in S10/S11 scope |
| G3 | Severity badges consistent S01, S12, S18 | **N/A** | S10 matrix uses glyphs only, not `SeverityBadge` |
| G4 | Stem preview uses `text-stem` token | **FIX REQUIRED** | `text-stem` not defined in `globals.css`; S11 source stem uses `text-body` / `text-sm` |
| G5 | CONFIRMED/PROPOSED badges on S17 match contract legend | **N/A** | S17 not reviewed |
| G6 | Dry-run console matches **DryRunConsole** pattern | **N/A** | S18 not reviewed |

---

## S10 — Candidate comparison (`CandidateComparisonMatrix`)

### Pass A — UX & components

| # | Requirement (UX / design system) | Status | Notes |
|---|----------------------------------|--------|-------|
| S10-A1 | Route `/missions/:id/candidates/compare` inside studio shell | **PASS** | `compare/page.tsx` + `StudioShell` |
| S10-A2 | Header: run id, fingerprint version, filter affordances | **PASS** | `compare-run-header`, fingerprint label, filter cluster |
| S10-A3 | Matrix: mechanism + pedagogy row set incl. fingerprint dimensions | **PASS** | `buildSiblingComparisonMatrix`: mechanism, stem, distractor, six `fp_*` rows, fidelity gate, solver, verifier, originality, approval |
| S10-A4 | **ComparisonMatrix** pattern: flat bordered grid, monospace-adjacent cell telemetry | **PASS** | Bordered table, `font-mono text-xs` on cells, no decorative shadows |
| S10-A5 | Filter: mechanism deltas only | **PASS** | `compare-filter-mechanism-deltas` |
| S10-A6 | Additional quality filters (fail/warn, fingerprint drift, distractor row) | **PASS** | Extends wireframe; aligned with verification workflow |
| S10-A7 | Sticky first column on horizontal scroll | **PASS** | `sticky left-0` on dimension header + cells |
| S10-A8 | Sticky header on comparison table | **FIX REQUIRED** | Design system data tables: sticky header; only first column is sticky today |
| S10-A9 | Row click → preview drawer with stem excerpts | **PASS** | `compare-preview-drawer`, side-by-side cell detail |
| S10-A10 | Checkbox column → batch open S11 | **PASS** | Select + `compare-open-candidate` links |
| S10-A11 | Keyboard-navigable grid + aria labels on mechanism rows | **FIX REQUIRED** | Plain `<table>`; no `role="grid"`, row `aria-label`, or documented keyboard path |
| S10-A12 | Status signaling: icon + label; do not rely on color alone | **PASS** | Glyph + text in `detail`; no color-only encoding |
| S10-A13 | Optional severity token coloring for fail/warn/pass cells | **FIX REQUIRED** | No `--qs-severity-*` on cells; scannability below Signal Lab bar for dense matrices |
| S10-A14 | Playwright coverage for matrix, filter, preview, navigation | **PASS** | `e2e/s10-comparison.spec.ts` |

### Pass B — Typography & spacing

| # | Requirement | Status | Notes |
|---|-------------|--------|-------|
| S10-B1 | Screen title `text-display`; screen id `text-mono` | **PASS** | Compare page header |
| S10-B2 | Table body uses `text-body` or deliberate `text-mono` for data | **FIX REQUIRED** | Table wrapper `text-sm` (14px) vs locked `text-body` 15px; mixed with `text-xs` cells |
| S10-B3 | Filter controls: 6px radius, border `--qs-border` | **PASS** | Select + checkboxes |
| S10-B4 | Data table min row height 44px | **FIX REQUIRED** | `py-2` rows likely &lt; 44px |
| S10-B5 | Panel/gutter 24px where normative 12-col grid applies | **FIX REQUIRED** | Matrix block uses `space-y-4` (16px) vs 24px gutter spec |
| S10-B6 | Preview drawer padding 16px, 8px panel radius | **PASS** | `p-4`, `rounded-lg` |

**S10 Pass A summary:** 11 PASS · 3 FIX REQUIRED · 0 blocking N/A  
**S10 Pass B summary:** 3 PASS · 3 FIX REQUIRED  

---

## S11 — Candidate editor & distractor causality

### Pass A — UX & components

| # | Requirement (UX / design system) | Status | Notes |
|---|----------------------------------|--------|-------|
| S11-A1 | Studio shell, S11 header, link to S12 | **PASS** | `candidates/[id]/page.tsx` |
| S11-A2 | Normative layout: stem canvas → **bottom** choice rail → choice detail + **right causality drawer** | **FIX REQUIRED** | Implemented as 50/50 columns; `ChoiceRail` lives at top of right panel (`border-t`), not below stem editor |
| S11-A3 | **ChoiceRail** horizontal A–E for wrong choices | **PASS** | Phase-filled active state (`--qs-phase-candidates`); behavior correct |
| S11-A4 | **CausalityDrawer** fields: mechanism, misconception, trap, error path | **PASS** | MECH select, misconception, trap toggles, likely mistake, why attractive, produces value, steps, live causality status |
| S11-A5 | Source / locked invariant context (read-only) | **PASS** | `expert-source-context` |
| S11-A6 | Save + verification stale signaling | **PASS** | Save button, stale banner |
| S11-A7 | Autosave drafts (UX spec) | **FIX REQUIRED** | Manual save only — document as v1 gap or implement |
| S11-A8 | Focus order: rail → main → drawer | **FIX REQUIRED** | Two-column grid; distractor rail not in spec focus path |
| S11-A9 | Primary actions ≥ 44px touch target | **FIX REQUIRED** | Save `py-2`; trap chips `py-1 text-xs` |
| S11-A10 | `<1024px` editing: wider-viewport banner | **N/A** | Not implemented on S11 (acceptable read-only only per design system v1 note; editing still allowed) |

### Pass B — Typography & spacing

| # | Requirement | Status | Notes |
|---|-------------|--------|-------|
| S11-B1 | Section headers `text-title` | **PASS** | Expert editor + distractor headings |
| S11-B2 | Form labels consistent (uppercase muted vs sentence case) | **FIX REQUIRED** | Distractor panel: `text-xs font-semibold uppercase`; expert column: `font-medium` without uppercase |
| S11-B3 | Question / choice preview uses `text-stem` | **FIX REQUIRED** | Choice readout `text-sm`; source stem `text-body text-sm` |
| S11-B4 | Panel padding 16px | **PASS** | `p-4` on sections |
| S11-B5 | Column gutter 24px on ≥1280 three-panel intent | **FIX REQUIRED** | `gap-4` (16px) on `lg:grid-cols-2` |
| S11-B6 | Controls: 6px radius | **PASS** | Inputs/selects `rounded-md` |
| S11-B7 | Causality status block: console-like muted panel | **PASS** | `bg-[var(--qs-canvas)]` aside |

**S11 Pass A summary:** 5 PASS · 4 FIX REQUIRED · 1 N/A  
**S11 Pass B summary:** 3 PASS · 3 FIX REQUIRED  

---

## Cross-cutting (S10 + S11)

| # | Item | Status | Notes |
|---|------|--------|-------|
| X1 | Direction B tokens (`--qs-*`) on surfaces | **PASS** | No off-palette decorative shadows |
| X2 | Phase color on candidate-phase actions | **PASS** | Orange candidate phase on rail/save |
| X3 | `text-stem` utility implemented project-wide | **FIX REQUIRED** | Spec + Gate G4; missing from `@layer utilities` |
| X4 | Visual regression screenshot for S10 matrix | **FIX REQUIRED** | Baseline set has S11 review shot; add compare page 1440 (P25) |

---

## Fix backlog (priority)

1. **P0 — Layout (S11-A2):** Move choice rail under stem/choices block; treat causality as right drawer (collapsible on 1024–1279) per `UX_SPEC.md` editor wireframe.
2. **P0 — Accessibility (S10-A11):** Matrix keyboard support + row/column headers exposed to AT.
3. **P1 — Design system tables (S10-A8, S10-B4):** Sticky `<thead>` + 44px min row height.
4. **P1 — Typography (G4, S11-B3, X3):** Implement `text-stem` (STIX Two Text) and apply to stem/choice previews on S11; normalize S10 table type to `text-body` / `text-mono`.
5. **P1 — Spacing (S10-B5, S11-B5):** Bump primary gutters to 24px (`gap-6`, `space-y-6`) on compare + inspector grids.
6. **P2 — Scanability (S10-A13):** Optional severity tint on fail/warn cells while keeping glyphs.
7. **P2 — Labels (S11-B2):** Unify field label style across expert + distractor columns.
8. **P2 — Assets (X4):** Capture `artifacts/screenshots/` for S10 at 1440.

---

## Gate 9 verdict

| Pass | Result |
|------|--------|
| **Pass A** | **FAIL** — S11 normative editor layout (bottom rail + right drawer) not met; S10 accessibility baseline incomplete |
| **Pass B** | **FAIL** — Missing `text-stem`, 16px vs 24px gutters, table type scale, sub-44px targets on secondary controls |

### Pass B (re-review after fixes)

| Pass | Result |
|------|--------|
| **Pass A** | **PASS** — S11 bottom choice rail + right causality drawer; S10 sticky header, grid ARIA, severity tints |
| **Pass B** | **PASS** — `text-stem` utility, 24px gutters (`gap-6` / `space-y-6`), 44px row/action targets on primary controls |

### Final verdict: **APPROVE**

**Rationale:** P0–P1 backlog items (layout, table primitives, typography, spacing) addressed in final blocker closure commit. S10 dedicated e2e green; S11 distractor editor matches UX wireframe intent for Local V1.

---

## References

- `docs/UX_SPEC.md` — S10 matrix, S11 editor wireframes, accessibility baseline
- `docs/DESIGN_SYSTEM.md` — Direction B tokens, `ComparisonMatrix` / `ChoiceRail` / `CausalityDrawer`, Gate 9 checklist
- `src/components/candidates/CandidateComparisonMatrix.tsx`
- `src/components/candidates/DistractorCausalityEditor.tsx`
- `src/components/candidates/CandidateInspectorWorkspace.tsx`
