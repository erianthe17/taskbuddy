# Handoff 013 — Slice 3.3 My Jobs & job detail complete
Date: 2026-10-10   Branch: test/e2e-full-sweep   Last commit: the `test(e2e): complete slice 3.3 …` commit that adds this file

## Completed this slice
- Cases: 60 total (59 drafted by Haiku and reviewed by Opus, plus 1 exploratory) — 43 pass / 7 fail / 0 blocked / 10 N-A (docs/e2e-sweep/test-cases/3.3.md)
- New findings (all S4, Open):
  - E2E-072 — My Jobs shows a stale "x mins ago" from its cache
  - E2E-073 — Job detail shows ₱349.5 where the card shows ₱349.50 (hero skips `peso()`)
  - E2E-074 — a cancelled job's timeline still shows "Posted" as current
  - E2E-075 — no pull-to-refresh or focus refresh on My Jobs / Job Details / Proposals (stale status after server-side changes)
  - E2E-076 — My Jobs status tabs don't expose a selected state to screen readers
  - E2E-077 — My Jobs takes 5-10 s to show content on a warm backend
  - Rows 3.3-31 and 3.3-55 re-confirm E2E-033 (unlabelled back arrows under 48 dp), not re-logged.
- Solved this slice: none.
- New/changed flows: none. The in-app cancel path is already frozen by `p3_jobs_create_plumbing_urgent_default_location.yaml`; candidates for 9.1: a Keep Job / cancel-confirm flow and the client empty state (needs a disposable burner per run).

## Decisions made this slice (orchestrator)
- Rows 3.3-46..48 (Find Providers) deferred to **5.4**: it notifies up to 8 eligible providers on the shared deployed backend (possibly real people) and writes retraining rows. 5.4 must ask the user before running it.
- The scheduler flips every open fixture to `recommending` after its deadline and tries to score it. The ML service was down (429) all slice, so no provider could have been notified; if ML comes back, every posted fixture can notify real providers automatically. Raise this with the user before Phase 4/5 posts fixtures with ML up.
- client2 is not empty (one cancelled job from 3.2-83; jobs can't be deleted), so empty-state rows used the burner `maestro.burner.3.3.1@` (deleted at slice end).
- 3.3-18's expectation (Normal) was wrong for a flexible fixture; corrected to Pass.

## Haiku packets this slice
- 1 matrix packet + 8 device packets (Q1-Q8). All passed the §3b gate. Opus redid 3.3-39 (the packet stopped correctly when its fixture turned recommending) and ran the API-only rows itself.
- Incidents: (1) Q5 misreported a card title as "appId: com.taskbuddy.app" in its odd-things list (hier.sh text garbling; the API title was intact; no result was affected). (2) Q8 tapped a raw coordinate meant for the Home tab while Job Details was on top and opened the Cancel Job dialog; it dismissed it with Keep Job and reported it; nothing was cancelled (verified by GET). The brief now requires a screen check before any raw coordinate tap.

## Environment state right now
- Installed build: `fbe63d63…` (versionCode 1), sha256 `75b611c2…426c4`. Emulator at baseline (`devstate.sh` OK). App logged in as `maestro.client@` on My Jobs.
- Backend: health db up, ml down (429, E2E-001). No new drift. `POST /jobs` rejects full photo URLs in `photo_urls` ("Upload path does not belong to the current user") while `GET` returns full URLs (E2E-057 from the other side).
- Accounts & data: wallets unchanged (client 49,500 available, 500 frozen; client2, provider, provider2 0). Every job of `maestro.client@` and `maestro.client2@` is cancelled (client now has 42 jobs, all cancelled). Burner `maestro.burner.3.3.1@` deleted. Still alive: `maestro.burner.ep1791457159659@` (9.2).
- Tooling: `~/.taskbuddy-e2e/opus/fx.py <slice> <names…>` creates named client fixtures (Opus only); `scratch/3.3/m_myjobs.yaml`, `m_burner.yaml` login fragments.

## Open blockers / escalations awaiting the user
- E2E-070 (S2) idempotency decision (carried).
- **New:** confirm how to handle real-provider notifications once ML is up (Find Providers in 5.4, and the automatic scheduler for every open fixture).
- Carried: E2E-046/047 backend sign-off, E2E-056/057 product calls, E2E-066 infra sign-off.

## Next slice
- **4.1 Verification** (Phase 4, provider side). (1) Startup check; provider logins (`maestro.provider@`, `maestro.provider2@`) via `api.sh` with `SLICE=4.1`. (2) Haiku drafts `test-cases/4.1.md` from `SPVerificationScreen.tsx`, the verifications controller/DTOs and PLAN §5 4.1; Opus reviews (admin approve/reject steps are Opus-only, via `~/.taskbuddy-e2e/opus/opus-api.sh`). (3) Push labelled ID/selfie images (`images/p2/` pattern) before the gallery rows; the emulator camera rows need the AVD camera set to emulated.
- Watch for: the 409 when `provider_profiles` is missing (HANDOFF B; workaround: complete Edit Profile first), and that Stripe Identity stops at the hosted page (Blocked, env).

## Gotchas learned this slice
- Fixtures go stale fast: open jobs flip to `recommending` 5/10/15 min after posting; create them just before the packet that needs them and accept "Finding Provider" where a row says "Open".
- The My Jobs "Cancelled" tab label collides with card badges: tap the tab by point (`83%,12%`).
- Maestro `takeScreenshot` rejects absolute paths; use `adb exec-out screencap -p > <abs>`.
- `hier.sh` takes about 20 s per call on this AVD now and garbles some characters; screenshots are the source of truth.

## Continuation prompt
```
Continue the TaskBuddy mobile e2e sweep as the orchestrator. Read docs/handoff/013-handoff.md, then
follow docs/e2e-sweep/PLAN.md from Slice 4.1 — Verification. You own the startup checklist,
admin/money actions, triage, fix specs and commits; dispatch Haiku 5.5 subagents per §3/§3a with the
brief in docs/e2e-sweep/HAIKU-BRIEF.md, and gate every packet per §3b. Chain slices; stop only on the
PLAN header's stop conditions.
```
