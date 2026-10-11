// Runs before the device starts, for p6_withdraw_cancel_provider (slice 6.2, rows 6.2-07 and 6.2-08).
// Logs in maestro.provider2@ (p2) and reads GET /wallet and GET /wallet/withdrawals. It fails unless p2
// has at least 10.00 available and no pending withdrawal, so the flow starts from a clean baseline.
// Outputs, set only after every check passes (so a failed pre leaves no token for the cleanup):
//   output.WD_TOKEN         p2's access token, read by the check and cleanup helpers. Never logged.
//   output.WD_AVAIL_BEFORE  available balance before the flow (number).
//   output.WD_COUNT_BEFORE  number of withdrawal rows before the flow (number). GET /wallet/withdrawals
//                           returns a bare array, newest first, so the flow's own row is rows[0] afterwards.
//   output.WD_AVAIL_RE      regex-escaped copy of the peso text of available, for the hero figure match.
// Only POST /auth/login and GET calls are made. Nothing is filed, so no money moves here.
var API = 'https://taskbuddy-kpek.onrender.com';
var PESO_SIGN = '₱';

function login(email) {
  var r = http.post(API + '/auth/login', {
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email, password: 'TestPass123!' }),
  });
  if (!r.ok) throw new Error('login failed for ' + email + ': HTTP ' + r.status);
  var j = json(r.body);
  var token = j.access_token || (j.session && j.session.access_token);
  if (!token) throw new Error('no access token returned for ' + email);
  return token;
}

// Same output as format.ts peso(): peso sign + thousands separators + two decimals.
function peso(amount) {
  var n = Number(amount || 0);
  var parts = Math.abs(n).toFixed(2).split('.');
  var grouped = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return PESO_SIGN + (n < 0 ? '-' : '') + grouped + '.' + parts[1];
}

// Escapes regex metacharacters so a plain figure matches itself exactly.
function reEsc(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

var token = login('maestro.provider2@taskbuddy.test');
var auth = { headers: { Authorization: 'Bearer ' + token } };

var w = http.get(API + '/wallet', auth);
if (!w.ok) throw new Error('GET /wallet failed: HTTP ' + w.status);
var wj = json(w.body);
var available = Number(wj.available);
var pending = Number(wj.pending_withdrawals);
if (!isFinite(available)) throw new Error('wallet response has no numeric available');
if (!isFinite(pending)) throw new Error('wallet response has no numeric pending_withdrawals');
if (available < 10) {
  throw new Error('p2 available is ' + available + ' (need at least 10 to file the 10.00 request)');
}
if (pending !== 0) {
  throw new Error('p2 pending_withdrawals is ' + pending + ' before the flow (expected 0)');
}

var wd = http.get(API + '/wallet/withdrawals', auth);
if (!wd.ok) throw new Error('GET /wallet/withdrawals failed: HTTP ' + wd.status);
var rows = json(wd.body);
if (!Array.isArray(rows)) throw new Error('GET /wallet/withdrawals did not return an array');

output.WD_TOKEN = token;
output.WD_AVAIL_BEFORE = available;
output.WD_COUNT_BEFORE = rows.length;
output.WD_AVAIL_RE = reEsc(peso(available));
