// Cancels every job feed_fixture_post.js created (runs from onFlowComplete, so also after a failure).
var API = 'https://taskbuddy-kpek.onrender.com';
var ids = (output.FEED_IDS || '').split(',');
for (var i = 0; i < ids.length; i++) {
  if (!ids[i]) continue;
  http.post(API + '/jobs/' + ids[i] + '/cancel', {
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + output.FEED_TOKEN },
    body: '{}',
  });
}
