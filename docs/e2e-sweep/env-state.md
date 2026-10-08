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

TBD. Filled in Slice 0.2 (route probe and DTO-field probe).

## Account ledger

Emails only. No passwords or tokens in this file.

| Email | Role | Status |
|---|---|---|
| maestro.client@taskbuddy.test | client | TBD |
| maestro.provider@taskbuddy.test | provider | TBD |
| maestro.client2@taskbuddy.test | client, unfunded (insufficient-balance cases) | TBD |
| maestro.provider2@taskbuddy.test | provider, second applicant | TBD |

## Wallet balances

Balance / available / pending, recorded at slice start and end.

| Account | Slice | Start | End |
|---|---|---|---|
| maestro.client@taskbuddy.test | TBD | TBD | TBD |
| maestro.provider@taskbuddy.test | TBD | TBD | TBD |
| maestro.client2@taskbuddy.test | TBD | TBD | TBD |
| maestro.provider2@taskbuddy.test | TBD | TBD | TBD |

## Deploy facts

- Backend: `https://taskbuddy-kpek.onrender.com` (Render free tier; a 30–60s cold start after about 15 min idle is expected)
- Backend health (db / ml): TBD (Slice 0.2)
- App: `com.taskbuddy.app`, scheme `taskbuddy`, EAS owner `taskbuddy-android`
- EAS `preview` profile: `distribution: internal`, `channel: preview`, `android.buildType: apk`
- `EXPO_PUBLIC_API_URL` in the EAS preview environment: TBD (Slice 0.3)
- EAS OTA on branch `preview`: TBD (Slice 0.3)
- Android build quota remaining this month: TBD (Slice 0.3)

- Also changed: `settings secure autofill_service` set to `null` (original not read; restore in 9.1 if needed)

