# Handoff 017 — Slice 5.1 Hire → escrow held complete
Date: 2026-10-11   Branch: test/e2e-full-sweep   Last commit: the `test(e2e): complete slice 5.1 …` commit that adds this file

## Completed this slice
- Cases: 16 total (15 drafted by Haiku, reviewed by Opus; 1 exploratory X01): 11 pass / 4 fail / 0 blocked / 1 N-A (docs/e2e-sweep/test-cases/5.1.md). Rows 5.1-14 and 5.1-05 were re-judged from Pass to Fail by Opus, because the observation matched the code prediction rather than the sensible Expected. HAIKU-BRIEF now spells out that rule.
- **Money held exactly once every time:** the wallet hire, a raw double tap on "Pay from wallet" (K3), and the PLAN duplicate-POST re-check, offline tap then online tap (K4). The E2E-070 pattern did NOT reproduce on hire. The unfunded client gets a disabled wallet option ("Not enough in your wallet — add money →"), and the API answers 400 `insufficient_funds` "₱350.00 needed, ₱0.00 available". Role, owner and re-accept guards all hold. The Wallet screen matches `GET /wallet` exactly.
- New findings (all Open):
  - **E2E-105: when the hire sheet's reads fail, it says the ₱350 job "has no budget, so nothing is held" and offers an enabled Hire (S3, app, money-adjacent UI, so a fix needs your OK).**
  - E2E-102: the client Calendar never shows a hired booking that has no date (S4).
  - E2E-103: a flexible booking shows on the provider calendar at the hire time, "3:09 AM · Scheduled" (S4).
  - E2E-104: the provider who wasn't selected gets no notification and sees "This job isn't available — may have been filled…" (S4).
  - E2E-106: the hire sheet's Cancel sits under the navigation bar (S4).
  - E2E-107: the floating "Post a job" button covers a transaction amount on the client Wallet (S4).
  - E2E-108: the Help FAQ hire wording doesn't match the app (S4).
- Observed and not logged separately: the client gets no notification of its own hire. PLAN expects "both roles"; the provider does get "Booking confirmed".
- Solved this slice: none.
- New flow: `mobile/maestro/flows/p5_hire_sheet_unfunded_client.yaml` plus `_helpers/unfunded_fixture_post.js` and `unfunded_fixture_cancel.js`. Green twice on 2026-10-11, run by Opus (35 COMPLETED, 2 WARNED optional taps, 1 SKIPPED, 0 FAILED each; logs in `~/.taskbuddy-e2e/logs/5.1/flow-run{1,2}.log`). A wallet-hire flow is deferred until 5.2 shows how a confirmed job can be cleaned up (see below).

## Haiku packets this slice
- 1 matrix packet + 6 device packets (P1 hire, P2 read-only views, P3 unfunded, P4 race, P5 offline duplicate, P6 wallet screen). No §3b gate failures. Opus snapshotted every wallet plus the admin escrow rows before and after each money packet (`~/.taskbuddy-e2e/logs/5.1/wallets-*.log`), and ran the API rows (06, 10, 13; 11 N-A).

## Environment state right now
- Installed build: `fbe63d63…` (versionCode 1), sha256 `75b611c2…426c4`. Emulator: `auto_time_zone` 0 (since 4.2; restore in 9.1); devstate OK.
- Backend: health db up, ml down (429, E2E-001).
- **Ledger:** c1 48,800 / 48,800 / in_escrow 1,200; c2 0; p1 0 / 0 / in_escrow 800; p2 0 / 0 / in_escrow 400. Admin escrow rows held: J1 500, K3 400, K4 300.
- **Jobs kept for Phase 5** (all owned by `maestro.client@`, all `confirmed`):
  - J1 `1e4de8e9-68db-4a2d-9042-cc6a953b2254` → p1, ₱500, 2 tasks. For 5.3 (start → tasks → complete → release).
  - K3 `055c68e5-d29c-4562-97b4-9a9f66774273` → p2, ₱400. For the 5.2 provider decline → refund.
  - K4 `e5551922-3810-41da-9251-cbdc38c6ef16` → p1, ₱300. For the 5.2 client cancel → refund. **Watch out:** `HOJobDetailScreen.tsx:458-459` copy says a client cancel of a booking opens a 48-hour agree/contest window. The old chat job refunded only when that window expired ("Refund — cancellation response expired"), so expect a pending state, not an instant refund.
- Every other `maestro.client@` / `client2@` job is cancelled. Both providers `is_available: false`.

## Open blockers / escalations awaiting the user
- **New: E2E-105 fix approval.** It is a mobile JS bug in the hire sheet: tell "not loaded" apart from "no budget". The hire sheet is money UI, which PLAN §6 says to escalate before fixing. Logged; no fix attempted.
- Carried: E2E-070 idempotency (hire now verified safe); real-provider notifications once ML is up; the E2E-078 product call; the E2E-084 backend fix; sign-offs for E2E-046/047, 056/057, 066, 087 and 099.

## Next slice
- **5.2 Decline & cancel refunds** (money slice: at most 3 rows per packet; Opus snapshots wallets and admin transactions before and after every packet).
- (1) Startup check, then record the ledger above. (2) Haiku drafts `test-cases/5.2.md` from `SPJobDetailScreen.tsx` Decline Booking + `DeclineBookingModal` (reason 1-200 per PLAN), `JobsService.decline`/`cancel` and `cancelForJob`, the escrow refund paths, the dispute/cancellation-response tables, and `HOJobDetailScreen.tsx` Cancel Job copy (:458-459).
- (3) Cases: p2 declines K3 (reason boundaries 0/1/200/201) → K3 cancelled, the 400 refunded to c1 exactly once, p2 in_escrow −400. The client cancels K4 → record what happens to the 300 (the 48-hour window?); if it pends, the provider-response branch (agree/contest) belongs to 5.2/7.4. Cancel an in-progress job → frozen for admin review (needs a started job: start a fresh fixture, not J1).

## Gotchas learned this slice
- Hired jobs are `confirmed`, not `assigned`. `POST /jobs/:id/accept` (provider accept) is dead for new hires.
- One tap on "Pay from wallet" hires; there is no second confirm.
- The admin token expires mid-slice: re-run `adminlogin` (opus-api.sh) on a `KeyError: 'transactions'` or a 401.
- Sourcing `opus/opus-api.sh` redefines `call`/`tokof` to the opus token dir. Re-source `api.sh` afterwards for test-account calls.
- Keep the "Code predicts" rule visible: a Haiku tends to mark "Pass" when the code prediction comes true.

## Continuation prompt
```
Continue the TaskBuddy mobile e2e sweep as the orchestrator. Read docs/handoff/017-handoff.md, then
follow docs/e2e-sweep/PLAN.md from Slice 5.2 — Decline & cancel refunds. You own the startup checklist,
admin/money actions, triage, fix specs and commits; dispatch Haiku 5.5 subagents per §3/§3a with the
brief in docs/e2e-sweep/HAIKU-BRIEF.md, and gate every packet per §3b. Chain slices; stop only on the
PLAN header's stop conditions.
```
