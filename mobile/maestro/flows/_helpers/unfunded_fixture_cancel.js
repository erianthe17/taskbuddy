// Cancels the unfunded flow's job (open job, nothing held); runs from onFlowComplete.
var API = 'https://taskbuddy-kpek.onrender.com';
if (output.UF_JOB && output.UF_CLIENT_TOKEN) {
  http.post(API + '/jobs/' + output.UF_JOB + '/cancel', {
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + output.UF_CLIENT_TOKEN }, body: '{}',
  });
}
