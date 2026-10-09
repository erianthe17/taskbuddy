# Full e2e + exploratory sweep of the TaskBuddy mobile app (EAS preview build + Maestro)

## Context

The mobile app has been through a big UI redesign (PR #78), `react-native-maps` has been removed (the old
BUG-004 crash), and many QA rounds have shipped since the last Maestro sweep (Sept 2026). None of this has
been checked end-to-end against a **release-mode** build. The goal is a full exploratory e2e pass of
**both roles** across happy, negative and edge paths. The pass runs on an **EAS `preview` APK** installed
on the `Medium_Phone` emulator and is driven through Maestro (CLI + Maestro MCP). Bugs are documented as
they're found, and settled behaviour is locked in as regression flows.

User decisions (2026-10-08):
- **Backend:** the deployed API (`https://taskbuddy-kpek.onrender.com`), as-is. Drift from `main` is
  checked and logged. It is not fixed by deploying.
- **Admin:** the user provides an admin test account in a file **outside the repo**. Admin steps go
  through the admin API with `curl`.
- **Git:** branch `test/e2e-full-sweep`, with a commit at the end of each slice. The repo is
  **PUBLIC**, so no secrets go in. No push or PR without asking.
- **Fix delivery:** a new `eas build --profile preview`. Fixes are batched. No OTA updates.

**Implementor:** Sonnet 5.5 (medium effort) is the main/orchestrator agent. It may spawn subagents
(see §3). Follow this plan as written. Where it doesn't cover something, the escalation rules in §6
decide.

**Hard rule, every slice:** finish the slice → write the handoff → commit → print the continuation
prompt → **STOP** (end the session turn; do not start the next slice).

---

## 1. Known environment facts (verified 2026-10-08, re-verify in Phase 0)

- EAS CLI 24.8.0 is installed, logged in as `mclector`, with Admin on org `taskbuddy-android`
  (the app's `owner`).
- `eas.json` profile `preview` is `distribution: internal`, `channel: preview`, `android.buildType: apk`.
  App id: `com.taskbuddy.app`. Scheme: `taskbuddy`.
- `eas build --local` is **not supported on Windows**. Use cloud builds only.
- The AVD `Medium_Phone` exists. No emulator is running right now. Maestro lives at `~/.maestro/bin`
  and is **not** on the PowerShell PATH. In Git Bash, use the env block in `mobile/maestro/README.md`.
- `mobile/.env` does not exist, so the build defaults to the deployed API (`mobile/src/lib/api.ts:22`).
- HANDOFF.md (2026-10-02) lists the known deployed-state problems: the ML service returned 429, the
  Stripe webhook never succeeds (top-ups don't credit), and `main` has undeployed backend fixes
  (migration 0038, skill gating, task gating, cancellation evidence). **Expect these to show up as
  findings.** Tag them `deploy-drift` or `env`. They are not new app bugs.
- Existing harness to reuse: `mobile/maestro/flows/_helpers/{launch_fresh,login_client,login_provider}.yaml`,
  13 existing flows, and the selector traps in `mobile/maestro/README.md` "Known selector traps". Read
  that section before writing any flow.
- Test accounts: `maestro.client@taskbuddy.test` / `maestro.provider@taskbuddy.test`, password
  `TestPass123!` (already public in the repo; test domain only).
- The old bug log `mobile/maestro/bug-log.md` (BUG-001…005) is history. Don't renumber it. The new
  sweep uses its own `E2E-###` ids.

## 2. Artifacts (create in Slice 0.1)

| Path | Purpose |
|---|---|
| `docs/e2e-sweep/README.md` | Sweep overview + **status board** (table of every slice: Not started / In progress / Complete + handoff #) |
| `docs/e2e-sweep/findings.md` | **The bug/problem document.** Two sections: `## Open` and `## Found & solved`, plus a summary count table at the top |
| `docs/e2e-sweep/env-state.md` | Build IDs/APK version installed, drift table, test-account ledger (emails only), wallet balances at slice start/end |
| `docs/e2e-sweep/test-cases/<slice-id>.md` | Per-slice test-case matrix + results (e.g. `test-cases/3.2.md`) |
| `docs/e2e-sweep/evidence/` | Screenshots copied from `~/.maestro/tests/...`, named `E2E-###-<short>.png` |
| `docs/handoff/###-handoff.md` | One per **completed slice**, numbered sequentially across the whole sweep: `001-handoff.md`, `002-handoff.md`, … |
| `mobile/maestro/flows/p<phase>_<area>_<behaviour>.yaml` | New regression flows (e.g. `p3_jobs_create_validation.yaml`) |
| `C:\Users\morad\.taskbuddy-e2e\` (OUTSIDE repo) | `secrets.env` (user-provided: `ADMIN_EMAIL=`, `ADMIN_PASSWORD=`), `builds\*.apk`, `logs\*.log`, test images |

**No-secrets rule (public repo):** never write tokens, the admin password, Supabase keys, Stripe keys or
anything from `backend/.env` into any repo file, handoff, finding, commit message or screenshot name.
Hold the admin bearer token only in a shell variable. Before every commit, run
`git diff --cached | grep -iE "eyJ|sk_|pk_live|service_role|ADMIN_PASSWORD"`. It must print nothing,
otherwise **stop and remove the match**.

### findings.md entry template
```markdown
### E2E-### — <one-line title>
- **Found:** <date>, slice <x.y>, case <TC id>   **Role:** client|provider|both
- **Category:** app-bug | backend-bug | deploy-drift | env | ux | harness
- **Severity:** S1 critical (crash / money wrong / core flow dead) | S2 high | S3 medium | S4 low/cosmetic
- **Status:** Open | Workaround (how) | Solved (commit sha) | Fixed-on-main-not-deployed | Escalated
- **Steps:** 1… 2… 3…
- **Expected:** …   **Actual:** …
- **Evidence:** `evidence/E2E-###-x.png`, logcat excerpt if crash (`adb logcat -d -t 300 *:E`)
- **Suspected cause:** file:line if known (read-only investigation), otherwise "not investigated"
- **Solution (if solved):** what changed, the test that covers it, the build that verified it
```
Solved items move from `## Open` to `## Found & solved` and keep their id.

### test-cases/<slice>.md template
```markdown
# Slice <x.y> — <name>
Build: <EAS build id / app version>   Date: <date>   Accounts: <emails>
| TC | Type | Title | Steps (short) | Expected | Result | Finding | Flow |
|----|------|-------|---------------|----------|--------|---------|------|
| 3.2-01 | happy/negative/edge/ux/security | … | … | … | Pass/Fail/Blocked/N-A | E2E-### | p3_….yaml |
```

## 3. Agent orchestration

**Main agent (Sonnet 5.5):** owns the plan, the **emulator (exclusive lock)**, all `maestro`/`adb`
interaction, triage decisions, fixes, commits, handoffs. **Only the main agent may drive the device.**
Flows share accounts, jobs, escrow and wallet state, so two drivers corrupt each other.

**Spawn subagents with the Agent tool. Never let a subagent drive the device, commit, or spawn more agents.**

| Use `model: "haiku"` (Haiku 5.5) for mechanical/bounded work | Use `model: "sonnet"` for judgment-light-but-reasoning work |
|---|---|
| `maestro check-syntax` over a list of flow files and report failures | Draft the slice's test-case matrix from the screen source + `backend/BACKEND_SCHEMA.md` + DTOs (read-only) |
| Build a testID / visible-text inventory for given screen files (grep `testID=`, button labels) | Write regression flow YAML from settled, passing exploration steps (it writes files; the main agent runs them) |
| Summarise a long log (EAS build log, `adb logcat` dump) to the error lines | Read-only root-cause investigation of a finding (returns file:line + hypothesis, no edits) |
| Read-only API state checks via `curl` GET (wallet, jobs, notifications) given a token passed in the prompt — *never* mutating calls | Review a fix diff against the finding before commit |
| Format raw notes into findings.md entries / fill the handoff skeleton from `git diff --stat` + test-case files | |
| Route-drift probe (Slice 0.2) | |

Parallelism: subagents run in the background while the main agent explores the device. Typical slice:
spawn a Sonnet test-design agent for the **current** slice first (wait for it), then while exploring,
spawn Haiku agents for inventory, syntax checks and log summaries. Give every subagent prompt the
absolute paths, the exact output file or format wanted, and "read-only except <file>".

## 4. Standard slice procedure (every slice, in order)

1. **Load state:** read the latest `docs/handoff/###-handoff.md`, `docs/e2e-sweep/README.md` (status board),
   `docs/e2e-sweep/findings.md` (Open section), and this plan's section for the slice.
2. **Session startup checklist** (skip what Slice 0.x hasn't set up yet):
   - Bash env: `export JAVA_HOME="/c/Program Files/Android/Android Studio/jbr"; export ANDROID_HOME="$LOCALAPPDATA/Android/Sdk"; export PATH="$PATH:$HOME/.maestro/bin:$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator"`
   - Emulator up: `adb devices` shows `emulator-5554  device`. If not, boot it **detached**:
     PowerShell `Start-Process "$env:LOCALAPPDATA\Android\Sdk\emulator\emulator.exe" -ArgumentList '-avd','Medium_Phone' -WindowStyle Minimized`,
     then poll `adb shell getprop sys.boot_completed` until it returns `1` (Monitor/until-loop, not sleep).
   - `adb shell settings put secure autofill_service null` (Password Manager overlay trap).
   - Installed build is the expected one. Preview builds don't auto-increment `versionCode`, so compare
     `adb shell dumpsys package com.taskbuddy.app | grep lastUpdateTime` **and** the installed APK's
     SHA-256 (`adb shell "sha256sum $(pm path com.taskbuddy.app | sed 's/package://')"`) against the
     values recorded in `env-state.md` for the current build.
   - Clear the logs for this session: `adb logcat -c`.
   - Warm the backend: `curl -s -m 90 https://taskbuddy-kpek.onrender.com/health` returns JSON (repeat once if it times out; a 30–60s cold start is expected).
   - Maestro MCP: `list_devices` returns the emulator id.
3. **Design cases:** spawn a Sonnet subagent to draft `docs/e2e-sweep/test-cases/<slice>.md` from the
   slice's screen files and the case list in §5, applying the **checklist in §4a**. Review it and add
   anything missing. Every row starts as `Result` = blank.
4. **Explore and execute** each case on the device. Use Maestro MCP `inspect_screen` → `run` with
   inline YAML (one coherent sequence per call) and `take_screenshot` for evidence. Verify server-side
   effects with `curl` where the case touches data (wallet, job status, escrow).
   Write each result into the test-case file **as you go**.
5. **Log findings immediately** in `findings.md` (template §2). Copy evidence to `docs/e2e-sweep/evidence/`.
   Commit **only finding evidence**, not screenshots of passing cases (repo bloat). Keep those in `~/.maestro/tests`.
   For crashes and transient glitches, record video with `adb shell screenrecord /sdcard/e2e.mp4`
   (≤180s), pull it to `~/.taskbuddy-e2e/logs/`, and don't commit it.
6. **Blocker triage** (§6). Workaround if one exists → log it and continue. Fix only if testing can't
   continue without it and the fix is inside the allowed fix scope.
7. **Automate:** for each behaviour settled as **correct** (Pass cases, plus fixed bugs), have a
   Sonnet subagent write flows into `mobile/maestro/flows/`. A Haiku agent then runs
   `maestro check-syntax <file>` on each. The main agent runs each new flow **one file per `maestro test`
   invocation**, and each must pass. Don't freeze a behaviour you're unsure is correct; log it as `ux`
   "needs product sign-off" instead.
8. **Crash sweep** before closing: `adb logcat -b crash -d` and `adb logcat -d ReactNativeJS:E AndroidRuntime:E *:S`.
   Any FATAL/JS error not already explained by a finding → a new finding (S1 if it's a crash).
   Save the excerpt to `~/.taskbuddy-e2e/logs/<slice>-logcat.txt`.
9. **Exit criteria:** every case has a terminal Result (Pass / Fail+finding / Blocked+finding / N-A+reason),
   findings are logged, new flows are green, the crash sweep is clean or logged, and the status board is
   updated.

**Mid-slice save point (not a handoff):** after every ~5 executed cases, set the status board row to
`In progress — last case <TC id>` and make sure the test-case file is written. If a session dies
mid-slice, the next session resumes the slice from the first blank Result. It doesn't count as
complete and doesn't get a handoff.

### 4b. Data & fixtures (state does not survive between sessions)
- **Never rely on jobs or applications left by an earlier session.** By then their recommendation
  deadline has passed (`recommending`) and the ML or other slices may have touched them. Each slice
  that needs a job/application/hire creates its **own fixtures at slice start through the same public
  API the app uses** (client token: `POST /jobs`; provider token: apply, etc.; look up the exact DTOs).
  Record fixture ids in the test-case file header. The UI itself is still what's being tested;
  fixtures only set up preconditions.
- **Use small budgets** (₱300–₱800) for fixture jobs so the seeded wallet lasts the whole sweep. Check
  the client's `available` at slice start. Below ₱5,000 → top up via recovery-credit (§6 limits) and
  record it.
- **Regression flows must be re-runnable:** unique titles per run (`- evalScript: ${output.RUN = Date.now()}`,
  then `"Maestro job ${output.RUN}"`), and each flow cancels or deletes what it created, or tolerates
  leftovers.
- **Burner accounts:** `maestro.burner.<slice>.<n>@taskbuddy.test`. If Slice 0.2 finds Confirm-email
  **ON**, burners can't be confirmed without SQL. **STOP and ask the user** to run the confirm SQL from
  `mobile/maestro/flows/00_setup_test_accounts.md` §2 (batch every burner needed for the next phases
  into one ask). Also mind the Supabase 4-emails/hour cap.
- **Auth rate limit** is 10/min per route. If any call returns 429, wait 65s, retry once, and don't log
  it as a bug (except in the dedicated case in 1.1).
- **Maestro `inputText` on Android is unreliable for non-ASCII** (emoji, ñ, ₱). Test unicode rendering
  by creating that data through the API and viewing it in the app. If typing it in-app fails, log a
  `harness` note, not an app bug.
10. **Handoff** → **commit** → **continuation prompt** → **STOP** (§7).

### 4a. Test-design checklist (apply to every screen and form)
- **Happy path** for each role that can reach the screen.
- **Required fields:** empty, whitespace-only, leading/trailing spaces (are they trimmed?).
- **Boundaries:** min-1 / min / max / max+1 length, taken from `backend/src/**/dto/*.ts`. Check the
  mobile limit matches the DTO; a mismatch is a finding.
- **Content:** unicode, emoji, Taglish (`Paayos ng gripo sa CR`), `<script>`, `' OR 1=1 --`, very long
  unbroken strings (layout).
- **Numbers/money:** 0, negative, decimals (`.5`, `100.555`), commas, `₱` prefix, huge (`99999999`),
  non-numeric. Check displayed totals against `GET /wallet` exactly.
- **Dates/times:** past, now, far future, timezone (Asia/Manila) display.
- **Duplicates:** submit twice (double-tap), re-submit after success, duplicate entity (same email,
  apply twice).
- **State/permissions:** actions on wrong-status entities, the other role's data, stale screen after
  the other role changed state (pull-to-refresh/re-open).
- **Empty / loading / error states:** no data, slow backend, API error copy (no raw JSON, no
  "Internal server error").
- **Navigation:** in-app back, hardware back, leaving mid-form and returning (draft kept or cleared?
  Is it sensible?).
- **UX/copy/layout:** truncation, overlap with system bars or keyboard, inconsistent wording between
  roles, misleading labels, inert buttons. Check `mobile/README.md` "What's Not Wired Yet" and
  HANDOFF.md "Product decisions" first; documented-inert items are N-A, not bugs.
- **Accessibility (S4 unless it blocks use):** icon-only buttons with no label in `inspect_screen`,
  tap targets visibly smaller than ~48dp, text under the 1.3 font scale clipped.
- **Performance (ux):** on a warm backend, note any screen taking more than ~3s to show content, or
  any spinner with no timeout or error path.

**Maestro typing rule:** avoid doubled letters in `inputText` (e.g. "rr") until Slice 0.3 confirms the
dev-only reload shortcut is gone in the release build. Avoid phone-shaped strings followed straight away
by a tap (ENV-001 Gboard chip). If it's needed, `pressKey: Enter` first.

## 5. Phases and slices

Each slice lists **scope**, **key cases** (minimum; the §4a checklist adds more), and **exit notes**.
Screen files live under `mobile/app/(auth|homeowner|provider)/screens/`.

### Phase 0 — Environment & preview build

**Slice 0.1 — Branch, scaffolding, tooling**
1. `git checkout main && git pull --ff-only && git checkout -b test/e2e-full-sweep`. If the working
   tree isn't clean, stop and report.
2. Create every §2 repo file from its template: README with a status board listing all slices below,
   empty findings.md with the summary table, env-state.md. Create `docs/handoff/`. Copy this plan
   verbatim to `docs/e2e-sweep/PLAN.md`; from now on every session reads the plan **from there**.
3. Create `C:\Users\morad\.taskbuddy-e2e\{builds,logs,images}`. Check that `secrets.env` exists with
   `ADMIN_EMAIL`/`ADMIN_PASSWORD`. **If it's missing, STOP and ask the user to create it.** Don't continue
   into 0.2 without it. (0.1 may still complete without it.)
4. Prepare test images in `images\`: copy `mobile/assets/icon.png` and `splash-icon.png`, plus a large
   (>10 MB) generated image (PowerShell `System.Drawing` or a downloaded sample, stored in its own
   empty dir), plus a `.txt` renamed `.jpg` for a negative upload case.
5. Boot the emulator (startup checklist) and confirm `maestro --version` in Bash.
6. Emulator baseline: timezone Asia/Manila (`adb shell getprop persist.sys.timezone`; if different,
   `adb shell setprop persist.sys.timezone Asia/Manila` and reboot the emulator), automatic date/time
   on, font_scale 1.0, night mode off. Record the originals in env-state.md so 9.1 can restore them.
Exit: files exist, emulator boots, tooling versions and emulator baseline recorded in env-state.md.

**Slice 0.2 — Deployment drift + account/data audit**
1. Drift probe (Haiku subagent): list every route in `backend/src/**/*.controller.ts` (`@Controller`
   prefix + `@Get/@Post/@Patch/@Put/@Delete` path). For each, send an **unauthenticated** request with
   the same method to the live API with `curl -s -o /dev/null -w "%{http_code}"`. `404` means the
   route is **missing on deployed** (drift); `401/403/400` means it exists. For POST/PATCH send an empty
   JSON body only; never send a valid payload. Output a table into env-state.md "Drift".
2. Log each missing route that the mobile app calls (grep `mobile/src/lib/api.ts` for the path) as an
   `E2E-###` `deploy-drift` finding.
2b. **DTO-field drift** (Haiku subagent). The API uses `forbidNonWhitelisted`, so a field the current app
   sends to an older deployed DTO is a hard 400 for every user. For each mutating endpoint the app
   calls, list the fields `mobile/src/lib/api.ts` sends. For each field added recently (check
   `git log -S<field> -- backend/src/**/dto` for commits after Sept 2026, and always check
   `POST /auth/register`'s `category_id` and `consented_*`), send a **deliberately invalid** request:
   valid auth where the route needs it (test-account token), a body containing **only** that field
   with a junk value, and nothing else. Validation runs before any write, so nothing is created. If the
   response message contains `property <field> should not exist`, the deployed DTO lacks it →
   `deploy-drift` finding, S1 if it's registration/hire/job-create. Record the table in env-state.md.
3. `GET /health` → record the db and ml status. ML down → `env` finding (affects Slice 5.4).
4. Admin login: read `~/.taskbuddy-e2e/secrets.env` (lines are `KEY:value` or `KEY=value`; parse with `sed -E "s/^KEY[:=]//"`, never print them), then `POST /auth/login` with the admin creds.
   Store the token in `$ADMIN_TOKEN` (shell only). Confirm `GET /admin/analytics/summary` → 200.
5. Audit the test accounts via `POST /auth/login` and `GET /auth/me` (there is no `GET /profiles/me`) and `GET /wallet` for
   `maestro.client@` and `maestro.provider@`. Missing → register via `POST /auth/register` (look at
   `RegisterDto` for the exact fields, incl. `category_id` and `consented_*` for the provider).
   Also create **`maestro.provider2@taskbuddy.test`** (a second provider for multi-applicant cases)
   and **`maestro.client2@taskbuddy.test`** (an unfunded client for insufficient-balance cases).
6. Provider readiness: does `maestro.provider@` have a `provider_profiles` row and `is_verified`? Do
   both providers have an address with coordinates (needed by the feed's distance filter)? Record it,
   don't fix it here. Profile completion is in 2.2, verification in 4.1.
6b. **Confirm-email state:** register one burner via `POST /auth/register`. A session in the response
   means Confirm-email is OFF. No session means it's ON → apply the burner rule in §4b. Delete the burner
   afterwards if it got a session (`DELETE /profiles/me`).
7. Wallet funding: if the client's `available` is below ₱20,000, credit it via
   `POST /admin/wallet-transactions/recovery-credit` `{profile_id, amount: 30000, title: "Maestro e2e seed"}`
   (max ₱50,000; never fund a non-`@taskbuddy.test` account). Record before/after balances.
8. Clean up leftovers: any open/assigned jobs on the test accounts from old sweeps. Use the admin
   bookings view (`GET /admin/bookings?search=Maestro`). List them in env-state.md. Cancel only jobs
   owned by test accounts (`POST /admin/bookings/:id/cancel`).
Exit: drift table, account ledger and balances recorded; admin works.

**Slice 0.3 — EAS preview build, install, baseline**
0. EAS builds archive the working tree, so commit first (the build should match a sha). Check the
   account's remaining build quota on expo.dev or from the build output and record it. If fewer than
   5 Android builds remain this month, tell the user in the handoff.
1. Read-only checks: `cd mobile && eas env:list --environment preview` (record whether
   `EXPO_PUBLIC_API_URL` is set; it should be unset or the kpek URL; anything else → stop and report),
   and `eas update:list --branch preview --limit 3` (an existing OTA on `preview` would override the
   build's JS; record it, and if one exists, stop and report).
2. Build **detached**, logging to a file:
   PowerShell `cd mobile; eas build -p android --profile preview --non-interactive --json --no-wait > $env:USERPROFILE\.taskbuddy-e2e\logs\build-1.json`.
   Poll `eas build:view <id> --json` every ~3 min (use Monitor/ScheduleWakeup, not sleep) until the
   status is `FINISHED` or `ERRORED`. `ERRORED` → Haiku summarises the build logs → fix only if it's a
   config typo, otherwise stop and report.
3. Download the `artifacts.buildUrl` APK to `~/.taskbuddy-e2e/builds/<buildId>.apk`.
4. `adb uninstall com.taskbuddy.app` (the dev client's signature differs, so a straight install would fail),
   then `adb install <apk>`. Record versionName/versionCode/buildId, the git sha it was built from,
   the APK SHA-256 and `lastUpdateTime` in env-state.md. Later rebuilds share the same signing key, so use
   `adb install -r`.
5. Launch it. The first real screen must be TaskBuddy's Login. Take a screenshot. Confirm in a throwaway
   inline flow that `inputText: "aabbrrcc"` into the email field no longer reloads the app (the
   dev-only trap). Update the typing rule in the handoff.
6. **Harness adaptation:** run `smoke_login_both_roles.yaml`. If `_helpers/launch_fresh.yaml` or the
   login helpers fail because the release build has no dev-launcher, or because the redesign changed
   copy (e.g. "Welcome!", "Find a service"), fix the helpers (log `harness` findings, Status: Solved).
   Also handle the Android 13+ **notification permission dialog** (`expo-notifications` may request it
   after login): add a guarded `tapOn: {text: "Allow", optional: true}` (or "Don't allow"; pick one
   and document it) to the login helpers. Record the dialog's first appearance as a ux observation
   (is the timing sensible?).
7. **Baseline:** run every existing flow in `mobile/maestro/flows/*.yaml` **one at a time** (Bash loop
   calling `maestro test "$f"` per file, output to `logs/baseline.log`). Skip `00_setup_register_client`
   (it duplicates accounts) and run `settings_delete_account_burner`. Record pass/fail per flow in
   `test-cases/0.3.md`. Failures get a triage line: harness (fix now) vs app regression (finding).
8. **Re-verify the old open and untested items** on the release build, as rows in `test-cases/0.3.md`:
   BUG-001…005 (mobile/maestro/bug-log.md), ENV-001 (the Gboard phone-field jump), first-tap-after-cold-launch
   swallow, the Google sign-in Chrome tab ANR, and the datetimepicker (now that `react-native-maps` is gone;
   if it's reachable, otherwise defer to 3.1). Still present → new `E2E-###` finding that references the old id.
Exit: preview APK installed and recorded, smoke green, baseline table complete.

### Phase 1 — Auth & onboarding (screens: `LoginScreen`, `RegisterScreen`, `ForgotPasswordScreen`, `OnboardingScreen`, `TermsAndConditions`, `GoogleRoleSelectionScreen`, `GoogleSPDetailsScreen`)

**1.1 Login / logout / session.** Login for both roles. Wrong password. Unregistered email. Empty
fields. Malformed email. Uppercase/space-padded email. Password visibility toggle. Logout from both
roles. **Session persistence:** log in, `adb shell am force-stop`, relaunch **without** clearState,
and it should still be logged in. **Account switching:** log in as the client, open Wallet and My Jobs,
log out, log in as the provider. No client data (name, avatar, balance, jobs, notifications)
should appear anywhere, even briefly; screenshot the first screens. Then reverse it. Hardware back on Login exits. First-tap-after-cold-launch swallow
(the old finding: re-check it on the release build). The auth rate limit (10/min) runs **as the last
case only**: 11 rapid wrong-password attempts on `maestro.client2@`, check the error copy, then wait
60s.

**1.2 Registration (both roles).** Happy path for a client and a provider (burners:
`maestro.burner.reg.<n>@taskbuddy.test`). Every field's validation (§4a). Password rules and hints.
Mismatch. Each consent is required (terms/privacy open documents; data-collection is a toggle). The
provider category is required. Duplicate email. Max-length name. If Confirm-email is ON, the OTP step
appears: record it, and mark the code-entry cases Blocked (`env`, no mailbox). After a successful
signup: onboarding slides → home. Delete the burners at the end (Settings → Delete Account).

**1.3 Forgot password, onboarding, Google, legal.** Forgot password: request with a valid email,
an unknown email (no account enumeration leak in the copy), and malformed input; stage 2 is Blocked
(mailbox). Onboarding: Next through every slide, Skip, and the "View tutorial" replay in Help &
Support for both roles. Google button: opens a Chrome custom tab. Stop there; returning via back must
not hang the app (the known ANR is to be re-checked). Terms/Privacy screens scroll, accept, and back.

### Phase 2 — Profile & settings

**2.1 Client profile & settings** (`HOProfile`, `HOEditProfileScreen`, `HOSettingsScreen`). Edit
name/phone/address/city. Invalid address → geocode 400/503 copy. Empty required fields. Phone formats.
Avatar upload: push images first with `adb push <img> /sdcard/Pictures/` and
`adb shell am broadcast -a android.intent.action.MEDIA_SCANNER_SCAN_FILE -d file:///sdcard/Pictures/<f>`,
then valid, non-image and oversize uploads, and permission denied
(`adb shell pm revoke com.taskbuddy.app android.permission.READ_MEDIA_IMAGES`). Settings toggles persist
across a relaunch. Disabled dark mode is inert by design (N-A). Change Password full round trip on a
burner (wrong current, too short, mismatch, success → re-login with the new password). Help & Support
content.

**2.2 Provider profile & settings** (`SPProfileScreen`, `SPEditProfileScreen`, `SPSettingsScreen`,
`SPSkillRequestScreen`, `SPPortfolioScreen`). Same as 2.1 for the provider, plus: skill/secondary-service
request (submit, duplicate, pending state, admin approve/reject via `GET /admin/skill-requests` + the
approve/reject endpoints if they exist in drift), the portfolio screen (corrected in slice 2.2: the portfolio is real CRUD on the
backend and deployed, `GET/POST /providers/me/portfolio`, so test add/edit/remove, limits and access rules), and the "Get Verified"
incomplete-profile warning.

**2.3 Account deletion.** Delete a burner with no data → 204 → logged out → login fails. **Blockers
(409):** a burner client with a balance (fund ₱100 via recovery-credit) shows the blocker list; a
pending withdrawal; a live job. A deleted account cannot log in (copy check).

### Phase 3 — Client jobs (`HOCreateJobScreen`, `HOMyJobs`, `HOJobDetailScreen`, `HOJobApplicationsScreen`, `HOHomeScreen`)

**3.1 Create job: happy paths.** One job per category (Plumbing, Cleaning, Handyman, Manicure, Pedicure)
across all three urgencies. Default vs custom location (address suggestions, keyboard overlap). Task
checklist add/remove. Photos (0, 1, max). Date/time picker (the Android datetimepicker has never been
exercised). Submit → it appears in My Jobs with the right status, budget, urgency and
`recommendation_deadline` (check via `GET /jobs/:id`). Keep 2 open jobs for Phase 4 and cancel the
rest at slice end.

**3.2 Create job: validation & edge.** Each wizard step: Next with nothing selected, empty/long
title/description, budget per §4a, a past date, zero tasks, duplicate tasks, very long task text,
oversize/non-image photo, leaving the wizard mid-way via the back arrow and hardware back (draft
behaviour), and a double-tap on Submit (exactly **one** job created; check via the API).

**3.3 My Jobs & job detail.** List, filters/tabs, empty state (`maestro.client2@`), pull-to-refresh,
the job detail facts layout, the applications screen empty state, cancel an open job (confirm modal,
status, cancelling twice), Cancel Job hidden once all tasks are done (Phase 5 re-checks it),
`POST /jobs/:id/recommendations/trigger` from the UI if exposed, and the "unavailable job" error card
(open a job cancelled by the admin).

### Phase 4 — Provider side (`SPHomeScreen`, `SPJobDetailScreen`, `SPMyJobsScreen`, `SPVerificationScreen`, `SPCalendarScreen`)

**4.1 Verification.** Unverified gating (what an unverified provider can and can't do; use
`maestro.provider2@`). The 3-step flow: ID document + selfie via the gallery (pushed images) and via the
emulator camera. A non-image upload. **If a drift 409 (no `provider_profiles`) blocks submission,
the workaround is to complete Edit Profile first** (it creates the row), then resubmit. If verification
can't be reached at all, check with a fixture apply via the API whether the deployed API even
requires `is_verified` to apply, before declaring 4.3/Phase 5 blocked. Submit → pending banner. Submit again while pending (400 copy).
Admin **reject** via the API → rejected banner and re-submit. Admin **approve** → verified state. A 409
if `provider_profiles` is missing (HANDOFF B; may be drift). Stripe Identity: tap the entry, stop at
the hosted page, and mark the rest Blocked (`env`, webhook broken). End state: `maestro.provider@`
verified.

**4.2 Feed & job detail.** Feed shows the open jobs from 3.1. Sorting by urgency. Category filter,
urgency filter (HANDOFF says server-side may be drift), and location radius (set the location with
`adb emu geo fix 121.0437 14.6760`, then a far location → empty state). Summary counts against
`GET /jobs` `summary`. Pull-to-refresh. Job detail layout. Skill gating: a job outside the provider's
categories is hidden or un-appliable (drift-dependent). Location permission denied.

**4.3 Apply / withdraw / decline.** Apply (proposal fields per DTO + §4a), duplicate apply, withdraw a
pending application, re-apply after withdraw, apply to a job the client just cancelled (stale screen),
a double-tap on Apply (one application), and My Work tabs. Client side: the applications list shows
both providers (`provider` + `provider2` apply to the same job; keep that job for 5.1). Calendar /
availability screens.

### Phase 5 — Cross-role money loop (highest risk; verify every money figure via `GET /wallet` on BOTH accounts and `GET /admin/transactions`)

Before each slice: record both wallets (`balance`, `available`, `pending`). After each step: re-record
them and assert the deltas in the test-case file.

**5.1 Hire → escrow held.** Client accepts provider's application → job `assigned`, the client's
`available` drops by the budget, escrow is `held`, provider2's application is auto-rejected (provider2
sees it), a booking/calendar entry exists on both sides, and both roles get notifications. **Negative:**
`maestro.client2@` (unfunded) hires → 400 insufficient-balance copy, and no state change. **Race:** a
double-tap on Hire → exactly one escrow hold (check the wallet delta and the admin transactions).
Accepting a second application on the same job is impossible.

**5.2 Decline & cancel refunds.** Provider declines an assigned job (reason validation 1–200) → job
`cancelled` and the client's escrow is refunded (exact amount). Client cancels an assigned job →
refund. Cancelling an in-progress job → escrow frozen for admin review (per HANDOFF; may be drift).
Record the observed behaviour.

**5.3 Start → tasks → complete → release.** Provider starts → `in_progress`. Tick tasks (task progress
blocked before Start: check it), and complete only when all tasks are done. Completion → escrow
released → the provider's wallet goes up by budget × (1 − commission) (`GET /admin/commission`; read
it, **never PATCH it**). Use an odd budget (₱777) and check centavo rounding: the app display must
match the ledger exactly → the client's Cancel Job is hidden. Double-tap Complete → one payout. Check
the status labels and progress UI on both roles at every step.

**5.4 Recommendation engine path.** Client posts an **urgent** job (5 min deadline) and nobody
applies. Wait in real time (poll `GET /jobs/:id` every 60s for up to 8 min). The status should flip
to `recommending`, and the provider should get an invite notification. ML down → expect it to stay
`recommending` with no invites. Log it as `env`, then use the manual trigger button/endpoint once.
Expected and actual go in the test-case file either way.

### Phase 6 — Wallet & payments (`HOWalletScreen`, `SPWalletScreen`, `SPPayoutsScreen`)

**6.1 Overview reconciliation.** Every figure on both wallet screens equals `GET /wallet` (balance,
available, in escrow, available to withdraw, spent/added). Transaction list: kinds, signs, titles and
dates for topup/escrow_hold/payout/refund/recovery_credit. Empty state (`client2`). Large-text layout.

**6.2 Withdrawals.** Request (amount §4a: 0, negative, decimals, > available, = available; destination
empty/long) → pending, `available` reduced, listed as pending. Cancel the pending one → restored. Two
pending at once. Admin **reject** with a reason → the reason shows to the user and the amount is
restored. Admin **settle** `{reference}` → balance debited once (settle twice via the API → the second
is refused). A double-tap on Withdraw → one request. The provider withdraws payout earnings from 5.3.

**6.3 Top-up, payouts, transfer, vouchers.** Add Money modal validation, then the Stripe Checkout
opens: stop at the hosted page and mark the credit Blocked (E2E finding for the webhook, `env`). The
provider Payouts/Connect entry stops at the hosted page. The Transfer explanatory modal (unbuilt on
purpose: N-A beyond the modal). The recovery voucher from 0.2 shows in the vouchers section correctly.

### Phase 7 — Post-job & communication

**7.1 Chat** (`HOChatScreen`, `SPChatScreen`). Messages both ways on an assigned job (log in as each
role in turn). Empty send is blocked. Long text, emoji, Taglish. Attachments (image; non-image).
Ordering, timestamps. Keyboard overlap. A chat on a cancelled/completed job (read-only?). Every message
creates a notification (per HANDOFF; may be drift).

**7.2 Notifications** (`HONotificationsScreen`, `SPNotificationsScreen`). The list after Phases 5/6
events. Mark read, delete. Tapping routes to the right screen. Empty state. Red alert icon for
rejected/declined. Push delivery is out of scope (`N-A`).

**7.3 Reviews** (`HOLeaveReviewScreen`). The review is offered only after completion. Stars start empty
and are required. Comment limits per DTO. Submit → shows on the provider profile
(`HOProviderProfileScreen`, `SPProfileScreen`). A second review is impossible. Double-tap Submit → one
review.

**7.4 Disputes / complaints** (`HODisputeFilingScreen`, `HODisputeStatusScreen`). File on an active job
(reason 1–200, details ≤1000) → escrow freezes (check the admin transactions). Status timeline and
segmented control. A complaint on a completed job inside and outside the window. Admin
`GET /admin/disputes` → resolve `refunded_to_client` on one and `released_to_provider` on another →
wallets move exactly once, and the app status updates. Filing twice. The provider-side view.

### Phase 8 — Robustness & exploratory edges

**8.1 Double-tap / race sweep.** Every mutating button not yet covered (save profile, post job, apply,
withdraw application, decline, start, complete task, send message, request withdrawal, file dispute,
submit review): rapid double-tap via an inline flow with two `tapOn`s and no wait → API-verified single
effect.

**8.2 Network & server states.** Offline: `adb shell svc wifi disable; adb shell svc data disable` on
login, on feed load and mid-submit → copy is user-friendly, no crash, and it recovers after
re-enabling. A slow cold backend (first call after 15+ min idle). Token expiry: hard to force, so try
to log the same account in via the API and check the app keeps working; record it, `N-A` if it can't be
induced. **Suspended account:** suspend a **burner** via the admin → the app on that burner shows the
right copy on the next call or login → reinstate. **Maintenance mode** affects every real user of the
shared deployed backend: **do not toggle it** unless the continuation prompt the user pasted explicitly
says "maintenance mode approved". Otherwise mark it Blocked (needs user OK).

**8.3 Device & OS.** Hardware back from **every** screen reached so far (it should pop one level and
exit only at the root). Kill and relaunch mid-wizard and mid-chat. Background/foreground (`adb shell
input keyevent KEYCODE_HOME`, relaunch). Font scale `adb shell settings put system font_scale 1.3`
then `2.0` on the key screens (restore to 1.0 after). Display size. System dark theme
(`adb shell cmd uimode night yes`; the app opts out of forced dark, so it should still be legible).
Permission denial for camera/location/media. Deep link `adb shell am start -a
android.intent.action.VIEW -d "taskbuddy://"` (no crash). Rotation (portrait-locked: check it).
Clock skew: `adb shell settings put global auto_time 0`, then try setting the date +2 days / −1 day
(`adb shell date` may need root; if it's refused, mark it N-A). The date-picker minimum, "x ago" labels
and the session should behave sensibly. **Restore `auto_time 1`.**

**8.4 Account-state matrix.** The app as a deleted account, a suspended account, an unverified
provider, a provider with no `provider_profiles` row, and a brand-new client with no address (Get
Verified/Post Job prompts). Every state gives clear copy and no dead ends.

**8.5 Authorization & API abuse probes (curl, test accounts only).** The app is the client, but its
guarantees rest on the API. Using tokens for `client`, `client2`, `provider`, `provider2`, against
fixtures owned by the **other** test account:
- `client2` reads, cancels or edits `client`'s job, accepts an application on it, and reads its chat
  and dispute.
- `provider2` starts or completes a job assigned to `provider`, ticks its tasks, and posts in its chat.
- A provider token calls client-only routes (`POST /jobs`, accept application) and a client token
  calls provider-only routes (apply, decline).
- Money: `POST /wallet/transactions` with `direction: credit` (must be refused), a withdrawal for
  more than `available`, cancelling another user's withdrawal, an unsigned `POST /payments/webhook`
  (must be 400 and credit nothing).
- Request bodies with server-derived fields (`kind`, `status`, `escrow_status`, `latitude`) → 400 under
  `forbidNonWhitelisted`, or ignored.
- `POST /uploads/signed-url` with a disallowed bucket or content type.
Expected: 403/404/400 every time, and zero state change (verify with GETs). **Any success is S1
`backend-bug` (security).** Log it, don't fix it, and include a minimal curl repro **with tokens
redacted**. Never probe non-test accounts.

### Phase 9 — Consolidation

**9.1 Full regression run.** Every flow in `mobile/maestro/flows/` (excluding `_helpers`), one per
invocation, **run twice**. Any flow failing once out of two runs is `harness` flaky: fix it or tag it
`flaky` in its header. Update `mobile/maestro/README.md` "What's covered" and the selector traps with
anything learned. Restore emulator settings.

**9.2 Final report.** `docs/e2e-sweep/REPORT.md`: scope, build tested, a coverage matrix (slice ×
case counts × pass/fail/blocked), findings by severity/category, found-and-solved list with commits,
the deploy-drift list for the backend team, and recommended next actions. Update HANDOFF.md with a
short "Update <date> — e2e sweep" section that links to it (backend/deploy asks only). Note in the
report that test activity (recovery credits, payouts, commission) is in the deployed analytics.
**Shared-DB cleanup:** cancel every remaining open/assigned job owned by test accounts (admin bookings
cancel), cancel pending withdrawals, delete every live burner, and leave the four persistent accounts
in place. List exactly what remains in REPORT.md. Final handoff and prompt. Offer the user a push/PR,
and don't do either unasked.

**Out of scope (state it in REPORT.md):** iOS, push delivery, the web admin console UI (admin actions
went through the API only), Stripe-hosted pages, load testing.

## 6. Blockers, fixes, escalation

**Blocker triage order:**
1. **Workaround exists** (different account, admin API to set up state, a different path to the same
   screen, a re-tap, re-warming the backend) → use it, log the finding with `Status: Workaround (<how>)`,
   and continue.
2. **External and unfixable in-session** (deploy drift, the Stripe webhook, no mailbox, ML down, a
   missing credential) → mark the affected cases `Blocked` with the finding id and continue with the rest
   of the slice. The slice can still complete.
3. **Blocks the slice's core path and is fixable in the allowed scope** → fix it (below), log it as
   found & solved.
4. **Needs something outside the allowed scope** → **STOP and report to the user** (what, why, the
   options). The slice stays incomplete. **No handoff** for it. Results so far stay saved in the
   test-case file and findings.md.

**Allowed fix scope (implementor may self-serve):** test-harness changes (helpers, selectors, flow
guards); inert `testID` additions; unambiguous **mobile JS/TS** bugs that are not in money, auth or
native code. **Process for app fixes (CLAUDE.md, TDD is mandatory):** write the failing jest/RNTL test
first in the matching `__tests__` dir → `cd mobile && npx jest <file>` fails → implement →
`npx jest <file>` passes → `npm test` and `npm run typecheck` both pass (show the real output) → commit
`fix(mobile-ui): …`. Fixes reach the device only through a **new EAS preview build** (repeat Slice 0.3
steps 2–4). Batch them: at most **one rebuild per phase** unless a fix is required to continue. Record
every build in env-state.md and re-run the previously passing flows for the touched screens after
installing it.

**Never touch / always escalate (STOP and ask):**
- Anything in `mobile/src/lib/api.ts` auth/refresh logic, `AuthContext`, the wallet/escrow/payment
  screens' money logic, `backend/src/{wallet,escrow,payments,stripe,auth}/`, any migration, `app.json`
  plugins/native config, `eas.json`.
- Backend code fixes of any kind. Log them with suggested code (deployed-as-is means they can't be
  verified here anyway).
- Mutating admin calls outside this list: recovery-credit (test accounts, ≤ ₱50,000), verification
  approve/reject, skill-request approve/reject, dispute resolve, withdrawal settle/reject, booking
  cancel (test-account jobs only), suspend/reinstate (burners only). **Never:** commission PATCH,
  broadcast, categories, admins, maintenance (unless approved as in 8.2), and anything targeting a
  non-`@taskbuddy.test` account.
- A bug not isolated after **one** bounded systematic-debugging pass (use the
  `superpowers:systematic-debugging` skill).
- EAS build errors that aren't a trivial config typo. A second rebuild within one phase.

## 7. End-of-slice protocol (strict)

Only when the slice's exit criteria in §4 step 9 are met:

1. Update the `docs/e2e-sweep/README.md` status board (slice → Complete, handoff number) and the
   findings.md summary counts.
2. Write `docs/handoff/###-handoff.md` (next sequential number; check `ls docs/handoff`), using this
   template:
```markdown
# Handoff ### — Slice <x.y> <name> complete
Date: <date>   Branch: test/e2e-full-sweep   Last commit: <sha after step 3, amend the line in a follow-up only if needed>
## Completed this slice
- Cases: <n> total — <p> pass / <f> fail / <b> blocked / <na> N-A  (docs/e2e-sweep/test-cases/<x.y>.md)
- New findings: E2E-### … (one line each: title, severity, status)
- Solved this slice: E2E-### … (commit)
- New/changed flows: <paths> — all green (<date>)
## Environment state right now
- Installed build: <EAS build id, versionCode>; emulator settings changed and not restored: <list or none>
- Backend: health <db/ml>; notable drift affecting next slice: <…>
- Accounts & data: wallet balances (client/client2/provider/provider2), jobs left open on purpose (ids + why), burners still alive
## Open blockers / escalations awaiting the user
- <none | list>
## Next slice
- <x.y+1> <name> — first 3 concrete steps, plus anything that slice must know (e.g. "job <id> has two applicants, use it for 5.1")
## Gotchas learned this slice
- <selector traps, timing, workarounds — also added to mobile/maestro/README.md if durable>
## Continuation prompt
<the exact prompt from step 4>
```
3. Run the secret scan (§2), then `git add docs/e2e-sweep docs/handoff mobile/maestro <any fixed source + tests>`
   and commit: `test(e2e): complete slice <x.y> <name>` (Conventional Commits; the body says why/what
   was learned; **no Co-Authored-By or any AI attribution**). No push.
4. Print the continuation prompt in chat, in a code block, filled in:
```
Continue the TaskBuddy mobile e2e sweep. Read docs/handoff/###-handoff.md first, then follow the plan
in docs/e2e-sweep/PLAN.md, starting at Slice <next x.y> — <name>.
Run the §4 session startup checklist before touching the device. You are the main agent and own the
emulator exclusively; spawn Haiku/Sonnet subagents per §3 for non-device work. When the slice is
complete: handoff → commit → print the next continuation prompt → stop.
```
5. **STOP.** Do not begin the next slice in this session.

The plan lives at `docs/e2e-sweep/PLAN.md` (committed in Slice 0.1), so every continuation prompt
points at a path that exists in any session. If a slice teaches something that changes the plan,
edit PLAN.md in that slice's commit and say so in the handoff.

## 8. Verification (how we know the sweep worked)

- After every slice: the test-case file has no blank Result cells; every Fail/Blocked links to a
  finding; new flows pass on a single run (`maestro test <file>`, the real output pasted into the
  handoff's "flows green" line, or a link to the log in `~/.taskbuddy-e2e/logs`).
- After any app fix: `npm test` + `npm run typecheck` output shown, the fix re-verified on a new preview
  build, and the finding moved to "Found & solved" with the commit sha.
- End of sweep (9.1): the full regression run is green twice over (or flaky flows are explicitly
  tagged), and REPORT.md's counts reconcile with findings.md and the test-case files.
