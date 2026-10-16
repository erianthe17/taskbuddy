# Handoff 032 â€” Synced with main after the Xendit switch

Date: 2026-10-17   Branches: test/e2e-full-sweep, feat/mobile-post-uat (worktree `C:/Project/Ongoing/taskbuddy-mh`)

## What changed upstream
- #87 merged and deployed (`/health` commit 75016b9). #89 (409 capacity) and #90 (Xendit, no
  wallet, price tiers, credentials, photo evidence, Terms v2) merged 2026-10-16, NOT deployed.
  Migrations 0053â€“0059 are already applied, so the live API is behind the DB (task ticks broken live).

## Done
- **test/e2e-full-sweep:** merged origin/main (no conflicts). Marked 5.3-15 and 8.4-06/08/09/11
  Obsolete; findings.md "Superseded by PR #90"; PLAN.md slice 9 re-scoped. Committed `29a2275`
  plus this handoff. **Not pushed.** PR #88 (draft) body still says slice 9 is gated on #87; update it
  after pushing (see "Next steps").
- **feat/mobile-post-uat:** merged origin/main as `bf62044` (11 conflicts resolved: main wins for backend
  jobs files, README and `postJobRules`; main's deletions of SPPayoutsScreen/WithdrawModal accepted;
  HOCreateJobScreen test and SPJobDetailScreen hand-merged). **Not pushed.** Backend handoff
  `docs/backend-handoff-mobile-post-uat.md` and the `mobile/README.md` pointer are written and
  committed on that branch.

## Check results

| Check | origin/main baseline | merged post-uat (bf62044) |
|---|---|---|
| mobile tsc | 0 | 0 |
| mobile jest | 177 suites / 2665 tests, all pass | 187 suites; 1 failing suite (HOJobApplicationsScreen) |
| backend jest | 57 / 706 | 57 / 706 |
| backend build | 0 | 0 |

Command used: `npx jest --maxWorkers=2 --testPathIgnorePatterns "HOHomeScreen\.test\.tsx" "/node_modules/"`.

## BLOCKER â€” do not push/PR feat/mobile-post-uat until fixed
`mobile/app/(homeowner)/screens/__tests__/HOJobApplicationsScreen.test.tsx` fails deterministically
when run alone (6 failed, 59 passed; 5000 ms timeouts):
- Two post-uat tests (from `1fcb516`, "a wallet hire refused for a schedule clashâ€¦" and "a card hire
  refused because the provider is fully bookedâ€¦") select the Wallet and Card radios, which #90 removed.
  The screen's capacity-dialog code is fine (still wired to `acceptApplication` and
  `createHireCheckoutSession`); the tests need rewriting for the single online-pay path.
- Four main-origin tests also fail under the merge ("two taps on Confirm and hireâ€¦" x2, "a wait open
  for 24 hours is cleared whenâ€¦"; they pass on origin/main). Cause not yet diagnosed. Suspects: the
  auto-merged `jest.mock('â€¦/src/lib/api')` block (post-uat added `ApiError`; stale `MIN_TOPUP_PHP` /
  `MAX_CARD_PHP` keys remain), or post-uat's confirm-flow changes. Compare with
  `git show origin/main:mobile/app/(homeowner)/screens/__tests__/HOJobApplicationsScreen.test.tsx`.
- Fix test-first, then re-run the full mobile and backend checks. Mobile count must be >= 2665 tests.

## Next steps (in order)
1. Fix the HOJobApplicationsScreen failures above, in `C:/Project/Ongoing/taskbuddy-mh`.
2. Pre-push secret scan on both branches (repo is PUBLIC; regex in the plan: `sk_(live|test)_`,
   `xnd_(production|development)_â€¦`, `eyJâ€¦`, `SUPABASE_SERVICE_ROLE`, `-----BEGIN`). The post-uat branch
   carries emulator screenshot PNGs under docs/ (test accounts only).
3. Push `feat/mobile-post-uat`, open a DRAFT PR to main (mention: no CI exists, local checks are the
   gate; link the backend handoff doc; do not mention wallet/payout/budget work, it was dropped).
4. Push `test/e2e-full-sweep` (updates PR #88) and replace the stale "gated on PR #87" sentence in the
   #88 body with: `Slice 9 is re-scoped to the Xendit flows (PR #90) and gated on deploying #89/#90 â€”
   see docs/e2e-sweep/PLAN.md "Slice 9 re-scope".`
5. With a yes from the user, comment on PR #90: live API still at 75016b9 while migrations 0053â€“0059
   are applied; task ticks broken live; deploy main and set XENDIT_SECRET_KEY / XENDIT_CALLBACK_TOKEN.
6. When `/health` reports a commit >= 2ee8243: ask the user, then `eas update --channel preview` from
   a clean checkout of main. No native changes since installed build fbe63d63 (f4f1f3d), so an OTA is
   enough, no new build. Before publishing check `eas env:list --environment preview` has no
   `EXPO_PUBLIC_FF_*`=1 and no foreign `EXPO_PUBLIC_API_URL`. Record the update group ID in env-state.md.
7. Slice 9 per PLAN.md "Slice 9 re-scope".

## Gate for slice 9
`/health` commit >= 2ee8243, Render has the Xendit env vars, and a build/OTA from that main is installed.

## Still open
- Product decisions: E2E-133, 141, 159, 162, 164, 168. Carried: E2E-070, 078, 084; sign-offs for
  E2E-046/047, 056/057, 066, 087, 099, 109.
- Batched allowed-scope fixes E2E-111..167 (see 031): re-check each against the new build; drop any
  whose screen was deleted by #90.
- Change-request UI is flag-off and predates #90 (sends `new_budget`; main wants `new_price_tier`, plus
  `awaiting_payment` handling and `POST /payments/price-change-checkout-session`).
- Maestro: `mobile/maestro/flows/nav_bottombar_client.yaml` and `00_setup_test_accounts.md` still
  reference the Wallet tab / top-ups; update or retire before the slice 9.1 regression.
- After the OTA/new build, persistent test accounts are asked to re-accept Terms v2 on first sign-in.
- Worktrees: `C:/Project/Ongoing/taskbuddy-mh` (post-uat) and `C:/Project/Ongoing/taskbuddy-escrow`
  (feat/backend-job-escrow-summary, merged via #87, safe to remove).
- A stale uncommitted merge of #86 in taskbuddy-mh was aborted; its patch is in the session scratchpad
  only (everything in it is already in main).
