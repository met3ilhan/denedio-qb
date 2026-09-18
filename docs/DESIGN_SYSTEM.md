# Design System — Question Studio

## Status

**GATE 1 COMPLETE** — Three directions evaluated; **one direction selected and locked**.

## Design authority

**DESIGN AUTHORITY: LOCKED**

- **Date:** 2026-09-18
- **Selected direction:** **B — Pedagogy Signal Lab**
- **Decision record:** D-004 in `docs/DECISIONS.md`

Implementer implements tokens and components below. Redesign requires Orchestrator + Designer approval.

---

## Design intent

Support long-form reading (stems, fingerprints), dense comparison (S10), and high-signal verification (S12, S18) without resembling a generic SaaS admin template. The UI should feel like **instrumentation for judgment**, not a billboard of KPIs.

---

## Three visual directions (Gate 1)

### Direction A — Chalkboard Atelier

**Character:** Warm paper studio — editorial typography, margin notes, soft shadows.

| Aspect | Specification |
|--------|----------------|
| Canvas | `#F6F1E8` paper, `#1C1917` ink text |
| Accent | Terracotta `#C45C3E` for actions; sage `#5F7A61` for pass states |
| Type | Headings: **Fraunces** or **Source Serif**; UI: **IBM Plex Sans** |
| Chrome | Minimal top bar; phase shown as **ribbon bookmark** on mission card |
| Components | Card stacks, handwritten-style callouts for expert notes |
| Risk | Comparison matrix can feel “magazine” not “instrument”; severity less scannable at small sizes |

**Best for:** Narrative-first review, low information density missions.

---

### Direction B — Pedagogy Signal Lab *(SELECTED)*

**Character:** Cool neutral **lab bench** — precise grids, monospace telemetry, phase-colored **signal strips** along the studio rail.

| Aspect | Specification |
|--------|----------------|
| Canvas | `#F4F6F8` bench; panels `#FFFFFF` with `#E2E8F0` hairlines |
| Ink | `#0F172A` primary; `#475569` secondary |
| Phase signals | Intake `#2563EB` · Mechanism `#7C3AED` · Candidates `#D97706` · Ship `#059669` |
| Severity | Blocker `#DC2626` · Major `#EA580C` · Minor `#CA8A04` · Pass `#16A34A` |
| Type | UI: **Inter**; data/timeline/logs: **JetBrains Mono**; stems in preview: **STIX Two Text** (or system serif fallback) |
| Chrome | Left **studio rail** 240px; active phase = 4px left **signal strip** + tinted rail background `{phase}-50` |
| Components | Flat panels, table/matrix primitives, console blocks for dry-run |
| Motion | Subtle 120ms transitions on drawer; no parallax |

**Best for:** Fingerprint dimensions, verification consoles, candidate matrices, export trust.

---

### Direction C — Gazette Printroom

**Character:** High-contrast print — black/white, single red accent, rules and dividers like a broadsheet.

| Aspect | Specification |
|--------|----------------|
| Canvas | `#FFFFFF` only; rules `#000000` 1px |
| Accent | Single `#E11D48` for alerts and primary CTA |
| Type | **Newsreader** display; **Libre Franklin** UI; all-caps section labels |
| Chrome | Horizontal **section bands** instead of sidebar; phases as newspaper sections |
| Components | Wide tables, minimal rounding (2px), no shadows |
| Risk | Sidebar-less IA fights S07/S10 panel layouts; fatiguing on long sessions |

**Best for:** Print-first metaphor; weaker fit for multi-panel studio flows.

---

## Evaluation matrix

Scoring: 1 (poor) – 5 (excellent). Weights reflect Question Studio Gate 7+ expert workflows.

| Criterion (weight) | A Chalkboard | B Signal Lab | C Gazette |
|--------------------|:------------:|:------------:|:---------:|
| Fingerprint / long-read comfort (15%) | 5 | 4 | 3 |
| Comparison matrix scannability (20%) | 3 | 5 | 4 |
| Verification & dry-run clarity (20%) | 3 | 5 | 4 |
| Provenance / audit trail legibility (10%) | 4 | 5 | 3 |
| Distinctiveness vs generic admin (15%) | 4 | 5 | 5 |
| Long session fatigue (10%) | 4 | 4 | 2 |
| Implementation consistency (10%) | 4 | 5 | 3 |
| **Weighted total** | **3.85** | **4.75** | **3.45** |

---

## Selection rationale

**Direction B — Pedagogy Signal Lab** wins on weighted criteria driven by core screens:

1. **S07 Fingerprint Studio** and **S12 Verification** need grouped dimensions and severity at a glance — phase colors + flat panels outperform warm editorial cards.
2. **S10 Comparison matrix** needs monospace-adjacent alignment and grid lines without decorative shadow noise.
3. **S18 Dry-run console** maps naturally to a **trace + checklist** pattern (developer-trusted, expert-facing).
4. Avoids the **Gazette** navigation model that conflicts with the normative three-panel layouts in `docs/UX_SPEC.md`.
5. Still avoids generic admin tropes: no chart widgets; identity comes from **signal strips** and mechanism-first copy, not purple gradient hero dashboards.

Direction A remains documented as the preferred fallback if user testing shows experts want warmer long-read surfaces — apply only via formal design unlock.

---

## Locked tokens — Pedagogy Signal Lab

### Color (CSS variables — implementer)

```css
:root {
  --qs-canvas: #F4F6F8;
  --qs-surface: #FFFFFF;
  --qs-border: #E2E8F0;
  --qs-text: #0F172A;
  --qs-text-muted: #475569;
  --qs-phase-intake: #2563EB;
  --qs-phase-mechanism: #7C3AED;
  --qs-phase-candidates: #D97706;
  --qs-phase-ship: #059669;
  --qs-severity-blocker: #DC2626;
  --qs-severity-major: #EA580C;
  --qs-severity-minor: #CA8A04;
  --qs-severity-pass: #16A34A;
  --qs-invariant-bg: #F1F5F9;
  --qs-mutable-bg: #FFFBEB;
}
```

### Typography scale

| Token | Size / line | Use |
|-------|-------------|-----|
| `text-display` | 28px / 34px, Inter 600 | Mission titles (S01) |
| `text-title` | 20px / 28px, Inter 600 | Screen headers |
| `text-body` | 15px / 24px, Inter 400 | Forms, lists |
| `text-stem` | 17px / 28px, STIX Two Text | Question preview |
| `text-mono` | 13px / 20px, JetBrains Mono | Logs, JSON, dry-run (S04, S18) |

### Spacing & radius

- Base unit: **4px**. Standard gutter: **24px**. Panel padding: **16px**.
- Radius: **6px** controls, **8px** panels. No pill KPI chips on home.

### Elevation

- Panels: 1px border `--qs-border` only; **no drop shadows** except modal (soft `0 8px 24px rgba(15,23,42,0.08)`).

---

## Core components (v1)

| Component | Behavior | Primary screens |
|-----------|----------|-----------------|
| **StudioRail** | Phase groups, signal strip, disabled phase tooltips | All |
| **MissionCard** | Phase pill, findings badge, last action | S01 |
| **ProvenanceStrip** | Compact event list | Shell, S15 |
| **PhasePill** | Color from phase token | S01–S18 headers |
| **SeverityBadge** | Icon + label + token color | S12, S18, S01 |
| **EvidenceSpan** | Link fingerprint field ↔ source highlight | S06, S07 |
| **InvariantField** | Locked surface + unlock audit | S07 |
| **ComparisonMatrix** | Mechanism rows × candidate columns | S10 |
| **ChoiceRail** | Horizontal choices A–E | S11 |
| **CausalityDrawer** | Misconception path per distractor | S11 |
| **FindingGroup** | Solver / Fingerprint / … accordion | S12 |
| **FieldMapRow** | CONFIRMED vs PROPOSED badge | S17 |
| **DryRunConsole** | Pass/fail banner + trace + remediation | S18 |
| **CatalogTree** | Expand/collapse taxonomy | S16 |

### Button hierarchy

- **Primary:** filled `--qs-phase-*` matching current mission phase (default intake blue on S03).
- **Secondary:** outline `--qs-border`.
- **Danger:** `--qs-severity-blocker` for reject send-back only.

### Data tables

- Row height 44px min; zebra optional off by default.
- Sticky header on comparison and catalog tables.

---

## Iconography

- Use **Lucide**-style 1.5px stroke icons; pair with text labels on rail (no icon-only primary nav).

---

## Responsive (baseline)

- **≥1280px:** Full three-panel layouts per UX spec.
- **1024–1279px:** Collapse inspector to drawer; matrix horizontal scroll with sticky first column.
- **<1024px:** Read-only surfaces acceptable for v1; editing surfaces show “use wider viewport” banner (Tester documents exceptions in Gate 9).

---

## Gate 9 visual QA checklist

- [ ] Studio rail + phase signal strip on all S01–S18
- [ ] S01 has **no** chart/KPI dashboard modules
- [ ] Severity badges consistent S01, S12, S18
- [ ] Stem preview uses `text-stem` token
- [ ] CONFIRMED/PROPOSED badges on S17 match contract legend
- [ ] Dry-run console matches **DryRunConsole** pattern

---

## References

- `docs/UX_SPEC.md` — screen inventory and panel layouts
- `docs/DECISIONS.md` — D-004 design lock
