# User Acceptance Test Report — Real User Round 1

**Branch:** `build/question-studio-v1`  
**Date:** 2026-09-18

## User Reported Defects

1. Drag-and-drop source upload does not work (BUG-UAT-001)
2. File picker upload shows “Upload failed” (BUG-UAT-002)
3. Product UI effectively English (BUG-UAT-003)

## Reproduction

See `docs/UAT_BUG_REPORT.md` for step-by-step reproduction. Confirmed in browser at `/sources/new` and via `curl` against `/api/sources/upload`.

## Root Causes

| ID | Root cause |
|----|------------|
| BUG-UAT-001 | Dropzone lacked `dragover`/`drop` handlers; files never reached client state |
| BUG-UAT-002 | (a) Prisma without `DATABASE_URL` when `.env.local` missing → HTTP 500; (b) `application/octet-stream` rejected for valid images |
| BUG-UAT-003 | Hardcoded English strings; no centralized Turkish copy |

## Upload Architecture

- **Storage:** `LocalObjectStorageAdapter` → `.data/uploads` (no S3 required for local V1)
- **Pipeline:** `SourceUploadWizard` → `POST /api/sources/upload` → `UploadService` → DB + extraction job
- **MIME:** `resolveSourceMimeType(filename, reportedType)` before validation

## Drag and Drop

Implemented with `dragActive` styling, keyboard-accessible dropzone (`role="button"`), shared validation with file input, image preview via object URL.

## File Picker

Same `applyFile()` path as drag/drop; `setInputFiles` covered in Playwright.

## Turkish UI Audit

`docs/TR_COPY_GLOSSARY.md`, `src/shared/copy/tr.ts`, `lang="tr"`. Designer verdict: **APPROVE** (`docs/DESIGN_QA.md` — TURKISH UI AUDIT).

## Full Workflow Bug Bash

Automated: intake → extraction → structured review; generation pipeline; comparison; verification; dry-run; catalog UUID. Manual spot-check: S03 Turkish UI + upload preview in browser.

## Bugs Found During Bug Bash

| Severity | Count | Notes |
|----------|-------|-------|
| BLOCKER | 0 | (after fixes) |
| HIGH | 3 | All user-reported — fixed |
| MEDIUM | 0 | — |

## Bugs Fixed

BUG-UAT-001, BUG-UAT-002, BUG-UAT-003; E2E updated for Turkish assertions.

## Remaining Known Issues

- ~35 English strings in dynamic fixture/API payloads (non–user-facing labels)
- `next/image` lint suggestion on upload preview `<img>` (cosmetic)

## Browser Console Findings

**CLEAN** on S03 upload path during manual check.

## Network Findings

**CLEAN** — upload returns 201 with DB up; 503 with Turkish body when DB unavailable.

## Tester Verdict

**PASS** — Vitest 61/61 (1 skip); Playwright 27/27.

## Designer Verdict

**APPROVE** — Turkish UI audit (post-migration).

## Verifier Verdict

**APPROVE** — Gate 9 Turkish + Gate 10 local V1 UAT intake (see `docs/VERIFICATION_REPORT.md` append).

---

## ZERO-ASSUMPTION UAT (2026-09-18)

**Prior Gate 9/10:** Invalidated — Home hid primary CTA when missions existed.

**Repair:** Always-visible **Yeni Soru Oluştur**, product intro, rail IA, mission workflow hub, Turkish blockers.

| Check | Result |
|-------|--------|
| Black-box from `/` | **PASS** |
| Five-minute test | **PASS** |
| Ten-minute test (demo) | **PASS** |
| `docs/END_USER_AUDIT.md` | Complete |

**Regression this host:** `pnpm build` EPERM; Playwright partial under server crash — see `docs/TEST_REPORT.md`.
