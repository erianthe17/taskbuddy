# Handoff 030 — Slice 8.2 Network & server states complete (row 18 needs user OK)
Date: 2026-10-12   Branch: test/e2e-full-sweep   Last commit: the `test(e2e): complete slice 8.2 network states` commit that adds this file

## Completed this slice
- Cases: 19 total: 10 pass / 7 fail / 1 N-A / 1 blocked (docs/e2e-sweep/test-cases/8.2.md).
  - Row 18 (maintenance mode) is **Blocked: needs user OK**.
  - Row 11 (slow cold backend) is N-A: the Render instance never slept during the 16-minute idle (uptime 68,275 s).
- ORCH ran:
  - the device parts of rows 14–17 (revoked session, suspend, relaunch, reinstate), because the admin step lands mid-row;
  - the timed rows 11 and 13;
  - the API burner cleanup (row 19).
- **Holds up for UAT:**
  - offline Sign In shows the connection copy and recovers;
  - the client Wallet offline shows the copy and pull-to-refresh recovers;
  - Add Money offline does nothing, and online opens sandbox Checkout (abandoned, no charge);
  - Start Job offline shows the copy, and one tap after reconnecting starts it once;
  - a second API login doesn't sign the app out;
  - **an expired access token is refreshed silently (Wallet loads 1 h 2 min after sign-in);**
  - a suspended sign-in says "Account suspended", and reinstatement restores sign-in.
- New findings (all S4, Open):
  - E2E-165 (ux): client Home offline swaps cached figures for "Couldn't load …" widgets with no connection message.
  - E2E-166 (ux): an offline feed urgency chip says "0 jobs available" instead of showing an error.
  - E2E-167 (app-bug): when a Start Job response is lost, the screen stays CONFIRMED with an error while the server has started the job.
  - E2E-168 (ux): a suspended user sees half-working screens with raw "Account is deactivated", and a relaunch drops to a bare Login.
- Re-checked or extended:
  - E2E-030 (offline cold start drops to a bare Login) is still present;
  - E2E-032 now also covers a revoked session (global sign-out → bare Login, no message);
  - E2E-125 now also notes that the provider Wallet has no pull-to-refresh;
  - E2E-081 (Stripe Identity inactive) explains the row 08 online path.
- Solved this slice: none.
- Flows: none added. The rows depend on network toggles, admin suspension or timed waits, which don't fit re-runnable read-only flows. Crash sweep: 0 lines (`~/.taskbuddy-e2e/logs/8.2-logcat.txt`).

## Haiku packets this slice
- 2 device packets (P1 6 rows, P2 5 rows) and 1 matrix packet (8.4, pipelined). No §3b gate failures.
- Re-judged by ORCH: row 08 (Fail → Pass; the online path is E2E-081).

## Environment state right now
- Installed build: `fbe63d63…`, sha256 `75b611c2…426c4`.
- Emulator: up about 2.5 h since the 16:35 Manila cold boot; devstate OK. `auto_time_zone` 0 (restore in 9.1).
- **The emulator's DNS has failed twice in one day.** Before each device packet, run devstate; if `dns=fail` persists past 30 s, kill **every** emulator process (`Get-Process emulator*`) and cold-boot.
- Backend: health db up, ml down (E2E-001).
- **Ledger:**
  - c1 47,523 / 47,523 / in_escrow 1,400;
  - p1 255 / 255 / 1,400;
  - c2 150 / 150 / 0;
  - p2 560.45 / 560.45 / 0.
  - No pending withdrawals.
- **Jobs:**
  - J1 (₱500) and R4, R5, R10 (₱300 each) are held, waiting for auto-release.
  - No-budget in-progress fixtures remain (8.1 F-S, F-S2, F-T; 8.2 F-S82a, F-S82b). They're harmless.
- **8.4 burners are already registered and prechecked:** N1–N6, `maestro.burner.84.{1..6}@taskbuddy.test`. The ids are in the `test-cases/8.4.md` header. N2 has no provider-profile row (registered without a category); N3 and N4 are unverified providers.

## Open blockers / escalations awaiting the user
- **Maintenance mode (8.2-18):** run only if the continuation prompt says "maintenance mode approved". It affects every real user of the shared backend.
- **First thing after 2026-10-14T12:04Z:**
  1. Deferred check 5.3-15: J1 auto-release gives p1 +425.00, commission 75.00, c1 in_escrow −500.
  2. 7.4-31 on J1.
  3. After about 2026-10-15T00:01Z: R4, R5 and R10 auto-release (p1 +255.00 each).
- E2E-131: enable Stripe Connect in the sandbox account.
- Fix approvals (money-screen UI): E2E-105, 119, 120, 128, 129, 130.
- Allowed-scope fixes batched for a rebuild: E2E-111, 112 (app half), 115, 122, 123, 124, 132, 137, 138, 139, 140, 155, 157 (app half), 160, 161, 167.
- Product decisions: E2E-133, 141, 159, **162**, 164, 168 (suspension UX).
- Carried:
  - E2E-070 (High);
  - real-provider notifications once ML is up;
  - E2E-078; E2E-084;
  - sign-offs for E2E-046/047, 056/057, 066, 087, 099, 109.

## Next slice
- **8.3 Device & OS.** The matrix is drafted (`test-cases/8.3.md`, 22 rows), not yet reviewed. Slot decisions made in this session:
  - F-HO = the 8.1 F-W job `8b79ee59…` (cancelled, no complaint);
  - CH = C1b `67a3666e…` (completed, rich chat; its complaint is closed);
  - rows 15 and 19 are N-A, because p1 is already verified (no camera selfie or verification screen to reach) unless ORCH sets up a burner provider;
  - rows 20–21 (clock skew) are N-A if `adb shell date` is refused.
  - Every settings change has its restore command in the row; row 22 restores everything.
- **8.4 Account-state matrix:** drafted (`test-cases/8.4.md`, 18 rows), with burners ready (see above). ORCH steps:
  - suspend N4 after 8.4-10 and reinstate it after 8.4-16;
  - `DELETE /profiles/me` for N5 and N6 at their rows;
  - Haiku must never open Edit Profile on N2.
- Then 8.5 (authorization probes, ORCH-written curl list), then Phase 9.
- Pipeline the 8.5 matrix (or curl list) during 8.3's first packet.

## Gotchas learned this slice
- `api.sh call` and `opus-api.sh call` silently re-login on a 401. To prove that a token was revoked, use the raw curl, or watch the app.
- The Login form shifts when an error line shows, so Sign In moves down about 115 px. Re-read the bounds before every tap.
- The Render backend didn't sleep after 16 idle minutes; cold-start rows may never be reproducible on the shared instance.

## Continuation prompt
```
Continue the TaskBuddy mobile e2e sweep as the orchestrator. Read docs/handoff/030-handoff.md, then
follow docs/e2e-sweep/PLAN.md from Slice 8.3 — Device & OS. You own the startup checklist,
admin/money actions, triage, fix specs and commits; dispatch Haiku 5.5 subagents per §3/§3a with the
brief in docs/e2e-sweep/HAIKU-BRIEF.md, and gate every packet per §3b. Chain slices; stop only on the
PLAN header's stop conditions.
```
