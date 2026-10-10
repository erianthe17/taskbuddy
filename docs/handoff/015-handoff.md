# Handoff 015 — Slice 4.2 Feed & job detail complete
Date: 2026-10-11   Branch: test/e2e-full-sweep   Last commit: the `test(e2e): complete slice 4.2 …` commit that adds this file

## Completed this slice
- Cases: 51 total (48 drafted by Haiku and reviewed by Opus, plus 3 exploratory X01-X03): 36 pass / 14 fail / 0 blocked / 1 N-A (docs/e2e-sweep/test-cases/4.2.md)
- New findings (all Open):
  - E2E-085: a provider can open any open job by id, even outside their approved categories (S4, backend).
  - E2E-086: feed paging accepts zero/negative `limit`/`offset` (S4, backend).
  - E2E-087: the Open/Urgent strip follows the urgency chip; the Normal chip shows "0 Urgent" while an urgent job is open (S4, ux, needs product sign-off).
  - E2E-088: switching chips flashes "No matching jobs / 0 jobs" before the list loads (S4).
  - E2E-089: with the keyboard up, the first tap on a chip only closes the keyboard (S4; one-prop fix).
  - E2E-090: the search text is lost after opening a job and coming back, while the chip is kept (S4).
  - E2E-091: the provider feed has no pull-to-refresh and no refresh on foreground, so new jobs stay hidden and cancelled jobs stay listed (S4; provider twin of E2E-075).
  - E2E-092: Job Details drops the distance shown on the card (S4).
  - E2E-093: the feed jumps back to the top after viewing a job (S4).
  - **E2E-094: after a remount the availability switch shows "Not available" while the server says available (S3, app).**
  - E2E-095: feed a11y: chips 40 dp, search field unlabelled (S4).
  - E2E-096: a provider with no address is told "within 15 km of your location" but sees jobs from anywhere (S4).
  - E2E-097: offline, a job opens as "This job isn't available — may have been filled" (S4).
  - Re-confirmed, not re-logged: E2E-030 (an offline cold start lands on Login; it made row 32 N-A), E2E-033 (unlabelled back arrow on Job Details), E2E-066 (the edge filter blocks `' OR 1=1 --` in a URL path).
- Solved this slice: none.
- New flows: `mobile/maestro/flows/p4_feed_listing_and_detail_provider.yaml`, plus helpers `_helpers/feed_fixture_post.js` and `_helpers/feed_fixture_cancel.js`. Green twice on 2026-10-11 (Maestro runs `2026-10-11_004350` and `_004559`: 42 COMPLETED, 2 WARNED (optional taps), 1 SKIPPED, 0 FAILED; it cancels its own 3 jobs).
- What held: the approved-categories gate (Cleaning job hidden in both feeds and in the API), the radius filter (7.8 km shown, 11.4 km hidden at radius 8), urgent → distance → newest ordering, distance labels, ₱ formatting incl. ₱99,999,999.00, the unicode/Taglish title, search, chip retention, the photo viewer and back handling, the stale-job error card, a raw double tap pushing one screen, and font scale 1.3.

## Haiku packets this slice
- 1 matrix packet + 9 device packets + 1 flow/crash packet. P1 stopped twice at precheck on emulator problems: the timezone went to GMT, then DNS died. Correct stops; I fixed the emulator and re-dispatched. P2 stopped on a foreign job in the feed (also a correct stop); the rows were re-dispatched with adjusted expectations. No packet failed a §3b gate.
- Opus ran the API rows (36-40, 46, 47) and the exploratory pass. Row 28's first attempt was blocked by an orchestrator fixture error: the title was 120 code points but 121 UTF-16 units. I fixed the fixture and re-ran the row.

## Environment state right now
- Installed build: `fbe63d63…` (versionCode 1), sha256 `75b611c2…426c4`. **Emulator changed:** cold-booted with `-dns-server 8.8.8.8,1.1.1.1`; **`auto_time_zone` set to 0** (baseline 1, restore in 9.1); timezone Asia/Manila. `devstate.sh` now checks DNS too.
- Backend: health db up, ml down (429, E2E-001) the whole slice, so no fixture notified anyone.
- Accounts & data: client 50,000 balance / available (the old 500 escrow came back by itself as "Refund — cancellation response expired", 2026-10-10 09:50 UTC; noted in env-state). client2, provider and provider2 are at 0. Every `maestro.client@` job is cancelled (59). `maestro.provider@` `is_available: false`. Still alive: burner `maestro.burner.ep1791457159659@` (9.2). Another client's real job, b89c310a "Plumbing: Check valve" (₱50, Lipa), sits in both providers' feeds; leave it alone.

## Open blockers / escalations awaiting the user
- Carried: the E2E-070 idempotency decision; real-provider notifications once ML is up; the E2E-078 product call; the E2E-084 backend fix; sign-offs for E2E-046/047, 056/057 and 066.
- New, needs product sign-off: E2E-087 (what the feed's Open/Urgent strip should count).

## Next slice
- **4.3 Apply / withdraw / decline.** (1) Startup check: `devstate.sh`, now including DNS. If DNS fails, cold-boot with `-dns-server 8.8.8.8,1.1.1.1`. (2) Haiku drafts `test-cases/4.3.md` from `SPJobDetailScreen.tsx` (ProposalModal, `submitProposal` at :139-160), `mobile/src/components/ProposalModal.tsx`, `SPMyJobsScreen.tsx`, `backend/src/applications/*` and the client applications screen. (3) Fixtures: add a 4.3 spec to `opus/fx.py`, using the `lipa()` helper for jobs near p1.
- Must check: **can a provider apply to a job outside their categories?** E2E-085 shows they can open it by id, and `backend/src/applications` has no category check. Probe it by API with p1 on a Cleaning fixture. If the apply succeeds, withdraw it and log it.
- Keep in mind: provider2 has no coordinates, so it sees every Plumbing job (E2E-096). For the 5.1 two-applicant job, post one Plumbing job near Lipa; both providers will see it. The fixture title limit is 120 UTF-16 units.

## Gotchas learned this slice
- The emulator can lose DNS (when started without `-dns-server`) and its timezone (with `auto_time_zone` 1) in the middle of a session. `devstate.sh` catches both now.
- The provider feed uses the profile's coordinates, not GPS. Test the radius by where fixtures are placed.
- Single-line search field: clear it with `KEYCODE_MOVE_END` + DEL, because the keyevent-20 recipe moves focus off the field. `tapOn` text is case-insensitive and hits pills.
- The shared backend has other users: judge rows on your own fixtures, and stop only if a fixture is missing.
- The status-bar clock is 12-hour, not a timezone fault.
- `GET /jobs/mine` returns a list, not `{jobs: [...]}`.

## Continuation prompt
```
Continue the TaskBuddy mobile e2e sweep as the orchestrator. Read docs/handoff/015-handoff.md, then
follow docs/e2e-sweep/PLAN.md from Slice 4.3 — Apply / withdraw / decline. You own the startup checklist,
admin/money actions, triage, fix specs and commits; dispatch Haiku 5.5 subagents per §3/§3a with the
brief in docs/e2e-sweep/HAIKU-BRIEF.md, and gate every packet per §3b. Chain slices; stop only on the
PLAN header's stop conditions.
```
