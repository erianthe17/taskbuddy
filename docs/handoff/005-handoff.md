# Handoff 005 — Slice 1.2 Registration (both roles) complete
Date: 2026-10-08   Branch: test/e2e-full-sweep   Last commit: see `git log -1`
## Completed this slice
- Cases: 59 total — 48 pass / 7 fail / 0 blocked / 4 N-A  (docs/e2e-sweep/test-cases/1.2.md)
  - Fail: 1.2-12/13/14/51 (E2E-015), 1.2-29 (E2E-014), 1.2-50 (E2E-016), 1.2-53 (E2E-018). N-A: 1.2-25 (no phone field), 1.2-45 (spinner not capturable on a warm backend), 1.2-55 (429 out of scope), 1.2-56 (Confirm-email is OFF, no OTP step).
- New findings (all S4, Open): E2E-013 stale "Passwords do not match." after Password is edited to match; E2E-014 consent errors stay after the box is ticked; E2E-015 raw "email must be an email" banner on Register (twin of E2E-009); E2E-016 Password/Confirm half covered by the keyboard at font scale 1.3; E2E-017 "Mareng" becomes "Marengo" while typing in Full Name (cause unconfirmed, may be the emulator keyboard); E2E-018 Full Name keyboard starts lower-case; E2E-019 Delete Account dialog differs between client and provider.
- Solved this slice: none.
- New flows, all green on 2026-10-08 (one `maestro test` per file, log `~/.taskbuddy-e2e/logs/1.2-flows.log`): `p1_auth_register_validation.yaml` (creates no account), `p1_auth_register_client.yaml` (unique burner, duplicate-email check, deletes itself), `p1_auth_register_provider.yaml` (unique burner, deletes itself).
- Crash sweep: clean (`~/.taskbuddy-e2e/logs/1.2-logcat.txt` is empty).
- Plan/README edits: `mobile/maestro/README.md` gained "Slice 1.2 notes". PLAN.md is unchanged.
## Environment state right now
- Installed build: `fbe63d63…` (versionCode 1), unchanged. Emulator settings: font scale back at 1.0, autofill_service null, timezone Asia/Manila. The app is logged out at Login.
- Backend: health db up, ml down (429, E2E-001).
- Accounts & data: wallets unchanged (client 49,500 available, 500 frozen; provider, client2, provider2 0). No jobs created. This slice's burners (`maestro.burner.reg.1@`, `.2@`, `.3@` and the two flow burners) were deleted in-app and each login now returns 401. Still alive: `maestro.editprofile@taskbuddy.test`, `maestro.burner.ep1791457159659@taskbuddy.test` (E2E-006, 9.2 cleans them).
## Open blockers / escalations awaiting the user
- E2E-008 (Google account on the AVD) is still undecided and Slice 1.3 depends on it. The Google button was deliberately not tapped in this slice (1.2-54 is a presence check only).
- Product sign-off wanted (not bugs): no length cap on name/email/password anywhere (client or DTO); an all-space password of 8+ characters is accepted; a `<script>` name is stored verbatim; hardware back discards a half-filled form; the duplicate-email case shows both an inline error and a banner.
- Backend gaps seen by reading code, not exercised: consent flags and provider `category_id` are optional in `RegisterDto`, so a direct API call skips the consent gate (see 1.2.md Notes, item 9).
- E2E-010 is still a backend finding, outside this sweep's scope.
## Next slice
- 1.3 Forgot password, onboarding, Google, legal. Steps: (1) startup checklist; (2) get the user's decision on E2E-008 before any Google-button case; (3) spawn a Sonnet agent to draft `test-cases/1.3.md` from `ForgotPasswordScreen`, `OnboardingScreen`, `TermsAndConditions`, `GoogleRoleSelectionScreen`, `GoogleSPDetailsScreen` and `auth.dto.ts`, then run it.
- Slides were already covered for both roles in 1.2-05 (3 slides, "Continue" then "Get Started", Skip); 1.3 still owes the "View tutorial" replay in Help & Support. The `auth_forgot_password_request.yaml` flow already exists.
- Mind the Supabase 4-emails/hour cap and the 10/min auth throttle: forgot-password requests send mail, so keep them few.
## Gotchas learned this slice
- Register is a long ScrollView, so scroll before every tap below the fold, and the Password field is unreachable behind the keyboard until you `hideKeyboard`. `assertVisible` matches the whole text node. Maestro `takeScreenshot` drops PNGs in the working directory (move them out before staging). Provider delete dialog is "Keep My Account / Delete". Details are in `mobile/maestro/README.md` "Slice 1.2 notes".
- `eraseText` left residue in short fields too (email, name), not only long ones: use `clearState` for a fresh form.
- Unicode typing (`ñ`, `é`) works on this build, so the old harness worry does not apply here.
## Continuation prompt
Printed in the final chat message.
