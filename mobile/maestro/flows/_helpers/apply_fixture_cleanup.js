// Withdraws the provider's application on the flow's job (looked up here, so it also runs when the
// flow failed before apply_check_one.js) and cancels the job; runs from onFlowComplete.
var API = 'https://taskbuddy-kpek.onrender.com';
if (output.APPLY_JOB && output.APPLY_PROVIDER_TOKEN) {
  var r = http.get(API + '/applications/mine', { headers: { Authorization: 'Bearer ' + output.APPLY_PROVIDER_TOKEN } });
  if (r.ok) {
    var apps = json(r.body);
    for (var i = 0; i < apps.length; i++) {
      if (apps[i].jobs && apps[i].jobs.id === output.APPLY_JOB && apps[i].status === 'pending') {
        http.post(API + '/applications/' + apps[i].id + '/withdraw', {
          headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + output.APPLY_PROVIDER_TOKEN }, body: '{}',
        });
      }
    }
  }
}
if (output.APPLY_JOB && output.APPLY_CLIENT_TOKEN) {
  http.post(API + '/jobs/' + output.APPLY_JOB + '/cancel', {
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + output.APPLY_CLIENT_TOKEN }, body: '{}',
  });
}
