# Handoff 029 — Slice 8.1 Double-tap / race sweep complete
Date: 2026-10-12   Branch: test/e2e-full-sweep   Last commit: the `test(e2e): complete slice 8.1 double-tap sweep` commit that adds this file

## Completed this slice
- Cases: 8 total: 7 pass / 1 fail (docs/e2e-sweep/test-cases/8.1.md). Most mutating buttons were already double-tap-tested in earlier slices; the covered list is in the matrix Data note.
- **Every remaining race ends in exactly one effect:**
  - device double taps on Start Job, the last task tick, Yes Mark Complete, Decline Booking (₱300 refunded once) and the client Withdraw sheet (one ₱10 request);
  - ORCH parallel API calls on start, complete and withdraw-application: one 201, and a clean 409 "This job changed while you were acting on it. Refresh and try again." or a 400 for the loser;
  - one notice each.
- New finding: E2E-164 (S4 ux, sign-off): providers can't withdraw a pending application in the app. The API exists but has no caller.
- Solved this slice: none.
- Flows: none added. Every 8.1 row consumes a fresh fixture (a hire, a start, a completion), so no read-only, re-runnable flow fits. The races are reproducible with `~/.taskbuddy-e2e/opus/race2.py <name> <path>`. Crash sweep: 0 lines (`~/.taskbuddy-e2e/logs/8.1-logcat.txt`).

## Haiku packets this slice
- 2 device packets (P1 3 rows, P2 2 money rows), 1 matrix packet (8.3, pipelined). No §3b gate failures.

## Environment state right now
- Installed build: `fbe63d63…`, sha256 `75b611c2…426c4`.
- **Emulator cold-rebooted again at about 16:35 Manila.** DNS failed at only about 2 h uptime, and two stray emulator processes were running, so all were killed and one was relaunched. devstate is OK and the timezone is restored. `auto_time_zone` is still 0 (restore in 9.1).
- Backend: health db up, ml down (E2E-001).
- **Ledger:**
  - c1 47,523 / 47,523 / in_escrow 1,400;
  - p1 255 / 255 / 1,400;
  - c2 150 / 150 / 0;
  - p2 560.45 / 560.45 / 0.
  - No pending withdrawals.
- **Jobs:**
  - J1 (₱500), R4, R5 and R10 (₱300 each) are held, waiting for auto-release (see below).
  - 8.1 left these no-budget fixtures in place:
    - F-S, F-S2 and F-T in progress;
    - F-C and F-C2 completed;
    - F-W and F-D cancelled.

## Open blockers / escalations awaiting the user
- **First thing after 2026-10-14T12:04Z:**
  1. Deferred check 5.3-15: J1 auto-release gives p1 +425.00, commission 75.00, c1 in_escrow −500.
  2. 7.4-31 on J1.
  3. After about 2026-10-15T00:01Z: R4, R5 and R10 auto-release (p1 +255.00 each).
- E2E-131: enable Stripe Connect in the sandbox account.
- Fix approvals (money-screen UI): E2E-105, 119, 120, 128, 129, 130.
- Allowed-scope fixes batched for a rebuild: E2E-111, 112 (app half), 115, 122, 123, 124, 132, 137, 138, 139, 140, 155, 157 (app half), 160, 161.
- Product decisions: E2E-133, 141, 159, 162, 164.
- Carried:
  - E2E-070 (High);
  - real-provider notifications once ML is up;
  - E2E-078; E2E-084;
  - sign-offs for E2E-046/047, 056/057, 066, 087, 099, 109.

## Next slice
- **8.2 Network & server states.** The matrix is drafted (`test-cases/8.2.md`, 19 rows), not yet reviewed. ORCH needs:
  - burners B1 (client, suspend/reinstate, rows 15–17), B2 (provider, unverified, row 08) and B3 (client, revoked session, row 14), as `maestro.burner.82.<n>@taskbuddy.test`, deleted at slice end;
  - the admin suspend and reinstate of B1 only;
  - a 15+ minute idle wait for row 11 (app force-stopped, no device or API traffic);
  - row 13's token-lifetime wait, if it's scheduled at all;
  - row 18 (maintenance mode) stays **Blocked: needs user OK** unless the continuation prompt says "maintenance mode approved";
  - in-app sign-out revokes all sessions of that account (candidate f), so never sign c1 or p1 out in-app during the slice.
- **8.3 Device & OS:** the matrix is drafted (`test-cases/8.3.md`, 22 rows), not yet reviewed. Each settings change carries its restore command.
- Pipeline the 8.4 matrix during 8.2's first packet.

## Gotchas learned this slice
- Git Bash rewrites a leading `/jobs/...` argument into `C:/Program Files/Git/jobs/...`. Export `MSYS_NO_PATHCONV=1` before passing API paths to Python scripts.
- After `adb emu kill`, check `Get-Process emulator*`. Stray instances can survive, and two emulators break the guest DNS.
- `GET /wallet/withdrawals` + `POST /wallet/withdrawals/:id/cancel` restore a test withdrawal.

## Continuation prompt
```
Continue the TaskBuddy mobile e2e sweep as the orchestrator. Read docs/handoff/029-handoff.md, then
follow docs/e2e-sweep/PLAN.md from Slice 8.2 — Network & server states. You own the startup checklist,
admin/money actions, triage, fix specs and commits; dispatch Haiku 5.5 subagents per §3/§3a with the
brief in docs/e2e-sweep/HAIKU-BRIEF.md, and gate every packet per §3b. Chain slices; stop only on the
PLAN header's stop conditions.
```
