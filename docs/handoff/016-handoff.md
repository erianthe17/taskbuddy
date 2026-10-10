# Handoff 016 — Slice 4.3 Apply / withdraw / decline complete
Date: 2026-10-11   Branch: test/e2e-full-sweep   Last commit: the `test(e2e): complete slice 4.3 …` commit that adds this file

## Completed this slice
- Cases: 26 total (25 drafted by Haiku, reviewed by Opus; 1 exploratory X01) — 22 pass / 4 fail / 0 blocked / 0 N-A (docs/e2e-sweep/test-cases/4.3.md)
- New findings (all Open):
  - **E2E-098 — a provider cannot withdraw a pending proposal anywhere in the app; `api.withdrawApplication` exists but nothing calls it (S3, app)**
  - E2E-099 — after withdrawing, a provider can never re-apply to that job (unique `(job_id, provider_id)`), and the app doesn't say so (S4, ux, needs product sign-off)
  - E2E-100 — an empty-string cover message (API only) shows as a blank box on the client's Proposals screen (S4, backend)
  - E2E-101 — when the client cancels a job, applicants still see "Proposal sent" and get no notification (S4, ux)
  - Updated: E2E-085. Applying outside your categories is refused by the 0037 trigger (400 "This job requires an approved skill…"), so the exposure is read-only.
- What held: apply with a cover message (Taglish stored exactly), the 300-char limit on both ends, duplicate apply (UI hides Submit; API 400), a raw double tap on Send (one application), stale cancel (the modal shows "Job is no longer accepting applications (cancelled)", no row), offline Send ("Cannot reach the server…", no row), withdraw via API and its 400/403 guards, role guards, the client's Proposals list (both providers in apply order, "No cover message.", "Withdrawn by the provider"), the "New application" notifications, the My Work tabs and pills, and the Calendar empty state.
- Solved this slice: none.
- New flows: `mobile/maestro/flows/p4_apply_proposal_provider.yaml` plus helpers `_helpers/apply_fixture_post.js`, `apply_check_one.js` and `apply_fixture_cleanup.js`. Green twice on 2026-10-11 in Opus's own runs (39 COMPLETED, 2 WARNED optional taps, 1 SKIPPED, 0 FAILED each; logs `~/.taskbuddy-e2e/logs/4.3/flow-orch-run{1,2}.log`). Haiku's first run failed on my spec: the banner is one element, so the assertion needed a regex. That run also exposed a cleanup gap, which I fixed by having cleanup find the application itself. The stray application from that run was withdrawn.

## Haiku packets this slice
- 1 matrix packet + 4 device packets + 1 flow/crash packet. No packet failed a §3b gate. Opus ran the API rows (12, 14, 20, 21, and the API halves of 22/23) and the exploratory row. Opus re-ran the flow after fixing its spec. Harness lesson: `api.sh call` mangles non-ASCII bodies on Windows, so row 22's emoji was stored as "??". The markup part of the row is still valid.

## Environment state right now
- Installed build: `fbe63d63…` (versionCode 1), sha256 `75b611c2…426c4`. Emulator: `auto_time_zone` 0 (since 4.2, restore in 9.1); DNS fine; devstate OK.
- Backend: health db up, ml down (429, E2E-001).
- Accounts & data: wallets client 50,000 available, client2/provider/provider2 0. **J1 `1e4de8e9-68db-4a2d-9042-cc6a953b2254` "E2E 4.3 J1 two applicants" (₱500, flexible, Lipa) is kept for 5.1:** status `recommending`, with two pending applications. p1's is `55f4f645-8fd5-4619-a108-022e8c67cdf3` ("Kaya ko po ito bukas ng umaga, may sariling gamit ako."); p2's is `97dfbb5c-45d7-4064-b947-40901b97c1ef` (no message). Every other `maestro.client@` job is cancelled. Both providers `is_available: false`. The foreign job "Plumbing: Check valve" is still in the feeds.

## Open blockers / escalations awaiting the user
- Carried: E2E-070 idempotency; real-provider notifications once ML is up; the E2E-078 product call; the E2E-084 backend fix; sign-offs for E2E-046/047, 056/057 and 066; E2E-087.
- New, needs product sign-off: E2E-099 (re-apply after withdraw).

## Next slice
- **5.1 Hire → escrow held** (money slice: at most 3 rows per packet; Opus snapshots `GET /wallet` for client and both providers before and after every packet, plus `GET /admin/transactions`).
- (1) Startup check, then record wallets: client 50,000 balance / 50,000 available, the others 0. (2) Haiku drafts `test-cases/5.1.md` from `HOJobApplicationsScreen.tsx` (Accept → "Hire this provider?" confirm), `backend/src/applications/applications.service.ts` `accept`/`assertHireable`/`acceptFunded`/`rollbackHold`, and `backend/src/escrow`. Include the PLAN §5 duplicate-POST re-check row (offline tap, then online tap; two holds from one tap = S1, stop and reverse via allowed admin actions).
- (3) Use J1 for the hire (client accepts p1). p2's application should auto-reject, and p2 should see "Not Selected". For the unfunded case, `maestro.client2@` needs its own job plus an applicant. Post it via `opus/fx.py` with a client2 token (fx.py reads `scratch/<slice>/tok.client`, so add a client2 variant) and have p2 apply.

## Gotchas learned this slice
- Maestro matches whole element text. Banners that combine a bold prefix with body text are one element, so use regexes.
- Gboard autocorrects `inputText` words. Type exact strings with `adb shell input text` (`%s` for spaces).
- Windows curl argv mangles non-ASCII. Post unicode with Python urllib.
- `GET /notifications` and `GET /applications/mine` return lists. Tokens expire mid-slice, so on a 401, run `login` again.
- A cancelled job disappears from the provider feed on the next load, but its proposal stays "pending".

## Continuation prompt
```
Continue the TaskBuddy mobile e2e sweep as the orchestrator. Read docs/handoff/016-handoff.md, then
follow docs/e2e-sweep/PLAN.md from Slice 5.1 — Hire → escrow held. You own the startup checklist,
admin/money actions, triage, fix specs and commits; dispatch Haiku 5.5 subagents per §3/§3a with the
brief in docs/e2e-sweep/HAIKU-BRIEF.md, and gate every packet per §3b. Chain slices; stop only on the
PLAN header's stop conditions.
```
