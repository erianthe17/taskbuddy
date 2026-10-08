# Handoff 003 — Slice 0.3 EAS preview build, install, baseline complete
Date: 2026-10-08   Branch: test/e2e-full-sweep   Last commit: see `git log -1`
## Completed this slice
- Cases: 28 total — 22 pass / 4 fail / 1 blocked / 1 N-A  (docs/e2e-sweep/test-cases/0.3.md)
  - Fail: 0.3-B06 (E2E-007), 0.3-B07 (E2E-005), 0.3-B10 (E2E-006), 0.3-R08 (E2E-008). 0.3-B03 failed first and passes after the fix (E2E-004). Blocked: 0.3-R09 (datetimepicker, needs E2E-005). N-A: 0.3-R01 (BUG-001, deferred to 8.2).
- New findings: E2E-005 stale create-job flow address (S4, Open, fix in 3.1); E2E-006 stale edit-profile flow plus 2 leftover burners (S4, Open, rewrite in 2.1); E2E-007 hire flow has no fixture (S4, Open, 5.1); E2E-008 Google sign-in completes by itself with the emulator's Google account (S3, **Escalated**).
- Solved this slice: E2E-004 provider logout flow needed a scroll (the slice 0.3 commit).
- New/changed flows: `auth_logout_provider.yaml` (scroll to Log Out, passes), `profile_edit_client.yaml` (selector regex and per-run unique burner email, **still fails**, see E2E-006).
- Build: EAS `fbe63d63-018d-433e-bbda-d071586da894` (preview apk, from f4f1f3d). The stale OTA on `preview` does not apply (`NoUpdatesAvailable`).
- Baseline: 13 existing flows run one at a time. 9 passed first time, 4 failed; one fixed. Crash sweep clean.
## Environment state right now
- Installed build: `fbe63d63…` (versionCode 1, APK sha256 in env-state.md). App data was cleared (`pm clear`), so the app is logged out. Emulator settings changed and not restored: timezone Asia/Manila, autofill_service null (as before).
- Backend: health db up, ml down (429, E2E-001). Nothing new.
- Accounts & data: client 49,500 available (500 frozen in escrow), provider/client2/provider2 0. **Two burners still alive:** `maestro.editprofile@taskbuddy.test` and `maestro.burner.ep1791457159659@taskbuddy.test`. Jobs: none open.
## Open blockers / escalations awaiting the user
- **E2E-008 (decision needed):** "Continue with Google" signed the app in on its own with a real personal Google account that is on the emulator. I don't know whether that created a TaskBuddy profile on the shared backend. I cleared the app data and did nothing else. Please decide: remove that Google account from the AVD (or use another AVD) before Slice 1.3, and say whether to check the backend for a profile created today.
- **Leftover burners:** deleting `maestro.editprofile@` through `DELETE /profiles/me` was denied by the permission classifier, so I didn't retry another way. Please delete both burners (or approve it), otherwise 9.2 cleans them up.
- EAS build quota was not readable from the CLI output; not recorded.
## Next slice
- 1.1 Login / logout / session. First steps: (1) startup checklist (emulator, `adb logcat -c`, warm the backend, check the installed APK sha matches env-state.md); (2) spawn a Sonnet agent to draft `test-cases/1.1.md` from `LoginScreen`, `AuthContext` and `mobile/src/lib/api.ts`; (3) run the cases. Create `maestro.client2@` login cases as the last, rate-limit case.
- Do not tap "Continue with Google" until E2E-008 is settled. Leave any Google case in 1.3 for after that.
- Plan impact: the release build needs no dev-launcher handling, no notification-dialog guard, and no doubled-letter rule.
## Gotchas learned this slice
- `mobile/node_modules` was incomplete, so every `eas` command failed with "expo config exited 1": run `npm ci` in `mobile/`. `eas` in PowerShell needs `cmd /c`.
- A flow's header `env:` beats `maestro test -e`. Use `evalScript` for per-run values.
- `takeScreenshot` paths must be inside the run folder; use `adb exec-out screencap -p` from Git Bash for others.
- The permission classifier blocks mutating API calls even on test burners (`DELETE /profiles/me` denied). Ask first.
- Details are also in `mobile/maestro/README.md` "Release-build notes".
## Continuation prompt
Printed in the final chat message.
