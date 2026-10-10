// Posts three maestro.client@ jobs 0.6 km from maestro.provider@'s profile point (Lipa) for the
// provider feed flow: Plumbing normal + Plumbing urgent (listed) and Cleaning (must stay hidden,
// approved-categories gate). Input (flow env): RUN. Outputs: output.FEED_TOKEN, output.FEED_IDS.
var API = 'https://taskbuddy-kpek.onrender.com';
var login = http.post(API + '/auth/login', {
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'maestro.client@taskbuddy.test', password: 'TestPass123!' }),
});
if (!login.ok) throw new Error('client login failed: HTTP ' + login.status);
var lj = json(login.body);
var tok = lj.access_token || (lj.session && lj.session.access_token);
output.FEED_TOKEN = tok;
output.FEED_IDS = '';
function post(cat, urgency, title, task) {
  var r = http.post(API + '/jobs', {
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + tok },
    body: JSON.stringify({
      category_id: cat, title: title, urgency: urgency, budget: 480, tasks: [task],
      description: 'Maestro regression feed fixture, cancelled by the flow.',
      address: '0.6 km point, Lipa, Batangas, Philippines', latitude: 14.0030, longitude: 121.1690,
    }),
  });
  if (!r.ok) throw new Error('post job failed: HTTP ' + r.status + ' ' + r.body);
  var j = json(r.body);
  output.FEED_IDS = output.FEED_IDS + (j.job || j).id + ',';
}
post(1, 'normal', 'Maestro feed normal ' + RUN, 'Fix toilet');
post(1, 'urgent', 'Maestro feed urgent ' + RUN, 'Unclog drain');
post(2, 'normal', 'Maestro feed cleaning ' + RUN, 'Deep clean kitchen');
