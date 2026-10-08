# Environment state

Values are filled in as slices run. `TBD` means not yet recorded.

## Builds

| Build id | versionCode | Git sha | APK sha256 | lastUpdateTime |
|---|---|---|---|---|
| fbe63d63-018d-433e-bbda-d071586da894 (preview, apk, built 2026-10-08 ~10:21 UTC, about 24 min) | 1 (versionName 1.0.0) | f4f1f3d | 75B611C2306AA4EBAAFE80081813EE418E6D739B4CAD3A5FC669A0A1322426C4 | 2026-10-08 18:26:02 (emulator local time) |

## Tooling versions

| Tool | Version |
|---|---|
| EAS CLI | 24.8.0 (24.12.0 available) |
| Maestro CLI | 2.8.0 |
| adb (platform-tools) | 1.0.41 |
| Android emulator | 36.6.11.0; AVD Medium_Phone, API 35, 1080x2400 |
| Java (Android Studio JBR) | OpenJDK 21.0.10 |
| Node / npm | v22.18.0 / 11.5.2 |

## Emulator baseline (originals + current)

AVD `Medium_Phone`. Originals are recorded before any change. Slice 9.1 restores the originals.

| Setting | Original | Current | Target |
|---|---|---|---|
| Timezone (`persist.sys.timezone`) | GMT | Asia/Manila (set via `adb shell cmd alarm set-timezone`; `setprop` is refused; `auto_time_zone` is 1 and it held) | Asia/Manila |
| Automatic date/time (`settings global auto_time`) | 1 | 1 | 1 |
| Font scale (`settings system font_scale`) | 1.0 | 1.0 | 1.0 |
| Night mode (`cmd uimode night`) | no | no | off |

## Drift

Checked 2026-10-08 (Slice 0.2) against `main` at 5601b13.

**Route probe:** 146 controller routes in `backend/src`, one unauthenticated request each. 127 x 401, 16 x 400, 3 x 200, **0 x 404**. No route is missing on the deployed API. A negative control (`GET /__drift_control__`) returned 404, so drift would have shown. `GET /jobs/mine`, `/jobs/assigned` and `/providers/me/portfolio` can't be told from a param sibling unauthenticated, so they were re-checked with a token (all 200).

**DTO-field probe** (junk single-field bodies; none created anything):

| Endpoint | Fields probed | Deployed DTO knows them |
|---|---|---|
| POST /auth/register | category_id, consented_terms/privacy/data_collection/biometric | yes |
| POST /jobs/:id/accept | address, latitude, longitude | yes |
| PATCH /profiles/me | location_reference | yes |
| POST /verifications | document_type | yes |
| POST /skill-requests | type, category_id, reason | yes |
| POST /disputes/:id/entries | kind, body, message_id | yes |
| POST /disputes/:id/cancellation-response | accept, note, message_id | yes |
| GET /jobs/mine | status_group, category_id, limit, offset | yes |
| POST /payments/hire-checkout-session | application_id, app_redirect | yes |
| POST /payments/checkout-session | amount, app_redirect | yes |
| POST /payments/connect/onboarding-link | app_redirect | yes |
| POST /conversations/:id/messages | body, attachment_path | yes |
| GET /jobs (feed) | urgency | yes (`status_group` is rejected here, as in source) |

No deploy-drift findings. Health: database up, ml_service **down (HTTP 429)** (E2E-001).

## Account ledger

Emails only. No passwords or tokens in this file.

| Email | Role | Status |
|---|---|---|
| maestro.client@taskbuddy.test | client | Exists, logs in. No address/coordinates. id 400cbc27-… |
| maestro.provider@taskbuddy.test | provider | Exists, verified, Plumbing, address in Lipa (13.9978, 121.1676), is_available=false, radius 8 km |
| maestro.client2@taskbuddy.test | client, unfunded (insufficient-balance cases) | Registered 2026-10-08, wallet 0, no address |
| maestro.provider2@taskbuddy.test | provider, second applicant | Registered 2026-10-08, Plumbing, unverified, no address, wallet 0 |
| maestro.editprofile@taskbuddy.test | leftover burner (E2E-006) | **Alive, needs deleting.** From the 0.3 baseline run. An API delete was denied by the permission classifier |
| maestro.burner.ep1791457159659@taskbuddy.test | leftover burner (E2E-006) | **Alive, needs deleting.** From a 0.3 retry that died before cleanup |
| maestro.burner.reg.1@, .reg.2@, .reg.3@taskbuddy.test | Slice 1.2 burners (client, provider, client) | Created and **deleted in-app** on 2026-10-08, login now 401 |

## Wallet balances

Balance / available / pending, recorded at slice start and end.

| Account | Slice | Start | End |
|---|---|---|---|
| maestro.client@taskbuddy.test | 0.2 | balance 49,500 / available 49,500 / pending 0 (in escrow 500, stale job) | same, no change |
| maestro.provider@taskbuddy.test | 0.2 | 0 / 0 / 0 (in escrow 500, stale job) | same |
| maestro.client2@taskbuddy.test | 0.2 | 0 / 0 / 0 | same |
| maestro.provider2@taskbuddy.test | 0.2 | 0 / 0 / 0 | same |

## Deploy facts

- Backend: `https://taskbuddy-kpek.onrender.com` (Render free tier; a 30–60s cold start after about 15 min idle is expected)
- Backend health (db / ml): up / down (HTTP 429), re-checked 2026-10-08 in Slice 0.3
- App: `com.taskbuddy.app`, scheme `taskbuddy`, EAS owner `taskbuddy-android`
- EAS `preview` profile: `distribution: internal`, `channel: preview`, `android.buildType: apk`
- `EXPO_PUBLIC_API_URL` in the EAS preview environment: not set ("No variables found"), so the build uses the deployed kpek API
- EAS OTA on branch `preview`: one group (6db95a7f..., runtime 1.0.0, android+ios, about 2 weeks old). It does **not** reach this build: the device logged `NoUpdatesAvailable` on both launches (the embedded bundle is newer). If a future build is made from older code, re-check.
- Android build quota remaining this month: not readable from the CLI output. Not recorded; check on expo.dev if it matters.

- Also changed: `settings secure autofill_service` set to `null` (original not read; restore in 9.1 if needed)


- Health 2026-10-08: database up, ml_service down (HTTP 429). Backend uptime about 3 days.
- Confirm-email is **OFF** on the deployed project: `POST /auth/register` returned a session. Burners need no SQL confirmation.
- Leftover from old sweeps: job `5f13ac3f-c909-4a39-b7f2-b750d218d553` (confirmed, ₱500 in escrow, both maestro accounts). Cancelled via admin on 2026-10-08 after user approval; its ₱500 escrow is now `disputed` (frozen), so both wallets still show 500 in escrow (E2E-002).
- Recovery credit: not needed (client available 49,500 >= 20,000).
- Plan corrections: there is no `GET /profiles/me`, use `GET /auth/me`. `secrets.env` uses `KEY:value` lines.

## Slice 0.3 notes

- Preview APK installed over a clean uninstall of the dev client. Later rebuilds use `adb install -r`.
- Typing trap: `aabbrrcc` types cleanly on the release build, so the doubled-letter rule no longer applies.
- Notification permission is never requested during login (`POST_NOTIFICATIONS granted=false`).
- `mobile/node_modules` was incomplete (`expo-image` missing), which made every `eas` command fail with `expo config` exiting 1. `npm ci` fixed it. `eas` in PowerShell needs `cmd /c` because its upgrade notice on stderr trips PowerShell's error handling.
- The emulator has a real personal Google account added. "Continue with Google" completes by itself with it (E2E-008). Don't tap that button again until the account is removed or you decide otherwise.
- Baseline log: `~/.taskbuddy-e2e/logs/baseline.log`. Crash sweep: `0.3-logcat.txt` (empty, clean).

## Slice 1.1 notes

- Installed build unchanged: `fbe63d63…` (APK sha256 matched at session start). No rebuild.
- Emulator: font scale put back to 1.0 after the 1.3 check; Wi-Fi and data re-enabled after the offline case. Timezone Asia/Manila as before.
- App state at the end: logged out (the last flow was `p1_auth_account_switch`, which ends logged in as the client, then `pm clear` is not needed for the next slice because every flow starts with `launch_fresh`).
- Deployed login throttle is inconsistent (E2E-010). Auth routes can return 429 for about a minute after a burst; wait 65s if a flow hits it.
- No wallet or job state changed in this slice. Balances as in 0.2/0.3: client 49,500 available (500 frozen), others 0.
- Onboarding slides are keyed per profile id: tapping Skip once means they do not reappear for that profile, even after logout/login. `launchApp: clearState` resets this.

## Slice 1.2 notes

- Installed build unchanged: `fbe63d63…`. Emulator settings: font scale put back to 1.0 after the 1.3 check, nothing else changed.
- Three real signups only (client, provider, client with padded/hostile input). All three burners were deleted through Settings, and `POST /auth/login` returns 401 for each. No stray accounts from the rejected-email and duplicate cases.
- `maestro.client@` was not used for the duplicate-email cases (burner.1 was the target), so its wallet and escrow are untouched: client 49,500 available (500 frozen), others 0.
- Server facts learned: register has no length cap on `full_name`/`password`; the server lower-cases and trims the email and trims `full_name` (a `<script>` name is stored verbatim); a duplicate email is case-insensitive (409); `forbidNonWhitelisted` wording is "property x should not exist".
- Maestro `takeScreenshot` drops PNGs into the working directory; they were moved to `~/.taskbuddy-e2e/scratch/1.2/` and not committed.

