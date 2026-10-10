// Posts a maestro.client2@ (unfunded) Plumbing job and has maestro.provider2@ apply to it, for the
// unfunded hire-sheet flow. Input (flow env): RUN. Outputs: output.UF_CLIENT_TOKEN, output.UF_JOB.
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
output.UF_CLIENT_TOKEN = login('maestro.client2@taskbuddy.test');
var providerToken = login('maestro.provider2@taskbuddy.test');
var r = http.post(API + '/jobs', {
  headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + output.UF_CLIENT_TOKEN },
  body: JSON.stringify({
    category_id: 1, title: 'Maestro unfunded ' + RUN, urgency: 'flexible', budget: 350, tasks: ['Fix toilet'],
    description: 'Maestro regression unfunded hire fixture, cancelled by the flow.',
    address: '0.75 km point, Lipa, Batangas, Philippines', latitude: 14.0045, longitude: 121.1685,
  }),
});
if (!r.ok) throw new Error('post job failed: HTTP ' + r.status + ' ' + r.body);
var j = json(r.body);
output.UF_JOB = (j.job || j).id;
var a = http.post(API + '/jobs/' + output.UF_JOB + '/applications', {
  headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + providerToken }, body: '{}',
});
if (!a.ok) throw new Error('apply failed: HTTP ' + a.status + ' ' + a.body);
