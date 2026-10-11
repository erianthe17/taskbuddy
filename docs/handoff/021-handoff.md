# Handoff 021 — Slice 6.1 Overview reconciliation complete
Date: 2026-10-11   Branch: test/e2e-full-sweep   Last commit: the `test(e2e): complete slice 6.1 …` commit that adds this file

## Completed this slice
- Cases: 16 total (drafted by Haiku, reviewed by Opus): 11 pass / 4 fail / 0 blocked / 1 N-A (docs/e2e-sweep/test-cases/6.1.md).
- **Every money figure on both wallet screens equals `GET /wallet` to the centavo:**
  - the c1 balance card, IN ESCROW and all 21 ledger rows (title, sign, amount, Manila-local date, in order);
  - the Added (10 credits) and Spent (11 debits) filters;
  - the c1 Home card after a real relaunch;
  - the c2 empty states (Wallet and Home);
  - p2's Available, Pending, Total Earned, Total Withdrawn and Jobs Done.
  - At 1.3 font scale the client wallet stays readable (titles ellipsize at two lines, amounts whole).
- The 4 Fails are all already-known findings, and none was re-logged:
  - 6.1-10 and 6.1-14: E2E-120, the blank Withdraw pill when available > 0;
  - 6.1-11: E2E-118, the payout title has no fee suffix;
  - 6.1-12: E2E-119, the provider's held ₱500 is not shown.
- N-A: 6.1-03. The client wallet's Added/Spent totals were removed after QA by design (`HOWalletScreen.tsx:8-10`).
- New findings: none. Solved: none.
- New flow: `mobile/maestro/flows/p6_wallet_matches_api_client.yaml` plus `_helpers/wallet_expected.js`. It is read-only and asserts the balance, IN ESCROW and newest row against the live `GET /wallet` at run time. Green on Haiku run 1 and Opus run 2, 2026-10-11 (19 COMPLETED, 0 FAILED each; `~/.taskbuddy-e2e/logs/6.1/flow-run1.log`, `flow-run2-opus.log`).

## Haiku packets this slice
- 1 matrix packet, 5 device packets (P1–P5), 1 flow packet (P6). No §3b gate failures. Opus supplied the live ledger reference file, judged 6.1-03 (N-A by design) and kept 6.1-04 a Pass ("Payment completed" is the generic status, and each refund's title names it).

## Environment state right now
- Installed build: `fbe63d63…` (versionCode 1), sha256 `75b611c2…426c4`. **The emulator was cold-rebooted at ~14:00Z** (see env-state.md 6.1 notes); devstate OK; `auto_time_zone` 0 (restore in 9.1).
- Backend: health db up, ml down (429, E2E-001).
- **Ledger:** c1 48,723 / 48,723 / in_escrow 500; c2 0; p1 0 / 0 / 500; p2 660.45 / 660.45 / 0.
- **Jobs:** J1 `1e4de8e9…` completed, ₱500 held until 2026-10-14T12:03:57Z. No open or confirmed test job remains.

## Open blockers / escalations awaiting the user
- Fix approvals (money-screen UI): E2E-105, **E2E-119** and **E2E-120**. E2E-120 makes the provider's Withdraw unlabeled, which 6.2 will hit; the workaround is to tap it by its bounds (the hierarchy still has the text).
- Batched for the Phase 5/6 rebuild (allowed scope): E2E-111, 112 (app half) and 115.
- **Deferred check:** after 2026-10-14T12:03:57Z, confirm J1 auto-released (row 5.3-15).
- Carried: E2E-070; real-provider notifications once ML is up; E2E-078; E2E-084; sign-offs for E2E-046/047, 056/057, 066, 087, 099 and 109.

## Next slice
- **6.2 Withdrawals** (money slice: at most 3 rows per packet, Opus snapshots before and after each).
- (1) Startup check; record the ledger above.
- (2) Haiku drafts `test-cases/6.2.md` from the withdraw sheets (client `withdraw-hw-dialog` in HOWalletScreen, provider SPWallet withdraw modal), `WalletService` withdrawal request/cancel, the withdrawal DTO (amount and destination limits; grep the DTO), and the admin settle/reject routes.
- (3) Use **p2's real 660.45** for the provider path (amounts 0, negative, decimals, > available, = available; destination empty/long). Cover: cancel the pending request; two pending at once; admin reject with a reason (allowed admin action), and the user sees the reason with the amount restored; admin settle `{reference}` debits once, and a second settle is refused; a double-tap on Withdraw creates one request; the PLAN duplicate-POST offline re-check (S1 if two requests are created). c1 has 48,723 for the client path.

## Gotchas learned this slice
- Export `SLICE` **before** sourcing `api.sh`; sourcing first puts tokens in `scratch/3.2/`.
- `GET /wallet` is flat (balance, available, in_escrow, total_credited, total_debited, pending, pending_withdrawals, transactions); there is no `summary` object.
- Wallet dates are device-local (Manila); UTC times after 16:00 show the next day.
- A tool-shell `Start-Process emulator.exe` dies when the shell exits; use `-PassThru` and check the process, or relaunch.

## Continuation prompt
```
Continue the TaskBuddy mobile e2e sweep as the orchestrator. Read docs/handoff/021-handoff.md, then
follow docs/e2e-sweep/PLAN.md from Slice 6.2 — Withdrawals. You own the startup checklist, admin/money
actions, triage, fix specs and commits; dispatch Haiku 5.5 subagents per §3/§3a with the brief in
docs/e2e-sweep/HAIKU-BRIEF.md, and gate every packet per §3b. Chain slices; stop only on the PLAN
header's stop conditions.
```
