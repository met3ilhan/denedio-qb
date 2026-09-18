# Test Report

**Date:** 2026-09-19

| Suite | Result |
|-------|--------|
| `pnpm typecheck` | PASS |
| `pnpm test` | 80/80 |
| `pnpm build` | PASS |
| `pnpm test:e2e` (MOCK) | 36/36 |

## Notes

- Playwright requires local `TEMP` writable (use project `.tmp/pw-tmp` on Windows if AppData EPERM).
- LIVE Gemini e2e excluded from default config (`live-gemini-smoke.spec.ts`).
