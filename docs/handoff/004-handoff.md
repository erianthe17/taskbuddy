# Handoff 004 — Slice 1.1 Login / logout / session complete
Date: 2026-10-08   Branch: test/e2e-full-sweep   Last commit: see `git log -1`
## Completed this slice
- Cases: 36 total — 30 pass / 5 fail / 0 blocked / 1 N-A  (docs/e2e-sweep/test-cases/1.1.md)
  - Fail: 1.1-09, 1.1-14, 1.1-30 (E2E-009), 1.1-33 (E2E-012), 1.1-36 (E2E-010). 1.1-13 passes for the password and shows E2E-009 for a very long email. N-A: 1.1-24 (Log Out is only reachable from Home).
- New findings: E2E-009 raw "email must be an email" copy on Login (S4, Open); E2E-010 deployed login rate limit is inconsistent, 16 rapid requests gave no 429 (S3, backend-bug, Open); E2E-011 provider Home avatar is an empty white circle (S4, Open); E2E-012 Login password field half hidden by the keyboard at font scale 1.3 (S4, Open).
- Solved this slice: none.
- New flows, all green on 2026-10-08 (one `maestro test` per file): `p1_auth_login_validation.yaml`, `p1_auth_session_persistence.yaml`, `p1_auth_account_switch.yaml`. Existing `smoke_login_both_roles`, `auth_wrong_password`, `auth_logout_client`, `auth_logout_provider` re-run green.
- Crash sweep: clean (`~/.taskbuddy-e2e/logs/1.1-logcat.txt` is empty).
## Environment state right now
- Installed build: `fbe63d63…` (versionCode 1), unchanged. Emulator settings: font scale back at 1.0, network re-enabled, timezone Asia/Manila, autofill_service null.
- Backend: health db up, ml down (429, E2E-001). Login throttle is flaky (E2E-010).
- Accounts & data: wallets unchanged (client 49,500 available, 500 frozen; provider, client2, provider2 0). No jobs created. The app is logged in as the client from the last flow.
- Burners still alive: `maestro.editprofile@taskbuddy.test`, `maestro.burner.ep1791457159659@taskbuddy.test` (E2E-006).
## Open blockers / escalations awaiting the user
- E2E-008 (Google account on the AVD) is still undecided; Slice 1.3 depends on it. Decide before then.
- The two leftover burners still need deleting (or 9.2 cleans them up).
- E2E-010 is a backend finding: the throttler uses in-memory storage and the deployed API looks like it runs more than one instance. A fix is outside this sweep's scope.
- The app's 429 copy ("Too many attempts…") was never seen on a device because a 429 could not be forced. If it matters, cover it with a jest test on `api.ts` in a later slice.
## Next slice
- 1.2 Registration (both roles). Steps: (1) startup checklist; (2) spawn a Sonnet agent to draft `test-cases/1.2.md` from `RegisterScreen`, `TermsAndConditions`, `auth.dto.ts` RegisterDto and `api.ts`; (3) run the cases with burners named `maestro.burner.reg.<n>@taskbuddy.test` (Confirm-email is OFF) and delete each burner through Settings → Delete Account, or ask the user first, since an API delete was denied by the permission classifier.
- Mind the Supabase 4-emails/hour cap and the 10/min auth throttle (wait 65s after a 429).
## Gotchas learned this slice
- Provider tabs: tap "My Work"/"Feed" by text, not `nav-tab-*`. `eraseText` is unreliable for long text; use `clearState`. `launchApp` without clearState is the persistence check. Details are in `mobile/maestro/README.md` "Slice 1.1 notes".
- A Maestro `tapOn` waits for its element, so "first tap after cold launch" can only be tested paced; a human fast-tap stays untested.
- Onboarding slides are remembered per profile: they do not return after Skip, even after logging out and in.
## Continuation prompt
Printed in the final chat message.
