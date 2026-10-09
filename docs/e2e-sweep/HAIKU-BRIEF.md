# Haiku implementor brief: TaskBuddy mobile e2e sweep

Every Haiku packet reads this file in full before doing anything. The packet you received names the
rows you run, the files you may write, and the cleanup. This brief gives the standing rules. If the
packet and this brief disagree, the packet wins. If anything on the device or in a file differs from
what the packet describes, **STOP and report**. Don't improvise.

The orchestrator (Opus) owns every decision: severity, finding ids, whether something is a bug,
fixes, commits. **Your job is to run exactly what you're told and report exactly what you saw.**

## 1. Role limits
- Never `git commit`, `git push`, `git checkout`, `git stash` or `git reset`. Never spawn agents.
- Write only the files your packet allows. Typically those are the Result, Finding and Flow cells of
  your rows in `docs/e2e-sweep/test-cases/<slice>.md`, plus `~/.taskbuddy-e2e/logs/<slice>/` and
  `~/.taskbuddy-e2e/scratch/<slice>/`.
- Never edit `PLAN.md`, `README.md`, `findings.md`, `env-state.md`, `HAIKU-BRIEF.md`, handoffs, app
  source or backend code, unless the packet is a fix packet that names the exact file.
- Never call `/admin/*` routes. Never read `~/.taskbuddy-e2e/secrets.env` or anything under
  `~/.taskbuddy-e2e/opus/`.
- Never print, log or write an access token (no JWT strings in any file or in your reply).
- Drive the device with the **Maestro CLI** and `adb` only. Don't use the Maestro MCP tools.
- At most **2 attempts per row**. After the second failed attempt, record what you saw and move on.
- Don't re-run a row that already has a Result unless the packet says so.

## 2. Environment (run first, in Git Bash)
```bash
export JAVA_HOME="/c/Program Files/Android/Android Studio/jbr"; export ANDROID_HOME="$LOCALAPPDATA/Android/Sdk"
export PATH="$PATH:$HOME/.maestro/bin:$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator"; export MSYS_NO_PATHCONV=1
adb devices                                                   # must show: emulator-5554  device
adb shell "sha256sum \$(pm path com.taskbuddy.app | sed 's/package://')"   # must equal the sha in your packet
~/.taskbuddy-e2e/devstate.sh                                  # must exit 0 (prints "devstate OK")
mkdir -p ~/.taskbuddy-e2e/logs/<slice> ~/.taskbuddy-e2e/scratch/<slice>
```
If any precheck fails, STOP and report. Don't try to fix the emulator.

Shell state doesn't persist between your Bash calls. Repeat the `export` line (or prefix commands
with it) in every call that uses `adb` or `maestro`.

## 3. Tools (in `~/.taskbuddy-e2e/`)
| Tool | Usage |
|---|---|
| `mt.sh <flow.yaml>` | Runs `maestro test` quietly, printing the last 25 lines (`TAILN=n` for more). Save its output: `./mt.sh f.yaml > logs/<slice>/<TC>.log 2>&1; tail -5 logs/<slice>/<TC>.log` |
| `hier.sh` | Prints the current screen's elements as `resource-id \| text \| bounds`. Use it before you target elements and after each step to see where you are. **Always run it as `PYTHONIOENCODING=utf-8:replace ~/.taskbuddy-e2e/hier.sh`**: the ₱ sign crashes the default encoding (₱ then shows as `?`; check screenshots for the real glyph). |
| `cnt.sh "<regex>"` | Prints text length and bounds of on-screen text matching a regex (uses uiautomator) |
| `api.sh` | `source ~/.taskbuddy-e2e/api.sh`, then `login client maestro.client@taskbuddy.test` and `call client GET /jobs/mine`, or `call client POST /jobs/<id>/cancel '{}'`. Tokens are stored in files, never printed. On HTTP 401, run `login` again. |
| `devstate.sh` | Device baseline check: wifi/data on, font scale 1.0, photo permission granted, auto time on, night mode off. Exits non-zero if off. |
| Slice 3.2 only: `goto3.yaml`, `nx.yaml`, `ad1.yaml` in `scratch/3.2/` | Wizard fragments: Plumbing → saved address → step 3; `hideKeyboard` + Next; tap the address field |
| Wizard fragments (`scratch/3.2/`, usable by any slice via `runFlow` with an absolute path) | `w_step2.yaml` (fresh login → step 2), `w_step3.yaml` (→ step 3, one task, "Add photos" visible), `w_step4.yaml` (→ step 4, empty budget), `w_3to5.yaml` (step 3 → review with budget 300), `budget.yaml` (`mt.sh -e B=<v> budget.yaml`) |
| Python on Windows | Pass paths through `cygpath -m` before handing them to Python. |

Write inline flows to `~/.taskbuddy-e2e/scratch/<slice>/<TC>-<n>.yaml`. Each starts with:
```yaml
appId: com.taskbuddy.app
---
```
Screenshot of the current screen: `adb exec-out screencap -p > ~/.taskbuddy-e2e/logs/<slice>/<TC>.png`.
Look at it with the `Read` tool before you write the Result.

Long-running commands: give the Bash call `timeout: 590000` for a long `inputText` (750 characters
takes about 2 minutes). **Never background a maestro run with `&`**: it dies. Foreground `sleep`
over a few seconds is blocked. If a row needs a real-time wait of minutes, STOP at that point and
report it; the orchestrator handles waits.

## 4. Traps (all learned the hard way; obey them)
- **Never** `tapOn: "Back"`. The wizard footer Back is `point: "27%,91%"`; the header arrow is `point: "9%,6%"`.
- `hideKeyboard` with no keyboard up presses **system Back** and drops the wizard draft. After a custom
  task's Enter, do NOT call it.
- `pressKey: back` on the app's Home screen sends the app to the background. Relaunch with
  `- launchApp` (no `clearState`).
- `eraseText` leaves residue in the address, description and custom-task fields. To clear a field,
  tap it by id first, then run
  `adb shell "input keyevent 20; input keyevent 20; input keyevent 20; input keyevent KEYCODE_MOVE_END; for i in \$(seq 1 N); do input keyevent 67; done"`
  (N = number of characters to delete, with margin).
- Gboard capitalises the first letter you type, so a "lowercase" string arrives capitalised. Record
  what was actually typed.
- Re-running a flow that taps a preset task toggles it **off** the second time. Check the
  `N/20 tasks selected` text first.
- Hardware-back rows: from Home, reopen the wizard via `id: "nav-tab-Create Job"` (it exists only on
  Home). From My Jobs, tap `nav-tab-Home` first.
- Date sheet day ids are `undefined.day_YYYY-MM-DD`; past days are disabled. The device date
  **rolled to 2026-10-10**, so check day labels before tapping. The time dialog buttons are "OK" and
  "CANCEL".
- Uploads: the emulator uplink is slow (~15–30 KB/s, E2E-053). Never use the 10 MB+ image unless the
  packet says so.
- The Android photo picker sorts by modification time at one-second granularity, and many old
  test images look identical. The orchestrator supplies **labelled** fixtures (big coloured letters,
  in `~/.taskbuddy-e2e/images/p2/`, pushed with distinct mtimes) and the verified tile points.
  Always screenshot the grid and match it to the packet before tapping a tile.
- A text file renamed `.jpg` is silently ignored by the photo picker (E2E-061). That is a known
  finding; record it, don't chase it.
- **Before any raw `adb shell input tap X Y`, screenshot or `hier.sh` first and confirm which screen is on top.** On Job Details the sticky footer (Find Providers / Cancel Job) covers the area where the bottom tab bar sits on other screens (y ≈ 1900-2250), so a "Home tab" coordinate tap there opens the cancel dialog (happened in 3.3-Q8; recovered with Keep Job). Prefer `tapOn: {id: "nav-tab-Home"}`. If a tap ever opens a destructive dialog, tap "Keep Job"/cancel, then STOP and report.
- **Never tap "Find Providers"** on a job detail unless the packet explicitly says so. It runs the
  recommendation engine on the shared deployed backend and notifies up to 8 providers, who may be
  real people. Open jobs older than their deadline (5/10/15 min by urgency) show the badge
  "Finding Provider": that's the scheduler, not a bug.
- Never put `'; DROP TABLE jobs; --` in a request body. An edge filter returns 403 (E2E-066).
- `inputText` is unreliable for non-ASCII (₱, ñ, emoji). Use ASCII unless the packet says otherwise.
- Avoid a phone-shaped string followed immediately by a tap (Gboard suggestion chip). Use `pressKey: Enter` first.
- More traps: `mobile/maestro/README.md` sections "Known selector traps" and "Slice 3.2 notes".

## 5. Per-row protocol
For each row in your packet, in order:
1. **Run it.** One coherent inline flow per step, plus `adb`/`curl` as the packet says. Save all
   maestro output for the row to `~/.taskbuddy-e2e/logs/<slice>/<TC>.log` (append with `>>` across
   steps).
2. **Evidence:** `adb exec-out screencap -p > ~/.taskbuddy-e2e/logs/<slice>/<TC>.png` at the moment
   that shows the result (the error copy, the posted job, and so on). Read it.
3. **Server check** if the row touches data: run the GET the packet names (for example
   `call client GET /jobs/mine`) and append the relevant fields (no tokens) to the log.
4. **Write the Result cell:**
   - Find the line: `grep -n "^| <TC> |" docs/e2e-sweep/test-cases/<slice>.md`.
   - `Read` that file with `offset` = line number and `limit` = 1.
   - `Edit` only the Result cell of that line (and the Finding/Flow cell if the packet says).
   - Format: `Pass: <what you saw>`, `Fail: <what you saw> (expected <x>)`, `Blocked: <reason>`, or
     `N-A: <reason>`. Never a bare "Pass". Quote on-screen copy exactly.
   - **One line, no `|` characters, no newlines, no tokens.** If the row's cell already holds an
     earlier result and the packet says to append, keep it and add `; in-app: …`.
5. **Fail or Blocked:** append a block to `~/.taskbuddy-e2e/scratch/<slice>/candidates.md`:
   ```
   ## <TC> — <short title>
   Steps: … / Expected: … / Actual: … / Evidence: logs/<slice>/<TC>.png / Logcat (if crash): …
   ```
   Don't assign an E2E id or a severity. The orchestrator does that.
6. **Odd things seen:** anything off that isn't the row's subject (a typo, overlap, a slow screen, a
   flicker, a confusing label) goes in your final report's "Odd things seen" list, not in the
   test-case file.

## 6. Cleanup (always, even after a failure or a STOP)
```bash
adb shell svc wifi enable; adb shell svc data enable
adb shell pm grant com.taskbuddy.app android.permission.READ_MEDIA_IMAGES
adb shell settings put system font_scale 1.0
# cancel EVERY job you created: source ~/.taskbuddy-e2e/api.sh; call client POST /jobs/<id>/cancel '{}'
# then confirm: call client GET /jobs/mine  -> none of your jobs are open
~/.taskbuddy-e2e/devstate.sh
```

## 7. STOP immediately and report (after cleanup) if
- the app crashes or shows an ANR ("isn't responding"); grab `adb logcat -d -t 300 *:E` into the log;
- a wallet figure changes (`GET /wallet`) when the packet didn't predict it;
- one Post creates 2 or more jobs;
- login fails with anything other than HTTP 429 (on 429: wait about 65 s once, then retry);
- a command is blocked or asks for permission;
- a step needs a file, account or admin action the packet doesn't name;
- the screen doesn't match the packet's description and you can't find the described element with
  `hier.sh`.

## 8. Return (your final message, exactly these sections)
1. **Results:** a table `TC | Result (as written) | log | png`.
2. **Jobs created:** id, title, and cancel status (`cancelled` confirmed by GET), or "none".
3. **Odd things seen:** a bullet list, or "none".
4. **Deviations:** anything you did differently from the packet and why, or "none".
5. **STOP reason**, if you stopped early.
6. **`git status --porcelain`** output, verbatim.
