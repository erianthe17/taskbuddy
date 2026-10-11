# Handoff 025 — Slice 7.1 Chat complete
Date: 2026-10-12   Branch: test/e2e-full-sweep   Last commit: the `test(e2e): complete slice 7.1 chat` commit that adds this file

## Completed this slice
- Cases: 34 total (30 matrix + 4 exploratory): 24 pass / 10 fail / 0 blocked / 0 N-A (docs/e2e-sweep/test-cases/7.1.md).
  - Rows 01, 02, 03, 05 and 06 had already run on the old C1 before the pause (handoff 024 said all were blank; they weren't). Their results were kept. Every other row ran on the new fixture C1b.
  - ORCH ran the API-only rows 08, 13 (API half), 21, 22, 23 and 24, plus the unicode, long and script posts for rows 09 and 11 (Python urllib, so the stored bytes are exact).
- **Chat works end to end for UAT:**
  - messages both ways, with live arrival in about 3.5 s;
  - unicode (Ñ, ₱, emoji), Taglish, a 300-character unbroken run and a script literal all render correctly;
  - photo attach works on both sides, with "Sent a photo" notices;
  - each message makes exactly one notice for the other party, and tapping it opens the chat;
  - non-participants get 403 on every route;
  - forged `sender_id` and foreign upload paths are refused;
  - a double tap sends one message.
- New findings (all Open):
  - E2E-132 (S4 app-bug): text typed while a send is in flight is wiped when the reply lands.
  - E2E-133 (S4 ux, sign-off): an unsent draft is lost on leaving the chat.
  - E2E-134 (S4 ux): back, attach and Send have no accessibility label.
  - E2E-135 (S4 backend-bug): a non-participant's empty post gets 400, not 403 (check order).
  - E2E-136 (S4 ux): reading a chat leaves its "New message" notices unread, so the badge inflates.
  - E2E-137 (S4 app-bug): the "Cannot reach the server" line stays after a later photo succeeds.
  - **E2E-138 (S3 app-bug): an offline text send fails silently (no error).**
  - E2E-139 (S4 app-bug): the composer silently caps at 500, while the API takes 1000.
  - E2E-140 (S4 ux): the chat header draws every status in green, including Cancelled.
  - E2E-141 (S4 ux, product decision): chat stays writable on cancelled and completed jobs, with no note.
  - E2E-142 (S4 ux): photos can't be opened full size, and text can't be copied.
- Solved this slice: none.
- New flow: `mobile/maestro/flows/p7_chat_completed_job_client.yaml` (read-only; J1's chat). Green on run 1, 2026-10-12: `mt.sh: OK` (`~/.taskbuddy-e2e/logs/7.1/flow-run1.log`). Crash sweep: 0 lines (`~/.taskbuddy-e2e/logs/7.1-logcat.txt`).

## Haiku packets this slice
- 4 device packets (P1 6 rows, P2 6, P3 5, P4 4), 1 flow packet, 1 matrix packet (7.3, pipelined during P1). No §3b gate failures.

## Environment state right now
- Installed build: `fbe63d63…` (versionCode 1), sha256 `75b611c2…426c4`. devstate OK; `auto_time_zone` 0 (restore in 9.1).
- Backend: health db up, ml down (E2E-001).
- **Ledger:**
  - c1 48,423 / 48,423 / in_escrow 800;
  - c2 150 / 150 / 0;
  - p1 0 / 0 / 800;
  - p2 560.45 / 560.45 / 0.
  - No pending withdrawals.
- **Jobs:**
  - J1 `1e4de8e9…` completed, ₱500 held until **2026-10-14T12:03:57Z**.
  - **C1b `67a3666e-0b16-4898-bd3d-d3fd6724f8b7` confirmed (c1 hired p1, ₱300 held), left open on purpose.** 7.3 should start it, tick its task and complete it as a review fixture. If it isn't needed, decline it as p1 (instant refund).
  - Every other test job is cancelled or completed.
  - J1 and M1 `a8864a42…` are completed and unreviewed (`has_review` false).
- Notification baselines moved in 7.1:
  - p1 has 13 "New message" notices, 12 unread;
  - c1 has 2;
  - K4 and J1 each now have a 1-message conversation.

## Open blockers / escalations awaiting the user
- **First thing at resume, if the date is past 2026-10-14T12:03:57Z:** run the deferred check (row 5.3-15). J1 should have auto-released: p1 +425.00, commission 75.00, c1 in_escrow −500.
- E2E-131: enable Stripe Connect in the sandbox account (a user dashboard step).
- Fix approvals (money-screen UI): E2E-105, 119, 120, 128, 129, 130.
- Allowed-scope fixes batched for a rebuild: E2E-111, 112 (app half), 115, 122, 123, 124. Chat candidates from this slice are also in scope (unambiguous mobile JS): E2E-132, 137, 138, 139, 140.
- Product sign-offs: E2E-133, E2E-141.
- Carried:
  - E2E-070 (High);
  - real-provider notifications once ML is up;
  - E2E-078; E2E-084;
  - sign-offs for E2E-046/047, 056/057, 066, 087, 099, 109.

## Next slice
- **7.2 Notifications.** The matrix (`test-cases/7.2.md`, 37 rows) was reviewed and looks sound. At the start:
  1. Fill its ORCH slots from fresh `GET /notifications` snapshots:
     - U1/L1 for c1, U2/L2 for p2, and the ID_ slots;
     - account for the chat notices 7.1 added on p1 and c1.
  2. Group the rows per its suggested order. Row 12 (Clear all) runs only on c2 and last.
  3. Pipeline the **7.4 Disputes** matrix during 7.2's first short packet.
- **7.3 Reviews:** the matrix is drafted (`test-cases/7.3.md`, 31 rows, not yet reviewed).
  - It asks for up to 10 completed, unreviewed jobs. Trim it to the rows that truly need their own job: happy path on J1 or C1b, double tap, comment at the max, unicode.
  - Use C1b plus J1 and M1 before making new fixtures. Each new completed job holds ₱300 for 72 h.

## Gotchas learned this slice
- `hier.sh` omits icon-only controls (back arrow, paperclip, Send, bell); use a raw `uiautomator dump`. Added to HAIKU-BRIEF.
- devstate reports net_ping down for about 10 s right after re-enabling wifi and data; retry once. Added to HAIKU-BRIEF.
- The Opus tokens in `~/.taskbuddy-e2e/opus/` expire after about 1 h. `chat71.py` and `snap.py` don't re-login, so re-run `login`/`adminlogin` from `opus-api.sh` when a call returns an error dict.
- New Opus helpers: `opus/chat71.py` (C1b chat posts, message list, notice counts) and `opus/setcell.py` (set one test-case cell safely). `fx.py` has a new spec `C1b-chat`.

## Continuation prompt
```
Continue the TaskBuddy mobile e2e sweep as the orchestrator. Read docs/handoff/025-handoff.md, then
follow docs/e2e-sweep/PLAN.md from Slice 7.2 — Notifications. You own the startup checklist,
admin/money actions, triage, fix specs and commits; dispatch Haiku 5.5 subagents per §3/§3a with the
brief in docs/e2e-sweep/HAIKU-BRIEF.md, and gate every packet per §3b. Chain slices; stop only on the
PLAN header's stop conditions.
```
