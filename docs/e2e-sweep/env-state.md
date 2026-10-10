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
| maestro.client@taskbuddy.test | client | Exists, logs in. Address since 2.1-18: "Ayala Avenue, Makati, 1226 Metro Manila, Philippines" (14.5609825, 121.0154926; street-level, no house number). id 400cbc27-… |
| maestro.provider@taskbuddy.test | provider | Exists, verified, Plumbing, address in Lipa (13.9978, 121.1676), is_available=false, radius 8 km |
| maestro.client2@taskbuddy.test | client, unfunded (insufficient-balance cases) | Registered 2026-10-08, wallet 0, no address |
| maestro.provider2@taskbuddy.test | provider, second applicant | Registered 2026-10-08, Plumbing, unverified, no address, wallet 0 |
| maestro.editprofile@taskbuddy.test | edit/settings account for the p2 flows (was the E2E-006 leftover) | Alive and **in use**: the `p2_profile_edit_*` and `p2_settings_toggles_persist` flows log in as it. Don't delete it in 9.2 unless those flows are retired. State left by 2.1: name "Draft Text", no phone, no address, city "Makati", avatar set, toggles at defaults (push on, email on, sms off, dark off) |
| maestro.burner.2.3.c1@ to .c5@, .p1@, .p2@taskbuddy.test | Slice 2.3 burners (c1 registered twice; c2/p2 funded PHP 100 then withdrawn and settled; c5 had an open job) | Created via API and **deleted** (in-app for c1, c2, c3, c4, c5, p1, p2; login 401 each) |
| maestro.burner.2.2.1@ to .7@, .8@, .9@, .10@taskbuddy.test | Slice 2.2 provider burners (edit profile, skill requests, portfolio, no-category, change password) | Created via API and **deleted** (204, login 401 afterwards) |
| maestro.burner.ep1791457159659@taskbuddy.test | leftover burner (E2E-006) | **Alive, needs deleting.** From a 0.3 retry that died before cleanup |
| maestro.burner.2.1.1@taskbuddy.test | Slice 2.1 Change Password burner (client) | Created via API, password changed in-app, **deleted in-app**, login now 401 |
| maestro.burner.2.1.<ts>@taskbuddy.test | made and deleted by `p2_settings_change_password_burner.yaml` on each run | Deleted at the end of the flow (the 2026-10-09 run completed) |
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
- (Resolved 2026-10-09) The Google account was removed from the AVD (`dumpsys account` shows `Accounts: 0`); the button now opens Google's own sign-in page in a Chrome custom tab (E2E-008, Workaround).
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

## Slice 1.3 notes

- Installed build unchanged: `fbe63d63…` (APK sha256 matched at session start). No rebuild.
- Mail sent this hour: exactly one (`maestro.client@`, 16:32 UTC, case 1.3-01). The existing flow `auth_forgot_password_request.yaml` sends mail every time it runs, so Slice 9.1's regression run will send one more. Every other forgot-password case used `maestro.noacct.fp@taskbuddy.test` / `maestro.noacct.fp2@taskbuddy.test`, which have no account and send nothing.
- Emulator: font scale back at 1.0, autofill null, timezone Asia/Manila. The Google account was removed by you before the Google cases. One Chrome task is left in Recents from the custom tab.
- No wallet or job state changed. Balances as before: client 49,500 available (500 frozen), others 0. No account was created or deleted in this slice.
- The Maestro MCP's device connection died mid-session (`UNAVAILABLE`, connection age ~3 h). All device work went through the `maestro test` CLI.

## Slice 2.1 notes

- Installed build unchanged: `fbe63d63…` (APK sha256 matched at session start). No rebuild.
- Emulator: font scale back at 1.0; Wi-Fi and data re-enabled after each offline case; `READ_MEDIA_IMAGES` re-granted after the revoke; dark mode off. Test images are still in `/sdcard/Pictures` (icon.png, splash-icon.png, fake.jpg, large_over10mb.png).
- No wallet, job or escrow state changed: client 49,500 balance / 49,500 available (in escrow 500), others 0. Profile "Balance" is `wallet.balance`.
- The Maestro MCP device driver was dead again at session start (`UNAVAILABLE`). All device work went through `maestro test` and adb.
- The deployed API answers quickly (0.9 s for a wrong-password change); the emulator's own uploads are slow (447 KB avatar about 40-60 s; a 36 MB image fails after about 3 min).
- Server facts: `PATCH /profiles/me` turns null phone/address/city into `""` on the first save; clearing the address nulls latitude/longitude but keeps the city; the geocoder accepts "Ayala Ave" typed without a city and a street-only suggestion, and rejects "Quezon City" as too general; a password change makes the caller's old access token return 401.
- Crash sweep: `~/.taskbuddy-e2e/logs/2.1-logcat.txt` is clean (logcat was cleared once mid-slice).

## Slice 2.2 notes

- Installed build unchanged: `fbe63d63…` (APK sha256 `75b611c2…` matched at session start). No rebuild.
- Emulator: font scale back at 1.0, dark mode off (turned on for 2.2-62, then off), `READ_MEDIA_IMAGES` untouched, autofill null. New test images in `~/.taskbuddy-e2e/images` and `/sdcard/Pictures`: `9_9mb.jpg`, `10_1mb.jpg`, `small.gif`, `small.webp`, plus several `pick_<ts>.png` copies of icon.png.
- Accounts: `maestro.provider@` (verified, Plumbing, category 1) was only viewed, never saved: no skill requests, no portfolio entries, avatar unchanged. `maestro.provider2@` was used read-only (unverified, no address). Burners `maestro.burner.2.2.1`-`.7@`, `.11@`, `.12@` and the flow burners (`maestro.burner.2.2.<13-digit ts>@`, five runs) (`maestro.burner.2.2.<13-digit ts>@`) were all deleted (204, then login 401). Still alive from earlier slices: `maestro.burner.ep1791457159659@taskbuddy.test` (E2E-006, 9.2 cleans it).
- Registering a provider without `category_id` is accepted (burner 4 had no `provider_profiles` row), which is how the "Complete your provider profile first" case was reached.
- Admin used (read and mutating, test accounts only): skill-request approve/reject on burners 2 and 6; read-only `GET /admin/users?search=`. The admin token was held in a shell variable only.
- Auth throttle: 429/empty tokens appeared after bursts of about 10 logins in a minute (E2E-010); a bounded retry loop with 10-12 s sleeps worked.
- No wallet, job or escrow state changed: client 49,500 available (500 frozen), others 0.
- Crash sweep: crash buffer empty for the whole session; the main log buffer only reached back to 08:25, so JS errors earlier are not covered (`~/.taskbuddy-e2e/logs/2.2-logcat.txt`).
- **Resume session (handoff 009):** the emulator was cold-booted (hard kill, `-no-snapshot-load`) because it sat `offline`; the timezone came back as GMT and was restored to Asia/Manila with `adb shell service call alarm 3 s16 Asia/Manila` (`setprop persist.sys.timezone` is denied). Installed APK hash re-verified (`75b611c2…`). Burners `maestro.burner.2.2.8@`, `.9@`, `.10@` (provider, Plumbing) made and **deleted** through `DELETE /profiles/me` (204, login 401 afterwards), plus two stray flow burners from failed runs of `p2_portfolio_add_remove_provider_burner.yaml`, deleted the same way. B10 held 19 portfolio entries and B9 six request rows; neither blocked deletion. `maestro.provider@` and `maestro.provider2@` unchanged. `maestro.provider2@` DOES have a `provider_profiles` row (category 1, null bio, radius 15), so the earlier "no provider row" note is wrong. Admin mutating calls (test accounts only): skill-request approve (burner 9: change_primary Cleaning, add_secondary Manicure) and reject (one request). Emulator after cleanup: font 1.0, night mode off, Asia/Manila, auto time on, media permission granted, network on. Uplink note: the emulator uploads at about 15-30 KB/s (`gsm.network.type` HSPA); the same 9.9 MB file takes 9 s from the host. Crash sweep for this session: crash buffer empty since the boot (11:38), no ANR; the main buffer had wrapped and only reached back to 13:26 when swept, so JS errors earlier in the session are not covered.

## Slice 2.3 notes

- Installed build unchanged: `fbe63d63…` (APK sha256 `75b611c2…` matched at session start). No rebuild.
- The emulator was **cold-booted with `-dns-server 8.8.8.8,1.1.1.1`** (E2E-049: it had lost DNS, the app said "Cannot reach the server"). Timezone put back to Asia/Manila after the boot. Settings now: font scale 1.0, night mode off, auto time on, Wi-Fi and data on, autofill null. The app is logged out at Login.
- Ledger: two PHP 100 recovery credits (c2, p2, `Maestro e2e 2.3 seed`), each followed by a PHP 100 withdrawal that the admin settled (`e2e-2.3-settle`, `e2e-2.3-settle-p2`), so both accounts net to zero. Both accounts are deleted.
- `maestro.provider@` now has one **withdrawn** application on a job of a deleted burner (the E2E-046 probe). That job was cancelled by the admin. Wallets of the four persistent accounts unchanged: client 49,500 available (500 frozen), others 0.
- Server facts: deleted profile keeps its row (`Deleted user`, PII null, email `deleted-<id>@deleted.invalid`), the admin users search stops listing it, `GET /admin/users/:id` still returns it, `GET /providers/:id` of a deleted provider still returns 200 with `is_available` false. Re-registering a deleted email gives a brand-new profile id.
- Maestro: `-e KEY=value` did not override a placeholder in the flow text here (typed `${EMAIL}` literally), so the throwaway navigation flows were generated with `sed`.

## Slice 3.1 notes

- Installed build unchanged: `fbe63d63…` (APK sha256 `75b611c2…` matched at session start). No rebuild. DNS fine (ping resolved), backend health db up / ml down (429, E2E-001).
- Emulator: `location_mode` was already 3; a geo fix (121.0437, 14.6760) is set and `ACCESS_FINE_LOCATION` was granted to the app (E2E-058). Six `job31_*.png` test images (447 KB) are in `/sdcard/Pictures`. Nothing else changed; font 1.0, night off, autofill null.
- Jobs of `maestro.client@` made this slice: 6 wizard jobs (J1-J6), J7 via the API without budget/date, plus one job from the new flow (cancelled in-app). **All cancelled**; J1 and J3 had already flipped to `recommending` (ML down, nobody invited), J5 too before cancel. No fixture is kept for Phase 4 (§4b: recreate).
- Wallets unchanged: client 49,500 balance / available (500 frozen from the 2.x job), others 0. Posting never touches the wallet.
- Server facts: urgency deadlines are exact (+5 / +10 / +15 min from `created_at`); `scheduled_at` is stored UTC (16:12 Manila -> 08:12Z); `photo_urls` are full Supabase public URLs; the typed address text is stored as typed; a job with no budget or schedule is accepted (201) and renders cleanly. A client access token lasted under about 1.5 h (401 mid-session), so helpers re-login.
- Maestro MCP driver died again (`UNAVAILABLE`); everything ran through `maestro test` and `maestro hierarchy` via `~/.taskbuddy-e2e/hier.sh` and `mt.sh`.
- Crash sweep: crash buffer empty, `ReactNativeJS:E AndroidRuntime:E` output 0 lines (`~/.taskbuddy-e2e/logs/3.1-logcat.txt`).

## Slice 4.2 notes

- Installed build unchanged: `fbe63d63…` (APK sha256 `75b611c2…` matched at session start). No rebuild. Backend health db up / ml down (429, E2E-001) all slice, so the scheduler flipped every fixture to `recommending` without notifying anyone.
- **Emulator changes:** mid-slice the timezone drifted back to GMT and DNS died (the emulator had been started without `-dns-server`). Fixed by `adb shell settings put global auto_time_zone 0` + `service call alarm 3 s16 Asia/Manila`, then a cold boot with `emulator -avd Medium_Phone -dns-server 8.8.8.8,1.1.1.1` (detached). **`auto_time_zone` is now 0** (baseline was 1; restore in 9.1). `devstate.sh` now also checks `dns` (ping of the API host).
- Ledger: `maestro.client@` balance 50,000 / available 50,000 / in escrow 0. The 500 that was frozen since the 2.x job came back as `refund` "Refund — cancellation response expired" (job 5f13ac3f, 2026-10-10 09:50 UTC, once) — server automation, not a sweep action. Other wallets 0. No money moved in 4.2.
- Fixtures (all `maestro.client@`, all **cancelled** at slice end): A 48ee2726, B eca53b28, C 7f217cc2, D 8a748110, E 01b92adc, F 9809e3af, G 2ae45d2e, H 36bbf08f (Cleaning), I-photo b5e51d6c, L-long 762991ba, plus 6 jobs from two runs of the new flow (cancelled by the flow). `GET /jobs/mine`: 59 jobs, all cancelled.
- `maestro.provider@` left `is_available: false` (toggled during 4.2-29/30/45 and restored). Location permissions granted (revoked and restored in 4.2-18).
- Shared backend: another client's real job "Plumbing: Check valve" (b89c310a, ₱50, Lipa, 4.5 km from p1) is in p1's and p2's feeds. Never touched.
- Crash sweep: crash buffer 0 lines, `ReactNativeJS:E AndroidRuntime:E` 0 lines (buffer from 00:46 on 10-11); Maestro's per-run device logs for both flow runs had no FATAL/ANR/JS errors (`~/.taskbuddy-e2e/logs/4.2-logcat.txt`).

## Slice 4.3 notes

- Installed build unchanged: `fbe63d63…` (APK sha256 `75b611c2…` matched). No rebuild, no emulator setting changed (still `auto_time_zone` 0 from 4.2). Backend health db up / ml down (E2E-001) all slice.
- Ledger unchanged: client 50,000 / 50,000, others 0. No money moved (applying never touches the wallet).
- Fixtures (`maestro.client@`): J1 1e4de8e9 **kept open (recommending) for 5.1** with two pending applications (p1 55f4f645 with a Taglish message, p2 97dfbb5c with none). J2 a2f2bae1, J3 6749c043, J4 c1ebdf62, JC 133b247d (Cleaning) cancelled; three "Maestro apply …" jobs from the new flow cancelled with their applications withdrawn. `GET /jobs/mine`: 66 cancelled + J1.
- Applications left on the providers: p1 J1 pending, J2 pending (job cancelled, E2E-101), J4 withdrawn, plus older baseline rows; p2 J1 pending, J2 pending (job cancelled), J4 pending (job cancelled; cover "" — E2E-100). Both providers `is_available: false`.
- Crash sweep: crash buffer 0 lines, `ReactNativeJS:E AndroidRuntime:E` 0 lines (`~/.taskbuddy-e2e/logs/4.3-logcat.txt`).

## Slice 5.1 notes

- Installed build unchanged: `fbe63d63…` (APK sha256 `75b611c2…`). No emulator change. Backend health db up / ml down (E2E-001).
- **Ledger (balance / available / in_escrow), verified against `GET /wallet` and `GET /admin/transactions` after every packet:** start c1 50,000 / 50,000 / 0; after J1 hire 49,500 / 49,500 / 500; after K3 (double tap) 49,100 / 49,100 / 900; after K4 (offline then online) 48,800 / 48,800 / 1,200. p1 0 / 0 / 800 (J1 500 + K4 300), p2 0 / 0 / 400 (K3), c2 0 / 0 / 0. Admin escrow rows: J1 500 held, K3 400 held, K4 300 held — one each. A wallet hold lowers the client's `balance` as well as `available`; the provider sees the incoming amount as `in_escrow`.
- Jobs: J1 1e4de8e9 confirmed → p1 (kept for 5.3), K3 055c68e5 confirmed → p2 (kept for 5.2 decline), K4 e5551922 confirmed → p1 (kept for 5.2 client cancel), K2 79259875 (c2) cancelled; two "Maestro unfunded …" flow jobs (c2) cancelled by the flow. Hired jobs go to status `confirmed` (migration 0039), not `assigned`.
- A Stripe Checkout session was opened once from c2's "Pay by card" (5.1-07) and abandoned on the hosted page; nothing paid.
- Crash sweep: 0 lines in both parts (`~/.taskbuddy-e2e/logs/5.1-logcat.txt`).
