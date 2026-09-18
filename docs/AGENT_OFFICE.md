# Denedio-QB Agent Office

## Purpose

Multi-agent coordination for **Question Studio**—a product that generates pedagogically faithful questions and exports compatible payloads toward **Denedio**, without modifying Denedio itself.

## Writable repository

`C:\Users\PC\Desktop\denedio-qb`

## Read-only reference

`C:\Users\PC\Desktop\sinav` (Denedio)

## Agent definitions

Cursor project subagents live under:

`.cursor/agents/`

| Agent | File | Primary ownership |
|-------|------|-----------------|
| Orchestrator | `orchestrator.md` | Phases, delegation, gates, acceptance |
| Denedio Contract Reader | `denedio-contract-reader.md` | `docs/DENEDIO_CONTRACT.md` from `sinav` |
| Architect | `architect.md` | `docs/ARCHITECTURE.md`, pipeline/schema alignment |
| Pedagogy Expert | `pedagogy-expert.md` | Fingerprint, generation rules |
| Designer | `designer.md` | UX spec, design system, design lock |
| Implementer | `implementer.md` | Application code |
| Tester | `tester.md` | Software QA, Playwright |
| Verifier | `verifier.md` | Assessment/product quality |

## Communication channels

1. **Orchestrator delegation** — explicit tasks, inputs, expected artifacts
2. **Shared source-of-truth documents** — under `docs/` and `.project-state.md`
3. **Structured HANDOFF** — every specialist returns the standard block (see agent files)

## Required implementation cycle

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

## Independence rules

- **Tester** and **Verifier** are independent of **Implementer**
- Implementer cannot approve its own work
- No phase accepted on Implementer completion alone
- **Final acceptance** requires **TESTER PASS** and **VERIFIER APPROVE**

## Quality gates

Defined in `docs/MASTER_BUILD_PLAN.md` (Gates 0–10).

## Startup

See `docs/ORCHESTRATOR_STARTUP_CHECKLIST.md`.

## Denedio safety

See `docs/DENEDIO_READONLY_BASELINE.md`.
