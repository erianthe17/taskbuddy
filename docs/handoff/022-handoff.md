# Handoff 022 — Slice 6.2 Withdrawals complete (+ sweep speed-up)
Date: 2026-10-12   Branch: test/e2e-full-sweep   Last commit: the `test(e2e): complete slice 6.2 …` commit that adds this file

## Completed this slice
- Cases: 21 total (20 drafted by Haiku, plus ORCH race row 21): 14 pass / 7 fail / 0 blocked / 0 N-A (docs/e2e-sweep/test-cases/6.2.md).
- **Money is exact everywhere.** Every request reserved exactly its amount. Every cancel and admin reject restored it. The admin settle debited once, and a second settle or a reject after settle is refused. Amount 0, negative, over-available and 3 decimals are all refused with no request created. A double tap made one request.
- **The PLAN duplicate-POST re-check is clean:** an offline tap, then one tap online, filed exactly one request. No E2E-070 pattern here.
- **Concurrency:** 4 parallel ₱200 withdrawals against ₱560.45 gave exactly 2 accepted and 2 refused by the migration 0045 trigger (TB402). So 0045 is deployed and serializes debits; no overdraw is possible.
- Cross-account and forged-body probes all refused (403 wrong owner; 400 over-available; 400 `kind`; 400 credit).
- New findings (all S4, Open):
  - E2E-121 harness: Maestro intermittently doubles the email's first letter. The bounded check found it non-reproducible on demand, so it's not an app bug; workaround `login.sh`.
  - E2E-122: the Withdraw sheet's auto-focus doesn't open the keyboard.
  - E2E-123: an amount with 3 decimals reaches the API and shows raw validator text.
  - E2E-124: a cancelled withdrawal shows as "Failed".
  - E2E-125: the provider Wallet shows settled/rejected requests as pending with a live Cancel until a tab switch.
  - E2E-126 backend: withdrawal notifications say "of 50" instead of ₱50.00.
  - E2E-127 backend: the API accepts a whitespace-only destination.
  - E2E-128: the client Withdraw sheet lacks the provider sheet's checks (no over-available message, no 200 cap, raw statuses). Money-screen UI.
  - E2E-129: the client's "Available Balance" headline shows balance, not available. Money-screen UI.
- Solved: none.
- New flow: `mobile/maestro/flows/p6_withdraw_cancel_provider.yaml` plus `_helpers/withdraw_fixture_{pre,check,cleanup}.js`. It requests ₱10, cancels it, checks the API, and nets to zero. Green on Haiku run 1 and Opus run 2, 2026-10-12 (`mt.sh: OK`, 34 COMPLETED; `~/.taskbuddy-e2e/logs/6.2/flow-run1.log`, `flow-run2-opus.log`). Each run adds one `failed` withdrawal row to p2 (balance unaffected).

## Speed-up (user-approved plan, 2026-10-12)
- **Harness, outside the repo:**
  - `login.sh` (adb login with read-back; 12/12, median 35 s, against 2–3 min for the Maestro login);
  - `hier.sh` now uses `uiautomator dump` (~3 s against ~21 s; Maestro fallback; `HIER_NOFALLBACK` for pollers);
  - `mt.sh` exits 1 on FAILED, a parse error, a driver timeout or a mid-step stop;
  - `api.sh` and `opus-api.sh` re-login once on a 401;
  - new `opus/gate.sh` for the mechanical §3b checks.
- **PLAN.md:**
  - packet size by risk (money ≤3 rows with snapshots; read-only ≤6);
  - parallel non-device API packets, with rules (no fixture overlap; never beside a money packet);
  - pipelined matrix drafts;
  - emulator-health reboot and backend warm-up in the startup checklist.
- **HAIKU-BRIEF:** `login.sh` (setup logins only, never for rows whose subject is login or session), the new tool behaviour, the §4a navigation map, fewer Maestro starts, and an `adb shell` stdin trap.
- **Measured** (Agent `duration_ms`):
  - 6.2 device packets: P1 14 min / 6 rows, P2 7 / 3, P3 7 / 2, P4 9 / 4, P5 8 / 3, P6 16 / 3, which is about **2–5 min per row**;
  - before: 5.3 averaged about 12 min per row and 6.1 about 5;
  - the 6.3 matrix was drafted in parallel during P2;
  - **zero §3b gate failures.**
- **Lesson:** the one-driver device lock applies to the orchestrator's own background shell loops too. Three overlapping login trials garbled the field and made it look like an app bug until the processes were found and killed.

## Environment state right now
- Installed build: `fbe63d63…` (versionCode 1), sha256 `75b611c2…426c4`. Emulator up since the 2026-10-11 ~14:00Z reboot; devstate OK; `auto_time_zone` 0 (restore in 9.1).
- Backend: health db up, ml down (E2E-001).
- **Ledger:** c1 48,723 / 48,723 / in_escrow 500 / pending 0; c2 0; p1 0 / 0 / 500; **p2 560.45 / 560.45 / 0 / 0** (total_debited 100). No pending withdrawal on any test account. Another, non-test user's pending ₱100 withdrawal is in the admin queue; not ours, untouched.
- **Jobs:** J1 `1e4de8e9…` completed, ₱500 held until **2026-10-14T12:03:57Z**. No open or confirmed test job remains.

## Open blockers / escalations awaiting the user
- Fix approvals (money-screen UI): E2E-105, 119, 120, 128 and 129. Allowed-scope fixes batched for a rebuild: E2E-111, 112 (app half), 115, 122, 123 and 124.
- **Deferred check:** after 2026-10-14T12:03:57Z, confirm J1 auto-released (row 5.3-15).
- Carried: E2E-070; real-provider notifications once ML is up; E2E-078; E2E-084; sign-offs for E2E-046/047, 056/057, 066, 087, 099 and 109.

## Next slice
- **6.3 Top-up, payouts, transfer, vouchers.** The matrix is already drafted (`test-cases/6.3.md`, 27 rows, untracked; review it first).
- Review points:
  - The webhook evidence conflicts (PLAN says it never credits; the backend README says a ₱50 sandbox top-up was credited once). Stop at the Stripe hosted page as PLAN says, and mark the credit Blocked (env), adding a finding if none exists.
  - Row 6.3-25 "Set up payouts" may create a Stripe Express account for p1. That is outward-facing (Stripe sandbox), so **stop and ask the user before tapping it**, or mark it Blocked.
  - The recovery-voucher rows need an ORCH recovery credit of ₱100 to a test account (allowed, ≤ ₱50,000). Do it only if the voucher UI can't be verified another way, and record it.

## Gotchas learned this slice
- `GET /wallet/withdrawals` rows don't return the destination.
- The Withdraw sheet moves about 726 px up when the keyboard opens. Re-read bounds after every keyboard change (one coordinate tap typed into the amount field).
- `snap.py` has no 401 auto-re-login (only `call()` does); re-run the logins when it prints "HTTP 401".
- Haiku sometimes saves logs as `09.log` instead of `6.2-09.log`. `gate.sh` flags it; copy to the standard name.

## Continuation prompt
```
Continue the TaskBuddy mobile e2e sweep as the orchestrator. Read docs/handoff/022-handoff.md, then
follow docs/e2e-sweep/PLAN.md from Slice 6.3 — Top-up, payouts, transfer, vouchers. You own the startup
checklist, admin/money actions, triage, fix specs and commits; dispatch Haiku 5.5 subagents per §3/§3a
with the brief in docs/e2e-sweep/HAIKU-BRIEF.md, and gate every packet per §3b. Chain slices; stop only
on the PLAN header's stop conditions.
```
