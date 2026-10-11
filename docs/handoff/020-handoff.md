# Handoff 020 — Slice 5.4 Recommendation engine path complete
Date: 2026-10-11   Branch: test/e2e-full-sweep   Last commit: the `test(e2e): complete slice 5.4 …` commit that adds this file

## Completed this slice
- Cases: 9 total (drafted by Haiku, reviewed by Opus): 9 pass / 0 fail / 0 blocked / 0 N-A (docs/e2e-sweep/test-cases/5.4.md).
- **Scheduler path works:** an urgent job got `recommendation_deadline` = created + exactly 5 min, and the every-minute scheduler flipped it to `recommending` at the first tick after the deadline (28 s late). The client sees "Finding Provider".
- **ML is down (E2E-001, env):** nothing was scored and no `recommendation_invite` reached either test provider (both also `is_available: false`). One manual Find Providers tap gave "Something went wrong on our side. Please try again in a moment." The job stays "Finding Provider", and the retry sweep re-claims it every 5 minutes.
- Guards: the trigger as another client → 403 "Not your job"; as a provider → 403 role; on a cancelled job → 400; unknown id → 404; non-UUID → 400.
- New findings: none. Row 05 is linked to E2E-001. Observed but not logged separately: while ML is down, the client gets only the generic error and the job shows "Finding Provider" indefinitely. That consequence is part of E2E-001, and the generic copy is accurate for a server failure.
- Solved this slice: none.
- No new flow: the path needs a real-time wait of 5+ minutes, and with ML down there is no invite to assert.

## Haiku packets this slice
- 1 matrix packet, 1 device packet (P1: rows 04–06, including the single permitted Find Providers tap), 1 API-only packet (P2: rows 07–09). No §3b gate failures.
- Opus ran rows 01–03 itself because they had to land inside the 5-minute window (the device lock was taken between packets). It logged the device in by raw adb input after Maestro doubled a letter and stalled.

## Environment state right now
- Installed build: `fbe63d63…` (versionCode 1), sha256 `75b611c2…426c4`. Emulator: `auto_time_zone` 0 (since 4.2; restore in 9.1); devstate OK. **The emulator has been up 27 h at load average ~10. Cold-reboot it before Phase 6** (detached boot per the startup checklist, then re-check the timezone and devstate).
- Backend: health db up, ml down (429, E2E-001).
- **Ledger:** c1 48,723 / 48,723 / in_escrow 500; c2 0; p1 0 / 0 / 500; p2 660.45 / 660.45 / 0.
- **Jobs:** J1 `1e4de8e9…` completed, ₱500 held until 2026-10-14T12:03:57Z. R1 cancelled. No open or confirmed test job remains.

## Open blockers / escalations awaiting the user
- **Phase 5 is complete.** The fix batch for its rebuild:
  - in the allowed scope: E2E-111, E2E-112 (app half) and E2E-115;
  - needs your OK (money-screen UI): E2E-105, E2E-119 and E2E-120.
  - Per PLAN §6 the rebuild can wait, since nothing blocks Phase 6. E2E-120 (blank Withdraw button) affects 6.2, and the workaround is to tap the button by its bounds.
- **Deferred check:** after 2026-10-14T12:03:57Z, confirm J1 auto-released (row 5.3-15).
- Carried: E2E-070; real-provider notifications once ML is up; E2E-078; E2E-084; sign-offs for E2E-046/047, 056/057, 066, 087, 099 and 109.

## Next slice
- **6.1 Overview reconciliation** (`HOWalletScreen`, `SPWalletScreen`).
- (1) Cold-reboot the emulator, run the startup checklist, and record the ledger above.
- (2) Haiku drafts `test-cases/6.1.md`: every figure on both wallet screens against `GET /wallet` (balance, available, in escrow, available to withdraw, spent/added, Total Earned, Pending), the transaction list kinds/signs/titles/dates (topup, escrow_hold, payout, refund, recovery_credit), the empty state (c2), and large-text layout. p2 now has a real payout (660.45) and c1 has refunds of every kind from 5.2, so the ledgers are rich.
- (3) Expect to meet the known E2E-107 (FAB covers amounts), E2E-114 (stale Home balance), E2E-119 (provider in-escrow not shown) and E2E-120 (blank Withdraw).

## Gotchas learned this slice
- The manual trigger runs the same `scoreJob` as the scheduler, so one tap reaches no one the scheduler wouldn't. With ML down it writes nothing.
- `recommendation_attempted_at` moves on every retry-sweep claim (every 5 minutes).
- Raw adb login recipe (when Maestro doubles letters): tap the field, MOVE_END + deletes, `adb shell input text <email>`, read it back, password the same way, `keyevent 4`, then **re-read the Sign In bounds** (the layout shifts when the keyboard closes) before tapping.

## Continuation prompt
```
Continue the TaskBuddy mobile e2e sweep as the orchestrator. Read docs/handoff/020-handoff.md, then
follow docs/e2e-sweep/PLAN.md from Slice 6.1 — Overview reconciliation. You own the startup checklist,
admin/money actions, triage, fix specs and commits; dispatch Haiku 5.5 subagents per §3/§3a with the
brief in docs/e2e-sweep/HAIKU-BRIEF.md, and gate every packet per §3b. Chain slices; stop only on the
PLAN header's stop conditions.
```
