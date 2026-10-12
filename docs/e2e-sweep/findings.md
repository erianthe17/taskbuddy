# E2E findings

Ids are `E2E-###`, numbered across the whole sweep. Solved items move from `## Open` to `### E2E-132 — Chat: text typed while a message is sending is wiped when the reply lands
- **Found:** 2026-10-12, slice 7.1, case 7.1-26   **Role:** both (same code in HOChat and SPChat)
- **Category:** app-bug   **Severity:** S4   **Status:** Open
- **Steps:** 1. Open a job chat, type "E2E 7.1 inflight A". 2. Tap Send and straight away type " B".
- **Expected:** only the sent text clears; " B" stays in the field.   **Actual:** the field read "E2E 7.1 inflight A B" while the send was in flight, then emptied when the reply landed; " B" is lost (stored body "E2E 7.1 inflight A"). Send also shows no in-flight state (still solid blue).
- **Evidence:** `evidence/E2E-132-typed-during-send.png`, `evidence/E2E-132-after-reply.png`
- **Suspected cause:** `setText('')` runs after `await api.sendMessage` with no check that the text is unchanged (`mobile/app/(homeowner)/screens/HOChatScreen.tsx:113-115`, SPChatScreen +3). Fix idea: clear only if the field still equals the sent text, or clear before awaiting and restore on error.

### E2E-133 — Chat: an unsent draft is lost when leaving the chat screen
- **Found:** 2026-10-12, slice 7.1, case 7.1-28   **Role:** both
- **Category:** ux   **Severity:** S4   **Status:** Open (needs product sign-off: keep drafts per conversation?)
- **Steps:** 1. Open a job chat, type "E2E 7.1 draft check", don't send. 2. Header back to Job Details. 3. Tap Message again.
- **Expected:** the draft is still in the field.   **Actual:** the field is empty ("Message…"); nothing was sent.
- **Evidence:** `evidence/E2E-133-draft-gone.png`
- **Suspected cause:** the draft is component state (`HOChatScreen.tsx:68`) and `App.tsx:589-600` unmounts the chat when the route changes. Same class as E2E-051 (wizard draft).

- **Also seen (2026-10-12, 7.3-21):** Leave Review loses its stars and typed comment when you leave with the header back arrow and come back.
- **Also seen (2026-10-12, 7.4-20):** the complaint filing screen drops the typed details and the chosen reason ("Other" → back to "Payment or cancellation issue") when you leave and reopen it.
### E2E-134 — Chat: back arrow, attach and Send buttons have no accessibility label
- **Found:** 2026-10-12, slice 7.1, case 7.1-29   **Role:** both
- **Category:** ux   **Severity:** S4   **Status:** Open
- **Steps:** Open a job chat; uiautomator dump.
- **Expected:** each icon-only control has a label ("Back", "Attach photo", "Send").   **Actual:** all three are clickable nodes with empty text, content-desc and resource-id (back [53,111][152,211], paperclip [37,2098][142,2203], Send [933,2096][1043,2206]).
- **Evidence:** `evidence/E2E-134-chat-icons.png`; dump in `~/.taskbuddy-e2e/logs/7.1/7.1-29-dump.xml` (not committed)
- **Suspected cause:** the three `Tap`s carry no `accessibilityLabel`/testID (`HOChatScreen.tsx:166, 208-213, 229-236`). Same class as E2E-033.

### E2E-135 — Chat API: a non-participant's empty post gets 400 instead of 403
- **Found:** 2026-10-12, slice 7.1, case 7.1-22   **Role:** both (API)
- **Category:** backend-bug   **Severity:** S4   **Status:** Open
- **Steps:** As maestro.provider2 (not on the job) `POST /conversations/<C1b conv>/messages {"body":""}`; as maestro.client2 the same with `{}`.
- **Expected:** 403 "You are not a participant of this chat".   **Actual:** 400 "Message must have text or an attachment." for both. Nothing is created and nothing leaks (non-empty bodies get 403, 7.1-21), so this is a check-order note only.
- **Evidence:** `~/.taskbuddy-e2e/logs/7.1/7.1-22.log`
- **Suspected cause:** `backend/src/chat/chat.service.ts:199-202` validates the body before `assertParticipant` at :203. Suggested fix: call `assertParticipant` first.

### E2E-136 — Reading a chat leaves its "New message" notifications unread
- **Found:** 2026-10-12, slice 7.1, case 7.1-20   **Role:** both
- **Category:** ux   **Severity:** S4   **Status:** Open
- **Steps:** 1. The client sends several messages on a job. 2. The provider taps one "New message" notice (or opens the chat from the job) and reads the whole chat. 3. Back to Notifications / Home.
- **Expected:** notices for messages already read in the chat stop counting as unread.   **Actual:** only the tapped notice is marked read; the other 7 stay unread with their dots and the bell went 24 → 23 (API: 8 of 9 "New message" unread). Each message makes its own notice, so a busy chat inflates the badge until the user taps every one or uses Mark all read.
- **Evidence:** `evidence/E2E-136-chat-notices-still-unread.png`
- **Suspected cause:** opening a chat only sets `messages.read_at` (`backend/src/chat/chat.service.ts:273-282`, called from `HOChatScreen.tsx:95`); notices are marked read only from the list (`HONotificationsScreen.tsx:125-128`). Fix idea: mark the conversation's message notices read in `markRead`, or collapse per-conversation notices.

### E2E-137 — Chat: the "Cannot reach the server" line stays after a later photo send succeeds
- **Found:** 2026-10-12, slice 7.1, case 7.1-14   **Role:** both
- **Category:** app-bug   **Severity:** S4   **Status:** Open
- **Steps:** 1. In a job chat go offline, attach a photo → "Cannot reach the server. Check your connection and try again." shows above the list. 2. Go online, attach the photo again.
- **Expected:** the error line clears once the send succeeds.   **Actual:** the photo bubble appears (stored once) but the error line stays above the list until the chat is reopened.
- **Evidence:** `evidence/E2E-137-error-stays-after-photo.png`
- **Suspected cause:** `setError` is cleared only when the chat loads (`HOChatScreen.tsx:79`); the attach success path (:130-140) never resets it. Fix: `setError(null)` at the start of each send/attach.

### E2E-138 — Chat: a text message that fails to send (offline) shows no error at all
- **Found:** 2026-10-12, slice 7.1, case 7.1-15   **Role:** both
- **Category:** app-bug   **Severity:** S3   **Status:** Open
- **Steps:** 1. In a job chat type "E2E 7.1 offline text". 2. Go offline, tap Send.
- **Expected:** a visible line such as "Cannot reach the server. Check your connection and try again.", text kept for retry.   **Actual:** the text stays in the field and nothing else happens — no error, no failed-state bubble — so the sender cannot tell the message did not go (they may leave thinking it was sent). After reconnecting, one Send stored it once.
- **Evidence:** `evidence/E2E-138-offline-send-silent.png`
- **Suspected cause:** the send `catch` only keeps the text and shows nothing (`HOChatScreen.tsx:117-118`, SPChatScreen +3). Fix: `setError(getErrorMessage(e))` in that catch (the attach path already does this at :139).

### E2E-139 — Chat composer silently stops at 500 characters; the API accepts 1000
- **Found:** 2026-10-12, slice 7.1, case 7.1-07   **Role:** both
- **Category:** app-bug   **Severity:** S4   **Status:** Open
- **Steps:** In a job chat type 600 characters.
- **Expected:** the field takes up to the backend limit (1000, `backend/src/chat/dto/chat.dto.ts:26`, DB check in migration 0031:10), or shows a counter/limit.   **Actual:** the field stops at exactly 500; characters 501–600 are dropped with no message or counter. `POST …/messages` with 1000 characters is accepted (7.1-08), so the two limits disagree.
- **Evidence:** `evidence/E2E-139-composer-stops-500.png`
- **Suspected cause:** `maxLength={500}` at `mobile/app/(homeowner)/screens/HOChatScreen.tsx:227` and `SPChatScreen.tsx:230`. Fix: use 1000 (CLAUDE.md "limits are defined once on the backend and mirrored").

### E2E-140 — Chat header shows every job status in success green, including "Cancelled"
- **Found:** 2026-10-12, slice 7.1, cases 7.1-01, 7.1-18, 7.1-19   **Role:** both
- **Category:** ux   **Severity:** S4   **Status:** Open
- **Steps:** Open the chat of a cancelled job (K4).
- **Expected:** the status label uses the status's own colour (as on job cards).   **Actual:** "Cancelled", "Completed" and "Confirmed" are all drawn in the same green (rgb 21,128,61), so a cancelled job reads as a positive state.
- **Evidence:** `evidence/E2E-140-141-cancelled-chat.png`
- **Suspected cause:** `headerStatus` hard-codes `V6Colors.successText` (`HOChatScreen.tsx:269`, SPChatScreen +3) instead of the status tone from `src/lib/format.ts`.

### E2E-141 — Chat stays fully writable on cancelled and completed jobs (product decision)
- **Found:** 2026-10-12, slice 7.1, cases 7.1-18, 7.1-19   **Role:** both
- **Category:** ux   **Severity:** S4   **Status:** Open (needs product sign-off)
- **Steps:** Open the chat of a job cancelled before start (K4) or completed (J1); send a message.
- **Expected:** a defined rule. Keeping chat open on a completed job inside the 7-day warranty is sensible (complaint evidence, migration 0041:172). On a job cancelled before work began, and after the warranty ends, the conversation could become read-only or show a "This job is cancelled" note.   **Actual:** the composer looks normal and both sends were accepted (K4 and J1 each now hold one message); the API has no status check (`backend/src/chat/chat.service.ts:193-225`), and the app shows no note.
- **Evidence:** `evidence/E2E-140-141-cancelled-chat.png`
- **Suspected cause:** by design today. Decision for the product owner: lock chat on cancelled jobs and after warranty expiry, or keep it open with a status note.

### E2E-142 — Chat: photos can't be opened full size and message text can't be copied
- **Found:** 2026-10-12, slice 7.1, cases 7.1-X01, 7.1-X02 (exploratory)   **Role:** both
- **Category:** ux   **Severity:** S4   **Status:** Open
- **Steps:** 1. In a job chat tap a photo bubble. 2. Long-press a text bubble.
- **Expected:** the photo opens full size; long-press offers Copy (people send addresses and numbers in chat; photos are complaint evidence).   **Actual:** tapping the photo does nothing; long-press shows no menu or selection.
- **Evidence:** `evidence/E2E-142-no-photo-viewer-no-copy.png`
- **Suspected cause:** the bubble renders a plain `Image` (200 × 150 dp) with no press handler and a `Text` without `selectable` (`HOChatScreen.tsx:150-155`, SPChatScreen +3).

### E2E-143 — Notifications API answers success for another user's notification id
- **Found:** 2026-10-12, slice 7.2, case 7.2-30   **Role:** both (API)
- **Category:** backend-bug   **Severity:** S4   **Status:** Open
- **Steps:** As maestro.provider `POST /notifications/<a maestro.provider2 notice id>/read` and `DELETE /notifications/<same id>`.
- **Expected:** 404 (not found for this user).   **Actual:** 201 `{"success":true}` and 204. p2's notice is unchanged (still listed, `read_at` null), so nothing leaks or changes. Only the response is wrong, which hides client bugs and lets a caller probe ids without feedback.
- **Evidence:** `~/.taskbuddy-e2e/logs/7.2/7.2-30.log`
- **Suspected cause:** both queries filter by recipient and return success whether or not a row matched (`backend/src/notifications/notifications.controller.ts:86-93`, `:109-122`). Suggested fix: check the affected row count and throw `NotFoundException` when it is 0.

### E2E-144 — Notification bodies show raw decision words and an unformatted credit amount
- **Found:** 2026-10-12, slice 7.2, case 7.2-25   **Role:** both
- **Category:** ux   **Severity:** S4   **Status:** Open
- **Steps:** Open Notifications on c1, p2 and c2 after complaint resolutions and a recovery credit.
- **Expected:** sentence copy and ₱ amounts.   **Actual:** "Complaint resolved" — "An admin recorded a decision: released_to_provider." / "refunded_to_client" / "reviewed" (raw enum words); "Trust credit issued" — "You received a credit of 100: E2E 6.3 recovery voucher" (no ₱, no decimals). The Complaint Status screen's raw values are E2E-112 and the withdrawal amounts are E2E-126; this entry covers the two other writers.
- **Evidence:** `evidence/E2E-144-trust-credit-raw-amount.png`
- **Suspected cause:** the complaint trigger concatenates the enum (`backend/supabase/migrations/0041_complaints_and_cancellation_review.sql:248-249`); the recovery-credit notice formats the amount with plain string interpolation (`backend/src/wallet/wallet.service.ts:345-346`). Fix in a new migration or service: map decisions to phrases ("released to the provider") and format amounts as ₱x.xx.

### E2E-145 — Home "Recent activity" rows do nothing when tapped, and the Post a job button covers the first row
- **Found:** 2026-10-12, slice 7.2, case 7.2-35   **Role:** client
- **Category:** ux   **Severity:** S4   **Status:** Open
- **Steps:** Client Home → Recent activity → tap the "New message / E2E 7.2 seed notice 51" row.
- **Expected:** the row opens the same target as in the Notifications list (here the chat).   **Actual:** nothing happens and the badge stays 51; only "View all" works. The floating "Post a job" button also sits over the right half of the first row.
- **Evidence:** `evidence/E2E-145-recent-activity-inert.png`
- **Suspected cause:** the rows are plain Views with no press handler (`mobile/app/(homeowner)/screens/HOHomeScreen.tsx:262-278`). Fix: wrap them in the same `resolveNotificationTarget` routing the list uses (`src/lib/notificationRouting.ts`), and add bottom padding under the FAB.

### E2E-146 — Provider bell is announced as "Notifications" with no unread count
- **Found:** 2026-10-12, slice 7.2, case 7.2-02   **Role:** provider
- **Category:** ux   **Severity:** S4   **Status:** Open
- **Steps:** Provider Dashboard with unread notices; uiautomator dump.
- **Expected:** the bell is announced as "Notifications, 19 unread", as the client bell is ("Notifications, 51 unread", 7.2-01).   **Actual:** bell content-desc "Notifications"; the count sits only on the badge child ("19 unread notifications"), so TalkBack reads two separate nodes.
- **Evidence:** `~/.taskbuddy-e2e/logs/7.2/7.2-02.log`
- **Suspected cause:** `mobile/app/(provider)/screens/SPHomeScreen.tsx:188` uses a fixed label; mirror `HOHomeScreen.tsx:128`.

### E2E-147 — Notification icons: a "not selected" rejection gets a blue check, service-request notices get the briefcase fallback
- **Found:** 2026-10-12, slice 7.2, cases 7.2-23, 7.2-24   **Role:** provider
- **Category:** ux   **Severity:** S4   **Status:** Open
- **Steps:** Provider Notifications with an "Application update" (not selected) notice and skill-request notices.
- **Expected:** a rejection shows the red shield like other rejections; service-request notices use their own decision/check icon.   **Actual:** 'Your application to "Cleaning: Bathroom cleaning" was not selected.' shows a blue check-in-circle, which reads as success; "Service request submitted" shows the generic briefcase.
- **Evidence:** `evidence/E2E-147-not-selected-blue-check.png`, `evidence/E2E-147-service-request-briefcase.png`
- **Suspected cause:** the red pattern tests only the title (`SPNotificationsScreen.tsx:58`, HONotifications :63), and "Application update" doesn't match; `skill_request_update` is missing from the icon map (`SPNotificationsScreen.tsx:60-69`). Fix: match on the body or a data flag for rejections; add the type to the map.

### E2E-148 — Notifications list: trash and header controls are under 48 dp
- **Found:** 2026-10-12, slice 7.2, case 7.2-33   **Role:** both
- **Category:** ux   **Severity:** S4   **Status:** Open
- **Steps:** Client Notifications; uiautomator dump at 420 dpi.
- **Expected:** at least 48 × 48 dp touch targets.   **Actual:** trash 24 × 24 dp visible node (an 8 dp hitSlop in code makes it about 40 dp); "Mark all read" 89 × 21 dp; header back arrow 38 × 38 dp (same class as E2E-033). Trash buttons sit next to the tappable row, so a near miss opens the notice instead.
- **Evidence:** `evidence/E2E-148-notification-tap-targets.png`
- **Suspected cause:** `HONotificationsScreen.tsx:238` (hitSlop 8), `:242`/`:304` (16 dp icon, 4 dp padding); header text buttons have no padding. Not investigated further.

### E2E-149 — Notifications list stops at 50, while the badge counts every unread notice
- **Found:** 2026-10-12, slice 7.2, case 7.2-27   **Role:** both
- **Category:** ux   **Severity:** S4   **Status:** Open
- **Steps:** c1 holds 51 unread notices (ORCH seeded the 51st). Open Notifications and scroll to the bottom.
- **Expected:** every notice reachable (paging / load more), or the badge counts only reachable notices.   **Actual:** the list ends at the 50th notice with no load-more or footer; the badge and API unread-count say 51, so the oldest notice can only be cleared by "Mark all read". Busy accounts (each chat message is a notice, E2E-136) reach 50 quickly.
- **Evidence:** `evidence/E2E-149-list-stops-at-50.png`
- **Suspected cause:** the snapshot is capped at 50 (`backend/src/notifications/notifications.controller.ts:34`, migration 0042:62), with no paging parameter; the badge uses the uncapped count (0042:63).

### E2E-150 — Tapping a wallet/payment notification marks it read but goes nowhere
- **Found:** 2026-10-12, slice 7.2, case 7.2-05 (also 7.2-21 on the provider)   **Role:** both
- **Category:** ux   **Severity:** S4   **Status:** Open
- **Steps:** c2 → Notifications → tap "Trust credit issued", then "Wallet topped up".
- **Expected:** a wallet notice opens the Wallet tab.   **Actual:** both rows turn read and the screen stays on the list.
- **Evidence:** `~/.taskbuddy-e2e/logs/7.2/7.2-05.png`
- **Suspected cause:** routing reads only data keys (`mobile/src/lib/notificationRouting.ts:7-18`); wallet notices carry `{}` or only amount/payment_intent_id (`backend/src/wallet/wallet.service.ts:507-513`, `payments.service.ts:278`). Fix: route by `type` (`wallet_update`, `payment_update`) to the Wallet tab.

### E2E-151 — Offline tap on a job notification: no message, Job Details sits on its loading skeleton
- **Found:** 2026-10-12, slice 7.2, case 7.2-37   **Role:** client
- **Category:** ux   **Severity:** S4   **Status:** Open
- **Steps:** c1 → Notifications → go offline → tap "Work ready for review" (J1).
- **Expected:** a toast such as "Cannot reach the server. Check your connection and try again.", or an error card with Retry on Job Details.   **Actual:** Job Details opens and shows only skeleton placeholders for the whole observed window (about 3 s), with no toast and no error. The notice correctly stays unread (API `read_at` null). Whether Job Details shows an error card after a longer timeout was not observed.
- **Evidence:** `evidence/E2E-151-offline-notice-tap-skeleton.png`
- **Suspected cause:** the mark-read is fire-and-forget and its catch shows nothing visible (`HONotificationsScreen.tsx:118-128`); Job Details has no early offline state. Not investigated further.

### E2E-152 — Notification "x ago" labels freeze while the list stays open
- **Found:** 2026-10-12, slice 7.2, case 7.2-26   **Role:** both
- **Category:** ux   **Severity:** S4   **Status:** Open
- **Steps:** Open Notifications with a new notice ("just now"); leave the screen untouched for 5 minutes.
- **Expected:** the label moves on ("5 mins ago").   **Actual:** still "just now" after 5 minutes; it showed "6 mins ago" only after leaving and reopening the list.
- **Evidence:** `evidence/E2E-152-just-now-after-5-min.png`; `~/.taskbuddy-e2e/logs/7.2/7.2-26.log`
- **Suspected cause:** `timeAgo` runs at render only (`HONotificationsScreen.tsx:232`, `SPNotificationsScreen.tsx:188`, `src/lib/format.ts:44`), and nothing re-renders the list while it is idle. Fix: a 60 s ticker state on the screen.

### E2E-153 — Notifications: after an offline "Mark all read", Retry only reloads; the banner stays and nothing is marked
- **Found:** 2026-10-12, slice 7.2, case 7.2-08   **Role:** client (provider shows a toast only)
- **Category:** app-bug   **Severity:** S4   **Status:** Open
- **Steps:** c1 with 3 unread → Notifications → go offline → "Mark all read" → back online → tap Retry on the red banner.
- **Expected:** Retry repeats Mark all read, the rows turn read and the banner clears.   **Actual:** the banner "Cannot reach the server. Check your connection and try again." stays, all 3 rows stay unread (API count 3). The same text also shows a second time as a grey line over the list while offline. A manual "Mark all read" afterwards works (7.2-06).
- **Evidence:** `evidence/E2E-153-mark-all-retry-stays.png`
- **Suspected cause:** the banner's Retry calls `reload` rather than the failed action, and the error state isn't cleared on success (`HONotificationsScreen.tsx:100`, `:188-191`). Fix: remember the failed action and retry it; clear the error on any success.

### E2E-154 — API validates the body before checking ownership, so non-owners get 400 instead of 403
- **Found:** 2026-10-12, slice 7.3, case 7.3-25 (same family as E2E-135 in chat)   **Role:** both (API)
- **Category:** backend-bug   **Severity:** S4   **Status:** Open
- **Steps:** As maestro.client2 (not the job owner) `POST /jobs/<J1>/review {"rating":0}`.
- **Expected:** 403 "Not your job", as for a valid body.   **Actual:** 400 "rating must not be less than 1". Nothing is created and nothing leaks. It only tells a non-owner that the job id exists and what shape the body must take, and makes the error order inconsistent.
- **Evidence:** `~/.taskbuddy-e2e/logs/7.3/7.3-25.log`
- **Suspected cause:** the global `ValidationPipe` (`backend/src/main.ts:39-43`) runs before the service-level ownership check (`backend/src/reviews/reviews.service.ts:24`). This is accepted NestJS behaviour; the fix is optional (a guard that checks ownership before the pipe). Recorded for the backend team, low priority.

### E2E-155 — Review comment has no 500-character cap in the app; the server's raw validator text shows and stays
- **Found:** 2026-10-12, slice 7.3, case 7.3-10   **Role:** client
- **Category:** app-bug   **Severity:** S4   **Status:** Open
- **Steps:** Leave Review → 3 stars → type 501 characters → Submit Review.
- **Expected:** the field stops at 500 (the DTO limit, `backend/src/reviews/dto/reviews.dto.ts:18`) or shows a counter; any refusal reads as a sentence.   **Actual:** the field takes all 501. Submit shows the raw "comment must be shorter than or equal to 500 characters" in red, and the line stays even after the field is cleared. Nothing is stored.
- **Evidence:** `evidence/E2E-155-review-501-raw-error.png`
- **Suspected cause:** the comment `TextInput` has no `maxLength` (`mobile/app/(homeowner)/screens/HOLeaveReviewScreen.tsx:117-126`), and the error is cleared only on the next submit (`:65`, `:132`). Same family as E2E-130, E2E-139. Fix: `maxLength={500}`, and clear the error on edit.

### E2E-156 — After reviewing, the client has no way to see the provider's profile or the review from the completed job
- **Found:** 2026-10-12, slice 7.3, case 7.3-28   **Role:** client
- **Category:** ux   **Severity:** S4   **Status:** Open
- **Steps:** Completed job J1 (reviewed) → Job Details → tap the provider name or the rating line on the Service Provider card.
- **Expected:** a route to the provider's profile (where reviews are listed), or the submitted review shown on the job.   **Actual:** nothing opens; only Message is clickable in the card. The card shows "4.0 · 5 jobs completed", and the job page shows "Review submitted" but not the stars or text that were given. The profile is reachable only from an open job's Proposals list.
- **Evidence:** `evidence/E2E-156-no-provider-profile-route.png`
- **Suspected cause:** the Service Provider card is a plain View (`HOJobDetailScreen.tsx:324-348`); `HOProviderProfileScreen` is opened only from `HOJobApplicationsScreen.tsx:274`.

### E2E-157 — A whitespace-only review comment is stored as spaces instead of "no comment"
- **Found:** 2026-10-12, slice 7.3, case 7.3-09   **Role:** client
- **Category:** app-bug   **Severity:** S4   **Status:** Open
- **Steps:** Leave Review → 4 stars → type three spaces in the comment → Submit Review.
- **Expected:** treated as no comment (stored null), like an empty field (7.3-08 stores null).   **Actual:** stored comment is `"   "` (length 3); profile review lists will render it as a blank comment block.
- **Evidence:** `evidence/E2E-157-whitespace-review.png`; API check in `~/.taskbuddy-e2e/logs/7.3/7.3-09.log`
- **Suspected cause:** the app sends the untrimmed text (`HOLeaveReviewScreen.tsx:62`) and the service stores `comment ?? null` without trimming (`backend/src/reviews/reviews.service.ts:47`). Fix: trim on both sides and store null when empty.

### E2E-158 — A verified provider's own Rating stays stale after a new review (until re-login)
- **Found:** 2026-10-12, slice 7.3, case 7.3-30   **Role:** provider
- **Category:** app-bug   **Severity:** S4   **Status:** Open
- **Steps:** p1 (verified) opens Profile (Rating 4.5). A client reviews another p1 job with 2 stars (API average becomes 4.0, count 5). Wait 30 s; go back to the feed and reopen Profile.
- **Expected:** Rating 4.0.   **Actual:** still "4.5" on the open screen and after reopening; the client-side profile and the API show 4.0.
- **Evidence:** `evidence/E2E-158-provider-rating-stale.png`
- **Suspected cause:** the profile reads the cached AuthContext profile (`SPProfileScreen.tsx:84`), refreshed only for unverified providers (`:95-97`) or by edit/avatar/skill-request flows (`AuthContext.tsx:462-470`). Fix: refresh the profile on focus.

### E2E-159 — Providers can't see the reviews they received (no list, no count)
- **Found:** 2026-10-12, slice 7.3, case 7.3-31 (and 7.3-29)   **Role:** provider (count also missing on the client view)
- **Category:** ux   **Severity:** S4   **Status:** Open (needs product sign-off)
- **Steps:** p1 with 5 reviews → Profile → scroll the whole screen.
- **Expected:** the rating with its count and a list of received reviews (stars, job, comment), which the client side already renders.   **Actual:** only "Rating 4.5" and "Jobs Done 5"; no count, no list, no comments. The client view (Provider Profile from Proposals) lists the reviews but also shows no count ("4.5★ · 5 completed jobs", where 5 is jobs, not reviews).
- **Evidence:** `evidence/E2E-159-no-reviews-list.png`
- **Suspected cause:** `SPProfileScreen.tsx:89-90`, `:155-156` render only the cached average; `cached_ratings_count` is typed but never shown (`api.ts:230`, `:279`; `HOProviderProfileScreen.tsx:110-112`).

### E2E-160 — Complaint status: with "Appeal" selected, the button still says "Submit statement"
- **Found:** 2026-10-12, slice 7.4, case 7.4-10   **Role:** both
- **Category:** ux   **Severity:** S4   **Status:** Open
- **Steps:** Open complaint → View Complaint Status → tap the "Appeal" segment.
- **Expected:** the button, placeholder and copy switch to the appeal wording ("Submit appeal").   **Actual:** the Appeal segment shows as selected, but the button still reads "Submit statement" and the placeholder stays "Explain what happened…". The entry kind sent is appeal (HOStat:34), so the user is told one thing and sends another.
- **Evidence:** `evidence/E2E-160-appeal-label.png`
- **Suspected cause:** the button label is keyed on the complaint status, not the selected kind (`mobile/app/(homeowner)/screens/HODisputeStatusScreen.tsx:127`).

### E2E-161 — Provider's complaint filing screen names the provider themself as the other party
- **Found:** 2026-10-12, slice 7.4, case 7.4-12   **Role:** provider
- **Category:** ux   **Severity:** S4   **Status:** Open
- **Steps:** p1 → F2 (in progress) → File a Complaint.
- **Expected:** the subtitle names the job and the client (the other party), or just the job.   **Actual:** "E2E 7.4 F2 in progress complaint · Maestro Provider", the caller's own name (also truncated on screen to "…Maestro Prov…"). The client sees the provider's name, which is correct for them.
- **Evidence:** `evidence/E2E-161-filing-subtitle-own-name.png`
- **Suspected cause:** the shared filing screen always uses `assigned_provider` for the subtitle (`mobile/app/(homeowner)/screens/HODisputeFilingScreen.tsx:53-55`); pick the counterpart by role.

### E2E-162 — After an admin refunds a complaint on a confirmed job, the job stays active with nothing held
- **Found:** 2026-10-12, slice 7.4, case 7.4-24   **Role:** both
- **Category:** backend-bug   **Severity:** S3   **Status:** Open (needs product decision on the end state)
- **Steps:** 1. c1 hires p1 (₱300 held), job confirmed. 2. c1 files a complaint. 3. Admin resolves `refunded_to_client` → c1 gets +300.
- **Expected:** the job ends (cancelled or closed) or is clearly flagged, so no work starts on an unfunded booking.   **Actual:** the job stays `confirmed`. The client still sees Cancel Job, and the provider still has Start Job (7.4-11 showed it offered while the complaint was open). Nothing stops the provider doing the work and completing a job whose payment was already returned. Cancelling now would open a new 48 h cancellation flow on a job with no money.
- **Evidence:** `evidence/E2E-162-refunded-job-still-active.png`; `~/.taskbuddy-e2e/logs/7.4/7.4-24.log`
- **Suspected cause:** the resolve function updates only the complaint and escrow (`backend/supabase/migrations/0041_complaints_and_cancellation_review.sql:240-244`). Job start and complete don't check the escrow or dispute state (`backend/src/jobs/jobs.service.ts:347-363`). Suggested: on `refunded_to_client` for a pre-completion job, cancel the job (or block start/complete when the escrow is refunded).

### E2E-163 — The API accepts a new complaint on a job whose complaint was already decided
- **Found:** 2026-10-12, slice 7.4, case 7.4-30   **Role:** client (API)
- **Category:** backend-bug   **Severity:** S4   **Status:** Open
- **Steps:** M1 (completed, escrow released, complaint closed `released_to_provider`, then reopened by appeal and closed `reviewed`). As c1 `POST /jobs/M1/disputes {"reason":"Work quality issue","details":"…"}`.
- **Expected:** 400, because the decision stands and appeals are the path to reopen (the app hides File a Complaint and offers only View Complaint Status).   **Actual:** 201, a new open complaint on the released escrow (nothing to freeze; no money moved), so an admin gets a second case for the same job.
- **Evidence:** `~/.taskbuddy-e2e/logs/7.4/7.4-30.log`
- **Suspected cause:** `raise_dispute` refuses only when an open complaint exists (`backend/supabase/migrations/0041_complaints_and_cancellation_review.sql:57-61`), not when a decided one does. Suggested: refuse when any complaint for the job is resolved, and direct the user to appeal.

## Found & solved` and keep their id.

## Summary

| Severity | Open | Workaround | Solved | Fixed-on-main-not-deployed | Escalated |
|---|---|---|---|---|---|
| S1 | 0 | 0 | 0 | 0 | 0 |
| S2 | 0 | 0 | 0 | 0 | 1 |
| S3 | 20 | 1 | 0 | 0 | 0 |
| S4 | 134 | 5 | 1 | 0 | 0 |

<details>
<summary>Entry template</summary>

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

</details>

## Open

### E2E-001 — ML service health is down (HTTP 429)
- **Found:** 2026-10-08, slice 0.2, case 0.2-03   **Role:** both
- **Category:** env
- **Severity:** S3 medium
- **Status:** Open
- **Steps:** 1. `GET /health` on the deployed API.
- **Expected:** `ml_service.status` = up.   **Actual:** `{"ml_service":{"status":"down","detail":"HTTP 429"}}`, database up.
- **Evidence:** health JSON, 2026-10-08 09:22Z
- **Suspected cause:** known from HANDOFF.md (ML service 429). Not investigated.
- **Impact:** Slice 5.4 (recommendation path) will not produce invites.

### E2E-002 — Stale confirmed job with ₱500 escrow left on test accounts
- **Found:** 2026-10-08, slice 0.2, case 0.2-11   **Role:** both
- **Category:** env
- **Severity:** S4 low/cosmetic
- **Status:** Workaround (job cancelled via admin after user approval; ₱500 escrow stays `disputed` = frozen for admin review, as designed for cancelling a confirmed job. Not released; leave it, or resolve through a dispute later)
- **Steps:** 1. `GET /admin/bookings?search=Maestro` shows job `5f13ac3f-c909-4a39-b7f2-b750d218d553` ("E2E chat attachment verification job", status `confirmed`, ₱500, client + provider are the maestro accounts). 2. `POST /admin/bookings/:id/cancel` was first blocked by the permission classifier; retried with the user's approval on 2026-10-08 and the job is now `cancelled`.
- **Expected:** no leftovers.   **Actual:** client wallet shows in_escrow 500 (available 49,500); provider wallet shows in_escrow 500.
- **Suspected cause:** leftover from the Sept 16 sweep.

### E2E-003 — Provider readiness gaps for later slices
- **Found:** 2026-10-08, slice 0.2, case 0.2-08   **Role:** provider
- **Category:** env
- **Severity:** S4 low/cosmetic
- **Status:** Workaround (set up in the slices that need it)
- **Actual:** `maestro.provider@` is verified, category Plumbing, address in Lipa (13.9978, 121.1676), `is_available=false`, `service_radius_km=8`; the client has no address or coordinates, so a client job near Quezon City is ~75 km from this provider and the feed's distance filter may hide it. `maestro.provider2@` is unverified with no address. `maestro.client@` and `client2@` have no address.
- **Plan:** 2.x sets addresses; 4.1 verifies provider2; 4.2 sets location with `adb emu geo fix` or an address near the jobs.

### E2E-005 — `jobs_create_plumbing.yaml` uses an address the geocoder now rejects
- **Found:** 2026-10-08, slice 0.3, case 0.3-B07   **Role:** client
- **Category:** harness
- **Severity:** S4 low/cosmetic
- **Status:** Open (fix in Slice 3.1, which explores address suggestions and the date picker)
- **Steps:** 1. Run `jobs_create_plumbing.yaml`. 2. At Location it taps the saved default address, types `123 Test Street, Lipa City`, taps Next.
- **Expected:** the wizard moves to "What Needs Doing".   **Actual:** Next stays on Location. The address field turns red: "That address is too general to locate. Add a house number and street." The app is behaving as designed: the address is geocoded on Next and a job can't be posted until it resolves precisely.
- **Evidence:** not committed (passing-app behaviour; the screenshot is in `~/.taskbuddy-e2e/logs/tmp-b2.png`)
- **Suspected cause:** the flow predates geocoded addresses. It needs a real address or a tap on an address suggestion.

### E2E-006 — `profile_edit_client.yaml` is stale and leaves burner accounts behind
- **Found:** 2026-10-08, slice 0.3, case 0.3-B10   **Role:** client
- **Category:** harness
- **Severity:** S4 low/cosmetic
- **Status:** Open (rewrite in Slice 2.1). Two burners from this are still alive, see below.
- **Steps:** 1. Run the flow on the release build. 2. It fails at `assertVisible: "Full name"` on Edit Profile.
- **Expected:** the flow registers a burner, edits the profile, deletes the burner.   **Actual:** the label is now "Full name *" (required asterisk), so the exact text match failed. With that selector fixed (`Full name.*`) the flow now fails later, when the page has scrolled and the "Full name" anchor is off screen. The burner is never deleted when the flow dies, and the next run then fails at Sign Up with "Email already in use".
- **Suspected cause:** the redesigned Edit Profile has longer content, and address geocoding changed what saves. The flow also hardcodes one burner email. It now uses a per-run unique email (PLAN §4b), but it still can't finish.
- **Leftovers (need cleanup):** `maestro.editprofile@taskbuddy.test` (from the baseline run) and `maestro.burner.ep1791457159659@taskbuddy.test` (from my retry). My attempt to delete the first through `DELETE /profiles/me` was denied by the permission classifier, so I didn't retry it another way.

### E2E-007 — `hire_payment_choice.yaml` has no fixture to run against
- **Found:** 2026-10-08, slice 0.3, case 0.3-B06   **Role:** client
- **Category:** harness
- **Severity:** S4 low/cosmetic
- **Status:** Open (re-run in Slice 5.1 with fixtures made through the API)
- **Steps:** 1. Run the flow. 2. It opens My Jobs → first card → taps `job-detail-view-offers`.
- **Expected:** the first job is open and has a proposal.   **Actual:** the first card is not an open job (the only old job was cancelled in 0.2), and the View Offers button is shown only for `open`/`recommending` jobs (`HOJobDetailScreen.tsx:365`), so the selector isn't on screen.
- **Suspected cause:** the flow depends on a leftover job. PLAN §4b says never to rely on one.

### E2E-008 — "Continue with Google" signs in on its own using the emulator's Google account
- **Found:** 2026-10-08, slice 0.3, case 0.3-R08   **Role:** both
- **Category:** env
- **Severity:** S3 medium
- **Status:** Workaround (the Google account was removed from the AVD on 2026-10-09; re-verified in slice 1.3)
- **Steps:** 1. Clear app data and launch. 2. Tap "Continue with Google". 3. Wait about 10s.
- **Expected:** a Chrome custom tab with an account chooser (the plan stops there).   **Actual (0.3):** the app ended up on the onboarding slides, so the OAuth round trip finished with no interaction. The emulator had a real personal Google account added, and it was used. I cleared the app data (`pm clear`) straight away.
- **Your reply (2026-10-09):** "google log in works correctly no problem". You did not say whether that identity already had a TaskBuddy profile or whether the 0.3 sign-in created one. Nobody looked it up (the plan keeps me to `@taskbuddy.test` accounts), so that is still unknown.
- **Slice 1.3 re-check:** with `dumpsys account` showing `Accounts: 0`, one tap opened a Chrome custom tab on Google's own "Sign in" page (Email or phone field), nothing auto-completed, back returned to Login within 12 s with no ANR and no error banner, and a force-stop plus relaunch landed on Login.
- **Evidence:** `evidence/E2E-008-google-signin-autocompletes.png` (0.3). The 1.3 screenshot is not committed.
- **Remaining ask:** keep personal Google accounts off the test AVD. If the 0.3 tap created a profile for that Google identity on the shared backend, it is still there; delete it yourself if you don't want it.

### E2E-009 — Login banner shows raw class-validator text ("email must be an email")
- **Found:** 2026-10-08, slice 1.1, cases 1.1-09, 1.1-13, 1.1-14, 1.1-30   **Role:** both
- **Category:** ux
- **Severity:** S4 low/cosmetic
- **Status:** Open
- **Steps:** 1. On Login type `a@b.c` (or `a..b@x.com`, or a 300-character local part) and any password. 2. Tap Sign In.
- **Expected:** friendly copy such as "Please enter a valid email address." (the copy the client regex uses for `not-an-email`).   **Actual:** the red banner reads `email must be an email`, the first `message` of the backend's validation array.
- **Evidence:** `evidence/E2E-009-raw-validation-copy.png`
- **Suspected cause:** the client regex at `LoginScreen.tsx:135` is looser than the backend `@IsEmail()`, and `api.ts` shows `data.message[0]` as-is (api.ts:788-790). Fix by tightening the client check or mapping the server's email message.

### E2E-010 — Login rate limit is not enforced reliably on the deployed API
- **Found:** 2026-10-08, slice 1.1, case 1.1-36   **Role:** both
- **Category:** backend-bug
- **Severity:** S3 medium
- **Status:** Open (backend, log only)
- **Steps:** 1. Send 14 sequential `POST /auth/login` requests with a wrong password (a junk email, no real account touched) and read `x-ratelimit-remaining`. 2. Repeat 16 rapid requests.
- **Expected:** 10 per minute, then 429 for every further request until the window ends (`ThrottleAuth`, `common/throttle.ts:44`).   **Actual:** the counter is not monotonic (remaining went 0, 2, 1, 7, 0, 6, 5 …) and statuses alternate between 401 and 429. A burst of 16 requests returned 16 x 401 with no 429, and a run of 12 returned 12 x 401.
- **Suspected cause:** throttler storage is in-memory per process (comment in `app.module.ts`). More than one instance behind the Render proxy would multiply the ceiling and make it random. Not investigated further.
- **Impact:** password guessing is cheaper than the design says. The app's 429 copy ("Too many attempts…", `api.ts:781`) could not be observed on a device, because a 429 could not be produced on demand.

### E2E-011 — Provider avatar on Home is an empty white circle
- **Found:** 2026-10-08, slice 1.1, case 1.1-22   **Role:** provider
- **Category:** ux
- **Severity:** S4 low/cosmetic
- **Status:** Not a bug (corrected 2026-10-09, slice 2.2, case 2.2-06): `maestro.provider@` HAS an avatar. Its `avatar_url` points at an uploaded 1080x1080 JPEG that is mostly white (mean grey 247 of 255, darkest pixel 61), so the app is drawing that image rather than failing to draw one. I could not view the image itself, only measure it. A provider with no avatar (burner `maestro.burner.2.2.1@`) shows the person placeholder on Home, Profile and Edit Profile. Replacing P1's avatar with a real photo would remove the confusion (test-data clean-up only).
- **Steps:** 1. Log in as `maestro.provider@` and look at the Home header.
- **Expected:** initials or the same person placeholder the client Home shows.   **Actual:** a blank white circle (the account has no avatar and, apparently, no initials fallback on a dark header).
- **Evidence:** not committed (screenshot in `~/.taskbuddy-e2e/scratch/out5`)
- **Suspected cause:** not investigated (`OwnAvatar` on `SPHomeScreen`).

### E2E-012 — At font scale 1.3 the focused Login password field is half covered by the keyboard
- **Found:** 2026-10-08, slice 1.1, case 1.1-33   **Role:** both
- **Category:** ux
- **Severity:** S4 low/cosmetic
- **Status:** Open
- **Steps:** 1. `adb shell settings put system font_scale 1.3`. 2. Open Login, tap Password.
- **Expected:** the field and the Sign In button stay visible above the keyboard.   **Actual:** the field's lower half is hidden behind the keyboard and Sign In is off screen until the user scrolls.
- **Evidence:** `evidence/E2E-012-login-font13-keyboard.png`
- **Suspected cause:** `KeyboardAvoidingView behavior="height"` with `justifyContent: center` on a taller form (`LoginScreen.tsx:343`). Not investigated.

### E2E-013 — Register: "Passwords do not match." stays after Password is edited to match Confirm
- **Found:** 2026-10-08, slice 1.2, case 1.2-19/1.2-20   **Role:** both
- **Category:** app-bug
- **Severity:** S4 low/cosmetic
- **Status:** Open
- **Steps:** 1. Register screen, Password `abc12345X`, Confirm `abc12345`, tap Sign Up (mismatch error shows). 2. Edit only the Password field (Backspace) so both read `abc12345`.
- **Expected:** the mismatch error clears (or re-validates) once the two values are equal.   **Actual:** both fields show `abc12345` (visibility toggled on) and the red "Passwords do not match." is still shown until the next submit or an edit of the Confirm field.
- **Evidence:** `evidence/E2E-013-confirm-error-stale.jpg`
- **Suspected cause:** `RegisterScreen.tsx` password onChange calls `clearError('password')` only, not `confirmPassword` (about line 566). Not investigated further.

### E2E-014 — Register: a consent's red error stays after its box is ticked
- **Found:** 2026-10-08, slice 1.2, case 1.2-29   **Role:** both
- **Category:** app-bug
- **Severity:** S4 low/cosmetic
- **Status:** Open
- **Steps:** 1. Register screen, tap Sign Up empty so the three consent errors show. 2. Tick Terms (open the document, tap "I agree to the Terms & Conditions"); then tick Privacy the same way.
- **Expected:** each consent's error disappears when it is ticked, like the field errors do.   **Actual:** the boxes are ticked but "Please accept the Terms & Conditions to continue." and "Please accept the Privacy Policy to continue." stay red until the next submit, so a ticked box sits under an error saying it is not accepted.
- **Evidence:** `evidence/E2E-014-consent-error-stale.jpg`
- **Suspected cause:** no `clearError` call on the terms/privacy/data-collection handlers (`RegisterScreen.tsx` around lines 505-508, 651-654, 671-674, 691). Not investigated further.

### E2E-015 — Register banner shows raw class-validator text ("email must be an email")
- **Found:** 2026-10-08, slice 1.2, case 1.2-12/13/14   **Role:** both
- **Category:** app-bug
- **Severity:** S4 low/cosmetic
- **Status:** Open
- **Steps:** 1. Register screen, fill a valid client form and tick all three consents. 2. Enter an email the app's regex accepts but the server's `@IsEmail()` rejects: `a@b.c`, `a..b@x.com`, `x@y.com';--`, `<script>@x.com`, or a 300-character local part. 3. Tap Sign Up.
- **Expected:** friendly copy such as "Please enter a valid email address.", like the client-side check.   **Actual:** a red banner reading "email must be an email". No account is created, the spinner stops and the form values are kept. A 300-character email does not break the layout. Same defect as E2E-009 on Login.
- **Evidence:** `evidence/E2E-015-register-raw-validation-copy.jpg`
- **Suspected cause:** the client regex (`RegisterScreen.tsx:323`) is looser than the DTO's `@IsEmail()` (`auth.dto.ts:16`), and `api.ts:789` passes `message[0]` through verbatim. Fixing it would share one mapping with E2E-009. Not investigated further.

### E2E-016 — At font scale 1.3 the focused Register Password and Confirm fields are half covered by the keyboard
- **Found:** 2026-10-08, slice 1.2, case 1.2-50   **Role:** both
- **Category:** ux
- **Severity:** S4 low/cosmetic
- **Status:** Open
- **Steps:** 1. `adb shell settings put system font_scale 1.3`. 2. Open Register, dismiss the keyboard, scroll to Password (then Confirm Password) and tap the field.
- **Expected:** the focused field sits fully above the keyboard.   **Actual:** the field's lower half is hidden behind the keyboard. The user can still scroll the form, and Name and Email stay fully visible. Same pattern as E2E-012 on Login. At this scale the Client / Service Provider buttons stack vertically, as designed.
- **Evidence:** `evidence/E2E-016-register-font13-keyboard.jpg`
- **Suspected cause:** `KeyboardAvoidingView behavior="height"` (`RegisterScreen.tsx` around 789-792), the same cause as E2E-012. Not investigated further.

### E2E-017 — Register Full Name: the word "Mareng" turns into "Marengo" while typing
- **Found:** 2026-10-08, slice 1.2, case 1.2-01/1.2-02   **Role:** client
- **Category:** ux (cause unconfirmed, may be env: emulator keyboard)
- **Severity:** S4 low/cosmetic
- **Status:** Open
- **Steps:** 1. Open Register. 2. Maestro `inputText: "Ate Mareng Paayos-Gripo"` into Full Name. 3. Read the field, then (burner.1) sign up and read `GET /auth/me`.
- **Expected:** the field keeps exactly what was typed.   **Actual:** the field already shows "Ate Marengo Paayos-Gripo", and that value is what the backend stores (`full_name`). Filipino names are easily rewritten by a dictionary suggestion, so a real user could be hit too.
- **Evidence:** `evidence/E2E-017-name-word-changed-while-typing.png`
- **Suspected cause:** `autoCorrect={false}` is already set on the input (`RegisterScreen.tsx:146`), so the change probably comes from the emulator's keyboard suggestions applied on the space. Not confirmed on a physical device. Not investigated further.

### E2E-018 — Register Full Name keyboard starts in lower-case (no auto-capitalisation)
- **Found:** 2026-10-08, slice 1.2, case 1.2-53   **Role:** both
- **Category:** ux
- **Severity:** S4 low/cosmetic
- **Status:** Open
- **Steps:** 1. Open Register. 2. Tap Full Name.
- **Expected:** the keyboard opens with Shift on, so names start with a capital letter (like "Alex Chen" in the placeholder).   **Actual:** the keyboard is in lower-case with Shift off, so users type "juan dela cruz" unless they press Shift themselves.
- **Evidence:** `evidence/E2E-018-register-name-no-capitalize.png`
- **Suspected cause:** the shared `FormInput` sets `autoCapitalize="none"` for every field including Name (`RegisterScreen.tsx:145`); there is no prop to override it for names. A `words` setting would only be needed on Name. Not investigated further.

### E2E-019 — Delete Account dialog differs between client and provider
- **Found:** 2026-10-08, slice 1.2, case 1.2-57/58   **Role:** both
- **Category:** ux
- **Severity:** S4 low/cosmetic
- **Status:** Open (belongs to Slice 2.3, logged here because the cleanup flows hit it)
- **Steps:** 1. Log in as a client, Home avatar, Settings, Delete Account. 2. Repeat as a provider (scroll to Settings on the profile).
- **Expected:** the same confirmation wording and buttons for the same destructive action.   **Actual:** the client dialog reads "This permanently removes your personal details and signs you out. You must first clear any wallet balance, pending withdrawal, active job, escrow hold, or dispute." with buttons "Cancel" / "Delete Account". The provider dialog has an icon, different wording ("Your profile, contact details and settings are removed ... This can't be undone.") and buttons "Keep My Account" / "Delete". Maestro flows need role-specific selectors because of this (`settings_delete_account_burner.yaml` only works for clients).
- **Evidence:** `evidence/E2E-019-delete-dialog-client.png` (provider dialog seen on screen, not saved)
- **Suspected cause:** two separate dialog components. Not investigated.

### E2E-020 — Forgot Password banner shows raw class-validator text ("email must be an email")
- **Found:** 2026-10-09, slice 1.3, cases 1.3-05, 1.3-06   **Role:** both
- **Category:** ux
- **Severity:** S4 low/cosmetic
- **Status:** Open (twin of E2E-009 on Login and E2E-015 on Register)
- **Steps:** 1. Login, "Forgot Password?". 2. Type `not-an-email` (also `x@y`), tap "Send reset code".
- **Expected:** friendly copy such as "Please enter a valid email address." and no advance to stage 2.   **Actual:** red card reads `email must be an email`. The screen has no client-side format check, only an empty check.
- **Evidence:** `evidence/E2E-020-forgot-raw-validation-copy.png`
- **Suspected cause:** `ForgotPasswordScreen.tsx:81` only checks `!email.trim()`; `api.ts:788-790` passes `message[0]` through as-is. Same fix as E2E-009.

### E2E-021 — Forgot Password keeps its error card after the input is corrected (both stages)
- **Found:** 2026-10-09, slice 1.3, cases 1.3-13, 1.3-34   **Role:** both
- **Category:** ux
- **Severity:** S4 low/cosmetic
- **Status:** Open (same class as E2E-013/014)
- **Steps:** 1. Reach stage 2 with an unknown address. 2. Code `123456`, New `TestPass123!`, Confirm `TestPass123?`, tap "Reset password" (error appears). 3. Edit Confirm to `TestPass123!` without tapping anything else.
- **Expected:** the error clears once the input changes.   **Actual:** both rules turn green ("At least 8 characters", "Both passwords match") while the red card still says "Those passwords do not match.", until the next submit.
- **Also on stage 1 (case 1.3-13):** tap "Send reset code" with an empty field ("Enter the email address on your account."), then type a valid address: the red card stays above the valid value.
- **Evidence:** `evidence/E2E-021-forgot-stale-mismatch-error.png`, `evidence/E2E-021-forgot-stage1-stale-empty-error.png`
- **Suspected cause:** `ForgotPasswordScreen.tsx:79-80,99-101` clear `error` only at the start of a submit; the `onChangeText` handlers don't.

### E2E-022 — Forgot Password stage 2 shows Supabase's raw "Token has expired or is invalid"
- **Found:** 2026-10-09, slice 1.3, case 1.3-33   **Role:** both
- **Category:** ux
- **Severity:** S4 low/cosmetic
- **Status:** Open
- **Steps:** 1. Stage 2 with an unknown address. 2. Code `123456`, matching valid passwords, tap "Reset password".
- **Expected:** the screen's own copy ("That code is invalid or has expired.", `ForgotPasswordScreen.tsx:120`).   **Actual:** red card reads "Token has expired or is invalid", passed through from the backend. No account existence leak (the same text would come back for a real account with a wrong code).
- **Evidence:** `evidence/E2E-022-forgot-raw-token-copy.png`
- **Suspected cause:** the friendly string is only a fallback for non-Error throws; `e.message` is shown whenever the server sends one.

### E2E-023 — Hardware back on the first-run onboarding slides closes the app
- **Found:** 2026-10-09, slice 1.3, case 1.3-59   **Role:** both
- **Category:** ux
- **Severity:** S4 low/cosmetic
- **Status:** Open (needs product sign-off: it may be intended, since there is nowhere to go back to)
- **Steps:** 1. Clear app data, log in as `maestro.client@`. 2. On the first onboarding slide press hardware back.
- **Expected:** back is absorbed (or goes to the previous slide), as it does on every other screen.   **Actual:** the app leaves to the launcher. Relaunching keeps the session and shows the slides again (the "seen" flag is only saved on Skip / Get Started); Skip then force-stop then relaunch lands on Home with no slides.
- **Evidence:** observed via `dumpsys activity` (top activity = launcher), no screenshot.
- **Suspected cause:** `App.tsx:282-284` returns false from the back handler while onboarding is showing.

### E2E-024 — Forgot Password stage 2: Confirm field half covered by the keyboard at font scale 1.3
- **Found:** 2026-10-09, slice 1.3, case 1.3-44   **Role:** both
- **Category:** ux
- **Severity:** S4 low/cosmetic (the field can still be typed in and the screen scrolls)
- **Status:** Open (same class as E2E-012/016)
- **Steps:** 1. `adb shell settings put system font_scale 1.3`. 2. Forgot Password, an unknown address, stage 2. 3. Fill code and New password, tap Confirm new password.
- **Expected:** the focused field and its text are fully visible above the keyboard.   **Actual:** the Confirm field's lower half is under the keyboard and its placeholder is clipped ("Re-enter your new passwor"); the rules, "Reset password" and the footer are not visible until the user hides the keyboard.
- **Evidence:** `evidence/E2E-024-forgot-confirm-field-under-keyboard-1.3x.png`
- **Suspected cause:** `KeyboardAvoidingView behavior="height"` inside a ScrollView (`ForgotPasswordScreen.tsx:315-318`), same pattern as Register.

### E2E-025 — Edit Profile: a 121-character name reaches the server and comes back as raw validation text
- **Found:** 2026-10-09, slice 2.1, case 2.1-13   **Role:** client
- **Category:** ux
- **Severity:** S4
- **Status:** Open
- **Steps:** 1. Log in as `maestro.editprofile@`. 2. Profile > Edit Profile. 3. Replace the name with 121 `b` characters. 4. Save Changes > Save Changes in the modal.
- **Expected:** The input is capped at 120 (the DTO's `@Length(1,120)`) or friendly copy shows.
- **Actual:** The request goes out and the red line above Save reads `full_name must be shorter than or equal to 120 characters`. The stored name stayed at the previous 120 characters. 120 characters saves fine (2.1-12) and wraps cleanly in the Profile hero.
- **Evidence:** `evidence/E2E-025-name-121.png`
- **Suspected cause:** `HOEditProfileScreen.tsx` has no `maxLength` on the name input (only the empty check). The raw message is the same class as E2E-009/015/020.
- **Solution (if solved):** n/a

### E2E-026 — Phone accepts any text: letters, symbols and 40 digits save and display as-is
- **Found:** 2026-10-09, slice 2.1, cases 2.1-28/29/30   **Role:** client
- **Category:** ux
- **Severity:** S4
- **Status:** Open (needs product sign-off)
- **Steps:** 1. Edit Profile on `maestro.editprofile@`. 2. Set Phone to `abc`, `+-*#`, then 40 `1`s (typed through Maestro, which bypasses the number pad). 3. Save and confirm each.
- **Expected:** Some format check, or a documented decision that phone is free text. The placeholder `+63 9XX XXX XXXX` implies a PH number.
- **Actual:** All saved verbatim and Profile > Account Info shows them. Valid PH formats (`+63 917 123 4567`, `09171234567`, `9171234567`, `(02) 8123 4567`) also save as typed, with no normalising. Clearing the field saves `""` and Profile shows `—`.
- **Evidence:** `evidence/E2E-026-phone-junk.png` (top: `abc`, bottom: 40 digits)
- **Suspected cause:** `HOEditProfileScreen.tsx` has no phone validation and `profiles.dto.ts` declares `phone` as `@IsString()` only. Not a defect unless the spec wants one. Matters for SMS Alerts later.
- **Solution (if solved):** n/a

### E2E-027 — Edit Profile: address suggestions render below the fold, hidden behind the keyboard while typing
- **Found:** 2026-10-09, slice 2.1, case 2.1-19   **Role:** client
- **Category:** ux
- **Severity:** S4
- **Status:** Open
- **Steps:** 1. Profile > Edit Profile. 2. Tap Address and type `Ayala Ave`. 3. Wait 2-4 s.
- **Expected:** The matching suggestions are visible above the keyboard, or the field scrolls up to show them.
- **Actual:** The Address field sits at the bottom edge with the keyboard directly beneath it, so the list that loaded (Ayala Avenue, Makati; Ayala Avenue Extension; Ayala Avenue, San Pascual) is invisible. After hiding the keyboard (hardware back) the dropdown is there and selecting a row fills Address and City. A user who doesn't dismiss the keyboard sees no suggestions and may think the lookup is broken.
- **Evidence:** `evidence/E2E-027-address-suggestions-under-keyboard.png`
- **Suspected cause:** `HOEditProfileScreen.tsx` uses `KeyboardAvoidingView behavior="height"` (same pattern as E2E-012/016/024) and the dropdown renders inline under the field. Not investigated further.
- **Solution (if solved):** n/a
- **Update 2026-10-09 (slice 2.2, case 2.2-38):** reproduced on the provider Edit Profile. With the keyboard up the suggestion list is not visible; it only appears after pressing Back.

### E2E-028 — Avatar: picking a non-image file (text renamed `.jpg`) leaves a blank white screen with no error
- **Found:** 2026-10-09, slice 2.1, case 2.1-39   **Role:** client
- **Category:** app-bug
- **Severity:** S4
- **Status:** Open
- **Steps:** 1. Push `fake.jpg` (22 bytes of text) to `/sdcard/Pictures` and run the media scan. 2. Edit Profile > Change Photo. 3. Tap the blank tile in the system photo picker (second tile, top row).
- **Expected:** An inline "couldn't use that image" message, or the crop step opens and fails clearly, and the Edit screen comes back.
- **Actual:** The app area goes fully white (status and nav bars only). The view hierarchy is empty, `MainActivity` stays resumed, the process is alive, and nothing changes after 45 s. There's no crash and no JS error. Hardware back returns to the photo picker, and a second back leaves the app for the launcher (the user loses their place in Edit Profile). Nothing was uploaded (`avatar_url` unchanged).
- **Update 2026-10-09 (slice 2.2, case 2.2-55):** reproduced on the provider Edit Profile (burner B8). The fake image is the blank first tile once its mtime is fresh (`adb shell touch` before the media scan, because `adb push` keeps the old file date and the picker sorts by date). After the pick: a fully white screen, process alive, crash buffer empty; one hardware back went straight to the launcher this time.
- **Evidence:** `evidence/E2E-028-fake-image-blank-screen.png`
- **Suspected cause:** not investigated. The picker is `expo-image-picker` with `allowsEditing` (`AvatarPicker.tsx:44-51`), and the crop step probably can't decode the bytes and never reports back. Rare in practice: it needs a corrupt file that the system picker still lists.
- **Solution (if solved):** n/a

### E2E-029 — Avatar: a 36 MB image spins for about 3 minutes, then fails with "Check your connection"
- **Found:** 2026-10-09, slice 2.1, case 2.1-40   **Role:** client
- **Category:** ux
- **Severity:** S4
- **Status:** Open
- **Steps:** 1. Push `large_over10mb.png` (36 MB noise PNG) to `/sdcard/Pictures`. 2. Edit Profile > Change Photo > pick it > CROP.
- **Expected:** A quick, specific message ("That photo is too large") or a client-side size check. The migration-0011 `avatars` bucket has no `file_size_limit`, so a server rejection isn't guaranteed either.
- **Actual:** After CROP a spinner covers the crop screen. About 3 minutes later (no change in `avatar_url` over a 2-minute poll, still not done at that point) the Edit screen shows red `Could not upload the image. Check your connection.` and the avatar is unchanged. The device was online and the 447 KB PNG uploaded fine, so the wording points the user at the wrong cause. The "Change Photo" link is usable again.
- **Update 2026-10-09 (slice 2.2, case 2.2-56):** reproduced on the provider Edit Profile (burner B8, same 36 MB PNG). After CROP at 12:04:47 the spinner was still up at the 332 s check; the red "Could not upload the image. Check your connection." was on screen by 12:10 (so well over 3 minutes, at most ~5m20s; my UI-dump poller missed the exact moment). Avatar unchanged, device online throughout.
- **Update 2026-10-09 (slice 2.2, case 2.2-112, important for the diagnosis):** the same copy and delay appear for a file that is within the size limit. On the portfolio screen a 9.9 MB JPEG passes the app's 10 MB check (preview shown, Publish enabled), sits on "Saving..." for about 6 minutes and then fails with "Could not upload the image. Check your connection." with the device online, while the same file goes to the same bucket from the host in 9 s (HTTP 200). On this emulator the uplink looked slow (a 447 KB PNG took 30-40 s to publish, about 15-30 KB/s; `gsm.network.type` is HSPA; the emulator was cold-booted earlier that day, and whether its network profile was this slow in the first session is unknown). **Hypothesis, not confirmed:** the 36 MB failure above is the same client-side upload timeout and not a server size rejection; if so, the defect is that uploads have no progress, no early size message for avatars and no useful error text ("Check your connection" is wrong while online). Re-check on a fast link before deciding the fix.
- **Evidence:** `evidence/E2E-029-avatar-oversize-error.png`
- **Suspected cause:** `AvatarPicker.tsx` has no size or type check; the catch-all copy is at `api.ts:1393`. Which step failed (signed URL, PUT, or timeout) is not investigated.
- **Solution (if solved):** n/a

### E2E-030 — Cold start with no connection shows the Login screen with no message, though the session is still valid
- **Found:** 2026-10-09, slice 2.1, case 2.1-03 (offline Profile)   **Role:** both (seen as client)
- **Category:** ux
- **Severity:** S3
- **Status:** Open (re-check in 8.2)
- **Steps:** 1. Log in as `maestro.editprofile@` and reach Home. 2. `adb shell am force-stop com.taskbuddy.app`; `adb shell svc wifi disable; svc data disable`. 3. Launch the app and wait 25 s. 4. Re-enable the network and force-stop and relaunch the app.
- **Expected:** Home from the stored session, or an "offline" notice with a retry. Never a bare Login form while the account is still signed in.
- **Actual:** Step 3 shows the normal Login form ("Welcome!", empty fields) at 8 s and still at 25 s, with no offline wording. Re-enabling the network without relaunching doesn't change it. Step 4 goes straight to Home as the same user, so the session wasn't cleared. A user who logs in again at that moment gets a network error. They could also think they were signed out.
- **Update 2026-10-09 (slice 2.2, case 2.2-05):** reproduced as the provider (`maestro.provider@`): force-stop, offline, launch, 25 s later the bare Login form with no message. After re-enabling the network, force-stop and relaunch go straight to the provider Feed, so the session was intact. So it is both roles; role line above is now "both".
- **Evidence:** `evidence/E2E-030-offline-cold-start-login.png` (thumbnail, 25 s, offline)
- **Suspected cause:** not investigated. It looks like the startup profile fetch fails on the network error and the router falls back to the auth stack. `AuthContext` is out of this sweep's fix scope.
- **Solution (if solved):** n/a

### E2E-031 — Change Password: the API accepts a new password equal to the current one
- **Found:** 2026-10-09, slice 2.1, case 2.1-62   **Role:** both
- **Category:** backend-bug
- **Severity:** S4
- **Status:** Open
- **Steps:** 1. Log in as the burner `maestro.burner.2.1.1@` and take the access token. 2. `POST /auth/change-password` with `{"current_password":"TestPass123!","new_password":"TestPass123!"}`.
- **Expected:** 400, matching the app's own rule "Different from your current password".
- **Actual:** `200 {"success":true}`. The app blocks it client-side, but a direct API caller doesn't hit that rule. The same call also made the caller's access token stop working (the next request with it got `401 Invalid or expired token`), so a password change ends existing sessions.
- **Evidence:** curl only. Other probes behaved as expected: `new_password` of 5 chars gives 400 `new_password must be longer than or equal to 8 characters`; `{}` gives 400 listing both fields; an extra field `x` gives 400 `property x should not exist`.
- **Suspected cause:** `ChangePasswordDto` has only `@IsNotEmpty` and `@MinLength(8)`; `auth.service.ts` has no equality check. Backend fix needs sign-off (auth is out of this sweep's fix scope).
- **Solution (if solved):** n/a

### E2E-032 — After "Password updated" the app signs the user out on the next action, with no explanation
- **Found:** 2026-10-09, slice 2.1, case 2.1-65   **Role:** both (seen as client)
- **Category:** ux
- **Severity:** S3
- **Status:** Open
- **Steps:** 1. Log in as the burner `maestro.burner.2.1.1@`. 2. Settings > Change Password with the right current password and a valid new one > Update password. 3. See "Password updated — Use your new password the next time you sign in." and tap Done (still on Settings). 4. Tap any switch, e.g. SMS Alerts.
- **Expected:** The session continues, as the success copy says, or the copy warns "You'll be signed out" and the app routes to Login with a message.
- **Actual:** The next request drops the app to the plain Login form (empty fields, no message). Done itself doesn't sign out. The server rejects the old access token after a password change (E2E-031 observed the same on the API), and the app's refresh fails, so the user is signed out silently. The success sheet promises otherwise ("next time you sign in").
- **Evidence:** `evidence/E2E-032-signed-out-after-password-change.png`
- **Suspected cause:** not investigated. The refresh path is in `api.ts` / `AuthContext` (out of fix scope). A backend invalidation of all sessions on password change plus a client that treats the 401 as a plain sign-out would produce this.
- **Solution (if solved):** n/a

### E2E-033 — Header back arrows on Edit Profile, Settings and Help & Support have no accessibility label and are about 38dp
- **Found:** 2026-10-09, slice 2.1, case 2.1-75   **Role:** client (the provider screens are checked in 2.2)
- **Category:** ux
- **Severity:** S4
- **Status:** Open
- **Steps:** 1. Open Settings, Edit Profile and Help & Support. 2. `maestro hierarchy` and look at the clickable node in the top-left.
- **Expected:** An accessibility label such as "Back" and a tap target of at least 48dp.
- **Actual:** On all three screens the back arrow is a clickable node with empty `text` and empty `accessibilityText`, bounds about 99 × 100 px (about 38dp at this density). Profile's arrow does have a label ("Back to Home"). Elsewhere in this slice the controls are labelled: the password eyes ("Show password" / "Hide password"), `Change password` sheet buttons, and the Help tutorial card. The switches on Settings carry only testIDs, with no extra a11y label (only Dark mode is labelled).
- **Evidence:** hierarchy dumps, `~/.taskbuddy-e2e/logs/2.1/hier_*.json` (not committed)
- **Suspected cause:** the shared back-button component in these screens lacks `accessibilityLabel` and `hitSlop`. Not investigated.
- **Solution (if solved):** n/a
- **Update 2026-10-09 (slice 2.2, case 2.2-18):** reproduced on the provider side. Edit Profile, Settings and Help & Support back arrows: no label, 38x38dp. Profile "Back to Feed" is labelled but 38dp; My Services "Back" 38dp; My Portfolio "Back" 44dp. Method: `adb shell uiautomator dump`, clickable nodes, px / 2.625.

- **Also seen (2026-10-12):** the same unlabelled ~38 dp header back arrow on Chat (7.1-29, E2E-134), Notifications (7.2-33, E2E-148) and Leave Review (7.3-07). The Leave Review stars are labelled ("1 star" … "5 stars") at about 45 dp.
- **Also seen (2026-10-12, 7.4-07):** the complaint filing screen's six reason rows report checkable=false / checked=false, so the selected reason isn't announced.
- **Also seen (2026-10-12, 7.4-23):** filing screen: the back arrow is unlabelled and the details box has no label (placeholder only). The complaint status screen is labelled correctly (Back, Refresh complaint, radio segments, Case statement, checkbox evidence rows).
### E2E-034 — Edit Profile: the Bio field capitalises every word ("sa" saves as "Sa")
- **Found:** 2026-10-09, slice 2.2, case 2.2-31   **Role:** provider
- **Category:** ux
- **Severity:** S4
- **Status:** Open
- **Steps:** 1. Log in as `maestro.burner.2.2.1@`, Profile > Edit Profile. 2. Type `Plumber sa Lipa xyz` into Bio. 3. Save and read `GET /auth/me`.
- **Expected:** free text keeps what the user typed (sentence case at most).   **Actual:** the keyboard title-cases each word, the stored bio is `Plumber Sa Lipa xyzz`, so Taglish connectors ("sa", "ng") appear capitalised on the public profile.
- **Evidence:** API read-back; no screenshot committed.
- **Suspected cause:** the shared `Field` helper in `SPEditProfileScreen.tsx:90` sets `autoCapitalize={keyboardType === 'email-address' ? 'none' : 'words'}` for every field, including the multiline Bio.
- **Solution (if solved):** n/a

### E2E-035 — Settings: the Push, Email and SMS switches have no accessibility label
- **Found:** 2026-10-09, slice 2.2, case 2.2-73   **Role:** provider (client shares the same settings hook; not checked)
- **Category:** ux
- **Severity:** S4
- **Status:** Open
- **Steps:** 1. Provider Profile > Settings. 2. `adb shell uiautomator dump` and read the three switch nodes.
- **Expected:** each switch announces its row name ("Push Notifications on").   **Actual:** `toggle-push_enabled`, `toggle-email_enabled` and `toggle-sms_enabled` are clickable nodes with empty text and empty content-desc (46x27dp). Only `toggle-dark-mode` carries a label ("Dark mode").
- **Evidence:** hierarchy dump, not committed.
- **Suspected cause:** the row label is a sibling `Text`, the `Switch` has no `accessibilityLabel`. Not investigated.
- **Solution (if solved):** n/a

### E2E-036 — Help & Support FAQ says the category is edited in Edit Profile, but Edit Profile locks it
- **Found:** 2026-10-09, slice 2.2, case 2.2-76   **Role:** provider
- **Category:** ux
- **Severity:** S4
- **Status:** Open
- **Steps:** 1. Provider Profile > Help & Support, read "How do I update my services or bio?". 2. Open Edit Profile and look at "Service offered".
- **Expected:** the FAQ points at My Services for a service change.   **Actual:** the FAQ reads "Go to Profile -> Edit Profile to update your bio, category, and service radius." Edit Profile shows the category as a locked row with "Request a change", and the backend returns 403 on a direct change.
- **Evidence:** screenshots in `~/.maestro/tests` only.
- **Suspected cause:** FAQ copy predates the skill-request flow (Sept 2026 QA). Not investigated.
- **Solution (if solved):** n/a

### E2E-037 — Edit Profile: a failing bio leaves the profile half-saved, and shows the raw server text
- **Found:** 2026-10-09, slice 2.2, case 2.2-34   **Role:** provider
- **Category:** app-bug
- **Severity:** S3 medium
- **Status:** Open
- **Steps:** 1. Log in as `maestro.burner.2.2.1@`, Profile > Edit Profile. 2. Change the name to `Partial Probe` and put 401 characters in Bio (the field has no `maxLength`). 3. Save Changes > Save Changes in the modal. 4. Leave the screen and read `GET /auth/me`.
- **Expected:** the app blocks 401 characters (limit 400) or the save is all-or-nothing, with friendly copy.   **Actual:** the red line reads `bio must be shorter than or equal to 400 characters`. `profile.full_name` is already `Partial Probe`, `provider_profile.bio` still has the old 400-character value. The user sees an error and believes nothing was saved.
- **Evidence:** API read-back (name changed, bio unchanged); screenshot in `~/.maestro/tests` only.
- **Suspected cause:** `SPEditProfileScreen.tsx` calls `updateProfile` then `upsertProviderProfile` with no rollback and no bio `maxLength` (the DTO and DB cap bio at 400). Same raw-text class as E2E-025/009/015/020.
- **Solution (if solved):** n/a

### E2E-038 — Service radius: out-of-range values show raw server text, and non-numeric text silently resets it to 15
- **Found:** 2026-10-09, slice 2.2, cases 2.2-43, 2.2-44   **Role:** provider
- **Category:** ux
- **Severity:** S4
- **Status:** Open
- **Steps:** 1. Log in as `maestro.burner.2.2.1@`, Edit Profile. 2. Set Service radius to `0`, `1001`, `-5` (typed through Maestro, which bypasses the number pad), Save, confirm. 3. Repeat with `abc` and `8.55`.
- **Expected:** a client-side range hint (0.5 to 1000 km, from the DTO) and no silent change to the value.   **Actual:** `0` and `-5` show `service_radius_km must not be less than 0.5`, `1001` shows `service_radius_km must not be greater than 1000`. `abc` saves successfully and the radius becomes 15 (the default), with no warning. `8.55` is stored as `8.6` (`numeric(5,1)`). `007` saves as 7; empty keeps the previous value.
- **Evidence:** screenshots in `~/.maestro/tests` only; API read-backs (`service_radius_km`).
- **Suspected cause:** `SPEditProfileScreen.tsx:146` converts with `Number(radius)` and sends it without a range check; a NaN becomes null and the server default applies. The placeholder is `8` while the signup default is 15.
- **Solution (if solved):** n/a

### E2E-039 — My Services: a stale Send or Cancel refreshes the screen silently, with no explanation
- **Found:** 2026-10-09, slice 2.2, cases 2.2-87, 2.2-92   **Role:** provider
- **Category:** ux
- **Severity:** S4 (needs product sign-off)
- **Status:** Open
- **Steps:** 1. Log in as `maestro.burner.2.2.2@`, My Services, pick Add another service > Handyman, type a reason. 2. Create a pending request for the same account through the API. 3. Tap Send to admins. Separately: leave a pending request open, have an admin approve it through the API, then tap Cancel request > Cancel request.
- **Expected:** the API answers 409 "You already have a request under review" / 404 "No pending request to cancel"; the app should say so.   **Actual:** no message. After Send the form is replaced by the other pending request ("Add Manicure", one the user did not just write) and the Handyman request is silently not sent. After the stale Cancel the screen shows the approved state with no note that the cancel did not happen. The typed draft is still there when the form returns.
- **Evidence:** screenshots in `~/.maestro/tests` only.
- **Suspected cause:** `SPSkillRequestScreen.tsx` reloads the list on any failure and does not surface the error (`requests.error` is never rendered, per the 2.2 case-design notes). Not investigated further.
- **Solution (if solved):** n/a

### E2E-040 — Portfolio: choosing a non-image `.jpg` shows a raw native exception under the form
- **Found:** 2026-10-09, slice 2.2, case 2.2-113   **Role:** provider
- **Category:** app-bug
- **Severity:** S4
- **Status:** Open
- **Steps:** 1. Push `fake.jpg` (a text file renamed `.jpg`) to `/sdcard/Pictures` and run a media scan. 2. Provider Profile > My Portfolio > Choose portfolio photo. 3. Pick the file.
- **Expected:** friendly copy such as "That file isn't a photo."   **Actual:** no preview, Publish photo stays enabled, and a red block under the form reads `Call to function 'ExponentImagePicker.launchImageLibraryAsync' has been rejected. -> Caused by: java.lang.IllegalArgumentException: Uri lacks 'file' scheme: content://media/picker/0/com.android.providers.media.photopicker/media/<id>`. (The client avatar picker shows a blank white screen for the same file, E2E-028.)
- **Evidence:** screenshot in `~/.maestro/tests` only.
- **Suspected cause:** the picker rejection message is shown verbatim in `SPPortfolioScreen.tsx`'s error line. Not investigated.
- **Solution (if solved):** n/a

### E2E-041 — `PATCH /providers/me/portfolio/:id` with a whitespace-only caption returns the raw Postgres constraint name
- **Found:** 2026-10-09, slice 2.2, case 2.2-114   **Role:** provider (API)
- **Category:** backend-bug
- **Severity:** S4
- **Status:** Open (log only; backend fixes are out of this sweep's scope)
- **Steps:** 1. As a provider with one portfolio entry, `PATCH /providers/me/portfolio/<id>` with `{"caption":"   ","position":0,"category_id":null}`.
- **Expected:** a 400 with a validation message (the DTO has `@Length(1,400)` but no trim check).   **Actual:** `400 new row for relation "provider_portfolio" violates check constraint "provider_portfolio_caption_check"`. The app trims before sending, so users do not see it today.
- **Update 2026-10-09 (slice 2.2, case 2.2-115):** reusing an already-registered `image_path` in a second `POST /providers/me/portfolio` also returns the raw database text: `duplicate key value violates unique constraint "provider_portfolio_image_path_key"` (HTTP 400). Not reachable from the app, which asks for a fresh signed upload for each photo.
- **Evidence:** curl response (tokens not recorded).
- **Suggested fix:** `@Transform(({value}) => typeof value === 'string' ? value.trim() : value)` before `@Length(1,400)` in `portfolio.dto.ts`.
- **Solution (if solved):** n/a

### E2E-042 — Portfolio: removing an entry that is already gone shows the error but leaves the stale card on screen
- **Found:** 2026-10-09, slice 2.2, case 2.2-124   **Role:** provider
- **Category:** ux
- **Severity:** S4
- **Status:** Open
- **Steps:** 1. Provider with two portfolio entries, My Portfolio open. 2. Delete the first entry through the API (`DELETE /providers/me/portfolio/<id>`). 3. In the app tap its Remove photo > Remove.
- **Expected:** the list reloads and the removed card disappears.   **Actual:** a red `Portfolio entry not found` line appears above the list, but the deleted card stays and can be tapped again. Leaving and reopening the screen refreshes it.
- **Evidence:** screenshot in `~/.maestro/tests` only; API list read-back.
- **Suspected cause:** a failed remove does not reload the list (flagged in the 2.2 case-design notes for `SPPortfolioScreen.tsx` and, for cancel, `SPSkillRequestScreen.tsx`).
- **Solution (if solved):** n/a

### E2E-043 — Edit Profile: a save started while offline sits on "Saving..." for minutes and never resolves, even after reconnecting
- **Found:** 2026-10-09, slice 2.2, case 2.2-50   **Role:** provider (the client shares the pattern; not checked)
- **Category:** app-bug
- **Severity:** S3 medium
- **Status:** Open
- **Steps:** 1. Log in as `maestro.burner.2.2.12@`, Edit Profile, pick an address suggestion, type a 20+ character bio. 2. `adb shell svc wifi disable; adb shell svc data disable`. 3. Save Changes > Save Changes in the modal. 4. Re-enable Wi-Fi and data about 20 seconds later and watch the screen.
- **Expected:** a friendly "no connection" message within a few seconds and a usable Save button, or the request completes after reconnecting.   **Actual:** the button reads "Saving..." and stays that way for at least 224 seconds, including about 4 minutes after the network came back. No error, no retry. `GET /auth/me` shows nothing was saved. The user has to leave the screen.
- **Evidence:** screenshots in `~/.maestro/tests` only; API read-back.
- **Suspected cause:** no request timeout or abort on `updateProfile` in `mobile/src/lib/api.ts` (out of this sweep's fix scope: shared network layer). Related to the avatar spinner in E2E-029 and to Slice 8.2's offline cases.
- **Solution (if solved):** n/a

### E2E-044 — My Portfolio: saving an edit with a blank caption says "Choose a photo, add a caption…", but edit mode has no photo picker
- **Found:** 2026-10-09, slice 2.2, case 2.2-121   **Role:** provider
- **Category:** ux
- **Severity:** S4 low/cosmetic
- **Status:** Open
- **Steps:** 1. Log in as a provider with one portfolio entry (burner `maestro.burner.2.2.10@`), My Portfolio. 2. Edit photo details on the entry. 3. Clear the caption, type three spaces, press Save photo details.
- **Expected:** a message about the caption only ("Add a caption"), since the photo cannot be changed while editing.   **Actual:** the red line reads "Choose a photo, add a caption and enter an order from 0 to 10000.", the same text as when publishing a new photo. In edit mode there is no photo tile to choose from, so the first part is confusing. (The same single message is used for an empty or invalid order, so it never says which field is wrong.)
- **Evidence:** screenshot in `~/.maestro/tests` only; API read-back shows the caption unchanged.
- **Suspected cause:** one shared validation message in `SPPortfolioScreen.tsx` for both modes (not investigated further).
- **Solution (if solved):** n/a

### E2E-045 — My Portfolio: after an offline open, "Retry portfolio" reloads the list but the service chips and their error stay broken
- **Found:** 2026-10-09, slice 2.2, case 2.2-129   **Role:** provider
- **Category:** ux
- **Severity:** S4 low/cosmetic
- **Status:** Open
- **Steps:** 1. Log in as a provider (burner `maestro.burner.2.2.10@`, two entries). 2. `adb shell svc wifi disable; svc data disable`. 3. Profile > My Portfolio. 4. Re-enable the network and tap "Retry portfolio".
- **Expected:** Retry brings back everything that failed to load: the list and the "Service (optional)" chips.   **Actual:** offline the screen shows two red lines ("Cannot reach the server…"), under the chip row (only "No service category" is present) and above "Retry portfolio". After reconnecting and tapping Retry, the two cards load, but the categories error and the missing chips stay on screen. A new entry can still be published, but only without a service category, until the user leaves and reopens the screen.
- **Evidence:** screenshots in `~/.maestro/tests` only.
- **Suspected cause:** the retry link only calls the portfolio reload, not the categories reload (`SPPortfolioScreen.tsx`, not investigated further).
- **Solution (if solved):** n/a

### E2E-046 — A deleted client's open job stays open, is visible under "Deleted user" and still accepts applications
- **Found:** 2026-10-09, slice 2.3, case 2.3-20   **Role:** both
- **Category:** backend-bug
- **Severity:** S3
- **Status:** Open
- **Steps:** 1. Burner client posts a job (`POST /jobs`, status `open`). 2. Delete the account in Settings (204; `open` is not in `ACTIVE_JOB_STATUSES`, so no blocker). 3. `GET /jobs/<id>` as a provider, then `POST /jobs/<id>/applications` as a verified provider.
- **Expected:** the job leaves the marketplace (cancelled or expired) when its owner is deleted, so nobody applies to a job nobody can hire for.
- **Actual:** the job stays `open` (admin bookings shows client "Deleted user"), a provider can still read it, and the apply returned 201 (withdrawn again afterwards). The client's auth user is banned, so the application can never be accepted. The test job was cancelled through the admin API afterwards.
- **Evidence:** API responses only (job `e0842231-d1ea-4689-a8ad-d57b4e81f415`, application `a7b5a8d5-9ef3-4428-b44e-1b1fca450ccd`).
- **Suspected cause:** `ProfilesService.deleteAccount` (`backend/src/profiles/profiles.service.ts:258`) soft-deletes the profile and never touches the client's `open` jobs or their pending applications. Suggested fix (backend, not applied): in `deleteAccount`, cancel the user's `open` jobs and reject their pending applications; for a provider, withdraw pending applications.

### E2E-047 — Code read: frozen (`disputed`) escrow is queried by the deletion check but never blocks deletion
- **Found:** 2026-10-09, slice 2.3, case 2.3-30   **Role:** both
- **Category:** backend-bug
- **Severity:** S3
- **Status:** Open (code read only, not reproduced: the only accounts with a frozen escrow are the persistent test accounts, which must not be deleted)
- **Steps:** read `deletionBlockers` in `backend/src/profiles/profiles.service.ts`.
- **Expected:** money frozen in escrow blocks deletion the way `held` escrow does.
- **Actual:** the escrow query selects `status in ('held','disputed')` (line 328), but only `held` rows are counted into the `escrow_held` blocker (line 349). A `disputed` escrow blocks only if an `open` row also exists in `disputes`. An admin-cancelled in-progress job freezes its escrow as `disputed` with no dispute row (see the 2026-10-08 leftover in env-state.md), so that user could delete their account with money frozen against it.
- **Evidence:** source lines above.
- **Suspected cause:** the filter at line 349 should count both statuses (or add a separate code). Not fixed: backend code. To reproduce, hire a burner pair (Phase 5.1), have an admin cancel the job, then delete the client.

### E2E-048 — Client Delete Account dialog: after a blocker the title and red button still say "Delete your account?" / "Try Again", and blockers are plain lines
- **Found:** 2026-10-09, slice 2.3, cases 2.3-14, 2.3-16   **Role:** client
- **Category:** ux
- **Severity:** S4
- **Status:** Open (extends E2E-019, the provider dialog differs)
- **Steps:** 1. Client with PHP 100 in the wallet: Settings → Delete Account → Delete Account. 2. Add a pending withdrawal and tap Try Again.
- **Expected:** a clear "can't delete yet" state, as the provider has ("Not just yet", bullet list, neutral "Got it").
- **Actual:** the client dialog keeps the title "Delete your account?", shows the blocker text as the body, and turns the destructive button into a red "Try Again" (retrying cannot succeed until the user settles it elsewhere). Two blockers are joined by a line break with no bullets. The wallet blocker says "Withdraw it" even when a withdrawal is already pending. After Cancel and reopen, the default text is back (2.3-15 pass).
- **Evidence:** `evidence/E2E-048-blocker-title.png`, `evidence/E2E-048-two-blockers.png`.
- **Suspected cause:** `HOSettingsScreen.tsx:64-80` joins `blockers[].message` into `deleteError` for a generic `ConfirmationModal`; the provider screen uses `DeleteAccountModal`, which already has the blocked view. Using the same component on the client side would fix it.

### E2E-049 — Emulator loses DNS when the host network changes; the app shows "Cannot reach the server"
- **Found:** 2026-10-09, slice 2.3, session start   **Role:** both
- **Category:** harness
- **Severity:** S4
- **Status:** Workaround (cold boot the AVD with an explicit resolver, see the README note)
- **Steps:** 1. Leave the emulator running while the host moves networks. 2. Log in from the app: "Cannot reach the server. Check your connection and try again." 3. `adb shell ping 8.8.8.8` works; `adb shell ping taskbuddy-kpek.onrender.com` says "unknown host"; the host itself reaches the API (HTTP 200).
- **Expected:** n/a (environment).   **Actual:** the emulator's forwarded DNS stayed dead; toggling Wi-Fi/data did not help.
- **Evidence:** `adb shell ping` output (not committed).
- **Suspected cause:** the emulator kept the resolvers of the old host network. Not an app bug (the copy was right for the situation).
- **Solution (workaround):** `adb emu kill`, then start with `emulator -avd Medium_Phone -no-snapshot-load -dns-server 8.8.8.8,1.1.1.1`, then `adb shell service call alarm 3 s16 Asia/Manila`; a "System UI isn't responding" dialog can appear right after the boot (tap Wait).

### E2E-050 — "Post Another Job" leaves the address empty while step 1 still highlights "Use default"
- **Found:** 2026-10-09, slice 3.1, case 3.1-48   **Role:** client
- **Category:** app-bug   **Severity:** S4   **Status:** Open (workaround: tap "Use my saved address" on step 2)
- **Steps:** 1. Post any job. 2. On the success screen tap "Post Another Job". 3. Pick a category, Next (step 1 still shows "Use default" active). 4. On step 2 the address box is empty; tap Next.
- **Expected:** the saved address is prefilled again, or "Use default" is not shown as active. **Actual:** the address is empty, step 2 says "Please enter where the job is." and the "Use default" chip is still highlighted.
- **Evidence:** `evidence/E2E-050-post-another-empty-location.png`
- **Suspected cause:** `HOCreateJobScreen.tsx` `startAnother()` clears `location` but keeps `useProfileLocation = true`, and the prefill effect only runs when `profile.address` changes (`:333-341`).

### E2E-051 — Hardware Back inside the wizard leaves it with no "Discard job draft?" prompt
- **Found:** 2026-10-09, slice 3.1, case 3.1-33 (seen while driving Run D)   **Role:** client
- **Category:** app-bug   **Severity:** S4   **Status:** Open (3.2 covers the full draft behaviour)
- **Steps:** 1. Home, tap the Manicure tile (wizard opens on step 2 with a category chosen). 2. Press hardware/system Back.
- **Expected:** the same "Discard job draft?" modal the header arrow shows, or one step back. **Actual:** the wizard closes straight to Home and the draft is lost. The header arrow does show the modal ("Keep Editing" / "Discard & Exit"). The same exit also happened once from step 3 with typed tasks.
- **Evidence:** none saved (Maestro `back`, hierarchy showed Home). **Suspected cause:** `App.tsx` handles the Android back event itself and never reaches the screen's `handleExit`; not investigated.

### E2E-052 — The location-preview map never appears on step 2
- **Found:** 2026-10-09, slice 3.1, case 3.1-04   **Role:** client
- **Category:** app-bug   **Severity:** S4   **Status:** Open (not isolated)
- **Steps:** 1. Post a Job, reach step 2 with a confirmed address (default or a picked suggestion). 2. Wait 30 s.
- **Expected:** a map image above "Location confirmed". **Actual:** only the "Location confirmed" card; no "Map of the confirmed job location" node in the hierarchy. The API is fine: `GET /jobs/static-map?lat=14.676&lon=121.0437` with a client token returns 200, `image/png`, 175 KB (and 401 without a token).
- **Suspected cause:** the `Image` source with an `Authorization` header fails silently (`onError` hides it, `HOCreateJobScreen.tsx:850`); one bounded look only, not isolated.

### E2E-053 — Posting a job with 6 photos took 62 s and the first attempt failed
- **Found:** 2026-10-09, slice 3.1, case 3.1-31   **Role:** client
- **Category:** env   **Severity:** S4   **Status:** Workaround (tap Post Job again; it posted in 62 s)
- **Steps:** 1. Attach 6 photos (447 KB each, 2.7 MB in all). 2. Post Job.
- **Expected:** posted, or a clear retry. **Actual:** after a long wait "Could not upload the image. Check your connection." (nothing created, so no duplicate job); a second tap posted fine. The emulator's uplink is about 15-30 KB/s (same as 2.1/2.2), so this is mostly the AVD, but uploads are parallel with no progress and no per-photo retry, and PNGs are not recompressed.
- **Evidence:** `evidence/E2E-053-photo-upload-failed.png`

### E2E-054 — After "Enter custom" and typing, the "Location confirmed" card still shows the old address
- **Found:** 2026-10-09, slice 3.1, case 3.1-23   **Role:** client
- **Category:** ux   **Severity:** S4   **Status:** Open
- **Steps:** 1. Step 1: "Enter custom". 2. Step 2: type "Quezon City" without picking a suggestion.
- **Expected:** the confirmed card clears or says the new text is unverified. **Actual:** the card still reads "Location confirmed — Ayala Avenue, Makati…" under a field that says "Quezon City". Next re-geocodes the typed text, so the stored coordinates follow the text; only the card misleads.
- **Evidence:** `evidence/E2E-054-stale-location-confirmed.png`. **Suspected cause:** `Enter custom` clears only `location` (`HOCreateJobScreen.tsx:768-772`); `resolvedCoordinates`/`geocodedAddress` stay, and `AddressField` calls `onResolve(null)` only after its own resolve.

### E2E-055 — Wizard accessibility: unlabeled back arrow and add-task "+", tiny photo "×"
- **Found:** 2026-10-09, slice 3.1, case 3.1-49   **Role:** client
- **Category:** ux   **Severity:** S4   **Status:** Open
- **Details:** the header back arrow and the "+" next to "Add your own task" expose no label in the hierarchy; the photo "Remove photo n" button is about 57 x 58 px (about 22 dp, under the 48 dp guide). Footer Back/Next are fine. Also, a duplicate custom task is silently ignored and its text stays in the box (no message).
- **Suspected cause:** `HOCreateJobScreen.tsx:714` and `:968` have no `accessibilityLabel`; `removePhoto` style size.

### E2E-056 — Success copy says providers in the area "will be notified"
- **Found:** 2026-10-09, slice 3.1, case 3.1-16   **Role:** client
- **Category:** ux   **Severity:** S4   **Status:** Open (needs product sign-off)
- **Details:** "Job Posted! … Service providers in your area will be notified." In the real flow providers find the job in their feed and apply; invites go out only after the recommendation deadline (5/10/15 min) and only to the top 8. Step 4's own text ("matched after 5 minutes") is accurate.
- **Suspected cause:** copy at `HOCreateJobScreen.tsx:675`.

### E2E-057 — The typed address text is saved as the job address, and job photos are stored as full public URLs
- **Found:** 2026-10-09, slice 3.1, cases 3.1-26 and 3.1-27   **Role:** client
- **Category:** ux   **Severity:** S4   **Status:** Open (needs product sign-off)
- **Details:** typing "Katipunan Avenue Quezon City 1108" and pressing Next stores exactly that text as `address` (lat/lng come from the geocoder), whereas picking a suggestion stores the formatted address; providers see whichever was typed. Separately `photo_urls` holds `https://<project>.supabase.co/storage/v1/object/public/job-photos/<profile id>/<uuid>.png`, while CLAUDE.md describes clients submitting a storage path (the bucket is public, so it works).
- **Suspected cause:** `resolveAddress` keeps `location.trim()` as `address` (`:545`); backend expands the path.

### E2E-058 — "Use my current location" only says "Current location is unavailable" on the AVD
- **Found:** 2026-10-09, slice 3.1, case 3.1-22   **Role:** client
- **Category:** harness   **Severity:** S4   **Status:** Open (not isolated; success path Blocked)
- **Steps:** `adb emu geo fix 121.0437 14.6760`, `settings put secure location_mode 3` (already 3), `pm grant … ACCESS_FINE_LOCATION`, tap "Use my current location" twice.
- **Actual:** "Current location is unavailable. Make sure that location services are on…". Either the emulator never delivered a fix to the app or the app's location call fails; the feed's radius filter (4.2) will show which. The copy and the quiet failure itself are fine.

### E2E-059 — The auto-drafted description (and title) can exceed the limits and block Next with an error about text the user never typed
- **Found:** 2026-10-09, slice 3.2, case 3.2-47   **Role:** client
- **Category:** app-bug   **Severity:** S3   **Status:** Open
- **Steps:** 1. Post a Job, Plumbing, step 3. 2. Add 10 custom tasks of about 100 characters each (maxLength 120 each). 3. Leave the description untouched, tap Next.
- **Expected:** a draft that fits (truncated, or only the first tasks listed), or a clear hint to shorten it.   **Actual:** the draft is "Plumbing service needed. Tasks: <all tasks joined>." with no cap; the counter reads 947/750 and Next shows "Description cannot exceed 750 characters." The field can only be shortened by hand (typing is capped at 750, so a longer draft cannot be fixed by typing more). A first custom task of 120 characters likewise drafts a 130-character title and Next shows "Title cannot exceed 120 characters." (run on device, 3.2-48; the field only displays the first 120).
- **Evidence:** `~/.maestro/tests` screenshot `s3_long_auto_desc2` (not committed)
- **Suspected cause:** `HOCreateJobScreen.tsx:397-405` (the drafts have no length cap).

### E2E-060 — "Discard job draft?" appears on a wizard the user has not touched
- **Found:** 2026-10-09, slice 3.2, case 3.2-88   **Role:** client
- **Category:** ux   **Severity:** S4   **Status:** Open
- **Steps:** 1. Open Post a Job from the tab bar. 2. Without picking anything, tap the header arrow (the first attempt also happened after a Discard & Exit, on a freshly reopened wizard).
- **Expected:** the wizard closes without a prompt.   **Actual:** the "Discard job draft?" modal appears, because the saved address is pre-filled and counts as progress.
- **Suspected cause:** `hasProgress` includes `location.trim()` (`HOCreateJobScreen.tsx:583-586`).

### E2E-061 — Picking a non-image file in the photo picker does nothing and says nothing
- **Found:** 2026-10-09, slice 3.2, case 3.2-80   **Role:** client
- **Category:** ux   **Severity:** S4   **Status:** Open
- **Steps:** 1. Push a text file renamed `fake.jpg` to `/sdcard/Pictures`, scan it. 2. Step 3, Add photos, select it, tap Add (1).
- **Expected:** a message that the file is not a usable image.   **Actual:** the picker closes, no thumbnail, no message (the 3.1 notes' "photos 0" state is indistinguishable from a dead tap).
- **Suspected cause:** not investigated (the picker may drop undecodable files before the app sees them).

### E2E-062 — Budget accepts "1e3" and "0x10" and has no ceiling (₱99,999,999 posts)
- **Found:** 2026-10-09, slice 3.2, cases 3.2-63, 3.2-66   **Role:** client
- **Category:** ux   **Severity:** S4   **Status:** Open (needs product sign-off)
- **Steps:** 1. Step 4, type 1e3, blur: the field becomes "1000.00". 2. Type 0x10: becomes "16.00". 3. Type 99999999, post: the job is created (open, budget 99,999,999; cancelled afterwards).
- **Expected:** digits and one decimal point only, and some sanity ceiling.   **Actual:** `Number()` semantics; no maximum in the app or the DTO (the database ceiling is about 9,999,999,999.99).
- **Suspected cause:** `isValidBudget` (`HOCreateJobScreen.tsx:277-286`).

### E2E-063 — A budget above the database range returns the raw message "numeric field overflow"
- **Found:** 2026-10-09, slice 3.2, case 3.2-64 (API probe; confirmed in the app 2026-10-10: typing 99999999999 and tapping Post Job shows the footer text "numeric field overflow" and creates no job, evidence `evidence/E2E-063-inapp-numeric-overflow.png`)   **Role:** client
- **Category:** backend-bug   **Severity:** S4   **Status:** Open
- **Steps:** `POST /jobs` with `budget: 10000000000` (or 99999999999) and otherwise valid fields.
- **Expected:** a 400 from DTO validation ("budget must not be greater than …").   **Actual:** HTTP 400 with the message "numeric field overflow" (the database error text), which the app would show verbatim in the footer. Suggested fix: add `@Max()` to `CreateJobDto.budget` (`backend/src/jobs/dto/jobs.dto.ts:81-85`).

### E2E-064 — Stale validation messages stay on screen after the problem is fixed
- **Found:** 2026-10-09, slice 3.2, cases 3.2-11, 3.2-34   **Role:** client
- **Category:** ux   **Severity:** S4   **Status:** Open
- **Steps:** 1. Step 3 with no task, tap Next (tasks error). 2. Pick a task: the auto-drafted description fills in. 3. Scroll down.
- **Expected:** the tasks error and the "Description must be at least 20 characters." inline error disappear once resolved.   **Actual:** both stay (the description error sits under a 43/750 description) until Next is tapped again; the footer banner also keeps the old tasks message.
- **Suspected cause:** field errors are only cleared on focus or Next, not when the draft changes (`HOCreateJobScreen.tsx:395-406`).

### E2E-065 — Address errors show the raw validator text ("address must be longer than or equal to 5 characters")
- **Found:** 2026-10-09, slice 3.2, cases 3.2-06, 3.2-08   **Role:** client
- **Category:** ux   **Severity:** S4   **Status:** Open
- **Steps:** 1. Post a Job, step 2. 2. Clear the address and type "Abcd" (or a 301+ character string). 3. Tap Next.
- **Expected:** friendly copy like the other address errors ("We couldn't find that address. Check the street and city.").   **Actual:** the inline error is the class-validator message: "address must be longer than or equal to 5 characters" / "address must be shorter than or equal to 300 characters".
- **Suspected cause:** `GET /jobs/geocode` DTO messages (`backend/src/jobs/dto/jobs.dto.ts:123-124`) are passed to the field unchanged by the app (`HOCreateJobScreen.tsx:~380`). Suggested fix: map 400 messages for this route, or add custom `message:` strings.

### E2E-066 — A job whose title contains `'; DROP TABLE jobs; --` is blocked by an edge filter and the app says "The server is unavailable (HTTP 403)"
- **Found:** 2026-10-09, slice 3.2, case 3.2-22   **Role:** client
- **Category:** env   **Severity:** S4   **Status:** Open (needs infra sign-off)
- **Steps:** 1. Post a Job with the title `Paayos ng gripo sa CR '; DROP TABLE jobs; --`. 2. Post Job. (API repro: `POST /jobs` with that title returns HTTP 403 and an HTML page titled "Blocked"; the same title with `<script>alert(1)</script>` or `' OR 1=1 --` returns 201.)
- **Expected:** a normal job, or a clear "this text is not allowed" message.   **Actual:** the request never reaches the API (a WAF or proxy in front of the deployed backend answers 403); the footer says "The server is unavailable right now (HTTP 403). Please try again shortly.", which is misleading and retrying never helps.
- **Suspected cause:** edge/WAF rule on the Render deployment, not application code. The app's generic 5xx/403 copy is in `mobile/src/lib/api.ts` (not touched).

### E2E-067 — A double tap on Next shows the next step's validation error as soon as it opens
- **Found:** 2026-10-10, slice 3.2, case 3.2-86   **Role:** client
- **Category:** ux   **Severity:** S4   **Status:** Open
- **Steps:** 1. Post a Job, Plumbing, saved location, step 2. 2. Double-tap Next quickly (`adb shell "input tap 794 2179; input tap 794 2179"`). 3. Repeat on step 3 after picking a task.
- **Expected:** one step forward, and the new step opens clean.   **Actual:** the wizard advances exactly one step (no skip), but the second tap runs Next on the new, untouched step, so step 3 opens with "Pick at least one task so providers know what the job involves." and step 4 with "Please select a preferred date." in red before the user has done anything.
- **Evidence:** `evidence/E2E-067-double-next-error-on-arrival.png`
- **Suspected cause:** `handleNext` (`mobile/app/(homeowner)/screens/HOCreateJobScreen.tsx:572-581`) has no in-flight or debounce guard. The second tap is handled after `setStep` re-renders and validates the new step. A short guard (ignore Next for ~400 ms after a step change) or validating only the step the tap started on would fix it.

### E2E-068 — An 11-digit budget clips its leading digit behind the peso sign
- **Found:** 2026-10-10, slice 3.2, case 3.2-64   **Role:** client
- **Category:** ux   **Severity:** S4   **Status:** Open
- **Steps:** 1. Post a Job to step 4. 2. Type 99999999999 in Budget and blur.
- **Expected:** the full amount stays readable (or the field refuses an amount this large, see E2E-062/063).   **Actual:** the formatted "99999999999.00" is wider than the box and its first digit is cut under the "₱" prefix. The review step shows "₱99,999,999,999.00" in full.
- **Evidence:** `evidence/E2E-068-budget-clipped.png`
- **Suspected cause:** the budget input's large font with no `adjustsFontSizeToFit`/max length; not investigated further. Goes away if a sane maximum is enforced (E2E-062).

### E2E-069 — Picking a valid photo together with an unreadable file attaches nothing, silently
- **Found:** 2026-10-10, slice 3.2, case 3.2-81   **Role:** client
- **Category:** app-bug   **Severity:** S3   **Status:** Open
- **Steps:** 1. Post a Job, step 3, Add photos. 2. In the system picker select a valid image (`p2a_A.png`) and a 22-byte text file named `.jpg` (`p2e_fake.jpg`); the picker shows "Add (2)". 3. Tap Add (2).
- **Expected:** the valid image is attached (and the unreadable one is skipped with a message).   **Actual:** zero thumbnails, no message, no footer error (reproduced twice). The user's valid choice is lost with no explanation; posting then creates a job with `photo_urls` = 0. This widens E2E-061 (which assumed only the bad file is dropped).
- **Evidence:** `evidence/E2E-069-picker-selection.png` (both selected, "Add (2)"), `evidence/E2E-069-nothing-attached.png`
- **Suspected cause:** `pickPhotos` (`mobile/app/(homeowner)/screens/HOCreateJobScreen.tsx:481-512`) has `try/finally` with no `catch`. `launchImageLibraryAsync` with `quality: 0.8` re-encodes every asset, so one undecodable file plausibly rejects the whole call; the rejection is swallowed by `void pickPhotos()` (line 1050). The crash sweep checks for a matching ReactNativeJS error. Fix direction: catch, show "One of the files could not be read", and keep the readable assets (or pick with `quality: 1` and validate per asset).

### E2E-070 — One Post Job tap after an offline failure created two identical jobs
- **Found:** 2026-10-10, slice 3.2, case 3.2-87   **Role:** client
- **Category:** app-bug   **Severity:** S2   **Status:** Escalated (needs a product/backend decision on idempotency)
- **Steps:** 1. Post a Job to the review step (Plumbing, budget 300, no photos). 2. `adb shell svc wifi disable; adb shell svc data disable`. 3. Tap Post Job: footer "Cannot reach the server. Check your connection and try again.", draft kept, no job created (verified by GET). 4. Re-enable wifi and data, wait for connectivity. 5. Tap Post Job once.
- **Expected:** exactly one job.   **Actual:** "Job Posted!" and **two** jobs, `a577c526…` at 18:56:52.35Z and `a644becd…` at 18:56:59.78Z (same title and budget). Maestro's own log shows a single tap at 02:56:51.48 local ("Tapping at (794, 2178)", once). Both jobs were cancelled.
- **Evidence:** `evidence/E2E-070-offline-error.png`, `evidence/E2E-070-posted.png`; Maestro run log `~/.maestro/tests/2026-10-10_025641/maestro.log` (not committed).
- **Suspected cause:** not isolated. `rawRequest` (`mobile/src/lib/api.ts:738-753`) never retries a POST (only `authRequest` on 401, :803-819), so the duplicate most likely comes from the transport. React Native's fetch on Android uses OkHttp, which with `retryOnConnectionFailure` (default on) can silently resend a request when a pooled connection, made stale by the network change, fails after the server already received it. The 7 s gap fits a lost-response-then-retry. The backend has no idempotency key on `POST /jobs`, so nothing de-duplicates. Fix options (escalated, not self-serve: transport/auth-adjacent): a client-generated idempotency key per wizard submit, honoured by `POST /jobs`, and/or disabling OkHttp retry for non-idempotent methods. Money impact is indirect (duplicate open jobs, no escrow until hire), but the same path exists for other POSTs (apply, hire, withdraw), so Phase 5/6/8 must re-check this.

### E2E-071 — The review step leaves out the job description
- **Found:** 2026-10-10, slice 3.2, exploratory case 3.2-X01   **Role:** client
- **Category:** ux   **Severity:** S4   **Status:** Open
- **Steps:** 1. Post a Job through steps 1-4. 2. On "Review & Post", scroll the whole step.
- **Expected:** "Check everything before posting" covers every posted field, including the description providers read (often auto-drafted, see E2E-059).   **Actual:** the card shows Service, Title, Location, Date, Time, Urgency, Budget and the task list; the description is never shown before posting.
- **Evidence:** `evidence/E2E-071-review-no-description.png`
- **Suspected cause:** the review rows array (`mobile/app/(homeowner)/screens/HOCreateJobScreen.tsx:1187-1195`) has no description entry. Fix: add a Description block (multi-line) under the card.

### E2E-072 — My Jobs shows a stale "x mins ago" from its cache
- **Found:** 2026-10-10, slice 3.3, case 3.3-02   **Role:** client
- **Category:** ux   **Severity:** S4   **Status:** Open
- **Steps:** 1. Post a job (03:41). 2. Open My Jobs at 03:43, leave, return to the All tab at 03:50.
- **Expected:** the card says about "9 mins ago".   **Actual:** it still says "2 mins ago" (the cached render), and only the Active tab at 03:51 shows "10 mins ago". The detail's "Posted" label is correct.
- **Evidence:** `evidence/E2E-072-stale-relative-time.png`
- **Suspected cause:** the list renders cached data first (`useAsyncData` cacheKey, `HOMyJobs.tsx:57-60`), and relative labels are computed at render time with no tick, so the cached labels are the old ones until something re-renders. Not investigated further.

### E2E-073 — Job detail shows ₱349.5 where the card shows ₱349.50
- **Found:** 2026-10-10, slice 3.3, case 3.3-20   **Role:** client
- **Category:** ux   **Severity:** S4   **Status:** Open
- **Steps:** 1. A job with budget 349.50. 2. Compare its My Jobs card with its Job Details hero.
- **Expected:** one money format everywhere ("₱349.50").   **Actual:** card "₱349.50", detail hero "₱349.5"; whole amounts show "₱300" on the detail but "₱300.00" on the card.
- **Evidence:** `evidence/E2E-073-card-349-50.png`, `evidence/E2E-073-hero-349-5.png`
- **Suspected cause:** the hero formats with a bare `toLocaleString` (`mobile/app/(homeowner)/screens/HOJobDetailScreen.tsx:206`) instead of the shared `peso()` helper (`mobile/src/lib/format.ts:5-11`) used by the card. Fix: use `peso(job.budget)`.

### E2E-074 — A cancelled job's progress timeline still shows "Posted" as the current stage
- **Found:** 2026-10-10, slice 3.3, case 3.3-37   **Role:** client
- **Category:** ux   **Severity:** S4   **Status:** Open
- **Steps:** 1. Cancel an open job. 2. Open it from the Cancelled tab and read Job Progress.
- **Expected:** no current stage, or an explicit cancelled state.   **Actual:** the "Cancelled" badge sits above a timeline whose "Posted" dot is the active blue ring, as if the job were still live.
- **Evidence:** `evidence/E2E-074-cancelled-timeline-posted.png`
- **Suspected cause:** `stageIndex` falls back to 0 for statuses outside the five stages (`mobile/app/(homeowner)/screens/HOJobDetailScreen.tsx:76-77`, rendered at :256-260). Fix: hide the timeline or render a cancelled marker for cancelled/expired.

### E2E-075 — My Jobs and Job Details have no way to refresh, so server-side changes stay invisible
- **Found:** 2026-10-10, slice 3.3, cases 3.3-14, 3.3-15, 3.3-43   **Role:** client
- **Category:** ux   **Severity:** S4   **Status:** Open
- **Steps:** 1. Open My Jobs (or a job's detail). 2. Change the job server-side (e.g. it is cancelled by the API/admin, or a provider applies). 3. Swipe down on the list.
- **Expected:** pull-to-refresh (PLAN 3.3) or an automatic refresh on focus.   **Actual:** no refresh gesture on My Jobs (3.3-14); the list kept "Open" for about 3 min after a cancel (3.3-15) and the detail kept "Open" with live Find Providers / Cancel Job buttons (3.3-43). Only leaving the screen and coming back updates it.
- **Evidence:** `evidence/E2E-075-stale-detail-after-cancel.png`
- **Suspected cause:** no `refreshControl` on the ScrollViews (`HOMyJobs.tsx:123-131`, `HOJobDetailScreen.tsx:186-191`, `HOJobApplicationsScreen.tsx:237-241`) and no focus/foreground refetch in `useAsyncData` (`mobile/src/hooks/useAsyncData.ts:36-76`). The Wallet screen already has the pattern (`HOWalletScreen.tsx:282-284`).

### E2E-076 — My Jobs status tabs don't tell screen readers which one is selected
- **Found:** 2026-10-10, slice 3.3, case 3.3-56   **Role:** client
- **Category:** ux   **Severity:** S4   **Status:** Open
- **Steps:** 1. My Jobs, All tab active. 2. `uiautomator dump`, read the tab node.
- **Expected:** the active tab exposes a selected state (PLAN §4a accessibility).   **Actual:** tab "All" is a plain clickable ViewGroup with `selected="false"`; the category chip "All services" next to it is a RadioButton with `selected="true"`. TalkBack users can't tell which status filter is on.
- **Evidence:** `evidence/E2E-076-tab-not-selected.png`, dump `~/.taskbuddy-e2e/scratch/3.3/u-3.3-56.xml` (not committed)
- **Suspected cause:** the tab Taps set no `accessibilityRole="tab"` / `accessibilityState={{ selected }}` (`mobile/app/(homeowner)/screens/HOMyJobs.tsx:90-102`), unlike the chips (:110-111).

### E2E-077 — My Jobs takes 5-10 s to show content on a warm backend
- **Found:** 2026-10-10, slice 3.3, case 3.3-58   **Role:** client
- **Category:** ux   **Severity:** S4   **Status:** Open
- **Steps:** 1. Warm backend (`curl GET /jobs/mine` answers in 1.0-1.2 s). 2. From Home tap the My Jobs tab; time until cards replace the skeleton.
- **Expected:** content within about 3 s (PLAN §4a).   **Actual:** 5.1 s and 9.8 s in two valid trials (the account has 42 jobs); the Job Details screen loads in about 2.2 s.
- **Evidence:** `evidence/E2E-077-myjobs-skeleton.png`; timings in `~/.taskbuddy-e2e/logs/3.3/3.3-58.log` (not committed)
- **Suspected cause:** not isolated. The list request pages by 100 (`mobile/src/lib/api.ts:1192-1209`) and the screen may refetch per tab/chip key (`HOMyJobs.tsx:57-60`); the gap between the 1 s API time and 5-10 s render suggests client-side work or serial requests. Worth a profiling pass.

### E2E-078 — Unverified providers are told "You can browse jobs now" but their feed is always empty
- **Found:** 2026-10-10, slice 4.1, cases 4.1-05, 4.1-06   **Role:** provider
- **Category:** ux   **Severity:** S3   **Status:** Open (needs product decision: copy or behaviour)
- **Steps:** 1. Log in as an unverified provider (`maestro.provider2@`). 2. Read the Home banner and the feed while an open Plumbing job exists (verified `maestro.provider@` sees it in `GET /jobs`).
- **Expected:** what the banner promises ("You can browse jobs now, but you must verify your identity before you can send proposals or be hired.").   **Actual:** "0 jobs available around your service area" and "No matching jobs"; `GET /jobs` as the unverified provider returns 0 jobs. The user is told they can browse and is shown an empty market with no hint that verification is why.
- **Evidence:** `evidence/E2E-078-unverified-empty-feed.png`
- **Suspected cause:** `JobsService.browse` returns an empty list when `provider_approved_categories` is empty (`backend/src/jobs/jobs.service.ts:153-166`), and approved categories require `is_verified` (migration 0037, skill gating). The banner copy (`mobile/app/(provider)/screens/SPHomeScreen.tsx`, verification banner) predates the gate. Either change the copy/empty state to "Verify to see jobs" or let unverified providers browse read-only.

### E2E-079 — Verification photo sources are inconsistent: ID is gallery-only, the selfie loses its gallery option after the first pick
- **Found:** 2026-10-10, slice 4.1, cases 4.1-13, 4.1-16   **Role:** provider
- **Category:** ux   **Severity:** S4   **Status:** Open
- **Steps:** 1. Get Verified, step 1: look for a camera option for the ID. 2. Step 2: "Choose from gallery", pick a selfie. 3. Look for a way to pick a different gallery image.
- **Expected:** the ID can be photographed (PLAN 4.1 asks for gallery and camera), and a picked selfie can be replaced from either source.   **Actual:** step 1 offers only the gallery dropzone; on step 2, once any selfie is set the only button is "Retake", which always opens the camera. A provider who picked the wrong gallery image can't pick another without starting over.
- **Evidence:** `evidence/E2E-079-selfie-retake-camera-only.png`
- **Suspected cause:** `mobile/app/(provider)/screens/SPVerificationScreen.tsx` step 1 calls only `pick('id')` (~:403, :419); step 2's button is `selfieAsset ? takeSelfie() : pick('selfie')` (~:453). Product call whether the selfie should be camera-only (a liveness intent) — if so, the first "Choose from gallery" option contradicts it.

### E2E-080 — Verification ID formats disagree: a GIF is accepted and sent as image/jpeg, the hint says "JPG, PNG", the server allows JPG/PNG/WebP
- **Found:** 2026-10-10, slice 4.1, case 4.1-19   **Role:** provider
- **Category:** app-bug   **Severity:** S4   **Status:** Open
- **Steps:** 1. Get Verified, step 1, tap the ID dropzone. 2. Pick a GIF (`p2d_GIF.gif`).
- **Expected:** refused with the accepted formats (the server allows only image/jpeg, image/png, image/webp, `backend/src/uploads/uploads.constants.ts`).   **Actual:** accepted with a preview and "Choose a different photo"; on submit it would upload as image/jpeg.
- **Evidence:** `evidence/E2E-080-gif-accepted-as-id.png`
- **Suspected cause:** the picker allows any image and `contentTypeFor` in `mobile/src/lib/api.ts` (~:668-679) maps every extension other than png/webp to image/jpeg, so the server's content-type allow-list never sees the real type. Same mapping as the job-photo GIF in 3.2-78. Row 4.1-25 probes the server side of this. Also (4.1-51): the hint under the ID dropzone says "Max 5 MB · JPG, PNG", although the server also accepts WebP and the picker lets a GIF through — the three disagree.

### E2E-081 — Stripe Identity is not active on the deployed backend: every verification falls back to the manual queue
- **Found:** 2026-10-10, slice 4.1, cases 4.1-26..28   **Role:** provider
- **Category:** env   **Severity:** S4   **Status:** Open (deploy/config)
- **Steps:** 1. Get Verified with a valid ID and selfie. 2. Tap Start Verification once.
- **Expected:** Stripe's hosted Identity page opens (the step 3 copy says it "opens in a secure browser window").   **Actual:** no browser; the app shows "Pending verification ... A TaskBuddy admin is reviewing your documents."; the row is `method: manual`, `stripe_session_id: null`.
- **Evidence:** `~/.taskbuddy-e2e/logs/4.1/4.1-26.png` (not committed; the pending card)
- **Suspected cause:** `POST /verifications/identity-session` fails (Stripe Identity not activated, see HANDOFF.md "Identity activation") and the app silently falls back to the manual flow (`SPVerificationScreen.tsx` ~:210-218). Behaviour is acceptable; the step 3 copy promising a browser window is not. The copy also disagrees across screens (4.1-49/50): step 3 promises an automated Stripe check, while the Help FAQ ("An admin reviews it, usually within a few days.") and the pending card describe admin review; the Home banner says "Your documents were not accepted." where the wizard says "Your documents were rejected."

### E2E-082 — Offline, a provider with a pending verification is shown "Verification required ... Verify now", and it stays after reconnecting
- **Found:** 2026-10-10, slice 4.1, case 4.1-30   **Role:** provider
- **Category:** ux   **Severity:** S4   **Status:** Open
- **Steps:** 1. Provider with a pending verification on Home ("Verification under review"). 2. `svc wifi/data disable`, return to Home. 3. Re-enable the network, re-open the Feed tab.
- **Expected:** keep the last known state (pending) or a neutral "checking" state.   **Actual:** the banner switches to "Verification required to apply ... Verify now" and keeps it after the network is back (until a remount).
- **Evidence:** `evidence/E2E-082-pending-shown-unverified-offline.png`
- **Suspected cause:** a failed `GET /verifications/me` is treated as "no verification" in the Home banner logic (`SPHomeScreen.tsx` verification banner); no refetch on reconnect/focus (same root as E2E-075).

### E2E-083 — Get Verified tap targets are under 48 dp (ID-type chips 36 dp, "Choose from gallery" 45 dp)
- **Found:** 2026-10-10, slice 4.1, case 4.1-47   **Role:** provider
- **Category:** ux   **Severity:** S4   **Status:** Open
- **Steps:** 1. Get Verified, step 1: `uiautomator dump`, read an ID-type chip. 2. Step 2: read "Choose from gallery".
- **Expected:** at least 48 dp (PLAN §4a).   **Actual:** chip `verify-doc-philsys` 422x94 px = 35.8 dp tall; "Choose from gallery" 880x118 px = 45 dp tall (density 420).
- **Evidence:** `evidence/E2E-083-verify-chips-small.png`; dumps `~/.taskbuddy-e2e/scratch/4.1/u-4.1-47-s1-v9b.xml`, `-s2-v9b.xml` (not committed)
- **Suspected cause:** chip and secondary-button padding in `mobile/app/(provider)/screens/SPVerificationScreen.tsx` styles; add `minHeight: 48` / `hitSlop`. The header back arrow is E2E-033.

### E2E-084 — Verification accepts a plain-text file declared as image/jpeg (server checks only the declared mimetype)
- **Found:** 2026-10-10, slice 4.1, case 4.1-25   **Role:** provider
- **Category:** backend-bug   **Severity:** S3   **Status:** Open (backend, not self-serve)
- **Steps:** (burner provider, test account) 1. `POST /uploads/signed-url {"bucket":"verification-docs","content_type":"image/jpeg"}` twice. 2. PUT a 52-byte plain-text body to each signed URL with `Content-Type: image/jpeg` (200). 3. `POST /verifications` with both paths.
- **Expected:** 400, the uploads are not images.   **Actual:** HTTP 201, a `pending` manual verification (`bbf34f04`) lands in the admin review queue with two text files as the ID and selfie. Rejected afterwards by the orchestrator.
- **Evidence:** API transcript in `~/.taskbuddy-e2e/logs/4.1/` notes (no tokens); repro is the three calls above.
- **Suspected cause:** `UploadsService.assertValidImage` (`backend/src/uploads/uploads.service.ts:98-124`) trusts the Storage object's recorded mimetype, which is whatever the uploader declared; magic bytes are only checked for generic types (application/octet-stream). The comment says it is a usability guard, not a decode. Fix: always check the image signature (it already exists as `hasImageSignature`), at least for verification-docs. The private bucket and image/jpeg serving limit the blast radius, but admins are shown arbitrary uploaded content.

### E2E-085 — A provider can open any open job by id, even in a category they are not approved for
- **Found:** 2026-10-10, slice 4.2, case 4.2-39   **Role:** provider
- **Category:** backend-bug   **Severity:** S4   **Status:** Open (backend, not self-serve)
- **Steps:** (test accounts) 1. `maestro.client@` posts a Cleaning job (category 2), H `36bbf08f`. 2. As `maestro.provider@` (approved for Plumbing only) `GET /jobs/36bbf08f-…`.
- **Expected:** 403/404, the same gate the feed applies (H is correctly absent from `GET /jobs`).   **Actual:** HTTP 200 with the full job record (title, description, address, coordinates, budget, status `open`, `category_id` 2).
- **Evidence:** `~/.taskbuddy-e2e/logs/4.2/API.log` (no tokens); repro is the call above.
- **Update 2026-10-11 (slice 4.3):** applying is gated: `POST /jobs/<Cleaning job>/applications` as `maestro.provider@` returns 400 "This job requires an approved skill on your verified provider profile" (migration 0037 trigger) and creates no row. So the exposure is read-only; severity stays S4.
- **Suspected cause:** `JobsService.getById` (`backend/src/jobs/jobs.service.ts:273-283`) lets any provider read any `open`/`recommending` job (`isBrowsable` checks role and status only); `browse` filters by `provider_approved_categories` (`:154-171`) but getById does not. Whether a provider can also **apply** outside their categories is checked in slice 4.3 (no category check found in `backend/src/applications`). Suggested fix: reuse the approved-categories check in getById for non-owner, non-assigned providers.

### E2E-086 — Feed paging accepts zero and negative `limit`/`offset`
- **Found:** 2026-10-10, slice 4.2, case 4.2-46   **Role:** provider
- **Category:** backend-bug   **Severity:** S4   **Status:** Open (backend, not self-serve)
- **Steps:** As `maestro.provider@`, `GET /jobs?latitude=13.9977608&longitude=121.167579&radius_km=8` with `limit=0`, `limit=-1`, `offset=-1`, `limit=1000000`.
- **Expected:** 400 for zero/negative paging values, and an upper bound on `limit`.   **Actual:** all HTTP 200. `limit=0` returns no jobs with the full summary (5/1/2400); `limit=-1` returns every job but the last; `offset=-1` returns only the last job; `limit=1000000` is accepted.
- **Evidence:** `~/.taskbuddy-e2e/logs/4.2/API.log`.
- **Suspected cause:** `BrowseJobsQueryDto.limit`/`offset` (`backend/src/jobs/dto/jobs.dto.ts:181-189`) have `@IsInt()` only, no `@Min`/`@Max`; `browse` passes them to `Array.slice` (`jobs.service.ts:225-231`), where negatives count from the end. The app always sends `limit: 20`, so users are not affected. Suggested fix: `@Min(1) @Max(100)` on limit and `@Min(0)` on offset.

### E2E-087 — The feed's Open/Urgent counts change with the urgency chip (Normal chip shows "0 Urgent" while an urgent job is open)
- **Found:** 2026-10-10, slice 4.2, cases 4.2-03/04/05   **Role:** provider
- **Category:** ux   **Severity:** S4   **Status:** Open (needs product sign-off)
- **Steps:** 1. Log in as `maestro.provider@` with five open jobs in range (one urgent). 2. Home shows Open 5 / Urgent 1. 3. Tap the Urgent, Normal, Flexible chips.
- **Expected:** the hero strip summarises the provider's feed (5 open, 1 urgent) whatever chip filters the list below; the list line already says how many match the chip.   **Actual:** the strip follows the chip: Urgent → Open 1 / Urgent 1, Normal → Open 3 / **Urgent 0**, Flexible → Open 1 / Urgent 0; All → 5 / 1 again.
- **Evidence:** `evidence/E2E-087-strip-follows-chip.png` (Urgent chip, strip 1/1).
- **Suspected cause:** the browse request carries `urgency` (`mobile/app/(provider)/screens/SPHomeScreen.tsx:116`) and the server builds `summary` after the urgency filter (`backend/src/jobs/jobs.service.ts:175, 216-223`). The screen's own comment (`SPHomeScreen.tsx:234-235`) says the strip counts the location-filtered feed. Fix options: filter urgency client-side only (the list is already re-filtered at `:154`), or have the server compute `summary` before the urgency filter.

### E2E-088 — Switching urgency chips flashes "No matching jobs / 0 jobs available" before the list loads
- **Found:** 2026-10-10, slice 4.2, case 4.2-04   **Role:** provider
- **Category:** app-bug   **Severity:** S4   **Status:** Open
- **Steps:** 1. Feed with the Urgent chip selected (one job, A). 2. Tap Normal.
- **Expected:** the old list or a loading state until the Normal results arrive.   **Actual:** the first frame after the tap shows the empty state "No matching jobs — Adjust your search or urgency filter to see more opportunities." and "0 jobs available around your service area"; the three Normal jobs replace it a moment later.
- **Evidence:** `evidence/E2E-088-chip-empty-flash.png`.
- **Suspected cause:** while the new request is in flight, `data` still holds the previous chip's jobs, and the screen re-filters them by the new chip (`SPHomeScreen.tsx:152-156`), which leaves zero, so the empty state (`:359-367`) renders. Fix: show the skeleton (or keep the previous list unfiltered) while the urgency key differs from the key of the data shown.

### E2E-089 — With the keyboard up, the first tap on a feed urgency chip only closes the keyboard
- **Found:** 2026-10-10, slice 4.2, case 4.2-12   **Role:** provider
- **Category:** app-bug   **Severity:** S4   **Status:** Open
- **Steps:** 1. Feed: tap "Search open jobs" and type (keyboard up). 2. Tap the Normal chip.
- **Expected:** Normal is selected (the outer feed list already opts into handled taps).   **Actual:** the keyboard closes and All stays selected; a second tap selects Normal.
- **Evidence:** `~/.taskbuddy-e2e/logs/4.2/4.2-12.log` (first tap on `feed-urgency-normal` completed, selection unchanged; retry with the keyboard hidden worked).
- **Suspected cause:** the chips sit in a nested horizontal `ScrollView` (`mobile/app/(provider)/screens/SPHomeScreen.tsx:324`) without `keyboardShouldPersistTaps`; the outer ScrollView sets `"handled"` (`:162`) but nested scroll views need their own. Fix: add `keyboardShouldPersistTaps="handled"` to the chip row ScrollView (RNTL test can assert the prop).

### E2E-090 — The feed's search text is cleared after opening a job and coming back, while the urgency chip is kept
- **Found:** 2026-10-10, slice 4.2, case 4.2-13   **Role:** provider
- **Category:** ux   **Severity:** S4   **Status:** Open
- **Steps:** 1. Feed: select Normal, type "7.8" in "Search open jobs" (only D listed). 2. Open D. 3. Header back.
- **Expected:** both filters still applied (D only).   **Actual:** the chip is still Normal, but the search box is back to its placeholder and the list shows B, C, D ("3 jobs available ...").
- **Evidence:** `evidence/E2E-090-search-lost.png`.
- **Suspected cause:** the chip uses `useRetainedState('sp.feed.urgency')` (`mobile/app/(provider)/screens/SPHomeScreen.tsx:111`) but the search is plain `useState` (`:128`), and Home remounts on return (`mobile/App.tsx` stack navigation). Fix: retain the search the same way (e.g. `useRetainedState('sp.feed.search', '')`).

### E2E-091 — The provider feed has no pull-to-refresh: new jobs don't appear and cancelled jobs stay listed until Home is remounted
- **Found:** 2026-10-10, slice 4.2, cases 4.2-14, 4.2-16   **Role:** provider
- **Category:** ux   **Severity:** S4   **Status:** Open
- **Steps:** 1. Provider on the feed. 2. A client posts a job in range (I-photo) / cancels a listed job (B). 3. Swipe down on the feed and wait 5 s.
- **Expected:** a refresh gesture that loads the new job and drops the cancelled one.   **Actual:** nothing happens; the list stays as it was ("6 jobs available"), I-photo appears only after switching to My Work and back, and the cancelled B stays listed (tapping it shows "This job isn't available — You do not have access to this job"). The client-side counterpart is E2E-075.
- **Update 2026-10-11 (case 4.2-48):** returning from the background does not refresh either: Home, KEYCODE_HOME, the client cancels I-photo, the app is brought back after 10 s, and I-photo is still listed at +5 s and +25 s ("7 jobs available") although `GET /jobs` no longer returns it.
- **Evidence:** `evidence/E2E-091-no-pull-refresh.png` (after the swipe, I-photo missing; the server already listed it).
- **Suspected cause:** the feed `ScrollView` (`mobile/app/(provider)/screens/SPHomeScreen.tsx:162-165`) has no `RefreshControl`; `useAsyncData` (`mobile/src/hooks/useAsyncData.ts`) only refetches on a dependency change or remount, and the foreground hook (`SPHomeScreen.tsx:100`) runs only for unverified providers and reloads only profile/verification. Fix: add a `RefreshControl` bound to the feed's `reload`, and reload on foreground.

### E2E-092 — Job Details drops the distance that the feed card shows
- **Found:** 2026-10-10, slice 4.2, case 4.2-21   **Role:** provider
- **Category:** ux   **Severity:** S4   **Status:** Open
- **Steps:** 1. Provider feed: card A shows "445 m away". 2. Open A.
- **Expected:** the Location fact repeats the distance (the screen has a slot for it).   **Actual:** Location shows only the address; no distance line anywhere on Job Details.
- **Evidence:** `evidence/E2E-092-detail-no-distance.png`.
- **Suspected cause:** `SPJobDetailScreen.tsx:243-245` renders `distanceLabel(job.distance_km)`, but `GET /jobs/:id` (`backend/src/jobs/jobs.service.ts:273-283`) never computes `distance_km`; only `browse` adds it (`:227-231`). Fix options: pass the card's distance through navigation, or compute it on the client from the profile and job coordinates.

### E2E-093 — The feed jumps back to the top after opening a job and coming back
- **Found:** 2026-10-10, slice 4.2, case 4.2-44   **Role:** provider
- **Category:** ux   **Severity:** S4   **Status:** Open
- **Steps:** 1. Feed with six jobs; scroll to the bottom (E and X visible). 2. Open E. 3. Header back.
- **Expected:** the feed returns at the same scroll offset.   **Actual:** the feed is at the top (hero and A visible); the provider has to scroll down again after every job they look at.
- **Evidence:** `evidence/E2E-093-scroll-reset.png`.
- **Suspected cause:** Home remounts on return and its ScrollView (`mobile/app/(provider)/screens/SPHomeScreen.tsx:162-165`) does not use the existing `useRetainedScroll` helper (`mobile/src/hooks/useRetainedState.ts`, whose header says scroll position should survive navigation).

### E2E-094 — After leaving the feed and coming back, the availability switch shows "Not available" while the provider is actually available
- **Found:** 2026-10-11, slice 4.2, case 4.2-45   **Role:** provider
- **Category:** app-bug   **Severity:** S3   **Status:** Open
- **Steps:** 1. Feed: turn the availability switch On ("Available for jobs"; `GET /auth/me` → `provider_profile.is_available: true`). 2. Tap My Work, then Feed.
- **Expected:** the switch is On, matching the server.   **Actual:** the switch is Off with "Not available — You won't be invited to new jobs" while the server still says available (so the provider can be invited while being told they won't be). Tapping the switch from that state turns it On with no server change (true → true), so a second tap is needed to really go unavailable.
- **Evidence:** `evidence/E2E-094-availability-stale.png` (after the return; GET /auth/me at that moment: is_available true, in `~/.taskbuddy-e2e/logs/4.2/4.2-45.log`).
- **Suspected cause:** the switch state is seeded from AuthContext's `providerProfile.is_available` (`mobile/app/(provider)/screens/SPHomeScreen.tsx:126, 129-131`), but `toggleAvailability` (`:133-145`) only calls `api.setAvailability` and never updates AuthContext, and Home refreshes the profile on mount only for unverified providers (`:103-105`). On remount the stale cached `false` comes back. Fix: update the cached provider profile after a successful toggle (or `refreshProfile()` after it), with an RNTL test that remounts Home after a toggle.

### E2E-095 — Feed accessibility: urgency chips are 40 dp tall and the search field has no label
- **Found:** 2026-10-11, slice 4.2, case 4.2-33   **Role:** provider
- **Category:** ux   **Severity:** S4   **Status:** Open
- **Steps:** uiautomator dump of the provider feed (top).
- **Expected:** tap targets ≥ 48 dp; inputs labelled.   **Actual:** the four urgency chips are 105 px = 40 dp tall (they do expose role button and the selected state correctly); the "Search open jobs" field has no content-desc, only its placeholder; the bell and avatar buttons are 44 dp. Job cards are fine (button with title, price, address, urgency, category). The Job Details header back arrow is unlabelled (38 dp), already logged as E2E-033.
- **Evidence:** `~/.taskbuddy-e2e/scratch/4.2/u33-home.xml`, `u33-detail.xml`.
- **Suspected cause:** chip `minHeight: 40` (`mobile/app/(provider)/screens/SPHomeScreen.tsx:491`); the `TextInput` at `:314-321` has no `accessibilityLabel`; icon buttons are 44×44 (`:425`, `:437`). Same family as E2E-083.

### E2E-096 — A provider with no saved address is told "within 15 km of your location" but sees jobs from anywhere, with no distances
- **Found:** 2026-10-11, slice 4.2, case 4.2-20   **Role:** provider
- **Category:** ux   **Severity:** S4   **Status:** Open
- **Steps:** 1. Log in as `maestro.provider2@` (verified, Plumbing, no address/coordinates, service radius 15). 2. Read the availability card and the feed.
- **Expected:** either a prompt to set a service address ("Add your address to see jobs near you"), or a hint that does not claim a radius.   **Actual:** the hint reads "You won't be invited to new jobs · within 15 km of your location" while the feed lists every open Plumbing job on the platform with no distance labels, including "E2E 4.2 G Makati far" about 65 km from the Lipa jobs (8 cards).
- **Evidence:** `evidence/E2E-096-radius-hint-no-location.png`.
- **Suspected cause:** the app sends no `latitude`/`longitude` when the profile has none (`mobile/app/(provider)/screens/SPHomeScreen.tsx:117-118`), so `browse` skips the radius filter (`backend/src/jobs/jobs.service.ts:180, 196-200`), but the hint always prints `within {radiusKm} km of {city || 'your location'}` (`SPHomeScreen.tsx:157, 220`). Ties in with 8.4 (account-state matrix: provider with no address).

### E2E-097 — Offline, opening a feed job says "This job isn't available — it may have been filled by another provider"
- **Found:** 2026-10-11, slice 4.2, case 4.2-X02   **Role:** provider
- **Category:** ux   **Severity:** S4   **Status:** Open
- **Steps:** 1. Provider feed loaded. 2. Turn Wi-Fi and data off. 3. Tap an open job (A).
- **Expected:** an offline message with a retry; the job is not claimed to be gone.   **Actual:** the "unavailable job" card: lock icon, "This job isn't available", "Cannot reach the server. Check your connection and try again.", "It may have been filled by another provider or closed by the client.", and only "Go back". After reconnecting, Go back and re-opening works. (The feed itself, remounted offline, silently shows its cached list with no offline notice.)
- **Evidence:** `evidence/E2E-097-offline-job-unavailable.png`.
- **Suspected cause:** `SPJobDetailScreen.tsx:215-225` renders the same error card for any `useAsyncData` error, so a network failure (`ApiError` status 0) gets the "filled/closed" title and hint. Fix: branch on network errors (title like "You're offline", a Retry that calls `reload`).

### E2E-098 — A provider cannot withdraw a pending proposal anywhere in the app
- **Found:** 2026-10-11, slice 4.3, case 4.3-08   **Role:** provider
- **Category:** app-bug   **Severity:** S3   **Status:** Open
- **Steps:** 1. As `maestro.provider@`, send a proposal on J4. 2. Look for a way to take it back: the job's detail (top to bottom), the My Work card (tap and long-press).
- **Expected:** a "Withdraw proposal" action while the proposal is pending (the backend supports it).   **Actual:** the detail shows only "Your proposal · Waiting for the client to choose a provider." and a locked "Proposal Pending"; the My Work card opens the same detail; long-press does the same. The only way to withdraw is the raw API (`POST /applications/:id/withdraw`, 201 → `withdrawn`, which the app then shows as "You withdrew this proposal.").
- **Evidence:** `evidence/E2E-098-no-withdraw.png`.
- **Suspected cause:** `api.withdrawApplication` exists (`mobile/src/lib/api.ts:1283-1284`) but nothing calls it; `SPJobDetailScreen.tsx:395-401` renders a locked label for every application status, and `SPMyJobsScreen.tsx` cards only navigate. Not listed in `mobile/README.md` "What's Not Wired Yet". A provider who changes their mind stays committed until the client acts.

### E2E-099 — After withdrawing, a provider can never apply to that job again, and the app doesn't say so
- **Found:** 2026-10-11, slice 4.3, case 4.3-11   **Role:** provider
- **Category:** ux   **Severity:** S4   **Status:** Open (needs product sign-off)
- **Steps:** 1. p1 applies to J4, then withdraws (API, see E2E-098). 2. Re-open J4. 3. `POST /jobs/J4/applications` again.
- **Expected:** either re-applying is allowed (the withdrawn row is reactivated), or the app explains that a withdrawn proposal is final.   **Actual:** the detail shows "You withdrew this proposal." and a locked "Proposal withdrawn" with no explanation; the API answers 400 "You already applied to this job".
- **Evidence:** `evidence/E2E-099-withdrawn-dead-end.png`.
- **Suspected cause:** `job_applications` has `unique (job_id, provider_id)` (`backend/supabase/migrations/0001_enums_and_tables.sql:133`), and `apply` maps the violation to "You already applied" (`backend/src/applications/applications.service.ts:78-79`); nothing moves a withdrawn row back to pending. Product call: allow re-apply (upsert a withdrawn row to pending) or make the finality explicit in the copy.

### E2E-100 — An empty-string cover message shows as a blank box on the client's Proposals screen
- **Found:** 2026-10-11, slice 4.3, case 4.3-23   **Role:** client
- **Category:** backend-bug   **Severity:** S4   **Status:** Open (backend, not self-serve)
- **Steps:** 1. As `maestro.provider2@`, `POST /jobs/<J4>/applications {"cover_message":""}` (201). 2. As `maestro.client@`, open J4 → View Offers.
- **Expected:** "No cover message." (as for a null message) or a 400.   **Actual:** p2's card shows an empty grey box; the withdrawn p1 card on the same screen (null message) shows "No cover message.".
- **Evidence:** `evidence/E2E-100-blank-cover.png`.
- **Suspected cause:** `apply` stores `dto.cover_message ?? null`, so `""` is kept (`backend/src/applications/applications.service.ts:72`); the client card uses `??` too (`mobile/app/(homeowner)/screens/HOJobApplicationsScreen.tsx:311`). The app itself never sends `""` (it trims and omits, `SPJobDetailScreen.tsx:144`), so only API clients hit this. Fix: normalise blank to null on the server (or `||` in the card).

### E2E-101 — When the client cancels a job, providers who applied still see "Proposal sent" and get no notification
- **Found:** 2026-10-11, slice 4.3, case 4.3-25 (+ 4.3-X01)   **Role:** provider
- **Category:** ux   **Severity:** S4   **Status:** Open
- **Steps:** 1. p1 has a pending proposal on J2. 2. The client cancels J2 (`POST /jobs/J2/cancel`, 201). 3. p1 opens My Work.
- **Expected:** the card shows the job was cancelled (e.g. "Job cancelled"), and p1 is notified.   **Actual:** the J2 card still has the "Proposal sent" pill; tapping it gives "This job isn't available — It may have been filled by another provider or closed by the client." No notification reached p1 (`GET /notifications`: newest entries are from 10-08/10-10, nothing for J2 or J3).
- **Evidence:** `evidence/E2E-101-cancelled-job-proposal-sent.png`; `~/.taskbuddy-e2e/logs/4.3/4.3-X01.log`.
- **Suspected cause:** My Work pills come from the application status only (`mobile/app/(provider)/screens/SPMyJobsScreen.tsx:90, 135, 186`), and `JobsService.cancel` updates only the job (`backend/src/jobs/jobs.service.ts:286-310`): pending applications stay `pending` and no applicant is notified. Fix: on cancel, mark pending applications (e.g. rejected/closed) and notify applicants; show the job status on the card.

### E2E-102 — The client's Calendar never shows a hired booking without a scheduled date
- **Found:** 2026-10-11, slice 5.1, case 5.1-14   **Role:** client
- **Category:** app-bug   **Severity:** S4   **Status:** Open
- **Steps:** 1. Client hires a provider on J1 (flexible, no date). 2. Open the client's Calendar.
- **Expected:** the booking appears, as on the provider's calendar (PLAN 5.1: "a booking/calendar entry exists on both sides").   **Actual:** "No jobs on this day — Jobs with a scheduled date will show up here.", no day marker anywhere; yet `GET /calendar/bookings` for the client returns the J1 booking (status scheduled, `2026-10-10T19:09Z`).
- **Evidence:** `evidence/E2E-102-client-calendar-empty.png`.
- **Suspected cause:** the client calendar builds its days from the client's jobs' `scheduled_at` (`mobile/app/(homeowner)/screens/HOCalendarScreen.tsx:43, 49, 150`) instead of `GET /calendar/bookings`, which the provider calendar uses (`SPCalendarScreen.tsx:58-61`).

### E2E-103 — A flexible booking appears on the provider's calendar at the hire time ("3:09 AM · Scheduled")
- **Found:** 2026-10-11, slice 5.1, case 5.1-04   **Role:** provider
- **Category:** ux   **Severity:** S4   **Status:** Open
- **Steps:** 1. Client hires p1 on J1 (no scheduled date) at 03:09 Manila. 2. p1 opens Calendar.
- **Expected:** a flexible booking reads as unscheduled (e.g. "Flexible — agree a time with the client"), as Home and My Work say.   **Actual:** Calendar lists J1 on Oct 11 at "3:09 AM" with a "Scheduled" pill, while Home and My Work say "Flexible schedule". A provider could turn up at 3 AM.
- **Evidence:** `evidence/E2E-103-hire-time-as-schedule.png`.
- **Suspected cause:** the hire trigger creates the booking with `coalesce(scheduled_at, assigned_at)` (`backend/supabase/migrations/0039_confirm_jobs_on_hire.sql:26-29`), so the hire timestamp becomes the appointment.

### E2E-104 — The provider who was not selected gets no notification and sees "This job isn't available — may have been filled by another provider"
- **Found:** 2026-10-11, slice 5.1, case 5.1-05   **Role:** provider
- **Category:** ux   **Severity:** S4   **Status:** Open
- **Steps:** 1. p1 and p2 apply to J1. 2. Client hires p1 (p2's application is auto-rejected). 3. p2 checks notifications and opens J1 from My Work ("Not selected" pill).
- **Expected:** a "not selected" notification (a manual Reject sends "Your application to … was not selected."), and the detail's own copy "The client selected another provider." / locked "Not Selected".   **Actual:** no notification at all; the detail is the generic error card "This job isn't available — You do not have access to this job — It may have been filled by another provider or closed by the client."
- **Evidence:** `evidence/E2E-104-not-selected-error-card.png`.
- **Suspected cause:** the hire trigger rejects the other applications in SQL without notifying (`backend/supabase/migrations/0039_confirm_jobs_on_hire.sql:22-24`), unlike `ApplicationsService.reject`. `JobsService.getById` 403s a non-assigned provider once the job is no longer open (`backend/src/jobs/jobs.service.ts:277-281`), so `SPJobDetailScreen.tsx:340-350, 395-401` (written for this case) never renders.

### E2E-105 — When the hire sheet's reads fail, it says a ₱350 job "has no budget, so nothing is held" and offers an enabled Hire
- **Found:** 2026-10-11, slice 5.1, case 5.1-15   **Role:** client
- **Category:** app-bug   **Severity:** S3   **Status:** Open
- **Steps:** 1. `maestro.client2@` opens K2 (budget ₱350) → View Offers → Accept. 2. Turn Wi-Fi and data off. 3. Tap Continue.
- **Expected:** an error state ("Couldn't load the payment options — try again") with no Hire button.   **Actual:** the sheet "Hire Maestro Provider Two — This job has no budget, so nothing is held — Maestro Provider Two is hired straight away." with a Hire button, plus "Cannot reach the server…". If the reads fail while the hire call could still succeed (a flaky connection), the client is told nothing will be held and the server then holds the budget (or, for an unfunded client, refuses with insufficient funds).
- **Evidence:** `evidence/E2E-105-no-budget-copy-offline.png`. Hire was not tapped.
- **Suspected cause:** `HirePaymentModal` treats a missing budget as "no budget" (`mobile/src/components/HirePaymentModal.tsx:65-66, 77-79`) and the screen passes nothing when `api.getJob`/`api.wallet` fail (`HOJobApplicationsScreen.tsx:123-125`). Fix: distinguish "not loaded" from "budget null" and show a retry instead of the hire options. Money-adjacent UI: fix spec needs a user OK (PLAN §6 escalation list).

### E2E-106 — The hire sheet's Cancel sits under the system navigation bar
- **Found:** 2026-10-11, slice 5.1, case 5.1-15   **Role:** client
- **Category:** ux   **Severity:** S4   **Status:** Open
- **Steps:** Open the "Hire <provider>" payment sheet on a phone with 3-button navigation (emulator `Medium_Phone`).
- **Expected:** Cancel fully above the navigation bar.   **Actual:** the Cancel label is drawn behind the back/home/recents bar (bounds about y 2244-2370 of 2400); a tap there pressed Home and backgrounded the app.
- **Evidence:** `evidence/E2E-105-no-budget-copy-offline.png` (bottom edge: "Cancel" behind the nav bar).
- **Suspected cause:** the bottom sheet in `mobile/src/components/HirePaymentModal.tsx` does not add the bottom safe-area inset to its padding.

### E2E-107 — The floating "Post a job" button covers transaction amounts on the client Wallet
- **Found:** 2026-10-11, slice 5.1, case 5.1-12   **Role:** client
- **Category:** ux   **Severity:** S4   **Status:** Open
- **Steps:** Client Wallet with three or more transactions, default scroll.
- **Expected:** every amount readable (list padded past the floating button, or no button on Wallet).   **Actual:** the "+ Post a job" button sits over the third row's amount ("Escrow hold — E2E 4.3 J1 two applicants", −₱500.00 hidden) and part of its "Escrow funded" line. Money figures on the money screen are the ones a client most needs to read.
- **Evidence:** `evidence/E2E-107-fab-covers-amount.png`.
- **Suspected cause:** the client-wide floating "Post a job" button is drawn over every tab, and the Wallet list's bottom padding does not leave room for it. Fix: hide it on Wallet, or add bottom content padding equal to its height.

### E2E-108 — Help & Support tells clients to "tap Hire … from the job's Applications screen"; the app says View Offers → Proposals → Accept
- **Found:** 2026-10-11, slice 5.1, case 5.1-X01   **Role:** client
- **Category:** ux   **Severity:** S4   **Status:** Open
- **Steps:** Client → Help & Support → "How do I hire a provider?"; compare with the real path.
- **Expected:** the FAQ uses the app's words.   **Actual:** FAQ: "Post a job, review proposals from providers, and tap Hire on the one you choose from the job's Applications screen." The job detail button is "View Offers", the screen is titled "Proposals", the button is "Accept", and the sheet then offers "Pay from wallet" / "Pay by card".
- **Evidence:** `mobile/src/components/HelpSupportScreen.tsx:34`; `evidence/E2E-107-fab-covers-amount.png` and the 5.1 screenshots for the real labels.
- **Suspected cause:** FAQ copy predates the hire-sheet redesign.

### E2E-109 — "File a Complaint" is offered on a booking the provider declined and that was already refunded in full
- **Found:** 2026-10-11, slice 5.2, cases 5.2-05 / 5.2-06   **Role:** both
- **Category:** ux   **Severity:** S4   **Status:** Open (needs product sign-off)
- **Steps:** 1. Hire a provider (escrow held). 2. Provider taps Decline Booking with a reason. 3. Open the job on either role.
- **Expected:** after a pre-start provider decline that refunded the client automatically, either no complaint entry point, or copy that says what a complaint is for at that point.   **Actual:** both job details show "File a Complaint" (the provider's sits above "Booking Cancelled"). Filing it would open a case whose payment is already settled, so an admin can only record "reviewed".
- **Evidence:** `evidence/E2E-109-provider-declined-complaint.png`
- **Suspected cause:** by design in the backend: `raise_job_dispute` accepts `cancelled` jobs with an assigned provider (`backend/supabase/migrations/0041_complaints_and_cancellation_review.sql:53`), and both screens mirror it (`mobile/app/(homeowner)/screens/HOJobDetailScreen.tsx:161-164`, `mobile/app/(provider)/screens/SPJobDetailScreen.tsx:375-380`). Product call: keep it (e.g. a complaint about a late decline), or hide it when the escrow is already `cancelled`/`refunded`.

- **Re-checked 2026-10-12 (7.4-05):** still present on both roles. Cancelled, refunded K3 shows "File a Complaint" as the only client footer action, and the provider (p2) sees "File a Complaint" next to "Booking Cancelled".
### E2E-110 — The client who cancelled gets the provider's instructions: "Provider: agree or contest within 48 hours…"
- **Found:** 2026-10-11, slice 5.2, case 5.2-08   **Role:** client
- **Category:** backend-bug   **Severity:** S4   **Status:** Open
- **Steps:** 1. Client cancels a confirmed booking (escrow held). 2. Open the client's notifications.
- **Expected:** the client's notice says what happens to the client ("Your ₱300 stays held while the provider has 48 hours to respond; no response refunds you").   **Actual:** both roles get the same row, "Cancellation response requested" / "Provider: agree or contest within 48 hours. No response refunds the client. An open complaint blocks automatic refund." The client reads instructions written for someone else.
- **Evidence:** `evidence/E2E-110-client-gets-provider-notice.png`
- **Suspected cause:** `review_work_cancellation` inserts one title/body for both recipients (`backend/supabase/migrations/0041_complaints_and_cancellation_review.sql:110-114`). Fix: a new migration that branches title/body on `id = old.client_id`. Backend, so log only.

### E2E-111 — "Contest cancellation" looks enabled while the note is empty (it is disabled)
- **Found:** 2026-10-11, slice 5.2, case 5.2-09   **Role:** provider
- **Category:** app-bug   **Severity:** S4   **Status:** Open
- **Steps:** 1. Client cancels a confirmed booking. 2. Provider opens the job → View Complaint Status. 3. Leave the note empty.
- **Expected:** both response buttons look disabled until a note is typed.   **Actual:** "Agree to cancellation and refund" is greyed; "Contest cancellation" is a normal white outline button that does nothing when tapped, so it looks broken.
- **Evidence:** `evidence/E2E-111-contest-looks-enabled.png`
- **Suspected cause:** `mobile/app/(homeowner)/screens/HODisputeStatusScreen.tsx:126` sets `disabled` but no disabled style (`:125` applies `styles.buttonDisabled`). Fix: apply a disabled outline style (and dim the label) when `busy || !body.trim()`.

### E2E-112 — Complaint Status shows raw database values: "Decision recorded: refunded_to_client", "Maestro Provider · cancellation_response"
- **Found:** 2026-10-11, slice 5.2, case 5.2-10   **Role:** both
- **Category:** app-bug   **Severity:** S4   **Status:** Open
- **Steps:** 1. Client cancels a confirmed booking. 2. Provider agrees on Complaint Status. 3. Read the decision card and the activity list (either role).
- **Expected:** plain words ("Refunded to the client"; "Agreed to the cancellation" / "Response").   **Actual:** the card reads "Decision recorded: refunded_to_client" and the activity entry label is "Maestro Provider · cancellation_response".
- **Evidence:** `evidence/E2E-112-raw-enum-decision.png`
- **Suspected cause:** `mobile/app/(homeowner)/screens/HODisputeStatusScreen.tsx:52` interpolates `dispute.resolution` directly, and the entry label prints `entry.kind`. Fix: a label map for `resolution` (released_to_provider / refunded_to_client / reviewed) and for entry kinds. The admin resolve notification body has the same raw value (`backend/supabase/migrations/0041_complaints_and_cancellation_review.sql:248`); that half is backend.

### E2E-113 — The API accepts a whitespace-only decline reason, so the client is told "… declined "<job>":    "
- **Found:** 2026-10-11, slice 5.2, case 5.2-20   **Role:** provider (API) → client
- **Category:** backend-bug   **Severity:** S4   **Status:** Open
- **Steps:** 1. Hire a provider. 2. As the provider, `POST /jobs/<id>/decline` with `{"reason":"   "}`.
- **Expected:** 400, the same rule the app applies (it trims and disables Decline, `mobile/src/components/DeclineBookingModal.tsx:67-68`).   **Actual:** 201; the job is cancelled and the client's "Booking declined" notification ends with three spaces where the reason should be.
- **Evidence:** `~/.taskbuddy-e2e/logs/5.2/5.2-20.log` (API-only, no screenshot committed)
- **Suspected cause:** `DeclineJobDto.reason` is `@IsString() @Length(1, 200)` with no trim (`backend/src/jobs/dto/jobs.dto.ts:210-214`). Fix: `@Transform(({ value }) => typeof value === 'string' ? value.trim() : value)` before `@Length`, or `@Matches(/\S/)`. The disputes RPC already does this (`btrim`, `0041_complaints_and_cancellation_review.sql:56`). Not reachable from the app; reachable by any provider calling the API.

### E2E-114 — The client Home "Wallet balance" stays stale after a refund lands; pulling down does not refresh it
- **Found:** 2026-10-11, slice 5.2, case 5.2-X01   **Role:** client
- **Category:** ux   **Severity:** S4   **Status:** Open
- **Steps:** 1. Client sits on Home (card ₱49,180.00). 2. A refund is credited server-side (admin resolves a cancellation dispute, +₱320). 3. Pull down on Home. 4. Tap My Jobs, then Home.
- **Expected:** the balance updates on pull-to-refresh (or on focus).   **Actual:** after the credit and a pull-down the card still read ₱49,180.00 while `GET /wallet` said 49,500; it showed ₱49,500.00 only after the My Jobs → Home round trip remounted the screen.
- **Evidence:** `evidence/E2E-114-home-balance-stale.png` (card after the pull, GET /wallet 49,500 in `~/.taskbuddy-e2e/logs/5.2/wallets-post16.log`)
- **Suspected cause:** `mobile/app/(homeowner)/screens/HOHomeScreen.tsx:85` loads the wallet once per mount (`useAsyncData`), with no RefreshControl or focus refetch. Same family as E2E-075 / E2E-091 (no refresh on My Jobs, Job Details, provider feed). A refund arrives without any client action (provider agreement, deadline expiry, admin decision), so this screen is where it's most likely to be missed.

### E2E-115 — Before Start Job, the provider is told "Tick tasks off as you finish them" but the checklist is inert
- **Found:** 2026-10-11, slice 5.3, case 5.3-02   **Role:** provider
- **Category:** ux   **Severity:** S4   **Status:** Open
- **Steps:** 1. Client hires the provider (booking confirmed). 2. Provider opens the job before tapping Start Job.
- **Expected:** the progress hint says work starts with Start Job (e.g. "Tap Start Job when you arrive, then tick tasks off as you finish them"), or the hint is hidden until Start.   **Actual:** "Progress 0/2 — Tick tasks off as you finish them. The client sees this update." sits above checkboxes that look normal but do nothing (`disabled` while not editable); the API refuses with "Cannot update the checklist of a job in status 'confirmed'" (5.3-01).
- **Evidence:** `evidence/E2E-115-prestart-tick-hint.png`
- **Suspected cause:** `mobile/app/(provider)/screens/SPJobDetailScreen.tsx:272-275` picks the hint only from `doneCount`, not from `tasksEditable`; the rows set `disabled={!tasksEditable …}` (`:295`) with no disabled styling. Fix: branch the hint on `tasksEditable` and dim the boxes while it is false.

### E2E-116 — Unticking and re-ticking the last task sends the client a second "Work ready for review"
- **Found:** 2026-10-11, slice 5.3, case 5.3-07   **Role:** client
- **Category:** backend-bug   **Severity:** S4   **Status:** Open
- **Steps:** 1. Provider ticks every task (client gets "Work ready for review"). 2. Provider unticks one and ticks it again.
- **Expected:** one "work ready" notice per completion of the checklist, or the earlier one replaced.   **Actual:** a second identical "Work ready for review" / "All tasks are marked done. Review the work before confirming completion." arrives (bell 38 → 39); a provider toggling a box repeatedly spams the client.
- **Evidence:** `evidence/E2E-116-duplicate-work-ready.png`
- **Suspected cause:** the `notify_work_ready` trigger fires whenever the last undone task flips to done, with no check for an existing unread notice (`backend/supabase/migrations/0037_fulltest_remediation.sql:82-91`). Fix: skip the insert when an unread `Work ready for review` for the same job already exists. Backend, so log only.

### E2E-117 — Complaint notification grammar: "A participant added a appeal."
- **Found:** 2026-10-11, slice 5.3 (seen on p1's list after the 5.2-21 appeal)   **Role:** both
- **Category:** backend-bug   **Severity:** S4   **Status:** Open
- **Steps:** 1. A participant posts an appeal on a complaint. 2. The other participant opens Notifications.
- **Expected:** "A participant added an appeal." (or "a statement").   **Actual:** "A participant added a appeal. Open the case to read it."
- **Evidence:** text only (p1 notification list, `~/.taskbuddy-e2e/logs/5.3/` P4 run)
- **Suspected cause:** `backend/supabase/migrations/0041_complaints_and_cancellation_review.sql:154` builds the body as `'A participant added a ' || p_kind`. Fix: a CASE per kind (new migration). Backend copy, log only.

### E2E-118 — An admin-released payout hides the platform fee: "Payout — <job>" for ₱660.45 on a ₱777 job
- **Found:** 2026-10-11, slice 5.3, case 5.3-13   **Role:** provider
- **Category:** backend-bug   **Severity:** S4   **Status:** Open
- **Steps:** 1. Complete a ₱777 job (commission 0.15). 2. Client files a complaint inside the warranty. 3. Admin resolves `released_to_provider`. 4. Provider reads the ledger.
- **Expected:** the same title the automatic release writes, "Payout — <job> (less 116.55 platform fee)", so the provider can see why 777 became 660.45.   **Actual:** the credit is right (660.45, commission 116.55 frozen on the escrow row) but titled "Payout — E2E 5.3 M1 odd budget", with no fee mentioned.
- **Evidence:** `~/.taskbuddy-e2e/logs/5.3/5.3-13.log` (API), `evidence/E2E-118-payout-no-fee.png`
- **Suspected cause:** `resolve_job_dispute` passes `'Payout — ' || job.title` (`backend/supabase/migrations/0041_complaints_and_cancellation_review.sql:235`), while `EscrowService.payOut` appends the fee (`backend/src/escrow/escrow.service.ts:226-228`). Fix: build the same suffix in the SQL when `commission > 0` (new migration).

### E2E-119 — The provider Wallet never shows money held for them: ₱500 in escrow for a completed job is invisible
- **Found:** 2026-10-11, slice 5.3, case 5.3-11 (first seen 5.2-19)   **Role:** provider
- **Category:** ux   **Severity:** S3   **Status:** Open
- **Steps:** 1. Client hires the provider and the job completes (₱500 held for the three-day warranty). 2. Provider opens Wallet.
- **Expected:** a held / "releases on <date>" figure (GET /wallet already returns `in_escrow` 500 for the provider).   **Actual:** Available to withdraw ₱0.00, Pending ₱0.00, Total Earned ₱0.00, "No transactions yet". Nothing tells the provider ₱500 is on its way or when it unlocks; only the generic trust note mentions the warranty.
- **Evidence:** `evidence/E2E-119-provider-wallet-no-held.png`
- **Suspected cause:** `mobile/app/(provider)/screens/SPWalletScreen.tsx` renders `available`, `pending` and ledger rows but never `in_escrow` (`backend/src/wallet/wallet.service.ts:101` returns it). The client screen does show an IN ESCROW card (`HOWalletScreen.tsx:323-329`). S3 because the provider's main question after finishing a job ("did I get paid?") gets a misleading ₱0.00. Money-screen UI: a fix needs the user's OK (PLAN §6).

### E2E-120 — Provider Wallet: once there is money to withdraw, the Withdraw button is a blank white pill (no label, no icon)
- **Found:** 2026-10-11, slice 5.3, case 5.3-X01 (first seen in 5.3-14)   **Role:** provider
- **Category:** app-bug   **Severity:** S3   **Status:** Open
- **Steps:** 1. Provider has available > 0 (here ₱660.45 after a payout). 2. Open Wallet.
- **Expected:** a white pill with the dark "Withdraw" label and banknote icon.   **Actual:** the pill renders empty white in every screenshot (also 4 s later), although the view hierarchy contains the "Withdraw" text; at ₱0.00 the disabled variant renders its label correctly (5.2-19, 5.3-11). The only payout action on the screen is unlabeled.
- **Evidence:** `evidence/E2E-120-withdraw-blank.png`
- **Suspected cause:** not isolated. `mobile/app/(provider)/screens/SPWalletScreen.tsx:80-94` switches `withdrawBtn`/`withdrawBtnText` (`#13283c` on `#ffffff`, `:240-251`) on `canWithdraw`; the dark text and icon on the white fill are not drawn. Worth checking whether `Tap` (`mobile/src/components/ui/Tap.tsx`) or an animated opacity hides children when the style flips at runtime. Money-screen UI: a fix needs the user's OK (PLAN §6).

### E2E-121 — Maestro `inputText` intermittently doubles or scrambles the first letters of the login email ("mmaestro…")
- **Found:** 2026-10-11, slices 5.2–6.1 (most logins)   **Role:** both
- **Category:** harness   **Severity:** S4   **Status:** Workaround (`~/.taskbuddy-e2e/login.sh` types through adb and reads the field back; HAIKU-BRIEF §3)
- **Steps:** `_helpers/login_*.yaml` → `launch_fresh` → `tapOn input-email` → `inputText "maestro.client@taskbuddy.test"`.
- **Expected:** the field holds the address.   **Actual:** seen as "mmaestro.provider2@…", "mmaestro.clie" (stalled), "mamaeestro..client@…", so sign-in fails with "Invalid login credentials" / "email must be an email". It survived an emulator cold reboot.
- **Evidence:** `~/.taskbuddy-e2e/logs/dbl/` (bounded check 2026-10-12: 0/4 doublings typing the same text into Android Settings search and 0/4 into TaskBuddy's own email field with the same flow steps, so it is intermittent and not reproducible on demand).
- **Suspected cause:** not isolated (one bounded pass). The garbled forms (doubled and interleaved letters, a truncated stall) fit keystrokes landing while the screen re-renders just after a fresh launch. That is a Maestro-timing interaction; a person typing at human speed after the screen settles is not expected to hit it, and every Phase 1 login row passed. If a user report ever describes letters doubling in the login field, revisit `LoginScreen`'s controlled `TextInput` during the auth bootstrap.

### E2E-122 — Withdraw sheet: the amount field is auto-focused but the keyboard does not open
- **Found:** 2026-10-12, slice 6.2, case 6.2-01   **Role:** provider
- **Category:** ux   **Severity:** S4   **Status:** Open
- **Steps:** 1. Provider with available > 0 opens Wallet → Withdraw.
- **Expected:** the amount field is focused and the number keyboard opens, ready to type.   **Actual:** a caret shows in the amount field but no keyboard (IME `mInputShown=false` 2 s after opening); the user has to tap the field.
- **Evidence:** `evidence/E2E-122-withdraw-no-keyboard.png`
- **Suspected cause:** `mobile/src/components/WithdrawModal.tsx:112` relies on `autoFocus` inside a modal sheet; on Android the focus lands before the sheet's open animation finishes, so the IME is not shown. Usual fix: focus via a ref after the sheet's `onShow` (or a short `InteractionManager.runAfterInteractions`). The decimal-pad keyboard also shows a minus key (Gboard), but a negative amount is refused inline and by the API (6.2-03), so no separate finding.

### E2E-123 — Withdraw sheet: an amount with 3 decimals (100.555) reaches the API and shows raw validator text
- **Found:** 2026-10-12, slice 6.2, case 6.2-04   **Role:** provider (the client sheet shares the gap)
- **Category:** app-bug   **Severity:** S4   **Status:** Open
- **Steps:** 1. Wallet → Withdraw. 2. Amount `100.555`, any destination. 3. Tap Withdraw.
- **Expected:** the sheet refuses it inline ("Use at most 2 decimal places") with no request.   **Actual:** the request is sent and the sheet shows "amount must be a number conforming to the specified constraints"; no withdrawal is created (API 400), and the red line stays after the amount is corrected until the next submit.
- **Evidence:** `evidence/E2E-123-withdraw-raw-validator.png`
- **Suspected cause:** neither `mobile/src/components/WithdrawModal.tsx:64-66` nor the client sheet (`HOWalletScreen.tsx:114-120`) checks decimal places, while `RequestWithdrawalDto.amount` is `@IsNumber({ maxDecimalPlaces: 2 })` (`backend/src/wallet/dto/wallet.dto.ts:26`). Same family as E2E-009/015/025/038 (raw class-validator text reaching the UI). Fix: a 2-decimal rule in `walletRules.ts`, mirrored per CLAUDE.md "validation limits", and clear the API error on change.

### E2E-124 — A withdrawal the user cancelled is shown as "Failed" in Payout History
- **Found:** 2026-10-12, slice 6.2, case 6.2-08   **Role:** provider
- **Category:** ux   **Severity:** S4   **Status:** Open
- **Steps:** 1. Request a withdrawal. 2. Tap Cancel on its card. 3. Read Payout History.
- **Expected:** "Cancelled" (the user did it on purpose).   **Actual:** "Oct 12, 2026 · Failed" with "Review note: Cancelled by the account holder"; the word "Failed" suggests something went wrong with the money.
- **Evidence:** `evidence/E2E-124-cancelled-shows-failed.png`
- **Suspected cause:** the backend stores a user cancel as `status = 'failed'` with that review note (`backend/src/wallet/wallet.service.ts:193-210`), and `mobile/app/(provider)/screens/SPWalletScreen.tsx:172-174` capitalises the raw status. Fix in the app: show "Cancelled" when `status === 'failed'` and the note says the holder cancelled (or add a distinct status in a migration).

### E2E-125 — Provider Wallet keeps showing a settled/rejected withdrawal as pending, with a live Cancel button, until a tab switch
- **Found:** 2026-10-12, slice 6.2, case 6.2-10/11   **Role:** provider
- **Category:** ux   **Severity:** S4   **Status:** Open
- **Steps:** 1. Provider has two pending withdrawals on screen. 2. Admin rejects one and settles the other. 3. Provider returns to the Wallet tab.
- **Expected:** the screen reloads on focus (or offers pull-to-refresh) and shows the new states.   **Actual:** it still showed "Withdrawal Requests" ₱50.00 and ₱100.00, each with Cancel, "₱150.00 awaiting withdrawal", and the rejected row as Pending; only switching to Feed and back loaded the real state. Tapping Cancel there would hit an already-settled request (the API refuses it with "This withdrawal is already 'completed'", 6.2-11), so the user sees an error for something that already happened.
- **Evidence:** `~/.taskbuddy-e2e/logs/6.2/6.2-10-hier-reload.txt` (before/after reload)
- **Suspected cause:** `SPWalletScreen` loads once per mount; same family as E2E-075, E2E-091 and E2E-114 (no focus refetch / pull-to-refresh). Money is never wrong server-side.

### E2E-126 — Withdrawal notifications show raw amounts: "Your withdrawal of 50 was not processed…", "Your withdrawal of 100 has been sent"
- **Found:** 2026-10-12, slice 6.2, case 6.2-10/11   **Role:** provider (any user who withdraws)
- **Category:** backend-bug   **Severity:** S4   **Status:** Open
- **Expected:** "₱50.00" / "₱100.00", like every other money figure in the app.   **Actual:** "Withdrawal declined" — "Your withdrawal of 50 was not processed: <reason>. The amount is back in your available balance."; "Withdrawal sent" — "Your withdrawal of 100 has been sent. Reference: <ref>".
- **Evidence:** `~/.taskbuddy-e2e/logs/6.2/6.2-10-notif.png`, `6.2-11.log`
- **Suspected cause:** `backend/src/wallet/wallet.service.ts:253` and `:280` interpolate the numeric amount directly. Fix: format as `₱${amount.toFixed(2)}` with thousands separators (backend copy; log only).

### E2E-127 — The API accepts a withdrawal whose destination is only spaces
- **Found:** 2026-10-12, slice 6.2, case 6.2-19   **Role:** any user (API)
- **Category:** backend-bug   **Severity:** S4   **Status:** Open
- **Steps:** `POST /wallet/withdrawals` `{"amount":1,"destination":"   "}`.
- **Expected:** 400 (an admin settles by reading the destination, so a blank one is unpayable).   **Actual:** 201, a pending request with `withdrawal_destination` = three spaces. The app blocks it (Withdraw stays disabled for a whitespace destination, 6.2-06), so only API callers reach it.
- **Evidence:** `~/.taskbuddy-e2e/logs/6.2/6.2-19.log`
- **Suspected cause:** `RequestWithdrawalDto.destination` is `@IsString() @Length(1, 200)` with no trim or non-space rule (`backend/src/wallet/dto/wallet.dto.ts:36-37`), unlike the settle reference which has one (`:145-146`); `wallet.service.ts:139` stores it as sent. Same family as E2E-113 (decline reason). Fix: `@Matches(/\S/)` or a trim transform.

### E2E-128 — Client Withdraw sheet lacks the provider sheet's checks: no over-available message, no 200-character destination cap (raw API text), raw lowercase status
- **Found:** 2026-10-12, slice 6.2, cases 6.2-15, 6.2-06 (HO half)   **Role:** client
- **Category:** app-bug   **Severity:** S4   **Status:** Open
- **Steps:** Client Wallet → Withdraw. (a) Amount 48723.01 (₱0.01 over available). (b) A 201-character destination, tap Withdraw. (c) Read the RECENT WITHDRAWALS card.
- **Expected:** the same behaviour as the provider sheet (WithdrawModal): "That's more than your ₱48,723.00 available.", the destination capped at 200, title-case statuses.   **Actual:** (a) Withdraw just greys out with no message; (b) the field takes 201 characters and the API's raw "destination must be shorter than or equal to 200 characters" appears (no request created); (c) statuses read "pending" / "failed" in lowercase.
- **Evidence:** `evidence/E2E-128-client-withdraw-raw.png`
- **Suspected cause:** the client sheet is a separate implementation in `mobile/app/(homeowner)/screens/HOWalletScreen.tsx:536-590` (no `maxLength`, no over-available message; status printed raw at `:344`), while the provider uses `mobile/src/components/WithdrawModal.tsx`. Fix: reuse `WithdrawModal` (or `walletRules.ts`) on the client side. Money-screen UI: fix needs the user's OK (PLAN §6).

### E2E-129 — Client Wallet's big "Available Balance" figure shows the balance, not what's available, while a withdrawal is pending
- **Found:** 2026-10-12, slice 6.2, case 6.2-15   **Role:** client
- **Category:** ux   **Severity:** S4   **Status:** Open
- **Steps:** Client requests a ₱300 withdrawal (pending).
- **Expected:** the headline labelled "Available Balance" shows ₱48,423.00 (what can actually be spent), or the label says "Balance".   **Actual:** "Available Balance ₱48,723.00" with a small sub-line "₱48,423.00 available to withdraw". The headline overstates spendable money by the pending amount (and by any escrow hold the client pays from).
- **Evidence:** `~/.taskbuddy-e2e/scratch/6.2/6.2-15-presubmit.png` and `logs/6.2/6.2-15.log`
- **Suspected cause:** `mobile/app/(homeowner)/screens/HOWalletScreen.tsx:291-294` renders `balance` under the "Available Balance" label (noted as latent in 6.1). Fix: show `available` there, or rename the label. Money-screen UI: fix needs the user's OK.

### E2E-130 — Add Money: 3-decimal and over-₱100,000 amounts reach the API and show raw validator text, which then sticks
- **Found:** 2026-10-12, slice 6.3, cases 6.3-08, 6.3-09, 6.3-10 (stale line seen in 6.3-11/12)   **Role:** client
- **Category:** app-bug   **Severity:** S4   **Status:** Open
- **Steps:** Client Wallet → Add Money → type `50.555` (or `100001`, `99999999`) → Continue.
- **Expected:** the sheet refuses it inline ("Use at most 2 decimal places", "The most you can add at once is ₱100,000") with Continue disabled.   **Actual:** Continue is enabled; the API answers 400 and the sheet shows "amount must be a number conforming to the specified constraints" / "amount must not be greater than 100000". The red line stays after the amount is corrected (under a valid 100000, under "abc") until the sheet closes. No checkout session, no money.
- **Evidence:** `evidence/E2E-130-addmoney-raw-validator.png`
- **Suspected cause:** `mobile/app/(homeowner)/screens/HOWalletScreen.tsx:92-94` checks only the ₱50 floor (`MIN_TOPUP_PHP`); the DTO also has 2 decimals and `@Max(100000)` (`backend/src/payments` checkout DTO :20-27). Mirror both on the client (CLAUDE.md "validation limits") and clear the error on change. Same family as E2E-123 (withdraw) and E2E-009 (raw validator text). Money-screen UI: fix needs the user's OK.

### E2E-131 — Provider "Set up payouts" fails: the Stripe sandbox account has not enabled Connect
- **Found:** 2026-10-12, slice 6.3, cases 6.3-25, 6.3-27   **Role:** provider
- **Category:** env   **Severity:** S3   **Status:** Open (needs a Stripe dashboard step by the user)
- **Steps:** Provider → Profile → Payouts → "Set up payouts".
- **Expected:** Stripe's hosted Connect onboarding opens (sandbox) so the provider can link a bank.   **Actual:** no Stripe page; red line "Card payout setup is unavailable for this platform. Contact TaskBuddy support."; `GET /payments/connect` stays `not_started`.
- **Evidence:** `evidence/E2E-131-payouts-connect-unavailable.png`
- **Suspected cause:** Stripe rejects the Express account create with "You can only create new accounts if you've signed up for Connect" — the app maps exactly that message to this copy (`mobile/app/(provider)/screens/SPPayoutsScreen.tsx:130-135`). The platform's Stripe **sandbox** account needs Connect enabled (Stripe Dashboard → Connect → Get started), no code change. Impact for UAT: card-funded job payouts cannot be transferred to provider banks (they still land in the provider's TaskBuddy wallet, and the manual wallet withdrawal works, 6.2). Wallet top-ups via Stripe Checkout work (6.3-16).

## Found & solved

### E2E-004 — `auth_logout_provider.yaml` couldn't find "Log Out" after the profile redesign
- **Found:** 2026-10-08, slice 0.3, case 0.3-B03   **Role:** provider
- **Category:** harness
- **Severity:** S4 low/cosmetic
- **Status:** Solved (the slice 0.3 commit)
- **Steps:** 1. Run the flow. 2. After tapping the avatar it taps "Log Out".
- **Expected:** the row is reachable.   **Actual:** the redesigned provider profile (Account Info card plus a menu list) pushes Log Out below the fold, so `Tap on "Log Out"` failed with "Element not found".
- **Evidence:** screenshot `~/.taskbuddy-e2e/logs/tmp-a1.png` (not committed)
- **Solution:** added `scrollUntilVisible: "Log Out"` before the tap. Re-run on build `fbe63d63`: passes.
