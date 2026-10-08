# Environment state

Values are filled in as slices run. `TBD` means not yet recorded.

## Builds

| Build id | versionCode | Git sha | APK sha256 | lastUpdateTime |
|---|---|---|---|---|
| TBD | TBD | TBD | TBD | TBD |

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
- Backend health (db / ml): TBD (Slice 0.2)
- App: `com.taskbuddy.app`, scheme `taskbuddy`, EAS owner `taskbuddy-android`
- EAS `preview` profile: `distribution: internal`, `channel: preview`, `android.buildType: apk`
- `EXPO_PUBLIC_API_URL` in the EAS preview environment: TBD (Slice 0.3)
- EAS OTA on branch `preview`: TBD (Slice 0.3)
- Android build quota remaining this month: TBD (Slice 0.3)

- Also changed: `settings secure autofill_service` set to `null` (original not read; restore in 9.1 if needed)


- Health 2026-10-08: database up, ml_service down (HTTP 429). Backend uptime about 3 days.
- Confirm-email is **OFF** on the deployed project: `POST /auth/register` returned a session. Burners need no SQL confirmation.
- Leftover from old sweeps: job `5f13ac3f-c909-4a39-b7f2-b750d218d553` (confirmed, ₱500 in escrow, both maestro accounts). Not cancelled; the admin cancel was denied (E2E-002).
- Recovery credit: not needed (client available 49,500 >= 20,000).
- Plan corrections: there is no `GET /profiles/me`, use `GET /auth/me`. `secrets.env` uses `KEY:value` lines.
