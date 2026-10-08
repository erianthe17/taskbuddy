# E2E findings

Ids are `E2E-###`, numbered across the whole sweep. Solved items move from `## Open` to
`## Found & solved` and keep their id.

## Summary

| Severity | Open | Workaround | Solved | Fixed-on-main-not-deployed | Escalated |
|---|---|---|---|---|---|
| S1 | 0 | 0 | 0 | 0 | 0 |
| S2 | 0 | 0 | 0 | 0 | 0 |
| S3 | 1 | 0 | 0 | 0 | 1 |
| S4 | 3 | 2 | 1 | 0 | 0 |

<details>
<summary>Entry template</summary>

```markdown
### E2E-### — <one-line title>
- **Found:** <date>, slice <x.y>, case <TC id>   **Role:** client|provider|both
- **Category:** app-bug | backend-bug | deploy-drift | env | ux | harness
- **Severity:** S1 critical (crash / money wrong / core flow dead) | S2 high | S3 medium | S4 low/cosmetic
- **Status:** Open | Workaround (how) | Solved (commit sha) | Fixed-on-main-not-deployed | Escalated
- **Steps:** 1… 2… 3…
- **Expected:** …   **Actual:** …
- **Evidence:** `evidence/E2E-###-x.png`, logcat excerpt if crash (`adb logcat -d -t 300 *:E`)
- **Suspected cause:** file:line if known (read-only investigation), otherwise "not investigated"
- **Solution (if solved):** what changed, the test that covers it, the build that verified it
```

</details>

## Open

### E2E-001 — ML service health is down (HTTP 429)
- **Found:** 2026-10-08, slice 0.2, case 0.2-03   **Role:** both
- **Category:** env
- **Severity:** S3 medium
- **Status:** Open
- **Steps:** 1. `GET /health` on the deployed API.
- **Expected:** `ml_service.status` = up.   **Actual:** `{"ml_service":{"status":"down","detail":"HTTP 429"}}`, database up.
- **Evidence:** health JSON, 2026-10-08 09:22Z
- **Suspected cause:** known from HANDOFF.md (ML service 429). Not investigated.
- **Impact:** Slice 5.4 (recommendation path) will not produce invites.

### E2E-002 — Stale confirmed job with ₱500 escrow left on test accounts
- **Found:** 2026-10-08, slice 0.2, case 0.2-11   **Role:** both
- **Category:** env
- **Severity:** S4 low/cosmetic
- **Status:** Workaround (job cancelled via admin after user approval; ₱500 escrow stays `disputed` = frozen for admin review, as designed for cancelling a confirmed job. Not released; leave it, or resolve through a dispute later)
- **Steps:** 1. `GET /admin/bookings?search=Maestro` shows job `5f13ac3f-c909-4a39-b7f2-b750d218d553` ("E2E chat attachment verification job", status `confirmed`, ₱500, client + provider are the maestro accounts). 2. `POST /admin/bookings/:id/cancel` was first blocked by the permission classifier; retried with the user's approval on 2026-10-08 and the job is now `cancelled`.
- **Expected:** no leftovers.   **Actual:** client wallet shows in_escrow 500 (available 49,500); provider wallet shows in_escrow 500.
- **Suspected cause:** leftover from the Sept 16 sweep.

### E2E-003 — Provider readiness gaps for later slices
- **Found:** 2026-10-08, slice 0.2, case 0.2-08   **Role:** provider
- **Category:** env
- **Severity:** S4 low/cosmetic
- **Status:** Workaround (set up in the slices that need it)
- **Actual:** `maestro.provider@` is verified, category Plumbing, address in Lipa (13.9978, 121.1676), `is_available=false`, `service_radius_km=8`; the client has no address or coordinates, so a client job near Quezon City is ~75 km from this provider and the feed's distance filter may hide it. `maestro.provider2@` is unverified with no address. `maestro.client@` and `client2@` have no address.
- **Plan:** 2.x sets addresses; 4.1 verifies provider2; 4.2 sets location with `adb emu geo fix` or an address near the jobs.

### E2E-005 — `jobs_create_plumbing.yaml` uses an address the geocoder now rejects
- **Found:** 2026-10-08, slice 0.3, case 0.3-B07   **Role:** client
- **Category:** harness
- **Severity:** S4 low/cosmetic
- **Status:** Open (fix in Slice 3.1, which explores address suggestions and the date picker)
- **Steps:** 1. Run `jobs_create_plumbing.yaml`. 2. At Location it taps the saved default address, types `123 Test Street, Lipa City`, taps Next.
- **Expected:** the wizard moves to "What Needs Doing".   **Actual:** Next stays on Location. The address field turns red: "That address is too general to locate. Add a house number and street." The app is behaving as designed: the address is geocoded on Next and a job can't be posted until it resolves precisely.
- **Evidence:** not committed (passing-app behaviour; the screenshot is in `~/.taskbuddy-e2e/logs/tmp-b2.png`)
- **Suspected cause:** the flow predates geocoded addresses. It needs a real address or a tap on an address suggestion.

### E2E-006 — `profile_edit_client.yaml` is stale and leaves burner accounts behind
- **Found:** 2026-10-08, slice 0.3, case 0.3-B10   **Role:** client
- **Category:** harness
- **Severity:** S4 low/cosmetic
- **Status:** Open (rewrite in Slice 2.1). Two burners from this are still alive, see below.
- **Steps:** 1. Run the flow on the release build. 2. It fails at `assertVisible: "Full name"` on Edit Profile.
- **Expected:** the flow registers a burner, edits the profile, deletes the burner.   **Actual:** the label is now "Full name *" (required asterisk), so the exact text match failed. With that selector fixed (`Full name.*`) the flow now fails later, when the page has scrolled and the "Full name" anchor is off screen. The burner is never deleted when the flow dies, and the next run then fails at Sign Up with "Email already in use".
- **Suspected cause:** the redesigned Edit Profile has longer content, and address geocoding changed what saves. The flow also hardcodes one burner email. It now uses a per-run unique email (PLAN §4b), but it still can't finish.
- **Leftovers (need cleanup):** `maestro.editprofile@taskbuddy.test` (from the baseline run) and `maestro.burner.ep1791457159659@taskbuddy.test` (from my retry). My attempt to delete the first through `DELETE /profiles/me` was denied by the permission classifier, so I didn't retry it another way.

### E2E-007 — `hire_payment_choice.yaml` has no fixture to run against
- **Found:** 2026-10-08, slice 0.3, case 0.3-B06   **Role:** client
- **Category:** harness
- **Severity:** S4 low/cosmetic
- **Status:** Open (re-run in Slice 5.1 with fixtures made through the API)
- **Steps:** 1. Run the flow. 2. It opens My Jobs → first card → taps `job-detail-view-offers`.
- **Expected:** the first job is open and has a proposal.   **Actual:** the first card is not an open job (the only old job was cancelled in 0.2), and the View Offers button is shown only for `open`/`recommending` jobs (`HOJobDetailScreen.tsx:365`), so the selector isn't on screen.
- **Suspected cause:** the flow depends on a leftover job. PLAN §4b says never to rely on one.

### E2E-008 — "Continue with Google" signs in on its own using the emulator's Google account
- **Found:** 2026-10-08, slice 0.3, case 0.3-R08   **Role:** both
- **Category:** env
- **Severity:** S3 medium
- **Status:** Escalated (needs a decision from you, see below)
- **Steps:** 1. Clear app data and launch. 2. Tap "Continue with Google". 3. Wait about 10s.
- **Expected:** a Chrome custom tab with an account chooser (the plan stops there).   **Actual:** the app ended up on the onboarding slides, so the OAuth round trip finished with no interaction. The emulator has a real personal Google account added, and it was used. Backing out of the onboarding leaves the app. I cleared the app data (`pm clear`) straight away, so the session is gone from the device, and I did nothing else under that identity.
- **Unknown:** whether that Google identity already had a TaskBuddy profile or the sign-in created a new one on the shared backend. I haven't looked it up, because the plan keeps me to `@taskbuddy.test` accounts.
- **Evidence:** `evidence/E2E-008-google-signin-autocompletes.png`
- **Suggested handling:** remove that Google account from the emulator, or use an AVD without one, before Slice 1.3. Decide whether to check the backend for a profile created today and delete it if so.


## Found & solved

### E2E-004 — `auth_logout_provider.yaml` couldn't find "Log Out" after the profile redesign
- **Found:** 2026-10-08, slice 0.3, case 0.3-B03   **Role:** provider
- **Category:** harness
- **Severity:** S4 low/cosmetic
- **Status:** Solved (the slice 0.3 commit)
- **Steps:** 1. Run the flow. 2. After tapping the avatar it taps "Log Out".
- **Expected:** the row is reachable.   **Actual:** the redesigned provider profile (Account Info card plus a menu list) pushes Log Out below the fold, so `Tap on "Log Out"` failed with "Element not found".
- **Evidence:** screenshot `~/.taskbuddy-e2e/logs/tmp-a1.png` (not committed)
- **Solution:** added `scrollUntilVisible: "Log Out"` before the tap. Re-run on build `fbe63d63`: passes.
