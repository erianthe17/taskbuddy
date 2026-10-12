# Handoff 027 — Slice 7.3 Reviews complete
Date: 2026-10-12   Branch: test/e2e-full-sweep   Last commit: the `test(e2e): complete slice 7.3 reviews` commit that adds this file

## Completed this slice
- Cases: 33 total (31 matrix + 2 exploratory): 23 pass / 9 fail / 0 blocked / 1 N-A (docs/e2e-sweep/test-cases/7.3.md).
  - Row 12 is N-A because R9 was not created.
  - Row 08 is answered by row 19 (M1: no comment, stored null).
  - Row 11's 500 case ran inside row 20 (R10, stored byte-exact); its 499 case is N-A.
- ORCH ran API rows 04, 11 (501), 16, 18 and 23–27, and the fixture work below.
- **Reviews work for UAT:**
  - the entry shows only on completed jobs, and the API refuses every other state;
  - stars are labelled, and Submit is disabled at 0 stars;
  - a submit returns to the job with "Review submitted";
  - one review per job (a duplicate gets 400 "This job already has a review"; the double tap and the stale screen each kept one);
  - the provider gets one "You received a review" notice;
  - `cached_avg_rating`/`count` update correctly (p1 4.0 over 5, p2 3.0 over 1);
  - unicode, Taglish and script text render as plain text on the client-side provider profile;
  - offline submit shows the connection copy and keeps the input.
- New findings (all S4, Open):
  - E2E-154 (backend-bug): validation runs before ownership, so non-owners get 400 not 403 (API-wide; E2E-135 family).
  - E2E-155 (app-bug): the review comment has no 500 cap; raw validator text shows and stays.
  - E2E-156 (ux): no route from a completed job to the provider profile; the given review isn't shown on the job.
  - E2E-157 (app-bug): a whitespace-only comment is stored as spaces.
  - E2E-158 (app-bug): a verified provider's own Rating stays stale until re-login.
  - E2E-159 (ux, sign-off): providers can't see their received reviews; no review count anywhere.
- Same-class additions, without new ids:
  - the Leave Review back arrow is unlabelled → appended to E2E-033;
  - the Leave Review draft is lost on leaving → appended to E2E-133.
- Solved this slice: none.
- New flow: `mobile/maestro/flows/p7_review_submitted_client.yaml` (read-only, J1). Green on run 1, 2026-10-12: `mt.sh: OK` (`~/.taskbuddy-e2e/logs/7.3/flow-run1.log`). Crash sweep: 0 lines (`~/.taskbuddy-e2e/logs/7.3-logcat.txt`).

## Haiku packets this slice
- 4 device packets (P1–P4: 6+6+6+3 rows), 1 flow packet, 1 matrix packet (8.1, pipelined during P1). No §3b gate failures.

## Environment state right now
- Installed build: `fbe63d63…` (versionCode 1), sha256 `75b611c2…426c4`. devstate OK; `auto_time_zone` 0 (restore in 9.1).
- Backend: health db up, ml down (E2E-001).
- **Ledger:**
  - c1 47,523 / 47,523 / in_escrow 1,700;
  - c2 150 / 150 / 0;
  - p1 0 / 0 / 1,700;
  - p2 560.45 / 560.45 / 0.
  - No pending withdrawals.
- **Jobs (all c1's, all completed and reviewed, escrow held in warranty):**
  - J1 `1e4de8e9…` (₱500, auto-release **2026-10-14T12:03:57Z**);
  - C1b `67a3666e…`, R4 `3ed811c9…`, R5 `4efd0df7…`, R10 `96fb61a7…` (₱300 each, auto-release about 2026-10-14T23:59Z to 2026-10-15T00:00Z, p1 +255.00 each);
  - M1 `a8864a42…` (released, reviewed).
  - O2 and X1 are cancelled; nothing open or confirmed is left.

## Open blockers / escalations awaiting the user
- **First thing at resume, if past 2026-10-14T12:03:57Z:** the deferred check 5.3-15. J1 auto-release gives p1 +425.00, commission 75.00, c1 in_escrow −500. After about 2026-10-15T00:00Z, C1b, R4, R5 and R10 should also auto-release (p1 +255.00 each). **Don't admin-release any of them in 7.4.**
- E2E-131: enable Stripe Connect in the sandbox account.
- Fix approvals (money-screen UI): E2E-105, 119, 120, 128, 129, 130.
- Allowed-scope fixes batched for a rebuild: E2E-111, 112 (app half), 115, 122, 123, 124, plus E2E-132, 137, 138, 139, 140, 155, 157 (app half).
- Product sign-offs: E2E-133, E2E-141, E2E-159.
- Carried:
  - E2E-070 (High);
  - real-provider notifications once ML is up;
  - E2E-078; E2E-084;
  - sign-offs for E2E-046/047, 056/057, 066, 087, 099, 109.

## Next slice
- **7.4 Disputes / complaints.** The matrix is drafted (`test-cases/7.4.md`, 31 rows); review it first. Known corrections:
  1. **Retarget row 26 (admin `released_to_provider`)** away from J1. Use a new completed fixture, F3: c1 posts ₱300, p1 hires and completes, c1 files a complaint inside the window, then admin releases. That gives p1 +255.00 once and keeps J1, C1b, R4, R5 and R10 for the auto-release check.
  2. Its F1 (confirmed, refund) and F2 (in progress, complaint, refund) fixtures cost ₱300 each and come back on refund.
  3. Row 31 (outside the window) has no qualifying job: Blocked.
  4. Triage its candidates A–O against existing findings (E2E-109, 112, 114, 117, 118, 119, 133, 134, 154).
  5. Money packets hold at most 3 rows, with snapshots before and after each.
- **Pipeline the 8.2 matrix** (network and server states) during 7.4's first short packet.
- 8.1 Double-tap: the matrix is drafted (`test-cases/8.1.md`, 8 rows, not yet reviewed). Most buttons were already covered elsewhere; the list is in its Data note.

## Gotchas learned this slice
- Completing a fixture through the API takes: provider `POST /jobs/:id/start`, `PATCH /jobs/:id/tasks/:taskId {"is_done":true}` per task, then client `POST /jobs/:id/complete`. `opus/hire.py <job> [--from-confirmed]` does apply → accept → start → tasks → complete.
- When pressing `api.sh call` output into Python, decode it as UTF-8 for length checks on non-ASCII text (cp1252 miscounts 500 as 507).
- An element hidden under a sticky footer reports inverted uiautomator bounds until it is scrolled clear.
- Haiku can post unicode bodies safely through an ORCH-written script (`scratch/<slice>/post500.py`) that reads the api.sh token file, instead of `call`.

## Continuation prompt
```
Continue the TaskBuddy mobile e2e sweep as the orchestrator. Read docs/handoff/027-handoff.md, then
follow docs/e2e-sweep/PLAN.md from Slice 7.4 — Disputes / complaints. You own the startup checklist,
admin/money actions, triage, fix specs and commits; dispatch Haiku 5.5 subagents per §3/§3a with the
brief in docs/e2e-sweep/HAIKU-BRIEF.md, and gate every packet per §3b. Chain slices; stop only on the
PLAN header's stop conditions.
```
