# Question Studio

Expert-facing studio for turning source items into pedagogically faithful generated questions, with auditable provenance and Denedio-compatible export. Architecture and product specs live under [`docs/`](docs/).

**Visual direction:** Pedagogy Signal Lab (see `docs/DESIGN_SYSTEM.md`).

## Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [pnpm](https://pnpm.io/) 10+

## Install

```bash
pnpm install
```

Copy environment template (no secrets committed):

```bash
cp .env.example .env.local
```

## Development

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Next.js dev server (Turbopack) |
| `pnpm build` | Production build |
| `pnpm start` | Run production server |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | TypeScript `tsc --noEmit` |
| `pnpm test` | Vitest unit tests |
| `pnpm test:e2e` | Playwright (builds app in CI; uses dev locally when not in CI) |

## Testing

```bash
pnpm test
pnpm test:e2e
```

First-time Playwright browsers:

```bash
pnpm exec playwright install chromium
```

## Docker (future database)

PostgreSQL via Prisma is planned in a later gate—not part of this scaffold. When added, a typical local setup will be:

```bash
# Example (not yet in repo):
# docker compose up -d postgres
# DATABASE_URL=postgresql://postgres:postgres@localhost:5432/question_studio
```

## CI

GitHub Actions runs `lint`, `typecheck`, `test`, and `build` on push/PR (see `.github/workflows/ci.yml`). E2E can be enabled when runners have Playwright browsers installed.

## Repository layout

```
src/
  app/          # Next.js App Router routes (thin)
  modules/      # Domain modules (Gate 2+)
  shared/       # Cross-cutting infrastructure
```

See `docs/ARCHITECTURE.md` for the full modular monolith target.

## Out of scope (this repo phase)

- Denedio (`sinav`) modifications or production DB access
- Prisma/PostgreSQL until Implementer adds persistence
