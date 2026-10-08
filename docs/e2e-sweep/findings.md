# E2E findings

Ids are `E2E-###`, numbered across the whole sweep. Solved items move from `## Open` to
`### E2E-025 — Edit Profile: a 121-character name reaches the server and comes back as raw validation text
- **Found:** 2026-10-09, slice 2.1, case 2.1-13   **Role:** client
- **Category:** ux
- **Severity:** S4
- **Status:** Open
- **Steps:** 1. Log in as `maestro.editprofile@`. 2. Profile > Edit Profile. 3. Replace the name with 121 `b` characters. 4. Save Changes > Save Changes in the modal.
- **Expected:** The input is capped at 120 (the DTO's `@Length(1,120)`) or friendly copy shows.
- **Actual:** The request goes out and the red line above Save reads `full_name must be shorter than or equal to 120 characters`. The stored name stayed at the previous 120 characters. 120 characters saves fine (2.1-12) and wraps cleanly in the Profile hero.
- **Evidence:** `evidence/E2E-025-name-121.png`
- **Suspected cause:** `HOEditProfileScreen.tsx` has no `maxLength` on the name input (only the empty check). The raw message is the same class as E2E-009/015/020.
- **Solution (if solved):** n/a

### E2E-026 — Phone accepts any text: letters, symbols and 40 digits save and display as-is
- **Found:** 2026-10-09, slice 2.1, cases 2.1-28/29/30   **Role:** client
- **Category:** ux
- **Severity:** S4
- **Status:** Open (needs product sign-off)
- **Steps:** 1. Edit Profile on `maestro.editprofile@`. 2. Set Phone to `abc`, `+-*#`, then 40 `1`s (typed through Maestro, which bypasses the number pad). 3. Save and confirm each.
- **Expected:** Some format check, or a documented decision that phone is free text. The placeholder `+63 9XX XXX XXXX` implies a PH number.
- **Actual:** All saved verbatim and Profile > Account Info shows them. Valid PH formats (`+63 917 123 4567`, `09171234567`, `9171234567`, `(02) 8123 4567`) also save as typed, with no normalising. Clearing the field saves `""` and Profile shows `—`.
- **Evidence:** `evidence/E2E-026-phone-junk.png` (top: `abc`, bottom: 40 digits)
- **Suspected cause:** `HOEditProfileScreen.tsx` has no phone validation and `profiles.dto.ts` declares `phone` as `@IsString()` only. Not a defect unless the spec wants one. Matters for SMS Alerts later.
- **Solution (if solved):** n/a

### E2E-027 — Edit Profile: address suggestions render below the fold, hidden behind the keyboard while typing
- **Found:** 2026-10-09, slice 2.1, case 2.1-19   **Role:** client
- **Category:** ux
- **Severity:** S4
- **Status:** Open
- **Steps:** 1. Profile > Edit Profile. 2. Tap Address and type `Ayala Ave`. 3. Wait 2-4 s.
- **Expected:** The matching suggestions are visible above the keyboard, or the field scrolls up to show them.
- **Actual:** The Address field sits at the bottom edge with the keyboard directly beneath it, so the list that loaded (Ayala Avenue, Makati; Ayala Avenue Extension; Ayala Avenue, San Pascual) is invisible. After hiding the keyboard (hardware back) the dropdown is there and selecting a row fills Address and City. A user who doesn't dismiss the keyboard sees no suggestions and may think the lookup is broken.
- **Evidence:** `evidence/E2E-027-address-suggestions-under-keyboard.png`
- **Suspected cause:** `HOEditProfileScreen.tsx` uses `KeyboardAvoidingView behavior="height"` (same pattern as E2E-012/016/024) and the dropdown renders inline under the field. Not investigated further.
- **Solution (if solved):** n/a

### E2E-028 — Avatar: picking a non-image file (text renamed `.jpg`) leaves a blank white screen with no error
- **Found:** 2026-10-09, slice 2.1, case 2.1-39   **Role:** client
- **Category:** app-bug
- **Severity:** S4
- **Status:** Open
- **Steps:** 1. Push `fake.jpg` (22 bytes of text) to `/sdcard/Pictures` and run the media scan. 2. Edit Profile > Change Photo. 3. Tap the blank tile in the system photo picker (second tile, top row).
- **Expected:** An inline "couldn't use that image" message, or the crop step opens and fails clearly, and the Edit screen comes back.
- **Actual:** The app area goes fully white (status and nav bars only). The view hierarchy is empty, `MainActivity` stays resumed, the process is alive, and nothing changes after 45 s. There's no crash and no JS error. Hardware back returns to the photo picker, and a second back leaves the app for the launcher (the user loses their place in Edit Profile). Nothing was uploaded (`avatar_url` unchanged).
- **Evidence:** `evidence/E2E-028-fake-image-blank-screen.png`
- **Suspected cause:** not investigated. The picker is `expo-image-picker` with `allowsEditing` (`AvatarPicker.tsx:44-51`), and the crop step probably can't decode the bytes and never reports back. Rare in practice: it needs a corrupt file that the system picker still lists.
- **Solution (if solved):** n/a

### E2E-029 — Avatar: a 36 MB image spins for about 3 minutes, then fails with "Check your connection"
- **Found:** 2026-10-09, slice 2.1, case 2.1-40   **Role:** client
- **Category:** ux
- **Severity:** S4
- **Status:** Open
- **Steps:** 1. Push `large_over10mb.png` (36 MB noise PNG) to `/sdcard/Pictures`. 2. Edit Profile > Change Photo > pick it > CROP.
- **Expected:** A quick, specific message ("That photo is too large") or a client-side size check. The migration-0011 `avatars` bucket has no `file_size_limit`, so a server rejection isn't guaranteed either.
- **Actual:** After CROP a spinner covers the crop screen. About 3 minutes later (no change in `avatar_url` over a 2-minute poll, still not done at that point) the Edit screen shows red `Could not upload the image. Check your connection.` and the avatar is unchanged. The device was online and the 447 KB PNG uploaded fine, so the wording points the user at the wrong cause. The "Change Photo" link is usable again.
- **Evidence:** `evidence/E2E-029-avatar-oversize-error.png`
- **Suspected cause:** `AvatarPicker.tsx` has no size or type check; the catch-all copy is at `api.ts:1393`. Which step failed (signed URL, PUT, or timeout) is not investigated.
- **Solution (if solved):** n/a

### E2E-030 — Cold start with no connection shows the Login screen with no message, though the session is still valid
- **Found:** 2026-10-09, slice 2.1, case 2.1-03 (offline Profile)   **Role:** both (seen as client)
- **Category:** ux
- **Severity:** S3
- **Status:** Open (re-check in 8.2)
- **Steps:** 1. Log in as `maestro.editprofile@` and reach Home. 2. `adb shell am force-stop com.taskbuddy.app`; `adb shell svc wifi disable; svc data disable`. 3. Launch the app and wait 25 s. 4. Re-enable the network and force-stop and relaunch the app.
- **Expected:** Home from the stored session, or an "offline" notice with a retry. Never a bare Login form while the account is still signed in.
- **Actual:** Step 3 shows the normal Login form ("Welcome!", empty fields) at 8 s and still at 25 s, with no offline wording. Re-enabling the network without relaunching doesn't change it. Step 4 goes straight to Home as the same user, so the session wasn't cleared. A user who logs in again at that moment gets a network error. They could also think they were signed out.
- **Evidence:** `evidence/E2E-030-offline-cold-start-login.png` (thumbnail, 25 s, offline)
- **Suspected cause:** not investigated. It looks like the startup profile fetch fails on the network error and the router falls back to the auth stack. `AuthContext` is out of this sweep's fix scope.
- **Solution (if solved):** n/a

### E2E-031 — Change Password: the API accepts a new password equal to the current one
- **Found:** 2026-10-09, slice 2.1, case 2.1-62   **Role:** both
- **Category:** backend-bug
- **Severity:** S4
- **Status:** Open
- **Steps:** 1. Log in as the burner `maestro.burner.2.1.1@` and take the access token. 2. `POST /auth/change-password` with `{"current_password":"TestPass123!","new_password":"TestPass123!"}`.
- **Expected:** 400, matching the app's own rule "Different from your current password".
- **Actual:** `200 {"success":true}`. The app blocks it client-side, but a direct API caller doesn't hit that rule. The same call also made the caller's access token stop working (the next request with it got `401 Invalid or expired token`), so a password change ends existing sessions.
- **Evidence:** curl only. Other probes behaved as expected: `new_password` of 5 chars gives 400 `new_password must be longer than or equal to 8 characters`; `{}` gives 400 listing both fields; an extra field `x` gives 400 `property x should not exist`.
- **Suspected cause:** `ChangePasswordDto` has only `@IsNotEmpty` and `@MinLength(8)`; `auth.service.ts` has no equality check. Backend fix needs sign-off (auth is out of this sweep's fix scope).
- **Solution (if solved):** n/a

### E2E-032 — After "Password updated" the app signs the user out on the next action, with no explanation
- **Found:** 2026-10-09, slice 2.1, case 2.1-65   **Role:** both (seen as client)
- **Category:** ux
- **Severity:** S3
- **Status:** Open
- **Steps:** 1. Log in as the burner `maestro.burner.2.1.1@`. 2. Settings > Change Password with the right current password and a valid new one > Update password. 3. See "Password updated — Use your new password the next time you sign in." and tap Done (still on Settings). 4. Tap any switch, e.g. SMS Alerts.
- **Expected:** The session continues, as the success copy says, or the copy warns "You'll be signed out" and the app routes to Login with a message.
- **Actual:** The next request drops the app to the plain Login form (empty fields, no message). Done itself doesn't sign out. The server rejects the old access token after a password change (E2E-031 observed the same on the API), and the app's refresh fails, so the user is signed out silently. The success sheet promises otherwise ("next time you sign in").
- **Evidence:** `evidence/E2E-032-signed-out-after-password-change.png`
- **Suspected cause:** not investigated. The refresh path is in `api.ts` / `AuthContext` (out of fix scope). A backend invalidation of all sessions on password change plus a client that treats the 401 as a plain sign-out would produce this.
- **Solution (if solved):** n/a

### E2E-033 — Header back arrows on Edit Profile, Settings and Help & Support have no accessibility label and are about 38dp
- **Found:** 2026-10-09, slice 2.1, case 2.1-75   **Role:** client (the provider screens are checked in 2.2)
- **Category:** ux
- **Severity:** S4
- **Status:** Open
- **Steps:** 1. Open Settings, Edit Profile and Help & Support. 2. `maestro hierarchy` and look at the clickable node in the top-left.
- **Expected:** An accessibility label such as "Back" and a tap target of at least 48dp.
- **Actual:** On all three screens the back arrow is a clickable node with empty `text` and empty `accessibilityText`, bounds about 99 × 100 px (about 38dp at this density). Profile's arrow does have a label ("Back to Home"). Elsewhere in this slice the controls are labelled: the password eyes ("Show password" / "Hide password"), `Change password` sheet buttons, and the Help tutorial card. The switches on Settings carry only testIDs, with no extra a11y label (only Dark mode is labelled).
- **Evidence:** hierarchy dumps, `~/.taskbuddy-e2e/logs/2.1/hier_*.json` (not committed)
- **Suspected cause:** the shared back-button component in these screens lacks `accessibilityLabel` and `hitSlop`. Not investigated.
- **Solution (if solved):** n/a

## Found & solved` and keep their id.

## Summary

| Severity | Open | Workaround | Solved | Fixed-on-main-not-deployed | Escalated |
|---|---|---|---|---|---|
| S1 | 0 | 0 | 0 | 0 | 0 |
| S2 | 0 | 0 | 0 | 0 | 0 |
| S3 | 4 | 1 | 0 | 0 | 0 |
| S4 | 25 | 2 | 1 | 0 | 0 |

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
- **Status:** Workaround (the Google account was removed from the AVD on 2026-10-09; re-verified in slice 1.3)
- **Steps:** 1. Clear app data and launch. 2. Tap "Continue with Google". 3. Wait about 10s.
- **Expected:** a Chrome custom tab with an account chooser (the plan stops there).   **Actual (0.3):** the app ended up on the onboarding slides, so the OAuth round trip finished with no interaction. The emulator had a real personal Google account added, and it was used. I cleared the app data (`pm clear`) straight away.
- **Your reply (2026-10-09):** "google log in works correctly no problem". You did not say whether that identity already had a TaskBuddy profile or whether the 0.3 sign-in created one. Nobody looked it up (the plan keeps me to `@taskbuddy.test` accounts), so that is still unknown.
- **Slice 1.3 re-check:** with `dumpsys account` showing `Accounts: 0`, one tap opened a Chrome custom tab on Google's own "Sign in" page (Email or phone field), nothing auto-completed, back returned to Login within 12 s with no ANR and no error banner, and a force-stop plus relaunch landed on Login.
- **Evidence:** `evidence/E2E-008-google-signin-autocompletes.png` (0.3). The 1.3 screenshot is not committed.
- **Remaining ask:** keep personal Google accounts off the test AVD. If the 0.3 tap created a profile for that Google identity on the shared backend, it is still there; delete it yourself if you don't want it.

### E2E-009 — Login banner shows raw class-validator text ("email must be an email")
- **Found:** 2026-10-08, slice 1.1, cases 1.1-09, 1.1-13, 1.1-14, 1.1-30   **Role:** both
- **Category:** ux
- **Severity:** S4 low/cosmetic
- **Status:** Open
- **Steps:** 1. On Login type `a@b.c` (or `a..b@x.com`, or a 300-character local part) and any password. 2. Tap Sign In.
- **Expected:** friendly copy such as "Please enter a valid email address." (the copy the client regex uses for `not-an-email`).   **Actual:** the red banner reads `email must be an email`, the first `message` of the backend's validation array.
- **Evidence:** `evidence/E2E-009-raw-validation-copy.png`
- **Suspected cause:** the client regex at `LoginScreen.tsx:135` is looser than the backend `@IsEmail()`, and `api.ts` shows `data.message[0]` as-is (api.ts:788-790). Fix by tightening the client check or mapping the server's email message.

### E2E-010 — Login rate limit is not enforced reliably on the deployed API
- **Found:** 2026-10-08, slice 1.1, case 1.1-36   **Role:** both
- **Category:** backend-bug
- **Severity:** S3 medium
- **Status:** Open (backend, log only)
- **Steps:** 1. Send 14 sequential `POST /auth/login` requests with a wrong password (a junk email, no real account touched) and read `x-ratelimit-remaining`. 2. Repeat 16 rapid requests.
- **Expected:** 10 per minute, then 429 for every further request until the window ends (`ThrottleAuth`, `common/throttle.ts:44`).   **Actual:** the counter is not monotonic (remaining went 0, 2, 1, 7, 0, 6, 5 …) and statuses alternate between 401 and 429. A burst of 16 requests returned 16 x 401 with no 429, and a run of 12 returned 12 x 401.
- **Suspected cause:** throttler storage is in-memory per process (comment in `app.module.ts`). More than one instance behind the Render proxy would multiply the ceiling and make it random. Not investigated further.
- **Impact:** password guessing is cheaper than the design says. The app's 429 copy ("Too many attempts…", `api.ts:781`) could not be observed on a device, because a 429 could not be produced on demand.

### E2E-011 — Provider avatar on Home is an empty white circle
- **Found:** 2026-10-08, slice 1.1, case 1.1-22   **Role:** provider
- **Category:** ux
- **Severity:** S4 low/cosmetic
- **Status:** Open
- **Steps:** 1. Log in as `maestro.provider@` and look at the Home header.
- **Expected:** initials or the same person placeholder the client Home shows.   **Actual:** a blank white circle (the account has no avatar and, apparently, no initials fallback on a dark header).
- **Evidence:** not committed (screenshot in `~/.taskbuddy-e2e/scratch/out5`)
- **Suspected cause:** not investigated (`OwnAvatar` on `SPHomeScreen`).

### E2E-012 — At font scale 1.3 the focused Login password field is half covered by the keyboard
- **Found:** 2026-10-08, slice 1.1, case 1.1-33   **Role:** both
- **Category:** ux
- **Severity:** S4 low/cosmetic
- **Status:** Open
- **Steps:** 1. `adb shell settings put system font_scale 1.3`. 2. Open Login, tap Password.
- **Expected:** the field and the Sign In button stay visible above the keyboard.   **Actual:** the field's lower half is hidden behind the keyboard and Sign In is off screen until the user scrolls.
- **Evidence:** `evidence/E2E-012-login-font13-keyboard.png`
- **Suspected cause:** `KeyboardAvoidingView behavior="height"` with `justifyContent: center` on a taller form (`LoginScreen.tsx:343`). Not investigated.

### E2E-013 — Register: "Passwords do not match." stays after Password is edited to match Confirm
- **Found:** 2026-10-08, slice 1.2, case 1.2-19/1.2-20   **Role:** both
- **Category:** app-bug
- **Severity:** S4 low/cosmetic
- **Status:** Open
- **Steps:** 1. Register screen, Password `abc12345X`, Confirm `abc12345`, tap Sign Up (mismatch error shows). 2. Edit only the Password field (Backspace) so both read `abc12345`.
- **Expected:** the mismatch error clears (or re-validates) once the two values are equal.   **Actual:** both fields show `abc12345` (visibility toggled on) and the red "Passwords do not match." is still shown until the next submit or an edit of the Confirm field.
- **Evidence:** `evidence/E2E-013-confirm-error-stale.jpg`
- **Suspected cause:** `RegisterScreen.tsx` password onChange calls `clearError('password')` only, not `confirmPassword` (about line 566). Not investigated further.

### E2E-014 — Register: a consent's red error stays after its box is ticked
- **Found:** 2026-10-08, slice 1.2, case 1.2-29   **Role:** both
- **Category:** app-bug
- **Severity:** S4 low/cosmetic
- **Status:** Open
- **Steps:** 1. Register screen, tap Sign Up empty so the three consent errors show. 2. Tick Terms (open the document, tap "I agree to the Terms & Conditions"); then tick Privacy the same way.
- **Expected:** each consent's error disappears when it is ticked, like the field errors do.   **Actual:** the boxes are ticked but "Please accept the Terms & Conditions to continue." and "Please accept the Privacy Policy to continue." stay red until the next submit, so a ticked box sits under an error saying it is not accepted.
- **Evidence:** `evidence/E2E-014-consent-error-stale.jpg`
- **Suspected cause:** no `clearError` call on the terms/privacy/data-collection handlers (`RegisterScreen.tsx` around lines 505-508, 651-654, 671-674, 691). Not investigated further.

### E2E-015 — Register banner shows raw class-validator text ("email must be an email")
- **Found:** 2026-10-08, slice 1.2, case 1.2-12/13/14   **Role:** both
- **Category:** app-bug
- **Severity:** S4 low/cosmetic
- **Status:** Open
- **Steps:** 1. Register screen, fill a valid client form and tick all three consents. 2. Enter an email the app's regex accepts but the server's `@IsEmail()` rejects: `a@b.c`, `a..b@x.com`, `x@y.com';--`, `<script>@x.com`, or a 300-character local part. 3. Tap Sign Up.
- **Expected:** friendly copy such as "Please enter a valid email address.", like the client-side check.   **Actual:** a red banner reading "email must be an email". No account is created, the spinner stops and the form values are kept. A 300-character email does not break the layout. Same defect as E2E-009 on Login.
- **Evidence:** `evidence/E2E-015-register-raw-validation-copy.jpg`
- **Suspected cause:** the client regex (`RegisterScreen.tsx:323`) is looser than the DTO's `@IsEmail()` (`auth.dto.ts:16`), and `api.ts:789` passes `message[0]` through verbatim. Fixing it would share one mapping with E2E-009. Not investigated further.

### E2E-016 — At font scale 1.3 the focused Register Password and Confirm fields are half covered by the keyboard
- **Found:** 2026-10-08, slice 1.2, case 1.2-50   **Role:** both
- **Category:** ux
- **Severity:** S4 low/cosmetic
- **Status:** Open
- **Steps:** 1. `adb shell settings put system font_scale 1.3`. 2. Open Register, dismiss the keyboard, scroll to Password (then Confirm Password) and tap the field.
- **Expected:** the focused field sits fully above the keyboard.   **Actual:** the field's lower half is hidden behind the keyboard. The user can still scroll the form, and Name and Email stay fully visible. Same pattern as E2E-012 on Login. At this scale the Client / Service Provider buttons stack vertically, as designed.
- **Evidence:** `evidence/E2E-016-register-font13-keyboard.jpg`
- **Suspected cause:** `KeyboardAvoidingView behavior="height"` (`RegisterScreen.tsx` around 789-792), the same cause as E2E-012. Not investigated further.

### E2E-017 — Register Full Name: the word "Mareng" turns into "Marengo" while typing
- **Found:** 2026-10-08, slice 1.2, case 1.2-01/1.2-02   **Role:** client
- **Category:** ux (cause unconfirmed, may be env: emulator keyboard)
- **Severity:** S4 low/cosmetic
- **Status:** Open
- **Steps:** 1. Open Register. 2. Maestro `inputText: "Ate Mareng Paayos-Gripo"` into Full Name. 3. Read the field, then (burner.1) sign up and read `GET /auth/me`.
- **Expected:** the field keeps exactly what was typed.   **Actual:** the field already shows "Ate Marengo Paayos-Gripo", and that value is what the backend stores (`full_name`). Filipino names are easily rewritten by a dictionary suggestion, so a real user could be hit too.
- **Evidence:** `evidence/E2E-017-name-word-changed-while-typing.png`
- **Suspected cause:** `autoCorrect={false}` is already set on the input (`RegisterScreen.tsx:146`), so the change probably comes from the emulator's keyboard suggestions applied on the space. Not confirmed on a physical device. Not investigated further.

### E2E-018 — Register Full Name keyboard starts in lower-case (no auto-capitalisation)
- **Found:** 2026-10-08, slice 1.2, case 1.2-53   **Role:** both
- **Category:** ux
- **Severity:** S4 low/cosmetic
- **Status:** Open
- **Steps:** 1. Open Register. 2. Tap Full Name.
- **Expected:** the keyboard opens with Shift on, so names start with a capital letter (like "Alex Chen" in the placeholder).   **Actual:** the keyboard is in lower-case with Shift off, so users type "juan dela cruz" unless they press Shift themselves.
- **Evidence:** `evidence/E2E-018-register-name-no-capitalize.png`
- **Suspected cause:** the shared `FormInput` sets `autoCapitalize="none"` for every field including Name (`RegisterScreen.tsx:145`); there is no prop to override it for names. A `words` setting would only be needed on Name. Not investigated further.

### E2E-019 — Delete Account dialog differs between client and provider
- **Found:** 2026-10-08, slice 1.2, case 1.2-57/58   **Role:** both
- **Category:** ux
- **Severity:** S4 low/cosmetic
- **Status:** Open (belongs to Slice 2.3, logged here because the cleanup flows hit it)
- **Steps:** 1. Log in as a client, Home avatar, Settings, Delete Account. 2. Repeat as a provider (scroll to Settings on the profile).
- **Expected:** the same confirmation wording and buttons for the same destructive action.   **Actual:** the client dialog reads "This permanently removes your personal details and signs you out. You must first clear any wallet balance, pending withdrawal, active job, escrow hold, or dispute." with buttons "Cancel" / "Delete Account". The provider dialog has an icon, different wording ("Your profile, contact details and settings are removed ... This can't be undone.") and buttons "Keep My Account" / "Delete". Maestro flows need role-specific selectors because of this (`settings_delete_account_burner.yaml` only works for clients).
- **Evidence:** `evidence/E2E-019-delete-dialog-client.png` (provider dialog seen on screen, not saved)
- **Suspected cause:** two separate dialog components. Not investigated.

### E2E-020 — Forgot Password banner shows raw class-validator text ("email must be an email")
- **Found:** 2026-10-09, slice 1.3, cases 1.3-05, 1.3-06   **Role:** both
- **Category:** ux
- **Severity:** S4 low/cosmetic
- **Status:** Open (twin of E2E-009 on Login and E2E-015 on Register)
- **Steps:** 1. Login, "Forgot Password?". 2. Type `not-an-email` (also `x@y`), tap "Send reset code".
- **Expected:** friendly copy such as "Please enter a valid email address." and no advance to stage 2.   **Actual:** red card reads `email must be an email`. The screen has no client-side format check, only an empty check.
- **Evidence:** `evidence/E2E-020-forgot-raw-validation-copy.png`
- **Suspected cause:** `ForgotPasswordScreen.tsx:81` only checks `!email.trim()`; `api.ts:788-790` passes `message[0]` through as-is. Same fix as E2E-009.

### E2E-021 — Forgot Password keeps its error card after the input is corrected (both stages)
- **Found:** 2026-10-09, slice 1.3, cases 1.3-13, 1.3-34   **Role:** both
- **Category:** ux
- **Severity:** S4 low/cosmetic
- **Status:** Open (same class as E2E-013/014)
- **Steps:** 1. Reach stage 2 with an unknown address. 2. Code `123456`, New `TestPass123!`, Confirm `TestPass123?`, tap "Reset password" (error appears). 3. Edit Confirm to `TestPass123!` without tapping anything else.
- **Expected:** the error clears once the input changes.   **Actual:** both rules turn green ("At least 8 characters", "Both passwords match") while the red card still says "Those passwords do not match.", until the next submit.
- **Also on stage 1 (case 1.3-13):** tap "Send reset code" with an empty field ("Enter the email address on your account."), then type a valid address: the red card stays above the valid value.
- **Evidence:** `evidence/E2E-021-forgot-stale-mismatch-error.png`, `evidence/E2E-021-forgot-stage1-stale-empty-error.png`
- **Suspected cause:** `ForgotPasswordScreen.tsx:79-80,99-101` clear `error` only at the start of a submit; the `onChangeText` handlers don't.

### E2E-022 — Forgot Password stage 2 shows Supabase's raw "Token has expired or is invalid"
- **Found:** 2026-10-09, slice 1.3, case 1.3-33   **Role:** both
- **Category:** ux
- **Severity:** S4 low/cosmetic
- **Status:** Open
- **Steps:** 1. Stage 2 with an unknown address. 2. Code `123456`, matching valid passwords, tap "Reset password".
- **Expected:** the screen's own copy ("That code is invalid or has expired.", `ForgotPasswordScreen.tsx:120`).   **Actual:** red card reads "Token has expired or is invalid", passed through from the backend. No account existence leak (the same text would come back for a real account with a wrong code).
- **Evidence:** `evidence/E2E-022-forgot-raw-token-copy.png`
- **Suspected cause:** the friendly string is only a fallback for non-Error throws; `e.message` is shown whenever the server sends one.

### E2E-023 — Hardware back on the first-run onboarding slides closes the app
- **Found:** 2026-10-09, slice 1.3, case 1.3-59   **Role:** both
- **Category:** ux
- **Severity:** S4 low/cosmetic
- **Status:** Open (needs product sign-off: it may be intended, since there is nowhere to go back to)
- **Steps:** 1. Clear app data, log in as `maestro.client@`. 2. On the first onboarding slide press hardware back.
- **Expected:** back is absorbed (or goes to the previous slide), as it does on every other screen.   **Actual:** the app leaves to the launcher. Relaunching keeps the session and shows the slides again (the "seen" flag is only saved on Skip / Get Started); Skip then force-stop then relaunch lands on Home with no slides.
- **Evidence:** observed via `dumpsys activity` (top activity = launcher), no screenshot.
- **Suspected cause:** `App.tsx:282-284` returns false from the back handler while onboarding is showing.

### E2E-024 — Forgot Password stage 2: Confirm field half covered by the keyboard at font scale 1.3
- **Found:** 2026-10-09, slice 1.3, case 1.3-44   **Role:** both
- **Category:** ux
- **Severity:** S4 low/cosmetic (the field can still be typed in and the screen scrolls)
- **Status:** Open (same class as E2E-012/016)
- **Steps:** 1. `adb shell settings put system font_scale 1.3`. 2. Forgot Password, an unknown address, stage 2. 3. Fill code and New password, tap Confirm new password.
- **Expected:** the focused field and its text are fully visible above the keyboard.   **Actual:** the Confirm field's lower half is under the keyboard and its placeholder is clipped ("Re-enter your new passwor"); the rules, "Reset password" and the footer are not visible until the user hides the keyboard.
- **Evidence:** `evidence/E2E-024-forgot-confirm-field-under-keyboard-1.3x.png`
- **Suspected cause:** `KeyboardAvoidingView behavior="height"` inside a ScrollView (`ForgotPasswordScreen.tsx:315-318`), same pattern as Register.

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
