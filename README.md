# Question Studio (Denedio QB)

Expert-facing **Question Studio** for turning licensed source items into pedagogically faithful generated questions—with auditable fingerprints, independent verification, and **Denedio-shaped** import JSON generated locally.

**Philosophy:** mechanism preservation over paraphrase; human approval over AI self-publish; provenance over opaque generation.

**Visual direction:** Pedagogy Signal Lab (`docs/DESIGN_SYSTEM.md`).

## Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [pnpm](https://pnpm.io/) 10+
- [Docker](https://www.docker.com/) (local PostgreSQL only — **not** Denedio)

## Install

```bash
pnpm install
cp .env.example .env.local
```

## Database (Question Studio only)

Uses a **separate** PostgreSQL instance. Never point `DATABASE_URL` at Denedio.

```bash
pnpm db:up
pnpm db:migrate
```

Default URL (see `.env.example`): `postgresql://question_studio:question_studio@localhost:5433/question_studio`

## Development

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

**First click (no route cheat sheet):** on the home screen choose **Yeni Soru Oluştur** (or the same action in the left menu). Upload a source image or file, then follow **Devam et** on each step through extraction → structured review → fingerprint.

In **local development** (non-production), if you skip copying `.env.local`, the app still applies safe defaults: compose `DATABASE_URL` and demo mode (`QUESTION_STUDIO_DEMO_MODE=1`). You must still run `pnpm db:up` and `pnpm db:migrate` so Postgres is reachable.

## Demo mode

Set `QUESTION_STUDIO_DEMO_MODE=1` (Playwright default) to run **deterministic mock AI** without API keys. Demo output is pre-authored fixture data—not live model generation. The amber **ÖRNEK / DEMO** banner at the top of the app explains this while you work.

## AI provider (optional live)

- `QUESTION_STUDIO_GEMINI_API_KEY` — optional multimodal provider when demo mode is off
- Never copy credentials from the Denedio (`sinav`) repository

## Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Next.js dev server |
| `pnpm build` | Production build |
| `pnpm start` | Production server |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | TypeScript check |
| `pnpm test` | Vitest |
| `pnpm test:e2e` | Playwright (requires DB + migrate) |
| `pnpm db:up` / `pnpm db:migrate` | Docker Postgres + Prisma |

Integration tests: `QUESTION_STUDIO_INTEGRATION=1 pnpm test`

## Testing

```bash
pnpm exec playwright install chromium
pnpm db:up && pnpm db:migrate
pnpm test
pnpm test:e2e
```

## Denedio relationship

- Denedio (`C:\Users\PC\Desktop\sinav` on dev machines) is a **read-only contract reference** for import JSON shapes.
- This app does **not** modify Denedio or connect to its production database.
- **Publishing to Denedio is disabled by default** — Studio validates and downloads export bundles locally; see `docs/DENEDIO_IMPORT_GAP.md`.

## CI

`.github/workflows/ci.yml` runs lint, typecheck, unit tests, and build. E2E is local-first until CI browsers are enabled.

## Documentation

- Product & gates: `docs/PRODUCT_SPEC.md`, `docs/MASTER_BUILD_PLAN.md`
- Overnight build status: `docs/OVERNIGHT_BUILD_REPORT.md`
- Architecture: `docs/ARCHITECTURE.md`

## Repository layout

```
src/
  app/       # Routes (thin)
  modules/   # Domain modules (missions, sources, fingerprints, …)
  shared/    # db, validation, storage, ai
prisma/      # Question Studio schema only
```
