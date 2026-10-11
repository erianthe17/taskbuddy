// Runs from onFlowComplete, after a pass or a failure, and never throws. If the flow's job still
// exists: an open job (never hired, for example when the accept step failed) is cancelled by the
// client; a hired booking is declined by the provider, which refunds the client. A cancelled job is
// left alone, and any other status is left for the orchestrator to see in GET /jobs/mine.
var API = 'https://taskbuddy-kpek.onrender.com';
try {
  if (output.DF_JOB && output.DF_CLIENT_TOKEN) {
    var jr = http.get(API + '/jobs/' + output.DF_JOB, { headers: { Authorization: 'Bearer ' + output.DF_CLIENT_TOKEN } });
    if (jr.ok) {
      var jb = json(jr.body);
      var status = (jb.job || jb).status;
      if (status === 'open' || status === 'recommending') {
        http.post(API + '/jobs/' + output.DF_JOB + '/cancel', {
          headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + output.DF_CLIENT_TOKEN },
          body: '{}',
        });
      } else if ((status === 'assigned' || status === 'confirmed') && output.DF_P2_TOKEN) {
        http.post(API + '/jobs/' + output.DF_JOB + '/decline', {
          headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + output.DF_P2_TOKEN },
          body: JSON.stringify({ reason: 'Maestro flow cleanup' }),
        });
      }
    }
  }
} catch (e) {
  // Cleanup must never fail the flow. The orchestrator confirms the outcome with GET /jobs/mine.
}
