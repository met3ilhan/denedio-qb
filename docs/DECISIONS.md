# Decisions Log

## Format

| ID | Date | Decision | Rationale | Owner | Status |
|----|------|----------|-----------|-------|--------|

## Bootstrap

| D-001 | 2026-09-18 | Multi-agent office in `.cursor/agents/` + shared `docs/` | Enables orchestrated build with independent Tester/Verifier | Bootstrap | Accepted |
| D-002 | 2026-09-18 | Denedio `sinav` read-only; no app/DB commands | Protect production reference codebase | Orchestrator | Accepted |
| D-003 | 2026-09-18 | No application scaffold at bootstrap | Office-first per bootstrap spec | Bootstrap | Accepted |

## Gate 1 — Design

| D-004 | 2026-09-18 | **DESIGN AUTHORITY: LOCKED** — Direction **B: Pedagogy Signal Lab** | Weighted evaluation (4.75/5) favors fingerprint studio, comparison matrix, and dry-run console clarity; distinct from generic admin while supporting three-panel studio IA in UX spec | Designer | Accepted |

## Gate 1 — Architecture

| D-005 | 2026-09-18 | **Modular monolith** — single Next.js App Router deployable with domain modules under `src/modules/*` | Keeps expert workflow cohesive while enforcing boundaries for testability and future extraction | Architect | Accepted |
| D-006 | 2026-09-18 | **SourceQuestion ≠ GeneratedQuestion** — separate entities; only GeneratedQuestion exports to Denedio | Source is evidence/provenance; export artifact is generated, verified, and versioned | Architect | Accepted |
| D-007 | 2026-09-18 | **No Denedio DB connection** from Question Studio; catalog via read-only mirror + local dry-run | Extends D-002; matches contract (admin import / preview only) | Architect | Accepted |
| D-008 | 2026-09-18 | **Import idempotency** — stable `externalKey` per GeneratedQuestion (`qs:{id}` convention) aligned with Denedio `importExternalKey` skip behavior | Contract Reader confirmed retry skips; Studio must not rotate keys on re-export | Architect | Accepted |
| D-009 | 2026-09-18 | **Independent solver** — disjoint `ISolverProvider` config from generation; solver input excludes fingerprint/plan | Gate 6 / pedagogy rules; prevents self-grading | Architect | Accepted |
| D-010 | 2026-09-18 | **Verifier findings** use **PASS / WARNING / FAIL** (not a single fidelity score) | Matches pedagogical fingerprint spec and UX P0–P2 mapping | Architect | Accepted |
| D-011 | 2026-09-18 | **Mutation plan required** per candidate before generation text; provenance chain persisted | `QUESTION_GENERATION_RULES` Stage C gate | Architect | Accepted |
| D-012 | 2026-09-18 | **Stack:** pnpm, TypeScript, Tailwind, Zod, PostgreSQL, Prisma (Implementer phase), Vitest, Playwright | Gate 1 tech baseline for Implementer scaffold | Architect | Accepted |

## Open

- Product spec workflows and success metrics (Orchestrator / Product).
- Denedio catalog mirror fetch mechanism (API vs manual seed) — Implementer Gate 8.
- Exact similarity thresholds (WARNING vs FAIL) — Product + Verifier tuning.
