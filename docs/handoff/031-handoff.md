# Handoff 031 — Branch pushed, draft PR opened, slice 9 still gated

Date: 2026-10-16   Branch: test/e2e-full-sweep   Last commit: `test(e2e): complete slice 8.5 auth probes and record 8.3 progress`

## What was done this session

- **Committed** the outstanding slice 8.3 and 8.5 work that was left uncommitted by the previous session.
- **Pushed** `test/e2e-full-sweep` to `origin` for the first time (42 commits, docs-only).
- **Opened a draft PR** against `main` so the sweep is visible and reviewable on GitHub. **Do not merge** — the sweep is incomplete.
- This handoff was written and committed.

## Slice 9 gate — still blocked

PR #87 (`feat/backend-job-escrow-summary`) is still **open and unmerged** on `erianthe17/taskbuddy`.
The live API (`/health`) has no `commit` field, so even PR #86 is not deployed.

**Gate conditions before slice 9 can start:**

1. PR #87 is merged on GitHub.
2. `main` is redeployed to Render.
3. `GET /health` reports a `commit` field at or after #87's merge commit sha.
4. An authenticated `GET /jobs/:id` (as the job's client) includes `escrow: { status, funding_method }` (or `null`).

When the gate passes:
1. Merge `origin/main` into `test/e2e-full-sweep`.
2. Re-run M-checks and B-checks (see below).
3. Write the backend handoff doc.
4. Do the device work for slice 9.

## feat/mobile-post-uat — NOT pushed, NOT in scope

The `feat/mobile-post-uat` branch has the actual mobile code changes (fixes, early-release and change-request features behind flags, handoff docs through slice 8). It is **local only** and was not pushed.

**Before pushing it, the next session must:**

1. Merge `origin/main` into `feat/mobile-post-uat`.
2. Resolve the `backend/README.md` conflict:
   - If PR #87 is merged: take `main`'s version.
   - If PR #87 is still unmerged: keep the branch's `GET /jobs/:id` escrow lines and mark them "pending PR #87".
3. Run M-checks:
   - `npx tsc --noEmit` → exit 0
   - `npx jest --maxWorkers=2 --testPathIgnorePatterns "HOHomeScreen\.test\.tsx" "/node_modules/"` → expect 188 suites / 3038 tests, 0 FAIL
4. Run B-checks:
   - `npm test` → 53 suites / 678 tests (count may rise from main's additions; a drop means stop)
   - `npm run build` → exit 0
5. Pre-push secret scan (`.env`, keys, tokens — the repo is **PUBLIC**).
6. `git push -u origin feat/mobile-post-uat`
7. Open a draft PR with the full body from the saved plan.

**The saved plan with full details is at:**
`C:\Users\morad\.claude\plans\pasted-content-id-ff5f-continue-the-immutable-whisper.md`

## Backend handoff doc — NOT written yet

The saved plan calls for `docs/backend-handoff-mobile-post-uat.md` with these items:

1. **Merge and deploy PR #87** — blocks mobile slice 9 (escrow on `GET /jobs/:id`).
2. **Deploy current `main`** — `/health` has no `commit` key, so #86 is not live.
3. **Capacity refusals return 400, not 409** — mobile `limitRefusal` matches only 409, so "Too many active jobs" dialogs never fire live. **Decision needed:** map `TB409` to HTTP 409 on the server (recommended), or have mobile also accept 400.
4. **Card-hire capacity checked only in the webhook** — client pays first and is refused afterwards.
5. **Price raise with insufficient wallet** → 400 "Insufficient wallet balance" — a stable error code would let the app offer a top-up.
6. **ml_service** reports `down` (HTTP 429) in live `/health`.
7. **Test data:** c1's notifications were marked read by accident; burner accounts with prefix `maestro.burner.mh.` need cleanup.
8. **Product question:** after an early release, does the server still accept complaints?
9. Card-funded price changes are rejected (need a payment-authorization design).

This doc should be written on `feat/mobile-post-uat` with a pointer in `mobile/README.md`, committed as `docs(backend): hand off mobile post-UAT backend items`.

## Remaining device and test work

### Slice 8.3 — partially done
- Rows 8.3-01 through 8.3-15: results filled in (15 Pass, 1 Fail E2E-169, 1 N-A).
- **Rows 8.3-16 through 8.3-22:** not yet run. Need a device (emulator with adb). Covers:
  - 8.3-16: location denial at "Use my current location"
  - 8.3-17, 8.3-18: deep link while signed in / after force-stop
  - 8.3-19: N-A (ORCH decision, p1 already verified)
  - 8.3-20, 8.3-21: clock skew (N-A if `adb shell date` is refused)
  - 8.3-22: cleanup / restore all device settings

### Slice 8.4 — drafted, not run
- 18 rows in `test-cases/8.4.md`, all drafted.
- Burners N1–N6 pre-registered and prechecked (see 8.4 header and handoff 030).
- ORCH steps: suspend N4 after 8.4-10, reinstate after 8.4-16; DELETE N5 and N6 at their rows.

### Slice 8.5 — complete ✓
- 32 authorization probes, all refused. State checks passed.

### Slice 9 — gated
- 9.1: full regression run (needs PR #87 merged + deployed)
- 9.2: final report

## Open items carried from handoff 030

- **Deferred checks (time-gated):**
  - 5.3-15: J1 auto-release → p1 +425.00, commission 75.00, c1 in_escrow −500.
  - 7.4-31 on J1.
  - R4, R5, R10 auto-release (p1 +255.00 each) — after about 2026-10-15T00:01Z (should be past by now).
- **E2E-131:** enable Stripe Connect in the sandbox account.
- **Fix approvals (money-screen UI):** E2E-105, 119, 120, 128, 129, 130.
- **Allowed-scope fixes batched for a rebuild:** E2E-111, 112, 115, 122, 123, 124, 132, 137, 138, 139, 140, 155, 157, 160, 161, 167.
- **Product decisions needed:** E2E-133 (chat drafts), 141 (chat on cancelled/completed jobs), 159 (provider reviews list), **162** (refunded job stays active), 164 (provider withdraw application), 168 (suspension UX).
- **Carried:** E2E-070 (High severity); real-provider notifications once ML is up; E2E-078; E2E-084; sign-offs for E2E-046/047, 056/057, 066, 087, 099, 109.

## Environment state

- Installed build: `fbe63d63…`, sha256 `75b611c2…426c4`.
- Backend: health db up, ml down (E2E-001). `/health` has no `commit` field.
- **Ledger** (last known, from handoff 030 — auto-releases may have changed p1):
  - c1 47,523 / 47,523 / in_escrow 1,400
  - p1 255 / 255 / 1,400
  - c2 150 / 150 / 0
  - p2 560.45 / 560.45 / 0
- PR #87: open, unmerged (`feat/backend-job-escrow-summary`).
- The emulator may need a cold boot; DNS has been unreliable (see handoff 030 gotchas).

## Continuation prompt

```
Continue the TaskBuddy mobile work. Read docs/handoff/031-handoff.md.

Two tracks:
1. E2E sweep: slice 9 is gated on PR #87 merge + main redeployment. Check the gate
   first. If it passes, merge origin/main, run remaining 8.3 rows (16–22) and 8.4 on
   the device, then start slice 9. If not, skip to track 2.
2. feat/mobile-post-uat: merge origin/main, resolve the backend/README.md conflict,
   run M-checks and B-checks, write docs/backend-handoff-mobile-post-uat.md, push
   the branch, and open a draft PR. The full procedure is in the saved plan at
   C:\Users\morad\.claude\plans\pasted-content-id-ff5f-continue-the-immutable-whisper.md.

Stop conditions: any check failure, any secret in the diff, any gate still blocked.
```
