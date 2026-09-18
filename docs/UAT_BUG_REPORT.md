# UAT Bug Report — Question Studio V1

| Field | Value |
|-------|--------|
| **Date opened** | 2026-09-18 |
| **Branch** | `build/question-studio-v1` |
| **Environment** | Local dev (`pnpm dev`), Docker Postgres optional per bug |
| **Reporter** | UAT / overnight build walkthrough |
| **Owner** | Implementer (root-cause detail below marked **TBD** where not yet verified in git) |

## Summary

| ID | Severity | Area | Title | Status |
|----|----------|------|-------|--------|
| [BUG-UAT-001](#bug-uat-001-s03-drag-and-drop-does-not-select-file) | **High** | S03 intake | Drag-and-drop does not select file | **RESOLVED** |
| [BUG-UAT-002](#bug-uat-002-upload-fails-without-env-and-on-png-mime) | **High** | S03 API + local dev | Upload fails without `.env.local` and on PNG MIME | **RESOLVED** |
| [BUG-UAT-003](#bug-uat-003-english-product-ui) | **High** | V1 UI | Product UI effectively English | **RESOLVED** (`tr.ts` + glossary) |

---

## BUG-UAT-001 — S03 drag-and-drop does not select file

### Severity

**High** — Primary intake affordance copy promises drag-and-drop (`tr.upload.dropzoneTitle`); UAT users drop a file and land on step 2 with no selection or no `Devam et` enablement.

### Reproduction

1. Start app: `pnpm dev` (default demo mode OK).
2. Open **S03** `/sources/new`.
3. From desktop or `e2e/fixtures/test-upload.png`, drag a single PNG onto `[data-testid="upload-dropzone"]`.
4. **Expected:** Dropzone shows active state, `Seçilen: test-upload.png`, **Devam et** enabled.
5. **Observed (UAT):** Drop ignored; no filename line; file input unchanged unless user uses **Dosya seç**.

### Root cause

Dropzone was a decorative `<label>` with file input only — no `dragover`/`drop` handlers or `dataTransfer` → `applyFile()` path.

| Item | Detail |
|------|--------|
| **Likely cause** | Drag/drop event handlers missing on dropzone container |
| **Confirm** | Diff `SourceUploadWizard.tsx` for `onDragOver`, `onDragLeave`, `onDrop`, `dragActive` |

### Affected files

| Path | Role |
|------|------|
| `src/components/sources/SourceUploadWizard.tsx` | Dropzone UI + client validation |
| `src/shared/copy/tr.ts` | Dropzone promise copy |
| `docs/TR_COPY_GLOSSARY.md` | Canonical “Sürükleyip bırakın…” |

### Fix (intended)

- Wire `onDragOver` / `onDragLeave` / `onDrop` on the dropzone; call existing `applyFile()` (extension + size checks).
- Toggle `dragActive` for `tr.upload.dropzoneActive`.
- Reject multi-file drops with `tr.upload.errors.multipleFiles`.

### Regression test

| Layer | Test |
|-------|------|
| **E2E** | Playwright: `page.dispatchEvent('[data-testid="upload-dropzone"]', 'drop', { dataTransfer: … })` or `browser_file_upload` + assert `[data-testid="selected-filename"]` after synthetic drop |
| **Manual** | Repeat repro on Chrome + Edge; keyboard path (Enter on dropzone) still opens file picker |

### Verification checklist

- [x] Single PNG/PDF drop selects file
- [x] Multi-file drop shows TR error (client)
- [x] Invalid extension shows `Dosya türü desteklenmiyor.`
- [x] E2E added to `pnpm test:e2e` (`sources-upload-acceptance.spec.ts`)

---

## BUG-UAT-002 — Upload fails without `.env.local` and on PNG MIME

### Severity

**High** — Fresh clone UAT: image upload returns 503/400 despite valid PNG; blocks first-run “golden path” without README env setup.

### Reproduction

**A — Database**

1. Clone repo; do **not** create `.env.local` (no `DATABASE_URL`).
2. Skip `pnpm db:up` / migrate (or stop Docker Postgres).
3. `pnpm dev` → `/sources/new` → select `e2e/fixtures/test-upload.png` → complete metadata → **Çıkarmayı başlat**.
4. **Expected:** Mission + source created OR clear TR message `Yerel veritabanına bağlanılamadı…`.
5. **Observed (UAT):** Opaque failure or Prisma connection error in server log; UI generic error.

**B — MIME**

1. With DB up, upload PNG where browser sends `Content-Type: application/octet-stream` or empty type (common on Windows drag-drop).
2. **Expected:** Upload accepted via extension inference.
3. **Observed (UAT):** `UNSUPPORTED_TYPE` / “Unsupported file type” before storage write.

### Root cause

| Item | Detail |
|------|--------|
| **DATABASE_URL** | No safe local default when `.env.local` missing → Prisma connection failure → generic `Upload failed` (HTTP 500) |
| **MIME inference** | Server trusted `file.type` only; Windows/empty type → `application/octet-stream` → `UNSUPPORTED_TYPE` (HTTP 400) |

### Affected files

| Path | Role |
|------|------|
| `src/shared/config/local-env.ts` | Dev default `DATABASE_URL` + demo flags |
| `src/shared/db/client.ts` | Imports `ensureLocalDevelopmentDefaults()` |
| `src/shared/storage/policy.ts` | `resolveSourceMimeType`, `ALLOWED_SOURCE_MIME_TYPES` |
| `src/modules/sources/services/upload-service.ts` | Uses resolved MIME before `isAllowedMimeType` |
| `src/app/api/sources/upload/route.ts` | Maps `DB_UNAVAILABLE` to TR via `upload-errors` |
| `src/shared/copy/upload-errors.ts` | User-facing DB / type errors |

### Fix (intended)

- **local-env:** In non-production, set `DATABASE_URL` to compose default (`postgresql://question_studio:…@localhost:5433/question_studio`) when unset; document in README / `.env.example`.
- **MIME:** `resolveSourceMimeType(filename, reportedType)` maps extension when type empty or octet-stream; `upload-service` validates resolved type.
- Keep Denedio DB guard in `client.ts` (reject URLs containing `denedio` markers).

### Regression test

| Layer | Test |
|-------|------|
| **Unit** | `src/shared/storage/policy.test.ts` — octet-stream + `.png` → `image/png`; `.JPEG` case |
| **Integration** | Optional: upload route with mocked storage + test DB (skipped if no `DATABASE_URL`) |
| **Manual** | Fresh clone without `.env.local` after `pnpm db:up` + migrate succeeds on PNG upload |

### Verification checklist

- [x] `pnpm test` includes policy MIME tests green
- [x] Upload PNG with empty `file.type` returns 201 (with DB up)
- [x] Missing Docker surfaces `tr.upload.errors.dbUnavailable` (503)
- [x] README notes dev default `DATABASE_URL` when `.env.local` omitted

---

## BUG-UAT-003 — English product UI

### Severity

**High** — Turkish expert users saw English navigation, labels, and errors across V1.

### Fix

Centralized `src/shared/copy/tr.ts`, `docs/TR_COPY_GLOSSARY.md`, `lang="tr"` layout; components/pages wired to `tr`.

### Regression

E2E assertions updated to Turkish (`home`, `studio-shell`, `export-dry-run`, intake/upload suites).

---

## Release gate

**S03 intake path PASS** — BUG-UAT-001/002/003 closed; upload acceptance E2E 7/7; full Playwright 27/27.

## References

- `docs/TR_COPY_GLOSSARY.md`
- `docs/QA_FINDINGS.md` — Gate 10 / regression context
- `e2e/fixtures/test-upload.png`
