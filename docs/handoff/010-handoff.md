# Handoff 010 — Slice 2.3 Account deletion complete
Date: 2026-10-09   Branch: test/e2e-full-sweep   Last commit: see `git log -1`
## Completed this slice
- Cases: 38 total — **31 pass** (2 with a note) / **3 fail** (2.3-14, 2.3-20, 2.3-30) / **0 blocked** / **4 N-A** (2.3-34 to 2.3-37: escrow_held, active_job and open_dispute need a hired job or a dispute, so they go to Phase 5.1/5.3/7.4; Google deletion has no Google account on the AVD)  (docs/e2e-sweep/test-cases/2.3.md)
  - Covered: client and provider happy deletes, every dismiss path, the wallet and pending-withdrawal blockers on both dialogs (client text-in-dialog, provider "Not just yet"), resolve-then-delete (admin settle, then "Try Again" succeeded), offline, double tap, font 1.3, the dead token, login refused, re-registering the freed email and deleting it again, the server-side residue of a deleted profile.
  - 2.3-30 is a code read: it is a failing row because of the code, not because I saw money leave an account.
- New findings: **E2E-046** (S3 backend-bug, Open: a deleted client's open job stays open and accepted an application), **E2E-047** (S3 backend-bug, Open, code read only: `disputed` escrow is queried but never counted as a blocker), **E2E-048** (S4 ux, Open: client dialog keeps its title and a red "Try Again" after a blocker), **E2E-049** (S4 harness, Workaround: emulator DNS loss after a host network change). Summary counts: S3 open 8, workaround 1; S4 open 35, workaround 3, solved 1.
- Solved this slice: none. No app code was changed.
- New flows (green 2026-10-09, `~/.taskbuddy-e2e/logs/2.3-flows.log`; `maestro check-syntax` OK, one `maestro test` per file): `p2_account_delete_client_burner.yaml`, `p2_account_delete_provider_burner.yaml`. Each registers its own burner and deletes it in-app, so they are re-runnable. They do not freeze an open finding (the blocker dialogs are not in them: funding needs the admin token, which flows must not hold).
## Environment state right now
- Installed build: `fbe63d63…` (versionCode 1), sha256 matched. The emulator was **cold-booted with `-dns-server 8.8.8.8,1.1.1.1`** (E2E-049). Timezone restored to Asia/Manila. Font scale 1.0, night mode off, auto time on, Wi-Fi/data on, autofill null. App logged out at Login.
- Backend: health db up, ml down (429, E2E-001). No new drift. The 2.3 deletion flow behaves as `profiles.service.ts` reads.
- Accounts & data: wallets of the four persistent accounts unchanged (client 49,500 available, 500 frozen; client2, provider, provider2 0). All 2.3 burners are deleted (c1..c5, p1, p2: login 401). The two PHP 100 test credits were withdrawn and settled, net zero. `maestro.provider@` has one withdrawn application on a cancelled burner job. Still alive: `maestro.burner.ep1791457159659@taskbuddy.test` (E2E-006, 9.2 cleans it).
- No jobs left open (the E2E-046 test job was cancelled via the admin API).
## Open blockers / escalations awaiting the user
- None for 3.1.
- Product/backend sign-off wanted (new): E2E-046 and E2E-047 are backend changes (cancel a deleted client's open jobs; count `disputed` escrow as a blocker). Carried over: the 1.2, 1.3, 2.1 and 2.2 sign-off lists and E2E-010 are unchanged.
## Next slice
- **3.1 Create job: happy paths** (Phase 3, client). Steps: (1) §4 startup checklist, including a DNS check (`adb shell ping -c 1 taskbuddy-kpek.onrender.com`; if it says unknown host, use the E2E-049 workaround). (2) Read `HOCreateJobScreen.tsx` and `CreateJobDto` (`backend/src/jobs/dto/jobs.dto.ts`: title 5-120, description 20-750, `category_id` required, address and coordinates required, budget optional > 0 with at most 2 decimals, `scheduled_at` not in the past, at most 6 photos), then draft `docs/e2e-sweep/test-cases/3.1.md`. (3) Use `maestro.client@` (49,500 available; fixture budgets PHP 300-800 per PLAN §4b) and keep 2 open jobs for Phase 4; cancel the rest at slice end. Remember burner clients can post jobs with no funds.
- Facts for 3.1: the client dialog and settings paths used in 2.3 are in `mobile/maestro/README.md` ("Slice 2.3 resume notes"). Posting a job as a burner needs no balance. A verified provider is needed to apply (`maestro.provider@`, an unverified burner gets 403 `verification_required`).
## Gotchas learned this slice
- All durable ones are in `mobile/maestro/README.md` ("Slice 2.3 resume notes"): the DNS loss, the two different confirm buttons, the dialog's coordinates, `category_id` on job create, `-e` not overriding an `env:` placeholder.
- The admin users search no longer lists deleted accounts, but `GET /admin/users/:id` does.
- `scratch/2.3/t23.sh` (outside the repo, in `~/.taskbuddy-e2e/t23.sh`) has the helper functions used for API setup (`login`, `call`, `register`, `adminlogin`); tokens go to files, never to the terminal.
## Continuation prompt
Printed in the final chat message.
