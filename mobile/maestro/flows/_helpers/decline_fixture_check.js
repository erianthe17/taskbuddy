// Checks the decline flow's end state after the in-app decline. Input (flow env/outputs): DF_JOB,
// DF_CLIENT_TOKEN, DF_AVAIL_BEFORE. Fails the flow unless: the job is cancelled; c1's available
// balance is back to DF_AVAIL_BEFORE (the ₱300 hold came back exactly once); and c1 has exactly one
// "Refund — provider declined" credit of ₱300 on this job, created in the last 10 minutes.
var API = 'https://taskbuddy-kpek.onrender.com';
var auth = { headers: { Authorization: 'Bearer ' + output.DF_CLIENT_TOKEN } };

var jr = http.get(API + '/jobs/' + output.DF_JOB, auth);
if (!jr.ok) throw new Error('GET /jobs/<DF_JOB> failed: HTTP ' + jr.status);
var jb = json(jr.body);
var job = jb.job || jb;
if (job.status !== 'cancelled') throw new Error('job status is ' + job.status + ' (expected cancelled)');

var w = http.get(API + '/wallet', auth);
if (!w.ok) throw new Error('GET /wallet failed: HTTP ' + w.status);
var wj = json(w.body);
var summary = (wj.summary && typeof wj.summary.available === 'number') ? wj.summary : wj;
if (Number(summary.available) !== Number(output.DF_AVAIL_BEFORE)) {
  throw new Error('c1 available is ' + summary.available + ' (expected ' + output.DF_AVAIL_BEFORE + ' before the hold)');
}

var cutoff = Date.now() - 10 * 60 * 1000;
var txs = wj.transactions || [];
var refunds = 0;
for (var i = 0; i < txs.length; i++) {
  var t = txs[i];
  if (typeof t.title !== 'string' || t.title.indexOf('Refund — provider declined') !== 0) continue;
  if (t.job_id !== output.DF_JOB) continue;
  if (Number(t.amount) !== 300) continue;
  // Trim microsecond fractions to milliseconds so the date parses the same in every JS engine.
  var ts = Date.parse(String(t.created_at).replace(/\.(\d{3})\d+/, '.$1'));
  if (isNaN(ts)) throw new Error('unparseable created_at: ' + t.created_at);
  if (ts < cutoff) continue;
  refunds++;
}
if (refunds !== 1) throw new Error('expected exactly 1 "Refund — provider declined" credit of 300 on the job, found ' + refunds);
