// Posts one maestro.client@ Plumbing job 0.6 km from maestro.provider@'s profile point (Lipa) for
// the apply flow. Input (flow env): RUN. Outputs: output.APPLY_CLIENT_TOKEN, output.APPLY_JOB.
var API = 'https://taskbuddy-kpek.onrender.com';
function login(email) {
  var r = http.post(API + '/auth/login', {
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email, password: 'TestPass123!' }),
  });
  if (!r.ok) throw new Error('login failed for ' + email + ': HTTP ' + r.status);
  var j = json(r.body);
  return j.access_token || (j.session && j.session.access_token);
}
output.APPLY_CLIENT_TOKEN = login('maestro.client@taskbuddy.test');
output.APPLY_PROVIDER_TOKEN = login('maestro.provider@taskbuddy.test');
var r = http.post(API + '/jobs', {
  headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + output.APPLY_CLIENT_TOKEN },
  body: JSON.stringify({
    category_id: 1, title: 'Maestro apply ' + RUN, urgency: 'flexible', budget: 450, tasks: ['Fix toilet'],
    description: 'Maestro regression apply fixture, withdrawn and cancelled by the flow.',
    address: '0.6 km point, Lipa, Batangas, Philippines', latitude: 14.0030, longitude: 121.1690,
  }),
});
if (!r.ok) throw new Error('post job failed: HTTP ' + r.status + ' ' + r.body);
var j = json(r.body);
output.APPLY_JOB = (j.job || j).id;
