# Handoff 026 — Slice 7.2 Notifications complete
Date: 2026-10-12   Branch: test/e2e-full-sweep   Last commit: the `test(e2e): complete slice 7.2 notifications` commit that adds this file

## Completed this slice
- Cases: 40 total (37 matrix + 3 exploratory): 25 pass / 14 fail / 0 blocked / 1 N-A (docs/e2e-sweep/test-cases/7.2.md). Row 20 (push) is N-A by scope.
- ORCH ran:
  - API rows 30 and 31;
  - row 26 (the clock-label wait);
  - re-judgements of rows 24 (Blocked → Fail on the observed icons) and 32 (Blocked → Pass, because the delete race can't be produced: the stream drops the row in about 1 s, and a repeat DELETE returns 204).
- Fixture work by ORCH:
  - seeded c1 notices with p1 chat posts on C1b (the 51st notice for row 27, plus clock and mark-all seeds);
  - a p2 skill request rejected by admin (service-request notices; allowed action);
  - a provider burner for the empty state (row 13), deleted afterwards.
- **Notifications work for UAT:**
  - badge = API count on the client;
  - newest first;
  - tap routing to Job Detail, Chat, Proposals, Complaint Status and My Services is correct on both roles;
  - read state survives a relaunch;
  - Mark all read and Clear all work;
  - the delete dialog and Keep work;
  - a new notice shows live in about 6 s;
  - the API refuses bad ids and missing tokens.
- New findings (all S4, Open):
  - E2E-143 (backend-bug): the API answers 201/204 for another user's notification id (no effect).
  - E2E-144 (ux): raw decision words ("released_to_provider") and an unformatted credit amount in notification bodies.
  - E2E-145 (ux): Home "Recent activity" rows are inert, and the Post a job button covers the first row.
  - E2E-146 (ux): the provider bell is announced without its count.
  - E2E-147 (ux): a "not selected" rejection shows a blue check, and service-request notices get the briefcase.
  - E2E-148 (ux): trash and header controls are under 48 dp.
  - E2E-149 (ux): the list stops at 50, while the badge counts every unread notice.
  - E2E-150 (ux): wallet/payment notices go nowhere when tapped.
  - E2E-151 (ux): an offline notice tap leaves Job Details on its skeleton, with no message.
  - E2E-152 (ux): "x ago" labels freeze while the list is open.
  - E2E-153 (app-bug): after an offline Mark all read, Retry only reloads; the banner stays (and the error copy is doubled).
- Solved this slice: none.
- New flow: `mobile/maestro/flows/p7_notifications_open_back_client.yaml` (read-only). Green on run 1, 2026-10-12: `mt.sh: OK` (`~/.taskbuddy-e2e/logs/7.2/flow-run1.log`). Crash sweep: 0 lines (`~/.taskbuddy-e2e/logs/7.2-logcat.txt`).

## Haiku packets this slice
- 6 device packets (P1–P6: 6+6+6+6+4+5 rows), 1 flow packet, 1 matrix packet (7.4, pipelined during P1). No §3b gate failures.
- Two process slips, both harmless:
  - P4 tapped one wrong notice (p1 85a16895 marked read).
  - P3 typed a finding id into a cell and then cleared it.

## Environment state right now
- Installed build: `fbe63d63…` (versionCode 1), sha256 `75b611c2…426c4`. devstate OK; `auto_time_zone` 0 (restore in 9.1).
- Backend: health db up, ml down (E2E-001). Its `uptime_s` reset twice during the slice (Render restart or redeploy), with no visible behaviour change.
- **Ledger (unchanged):**
  - c1 48,423 / 48,423 / in_escrow 800;
  - c2 150 / 150 / 0;
  - p1 0 / 0 / 800;
  - p2 560.45 / 560.45 / 0.
- **Jobs:**
  - J1 `1e4de8e9…` completed, ₱500 held until **2026-10-14T12:03:57Z**, unreviewed.
  - M1 `a8864a42…` completed (p2), unreviewed.
  - **C1b `67a3666e-0b16-4898-bd3d-d3fd6724f8b7` confirmed (c1/p1, ₱300 held), kept for 7.3.**
- Notifications:
  - c1: 1 unread; it holds more than 50.
  - p1: 26 unread.
  - p2: 0 unread.
  - **c2: none left** (Clear all).
- No burners alive.

## Open blockers / escalations awaiting the user
- **First thing at resume, if the date is past 2026-10-14T12:03:57Z:** run the deferred check (row 5.3-15). J1 auto-releases: p1 +425.00, commission 75.00, c1 in_escrow −500. **Don't resolve or otherwise release J1 in 7.4; keep it for this check.**
- E2E-131: enable Stripe Connect in the sandbox account.
- Fix approvals (money-screen UI): E2E-105, 119, 120, 128, 129, 130.
- Allowed-scope fixes batched for a rebuild: E2E-111, 112 (app half), 115, 122, 123, 124, plus chat candidates E2E-132, 137, 138, 139, 140.
- Product sign-offs: E2E-133, E2E-141.
- Carried:
  - E2E-070 (High);
  - real-provider notifications once ML is up;
  - E2E-078; E2E-084;
  - sign-offs for E2E-046/047, 056/057, 066, 087, 099, 109.

## Next slice
- **7.3 Reviews.** The matrix is drafted (`test-cases/7.3.md`, 31 rows); review it first. The fixture plan decided in this session:
  1. R1 = J1 (p1): happy path and every UI row.
  2. R2 = M1 (p2): the double tap (row 19), submitted with no comment so it also covers row 08's UI.
  3. C1b: p1 starts it, ticks its task, and c1 completes it. Then use it for row 30, with an ORCH API review whose comment is exactly 500 code points (row 11's 500 case) while p1's profile is open.
  4. Three new ₱300 completed fixtures (c1 posts, p1 applies, c1 accepts, p1 starts and ticks, c1 completes) for rows 09 (whitespace), 13/14 (offline, then Taglish) and 20 (stale screen; its ORCH post with no comment also covers row 08's stored-null check).
  5. Rows 11 (the 499 case) and 12 become N-A.
  - New fixtures add c1 "New application" / "Work started" notices; that's fine now that 7.2 is done.
- **Pipeline the 8.1 matrix** (double-tap sweep) during 7.3's first short packet.
- 7.4 Disputes: the matrix is drafted (`test-cases/7.4.md`, 31 rows, not yet reviewed).
  - Its row 26 releases J1 via admin. Retarget it to C1b or a new completed fixture so J1 stays for the auto-release check.
  - Its candidate list (A–O) needs triage against existing findings.

## Gotchas learned this slice
- c1's notification list is capped at 50, so new notices push older target notices out of view. Pick slot ids from the newest 50 right before each packet, and re-slot when seeds are added.
- Notification ids are best taken from `GET /notifications/snapshot` (it has `unreadCount` + `notifications`). `GET /notifications/unread-count` is uncapped.
- Opus tokens expire after about 1 h. `chat71.py` returns error dicts or 401 silently; re-run `login`/`adminlogin` from `opus-api.sh`.
- The admin skill-request reject body is `{"note": "..."}` (not `review_note`).
- Foreground `sleep` is blocked for the orchestrator. Use a background Bash (`sleep 300; …`) for real-time waits such as row 26.

## Continuation prompt
```
Continue the TaskBuddy mobile e2e sweep as the orchestrator. Read docs/handoff/026-handoff.md, then
follow docs/e2e-sweep/PLAN.md from Slice 7.3 — Reviews. You own the startup checklist,
admin/money actions, triage, fix specs and commits; dispatch Haiku 5.5 subagents per §3/§3a with the
brief in docs/e2e-sweep/HAIKU-BRIEF.md, and gate every packet per §3b. Chain slices; stop only on the
PLAN header's stop conditions.
```
