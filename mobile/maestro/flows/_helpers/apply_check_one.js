// Fails the flow unless maestro.provider@ has exactly one pending application on output.APPLY_JOB.
var API = 'https://taskbuddy-kpek.onrender.com';
var r = http.get(API + '/applications/mine', { headers: { Authorization: 'Bearer ' + output.APPLY_PROVIDER_TOKEN } });
if (!r.ok) throw new Error('applications/mine failed: HTTP ' + r.status);
var apps = json(r.body), n = 0;
for (var i = 0; i < apps.length; i++) {
  if (apps[i].jobs && apps[i].jobs.id === output.APPLY_JOB) {
    n++;
    if (apps[i].status !== 'pending') throw new Error('application status ' + apps[i].status);
    output.APPLY_APP = apps[i].id;
  }
}
if (n !== 1) throw new Error('expected exactly 1 application on the job, found ' + n);
