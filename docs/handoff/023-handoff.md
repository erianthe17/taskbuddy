# Handoff 023 — Slice 6.3 Top-up, payouts, transfer, vouchers complete
Date: 2026-10-12   Branch: test/e2e-full-sweep   Last commit: the `test(e2e): complete slice 6.3 …` commit that adds this file

## Completed this slice
- Cases: 27 total (drafted by Haiku in parallel with 6.2, reviewed by Opus): 17 pass / 3 fail / 2 blocked / 5 N-A (docs/e2e-sweep/test-cases/6.3.md).
- **UAT decision (user, 2026-10-12):** "prepare the app for UAT, we are not dealing with real world people for now; do what's best". Stripe sandbox actions on test accounts are therefore allowed. Saved in auto-memory `uat-prep-goal`.
- **Wallet top-up works end to end (the key UAT money path).** Add Money ₱50 led to Stripe Checkout (Sandbox, `cs_test_`). Paying with test card 4242 returned to the app, and the webhook credited ₱50 **exactly once** in about 17 s. That disproves PLAN §1's 2026-10 note, which is now corrected. Stripe's Back link returns with "Payment was cancelled." and no charge. Six rapid attempts hit the rate limit with friendly copy.
- **Add Money gates hold** for 0, negative, 49.99 and letters. Presets 500/1000/2500/5000 work. Cancel and Back clear the sheet.
- The recovery-voucher card shows a recovery credit correctly. There is no Transfer action, by design. Providers have no Add Money, by design.
- New findings:
  - **E2E-131 (env, S3): "Set up payouts" fails** because the Stripe sandbox account hasn't enabled Connect. User action: Stripe Dashboard (sandbox) → Connect → Get started. Until then, card-funded payouts can't transfer to provider banks. Providers still get wallet credit and can use the manual withdrawal.
  - E2E-130 (S4): Add Money lets 3-decimal and over-₱100,000 amounts reach the API and shows raw validator text that sticks. Money-screen UI.
- Re-judged: 6.3-13 (pasted "1e3") from Fail to N-A, since it's unreachable from the keypad and harmless.
- New flow: `mobile/maestro/flows/p6_addmoney_sheet_client.yaml` (read-only; never opens Stripe). Green on Haiku run 1. Opus then reordered it so the only point tap happens before the keyboard can shift the sheet (Haiku flagged that a later point tap could land on Continue and open Stripe). Green again on Opus run 2, 2026-10-12 (`mt.sh: OK`; `~/.taskbuddy-e2e/logs/6.3/flow-run{1,2-opus}.log`). Crash sweep: 0 lines (`~/.taskbuddy-e2e/logs/6.3-logcat.txt`).

## Haiku packets this slice
- 1 matrix packet (pipelined during 6.2), 4 device packets (P1–P4: 6+6+5+7 rows), 1 flow packet. No §3b gate failures.
- Opus drove rows 16, 17 and 18 (the sandbox payment, the Stripe back link, the rate limit) and made the ₱100 recovery credit.
- Pipelined: the 7.1 chat matrix (`test-cases/7.1.md`, 30 rows, untracked) was drafted during 6.3-P1.

## Environment state right now
- Installed build: `fbe63d63…` (versionCode 1), sha256 `75b611c2…426c4`. devstate OK; `auto_time_zone` 0 (restore in 9.1).
- Backend: health db up, ml down (E2E-001).
- **Ledger:** c1 48,723 / 48,723 / in_escrow 500; **c2 150 / 150 / 0** (₱50 sandbox top-up + ₱100 recovery credit); p1 0 / 0 / 500; p2 560.45 / 560.45 / 0. No pending withdrawals.
- **Jobs:** J1 `1e4de8e9…` completed, ₱500 held until **2026-10-14T12:03:57Z**. No open or confirmed test job remains.

## Open blockers / escalations awaiting the user
- **E2E-131: enable Stripe Connect in the sandbox account** (a dashboard step only you can do).
- Fix approvals (money-screen UI): E2E-105, 119, 120, 128, 129 and 130. Allowed-scope fixes batched for a rebuild: E2E-111, 112 (app half), 115, 122, 123 and 124.
- **Deferred check:** after 2026-10-14T12:03:57Z, confirm J1 auto-released (row 5.3-15).
- Carried: E2E-070; real-provider notifications once ML is up; E2E-078; E2E-084; sign-offs for E2E-046/047, 056/057, 066, 087, 099 and 109.

## Next slice
- **7.1 Chat.** The matrix is already drafted (`test-cases/7.1.md`, 30 rows). Review it first.
- Key review points:
  - composer cap 500 vs DTO 1000 (a finding candidate);
  - rows 18 and 19 (chat on cancelled / completed jobs) are ORCH decisions;
  - unicode messages are posted by ORCH via Python urllib (`api.sh call` mangles non-ASCII);
  - fixture C1 needs a hire (₱300 hold from c1), cleaned up by a provider decline (instant refund).
- Pipeline the **7.2 Notifications** matrix during 7.1's first short packet.

## Gotchas learned this slice
- Stripe Checkout in the Chrome Custom Tab is drivable with adb taps at screenshot coordinates. Focus doesn't auto-advance between card fields, and the page scrolls when the keyboard opens, so tap each field and re-screenshot.
- `uiautomator dump` sees Chrome Custom Tab chrome (URL bar) but not reliably the Stripe page contents; use screenshots there.
- Short toasts ("Payment was cancelled.") vanish within about 3 s; dump the hierarchy within 1 s of the event.
- The Connect error text is mapped in the app from Stripe's raw message (SPPayoutsScreen:130-135).

## Continuation prompt
```
Continue the TaskBuddy mobile e2e sweep as the orchestrator. Read docs/handoff/023-handoff.md, then
follow docs/e2e-sweep/PLAN.md from Slice 7.1 — Chat. You own the startup checklist, admin/money actions,
triage, fix specs and commits; dispatch Haiku 5.5 subagents per §3/§3a with the brief in
docs/e2e-sweep/HAIKU-BRIEF.md, and gate every packet per §3b. Chain slices; stop only on the PLAN
header's stop conditions.
```
