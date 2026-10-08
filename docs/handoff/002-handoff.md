# Handoff 002 — Slice 0.2 Deployment drift + account/data audit complete
Date: 2026-10-08   Branch: test/e2e-full-sweep   Last commit: see `git log -1`
## Completed this slice
- Cases: 11 total — 7 pass / 2 fail / 1 blocked / 1 N-A  (docs/e2e-sweep/test-cases/0.2.md)
  - Pass: 0.2-01, 02, 04, 05, 06, 07, 09. Fail: 0.2-03 (E2E-001), 0.2-08 (E2E-003). Blocked: 0.2-11 (E2E-002). N-A: 0.2-10.
- New findings: E2E-001 ML service down, HTTP 429 (S3, Open, env); E2E-002 stale confirmed job with ₱500 escrow (S4, Open, awaiting approval to cancel); E2E-003 provider readiness gaps (S4, Workaround).
- Solved this slice: none
- New/changed flows: none. PLAN.md corrected (`/auth/me`, secrets format).
- Drift: no missing routes (146/146) and no DTO-field drift (13 endpoints). Deployed API matches `main` for everything the app calls.
## Environment state right now
- Installed build: dev client from 2026-09-16 (replaced in 0.3). Emulator: timezone Asia/Manila and autofill_service null, originals in env-state.md.
- Backend: health db up, ml down (429). Confirm-email OFF.
- Accounts & data: client 49,500 available (500 in escrow on stale job), provider 0, client2 0, provider2 0. Burners: none. Stale job 5f13ac3f-c909-4a39-b7f2-b750d218d553 still `confirmed`.
- Tokens live only in the session scratchpad, not the repo.
## Open blockers / escalations awaiting the user
- Approve (or do) the admin cancel of job 5f13ac3f-c909-4a39-b7f2-b750d218d553 (`POST /admin/bookings/:id/cancel`, both owners are @taskbuddy.test). The permission classifier denied it. Not a blocker for 0.3.
- Admin email and password were printed into the 0.2 session transcript by a parsing mistake. Consider rotating the admin password.
## Next slice
- 0.3 EAS preview build, install, baseline. First steps: (1) commit is clean, so check the EAS build quota and run `eas env:list --environment preview` and `eas update:list --branch preview --limit 3`; (2) start the detached `eas build -p android --profile preview --non-interactive --json --no-wait`; (3) poll, download the APK, `adb uninstall` then `adb install`.
- Providers: `maestro.provider@` is in Lipa with an 8 km radius, so feed jobs need a nearby location (see E2E-003). provider2 is unverified and has no address.
## Gotchas learned this slice
- No `GET /profiles/me`; use `GET /auth/me`.
- `secrets.env` is `KEY:value`; parse with sed, never echo.
- The permission classifier blocks mutating admin calls on the shared backend even for test data; ask the user first.
- Subagents' background commands can outlive their hand-back; check the scratchpad files rather than waiting on notifications.
## Continuation prompt
Printed in the final chat message.
