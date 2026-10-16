# Handoff 032 — Synced with main after the Xendit switch

Date: 2026-10-17   Branch: test/e2e-full-sweep

## What changed upstream
- #87 merged and deployed (`/health` commit 75016b9). #89 (409 capacity) and #90 (Xendit, no
  wallet, price tiers, credentials, photo evidence, Terms v2) merged 2026-10-16, NOT deployed.
  Migrations 0053–0059 are already applied, so the live API is behind the DB (task ticks broken live).

## Done this session
- Merged origin/main into test/e2e-full-sweep. Marked 5.3-15 and 8.4-06/08/09/11 Obsolete;
  findings.md "Superseded by PR #90"; PLAN.md slice 9 re-scoped.
- feat/mobile-post-uat merged with main, wallet/payout/budget work dropped, pushed as a draft PR,
  backend handoff written at docs/backend-handoff-mobile-post-uat.md.
  (Fill in the PR number and the M/B check counts from Task 5.)

## Gate for slice 9
See PLAN.md "Slice 9 re-scope". Check `/health` commit >= 2ee8243 first.

## Still open
- Product decisions: E2E-133, 141, 159, 162, 164, 168. Carried: E2E-070, 078, 084; sign-offs for
  E2E-046/047, 056/057, 066, 087, 099, 109.
- Batched allowed-scope fixes E2E-111..167 (see 031): re-check each against the new build; drop any
  whose screen was deleted by #90.
- Change-request price path and early release are still wallet-era and flag-off (see the backend
  handoff doc, "Mobile follow-up").
