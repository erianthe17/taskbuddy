# Handoff 012 — Slice 3.2 Create job: validation & edge complete
Date: 2026-10-10   Branch: test/e2e-full-sweep   Last commit: the `test(e2e): complete slice 3.2 …` commit that adds this file

## Completed this slice
- Cases: 112 total (110 planned + 2 exploratory) — 89 pass / 18 fail / 5 blocked / 0 N-A (docs/e2e-sweep/test-cases/3.2.md)
- New findings:
  - E2E-059 — auto-drafted description/title can exceed limits and block Next (S3, Open)
  - E2E-060 — "Discard job draft?" on an untouched wizard (S4, Open)
  - E2E-061 — a non-image file in the picker does nothing and says nothing (S4, Open)
  - E2E-062 — budget accepts "1e3"/"0x10" and has no ceiling (S4, Open)
  - E2E-063 — over-range budget shows raw "numeric field overflow", now confirmed in-app (S4, Open)
  - E2E-064 — stale validation messages stay after the problem is fixed (S4, Open)
  - E2E-065 — address errors show raw validator text (S4, Open)
  - E2E-066 — `'; DROP TABLE jobs; --` title blocked by an edge filter, app says HTTP 403 (S4, Open, infra)
  - E2E-067 — double tap on Next shows the next step's validation error on arrival (S4, Open)
  - E2E-068 — 11-digit budget clips its first digit behind ₱ (S4, Open)
  - E2E-069 — a valid photo picked together with an unreadable file attaches nothing, silently (S3, Open)
  - **E2E-070 — one Post Job tap after an offline failure created two jobs (S2, Escalated)**
  - E2E-071 — the review step leaves out the description (S4, Open)
- Solved this slice: none (no app fixes in scope were made).
- New/changed flows: `mobile/maestro/flows/p3_jobs_create_double_tap_post.yaml` (new) — green 2026-10-10, maestro exit 0 (`~/.taskbuddy-e2e/logs/3.2/flow-double-tap-opus.log`). `p3_jobs_create_validation.yaml` unchanged, green earlier in the slice.

## Process change this slice (Haiku pilot)
- The sweep now runs with Opus as orchestrator and Haiku 5.5 implementors (PLAN.md header, §3, §3a, §3b; brief in `docs/e2e-sweep/HAIKU-BRIEF.md`). User decisions 2026-10-10: chain slices, Haiku drafts matrices, Opus specs fixes.
- Pilot result: 5 packets (P1, P2, P2b, P3, P4). No packet failed a §3b gate. P2 stopped correctly on its own STOP rule because the orchestrator's photo fixtures were ambiguous (fixed with labelled images). 3.2-82 was redone by Opus because Maestro `launchApp` re-grants permissions. Pilot rule passes, so the sweep continues on this model.
- E2E-070 decision (user, 2026-10-10): log and continue. PLAN.md §5 now has a duplicate-POST re-check in 5.1, 6.2 and 8.1 (S1 if it duplicates money).

## Environment state right now
- Installed build: `fbe63d63-018d-433e-bbda-d071586da894` (versionCode 1), sha256 `75b611c2…426c4`. Emulator at baseline (`devstate.sh` OK: wifi/data on, font 1.0, auto time on, night off, READ_MEDIA_IMAGES granted). New labelled images `p2a_A.png`, `p2b_B.png`, `p2c_WEBP.webp`, `p2d_GIF.gif`, `p2e_fake.jpg` in `/sdcard/Pictures` (mtimes 02:31-02:35 on 2026-10-10).
- Backend: health db up, ml down (429, E2E-001). No new drift.
- Accounts & data: wallets unchanged (client 49,500 available, 500 frozen; client2, provider, provider2 0). Every job of `maestro.client@` and `maestro.client2@` is cancelled. Still alive: `maestro.burner.ep1791457159659@taskbuddy.test` (9.2 cleans it).
- Tooling: `~/.taskbuddy-e2e/api.sh` (Haiku-safe, `SLICE=<x.y>`), `~/.taskbuddy-e2e/opus/opus-api.sh` (admin, Opus only), `~/.taskbuddy-e2e/devstate.sh`; wizard fragments `w_step2/3/4.yaml`, `w_3to5.yaml`, `budget.yaml` in `scratch/3.2/`.

## Open blockers / escalations awaiting the user
- E2E-070 (S2): needs a backend/transport decision on idempotency for `POST /jobs` (and other POSTs). Logged, not blocking.
- Carried over: backend sign-off for E2E-046/047, product calls E2E-056/057, budget-required question, E2E-066 infra sign-off.

## Next slice
- **3.3 My Jobs & job detail.** (1) Startup check (devstate, APK sha, backend warm, client and client2 logins via `api.sh` with `SLICE=3.3`). (2) Haiku packet drafts `test-cases/3.3.md` from `HOMyJobs.tsx`, `HOJobDetailScreen.tsx`, `HOJobApplicationsScreen.tsx` and the jobs DTOs, citing file:line; Opus reviews and groups packets. (3) Fixtures: an open job for `maestro.client@` via `POST /jobs` (budget 300), `maestro.client2@` stays empty for the empty-state rows; an admin-cancelled job for the "unavailable job" card (Opus does the admin cancel).
- Note for 3.3: the client's My Jobs list now holds about 30 cancelled "Plumbing: Fix leaking faucet" jobs — the list/filters rows should account for that (or use client2 for clean-list checks).

## Gotchas learned this slice
- Maestro `launchApp` re-grants runtime permissions; relaunch with `am start` to test a revoked one.
- Photo picker: labelled fixtures with distinct mtimes (`touch -d 2026-10-10T02:31:00`), tile points verified by screenshot first.
- `hier.sh` needs `PYTHONIOENCODING=utf-8:replace`.
- Secret scans must gate the commit (`if … grep; then stop; else commit; fi`), never be chained with `;`.
- All also in `mobile/maestro/README.md` ("Slice 3.2 notes") and `HAIKU-BRIEF.md`.

## Continuation prompt
```
Continue the TaskBuddy mobile e2e sweep as the orchestrator. Read docs/handoff/012-handoff.md, then
follow docs/e2e-sweep/PLAN.md from Slice 3.3 — My Jobs & job detail. You own the startup checklist,
admin/money actions, triage, fix specs and commits; dispatch Haiku 5.5 subagents per §3/§3a with the
brief in docs/e2e-sweep/HAIKU-BRIEF.md, and gate every packet per §3b. Chain slices; stop only on the
PLAN header's stop conditions.
```
