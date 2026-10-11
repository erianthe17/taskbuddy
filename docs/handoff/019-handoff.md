# Handoff 019 — Slice 5.3 Start → tasks → complete → release complete
Date: 2026-10-11   Branch: test/e2e-full-sweep   Last commit: the `test(e2e): complete slice 5.3 …` commit that adds this file

## Completed this slice
- Cases: 18 total (17 drafted by Haiku and reviewed by Opus, plus 1 exploratory X01): 11 pass / 6 fail / 0 blocked / 1 N-A (deferred) (docs/e2e-sweep/test-cases/5.3.md).
- **Plan change (PLAN.md 5.3 edited):** Confirm Completion does not pay the provider. The escrow stays held for a 72-hour warranty, and the payments sweep releases it after that (migration 0040). The app copy says so on both roles ("₱500.00 stays held until it ends"). Payout and commission were therefore tested through an admin `released_to_provider` resolve on a complaint filed inside the warranty, and J1's automatic release is deferred.
- **Money correct to the centavo:** ₱777 at commission 0.15 → the provider got exactly 660.45, with 116.55 frozen on the escrow row. One credit; a second resolve was refused (400 "This complaint is already closed"). Completion itself moved nothing.
- **Gates all hold:**
  - ticking before Start → 400; the wrong provider ticking → 403;
  - completing with a task undone → 400; the provider completing → 403 (role); another client completing → 403;
  - completing twice → 400; ticking after completion → 400.
  - Cancel Job hides when all tasks are done and comes back on an untick.
- New findings:
  - **E2E-119 (S3):** the provider Wallet never shows money held for them (₱500 in escrow → screen says ₱0.00 everywhere). Money-screen UI, so a fix needs your OK.
  - **E2E-120 (S3):** with available > 0, the provider's Withdraw button renders as a blank white pill. Money-screen UI, so a fix needs your OK.
  - E2E-115 (S4): before Start, the provider is told "Tick tasks off as you finish them" over inert checkboxes.
  - E2E-116 (S4, backend): untick + re-tick sends a second "Work ready for review".
  - E2E-117 (S4, backend): "A participant added a appeal."
  - E2E-118 (S4, backend): an admin-released payout's title omits "(less 116.55 platform fee)".
- Solved this slice: none.
- No new flow. A completed job can't be cleaned up without an admin decision or the 72-hour release, so a re-runnable flow would move real money on every run. The hire path is already covered by `p5_decline_refund_provider.yaml`.

## Haiku packets this slice
- 1 matrix packet + 5 device packets (P1–P5). No §3b gate failures. Opus ran the M1 fixture chain (hire, start, ticks, complete), rows 12 and 13 (complaint, admin release) and X01.

## Environment state right now
- Installed build: `fbe63d63…` (versionCode 1), sha256 `75b611c2…426c4`. Emulator: `auto_time_zone` 0 (since 4.2; restore in 9.1); devstate OK.
- Backend: health db up, ml down (429, E2E-001).
- **Ledger:** c1 48,723 / 48,723 / in_escrow 500; c2 0; p1 0 / 0 / 500; **p2 660.45 / 660.45 / 0** (real payout earnings, useful for 6.2 withdrawals).
- **Jobs:** J1 `1e4de8e9-68db-4a2d-9042-cc6a953b2254` completed, ₱500 held until **2026-10-14T12:03:57Z** (8:03 PM Manila). M1 `a8864a42-1bd0-43a2-a4a2-5e53832d0a70` completed and released. No open or confirmed test job remains. Both providers `is_available: false`.

## Open blockers / escalations awaiting the user
- **New:** fix approval for E2E-119 and E2E-120 (provider Wallet, money-screen UI per PLAN §6). E2E-111, 112 and 115 are in the allowed fix scope and are batched for the Phase 5 rebuild.
- **Deferred check:** after 2026-10-14T12:03:57Z, confirm J1 auto-released: p1 +425.00, commission 75.00, c1 in_escrow 0, title with the fee suffix (row 5.3-15). Any session after that date should run it first.
- Carried: E2E-105 fix approval; E2E-070; real-provider notifications once ML is up; E2E-078; E2E-084; sign-offs for E2E-046/047, 056/057, 066, 087, 099 and 109.

## Next slice
- **5.4 Recommendation engine path** (real-time wait: split the packets at the deadline; Opus waits with a Monitor until-loop).
- (1) Startup check; record the ledger above.
- (2) The client posts an **urgent** job (5-minute deadline) with nobody applying. Poll `GET /jobs/:id` every 60 s for up to 8 minutes. Expect `recommending`. With ML down (E2E-001), expect no invites: log it as `env`.
- (3) Use the manual trigger once (`POST /jobs/:id/recommendations/trigger` or the "Find Providers" button, which may notify real providers, so check who it would reach first). Then cancel the job.

## Gotchas learned this slice
- `in_escrow` for a provider = held escrow for their jobs, but SPWallet never renders it (E2E-119).
- The admin release path and the automatic release write different payout titles (E2E-118).
- The login email-doubling glitch now happens on most logins ("mmaestro…", once "mamaeestro…"). Haiku recovered each time by clearing with keyevents and retyping. `eraseText` leaves residue in the login field too.
- Maestro inputText can stall (gRPC DEADLINE_EXCEEDED) under emulator load. A log ending on "Input text …" with neither COMPLETED nor FAILED is a failed run, and `mt.sh` still exits 0.
- A YAML parse error in a scratch flow also exits 0 from `mt.sh`; grep the log for "Parsing Failed".

## Continuation prompt
```
Continue the TaskBuddy mobile e2e sweep as the orchestrator. Read docs/handoff/019-handoff.md, then
follow docs/e2e-sweep/PLAN.md from Slice 5.4 — Recommendation engine path. You own the startup
checklist, admin/money actions, triage, fix specs and commits; dispatch Haiku 5.5 subagents per §3/§3a
with the brief in docs/e2e-sweep/HAIKU-BRIEF.md, and gate every packet per §3b. Chain slices; stop only
on the PLAN header's stop conditions.
```
