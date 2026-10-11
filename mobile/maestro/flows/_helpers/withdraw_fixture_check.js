// Checks the withdrawal flow's end state after the in-app request and cancel. Runs at the end of
// p6_withdraw_cancel_provider (slice 6.2). Inputs (flow outputs): WD_TOKEN, WD_COUNT_BEFORE,
// WD_AVAIL_BEFORE, set by withdraw_fixture_pre.js. Fails the flow unless:
//   - GET /wallet/withdrawals has exactly WD_COUNT_BEFORE + 1 rows (the one row this flow filed);
//   - the newest row (rows[0], newest first) is amount 10, status 'failed', review note
//     'Cancelled by the account holder' (the holder cancelled it; an admin reject would say otherwise);
//   - GET /wallet: available is back to WD_AVAIL_BEFORE and pending_withdrawals is 0 (nets to zero).
// Error messages carry the figures and statuses only. No token is printed.
var API = 'https://taskbuddy-kpek.onrender.com';
var auth = { headers: { Authorization: 'Bearer ' + output.WD_TOKEN } };

if (!output.WD_TOKEN) throw new Error('no WD_TOKEN: the pre helper did not complete');

var wd = http.get(API + '/wallet/withdrawals', auth);
if (!wd.ok) throw new Error('GET /wallet/withdrawals failed: HTTP ' + wd.status);
var rows = json(wd.body);
if (!Array.isArray(rows)) throw new Error('GET /wallet/withdrawals did not return an array');

var before = Number(output.WD_COUNT_BEFORE);
if (rows.length !== before + 1) {
  throw new Error('withdrawal rows: ' + rows.length + ' (expected ' + (before + 1) + ': the one row this flow filed)');
}

var top = rows[0];
if (Number(top.amount) !== 10) {
  throw new Error('newest withdrawal amount is ' + top.amount + ' (expected 10)');
}
if (top.status !== 'failed') {
  throw new Error("newest withdrawal status is '" + top.status + "' (expected 'failed', cancelled by the holder)");
}
if (top.review_note !== 'Cancelled by the account holder') {
  throw new Error('newest withdrawal review_note is "' + top.review_note + '" (expected "Cancelled by the account holder")');
}

var w = http.get(API + '/wallet', auth);
if (!w.ok) throw new Error('GET /wallet failed: HTTP ' + w.status);
var wj = json(w.body);
if (Number(wj.available) !== Number(output.WD_AVAIL_BEFORE)) {
  throw new Error('available is ' + wj.available + ' (expected ' + output.WD_AVAIL_BEFORE + ': the request should net to zero)');
}
if (Number(wj.pending_withdrawals) !== 0) {
  throw new Error('pending_withdrawals is ' + wj.pending_withdrawals + ' (expected 0)');
}
