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

## Slice 5.2 notes

- Installed build unchanged: `fbe63d63…` (APK sha256 `75b611c2…`). No emulator setting changed (still `auto_time_zone` 0 since 4.2). Backend health db up / ml down (E2E-001).
- **Ledger (balance / available / in_escrow), checked against `GET /wallet` and `GET /admin/transactions` before and after every money packet (`~/.taskbuddy-e2e/logs/5.2/wallets-*.log`):** start c1 48,800 / 48,800 / 1,200, p1 0/0/800, p2 0/0/400. K3 provider decline +400 → c1 49,200 / 800. K4 client cancel → pending 48 h dispute, escrow `disputed`, no money; p1 agreed → +300 → 49,500 / 500. ORCH hired K5 350, K6 320, K7 300, K8 (no budget) → 48,530 / 1,470. K7 race (decline won, cancel 409) +300 → 48,830. K5 contested → admin refund +350 → 49,180. K6 cancelled in progress → contested, frozen → admin refund +320 → 49,500 / 500. Three flow runs (hold 300 / refund 300 each) net zero. **End: c1 49,500 / 49,500 / 500 (J1 only), c2 0/0/0, p1 0/0/500, p2 0/0/0.**
- Admin mutating calls (all test accounts, all allowed by PLAN §6): dispute resolve K4 `reviewed` (closing the 5.2-21 appeal probe; no money), K5 `refunded_to_client`, K6 `refunded_to_client`. No recovery credit.
- Jobs: K3, K4, K5, K6, K7, K8 cancelled; three "Maestro decline …" flow jobs cancelled. Only J1 1e4de8e9 stays confirmed → p1 (for 5.3). All disputes on test jobs are resolved.
- Crash sweep: 0 lines in both parts (`~/.taskbuddy-e2e/logs/5.2-logcat.txt`, re-checked after the flow runs).

## Slice 5.3 notes

- Installed build unchanged: `fbe63d63…` (APK sha256 `75b611c2…`). No emulator change. Backend health db up / ml down (E2E-001). `GET /admin/commission` → `commission_rate` 0.15 (read only).
- **Completion does not release escrow:** the payments sweep releases 72 h after `completed_at` (migration 0040). PLAN.md 5.3 now says so.
- **Ledger:** start c1 49,500 / 49,500 / 500, p1 0/0/500, p2 0/0/0. J1 started, both tasks ticked, completed 2026-10-11T12:03:57Z → no money moved (still held 500). ORCH fixture M1 a8864a42 (₱777, p2): hire −777 → c1 48,723 / 1,277; started, 3 tasks, completed 12:22:35Z; c1 complaint a7c19c91 → escrow `disputed`; admin resolve `released_to_provider` → p2 +660.45 (commission 116.55 frozen on the row), c1 in_escrow −777. **End: c1 48,723 / 48,723 / 500 (J1 held), c2 0/0/0, p1 0/0/500, p2 660.45 / 660.45 / 0.**
- Admin mutating calls: dispute resolve M1 `released_to_provider` (test accounts, allowed by PLAN §6).
- **Deferred check:** J1 warranty ends 2026-10-14T12:03:57Z (8:03 PM Manila). After it, the sweep should release ₱500 → p1 +425.00, commission 75.00.
- Jobs: J1 completed (held for warranty), M1 completed (released). No open or confirmed test job remains.
- Crash sweep: 0 lines in both parts (`~/.taskbuddy-e2e/logs/5.3-logcat.txt`).

## Slice 5.4 notes

- Installed build unchanged: `fbe63d63…` (APK sha256 `75b611c2…`). No emulator change. Backend health db up / ml down (429, E2E-001).
- Fixture R1 c98d5700 (c1, urgent, ₱300, never hired): created 13:14:32Z, deadline +5 min, flipped to `recommending` by the scheduler at 13:20:00Z, re-claimed by the retry sweep at 13:37:00Z, one manual Find Providers at 13:39:12Z → generic 500 copy, no run and no invites. Cancelled by ORCH at ~13:45Z. No money moved: c1 48,723 / 48,723 / 500, p1 0/0/500, p2 660.45 / 660.45 / 0.
- Emulator health: up 27 h, load average ~10. Maestro starts take ~100 s, `hier.sh` hung twice, and the login email-doubling glitch now hits most logins. Three `maestro … mcp` java processes from 2026-10-10 are still running (other sessions' MCP servers; left alone). A cold reboot of the emulator before Phase 6 is advised.
- Crash sweep: 0 lines in both parts (`~/.taskbuddy-e2e/logs/5.4-logcat.txt`).

## Slice 6.1 notes

- **Emulator cold-rebooted at 2026-10-11 ~14:00Z** (`adb emu kill`, then `Start-Process emulator.exe -avd Medium_Phone -no-snapshot-load -PassThru`; a plain `Start-Process` from the tool shell died with the shell). Timezone came back as GMT and was restored with `adb shell service call alarm 3 s16 Asia/Manila`; autofill disabled again; APK hash unchanged; devstate OK. The login email-doubling glitch persisted after the reboot, so it is not load-related.
- Read-only slice: no money moved. Ledger (= `~/.taskbuddy-e2e/logs/6.1/ledger-api.txt`): c1 48,723 / 48,723 / 500, total_credited 53,070, total_debited 4,347, 21 rows (11 escrow_hold, 9 refund, 1 topup "Maestro test seed" +50,000 from 2026-09-15); c2 all 0; p1 0 / 0 / 500, no rows; p2 660.45 / 660.45 / 0, one payout.
- Font scale was set to 1.3 for rows 6.1-13/14 and restored to 1.0 (devstate confirms).
- Crash sweep: 0 lines in both parts (`~/.taskbuddy-e2e/logs/6.1-logcat.txt`).

## Slice 6.2 notes

- Installed build unchanged (`fbe63d63…`, sha `75b611c2…`). Backend health db up / ml down (E2E-001).
- **Process change (user-approved 2026-10-12):** `login.sh` (adb login, 12/12 in the trial, median 35 s vs 2-3 min), `hier.sh` on `uiautomator dump` (~3 s vs ~21 s; Maestro fallback), `mt.sh` exits 1 on failure, `api.sh`/`opus-api.sh` re-login on 401, `opus/gate.sh` for the mechanical gate, packet size by risk (read-only up to 6 rows), pipelined matrix drafts. PLAN.md §3/§4 and HAIKU-BRIEF updated.
- **Ledger:** start c1 48,723 / 48,723 / 500, p2 660.45 / 660.45 / 0. p2 withdrawal W2 ₱100 settled by admin (reference E2E-6.2-11-REF-001) → **p2 560.45 / 560.45 / 0** (total_debited 100). Every other request (0.50, 100, 50 rejected, 560.45, 10, 5, 1, the race probes, c1's 300, the flow runs' 10s) ended `failed` (cancelled or rejected). **End: c1 48,723 / 48,723 / 500 / 0; c2 0; p1 0 / 0 / 500; p2 560.45 / 560.45 / 0 / 0.**
- Admin mutating calls (test accounts, PLAN §6): withdrawal reject W3 (50), settle W2 (100); the second settle and a reject-after-settle were refused.
- Migration 0045 is deployed: concurrent debits are serialized (4 × ₱200 against ₱560.45 → exactly 2 accepted, 2 refused by the TB402 trigger).
- Crash sweep: 0 lines in both parts (`~/.taskbuddy-e2e/logs/6.2-logcat.txt`, after the flow runs).

## Slice 6.3 notes

- Installed build unchanged (`fbe63d63…`). Backend health db up / ml down (E2E-001).
- **UAT decision (user, 2026-10-12):** the sweep prepares the app for UAT with test accounts only, so Stripe **sandbox** actions are allowed (Checkout payments with test cards, Connect onboarding up to the hosted page).
- **Stripe:** Checkout runs in test mode (`cs_test_` sessions, "TaskBuddy sandbox" / Sandbox badge). A ₱50 top-up paid with 4242 4242 4242 4242 credited c2 exactly once in ~17 s (kind `topup`, payment intent recorded). Stripe's Back link returns with "Payment was cancelled." Connect is **not enabled** on the sandbox account (E2E-131).
- **Ledger:** c2 0 → 150 (₱50 sandbox top-up + ₱100 admin recovery credit "E2E 6.3 recovery voucher", allowed action). c1 48,723 / 48,723 / 500; p1 0 / 0 / 500; p2 560.45 / 560.45 / 0. No pending withdrawals. Five ₱50 rate-limit probes were refused (no Stripe sessions).
- Admin mutating calls: recovery credit ₱100 to c2 (test account, ≤ ₱50,000).


## Slice 7.1 notes

- Installed build unchanged (`fbe63d63…`, sha256 `75b611c2…426c4`). Backend health db up / ml down (E2E-001). Emulator up ~7 h at start (no reboot needed), devstate OK throughout.
- Old fixture C1 `b6c5e0fd…` (released at the pause) was replaced by **C1b `67a3666e-0b16-4898-bd3d-d3fd6724f8b7`** "E2E 7.1 C1b chat job": c1 posted, p1 applied, c1 accepted (hire → `confirmed`), ₱300 held. **C1b is left confirmed on purpose** for 7.3 (to be started and completed as a review fixture).
- **Ledger:** start c1 48,723 / 48,723 / 500; after the C1b hire **c1 48,423 / 48,423 / 800**; p1 0 / 0 / 800 (J1 500 + C1b 300); c2 150 / 150 / 0; p2 560.45 / 560.45 / 0. Chat moves no money; unchanged at slice end.
- Chat data added (permanent, no delete route): C1b conversation `f25793af…` 14 messages (incl. 2 photos), K4 conversation 1 message, J1 conversation 1 message; p1 "New message" notices grew from 1 to 13, c1 from 1 to 2 (affects 7.2 baselines).
- Device file added: `/sdcard/Pictures/e2e71_chatA.jpg` (labelled fixture "CHAT A").
- No admin mutating calls.

## Slice 7.2 notes

- Installed build unchanged (`fbe63d63…`). Backend health db up / ml down (E2E-001). The backend's `uptime_s` reset twice during the slice (Render restart or redeploy); no route or behaviour change was seen.
- **Ledger unchanged** (no money moved): c1 48,423 / 48,423 / 800; c2 150 / 150 / 0; p1 0 / 0 / 800; p2 560.45 / 560.45 / 0.
- Notification state left behind: c1 all read except 1 ("E2E 7.2 live notice X01"), snapshot 50 (holds more than 50); p1 26 unread; p2 0 unread (19 rows); **c2 has 0 notifications** (row 12 Clear all, approved). Extra C1b chat messages from ORCH seeds: "E2E 7.2 seed notice 51", "clock label seed", "mark-all seed 1-3", "live notice X01" (C1b now 21 messages).
- Admin mutating call: skill-request reject (p2 request 3cd81f35, "E2E 7.2 fixture", allowed action) to create service-request notices.
- Burner `maestro.burner.72.1@taskbuddy.test` (provider, for the empty state) registered and deleted (`DELETE /profiles/me` 204; login now fails).

## Slice 7.3 notes

- Installed build unchanged (`fbe63d63…`). Backend health db up / ml down (E2E-001).
- **Fixtures (ORCH, money):** C1b taken to completed (start, task, complete; ₱300 stays held until its warranty ends 2026-10-14T23:59Z). New c1 jobs R4 `3ed811c9…`, R5 `4efd0df7…`, R10 `96fb61a7…` (each ₱300, p1, completed; warranties end about 2026-10-15T00:00Z). O2 `9cb0c341…` (open, p1 applied) cancelled at slice end; X1 `4203ee0d…` (₱300 hire) declined by p1 at slice end (refund once).
- **Ledger:** start c1 48,423 / 48,423 / 800 → after fixtures 47,223 / 47,223 / 2,000 → after the X1 decline **47,523 / 47,523 / 1,700**; p1 0 / 0 / 1,700 (J1 500 + C1b, R4, R5, R10 300 each); c2 150 / 150 / 0; p2 560.45 / 560.45 / 0. Reviews move no money.
- **Reviews now on record (permanent):** p1 has 5 (J1 4 "E2E 7.3 great work"; R4 4, comment three spaces; R5 5 Taglish; R10 5, 500-code-point comment; C1b 2), API average 4.0 over 5; p2 has 1 (M1 3, no comment), average 3.0.
- **Escrow auto-release due (payments sweep, no admin action):** J1 at 2026-10-14T12:03:57Z (p1 +425.00); C1b, R4, R5, R10 at about 2026-10-14T23:59Z to 2026-10-15T00:00Z (p1 +255.00 each at a 15 % commission).
- No admin mutating calls.

## Slice 7.4 notes

- Installed build unchanged (`fbe63d63…`). Backend health db up / ml down (E2E-001).
- **Emulator cold-rebooted mid-slice (2026-10-12 ~09:45 Manila):** after ~11.5 h uptime the emulator's DNS failed (it could ping by IP but not resolve the backend), and TaskBuddy plus Google Calendar raised ANRs ("Input dispatching timed out") during a setup login. This is environment, not an app bug. After the reboot devstate was OK, the timezone was restored, the APK sha was unchanged and autofill was off. HAIKU-BRIEF gained a degraded-emulator STOP rule.
- **Fixtures (ORCH):** F1 `4b1e0cf0…` (₱300 hire, confirmed) → complaint → admin refund; F2 `259ed67b…` (₱300 hire, started, tasks ticked by ORCH, completed by c1 with the complaint open) → admin refund; O1 `2d50d62e…` (open) cancelled at slice end; C1b complaint → admin `released_to_provider` (used in place of J1, so J1 stays untouched for the auto-release check); K3 complaint (API) closed `reviewed`; M1 complaint reopened by appeals and closed `reviewed`; a re-filed M1 complaint (E2E-163) closed `reviewed`.
- **Ledger:** start c1 47,523 / 47,523 / 1,700, p1 0 / 0 / 1,700 → F1+F2 hires c1 46,923 / 2,300 → F1 refund 47,223 / 2,000 → F2 refund 47,523 / 1,700 → C1b release **p1 255 / 255 / 1,400** (payout 255.00 = 300 − 45.00 commission at 0.15), **c1 47,523 / 47,523 / 1,400**. c2 150 / 150 / 0; p2 560.45 / 560.45 / 0. No pending withdrawals.
- `GET /admin/commission` read 0.15 with `updated_at` 2026-10-12T02:40:53Z. The sweep never PATCHes it, so some other actor on the shared backend touched it; the value is unchanged.
- Admin mutating calls (all allowed dispute resolves): F1 refunded_to_client, F2 refunded_to_client, C1b released_to_provider, K3 reviewed, M1 reviewed, M1 re-file reviewed; plus refused probes (reviewed while held, second resolves, released on a refunded escrow).
