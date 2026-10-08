# Handoff 006 — Slice 1.3 Forgot password, onboarding, Google, legal complete
Date: 2026-10-09   Branch: test/e2e-full-sweep   Last commit: see `git log -1`
## Completed this slice
- Cases: 79 total — 66 pass / 7 fail / 0 blocked / 6 N-A  (docs/e2e-sweep/test-cases/1.3.md)
  - Fail: 1.3-05/06 (E2E-020), 1.3-13 and 1.3-34 (E2E-021), 1.3-33 (E2E-022), 1.3-44 (E2E-024), 1.3-59 (E2E-023). N-A: 1.3-21 (429 not reproducible), 1.3-47 (real reset code needs a mailbox), 1.3-67 (Login has no Terms/Privacy link), 1.3-71 and 1.3-77 (Google profile screens need a fresh Google identity), 1.3-76 (same handler as Login).
- New findings (all S4, Open): E2E-020 raw `email must be an email` banner on Forgot Password (twin of E2E-009/015); E2E-021 the Forgot error card stays after the input is corrected, on both stages; E2E-022 a bad code shows Supabase's raw "Token has expired or is invalid"; E2E-023 hardware back on the first-run onboarding slides exits the app (may be intended, needs sign-off); E2E-024 at font scale 1.3 the Forgot Confirm field is half under the keyboard.
- E2E-008 moved from Escalated to Workaround: with the Google account removed from the AVD, one tap opens Google's own sign-in page in a Chrome custom tab and nothing auto-completes. Back returns to Login within 12 s with no ANR. The question of whether the 0.3 tap created a TaskBuddy profile for that Google identity is still unanswered (you said "google log in works correctly no problem", which doesn't settle it).
- Solved this slice: none.
- New flows, all green on 2026-10-09 (one `maestro test` per file, log `~/.taskbuddy-e2e/logs/1.3-flows.log`): `p1_auth_forgot_validation.yaml`, `p1_auth_forgot_stage2_validation.yaml`, `p1_onboarding_tutorial_client.yaml`, `p1_onboarding_tutorial_provider.yaml`, `p1_auth_legal.yaml`. None sends mail or creates an account.
- Crash sweep: clean (`~/.taskbuddy-e2e/logs/1.3-logcat.txt` is empty).
- Plan/README edits: `mobile/maestro/README.md` gained "Slice 1.3 notes" and its E2E-008 note was updated. PLAN.md is unchanged.
- Process notes: the drafting subagent wrote the case matrix; I wrote the five flows myself from the verified exploration steps (no Sonnet flow-writer, no Haiku `check-syntax` pass; `maestro test` validated them). 1.3-55, 1.3-58, 1.3-61 and 1.3-70 were checked against source and the FAQ text, not each opened on the device.
## Environment state right now
- Installed build: `fbe63d63…` (versionCode 1), unchanged. Emulator settings: font scale 1.0, autofill_service null, timezone Asia/Manila. The Google account was removed from the AVD by you. The app is logged out at Login; one Chrome task is left in Recents.
- Backend: health db up, ml down (429, E2E-001) at the start of the session.
- Accounts & data: wallets unchanged (client 49,500 available, 500 frozen; provider, client2, provider2 0). No jobs created, no accounts created or deleted. Mail sent this hour: one (`maestro.client@`, 16:32 UTC). Still alive: `maestro.editprofile@taskbuddy.test`, `maestro.burner.ep1791457159659@taskbuddy.test` (E2E-006, 9.2 cleans them).
## Open blockers / escalations awaiting the user
- Product sign-off wanted (not bugs): the 60 s resend cooldown is client-only (a different email bypasses it) and pauses while the app is backgrounded; New/Confirm password keep their values after "Use a different email"; an all-space 8-character reset password passes the client check; Terms/Privacy accept isn't gated on reading; Privacy mentions collecting a phone number but Register has no phone field; one back press on stage 2 loses the stage-2 state.
- Unanswered from 0.3: did the Google tap create a profile for your Google identity on the shared backend? I haven't looked (the plan keeps me to `@taskbuddy.test`). If it did, you'd delete it yourself.
- Carried over: E2E-010 is a backend finding, outside this sweep's scope. The 1.2 product sign-off items (no length caps, `<script>` name stored verbatim, etc.) are still open.
## Next slice
- 2.1 Client profile & settings. Steps: (1) startup checklist, then check whether the Maestro MCP's device connection is healthy again (`list_devices`, a trivial `run`); if not, use the CLI; (2) spawn a Sonnet agent to draft `test-cases/2.1.md` from `HOProfile`, `HOEditProfileScreen`, `HOSettingsScreen`, the Help & Support screen (covered in 1.3 for the tutorial entry only) and the profile DTOs; (3) push the avatar test images (`~/.taskbuddy-e2e/images`) with the adb media-scan broadcast from PLAN §5 2.1 before the avatar cases.
- Change Password needs a burner (`maestro.burner.2.1.<n>@taskbuddy.test`), which is created by registering in-app and deleted at the end (Confirm-email is OFF, so burners get a session). Don't change the password of `maestro.client@` or `maestro.provider@`.
- `maestro.editprofile@` and the E2E-006 burner already exist from 0.3, so check whether they're still usable before making more.
## Gotchas learned this slice
- The Maestro MCP's device driver died (`UNAVAILABLE`, connection age ~3 h) and every `run` failed the same way. `maestro test <file>` through Bash worked immediately. Inline `run` also can't resolve relative `runFlow` paths.
- Forgot Password has no testIDs, and its unknown-address stage 2 is identical to a real one, so every stage-2 flow can use `maestro.noacct.fp@` and send no mail. `hideKeyboard` before scrolling to the Confirm field.
- `dumpsys account` is the reliable check that the AVD has no Google account; the user said "done" once while it still listed one.
- Details are in `mobile/maestro/README.md` "Slice 1.3 notes".
## Continuation prompt
Printed in the final chat message.
