# TR Copy Glossary — Question Studio V1

| Field | Value |
|-------|--------|
| **Locale** | `tr-TR` (Turkish UI, expert product) |
| **Authority** | This document + `src/shared/copy/tr.ts` |
| **Scope** | User-facing strings in the studio shell, intake, extraction, structured review, and shared status labels |
| **English in UI** | Internal enums (`PASS`, `MECH_*`), screen ids (`S01`), and developer env names stay English; product concepts below use Turkish |

## Product identity

| Concept (EN) | Canonical TR | Notes |
|--------------|--------------|-------|
| Question Studio | **Soru Stüdyosu** | App / rail product name |
| Pedagogy Signal Lab | **Pedagoji Sinyal Laboratuvarı** | Sub-brand; workflow tagline in `tr.app.description` |
| Mission thread | **Görev zinciri** | One intake → ship lineage |
| Mission board | **Görev panosu** | S01 |
| Mission stream | **Görev akışı** | Home list of active missions |
| Demo / sample mode | **ÖRNEK / DEMO** | Banner badge; body copy in `tr.demo.body` |

## Workflow phases (mission)

| Enum | Canonical TR | Do not use |
|------|--------------|------------|
| `INTAKE` | **Alım** | “Intake”, “Upload phase” |
| `MECHANISM` | **Mekanizma** | “Mechanism phase” alone without context |
| `CANDIDATES` | **Adaylar** | “Candidates” |
| `SHIP` | **Yayın** | “Ship”, “Export phase” |

Source: `MISSION_PHASE_LABELS` in `src/modules/missions/domain/mission-phase.ts`.

## Pedagogy core terms

| Concept (EN) | Canonical TR | Notes |
|--------------|--------------|-------|
| Pedagogical fingerprint | **Pedagojik parmak izi** | Title case in headings: **Pedagojik Parmak İzi** |
| Fingerprint studio | **Parmak izi stüdyosu** | S07+ |
| Fingerprint version | **Parmak izi sürümü** | Version chip / compare header |
| Fingerprint fidelity | **Parmak izi sadakati** | Verification checklist (not a 0–100 “puan”) |
| Mechanism | **Mekanizma** | Reasoning mechanism on source/candidate |
| Distractor | **Çeldirici** | Wrong choice with causal analysis |
| Distractor causality | **Çeldirici nedenselliği** | Stage 5 / S11 drawer |
| Misconception | **Yanlış kavram** | Target belief the trap exploits |
| Trap (type) | **Tuzak** | Structural trap family (`TRAP_*` stays internal) |
| Error path | **Hata yolu** | Steps that produce the wrong answer |
| Critical signal | **Kritik sinyal** | Cue the student must notice |
| Solution skeleton | **Çözüm iskeleti** | Ordered reasoning phases |
| Source evidence layers | **Görünür gerçekler** / **Çıkarım** / **Belirsizlik** | S05 structured layers (`tr.structured.layers`) |
| Mutation plan | **Mutasyon planı** | Pre-generation plan |
| Generation run | **Üretim koşusu** | S09 monitor |
| Generated candidate | **Üretilmiş aday** | Inspect / compare |
| Verification | **Doğrulama** | Solver + verifier findings |
| Approval | **Onay** | Expert gate before question record |
| Rejection | **Red** / **Reddet** | Verb: **Reddet**; status: **Reddedildi** |
| Blocker | **Engel** | Mission blocker panel |
| Provenance | **Köken** | Audit trail; full trail in **Yayın** |

## Intake & extraction (S03–S06)

| Concept (EN) | Canonical TR | `tr.ts` key |
|--------------|--------------|-------------|
| Source upload | **Kaynak yükleme** | `upload.page.screen` |
| Intake wizard | **Alım sihirbazı** | `upload.page.title` |
| Drop zone | **Sürükleyip bırakın veya dosya seçin** | `upload.dropzoneTitle` |
| Start extraction | **Çıkarmayı başlat** | `upload.startExtraction` |
| Extraction job | **Çıkarma işi** | Timeline copy |
| Structured review | **Yapılandırılmış incelemeyi aç** | `extraction.openStructured` |
| Accept extraction | **Çıkarmayı onayla** | `structured.accept` |
| Subject hint | **Konu ipucu** | Metadata step |

## UI chrome & actions

| Concept (EN) | Canonical TR | `tr.ts` key |
|--------------|--------------|-------------|
| Studio menu | **Stüdyo menüsü** | `nav.railLabel` |
| Workflow phases | **İş akışı aşamaları** | `nav.phasesLabel` |
| Back | **Geri** | `common.back` |
| Continue | **Devam et** | `common.continue` |
| Save | **Kaydet** | `common.save` |
| Cancel | **İptal** | `common.cancel` |
| Retry | **Yeniden dene** | `common.retry` |
| Loading | **Yükleniyor…** | `common.loading` |
| Inspector | **Denetçi** | Side panel title |

## Status & severity (user-visible)

| Code | Canonical TR |
|------|--------------|
| `PASS` | **Geçti** |
| `WARNING` | **Uyarı** |
| `FAIL` / `BLOCKER` | **Başarısız** |
| Approved | **Onaylandı** |
| Rejected | **Reddedildi** |
| Draft | **Taslak** |
| Unknown | **Bilinmiyor** |

Use `verificationSeverityLabel()` from `tr.ts` for checklist rows.

## Typography & punctuation rules

- Use Turkish **i / İ** and **ı / I** correctly in product strings (e.g. **Pedagojik**, **Çıkarma**, **Yükleniyor…**).
- Ellipsis: Unicode `…` (U+2026), not three ASCII periods.
- Middle dot in screen ids: **`S03 · Kaynak Yükleme`** (space · space).
- Avoid English headline casing in TR headings; prefer sentence case or title case per design system section titles.

## Deferred / English-only (V1 exception list)

Until migrated to `tr.ts`, these may still appear in source as English; new UI must not introduce alternate Turkish synonyms:

- S10/S11 expert editor field labels (“Question stem”, “Causality drawer”)
- Verification finding group names (`Solver`, `Fingerprint`, `Distractor`)
- Internal mechanism codes (`MECH_*`, `TRAP_*`)
- `layout.tsx` document title and `html lang` (track under Turkish UI audit)

## Change control

1. Add or change canonical TR here first.
2. Mirror in `src/shared/copy/tr.ts` (single import surface for components).
3. Do not scatter literal Turkish strings in JSX except screen-id mono lines wired from `tr`.

## References

- `src/shared/copy/tr.ts` — runtime copy module
- `src/shared/copy/upload-errors.ts` — API error code → TR
- `src/modules/missions/domain/mission-phase.ts` — phase labels
- `docs/PEDAGOGICAL_FINGERPRINT_SPEC.md` — pedagogy semantics (English spec; TR labels above)
