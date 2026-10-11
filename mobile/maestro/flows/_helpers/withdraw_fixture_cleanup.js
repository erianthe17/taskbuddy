// Runs from onFlowComplete, after a pass or a failure, and never throws. If this flow filed a withdrawal
// and it is still pending (the flow stopped before its in-app cancel), the holder cancels it here.
// GET /wallet/withdrawals is newest first, so the first (rows.length - WD_COUNT_BEFORE) rows are the ones
// this flow added. Only those rows are candidates, and only a row still 'pending' is cancelled. Completed
// and failed rows are left alone. If WD_TOKEN or WD_COUNT_BEFORE is missing (the pre helper threw), nothing
// is done. The orchestrator confirms the end state with GET /wallet.
var API = 'https://taskbuddy-kpek.onrender.com';
try {
  var before = Number(output.WD_COUNT_BEFORE);
  if (output.WD_TOKEN && isFinite(before)) {
    var auth = { headers: { Authorization: 'Bearer ' + output.WD_TOKEN } };
    var wd = http.get(API + '/wallet/withdrawals', auth);
    if (wd.ok) {
      var rows = json(wd.body);
      if (Array.isArray(rows)) {
        var added = rows.length - before;
        for (var i = 0; i < added && i < rows.length; i++) {
          if (rows[i].status === 'pending') {
            http.post(API + '/wallet/withdrawals/' + rows[i].id + '/cancel', {
              headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + output.WD_TOKEN },
              body: '{}',
            });
          }
        }
      }
    }
  }
} catch (e) {
  // Cleanup must never fail the flow. The orchestrator confirms the outcome with GET /wallet.
}
