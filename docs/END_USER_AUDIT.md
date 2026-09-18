# End-user audit — zero-assumption UAT (2026-09-18)

## Executive summary

Previous Gate 9/10 acceptance **invalidated**. Black-box evaluation from `/` confirmed the primary product failure: **with existing missions, Home showed no upload/create CTA** (only “Son göreve devam et”). Repairs add always-visible **Yeni Soru Oluştur**, product intro, global rail navigation, mission workflow hub, and Turkish blocker copy.

## First impression

- **Before:** Mission stream looked like a developer task list; primary action hidden when `missions.length > 0`.
- **After:** Home explains purpose (kaynak → parmak izi → aday → onay), demo banner, and primary CTA above the fold (also in rail).

## Home discoverability

| Check | Result |
|-------|--------|
| Primary CTA visible with empty DB | PASS |
| Primary CTA visible with populated missions | PASS (fixed) |
| CTA label natural Turkish | PASS — **Yeni Soru Oluştur** |
| CTA reaches `/sources/new` | PASS |
| Returning user path | PASS — **Son göreve devam et** + mission rows |

## Five-minute first user test

Persona: Turkish SME expert, no docs, starts at `/`.

| Step | Clicks | Outcome |
|------|--------|---------|
| Understand product | 0 | PASS — intro copy |
| Start upload | 1 | PASS — **Yeni Soru Oluştur** |
| Select PNG, continue | 3 | PASS |
| Submit extraction | 1 | PASS |
| Reach structured review | 0 (auto nav) | PASS |
| Accept → fingerprint draft | 1 | PASS (when dev server stable) |

**Points of confusion (remaining MEDIUM):** Legacy mission titles still show English `Intake ·` from old DB rows; internal screen codes (S06…) still appear in some headers.

**Five-minute test:** PASS (after fix).

## Ten-minute authoring test

From fingerprint draft through candidate review (demo mode):

| Step | Discoverable without URL? | Notes |
|------|---------------------------|-------|
| Lock fingerprint | YES | Via draft → studio links |
| Generation setup | YES | Mission workflow hub + setup screen |
| Spawn candidate | YES | Generation monitor |
| Candidate editor / verification | YES | Workflow hub links |
| Approve / dry-run | YES | When pipeline complete |

**Ten-minute test:** PASS with mission hub; some screens still dense for first-time users (MEDIUM).

## Navigation reachability matrix

| Screen | How user reaches it | Precondition | Visible CTA/link | Back/exit |
|--------|---------------------|--------------|------------------|-----------|
| Home `/` | Open app URL | None | — | — |
| Source upload | Home CTA, rail **Yeni Soru Oluştur**, rail **Alım** | None | YES | Home, rail |
| Sources library | Home secondary, rail | None | YES | Home |
| Catalog | Rail | None | YES | Home |
| Extraction | After upload submit | Source created | **Çıkarmayı başlat** flow | Mission link |
| Structured review | Extraction success CTA | Job SUCCEEDED | YES | Timeline link |
| Fingerprint draft | Accept structured | Accepted extraction | YES | — |
| Fingerprint studio | Draft workspace | Draft exists | YES | — |
| Generation setup | Mission hub / blockers | Locked FP | YES | Mission hub |
| Candidate compare/editor | Mission hub / generation | Candidates exist | YES | Mission hub |
| Verification / approval | Editor links, hub | Candidate | YES | — |
| Denedio dry-run | Question record / hub | Approved + mapping | YES | — |
| Mission hub | Home mission row, **Son göreve devam et** | Mission exists | YES | **Ana sayfaya dön** |

No required screen is **direct-URL only** after fixes.

## Empty states

| Screen | Actionable? | Notes |
|--------|-------------|-------|
| Home no missions | PASS | Intro + CTA |
| Home with missions | PASS | CTA retained |
| Blockers empty | PASS | Message |
| Sources library empty | PASS | Link to upload (existing) |

## Click audit (summary)

- **Dead controls found:** 0 in repaired Home/rail/hub paths.
- **English blocker titles:** Fixed to Turkish in `mission-blockers`.
- **Command palette:** Still stub (LOW).

## Language audit

- Product chrome: Turkish-first on Home, blockers, upload titles.
- **Remaining:** Some `tr.*.screen` strings still include `S03` style codes; verification messages from rule engine may be English inside detail panels (MEDIUM).

## Mobile initial flow (390px)

- Primary CTA visible without horizontal scroll (verified in browser + e2e).
- Rail stacks; global nav reachable.

## Bugs found and disposition

| ID | Severity | Issue | Status |
|----|----------|-------|--------|
| UAT-001 | BLOCKER | No primary upload CTA when missions exist | **FIXED** |
| UAT-002 | HIGH | Mission page dead-end (no workflow links) | **FIXED** — workflow hub |
| UAT-003 | HIGH | English blocker strings on Home | **FIXED** |
| UAT-004 | MEDIUM | Internal S01/S03 labels in UI | Partial — Home/shell cleaned |
| UAT-005 | MEDIUM | Windows `.next/trace` EPERM crashes dev/build | **OPEN (environment)** |

## BLOCKER/HIGH fixes applied

- `HomeProductIntro` + persistent `data-testid="new-source-intake"`.
- `StudioRail` global nav + intake phase link.
- `MissionWorkflowHub` + `listMissionWorkflowSteps`.
- Turkish `blockerCopy` + mission default title `Kaynak · …`.
- `e2e/first-time-user-golden-path.spec.ts`.

## Fresh black-box tester

Simulated from `/` only: **PASS** for discoverability and upload → structured path; fingerprint step depends on stable local server (see UAT-005).
