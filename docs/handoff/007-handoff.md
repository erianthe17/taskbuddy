# Handoff 007 — Slice 2.1 Client profile & settings complete
Date: 2026-10-09   Branch: test/e2e-full-sweep   Last commit: see `git log -1`
## Completed this slice
- Cases: 77 total — 67 pass / 6 fail / 0 blocked / 4 N-A  (docs/e2e-sweep/test-cases/2.1.md)
  - Fail: 2.1-13 (E2E-025), 2.1-29 (E2E-026), 2.1-39 (E2E-028), 2.1-40 (E2E-029), 2.1-62 (E2E-031), 2.1-75 (E2E-033). N-A: 2.1-41 (the system Photo Picker needs no permission, so a denied-permission path doesn't exist), 2.1-48 (no `location_sharing` switch in HO Settings), 2.1-49 (Language, documented inert), 2.1-66 (needs a Google-only account).
  - Passing rows with a finding attached: 2.1-03 (E2E-030), 2.1-19 (E2E-027), 2.1-65 (E2E-032).
- New findings (all Open):
  - E2E-025 S4 ux: a 121-character name reaches the server and comes back as raw `full_name must be shorter than or equal to 120 characters` (no `maxLength` on the input).
  - E2E-026 S4 ux: Phone accepts any text (`abc`, `+-*#`, 40 digits), no validation either side. Needs product sign-off.
  - E2E-027 S4 ux: address suggestions render under the keyboard, and a long list pushes Save off screen.
  - E2E-028 S4 app-bug: picking a non-image `.jpg` as avatar leaves a blank white screen with no error; back goes to the picker, a second back leaves the app.
  - E2E-029 S4 ux: a 36 MB avatar spins about 3 minutes, then "Could not upload the image. Check your connection."
  - E2E-030 S3 ux: a cold start with no connection shows the Login form with no message though the session is still valid (an online relaunch goes straight to Home). Re-check in 8.2.
  - E2E-031 S4 backend-bug: `POST /auth/change-password` accepts new == current (the app blocks it client-side); a password change also invalidates the caller's access token.
  - E2E-032 S3 ux: after "Password updated — Use your new password the next time you sign in", the app is signed out on the very next request, silently.
  - E2E-033 S4 a11y: back arrows on Edit Profile, Settings and Help have no accessibility label and are about 38dp.
- Solved this slice: none. No app code was changed.
- New flows, all green on 2026-10-09 (one `maestro test` per file, log `~/.taskbuddy-e2e/logs/2.1-flows.log`): `p2_profile_view_client.yaml`, `p2_profile_logout_client.yaml`, `p2_help_support_client.yaml`, `p2_profile_edit_validation.yaml`, `p2_profile_edit_geocode_error.yaml`, `p2_settings_toggles_persist.yaml`, `p2_settings_change_password_burner.yaml`. New helpers: `_helpers/login_as.yaml`, `_helpers/register_burner.js`. None freezes the raw server copy of E2E-025 or E2E-032's behaviour.
- Crash sweep: clean (`~/.taskbuddy-e2e/logs/2.1-logcat.txt` is empty). Logcat was cleared once mid-slice, so the file covers only from the Help & Support test on; the earlier blank-screen cases were checked by hand.
- Plan/README edits: `mobile/maestro/README.md` gained "Slice 2.1 notes". PLAN.md is unchanged.
- Process notes: a Sonnet agent drafted the case matrix (good; its three source discrepancies all held). I wrote the flows myself from the verified steps; no Haiku `check-syntax` pass, `maestro test` validated them. 2.1-71's hardware-back leg, 2.1-61's Enter-key chain and 2.1-63's backdrop and hardware-back legs weren't run on the device (noted in the rows).
## Environment state right now
- Installed build: `fbe63d63…` (versionCode 1), unchanged. Emulator settings: font scale 1.0, autofill_service null, timezone Asia/Manila, dark mode off, `READ_MEDIA_IMAGES` granted. The app is logged out at Login. Test images are still in `/sdcard/Pictures`.
- Backend: health db up, ml down (429, E2E-001) at the start of the session.
- Accounts & data: wallets unchanged (client 49,500 available, others 0). No jobs created. `maestro.client@` now has an address (Ayala Avenue, Makati, with coordinates), which Phase 3 can use. `maestro.editprofile@` is alive and now used by the p2 flows (name "Draft Text", city "Makati", avatar set). Burner `maestro.burner.2.1.1@` was deleted; the flow's own burner is deleted on each run. Still alive: `maestro.burner.ep1791457159659@taskbuddy.test` (E2E-006, 9.2 cleans it).
## Open blockers / escalations awaiting the user
- Decision: `maestro.editprofile@` was listed as a leftover to delete in 9.2, but the new flows depend on it. I've kept it and updated the ledger. Say if you'd rather have it deleted and the flows rewritten around a burner.
- Product sign-off wanted (not bugs): phone is free text with no limit; address, city and phone have no length caps on either side; leaving Edit Profile with the back arrow discards edits with no prompt; whitespace in Address silently clears the address and coordinates; Dark Mode is a live, saved setting (the brief called it disabled); there is no Log Out inside Settings (it lives on Profile only).
- Unanswered from 0.3: did the Google tap create a profile for your Google identity? Not checked (the plan keeps me to `@taskbuddy.test`).
- Carried over: E2E-010 is a backend finding outside this sweep's scope; the 1.2 and 1.3 sign-off items are still open.
## Next slice
- 2.2 Provider profile & settings (`SPProfileScreen`, `SPEditProfileScreen`, `SPSettingsScreen`, `SPSkillRequestScreen`, `SPPortfolioScreen`). Steps: (1) startup checklist; the Maestro MCP device driver was dead again, so use the `maestro test` CLI. (2) Spawn a Sonnet agent to draft `test-cases/2.2.md` from those five screens, the provider DTOs and `backend/BACKEND_SCHEMA.md`; point it at `test-cases/2.1.md` for the format and tell it which 2.1 results carry over (the Edit Profile, avatar, settings and Change Password behaviour is shared code, so re-test provider-specific differences only). (3) Check `GET /admin/skill-requests` and the approve/reject routes against `env-state.md` "Drift" before the skill-request cases.
- The provider accounts are `maestro.provider@` (verified, Plumbing, address in Lipa) and `maestro.provider2@` (unverified, no address). Don't change the password or address of `maestro.provider@` beyond what 2.2 explicitly needs, and restore anything you change. For a Change Password burner the provider needs `role: provider` and a `category_id` at registration, so `_helpers/register_burner.js` (client only) needs a provider variant.
- Look at the 2.1 gaps for the provider too: back-arrow labels (E2E-033), the avatar blank-screen (E2E-028) and oversize (E2E-029), and signed-out-after-password-change (E2E-032).
## Gotchas learned this slice
- The Maestro MCP's device driver died again (`UNAVAILABLE`); the CLI works.
- Don't export `MSYS_NO_PATHCONV=1` for a whole Git Bash call that also runs Python with `~/...` paths: Python gets `C:\c\Users\...` and fails. Set it per adb command.
- `eraseText` only deletes before the cursor; tap the right end of the field first. Select-all via adb (`input keycombination 113 29`, then `input keyevent 67`) clears long text.
- The "Save Changes" confirm button in the modal has the same text as the page's Save, use `rightOf: "Cancel"`.
- Details are in `mobile/maestro/README.md` "Slice 2.1 notes".
## Continuation prompt
Printed in the final chat message.
