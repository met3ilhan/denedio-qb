# Orchestrator Startup Checklist

Use at the start of **ORCHESTRATED PRODUCT DISCOVERY** and before each major phase.

## Repository sanity

- [ ] `git rev-parse --show-toplevel` → `C:\Users\PC\Desktop\denedio-qb`
- [ ] Working tree changes only under denedio-qb
- [ ] `.project-state.md` reflects current stage and gate

## Denedio read-only safety (Gate 0)

- [ ] No edits under `C:\Users\PC\Desktop\sinav`
- [ ] No `.env*` reads in Denedio
- [ ] No install/run/migrate commands in Denedio
- [ ] Baseline recorded in `docs/DENEDIO_READONLY_BASELINE.md`
- [ ] Post-work git check: Denedio `status --porcelain` empty and HEAD unchanged

## Office readiness

- [ ] All eight agents exist under `.cursor/agents/`
- [ ] Skeleton docs exist (no fake “completed” analysis)

## Before delegating work

- [ ] Task maps to one primary specialist (+ reviewers as needed)
- [ ] Input doc paths listed
- [ ] Expected output artifacts listed
- [ ] Applicable gate(s) from `docs/MASTER_BUILD_PLAN.md` named

## Before accepting a phase

- [ ] Specialist HANDOFF received
- [ ] Implementer handoff (if code phase) received
- [ ] **Tester PASS** with executed evidence (when software exists)
- [ ] **VERIFIER APPROVE** with evidence (when quality gates apply)
- [ ] `docs/ORCHESTRATOR_LOG.md` updated
- [ ] `.project-state.md` updated

## Suggested discovery order (NOT YET EXECUTED)

1. Contract Reader → populate `docs/DENEDIO_CONTRACT.md` (confirmed vs proposed)
2. Product discovery → `docs/PRODUCT_SPEC.md`
3. Pedagogy Expert → fingerprint + rules skeletons filled
4. Architect → architecture aligned to contract + pedagogy
5. Designer → three directions → one lock
6. Implementer → only after Gate 1 acceptance

**Status:** TODO — orchestrator to execute during discovery.
