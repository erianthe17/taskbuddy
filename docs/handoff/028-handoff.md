# Handoff 028 — Slice 7.4 Disputes / complaints complete (row 31 deferred)
Date: 2026-10-12   Branch: test/e2e-full-sweep   Last commit: the `test(e2e): complete slice 7.4 disputes` commit that adds this file

## Completed this slice
- Cases: 32 total (31 matrix + 1 exploratory): 23 pass / 8 fail / 1 blocked / 0 N-A (docs/e2e-sweep/test-cases/7.4.md).
  - **Row 31 is Blocked and deferred.** No completed job is past its warranty. Run it on J1 after 2026-10-14T12:04Z, once J1 has auto-released.
- **Matrix change:** every row that named J1 ran on C1b. Filing a complaint on J1 would freeze its escrow and spoil the pending 5.3-15 auto-release check.
- ORCH ran:
  - API rows 06, 08 and 27–30;
  - money rows 24–26, including the device part of 24;
  - re-judgements of row 29 (Fail → Pass; the label defect is E2E-160) and of row 08's raw-length edge (Pass, because the app's reasons are fixed options and users can't type a reason).
- **Complaints work for UAT:**
  - filing works for both roles; escrow goes held → disputed with no wallet change;
  - duplicate, boundary and non-participant probes are refused;
  - statements with job-chat text and photo evidence work, and evidence is limited to your own messages;
  - completing a job with an open complaint keeps the payment frozen and says so;
  - admin refunds and releases each move money exactly once:
    - F1 +300 to c1;
    - F2 +300 to c1;
    - C1b p1 +255.00 (commission 45.00 at 0.15);
  - "reviewed" is refused while money is held, second resolves are refused, and a closed case can be appealed (it reopens).
- New findings:
  - **E2E-162 (S3 backend-bug): after a refund on a confirmed job, the job stays active (Cancel Job / Start Job) with nothing held.** Needs a product decision on the end state.
  - E2E-160 (S4 ux): with Appeal selected, the button still says "Submit statement".
  - E2E-161 (S4 ux): the provider's filing screen subtitle names the provider themself.
  - E2E-163 (S4 backend-bug): the API accepts a new complaint on a job whose complaint was already decided.
- Re-checked or extended, without new ids:
  - E2E-109: still present on both roles;
  - E2E-133: complaint draft lost on leaving;
  - E2E-033: filing screen labels;
  - E2E-112: raw decision text;
  - E2E-114: the status screen doesn't auto-refresh after a decision (7.4-X01);
  - E2E-154: validation before ownership.
- Solved this slice: none.
- New flow: `mobile/maestro/flows/p7_complaint_closed_status_client.yaml` (read-only, C1b). Green on run 1, 2026-10-12: `mt.sh: OK` (`~/.taskbuddy-e2e/logs/7.4/flow-run1.log`). Crash sweep: 0 lines since the reboot (`~/.taskbuddy-e2e/logs/7.4-logcat.txt`).

## Haiku packets this slice
- 8 device packets (P1, P1b, P2–P7), 1 flow packet, 1 matrix packet (8.2, pipelined).
- **P1 stopped on an ANR.** The emulator had degraded after ~11.5 h uptime: DNS failed, and both TaskBuddy and Google Calendar hit input-dispatch ANRs. ORCH classed it as environment, cold-rebooted the emulator, and re-ran the provider halves as P1b. No other §3b gate failures.

## Environment state right now
- Installed build: `fbe63d63…` (versionCode 1), sha256 `75b611c2…426c4`.
- **Emulator cold-rebooted at about 09:45 Manila on 2026-10-12.** The timezone was restored, devstate is OK, and `auto_time_zone` is still 0 (restore in 9.1).
- Backend: health db up, ml down (E2E-001).
- **Ledger:**
  - c1 47,523 / 47,523 / in_escrow 1,400;
  - p1 255 / 255 / 1,400;
  - c2 150 / 150 / 0;
  - p2 560.45 / 560.45 / 0.
  - No pending withdrawals.
- **Jobs:**
  - **J1 `1e4de8e9…` (₱500, untouched, auto-release 2026-10-14T12:03:57Z);**
  - R4 `3ed811c9…`, R5 `4efd0df7…`, R10 `96fb61a7…` (₱300 each, completed and reviewed, auto-release about 2026-10-14T23:59Z to 2026-10-15T00:00Z);
  - C1b released;
  - F1 confirmed but refunded (E2E-162; leave it, since it's the evidence);
  - F2 completed and refunded;
  - O1 cancelled;
  - every complaint is closed.
- `GET /admin/commission` = 0.15 with `updated_at` 2026-10-12T02:40:53Z, set by someone other than the sweep. The value is unchanged.

## Open blockers / escalations awaiting the user
- **First thing after 2026-10-14T12:04Z:**
  1. Run deferred check 5.3-15. J1 auto-release gives p1 +425.00, commission 75.00, c1 in_escrow −500.
  2. Run 7.4-31 on J1: a complaint after the warranty is refused, and the button is absent.
  3. After about 2026-10-15T00:01Z, R4, R5 and R10 should auto-release (p1 +255.00 each).
- E2E-131: enable Stripe Connect in the sandbox account.
- Fix approvals (money-screen UI): E2E-105, 119, 120, 128, 129, 130.
- Allowed-scope fixes batched for a rebuild: E2E-111, 112 (app half), 115, 122, 123, 124, plus E2E-132, 137, 138, 139, 140, 155, 157 (app half), 160, 161.
- Product decisions:
  - E2E-133, E2E-141, E2E-159 (carried);
  - **E2E-162 (end state of a refunded pre-completion job).**
- Carried:
  - E2E-070 (High);
  - real-provider notifications once ML is up;
  - E2E-078; E2E-084;
  - sign-offs for E2E-046/047, 056/057, 066, 087, 099, 109.

## Next slice
- **8.1 Double-tap / race sweep.** The matrix is drafted (`test-cases/8.1.md`, 8 rows), not yet reviewed. Most buttons were covered in earlier slices; its Data note lists them.
  - Review its fixtures: no-budget jobs plus one ₱300 hire (decline refund) and one ₱10 withdrawal (cancel). That's 2 money rows.
  - Candidate (a): the provider app has no "withdraw application" control. Check `mobile/README.md` "What's Not Wired Yet" before logging it.
- **8.2 Network & server states:** the matrix is drafted (`test-cases/8.2.md`, 19 rows). It needs burners and an admin suspend/reinstate of a burner. Maintenance mode (row 18) stays Blocked unless the user's prompt says "maintenance mode approved".
- Pipeline the 8.3 matrix during 8.1's first packet.
- **Emulator health:** reboot proactively before about 10 h of uptime (the last boot was about 09:45 Manila, 2026-10-12).

## Gotchas learned this slice
- The emulator degrades after about 11 h. Symptoms are `dns=fail` that doesn't clear and ANRs in several apps, so reboot it rather than retry. A first `Start-Process` right after `adb emu kill` can exit silently; check that the process exists and relaunch.
- Job tasks come back under `job_tasks` (not `tasks`) in `GET /jobs/:id`.
- The admin resolve body is `{"resolution":"released_to_provider|refunded_to_client|reviewed","note":"…"}`. "reviewed" is refused while money is held; a released or refunded escrow refuses money-moving resolves.
- Don't use shell variable `D` alongside `api.sh`: it overwrites the token path.

## Continuation prompt
```
Continue the TaskBuddy mobile e2e sweep as the orchestrator. Read docs/handoff/028-handoff.md, then
follow docs/e2e-sweep/PLAN.md from Slice 8.1 — Double-tap / race sweep. You own the startup checklist,
admin/money actions, triage, fix specs and commits; dispatch Haiku 5.5 subagents per §3/§3a with the
brief in docs/e2e-sweep/HAIKU-BRIEF.md, and gate every packet per §3b. Chain slices; stop only on the
PLAN header's stop conditions.
```
