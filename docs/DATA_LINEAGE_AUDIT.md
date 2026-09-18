# DATA LINEAGE AUDIT — BUG-P0-001

**Severity:** BLOCKER / P0  
**Incident:** User uploaded a **history** source image; structured review showed the **kayak rental / 12 coins** demo stem. Log showed `Source analyst: mock/mock-source-analyst-v1`. Analysis appeared instant because the mock path returned a prebuilt fixture without reading upload bytes.

**Gates reopened:** 2, 3, 4, 10 (until this document’s verification checklist is green in CI).

---

## 1. Kayak / coin string inventory

| Path | Classification | Why it exists |
|------|----------------|---------------|
| `src/shared/ai/fixtures/synthetic-river-problem.ts` | **DEMO FIXTURE** | Explicit `SYNTHETIC_RIVER_FIXTURE` (`demoFixtureId: synthetic-river-problem`) |
| `src/shared/ai/source-analyst/mock-provider.ts` | **MOCK PROVIDER** | Previously returned fixture when `isDemoMode()` — **fixed** to explicit demo filenames only |
| `src/shared/ai/generation/mock-provider.ts` | **MOCK PROVIDER** | Previously emitted kayak when `isDemoMode()` — **removed** kayak branch |
| `fixtures/pedagogy/math-piecewise-kayak-golden.ts` | **TEST FIXTURE** | Golden pedagogy suite only |
| `src/shared/ai/solver/solver-independence.test.ts` | **TEST** | Inline stem for solver test |
| `docs/GOLDEN_PEDAGOGY_SUITE.md`, `docs/PEDAGOGY_REVIEW_SAMPLES.md` | **DOCS** | Describes golden kayak item |

No kayak strings belong on the **real user upload path** after fix unless `originalFilename` / hints mark an **explicit demo sample** (e.g. `demo-source.txt`).

---

## 2. Root cause (exact)

1. **`src/shared/ai/demo.ts`** — `isDemoMode()` defaulted to **`true`** when env unset (`QUESTION_STUDIO_DEMO_MODE` legacy).
2. **`src/shared/ai/source-analyst/index.ts`** — With demo “on” or no Gemini key, selected **`MockSourceAnalystProvider`**.
3. **`src/shared/ai/source-analyst/mock-provider.ts`** — **`if (isDemoMode() || …)`** returned **`SYNTHETIC_RIVER_FIXTURE`**, **ignoring `input.bytes`**, for **every** upload including the user’s history image.
4. **`src/components/sources/StructuredReviewPanel.tsx`** — Left pane showed **extracted stem text only**, not the uploaded image, so substitution was easy to miss.
5. **`src/shared/ai/generation/mock-provider.ts`** — Same **`isDemoMode()`** gate could emit kayak stems downstream during local dev.

**Not** primary cause: `findFirst` / “latest job” on review — jobs are scoped by **`sourceFileId`** in `getSourceFileById` / `getLatestJobForSource`. Cross-source bugs were secondary risk; main failure was **fixture substitution**.

---

## 3. Upload → export lineage (intended graph)

```
Upload (POST /api/sources/upload)
  → SourceFile (id, storageKey, checksumSha256)
  → ExtractionJob (sourceFileId)
  → Provider.extract({ sourceFileId, bytes, … })
  → ExtractionJob.result + analystMeta { providerMode, inputBytesSha256, demoFixtureId?, sourceFileId }
  → SourceQuestion (sourceFileId, extractionJobId) on accept
  → PedagogicalFingerprintVersion (via sourceQuestionId)
  → GenerationRun (fingerprintVersionId)
  → GeneratedQuestionCandidate (generationRunId)
  → Solver / Verifier runs (candidate)
  → GeneratedQuestion + QuestionVersion
  → Export dry-run (approved version)
```

---

## 4. Fixes applied (summary)

| Area | Change |
|------|--------|
| Provider mode | `src/shared/ai/provider-mode.ts` — `LIVE` / `DEMO` / `MOCK` / `MANUAL`; default local = **MOCK** (not silent DEMO fixture) |
| Mock analyst | Kayak only for **`isExplicitDemoSource()`** (filename contains `demo`, etc.) or canary marker / honest placeholder |
| Live without key | `UnconfiguredLiveSourceAnalystProvider` — **throws** (no silent fallback) |
| Persistence | `analystMeta.providerMode`, `inputBytesSha256`, `sourceFileId` on job |
| Review UI | `/api/sources/[id]/asset` + image preview on S05; execution mode label; Turkish block types |
| Extraction UI | User-facing steps; worker logs behind “Teknik ayrıntılar” |
| Tests | `mock-provider.test.ts`, `extraction-provider-spy.test.ts`, `e2e/denedio-canary-lineage.spec.ts` |
| Lineage helper | `src/modules/sources/testing/lineage-assertions.ts` |

---

## 5. Mock semantics (post-fix)

| Mode | User upload behavior |
|------|----------------------|
| **MOCK** (default local) | Bytes hashed; **canary marker** in file → deterministic Turkish stem; else **honest placeholder** + warning (not kayak) |
| **DEMO** | Only explicit demo-named sources → `SYNTHETIC_RIVER_FIXTURE` |
| **LIVE** | Gemini when key present; else **error** |
| **MANUAL** | Empty-ish template; expert fills fields |

---

## 6. Verification checklist

- [ ] `DENEDIO-CANARY-7391` upload never shows kayak  
- [ ] A/B canaries never cross-contaminate on reopen  
- [ ] S05 shows **uploaded image** + stem  
- [ ] Provider spy test: correct `sourceFileId` + bytes at boundary  
- [ ] `pnpm typecheck`, `lint`, `test`, `build`, `test:e2e` green  
- [ ] **Ready for live Gemini** only when provider-boundary + full browser lineage pass  

---

## 7. Gemini readiness

**READY FOR LIVE GEMINI = NO** until Verifier signs Gates 2/3/4/10 after regression in this branch.

Configure: `QUESTION_STUDIO_PROVIDER_MODE=LIVE` and `QUESTION_STUDIO_GEMINI_API_KEY=…` only after checklist above is green.
