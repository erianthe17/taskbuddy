# TaskBuddy mobile e2e sweep

Full exploratory e2e pass of the TaskBuddy mobile app, both roles (client and provider), across happy,
negative and edge paths. Bugs are logged as they're found, and settled behaviour becomes Maestro
regression flows.

- **Build under test:** EAS `preview` APK (`com.taskbuddy.app`), installed on the `Medium_Phone` emulator.
  Fixes ship in a new `preview` build, not as OTA updates.
- **Driver:** Maestro (CLI and Maestro MCP) on the emulator. Admin steps go through the admin API with `curl`.
- **Backend:** the deployed API (`https://taskbuddy-kpek.onrender.com`), as-is. Drift from `main` is logged, not fixed by deploying.
- **Out of scope:** iOS, push delivery, the web admin console UI, Stripe-hosted pages, load testing.

## Documents

- [PLAN.md](./PLAN.md): the plan every session follows (§4 standard procedure, §5 slices, §7 end-of-slice protocol)
- [findings.md](./findings.md): bugs and problems, ids `E2E-###`
- [env-state.md](./env-state.md): builds, tooling, emulator baseline, drift, account ledger, wallet balances, deploy facts
- [test-cases/](./test-cases/): one test-case matrix per slice, with results
- [REPORT.md](./REPORT.md): final report, written in Slice 9.2
- Handoffs: [docs/handoff/](../handoff/), one per completed slice

Screenshots for findings go in `evidence/`. Raw logs, APKs, secrets and passing-case screenshots stay
outside the repo, in `C:\Users\morad\.taskbuddy-e2e\`.

## Status board

Handoff is the `docs/handoff/` number, filled in when the slice completes.

| Slice | Name | Status | Handoff |
|---|---|---|---|
| 0.1 | Branch, scaffolding, tooling | Complete | 001 |
| 0.2 | Deployment drift + account/data audit | Complete | 002 |
| 0.3 | EAS preview build, install, baseline | Complete | 003 |
| 1.1 | Login / logout / session | Complete | 004 |
| 1.2 | Registration (both roles) | Complete | 005 |
| 1.3 | Forgot password, onboarding, Google, legal | Complete | 006 |
| 2.1 | Client profile & settings | Complete | 007 |
| 2.2 | Provider profile & settings | Complete | 008 (partial), 009 |
| 2.3 | Account deletion | Complete | 010 |
| 3.1 | Create job: happy paths | Complete | 011 |
| 3.2 | Create job: validation & edge | Complete | 012 |
| 3.3 | My Jobs & job detail | Complete | 013 |
| 4.1 | Verification | Complete | 014 |
| 4.2 | Feed & job detail | Complete | 015 |
| 4.3 | Apply / withdraw / decline | Complete | 016 |
| 5.1 | Hire → escrow held | Complete | 017 |
| 5.2 | Decline & cancel refunds | Complete | 018 |
| 5.3 | Start → tasks → complete → release | Complete | 019 |
| 5.4 | Recommendation engine path | Not started | — |
| 6.1 | Overview reconciliation | Not started | — |
| 6.2 | Withdrawals | Not started | — |
| 6.3 | Top-up, payouts, transfer, vouchers | Not started | — |
| 7.1 | Chat | Not started | — |
| 7.2 | Notifications | Not started | — |
| 7.3 | Reviews | Not started | — |
| 7.4 | Disputes / complaints | Not started | — |
| 8.1 | Double-tap / race sweep | Not started | — |
| 8.2 | Network & server states | Not started | — |
| 8.3 | Device & OS | Not started | — |
| 8.4 | Account-state matrix | Not started | — |
| 8.5 | Authorization & API abuse probes (curl, test accounts only) | Not started | — |
| 9.1 | Full regression run | Not started | — |
| 9.2 | Final report | Not started | — |

## Resuming

Each session starts from the latest file in `docs/handoff/` and the continuation prompt at the end of
the previous slice. Then it follows PLAN.md from the next slice. Slices are committed one at a time on
`test/e2e-full-sweep`. Nothing is pushed or opened as a PR without asking.

