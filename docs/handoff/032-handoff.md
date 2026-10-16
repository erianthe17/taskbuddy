# Handoff 032 — Synced with main after the Xendit switch

Date: 2026-10-17   Branches: test/e2e-full-sweep, feat/mobile-post-uat (worktree `C:/Project/Ongoing/taskbuddy-mh`)

> **Supersedes handoff 031's procedure and continuation prompt.** 031's check counts (188 suites /
> 3038 tests mobile, 678 backend) and its slice-9 gate (PR #87 merged and deployed) are obsolete:
> main is now 177 suites / 2665 tests mobile and 57 suites / 706 tests backend, and the wallet is
> gone (PR #90). Items in 031 that still hold: the slice 8.3 rows 16–22 and 8.4 device work (see
> PLAN.md), the product decisions list, and the environment gotchas (emulator cold boot, DNS).

## Rules for whoever continues (these override defaults in the tooling)

- **No `Co-Authored-By` / "Generated with" trailers in commits.** The user's global CLAUDE.md forbids
  them; the tooling may suggest them anyway. Commits read as if the user wrote them. Conventional
  Commits: `type(scope): imperative summary`, body explains why. (PR descriptions: the user's rule
  covers commits; ask before adding any attribution line to a PR body.)
- **Tests first** for any code change (CLAUDE.md "Testing"): write the failing test, then the fix.
  Include negative and edge cases.
- **Show real check output**; never call something fixed on the strength of a diff.
- **Long builds/test runs go detached to a log file** and are polled; foreground runs get CPU-starved
  and die with the session. Example in "How the checks were run" below.
- Use **PowerShell** for installs and `gh` (Git Bash has SSL DLL failures and no `gh`).
- The repo (`erianthe17/taskbuddy`) is **PUBLIC**: never commit secrets, `.env`, tokens, memory
  files or personal notes. Scan before every push.
- Never edit an applied migration; backend findings go in a backend handoff doc, with a pointer in
  `mobile/README.md` and a mention in the PR/commit body.
- When copying text files with PowerShell, use UTF-8 without a BOM (`[System.IO.File]::WriteAllText`
  with `New-Object System.Text.UTF8Encoding($false)`). `Get-Content | Set-Content -Encoding utf8` on
  Windows PowerShell 5.1 corrupts em-dashes and adds a BOM.

## What changed upstream

- #87 merged and deployed (`/health` commit `75016b9`). #89 (409 capacity) and #90 (Xendit, no
  wallet, price tiers, credentials, photo evidence, Terms v2) merged 2026-10-16, **NOT deployed**.
  Migrations 0053–0059 are already applied, so the live API is behind the DB (task ticks broken live).
- Live API: `https://taskbuddy-kpek.onrender.com` (Render free tier; cold start 30–60 s). `main` tip
  at the time of writing: `2ee8243`. Only open PR on the repo: #88 (this sweep, draft, do not merge).

## Done

- **test/e2e-full-sweep:** merged origin/main (no conflicts). Marked 5.3-15 and 8.4-06/08/09/11
  Obsolete; findings.md "Superseded by PR #90"; PLAN.md slice 9 re-scoped. Commits `29a2275` and this
  handoff. **Not pushed.** PR #88's body still says slice 9 is gated on #87; update it after pushing.
- **feat/mobile-post-uat:** merged origin/main as `bf62044` (11 conflicts resolved: main wins for the
  backend jobs files, `backend/README.md` and `postJobRules`; main's deletions of SPPayoutsScreen and
  WithdrawModal accepted; HOCreateJobScreen test and SPJobDetailScreen hand-merged). The backend
  handoff `docs/backend-handoff-mobile-post-uat.md` and the `mobile/README.md` pointer are committed
  there (`21dae46`). **Not pushed.**
- No device work, no backend code changes, no change-request Xendit adaptation this session.

## How the checks were run (reuse these)

Baseline and merged runs were detached PowerShell scripts writing to `%TEMP%\tb-*.log` and ending with
an `ALL_DONE` line; poll for it with a background
`while (-not (Select-String -Path $log -Pattern ALL_DONE -Quiet)) { Start-Sleep 20 }`. Commands inside:

- mobile (`mobile/`): `npm ci; npx tsc --noEmit; npx jest --maxWorkers=2 --testPathIgnorePatterns "HOHomeScreen\.test\.tsx" "/node_modules/"`
- backend (`backend/`): `npm ci; npm test; npm run build`
- `HOHomeScreen.test.tsx` hangs on main too (reported in PR #90), so it is excluded everywhere.
- `node_modules` in `taskbuddy-mh` were installed on the merged tree, so `npm ci` is not needed again
  unless a `package*.json` changes.

| Check | origin/main (2ee8243) | merged post-uat (bf62044) |
|---|---|---|
| mobile tsc | 0 | 0 |
| mobile jest | 177 suites / 2665 tests, all pass | 187 suites; 1 failing suite (HOJobApplicationsScreen); 2854 pass / 4 fail in the full run |
| backend jest | 57 / 706, all pass | 57 / 706, all pass |
| backend build | 0 | 0 |

## BLOCKER — do not push or open a PR for feat/mobile-post-uat until this is fixed

`mobile/app/(homeowner)/screens/__tests__/HOJobApplicationsScreen.test.tsx` fails deterministically in
the merged branch (run alone: 6 failed, 59 passed, all 5000 ms timeouts; the full run reported 4).
Work in the worktree `C:/Project/Ongoing/taskbuddy-mh` (branch `feat/mobile-post-uat`).

Failing tests and where each comes from (verified with `git show <rev>:<file>`):

| Test | On origin/main | In post-uat before merge | Likely cause |
|---|---|---|---|
| a wallet hire refused for a schedule clash shows the dialog once… | no | yes (`1fcb516`) | Picks the "Wallet, ₱5,000.00 available" radio; #90 removed it (hire sheet is online-pay only) |
| a card hire refused because the provider is fully booked… | no | yes (`1fcb516`) | Picks the "Card, … on Stripe" radio; same reason |
| two taps on Confirm and hire inside one act() accept a no-budget hire once… | yes | no | Not diagnosed — see the bisect below |
| two taps on Confirm and hire inside one act() start one card Checkout… | yes | yes | Not diagnosed — see the bisect below |
| a wait open on this screen for 24 hours is cleared when the screen's proposals reload | yes | yes | Not diagnosed — see the bisect below |
| (one more that only fails when this file runs alone) | — | — | Not identified; the full run reported 4 |

What is known about the screen: `HOJobApplicationsScreen.tsx` is post-uat code plus main's Xendit
changes, merged without conflicts. Post-uat added three things to it: `limitRefusal(e)` branches in
both hire catch blocks (`src/lib/serverRefusals.ts`), a `limitDialog` `ConfirmationModal`, and
pull-to-refresh (`RefreshControl` + `refreshing` + a **third argument to `useAsyncData`: the cache key
`ho-job-apps-${jobId}`**, which keeps proposals on screen while a reload runs and keeps a cross-mount
in-memory cache; see `mobile/src/hooks/useAsyncData.ts` and `clearAsyncDataCache`).

**Bisect recipe for the undiagnosed tests** (read each failing test first; change one thing at a time
and revert after):

1. Temporarily drop the third `useAsyncData` argument (the cache key) in the screen and re-run the file.
   If those tests pass, stale cached data or `loading=false` on remount is the cause. The fix is then in
   the tests (await the reload, or clear the cache in `beforeEach`) or in the screen, not both.
2. If not, temporarily remove the `limitRefusal` blocks, then the `refreshControl` prop, and repeat.
3. Compare against main's file:
   `git show origin/main:"mobile/app/(homeowner)/screens/__tests__/HOJobApplicationsScreen.test.tsx"` and
   `git diff origin/main HEAD -- "mobile/app/(homeowner)/screens/__tests__/HOJobApplicationsScreen.test.tsx"`
   (the merged file is 96 lines longer than main's).
4. Run from `C:/Project/Ongoing/taskbuddy-mh/mobile`:
   `npx jest "app/\(homeowner\)/screens/__tests__/HOJobApplicationsScreen.test.tsx" --maxWorkers=1`
   (add `-t "<test name>"` to run one).

**Fix for the two post-uat tests (decision D1):** rewrite them for the single online-pay path (radio
`ONLINE`, then Continue, then Confirm), one test per refusal kind. The assertions stay valid: dialog
title and message appear once, the hire sheet closes, the list is not reloaded, OK dismisses it.

Product fact that weakens the card variant: before #90, card checkout ran only the hireability checks,
so a real capacity refusal arrived *after* payment through the webhook, not at checkout. Whether
`POST /payments/hire-checkout-session` now pre-checks capacity is an open question for the backend owner
(item 3 in `docs/backend-handoff-mobile-post-uat.md`). The mobile dialog is correct either way; it only
fires if the server answers 409 at checkout.

After any fix, re-run the **full** mobile and backend checks and compare with the table above. Mobile
tests must be >= 2665 (baseline) and the failing suite must be green, not excluded. Write the new counts
and exit codes into this file.

## Decisions for the next person (context, recommended default, and who must act)

**D1. Fix the post-uat tests, or drop the capacity-dialog commits from the PR?**
Recommended: fix (rewrite the two tests, diagnose the other three). The dialog itself is correct and
wired to both hire paths; only the tests assumed the removed wallet/card sheet. Dropping the commits
(`1fcb516`, `243ea0c`, `45f01ce`) would lose a feature that works once #89 is deployed. No outside help
needed. Effort: about a session.

**D2. When to open the post-uat draft PR.**
Recommended: only after D1 is green and the secret scan is clean. Opening it red on a public repo with
no CI (there is no `.github/workflows`; local checks are the only gate) invites a bad merge. Note the
backend handoff doc (`docs/backend-handoff-mobile-post-uat.md`) is only visible to the backend owner once
this branch is pushed. If the deploy request is urgent, do D3 first, or push just that doc on its own
small branch from main. Needs: GitHub push rights to `erianthe17/taskbuddy`; `gh` (PowerShell).

**D3. Comment on PR #90 so the backend owner sees the deploy request now** (outward-facing; needs the
user's yes). Recommended: yes, because the DB is ahead of the live API and task ticking is broken for
anyone using the live API. Suggested text: "Live API is still at 75016b9 (#87) while migrations
0053–0059 are applied. Task ticks fail until main (2ee8243) is deployed. Needs XENDIT_SECRET_KEY
(xnd_development_…) and XENDIT_CALLBACK_TOKEN on Render, and the Xendit invoice callback set to
<API>/payments/xendit/webhook. Full list: docs/backend-handoff-mobile-post-uat.md on the mobile
post-UAT PR." Post with `gh pr comment 90 --repo erianthe17/taskbuddy --body-file <file>`.
Needs: the user's approval; whoever owns Render must act on it.

**D4. EAS update (OTA) vs a new build.**
Answer: an OTA is enough. `git diff f4f1f3d origin/main -- mobile/package.json mobile/package-lock.json
mobile/app.json mobile/eas.json mobile/plugins` is empty, `runtimeVersion` is `{policy: "appVersion"}`
(1.0.0), and the installed preview APK `fbe63d63` was built from `f4f1f3d` on channel `preview`.
Recommended: **do not publish until `GET https://taskbuddy-kpek.onrender.com/health` reports `commit`
at or after `2ee8243`** (`git merge-base --is-ancestor 2ee8243 <commit>`). Before then the new JS calls
routes the live API lacks (`/payments/hire-checkout-session`, `/jobs/price-estimate`, `/payouts/*`) and
sends `price_tier` instead of `budget`, so hiring and posting break for every preview tester. Publish
from a clean checkout of `origin/main` (not the post-uat branch):
`npx eas-cli update --channel preview --message "main <sha>: Xendit payments, price tiers, credentials, photo evidence"`.
First run `npx eas-cli env:list --environment preview` and confirm no `EXPO_PUBLIC_FF_*` is `1` and no
foreign `EXPO_PUBLIC_API_URL`. Ask whether a teammate already published or built (two publishers on
`preview` leave testers on whichever landed last). Needs: the user's go, an EAS login
(`npx eas-cli whoami`; `npx eas-cli login` is the user's to run), and an emulator to verify (force-stop
and relaunch twice; the Wallet tab should now read "Messages"). Record the update group ID in
`docs/e2e-sweep/env-state.md`. A new build is needed only if a later change touches native config or
dependencies (the post-uat branch changes neither).

**D5. Whether to flip the two feature flags** (`EXPO_PUBLIC_FF_EARLY_RELEASE`,
`EXPO_PUBLIC_FF_CHANGE_REQUESTS`). Recommended: leave both **off**. Change requests are wallet-era: the
app sends `new_budget`, but main's `POST /jobs/:id/change-requests` takes `new_price_tier`, and an
accepted price increase now waits in `awaiting_payment` until the client pays via
`POST /payments/price-change-checkout-session`. That needs a mobile feature pass (tests first) before
the flag is turned on. Early release depends on `POST /jobs/:id/release` and `/release-request` (both in
main, not yet deployed) and the open product question in backend handoff item 6 (are complaints still
accepted after an early release?).

**D6. Push the sweep branch now?**
Recommended: yes, any time (docs only; updates draft PR #88; **do not merge #88**, the sweep is
incomplete). Run the secret scan first (commands below).

**D7. Remove the extra worktree `C:/Project/Ongoing/taskbuddy-escrow`?**
Recommended: yes (`git worktree remove C:/Project/Ongoing/taskbuddy-escrow`); its branch
`feat/backend-job-escrow-summary` is merged into main via #87. Harmless to keep.

## Next steps (in order)

1. D1: fix the failing tests in `taskbuddy-mh` (tests first), then run the full checks.
2. Run the pre-push secret scan on both branches (below).
3. D6: push `test/e2e-full-sweep`, then update PR #88's body: replace the sentence "This PR is kept as a
   draft while Slice 9 … remains gated on PR #87 … being merged and deployed to `main`." with
   `Slice 9 is re-scoped to the Xendit flows (PR #90) and gated on deploying #89/#90; see
   docs/e2e-sweep/PLAN.md "Slice 9 re-scope".`
   (`gh pr view 88 --repo erianthe17/taskbuddy --json body -q .body > pr88.md`, edit,
   `gh pr edit 88 --repo erianthe17/taskbuddy --body-file pr88.md`.)
4. D2: push `feat/mobile-post-uat` and open the draft PR (title and body below).
5. D3: comment on #90 (with the user's yes).
6. When `/health` shows commit >= 2ee8243 and the Xendit env vars exist: D4 (OTA), then slice 9 per
   `docs/e2e-sweep/PLAN.md` "Slice 9 re-scope". Slice 9 also needs the OTA or a rebuilt dev client on the
   emulator, working adb, and (for 8.4) the burner accounts N1–N6 from handoff 030.
7. Update `docs/e2e-sweep/env-state.md`: ledger figures from handoffs 030/031 are void (#90 emptied
   balances at cut-over); installed build `fbe63d63` is wallet-era until the OTA.

## Gate for slice 9

`/health` commit >= 2ee8243, Render has the Xendit env vars, and a build or OTA from that main is
installed on the emulator.

## Pre-push secret and content scan (repo is PUBLIC)

Run per branch (inside `taskbuddy-mh` for post-uat). Replace `<branch>`:

```powershell
gh repo view erianthe17/taskbuddy --json visibility
git diff --name-only origin/main...<branch> | Select-String -Pattern "\.env|secret|token|\.jks|\.keystore|memory|MEMORY"
git diff origin/main...<branch> | Select-String -Pattern "sk_(live|test)_|xnd_(production|development)_[A-Za-z0-9]{10,}|eyJ[A-Za-z0-9_-]{20,}|SUPABASE_SERVICE_ROLE|-----BEGIN"
```

Filename hits that are merely source files such as `oauth-handoff` are fine; report them. **Any content
hit: stop and tell the user.** `feat/mobile-post-uat` also carries many emulator screenshots under
`docs/` (test accounts only); the user has accepted pushing them. For the sweep branch, diff against
`origin/main` (a diff against `origin/test/e2e-full-sweep` would include all of main's merged commits).

## Draft PR for feat/mobile-post-uat (the original text lives only in a local plan file)

Title: `feat(mobile): post-UAT fixes, early release and change requests behind flags`

Body (fill in the counts from the final run; keep it factual):

```markdown
## Summary
Mobile-side fixes from the post-UAT audit, plus two features built behind off-by-default flags
(`EXPO_PUBLIC_FF_EARLY_RELEASE`, `EXPO_PUBLIC_FF_CHANGE_REQUESTS`): early payment release and job
change requests in the chat. Merged with main after #90 (Xendit); the wallet, withdraw and typed-budget
work this branch originally carried was dropped in the merge.

## What's in it
- Pull-to-refresh on proposals, calendar and portfolio screens; stale-spinner fix on notifications.
- Capacity refusals (409) shown as a dialog on Post a Job, Send Proposal and Hire.
- Early release card (client) and release-request card (provider); change-request card and
  propose sheet in the chat. Both behind flags, off by default.
- Password rule (letter and number) on Register, Forgot and Change password.
- Backend handoff doc: `docs/backend-handoff-mobile-post-uat.md`.

## Not included / known follow-ups
- Change requests still send `new_budget`; main expects `new_price_tier` plus `awaiting_payment`
  handling. Keep the flag off until that is built.
- No CI exists in this repo, so the local checks below are the only gate.

## Testing
- `npx tsc --noEmit` (mobile): exit 0.
- `npx jest --maxWorkers=2 --testPathIgnorePatterns "HOHomeScreen\.test\.tsx" "/node_modules/"`: <fill in>.
- Backend `npm test`: 57 suites / 706 tests; `npm run build`: exit 0.
- `HOHomeScreen.test.tsx` hangs on main as well and is excluded.
- Device flows are not re-verified on this branch (the API it needs is not deployed yet).
```

## What others must provide (so nobody stalls halfway)

| Item | Who | Why |
|---|---|---|
| Deploy main (2ee8243) to Render; `XENDIT_SECRET_KEY`, `XENDIT_CALLBACK_TOKEN`; Xendit invoice callback URL | Backend/Render owner | The live API is behind the database; slice 9 and the OTA wait on it |
| Confirm capacity pre-check on `POST /payments/hire-checkout-session`; ML service up (HTTP 429 now); test-data cleanup; early-release complaint policy | Backend owner | Items 3–6 of the backend handoff doc |
| `npx eas-cli login` | The user | Credentials are theirs |
| Emulator with adb, plus the OTA or a dev client of main | Whoever runs slice 9 | Device work |
| GitHub push rights to `erianthe17/taskbuddy`; approval to comment on #90 | The user | Outward-facing |

## Still open

- Product decisions: E2E-133, 141, 159, 162, 164, 168. Carried: E2E-070, 078, 084; sign-offs for
  E2E-046/047, 056/057, 066, 087, 099, 109.
- Batched allowed-scope fixes E2E-111..167 (see 031): re-check each against the new build; drop any
  whose screen was deleted by #90.
- Change-request UI is flag-off and predates #90 (see D5).
- Maestro: `mobile/maestro/flows/nav_bottombar_client.yaml` and `00_setup_test_accounts.md` still
  reference the Wallet tab / top-ups; update or retire before the slice 9.1 regression.
- After the OTA or new build, persistent test accounts are asked to re-accept Terms v2 on first
  sign-in; login flows need that step.
- The sweep's Post a Job rows (3.x) exercised the old typed-budget field; slice 9 re-tests posting with
  price tiers.
- Worktrees: `C:/Project/Ongoing/taskbuddy-mh` (post-uat) and `C:/Project/Ongoing/taskbuddy-escrow`
  (see D7).
- A stale uncommitted merge of #86 in taskbuddy-mh was aborted; its patch is only in the old session's
  scratchpad (everything in it is already in main, so nothing is lost).

## Continuation prompt

```
Continue the TaskBuddy mobile work. Read docs/handoff/032-handoff.md (it supersedes 031's procedure).

1. In C:/Project/Ongoing/taskbuddy-mh (branch feat/mobile-post-uat) fix the failing
   HOJobApplicationsScreen tests (tests first; bisect recipe is in the handoff), then run the full
   mobile and backend checks and record the counts. Mobile must be >= 2665 tests.
2. Run the pre-push secret scan, push test/e2e-full-sweep and fix PR #88's body, then push
   feat/mobile-post-uat and open the draft PR using the text in the handoff.
3. Ask me before: commenting on PR #90, and publishing any `eas update`.
4. Check GET https://taskbuddy-kpek.onrender.com/health; slice 9 and the OTA stay blocked until its
   commit is at or after 2ee8243.

Rules: no Co-Authored-By trailers; PowerShell for gh/npm; long runs detached to a log; the repo is
public. Stop on any failing check, any secret in a diff, or any gate still blocked.
```
