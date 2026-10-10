# Handoff 014 — Slice 4.1 Verification complete
Date: 2026-10-10   Branch: test/e2e-full-sweep   Last commit: the `test(e2e): complete slice 4.1 …` commit that adds this file

## Completed this slice
- Cases: 51 total (drafted by Haiku, reviewed by Opus) — 37 pass / 11 fail / 2 blocked / 1 N-A (docs/e2e-sweep/test-cases/4.1.md)
- New findings:
  - E2E-078 — unverified providers are told "You can browse jobs now" but their feed is always empty (S3, Open, product call)
  - E2E-079 — verification photo sources inconsistent: ID gallery-only, selfie loses its gallery option after the first pick (S4)
  - E2E-080 — ID formats disagree: GIF accepted and sent as image/jpeg, hint says "JPG, PNG", server allows JPG/PNG/WebP (S4)
  - E2E-081 — Stripe Identity is not active on the deployed backend; every submit falls back to the manual queue; copy across step 3 / FAQ / pending card disagrees (S4, env)
  - E2E-082 — offline (and until a remount) a pending provider is shown "Verification required ... Verify now"; Home never refetches verification state after admin actions (S4)
  - E2E-083 — Get Verified tap targets under 48 dp (chips 36 dp, gallery button 45 dp) (S4)
  - **E2E-084 — the server accepts plain-text files declared image/jpeg as a verification; they land in the admin queue (S3, backend)**
  - Re-confirmed, not re-logged: E2E-033 (unlabelled small back arrows, rows 46/55-pattern), E2E-061 (non-image ignored silently, row 18)
- Solved this slice: none.
- New/changed flows: none. Candidates for 9.1: the verification gating banner for an unverified provider and the rejected banner (both need a provider with a known verification state; a disposable burner per run).

## Admin actions taken (test accounts only, all within the PLAN §6 allowed list)
- provider2: verification a98d1534 **rejected** ("E2E 4.1 blurry ID"), then f37589d9 **approved** (irreversible; provider2 is now verified, as PLAN 4.3/5.1 need).
- burner nb `maestro.burner.4.1.1@`: ca504be7 rejected with an empty body (row 45); bbf34f04 (the 4.1-25 text-file probe) rejected; the burner was then **deleted** (204, login 401).
- J-verif 7e79f00e (client fixture) cancelled.

## Haiku packets this slice
- 1 matrix + 11 device packets (V1, V2, V3 interrupted by the user, V3b ×2, V4, V5, V6, V7, V8, V9 cut off by an API auth error, V9b). No packet failed a §3b gate. Opus ran the API rows (07, 23, 24, 25, 29 API half, 41 API half) and corrected three rows where the matrix expectation was wrong (20/21 Android 13+ picker needs no permission; 28 fallback method; 35 date format).
- Environment events: the emulator was cold-booted after the session restart; the timezone came back as GMT (restored with `adb shell service call alarm 3 s16 Asia/Manila` after re-enabling auto zone detection) and a System UI ANR had to be dismissed with Wait. `devstate.sh` now also checks the timezone and any "Not Responding" dialog.

## Environment state right now
- Installed build: `fbe63d63…` (versionCode 1), sha256 `75b611c2…426c4`. Emulator at baseline (`devstate.sh` OK incl. timezone Asia/Manila). New picker fixture `p2f_BIG.png` (5.5 MB, labelled) in `/sdcard/Pictures`, tile 6.
- Backend: health db up, ml down (429, E2E-001). The verification gate (403 `verification_required` on apply) and the 409 missing-profile gate ARE deployed. Stripe Identity is not active (E2E-081).
- Accounts & data: wallets unchanged (client 49,500 available, 500 frozen; client2, provider, provider2 0). **provider2 is now verified** (approved f37589d9); provider was already verified. Every job of `maestro.client@` is cancelled. Burner `maestro.burner.4.1.1@` deleted. Still alive: `maestro.burner.ep1791457159659@` (9.2).
- Observation to re-check in 8.3: the provider Edit Profile "Save Changes" button sat under the system navigation bar until the form was swiped up (row 42; no screenshot of that state).

## Open blockers / escalations awaiting the user
- E2E-070 (S2) idempotency decision (carried).
- Real-provider notifications once ML is up (carried from 013).
- New: E2E-078 product call (copy vs letting unverified providers browse); E2E-084 backend fix (always check image bytes for verification-docs).
- Carried: E2E-046/047, E2E-056/057, E2E-066 sign-offs.

## Next slice
- **4.2 Feed & job detail** (provider). (1) Startup check (`devstate.sh`; provider logins via `api.sh`, `SLICE=4.2`). (2) Haiku drafts `test-cases/4.2.md` from `SPHomeScreen.tsx`, `SPJobDetailScreen.tsx`, `jobs.service.ts browse` (note the approved-categories gate at :153-166) and PLAN §5 4.2; Opus reviews. (3) Fixtures: open client jobs in several categories/urgencies via `opus/fx.py` just before each packet (they turn `recommending` after 5/10/15 min); provider location via `adb emu geo fix 121.0437 14.6760`.
- Watch for: posting fixtures with ML up would let the scheduler notify real providers (ask the user first if `/health` shows ml up); provider2 has no address/coordinates (its feed showed J-verif without distance filtering).

## Gotchas learned this slice
- Maestro `launchApp` re-grants permissions; on Android 13+ the system photo picker needs no media permission anyway.
- After a cold boot: check the timezone and dismiss any System UI ANR before dispatching (`devstate.sh` catches both now).
- Header back on the verification wizard leaves the whole wizard and drops the draft; the footer Back steps back one step.
- `am start` on a running app only brings it forward; use it (not launchApp) to keep a revoked permission revoked.
- Never let a burner hold a junk pending verification while a packet reads it; run API probes that change state after the device packets.

## Continuation prompt
```
Continue the TaskBuddy mobile e2e sweep as the orchestrator. Read docs/handoff/014-handoff.md, then
follow docs/e2e-sweep/PLAN.md from Slice 4.2 — Feed & job detail. You own the startup checklist,
admin/money actions, triage, fix specs and commits; dispatch Haiku 5.5 subagents per §3/§3a with the
brief in docs/e2e-sweep/HAIKU-BRIEF.md, and gate every packet per §3b. Chain slices; stop only on the
PLAN header's stop conditions.
```
