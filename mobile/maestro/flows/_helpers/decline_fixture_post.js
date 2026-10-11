// Sets up the decline flow's booking. maestro.client@ (c1) posts a ₱300 Plumbing job, maestro.provider2@
// (p2) applies, and c1 accepts, which holds ₱300 from c1's wallet. Input (flow env): RUN.
// Outputs: output.DF_JOB, output.DF_CLIENT_TOKEN, output.DF_P2_TOKEN, output.DF_AVAIL_BEFORE (c1's
// available balance before the hold). Both logins and the wallet read come before the job is posted,
// so a failed login creates nothing. decline_fixture_cleanup.js handles whatever is left over.
var API = 'https://taskbuddy-kpek.onrender.com';

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

function authJson(token) {
  return { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token };
}

output.DF_CLIENT_TOKEN = login('maestro.client@taskbuddy.test');
output.DF_P2_TOKEN = login('maestro.provider2@taskbuddy.test');

var w = http.get(API + '/wallet', { headers: { Authorization: 'Bearer ' + output.DF_CLIENT_TOKEN } });
if (!w.ok) throw new Error('GET /wallet failed: HTTP ' + w.status);
var wj = json(w.body);
var summary = (wj.summary && typeof wj.summary.available === 'number') ? wj.summary : wj;
if (typeof summary.available !== 'number') throw new Error('wallet response has no numeric available figure');
output.DF_AVAIL_BEFORE = summary.available;

var jr = http.post(API + '/jobs', {
  headers: authJson(output.DF_CLIENT_TOKEN),
  body: JSON.stringify({
    category_id: 1, title: 'Maestro decline ' + RUN, urgency: 'flexible', budget: 300, tasks: ['Fix toilet'],
    description: 'Maestro regression decline fixture, declined by the flow.',
    address: '0.95 km point, Lipa, Batangas, Philippines', latitude: 14.0065, longitude: 121.1685,
  }),
});
if (!jr.ok) throw new Error('post job failed: HTTP ' + jr.status + ' ' + jr.body);
var jobBody = json(jr.body);
output.DF_JOB = (jobBody.job || jobBody).id;
if (!output.DF_JOB) throw new Error('post job returned no id');

var ar = http.post(API + '/jobs/' + output.DF_JOB + '/applications', {
  headers: authJson(output.DF_P2_TOKEN), body: '{}',
});
if (!ar.ok) throw new Error('apply failed: HTTP ' + ar.status + ' ' + ar.body);
var appBody = json(ar.body);
var appId = (appBody.application || appBody).id;
if (!appId) throw new Error('apply returned no application id');

var acc = http.post(API + '/applications/' + appId + '/accept', {
  headers: authJson(output.DF_CLIENT_TOKEN), body: '{}',
});
if (!acc.ok) throw new Error('accept failed: HTTP ' + acc.status + ' ' + acc.body);
