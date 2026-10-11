# Handoff 018 — Slice 5.2 Decline & cancel refunds complete
Date: 2026-10-11   Branch: test/e2e-full-sweep   Last commit: the `test(e2e): complete slice 5.2 …` commit that adds this file

## Completed this slice
- Cases: 22 total (21 drafted by Haiku and reviewed by Opus, plus 1 exploratory X01): 17 pass / 5 fail / 0 blocked / 0 N-A (docs/e2e-sweep/test-cases/5.2.md). Opus re-judged 5.2-05, 06 and 12 from Fail to Pass, and 5.2-08 and 10 from Pass to Fail; each cell says why. Opus also corrected 5.2-21's Expected before it ran: the app's own copy says an appeal reopens review without moving money.
- **Every refund path moved money exactly once:**
  - provider decline: instant "Refund — provider declined";
  - client cancel of a confirmed booking: a 48-hour pending dispute with escrow `disputed`, then "Refund — cancellation agreed" when the provider agrees;
  - contest: the money stays frozen until admin "Refund — complaint resolved";
  - cancel after start: contested straight away and frozen until the admin decides.
- The decline-vs-cancel race (two threads, `opus/race.py`): the decline won, the cancel got 409 "This job changed while you were acting on it", one refund, no phantom dispute. Repeat decline, repeat response and repeat admin resolve are all refused. The cross-account probes all return 403. DTO limits match the app (decline reason 1–200, maxLength 200 and trimmed in the app).
- New findings (all S4, Open):
  - E2E-109: "File a Complaint" is offered on a booking the provider declined and that was already refunded (backend allows it by design; needs product sign-off).
  - E2E-110: the client who cancelled gets the provider-directed notice "Provider: agree or contest within 48 hours…" (backend-bug, migration copy).
  - E2E-111: "Contest cancellation" looks enabled while disabled (app-bug).
  - E2E-112: Complaint Status shows raw enums "refunded_to_client" and "cancellation_response" (app; the admin-resolve notification body too).
  - E2E-113: the API accepts a whitespace-only decline reason (backend-bug; the app trims).
  - E2E-114: the client Home wallet balance stays stale after a refund lands, and pull-down doesn't refresh it (ux; same family as E2E-075/091).
- Already-known findings seen again: E2E-074 (cancelled job timeline on "Posted"), E2E-107 (FAB covers wallet amounts).
- Solved this slice: none.
- New flow: `mobile/maestro/flows/p5_decline_refund_provider.yaml` plus `_helpers/decline_fixture_{post,check,cleanup}.js`. A real hire (₱300 held), an in-app decline with modal checks, and an API check of exactly one refund. It nets to zero, and its cleanup declines through the API if the UI stops early. Results: green on Haiku run 2 (run 1 failed on the doubled-first-letter login glitch; cleanup refunded) and green on Opus run 3, 2026-10-11 (30 COMPLETED, 0 FAILED; `~/.taskbuddy-e2e/logs/5.2/flow-run{1,2,3-opus}.log`).
- Not covered on screen: the provider Wallet shows no in-escrow figure for p1's ₱500 held on J1 (`GET /wallet` in_escrow 500, screen shows Available ₱0.00 / Pending ₱0.00). Left for the 6.1 reconciliation.

## Haiku packets this slice
- 1 matrix packet, 6 device packets (P1–P6), 1 flow packet (P8). No §3b gate failures.
- P7 (row 19 + crash sweep) was cut off by a Haiku session limit after taking the c1 Wallet screenshots. Opus finished 5.2-19 and the crash sweep itself.
- Opus ran 5.2-13, 16 and 18 (admin/race rows) and X01, and created every money fixture (K5–K8 hires, the K6 start, the K5 cancel).

## Environment state right now
- Installed build: `fbe63d63…` (versionCode 1), sha256 `75b611c2…426c4`. Emulator: `auto_time_zone` 0 (since 4.2; restore in 9.1); devstate OK.
- Backend: health db up, ml down (429, E2E-001).
- **Ledger:** c1 49,500 / 49,500 / in_escrow 500; c2 0; p1 0 / 0 / 500; p2 0 / 0 / 0. Admin escrow held: J1 500 only.
- **Jobs:** only J1 `1e4de8e9-68db-4a2d-9042-cc6a953b2254` stays live (confirmed → p1, ₱500, tasks "Fix leaking faucet" and "Unclog drain"), kept for 5.3. Every other test job is cancelled, and every test-job dispute is resolved. Both providers `is_available: false`.

## Open blockers / escalations awaiting the user
- None new. E2E-111 and E2E-112 are mobile JS fixes in the allowed scope (not money logic). They join the Phase 5 rebuild batch, together with E2E-105 if you approve it.
- Carried: E2E-105 fix approval (hire sheet, money UI); E2E-070 idempotency; real-provider notifications once ML is up; the E2E-078 product call; the E2E-084 backend fix; sign-offs for E2E-046/047, 056/057, 066, 087 and 099, plus the new E2E-109.

## Next slice
- **5.3 Start → tasks → complete → release** (money slice: at most 3 rows per packet, Opus snapshots before and after each).
- (1) Startup check, then record the ledger above, and `GET /admin/commission` (read only, never PATCH).
- (2) Haiku drafts `test-cases/5.3.md` from `SPJobDetailScreen.tsx` (Start Job, the task checklist, the "Work in progress" bar), `HOJobDetailScreen.tsx` (Confirm Completion, `canCancel` hidden when all tasks are done, `allTasksDone`), `JobsService.start`/`complete`, task gating, `EscrowService.payOut` (commission rounding, `round2`), and migration 0040 (three-day warranty: release timing). **Check whether completion releases immediately or after the 72-hour warranty**, because the wallet copy says "Funds stay held through the three-day completion warranty".
- (3) Use J1 (p1, ₱500) for the main path, plus a fresh ₱777 fixture for centavo rounding (ORCH hires it). Before Start, task ticking must be refused. Double-tap Complete must pay out once. Cancel Job must be hidden once every task is ticked.

## Gotchas learned this slice
- A client cancel of a confirmed booking does NOT refund at once. The DB trigger (`0041`, BEFORE UPDATE) opens a pending dispute and flips escrow to `disputed`; `cancelForJob` then finds nothing `held`. A provider decline refunds inside the same trigger.
- `in_escrow` on GET /wallet counts `disputed` escrow too.
- `adb shell input text` can stop early on long strings (200 chars stopped at 44): type in chunks.
- `inputText` sometimes doubles the email's first letter ("mmaestro…") → "Invalid login credentials". Read the field before retrying.
- Don't name a shell variable `D` after sourcing opus-api.sh: it is the token dir.
- The Opus tokens expire within about an hour. snap.py prints "HTTP 401 (re-login)": re-run the four `login` calls plus `adminlogin`.
- New Opus helpers: `~/.taskbuddy-e2e/opus/snap.py <slice> <label>` (wallets + test escrow rows), `opus/race.py` (two-thread barrier race), and fx.py specs K5–K8 (`scratch/5.2o/`).

## Continuation prompt
```
Continue the TaskBuddy mobile e2e sweep as the orchestrator. Read docs/handoff/018-handoff.md, then
follow docs/e2e-sweep/PLAN.md from Slice 5.3 — Start → tasks → complete → release. You own the startup
checklist, admin/money actions, triage, fix specs and commits; dispatch Haiku 5.5 subagents per §3/§3a
with the brief in docs/e2e-sweep/HAIKU-BRIEF.md, and gate every packet per §3b. Chain slices; stop only
on the PLAN header's stop conditions.
```
